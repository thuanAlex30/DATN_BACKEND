/**
 * Script test PayOS với log chi tiết
 * 
 * Usage: node scripts/test-payos-detailed.js
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

function logDetail(message) {
  console.log(`${colors.cyan}📋 ${message}${colors.reset}`);
}

async function testPayOSDetailed() {
  console.log('\n🔍 Test PayOS với log chi tiết...\n');
  console.log('='.repeat(70));

  // Kiểm tra credentials
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  const baseUrl = process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn';
  const returnUrl = process.env.PAYOS_RETURN_URL || 'http://localhost:5173/pricing/payment-success';
  const cancelUrl = process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/pricing/payment-cancelled';

  logDetail('\n📋 Credentials:');
  console.log(`  Client ID: ${clientId ? `${clientId.substring(0, 20)}...` : 'MISSING'}`);
  console.log(`  API Key: ${apiKey ? `${apiKey.substring(0, 20)}...` : 'MISSING'}`);
  console.log(`  Checksum Key: ${checksumKey ? `${checksumKey.substring(0, 20)}...` : 'MISSING'}`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Return URL: ${returnUrl}`);
  console.log(`  Cancel URL: ${cancelUrl}`);

  if (!clientId || !apiKey || !checksumKey) {
    logError('Thiếu credentials!');
    process.exit(1);
  }

  // Tạo test order
  const testOrderId = `TEST-${Date.now()}`;
  let orderCode = parseInt(testOrderId.replace(/\D/g, ''));
  if (!orderCode || orderCode.toString().length > 8) {
    orderCode = Date.now() % 100000000;
  }
  orderCode = parseInt(orderCode.toString().padStart(8, '0').substring(0, 8));

  const paymentDataPayload = {
    orderCode: orderCode,
    amount: 1000,
    description: 'Test payment - PayOS integration',
    items: [
      {
        name: 'Test Item',
        quantity: 1,
        price: 1000
      }
    ],
    cancelUrl: cancelUrl,
    returnUrl: returnUrl
  };

  logDetail('\n📋 Request Payload:');
  console.log(JSON.stringify(paymentDataPayload, null, 2));

  const headers = {
    'x-client-id': clientId,
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  };

  logDetail('\n📋 Request Headers:');
  console.log(JSON.stringify({
    'x-client-id': `${clientId.substring(0, 20)}...`,
    'x-api-key': `${apiKey.substring(0, 20)}...`,
    'Content-Type': 'application/json'
  }, null, 2));

  const url = `${baseUrl}/v2/payment-requests`;
  logDetail(`\n📋 Request URL: ${url}`);

  try {
    logInfo('\n🚀 Đang gửi request đến PayOS...\n');
    
    const response = await axios.post(url, paymentDataPayload, { headers });

    logSuccess('✅ Request thành công!');
    logDetail('\n📋 Response Status:');
    console.log(`  ${response.status} ${response.statusText}`);
    
    logDetail('\n📋 Response Headers:');
    console.log(JSON.stringify(response.headers, null, 2));
    
    logDetail('\n📋 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === '00') {
      logSuccess('\n✅ Payment link đã được tạo thành công!');
      console.log(`  Checkout URL: ${response.data.data.checkoutUrl}`);
      console.log(`  Order Code: ${orderCode}`);
    } else {
      logWarning(`\n⚠️  Response code: ${response.data?.code || 'N/A'}`);
      logWarning(`  Description: ${response.data?.desc || 'N/A'}`);
    }
  } catch (error) {
    logError('\n❌ Request thất bại!');
    
    if (error.response) {
      logDetail('\n📋 Response Status:');
      console.log(`  ${error.response.status} ${error.response.statusText}`);
      
      logDetail('\n📋 Response Headers:');
      console.log(JSON.stringify(error.response.headers, null, 2));
      
      logDetail('\n📋 Response Data:');
      if (error.response.data) {
        console.log(JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('  (No response data)');
      }
      
      logDetail('\n📋 Request Payload (đã gửi):');
      console.log(JSON.stringify(paymentDataPayload, null, 2));
      
      logDetail('\n📋 Request Headers (đã gửi):');
      console.log(JSON.stringify({
        'x-client-id': `${clientId.substring(0, 20)}...`,
        'x-api-key': `${apiKey.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      }, null, 2));
    } else if (error.request) {
      logError('  Không nhận được response từ PayOS');
      logDetail('\n📋 Request Info:');
      console.log(`  URL: ${url}`);
      console.log(`  Method: POST`);
      console.log(`  Error: ${error.message}`);
    } else {
      logError(`  Error: ${error.message}`);
    }
    
    logWarning('\n💡 Gợi ý:');
    logWarning('  1. Kiểm tra PayOS Dashboard - Kênh kết nối có đang "Hoạt động" không?');
    logWarning('  2. Kiểm tra Webhook URL đã được cấu hình chưa?');
    logWarning('  3. Kiểm tra Return URL và Cancel URL có hợp lệ không?');
    logWarning('  4. Liên hệ PayOS Support nếu vẫn lỗi');
    
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('');
}

// Run test
testPayOSDetailed().catch(error => {
  console.error('\n❌ Lỗi khi chạy test:', error);
  process.exit(1);
});

