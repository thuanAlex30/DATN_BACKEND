/**
 * Script để xóa dữ liệu test liên quan đến email
 * 
 * Usage: node scripts/delete-test-email-data.js
 * 
 * Xóa dữ liệu cho 2 email:
 * - LamMDDE170681@fpt.edu.vn
 * - Lamakakigarc@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/order');
const User = require('../models/user');
const Tenant = require('../models/tenant');

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

const TEST_EMAILS = [
  'LamMDDE170681@fpt.edu.vn',
  'lammdde170681@fpt.edu.vn', // lowercase
  'Lamakakigarc@gmail.com',
  'lamakakigarc@gmail.com' // lowercase
];

async function deleteTestEmailData() {
  try {
    // Kết nối database
    await connectDB();
    logSuccess('Đã kết nối database');
    console.log('');

    let totalDeleted = {
      users: 0,
      orders: 0,
      tenants: 0
    };

    // Khai báo biến để lưu tenantIds
    let tenantIdsFromUsers = [];
    let tenantIdsFromOrders = [];

    // 1. Tìm và xóa Users
    logInfo('🔍 Đang tìm Users...');
    const users = await User.find({
      email: { $in: TEST_EMAILS }
    });
    
    if (users.length > 0) {
      logWarning(`Tìm thấy ${users.length} user(s) cần xóa:`);
      for (const user of users) {
        console.log(`   - ${user.email} (${user.username}) - Tenant: ${user.tenant_id || 'N/A'}`);
      }
      
      // Lấy danh sách tenant_id từ users để xóa sau
      tenantIdsFromUsers = users
        .map(u => u.tenant_id)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      // Xóa users
      const userDeleteResult = await User.deleteMany({
        email: { $in: TEST_EMAILS }
      });
      totalDeleted.users = userDeleteResult.deletedCount;
      logSuccess(`Đã xóa ${totalDeleted.users} user(s)`);
    } else {
      logInfo('Không tìm thấy user nào');
    }
    console.log('');

    // 2. Tìm và xóa Orders
    logInfo('🔍 Đang tìm Orders...');
    const orders = await Order.find({
      $or: [
        { 'contactPerson.email': { $in: TEST_EMAILS } },
        { 'companyInfo.email': { $in: TEST_EMAILS } }
      ]
    });
    
    if (orders.length > 0) {
      logWarning(`Tìm thấy ${orders.length} order(s) cần xóa:`);
      for (const order of orders) {
        console.log(`   - ${order.orderId} - ${order.contactPerson.email} - Status: ${order.status}`);
      }
      
      // Lấy danh sách tenantId và userId từ orders
      tenantIdsFromOrders = orders
        .map(o => o.tenantId)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      const userIdsFromOrders = orders
        .map(o => o.userId)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      // Xóa orders
      const orderDeleteResult = await Order.deleteMany({
        $or: [
          { 'contactPerson.email': { $in: TEST_EMAILS } },
          { 'companyInfo.email': { $in: TEST_EMAILS } }
        ]
      });
      totalDeleted.orders = orderDeleteResult.deletedCount;
      logSuccess(`Đã xóa ${totalDeleted.orders} order(s)`);
    } else {
      logInfo('Không tìm thấy order nào');
    }
    console.log('');

    // 3. Tìm và xóa Tenants (chỉ xóa nếu không còn user nào khác)
    logInfo('🔍 Đang tìm Tenants liên quan...');
    
    // Tổng hợp tất cả tenantIds cần kiểm tra
    const allTenantIds = [
      ...tenantIdsFromUsers,
      ...tenantIdsFromOrders
    ].filter((id, index, self) => 
      index === self.findIndex(t => t.toString() === id.toString())
    );
    
    if (allTenantIds.length > 0) {
      logInfo(`Tìm thấy ${allTenantIds.length} tenant(s) liên quan`);
      
      for (const tenantId of allTenantIds) {
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) continue;
        
        // Kiểm tra xem tenant còn user nào khác không
        const remainingUsers = await User.countDocuments({ tenant_id: tenantId });
        
        if (remainingUsers === 0) {
          // Kiểm tra xem tenant có liên quan đến test emails không
          const isTestTenant = TEST_EMAILS.some(email => 
            tenant.contact?.email?.toLowerCase() === email.toLowerCase() ||
            tenant.name?.toLowerCase().includes('lam mai')
          );
          
          if (isTestTenant || allTenantIds.includes(tenantId)) {
            logWarning(`   Xóa tenant: ${tenant.name} (${tenant.tenant_code}) - Không còn user nào`);
            await Tenant.deleteOne({ _id: tenantId });
            totalDeleted.tenants++;
          } else {
            logInfo(`   Giữ lại tenant: ${tenant.name} - Có thể đang được sử dụng bởi user khác`);
          }
        } else {
          logInfo(`   Giữ lại tenant: ${tenant.name} - Còn ${remainingUsers} user(s)`);
        }
      }
      
      if (totalDeleted.tenants > 0) {
        logSuccess(`Đã xóa ${totalDeleted.tenants} tenant(s)`);
      } else {
        logInfo('Không có tenant nào cần xóa (còn user khác đang sử dụng)');
      }
    } else {
      logInfo('Không tìm thấy tenant nào liên quan');
    }
    console.log('');

    // Tóm tắt
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

// Chạy script
console.log('🗑️  Script xóa dữ liệu test email');
console.log('='.repeat(60));
console.log('Emails sẽ bị xóa:');
TEST_EMAILS.forEach(email => console.log(`   - ${email}`));
console.log('='.repeat(60));
console.log('');

deleteTestEmailData()
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

