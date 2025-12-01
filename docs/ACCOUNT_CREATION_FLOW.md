# Quy Trình Cấp Tài Khoản Sau Khi Thanh Toán

## Tổng Quan

Khi một khách hàng thanh toán thành công gói dịch vụ, hệ thống sẽ tự động:
1. Tạo **Tenant** (công ty) mới
2. Tạo **User** (tài khoản) mới với role `company_admin`
3. Gửi email chứa thông tin đăng nhập (username, password)

---

## Luồng Xử Lý Chi Tiết

### 1. Kích Hoạt: Webhook PayOS

Khi thanh toán thành công, PayOS gửi webhook đến endpoint:
```
POST /api/pricing/webhook
```

Webhook handler sẽ:
- Xác thực webhook từ PayOS
- Cập nhật trạng thái order thành `PAID`
- Gọi `_processPaidOrder(order)` để xử lý business logic

### 2. Xác Định Loại Khách Hàng

Hệ thống kiểm tra 3 trường hợp:

#### **Trường hợp 1: Khách hàng hoàn toàn mới** ✅
- **Điều kiện**: Không tìm thấy user với email của contact person
- **Hành động**:
  - Tạo Tenant mới
  - Tạo User mới với role `company_admin`
  - Generate password ngẫu nhiên
  - Gửi email tài khoản/mật khẩu
  - Gửi email xác nhận thanh toán

#### **Trường hợp 2: User đã tồn tại nhưng chưa có tenant**
- **Điều kiện**: Tìm thấy user nhưng user chưa có `tenant_id`
- **Hành động**:
  - Tạo Tenant mới
  - Gán user hiện có vào tenant mới
  - **KHÔNG** tạo password mới (user đã có mật khẩu)
  - Chỉ gửi email xác nhận thanh toán

#### **Trường hợp 3: Khách hàng cũ (đã có user + tenant)**
- **Điều kiện**: Tìm thấy user và tenant
- **Hành động**:
  - Cập nhật subscription cho tenant
  - Gửi email xác nhận gia hạn
  - **KHÔNG** tạo user mới

---

## 3. Tạo Tenant

**File**: `DATN_BACKEND/services/tenantService.js`

```javascript
tenant = await tenantService.createTenant({
  name: order.companyInfo.name,
  address: order.companyInfo.address,
  phone: order.companyInfo.phone,
  email: order.companyInfo.email,
  planType: order.planType,  // 'monthly', 'quarterly', 'yearly'
  orderId: order._id
});
```

**Kết quả**:
- Tạo tenant mới trong database
- Tự động generate `tenant_code` (mã định danh tenant)
- Tạo subscription với `plan_type` và `expires_at` dựa trên `planType`

---

## 4. Tạo User Với Role `company_admin`

**File**: `DATN_BACKEND/controllers/pricingController.js` (dòng 139-149)

### Bước 1: Generate Password Ngẫu Nhiên

```javascript
password = userService.generateRandomPassword();
// Password có độ dài 12 ký tự, bao gồm:
// - Chữ hoa, chữ thường
// - Số
// - Ký tự đặc biệt
```

### Bước 2: Tạo User Với Role

```javascript
const userResult = await userService.createUserWithRole({
  username: order.contactPerson.email.split('@')[0],  // Lấy phần trước @ của email
  email: order.contactPerson.email,
  full_name: order.contactPerson.name,
  phone: order.contactPerson.phone,
  role_code: 'company_admin',  // ⭐ Role được chỉ định ở đây
  tenant_id: tenant._id,       // ⭐ Gán user vào tenant
  password: password
});
```

### Bước 3: Xử Lý Trong `userService.createUserWithRole()`

**File**: `DATN_BACKEND/services/userService.js` (dòng 512-553)

