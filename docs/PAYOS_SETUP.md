# Hướng dẫn tích hợp PayOS

## Tổng quan

PayOS là cổng thanh toán Việt Nam, dễ tích hợp và có sandbox miễn phí. Hệ thống đã được tích hợp PayOS để xử lý thanh toán cho chức năng Pricing.

## 1. Đăng ký tài khoản PayOS

### Bước 1: Truy cập và đăng ký

1. Truy cập: https://pay.payos.vn/web4s/
2. Click **"Đăng ký"** hoặc **"Tạo tài khoản"**
3. Điền thông tin:
   - Email
   - Mật khẩu
   - Số điện thoại
   - Tên doanh nghiệp/cá nhân
4. Xác nhận email

### Bước 2: Xác thực tài khoản

1. Đăng nhập vào PayOS Dashboard
2. Hoàn thiện thông tin:
   - Thông tin cá nhân/doanh nghiệp
   - Thông tin tài khoản ngân hàng (để nhận tiền)
3. Xác thực danh tính (nếu cần)

### Bước 3: Tạo kênh kết nối (Channel)

1. Vào **"Kênh kết nối"** hoặc **"Channels"**
2. Click **"Tạo kênh mới"**
3. Điền thông tin:
   - Tên kênh: Tên website/app của bạn
   - Website URL: URL của website
   - Return URL: `https://yourdomain.com/pricing/payment-success`
   - Cancel URL: `https://yourdomain.com/pricing/payment-cancelled`
4. Lưu và lấy thông tin:
   - **Client ID**
   - **API Key**
   - **Checksum Key**

## 2. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here

# PayOS URLs (optional - có giá trị mặc định)
PAYOS_BASE_URL=https://api-merchant.payos.vn
# PayOS yêu cầu returnUrl và cancelUrl trong API call (bắt buộc)
# Nhưng business logic sẽ được xử lý bởi webhook, không phải return URL
PAYOS_RETURN_URL=http://localhost:5173/pricing/payment-success
PAYOS_CANCEL_URL=http://localhost:5173/pricing/payment-cancelled
```

## 3. Cấu hình Webhook URL

### Bước 1: Lấy Webhook URL

Webhook URL của bạn: `https://yourdomain.com/api/pricing/payment-webhook`

**Lưu ý:** 
- URL phải là **public URL** (không thể dùng localhost)
- URL phải có **HTTPS** (không dùng HTTP)
- Để test local, dùng **ngrok** (xem phần dưới)

### Bước 2: Cấu hình trên PayOS Dashboard

1. Đăng nhập PayOS Dashboard
2. Vào **"Kênh kết nối"** → Chọn kênh của bạn
3. Tìm mục **"Webhook URL"** hoặc **"Callback URL"**
4. Nhập: `https://yourdomain.com/api/pricing/payment-webhook`
5. Lưu cấu hình

## 4. Test với ngrok (Local Development)

### Cài đặt ngrok

```bash
# Cài đặt ngrok
npm install -g ngrok

# Hoặc download từ: https://ngrok.com/download
```

### Chạy ngrok

```bash
# Chạy ngrok để expose port 3000
ngrok http 3000

# Bạn sẽ nhận được URL như: https://abc123.ngrok.io
```

### Cấu hình Webhook

1. Copy ngrok URL (ví dụ: `https://abc123.ngrok.io`)
2. Cập nhật Webhook URL trên PayOS Dashboard:
   - `https://abc123.ngrok.io/api/pricing/payment-webhook`
3. Lưu cấu hình

**Lưu ý:** Mỗi lần restart ngrok, URL sẽ thay đổi. Bạn cần cập nhật lại trên PayOS Dashboard.

## 5. Kiểm tra cấu hình

Chạy script test:

```bash
cd DATN_BACKEND
npm run test:pricing-config
```

Script sẽ kiểm tra:
- ✅ Environment variables
- ✅ PayOS service connection
- ✅ Email configuration
- ✅ Webhook URL

## 6. Flow thanh toán

### Flow 1: Khách hàng mới

