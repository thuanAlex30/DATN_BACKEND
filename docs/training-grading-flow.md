# 📝 LUỒNG CHẤM ĐIỂM TRAINING - TỔNG QUAN

## 🎯 LUỒNG MỚI

### Flow cũ (Tự động chấm):
```
User submit → Backend tính điểm ngay → Trả về kết quả → Hiển thị điểm
```

### Flow mới (Admin chấm):
```
User submit → Lưu answers → Status: "submitted" 
    ↓
Admin xem danh sách bài cần chấm
    ↓
Admin chấm điểm → Update enrollment → Gửi notification
    ↓
User nhận thông báo kết quả
```

---

## 📋 CHI TIẾT LUỒNG

### 1. User Submit Bài
```
Employee → Làm bài → Click "Nộp bài"
    ↓
Frontend gửi answers lên Backend
    ↓
Backend:
  - Tạo TrainingSubmission record
  - Lưu answers
  - Status: "submitted"
  - Enrollment status: vẫn "enrolled" (chưa có điểm)
    ↓
Trả về: "Bài làm đã được gửi, vui lòng chờ chấm điểm"
```

**API:** `POST /training/sessions/:sessionId/submit`

**Body:**
```json
{
  "answers": {
    "questionId1": "answer1",
    "questionId2": "answer2"
  },
  "completionTime": "2024-01-15T10:30:00Z"
}
```

### 2. Admin Xem Danh Sách Bài Cần Chấm
```
Admin → Training Management → Tab "Chấm điểm"
    ↓
Backend trả về danh sách submissions với status = "submitted"
    ↓
Hiển thị:
  - Người làm bài
  - Khóa học
  - Thời gian nộp
  - Trạng thái: "Chờ chấm"
```

**API:** `GET /training/submissions/grading`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user_id": { "full_name": "...", "email": "..." },
      "session_id": { "session_name": "...", "course_id": {...} },
      "submitted_at": "...",
      "status": "submitted"
    }
  ]
}
```

### 3. Admin Chấm Điểm
```
Admin → Click "Chấm điểm" trên một submission
    ↓
Backend trả về:
  - Submission details
  - Questions với correct_answer
  - User answers
    ↓
Admin xem bài làm:
  - Câu hỏi
  - Đáp án đúng (highlight xanh)
  - Đáp án user chọn (highlight đỏ nếu sai, xanh nếu đúng)
  - Explanation (nếu có)
    ↓
Admin nhập:
  - Điểm số (0-100)
  - Pass/Fail (checkbox)
  - Nhận xét (tùy chọn)
    ↓
Click "Xác nhận chấm điểm"
```

**API:** 
- `GET /training/submissions/:submissionId/grading` - Lấy chi tiết
- `POST /training/submissions/:submissionId/grade` - Chấm điểm

**Body (grade):**
```json
{
  "score": 85,
  "passed": true,
  "admin_comments": "Làm bài tốt, cần cải thiện phần an toàn điện"
}
```

### 4. Backend Xử Lý Chấm Điểm
```
Backend nhận request chấm điểm:
    ↓
1. Update Submission:
   - status: "graded"
   - graded_at: now
   - graded_by: adminId
   - admin_comments: (nếu có)
    ↓
2. Update Enrollment:
   - status: "completed" (nếu passed) hoặc "failed"
   - score: điểm số
   - passed: true/false
   - completion_date: now
    ↓
3. Gửi Notification:
   - WebSocket: "training_graded" event
   - Gửi cho user_id
   - Message: "Chúc mừng! Bạn đã đậu..." hoặc "Bạn chưa đạt..."
```

### 5. User Nhận Kết Quả
```
User nhận WebSocket notification:
    ↓
Frontend hiển thị:
  - Toast notification
  - Notification panel
  - Message với điểm số
    ↓
User có thể:
  - Xem lại kết quả
  - Làm lại (nếu failed)
```

---

## 🗄️ DATABASE STRUCTURE

### TrainingSubmission Model (MỚI)
```javascript
{
  enrollment_id: ObjectId, // Unique
  session_id: ObjectId,
  user_id: ObjectId,
  answers: Map<String, String>, // { questionId: "answer" }
  submitted_at: Date,
  status: "submitted" | "graded",
  graded_at: Date (optional),
  graded_by: ObjectId (optional),
  admin_comments: String (optional)
}
```

### TrainingEnrollment Model (KHÔNG ĐỔI)
```javascript
{
  session_id: ObjectId,
  user_id: ObjectId,
  status: "enrolled" | "completed" | "failed" | "cancelled",
  score: Number (0-100), // null khi chưa chấm
  passed: Boolean, // null khi chưa chấm
  completion_date: Date // null khi chưa chấm
}
```

---

## 🔄 STATUS FLOW

### Submission Status:
```
submitted → graded
```

### Enrollment Status (sau khi chấm):
```
enrolled → completed (nếu passed)
        ↓
      failed (nếu không passed)
```

**Lưu ý:** Enrollment status vẫn là "enrolled" khi đã submit nhưng chưa chấm. Frontend sẽ check score === null để hiển thị "Đã nộp, chờ chấm".

---

## 📊 UI/UX

### Employee Training Page:
- **Status "enrolled" + score = null**: Hiển thị "Đã nộp, chờ chấm" (màu cam)
- **Status "completed"**: Hiển thị "Hoàn thành" + điểm số (màu xanh)
- **Status "failed"**: Hiển thị "Chưa đạt" + điểm số (màu đỏ)

### Admin Grading Page:
- **Tab "Chấm điểm"** với badge số lượng bài cần chấm
- **Table** hiển thị:
  - Người làm bài (avatar + tên + email)
  - Khóa học + Session
  - Thời gian nộp
  - Trạng thái
  - Nút "Chấm điểm"
- **Modal chấm điểm**:
  - Hiển thị bài làm với:
    - Câu hỏi
    - Đáp án đúng (highlight xanh)
    - Đáp án user chọn (highlight đỏ/xanh)
  - Form nhập điểm, pass/fail, nhận xét

---

## ✅ KẾT LUẬN

Luồng mới cho phép:
- ✅ Admin kiểm soát việc chấm điểm
- ✅ Linh hoạt trong việc đánh giá (có thể điều chỉnh điểm)
- ✅ Thêm nhận xét cho học viên
- ✅ User nhận thông báo real-time khi có kết quả
- ✅ Không cần sửa model TrainingEnrollment

