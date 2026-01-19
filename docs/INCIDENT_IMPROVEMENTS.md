# 📋 Cải Tiến Luồng Incident - Tóm Tắt Thay Đổi

## 🎯 Mục Tiêu
Cải thiện quy trình xử lý sự cố theo yêu cầu:
- **Phân công vai trò**: Kiểm tra conflict về địa điểm
- **Thời gian**: Quản lý thời gian xử lý và dự kiến hoàn thành
- **Địa điểm**: Validate và kiểm tra conflict khi phân công
- **Minh chứng**: Cải thiện quản lý evidence
- **Lịch sử**: Lưu lại đầy đủ thông tin quản lý an toàn lao động

---

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. **Cập Nhật Incident Model** (`models/incident.js`)

#### Thêm các field thời gian:
```javascript
estimatedCompletionTime: Date,    // Thời gian dự kiến hoàn thành
actualStartTime: Date,             // Thời gian bắt đầu xử lý thực tế
actualCompletionTime: Date         // Thời gian hoàn thành thực tế
```

#### Cải thiện History Schema - Quản lý minh chứng:
```javascript
evidenceImages: [String],          // Hình ảnh minh chứng (tổng quát)
findingsImages: [String],          // Backward compatible
evidenceType: String,              // Loại minh chứng: 'photo', 'document', 'video', 'other'
evidenceDescription: String        // Mô tả về minh chứng
```

#### Thêm Indexes:
- `location: 1` - Index cho location
- `{ assignedTo: 1, status: 1, location: 1 }` - Composite index cho location conflict check

---

### 2. **Cập Nhật Repository** (`repository/incidentRepository.js`)

#### Thêm method kiểm tra active incident:
```javascript
/**
 * Kiểm tra xem user có đang xử lý sự cố nào không
 * Rule: 1 manager chỉ được quyền xử lý 1 sự cố
 */
async checkActiveIncident(userId, excludeIncidentId, tenantId)
```

**Kết quả trả về:**
```javascript
{
  hasActiveIncident: boolean,
  activeIncident: Object | null // Sự cố đang xử lý (nếu có)
}
```

#### Thêm method kiểm tra location conflict (DEPRECATED - giữ lại cho backward compatibility):
```javascript
/**
 * Kiểm tra xem user có đang xử lý sự cố tại địa điểm khác không
 * DEPRECATED: Đã được thay thế bởi checkActiveIncident
 */
async checkLocationConflict(userId, location, excludeIncidentId, tenantId)
```

#### Thêm method lấy incidents theo user và location:
```javascript
async getActiveIncidentsByUserAndLocation(userId, location, tenantId)
```

---

### 3. **Cập Nhật Service** (`services/incidentService.js`)

#### Cải thiện `assignIncident()`:
- ✅ **Kiểm tra active incident** trước khi phân công (NEW)
- ✅ Tự động set `actualStartTime` khi phân công
- ✅ Hỗ trợ `estimatedCompletionTime` khi phân công
- ✅ Ghi lại thông tin đầy đủ trong history (tên người, địa điểm, thời gian dự kiến)

**Logic kiểm tra active incident:**
```javascript
// Kiểm tra xem user có đang xử lý sự cố nào không
// Rule: 1 manager chỉ được quyền xử lý 1 sự cố
// Nếu có active incident → Trả về error 400 với thông tin chi tiết
if (activeCheck.hasActiveIncident) {
  return {
    success: false,
    message: `Người này đang xử lý sự cố ${activeIncident.incidentId} tại địa điểm: ${activeIncident.location}. 
              Một người chỉ được quyền xử lý 1 sự cố tại một thời điểm.`,
    statusCode: 400,
    data: { hasActiveIncident: true, activeIncident: {...} }
  };
}
```

#### Cải thiện `closeIncident()`:
- ✅ Tự động set `actualCompletionTime` khi đóng incident

#### Cải thiện `investigateIncident()`:
- ✅ Quản lý minh chứng tốt hơn với `evidenceImages`, `evidenceType`, `evidenceDescription`

---

### 4. **Cập Nhật Controller** (`controllers/incidentController.js`)

#### Hỗ trợ assign với estimatedCompletionTime:
```javascript
// Request body có thể là:
{
  assignedTo: "userId",
  estimatedCompletionTime: "2024-01-15T10:00:00Z" // Optional
}
```

---

### 5. **Cập Nhật Validation** (`validations/incidentValidation.js`)

#### Thêm validation cho `estimatedCompletionTime`:
```javascript
assignIncident: {
  assignedTo: ObjectId (required),
  estimatedCompletionTime: Date (optional, must be > now)
}
```

---

### 6. **Cập Nhật Utils** (`utils/incidentUtils.js`)

#### Thêm method validate evidence:
```javascript
static validateEvidence(evidenceImages)
```

---

## 📝 Cách Sử Dụng

### Phân Công Incident Với Active Incident Check

**API Endpoint:** `PUT /api/incidents/assign/:id`

**Request Body:**
```json
{
  "assignedTo": "userId",
  "estimatedCompletionTime": "2024-01-15T10:00:00Z"  // Optional
}
```

**Response khi có active incident:**
```json
{
  "success": false,
  "message": "Người này đang xử lý sự cố INC001 tại địa điểm: Công trường A. Một người chỉ được quyền xử lý 1 sự cố tại một thời điểm. Vui lòng đợi sự cố hiện tại được đóng.",
  "statusCode": 400,
  "data": {
    "hasActiveIncident": true,
    "activeIncident": {
      "_id": "...",
      "incidentId": "INC001",
      "title": "Sự cố đang xử lý",
      "location": "Công trường A",
      "status": "Đang xử lý",
      "createdAt": "...",
      "actualStartTime": "...",
      "estimatedCompletionTime": "..."
    }
  }
}
```

