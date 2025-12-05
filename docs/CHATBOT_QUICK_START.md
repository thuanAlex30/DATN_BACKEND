# Chatbot AI - Hướng dẫn nhanh

## Bật AI Service

Hệ thống hỗ trợ 2 AI providers: **OpenAI** và **Google Gemini**

### Bước 1: Chọn AI Provider và thêm API Key vào .env

#### Option 1: Sử dụng OpenAI

```env
ENABLE_AI=true
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

#### Option 2: Sử dụng Google Gemini

```env
ENABLE_AI=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
```

### Bước 2: Khởi động lại server

```bash
npm start
```

### Bước 3: Kiểm tra trạng thái

```bash
GET /api/chatbot/ai-status
```

Response sẽ hiển thị:
- Provider đang sử dụng
- Trạng thái cấu hình của OpenAI và Gemini
- Model đang được sử dụng

## Tính năng Fallback

Hệ thống tự động có fallback:
- Nếu provider chính lỗi → tự động chuyển sang provider dự phòng
- Nếu cả 2 AI đều lỗi → fallback về Knowledge Base

## Không dùng AI (Chỉ Knowledge Base)

Nếu không muốn dùng AI, chỉ cần:

```env
ENABLE_AI=false
```

Hệ thống sẽ tự động sử dụng knowledge base và database search.

## Lấy API Keys

### OpenAI API Key

1. Truy cập: https://platform.openai.com/api-keys
2. Tạo API key mới
3. Copy và paste vào `.env`

### Google Gemini API Key

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Chọn "Get API key" → "Create API key"
4. Copy và paste vào `.env`

## Chi phí ước tính

### OpenAI
- **gpt-3.5-turbo**: ~$0.002/1K tokens (~$1/ngày cho 1000 tin nhắn)
- **gpt-4**: ~$0.03-0.06/1K tokens (~$15-30/ngày)

### Google Gemini
- **gemini-pro**: Miễn phí với giới hạn (60 requests/phút)
- **gemini-pro** (paid): ~$0.00025/1K characters input, ~$0.0005/1K characters output

## Cấu hình nâng cao

Bạn có thể cấu hình cả 2 providers cùng lúc để có fallback tự động:

```env
ENABLE_AI=true
AI_PROVIDER=openai  # Provider chính
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...  # Fallback provider
```

Khi OpenAI lỗi, hệ thống tự động chuyển sang Gemini.

Xem chi tiết tại: `docs/AI_INTEGRATION.md`

