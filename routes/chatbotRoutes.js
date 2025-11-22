const express = require('express');
const ChatbotController = require('../controllers/chatbotController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(AuthMiddleware.authenticate);

// Gửi tin nhắn
router.post('/message', ChatbotController.sendMessage);

// Lấy lịch sử chat
router.get('/history', ChatbotController.getChatHistory);

// Xóa lịch sử chat
router.delete('/history', ChatbotController.clearChatHistory);

// Tạo session mới
router.post('/session', ChatbotController.createSession);

// Lấy trạng thái AI service
router.get('/ai-status', ChatbotController.getAIStatus);

module.exports = router;

