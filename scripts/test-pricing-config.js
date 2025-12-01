/**
 * Script kiểm tra cấu hình PayOS và Nodemailer cho Pricing
 * 
 * Usage: node scripts/test-pricing-config.js
 */

require('dotenv').config();
const emailService = require('../services/emailService');
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

async function checkEnvironmentVariables() {
  console.log('\n📋 Kiểm tra biến môi trường...\n');

  const requiredVars = {
    'PayOS': [
      'PAYOS_CLIENT_ID',
      'PAYOS_API_KEY',
      'PAYOS_CHECKSUM_KEY'
    ],
    'Nodemailer': [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD'
    ],
    'URLs': [
      'FRONTEND_URL',
      'BACKEND_URL'
    ]
  };

  let allValid = true;

  for (const [category, vars] of Object.entries(requiredVars)) {
    console.log(`${category}:`);
    for (const varName of vars) {
      const value = process.env[varName];
      if (value && value !== `your_${varName.toLowerCase()}` && !value.includes('your-')) {
        logSuccess(`${varName} = ${value.substring(0, 20)}...`);
      } else {
        logError(`${varName} chưa được cấu hình hoặc đang dùng giá trị mẫu`);
        allValid = false;
      }
    }
    console.log('');
  }

  // Optional variables
  console.log('Optional (có giá trị mặc định):');
  const optionalVars = {
    'PAYOS_BASE_URL': process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
    // PayOS yêu cầu returnUrl và cancelUrl trong API call (bắt buộc)
    // Nhưng business logic sẽ được xử lý bởi webhook, không phải return URL
    'PAYOS_RETURN_URL': process.env.PAYOS_RETURN_URL || `${process.env.FRONTEND_URL}/pricing/payment-success`,
    'PAYOS_CANCEL_URL': process.env.PAYOS_CANCEL_URL || `${process.env.FRONTEND_URL}/pricing/payment-cancelled`,
    'SMTP_PORT': process.env.SMTP_PORT || '587'
  };

  for (const [varName, value] of Object.entries(optionalVars)) {
    logInfo(`${varName} = ${value}`);
  }

  return allValid;
}

async function testPayOSConfig() {
  console.log('\n💳 Kiểm tra cấu hình PayOS...\n');

  try {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      logError('PayOS chưa được cấu hình đầy đủ');
      logWarning('Cần: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
      return false;
    }

    // Test verify webhook (không cần gọi API thật)
    const testWebhookData = {
      data: {
        orderCode: 12345678,
        amount: 99000,
        description: 'Test',
        status: 'PAID'
      },
      signature: 'test_signature'
    };

    const verifyResult = payosService.verifyWebhook(testWebhookData);
    
    if (verifyResult) {
      logSuccess('PayOS service đã được khởi tạo');
      logInfo(`Client ID: ${clientId.substring(0, 10)}...`);
      logInfo('Lưu ý: Cần test với API thật để xác nhận credentials');
      return true;
    } else {
      logError('PayOS service không hoạt động');
      return false;
    }
  } catch (error) {
    logError(`PayOS error: ${error.message}`);
    return false;
  }
}

async function testEmailConfig() {
  console.log('\n📧 Kiểm tra cấu hình Nodemailer...\n');

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      logError('Nodemailer chưa được cấu hình đầy đủ');
      return false;
    }

    // Test connection (không gửi email thật)
    logInfo('Đang kiểm tra kết nối SMTP...');
    
    // Verify transporter configuration
    const transporter = emailService.transporter;
    if (transporter) {
      logSuccess('Nodemailer transporter đã được khởi tạo');
      logInfo(`SMTP Host: ${smtpHost}`);
      logInfo(`SMTP User: ${smtpUser}`);
      
      // Test verify (optional - có thể fail nếu credentials sai)
      try {
        await transporter.verify();
        logSuccess('SMTP connection verified - Credentials hợp lệ!');
        return true;
      } catch (verifyError) {
        logWarning(`SMTP verify failed: ${verifyError.message}`);
        logWarning('Có thể do credentials sai hoặc cần bật "Less secure app access"');
        logInfo('Với Gmail, đảm bảo đã tạo App Password');
        return false;
      }
    } else {
      logError('Nodemailer transporter chưa được khởi tạo');
      return false;
    }
  } catch (error) {
    logError(`Email service error: ${error.message}`);
    return false;
  }
}

async function checkWebhookUrl() {
  console.log('\n🔗 Kiểm tra Webhook URL...\n');

  const webhookUrl = `${process.env.BACKEND_URL}/api/pricing/payment-webhook`;
  
  if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
    logWarning('Webhook URL đang dùng localhost - PayOS không thể gọi được!');
    logWarning('Cần sử dụng ngrok hoặc public URL để test');
    logInfo('Cách sử dụng ngrok:');
    logInfo('  1. npm install -g ngrok');
    logInfo('  2. ngrok http 3000');
    logInfo('  3. Copy URL và cấu hình trên PayOS Dashboard');
    return false;
  } else {
    logSuccess(`Webhook URL: ${webhookUrl}`);
    logInfo('Đảm bảo URL này đã được cấu hình trên PayOS Dashboard');
    return true;
  }
}

async function main() {
  console.log('\n🚀 Bắt đầu kiểm tra cấu hình Pricing...\n');
  console.log('='.repeat(60));

  const results = {
    env: false,
      payos: false,
    email: false,
    ipn: false
  };

  // Check environment variables
  results.env = await checkEnvironmentVariables();

  if (!results.env) {
    console.log('\n⚠️  Vui lòng cấu hình đầy đủ biến môi trường trước khi tiếp tục!');
    console.log('Xem file env.example để biết các biến cần thiết.\n');
    process.exit(1);
  }

  // Test PayOS
  results.payos = await testPayOSConfig();

  // Test Email
  results.email = await testEmailConfig();

  // Check Webhook URL
  results.webhook = await checkWebhookUrl();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Tổng kết:\n');

  const allPassed = Object.values(results).every(r => r);

  if (results.env) logSuccess('Environment Variables: OK');
  else logError('Environment Variables: FAILED');

  if (results.payos) logSuccess('PayOS Configuration: OK');
  else logError('PayOS Configuration: FAILED');

  if (results.email) logSuccess('Email Configuration: OK');
  else logWarning('Email Configuration: Cần kiểm tra lại (có thể vẫn hoạt động)');

  if (results.webhook) logSuccess('Webhook URL: OK');
  else logWarning('Webhook URL: Cần public URL để PayOS có thể gọi webhook');

  console.log('');

  if (allPassed) {
    logSuccess('🎉 Tất cả cấu hình đều OK! Bạn có thể sử dụng chức năng Pricing.');
  } else {
    logWarning('⚠️  Một số cấu hình cần được sửa. Xem chi tiết ở trên.');
    logInfo('Xem thêm: DATN_BACKEND/docs/PRICING_SETUP.md');
  }

  console.log('');
}

// Run tests
main().catch(error => {
  console.error('\n❌ Lỗi khi chạy test:', error);
  process.exit(1);
});

