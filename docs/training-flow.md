# 📚 LUỒNG ĐÀO TẠO (TRAINING FLOW) - ĐỀ XUẤT HOÀN CHỈNH

## 🎯 TỔNG QUAN

Luồng đào tạo được chia thành 2 phần chính:
1. **Luồng Quản lý** (Admin/Manager): Tạo và quản lý khóa học
2. **Luồng Tham gia** (Employee): Đăng ký và thực hiện đào tạo

---

## 📋 PHẦN 1: LUỒNG QUẢN LÝ (ADMIN/MANAGER)

### Bước 1: Tạo Course Set (Bộ khóa học)
```
Admin → Tạo Course Set
├── Name: "An toàn lao động"
├── Description: "Các khóa học về an toàn lao động"
└── Status: ACTIVE
```

**API:** `POST /training/course-sets`

### Bước 2: Tạo Course (Khóa học)
```
Admin → Tạo Course trong Course Set
├── Course Set ID: (từ bước 1)
├── Course Name: "An toàn lao động cơ bản"
├── Description: "Khóa học cơ bản về an toàn lao động"
├── Duration Hours: 8
├── Is Mandatory: true/false
├── Validity Months: 12 (thời hạn hiệu lực chứng chỉ)
└── Prerequisites: [] (các khóa học cần hoàn thành trước)
```

**API:** `POST /training/courses`

### Bước 3: Tạo Question Bank (Ngân hàng câu hỏi)
```
Admin → Tạo Question Bank cho Course
├── Course ID: (từ bước 2)
├── Name: "Ngân hàng câu hỏi An toàn cơ bản"
├── Description: "Các câu hỏi về kiến thức an toàn lao động"
└── Settings:
    ├── Pass Threshold: 70% (ngưỡng đậu)
    ├── Time Limit: 60 phút (thời gian làm bài)
    └── Question Count: 20 (số câu hỏi trong bài thi)
```

**API:** `POST /training/question-banks`

### Bước 4: Tạo Questions (Câu hỏi)
```
Admin → Tạo Questions trong Question Bank
├── Bank ID: (từ bước 3)
├── Content: "Câu hỏi..."
├── Options: ["A", "B", "C", "D"]
├── Correct Answer: "A"
├── Points: 1-10
├── Difficulty Level: EASY/MEDIUM/HARD
└── Explanation: "Giải thích đáp án"
```

**Hoặc Import từ Excel:**
```
Admin → Import Questions từ Excel
├── Upload file Excel
├── Validate format
└── Bulk insert vào Question Bank
```

**API:** 
- `POST /training/questions` (tạo từng câu)
- `POST /training/questions/import-excel` (import hàng loạt)

### Bước 5: Tạo Training Session (Buổi đào tạo)
```
Admin → Tạo Training Session
├── Course ID: (từ bước 2)
├── Session Name: "Khóa học An toàn - Đợt 1/2024"
├── Start Time: 2024-01-15 08:00
├── End Time: 2024-01-15 17:00
├── Max Participants: 50
├── Location: "Phòng đào tạo A"
└── Status: SCHEDULED (tự động)
```

**Validation:**
- End time phải sau Start time
- Max participants > 0
- Không được trùng lịch với session khác (nếu cần)

**API:** `POST /training/sessions`

### Bước 6: Gán/Đăng ký nhân viên (Optional - có thể để nhân viên tự đăng ký)
```
Admin/Manager → Gán nhân viên vào Session
├── Session ID: (từ bước 5)
├── User IDs: [user1, user2, ...]
└── Is Mandatory: true/false
```

**API:** `POST /training/enrollments` (bulk)

---

## 👤 PHẦN 2: LUỒNG THAM GIA (EMPLOYEE)

### Bước 1: Xem danh sách khóa học
```
Employee → Xem danh sách Courses
├── Available Courses (chưa đăng ký)
├── Enrolled Courses (đã đăng ký)
└── Completed Courses (đã hoàn thành)
```

**API:** `GET /training/courses`

