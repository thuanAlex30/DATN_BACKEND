# Training Management API Documentation

## Overview
API quản lý đào tạo cho hệ thống quản lý an toàn lao động, bao gồm quản lý khóa học, buổi đào tạo, đăng ký tham gia và ngân hàng câu hỏi.

## Base URL
```
http://localhost:5000/api/training
```

## Authentication
Tất cả các endpoint đều yêu cầu authentication token trong header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Course Sets (Nhóm khóa học)

#### GET /course-sets
Lấy danh sách tất cả nhóm khóa học
```json
{
  "success": true,
  "message": "Course sets retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "An toàn cơ bản",
      "description": "Các khóa học an toàn lao động cơ bản",
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /course-sets/:courseSetId
Lấy thông tin chi tiết một nhóm khóa học

#### POST /course-sets
Tạo nhóm khóa học mới
```json
{
  "name": "An toàn nâng cao",
  "description": "Các khóa học an toàn lao động nâng cao"
}
```

#### PUT /course-sets/:courseSetId
Cập nhật thông tin nhóm khóa học

#### DELETE /course-sets/:courseSetId
Xóa nhóm khóa học

### 2. Courses (Khóa học)

#### GET /courses
Lấy danh sách khóa học với các filter:
- `courseSetId`: Lọc theo nhóm khóa học
- `isMandatory`: Lọc theo khóa học bắt buộc (true/false)

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "course_set_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "An toàn cơ bản"
      },
      "course_name": "An toàn lao động cơ bản",
      "description": "Khóa học cơ bản về an toàn lao động",
      "duration_hours": 8,
      "is_mandatory": true,
      "validity_months": 12,
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /courses/:courseId
Lấy thông tin chi tiết một khóa học

#### POST /courses
Tạo khóa học mới
```json
{
  "course_set_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "course_name": "An toàn lao động cơ bản",
  "description": "Khóa học cơ bản về an toàn lao động",
  "duration_hours": 8,
  "is_mandatory": true,
  "validity_months": 12
}
```

#### PUT /courses/:courseId
Cập nhật thông tin khóa học

#### DELETE /courses/:courseId
Xóa khóa học

### 3. Training Sessions (Buổi đào tạo)

#### GET /sessions
Lấy danh sách buổi đào tạo với các filter:
- `courseId`: Lọc theo khóa học
- `instructorId`: Lọc theo giảng viên
- `statusCode`: Lọc theo trạng thái

```json
{
  "success": true,
  "message": "Training sessions retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "course_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "course_name": "An toàn lao động cơ bản"
      },
      "session_name": "Buổi đào tạo tháng 9",
      "start_time": "2023-09-15T09:00:00.000Z",
      "end_time": "2023-09-15T17:00:00.000Z",
      "instructor_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "full_name": "Nguyễn Văn A"
      },
      "max_participants": 30,
      "location": "Phòng họp A",
      "status_code": "SCHEDULED",
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /sessions/:sessionId
Lấy thông tin chi tiết một buổi đào tạo

#### POST /sessions
Tạo buổi đào tạo mới
```json
{
  "course_id": "64f8a1b2c3d4e5f6a7b8c9d1",
  "session_name": "Buổi đào tạo tháng 9",
  "start_time": "2023-09-15T09:00:00.000Z",
  "end_time": "2023-09-15T17:00:00.000Z",
  "instructor_id": "64f8a1b2c3d4e5f6a7b8c9d3",
  "max_participants": 30,
  "location": "Phòng họp A",
  "status_code": "SCHEDULED"
}
```

#### PUT /sessions/:sessionId
Cập nhật thông tin buổi đào tạo

#### DELETE /sessions/:sessionId
Xóa buổi đào tạo

### 4. Training Enrollments (Đăng ký tham gia)

#### GET /enrollments
Lấy danh sách đăng ký với các filter:
- `sessionId`: Lọc theo buổi đào tạo
- `userId`: Lọc theo người dùng
- `status`: Lọc theo trạng thái đăng ký

```json
{
  "success": true,
  "message": "Training enrollments retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "session_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "session_name": "Buổi đào tạo tháng 9",
        "start_time": "2023-09-15T09:00:00.000Z",
        "end_time": "2023-09-15T17:00:00.000Z"
      },
      "user_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "full_name": "Trần Thị B",
        "email": "tranthib@example.com"
      },
      "enrolled_at": "2023-09-06T10:30:00.000Z",
      "status": "enrolled",
      "score": null,
      "passed": null,
      "completion_date": null,
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /enrollments/:enrollmentId
Lấy thông tin chi tiết một đăng ký

#### POST /enrollments
Đăng ký tham gia buổi đào tạo
```json
{
  "session_id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "user_id": "64f8a1b2c3d4e5f6a7b8c9d5"
}
```

#### PUT /enrollments/:enrollmentId
Cập nhật thông tin đăng ký (điểm số, trạng thái hoàn thành)
```json
{
  "status": "completed",
  "score": 85,
  "passed": true,
  "completion_date": "2023-09-15T17:00:00.000Z"
}
```

#### DELETE /enrollments/:enrollmentId
Hủy đăng ký tham gia

### 5. Question Banks (Ngân hàng câu hỏi)

#### GET /question-banks
Lấy danh sách ngân hàng câu hỏi với filter:
- `courseId`: Lọc theo khóa học

```json
{
  "success": true,
  "message": "Question banks retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "course_id": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "course_name": "An toàn lao động cơ bản"
      },
      "name": "Ngân hàng câu hỏi An toàn cơ bản",
      "description": "Các câu hỏi về kiến thức an toàn lao động cơ bản",
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /question-banks/:bankId
Lấy thông tin chi tiết một ngân hàng câu hỏi

