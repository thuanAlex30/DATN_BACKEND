const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const Incident = require('../models/incident');
const Course = require('../models/course');
const PPECategory = require('../models/ppeCategory');
const Project = require('../models/project');
const AIService = require('./aiService');

class ChatbotService {
  // Knowledge base về hệ thống và an toàn lao động
  static systemKnowledge = {
    'hệ thống': {
      description: 'Hệ thống Quản lý An toàn Lao động là một nền tảng toàn diện để quản lý các hoạt động an toàn trong công ty.',
      features: [
        'Quản lý PPE (Thiết bị Bảo hộ Cá nhân)',
        'Quản lý Sự cố và Rủi ro',
        'Quản lý Đào tạo và Chứng chỉ',
        'Quản lý Dự án',
        'Quản lý Nhân sự và Phòng ban',
        'Báo cáo và Thống kê'
      ]
    },
    'ppe': {
      description: 'PPE (Personal Protective Equipment) - Thiết bị Bảo hộ Cá nhân bao gồm các thiết bị như mũ bảo hộ, kính, găng tay, giày bảo hộ, v.v.',
      features: [
        'Quản lý danh mục PPE',
        'Theo dõi tồn kho',
        'Phát và trả PPE cho nhân viên',
        'Thông báo khi PPE sắp hết hạn',
        'Báo cáo tình trạng PPE'
      ]
    },
    'sự cố': {
      description: 'Quản lý sự cố an toàn lao động, bao gồm ghi nhận, xử lý và theo dõi các sự cố.',
      features: [
        'Ghi nhận sự cố với mức độ nghiêm trọng',
        'Phân công xử lý sự cố',
        'Theo dõi tiến độ xử lý',
        'Lịch sử sự cố',
        'Báo cáo thống kê sự cố'
      ]
    },
    'đào tạo': {
      description: 'Quản lý các khóa đào tạo an toàn lao động và chứng chỉ của nhân viên.',
      features: [
        'Tạo và quản lý khóa đào tạo',
        'Đăng ký tham gia đào tạo',
        'Theo dõi tiến độ học tập',
        'Quản lý chứng chỉ',
        'Thông báo khi chứng chỉ sắp hết hạn'
      ]
    },
    'dự án': {
      description: 'Quản lý các dự án với các tính năng như quản lý milestone, tài nguyên, rủi ro, v.v.',
      features: [
        'Tạo và quản lý dự án',
        'Quản lý milestone và task',
        'Phân bổ tài nguyên',
        'Đánh giá và quản lý rủi ro',
        'Báo cáo tiến độ dự án'
      ]
    }
  };

  // Knowledge base về an toàn lao động
  static safetyKnowledge = {
    'an toàn lao động': {
      description: 'An toàn lao động là việc đảm bảo môi trường làm việc an toàn, lành mạnh cho người lao động.',
      principles: [
        'Luôn sử dụng PPE phù hợp',
        'Tuân thủ các quy trình an toàn',
        'Báo cáo ngay các sự cố hoặc rủi ro',
        'Tham gia đầy đủ các khóa đào tạo an toàn',
        'Kiểm tra thiết bị trước khi sử dụng'
      ]
    },
    'ppe bắt buộc': {
      description: 'Các loại PPE bắt buộc tùy thuộc vào môi trường làm việc:',
      types: [
        'Mũ bảo hộ - Bảo vệ đầu khỏi va đập',
        'Kính bảo hộ - Bảo vệ mắt khỏi bụi, hóa chất',
        'Găng tay - Bảo vệ tay khỏi hóa chất, nhiệt độ',
        'Giày bảo hộ - Bảo vệ chân khỏi va đập, trượt',
        'Áo phản quang - Tăng khả năng nhìn thấy',
        'Khẩu trang - Bảo vệ đường hô hấp'
      ]
    },
    'xử lý sự cố': {
      description: 'Quy trình xử lý sự cố an toàn lao động:',
      steps: [
        '1. Báo cáo ngay lập tức cho người phụ trách',
        '2. Sơ cứu nếu có người bị thương',
        '3. Cô lập khu vực nguy hiểm',
        '4. Ghi nhận chi tiết sự cố trong hệ thống',
        '5. Điều tra nguyên nhân',
        '6. Thực hiện biện pháp khắc phục',
        '7. Phòng ngừa tái diễn'
      ]
    }
  };

