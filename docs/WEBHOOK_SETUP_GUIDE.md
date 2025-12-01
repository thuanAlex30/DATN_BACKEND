# Hướng dẫn cấu hình Webhook URL cho PayOS

## 📋 Tổng quan

Webhook URL là địa chỉ PayOS sẽ gọi trực tiếp đến server của bạn sau khi thanh toán hoàn tất. Đây là cách duy nhất để đảm bảo server xử lý đơn hàng đúng cách.

**Webhook URL của bạn:** `/api/pricing/payment-webhook`

## 🎯 Các bước cấu hình

### **Bước 1: Xác định URL đầy đủ**

Webhook URL đầy đủ phụ thuộc vào môi trường:

#### **Production (Khi deploy lên server thật):**
```
https://your-domain.com/api/pricing/payment-webhook
```

#### **Local Development (Dùng ngrok):**
```
https://your-ngrok-url.ngrok.io/api/pricing/payment-webhook
```

---

### **Bước 2: Cấu hình trên PayOS Dashboard**

1. **Đăng nhập PayOS Dashboard**
   - Truy cập: https://pay.payos.vn/web4s/
   - Đăng nhập với tài khoản của bạn

2. **Vào trang "Kênh kết nối"**
   - Click vào menu **"Kênh kết nối"** hoặc **"Channels"**
   - Chọn kênh của bạn (ví dụ: "Safety Management System" / "CHMS")

3. **Tìm mục "Webhook URL"**
   - Trong tab **"Thông tin tích hợp"** (Integration information)
   - Tìm field **"Webhook url"** hoặc **"Callback URL"**

4. **Nhập Webhook URL**
   - **Production:** `https://your-domain.com/api/pricing/payment-webhook`
   - **Local (ngrok):** `https://your-ngrok-url.ngrok.io/api/pricing/payment-webhook`

5. **Lưu cấu hình**
   - Click nút **"Lưu"** hoặc **"Save"**
   - Đợi vài giây để PayOS xác nhận

---

## 🧪 Test với ngrok (Local Development)

### **Cài đặt ngrok**

#### **Option 1: Dùng npm (Khuyến nghị)**
```bash
npm install -g ngrok
```

#### **Option 2: Download trực tiếp**
- Truy cập: https://ngrok.com/download
- Download và giải nén
- Thêm vào PATH (hoặc dùng đường dẫn đầy đủ)

### **Chạy ngrok**

1. **Khởi động backend server**
   ```bash
   cd DATN_BACKEND
   npm start
   # Hoặc: node server.js
   ```
   Server sẽ chạy trên port 3000 (mặc định)

2. **Chạy ngrok trong terminal mới**
   ```bash
   ngrok http 3000
   ```

3. **Copy ngrok URL**
   Bạn sẽ thấy output như:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
   ```
   Copy URL: `https://abc123.ngrok.io`

4. **Cấu hình trên PayOS Dashboard**
   - Webhook URL: `https://abc123.ngrok.io/api/pricing/payment-webhook`
   - Lưu cấu hình

### **⚠️ Lưu ý quan trọng về ngrok:**

- **URL thay đổi mỗi lần restart:** Mỗi lần chạy lại `ngrok http 3000`, URL sẽ thay đổi
- **Cần cập nhật lại:** Mỗi lần URL thay đổi, bạn phải cập nhật lại trên PayOS Dashboard
- **Free plan có giới hạn:** Ngrok free plan có giới hạn số request/giờ

### **Giải pháp: Dùng ngrok với domain tĩnh (ngrok Pro)**

Nếu có ngrok Pro, bạn có thể dùng domain tĩnh:
```bash
ngrok http 3000 --domain=your-static-domain.ngrok.io
```

---

## ✅ Kiểm tra cấu hình

### **Cách 1: Test bằng script**

```bash
cd DATN_BACKEND
npm run test:pricing-config
```

Script sẽ kiểm tra:
- ✅ PayOS credentials
- ✅ Webhook URL đã được cấu hình
- ✅ Email configuration

