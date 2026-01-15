/**
 * Script test PayOS service
 * 
 * Usage: node scripts/test-payos.js
 */

require('dotenv').config();
const payosService = require('../services/payosService');

// Colors for console output
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

async function testPayOSConfig() {
  console.log('\n🚀 Bắt đầu test PayOS...\n');
  console.log('='.repeat(60));

  // Kiểm tra environment variables
  console.log('\n📋 Kiểm tra biến môi trường...\n');

  const requiredVars = {
    'PAYOS_CLIENT_ID': process.env.PAYOS_CLIENT_ID,
    'PAYOS_API_KEY': process.env.PAYOS_API_KEY,
    'PAYOS_CHECKSUM_KEY': process.env.PAYOS_CHECKSUM_KEY
  };

  let allValid = true;
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (value && !value.includes('your_') && !value.includes('your-')) {
      logSuccess(`${varName} = ${value.substring(0, 20)}...`);
    } else {
      logError(`${varName} chưa được cấu hình`);
      allValid = false;
    }
  }

  if (!allValid) {
    console.log('\n⚠️  Vui lòng cấu hình đầy đủ biến môi trường trong file .env');
    console.log('Xem hướng dẫn: DATN_BACKEND/docs/PAYOS_SETUP.md\n');
    process.exit(1);
  }

  // Test verify webhook
  console.log('\n🔐 Test verify webhook...\n');

  const testWebhookData = {
    data: {
      orderCode: 12345678,
      amount: 99000,
      description: 'Test order',
      status: 'PAID'
    },
    signature: 'test_signature'
  };

  try {
    const verifyResult = payosService.verifyWebhook(testWebhookData);
    if (verifyResult) {
      logInfo('PayOS verifyWebhook method hoạt động');
      logWarning('Signature sẽ fail vì đây là test data (bình thường)');
    }
  } catch (error) {
    logError(`Verify webhook error: ${error.message}`);
  }

  // Test tạo payment link (chỉ test nếu có credentials thật)
  console.log('\n💳 Test tạo payment link...\n');

  if (process.env.PAYOS_CLIENT_ID && 
      process.env.PAYOS_API_KEY && 
      process.env.PAYOS_CHECKSUM_KEY &&
      !process.env.PAYOS_CLIENT_ID.includes('your_')) {
    
    logInfo('Đang thử tạo payment link thật...');
    
    try {
      const testOrderId = `TEST-${Date.now()}`;
      const paymentResult = await payosService.createPaymentLink({
        orderId: testOrderId,
        amount: 1000, // 1000 VND cho test
        description: 'Test payment', // Tối đa 25 ký tự
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            price: 1000
          }
        ]
      });

      if (paymentResult.success) {
        logSuccess('Tạo payment link thành công!');
        logInfo(`Checkout URL: ${paymentResult.checkoutUrl.substring(0, 80)}...`);
        logInfo(`Order Code: ${paymentResult.orderCode}`);
        logInfo('Bạn có thể mở URL trên để test thanh toán');
      }
    } catch (error) {
      logError(`Tạo payment link thất bại: ${error.message}`);
      logWarning('Có thể do:');
      logWarning('  - Credentials chưa đúng');
      logWarning('  - Chưa tạo kênh kết nối trên PayOS Dashboard');
      logWarning('  - Network error');
    }
  } else {
    logWarning('Chưa có credentials thật, bỏ qua test tạo payment link');
    logInfo('Sau khi cấu hình credentials, chạy lại script này để test');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Tổng kết:\n');

  if (allValid) {
    logSuccess('PayOS service đã được cấu hình!');
    logInfo('Xem hướng dẫn chi tiết: DATN_BACKEND/docs/PAYOS_SETUP.md');
  } else {
    logError('PayOS chưa được cấu hình đầy đủ');
  }

  console.log('');
}

// Run tests
testPayOSConfig().catch(error => {
  console.error('\n❌ Lỗi khi chạy test:', error);
  process.exit(1);
});