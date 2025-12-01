# Authorization Guide - authorizeScope

Hướng dẫn sử dụng hệ thống authorization mới với `authorizeScope` middleware và Permission Matrix.

## Tổng quan

Hệ thống authorization mới sử dụng:
- **Permission Matrix**: Định nghĩa quyền truy cập theo module và action
- **Role Level**: Hệ thống phân cấp role dựa trên số (1-100)
- **Scope Rules**: Kiểm tra phạm vi truy cập (tenant, department)
- **Multi-role Support**: Hỗ trợ user có nhiều role (chọn role level cao nhất)

## Permission Matrix

Permission Matrix được định nghĩa trong `utils/permissions.js` với cấu trúc:

```javascript
const PERMISSION_MATRIX = {
  module: {
    action: [role_codes, role_levels]
  }
}
```

### Modules và Actions

**Modules:**
- `user`: Quản lý người dùng
- `role`: Quản lý vai trò
- `department`: Quản lý phòng ban
- `project`: Quản lý dự án
- `training`: Quản lý đào tạo
- `safety`: Quản lý an toàn
- `ppe`: Quản lý PPE
- `incident`: Quản lý sự cố
- `analytics`: Phân tích và báo cáo

**Actions:**
- `create`: Tạo mới
- `read`: Đọc/xem
- `update`: Cập nhật
- `delete`: Xóa
- `list`: Liệt kê
- Các action đặc biệt: `approve`, `enroll`, `issue`, `close`, `escalate`, etc.

### Ví dụ Permission Matrix

```javascript
user: {
  create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
  read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ..., 10, 100],
  update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ..., 70, 100],
  delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100]
}
```

## Role Levels

Hệ thống sử dụng role level từ 1-100:

- **100**: System Admin (toàn quyền hệ thống)
- **90**: Company Admin (quản trị tenant)
- **80**: Department Header (trưởng bộ phận)
- **70**: Manager (quản lý)
- **60**: Team Leader (tổ trưởng)
- **55**: Trainer, Safety Officer
- **50**: Warehouse Staff, Maintenance Staff
- **10**: Employee (nhân viên)

## Scope Rules

### Tenant Scope
- `global`: Truy cập tất cả tenants (chỉ System Admin)
- `tenant`: Truy cập trong tenant của mình
- `self`: Chỉ truy cập dữ liệu của chính mình

### Department Scope
- `all`: Truy cập tất cả departments
- `hierarchy`: Truy cập department của mình và các department con
- `own`: Chỉ truy cập department của mình
- `none`: Không có quyền truy cập department

## Sử dụng authorizeScope

### Cú pháp cơ bản

```javascript
const router = express.Router();
router.use(AuthMiddleware.authenticate);

// Sử dụng permission matrix
router.get('/users', 
  AuthMiddleware.authorizeScope({
    modules: 'user',
    action: 'list',
    tenantScope: 'tenant'
  }),
  UserController.getUsers
);

// Sử dụng role level
router.post('/users', 
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  UserController.createUser
);

// Kết hợp nhiều điều kiện
router.put('/users/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'user',
    action: 'update',
    minRoleLevel: 70,
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  UserController.updateUser
);
```

### Các tham số

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `modules` | `string \| string[]` | Module(s) cần kiểm tra |
| `action` | `string \| string[]` | Action(s) cần kiểm tra |
| `roles` | `string \| string[] \| number \| number[]` | Role codes/names hoặc levels (legacy) |
| `minRoleLevel` | `number` | Role level tối thiểu |
| `maxRoleLevel` | `number` | Role level tối đa |
| `tenantScope` | `'global' \| 'tenant' \| 'self'` | Yêu cầu tenant scope |
| `departmentScope` | `'all' \| 'hierarchy' \| 'own' \| 'none'` | Yêu cầu department scope |
| `requireExactTenant` | `boolean` | Yêu cầu khớp chính xác tenant_id |
| `requireExactDepartment` | `boolean` | Yêu cầu khớp chính xác department_id |

### Ví dụ sử dụng

#### 1. Kiểm tra permission matrix

```javascript
// Chỉ cho phép System Admin và Company Admin tạo user
router.post('/users',
  AuthMiddleware.authorizeScope({
    modules: 'user',
    action: 'create',
    tenantScope: 'tenant'
  }),
  UserController.createUser
);
```

