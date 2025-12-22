const contactMessageRepository = require('../repository/ContactMessageRepository');
const { createResponse } = require('../utils/response');
const emailService = require('./emailService');

class ContactMessageService {
  async createContactMessage(data) {
    try {
      const contactMessage = await contactMessageRepository.create(data);
      return createResponse(201, 'Tin nhắn đã được gửi thành công', contactMessage);
    } catch (error) {
      console.error('Error creating contact message:', error);
      throw error;
    }
  }

  async getContactMessages(options = {}) {
    try {
      const result = await contactMessageRepository.findAll(options);
      return createResponse(200, 'Lấy danh sách tin nhắn thành công', result);
    } catch (error) {
      console.error('Error getting contact messages:', error);
      throw error;
    }
  }

  async getContactMessageById(id) {
    try {
      const message = await contactMessageRepository.findById(id);
      if (!message) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }
      return createResponse(200, 'Lấy thông tin tin nhắn thành công', message);
    } catch (error) {
      console.error('Error getting contact message by ID:', error);
      throw error;
    }
  }

  async markAsRead(id) {
    try {
      const message = await contactMessageRepository.markAsRead(id);
      if (!message) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }
      return createResponse(200, 'Đã đánh dấu đã đọc', message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async replyToMessage(id, replyData) {
    try {
      // Get the original message first to get user email
      const originalMessage = await contactMessageRepository.findById(id);
      if (!originalMessage) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }

      // Update message with reply
      const message = await contactMessageRepository.markAsReplied(id, replyData);
      if (!message) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }

      // Send email to user
      try {
        const emailSubject = `Re: ${originalMessage.subject}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1890ff;">Phản hồi từ Hệ Thống Quản Lý An Toàn Lao Động</h2>
            <p>Xin chào <strong>${originalMessage.name}</strong>,</p>
            <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi cho tin nhắn của bạn:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #1890ff; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${replyData.replyMessage}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 20px 0;">
            <div style="color: #666; font-size: 12px;">
              <p><strong>Tin nhắn gốc của bạn:</strong></p>
              <p><strong>Tiêu đề:</strong> ${originalMessage.subject}</p>
              <p><strong>Nội dung:</strong></p>
              <p style="white-space: pre-wrap;">${originalMessage.message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Đây là email tự động, vui lòng không trả lời email này.<br>
              Nếu bạn có thắc mắc, vui lòng liên hệ lại qua trang web của chúng tôi.
            </p>
          </div>
        `;

        await emailService._sendEmail({ to: originalMessage.email, subject: emailSubject, html: emailHtml });
        console.log(`✅ Email reply sent to ${originalMessage.email} via Resend`);
      } catch (emailError) {
        // Log error but don't fail the reply operation
        console.error('Error sending reply email via Resend:', emailError);
        // Continue even if email fails
      }

      return createResponse(200, 'Đã trả lời tin nhắn thành công', message);
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  }

  async archiveMessage(id) {
    try {
      const message = await contactMessageRepository.archive(id);
      if (!message) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }
      return createResponse(200, 'Đã lưu trữ tin nhắn', message);
    } catch (error) {
      console.error('Error archiving message:', error);
      throw error;
    }
  }

  async deleteMessage(id) {
    try {
      const message = await contactMessageRepository.delete(id);
      if (!message) {
        return createResponse(404, 'Không tìm thấy tin nhắn');
      }
      return createResponse(200, 'Đã xóa tin nhắn thành công');
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const count = await contactMessageRepository.getUnreadCount();
      return createResponse(200, 'Lấy số lượng tin nhắn chưa đọc thành công', { count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = new ContactMessageService();

