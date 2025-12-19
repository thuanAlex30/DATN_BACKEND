/**
 * Script test Resend Email API configuration
 *
 * Usage: node scripts/test-email.js [email]
 * Example: node scripts/test-email.js test@example.com
 */

require('dotenv').config();
const emailService = require('../services/emailService');

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

async function testEmailConfig() {
  console.log('\n📧 Kiểm tra cấu hình Resend...\n');
  console.log('='.repeat(60));

  // Kiểm tra environment variables
  console.log('\n📋 Kiểm tra biến môi trường...\n');

  const requiredVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY
  };

  const optionalVars = {
    RESEND_FROM: process.env.RESEND_FROM
  };

  let allValid = true;
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (value && !value.includes('your_') && !value.includes('your-')) {
      logSuccess(`${varName} = ${value.substring(0, 8)}...`);
    } else {
      logError(`${varName} chưa được cấu hình`);
      allValid = false;
    }
  }

  console.log('\nOptional:');
  for (const [varName, value] of Object.entries(optionalVars)) {
    if (value) {
      logSuccess(`${varName} = ${value}`);
    } else {
      logWarning(`${varName} chưa được cấu hình (sẽ dùng: no-reply@huynhthuan30.id.vn)`);
    }
  }

  if (!allValid) {
    console.log('\n⚠️  Vui lòng cấu hình đầy đủ biến môi trường trong file .env:');
    console.log('    RESEND_API_KEY (bắt buộc)');
    console.log('    RESEND_FROM (khuyến nghị - ví dụ: no-reply@huynhthuan30.id.vn)\n');
    process.exit(1);
  }

  // Test gửi email
  const testEmail = process.argv[2] || process.env.TEST_EMAIL;

  if (!testEmail) {
    logWarning('Không có email để test. Dùng:');
    logWarning('  node scripts/test-email.js your-email@example.com');
    return true;
  }

  console.log(`\n📨 Test gửi email đến: ${testEmail}\n`);

  try {
    logInfo('Đang gửi email test qua Resend...');

    await emailService.sendAccountCredentials({
      to: testEmail,
      username: 'testuser',
      password: 'Test123!@#',
      companyName: 'Công ty Test',
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    });

    logSuccess('Email đã được gửi thành công qua Resend!');
    logInfo(`Kiểm tra hộp thư đến của ${testEmail}`);
    logInfo('Nếu không thấy email, kiểm tra thư mục Spam/Junk');

    return true;
  } catch (error) {
    logError(`Gửi email thất bại: ${error.message}`);
    logWarning('Có thể do:');
    logWarning('  - RESEND_API_KEY sai hoặc chưa active');
    logWarning('  - Domain huynhthuan30.id.vn chưa được verify trong Resend Dashboard');
    logWarning('  - DNS records (DKIM, SPF) chưa được cấu hình đúng');
    logWarning('  - Email người nhận không hợp lệ');
    logWarning('  - Resend đang rate limit / lỗi tạm thời');
    return false;
  }
}

// Run tests
testEmailConfig()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      logSuccess('🎉 Resend Email API đã được cấu hình và hoạt động!');
    } else {
      logWarning('⚠️  Cần kiểm tra lại cấu hình Resend');
    }
    console.log('');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi khi chạy test:', error);
    process.exit(1);
  });

