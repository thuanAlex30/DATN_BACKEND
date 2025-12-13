# 📋 Tài Liệu Luồng Xử Lý Incident

## 📑 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Luồng Xử Lý Chi Tiết](#luồng-xử-lý-chi-tiết)
4. [API Endpoints](#api-endpoints)
5. [Quyền Truy Cập](#quyền-truy-cập)
6. [Bảo Mật và Phân Quyền](#bảo-mật-và-phân-quyền)
7. [WebSocket và Events](#websocket-và-events)
8. [Database Schema](#database-schema)
9. [Frontend Integration](#frontend-integration)
10. [Validation và Utils](#validation-và-utils)

---

## 🎯 Tổng Quan

### Mục Đích
Hệ thống quản lý sự cố (Incident Management) cho phép:
- **Employee/Manager**: Ghi nhận sự cố mới
- **Department Header/Manager**: Phân loại, phân công, điều tra và xử lý sự cố
- **Department Header**: Escalate sự cố lên cấp cao hơn
- **Tất cả roles**: Xem danh sách và thống kê sự cố (theo phạm vi quyền)

### Trạng Thái (Status)
- `Mới ghi nhận`: Sự cố vừa được tạo, chưa được phân công
- `Đang xử lý`: Sự cố đã được phân công và đang được xử lý
- `Đã đóng`: Sự cố đã được giải quyết và đóng

### Mức Độ Nghiêm Trọng (Severity)
- `nhẹ`: Sự cố nhỏ, không ảnh hưởng nhiều
- `nặng`: Sự cố nghiêm trọng, cần xử lý ngay
- `rất nghiêm trọng`: Sự cố cực kỳ nghiêm trọng, cần xử lý khẩn cấp

---

## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Thư Mục

```
DATN_BACKEND/
├── models/
│   └── incident.js              # Mongoose schema
├── controllers/
│   └── incidentController.js    # API endpoints handlers
├── services/
│   └── incidentService.js       # Business logic
├── repository/
│   └── incidentRepository.js    # Database operations
├── routes/
│   └── incidentRoutes.js        # Route definitions
├── validations/
│   └── incidentValidation.js     # Input validation rules
├── utils/
│   └── incidentUtils.js         # Helper functions
└── events/
    └── incidentEvents.js        # Event emitters (Kafka)
```

### Luồng Dữ Liệu

```
Frontend Request
    ↓
Route (incidentRoutes.js)
    ↓
AuthMiddleware (Authentication & Authorization)
    ↓
ValidationMiddleware (Input Validation)
    ↓
Controller (incidentController.js)
    ↓
Service (incidentService.js)
    ↓
Repository (incidentRepository.js)
    ↓
MongoDB
```

---

## 🔄 Luồng Xử Lý Chi Tiết

### 1. Ghi Nhận Sự Cố (Report Incident)

**Người thực hiện**: Employee, Manager, Department Header

**Luồng xử lý**:

```
1. User điền form ghi nhận sự cố (title, description, location, severity, images)
   ↓
2. Frontend gọi POST /api/incidents/report
   ↓
3. AuthMiddleware kiểm tra authentication và quyền 'create'
   ↓
4. ValidationMiddleware validate dữ liệu đầu vào
   ↓
5. Controller.reportIncident() nhận request
   ↓
6. Service.createIncident():
   - Lấy tenant_id từ user
   - Validate dữ liệu (IncidentUtils.validateIncidentData)
   - Tạo incidentId tự động (INC{timestamp})
   - Tạo history entry đầu tiên: "Ghi nhận"
   - Lưu vào database
   ↓
7. Emit events:
   - WebSocket: incident_reported
   - Kafka: incident.reported
   ↓
8. Trả về response với incident mới tạo
```

**Dữ liệu đầu vào**:
```json
{
  "title": "Sập giàn giáo",
  "description": "Giàn giáo bị sập tại tầng 3",
  "location": "Tầng 3, Tòa nhà A",
  "severity": "nặng",
  "images": ["base64_image1", "base64_image2"]
}
```

**Kết quả**:
- Incident được tạo với status: `Mới ghi nhận`
- `createdBy` = userId của người tạo
- `assignedTo` = null (chưa được phân công)
- History entry đầu tiên được tạo tự động

---

### 2. Phân Loại Sự Cố (Classify Incident)

**Người thực hiện**: Department Header, Manager

**Luồng xử lý**:

```
1. User chọn incident và cập nhật severity
   ↓
2. Frontend gọi PUT /api/incidents/classify/:id
   ↓
3. AuthMiddleware kiểm tra quyền 'update' với departmentScope: 'hierarchy'
   ↓
4. Service.classifyIncident():
   - Lấy incident hiện tại
   - Lưu severity cũ
   - Cập nhật severity mới
   - Thêm history entry: "Phân loại" với note về thay đổi
   ↓
5. Emit events:
   - WebSocket: incident_classified
   - Kafka: incident.classified
   ↓
6. Trả về incident đã cập nhật
```

**Dữ liệu đầu vào**:
```json
{
  "severity": "rất nghiêm trọng"
}
```

---

### 3. Phân Công Xử Lý (Assign Incident)

**Người thực hiện**: Department Header, Manager

**Luồng xử lý**:

```
1. User chọn incident và người được phân công
   ↓
2. Frontend gọi PUT /api/incidents/assign/:id
   ↓
3. AuthMiddleware kiểm tra quyền 'update' với departmentScope: 'hierarchy'
   ↓
4. Service.assignIncident():
   - Lấy incident hiện tại
   - Cập nhật assignedTo = userId được phân công
   - Cập nhật status = "Đang xử lý"
   - Thêm history entry: "Phân công"
   ↓
5. Emit events:
   - WebSocket: incident_assigned (gửi cho người được phân công)
   - Kafka: incident.assigned
   ↓
6. Trả về incident đã cập nhật
```

**Dữ liệu đầu vào**:
```json
{
  "assignedTo": "userId_của_người_xử_lý"
}
```

**Kết quả**:
- Status chuyển từ `Mới ghi nhận` → `Đang xử lý`
- `assignedTo` được gán
- Người được phân công nhận notification qua WebSocket

---

### 4. Điều Tra Sự Cố (Investigate Incident)

**Người thực hiện**: Department Header, Manager

**Luồng xử lý**:

```
1. User điền form điều tra (investigation, solution, findingsImages, rootCauseImages)
   ↓
2. Frontend gọi PUT /api/incidents/investigate/:id
   ↓
3. AuthMiddleware kiểm tra quyền 'update' với departmentScope: 'hierarchy'
   ↓
4. Service.investigateIncident():
   - Lấy incident hiện tại
   - Thêm 2 history entries:
     * "Điều tra": chứa investigation
     * "Khắc phục": chứa solution
   ↓
5. Emit events:
   - WebSocket: incident_investigated
   - Kafka: incident.investigation_completed
   ↓
6. Trả về incident với history đã cập nhật
```

**Dữ liệu đầu vào**:
```json
{
  "investigation": "Nguyên nhân: Giàn giáo không đủ chắc chắn...",
  "solution": "Khuyến nghị: Kiểm tra và gia cố lại giàn giáo...",
  "findingsImages": ["base64_image1"],
  "rootCauseImages": ["base64_image2"]
}
```

---

### 5. Cập Nhật Tiến Độ (Update Progress)

**Người thực hiện**: Department Header, Manager (người được phân công)

**Luồng xử lý**:

```
1. User cập nhật tiến độ xử lý
   ↓
2. Frontend gọi PUT /api/incidents/progress/:id
   ↓
3. AuthMiddleware kiểm tra quyền 'update' với departmentScope: 'hierarchy'
   ↓
4. Service.updateIncidentProgress():
   - Validate note không được để trống
   - Thêm history entry: "Cập nhật tiến độ" với note
   ↓
5. Emit events:
   - WebSocket: incident_progress_updated
   - Kafka: incident.progress_updated
   ↓
6. Trả về incident với history đã cập nhật
```

**Dữ liệu đầu vào**:
```json
{
  "note": "Đã kiểm tra và gia cố lại giàn giáo. Đang chờ nghiệm thu."
}
```

hoặc

```json
{
  "progress": "Đã kiểm tra và gia cố lại giàn giáo. Đang chờ nghiệm thu."
}
```

---

### 6. Đóng Sự Cố (Close Incident)

**Người thực hiện**: Department Header, Manager

**Luồng xử lý**:

```
1. User xác nhận đóng sự cố (có thể kèm note và images)
   ↓
2. Frontend gọi PUT /api/incidents/close/:id
   ↓
3. AuthMiddleware kiểm tra quyền 'close' với departmentScope: 'hierarchy'
   ↓
4. Service.closeIncident():
   - Lấy incident hiện tại
   - Cập nhật status = "Đã đóng"
   - Thêm history entry: "Đóng" với note
   ↓
5. Emit events:
   - WebSocket: incident_closed
   - Kafka: incident.closed
   ↓
6. Trả về incident đã đóng
```

**Dữ liệu đầu vào**:
```json
{
  "note": "Sự cố đã được giải quyết hoàn toàn",
  "images": ["base64_image_final"]
}
```

**Kết quả**:
- Status chuyển từ `Đang xử lý` → `Đã đóng`
- Incident không thể chỉnh sửa thêm (có thể mở rộng logic này)

---

### 7. Escalate Sự Cố (Escalate Incident)

**Người thực hiện**: Department Header (chỉ)

**Luồng xử lý**:

```
1. Department Header chọn escalate sự cố
   ↓
2. Frontend gọi POST /api/incidents/:id/escalate
   ↓
3. AuthMiddleware kiểm tra:
   - Quyền 'escalate'
   - User phải có department_id
   ↓
4. Controller.escalateIncident():
   - Validate escalation_level (SITE, DEPARTMENT, COMPANY, EXTERNAL)
   - Tạo IncidentEscalation record
   - Thêm history entry: "Escalate"
   - Gửi notification theo level:
     * COMPANY/EXTERNAL → Company Admin
     * SITE → Site Manager
   ↓
5. Emit events:
   - WebSocket: incident_escalated
   - Kafka: incident.escalated
   ↓
6. Trả về incident và escalation record
```

**Dữ liệu đầu vào**:
```json
{
  "escalation_level": "COMPANY",
  "reason": "Sự cố nghiêm trọng, cần sự can thiệp của công ty"
}
```

**Escalation Levels**:
- `SITE`: Escalate lên Site Manager
- `DEPARTMENT`: Escalate lên Department cao hơn
- `COMPANY`: Escalate lên Company Admin
- `EXTERNAL`: Escalate ra bên ngoài (cơ quan chức năng)

---

### 8. Xem Danh Sách Sự Cố (Get Incidents)

**Người thực hiện**: Tất cả roles (theo phạm vi quyền)

**Luồng xử lý**:

```
1. User xem danh sách incidents
   ↓
2. Frontend gọi GET /api/incidents?page=1&limit=20&status=...
   ↓
3. AuthMiddleware kiểm tra quyền 'list'
   ↓
4. Service.getAllIncidents():
   - Lấy tenant_id từ user
   - Build query filters (status, severity, assignedTo, createdBy, dateFrom, dateTo)
   - Gọi Repository.findAll() với tenant_id filter
   ↓
5. Nếu user là department_header:
   - Lọc thêm theo department_id:
     * Chỉ hiển thị incidents có createdBy hoặc assignedTo thuộc cùng department
   ↓
6. Repository.findAll():
   - Query MongoDB với tenant_id filter (BẮT BUỘC)
   - Pagination, sorting
   - Populate createdBy, assignedTo với department_id
   ↓
7. Trả về danh sách incidents đã lọc
```

**Query Parameters**:
- `page`: Số trang (default: 1)
- `limit`: Số lượng mỗi trang (default: 20, max: 50)
- `status`: Lọc theo status
- `severity`: Lọc theo severity
- `assignedTo`: Lọc theo người được phân công
- `createdBy`: Lọc theo người tạo
- `dateFrom`: Lọc từ ngày (ISO format)
- `dateTo`: Lọc đến ngày (ISO format)
- `sortBy`: Sắp xếp theo field (default: createdAt)
- `sortOrder`: asc/desc (default: desc)

**Filter Logic cho Department Header**:
```javascript
// Chỉ hiển thị incidents nếu:
incident.createdBy.department_id === user.department_id 
  || 
incident.assignedTo.department_id === user.department_id
```

---

### 9. Xem Thống Kê (Get Statistics)

**Người thực hiện**: Tất cả roles (theo phạm vi quyền)

**Luồng xử lý**:

```
1. User xem dashboard thống kê
   ↓
2. Frontend gọi GET /api/incidents/stats/overview
   ↓
3. AuthMiddleware kiểm tra quyền 'read'
   ↓
4. Service.getIncidentStats():
   - Lấy tenant_id từ user
   - Gọi Repository.getStatistics() với tenant_id filter
   ↓
5. Nếu user là department_header:
   - Lấy tất cả incidents của tenant (với tenant_id filter)
   - Populate createdBy, assignedTo với department_id
   - Lọc theo department_id (giống getAllIncidents)
   - Tính lại stats từ incidents đã lọc
   ↓
6. Repository.getStatistics():
   - Query MongoDB với tenant_id filter (BẮT BUỘC)
   - Aggregation để tính:
     * total: Tổng số incidents
     * inProgress: Số incidents đang xử lý
     * resolved: Số incidents đã đóng
     * critical: Số incidents rất nghiêm trọng
     * byStatus: Breakdown theo status
     * bySeverity: Breakdown theo severity
   ↓
7. Trả về statistics
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "inProgress": 3,
    "resolved": 5,
    "critical": 2,
    "byStatus": {
      "Mới ghi nhận": 2,
      "Đang xử lý": 3,
      "Đã đóng": 5
    },
    "bySeverity": {
      "nhẹ": 5,
      "nặng": 3,
      "rất nghiêm trọng": 2
    }
  }
}
```

---

## 🔌 API Endpoints

### Base URL
```
/api/incidents
```

### Endpoints

| Method | Endpoint | Action | Mô Tả |
|--------|----------|--------|-------|
| POST | `/report` | create | Ghi nhận sự cố mới |
| GET | `/` | list | Lấy danh sách incidents (có pagination, filter) |
| GET | `/:id` | read | Lấy chi tiết incident |
| PUT | `/classify/:id` | update | Phân loại mức độ nghiêm trọng |
| PUT | `/assign/:id` | update | Phân công người xử lý |
| PUT | `/investigate/:id` | update | Điều tra sự cố |
| PUT | `/progress/:id` | update | Cập nhật tiến độ |
| PUT | `/close/:id` | close | Đóng sự cố |
| POST | `/:id/escalate` | escalate | Escalate sự cố (chỉ Department Header) |
| GET | `/:id/escalations` | read | Lấy danh sách escalations |
| PUT | `/:id` | update | Cập nhật incident (general) |
| DELETE | `/:id` | delete | Xóa incident (chỉ người tạo) |
| GET | `/stats/overview` | read | Lấy thống kê incidents |
| GET | `/search/query` | read | Tìm kiếm incidents |
| GET | `/user/:userId` | read | Lấy incidents theo user |
| GET | `/project/:projectId` | read | Lấy incidents theo project |
| GET | `/status/:status` | read | Lấy incidents theo status |
| GET | `/severity/:severity` | read | Lấy incidents theo severity |

---

## 🔐 Quyền Truy Cập

### Role-Based Access Control

| Chức Năng | Employee | Manager | Department Header | Company Admin |
|-----------|----------|---------|-------------------|---------------|
| Ghi nhận sự cố | ✅ | ✅ | ✅ | ✅ |
| Xem danh sách | ✅ (chỉ của mình) | ✅ (của department) | ✅ (của department) | ✅ (tất cả) |
| Xem chi tiết | ✅ (chỉ của mình) | ✅ (của department) | ✅ (của department) | ✅ (tất cả) |
| Phân loại | ❌ | ✅ | ✅ | ✅ |
| Phân công | ❌ | ✅ | ✅ | ✅ |
| Điều tra | ❌ | ✅ | ✅ | ✅ |
| Cập nhật tiến độ | ❌ | ✅ | ✅ | ✅ |
| Đóng sự cố | ❌ | ✅ | ✅ | ✅ |
| Escalate | ❌ | ❌ | ✅ | ❌ |
| Xóa sự cố | ✅ (chỉ của mình) | ❌ | ✅ (của department) | ✅ |
| Xem thống kê | ✅ (chỉ của mình) | ✅ (của department) | ✅ (của department) | ✅ (tất cả) |

### Permission Scopes

- **tenantScope**: `tenant` - Chỉ truy cập incidents của tenant mình
- **departmentScope**: `hierarchy` - Chỉ truy cập incidents của department mình (cho Department Header)

---

## 🛡️ Bảo Mật và Phân Quyền

### 1. Tenant Isolation (Cô Lập Theo Công Ty)

**Mục đích**: Đảm bảo mỗi công ty chỉ thấy dữ liệu của mình.

**Implementation**:
- Tất cả queries trong `incidentRepository` **BẮT BUỘC** phải có `tenant_id` filter
- `tenant_id` được lấy từ `req.user.tenant_id` (từ JWT token)
- Không có exception nào cho phép query không có `tenant_id`

**Ví dụ**:
```javascript
// ✅ ĐÚNG - Có tenant_id filter
const query = { tenant_id: tenantId, status: 'Mới ghi nhận' };
const incidents = await Incident.find(query);

// ❌ SAI - Không có tenant_id filter
const incidents = await Incident.find({ status: 'Mới ghi nhận' });
```

**Files áp dụng**:
- `incidentRepository.js`: Tất cả methods (getAllIncidents, findAll, getStatistics, searchIncidents, etc.)
- `incidentService.js`: Tất cả methods nhận `tenantId` parameter
- `incidentController.js`: Tất cả endpoints lấy `tenantId` từ `req.user.tenant_id`

---

### 2. Department Filtering (Lọc Theo Phòng Ban)

**Mục đích**: Department Header chỉ thấy incidents của department mình.

**Implementation**:
- Trong `incidentService.getAllIncidents()` và `getIncidentStats()`:
  - Kiểm tra nếu `user.role.role_code === 'department_header'`
  - Lấy tất cả incidents của tenant (đã có tenant_id filter)
  - Populate `createdBy` và `assignedTo` với `department_id`
  - Lọc incidents:
    ```javascript
    if (createdByUser.department_id === user.department_id 
        || assignedToUser.department_id === user.department_id) {
      // Hiển thị incident này
    }
    ```

**Logic**:
- Department Header chỉ thấy incidents:
  - Được tạo bởi user thuộc department của họ (`createdBy.department_id === user.department_id`)
  - HOẶC được phân công cho user thuộc department của họ (`assignedTo.department_id === user.department_id`)

**Ví dụ**:
```
Department Header của "AN TOÀN LAO ĐỘNG" (ID: 692fe04b32535bd27eeb6a00):
✅ Thấy: Incident được tạo bởi user thuộc "AN TOÀN LAO ĐỘNG"
✅ Thấy: Incident được phân công cho user thuộc "AN TOÀN LAO ĐỘNG"
❌ Không thấy: Incident của department khác
```

---

### 3. Authorization Middleware

**AuthMiddleware.authorizeScope()**:
```javascript
AuthMiddleware.authorizeScope({
  modules: 'incident',
  action: 'create',        // create, read, update, delete, list, close, escalate
  tenantScope: 'tenant',   // tenant isolation
  departmentScope: 'hierarchy'  // department filtering (optional)
})
```

**Flow**:
1. Kiểm tra JWT token → Lấy user info
2. Kiểm tra user có quyền `incident:create` không
3. Kiểm tra `tenantScope`: User chỉ truy cập data của `tenant_id` mình
4. Kiểm tra `departmentScope`: Nếu có, kiểm tra department hierarchy

---

## 📡 WebSocket và Events

### WebSocket Events

Khi có thay đổi incident, hệ thống emit WebSocket events để frontend cập nhật real-time:

| Event Type | Event Name | Mô Tả |
|------------|------------|-------|
| created | `incident_reported` | Sự cố mới được ghi nhận |
| classified | `incident_classified` | Sự cố được phân loại |
| assigned | `incident_assigned` | Sự cố được phân công |
| investigated | `incident_investigated` | Sự cố được điều tra |
| progress_updated | `incident_progress_updated` | Tiến độ được cập nhật |
| closed | `incident_closed` | Sự cố được đóng |
| escalated | `incident_escalated` | Sự cố được escalate |

**Implementation**:
```javascript
// Trong incidentService.js
websocketService.emitIncidentEvent(eventType, incident, userId);

// Frontend nhận qua WebSocketProvider
socket.on('incident_reported', (data) => {
  // Cập nhật UI
});
```

---

### Kafka Events

Hệ thống cũng emit Kafka events để tích hợp với các services khác:

| Event Type | Kafka Topic | Mô Tả |
|------------|-------------|-------|
| created | `incident.reported` | Sự cố mới được ghi nhận |
| updated | `incident.updated` | Sự cố được cập nhật |
| assigned | `incident.assigned` | Sự cố được phân công |
| investigated | `incident.investigation_completed` | Điều tra hoàn tất |
| closed | `incident.closed` | Sự cố được đóng |
| deleted | `incident.deleted` | Sự cố bị xóa |
| escalated | `incident.escalated` | Sự cố được escalate |

**Implementation**:
```javascript
// Trong incidentService.js
await IncidentEvents.emitIncidentReported(incident, user);
```

---

## 💾 Database Schema

### Incident Model

```javascript
{
  tenant_id: ObjectId,              // REQUIRED - Tenant isolation
  project_id: ObjectId,             // Optional - Link to project
  title: String,                    // REQUIRED
  description: String,              // Optional
  images: [String],                 // Array of base64 images
  location: String,                 // Optional
  severity: String,                 // Enum: 'nhẹ', 'nặng', 'rất nghiêm trọng'
  status: String,                   // Enum: 'Mới ghi nhận', 'Đang xử lý', 'Đã đóng'
  incidentId: String,               // Unique: INC{timestamp}
  assignedTo: ObjectId (ref: User), // Optional - Người được phân công
  createdBy: ObjectId (ref: User), // REQUIRED - Người tạo
  notified: Boolean,                 // Default: false
  histories: [IncidentHistory],     // Array of history entries
  createdAt: Date                   // Auto-generated
}
```

### IncidentHistory Schema

```javascript
{
  action: String,                   // 'Ghi nhận', 'Phân loại', 'Phân công', etc.
  performedBy: ObjectId (ref: User), // Người thực hiện
  timestamp: Date,                   // Thời gian thực hiện
  note: String                       // Ghi chú
}
```

### Indexes

```javascript
IncidentSchema.index({ tenant_id: 1 });        // Tenant filtering
IncidentSchema.index({ status: 1 });           // Status filtering
IncidentSchema.index({ severity: 1 });         // Severity filtering
IncidentSchema.index({ createdAt: -1 });       // Sorting
IncidentSchema.index({ assignedTo: 1 });       // Assigned filtering
IncidentSchema.index({ createdBy: 1 });       // Created by filtering
```

---

## 🎨 Frontend Integration

### Service Layer

**File**: `DATN_FONTEND/src/services/incidentService.ts`

```typescript
// Ghi nhận sự cố
incidentService.reportIncident({
  title: string,
  description?: string,
  images?: string[],
  location?: string,
  severity?: 'nhẹ' | 'nặng' | 'rất nghiêm trọng'
})

// Lấy danh sách
incidentService.getIncidents(project_id?: string)

// Lấy thống kê
incidentService.getIncidentStats()

// Phân loại
incidentService.classifyIncident(id, { severity })

// Phân công
incidentService.assignIncident(id, { assignedTo })

// Điều tra
incidentService.investigateIncident(id, { investigation, solution })

// Cập nhật tiến độ
incidentService.updateIncidentProgress(id, { note })

// Đóng sự cố
incidentService.closeIncident(id, { note, images })
```

### Pages

1. **ReportIncident** (`/employee/report-incident`, `/manager/report-incident`)
   - Form ghi nhận sự cố
   - Upload images (base64)
   - Validation client-side

2. **IncidentManagement** (`/header-department/incident-management`)
   - Danh sách incidents với filters
   - Thống kê dashboard
   - Actions: classify, assign, investigate, close

3. **IncidentDetail** (`/incidents/:id`)
   - Chi tiết incident
   - History timeline
   - Update progress form

### WebSocket Integration

**File**: `DATN_FONTEND/src/components/WebSocketProvider/WebSocketProvider.tsx`

```typescript
socket.on('incident_reported', (data) => {
  // Refresh incident list
  // Show notification
});

socket.on('incident_assigned', (data) => {
  // Update incident status
  // Show notification to assigned user
});
```

---

## ✅ Validation và Utils

### Validation Rules

**File**: `DATN_BACKEND/validations/incidentValidation.js`

- **createIncident**: title (required), description, location, severity (enum), images (array)
- **classifyIncident**: severity (required, enum)
- **assignIncident**: assignedTo (required, ObjectId)
- **investigateIncident**: investigation (required), solution (required)
- **updateProgress**: note hoặc progress (required, không được để trống)

### Utils Functions

**File**: `DATN_BACKEND/utils/incidentUtils.js`

- `generateIncidentId()`: Tạo ID tự động (INC{timestamp})
- `validateIncidentData()`: Validate dữ liệu incident
- `validateInvestigationData()`: Validate dữ liệu điều tra
- `getSeverityColor()`: Lấy màu sắc cho severity
- `getStatusColor()`: Lấy màu sắc cho status
- `calculateProcessingTime()`: Tính thời gian xử lý
- `canCloseIncident()`: Kiểm tra có thể đóng không
- `canAssignIncident()`: Kiểm tra có thể phân công không
- `getNextAvailableActions()`: Lấy các action có thể thực hiện tiếp theo

---

## 🔍 Troubleshooting

### Vấn Đề Thường Gặp

1. **Department Header không thấy incidents**
   - **Nguyên nhân**: Incidents không thuộc department của họ
   - **Giải pháp**: Kiểm tra `createdBy.department_id` và `assignedTo.department_id`

2. **Tenant A thấy incidents của Tenant B**
   - **Nguyên nhân**: Thiếu `tenant_id` filter trong query
   - **Giải pháp**: Đảm bảo tất cả queries có `tenant_id` filter

3. **WebSocket không nhận được events**
   - **Nguyên nhân**: WebSocket connection bị ngắt
   - **Giải pháp**: Kiểm tra WebSocketProvider và connection status

4. **Stats không chính xác cho Department Header**
   - **Nguyên nhân**: Stats chưa được filter theo department
   - **Giải pháp**: Đảm bảo `getIncidentStats()` có logic filter department

---

## 📝 Ghi Chú Quan Trọng

1. **Tenant Isolation là BẮT BUỘC**: Tất cả queries phải có `tenant_id` filter
2. **Department Filtering**: Chỉ áp dụng cho `department_header` role
3. **History Tracking**: Mọi thay đổi đều được ghi vào `histories` array
4. **Status Flow**: `Mới ghi nhận` → `Đang xử lý` → `Đã đóng`
5. **WebSocket Events**: Tất cả actions đều emit events để real-time update
6. **Validation**: Cả client-side và server-side validation
7. **Error Handling**: Tất cả errors được catch và trả về format chuẩn

---

## 🔄 Workflow Diagram

```
[Employee/Manager] Ghi nhận sự cố
         ↓
    [Mới ghi nhận]
         ↓
[Department Header/Manager] Phân loại severity
         ↓
[Department Header/Manager] Phân công người xử lý
         ↓
    [Đang xử lý]
         ↓
[Department Header/Manager] Điều tra & Khắc phục
         ↓
[Department Header/Manager] Cập nhật tiến độ (có thể nhiều lần)
         ↓
[Department Header/Manager] Đóng sự cố
         ↓
      [Đã đóng]
```

**Escalation Path** (nếu cần):
```
[Department Header] Escalate
         ↓
    [SITE/DEPARTMENT/COMPANY/EXTERNAL]
```

---

## 📚 Tài Liệu Tham Khảo

- **Models**: `DATN_BACKEND/models/incident.js`
- **Controllers**: `DATN_BACKEND/controllers/incidentController.js`
- **Services**: `DATN_BACKEND/services/incidentService.js`
- **Repository**: `DATN_BACKEND/repository/incidentRepository.js`
- **Routes**: `DATN_BACKEND/routes/incidentRoutes.js`
- **Validations**: `DATN_BACKEND/validations/incidentValidation.js`
- **Utils**: `DATN_BACKEND/utils/incidentUtils.js`
- **Frontend Service**: `DATN_FONTEND/src/services/incidentService.ts`

---

**Tài liệu được tạo bởi**: AI Assistant  
**Ngày tạo**: 2025-01-09  
**Phiên bản**: 1.0

