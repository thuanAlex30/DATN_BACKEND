const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if email is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP not configured. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} text - Email plain text content (optional)
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendEmail(to, subject, html, text = null) {
  if (!transporter) {
    console.log(`[EMAIL - DISABLED] To: ${to} | Subject: ${subject}`);
    return { success: false, message: 'Email service not configured' };
  }

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hệ Thống Quản Lý An Toàn Lao Động'}" <${smtpFrom}>`,
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
      html: html,
    });

    console.log(`✅ [EMAIL] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL] Error sending to ${to}:`, error);
    throw error;
  }
}

async function sendSMS(to, message) {
  console.log(`[SMS] To: ${to} | Message: ${message}`);
  // Here you can integrate with real SMS service
}

async function sendNotification(to, message) {
  console.log(`[NOTIFICATION] To: ${to} | Message: ${message}`);
  // Here you can integrate with real notification service
}

module.exports = {
  sendEmail,
  sendSMS,
  sendNotification
};