### Thêm Minh Chứng Khi Điều Tra

**API Endpoint:** `PUT /api/incidents/investigate/:id`

**Request Body:**
```json
{
  "investigation": "Kết quả điều tra...",
  "solution": "Khuyến nghị...",
  "findingsImages": ["url1", "url2"],  // Sẽ được lưu vào evidenceImages
  "rootCauseImages": ["url3"]
}
```

History entry sẽ tự động có:
- `evidenceImages`: Tất cả ảnh minh chứng
- `evidenceType`: "photo"
- `evidenceDescription`: "Hình ảnh minh chứng kết quả điều tra sự cố"

---

## 🔍 Business Rules

### Rule 1: Active Incident Check (NEW)
**"1 manager chỉ được quyền xử lý 1 sự cố. Khi sự cố đang xử lý đã đóng thì mới được nhận sự cố tiếp theo"**

- ✅ Khi phân công, hệ thống kiểm tra xem user có đang xử lý sự cố nào không (bất kể địa điểm)
- ✅ Chỉ kiểm tra các incidents có `status = 'Đang xử lý'`
- ✅ Nếu user đang xử lý sự cố → Từ chối phân công và trả về thông tin chi tiết về sự cố đang xử lý
- ✅ Khi sự cố được đóng (`status = 'Đã đóng'`), user mới có thể nhận sự cố mới

**Lưu ý:** Rule này thay thế rule location conflict check cũ. Một user chỉ được xử lý 1 sự cố tại một thời điểm, bất kể địa điểm.

### Rule 2: Thời Gian Xử Lý
- ✅ `actualStartTime`: Tự động set khi phân công (assign)
- ✅ `estimatedCompletionTime`: Có thể set khi phân công (optional)
- ✅ `actualCompletionTime`: Tự động set khi đóng (close)

### Rule 3: Minh Chứng (Evidence) (Cũ là Rule 4)
- ✅ Tất cả hình ảnh minh chứng được lưu trong `evidenceImages`
- ✅ Hỗ trợ các loại: `photo`, `document`, `video`, `other`
- ✅ Có thể thêm mô tả cho từng minh chứng

---

## 🧪 Testing

### Test Case 1: Active Incident Check (NEW)
```javascript
// 1. Tạo incident A tại "Địa điểm X"
// 2. Assign user "John" cho incident A → ✅ Success
// 3. Tạo incident B tại "Địa điểm Y" (hoặc bất kỳ địa điểm nào)
// 4. Assign user "John" cho incident B → ❌ Error 400 (Active Incident)
//    → Message: "Người này đang xử lý sự cố INC001 tại địa điểm: Địa điểm X..."
// 5. Đóng incident A → ✅ Success
// 6. Assign user "John" cho incident B → ✅ Success (sau khi đóng incident A)
```

### Test Case 2: Close Incident Updates Time
```javascript
// 1. Assign incident → actualStartTime được set
// 2. Close incident → actualCompletionTime được set
// 3. Có thể tính toán thời gian xử lý từ actualStartTime → actualCompletionTime
```

---

## 📚 Files Đã Thay Đổi

1. ✅ `DATN_BACKEND/models/incident.js` - Cập nhật schema
2. ✅ `DATN_BACKEND/repository/incidentRepository.js` - Thêm conflict check methods
3. ✅ `DATN_BACKEND/services/incidentService.js` - Validate conflict và quản lý thời gian
4. ✅ `DATN_BACKEND/controllers/incidentController.js` - Hỗ trợ estimatedCompletionTime
5. ✅ `DATN_BACKEND/validations/incidentValidation.js` - Validation cho estimatedCompletionTime
6. ✅ `DATN_BACKEND/utils/incidentUtils.js` - Thêm validateEvidence method

---

## 🎉 Kết Quả

✅ **Hoàn thành tất cả yêu cầu:**
1. ✅ Phân công vai trò với validation conflict
2. ✅ Quản lý thời gian (bắt đầu, dự kiến, hoàn thành)
3. ✅ Validate địa điểm và kiểm tra conflict
4. ✅ Cải thiện quản lý minh chứng
5. ✅ Lưu lại đầy đủ lịch sử quản lý an toàn lao động

---

**Cập nhật lần cuối:** 2024-12-06

---

## 📝 Cập Nhật Mới (2024-12-06)

### ✅ Business Rule Mới: Active Incident Check

**Thay đổi:** Rule "Location Conflict Check" đã được thay thế bằng rule mới:
- **Rule cũ:** Một người không thể xử lý sự cố tại các địa điểm khác nhau cùng lúc (nhưng có thể xử lý nhiều sự cố ở cùng địa điểm)
- **Rule mới:** 1 manager chỉ được quyền xử lý 1 sự cố tại một thời điểm (bất kể địa điểm). Khi sự cố đang xử lý đã đóng thì mới được nhận sự cố tiếp theo.

**Files đã cập nhật:**
- ✅ `DATN_BACKEND/repository/incidentRepository.js` - Thêm method `checkActiveIncident()`
- ✅ `DATN_BACKEND/services/incidentService.js` - Cập nhật `assignIncident()` để sử dụng `checkActiveIncident()`
- ✅ `DATN_FONTEND/src/types/incident.ts` - Thêm interface `ActiveIncidentError`
- ✅ `DATN_FONTEND/src/pages/header_department/IncidentManagement/AssignIncident.tsx` - Cập nhật UI để hiển thị active incident error

