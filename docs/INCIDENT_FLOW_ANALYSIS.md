# 📋 PHÂN TÍCH LUỒNG INCIDENT MANAGEMENT

## 🎯 TỔNG QUAN

Tài liệu này phân tích chi tiết hệ thống quản lý sự cố (Incident Management) trong hệ thống Quản lý An toàn Lao động, bao gồm:
- Kiến trúc hệ thống và data models
- Các luồng nghiệp vụ (business workflows)
- Phân quyền và authorization
- API endpoints và integration points
- Business rules và validation logic

---

## 📐 KIẾN TRÚC HỆ THỐNG

### 1. Data Models

#### 1.1. Incident Model (`models/incident.js`)

**Schema chính:**

```javascript
{
  tenant_id: ObjectId (required),
  project_id: ObjectId (optional),
  title: String (required),
  description: String,
  images: [String],
  location: String (required),
  severity: String (enum: ['nhẹ', 'nặng', 'rất nghiêm trọng'], default: 'nhẹ'),
  status: String (enum: ['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'], default: 'Mới ghi nhận'),
  incidentId: String (unique, auto-generated),
  assignedTo: ObjectId (ref: 'User'),
  createdBy: ObjectId (ref: 'User'),
  notified: Boolean (default: false),
  
  // Thời gian xử lý
  estimatedCompletionTime: Date,      // Dự kiến hoàn thành (optional, set khi assign)
  actualStartTime: Date,              // Bắt đầu thực tế (auto-set khi assign)
  actualCompletionTime: Date,         // Hoàn thành thực tế (auto-set khi close)
  
  histories: [IncidentHistorySchema],
  createdAt: Date (default: Date.now)
}
```

**Indexes:**
- `tenant_id: 1`
- `status: 1`
- `severity: 1`
- `createdAt: -1`
- `assignedTo: 1`
- `createdBy: 1`
- `location: 1`
- `{ assignedTo: 1, status: 1, location: 1 }` (composite index)

#### 1.2. IncidentHistory Schema

**Embedded trong Incident:**

```javascript
{
  action: String,                    // 'Ghi nhận', 'Phân loại', 'Phân công', 'Điều tra', 'Cập nhật tiến độ', 'Đóng', 'Escalate'
  performedBy: ObjectId (ref: 'User'),
  timestamp: Date (default: Date.now),
  note: String,
  
  // Minh chứng (Evidence)
  evidenceImages: [String],          // Hình ảnh minh chứng
  findingsImages: [String],          // Backward compatible
  evidenceType: String (enum: ['photo', 'document', 'video', 'other'], default: 'photo'),
  evidenceDescription: String        // Mô tả minh chứng
}
```

---

## 🔄 LUỒNG NGHIỆP VỤ (BUSINESS WORKFLOWS)

### Workflow 1: Ghi Nhận Sự Cố (Report Incident)

**Actor:** Employee, Manager, Department Header

**Mô tả:** Bất kỳ user nào cũng có thể ghi nhận sự cố mới

**Luồng:**

```
1. User tạo incident mới
   POST /api/incidents/report
   
2. Request Body:
   {
     title: String (required),
     description: String,
     images: [String] (base64 hoặc URLs),
     location: String (required),
     severity: 'nhẹ' | 'nặng' | 'rất nghiêm trọng' (default: 'nhẹ'),
     project_id: ObjectId (optional)
   }

3. System Actions:
   ✅ Validate dữ liệu (title, location required)
   ✅ Upload images lên Cloudinary (nếu là base64)
   ✅ Generate incidentId tự động (format: INC-YYYYMMDD-XXXXXX)
   ✅ Set status = 'Mới ghi nhận'
   ✅ Set createdBy = userId
   ✅ Create initial history entry: action = 'Ghi nhận'
   ✅ Emit event: INCIDENT_REPORTED
   ✅ Send WebSocket notification

4. Response:
   {
     success: true,
     data: {
       _id: ObjectId,
       incidentId: "INC-20240114-000001",
       title: "...",
       status: "Mới ghi nhận",
       ...
     }
   }
```

