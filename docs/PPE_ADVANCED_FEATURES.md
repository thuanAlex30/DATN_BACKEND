# PPE Advanced Features Documentation

## 📋 Tổng quan

Hệ thống PPE Advanced Features bao gồm 3 tính năng chính:

1. **Optimistic Locking** - Quản lý đồng thời cập nhật PPE items
2. **Batch Operations** - Xử lý hàng loạt PPE issuance
3. **Expiry Management** - Quản lý hạn sử dụng PPE

## 🔒 1. OPTIMISTIC LOCKING

### Mục đích
- Ngăn chặn race conditions khi nhiều user cùng cập nhật PPE items
- Đảm bảo tính nhất quán dữ liệu
- Hỗ trợ retry mechanism

### Cách hoạt động
```javascript
// PPE Item có thêm field version
{
  _id: ObjectId,
  item_name: "Safety Helmet",
  quantity_available: 100,
  version: 1, // Tự động tăng khi update
  // ... other fields
}
```

### API Endpoints

#### GET /api/ppe-advanced/items/:itemId/version
Lấy thông tin PPE item với version hiện tại.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "item_code": "HELMET-001",
    "item_name": "Safety Helmet",
    "quantity_available": 100,
    "quantity_allocated": 0,
    "condition_status": "good",
    "version": 1,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PUT /api/ppe-advanced/items/:itemId/quantity
Cập nhật số lượng PPE với optimistic locking.

**Request Body:**
```json
{
  "quantity": 50,
  "operation": "allocate", // "allocate", "deallocate", "update"
  "version": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "quantity_available": 50,
    "version": 2
  },
  "message": "PPE item updated successfully"
}
```

#### POST /api/ppe-advanced/items/batch-update
Cập nhật hàng loạt nhiều PPE items.

**Request Body:**
```json
{
  "updates": [
    {
      "itemId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "updateData": {
        "$inc": { "quantity_available": -10 }
      }
    },
    {
      "itemId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "updateData": {
        "$inc": { "quantity_available": -5 }
      }
    }
  ],
  "options": {
    "maxRetries": 3,
    "retryDelay": 100
  }
}
```

## 📦 2. BATCH OPERATIONS

### Mục đích
- Xử lý hàng loạt PPE issuance hiệu quả
- Theo dõi tiến trình xử lý real-time
- Xử lý lỗi và retry mechanism

### Cách hoạt động
```javascript
// Batch Issuance Structure
{
  batch_id: "BATCH-2024-001",
  batch_name: "Monthly PPE Distribution",
  status: "pending", // "pending", "processing", "completed", "failed"
  items: [
    {
      user_id: "64f1a2b3c4d5e6f7g8h9i0j1",
      item_id: "64f1a2b3c4d5e6f7g8h9i0j2",
      quantity: 2,
      expected_return_date: "2024-12-31",
      status: "pending" // "pending", "issued", "failed"
    }
  ],
  progress: {
    total: 100,
    processed: 0,
    successful: 0,
    failed: 0
  }
}
```

### API Endpoints

#### POST /api/ppe-advanced/batch-issuance
Tạo batch issuance mới.

**Request Body:**
```json
{
  "batch_name": "Monthly PPE Distribution",
  "issuance_level": "manager",
  "manager_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "items": [
    {
      "user_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "item_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "quantity": 2,
      "expected_return_date": "2024-12-31"
    }
  ]
}
```

#### POST /api/ppe-advanced/batch-issuance/:batchId/process
Bắt đầu xử lý batch issuance.

**Request Body:**
```json
{
  "options": {
    "maxConcurrentItems": 10
  }
}
```

