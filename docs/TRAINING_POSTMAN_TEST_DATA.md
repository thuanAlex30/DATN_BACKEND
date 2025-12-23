# Training API - Postman Test Data

## Base URL
```
http://localhost:3000/api/training
```

**⚠️ QUAN TRỌNG - URL ĐÚNG:**
- **Base URL:** `http://localhost:3000/api/training`
- **Port mặc định:** `3000` (có thể thay đổi trong `.env` file)
- **Tất cả endpoints training đều bắt đầu với:** `/api/training/...`

**❌ SAI:** `http://localhost:3000/api/course-sets`  
**✅ ĐÚNG:** `http://localhost:3000/api/training/course-sets`

**Cấu trúc URL:**
```
http://localhost:3000/api/training/{endpoint}
```

**Ví dụ:**
- Create Course Set: `POST http://localhost:3000/api/training/course-sets`
- Get Courses: `GET http://localhost:3000/api/training/courses`
- Create Session: `POST http://localhost:3000/api/training/sessions`

## Authentication
Tất cả các request cần có header:
```
Authorization: Bearer <your_jwt_token>
```

**Cách lấy JWT Token:**
1. Đăng nhập qua endpoint: `POST http://localhost:3000/api/auth/login`
2. Copy token từ response và dán vào header `Authorization: Bearer <token>`

**Example Login Request:**
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

---

## ⚠️ QUAN TRỌNG - Thứ tự test

**Bạn PHẢI tạo các entity theo thứ tự sau:**

1. **Course Set** (Bộ khóa học) - Phải tạo TRƯỚC
2. **Course** (Khóa học) - Cần `course_set_id` từ bước 1
3. **Question Bank** (Ngân hàng câu hỏi) - Cần `course_id` từ bước 2
4. **Questions** (Câu hỏi) - Cần `bank_id` từ bước 3
5. **Training Session** (Buổi đào tạo) - Cần `course_id` từ bước 2
6. **Enrollment** (Đăng ký) - Cần `session_id` từ bước 5

**Lưu ý:** 
- Tất cả các ID trong ví dụ là **placeholder** - bạn cần thay thế bằng ID thực tế từ database
- Để lấy ID thực tế, hãy gọi GET endpoint trước (ví dụ: `GET /api/training/course-sets`)

---

## 1. Course Set APIs

### 1.1. Create Course Set
**POST** `/api/training/course-sets`
**Full URL:** `http://localhost:3000/api/training/course-sets`
**Role:** `company_admin` hoặc `header_department`

```json
{
  "name": "An toàn lao động cơ bản",
  "description": "Bộ khóa học về an toàn lao động cơ bản cho nhân viên mới"
}
```

### 1.2. Update Course Set
**PUT** `/api/training/course-sets/:courseSetId`
**Full URL:** `http://localhost:3000/api/training/course-sets/:courseSetId`
**Role:** `company_admin` hoặc `header_department`

```json
{
  "name": "An toàn lao động nâng cao",
  "description": "Bộ khóa học về an toàn lao động nâng cao"
}
```

### 1.3. Get All Course Sets
**GET** `/api/training/course-sets`
**Full URL:** `http://localhost:3000/api/training/course-sets`
**Role:** `company_admin` hoặc `header_department`

### 1.4. Get Course Set By ID
**GET** `/api/training/course-sets/:courseSetId`
**Full URL:** `http://localhost:3000/api/training/course-sets/:courseSetId`
**Role:** `company_admin` hoặc `header_department`

### 1.5. Delete Course Set
**DELETE** `/api/training/course-sets/:courseSetId`
**Full URL:** `http://localhost:3000/api/training/course-sets/:courseSetId`
**Role:** `company_admin` hoặc `header_department`

---

## 2. Course APIs

### 2.1. Create Course
**POST** `/api/training/courses`
**Full URL:** `http://localhost:3000/api/training/courses`
**Role:** `company_admin`

```json
{
  "course_set_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "course_name": "An toàn khi làm việc với máy móc",
  "description": "Khóa học về các quy tắc an toàn khi vận hành máy móc công nghiệp",
  "duration_hours": 8,
  "is_mandatory": true,
  "validity_months": 12
}
```

**Example với optional fields:**
```json
{
  "course_set_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "course_name": "An toàn điện",
  "description": "Khóa học về an toàn khi làm việc với điện",
  "duration_hours": 4,
  "is_mandatory": false,
  "validity_months": 6
}
```

