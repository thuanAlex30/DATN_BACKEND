// Dummy notification functions for development

async function sendEmail(to, message) {
  console.log(`[EMAIL] To: ${to} | Message: ${message}`);
  // Here you can integrate with real email service
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
