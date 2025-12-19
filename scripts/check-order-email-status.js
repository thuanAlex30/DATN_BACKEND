/**
 * Script để kiểm tra trạng thái đơn hàng và xem email có được gửi không
 * 
 * Usage: node scripts/check-order-email-status.js email@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/order');
const User = require('../models/user');
const TenantRepository = require('../repository/TenantRepository');

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

async function checkOrderEmailStatus(contactEmail) {
  try {
    // Kết nối database
    await connectDB();
    logSuccess('Đã kết nối database');

    // Tìm đơn hàng với email người liên hệ
    logInfo(`Đang tìm đơn hàng với email: ${contactEmail}...`);
    
    const orders = await Order.find({
      'contactPerson.email': contactEmail,
      status: 'paid'
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      logWarning(`Không tìm thấy đơn hàng đã thanh toán nào với email: ${contactEmail}`);
      return;
    }

    logSuccess(`Tìm thấy ${orders.length} đơn hàng đã thanh toán:`);
    console.log('');

    for (const order of orders) {
      console.log('='.repeat(60));
      console.log(`📦 Order ID: ${order.orderId}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Company: ${order.companyInfo.name}`);
      console.log(`   Plan: ${order.planType}`);
      console.log(`   Contact Email: ${order.contactPerson.email}`);
      console.log(`   Payment Date: ${order.paymentDate || 'N/A'}`);
      console.log('');

      // Kiểm tra tenant
      if (order.tenantId) {
        logInfo('   ✅ Order đã có Tenant');
        const tenant = await TenantRepository.findById(order.tenantId);
        if (tenant) {
          console.log(`      Tenant Name: ${tenant.name}`);
          console.log(`      Tenant Email: ${tenant.contact?.email || 'N/A'}`);
        }
      } else {
        logWarning('   ❌ Order chưa có Tenant - Có thể chưa được xử lý');
      }

      // Kiểm tra user
      if (order.userId) {
        logInfo('   ✅ Order đã có User');
        const user = await User.findById(order.userId);
        if (user) {
          console.log(`      User Email: ${user.email}`);
          console.log(`      Username: ${user.username}`);
          console.log(`      Full Name: ${user.full_name}`);
          console.log(`      Is Active: ${user.is_active}`);
        }
      } else {
        logWarning('   ❌ Order chưa có User - Có thể chưa được xử lý');
      }

      console.log('');
      logInfo('📧 Để gửi lại email, chạy:');
      console.log(`   node scripts/resend-email-by-email.js ${contactEmail}`);
      console.log('');
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
  console.log('Usage: node scripts/check-order-email-status.js email@example.com');
  console.log('Example: node scripts/check-order-email-status.js lamakakigarc@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  logError(`Email không hợp lệ: ${email}`);
  process.exit(1);
}

// Chạy script
checkOrderEmailStatus(email)
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

