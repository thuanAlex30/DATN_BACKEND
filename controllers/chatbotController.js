const chatbotService = require('../services/chatbotService');
const AIService = require('../services/aiService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { v4: uuidv4 } = require('uuid');

class ChatbotController {
  // Gửi tin nhắn và nhận phản hồi
  static sendMessage = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { message, sessionId } = req.body;
    const userId = req.user._id;
    
    if (!message || !message.trim()) {
      return ApiResponse.error(res, 'Tin nhắn không được để trống', 400);
    }
    
    // Tạo sessionId mới nếu chưa có
    const currentSessionId = sessionId || uuidv4();
    
    const result = await chatbotService.processMessage(userId, message, currentSessionId);
    
    if (result.success) {
      return ApiResponse.success(res, {
        response: result.response,
        sessionId: result.sessionId
      }, 'Tin nhắn đã được xử lý thành công', 200);
    } else {
      return ApiResponse.error(res, result.response || 'Có lỗi xảy ra khi xử lý tin nhắn', 500);
    }
  });

  // Lấy lịch sử chat
  static getChatHistory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { sessionId } = req.query;
    const userId = req.user._id;
    
    if (!sessionId) {
      return ApiResponse.error(res, 'SessionId là bắt buộc', 400);
    }
    
    const result = await chatbotService.getChatHistory(userId, sessionId);
    
    if (result.success) {
      return ApiResponse.success(res, {
        messages: result.messages,
        sessionId: sessionId
      }, 'Lấy lịch sử chat thành công', 200);
    } else {
      return ApiResponse.error(res, 'Có lỗi xảy ra khi lấy lịch sử chat', 500);
    }
  });

  // Xóa lịch sử chat
  static clearChatHistory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const userId = req.user._id;
    
    if (!sessionId) {
      return ApiResponse.error(res, 'SessionId là bắt buộc', 400);
    }
    
    const result = await chatbotService.clearChatHistory(userId, sessionId);
    
    if (result.success) {
      return ApiResponse.success(res, null, 'Xóa lịch sử chat thành công', 200);
    } else {
      return ApiResponse.error(res, 'Có lỗi xảy ra khi xóa lịch sử chat', 500);
    }
  });

  // Tạo session mới
  static createSession = ErrorMiddleware.asyncHandler(async (req, res) => {
    const sessionId = uuidv4();
    
    return ApiResponse.success(res, {
      sessionId: sessionId
    }, 'Tạo session mới thành công', 200);
  });

  // Lấy trạng thái AI service
  static getAIStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const status = AIService.getStatus();
    
    return ApiResponse.success(res, status, 'Lấy trạng thái AI service thành công', 200);
  });
}

module.exports = ChatbotController;

