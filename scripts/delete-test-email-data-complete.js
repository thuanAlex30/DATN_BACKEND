/**
 * Script để xóa hoàn toàn dữ liệu test liên quan đến email
 * Tìm kiếm case-insensitive và xóa tất cả dữ liệu liên quan
 * 
 * Usage: node scripts/delete-test-email-data-complete.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/order');
const User = require('../models/user');
const Tenant = require('../models/tenant');

const TEST_EMAILS = [
  'lammdde170681@fpt.edu.vn',
  'lamakakigarc@gmail.com'
];

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

async function deleteTestEmailDataComplete() {
  try {
    await connectDB();
    logSuccess('Đã kết nối database');
    console.log('');

    let totalDeleted = {
      users: 0,
      orders: 0,
      tenants: 0
    };

    // 1. Tìm và xóa Users (case-insensitive)
    logInfo('🔍 Đang tìm Users (case-insensitive)...');
    const userQuery = {
      $or: TEST_EMAILS.map(email => ({
        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }))
    };
    
    const users = await User.find(userQuery);
    
    if (users.length > 0) {
      logWarning(`Tìm thấy ${users.length} user(s) cần xóa:`);
      const tenantIdsFromUsers = [];
      
      for (const user of users) {
        console.log(`   - ${user.email} (${user.username}) - Tenant: ${user.tenant_id || 'N/A'}`);
        if (user.tenant_id && mongoose.Types.ObjectId.isValid(user.tenant_id)) {
          tenantIdsFromUsers.push(new mongoose.Types.ObjectId(user.tenant_id));
        }
      }
      
      const userDeleteResult = await User.deleteMany(userQuery);
      totalDeleted.users = userDeleteResult.deletedCount;
      logSuccess(`Đã xóa ${totalDeleted.users} user(s)`);
      
      // Lưu tenantIds để xóa sau
      const uniqueTenantIdsFromUsers = [...new Set(tenantIdsFromUsers.map(id => id.toString()))]
        .map(id => new mongoose.Types.ObjectId(id));
      
      // 2. Tìm và xóa Orders (case-insensitive)
      logInfo('🔍 Đang tìm Orders (case-insensitive)...');
      const orderQuery = {
        $or: [
          ...TEST_EMAILS.map(email => ({
            'contactPerson.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          })),
          ...TEST_EMAILS.map(email => ({
            'companyInfo.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }))
        ]
      };
      
      const orders = await Order.find(orderQuery);
      
      if (orders.length > 0) {
        logWarning(`Tìm thấy ${orders.length} order(s) cần xóa:`);
        const tenantIdsFromOrders = [];
        
        for (const order of orders) {
          console.log(`   - ${order.orderId} - ${order.contactPerson.email} - Status: ${order.status}`);
          if (order.tenantId && mongoose.Types.ObjectId.isValid(order.tenantId)) {
            tenantIdsFromOrders.push(new mongoose.Types.ObjectId(order.tenantId));
          }
        }
        
        const orderDeleteResult = await Order.deleteMany(orderQuery);
        totalDeleted.orders = orderDeleteResult.deletedCount;
        logSuccess(`Đã xóa ${totalDeleted.orders} order(s)`);
        
        // Tổng hợp tenantIds
        const allTenantIds = [...new Set([
          ...uniqueTenantIdsFromUsers.map(id => id.toString()),
          ...tenantIdsFromOrders.map(id => id.toString())
        ])].map(id => new mongoose.Types.ObjectId(id));
        
        // 3. Xóa Tenants (chỉ nếu không còn user nào)
        if (allTenantIds.length > 0) {
          logInfo(`🔍 Đang kiểm tra ${allTenantIds.length} tenant(s) liên quan...`);
          
          for (const tenantId of allTenantIds) {
            const tenant = await Tenant.findById(tenantId);
            if (!tenant) continue;
            
            // Kiểm tra xem tenant còn user nào không
            const remainingUsers = await User.countDocuments({ tenant_id: tenantId });
            
            if (remainingUsers === 0) {
              // Kiểm tra xem tenant có liên quan đến test emails không
              const tenantEmail = tenant.contact?.email?.toLowerCase();
              const isTestTenant = TEST_EMAILS.some(email => 
                tenantEmail === email.toLowerCase() ||
                tenant.name?.toLowerCase().includes('lam mai')
              );
              
              if (isTestTenant) {
                logWarning(`   Xóa tenant: ${tenant.name} (${tenant.tenant_code})`);
                await Tenant.deleteOne({ _id: tenantId });
                totalDeleted.tenants++;
              }
            } else {
              logInfo(`   Giữ lại tenant: ${tenant.name} - Còn ${remainingUsers} user(s)`);
            }
          }
          
          if (totalDeleted.tenants > 0) {
            logSuccess(`Đã xóa ${totalDeleted.tenants} tenant(s)`);
          }
        }
      } else {
        logInfo('Không tìm thấy order nào');
      }
    } else {
      logInfo('Không tìm thấy user nào');
      
      // Vẫn tìm và xóa orders nếu có
      logInfo('🔍 Đang tìm Orders (case-insensitive)...');
      const orderQuery = {
        $or: [
          ...TEST_EMAILS.map(email => ({
            'contactPerson.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          })),
          ...TEST_EMAILS.map(email => ({
            'companyInfo.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }))
        ]
      };
      
      const orders = await Order.find(orderQuery);
      if (orders.length > 0) {
        logWarning(`Tìm thấy ${orders.length} order(s) cần xóa`);
        const orderDeleteResult = await Order.deleteMany(orderQuery);
        totalDeleted.orders = orderDeleteResult.deletedCount;
        logSuccess(`Đã xóa ${totalDeleted.orders} order(s)`);
      } else {
        logInfo('Không tìm thấy order nào');
      }
    }

    console.log('');
    console.log('='.repeat(60));
    logSuccess('TÓM TẮT:');
    console.log(`   - Users đã xóa: ${totalDeleted.users}`);
    console.log(`   - Orders đã xóa: ${totalDeleted.orders}`);
    console.log(`   - Tenants đã xóa: ${totalDeleted.tenants}`);
    console.log('='.repeat(60));

  } catch (error) {
    logError(`Lỗi: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logInfo('Đã đóng kết nối database');
  }
}

console.log('🗑️  Script xóa dữ liệu test email (Complete)');
console.log('='.repeat(60));
console.log('Emails sẽ bị xóa:');
TEST_EMAILS.forEach(email => console.log(`   - ${email}`));
console.log('='.repeat(60));
console.log('');

deleteTestEmailDataComplete()
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