```javascript
static async createUserWithRole(userData) {
  // 1. Tách role_code và tenant_id
  const { role_code, tenant_id, ...restUserData } = userData;

  // 2. Tìm role theo role_code
  const role = await RoleRepository.findByCode(role_code);
  // Tìm trong database: Role.findOne({ role_code: 'company_admin' })
  
  if (!role || !role.is_active) {
    return { success: false, message: `Role ${role_code} not found or inactive` };
  }

  // 3. Tạo user với role_id (đã convert từ role_code)
  const userResult = await this.createUser({
    ...restUserData,
    role_id: role._id,      // ⭐ Gán role_id vào user
    tenant_id: tenant_id    // ⭐ Gán tenant_id vào user
  });

  return { success: true, data: userResult.data };
}
```

### Bước 4: Xử Lý Trong `userService.createUser()`

**File**: `DATN_BACKEND/services/userService.js` (dòng 12-66)

```javascript
static async createUser(userData) {
  // 1. Kiểm tra username/email đã tồn tại chưa
  // 2. Verify role exists và is_active
  // 3. Hash password: password_hash = await HashUtils.hashPassword(password)
  // 4. Tạo user trong database
  const user = await UserRepository.create({
    username: userData.username,
    email: userData.email,
    full_name: userData.full_name,
    phone: userData.phone,
    role_id: userData.role_id,      // ⭐ Role được lưu vào database
    tenant_id: userData.tenant_id,  // ⭐ Tenant được lưu vào database
    password_hash: password_hash,
    is_active: true
  });
  
  return user;
}
```

---

## 5. Cấu Trúc Database

### User Model

```javascript
{
  _id: ObjectId,
  username: String,        // Từ email (phần trước @)
  email: String,          // Email của contact person
  full_name: String,      // Tên của contact person
  phone: String,          // Số điện thoại
  role_id: ObjectId,      // ⭐ Reference đến Role với role_code = 'company_admin'
  tenant_id: ObjectId,    // ⭐ Reference đến Tenant vừa tạo
  password_hash: String,   // Password đã được hash
  is_active: Boolean      // Mặc định: true
}
```

### Role Model

```javascript
{
  _id: ObjectId,
  role_code: String,      // 'company_admin', 'system_admin', 'employee', etc.
  role_name: String,     // 'Company Admin', 'System Admin', etc.
  description: String,
  is_active: Boolean
}
```

### Tenant Model

```javascript
{
  _id: ObjectId,
  tenant_code: String,   // Tự động generate
  name: String,          // Tên công ty
  contact: {
    email: String,
    phone: String,
    address: String
  },
  subscription: {
    plan_type: String,   // 'monthly', 'quarterly', 'yearly'
    expires_at: Date
  }
}
```

---

## 6. Gửi Email Tài Khoản

**File**: `DATN_BACKEND/services/emailService.js`

Sau khi tạo user thành công, hệ thống gửi email:

```javascript
await emailService.sendAccountCredentials({
  to: order.contactPerson.email,
  username: user.username,           // Phần trước @ của email
  password: password,                 // Password ngẫu nhiên (chưa hash)
  companyName: order.companyInfo.name,
  loginUrl: `${process.env.FRONTEND_URL}/login`
});
```

**Nội dung email bao gồm**:
- Username (để đăng nhập)
- Password (để đăng nhập)
- Link đăng nhập
- Thông tin công ty

---

## 7. Quyền Hạn Của Role `company_admin`

Role `company_admin` được định nghĩa trong database với:
- `role_code`: `'company_admin'`
- `role_name`: `'Company Admin'` (hoặc tương tự)

**Quyền hạn** (được kiểm tra qua middleware `RoleMiddleware`):
- Quản lý toàn bộ dữ liệu của tenant (công ty) mình
- Không thể truy cập dữ liệu của tenant khác (multitenant isolation)
- Có thể tạo/quản lý users trong tenant của mình
- Có thể quản lý projects, PPE, training, etc. trong tenant

---

## 8. Đăng Nhập Vào Hệ Thống