### 2.2. Update Course
**PUT** `/api/training/courses/:courseId`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId`
**Role:** `company_admin`

```json
{
  "course_name": "An toàn khi làm việc với máy móc - Cập nhật",
  "description": "Khóa học đã được cập nhật với nội dung mới",
  "duration_hours": 10,
  "is_mandatory": true,
  "validity_months": 24
}
```

### 2.3. Get All Courses
**GET** `/api/training/courses`
**Full URL:** `http://localhost:3000/api/training/courses`
**Query Params (optional):**
- `courseSetId`: Filter by course set
- `isMandatory`: `true` hoặc `false`
- `isDeployed`: `true` hoặc `false`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:**
```
GET /api/training/courses?courseSetId=65a1b2c3d4e5f6g7h8i9j0k1&isMandatory=true&page=1&limit=10
```

**Role:** `company_admin`, `manager`, `header_department`

### 2.4. Get Available Courses (Employee)
**GET** `/api/training/courses/available`
**Full URL:** `http://localhost:3000/api/training/courses/available`
**Query Params (optional):**
- `isMandatory`: `true` hoặc `false`

**Role:** `employee`

### 2.5. Get Course By ID
**GET** `/api/training/courses/:courseId`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId`
**Role:** `company_admin`, `manager`, `employee`

### 2.6. Delete Course
**DELETE** `/api/training/courses/:courseId`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId`
**Role:** `company_admin`

### 2.7. Deploy Course
**POST** `/api/training/courses/:courseId/deploy`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId/deploy`
**Role:** `company_admin`

```json
{
  "notes": "Khóa học đã sẵn sàng để triển khai cho tất cả nhân viên"
}
```

### 2.8. Undeploy Course
**POST** `/api/training/courses/:courseId/undeploy`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId/undeploy`
**Role:** `company_admin`

### 2.9. Get Course Stats
**GET** `/api/training/courses/:courseId/stats`
**Full URL:** `http://localhost:3000/api/training/courses/:courseId/stats`
**Role:** `company_admin`, `manager`, `header_department`

---

## 3. Training Session APIs

### 3.1. Create Training Session
**POST** `/api/training/sessions`
**Full URL:** `http://localhost:3000/api/training/sessions`
**Role:** `company_admin`, `header_department`

```json
{
  "course_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "session_name": "Buổi đào tạo an toàn máy móc - Tháng 1/2024",
  "start_time": "2024-01-15T09:00:00.000Z",
  "end_time": "2024-01-15T17:00:00.000Z",
  "max_participants": 30,
  "location": "Phòng đào tạo A - Tầng 3",
  "status_code": "SCHEDULED"
}
```

**Example với instructor:**
```json
{
  "course_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "session_name": "Buổi đào tạo an toàn điện",
  "start_time": "2024-01-20T08:00:00.000Z",
  "end_time": "2024-01-20T12:00:00.000Z",
  "instructor_id": "65a1b2c3d4e5f6g7h8i9j0k3",
  "max_participants": 20,
  "location": "Phòng đào tạo B - Tầng 2",
  "status_code": "SCHEDULED"
}
```

### 3.2. Update Training Session
**PUT** `/api/training/sessions/:sessionId`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId`
**Role:** `company_admin`, `header_department`

```json
{
  "session_name": "Buổi đào tạo an toàn máy móc - Tháng 1/2024 (Đã cập nhật)",
  "start_time": "2024-01-15T10:00:00.000Z",
  "end_time": "2024-01-15T18:00:00.000Z",
  "max_participants": 35,
  "location": "Phòng đào tạo A - Tầng 3",
  "status_code": "ONGOING"
}
```

### 3.3. Get All Sessions
**GET** `/api/training/sessions`
**Full URL:** `http://localhost:3000/api/training/sessions`
**Query Params (optional):**
- `courseId`: Filter by course
- `instructorId`: Filter by instructor
- `statusCode`: `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`
- `page`: Page number
- `limit`: Items per page

**Example:**
```
GET /api/training/sessions?courseId=65a1b2c3d4e5f6g7h8i9j0k2&statusCode=SCHEDULED&page=1&limit=10
```

**Role:** `company_admin`, `header_department`, `manager`

### 3.4. Get Available Sessions (Employee)
**GET** `/api/training/sessions/available`
**Full URL:** `http://localhost:3000/api/training/sessions/available`
**Query Params (optional):**
- `courseId`: Filter by course
- `statusCode`: Filter by status

**Role:** `employee`

### 3.5. Get Session By ID
**GET** `/api/training/sessions/:sessionId`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId`
**Role:** `company_admin`, `header_department`, `manager`, `employee`

### 3.6. Start Training Session
**POST** `/api/training/sessions/:sessionId/start`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId/start`
**Role:** `employee`

