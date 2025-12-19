# Bổ Sung Code Backend Training Module

## Tổng Quan

Tài liệu này mô tả các thay đổi đã được thực hiện để bổ sung code backend cho Training module, đảm bảo khớp với tài liệu đã được tạo trước đó.

## Các Thay Đổi Đã Thực Hiện

### 1. Thêm Field `prerequisite_course_ids` vào Course Model

**File**: `DATN_BACKEND/models/course.js`

**Thay đổi**:
- Thêm field `prerequisite_course_ids` vào Course schema
- Field này là một mảng các ObjectId tham chiếu đến các Course khác
- Mặc định là mảng rỗng `[]`

**Code**:
```javascript
prerequisite_course_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Course',
    default: []
}
```

### 2. Thêm Logic Kiểm Tra Session Capacity

**File**: `DATN_BACKEND/repository/TrainingRepository.js`

**Thay đổi**:
- Cập nhật method `createTrainingEnrollment` để kiểm tra capacity trước khi tạo enrollment
- Kiểm tra xem user đã đăng ký session này chưa
- Kiểm tra số lượng enrollment hiện tại so với `max_participants` của session
- Chỉ đếm các enrollment có status `enrolled` hoặc `completed`

**Logic**:
1. Kiểm tra user đã đăng ký chưa → Nếu có, throw error "User is already enrolled in this session"
2. Lấy session từ database → Nếu không tìm thấy, throw error "Training session not found"
3. Đếm số enrollment hiện tại (status: `enrolled` hoặc `completed`)
4. So sánh với `max_participants` → Nếu đầy, throw error "Session is full"
5. Nếu pass tất cả checks, tạo enrollment

### 3. Thêm Logic Kiểm Tra Prerequisites

**File**: `DATN_BACKEND/repository/TrainingRepository.js`

**Thay đổi**:
- Thêm method mới `checkPrerequisites(userId, courseId, tenantId)`
- Method này kiểm tra xem user đã hoàn thành tất cả các prerequisite courses chưa

**Logic**:
1. Lấy course từ database
2. Nếu course không có prerequisites → return `{ passed: true, missing: [] }`
3. Tìm tất cả sessions của các prerequisite courses
4. Tìm các enrollment đã completed và passed của user trong các sessions đó
5. So sánh danh sách course IDs đã completed với danh sách prerequisites
6. Return `{ passed: boolean, missing: Array<courseId> }`

**File**: `DATN_BACKEND/services/trainingService.js`

**Thay đổi**:
- Cập nhật method `createTrainingEnrollment` để gọi `checkPrerequisites` trước khi tạo enrollment
- Nếu prerequisites không đủ, return error message với danh sách các course còn thiếu

**Error Message**:
```
"Prerequisites not met. Please complete the following courses first: [course names]"
```

### 4. Thêm Validation cho `prerequisite_course_ids`

**File**: `DATN_BACKEND/validations/trainingValidation.js`

**Thay đổi**:
- Thêm validation cho field `prerequisite_course_ids` trong `createCourse` và `updateCourse`
- Validation đảm bảo:
  - `prerequisite_course_ids` phải là một array (nếu có)
  - Mỗi phần tử trong array phải là một valid ObjectId

**Code**:
```javascript
body('prerequisite_course_ids')
    .optional()
    .isArray()
    .withMessage('prerequisite_course_ids must be an array'),
body('prerequisite_course_ids.*')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Each prerequisite course ID must be a valid ObjectId')
```

## Luồng Hoạt Động Mới

### Khi Employee Đăng Ký Training Session

1. **Controller** (`TrainingController.createTrainingEnrollment`):
   - Nhận request từ client
   - Nếu user là employee, tự động set `user_id` = `req.user.id`

2. **Service** (`trainingService.createTrainingEnrollment`):
   - Lấy `tenantId` từ session nếu chưa có
   - Lấy session từ database
   - **Kiểm tra Prerequisites**:
     - Gọi `trainingRepository.checkPrerequisites(userId, courseId, tenantId)`
     - Nếu không pass → return error với danh sách courses còn thiếu
   - Gọi `trainingRepository.createTrainingEnrollment()`

