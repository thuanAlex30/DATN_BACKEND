# Hướng dẫn Tích hợp AI Service cho Chatbot

## Tổng quan

Chatbot đã được tích hợp với khả năng sử dụng AI service (OpenAI) để nâng cao chất lượng phản hồi. Hệ thống có cơ chế fallback tự động về knowledge base nếu AI service không khả dụng.

## Cấu hình

### 1. Cài đặt Dependencies

Không cần cài thêm package, hệ thống sử dụng `axios` đã có sẵn.

### 2. Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# Bật/tắt AI service
ENABLE_AI=true

# OpenAI API Key (bắt buộc nếu ENABLE_AI=true)
OPENAI_API_KEY=sk-your-api-key-here

# OpenAI Base URL (tùy chọn, mặc định: https://api.openai.com/v1)
OPENAI_BASE_URL=https://api.openai.com/v1

# Model sử dụng (tùy chọn, mặc định: gpt-3.5-turbo)
# Có thể dùng: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. Lấy OpenAI API Key

1. Đăng ký tài khoản tại [OpenAI Platform](https://platform.openai.com/)
2. Tạo API key tại [API Keys](https://platform.openai.com/api-keys)
3. Copy API key và thêm vào file `.env`

### 4. Khởi động lại Server

Sau khi cấu hình, khởi động lại backend server:

```bash
npm start
# hoặc
npm run dev
```

## Cách hoạt động

### Luồng xử lý tin nhắn

1. **Người dùng gửi tin nhắn** → Chatbot nhận tin nhắn
2. **Lấy lịch sử chat** → Lấy 10 tin nhắn gần nhất để tạo context
3. **Gọi AI Service** (nếu được bật):
   - Gửi tin nhắn + lịch sử đến OpenAI API
   - Nhận phản hồi từ AI
4. **Fallback** (nếu AI không khả dụng):
   - Tìm kiếm trong knowledge base
   - Tìm kiếm trong database
   - Trả về câu trả lời mặc định
5. **Lưu lịch sử** → Lưu tin nhắn và phản hồi vào database

### System Prompt

Chatbot được cấu hình với system prompt chuyên về an toàn lao động:

```
Bạn là một trợ lý ảo chuyên về an toàn lao động và hệ thống quản lý an toàn.
Nhiệm vụ của bạn là:
1. Trả lời các câu hỏi về hệ thống quản lý an toàn lao động
2. Tư vấn về an toàn lao động, PPE, quy trình xử lý sự cố
3. Hướng dẫn người dùng sử dụng các tính năng của hệ thống
4. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
```

## API Endpoints

### 1. Gửi tin nhắn (với AI)

```http
POST /api/chatbot/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Làm thế nào để báo cáo sự cố?",
  "sessionId": "session-id"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "response": "Để báo cáo sự cố...",
    "sessionId": "session-id",
    "aiEnabled": true
  },
  "message": "Tin nhắn đã được xử lý thành công"
}
```

### 2. Kiểm tra trạng thái AI Service

```http
GET /api/chatbot/ai-status
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "hasApiKey": true,
    "model": "gpt-3.5-turbo",
    "baseUrl": "https://api.openai.com/v1"
  }
}
```

## Tùy chỉnh

### Thay đổi System Prompt

Chỉnh sửa file `DATN_BACKEND/services/aiService.js`:

```javascript
static systemPrompt = `Your custom system prompt here...`;
```

### Thay đổi Model

Có thể sử dụng các model khác:
- `gpt-3.5-turbo` (rẻ, nhanh)
- `gpt-4` (chất lượng cao hơn, đắt hơn)
- `gpt-4-turbo-preview` (mới nhất)

### Điều chỉnh Parameters

Trong `aiService.js`, có thể điều chỉnh:

```javascript
{
  temperature: 0.7,      // Độ sáng tạo (0-2)
  max_tokens: 500,       // Độ dài tối đa phản hồi
  top_p: 1,              // Diversity sampling
  frequency_penalty: 0,  // Tránh lặp lại
  presence_penalty: 0    // Khuyến khích chủ đề mới
}
```

## Troubleshooting

### AI Service không hoạt động

1. **Kiểm tra API Key**: Đảm bảo `OPENAI_API_KEY` đúng và hợp lệ
2. **Kiểm tra ENABLE_AI**: Phải set `ENABLE_AI=true`
3. **Kiểm tra logs**: Xem console để biết lỗi cụ thể
4. **Kiểm tra network**: Đảm bảo server có thể kết nối đến OpenAI API

### Lỗi 401 (Unauthorized)

- API key không hợp lệ hoặc đã hết hạn
- Kiểm tra lại API key tại OpenAI Platform

### Lỗi 429 (Rate Limit)

- Đã vượt quá giới hạn API
- Đợi một lúc rồi thử lại
- Nâng cấp plan tại OpenAI

### Timeout

- Tăng timeout trong `aiService.js`:
  ```javascript
  timeout: 60000 // 60 seconds
  ```

## Chi phí

### OpenAI Pricing (tính đến 2024)

- **gpt-3.5-turbo**: ~$0.002 per 1K tokens
- **gpt-4**: ~$0.03 per 1K tokens (input), ~$0.06 per 1K tokens (output)

### Ước tính chi phí

Với 1000 tin nhắn/ngày, mỗi tin nhắn ~500 tokens:
- gpt-3.5-turbo: ~$1/ngày
- gpt-4: ~$15-30/ngày

## Bảo mật

1. **Không commit API key**: Đảm bảo `.env` trong `.gitignore`
2. **Sử dụng environment variables**: Không hardcode API key
3. **Rate limiting**: Đã có rate limiting ở Express level
4. **Input validation**: Validate input trước khi gửi đến AI

## Tích hợp AI Service khác

Nếu muốn sử dụng AI service khác (Claude, Gemini, v.v.), chỉnh sửa `aiService.js`:

```javascript
static async callClaude(userMessage, conversationHistory) {
  // Implementation for Claude API
}

static async callGemini(userMessage, conversationHistory) {
  // Implementation for Gemini API
}
```

Sau đó cập nhật `getAIResponse` để chọn service phù hợp.

## Kết luận

Với tích hợp AI service, chatbot có thể:
- ✅ Trả lời câu hỏi phức tạp hơn
- ✅ Hiểu context từ lịch sử chat
- ✅ Tư vấn chuyên sâu về an toàn lao động
- ✅ Tự động fallback nếu AI không khả dụng
- ✅ Dễ dàng tùy chỉnh và mở rộng

