# API Documentation - Admin Module

Tài liệu OpenAPI/Swagger cho module quản trị (System Admin & Company Admin).

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## System Admin Endpoints

### 1. System Dashboard
**GET** `/admin/dashboard`

Lấy thống kê tổng quan hệ thống.

**Authorization:** System Admin only (role_level: 100, tenant_scope: global)

**Response:**
```json
{
  "success": true,
  "message": "System dashboard data retrieved successfully",
  "data": {
    "tenants": {
      "tenants": 2,
      "active_tenants": 2,
      "suspended_tenants": 0,
      "inactive_tenants": 0,
      "total_users": 150,
      "total_active_users": 145,
      "total_departments": 20,
      "total_projects": 50,
      "total_tasks": 500
    },
    "tasks": {
      "total": 500,
      "pending": 100,
      "in_progress": 200,
      "completed": 180,
      "on_hold": 15,
      "cancelled": 5,
      "overdue": 20
    },
    "permission_alerts": {
      "errors": [...],
      "warnings": [...],
      "total_errors": 5,
      "total_warnings": 10
    },
    "summary": {
      "total_tenants": 2,
      "active_tenants": 2,
      "total_users": 150,
      "total_active_users": 145,
      "total_projects": 50,
      "total_tasks": 500,
      "permission_issues": 15
    }
  }
}
```

### 2. Get All Tenants (Detailed)
**GET** `/admin/tenants`

Lấy danh sách tất cả tenants với thống kê chi tiết.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `search` (string)
- `status` (string: 'active', 'inactive', 'suspended')
- `sort_by` (string, default: 'created_at')
- `sort_order` (string: 'asc' | 'desc', default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "_id": "...",
        "tenant_code": "acme-corp",
        "name": "ACME Corporation",
        "status": "active",
        "subscription": {
          "plan": "enterprise",
          "seats": 100,
          "expires_at": "2024-12-31T00:00:00.000Z",
          "auto_renew": true
        },
        "statistics": {
          "users": {
            "total": 75,
            "active": 72,
            "inactive": 3
          },
          "departments": 10,
          "projects": 25,
          "tasks": 250
        }
      }
    ],
    "pagination": {...}
  }
}
```

### 3. Get Permission Alerts
**GET** `/admin/permission-alerts`

Lấy cảnh báo lỗi quyền truy cập.

**Query Parameters:**
- `type` (string: 'all' | 'error' | 'warning', default: 'all')
- `limit` (number, default: 50)
- `tenant_id` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "_id": "...",
        "log_type": "error",
        "message": "Access denied: insufficient permissions",
        "user_id": {...},
        "tenant_id": {...},
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "statistics": {
      "total": 15,
      "errors": 5,
      "warnings": 10
    }
  }
}
```

### 4. Get System Statistics
**GET** `/admin/stats`

Lấy thống kê tổng quan hệ thống.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": {
      "total": 2,
      "active": 2,
      "inactive": 0
    },
    "users": {
      "total": 150,
      "active": 145,
      "inactive": 5
    },
    "departments": 20,
    "projects": 50,
    "tasks": 500
  }
}
```

---

## Tenant Management Endpoints

### 1. Get All Tenants
**GET** `/tenants`

Lấy danh sách tenants (System Admin only).

**Query Parameters:** Same as `/admin/tenants`

### 2. Get Tenant by ID
**GET** `/tenants/:id`

Lấy thông tin chi tiết tenant.

### 3. Create Tenant
**POST** `/tenants`

Tạo tenant mới.

**Request Body:**
```json
{
  "tenant_code": "new-company",
  "name": "New Company Ltd",
  "status": "active",
  "subscription": {
    "plan": "standard",
    "seats": 50,
    "expires_at": "2024-12-31T00:00:00.000Z",
    "auto_renew": true
  },
  "contact": {
    "name": "John Doe",
    "email": "admin@newcompany.com",
    "phone": "+1234567890"
  }
}
```

### 4. Update Tenant
**PUT** `/tenants/:id`

Cập nhật thông tin tenant.

### 5. Delete Tenant
**DELETE** `/tenants/:id`

Xóa tenant (soft delete - set status to inactive).

### 6. Update Subscription
**PUT** `/tenants/:id/subscription`

Cập nhật subscription của tenant.

**Request Body:**
```json
{
  "plan": "enterprise",
  "seats": 200,
  "expires_at": "2025-12-31T00:00:00.000Z",
  "auto_renew": true
}
```

### 7. Update Tenant Status
**PATCH** `/tenants/:id/status`

Cập nhật trạng thái tenant (active/inactive/suspended).

**Request Body:**
```json
{
  "status": "suspended"
}
```

### 8. Reset Tenant
**POST** `/tenants/:id/reset`

Reset tenant: suspend tenant và deactivate tất cả users.

### 9. Assign Company Admin
**POST** `/tenants/:id/assign-company-admin`

Gán Company Admin cho tenant.

**Request Body:**
```json
{
  "user_id": "user_id_here"
}
```

### 10. Get Tenant Statistics
**GET** `/tenants/:id/stats`

Lấy thống kê của tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 75,
      "active": 72,
      "inactive": 3
    },
    "departments": 10,
    "projects": 25,
    "tasks": 250
  }
}
```

