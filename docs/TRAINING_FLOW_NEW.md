# Luồng Training Mới (Đơn giản hóa)

## Tổng quan
Luồng training mới đã được đơn giản hóa, bỏ Training Session với giảng viên, thời lượng, thời gian học. Chỉ còn làm bài kiểm tra trực tiếp.

## Luồng hoạt động

### 1. Department Header
- **Tạo Bộ khóa học (Course Set)**
- **Tạo Khóa học (Course)** - gắn với Course Set
- **Tạo Ngân hàng câu hỏi (Question Bank)** - gắn với Course
- **Triển khai khóa học (Deploy Course)** - để khóa học hiển thị cho Employee
- **Gán khóa học cho phòng ban (Training Assignment)** - để Employee trong phòng ban có thể thấy

### 2. Manager
- **Gán khóa học cho Employee** - tạo TrainingEnrollment với `assigned_by = manager_id`
- Xem danh sách Employee và khóa học đã gán
- Xem kết quả làm bài của Employee

### 3. Employee
- **Xem khóa học được gán** - từ TrainingAssignment và TrainingEnrollment
- **Làm bài kiểm tra** - trực tiếp từ Course, lấy questions từ Question Bank
- **Submit bài** - tự động chấm điểm, cập nhật status (completed/failed)

## Thay đổi Model

### TrainingEnrollment
- **Bỏ**: `session_id` (không còn Training Session)
- **Thêm**: `course_id` (enroll trực tiếp vào Course)
- **Thêm**: `assigned_by` (Manager gán cho Employee)
- **Thêm**: `started_at`, `submitted_at` (track thời gian làm bài)
- **Cập nhật**: status enum thêm `in_progress` (đang làm bài)

### TrainingSession
- **Bỏ hoàn toàn** hoặc **Đơn giản hóa** - chỉ còn dùng cho quiz nếu cần
- Không còn: `start_time`, `end_time`, `max_participants`, `location`, `status_code`

## API Changes

### Enrollment
- `POST /training/enrollments` - Enroll vào Course (không cần session_id)
- `GET /training/enrollments` - Lấy enrollments theo course_id hoặc user_id
- `POST /training/courses/:courseId/start` - Bắt đầu làm bài (thay vì startTraining với session)
- `POST /training/courses/:courseId/submit` - Submit bài (thay vì submitTraining với session)

### Manager
- `POST /training/enrollments` - Manager gán khóa học cho Employee
- `GET /training/enrollments?assigned_by=manager_id` - Xem enrollments đã gán

## Frontend Changes

### Department Header
- Giữ nguyên: Course Set, Course, Question Bank management
- Bỏ: Training Session management tab

### Manager
- Thêm: UI để gán khóa học cho Employee
- Thêm: Xem danh sách Employee và enrollments

### Employee
- Cập nhật: Làm bài kiểm tra trực tiếp từ Course
- Bỏ: Chọn session, enroll vào session
- Thêm: Start quiz từ Course card