**Lịch sử (History) tự động tạo:**
```javascript
{
  action: 'Ghi nhận',
  performedBy: userId,
  note: 'Ghi nhận sự cố',
  timestamp: Date.now()
}
```

---

### Workflow 2: Phân Loại Sự Cố (Classify Incident)

**Actor:** Department Header, Manager

**Mô tả:** Cập nhật mức độ nghiêm trọng (severity) của sự cố

**Luồng:**

```
1. Manager/Department Header phân loại
   PUT /api/incidents/classify/:id
   
2. Request Body:
   {
     severity: 'nhẹ' | 'nặng' | 'rất nghiêm trọng' (required)
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate permission (update permission required)
   ✅ Update severity field
   ✅ Add history entry: action = 'Phân loại'
   ✅ Emit event: INCIDENT_CLASSIFIED
   ✅ Send WebSocket notification

4. Response:
   {
     success: true,
     data: { updated incident },
     message: 'Phân loại incident thành công'
   }
```

**Lịch sử (History) tự động tạo:**
```javascript
{
  action: 'Phân loại',
  performedBy: userId,
  note: 'Phân loại mức độ: [severity]',
  timestamp: Date.now()
}
```

---

### Workflow 3: Phân Công Xử Lý (Assign Incident)

**Actor:** Department Header, Manager

**Mô tả:** Phân công người phụ trách xử lý sự cố với validation rule

**Luồng:**

```
1. Manager/Department Header phân công
   PUT /api/incidents/assign/:id
   
2. Request Body:
   {
     assignedTo: ObjectId (required),
     estimatedCompletionTime: Date (optional, must be > now)
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate permission (update permission required)
   
   ✅ BUSINESS RULE: Check Active Incident
      → Gọi checkActiveIncident(assignedTo, incidentId)
      → Nếu user đang có incident với status = 'Đang xử lý'
      → Return error 400 với thông tin active incident
   
   ✅ Update fields:
      - assignedTo = assignedTo
      - status = 'Đang xử lý'
      - actualStartTime = Date.now() (auto-set)
      - estimatedCompletionTime = estimatedCompletionTime (nếu có)
   
   ✅ Add history entry với thông tin đầy đủ:
      {
        action: 'Phân công',
        performedBy: userId,
        note: `Phân công xử lý cho [assigneeName] tại địa điểm: [location]. Dự kiến hoàn thành: [estimatedCompletionTime]`,
        timestamp: Date.now()
      }
   
   ✅ Emit event: INCIDENT_ASSIGNED
   ✅ Send WebSocket notification cho assigned user

4. Response (Success):
   {
     success: true,
     data: { updated incident },
     message: 'Phân công incident thành công'
   }

5. Response (Error - Active Incident):
   {
     success: false,
     message: 'Người này đang xử lý sự cố INC001 tại địa điểm: X...',
     statusCode: 400,
     data: {
       hasActiveIncident: true,
       activeIncident: {
         _id: ObjectId,
         incidentId: "INC-20240114-000001",
         title: "...",
         location: "...",
         status: "Đang xử lý",
         actualStartTime: Date,
         estimatedCompletionTime: Date
       }
     }
   }
```

**Business Rule: Active Incident Check**

```javascript
// Rule: 1 manager chỉ được quyền xử lý 1 sự cố
// Khi sự cố đang xử lý đã đóng thì mới được nhận sự cố tiếp theo

checkActiveIncident(userId, excludeIncidentId, tenantId) {
  // Query: assignedTo = userId AND status = 'Đang xử lý' AND _id != excludeIncidentId
  // Nếu có kết quả → hasActiveIncident = true
  // Return: { hasActiveIncident: boolean, activeIncident: Object | null }
}
```

---

### Workflow 4: Điều Tra & Khắc Phục (Investigate & Resolve)

**Actor:** Manager (assigned user)

**Mô tả:** Người được phân công điều tra và đề xuất giải pháp khắc phục

**Luồng:**