```
1. User chọn gói → POST /api/pricing/orders
   ↓
2. Backend tạo order và payment link từ PayOS
   ↓
3. User được redirect đến PayOS checkout page
   ↓
4. User thanh toán (QR code hoặc banking)
   ↓
5. PayOS gọi webhook → POST /api/pricing/payment-webhook
   ↓
6. Backend xử lý:
   - Tạo Tenant
   - Tạo User với role company_admin
   - Generate hợp đồng PDF
   - Gửi email tài khoản/mật khẩu
   ↓
7. User redirect về /pricing/payment-success
```

### Flow 2: Khách hàng đã có tài khoản

```
1. User đã đăng nhập, chọn nâng cấp gói
   ↓
2. POST /api/pricing/orders (có userId)
   ↓
3. Backend tạo order và payment link
   ↓
4. User thanh toán qua PayOS
   ↓
5. PayOS webhook → Backend cập nhật subscription
   ↓
6. Gửi email xác nhận gia hạn
   ↓
7. User redirect về /pricing/payment-success
```

## 7. API Endpoints

### Tạo đơn hàng

**POST** `/api/pricing/orders`

```json
{
  "planType": "monthly" | "quarterly" | "yearly",
  "companyInfo": {
    "name": "Tên công ty",
    "address": "Địa chỉ",
    "phone": "0123456789",
    "email": "company@example.com"
  },
  "contactPerson": {
    "name": "Người đại diện",
    "email": "contact@example.com",
    "phone": "0123456789"
  },
  "userId": "optional_user_id" // Nếu là khách hàng cũ
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORDER-1234567890-ABC12345",
    "paymentUrl": "https://pay.payos.vn/web/...",
    "qrCode": "data:image/png;base64,...",
    "amount": 99000,
    "planType": "monthly"
  }
}
```

### Webhook (PayOS gọi tự động)

**POST** `/api/pricing/payment-webhook`

PayOS sẽ gọi endpoint này sau khi thanh toán thành công/thất bại. Tất cả business logic được xử lý trong webhook này.

## 8. Troubleshooting

### Lỗi: "PayOS chưa được cấu hình đầy đủ"

**Nguyên nhân:** Thiếu environment variables

**Giải pháp:**
- Kiểm tra `.env` có đầy đủ `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
- Restart server sau khi cập nhật `.env`

### Lỗi: "Invalid signature" trong webhook

**Nguyên nhân:** Checksum key không đúng hoặc webhook data bị thay đổi

**Giải pháp:**
- Kiểm tra `PAYOS_CHECKSUM_KEY` có đúng không
- Đảm bảo webhook data không bị modify trước khi verify

### Lỗi: "Order not found" trong webhook

**Nguyên nhân:** Không tìm thấy order theo orderCode

**Giải pháp:**
- Kiểm tra orderCode có được lưu trong `paymentOrderCode` không
- Kiểm tra order có tồn tại trong database không

### Webhook không được gọi

**Nguyên nhân:** 
- Webhook URL không public
- Chưa cấu hình trên PayOS Dashboard
- Firewall chặn

**Giải pháp:**
- Sử dụng ngrok cho local testing
- Kiểm tra webhook URL trên PayOS Dashboard
- Kiểm tra firewall/security group

## 9. Production Checklist

Trước khi deploy lên production:

- [ ] Đã đăng ký tài khoản PayOS production
- [ ] Đã tạo kênh kết nối production
- [ ] Đã cấu hình Webhook URL với domain thật
- [ ] Đã test thanh toán thành công
- [ ] Đã test webhook hoạt động đúng
- [ ] Đã cấu hình email domain riêng
- [ ] Đã bật HTTPS cho tất cả URLs
- [ ] Đã test flow khách hàng mới
- [ ] Đã test flow khách hàng cũ (gia hạn)

## 10. Tài liệu tham khảo

- PayOS Website: https://payos.vn/
- PayOS Dashboard: https://pay.payos.vn/web4s/
- PayOS API Documentation: https://docs.payos.vn/
- Ngrok: https://ngrok.com/


