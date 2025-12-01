/**
 * Script để tìm đơn hàng theo email và gửi lại email
 * 
 * Usage: node scripts/resend-email-by-email.js email@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/order');
const PricingController = require('../controllers/pricingController');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function findAndResendEmail(contactEmail) {
  try {
    // Kết nối database
    await connectDB();
    logSuccess('Đã kết nối database');

    // Tìm đơn hàng với email người liên hệ
    logInfo(`Đang tìm đơn hàng với email: ${contactEmail}...`);
    
    const orders = await Order.find({
      'contactPerson.email': contactEmail
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      logWarning(`Không tìm thấy đơn hàng nào với email: ${contactEmail}`);
      return;
    }

    logSuccess(`Tìm thấy ${orders.length} đơn hàng:`);
    console.log('');

    // Hiển thị danh sách đơn hàng
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.orderId}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Company: ${order.companyInfo.name}`);
      console.log(`   - Plan: ${order.planType}`);
      console.log(`   - Amount: ${order.amount} VND`);
      console.log(`   - Contact: ${order.contactPerson.name} (${order.contactPerson.email})`);
      console.log(`   - Created: ${order.createdAt}`);
      console.log(`   - Paid: ${order.paymentDate || 'Chưa thanh toán'}`);
      console.log(`   - Has Tenant: ${order.tenantId ? 'Yes' : 'No'}`);
      console.log(`   - Has User: ${order.userId ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Tìm đơn hàng đã thanh toán
    const paidOrders = orders.filter(order => order.status === 'paid');
    
    if (paidOrders.length === 0) {
      logWarning('Không có đơn hàng nào đã thanh toán. Không thể gửi email.');
      return;
    }

    logInfo(`Tìm thấy ${paidOrders.length} đơn hàng đã thanh toán. Chọn đơn hàng để gửi lại email:`);
    
    // Nếu có nhiều đơn hàng, chọn đơn hàng gần nhất
    const latestPaidOrder = paidOrders[0];
    logInfo(`Đang xử lý đơn hàng gần nhất: ${latestPaidOrder.orderId}...`);

    // Kiểm tra xem đơn hàng đã được xử lý chưa
    if (!latestPaidOrder.tenantId || !latestPaidOrder.userId) {
      logWarning('Đơn hàng chưa được xử lý đầy đủ. Đang xử lý...');
      try {
        await PricingController._processPaidOrder(latestPaidOrder);
        logSuccess('Đã xử lý đơn hàng và gửi email thành công!');
      } catch (error) {
        logError(`Lỗi khi xử lý đơn hàng: ${error.message}`);
        return;
      }
    } else {
      // Đơn hàng đã được xử lý, gửi lại email
      logInfo('Đơn hàng đã được xử lý. Đang gửi lại email...');
      
      // Lấy user và tenant
      const User = require('../models/user');
      const TenantRepository = require('../repository/TenantRepository');
      
      const user = await User.findById(latestPaidOrder.userId);
      const tenant = await TenantRepository.findById(latestPaidOrder.tenantId);

      if (!user || !tenant) {
        logError('Không tìm thấy user hoặc tenant. Vui lòng xử lý lại đơn hàng.');
        return;
      }

      // Xác định loại email
      const isNewCustomer = tenant.createdAt && 
        new Date(tenant.createdAt).getTime() >= new Date(latestPaidOrder.paymentDate || latestPaidOrder.createdAt).getTime() - 60000;

      const emailService = require('../services/emailService');

      if (isNewCustomer) {
        logInfo('Khách hàng mới - Gửi email thông tin đăng nhập...');
        await emailService.sendAccountCredentialsResend({
          to: latestPaidOrder.contactPerson.email,
          username: user.username,
          companyName: latestPaidOrder.companyInfo.name,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
          forgotPasswordUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password`
        });
      } else {
        logInfo('Khách hàng cũ - Gửi email xác nhận gia hạn...');
        await emailService.sendRenewalConfirmation({
          to: latestPaidOrder.contactPerson.email,
          companyName: latestPaidOrder.companyInfo.name,
          planType: latestPaidOrder.planType,
          expiresAt: tenant.subscription?.expires_at,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
        });
      }

      logSuccess(`✅ Đã gửi lại email thành công đến ${latestPaidOrder.contactPerson.email}!`);
      logInfo('Vui lòng kiểm tra hộp thư đến và thư mục Spam/Junk');
    }

  } catch (error) {
    logError(`Lỗi: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    logInfo('Đã đóng kết nối database');
  }
}

// Lấy email từ command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/resend-email-by-email.js email@example.com');
  console.log('Example: node scripts/resend-email-by-email.js lamakakigarc@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  logError(`Email không hợp lệ: ${email}`);
  process.exit(1);
}

// Chạy script
findAndResendEmail(email)
  .then(() => {
    console.log('');
    logSuccess('Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    logError(`Lỗi: ${error.message}`);
    process.exit(1);
  });