```
1. Manager điều tra sự cố
   PUT /api/incidents/investigate/:id
   
2. Request Body:
   {
     investigation: String (required),      // Kết quả điều tra
     solution: String (required),           // Giải pháp khắc phục
     findingsImages: [String] (optional),   // Ảnh minh chứng điều tra
     rootCauseImages: [String] (optional)   // Ảnh nguyên nhân gốc rễ
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate permission (assigned user hoặc update permission)
   ✅ Upload images lên Cloudinary (nếu là base64)
   ✅ Merge images vào incident.images
   
   ✅ Add investigation history entry:
      {
        action: 'Điều tra',
        performedBy: userId,
        note: investigation,
        evidenceImages: findingsImages,
        evidenceType: 'photo',
        evidenceDescription: 'Hình ảnh minh chứng kết quả điều tra sự cố'
      }
   
   ✅ Add solution history entry:
      {
        action: 'Khắc phục',
        performedBy: userId,
        note: solution,
        timestamp: Date.now()
      }
   
   ✅ Emit event: INCIDENT_INVESTIGATED
   ✅ Send WebSocket notification

4. Response:
   {
     success: true,
     data: { updated incident with histories },
     message: 'Điều tra incident thành công'
   }
```

---

### Workflow 5: Cập Nhật Tiến Độ (Update Progress)

**Actor:** Manager (assigned user)

**Mô tả:** Cập nhật tiến độ xử lý sự cố (có thể gọi nhiều lần)

**Luồng:**

```
1. Manager cập nhật tiến độ
   PUT /api/incidents/progress/:id
   
2. Request Body:
   {
     note: String (required),        // Hoặc 'progress'
     images: [String] (optional)     // Ảnh minh chứng tiến độ
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate note không được rỗng
   ✅ Upload images lên Cloudinary (nếu có)
   ✅ Merge images vào incident.images
   
   ✅ Add progress history entry:
      {
        action: 'Cập nhật tiến độ',
        performedBy: userId,
        note: note,
        timestamp: Date.now()
      }
   
   ✅ Emit event: INCIDENT_PROGRESS_UPDATED
   ✅ Send WebSocket notification

4. Response:
   {
     success: true,
     data: { updated incident },
     message: 'Cập nhật tiến độ thành công'
   }
```

**Lưu ý:** Có thể gọi nhiều lần để cập nhật tiến độ liên tục

---

### Workflow 6: Đóng Sự Cố (Close Incident)

**Actor:** Department Header, Manager (assigned user)

**Mô tả:** Đóng sự cố sau khi đã xử lý xong

**Luồng:**

```
1. Manager/Department Header đóng incident
   PUT /api/incidents/close/:id
   
2. Request Body:
   {
     note: String (optional),
     images: [String] (optional)     // Ảnh minh chứng hoàn thành
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate permission (close permission required)
   ✅ Upload images lên Cloudinary (nếu có)
   ✅ Merge images vào incident.images
   
   ✅ Update fields:
      - status = 'Đã đóng'
      - actualCompletionTime = Date.now() (auto-set)
   
   ✅ Add close history entry:
      {
        action: 'Đóng',
        performedBy: userId,
        note: note || 'Đóng incident',
        timestamp: Date.now()
      }
   
   ✅ Emit event: INCIDENT_CLOSED
   ✅ Send WebSocket notification

4. Response:
   {
     success: true,
     data: { updated incident },
     message: 'Đóng incident thành công'
   }
```

**Sau khi đóng:** User đã được assign có thể nhận incident mới (business rule check sẽ pass)

---

### Workflow 7: Escalate Sự Cố (Escalate Incident)

**Actor:** Department Header

**Mô tả:** Escalate sự cố lên cấp cao hơn khi cần thiết

**Luồng:**

```
1. Department Header escalate
   POST /api/incidents/:id/escalate
   
2. Request Body:
   {
     reason: String (required),
     escalationLevel: String,
     departmentId: ObjectId (optional)
   }

3. System Actions:
   ✅ Validate incident exists
   ✅ Validate permission (escalate permission - chỉ Department Header)
   ✅ Create escalation record
   ✅ Add escalation history entry:
      {
        action: 'Escalate',
        performedBy: userId,
        note: `Escalate lên cấp cao hơn. Lý do: ${reason}`,
        timestamp: Date.now()
      }
   
   ✅ Emit event: INCIDENT_ESCALATED
   ✅ Send WebSocket notification cho cấp quản lý cao hơn

4. Response:
   {
     success: true,
     data: { updated incident with escalation },
     message: 'Escalate incident thành công'
   }
```

