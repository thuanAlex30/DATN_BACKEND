/**
 * Script để sửa lại thông tin contactPerson trong orders
 * Xóa orders cũ và tạo lại với thông tin đúng
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Tenant = require('../models/tenant');
const User = require('../models/user');

// Pricing amounts
const PRICING = {
  monthly: 5000,
  quarterly: 12000,
  yearly: 55000
};

async function fixOrdersContactPerson() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Xóa tất cả orders đã tạo lại (có prefix ORDER-RECREATED)
    const deletedOrders = await Order.deleteMany({ 
      orderId: { $regex: /^ORDER-RECREATED-/ }
    });
    console.log(`🗑️  Đã xóa ${deletedOrders.deletedCount} orders cũ\n`);

    // Lấy tất cả tenants active
    const tenants = await Tenant.find({ status: { $in: ['active', 'ACTIVE'] } }).lean();
    console.log(`📊 Tìm thấy ${tenants.length} tenants active\n`);

    let created = 0;
    let errors = 0;

    for (const tenant of tenants) {
      try {
        // Bỏ qua Default Tenant
        if (tenant.name === 'Default Tenant') {
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
          console.log(`⚠️  Không tìm thấy user cho tenant: ${tenant.name} - Bỏ qua`);
          continue;
        }

        // Lấy planType từ subscription
        const planType = tenant.subscription?.plan || 'monthly';
        const amount = PRICING[planType] || PRICING.monthly;

        // Tạo orderId mới
        const orderId = `ORDER-RECREATED-${Date.now()}-${tenant._id.toString().substring(0, 8).toUpperCase()}`;

        // Tạo order data với thông tin contact person đúng
        const orderData = {
          orderId,
          planType,
          amount,
          status: 'paid',
          companyInfo: {
            name: tenant.name,
            address: tenant.address || '',
            phone: tenant.contact?.phone || tenant.contact_phone || '',
            email: tenant.contact?.email || tenant.contact_email || tenant.email || ''
          },
          contactPerson: {
            // ⭐ QUAN TRỌNG: Sử dụng full_name của user, không fallback về tên công ty
            name: user.full_name || user.username || 'N/A',
            email: user.email || tenant.contact?.email || tenant.contact_email || tenant.email || '',
            phone: user.phone || tenant.contact?.phone || tenant.contact_phone || '',
            position: 'Đại diện'
          },
          tenantId: tenant._id,
          userId: user._id,
          paymentDate: tenant.createdAt || tenant.created_at || new Date(),
          expiresAt: null
        };

        // Tạo order
        const order = new Order(orderData);
        await order.save();

        console.log(`✅ Đã tạo order: ${orderId}`);
        console.log(`   Company: ${tenant.name}`);
        console.log(`   Contact Person: ${orderData.contactPerson.name} (${orderData.contactPerson.email})`);
        created++;

      } catch (error) {
        console.error(`❌ Lỗi khi tạo order cho tenant ${tenant.name}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã tạo: ${created} orders`);
    console.log(`   ❌ Lỗi: ${errors} orders`);

    const totalOrders = await Order.countDocuments({ status: 'paid' });
    console.log(`\n📈 Tổng số orders đã thanh toán: ${totalOrders}`);

    await mongoose.disconnect();
    console.log('\n✅ Đã đóng kết nối database');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

fixOrdersContactPerson();

