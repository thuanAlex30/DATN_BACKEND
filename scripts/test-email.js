/**
 * Script test Nodemailer configuration
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
  console.log('\n📧 Kiểm tra cấu hình Nodemailer...\n');
  console.log('='.repeat(60));

  // Kiểm tra environment variables
  console.log('\n📋 Kiểm tra biến môi trường...\n');

  const requiredVars = {
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_USER': process.env.SMTP_USER,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD
  };

  let allValid = true;
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (value && !value.includes('your_') && !value.includes('your-')) {
      if (varName === 'SMTP_PASSWORD') {
        logSuccess(`${varName} = ${value.substring(0, 10)}...`);
      } else {
        logSuccess(`${varName} = ${value}`);
      }
    } else {
      logError(`${varName} chưa được cấu hình`);
      allValid = false;
    }
  }

  const optionalVars = {
    'SMTP_PORT': process.env.SMTP_PORT || '587',
    'SMTP_SECURE': process.env.SMTP_SECURE || 'false'
  };

  console.log('\nOptional:');
  for (const [varName, value] of Object.entries(optionalVars)) {
    logInfo(`${varName} = ${value}`);
  }

  if (!allValid) {
    console.log('\n⚠️  Vui lòng cấu hình đầy đủ biến môi trường trong file .env');
    console.log('Xem hướng dẫn: DATN_BACKEND/docs/NODEMAILER_SETUP.md\n');
    process.exit(1);
  }

  // Test connection
  console.log('\n🔌 Test kết nối SMTP...\n');

  try {
    logInfo('Đang kiểm tra kết nối SMTP...');
    await emailService.transporter.verify();
    logSuccess('SMTP connection verified - Credentials hợp lệ!');
  } catch (verifyError) {
    logError(`SMTP verify failed: ${verifyError.message}`);
    logWarning('Có thể do:');
    logWarning('  - Credentials sai');
    logWarning('  - Với Gmail, cần tạo App Password (không dùng mật khẩu thường)');
    logWarning('  - Firewall chặn port 587');
    logWarning('  - SMTP server không khả dụng');
    return false;
  }

  // Test gửi email
  const testEmail = process.argv[2] || process.env.SMTP_USER;

  if (!testEmail) {
    logWarning('Không có email để test. Sử dụng: node scripts/test-email.js your-email@example.com');
    return true;
  }

  console.log(`\n📨 Test gửi email đến: ${testEmail}\n`);

  try {
    logInfo('Đang gửi email test...');

    await emailService.sendAccountCredentials({
      to: testEmail,
      username: 'testuser',
      password: 'Test123!@#',
      companyName: 'Công ty Test',
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    });

    logSuccess('Email đã được gửi thành công!');
    logInfo(`Kiểm tra hộp thư đến của ${testEmail}`);
    logInfo('Nếu không thấy email, kiểm tra thư mục Spam/Junk');

    return true;
  } catch (error) {
    logError(`Gửi email thất bại: ${error.message}`);
    logWarning('Có thể do:');
    logWarning('  - Email không hợp lệ');
    logWarning('  - SMTP server từ chối gửi');
    logWarning('  - Rate limit');
    return false;
  }
}

// Run tests
testEmailConfig()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      logSuccess('🎉 Nodemailer đã được cấu hình và hoạt động!');
    } else {
      logWarning('⚠️  Cần kiểm tra lại cấu hình');
    }
    console.log('');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi khi chạy test:', error);
    process.exit(1);
  });

