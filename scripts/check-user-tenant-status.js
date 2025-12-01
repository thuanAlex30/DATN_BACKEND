const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Tenant = require('../models/tenant');
const Order = require('../models/order');

async function checkUserTenantStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safety_management_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Lấy email từ command line argument hoặc prompt
    const email = process.argv[2];
    if (!email) {
      console.error('❌ Please provide an email address as argument');
      console.log('Usage: node scripts/check-user-tenant-status.js <email>');
      process.exit(1);
    }

    console.log(`\n🔍 Checking status for email: ${email}\n`);

    // 1. Kiểm tra User
    const user = await User.findOne({ email: email }).populate('tenant_id');
    if (user) {
      console.log('✅ USER FOUND:');
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Full Name: ${user.full_name}`);
      console.log(`   - Is Active: ${user.is_active}`);
      console.log(`   - Tenant ID: ${user.tenant_id ? user.tenant_id._id || user.tenant_id : 'NULL'}`);
      
      if (user.tenant_id) {
        const tenantId = user.tenant_id._id || user.tenant_id;
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          console.log('\n✅ TENANT FOUND (from user):');
          console.log(`   - ID: ${tenant._id}`);
          console.log(`   - Name: ${tenant.name}`);
          console.log(`   - Email: ${tenant.contact?.email || 'N/A'}`);
          console.log(`   - Plan Type: ${tenant.subscription?.plan_type || 'N/A'}`);
          console.log(`   - Expires At: ${tenant.subscription?.expires_at || 'N/A'}`);
        } else {
          console.log('\n❌ TENANT NOT FOUND (user has tenant_id but tenant does not exist)');
        }
      } else {
        console.log('\n⚠️ USER HAS NO TENANT');
      }
    } else {
      console.log('❌ USER NOT FOUND');
    }

    // 2. Kiểm tra Orders
    const orders = await Order.find({ 
      'contactPerson.email': email 
    }).sort({ createdAt: -1 }).limit(5);
    
    if (orders.length > 0) {
      console.log(`\n📦 FOUND ${orders.length} ORDER(S):`);
      orders.forEach((order, index) => {
        console.log(`\n   Order ${index + 1}:`);
        console.log(`   - Order ID: ${order.orderId}`);
        console.log(`   - Status: ${order.status}`);
        console.log(`   - Plan Type: ${order.planType}`);
        console.log(`   - Amount: ${order.amount}`);
        console.log(`   - User ID: ${order.userId || 'NULL'}`);
        console.log(`   - Tenant ID: ${order.tenantId || 'NULL'}`);
        console.log(`   - Created At: ${order.createdAt}`);
        console.log(`   - Payment Date: ${order.paymentDate || 'N/A'}`);
      });
    } else {
      console.log('\n❌ NO ORDERS FOUND');
    }

    // 3. Tổng kết
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    if (user) {
      if (user.tenant_id) {
        const tenantId = user.tenant_id._id || user.tenant_id;
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          console.log('   Status: EXISTING CUSTOMER (has user + tenant)');
          console.log('   Expected Email: RENEWAL CONFIRMATION');
        } else {
          console.log('   Status: USER EXISTS BUT TENANT DELETED');
          console.log('   Expected Email: ACCOUNT CREDENTIALS + PAYMENT CONFIRMATION');
        }
      } else {
        console.log('   Status: USER EXISTS BUT NO TENANT');
        console.log('   Expected Email: PAYMENT CONFIRMATION (no password)');
      }
    } else {
      console.log('   Status: NEW CUSTOMER (no user found)');
      console.log('   Expected Email: ACCOUNT CREDENTIALS + PAYMENT CONFIRMATION');
    }
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserTenantStatus();