Sau khi nhận email, user có thể đăng nhập:

1. **Endpoint**: `POST /api/auth/login`
2. **Body**:
   ```json
   {
     "username": "username-từ-email",
     "password": "password-từ-email"
   }
   ```
3. **Response**: JWT token để sử dụng cho các API calls tiếp theo

---

## 9. Kiểm Tra Quyền Trong API

Khi user gọi API, hệ thống sẽ:

1. **Xác thực JWT token** → Lấy `userId`
2. **Lấy user từ database** → Có `role_id` và `tenant_id`
3. **Kiểm tra quyền**:
   - `RoleMiddleware`: Kiểm tra role có quyền truy cập endpoint không
   - `enforceTenantFilter`: Đảm bảo user chỉ truy cập dữ liệu của tenant mình

---

## 10. Ví Dụ Flow Hoàn Chỉnh

### Input: Order đã thanh toán

```javascript
{
  orderId: "ORD-123456",
  status: "PAID",
  contactPerson: {
    email: "admin@company.com",
    name: "Nguyễn Văn A",
    phone: "0123456789"
  },
  companyInfo: {
    name: "Công Ty ABC",
    email: "info@company.com",
    phone: "0987654321",
    address: "123 Đường XYZ"
  },
  planType: "yearly",
  amount: 10000000
}
```

### Output: User được tạo

```javascript
{
  _id: ObjectId("..."),
  username: "admin",              // Từ "admin@company.com"
  email: "admin@company.com",
  full_name: "Nguyễn Văn A",
  phone: "0123456789",
  role_id: ObjectId("..."),       // Role với role_code = 'company_admin'
  tenant_id: ObjectId("..."),    // Tenant vừa tạo
  password_hash: "$2b$10$...",   // Password đã hash
  is_active: true
}
```

### Email gửi đến user

```
Subject: Thông tin tài khoản đăng nhập - Hệ Thống Quản Lý An Toàn Lao Động

Xin chào Nguyễn Văn A,

Tài khoản của bạn đã được tạo thành công:

Username: admin
Password: Abc123!@#xyz

Vui lòng đăng nhập tại: https://your-frontend.com/login
```

---

## 11. Troubleshooting

### Vấn đề: User không được tạo

**Kiểm tra**:
1. Role `company_admin` có tồn tại trong database không?
2. Role có `is_active = true` không?
3. Email đã tồn tại chưa? (không thể tạo user với email trùng)
4. Username đã tồn tại chưa?

### Vấn đề: User không có quyền

**Kiểm tra**:
1. User có `role_id` đúng không?
2. Role có `is_active = true` không?
3. User có `tenant_id` không?
4. Middleware `RoleMiddleware` có được áp dụng đúng không?

### Vấn đề: Email không được gửi

**Kiểm tra**:
1. SMTP configuration trong `.env`:
   - `SMTP_HOST`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
2. Logs trong console để xem lỗi cụ thể
3. Có thể resend email bằng endpoint: `POST /api/pricing/orders/{orderId}/resend-email`

---

## 12. Scripts Hữu Ích

### Kiểm tra user/tenant status
```bash
node scripts/check-user-tenant-status.js <email>
```

### Xóa test data
```bash
node scripts/delete-test-email-data-complete.js
```

### Kiểm tra order và email status
```bash
node scripts/check-order-email-status.js <email>
```

---

## Tóm Tắt

1. ✅ Thanh toán thành công → Webhook được gọi
2. ✅ Xác định khách hàng mới/cũ
3. ✅ Tạo Tenant mới (nếu cần)
4. ✅ Tạo User mới với `role_code: 'company_admin'`
5. ✅ Gán `tenant_id` vào user
6. ✅ Generate password ngẫu nhiên
7. ✅ Gửi email tài khoản/mật khẩu
8. ✅ User có thể đăng nhập và sử dụng hệ thống với quyền `company_admin`

