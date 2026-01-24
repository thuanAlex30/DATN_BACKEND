# Tài Liệu Chatbot AI - Hệ Thống Quản Lý An Toàn Lao Động

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Cấu Hình](#cấu-hình)
4. [API Endpoints](#api-endpoints)
5. [Cách Sử Dụng](#cách-sử-dụng)
6. [Knowledge Base](#knowledge-base)
7. [AI Service (Gemini)](#ai-service-gemini)
8. [Frontend Component](#frontend-component)
9. [Ví Dụ Sử Dụng](#ví-dụ-sử-dụng)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng Quan

Chatbot AI là một trợ lý ảo thông minh được tích hợp vào hệ thống Quản lý An toàn Lao động, giúp người dùng:

- **Tư vấn và hướng dẫn** về các tính năng của hệ thống
- **Trả lời câu hỏi** về an toàn lao động, quy trình, quy định
- **Tìm kiếm thông tin** trong database (khi đã đăng nhập)
- **Hỗ trợ người dùng** sử dụng hệ thống hiệu quả hơn

### Tính Năng Chính

✅ **Hỗ trợ AI với Google Gemini** - Sử dụng mô hình AI tiên tiến để trả lời câu hỏi  
✅ **Knowledge Base tích hợp** - Cơ sở tri thức về hệ thống và an toàn lao động  
✅ **Tìm kiếm Database** - Truy vấn dữ liệu thực tế khi người dùng đã đăng nhập  
✅ **Lịch sử Chat** - Lưu trữ và quản lý lịch sử hội thoại  
✅ **Hỗ trợ đa ngôn ngữ** - Trả lời bằng tiếng Việt  
✅ **Bảo mật theo Role** - Phân quyền truy cập thông tin dựa trên role của user  
✅ **Hoạt động không cần đăng nhập** - Có thể sử dụng trên landing page  

---

## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Thư Mục

```
DATN_BACKEND/
├── controllers/
│   └── chatbotController.js      # Controller xử lý requests
├── services/
│   ├── chatbotService.js          # Logic xử lý chatbot (knowledge base, database search)
│   └── aiService.js               # Service tích hợp Google Gemini AI
├── models/
│   └── ChatHistory.js            # Model lưu trữ lịch sử chat
├── routes/
│   └── chatbotRoutes.js          # Định nghĩa API routes
└── validations/
    └── chatbotValidation.js      # Validation cho requests

DATN_FONTEND/
└── src/
    ├── components/
    │   └── Chatbot/
    │       ├── Chatbot.tsx        # React component chính
    │       └── Chatbot.css        # Styles
    └── services/
        └── chatbotService.ts      # Frontend service gọi API
```

### Luồng Xử Lý

```
User Input
    ↓
Frontend (Chatbot.tsx)
    ↓
API Request → /api/chatbot/message
    ↓
chatbotController.sendMessage()
    ↓
chatbotService.processMessage()
    ↓
┌─────────────────────────┐
│  AI Service (Gemini)    │ ← Primary (nếu enabled)
│  OR                      │
│  Fallback Handler       │ ← Fallback (knowledge base + database)
└─────────────────────────┘
    ↓
Save to ChatHistory
    ↓
Return Response
```

### Components Chính

#### 1. **ChatbotController** (`controllers/chatbotController.js`)
- Xử lý HTTP requests từ frontend
- Quản lý session và authentication
- Trả về responses theo format chuẩn

#### 2. **ChatbotService** (`services/chatbotService.js`)
- Xử lý logic nghiệp vụ chính
- Quản lý Knowledge Base
- Tìm kiếm trong database
- Lưu trữ lịch sử chat

#### 3. **AIService** (`services/aiService.js`)
- Tích hợp Google Gemini API
- Xử lý system prompt và conversation history
- Fallback khi AI không khả dụng

#### 4. **ChatHistory Model** (`models/ChatHistory.js`)
- Lưu trữ lịch sử hội thoại
- Hỗ trợ multi-session
- Indexed cho performance

---

## ⚙️ Cấu Hình

### Environment Variables

Thêm các biến sau vào file `.env`:

```env
# Bật/tắt AI service
ENABLE_AI=true

# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
# Options: 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'
```

### Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập với tài khoản Google
3. Tạo API key mới
4. Copy và paste vào `.env`

### Cấu Hình Model

Hệ thống hỗ trợ các model Gemini sau:

- `gemini-2.5-flash` (mặc định) - Nhanh, hiệu quả
- `gemini-2.0-flash` - Phiên bản 2.0
- `gemini-flash-latest` - Phiên bản mới nhất

### Rate Limiting

Chatbot có rate limiting riêng để tránh spam:

- **Message endpoint**: 50 requests/phút
- **Session endpoint**: 10 requests/phút

---

## 🔌 API Endpoints

### Base URL
```
/api/chatbot
```

### 1. Gửi Tin Nhắn

**POST** `/api/chatbot/message`

**Authentication**: Optional (có thể dùng khi chưa đăng nhập)

**Request Body**:
```json
{
  "message": "Làm thế nào để báo cáo sự cố?",
  "sessionId": "uuid-session-id" // Optional, sẽ tự tạo nếu không có
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Tin nhắn đã được xử lý thành công",
  "data": {
    "response": "Để báo cáo sự cố an toàn lao động...",
    "sessionId": "uuid-session-id"
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Có lỗi xảy ra khi xử lý tin nhắn"
}
```

### 2. Tạo Session Mới

**POST** `/api/chatbot/session`

**Authentication**: Optional

**Response**:
```json
{
  "success": true,
  "message": "Tạo session mới thành công",
  "data": {
    "sessionId": "uuid-session-id"
  }
}
```

### 3. Lấy Lịch Sử Chat

**GET** `/api/chatbot/history?sessionId=uuid-session-id`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Lấy lịch sử chat thành công",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "Xin chào",
        "timestamp": "2024-01-23T10:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Xin chào! Tôi là trợ lý ảo...",
        "timestamp": "2024-01-23T10:00:01.000Z"
      }
    ],
    "sessionId": "uuid-session-id"
  }
}
```

### 4. Xóa Lịch Sử Chat

**DELETE** `/api/chatbot/history`

**Authentication**: Required

**Request Body**:
```json
{
  "sessionId": "uuid-session-id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Xóa lịch sử chat thành công"
}
```

### 5. Lấy Trạng Thái AI Service

**GET** `/api/chatbot/ai-status`

**Authentication**: Optional

**Response**:
```json
{
  "success": true,
  "message": "Lấy trạng thái AI service thành công",
  "data": {
    "enabled": true,
    "provider": "gemini",
    "hasApiKey": true,
    "model": "gemini-2.5-flash",
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta"
  }
}
```

---

## 📖 Cách Sử Dụng

### Frontend Integration

#### 1. Import Component

```tsx
import Chatbot from '@/components/Chatbot/Chatbot';
```

#### 2. Sử Dụng Component

```tsx
function App() {
  return (
    <div>
      {/* Your app content */}
      <Chatbot />
    </div>
  );
}
```

### Backend Integration

#### 1. Gọi API Trực Tiếp

```javascript
const axios = require('axios');

// Gửi tin nhắn
const response = await axios.post('/api/chatbot/message', {
  message: 'Làm thế nào để báo cáo sự cố?',
  sessionId: 'your-session-id'
});

console.log(response.data.data.response);
```

#### 2. Sử Dụng Service

```javascript
const chatbotService = require('./services/chatbotService');

const result = await chatbotService.processMessage(
  userId,
  'Xin chào',
  sessionId,
  userInfo
);

console.log(result.response);
```

---

## 📚 Knowledge Base

Chatbot có sẵn Knowledge Base về:

### 1. Hệ Thống

- **PPE (Thiết bị Bảo hộ Cá nhân)**: Quản lý danh mục, tồn kho, phát/trả PPE
- **Sự Cố**: Ghi nhận, xử lý, theo dõi sự cố an toàn lao động
- **Đào Tạo**: Quản lý khóa đào tạo, chứng chỉ
- **Dự Án**: Quản lý milestone, tài nguyên, rủi ro
- **Nhân Sự**: Quản lý phòng ban, nhân viên

### 2. An Toàn Lao Động

- **Nguyên tắc an toàn lao động**
- **PPE bắt buộc**: Các loại thiết bị bảo hộ cần thiết
- **Quy trình xử lý sự cố**: 7 bước xử lý sự cố

### 3. Pricing (Gói Dịch Vụ)

Chatbot có thể tư vấn về 3 gói dịch vụ:

1. **Gói Tháng** (5,000 VND/tháng)
   - Tối đa 50 nhân viên
   - Tính năng cơ bản
   - Backup hàng tháng

2. **Gói Quý** (12,000 VND/quý)
   - Tối đa 50 nhân viên
   - Tính năng cơ bản + nâng cao
   - Backup hàng tuần
   - Tiết kiệm 20%

3. **Gói Năm** (55,000 VND/năm)
   - Không giới hạn nhân viên
   - Tất cả tính năng cao cấp
   - Backup hàng ngày
   - Hỗ trợ 24/7
   - Tiết kiệm 8.33%

### Mở Rộng Knowledge Base

Để thêm kiến thức mới, chỉnh sửa file `services/chatbotService.js`:

```javascript
static systemKnowledge = {
  'từ khóa mới': {
    description: 'Mô tả về chủ đề',
    features: [
      'Tính năng 1',
      'Tính năng 2'
    ]
  }
};
```

---

## 🤖 AI Service (Gemini)

### System Prompt

Chatbot sử dụng system prompt chi tiết để:

- Định hướng AI trả lời về an toàn lao động
- Cung cấp thông tin về các module hệ thống
- Áp dụng quy tắc bảo mật dựa trên role của user
- Đảm bảo trả lời chi tiết và hữu ích

### Conversation History

- Lưu trữ **10 tin nhắn gần nhất** để duy trì ngữ cảnh
- Tự động format theo chuẩn Gemini API
- Hỗ trợ multi-turn conversation

### Bảo Mật Theo Role

#### User Chưa Đăng Nhập
- ❌ Không được trả lời về dữ liệu trong hệ thống
- ❌ Không được trả lời về thông tin cá nhân
- ✅ Chỉ trả lời hướng dẫn chung, thông tin công khai

#### User Đã Đăng Nhập
- **Admin/Manager**: Có quyền truy cập đầy đủ
- **User thường**: Quyền hạn hạn chế, chỉ xem thông tin của mình

### Fallback Mechanism

Khi AI không khả dụng, hệ thống tự động fallback:

1. **Knowledge Base** - Tìm trong cơ sở tri thức tích hợp
2. **Database Search** - Tìm kiếm trong database (nếu đã đăng nhập)
3. **Default Response** - Trả về câu trả lời mặc định

### Error Handling

- **API Key không hợp lệ**: Fallback về knowledge base
- **Rate limit exceeded**: Thông báo lỗi thân thiện
- **Network timeout**: Retry hoặc fallback
- **Safety filter**: Thông báo nội dung vi phạm chính sách

---

## 🎨 Frontend Component

### Component Structure

```tsx
<Chatbot>
  ├── ChatButton (Floating button)
  ├── ChatWindow (Modal/Drawer)
  │   ├── ChatHeader
  │   ├── MessagesList
  │   │   ├── UserMessage
  │   │   └── AssistantMessage
  │   └── InputArea
  │       ├── TextArea
  │       └── SendButton
  └── Session Management
```

### Features

- ✅ **Auto-scroll** - Tự động scroll đến tin nhắn mới nhất
- ✅ **Loading indicator** - Hiển thị khi đang xử lý
- ✅ **Session management** - Tự động tạo và quản lý session
- ✅ **History persistence** - Lưu lịch sử chat
- ✅ **Responsive design** - Hoạt động tốt trên mobile
- ✅ **Animation** - Smooth transitions với Framer Motion

### State Management

```typescript
interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  inputMessage: string;
  loading: boolean;
  sessionId: string | null;
}
```

### Session Lifecycle

1. **Component Mount** → Tạo session mới (nếu chưa có)
2. **User Login** → Clear lịch sử, tạo session mới
3. **User Logout** → Clear lịch sử, reset session
4. **Session Expired** → Tự động tạo session mới

---

## 💡 Ví Dụ Sử Dụng

### Ví Dụ 1: Hỏi Về Tính Năng Hệ Thống

**User**: "Hệ thống có những tính năng gì?"

**Chatbot**: 
```
Hệ thống Quản lý An toàn Lao động là một nền tảng toàn diện để quản lý các hoạt động an toàn trong công ty.

Các tính năng chính:
1. Quản lý PPE (Thiết bị Bảo hộ Cá nhân)
2. Quản lý Sự cố và Rủi ro
3. Quản lý Đào tạo và Chứng chỉ
4. Quản lý Dự án
5. Quản lý Nhân sự và Phòng ban
6. Báo cáo và Thống kê
```

### Ví Dụ 2: Hướng Dẫn Báo Cáo Sự Cố

**User**: "Làm thế nào để báo cáo sự cố?"

**Chatbot**:
```
Để báo cáo sự cố an toàn lao động trong hệ thống, bạn cần làm theo các bước sau:

1. Đăng nhập vào hệ thống và vào mục "Quản lý Sự cố"
2. Chọn "Ghi nhận sự cố mới" hoặc "Báo cáo sự cố"
3. Điền đầy đủ thông tin bắt buộc:
   - Tiêu đề sự cố: Mô tả ngắn gọn về sự cố
   - Mô tả chi tiết: Mô tả đầy đủ về sự cố...
   ...
```

### Ví Dụ 3: Tư Vấn Gói Dịch Vụ

**User**: "Có những gói dịch vụ nào?"

**Chatbot**:
```
Hệ thống cung cấp 3 gói dịch vụ với các mức giá và tính năng khác nhau:

1. GÓI THÁNG (5,000 VND/tháng):
   - Quản lý tối đa 50 nhân viên
   - Tất cả tính năng cơ bản...
   ...

2. GÓI QUÝ (12,000 VND/quý - tiết kiệm 20%):
   ...

3. GÓI NĂM (55,000 VND/năm - tiết kiệm 8.33%):
   ...
```

### Ví Dụ 4: Tìm Kiếm Database (Khi Đã Đăng Nhập)

**User**: "Sự cố của tôi là gì?"

**Chatbot** (nếu user đã đăng nhập):
```
Các sự cố gần đây của bạn:

1. Sự cố va chạm tại công trường A
   - Trạng thái: Đang xử lý
   - Mức độ: Trung bình
   - Ngày tạo: 23/01/2024

2. Sự cố rơi vật liệu
   - Trạng thái: Đã xử lý
   - Mức độ: Nhẹ
   - Ngày tạo: 20/01/2024
```

---

## 🔧 Troubleshooting

### Lỗi: "AI service is not enabled"

**Nguyên nhân**: `ENABLE_AI=false` hoặc không có `GEMINI_API_KEY`

**Giải pháp**:
1. Kiểm tra file `.env`
2. Đảm bảo `ENABLE_AI=true`
3. Thêm `GEMINI_API_KEY` hợp lệ

### Lỗi: "Gemini API key is missing"

**Nguyên nhân**: API key chưa được cấu hình

**Giải pháp**:
1. Lấy API key từ [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Thêm vào `.env`: `GEMINI_API_KEY=your-key-here`
3. Restart server

### Lỗi: "Model không tồn tại"

**Nguyên nhân**: Model name không đúng

**Giải pháp**:
1. Kiểm tra `GEMINI_MODEL` trong `.env`
2. Sử dụng một trong các model hợp lệ:
   - `gemini-2.5-flash`
   - `gemini-2.0-flash`
   - `gemini-flash-latest`

### Lỗi: "Rate limit exceeded"

**Nguyên nhân**: Gửi quá nhiều requests trong thời gian ngắn

**Giải pháp**:
- Đợi 1 phút rồi thử lại
- Giảm tần suất gửi tin nhắn

### Chatbot không trả lời đúng

**Nguyên nhân**: 
- AI service lỗi và fallback về knowledge base
- Knowledge base không có thông tin

**Giải pháp**:
1. Kiểm tra logs để xem AI service có hoạt động không
2. Mở rộng knowledge base trong `chatbotService.js`
3. Kiểm tra system prompt trong `aiService.js`

### Session không được lưu

**Nguyên nhân**: 
- Database connection issue
- ChatHistory model error

**Giải pháp**:
1. Kiểm tra MongoDB connection
2. Kiểm tra logs để xem có lỗi khi save không
3. Verify ChatHistory model schema

### Frontend không kết nối được

**Nguyên nhân**: 
- API endpoint sai
- CORS issue
- Authentication issue

**Giải pháp**:
1. Kiểm tra API base URL trong frontend config
2. Kiểm tra CORS settings trong backend
3. Verify authentication middleware

---

## 📝 Best Practices

### 1. System Prompt
- Giữ system prompt chi tiết và rõ ràng
- Cập nhật khi có tính năng mới
- Test với nhiều câu hỏi khác nhau

### 2. Knowledge Base
- Thêm keywords phổ biến
- Cập nhật thông tin định kỳ
- Format response dễ đọc

### 3. Error Handling
- Luôn có fallback mechanism
- Log errors để debug
- Thông báo lỗi thân thiện với user

### 4. Performance
- Giới hạn conversation history (10 messages)
- Cache responses nếu có thể
- Optimize database queries

### 5. Security
- Validate user input
- Sanitize responses
- Rate limiting
- Role-based access control

---

## 🔄 Cập Nhật & Bảo Trì

### Cập Nhật Knowledge Base

1. Mở `services/chatbotService.js`
2. Thêm/sửa trong `systemKnowledge` hoặc `safetyKnowledge`
3. Test với các câu hỏi liên quan
4. Deploy

### Cập Nhật System Prompt

1. Mở `services/aiService.js`
2. Sửa `systemPrompt` hoặc `buildSystemPrompt()`
3. Test với nhiều scenarios
4. Deploy

### Thêm Tính Năng Mới

1. Xác định tính năng cần thêm
2. Cập nhật knowledge base
3. Cập nhật system prompt
4. Test kỹ lưỡng
5. Deploy và monitor

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs trong `DATN_BACKEND/logs/`
2. Xem API status: `GET /api/chatbot/ai-status`
3. Kiểm tra database connection
4. Verify environment variables

---

## 📚 Tài Liệu Tham Khảo

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [MongoDB Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 2024-01-23  
**Tác giả**: Development Team

