# Chatbot AI - Hướng dẫn nhanh

## Bật AI Service (OpenAI)

### Bước 1: Thêm API Key vào .env

```env
ENABLE_AI=true
OPENAI_API_KEY=sk-your-api-key-here
```

### Bước 2: Khởi động lại server

```bash
npm start
```

### Bước 3: Kiểm tra trạng thái

```bash
GET /api/chatbot/ai-status
```

## Không dùng AI (Chỉ Knowledge Base)

Nếu không muốn dùng AI, chỉ cần:

```env
ENABLE_AI=false
```

Hệ thống sẽ tự động sử dụng knowledge base và database search.

## Lấy OpenAI API Key

1. Truy cập: https://platform.openai.com/api-keys
2. Tạo API key mới
3. Copy và paste vào `.env`

## Chi phí ước tính

- **gpt-3.5-turbo**: ~$0.002/1K tokens (~$1/ngày cho 1000 tin nhắn)
- **gpt-4**: ~$0.03-0.06/1K tokens (~$15-30/ngày)

Xem chi tiết tại: `docs/AI_INTEGRATION.md`

