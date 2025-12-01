# Hướng dẫn cấu hình Pricing với PayOS và Nodemailer

## Tổng quan

Để chạy được chức năng Pricing, bạn cần cấu hình 2 dịch vụ:
1. **PayOS** - Xử lý thanh toán
2. **Nodemailer** - Gửi email tài khoản và xác nhận

## 1. Cấu hình PayOS

### Bước 1: Đăng ký tài khoản PayOS

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

### Bước 4: Cấu hình biến môi trường

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

### Bước 5: Cấu hình Webhook URL

#### 5.1. Lấy Webhook URL

Webhook URL của bạn: `https://yourdomain.com/api/pricing/payment-webhook`

**Lưu ý:** 
- URL phải là **public URL** (không thể dùng localhost)
- URL phải có **HTTPS** (không dùng HTTP)
- Để test local, dùng **ngrok** (xem phần dưới)

#### 5.2. Cấu hình trên PayOS Dashboard

1. Đăng nhập PayOS Dashboard
2. Vào **"Kênh kết nối"** → Chọn kênh của bạn
3. Tìm mục **"Webhook URL"** hoặc **"Callback URL"**
4. Nhập: `https://yourdomain.com/api/pricing/payment-webhook`
5. Lưu cấu hình

### Bước 6: Test với ngrok (Local Development)

```bash
# Cài đặt ngrok
npm install -g ngrok

# Chạy ngrok để expose port 3000
ngrok http 3000

# Bạn sẽ nhận được URL như: https://abc123.ngrok.io
# Copy URL và cấu hình trên PayOS Dashboard:
# https://abc123.ngrok.io/api/pricing/payment-webhook
```

**Lưu ý:** Mỗi lần restart ngrok, URL sẽ thay đổi. Bạn cần cập nhật lại trên PayOS Dashboard.

## 2. Cấu hình Nodemailer

### Bước 1: Chọn Email Provider

Hệ thống hỗ trợ các provider phổ biến:
- **Gmail** (khuyến nghị cho development)
- **Outlook/Hotmail**
- **Yahoo**
- **Custom SMTP Server**

### Bước 2: Cấu hình Gmail (Khuyến nghị)

#### 2.1. Bật 2-Step Verification

1. Truy cập: https://myaccount.google.com/security
2. Bật **2-Step Verification**
3. Hoàn thành các bước xác thực

#### 2.2. Tạo App Password

1. Vào **Google Account** → **Security**
2. Tìm **App passwords** (hoặc truy cập: https://myaccount.google.com/apppasswords)
3. Chọn app: **Mail**
4. Chọn device: **Other (Custom name)** → Nhập "Safety System"
5. Click **Generate**
6. Copy **App Password** (16 ký tự, không có khoảng trắng)

#### 2.3. Cấu hình biến môi trường

```env
# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
```

### Bước 3: Cấu hình Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your_password
```

### Bước 4: Cấu hình Custom SMTP

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
```

## 3. Cấu hình Frontend và Backend URLs

Thêm vào file `.env`:

```env
# Frontend Configuration
FRONTEND_URL=http://localhost:5173
# Production: https://yourdomain.com

# Backend Configuration
BACKEND_URL=http://localhost:3000
# Production: https://api.yourdomain.com
```

## 4. Kiểm tra cấu hình

### Test PayOS

1. Tạo order mới qua API
2. Kiểm tra `paymentUrl` có được tạo đúng không
3. Click vào `paymentUrl` để test thanh toán
4. Kiểm tra webhook có nhận được callback từ PayOS không

### Test Nodemailer

Tạo file test: `DATN_BACKEND/scripts/test-email.js`

```javascript
const emailService = require('../services/emailService');

async function testEmail() {
  try {
    await emailService.sendAccountCredentials({
      to: 'test@example.com',
      username: 'testuser',
      password: 'Test123!',
      companyName: 'Test Company',
      loginUrl: 'http://localhost:5173/login'
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email error:', error);
  }
}

testEmail();
```

Chạy test:
```bash
node scripts/test-email.js
```

Hoặc chạy script test tổng hợp:
```bash
npm run test:pricing-config
```

## 5. Checklist cấu hình

Trước khi deploy, đảm bảo:

- [ ] PayOS Client ID đã được cấu hình
- [ ] PayOS API Key đã được cấu hình
- [ ] PayOS Checksum Key đã được cấu hình
- [ ] PayOS Webhook URL đã được cấu hình trên PayOS Dashboard
- [ ] Webhook URL là public URL (không phải localhost)
- [ ] SMTP credentials đã được cấu hình đúng
- [ ] Gmail App Password đã được tạo (nếu dùng Gmail)
- [ ] FRONTEND_URL và BACKEND_URL đã được cấu hình
- [ ] Đã test tạo order thành công
- [ ] Đã test thanh toán thành công
- [ ] Đã test nhận email

## 6. Troubleshooting

### PayOS Issues

**Lỗi: "PayOS chưa được cấu hình đầy đủ"**
- Kiểm tra `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` có đúng không
- Restart server sau khi cập nhật `.env`

**Lỗi: "Invalid signature" trong webhook**
- Kiểm tra `PAYOS_CHECKSUM_KEY` có đúng không
- Đảm bảo webhook data không bị modify trước khi verify

**Lỗi: "Order not found" trong webhook**
- Kiểm tra orderCode có được lưu trong `paymentOrderCode` không
- Kiểm tra order có tồn tại trong database không

**Webhook không được gọi**
- Webhook URL không public
- Chưa cấu hình trên PayOS Dashboard
- Firewall chặn
- Sử dụng ngrok cho local testing

### Nodemailer Issues

**Lỗi: "Invalid login"**
- Kiểm tra `SMTP_USER` và `SMTP_PASSWORD` có đúng không
- Nếu dùng Gmail, đảm bảo đã tạo App Password (không dùng mật khẩu thường)

**Lỗi: "Connection timeout"**
- Kiểm tra `SMTP_HOST` và `SMTP_PORT` có đúng không
- Kiểm tra firewall có chặn port 587 không
- Thử dùng port 465 với `secure: true`

**Lỗi: "Email not sent"**
- Kiểm tra email có bị spam không
- Kiểm tra SMTP credentials có đúng không
- Xem logs trong console để biết lỗi chi tiết

## 7. Production Checklist

Khi deploy lên production:

- [ ] Đã đăng ký tài khoản PayOS production
- [ ] Đã tạo kênh kết nối production
- [ ] Đã cấu hình Webhook URL với domain thật
- [ ] Đã test thanh toán thành công
- [ ] Đã test webhook hoạt động đúng
- [ ] Đã cấu hình email domain riêng
- [ ] Đã bật HTTPS cho tất cả URLs
- [ ] Đã test flow khách hàng mới
- [ ] Đã test flow khách hàng cũ (gia hạn)

## 8. Tài liệu tham khảo

- PayOS Website: https://payos.vn/
- PayOS Dashboard: https://pay.payos.vn/web4s/
- PayOS API Documentation: https://docs.payos.vn/
- Nodemailer Documentation: https://nodemailer.com/about/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Ngrok: https://ngrok.com/