---

## 🔐 PHÂN QUYỀN & AUTHORIZATION

### Role-Based Permissions

| Action | Employee | Manager | Department Header |
|--------|----------|---------|-------------------|
| **Report Incident** | ✅ | ✅ | ✅ |
| **View Incidents** | ✅ (own + assigned) | ✅ (assigned + department) | ✅ (all in department/tenant) |
| **Classify Incident** | ❌ | ✅ | ✅ |
| **Assign Incident** | ❌ | ✅ | ✅ |
| **Investigate Incident** | ❌ | ✅ (assigned only) | ✅ |
| **Update Progress** | ❌ | ✅ (assigned only) | ✅ |
| **Close Incident** | ❌ | ✅ (assigned only) | ✅ |
| **Escalate Incident** | ❌ | ❌ | ✅ |
| **Delete Incident** | ❌ | ❌ | ✅ |
| **View Statistics** | ✅ | ✅ | ✅ |
| **Search Incidents** | ✅ | ✅ | ✅ |

### Authorization Scope

**AuthMiddleware.authorizeScope:**

```javascript
// List/Read
{
  modules: 'incident',
  action: 'read' | 'list',
  tenantScope: 'tenant'
}

// Create
{
  modules: 'incident',
  action: 'create',
  tenantScope: 'tenant'
}

// Update (Classify, Assign, Investigate, Progress)
{
  modules: 'incident',
  action: 'update',
  tenantScope: 'tenant',
  departmentScope: 'hierarchy'  // Manager chỉ update incidents trong department
}

// Close
{
  modules: 'incident',
  action: 'close',
  tenantScope: 'tenant',
  departmentScope: 'hierarchy'
}

// Escalate (chỉ Department Header)
{
  modules: 'incident',
  action: 'escalate',
  tenantScope: 'tenant',
  departmentScope: 'hierarchy'
}

// Delete (chỉ Department Header)
{
  modules: 'incident',
  action: 'delete',
  tenantScope: 'tenant',
  departmentScope: 'hierarchy'
}
```

### Data Filtering by Role

**Manager:** Tự động filter incidents theo `assignedTo = userId` (trừ khi explicit filter)

**Employee:** Xem incidents:
- Created by self (`createdBy = userId`)
- Assigned to self (`assignedTo = userId`)

**Department Header:** Xem tất cả incidents trong department/tenant

---

## 📡 API ENDPOINTS

### 1. Report Incident
```
POST /api/incidents/report
Body: { title, description, images, location, severity, project_id }
Auth: create permission
```

### 2. Classify Incident
```
PUT /api/incidents/classify/:id
Body: { severity }
Auth: update permission
```

### 3. Assign Incident
```
PUT /api/incidents/assign/:id
Body: { assignedTo, estimatedCompletionTime? }
Auth: update permission
Business Rule: Check active incident
```

### 4. Investigate Incident
```
PUT /api/incidents/investigate/:id
Body: { investigation, solution, findingsImages?, rootCauseImages? }
Auth: update permission (assigned user or higher)
```

### 5. Update Progress
```
PUT /api/incidents/progress/:id
Body: { note, images? }
Auth: update permission (assigned user or higher)
```

### 6. Close Incident
```
PUT /api/incidents/close/:id
Body: { note?, images? }
Auth: close permission
```

### 7. Escalate Incident
```
POST /api/incidents/:id/escalate
Body: { reason, escalationLevel?, departmentId? }
Auth: escalate permission (Department Header only)
```

### 8. Get Incidents
```
GET /api/incidents
Query: { project_id?, assignedTo?, status?, severity?, page?, limit? }
Auth: list permission
```

### 9. Get Incident by ID
```
GET /api/incidents/:id
Auth: read permission
```

### 10. Get Incidents by User
```
GET /api/incidents/user/:userId
Auth: read permission
```

### 11. Get Incidents by Project
```
GET /api/incidents/project/:projectId
Auth: read permission
```

### 12. Get Incidents by Status
```
GET /api/incidents/status/:status
Auth: read permission
```

