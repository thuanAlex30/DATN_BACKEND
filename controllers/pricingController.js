const payosService = require('../services/payosService');
const orderService = require('../services/orderService');
const tenantService = require('../services/tenantService');
const TenantRepository = require('../repository/TenantRepository');
const userService = require('../services/userService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const contractService = require('../services/contractService');
const { createResponse } = require('../utils/response');

class PricingController {
  /**
   * Helper function: Xử lý business logic khi đơn hàng đã được thanh toán
   * Được dùng bởi webhook handler
   * @private
   */
  static async _processPaidOrder(order) {
    let tenant;
    let user;
    let password = null;
    let isNewCustomer = false;

    // Xử lý theo 2 trường hợp
    // Kiểm tra xem user đã có tenant chưa (không chỉ dựa vào order.tenantId)
    const User = require('../models/user');
    let existingUser = null;
    let existingTenant = null;
    
    // Ưu tiên 1: Kiểm tra theo email của contact person (đáng tin cậy hơn order.userId)
    const contactEmail = order.contactPerson?.email;
    console.log(`🔍 [ProcessPaidOrder] Checking for existing user with email: ${contactEmail}`);
    
    if (contactEmail) {
      existingUser = await User.findOne({ 
        email: contactEmail,
        is_active: true 
      }).populate('tenant_id');
      
      if (existingUser) {
        console.log(`✅ [ProcessPaidOrder] Found existing user: ${existingUser._id}, email: ${existingUser.email}`);
        if (existingUser.tenant_id) {
          existingTenant = await TenantRepository.findById(existingUser.tenant_id._id || existingUser.tenant_id);
          if (existingTenant) {
            console.log(`✅ [ProcessPaidOrder] Found existing tenant: ${existingTenant._id}, name: ${existingTenant.name}`);
          } else {
            console.log(`⚠️ [ProcessPaidOrder] User has tenant_id but tenant not found in database`);
          }
        } else {
          console.log(`ℹ️ [ProcessPaidOrder] User exists but has no tenant_id`);
        }
      } else {
        console.log(`❌ [ProcessPaidOrder] No user found with email: ${contactEmail}`);
      }
    }
    
    // Ưu tiên 2: Nếu không tìm thấy theo email, kiểm tra theo order.userId (có thể đã bị xóa)
    // ⚠️ QUAN TRỌNG: Chỉ sử dụng user từ order.userId nếu email khớp với email trong order
    if (!existingUser && order.userId && contactEmail) {
      console.log(`🔍 [ProcessPaidOrder] Checking for existing user with order.userId: ${order.userId}`);
      const userByOrderId = await User.findById(order.userId).populate('tenant_id');
      if (userByOrderId) {
        // Kiểm tra email có khớp không
        if (userByOrderId.email && userByOrderId.email.toLowerCase() === contactEmail.toLowerCase()) {
          console.log(`✅ [ProcessPaidOrder] Found existing user by order.userId: ${userByOrderId._id}, email matches: ${userByOrderId.email}`);
          existingUser = userByOrderId;
          if (existingUser.tenant_id) {
            existingTenant = await TenantRepository.findById(existingUser.tenant_id._id || existingUser.tenant_id);
            if (existingTenant) {
              console.log(`✅ [ProcessPaidOrder] Found existing tenant by order.userId: ${existingTenant._id}`);
            }
          }
        } else {
          console.log(`⚠️ [ProcessPaidOrder] User found by order.userId but email mismatch: ${userByOrderId.email} !== ${contactEmail} - Ignoring this user`);
          // Không sử dụng user này vì email không khớp - coi như khách hàng mới
        }
      } else {
        console.log(`❌ [ProcessPaidOrder] No user found with order.userId: ${order.userId}`);
      }
    }
    
    // Ưu tiên 3: Nếu order có tenantId, kiểm tra tenant có tồn tại không (có thể đã bị xóa)
    // ⚠️ QUAN TRỌNG: Chỉ sử dụng tenant nếu có user với email khớp
    if (order.tenantId && !existingTenant && contactEmail) {
      console.log(`🔍 [ProcessPaidOrder] Checking for existing tenant with order.tenantId: ${order.tenantId}`);
      const tenantByOrderId = await TenantRepository.findById(order.tenantId);
      if (tenantByOrderId) {
        console.log(`✅ [ProcessPaidOrder] Found tenant by order.tenantId: ${tenantByOrderId._id}`);
        // Tìm user với email khớp trong tenant này
        if (!existingUser) {
          existingUser = await User.findOne({ 
            email: contactEmail,
            is_active: true,
            tenant_id: tenantByOrderId._id  // ⭐ Chỉ tìm user trong tenant này
          }).populate('tenant_id');
          if (existingUser) {
            console.log(`✅ [ProcessPaidOrder] Found existing user by email in tenant: ${existingUser._id}`);
            existingTenant = tenantByOrderId;
          } else {
            console.log(`⚠️ [ProcessPaidOrder] Tenant found but no user with matching email - Ignoring this tenant`);
            // Không sử dụng tenant này vì không có user với email khớp
          }
        } else {
          // Đã có user, kiểm tra user có thuộc tenant này không
          if (existingUser.tenant_id && 
              (existingUser.tenant_id._id?.toString() === tenantByOrderId._id.toString() || 
               existingUser.tenant_id.toString() === tenantByOrderId._id.toString())) {
            existingTenant = tenantByOrderId;
            console.log(`✅ [ProcessPaidOrder] User belongs to this tenant`);
          } else {
            console.log(`⚠️ [ProcessPaidOrder] Tenant found but user belongs to different tenant - Ignoring this tenant`);
          }
        }
      } else {
        console.log(`❌ [ProcessPaidOrder] No tenant found with order.tenantId: ${order.tenantId}`);
      }
    }
    
    // Quyết định xem đây là khách hàng mới hay cũ
    if (existingUser && existingTenant) {
      console.log(`📌 [ProcessPaidOrder] Decision: EXISTING CUSTOMER (has user + tenant) - Will send renewal email`);
      // Trường hợp 2: Khách hàng đã có tài khoản VÀ đã có tenant - nâng cấp/gia hạn gói
      tenant = existingTenant;
      user = existingUser;

      // Cập nhật subscription cho tenant
      await tenantService.updateTenantSubscription(tenant._id, order.planType);
    } else if (existingUser && !existingTenant) {
      // Trường hợp 3: User đã tồn tại nhưng chưa có tenant - tạo tenant mới và gán user vào tenant
      console.log(`📌 [ProcessPaidOrder] Decision: NEW CUSTOMER (user exists but no tenant) - Will send account credentials + payment confirmation`);
      isNewCustomer = true; // Coi như khách hàng mới vì chưa có tenant

      // Tạo Tenant mới
      tenant = await tenantService.createTenant({
        name: order.companyInfo.name,
        address: order.companyInfo.address,
        phone: order.companyInfo.phone,
        email: order.companyInfo.email,
        planType: order.planType,
        orderId: order._id
      });

      // Gán user hiện có vào tenant mới
      user = existingUser;
      user.tenant_id = tenant._id;
      await user.save();

      // Không reset password - user đã có mật khẩu rồi
      // Chỉ gửi email thông báo họ đã được gán vào tenant mới
    } else {
      // Trường hợp 1: Khách hàng hoàn toàn mới - tạo tenant và user mới
      console.log(`📌 [ProcessPaidOrder] Decision: NEW CUSTOMER (no user found) - Will send account credentials + payment confirmation`);
      isNewCustomer = true;

      // Tạo Tenant
      tenant = await tenantService.createTenant({
        name: order.companyInfo.name,
        address: order.companyInfo.address,
        phone: order.companyInfo.phone,
        email: order.companyInfo.email,
        planType: order.planType,
        orderId: order._id
      });


      password = userService.generateRandomPassword();
      console.log(`🔍 [ProcessPaidOrder] Creating user with email: ${order.contactPerson.email}`);
      const userResult = await userService.createUserWithRole({
        username: order.contactPerson.email.split('@')[0],
        email: order.contactPerson.email,
        full_name: order.contactPerson.name,
        phone: order.contactPerson.phone,
        role_code: 'company_admin',
        tenant_id: tenant._id,
        password: password
      });

      console.log(` [ProcessPaidOrder] userResult from createUserWithRole:`, {
        success: userResult.success,
        message: userResult.message,
        hasData: !!userResult.data,
        dataKeys: userResult.data ? Object.keys(userResult.data) : null
      });

      if (!userResult.success) {
        console.error(` [ProcessPaidOrder] User creation failed: ${userResult.message}`);
        throw new Error(userResult.message || 'Failed to create user');
      }

      // Query lại từ database để lấy user object đầy đủ
      const userId = userResult.data?.id || userResult.data?._id;
      console.log(` [ProcessPaidOrder] Extracted userId: ${userId}`);
      if (!userId) {
        console.error(` [ProcessPaidOrder] No userId found in userResult.data:`, userResult.data);
        throw new Error('Failed to extract user ID from creation result');
      }
      
      user = await User.findById(userId);
      if (!user) {
        console.error(` [ProcessPaidOrder] User not found in database with id: ${userId}`);
        throw new Error('Failed to retrieve created user');
      }
      console.log(`[ProcessPaidOrder] User retrieved successfully: ${user._id}, email: ${user.email}`);
    }

    // Cập nhật order với tenant và user
    const userIdToSave = user._id || order.userId;
    
    await orderService.updateOrder(order._id, {
      tenantId: tenant._id,
      userId: userIdToSave
    });

    // Tạo hợp đồng sau khi đã có tenant và user
    let contract = null;
    try {
      const updatedTenant = await TenantRepository.findById(tenant._id);
      const startDate = new Date();
      const endDate = updatedTenant?.subscription?.expires_at || tenant.subscription?.expires_at;

      if (!endDate) {
        console.warn(` [ProcessPaidOrder] Tenant ${tenant._id} không có ngày hết hạn subscription`);
      }

      contract = await contractService.createContract({
        tenantId: tenant._id,
        userId: user._id,
        orderId: order._id,
        planType: order.planType,
        amount: order.amount,
        startDate: startDate,
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        companyInfo: order.companyInfo,
        contactPerson: order.contactPerson
      });

      console.log(` [ProcessPaidOrder] Contract created: ${contract.contractId}`);

      // Option: Generate PDF hợp đồng (có thể bỏ qua nếu lỗi)
      try {
        const pdfUrl = await contractService.generatePdf(contract);
        await contractService.update(contract.contractId, { pdfFileUrl: pdfUrl });
        console.log(`✅ [ProcessPaidOrder] PDF generated for contract: ${contract.contractId}`);
      } catch (pdfError) {
        console.error(`⚠️ [ProcessPaidOrder] Failed to generate PDF for contract ${contract.contractId}:`, pdfError.message);
        // Không throw error để không làm gián đoạn quá trình xử lý
      }
    } catch (contractError) {
      console.error(`❌ [ProcessPaidOrder] Failed to create contract:`, contractError.message);
      console.error(`   Error stack:`, contractError.stack);
      // Không throw error để không làm gián đoạn quá trình xử lý
      // Hợp đồng có thể được tạo lại sau bằng endpoint riêng
    }

    // Gửi thông báo cho system admin
    try {
      await notificationService.notifySystemAdmin({
        type: 'success', // Sử dụng enum hợp lệ: 'info', 'warning', 'error', 'success'
        title: isNewCustomer ? 'Đơn hàng mới' : 'Gia hạn gói dịch vụ',
        message: isNewCustomer 
          ? `Đơn hàng mới: ${order.companyInfo.name} - Gói ${order.planType} - Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}`
          : `Gia hạn gói: ${order.companyInfo.name} - Gói ${order.planType} - Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}`,
        orderId: order._id,
        tenantId: tenant._id,
        amount: order.amount
      });
    } catch (error) {
      console.error('Error notifying system admin:', error.message);
      // Không throw error để không làm gián đoạn quá trình xử lý
    }

    // Gửi email tài khoản/mật khẩu cho khách hàng mới
    console.log(`📧 [ProcessPaidOrder] Email decision: isNewCustomer=${isNewCustomer}, password=${password ? 'SET' : 'NULL'}`);
    if (isNewCustomer && password) {
      console.log(`📧 [ProcessPaidOrder] Sending account credentials email to ${order.contactPerson.email}...`);
      try {
        const emailResult = await emailService.sendAccountCredentials({
          to: order.contactPerson.email,
          username: user.username,
          password: password,
          companyName: order.companyInfo.name,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        });
        console.log(`✅ Account credentials email sent successfully to ${order.contactPerson.email} for order ${order.orderId}`);
        console.log(`   Email Message ID: ${emailResult.messageId || 'N/A'}`);
      } catch (error) {
        console.error(`❌ CRITICAL: Failed to send account credentials email to ${order.contactPerson.email}:`, error.message);
        console.error(`   Error stack:`, error.stack);
        console.error(`   This email can be resent later using: POST /api/pricing/orders/${order.orderId}/resend-email`);
        // Không throw error để không làm gián đoạn quá trình xử lý
        // Email có thể được gửi lại sau bằng endpoint resend-email
      }
      
      // Gửi email xác nhận thanh toán thành công cho khách hàng mới (sau email tài khoản)
      // Email này cũng chứa thông tin tài khoản để đảm bảo người dùng nhận được
      console.log(`📧 Preparing to send payment confirmation email to ${order.contactPerson.email}...`);
      try {
        const paymentConfirmationResult = await emailService.sendPaymentConfirmation({
          to: order.contactPerson.email,
          companyName: order.companyInfo.name,
          orderId: order.orderId,
          planType: order.planType,
          amount: order.amount,
          paymentDate: order.paymentDate || new Date(),
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          username: user.username,  // ⭐ Thêm username
          password: password         // ⭐ Thêm password
        });
        console.log(`✅ Payment confirmation email sent successfully to ${order.contactPerson.email} for order ${order.orderId}`);
        console.log(`   Email Message ID: ${paymentConfirmationResult.messageId || 'N/A'}`);
      } catch (error) {
        console.error(`❌ CRITICAL: Failed to send payment confirmation email to ${order.contactPerson.email}:`, error.message);
        console.error(`   Error stack:`, error.stack);
        // Không throw error để không làm gián đoạn quá trình xử lý
      }
    } else if (!isNewCustomer) {
      // Gửi email xác nhận gia hạn cho khách hàng cũ
      console.log(`📧 [ProcessPaidOrder] Sending renewal confirmation email to ${order.contactPerson.email} (isNewCustomer=false)...`);
      try {
        const updatedTenant = await TenantRepository.findById(tenant._id);
        const emailResult = await emailService.sendRenewalConfirmation({
          to: order.contactPerson.email,
          companyName: order.companyInfo.name,
          planType: order.planType,
          expiresAt: updatedTenant?.subscription?.expires_at || tenant.subscription?.expires_at,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        });
        console.log(`✅ Renewal confirmation email sent successfully to ${order.contactPerson.email} for order ${order.orderId}`);
        console.log(`   Email Message ID: ${emailResult.messageId || 'N/A'}`);
      } catch (error) {
        console.error(`❌ CRITICAL: Failed to send renewal confirmation email to ${order.contactPerson.email}:`, error.message);
        console.error(`   Error stack:`, error.stack);
        console.error(`   This email can be resent later using: POST /api/pricing/orders/${order.orderId}/resend-email`);
      }
    } else if (isNewCustomer && !password) {
      // Trường hợp: User đã tồn tại nhưng chưa có tenant - chỉ gửi email xác nhận thanh toán
      // (không gửi email tài khoản/mật khẩu vì user đã có mật khẩu rồi)
      console.log(`📧 [ProcessPaidOrder] Sending payment confirmation email to ${order.contactPerson.email} (isNewCustomer=true, password=null)...`);
      try {
        const paymentConfirmationResult = await emailService.sendPaymentConfirmation({
          to: order.contactPerson.email,
          companyName: order.companyInfo.name,
          orderId: order.orderId,
          planType: order.planType,
          amount: order.amount,
          paymentDate: order.paymentDate || new Date(),
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          username: user.username,  // ⭐ Thêm username (không có password vì user đã có)
          password: null            // ⭐ Không có password mới
        });
        console.log(`✅ Payment confirmation email sent successfully to ${order.contactPerson.email} for order ${order.orderId}`);
        console.log(`   Email Message ID: ${paymentConfirmationResult.messageId || 'N/A'}`);
      } catch (error) {
        console.error(`❌ CRITICAL: Failed to send payment confirmation email to ${order.contactPerson.email}:`, error.message);
        console.error(`   Error stack:`, error.stack);
        // Không throw error để không làm gián đoạn quá trình xử lý
      }
    }
  }

  static async createOrder(req, res) {
    try {
      // Log để debug unauthorized issue
      console.log('📦 Create order request received:', {
        method: req.method,
        url: req.originalUrl,
        hasAuthHeader: !!req.headers.authorization,
        authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'none',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const { planType, companyInfo, contactPerson, userId } = req.body;

      console.log('Create order request body:', {
        planType,
        hasCompanyInfo: !!companyInfo,
        hasContactPerson: !!contactPerson,
        hasUserId: !!userId
      });

      // Validate input
      if (!planType || !companyInfo || !contactPerson) {
        console.error('Missing required fields:', { planType, companyInfo, contactPerson });
        return res.status(400).json(createResponse(400, 'Thiếu thông tin bắt buộc'));
      }

      // Validate planType
      const validPlanTypes = ['monthly', 'quarterly', 'yearly'];
      if (!validPlanTypes.includes(planType)) {
        return res.status(400).json(createResponse(400, 'Loại gói không hợp lệ'));
      }

      // Validate companyInfo
      if (!companyInfo.name || !companyInfo.email || !companyInfo.phone) {
        return res.status(400).json(createResponse(400, 'Thiếu thông tin công ty (tên, email, số điện thoại)'));
      }

      // Đảm bảo address có giá trị (không phải undefined)
      if (!companyInfo.address) {
        companyInfo.address = '';
      }

      // Validate contactPerson
      if (!contactPerson.name || !contactPerson.email || !contactPerson.phone) {
        return res.status(400).json(createResponse(400, 'Thiếu thông tin người liên hệ (tên, email, số điện thoại)'));
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(companyInfo.email)) {
        return res.status(400).json(createResponse(400, 'Email công ty không hợp lệ'));
      }
      if (!emailRegex.test(contactPerson.email)) {
        return res.status(400).json(createResponse(400, 'Email người liên hệ không hợp lệ'));
      }

      // Nếu có userId, validate user và lấy thông tin (nhưng không bắt buộc)
      // Cho phép người không có account hoặc không phải company_admin vẫn mua gói
      let existingTenantId = null;
      let existingUser = null;
      
      if (userId) {
        const User = require('../models/user');
        existingUser = await User.findById(userId).populate('tenant_id');
        
        if (!existingUser) {
          return res.status(404).json(createResponse(404, 'Không tìm thấy người dùng'));
        }

        if (!existingUser.is_active) {
          return res.status(400).json(createResponse(400, 'Tài khoản đã bị vô hiệu hóa'));
        }

        // Lấy tenant từ user nếu có (không bắt buộc)
        existingTenantId = existingUser.tenant_id?._id || existingUser.tenant_id;

        // Nếu user có tenant, lấy thông tin tenant để điền vào companyInfo nếu chưa có
        if (existingTenantId) {
          const Tenant = require('../models/tenant');
          const tenant = await Tenant.findById(existingTenantId);
          
          if (tenant) {
            // Điền thông tin công ty từ tenant nếu không có trong request
            if (!companyInfo.name) companyInfo.name = tenant.name;
            if (!companyInfo.email) companyInfo.email = tenant.contact?.email || existingUser.email;
            if (!companyInfo.phone) companyInfo.phone = tenant.contact?.phone || existingUser.phone;
            if (!companyInfo.address) companyInfo.address = tenant.contact?.address || '';
          }
        }

        // Điền thông tin người liên hệ từ user nếu không có (tùy chọn)
        if (!contactPerson.name) contactPerson.name = existingUser.full_name || '';
        if (!contactPerson.email) contactPerson.email = existingUser.email || '';
        if (!contactPerson.phone) contactPerson.phone = existingUser.phone || '';
      }
      
      // Cho phép người không có account (không có userId) vẫn mua gói
      // Không cần kiểm tra quyền company_admin - ai cũng có thể mua gói

      // Tính giá tiền (VND)
      const pricing = {
        monthly: 5000,      // 5,000 VND/tháng
        quarterly: 12000,   // 12,000 VND/quý
        yearly: 55000       // 55,000 VND/năm
      };
      const amountVND = pricing[planType];

      // Tạo đơn hàng
      console.log('Creating order with data:', {
        planType,
        amount: amountVND,
        companyName: companyInfo.name,
        contactName: contactPerson.name
      });
      
      let order;
      try {
        order = await orderService.createOrder({
          planType,
          amount: amountVND,
          companyInfo,
          contactPerson,
          userId: userId || null,
          tenantId: existingTenantId || null
        });
        console.log('Order created successfully:', order.orderId);
      } catch (error) {
        console.error('Error creating order in database:', error);
        throw new Error(`Lỗi khi tạo đơn hàng trong database: ${error.message}`);
      }

      // Tạo payment link từ PayOS
      console.log('Creating PayOS payment link...');
      let paymentResult;
      try {
        // Tạo description ngắn gọn (tối đa 25 ký tự)
        const planName = planType === 'monthly' ? 'Tháng' : planType === 'quarterly' ? 'Quý' : 'Năm';
        const shortDescription = `Goi ${planName}`; // "Goi Thang", "Goi Quy", "Goi Nam"
        
        paymentResult = await payosService.createPaymentLink({
          orderId: order.orderId,
          amount: amountVND,
          description: shortDescription,
          items: [
            {
              name: `Goi ${planName}`,
              quantity: 1,
              price: amountVND
            }
          ]
        });

        if (!paymentResult.success) {
          throw new Error('Không thể tạo payment link');
        }
        console.log('Payment link created successfully');
      } catch (error) {
        console.error('Error creating PayOS payment link:', error);
        // Xóa order đã tạo nếu không tạo được payment link
        try {
          const orderToDelete = await orderService.getOrderById(order._id);
          if (orderToDelete) {
            await orderToDelete.deleteOne();
            console.log('Order deleted due to payment link creation failure');
          }
        } catch (deleteError) {
          console.error('Error deleting order:', deleteError);
          // Không throw vì đây chỉ là cleanup
        }
        throw new Error(`Lỗi khi tạo payment link: ${error.message}`);
      }

      // Cập nhật order với payment link và orderCode
      try {
        await orderService.updateOrder(order._id, {
          paymentLink: paymentResult.checkoutUrl,
          paymentOrderCode: paymentResult.orderCode.toString() // Lưu orderCode để verify sau
        });
        console.log('Order updated with payment link');
      } catch (error) {
        console.error('Error updating order with payment link:', error);
        // Không throw vì order đã được tạo và payment link đã có
      }

      res.json(createResponse(200, 'Tạo đơn hàng thành công', {
        orderId: order.orderId,
        paymentUrl: paymentResult.checkoutUrl,
        amount: amountVND,
        planType
      }));
    } catch (error) {
      console.error('Create order error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Nếu là lỗi validation từ Mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
        console.error('Validation errors:', validationErrors);
        return res.status(400).json(createResponse(400, `Lỗi validation: ${validationErrors}`));
      }
      
      // Nếu là lỗi từ PayOS, trả về message chi tiết hơn
      if (error.message && (error.message.includes('Thông tin truyền lên không đúng') || 
                            error.message.includes('PayOS') || 
                            error.message.includes('payment link'))) {
        // Trả về message ngắn gọn cho frontend, chi tiết đã log ở server
        const shortMessage = error.message.includes('404') 
          ? 'Không thể kết nối đến PayOS. Vui lòng kiểm tra cấu hình PayOS trên server.'
          : error.message.includes('Connection error')
          ? 'Lỗi kết nối đến PayOS. Vui lòng thử lại sau.'
          : 'Lỗi khi tạo payment link từ PayOS. Vui lòng kiểm tra cấu hình PayOS.';
        
        return res.status(500).json(createResponse(500, shortMessage));
      }
      
      // Nếu là lỗi validation hoặc lỗi khác
      const errorMessage = error.message || 'Lỗi khi tạo đơn hàng';
      res.status(500).json(createResponse(500, errorMessage, null, process.env.NODE_ENV === 'development' ? error.stack : undefined));
    }
  }

  /**
   * Xử lý webhook từ PayOS
   * POST /api/pricing/payment-webhook
   */
  static async paymentWebhook(req, res) {
    try {
      const webhookData = req.body;

      // Log để debug
      console.log('PayOS webhook received:', {
        hasData: !!webhookData.data,
        hasSignature: !!webhookData.signature,
        dataKeys: webhookData.data ? Object.keys(webhookData.data) : []
      });

      // Verify payment
      const verifyResult = payosService.verifyWebhook(webhookData);

      // Log chi tiết verifyResult để debug
      console.log('🔍 PayOS verifyResult:', {
        isValid: verifyResult.isValid,
        status: verifyResult.status,
        orderCode: verifyResult.orderCode,
        orderId: verifyResult.orderId,
        amount: verifyResult.amount
      });

      if (!verifyResult.isValid) {
        // PayOS có thể test webhook với dữ liệu không hợp lệ
        // Trả về 200 để PayOS không báo lỗi, nhưng log để debug
        console.warn('PayOS webhook verification failed:', verifyResult.message);
        return res.json({
          code: '01',
          desc: verifyResult.message || 'Invalid signature'
        });
      }

      // Tìm order: Ưu tiên theo paymentOrderCode (orderCode từ PayOS), sau đó fallback theo orderId nếu có
      let order = null;

      if (verifyResult.orderCode) {
        console.log(`🔍 Searching order by paymentOrderCode: ${verifyResult.orderCode}`);
        order = await orderService.getOrderByPaymentCode(verifyResult.orderCode.toString());
        if (order) {
          console.log(`✅ Order found by paymentOrderCode: ${order.orderId}`);
        } else {
          console.log(`⚠️ Order not found by paymentOrderCode: ${verifyResult.orderCode}`);
        }
      }

      if (!order && verifyResult.orderId) {
        console.log(`🔍 Searching order by orderId: ${verifyResult.orderId}`);
        order = await orderService.getOrderByOrderId(verifyResult.orderId);
        if (order) {
          console.log(`✅ Order found by orderId: ${order.orderId}`);
        } else {
          console.log(`⚠️ Order not found by orderId: ${verifyResult.orderId}`);
        }
      }

      if (!order) {
        console.error('❌ Order not found after all attempts:', {
          orderId: verifyResult.orderId,
          orderCode: verifyResult.orderCode,
          note: 'This might be a retry webhook for a deleted order, or orderCode mismatch'
        });
        // Trả về 200 để PayOS không retry (vì order không tồn tại)
        return res.json({
          code: '01',
          desc: 'Order not found'
        });
      }

      console.log('📦 Order found:', {
        orderId: order.orderId,
        currentStatus: order.status,
        verifyResultStatus: verifyResult.status
      });

      // Kiểm tra nếu đã xử lý rồi
      if (order.status === 'paid') {
        console.log('ℹ️ Order already processed (status = paid)');
        return res.json({
          code: '00',
          desc: 'Order already processed'
        });
      }

      // Kiểm tra status
      if (verifyResult.status !== 'PAID') {
        console.warn('⚠️ Payment status is not PAID:', {
          verifyResultStatus: verifyResult.status,
          orderId: order.orderId
        });
        // Thanh toán thất bại hoặc bị hủy
        await orderService.markOrderAsFailed(order.orderId);
        return res.json({
          code: '00',
          desc: `Payment ${verifyResult.status}`
        });
      }

      // Thanh toán thành công - xử lý đơn hàng
      await orderService.markOrderAsPaid(order.orderId, {
        transactionId: verifyResult.transactionId || verifyResult.orderCode.toString(),
        paymentOrderCode: verifyResult.orderCode.toString()
      });

      // Reload order để có đầy đủ thông tin sau khi update
      order = await orderService.getOrderByOrderId(order.orderId);
      if (!order) {
        console.error('Order not found after marking as paid:', order.orderId);
        return res.status(500).json({
          code: '99',
          desc: 'Order not found'
        });
      }

      // Xử lý business logic (tạo tenant/user, gửi email, etc.)
      console.log(`Processing paid order ${order.orderId} for email: ${order.contactPerson.email}`);
      await PricingController._processPaidOrder(order);
      console.log(`✅ Successfully processed order ${order.orderId} - Email should have been sent to ${order.contactPerson.email}`);

      // Trả về response cho PayOS
      res.json({
        code: '00',
        desc: 'Success'
      });
    } catch (error) {
      console.error('Payment webhook error:', error);
      res.status(500).json({
        code: '99',
        desc: 'Internal server error'
      });
    }
  }

  /**
   * Lấy thông tin đơn hàng
   * GET /api/pricing/orders/:orderId
   */
  static async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderByOrderId(orderId);

      if (!order) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy đơn hàng'));
      }

      let contract = null;
      if (order.status === 'paid' && order._id) {
        try {
          contract = await contractService.findByOrderId(order._id);
        } catch (error) {
          console.error('Error finding contract for order:', error);
        }
      }

      const responseData = {
        orderId: order.orderId,
        planType: order.planType,
        amount: order.amount,
        status: order.status,
        companyInfo: order.companyInfo,
        contactPerson: order.contactPerson,
        paymentDate: order.paymentDate,
        createdAt: order.createdAt
      };

      if (contract) {
        responseData.contractId = contract.contractId;
        responseData.contractPdfUrl = contract.pdfFileUrl;
      }

      res.json(createResponse(200, 'Lấy thông tin đơn hàng thành công', responseData));
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy thông tin đơn hàng', null, error.message));
    }
  }

  static async paymentReturn(req, res) {
    try {
      const queryParams = req.query;
      
      console.log('Payment return URL called with params:', queryParams);

      // Verify thông tin từ PayOS
      const verifyResult = payosService.verifyReturnUrl(queryParams);

      if (!verifyResult.isValid) {
        console.error('Invalid return URL data:', verifyResult.message);
        // Redirect về frontend với thông báo lỗi
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/pricing/payment-success?error=${encodeURIComponent(verifyResult.message)}`);
      }

      // Kiểm tra nếu thanh toán thành công
      if (!verifyResult.success || verifyResult.code !== '00') {
        // Thanh toán thất bại
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectParams = new URLSearchParams({
          success: 'false',
          code: verifyResult.code || '',
          message: verifyResult.message || 'Thanh toán thất bại',
        });
        return res.redirect(`${frontendUrl}/pricing/payment-success?${redirectParams.toString()}`);
      }

      // Thanh toán thành công - xử lý business logic
      let order = null;
      if (verifyResult.orderCode) {
        order = await orderService.getOrderByPaymentCode(verifyResult.orderCode.toString());
      }

      if (!order) {
        console.error('Order not found for orderCode:', verifyResult.orderCode);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/pricing/payment-success?error=${encodeURIComponent('Không tìm thấy đơn hàng')}`);
      }

      // Kiểm tra nếu đã xử lý rồi (tránh xử lý trùng)
      if (order.status === 'paid') {
        console.log('Order already processed:', order.orderId);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectParams = new URLSearchParams({
          success: 'true',
          message: 'Thanh toán thành công',
          orderId: order.orderId,
        });
        return res.redirect(`${frontendUrl}/pricing/payment-success?${redirectParams.toString()}`);
      }

      // Đánh dấu đơn hàng đã thanh toán
      await orderService.markOrderAsPaid(order.orderId, {
        transactionId: verifyResult.transactionDateTime || verifyResult.orderCode.toString(),
        paymentOrderCode: verifyResult.orderCode.toString()
      });

      // Reload order để có đầy đủ thông tin sau khi update
      order = await orderService.getOrderByPaymentCode(verifyResult.orderCode.toString());
      if (!order) {
        console.error('Order not found after marking as paid:', verifyResult.orderCode);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/pricing/payment-success?error=${encodeURIComponent('Lỗi khi xử lý đơn hàng')}`);
      }

      // Xử lý business logic (tạo tenant/user, gửi email, etc.)
      console.log(`Processing paid order ${order.orderId} via return URL - Email: ${order.contactPerson.email}`);
      try {
        await PricingController._processPaidOrder(order);
        console.log(`✅ Successfully processed order ${order.orderId} - Email should have been sent to ${order.contactPerson.email}`);
      } catch (error) {
        console.error(`❌ Error processing business logic for order ${order.orderId}:`, error);
        console.error('Error details:', error.stack);
        // Vẫn redirect về frontend với thông báo thành công
        // Vì thanh toán đã thành công, chỉ là xử lý business logic bị lỗi
        // Email có thể được gửi lại bằng endpoint resend-email
      }

      // Redirect về frontend với thông báo thành công
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectParams = new URLSearchParams({
        success: 'true',
        message: 'Thanh toán thành công',
        orderId: order.orderId,
      });

      if (verifyResult.amount) {
        redirectParams.append('amount', verifyResult.amount.toString());
      }

      return res.redirect(`${frontendUrl}/pricing/payment-success?${redirectParams.toString()}`);
    } catch (error) {
      console.error('Payment return error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/pricing/payment-success?error=${encodeURIComponent('Lỗi khi xử lý kết quả thanh toán')}`);
    }
  }

  /**
   * Gửi lại email cho đơn hàng đã thanh toán
   * POST /api/pricing/orders/:orderId/resend-email
   * 
   * Public endpoint - cho phép gửi lại email đăng nhập nếu chưa nhận được
   */
  static async resendEmail(req, res) {
    try {
      const { orderId } = req.params;
      
      console.log('Resend email request for order:', orderId);

      // Tìm order
      const order = await orderService.getOrderByOrderId(orderId);

      if (!order) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy đơn hàng'));
      }

      // Chỉ cho phép gửi lại email cho đơn hàng đã thanh toán
      if (order.status !== 'paid') {
        return res.status(400).json(createResponse(400, 'Chỉ có thể gửi lại email cho đơn hàng đã thanh toán'));
      }

      // Nếu order chưa có tenant hoặc user, thử xử lý lại
      if (!order.tenantId || !order.userId) {
        console.log('Order not fully processed, processing now...');
        try {
          await PricingController._processPaidOrder(order);
          // Reload order để lấy thông tin mới
          const updatedOrder = await orderService.getOrderByOrderId(orderId);
          if (updatedOrder.tenantId && updatedOrder.userId) {
            return res.json(createResponse(200, 'Đã xử lý đơn hàng và gửi email thành công. Vui lòng kiểm tra hộp thư đến'));
          } else {
            return res.status(500).json(createResponse(500, 'Không thể xử lý đơn hàng. Vui lòng liên hệ hỗ trợ'));
          }
        } catch (error) {
          console.error('Error processing order:', error);
          return res.status(500).json(createResponse(500, 'Lỗi khi xử lý đơn hàng', null, error.message));
        }
      }

      // Lấy user và tenant
      const User = require('../models/user');
      const TenantRepository = require('../repository/TenantRepository');
      
      const user = await User.findById(order.userId);
      const tenant = await TenantRepository.findById(order.tenantId);

      if (!user) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy người dùng'));
      }

      if (!tenant) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy tenant'));
      }

      // Xác định loại email cần gửi
      // Nếu order có userId và tenantId từ lúc tạo, có thể là khách hàng cũ
      // Nếu tenant được tạo sau khi order được đánh dấu paid, là khách hàng mới
      const isNewCustomer = order.userId && order.tenantId ? 
        (tenant.createdAt && new Date(tenant.createdAt).getTime() >= new Date(order.paymentDate || order.createdAt).getTime() - 60000) : 
        true;

      if (isNewCustomer) {
        // Khách hàng mới - gửi email với username và hướng dẫn reset password
        await emailService.sendAccountCredentialsResend({
          to: order.contactPerson.email,
          username: user.username,
          companyName: order.companyInfo.name,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          forgotPasswordUrl: `${process.env.FRONTEND_URL}/forgot-password`
        });
      } else {
        // Khách hàng cũ - gửi email xác nhận gia hạn
        await emailService.sendRenewalConfirmation({
          to: order.contactPerson.email,
          companyName: order.companyInfo.name,
          planType: order.planType,
          expiresAt: tenant.subscription?.expires_at,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        });
      }

      return res.json(createResponse(200, 'Đã gửi lại email thành công. Vui lòng kiểm tra hộp thư đến và thư mục Spam'));
    } catch (error) {
      console.error('Resend email error:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi gửi lại email', null, error.message));
    }
  }

  /**
   * Xử lý cancelUrl từ PayOS - Hủy thanh toán
   * GET /api/pricing/payment-cancel
   * 
   * PayOS sẽ redirect về URL này khi người dùng hủy thanh toán
   */
  static async paymentCancel(req, res) {
    try {
      const queryParams = req.query;
      
      console.log('Payment cancel URL called with params:', queryParams);

      // Verify thông tin từ PayOS (có thể có hoặc không có data)
      const verifyResult = payosService.verifyReturnUrl(queryParams);

      // Tìm order nếu có orderCode
      let order = null;
      if (verifyResult.orderCode) {
        order = await orderService.getOrderByPaymentCode(verifyResult.orderCode.toString());
      }

      // Redirect về frontend với thông báo hủy
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      const redirectParams = new URLSearchParams({
        cancelled: 'true',
        message: 'Bạn đã hủy thanh toán'
      });

      if (order) {
        redirectParams.append('orderId', order.orderId);
      }

      if (verifyResult.orderCode) {
        redirectParams.append('orderCode', verifyResult.orderCode.toString());
      }

      return res.redirect(`${frontendUrl}/pricing/payment-cancelled?${redirectParams.toString()}`);
    } catch (error) {
      console.error('Payment cancel error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/pricing/payment-cancelled?error=${encodeURIComponent('Lỗi khi xử lý hủy thanh toán')}`);
    }
  }

  /**
   * Generate contract preview PDF từ thông tin form (trước khi tạo order)
   * POST /api/pricing/contract-preview
   */
  static async generateContractPreview(req, res) {
    try {
      console.log('📄 [ContractPreview] Request received:', {
        method: req.method,
        path: req.path,
        body: {
          planType: req.body?.planType,
          hasCompanyInfo: !!req.body?.companyInfo,
          hasContactPerson: !!req.body?.contactPerson
        }
      });

      const { planType, companyInfo, contactPerson } = req.body;

      if (!planType || !companyInfo || !contactPerson) {
        console.error('❌ [ContractPreview] Missing required fields:', {
          planType: !!planType,
          companyInfo: !!companyInfo,
          contactPerson: !!contactPerson
        });
        return res.status(400).json(createResponse(400, 'Thiếu thông tin bắt buộc'));
      }

      if (!companyInfo.name || !companyInfo.email || !companyInfo.phone || !companyInfo.address) {
        console.error('❌ [ContractPreview] Missing required company info fields');
        return res.status(400).json(createResponse(400, 'Thiếu thông tin công ty bắt buộc (tên, email, số điện thoại, địa chỉ)'));
      }

      if (!contactPerson.name || !contactPerson.email || !contactPerson.phone) {
        console.error('❌ [ContractPreview] Missing required contact person fields');
        return res.status(400).json(createResponse(400, 'Thiếu thông tin người liên hệ bắt buộc (tên, email, số điện thoại)'));
      }

      const planPrices = {
        monthly: 5000,
        quarterly: 12000,
        yearly: 55000
      };

      const amount = planPrices[planType];
      if (!amount) {
        console.error('❌ [ContractPreview] Invalid plan type:', planType);
        return res.status(400).json(createResponse(400, 'Gói dịch vụ không hợp lệ'));
      }

      console.log('🔄 [ContractPreview] Generating PDF preview...');
      const previewPdfUrl = await contractService.generatePreviewPdf({
        planType,
        amount,
        companyInfo,
        contactPerson
      });

      console.log('✅ [ContractPreview] PDF preview generated successfully:', previewPdfUrl);

      return res.json(createResponse(200, 'Tạo preview hợp đồng thành công', {
        previewPdfUrl
      }));
    } catch (error) {
      console.error('❌ [ContractPreview] Error generating preview:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json(createResponse(500, 'Lỗi khi tạo preview hợp đồng', null, error.message));
    }
  }
}

module.exports = PricingController;