#### GET /api/ppe-advanced/batch-issuance/:batchId/status
Lấy trạng thái xử lý batch.

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "BATCH-2024-001",
    "batchName": "Monthly PPE Distribution",
    "status": "processing",
    "progress": {
      "percentage": 75,
      "processedItems": 75,
      "totalItems": 100,
      "successfulItems": 70,
      "failedItems": 5
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "processingStartedAt": "2024-01-15T10:05:00.000Z",
    "errorSummary": "User not found: 3 items; Insufficient quantity: 2 items"
  }
}
```

## ⏰ 3. EXPIRY MANAGEMENT

### Mục đích
- Theo dõi hạn sử dụng PPE items
- Gửi thông báo trước khi hết hạn
- Quản lý thay thế và xử lý PPE hết hạn

### Cách hoạt động
```javascript
// PPE Expiry Tracking Structure
{
  ppe_item_id: ObjectId,
  ppe_issuance_id: ObjectId,
  user_id: ObjectId,
  expiry_date: Date,
  manufacturing_date: Date,
  batch_number: "BATCH-001",
  serial_number: "SN-001",
  status: "active", // "active", "expiring_soon", "expired", "replaced", "disposed"
  days_until_expiry: 15,
  notifications: {
    notify_days_before: [30, 14, 7, 1],
    last_notification_sent: Date,
    notification_status: "sent" // "none", "sent", "acknowledged", "dismissed"
  }
}
```

### API Endpoints

#### POST /api/ppe-advanced/expiry-tracking
Tạo tracking record cho PPE expiry.

**Request Body:**
```json
{
  "ppe_item_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "expiry_date": "2024-12-31",
  "manufacturing_date": "2024-01-01",
  "batch_number": "BATCH-001",
  "serial_number": "SN-001"
}
```

#### POST /api/ppe-advanced/items/:itemId/auto-tracking
Tự động tạo tracking records cho PPE item.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "ppe_item_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "expiry_date": "2024-12-31",
      "status": "active",
      "days_until_expiry": 350
    }
  ],
  "message": "Created 5 tracking records"
}
```

#### GET /api/ppe-advanced/expiry/check
Kiểm tra và gửi thông báo PPE sắp hết hạn.

**Query Parameters:**
- `daysBefore` (optional): Số ngày trước khi hết hạn (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "success": true,
      "trackingId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "message": "Notification sent successfully"
    }
  ],
  "message": "Sent 5 notifications"
}
```

#### PUT /api/ppe-advanced/expiry-tracking/:trackingId/expired
Đánh dấu PPE đã hết hạn.

**Request Body:**
```json
{
  "options": {
    "reason": "expired"
  }
}
```

#### PUT /api/ppe-advanced/expiry-tracking/:trackingId/replace
Thay thế PPE hết hạn.

**Request Body:**
```json
{
  "replacement_item_id": "64f1a2b3c4d5e6f7g8h9i0j2",
  "expiry_date": "2025-12-31",
  "manufacturing_date": "2024-01-01",
  "batch_number": "BATCH-002",
  "serial_number": "SN-002",
  "replacement_reason": "expired"
}
```

#### PUT /api/ppe-advanced/expiry-tracking/:trackingId/dispose
Xử lý PPE hết hạn.

**Request Body:**
```json
{
  "disposal_method": "recycled",
  "disposal_certificate": "CERT-001"
}
```

#### GET /api/ppe-advanced/expiry/report
Lấy báo cáo PPE sắp hết hạn.

**Query Parameters:**
- `days` (optional): Số ngày trước khi hết hạn (default: 30)
- `status` (optional): Trạng thái PPE (default: "active")

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalExpiring": 15,
      "totalExpired": 5,
      "totalItems": 20
    },
    "categoryStats": {
      "Safety Helmets": { "expiring": 8, "expired": 2 },
      "Safety Gloves": { "expiring": 7, "expired": 3 }
    },
    "userStats": {
      "John Doe": { "expiring": 5, "expired": 1 },
      "Jane Smith": { "expiring": 10, "expired": 4 }
    },
    "expiringItems": [...],
    "expiredItems": [...]
  }
}
```

## 🔔 4. WEBSOCKET NOTIFICATIONS

### Real-time Notifications

Hệ thống gửi thông báo real-time qua WebSocket cho các sự kiện:

#### PPE Notifications
- `ppe_quantity_update` - Cập nhật số lượng PPE
- `ppe_condition_update` - Cập nhật tình trạng PPE
- `ppe_issuance` - PPE được cấp phát
- `ppe_return` - PPE được trả về
- `ppe_expiry_warning` - Cảnh báo PPE sắp hết hạn
- `ppe_expired` - PPE đã hết hạn
- `ppe_replaced` - PPE được thay thế
- `ppe_disposed` - PPE được xử lý