3. **Repository** (`trainingRepository.createTrainingEnrollment`):
   - **Kiểm tra Duplicate Enrollment**:
     - Tìm enrollment hiện có của user trong session này
     - Nếu có → throw error "User is already enrolled in this session"
   - **Kiểm tra Session Capacity**:
     - Lấy session từ database
     - Đếm số enrollment hiện tại (status: `enrolled` hoặc `completed`)
     - So sánh với `max_participants`
     - Nếu đầy → throw error "Session is full"
   - Tạo enrollment mới

## Error Handling

Các error messages được xử lý trong service:

- `"User is already enrolled in this session"` → 400 Bad Request
- `"Training session not found"` → 400 Bad Request
- `"Session is full"` → 400 Bad Request
- `"Course not found"` → 400 Bad Request
- `"Prerequisites not met. Please complete the following courses first: [names]"` → 400 Bad Request (kèm `missing_prerequisites` array)

## Testing Recommendations

### Test Cases Cần Kiểm Tra:

1. **Session Capacity**:
   - ✅ Đăng ký khi session còn chỗ
   - ✅ Đăng ký khi session đã đầy → expect error "Session is full"
   - ✅ Đăng ký lại session đã đăng ký → expect error "User is already enrolled"

2. **Prerequisites**:
   - ✅ Đăng ký course không có prerequisites → success
   - ✅ Đăng ký course có prerequisites, user đã hoàn thành → success
   - ✅ Đăng ký course có prerequisites, user chưa hoàn thành → expect error với danh sách courses còn thiếu
   - ✅ Đăng ký course có prerequisites, user đã hoàn thành một phần → expect error với danh sách courses còn thiếu

3. **Validation**:
   - ✅ Tạo course với `prerequisite_course_ids` là array hợp lệ → success
   - ✅ Tạo course với `prerequisite_course_ids` chứa invalid ObjectId → expect validation error
   - ✅ Tạo course với `prerequisite_course_ids` không phải array → expect validation error

## Database Schema Changes

### Course Model
```javascript
{
    // ... existing fields ...
    prerequisite_course_ids: [ObjectId], // NEW FIELD
    // ... existing fields ...
}
```

**Migration Note**: 
- Field mới này có default value là `[]`, nên không cần migration cho dữ liệu cũ
- Các course hiện tại sẽ tự động có `prerequisite_course_ids = []`

## API Changes

### Create Course
**Endpoint**: `POST /api/training/courses`

**Request Body** (thêm field mới):
```json
{
    "course_set_id": "...",
    "course_name": "...",
    "description": "...",
    "duration_hours": 8,
    "is_mandatory": true,
    "validity_months": 12,
    "prerequisite_course_ids": ["course_id_1", "course_id_2"] // NEW FIELD (optional)
}
```

### Update Course
**Endpoint**: `PUT /api/training/courses/:courseId`

**Request Body** (thêm field mới):
```json
{
    "prerequisite_course_ids": ["course_id_1", "course_id_2"] // NEW FIELD (optional)
}
```

### Create Training Enrollment
**Endpoint**: `POST /api/training/enrollments`

**Behavior Changes**:
- Tự động kiểm tra session capacity
- Tự động kiểm tra prerequisites
- Return error messages chi tiết hơn

**Response (Error Case - Prerequisites)**:
```json
{
    "success": false,
    "message": "Prerequisites not met. Please complete the following courses first: Course A, Course B",
    "data": {
        "missing_prerequisites": ["course_id_1", "course_id_2"]
    }
}
```

## Files Modified

1. `DATN_BACKEND/models/course.js` - Thêm field `prerequisite_course_ids`
2. `DATN_BACKEND/repository/TrainingRepository.js` - Thêm logic check capacity và prerequisites
3. `DATN_BACKEND/services/trainingService.js` - Thêm logic check prerequisites trong service
4. `DATN_BACKEND/validations/trainingValidation.js` - Thêm validation cho `prerequisite_course_ids`

## Notes

- Tất cả các thay đổi đều backward compatible (không ảnh hưởng đến code hiện tại)
- Field `prerequisite_course_ids` là optional, mặc định là `[]`
- Logic check prerequisites chỉ chạy khi course có prerequisites
- Logic check capacity luôn chạy khi tạo enrollment

