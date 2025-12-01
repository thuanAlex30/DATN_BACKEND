# Khắc phục lỗi "Thông tin truyền lên không đúng" - Hướng dẫn cuối cùng

## Vấn đề

Sau khi đã cấu hình đầy đủ:
- ✅ Credentials đã có (Client ID, API Key, Checksum Key)
- ✅ Return URL và Cancel URL đã được cấu hình với ngrok
- ✅ Amount = 1000 (>= 1000 VND)
- ✅ OrderCode = 8 chữ số

Nhưng vẫn gặp lỗi: **"Thông tin truyền lên không đúng"**

## Nguyên nhân có thể

### 1. Kênh kết nối chưa được kích hoạt
- Kênh có thể bị "Tạm dừng"
- Cần kích hoạt kênh trên PayOS Dashboard

### 2. Credentials không đúng
- Client ID, API Key, Checksum Key có thể đã thay đổi
- Cần copy lại từ PayOS Dashboard

### 3. PayOS không chấp nhận ngrok-free.dev
- Một số version của PayOS có thể không chấp nhận domain `ngrok-free.dev`
- Cần dùng ngrok account với domain cố định

### 4. Return URL/Cancel URL chưa được whitelist
- PayOS có thể yêu cầu whitelist URL trong Dashboard
- Nhưng PayOS Dashboard có thể không có option này

## Giải pháp từng bước

### Bước 1: Kiểm tra kênh kết nối

1. Đăng nhập PayOS Dashboard: https://pay.payos.vn/web4s/
2. Vào "Kênh thanh toán" (Payment Channel)
3. Kiểm tra trạng thái:
   - Phải là **"Đang hoạt động"** (Active)
   - Nếu là "Tạm dừng", click **"Kích hoạt"**

### Bước 2: Copy lại Credentials

1. Trong kênh kết nối, copy lại:
   - **Client ID**
   - **API Key**
   - **Checksum Key**

2. Cập nhật vào `.env`:
   ```env
   PAYOS_CLIENT_ID=your_client_id_here
   PAYOS_API_KEY=your_api_key_here
   PAYOS_CHECKSUM_KEY=your_checksum_key_here
   ```

3. **Restart backend server**

### Bước 3: Test với script chi tiết

```bash
node DATN_BACKEND/scripts/test-payos-direct.js
```

Script này sẽ test với nhiều URL khác nhau để tìm URL nào PayOS chấp nhận.

### Bước 4: Thử dùng ngrok account (nếu có)

Nếu có ngrok account:
1. Cấu hình domain cố định
2. Dùng domain đó thay vì `ngrok-free.dev`

### Bước 5: Liên hệ PayOS Support

Nếu vẫn không được:
1. Email: support@payos.vn
2. Hoặc qua PayOS Dashboard
3. Cung cấp:
   - Client ID
   - Lỗi cụ thể
   - Request payload (từ logs)

## Checklist

- [ ] Kênh kết nối đang "Hoạt động"
- [ ] Credentials đã được copy lại và cập nhật trong .env
- [ ] Đã restart backend server sau khi cập nhật .env
- [ ] Đã test với script `test-payos-direct.js`
- [ ] Đã kiểm tra logs để xem response chi tiết từ PayOS
- [ ] Đã liên hệ PayOS Support (nếu cần)

## Debug Tips

### Xem response chi tiết từ PayOS

Code đã được cập nhật để log response chi tiết. Xem logs:
```bash
# Xem logs khi chạy test
npm run test:payos

# Hoặc xem log file
tail -f DATN_BACKEND/logs/combined.log
```

### Test với curl trực tiếp

```bash
curl -X POST https://api-merchant.payos.vn/v2/payment-requests \
  -H "x-client-id: YOUR_CLIENT_ID" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": 12345678,
    "amount": 1000,
    "description": "Test",
    "items": [{"name": "Test", "quantity": 1, "price": 1000}],
    "returnUrl": "https://your-url.com/return",
    "cancelUrl": "https://your-url.com/cancel"
  }'
```

## Kết luận

Lỗi "Thông tin truyền lên không đúng" thường do:
1. **Kênh chưa được kích hoạt** (phổ biến nhất)
2. **Credentials không đúng** (cần copy lại)
3. **PayOS API có vấn đề** (cần liên hệ support)

Hãy thử các bước trên theo thứ tự. Nếu vẫn không được, liên hệ PayOS Support với thông tin chi tiết.

