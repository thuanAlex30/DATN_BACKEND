/**
 * Script để tạo lại orders từ tenants hiện có
 * Chạy: node scripts/recreateOrdersFromTenants.js
 * 
 * ⚠️  LƯU Ý: Script này sẽ tạo lại orders từ tenants, nhưng sẽ thiếu một số thông tin:
 * - paymentTransactionId
 * - paymentOrderCode
 * - paymentBankCode
 * - paymentDate (sẽ dùng createdAt của tenant)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Tenant = require('../models/tenant');
const User = require('../models/user');

// Pricing amounts (cần match với pricing controller)
const PRICING = {
  monthly: 5000,      // 5,000 VND/tháng
  quarterly: 12000,   // 12,000 VND/quý
  yearly: 55000        // 55,000 VND/năm
};

async function recreateOrdersFromTenants() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI không được cấu hình trong .env');
      process.exit(1);
    }

    console.log('🔌 Đang kết nối database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Lấy tất cả tenants active
    const tenants = await Tenant.find({ status: { $in: ['active', 'ACTIVE'] } }).lean();
    console.log(`📊 Tìm thấy ${tenants.length} tenants active\n`);

    if (tenants.length === 0) {
      console.log('⚠️  Không có tenants nào để tạo lại orders');
      await mongoose.disconnect();
      return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tenant of tenants) {
      try {
        // Kiểm tra xem đã có order cho tenant này chưa
        const existingOrder = await Order.findOne({ tenantId: tenant._id, status: 'paid' });
        if (existingOrder) {
          console.log(`⏭️  Đã có order cho tenant: ${tenant.name} (${tenant.tenant_code})`);
          skipped++;
          continue;
        }

        // Lấy thông tin user của tenant
        // Ưu tiên 1: Tìm user với role_code = 'company_admin'
        let user = await User.findOne({ 
          tenant_id: tenant._id,
          role_code: 'company_admin',
          is_active: true
        }).lean();

        // Ưu tiên 2: Nếu không tìm thấy, tìm user đầu tiên trong tenant
        if (!user) {
          user = await User.findOne({ 
            tenant_id: tenant._id,
            is_active: true
          }).lean();
        }

        // Ưu tiên 3: Nếu vẫn không tìm thấy, tìm user theo email của tenant contact
        if (!user && tenant.contact?.email) {
          user = await User.findOne({ 
            email: tenant.contact.email,
            is_active: true
          }).lean();
        }

        if (!user) {
          console.log(`⚠️  Không tìm thấy user cho tenant: ${tenant.name}`);
        } else {
          console.log(`✅ Tìm thấy user: ${user.full_name} (${user.email}) cho tenant: ${tenant.name}`);
        }

        // Lấy planType từ subscription
        const planType = tenant.subscription?.plan || 'monthly';
        const amount = PRICING[planType] || PRICING.monthly;

        // Tạo orderId mới
        const orderId = `ORDER-RECREATED-${Date.now()}-${tenant._id.toString().substring(0, 8).toUpperCase()}`;

        // Tạo order data
        const orderData = {
          orderId,
          planType,
          amount,
          status: 'paid', // Đã thanh toán
          companyInfo: {
            name: tenant.name,
            address: tenant.address || '',
            phone: tenant.contact?.phone || tenant.contact_phone || '',
            email: tenant.contact?.email || tenant.contact_email || tenant.email || ''
          },
          contactPerson: {
            // ⭐ QUAN TRỌNG: Ưu tiên full_name của user, không fallback về tên công ty
            name: user?.full_name || user?.username || tenant.contact?.name || 'N/A',
            email: user?.email || tenant.contact?.email || tenant.contact_email || tenant.email || '',
            phone: user?.phone || tenant.contact?.phone || tenant.contact_phone || '',
            position: 'Đại diện'
          },
          tenantId: tenant._id,
          userId: user?._id || null,
          paymentDate: tenant.createdAt || tenant.created_at || new Date(),
          // ⭐ QUAN TRỌNG: Không set expiresAt để tránh bị TTL xóa
          expiresAt: null
        };

        // Tạo order
        const order = new Order(orderData);
        await order.save();

        console.log(`✅ Đã tạo order: ${orderId} cho tenant: ${tenant.name}`);
        created++;

      } catch (error) {
        console.error(`❌ Lỗi khi tạo order cho tenant ${tenant.name}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã tạo: ${created} orders`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} orders (đã tồn tại)`);
    console.log(`   ❌ Lỗi: ${errors} orders`);

    // Kiểm tra lại
    const totalOrders = await Order.countDocuments({ status: 'paid' });
    console.log(`\n📈 Tổng số orders đã thanh toán: ${totalOrders}`);

    await mongoose.disconnect();
    console.log('\n✅ Đã đóng kết nối database');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

recreateOrdersFromTenants();

