# Admin Module - Priority 3 Implementation

Module quản trị hoàn chỉnh cho System Admin và Company Admin.

## Tổng quan

Module này cung cấp:
- **System Admin**: Quản lý tenants, subscription, dashboard thống kê
- **Company Admin**: Quản lý users, departments, positions, roles, quotas trong tenant

## Cấu trúc Files

### Repository
- `repository/TenantRepository.js` - CRUD và quản lý tenants

### Controllers
- `controllers/TenantController.js` - CRUD tenant, subscription, reset, assign Company Admin
- `controllers/AdminController.js` - System Admin dashboard và thống kê
- `controllers/CompanyAdminController.js` - Company Admin: assign roles, quota management

### Routes
- `routes/tenantRoutes.js` - Routes cho tenant management (System Admin only)
- `routes/adminRoutes.js` - Routes cho System Admin dashboard
- `routes/companyAdminRoutes.js` - Routes cho Company Admin operations

### Documentation
- `docs/API_ADMIN_MODULE.md` - OpenAPI/Swagger documentation đầy đủ

### Scripts
- `scripts/seed-full-tenants.js` - Seed script tạo 2 tenants đầy đủ (production + demo)

## System Admin Endpoints

### Dashboard & Statistics
- `GET /api/admin/dashboard` - Dashboard tổng quan hệ thống
- `GET /api/admin/tenants` - Danh sách tenants với thống kê
- `GET /api/admin/permission-alerts` - Cảnh báo lỗi quyền truy cập
- `GET /api/admin/stats` - Thống kê hệ thống

### Tenant Management
- `GET /api/tenants` - Lấy danh sách tenants
- `GET /api/tenants/:id` - Lấy tenant by ID
- `POST /api/tenants` - Tạo tenant mới
- `PUT /api/tenants/:id` - Cập nhật tenant
- `DELETE /api/tenants/:id` - Xóa tenant (soft delete)
- `PUT /api/tenants/:id/subscription` - Cập nhật subscription
- `PATCH /api/tenants/:id/status` - Cập nhật status (active/inactive/suspended)
- `POST /api/tenants/:id/reset` - Reset tenant (suspend + deactivate users)
- `POST /api/tenants/:id/assign-company-admin` - Gán Company Admin
- `GET /api/tenants/:id/stats` - Thống kê tenant

## Company Admin Endpoints

### Role Management
- `POST /api/company-admin/assign-role` - Gán role cho user
- `POST /api/company-admin/bulk-assign-role` - Gán role cho nhiều users
- `GET /api/company-admin/users-by-role/:role_id` - Lấy users theo role

### Quota Management
- `GET /api/company-admin/quotas` - Lấy thông tin quota PPE và Training
- `PUT /api/company-admin/quotas` - Cập nhật quota limit

### User Management (đã có)
- `POST /api/users/import` - Bulk import nhân sự từ Excel
- `GET /api/users` - Lấy danh sách users
- `PUT /api/users/:id` - Cập nhật user
- `PATCH /api/users/:id/toggle-status` - Bật/tắt tài khoản

## Authorization

### System Admin
- **Role Level**: 100
- **Tenant Scope**: `global`
- Có thể truy cập tất cả tenants và quản lý toàn hệ thống

### Company Admin
- **Role Level**: 90
- **Tenant Scope**: `tenant`
- Chỉ có thể quản lý trong tenant của mình

## Seed Script

### Chạy seed script

```bash
npm run db:seed:full
```

Script này sẽ tạo:
1. **Production Tenant** (ACME Corporation)
   - 8 departments
   - 10 positions
   - 11 users với các roles khác nhau
   - Company Admin, Department Headers, Managers, Specialized roles, Employees

2. **Demo Tenant** (Demo Construction Company)
   - 8 departments
   - 10 positions
   - 11 users với các roles khác nhau

### Default Credentials

Tất cả users được tạo với password mặc định:
```
ChangeMe123!
```

Có thể override bằng environment variable:
```bash
DEFAULT_TENANT_BOOTSTRAP_PASSWORD=YourPassword123!
```

### Example Login

**Production Tenant:**
- Company Admin: `acme-corporation.company.admin@acme-corporation.local`
- Department Header: `acme-corporation.dept.header.eng@acme-corporation.local`

**Demo Tenant:**
- Company Admin: `demo-company.company.admin@demo-company.local`

## Testing

### Test với Postman/Thunder Client

1. **Login as System Admin:**
```bash
POST /api/auth/login
{
  "username": "system.admin",  # hoặc email
  "password": "your_password"
}
```

2. **Get System Dashboard:**
```bash
GET /api/admin/dashboard
Authorization: Bearer <token>
```

3. **Create Tenant:**
```bash
POST /api/tenants
Authorization: Bearer <token>
{
  "tenant_code": "new-company",
  "name": "New Company Ltd",
  "subscription": {
    "plan": "standard",
    "seats": 50
  }
}
```

4. **Login as Company Admin:**
```bash
POST /api/auth/login
{
  "username": "acme-corporation.company.admin@acme-corporation.local",
  "password": "ChangeMe123!"
}
```

5. **Get Quotas:**
```bash
GET /api/company-admin/quotas
Authorization: Bearer <token>
```

6. **Assign Role:**
```bash
POST /api/company-admin/assign-role
Authorization: Bearer <token>
{
  "user_id": "user_id_here",
  "role_id": "role_id_here"
}
```

## API Documentation

Xem file `docs/API_ADMIN_MODULE.md` để có:
- OpenAPI/Swagger documentation đầy đủ
- Request/Response examples
- Error handling
- Authentication requirements

## Features Implemented

### System Admin ✅
- [x] CRUD tenants
- [x] Thiết lập subscription
- [x] Reset khóa/bật tắt tenant
- [x] Gán Company Admin
- [x] Dashboard: thống kê tổng số tenant, user, task
- [x] Cảnh báo quyền lỗi

### Company Admin ✅
- [x] CRUD department, position, user trong tenant
- [x] Bulk import nhân sự (đã có trong userRoutes)
- [x] Gán Department Header/Manager/role chuyên trách
- [x] Quản lý vai trò
- [x] Quản lý trạng thái tài khoản
- [x] Quota PPE/training

### Documentation & Testing ✅
- [x] API Documentation (OpenAPI/Swagger format)
- [x] Seed script với 2 tenants đầy đủ

## Next Steps

1. **Frontend Integration:**
   - Tạo UI cho System Admin dashboard
   - Tạo UI cho Company Admin management
   - Tích hợp quota management UI

2. **Advanced Features:**
   - Email notifications cho tenant operations
   - Audit logs cho admin actions
   - Advanced quota tracking và alerts

3. **Testing:**
   - Unit tests cho controllers
   - Integration tests cho admin workflows
   - E2E tests cho admin scenarios

## Notes

- Tất cả endpoints đều có authorization checks
- Tenant scope được enforce ở middleware level
- Quota limits được lưu trong tenant metadata
- Bulk operations có timeout 5 phút
- Seed script có thể chạy nhiều lần (idempotent)