### 3.7. Submit Training
**POST** `/api/training/sessions/:sessionId/submit`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId/submit`
**Role:** `employee`

```json
{
  "answers": {
    "65a1b2c3d4e5f6g7h8i9j0k4": "Đáp án A",
    "65a1b2c3d4e5f6g7h8i9j0k5": "Đáp án B",
    "65a1b2c3d4e5f6g7h8i9j0k6": "Đáp án C"
  },
  "completionTime": "2024-01-15T16:30:00.000Z"
}
```

### 3.8. Retake Training
**POST** `/api/training/sessions/:sessionId/retake`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId/retake`
**Role:** `employee`

### 3.9. Delete Session
**DELETE** `/api/training/sessions/:sessionId`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId`
**Role:** `company_admin`, `header_department`

### 3.10. Get Session Enrollment Stats
**GET** `/api/training/sessions/:sessionId/enrollment-stats`
**Full URL:** `http://localhost:3000/api/training/sessions/:sessionId/enrollment-stats`
**Role:** `company_admin`, `header_department`, `manager`

---

## 4. Training Enrollment APIs

### 4.1. Create Enrollment
**POST** `/api/training/enrollments`
**Full URL:** `http://localhost:3000/api/training/enrollments`
**Role:** `company_admin`, `header_department`, `manager`, `employee`

```json
{
  "session_id": "65a1b2c3d4e5f6g7h8i9j0k7",
  "user_id": "65a1b2c3d4e5f6g7h8i9j0k8"
}
```

### 4.2. Update Enrollment
**PUT** `/api/training/enrollments/:enrollmentId`
**Full URL:** `http://localhost:3000/api/training/enrollments/:enrollmentId`
**Role:** `company_admin`, `header_department`

```json
{
  "status": "completed",
  "score": 85,
  "passed": true,
  "completion_date": "2024-01-15T17:00:00.000Z"
}
```

**Example với failed:**
```json
{
  "status": "failed",
  "score": 45,
  "passed": false,
  "completion_date": "2024-01-15T17:00:00.000Z"
}
```

### 4.3. Get All Enrollments
**GET** `/api/training/enrollments`
**Full URL:** `http://localhost:3000/api/training/enrollments`
**Query Params (optional):**
- `sessionId`: Filter by session
- `userId`: Filter by user
- `status`: `enrolled`, `completed`, `failed`, `cancelled`
- `page`: Page number
- `limit`: Items per page

**Example:**
```
GET /api/training/enrollments?sessionId=65a1b2c3d4e5f6g7h8i9j0k7&status=completed&page=1&limit=10
```

**Role:** `company_admin`, `header_department`, `manager`

### 4.4. Get Enrollment By ID
**GET** `/api/training/enrollments/:enrollmentId`
**Full URL:** `http://localhost:3000/api/training/enrollments/:enrollmentId`
**Role:** `company_admin`, `header_department`, `manager`, `employee`

### 4.5. Delete Enrollment
**DELETE** `/api/training/enrollments/:enrollmentId`
**Full URL:** `http://localhost:3000/api/training/enrollments/:enrollmentId`
**Role:** `company_admin`, `header_department`

---

## 5. Question Bank APIs

### 5.1. Create Question Bank
**POST** `/api/training/question-banks`
**Full URL:** `http://localhost:3000/api/training/question-banks`
**Role:** `company_admin`, `header_department`

```json
{
  "course_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "name": "Ngân hàng câu hỏi an toàn máy móc",
  "description": "Bộ câu hỏi kiểm tra kiến thức về an toàn máy móc"
}
```

### 5.2. Update Question Bank
**PUT** `/api/training/question-banks/:bankId`
**Full URL:** `http://localhost:3000/api/training/question-banks/:bankId`
**Role:** `company_admin`, `header_department`

```json
{
  "name": "Ngân hàng câu hỏi an toàn máy móc - Cập nhật",
  "description": "Bộ câu hỏi đã được cập nhật với nội dung mới"
}
```

### 5.3. Get All Question Banks
**GET** `/api/training/question-banks`
**Full URL:** `http://localhost:3000/api/training/question-banks`
**Query Params (optional):**
- `courseId`: Filter by course
- `page`: Page number
- `limit`: Items per page

**Role:** `company_admin`, `header_department`

### 5.4. Get Question Bank By ID
**GET** `/api/training/question-banks/:bankId`
**Full URL:** `http://localhost:3000/api/training/question-banks/:bankId`
**Role:** `company_admin`, `header_department`

### 5.5. Get Question Banks By Course
**GET** `/api/training/question-banks/course/:courseId`
**Full URL:** `http://localhost:3000/api/training/question-banks/course/:courseId`
**Role:** `company_admin`, `header_department`

