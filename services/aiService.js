const axios = require('axios');

class AIService {
  // OpenAI Configuration
  static openaiApiKey = process.env.OPENAI_API_KEY;
  static openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  static openaiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  static enableAI = process.env.ENABLE_AI === 'true' && !!this.openaiApiKey;

  // System prompt cho chatbot
  static systemPrompt = `Bạn là một trợ lý ảo chuyên về an toàn lao động và hệ thống quản lý an toàn. 
Nhiệm vụ của bạn là:
1. Trả lời các câu hỏi về hệ thống quản lý an toàn lao động
2. Tư vấn về an toàn lao động, PPE, quy trình xử lý sự cố
3. Hướng dẫn người dùng sử dụng các tính năng của hệ thống
4. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp

Hệ thống bao gồm các module chính:
- Quản lý PPE (Thiết bị Bảo hộ Cá nhân)
- Quản lý Sự cố và Rủi ro
- Quản lý Đào tạo và Chứng chỉ
- Quản lý Dự án
- Quản lý Nhân sự và Phòng ban

Hãy trả lời ngắn gọn, rõ ràng và hữu ích.`;

  /**
   * Gọi OpenAI API để tạo phản hồi
   * @param {string} userMessage - Tin nhắn của người dùng
   * @param {Array} conversationHistory - Lịch sử hội thoại
   * @returns {Promise<string>} - Phản hồi từ AI
   */
  static async callOpenAI(userMessage, conversationHistory = []) {
    if (!this.enableAI) {
      throw new Error('AI service is not enabled or API key is missing');
    }

    try {
      // Chuẩn bị messages cho OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.slice(-10), // Chỉ lấy 10 tin nhắn gần nhất để tránh vượt quá token limit
        { role: 'user', content: userMessage }
      ];

      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.openaiModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim();
      }

      throw new Error('Invalid response from OpenAI API');
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('OpenAI API key không hợp lệ');
      } else if (error.response?.status === 429) {
        throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Kết nối đến AI service bị timeout');
      }
      
      throw error;
    }
  }

  /**
   * Gọi AI service với fallback
   * @param {string} userMessage - Tin nhắn của người dùng
   * @param {Array} conversationHistory - Lịch sử hội thoại
   * @param {Function} fallbackFunction - Hàm fallback nếu AI không khả dụng
   * @returns {Promise<string>} - Phản hồi từ AI hoặc fallback
   */
  static async getAIResponse(userMessage, conversationHistory = [], fallbackFunction = null) {
    if (!this.enableAI) {
      if (fallbackFunction) {
        return await fallbackFunction(userMessage);
      }
      throw new Error('AI service is not enabled');
    }

    try {
      // Chuyển đổi conversation history sang format OpenAI
      const formattedHistory = conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

      const aiResponse = await this.callOpenAI(userMessage, formattedHistory);
      return aiResponse;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      
      // Fallback về knowledge base nếu có
      if (fallbackFunction) {
        console.log('Falling back to knowledge base...');
        return await fallbackFunction(userMessage);
      }
      
      // Nếu không có fallback, trả về thông báo lỗi thân thiện
      return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với quản trị viên.';
    }
  }

  /**
   * Kiểm tra trạng thái AI service
   * @returns {Object} - Trạng thái của AI service
   */
  static getStatus() {
    return {
      enabled: this.enableAI,
      hasApiKey: !!this.openaiApiKey,
      model: this.openaiModel,
      baseUrl: this.openaiBaseUrl
    };
  }
}

module.exports = AIService;

