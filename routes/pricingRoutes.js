const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const PricingController = require('../controllers/pricingController');

// Rate limiting riêng cho pricing routes (giới hạn hợp lý cho thanh toán)
const pricingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // 20 requests/15 phút - đủ cho quá trình thanh toán bình thường
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP
    return req.user?.id || req.ip;
  }
});

// Rate limiting cho webhook - giới hạn cao hơn vì PayOS có thể gọi nhiều lần
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 requests/15 phút cho webhook
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  }
});

// Rate limiting cho order lookup - giới hạn vừa phải
const orderLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // 30 requests/15 phút
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// PayOS webhook - PHẢI ĐẶT TRƯỚC các route khác để tránh conflict
// Không cần authentication vì PayOS gọi từ server của họ
// Thêm logging middleware để debug
router.post('/payment-webhook', (req, res, next) => {
  console.log('🔔 [Webhook Route] Received POST /payment-webhook', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    body: req.body ? 'has body' : 'no body',
    contentType: req.headers['content-type'],
    ip: req.ip
  });
  next();
}, webhookLimiter, PricingController.paymentWebhook);

// PayOS returnUrl và cancelUrl - xử lý redirect từ PayOS
// PayOS sẽ redirect về các endpoint này sau khi thanh toán/hủy
// Không cần rate limit vì đây là user-initiated redirects
router.get('/payment-return', PricingController.paymentReturn);
router.get('/payment-cancel', PricingController.paymentCancel);

// Public routes - không cần authentication
router.post('/contract-preview', pricingLimiter, PricingController.generateContractPreview);
router.post('/orders', pricingLimiter, PricingController.createOrder);
router.get('/orders/:orderId', orderLookupLimiter, PricingController.getOrder);
router.post('/orders/:orderId/resend-email', pricingLimiter, PricingController.resendEmail);

module.exports = router;

