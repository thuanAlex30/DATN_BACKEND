const express = require('express');
const rateLimit = require('express-rate-limit');
const ChatbotController = require('../controllers/chatbotController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const chatbotValidation = require('../validations/chatbotValidation');

const router = express.Router();

// Rate limiting riêng cho chatbot
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 50, // 50 requests/phút 
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi một chút rồi thử lại.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {

    return req.user?._id?.toString() || req.ip;
  }
});

// Routes cho phép optional auth (cho landing page)
// Gửi tin nhắn - cho phép dùng khi chưa đăng nhập
router.post('/message', 
  AuthMiddleware.optionalAuth,
  chatbotLimiter, 
  ValidationMiddleware.validateBody(chatbotValidation.sendMessage),
  ChatbotController.sendMessage
);

// Rate limiting riêng cho chatbot session (giới hạn thấp hơn để tránh spam)
const chatbotSessionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10, // 10 requests/phút để tránh tạo quá nhiều session
  message: {
    success: false,
    message: 'Bạn đã tạo quá nhiều session. Vui lòng đợi một chút rồi thử lại.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Tạo session mới - cho phép dùng khi chưa đăng nhập
router.post('/session', 
  AuthMiddleware.optionalAuth,
  chatbotSessionLimiter,
  ChatbotController.createSession
);

// Lấy trạng thái AI service - cho phép dùng khi chưa đăng nhập
router.get('/ai-status', 
  AuthMiddleware.optionalAuth,
  ChatbotController.getAIStatus
);

// Các routes sau yêu cầu đăng nhập (để lấy/xóa lịch sử)
router.use(AuthMiddleware.authenticate);

// Lấy lịch sử chat
router.get('/history', 
  ValidationMiddleware.validateQuery(chatbotValidation.sessionIdQuery),
  ChatbotController.getChatHistory
);

// Xóa lịch sử chat
router.delete('/history', 
  ValidationMiddleware.validateBody(chatbotValidation.sessionIdBody),
  ChatbotController.clearChatHistory
);


module.exports = router;