### 13. Get Incidents by Severity
```
GET /api/incidents/severity/:severity
Auth: read permission
```

### 14. Search Incidents
```
GET /api/incidents/search/query?q=keyword
Auth: read permission
```

### 15. Get Incident Statistics
```
GET /api/incidents/stats/overview
Auth: read permission
```

### 16. Get Incident Escalations
```
GET /api/incidents/:id/escalations
Auth: read permission
```

### 17. Delete Incident
```
DELETE /api/incidents/:id
Auth: delete permission (Department Header only)
```

---

## 🔍 BUSINESS RULES & VALIDATION

### Rule 1: Active Incident Check (Critical)

**Mô tả:** 1 manager chỉ được quyền xử lý 1 sự cố tại một thời điểm. Khi sự cố đang xử lý đã đóng thì mới được nhận sự cố tiếp theo.

**Implementation:**
```javascript
// Trong assignIncident()
const activeCheck = await incidentRepository.checkActiveIncident(
  assignedTo,    // User được phân công
  incidentId,    // Exclude incident hiện tại (nếu đang update)
  tenantId
);

if (activeCheck.hasActiveIncident) {
  return {
    success: false,
    message: `Người này đang xử lý sự cố ${activeIncident.incidentId}...`,
    statusCode: 400,
    data: { hasActiveIncident: true, activeIncident }
  };
}
```

**Check Logic:**
```javascript
// Query
{
  assignedTo: userId,
  status: 'Đang xử lý',
  _id: { $ne: excludeIncidentId }  // Exclude nếu đang update
}
```

---

### Rule 2: Time Tracking

**Thời gian tự động:**

- **actualStartTime:** Tự động set khi `assignIncident()` → `status = 'Đang xử lý'`
- **estimatedCompletionTime:** Optional, set khi assign (must be > now)
- **actualCompletionTime:** Tự động set khi `closeIncident()` → `status = 'Đã đóng'`

**Công thức tính thời gian xử lý:**
```javascript
const resolutionTime = actualCompletionTime - actualStartTime;
const estimatedTime = estimatedCompletionTime - actualStartTime;
const isOnTime = actualCompletionTime <= estimatedCompletionTime;
```

---

### Rule 3: Status Transitions

**Valid transitions:**

```
'Mới ghi nhận' → 'Đang xử lý' (via assign)
'Mới ghi nhận' → 'Đã đóng' (direct close - rare)
'Đang xử lý' → 'Đã đóng' (via close)
```

**Invalid transitions:**
```
'Đã đóng' → 'Mới ghi nhận' (không được reopen)
'Đã đóng' → 'Đang xử lý' (không được reopen)
```

---

### Rule 4: Evidence Management

**Evidence được lưu trong:**

1. **incident.images:** Tổng hợp tất cả ảnh (report, investigation, progress, close)
2. **histories[].evidenceImages:** Ảnh minh chứng cho từng action
3. **histories[].evidenceType:** Loại minh chứng ('photo', 'document', 'video', 'other')
4. **histories[].evidenceDescription:** Mô tả minh chứng

**Upload flow:**
```
Frontend → Base64 string → Backend → Cloudinary → Secure URL → Save to DB
```

---

## 📊 EVENT-DRIVEN ARCHITECTURE

### Events Emitted

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `INCIDENT_REPORTED` | `createIncident()` | `{ incident, reporter }` |
| `INCIDENT_CLASSIFIED` | `classifyIncident()` | `{ incident, classifier, severity }` |
| `INCIDENT_ASSIGNED` | `assignIncident()` | `{ incident, assigner, assignee }` |
| `INCIDENT_INVESTIGATED` | `investigateIncident()` | `{ incident, investigator }` |
| `INCIDENT_PROGRESS_UPDATED` | `updateIncidentProgress()` | `{ incident, updater, note }` |
| `INCIDENT_CLOSED` | `closeIncident()` | `{ incident, closer }` |
| `INCIDENT_ESCALATED` | `escalateIncident()` | `{ incident, escalator, reason }` |

### WebSocket Notifications

**Real-time notifications qua WebSocket:**

