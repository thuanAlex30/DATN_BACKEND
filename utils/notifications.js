// Use Resend via services/emailService for sending emails
const emailService = require('../services/emailService');

/**
 * Send email using Resend (via services/emailService)
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {string|null} text
 */
async function sendEmail(to, subject, html, text = null) {
  try {
    const result = await emailService._sendEmail({ to, subject, html });
    // Resend SDK returns an object; normalize to messageId if present
    const messageId = result?.id || result?.messageId || null;
    console.log(`✅ [EMAIL - Resend] Sent to ${to}: ${messageId || '[no id]'}`);
    return { success: true, messageId };
  } catch (error) {
    console.error(`❌ [EMAIL - Resend] Error sending to ${to}:`, error);
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