### 5.6. Delete Question Bank
**DELETE** `/api/training/question-banks/:bankId`
**Full URL:** `http://localhost:3000/api/training/question-banks/:bankId`
**Role:** `company_admin`, `header_department`

### 5.7. Get Question Bank Stats
**GET** `/api/training/question-banks/:bankId/stats`
**Full URL:** `http://localhost:3000/api/training/question-banks/:bankId/stats`
**Role:** `company_admin`, `header_department`

---

## 6. Question APIs

### 6.1. Create Question
**POST** `/api/training/questions`
**Full URL:** `http://localhost:3000/api/training/questions`
**Role:** `company_admin`, `header_department`

```json
{
  "bank_id": "65a1b2c3d4e5f6g7h8i9j0k9",
  "content": "Khi làm việc với máy móc, điều quan trọng nhất là gì?",
  "options": [
    "Tuân thủ quy trình an toàn",
    "Làm nhanh để hoàn thành công việc",
    "Không cần đeo thiết bị bảo hộ",
    "Làm việc một mình để tập trung"
  ],
  "correct_answer": "Tuân thủ quy trình an toàn"
}
```

**Example với question_type và difficulty:**
```json
{
  "bank_id": "65a1b2c3d4e5f6g7h8i9j0k9",
  "content": "Trước khi vận hành máy, bạn cần kiểm tra những gì?",
  "question_type": "multiple_choice",
  "options": [
    "Kiểm tra thiết bị bảo hộ",
    "Kiểm tra máy móc hoạt động bình thường",
    "Kiểm tra khu vực làm việc",
    "Tất cả các đáp án trên"
  ],
  "correct_answer": "Tất cả các đáp án trên",
  "difficulty_level": "medium",
  "points": 10
}
```

### 6.2. Update Question
**PUT** `/api/training/questions/:questionId`
**Full URL:** `http://localhost:3000/api/training/questions/:questionId`
**Role:** `company_admin`, `header_department`

```json
{
  "content": "Khi làm việc với máy móc, điều quan trọng nhất là gì? (Đã cập nhật)",
  "options": [
    "Tuân thủ quy trình an toàn",
    "Làm nhanh để hoàn thành công việc",
    "Không cần đeo thiết bị bảo hộ",
    "Làm việc một mình để tập trung"
  ],
  "correct_answer": "Tuân thủ quy trình an toàn"
}
```

### 6.3. Get All Questions
**GET** `/api/training/questions`
**Full URL:** `http://localhost:3000/api/training/questions`
**Query Params (optional):**
- `bankId`: Filter by question bank
- `page`: Page number
- `limit`: Items per page

**Role:** `company_admin`, `header_department`

### 6.4. Get Question By ID
**GET** `/api/training/questions/:questionId`
**Full URL:** `http://localhost:3000/api/training/questions/:questionId`
**Role:** `company_admin`, `header_department`

### 6.5. Delete Question
**DELETE** `/api/training/questions/:questionId`
**Full URL:** `http://localhost:3000/api/training/questions/:questionId`
**Role:** `company_admin`, `header_department`

### 6.6. Import Questions From Excel
**POST** `/api/training/questions/import-excel`
**Full URL:** `http://localhost:3000/api/training/questions/import-excel`
**Content-Type:** `multipart/form-data`
**Role:** `company_admin`, `header_department`

**Form Data:**
- `excelFile`: (file) Excel file với format câu hỏi
- `bank_id`: `65a1b2c3d4e5f6g7h8i9j0k9`

---

## 7. Training Assignment APIs

### 7.1. Create Assignment
**POST** `/api/training/assignments`
**Full URL:** `http://localhost:3000/api/training/assignments`
**Role:** `company_admin`, `header_department`

```json
{
  "course_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "department_id": "65a1b2c3d4e5f6g7h8i9j0ka",
  "notes": "Khóa học bắt buộc cho tất cả nhân viên phòng sản xuất"
}
```

### 7.2. Update Assignment
**PUT** `/api/training/assignments/:assignmentId`
**Full URL:** `http://localhost:3000/api/training/assignments/:assignmentId`
**Role:** `company_admin`, `header_department`

```json
{
  "notes": "Khóa học đã được cập nhật - bắt buộc cho nhân viên mới"
}
```

### 7.3. Get All Assignments
**GET** `/api/training/assignments`
**Full URL:** `http://localhost:3000/api/training/assignments`
**Query Params (optional):**
- `courseId`: Filter by course
- `departmentId`: Filter by department
- `page`: Page number
- `limit`: Items per page

**Role:** `company_admin`, `header_department`

