/**
 * Script để kiểm tra thông tin contactPerson trong orders
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Tenant = require('../models/tenant');
const User = require('../models/user');

async function checkOrdersContactPerson() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    const orders = await Order.find({ status: 'paid' }).lean();
    console.log(`📊 Tổng số orders: ${orders.length}\n`);

    for (const order of orders) {
      console.log(`\n📋 Order: ${order.orderId}`);
      console.log(`   Company: ${order.companyInfo?.name}`);
      console.log(`   Contact Person Name: ${order.contactPerson?.name}`);
      console.log(`   Contact Person Email: ${order.contactPerson?.email}`);
      console.log(`   Contact Person Phone: ${order.contactPerson?.phone}`);
      console.log(`   TenantId: ${order.tenantId}`);

      if (order.tenantId) {
        const tenant = await Tenant.findById(order.tenantId).lean();
        if (tenant) {
          console.log(`   Tenant Name: ${tenant.name}`);
          console.log(`   Tenant Contact: ${JSON.stringify(tenant.contact)}`);
          
          // Tìm user
          const user = await User.findOne({ 
            tenant_id: order.tenantId,
            role_code: 'company_admin',
            is_active: true
          }).lean();
          
          if (user) {
            console.log(`   ✅ Found User: ${user.full_name} (${user.email})`);
          } else {
            console.log(`   ⚠️  No company_admin user found`);
            // Tìm bất kỳ user nào
            const anyUser = await User.findOne({ 
              tenant_id: order.tenantId,
              is_active: true
            }).lean();
            if (anyUser) {
              console.log(`   ℹ️  Found other user: ${anyUser.full_name} (${anyUser.email}) - Role: ${anyUser.role_code}`);
            }
          }
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Đã đóng kết nối database');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkOrdersContactPerson();