### Bước 2: Đăng ký khóa học (Enrollment)
```
Employee → Chọn Course → Đăng ký
├── Tìm Session có sẵn cho Course
│   ├── Status: SCHEDULED
│   ├── Chưa đầy (enrollments < max_participants)
│   └── Chưa đăng ký (user chưa enroll)
├── Tạo Enrollment
│   ├── Session ID
│   ├── User ID
│   └── Status: "enrolled"
└── Notification: Gửi thông báo đăng ký thành công
```

**Validation:**
- Kiểm tra prerequisites (nếu có)
- Kiểm tra session còn chỗ không
- Kiểm tra user chưa enroll session này

**API:** `POST /training/enrollments`

**Events:**
- Emit `TRAINING_ENROLLMENT` event
- WebSocket notification cho user

### Bước 3: Chờ đến thời gian bắt đầu
```
System → Tự động cập nhật Session Status
├── Trước Start Time: SCHEDULED
├── Trong khoảng Start-End Time: ONGOING
└── Sau End Time: COMPLETED
```

**Cron Job:** Chạy mỗi phút để cập nhật status

**Reminder Notifications:**
- 24h trước: "Khóa học của bạn sẽ bắt đầu vào ngày mai"
- 1h trước: "Khóa học của bạn sẽ bắt đầu sau 1 giờ"
- Khi bắt đầu: "Khóa học đã bắt đầu, bạn có thể bắt đầu làm bài"

### Bước 4: Bắt đầu làm bài (Start Training)
```
Employee → Click "Bắt đầu làm bài"
├── Validation:
│   ├── Session status = ONGOING
│   ├── User đã enroll
│   ├── Enrollment status = "enrolled"
│   └── Chưa hết thời gian (now < end_time)
├── Lấy Questions từ Question Bank
│   ├── Randomize questions (nếu cần)
│   ├── Limit số câu (theo settings)
│   └── Không gửi correct_answer về frontend
├── Tạo Training Progress record
│   ├── Enrollment ID
│   ├── Start Time
│   ├── Questions (shuffled)
│   └── Time Limit
└── Trả về:
    ├── Session info
    ├── Course info
    ├── Questions (không có đáp án)
    └── Time limit
```

**API:** `POST /training/sessions/:sessionId/start`

**Lưu ý:**
- Questions được shuffle để mỗi lần làm khác nhau
- Không lưu correct_answer vào response
- Lưu progress vào database để có thể resume

### Bước 5: Làm bài (Training Session)
```
Employee → Làm bài
├── Hiển thị từng câu hỏi
├── Lưu answers vào state (frontend)
├── Timer đếm ngược
├── Progress bar
└── Có thể:
    ├── Skip câu hỏi (để làm sau)
    ├── Review lại câu đã làm
    └── Submit khi hoàn thành
```

**Frontend State:**
```javascript
{
  currentQuestionIndex: 0,
  answers: { questionId: "selectedAnswer" },
  timeLeft: seconds,
  isSubmitted: false
}
```

**Auto-save:** Lưu progress mỗi 30 giây (optional)

### Bước 6: Nộp bài (Submit Training)
```
Employee → Click "Nộp bài"
├── Validation:
│   ├── Chưa submit
│   ├── Còn trong thời gian
│   └── Đã trả lời ít nhất 1 câu
├── Gửi answers lên server
├── Server tính điểm:
│   ├── So sánh answers với correct_answer
│   ├── Tính điểm theo points
│   ├── Tính phần trăm: (score / total) * 100
│   └── Check pass: percentage >= passThreshold (70%)
├── Cập nhật Enrollment:
│   ├── Status: "completed" (nếu pass) hoặc "failed"
│   ├── Score: điểm số
│   ├── Passed: true/false
│   └── Completion Date: now
├── Tạo Training History record:
│   ├── Enrollment ID
│   ├── Answers detail
│   ├── Score breakdown
│   └── Time spent
└── Trả về kết quả:
    ├── Total questions
    ├── Correct answers
    ├── Score / Total score
    ├── Percentage
    ├── Passed/Failed
    └── Review (nếu cho phép)
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

**Events:**
- Emit `TRAINING_COMPLETION` event
- WebSocket notification
- Email notification (nếu pass)

### Bước 7: Xem kết quả
```
Employee → Xem kết quả
├── Nếu PASS:
│   ├── Hiển thị điểm số
│   ├── Hiển thị chứng chỉ (nếu có)
│   ├── Download certificate (PDF)
│   └── Cập nhật validity (từ course.validity_months)
└── Nếu FAIL:
    ├── Hiển thị điểm số
    ├── Hiển thị câu sai
    ├── Nút "Làm lại" (nếu session còn active)
    └── Thông báo: "Bạn cần đạt 70% để đậu"