### 7.4. Get Assignment By ID
**GET** `/api/training/assignments/:assignmentId`
**Full URL:** `http://localhost:3000/api/training/assignments/:assignmentId`
**Role:** `company_admin`, `header_department`

### 7.5. Get Assignments By Department
**GET** `/api/training/assignments/department/:departmentId`
**Full URL:** `http://localhost:3000/api/training/assignments/department/:departmentId`
**Role:** `company_admin`, `header_department`, `manager`

### 7.6. Get Assignments By Course
**GET** `/api/training/assignments/course/:courseId`
**Full URL:** `http://localhost:3000/api/training/assignments/course/:courseId`
**Role:** `company_admin`, `header_department`

### 7.7. Delete Assignment
**DELETE** `/api/training/assignments/:assignmentId`
**Full URL:** `http://localhost:3000/api/training/assignments/:assignmentId`
**Role:** `company_admin`, `header_department`

### 7.8. Get Assignment Stats
**GET** `/api/training/assignments/stats`
**Full URL:** `http://localhost:3000/api/training/assignments/stats`
**Role:** `company_admin`, `header_department`

---

## 8. Dashboard & Statistics APIs

### 8.1. Get Dashboard Stats
**GET** `/api/training/dashboard/stats`
**Full URL:** `http://localhost:3000/api/training/dashboard/stats`
**Role:** `company_admin`, `header_department`

### 8.2. Get Department Dashboard
**GET** `/api/training/dashboard/department/:departmentId`
**Full URL:** `http://localhost:3000/api/training/dashboard/department/:departmentId`
**Role:** `company_admin`, `header_department`, `manager`

### 8.3. Get Courses By Department
**GET** `/api/training/courses/department/:departmentId`
**Full URL:** `http://localhost:3000/api/training/courses/department/:departmentId`
**Role:** `company_admin`, `header_department`, `manager`

### 8.4. Get Departments By Course
**GET** `/api/training/departments/course/:courseId`
**Full URL:** `http://localhost:3000/api/training/departments/course/:courseId`
**Role:** `company_admin`, `header_department`

---

## 9. Employee Training APIs

### 9.1. Get Employee Sessions
**GET** `/api/training/sessions/employee`
**Full URL:** `http://localhost:3000/api/training/sessions/employee`
**Role:** `employee`

**Query Params (optional):**
- `status`: Filter by enrollment status
- `page`: Page number
- `limit`: Items per page

---

## Notes

1. **ObjectId Format:** Tất cả các ID phải là MongoDB ObjectId hợp lệ (24 ký tự hex)
2. **Date Format:** Sử dụng ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
3. **Status Codes:**
   - Session: `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`
   - Enrollment: `enrolled`, `completed`, `failed`, `cancelled`
4. **Boolean Values:** Sử dụng `true` hoặc `false` (không phải string)
5. **Numbers:** Sử dụng số thực, không phải string (trừ khi là query params)

---

## Example Test Flow

### Flow 1: Tạo khóa học hoàn chỉnh
1. Create Course Set
2. Create Course (sử dụng course_set_id từ bước 1)
3. Create Question Bank (sử dụng course_id từ bước 2)
4. Create Questions (sử dụng bank_id từ bước 3)
5. Deploy Course
6. Create Training Session (sử dụng course_id từ bước 2)
7. Create Enrollment (sử dụng session_id từ bước 6)

### Flow 2: Employee tham gia training
1. Get Available Courses (employee)
2. Get Available Sessions (employee)
3. Create Enrollment
4. Start Training Session
5. Submit Training
6. Check Enrollment Status

### Flow 3: Manager quản lý training
1. Get Courses (manager)
2. Get Sessions (manager)
3. Get Enrollments (manager)
4. Get Department Dashboard

---

## Sample ObjectIds (Thay thế bằng ID thực tế từ database)

```
Course Set ID: 65a1b2c3d4e5f6g7h8i9j0k1
Course ID: 65a1b2c3d4e5f6g7h8i9j0k2
Session ID: 65a1b2c3d4e5f6g7h8i9j0k7
Question Bank ID: 65a1b2c3d4e5f6g7h8i9j0k9
Question ID: 65a1b2c3d4e5f6g7h8i9j0k4
User ID: 65a1b2c3d4e5f6g7h8i9j0k8
Department ID: 65a1b2c3d4e5f6g7h8i9j0ka
Instructor ID: 65a1b2c3d4e5f6g7h8i9j0k3
Enrollment ID: 65a1b2c3d4e5f6g7h8i9j0kb
Assignment ID: 65a1b2c3d4e5f6g7h8i9j0kc
```