#### Batch Notifications
- `batch_processing_started` - Bắt đầu xử lý batch
- `batch_processing_progress` - Tiến trình xử lý batch
- `batch_processing_complete` - Hoàn thành xử lý batch

### WebSocket Connection
```javascript
const socket = io('ws://localhost:3000');

// Authenticate
socket.emit('authenticate', {
  userId: '64f1a2b3c4d5e6f7g8h9i0j1',
  role: 'manager'
});

// Listen for notifications
socket.on('ppe_notification', (data) => {
  console.log('PPE Notification:', data);
});

socket.on('batch_notification', (data) => {
  console.log('Batch Notification:', data);
});
```

## ⏰ 5. CRON JOBS

### Daily Expiry Check
- **Schedule**: Mỗi ngày lúc 9:00 AM
- **Timezone**: Asia/Ho_Chi_Minh
- **Function**: Kiểm tra PPE sắp hết hạn và gửi thông báo

### Manual Trigger
```javascript
// Chạy kiểm tra thủ công
const expiryCheckJob = require('./jobs/expiryCheckJob');
await expiryCheckJob.runExpiryCheck();

// Chạy kiểm tra cho số ngày cụ thể
await expiryCheckJob.runCustomExpiryCheck(30);
```

## 🔧 6. ERROR HANDLING

### Optimistic Locking Errors
```json
{
  "success": false,
  "message": "Failed to update PPE item due to concurrent modifications",
  "error": "Optimistic locking failed after maximum retries"
}
```

### Batch Processing Errors
```json
{
  "success": false,
  "message": "Batch processing failed",
  "error": "Insufficient quantity. Available: 5, Requested: 10"
}
```

### Expiry Management Errors
```json
{
  "success": false,
  "message": "Failed to create expiry tracking record",
  "error": "PPE item not found"
}
```

## 📊 7. PERFORMANCE CONSIDERATIONS

### Optimistic Locking
- **Max Retries**: 3 lần
- **Retry Delay**: 100ms với exponential backoff
- **Concurrent Updates**: Hỗ trợ tối đa 10 concurrent updates

### Batch Operations
- **Max Items per Batch**: 100 items
- **Max Concurrent Items**: 10 items
- **Processing Timeout**: 30 seconds

### Expiry Management
- **Notification Days**: 30, 14, 7, 1 ngày trước khi hết hạn
- **Daily Check**: Chạy 1 lần/ngày
- **Batch Size**: Xử lý tối đa 1000 items/lần

## 🚀 8. DEPLOYMENT

### Environment Variables
```env
# PPE Advanced Features
PPE_OPTIMISTIC_LOCKING_MAX_RETRIES=3
PPE_OPTIMISTIC_LOCKING_RETRY_DELAY=100
PPE_BATCH_MAX_ITEMS=100
PPE_BATCH_MAX_CONCURRENT=10
PPE_EXPIRY_NOTIFICATION_DAYS=30,14,7,1
PPE_EXPIRY_CHECK_CRON="0 9 * * *"
```

### Health Check
```bash
GET /api/ppe-advanced/health
```

**Response:**
```json
{
  "success": true,
  "message": "PPE Advanced services are running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "optimisticLocking": "active",
    "batchIssuance": "active",
    "expiryManagement": "active"
  }
}
```

## 📝 9. TESTING

### Unit Tests
```bash
npm run test tests/ppe-advanced/
```

### Integration Tests
```bash
npm run test:integration tests/ppe-advanced/
```

### Load Tests
```bash
npm run test:stress tests/ppe-advanced/
```

## 🔍 10. MONITORING

### Logs
- Tất cả operations được log với Winston
- Log levels: info, warn, error
- Structured logging với context

### Metrics
- Batch processing success rate
- Optimistic locking retry rate
- Expiry notification delivery rate
- WebSocket connection count

### Alerts
- Batch processing failures
- High optimistic locking retry rate
- Expired PPE items not handled
- WebSocket connection issues