```

### Bước 8: Làm lại (Retake - nếu failed)
```
Employee → Click "Làm lại"
├── Validation:
│   ├── Enrollment status = "failed"
│   ├── Session còn active (now < end_time)
│   └── Chưa hết số lần retake (nếu có limit)
├── Reset Enrollment:
│   ├── Status: "enrolled"
│   ├── Score: null
│   ├── Passed: null
│   └── Completion Date: null
└── Quay lại Bước 4 (Start Training)
```

**API:** `POST /training/sessions/:sessionId/retake`

**Events:**
- Emit `TRAINING_RETAKE` event

---

## 🔄 LUỒNG TRẠNG THÁI (STATE FLOW)

### Session Status Flow:
```
SCHEDULED → ONGOING → COMPLETED
     ↓
  CANCELLED
```

**Tự động cập nhật:**
- Cron job chạy mỗi phút
- Khi start training cũng check và update

### Enrollment Status Flow:
```
enrolled → completed (nếu pass)
        ↓
      failed (nếu không pass)
        ↓
      enrolled (nếu retake)
        ↓
      cancelled (nếu admin hủy)
```

---

## 📊 CÁC TRƯỜNG HỢP ĐẶC BIỆT

### 1. Session đầy chỗ
```
Employee đăng ký → Check max_participants
├── Nếu đầy: "Session đã đầy, vui lòng chọn session khác"
└── Gợi ý: Hiển thị các session khác cùng course
```

### 2. Hết thời gian làm bài
```
Timer = 0 → Auto submit
├── Tự động submit với answers hiện tại
└── Tính điểm như bình thường
```

### 3. Session bị hủy
```
Admin hủy session → Update status = CANCELLED
├── Gửi notification cho tất cả enrolled users
├── Enrollment status → "cancelled"
└── Cho phép đăng ký session khác
```

### 4. User chưa hoàn thành prerequisites
```
Employee đăng ký → Check prerequisites
├── Nếu chưa hoàn thành: "Bạn cần hoàn thành khóa học X trước"
└── Hiển thị danh sách prerequisites cần hoàn thành
```

### 5. Chứng chỉ hết hạn
```
System check validity → Nếu hết hạn
├── Gửi reminder trước 30 ngày
├── Gửi reminder trước 7 ngày
└── Sau khi hết hạn: Yêu cầu làm lại khóa học
```

---

## 🎯 CẢI TIẾN ĐỀ XUẤT

### 1. Training Progress Tracking
```javascript
// Lưu tiến độ khi làm bài
{
  enrollment_id: ObjectId,
  current_question_index: 0,
  answers: {},
  time_spent: 0,
  last_accessed_at: Date,
  progress_percentage: 0
}
```

### 2. Training Materials
```javascript
// Tài liệu học tập trước khi làm bài
{
  course_id: ObjectId,
  materials: [
    { type: "PDF", url: "...", title: "..." },
    { type: "VIDEO", url: "...", title: "..." }
  ]
}
```

### 3. Training Certificate
```javascript
// Tự động tạo chứng chỉ khi pass
{
  enrollment_id: ObjectId,
  certificate_number: "CERT-2024-001",
  issued_date: Date,
  expiry_date: Date, // từ validity_months
  pdf_path: "...",
  status: "ACTIVE"
}
```

### 4. Training Feedback
```javascript
// Thu thập feedback sau khi hoàn thành
{
  enrollment_id: ObjectId,
  rating: 1-5,
  comments: "...",
  suggestions: "..."
}
```

### 5. Training Reminders
```
- 7 ngày trước session: "Bạn có session sắp tới"
- 1 ngày trước: "Nhắc nhở: Session của bạn vào ngày mai"
- 1 giờ trước: "Session bắt đầu sau 1 giờ"
- Khi bắt đầu: "Session đã bắt đầu, hãy bắt đầu làm bài"
```

---

## 📝 CHECKLIST TRIỂN KHAI

### Backend:
- [x] Course Set CRUD
- [x] Course CRUD
- [x] Question Bank CRUD
- [x] Questions CRUD
- [x] Training Session CRUD
- [x] Training Enrollment CRUD
- [x] Start Training
- [x] Submit Training
- [x] Retake Training
- [ ] Training Progress Tracking
- [ ] Training Certificate Generation
- [ ] Training Materials Management
- [ ] Training Feedback
- [ ] Training Reminders (Cron Job)
- [ ] Prerequisites Check
- [ ] Session Status Auto Update (Cron Job)

### Frontend:
- [x] Course List View
- [x] Enrollment Flow
- [x] Training Session View
- [x] Question Display
- [x] Submit Flow
- [x] Results View
- [ ] Progress Tracking UI
- [ ] Certificate Download
- [ ] Materials View
- [ ] Feedback Form
- [ ] Reminder Notifications

### Events & Notifications:
- [x] Enrollment Events
- [x] Completion Events
- [x] Retake Events
- [ ] Reminder Events
- [ ] Certificate Generated Events

---

## 🔗 API ENDPOINTS TÓM TẮT

### Course Management:
- `GET /training/course-sets` - Danh sách bộ khóa học
- `POST /training/course-sets` - Tạo bộ khóa học
- `GET /training/courses` - Danh sách khóa học
- `POST /training/courses` - Tạo khóa học

### Question Management:
- `GET /training/question-banks` - Danh sách ngân hàng câu hỏi
- `POST /training/question-banks` - Tạo ngân hàng câu hỏi
- `GET /training/questions` - Danh sách câu hỏi
- `POST /training/questions` - Tạo câu hỏi
- `POST /training/questions/import-excel` - Import câu hỏi

### Session Management:
- `GET /training/sessions` - Danh sách buổi đào tạo
- `POST /training/sessions` - Tạo buổi đào tạo
- `GET /training/sessions/:sessionId` - Chi tiết buổi đào tạo

### Enrollment:
- `GET /training/enrollments` - Danh sách đăng ký
- `POST /training/enrollments` - Đăng ký khóa học

### Training Actions:
- `POST /training/sessions/:sessionId/start` - Bắt đầu làm bài
- `POST /training/sessions/:sessionId/submit` - Nộp bài
- `POST /training/sessions/:sessionId/retake` - Làm lại

### Statistics:
- `GET /training/dashboard/stats` - Thống kê tổng quan

---

## 🎨 UI/UX FLOW

### Employee Training Page:
```
1. Tab "Khóa học có sẵn"
   - Danh sách courses chưa enroll
   - Nút "Đăng ký"
   