#### 2. Kiểm tra role level

```javascript
// Cho phép Manager trở lên (level >= 70)
router.get('/projects',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 70,
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ProjectController.getProjects
);
```

#### 3. Kết hợp nhiều modules và actions

```javascript
// Cho phép đọc hoặc list user hoặc project
router.get('/dashboard',
  AuthMiddleware.authorizeScope({
    modules: ['user', 'project'],
    action: ['read', 'list'],
    tenantScope: 'tenant'
  }),
  DashboardController.getDashboard
);
```

#### 4. Kiểm tra scope cụ thể

```javascript
// Yêu cầu khớp chính xác tenant_id
router.get('/tenant/:tenant_id/users',
  AuthMiddleware.authorizeScope({
    modules: 'user',
    action: 'list',
    requireExactTenant: true
  }),
  UserController.getUsersByTenant
);
```

#### 5. Áp dụng cho toàn bộ routes

```javascript
// Tất cả routes trong router này yêu cầu Manager trở lên
router.use(
  AuthMiddleware.authorizeScope({
    modules: 'project',
    action: ['read', 'list'],
    minRoleLevel: 70,
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  })
);

router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProject);
router.post('/', ProjectController.createProject);
```

## getHighestRole Helper

Hàm `getHighestRole` được sử dụng để chọn role có độ ưu tiên cao nhất từ danh sách roles của user.

**Ưu tiên:**
1. Role level cao nhất
2. Tenant scope (global > tenant > self)

```javascript
const { getHighestRole } = require('../utils/permissions');

const userRoles = [
  { role_code: 'employee', role_level: 10, scope_rules: { tenant_scope: 'tenant' } },
  { role_code: 'manager', role_level: 70, scope_rules: { tenant_scope: 'tenant' } }
];

const primaryRole = getHighestRole(userRoles);
// Returns: { role_code: 'manager', role_level: 70, ... }
```

## Migration từ authorizeRole

### Trước (Legacy)

```javascript
router.get('/users',
  AuthMiddleware.authorizeRole('admin'),
  UserController.getUsers
);
```

### Sau (Mới)

```javascript
// Option 1: Sử dụng permission matrix
router.get('/users',
  AuthMiddleware.authorizeScope({
    modules: 'user',
    action: 'list',
    tenantScope: 'tenant'
  }),
  UserController.getUsers
);

// Option 2: Sử dụng role level
router.get('/users',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  UserController.getUsers
);

// Option 3: Vẫn hỗ trợ role codes (backward compatible)
router.get('/users',
  AuthMiddleware.authorizeScope({
    roles: 'admin',
    tenantScope: 'tenant'
  }),
  UserController.getUsers
);
```

## Best Practices

1. **Ưu tiên sử dụng Permission Matrix**: Rõ ràng và dễ bảo trì hơn
2. **Luôn kiểm tra tenant scope**: Đảm bảo user chỉ truy cập dữ liệu của tenant mình
3. **Sử dụng department scope phù hợp**: 
   - `hierarchy` cho Manager/Department Header
   - `own` cho Employee
4. **Kết hợp checks**: Sử dụng cả permission matrix và scope checks để đảm bảo an toàn
5. **Documentation**: Ghi chú rõ ràng về quyền truy cập của từng route

## Testing

Xem file test: `tests/unit/authorizeScope.test.js`

```bash
npm test -- authorizeScope.test.js
```

## Troubleshooting

### Lỗi "Insufficient permissions"
- Kiểm tra role của user có trong permission matrix không
- Kiểm tra role level có đủ không
- Kiểm tra scope rules có phù hợp không

### Lỗi "Role scope rules not configured"
- Đảm bảo role có `scope_rules` trong database
- Kiểm tra `scope_rules.tenant_scope` và `scope_rules.department_scope`

### Lỗi "Authentication required"
- Đảm bảo `AuthMiddleware.authenticate` được gọi trước `authorizeScope`
- Kiểm tra token có hợp lệ không

## Tài liệu liên quan

- `utils/permissions.js`: Permission Matrix và helper functions
- `middlewares/AuthMiddleware.js`: Implementation của authorizeScope
- `config/roleMatrix.js`: Định nghĩa roles và permissions