### **Cách 2: Test thực tế**

1. **Tạo đơn hàng test**
   ```bash
   curl -X POST http://localhost:3000/api/pricing/orders \
     -H "Content-Type: application/json" \
     -d '{
       "planType": "monthly",
       "companyInfo": {
         "name": "Test Company",
         "address": "123 Test St",
         "phone": "0123456789",
         "email": "test@example.com"
       },
       "contactPerson": {
         "name": "Test Person",
         "email": "test@example.com",
         "phone": "0123456789"
       }
     }'
   ```

2. **Thanh toán trên PayOS**
   - Mở payment URL từ response
   - Thanh toán test (dùng thẻ test của PayOS)

3. **Kiểm tra logs**
   ```bash
   # Xem logs backend
   # Bạn sẽ thấy log: "Payment webhook received"
   ```

4. **Kiểm tra database**
   - Order status đã chuyển sang "paid"
   - Tenant và User đã được tạo (nếu khách hàng mới)

---

## 🔍 Troubleshooting

### **Lỗi: PayOS không gọi được webhook**

**Nguyên nhân:**
- Webhook URL không public (localhost không được)
- URL không đúng format
- Server không chạy hoặc không accessible

**Giải pháp:**
1. ✅ Đảm bảo dùng ngrok cho local development
2. ✅ Kiểm tra ngrok đang chạy: `ngrok http 3000`
3. ✅ Kiểm tra backend server đang chạy: `http://localhost:3000`
4. ✅ Test webhook URL: `curl https://your-ngrok-url.ngrok.io/api/pricing/payment-webhook`

### **Lỗi: "Invalid signature" trong webhook**

**Nguyên nhân:**
- Checksum Key không đúng
- PayOS gửi data bị thay đổi

**Giải pháp:**
1. ✅ Kiểm tra `PAYOS_CHECKSUM_KEY` trong `.env` khớp với PayOS Dashboard
2. ✅ Copy lại Checksum Key từ PayOS Dashboard
3. ✅ Restart backend server sau khi cập nhật `.env`

### **Lỗi: Webhook được gọi nhưng không xử lý**

**Nguyên nhân:**
- Order không tìm thấy
- Database connection issue
- Code error trong webhook handler

**Giải pháp:**
1. ✅ Kiểm tra logs backend để xem error cụ thể
2. ✅ Kiểm tra order có tồn tại trong database không
3. ✅ Kiểm tra database connection

---

## 📝 Checklist

Trước khi go-live, đảm bảo:

- [ ] Webhook URL đã được cấu hình trên PayOS Dashboard
- [ ] Webhook URL là HTTPS (không dùng HTTP)
- [ ] Webhook URL là public URL (không dùng localhost)
- [ ] Backend server có thể nhận POST request từ PayOS
- [ ] `PAYOS_CHECKSUM_KEY` trong `.env` khớp với PayOS Dashboard
- [ ] Đã test webhook với đơn hàng thật
- [ ] Đã kiểm tra logs để đảm bảo webhook hoạt động
- [ ] Đã kiểm tra database để đảm bảo order được xử lý

---

## 🔗 Tài liệu liên quan

- [WHY_WEBHOOK.md](./WHY_WEBHOOK.md) - Tại sao cần webhook
- [PAYOS_SETUP.md](./PAYOS_SETUP.md) - Hướng dẫn setup PayOS
- [PRICING_API.md](./PRICING_API.md) - API documentation

---

## 💡 Tips

1. **Dùng ngrok dashboard:** Truy cập `http://localhost:4040` khi chạy ngrok để xem requests
2. **Test webhook với Postman:** Có thể test webhook handler trực tiếp với Postman
3. **Monitor logs:** Luôn theo dõi logs khi test webhook
4. **Backup Checksum Key:** Lưu Checksum Key ở nơi an toàn

---

**Cần hỗ trợ?** Xem thêm:
- PayOS Documentation: https://docs.payos.vn/
- PayOS Support: https://support.payos.app/