  // Phân tích câu hỏi và tìm câu trả lời phù hợp
  static async processMessage(userId, message, sessionId, userInfo = null) {
    try {
      const lowerMessage = message.toLowerCase().trim();
      
      // Lấy lịch sử chat để truyền vào AI
      const chatHistory = await this.getChatHistoryForAI(userId, sessionId);
      
      // Hàm fallback sử dụng knowledge base và database
      const fallbackHandler = async (userMsg) => {
        // Tìm kiếm trong knowledge base
        let response = this.findAnswerInKnowledgeBase(userMsg.toLowerCase().trim());
        
        // Nếu không tìm thấy và user đã đăng nhập, tìm kiếm trong database
        if (!response && userId) {
          response = await this.searchInDatabase(userId, userMsg.toLowerCase().trim());
        }
        
        // Nếu vẫn không tìm thấy, trả về câu trả lời mặc định
        if (!response) {
          response = this.getDefaultResponse(userMsg.toLowerCase().trim());
        }
        
        return response;
      };
      
      // Thử sử dụng AI service trước, fallback về knowledge base nếu không khả dụng
      let response;
      try {
        response = await AIService.getAIResponse(message, chatHistory, fallbackHandler, userInfo);
      } catch (error) {
        console.log('AI service error, using fallback:', error.message);
        // Nếu AI service lỗi, sử dụng fallback
        response = await fallbackHandler(message);
      }
      
      // Lưu lịch sử chat
      await this.saveChatHistory(userId, sessionId, message, response);
      
      return {
        success: true,
        response: response,
        sessionId: sessionId,
        aiEnabled: AIService.enableAI
      };
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      return {
        success: false,
        response: 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        sessionId: sessionId
      };
    }
  }

