const contactMessageService = require('../services/contactMessageService');
const { createResponse } = require('../utils/response');

class ContactMessageController {
  static async createMessage(req, res) {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json(createResponse(400, 'Thiếu thông tin bắt buộc'));
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json(createResponse(400, 'Email không hợp lệ'));
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await contactMessageService.createContactMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        ipAddress,
        userAgent
      });

      return res.status(result.statusCode || 201).json(result);
    } catch (error) {
      console.error('Error creating contact message:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi gửi tin nhắn', null, error.message));
    }
  }

  static async getMessages(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        sortBy,
        sortOrder
      };

      const result = await contactMessageService.getContactMessages(options);
      return res.json(result);
    } catch (error) {
      console.error('Error getting contact messages:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi lấy danh sách tin nhắn', null, error.message));
    }
  }

  static async getMessageById(req, res) {
    try {
      const { id } = req.params;
      const result = await contactMessageService.getContactMessageById(id);
      
      if (result.statusCode === 404) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error getting contact message by ID:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi lấy thông tin tin nhắn', null, error.message));
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await contactMessageService.markAsRead(id);
      
      if (result.statusCode === 404) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error marking message as read:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi đánh dấu đã đọc', null, error.message));
    }
  }

  static async replyToMessage(req, res) {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!replyMessage || !replyMessage.trim()) {
        return res.status(400).json(createResponse(400, 'Vui lòng nhập nội dung trả lời'));
      }

      if (!userId) {
        return res.status(401).json(createResponse(401, 'Chưa đăng nhập'));
      }

      const result = await contactMessageService.replyToMessage(id, {
        replyMessage: replyMessage.trim(),
        repliedBy: userId
      });

      if (result.statusCode === 404) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error replying to message:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi trả lời tin nhắn', null, error.message));
    }
  }

  static async archiveMessage(req, res) {
    try {
      const { id } = req.params;
      const result = await contactMessageService.archiveMessage(id);
      
      if (result.statusCode === 404) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error archiving message:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi lưu trữ tin nhắn', null, error.message));
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const result = await contactMessageService.deleteMessage(id);
      
      if (result.statusCode === 404) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi xóa tin nhắn', null, error.message));
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const result = await contactMessageService.getUnreadCount();
      return res.json(result);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json(createResponse(500, 'Lỗi khi lấy số lượng tin nhắn chưa đọc', null, error.message));
    }
  }
}

module.exports = ContactMessageController;

