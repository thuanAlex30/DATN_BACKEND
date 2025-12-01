/**
 * Script để xóa dữ liệu của một email cụ thể
 * Usage: node scripts/delete-specific-email.js <email>
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

async function deleteSpecificEmail() {
  try {
    const email = process.argv[2];
    if (!email) {
      logError('Vui lòng cung cấp email cần xóa');
      console.log('Usage: node scripts/delete-specific-email.js <email>');
      process.exit(1);
    }

    await connectDB();
    logSuccess('Đã kết nối database');
    console.log('');

    logInfo(`🔍 Đang tìm và xóa dữ liệu cho email: ${email}`);
    console.log('');

    let deletedCount = {
      users: 0,
      orders: 0,
      tenants: 0
    };

    // 1. Tìm và xóa Users (case-insensitive)
    logInfo('🔍 Đang tìm Users...');
    const users = await User.find({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { username: { $regex: new RegExp(`^${email.split('@')[0]}$`, 'i') } }
      ]
    });

    if (users.length > 0) {
      logWarning(`Tìm thấy ${users.length} user(s)`);
      
      // Lấy danh sách tenant_id từ users
      const tenantIds = users
        .map(u => u.tenant_id)
        .filter(id => id)
        .map(id => id.toString ? id.toString() : id);

      // Xóa users
      const userDeleteResult = await User.deleteMany({
        _id: { $in: users.map(u => u._id) }
      });
      deletedCount.users = userDeleteResult.deletedCount;
      logSuccess(`Đã xóa ${deletedCount.users} user(s)`);

      // 2. Tìm và xóa Tenants (nếu có)
      if (tenantIds.length > 0) {
        logInfo('🔍 Đang tìm Tenants...');
        const tenants = await Tenant.find({
          _id: { $in: tenantIds }
        });

        if (tenants.length > 0) {
          logWarning(`Tìm thấy ${tenants.length} tenant(s)`);
          
          // Kiểm tra xem tenant có user nào khác không
          for (const tenant of tenants) {
            const otherUsers = await User.find({
              tenant_id: tenant._id,
              _id: { $nin: users.map(u => u._id) }
            });

            if (otherUsers.length === 0) {
              // Không có user nào khác, có thể xóa tenant
              await Tenant.findByIdAndDelete(tenant._id);
              deletedCount.tenants++;
              logSuccess(`Đã xóa tenant: ${tenant.name} (${tenant._id})`);
            } else {
              logWarning(`Giữ lại tenant: ${tenant.name} (có ${otherUsers.length} user khác)`);
            }
          }
        }
      }
    } else {
      logInfo('Không tìm thấy user nào');
    }

    // 3. Tìm và xóa Orders (case-insensitive)
    logInfo('🔍 Đang tìm Orders...');
    const orders = await Order.find({
      $or: [
        { 'contactPerson.email': { $regex: new RegExp(`^${email}$`, 'i') } },
        { 'companyInfo.email': { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (orders.length > 0) {
      logWarning(`Tìm thấy ${orders.length} order(s)`);
      
      // Lấy danh sách tenant_id từ orders
      const orderTenantIds = orders
        .map(o => o.tenantId)
        .filter(id => id)
        .map(id => id.toString ? id.toString() : id);

      // Xóa orders
      const orderDeleteResult = await Order.deleteMany({
        _id: { $in: orders.map(o => o._id) }
      });
      deletedCount.orders = orderDeleteResult.deletedCount;
      logSuccess(`Đã xóa ${deletedCount.orders} order(s)`);

      // Kiểm tra và xóa tenants từ orders (nếu không còn user nào)
      if (orderTenantIds.length > 0) {
        for (const tenantId of orderTenantIds) {
          const tenant = await Tenant.findById(tenantId);
          if (tenant) {
            const usersInTenant = await User.find({ tenant_id: tenantId });
            if (usersInTenant.length === 0) {
              await Tenant.findByIdAndDelete(tenantId);
              deletedCount.tenants++;
              logSuccess(`Đã xóa tenant từ order: ${tenant.name} (${tenantId})`);
            }
          }
        }
      }
    } else {
      logInfo('Không tìm thấy order nào');
    }

    console.log('');
    console.log('='.repeat(60));
    logSuccess('TÓM TẮT:');
    console.log(`   - Users đã xóa: ${deletedCount.users}`);
    console.log(`   - Orders đã xóa: ${deletedCount.orders}`);
    console.log(`   - Tenants đã xóa: ${deletedCount.tenants}`);
    console.log('='.repeat(60));
    console.log('');

    await mongoose.disconnect();
    logSuccess('Hoàn thành!');
  } catch (error) {
    logError(`Lỗi: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

deleteSpecificEmail();