  // Lấy lịch sử chat để truyền vào AI service
  static async getChatHistoryForAI(userId, sessionId) {
    try {
      // Nếu chưa đăng nhập, chỉ lấy lịch sử theo sessionId
      const query = userId 
        ? { userId, sessionId }
        : { sessionId, userId: { $exists: false } }; // Session không có userId
      
      const chatHistory = await ChatHistory.findOne(query)
        .sort({ 'messages.timestamp': 1 });
      
      if (chatHistory && chatHistory.messages) {
        return chatHistory.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting chat history for AI:', error);
      return [];
    }
  }

  // Tìm câu trả lời trong knowledge base
  static findAnswerInKnowledgeBase(message) {
    // Tìm kiếm về hệ thống
    for (const [key, info] of Object.entries(this.systemKnowledge)) {
      if (message.includes(key)) {
        return this.formatSystemResponse(key, info);
      }
    }
    
    // Tìm kiếm về an toàn lao động
    for (const [key, info] of Object.entries(this.safetyKnowledge)) {
      if (message.includes(key)) {
        return this.formatSafetyResponse(key, info);
      }
    }
    
    // Câu hỏi cụ thể
    if (message.includes('làm thế nào') || message.includes('cách')) {
      if (message.includes('ppe') || message.includes('thiết bị bảo hộ')) {
        return 'Để sử dụng và quản lý PPE trong hệ thống, bạn cần thực hiện các bước sau:\n\n' +
               '1. Đăng nhập vào hệ thống với tài khoản của bạn\n' +
               '2. Vào mục "Quản lý PPE" trong menu chính\n' +
               '3. Xem danh sách PPE đã được phát cho bạn, bao gồm thông tin về loại PPE, ngày phát, và ngày hết hạn\n' +
               '4. Nếu cần PPE mới, bạn có thể:\n' +
               '   - Liên hệ trực tiếp với quản trị viên hoặc người phụ trách kho\n' +
               '   - Hoặc tạo yêu cầu trong hệ thống (nếu có quyền)\n' +
               '5. Khi trả PPE, bạn cần:\n' +
               '   - Chọn PPE cần trả từ danh sách\n' +
               '   - Điền thông tin tình trạng PPE (còn tốt, hỏng, mất, v.v.)\n' +
               '   - Gửi yêu cầu trả PPE\n\n' +
               'Lưu ý: Hệ thống sẽ tự động thông báo khi PPE của bạn sắp hết hạn, giúp bạn chủ động trong việc thay thế.';
      }
      if (message.includes('báo cáo sự cố') || message.includes('ghi nhận sự cố')) {
        return 'Để báo cáo sự cố an toàn lao động trong hệ thống, bạn cần làm theo các bước sau:\n\n' +
               '1. Đăng nhập vào hệ thống và vào mục "Quản lý Sự cố"\n' +
               '2. Chọn "Ghi nhận sự cố mới" hoặc "Báo cáo sự cố"\n' +
               '3. Điền đầy đủ thông tin bắt buộc:\n' +
               '   - Tiêu đề sự cố: Mô tả ngắn gọn về sự cố\n' +
               '   - Mô tả chi tiết: Mô tả đầy đủ về sự cố, bao gồm thời gian, địa điểm, nguyên nhân (nếu biết)\n' +
               '   - Vị trí xảy ra sự cố: Chọn hoặc nhập địa điểm cụ thể\n' +
               '   - Mức độ nghiêm trọng: Chọn từ các mức (Nhẹ, Trung bình, Nghiêm trọng, Rất nghiêm trọng)\n' +
               '   - Loại sự cố: Chọn loại phù hợp (Tai nạn, Sự cố gần như tai nạn, Tình trạng không an toàn, v.v.)\n' +
               '4. Đính kèm hình ảnh nếu có: Hình ảnh giúp minh họa rõ ràng hơn về sự cố\n' +
               '5. Xem lại thông tin và gửi báo cáo\n\n' +
               'Sau khi gửi, sự cố sẽ được chuyển đến người phụ trách để xử lý. Bạn có thể theo dõi tiến độ xử lý trong mục "Sự cố của tôi".';
      }
      if (message.includes('đăng ký đào tạo')) {
        return 'Để đăng ký tham gia các khóa đào tạo an toàn lao động, bạn thực hiện như sau:\n\n' +
               '1. Đăng nhập vào hệ thống và vào mục "Đào tạo" hoặc "Training"\n' +
               '2. Xem danh sách các khóa đào tạo có sẵn:\n' +
               '   - Hệ thống sẽ hiển thị các khóa đào tạo đang mở đăng ký\n' +
               '   - Mỗi khóa sẽ có thông tin về tên khóa, mô tả, thời lượng, ngày bắt đầu/kết thúc\n' +
               '3. Chọn khóa đào tạo phù hợp với nhu cầu của bạn\n' +
               '4. Xem chi tiết khóa học và nhấn nút "Đăng ký" hoặc "Tham gia"\n' +
               '5. Điền thông tin đăng ký (nếu có yêu cầu bổ sung)\n' +
               '6. Gửi đăng ký và chờ phê duyệt từ quản trị viên hoặc người phụ trách đào tạo\n\n' +
               'Sau khi được phê duyệt, bạn sẽ nhận được thông báo và có thể tham gia khóa học. Bạn cũng có thể theo dõi tiến độ học tập và xem chứng chỉ sau khi hoàn thành khóa học.';
      }
    }
    
    return null;
  }

  // Tìm kiếm trong database (chỉ khi đã đăng nhập)
  static async searchInDatabase(userId, message) {
    // Không tìm kiếm trong database nếu chưa đăng nhập
    if (!userId) {
      return null;
    }
    
    try {
      // Tìm kiếm sự cố của user
      if (message.includes('sự cố của tôi') || message.includes('incident của tôi')) {
        const incidents = await Incident.find({ createdBy: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('assignedTo', 'full_name')
          .lean();
        
        if (incidents.length > 0) {
          let response = 'Các sự cố gần đây của bạn:\n\n';
          incidents.forEach((incident, index) => {
            response += `${index + 1}. ${incident.title}\n`;
            response += `   - Trạng thái: ${incident.status}\n`;
            response += `   - Mức độ: ${incident.severity}\n`;
            response += `   - Ngày tạo: ${new Date(incident.createdAt).toLocaleDateString('vi-VN')}\n\n`;
          });
          return response;
        } else {
          return 'Bạn chưa có sự cố nào được ghi nhận.';
        }
      }
      
      // Tìm kiếm đào tạo
      if (message.includes('khóa đào tạo') || message.includes('training')) {
        const courses = await Course.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
        
        if (courses.length > 0) {
          let response = 'Các khóa đào tạo hiện có:\n\n';
          courses.forEach((course, index) => {
            response += `${index + 1}. ${course.course_name || 'N/A'}\n`;
            response += `   - Mô tả: ${course.description || 'N/A'}\n`;
            response += `   - Thời lượng: ${course.duration_hours ? course.duration_hours + ' giờ' : 'N/A'}\n\n`;
          });
          return response;
        }
      }
      
      // Tìm kiếm PPE categories
      if (message.includes('loại ppe') || message.includes('danh mục ppe')) {
        const categories = await PPECategory.find()
          .sort({ name: 1 })
          .limit(10)
          .lean();
        
        if (categories.length > 0) {
          let response = 'Các danh mục PPE trong hệ thống:\n\n';
          categories.forEach((cat, index) => {
            response += `${index + 1}. ${cat.name}\n`;
            if (cat.description) {
              response += `   - ${cat.description}\n`;
            }
            response += '\n';
          });
          return response;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error searching in database:', error);
      return null;
    }
  }

  // Câu trả lời mặc định
  static getDefaultResponse(message) {
    const greetings = ['xin chào', 'chào', 'hello', 'hi'];
    const thanks = ['cảm ơn', 'thank', 'thanks'];
    const goodbyes = ['tạm biệt', 'bye', 'goodbye'];
    
    if (greetings.some(g => message.includes(g))) {
      return 'Xin chào! Tôi là trợ lý ảo của hệ thống Quản lý An toàn Lao động. Rất vui được hỗ trợ bạn!\n\n' +
             'Tôi có thể giúp bạn với nhiều vấn đề khác nhau:\n\n' +
             '• Tìm hiểu về các tính năng của hệ thống: PPE, Quản lý Sự cố, Đào tạo, Dự án, Nhân sự\n' +
             '• Tư vấn về an toàn lao động: các nguyên tắc, quy trình, best practices\n' +
             '• Hướng dẫn sử dụng các chức năng: từng bước cụ thể để thực hiện các tác vụ\n' +
             '• Tìm kiếm thông tin: về PPE, sự cố, đào tạo, dự án trong hệ thống\n' +
             '• Giải đáp thắc mắc: về quy trình, quy định, cách sử dụng hệ thống\n\n' +
             'Bạn có thể hỏi tôi bất cứ điều gì liên quan đến hệ thống hoặc an toàn lao động. Ví dụ:\n' +
             '- "Làm thế nào để báo cáo sự cố?"\n' +
             '- "Các loại PPE nào cần thiết?"\n' +
             '- "Hệ thống có những tính năng gì?"\n\n' +
             'Bạn muốn biết gì? Hãy hỏi tôi nhé!';
    }
    
    if (thanks.some(t => message.includes(t))) {
      return 'Không có gì! Tôi rất vui được giúp đỡ bạn. Nếu có thắc mắc gì khác, đừng ngần ngại hỏi nhé!';
    }
    
    if (goodbyes.some(g => message.includes(g))) {
      return 'Tạm biệt! Chúc bạn một ngày làm việc an toàn. Nếu cần hỗ trợ, hãy quay lại nhé!';
    }
    
    return 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Để tôi có thể hỗ trợ bạn tốt hơn, bạn có thể hỏi tôi về:\n\n' +
           '📋 Các tính năng của hệ thống:\n' +
           '   • Quản lý PPE (Thiết bị Bảo hộ Cá nhân)\n' +
           '   • Quản lý Sự cố và Rủi ro\n' +
           '   • Quản lý Đào tạo và Chứng chỉ\n' +
           '   • Quản lý Dự án\n' +
           '   • Quản lý Nhân sự và Phòng ban\n\n' +
           '📖 Hướng dẫn sử dụng hệ thống:\n' +
           '   • Cách báo cáo sự cố\n' +
           '   • Cách đăng ký đào tạo\n' +
           '   • Cách sử dụng PPE\n' +
           '   • Cách quản lý dự án\n\n' +
           '🛡️ Thông tin về an toàn lao động:\n' +
           '   • Nguyên tắc an toàn lao động\n' +
           '   • Quy trình xử lý sự cố\n' +
           '   • Các loại PPE và cách sử dụng\n' +
           '   • Best practices trong an toàn lao động\n\n' +
           '💡 Ví dụ câu hỏi bạn có thể hỏi:\n' +
           '   • "Làm thế nào để báo cáo sự cố?"\n' +
           '   • "Hệ thống có những tính năng gì?"\n' +
           '   • "Các loại PPE nào cần thiết trong công trường?"\n' +
           '   • "Quy trình xử lý sự cố như thế nào?"\n\n' +
           'Hãy thử hỏi lại với câu hỏi cụ thể hơn nhé!';
  }

  // Format response cho hệ thống
  static formatSystemResponse(key, info) {
    let response = `${info.description}\n\n`;
    if (info.features) {
      response += 'Các tính năng chính:\n';
      info.features.forEach((feature, index) => {
        response += `${index + 1}. ${feature}\n`;
      });
    }
    return response;
  }

  // Format response cho an toàn lao động
  static formatSafetyResponse(key, info) {
    let response = `${info.description}\n\n`;
    if (info.principles) {
      response += 'Nguyên tắc:\n';
      info.principles.forEach((principle, index) => {
        response += `${index + 1}. ${principle}\n`;
      });
    }
    if (info.types) {
      info.types.forEach((type, index) => {
        response += `${index + 1}. ${type}\n`;
      });
    }
    if (info.steps) {
      info.steps.forEach((step) => {
        response += `${step}\n`;
      });
    }
    return response;
  }

  // Lưu lịch sử chat
  static async saveChatHistory(userId, sessionId, userMessage, assistantResponse) {
    try {
      // Nếu chưa đăng nhập, lưu với userId null hoặc không có userId
      const query = userId 
        ? { userId, sessionId }
        : { sessionId, userId: { $exists: false } };
      
      let chatHistory = await ChatHistory.findOne(query);
      
      if (!chatHistory) {
        chatHistory = new ChatHistory({
          userId: userId || undefined, // Không lưu userId nếu null
          sessionId,
          messages: []
        });
      }
      
      chatHistory.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      
      chatHistory.messages.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      });
      
      chatHistory.updatedAt = new Date();
      await chatHistory.save();
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // Lấy lịch sử chat
  static async getChatHistory(userId, sessionId) {
    try {
      const chatHistory = await ChatHistory.findOne({ userId, sessionId })
        .sort({ 'messages.timestamp': 1 });
      
      if (chatHistory) {
        return {
          success: true,
          messages: chatHistory.messages
        };
      }
      
      return {
        success: true,
        messages: []
      };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return {
        success: false,
        messages: []
      };
    }
  }

  // Xóa lịch sử chat
  static async clearChatHistory(userId, sessionId) {
    try {
      await ChatHistory.deleteOne({ userId, sessionId });
      return { success: true };
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return { success: false };
    }
  }
}

module.exports = ChatbotService;

