# Pricing API Documentation

## Tổng quan

API Pricing hỗ trợ 2 trường hợp:
1. **Khách hàng mới** (không có userID) - Đăng ký gói mới, tạo tenant và user mới
2. **Khách hàng đã có tài khoản** (có userID) - Nâng cấp/gia hạn gói cho tenant hiện có

## API Endpoints

### 1. Tạo đơn hàng

**Endpoint:** `POST /api/pricing/orders`

**Authentication:** Không cần (public endpoint)

**Request Body:**

#### Trường hợp 1: Khách hàng mới
```json
{
  "planType": "monthly" | "quarterly" | "yearly",
  "companyInfo": {
    "name": "Tên công ty",
    "address": "Địa chỉ công ty",
    "phone": "0123456789",
    "email": "company@example.com",
    "taxCode": "Mã số thuế (optional)"
  },
  "contactPerson": {
    "name": "Tên người đại diện",
    "email": "contact@example.com",
    "phone": "0123456789",
    "position": "Giám đốc (optional)"
  }
}
```

#### Trường hợp 2: Khách hàng đã có tài khoản
```json
{
  "planType": "monthly" | "quarterly" | "yearly",
  "userId": "user_id_here", // Bắt buộc cho khách hàng cũ
  "companyInfo": {
    "name": "Tên công ty (optional - sẽ lấy từ tenant)",
    "address": "Địa chỉ (optional)",
    "phone": "Số điện thoại (optional)",
    "email": "Email (optional)"
  },
  "contactPerson": {
    "name": "Tên người đại diện (optional - sẽ lấy từ user)",
    "email": "Email (optional - sẽ lấy từ user)",
    "phone": "Số điện thoại (optional - sẽ lấy từ user)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "orderId": "ORDER-1234567890-ABC12345",
    "paymentUrl": "https://pay.payos.vn/web/...",
    "amount": 99000,
    "planType": "monthly"
  }
}
```

**Validation:**
- Nếu có `userId`:
  - User phải tồn tại và active
  - User phải có role `company_admin`
  - User phải thuộc một tenant
- Nếu không có `userId`:
  - Tất cả thông tin `companyInfo` và `contactPerson` là bắt buộc

### 2. Lấy thông tin đơn hàng

**Endpoint:** `GET /api/pricing/orders/:orderId`

**Authentication:** Không cần (public endpoint)

**Response:**
```json
{
  "success": true,
  "message": "Lấy thông tin đơn hàng thành công",
  "data": {
    "orderId": "ORDER-1234567890-ABC12345",
    "planType": "monthly",
    "amount": 99000,
    "status": "paid" | "pending" | "failed" | "cancelled",
    "companyInfo": {...},
    "contactPerson": {...},
    "paymentDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Payment Webhook (IPN)

**Endpoint:** `POST /api/pricing/payment-webhook`

**Authentication:** Không cần (được gọi tự động bởi PayOS)

**Description:** PayOS sẽ gọi endpoint này sau khi thanh toán thành công/thất bại

**Xử lý:**
- Verify payment signature
- Nếu thành công:
  - **Khách hàng mới**: Tạo tenant, tạo user với role `company_admin`, gửi email tài khoản/mật khẩu
  - **Khách hàng cũ**: Cập nhật subscription cho tenant hiện có, gửi email xác nhận gia hạn
- Gửi thông báo cho system admin


## Flow xử lý

### Flow 1: Khách hàng mới

```
1. User bấm "Chọn gói này" trên Pricing page
   ↓
2. Frontend gọi POST /api/pricing/orders (không có userId)
   ↓
3. Backend tạo order, generate payment URL
   ↓
4. User thanh toán qua PayOS
   ↓
5. PayOS gọi webhook → POST /api/pricing/payment-webhook
   ↓
6. Backend xử lý:
   - Tạo Tenant mới
   - Tạo User với role company_admin
   - Gửi email tài khoản/mật khẩu
   - Gửi thông báo system admin
   ↓
7. User redirect về /pricing/payment-success
```

### Flow 2: Khách hàng đã có tài khoản

```
1. User đã đăng nhập, bấm "Nâng cấp gói"
   ↓
2. Frontend gọi POST /api/pricing/orders (có userId)
   ↓
3. Backend:
   - Validate user có quyền company_admin
   - Lấy thông tin tenant từ user
   - Điền thông tin companyInfo/contactPerson từ tenant/user
   - Tạo order với userId và tenantId
   ↓
4. User thanh toán qua PayOS
   ↓
5. PayOS gọi webhook → POST /api/pricing/payment-webhook
   ↓
6. Backend xử lý:
   - Cập nhật subscription cho tenant (gia hạn từ ngày hết hạn hiện tại)
   - Gửi email xác nhận gia hạn
   - Gửi thông báo system admin
   ↓
7. User redirect về /pricing/payment-success
```

## Lưu ý quan trọng

1. **Gia hạn gói:**
   - Nếu subscription còn hạn: Gia hạn từ ngày hết hạn hiện tại
   - Nếu subscription đã hết hạn: Gia hạn từ ngày hiện tại

2. **Quyền truy cập:**
   - Public endpoint - Không cần đăng nhập, ai cũng có thể mua gói
   - Nếu có userId (đã đăng nhập), sẽ sử dụng thông tin user để điền form (tùy chọn)
   - Nếu user có tenant, sẽ gia hạn gói cho tenant đó
   - Nếu không có userId, sẽ tạo tenant và user mới sau khi thanh toán thành công

3. **Email:**
   - Khách hàng mới: Nhận email tài khoản/mật khẩu
   - Khách hàng cũ: Nhận email xác nhận gia hạn

## Error Handling

### Lỗi thường gặp

1. **400 - Thiếu thông tin bắt buộc**
   - Thiếu `planType`, `companyInfo`, hoặc `contactPerson`

2. **400 - Loại gói không hợp lệ**
   - `planType` không phải `monthly`, `quarterly`, hoặc `yearly`

3. **404 - Không tìm thấy người dùng**
   - `userId` không tồn tại trong database

4. **400 - Tài khoản đã bị vô hiệu hóa**
   - User không active

5. **400 - Người dùng chưa được gán vào tenant**
   - Chỉ áp dụng nếu có userId và user đã đăng nhập (tùy chọn)
   - Không bắt buộc - có thể mua gói mà không cần đăng nhập

## Testing

### Test với khách hàng mới
```bash
curl -X POST http://localhost:3000/api/pricing/orders \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "monthly",
    "companyInfo": {
      "name": "Công ty ABC",
      "address": "123 Đường XYZ",
      "phone": "0123456789",
      "email": "company@example.com"
    },
    "contactPerson": {
      "name": "Nguyễn Văn A",
      "email": "contact@example.com",
      "phone": "0123456789"
    }
  }'
```

### Test với khách hàng đã có tài khoản
```bash
curl -X POST http://localhost:3000/api/pricing/orders \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "yearly",
    "userId": "user_id_here"
  }'
```

