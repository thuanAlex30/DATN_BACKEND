const axios = require('axios');

class AIService {
  // AI Provider Configuration
  static aiProvider = 'gemini';
  static enableAI = process.env.ENABLE_AI === 'true' && !!process.env.GEMINI_API_KEY;

  // Gemini Configuration
  static geminiApiKey = process.env.GEMINI_API_KEY;
  static geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // gemini-2.5-flash, gemini-2.0-flash, gemini-flash-latest
  static geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  // System prompt cho chatbot
  static systemPrompt = `Bạn là trợ lý ảo chuyên về an toàn lao động. 

QUAN TRỌNG: Trả lời NGẮN GỌN, SÚC TÍCH - tối đa 2-3 câu cho câu hỏi đơn giản, 4-5 câu cho câu hỏi phức tạp. Không giải thích dài dòng, không lặp lại thông tin.

Nhiệm vụ:
- Trả lời câu hỏi về hệ thống quản lý an toàn lao động
- Tư vấn về PPE, quy trình xử lý sự cố
- Hướng dẫn sử dụng tính năng hệ thống


Trả lời bằng tiếng Việt, thân thiện, NGẮN GỌN.`;


  /**
   * Liệt kê các model có sẵn với API key hiện tại
   * @returns {Promise<Array>} - Danh sách các model có sẵn
   */
  static async listAvailableModels() {
    if (!this.geminiApiKey) {
      return [];
    }

    try {
      const apiVersions = ['v1beta', 'v1'];
      for (const apiVersion of apiVersions) {
        try {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${this.geminiApiKey}`;
          const response = await axios.get(url, { timeout: 10000 });
          if (response.data && response.data.models) {
            return response.data.models.map(m => m.name);
          }
        } catch (err) {
          continue;
        }
      }
      return [];
    } catch (error) {
      console.error('Error listing models:', error.message);
      return [];
    }
  }

  /**
   * Tạo system prompt dựa trên thông tin user
   * @param {Object} userInfo - Thông tin user
   * @returns {string} - System prompt
   */
  static buildSystemPrompt(userInfo = null) {
    const basePrompt = `Bạn là trợ lý ảo chuyên về an toàn lao động. 

QUAN TRỌNG: Trả lời NGẮN GỌN, SÚC TÍCH - tối đa 2-3 câu cho câu hỏi đơn giản, 4-5 câu cho câu hỏi phức tạp. Không giải thích dài dòng, không lặp lại thông tin.

Nhiệm vụ:
- Trả lời câu hỏi về hệ thống quản lý an toàn lao động
- Tư vấn về PPE, quy trình xử lý sự cố
- Hướng dẫn sử dụng tính năng hệ thống

Module chính: PPE, Sự cố, Đào tạo, Dự án, Nhân sự.`;

    // Kiểm tra quyền truy cập
    if (!userInfo || !userInfo.isAuthenticated) {
      return basePrompt + `\n\ BẢO MẬT: Người dùng CHƯA ĐĂNG NHẬP.

TUYỆT ĐỐI KHÔNG được trả lời các thông tin sau:
- Dữ liệu trong hệ thống (người dùng, nhân sự, dự án, sự cố, PPE, v.v.)
- Tài khoản, mật khẩu, thông tin đăng nhập
- Thông tin cá nhân của bất kỳ ai
- Báo cáo, thống kê nội bộ
- Bất kỳ thông tin nào chỉ khi đăng nhập mới xem được

CHỈ được trả lời:
- Hướng dẫn chung về hệ thống (cách sử dụng, tính năng)
- Thông tin công khai về an toàn lao động
- Câu hỏi lý thuyết, không liên quan đến dữ liệu cụ thể

Nếu người dùng hỏi về dữ liệu trong hệ thống, trả lời: "Để xem thông tin này, bạn cần đăng nhập vào hệ thống."`;
    }

    const userRole = userInfo.role || null;
    const isAdmin = userRole === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';
    const hasAccess = isAdmin || ['admin', 'manager', 'supervisor'].includes(userRole?.toLowerCase());

    if (hasAccess) {
      return basePrompt + `\n\n QUYỀN TRUY CẬP: Người dùng là ${userRole} - có quyền truy cập đầy đủ.
Có thể trả lời các thông tin về hệ thống, dữ liệu, báo cáo.`;
    } else {
      return basePrompt + `\n\n BẢO MẬT: Người dùng có role "${userRole}" - quyền hạn hạn chế.
KHÔNG được trả lời các thông tin nhạy cảm như:
- Chi tiết dữ liệu người dùng khác, nhân sự
- Thông tin sự cố, rủi ro của người khác
- Dữ liệu dự án, báo cáo nội bộ
- Thông tin chỉ Admin/Manager mới xem được

Chỉ trả lời thông tin công khai, hướng dẫn chung, hoặc thông tin của chính người dùng.`;
    }
  }

  /**
   * Gọi Gemini API để tạo phản hồi
   * @param {string} userMessage - Tin nhắn của người dùng
   * @param {Array} conversationHistory - Lịch sử hội thoại
   * @param {string} customSystemPrompt - System prompt tùy chỉnh (nếu có)
   * @returns {Promise<string>} - Phản hồi từ AI
   */
  static async callGemini(userMessage, conversationHistory = [], customSystemPrompt = null) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key is missing');
    }

    try {
      // Gemini sử dụng format khác với OpenAI
      // Cần kết hợp system prompt với conversation history
      const contents = [];
      
      // Sử dụng custom system prompt nếu có, nếu không dùng default
      const systemPromptToUse = customSystemPrompt || this.systemPrompt;
      
      // Thêm system prompt như một phần của conversation
      contents.push({
        role: 'user',
        parts: [{ text: systemPromptToUse }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Đã hiểu. Tôi sẽ trả lời các câu hỏi về hệ thống quản lý an toàn lao động bằng tiếng Việt, tuân thủ các quy tắc bảo mật đã được thiết lập.' }]
      });

      // Thêm lịch sử hội thoại (chỉ lấy 10 tin nhắn gần nhất)
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });

      // Thêm tin nhắn hiện tại
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const apiVersions = this.geminiModel.includes('1.5') ? ['v1', 'v1beta'] : ['v1beta', 'v1'];
      let lastError = null;
      
      for (const apiVersion of apiVersions) {
        try {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
          
          const response = await axios.post(
        url,
        {
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200, // Giảm từ 500 xuống 200 để trả lời ngắn gọn hơn
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 30000 // 30 seconds timeout
            }
          );

          if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const candidate = response.data.candidates[0];
            
            // Kiểm tra xem message có bị block bởi safety settings không
            if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
              const safetyMessage = candidate.finishReason === 'SAFETY' 
                ? 'Nội dung của bạn có thể vi phạm chính sách an toàn của Gemini. Vui lòng diễn đạt lại câu hỏi một cách lịch sự hơn.'
                : 'Nội dung của bạn có thể vi phạm chính sách bản quyền. Vui lòng diễn đạt lại câu hỏi.';
              console.warn(`Gemini API: Message bị block vì ${candidate.finishReason}`);
              throw new Error(safetyMessage);
            }
            
            // Kiểm tra xem có content không
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const text = candidate.content.parts[0].text;
              if (text && text.trim()) {
                console.log(`Gemini API thành công với ${apiVersion} và model ${this.geminiModel}`);
                return text.trim();
              }
            }
            
            // Log chi tiết response structure để debug
            console.error('Gemini API: Invalid response structure:', JSON.stringify({
              hasCandidates: !!response.data.candidates,
              candidatesLength: response.data.candidates?.length,
              candidateFinishReason: candidate?.finishReason,
              candidateContent: !!candidate?.content,
              candidateParts: candidate?.content?.parts?.length,
              safetyRatings: candidate?.safetyRatings
            }, null, 2));
            
            // Nếu có finishReason khác, trả về thông báo phù hợp
            if (candidate.finishReason) {
              throw new Error(`Gemini API: Response bị chặn với lý do: ${candidate.finishReason}`);
            }
            
            throw new Error('Gemini API: Response không chứa nội dung văn bản hợp lệ');
          }

          // Trường hợp không có candidates trong response
          console.error('Gemini API: Response không có candidates:', JSON.stringify({
            hasData: !!response.data,
            hasCandidates: !!response.data?.candidates,
            candidatesLength: response.data?.candidates?.length,
            fullResponse: response.data
          }, null, 2));
          
          throw new Error('Gemini API: Response không chứa candidates');
        } catch (versionError) {
          // Nếu lỗi 404, thử version tiếp theo
          if (versionError.response?.status === 404 && apiVersions.indexOf(apiVersion) < apiVersions.length - 1) {
            console.log(`Model ${this.geminiModel} không tìm thấy trong ${apiVersion}, thử version tiếp theo...`);
            lastError = versionError;
            continue;
          }
          // Nếu không phải lỗi 404 hoặc đã thử hết các version, throw error
          throw versionError;
        }
      }
      
      // Nếu đã thử hết các version mà vẫn lỗi
      if (lastError) {
        throw lastError;
      }
      throw new Error('Gemini API: Không thể kết nối đến service sau khi thử tất cả các API version');
    } catch (error) {
      // Log chi tiết lỗi để debug
      if (error.response) {
        console.error('Gemini API Error - Status:', error.response.status);
        console.error('Gemini API Error - Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Gemini API Error:', error.message);
        // Nếu error message có chứa thông tin về safety hoặc finishReason, giữ nguyên
        if (error.message.includes('SAFETY') || error.message.includes('bị block') || error.message.includes('vi phạm')) {
          throw error; // Giữ nguyên error message đã được xử lý
        }
      }
      
      // Xử lý các mã lỗi HTTP cụ thể
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.error?.message || 'Request không hợp lệ';
        throw new Error(`Gemini API: ${errorMsg}`);
      } else if (error.response?.status === 404) {
        const errorMsg = error.response?.data?.error?.message || 'Model không tồn tại';
        throw new Error(`Gemini API: ${errorMsg}. Model hiện tại: ${this.geminiModel}. Vui lòng kiểm tra lại model name trong .env`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = error.response?.data?.error?.message || 'API key không hợp lệ hoặc không có quyền truy cập';
        throw new Error(`Gemini API: ${errorMsg}`);
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API: Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Gemini API: Kết nối đến AI service bị timeout');
      }
      
      // Nếu error đã có message rõ ràng (từ phần xử lý response ở trên), giữ nguyên
      if (error.message && !error.message.includes('Invalid response from Gemini API')) {
        throw error;
      }
      
      // Mặc định throw error với message chi tiết hơn
      const errorMessage = error.message || 'Lỗi không xác định từ Gemini API';
      throw new Error(`Gemini API: ${errorMessage}`);
    }
  }

  /**
   * Gọi AI service với fallback (chỉ sử dụng Gemini)
   * @param {string} userMessage - Tin nhắn của người dùng
   * @param {Array} conversationHistory - Lịch sử hội thoại
   * @param {Function} fallbackFunction - Hàm fallback nếu AI không khả dụng
   * @param {Object} userInfo - Thông tin user (role, isAuthenticated, permissions)
   * @returns {Promise<string>} - Phản hồi từ AI hoặc fallback
   */
  static async getAIResponse(userMessage, conversationHistory = [], fallbackFunction = null, userInfo = null) {
    if (!this.enableAI) {
      if (fallbackFunction) {
        return await fallbackFunction(userMessage);
      }
      throw new Error('AI service is not enabled');
    }

    if (!this.geminiApiKey) {
      if (fallbackFunction) {
        return await fallbackFunction(userMessage);
      }
      throw new Error('Gemini API key is missing');
    }

    try {
      // Chuyển đổi conversation history
      const formattedHistory = conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

      // Tạo system prompt với thông tin user
      const systemPrompt = this.buildSystemPrompt(userInfo);
      
      const aiResponse = await this.callGemini(userMessage, formattedHistory, systemPrompt);
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
   * Kiểm tra trạng thái AI service (chỉ Gemini)
   * @returns {Object} - Trạng thái của AI service
   */
  static getStatus() {
    return {
      enabled: this.enableAI,
      provider: this.aiProvider,
      hasApiKey: !!this.geminiApiKey,
      model: this.geminiModel,
      baseUrl: this.geminiBaseUrl
    };
  }
}

module.exports = AIService;