- `incident_reported` → Notify Department Headers
- `incident_classified` → Notify assigned users
- `incident_assigned` → Notify assigned user specifically
- `incident_progress_updated` → Notify stakeholders
- `incident_closed` → Notify all stakeholders
- `incident_escalated` → Notify higher management

### Kafka Integration

**Events được publish lên Kafka:**

- For audit logging
- For analytics aggregation
- For external system integration

---

## 🔗 INTEGRATION POINTS

### 1. Cloudinary Integration

**Purpose:** Image upload và storage

**Usage:**
- Report: `images` field
- Investigate: `findingsImages`, `rootCauseImages`
- Progress: `images` field
- Close: `images` field

**Upload function:**
```javascript
uploadImagesIfNeeded(images, 'CLOUDINARY_INCIDENT_FOLDER', 'incidents')
```

---

### 2. Notification System

**WebSocket:** Real-time notifications

**Email/SMS:** (Có thể implement sau)

---

### 3. Analytics Service

**Metrics tracked:**
- Total incidents
- By severity
- By status
- By location
- Resolution time
- User performance

---

## 📈 STATISTICS & REPORTING

### Get Incident Statistics

```
GET /api/incidents/stats/overview
```

**Returns:**
```javascript
{
  total: Number,
  byStatus: {
    'Mới ghi nhận': Number,
    'Đang xử lý': Number,
    'Đã đóng': Number
  },
  bySeverity: {
    'nhẹ': Number,
    'nặng': Number,
    'rất nghiêm trọng': Number
  },
  byLocation: { [location: string]: Number },
  averageResolutionTime: Number (hours),
  overdueCount: Number,  // Quá estimatedCompletionTime
  recentIncidents: [Incident]  // Last 10
}
```

---

## 🎯 DESIGN DECISIONS

### 1. Active Incident Rule

**Decision:** 1 manager = 1 incident tại một thời điểm

**Rationale:**
- Đảm bảo chất lượng xử lý
- Tránh quá tải cho manager
- Tập trung resources cho incident quan trọng

**Trade-off:**
- Có thể delay incident assignment nếu manager bận
- Cần có escalation mechanism

---

### 2. History Tracking

**Decision:** Embedded history trong Incident document

**Rationale:**
- Tất cả thông tin ở một nơi (single source of truth)
- Dễ query và display timeline
- Performance tốt hơn separate collection

**Trade-off:**
- Document size có thể tăng nếu history dài
- Giới hạn 16MB của MongoDB

---

### 3. Time Tracking Fields

**Decision:** Separate fields cho estimated và actual times

**Rationale:**
- Dễ tính toán SLA compliance
- Có thể analyze performance metrics
- Support cho reporting và analytics

---

### 4. Evidence Management

**Decision:** Dual storage (incident.images + histories[].evidenceImages)

**Rationale:**
- `incident.images`: Tổng hợp tất cả (dễ access)
- `histories[].evidenceImages`: Context-specific (dễ audit)

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Complete Flow

```
1. Employee reports incident → Status: 'Mới ghi nhận'
2. Manager classifies → Severity: 'nặng'
3. Manager assigns to UserA → Status: 'Đang xử lý', actualStartTime set
4. UserA investigates → Add investigation & solution history
5. UserA updates progress → Add progress history
6. UserA closes → Status: 'Đã đóng', actualCompletionTime set
```

### Scenario 2: Active Incident Validation

```
1. Assign Incident A to UserA → ✅ Success
2. Assign Incident B to UserA → ❌ Error 400 (Active Incident)
3. Close Incident A → ✅ Success
4. Assign Incident B to UserA → ✅ Success (no longer active)
```

### Scenario 3: Escalation

```
1. Employee reports critical incident → Status: 'Mới ghi nhận'
2. Manager assigns to UserA → Status: 'Đang xử lý'
3. Incident overdue → Department Header escalates → Escalation history added
```

---

## 📚 RELATED DOCUMENTS

- `INCIDENT_IMPROVEMENTS.md` - Các cải tiến đã thực hiện
- `INCIDENT_IMPROVEMENT_SUGGESTIONS.md` - Đề xuất cải thiện tương lai

---

**Last Updated:** 2026-01-14  
**Version:** 1.0.0  
**Author:** System Documentation