2. Tab "Khóa học đã đăng ký"
   - Danh sách courses đã enroll
   - Status: enrolled/completed/failed
   - Nút "Bắt đầu" (nếu session đang ONGOING)
   
3. Tab "Khóa học đã hoàn thành"
   - Danh sách courses đã completed
   - Điểm số
   - Download certificate
```

### Training Session Page:
```
1. Header:
   - Course name
   - Timer
   - Progress bar
   
2. Question Area:
   - Current question
   - Options (Radio buttons)
   - Navigation: Previous/Next
   
3. Sidebar:
   - Question list (có thể click)
   - Answered/Unanswered indicators
   
4. Footer:
   - Submit button
   - Review button
```

### Results Page:
```
1. Summary:
   - Total questions
   - Correct answers
   - Score / Total
   - Percentage
   - Pass/Fail status
   
2. Details:
   - List of questions
   - Your answer vs Correct answer
   - Explanation
   
3. Actions:
   - Download certificate (nếu pass)
   - Retake (nếu fail)
   - Back to training list
```

---

## ✅ KẾT LUẬN

Luồng này đảm bảo:
- ✅ Logic rõ ràng, dễ hiểu
- ✅ Xử lý đầy đủ các trường hợp
- ✅ User experience tốt
- ✅ Dễ mở rộng và bảo trì
- ✅ Tích hợp với hệ thống notification hiện có