#### POST /question-banks
Tạo ngân hàng câu hỏi mới
```json
{
  "course_id": "64f8a1b2c3d4e5f6a7b8c9d1",
  "name": "Ngân hàng câu hỏi An toàn cơ bản",
  "description": "Các câu hỏi về kiến thức an toàn lao động cơ bản"
}
```

#### PUT /question-banks/:bankId
Cập nhật thông tin ngân hàng câu hỏi

#### DELETE /question-banks/:bankId
Xóa ngân hàng câu hỏi

### 6. Questions (Câu hỏi)

#### GET /questions
Lấy danh sách câu hỏi với filter:
- `bankId`: Lọc theo ngân hàng câu hỏi

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "bank_id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "content": "Theo quy định về an toàn lao động, người lao động phải làm gì khi phát hiện tình huống nguy hiểm?",
      "options": [
        "Tiếp tục làm việc bình thường",
        "Báo cáo ngay cho người phụ trách",
        "Tự xử lý mà không báo cáo",
        "Bỏ qua và không quan tâm"
      ],
      "correct_answer": "Báo cáo ngay cho người phụ trách",
      "created_at": "2023-09-06T10:30:00.000Z",
      "updated_at": "2023-09-06T10:30:00.000Z"
    }
  ]
}
```

#### GET /questions/:questionId
Lấy thông tin chi tiết một câu hỏi

#### POST /questions
Tạo câu hỏi mới
```json
{
  "bank_id": "64f8a1b2c3d4e5f6a7b8c9d6",
  "content": "Theo quy định về an toàn lao động, người lao động phải làm gì khi phát hiện tình huống nguy hiểm?",
  "options": [
    "Tiếp tục làm việc bình thường",
    "Báo cáo ngay cho người phụ trách",
    "Tự xử lý mà không báo cáo",
    "Bỏ qua và không quan tâm"
  ],
  "correct_answer": "Báo cáo ngay cho người phụ trách"
}
```

#### PUT /questions/:questionId
Cập nhật thông tin câu hỏi

#### DELETE /questions/:questionId
Xóa câu hỏi

### 7. Statistics (Thống kê)

#### GET /dashboard/stats
Lấy thống kê tổng quan về đào tạo
```json
{
  "success": true,
  "message": "Training statistics retrieved successfully",
  "data": {
    "totalCourseSets": 3,
    "totalCourses": 4,
    "totalSessions": 12,
    "totalEnrollments": 45,
    "totalQuestionBanks": 3,
    "totalQuestions": 20
  }
}
```

#### GET /sessions/stats
Lấy thống kê theo trạng thái buổi đào tạo
```json
{
  "success": true,
  "message": "Session statistics retrieved successfully",
  "data": [
    {
      "_id": "SCHEDULED",
      "count": 5
    },
    {
      "_id": "ONGOING",
      "count": 2
    },
    {
      "_id": "COMPLETED",
      "count": 3
    },
    {
      "_id": "CANCELLED",
      "count": 1
    }
  ]
}
```

#### GET /enrollments/stats
Lấy thống kê theo trạng thái đăng ký
```json
{
  "success": true,
  "message": "Enrollment statistics retrieved successfully",
  "data": [
    {
      "_id": "enrolled",
      "count": 30
    },
    {
      "_id": "completed",
      "count": 10
    },
    {
      "_id": "failed",
      "count": 2
    },
    {
      "_id": "cancelled",
      "count": 3
    }
  ]
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "course_name",
      "message": "Course name is required",
      "value": ""
    }
  ]
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Course not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Data Models

### Course Set
- `_id`: ObjectId (auto-generated)
- `name`: String (required, max 255 chars)
- `description`: String (optional)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

### Course
- `_id`: ObjectId (auto-generated)
- `course_set_id`: ObjectId (ref: CourseSet)
- `course_name`: String (required, max 255 chars)
- `description`: String (optional)
- `duration_hours`: Number (required, min: 1)
- `is_mandatory`: Boolean (required, default: false)
- `validity_months`: Number (optional, min: 1)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

### Training Session
- `_id`: ObjectId (auto-generated)
- `course_id`: ObjectId (ref: Course)
- `session_name`: String (required, max 255 chars)
- `start_time`: Date (required)
- `end_time`: Date (required, must be after start_time)
- `instructor_id`: ObjectId (ref: User, optional)
- `max_participants`: Number (required, min: 1)
- `location`: String (optional, max 255 chars)
- `status_code`: String (required, ref: SessionStatus)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

### Training Enrollment
- `_id`: ObjectId (auto-generated)
- `session_id`: ObjectId (ref: TrainingSession)
- `user_id`: ObjectId (ref: User)
- `enrolled_at`: Date (auto-generated)
- `status`: Enum ['enrolled', 'completed', 'failed', 'cancelled'] (default: 'enrolled')
- `score`: Number (optional, 0-100)
- `passed`: Boolean (optional)
- `completion_date`: Date (optional)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

### Question Bank
- `_id`: ObjectId (auto-generated)
- `course_id`: ObjectId (ref: Course)
- `name`: String (required, max 255 chars)
- `description`: String (optional)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

### Question
- `_id`: ObjectId (auto-generated)
- `bank_id`: ObjectId (ref: QuestionBank)
- `content`: String (required)
- `options`: Array of Strings (required, min: 2 items)
- `correct_answer`: String (required, must be in options)
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

## Notes
- Tất cả timestamps đều sử dụng UTC
- ObjectId được sử dụng làm primary key cho MongoDB
- Các relationship được thiết lập thông qua populate() trong Mongoose
- Validation được thực hiện ở cả client và server side
- API hỗ trợ pagination và filtering cho các endpoint list







