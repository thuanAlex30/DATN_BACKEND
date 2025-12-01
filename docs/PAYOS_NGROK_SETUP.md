# Hướng dẫn cấu hình PayOS với ngrok

## Tổng quan

PayOS không chấp nhận `localhost` cho Return URL và Cancel URL. Để test trên local, bạn cần dùng ngrok để tạo public URL.

## Bước 1: Cài đặt ngrok

### Windows:
```bash
# Tải từ: https://ngrok.com/download
# Hoặc dùng Chocolatey:
choco install ngrok

# Hoặc dùng Scoop:
scoop install ngrok
```

### Mac:
```bash
brew install ngrok
```

### Linux:
```bash
# Tải từ: https://ngrok.com/download
# Hoặc dùng snap:
snap install ngrok
```

## Bước 2: Chạy ngrok

### Option 1: Ngrok cho Backend (Port 3000)
```bash
ngrok http 3000
```

Sau đó copy URL (ví dụ: `https://abc123.ngrok.io`) và thêm vào `.env`:
```env
PAYOS_RETURN_URL=https://abc123.ngrok.io/api/pricing/payment-return
PAYOS_CANCEL_URL=https://abc123.ngrok.io/api/pricing/payment-cancel
```

### Option 2: Ngrok cho Frontend (Port 5173)
```bash
ngrok http 5173
```

Sau đó copy URL và thêm vào `.env`:
```env
PAYOS_RETURN_URL=https://abc123.ngrok.io/pricing/payment-success
PAYOS_CANCEL_URL=https://abc123.ngrok.io/pricing/payment-cancelled
```

## Bước 3: Lấy URL từ ngrok

### Cách 1: Dùng script tự động
```bash
# Đảm bảo ngrok đang chạy trước
node DATN_BACKEND/scripts/get-ngrok-url.js
```

Script sẽ hiển thị URL và cấu hình cần thêm vào `.env`.

### Cách 2: Truy cập ngrok Web Interface
1. Mở trình duyệt: http://localhost:4040
2. Tìm HTTPS URL trong phần "Forwarding"
3. Copy URL và cấu hình vào `.env`

### Cách 3: Dùng ngrok API
```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:4040/api/tunnels | ConvertTo-Json

# Hoặc curl
curl http://localhost:4040/api/tunnels
```

## Bước 4: Cấu hình .env

Thêm vào file `.env`:

```env
# Option 1: Dùng ngrok cho backend
PAYOS_RETURN_URL=https://your-ngrok-url.ngrok.io/api/pricing/payment-return
PAYOS_CANCEL_URL=https://your-ngrok-url.ngrok.io/api/pricing/payment-cancel

# Option 2: Dùng ngrok cho frontend (nếu frontend xử lý trực tiếp)
PAYOS_RETURN_URL=https://your-ngrok-url.ngrok.io/pricing/payment-success
PAYOS_CANCEL_URL=https://your-ngrok-url.ngrok.io/pricing/payment-cancelled
```

## Bước 5: Restart Server

Sau khi cập nhật `.env`, restart backend server:
```bash
# Dừng server (Ctrl+C) và chạy lại
npm start
# hoặc
npm run dev
```

## Lưu ý

1. **Ngrok URL thay đổi mỗi lần restart** (trừ khi dùng ngrok account)
   - Mỗi lần restart ngrok, URL sẽ thay đổi
   - Cần cập nhật lại `.env` và restart server

2. **Dùng ngrok account để có URL cố định**
   - Đăng ký tại: https://dashboard.ngrok.com/
   - Cấu hình domain cố định
   - URL sẽ không thay đổi

3. **Production**
   - Không dùng ngrok cho production
   - Dùng domain thật:
     ```env
     PAYOS_RETURN_URL=https://yourdomain.com/pricing/payment-success
     PAYOS_CANCEL_URL=https://yourdomain.com/pricing/payment-cancelled
     ```

## Kiểm tra

1. Chạy script test:
   ```bash
   npm run test:payos
   ```

2. Kiểm tra log khi tạo payment link:
   - Return URL và Cancel URL phải là ngrok URL (không phải localhost)

3. Test thanh toán:
   - Tạo đơn hàng
   - Thanh toán qua PayOS
   - Kiểm tra redirect về đúng URL

## Troubleshooting

### Lỗi: "Thông tin truyền lên không đúng"
- Kiểm tra ngrok đang chạy: http://localhost:4040
- Kiểm tra URL trong `.env` có đúng không
- Kiểm tra URL có chứa `localhost` không (phải là ngrok URL)

### Lỗi: "Không thể kết nối đến ngrok API"
- Đảm bảo ngrok đang chạy: `ngrok http 3000`
- Kiểm tra port 4040 không bị block

### URL thay đổi mỗi lần
- Dùng ngrok account để có URL cố định
- Hoặc tự động lấy URL bằng script: `node scripts/get-ngrok-url.js`