---

## Company Admin Endpoints

### 1. Assign Role to User
**POST** `/company-admin/assign-role`

Gán role cho user (Department Header, Manager, specialized roles).

**Request Body:**
```json
{
  "user_id": "user_id_here",
  "role_id": "role_id_here"
}
```

**Authorization:** Company Admin only (minRoleLevel: 90, tenantScope: tenant)

### 2. Bulk Assign Role
**POST** `/company-admin/bulk-assign-role`

Gán role cho nhiều users cùng lúc.

**Request Body:**
```json
{
  "user_ids": ["user_id_1", "user_id_2", "user_id_3"],
  "role_id": "role_id_here"
}
```

### 3. Get Quotas
**GET** `/company-admin/quotas`

Lấy thông tin quota PPE và Training.

**Response:**
```json
{
  "success": true,
  "data": {
    "ppe": {
      "total_items": 50,
      "total_quantity": 1000,
      "allocated_quantity": 750,
      "available_quantity": 250,
      "quota_limit": 100,
      "usage_percentage": "750.00"
    },
    "training": {
      "total_enrollments": 200,
      "active_enrollments": 80,
      "completed_enrollments": 100,
      "pending_enrollments": 20,
      "quota_limit": 100,
      "usage_percentage": "80.00"
    },
    "subscription": {
      "plan": "enterprise",
      "seats": 100,
      "expires_at": "2024-12-31T00:00:00.000Z",
      "auto_renew": true
    }
  }
}
```

### 4. Update Quota
**PUT** `/company-admin/quotas`

Cập nhật quota limit.

**Request Body:**
```json
{
  "type": "ppe",  // or "training"
  "limit": 150
}
```

### 5. Get Users by Role
**GET** `/company-admin/users-by-role/:role_id`

Lấy danh sách users theo role.

**Query Parameters:**
- `is_active` (boolean, default: true)

---

## User Management (Company Admin)

Các endpoints quản lý user đã có trong `/api/users`:
- `POST /api/users/import` - Bulk import nhân sự từ Excel
- `GET /api/users` - Lấy danh sách users
- `PUT /api/users/:id` - Cập nhật user
- `PATCH /api/users/:id/toggle-status` - Bật/tắt tài khoản

---

## Error Responses

Tất cả endpoints trả về lỗi theo format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Examples

### Example: Create Tenant and Assign Company Admin

```bash
# 1. Create tenant
POST /api/tenants
{
  "tenant_code": "acme-corp",
  "name": "ACME Corporation",
  "subscription": {
    "plan": "enterprise",
    "seats": 100
  }
}

# 2. Create user for Company Admin
POST /api/users
{
  "username": "admin",
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "full_name": "Admin User",
  "tenant_id": "<tenant_id_from_step_1>"
}

# 3. Assign Company Admin role
POST /api/tenants/<tenant_id>/assign-company-admin
{
  "user_id": "<user_id_from_step_2>"
}
```

### Example: Bulk Import Users

```bash
POST /api/users/import
Content-Type: multipart/form-data

file: <excel_file>
```

Excel file format:
- Column A: username
- Column B: email
- Column C: full_name
- Column D: phone (optional)
- Column E: department_name
- Column F: position_name
- Column G: role_code

---

## Notes

1. **Authorization:** Tất cả endpoints yêu cầu authentication và proper role level
2. **Tenant Scope:** Company Admin chỉ có thể quản lý users/departments trong tenant của mình
3. **Bulk Operations:** Bulk import và bulk assign có timeout 5 phút
4. **Quota Management:** Quota limits được lưu trong tenant metadata và subscription

