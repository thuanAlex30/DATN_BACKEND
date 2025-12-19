# Hướng Dẫn Kiểm Tra và Cấu Hình Gmail SMTP

## Thông Tin Cấu Hình SMTP Gmail

Dựa trên file `.env`, các thông tin cần kiểm tra:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password_here
```

## Cách Kiểm Tra Thông Tin Trên Google

### 1. Kiểm Tra SMTP Host và Port của Gmail

**Tìm kiếm trên Google:**
- "Gmail SMTP settings"
- "Gmail SMTP server configuration"
- "Gmail SMTP port 587"

**Nguồn chính thức:**
- **Google Support**: https://support.google.com/mail/answer/7126229
- **Google Workspace Admin Help**: https://support.google.com/a/answer/176600

**Kết quả kiểm tra:**
- ✅ **SMTP Host**: `smtp.gmail.com` (chính xác)
- ✅ **SMTP Port**: `587` (TLS/STARTTLS) hoặc `465` (SSL)
- ✅ Port 587 là lựa chọn phổ biến và được khuyến nghị

### 2. Kiểm Tra Cách Tạo App Password

**Tìm kiếm trên Google:**
- "Gmail App Password"
- "How to generate Gmail App Password"
- "Gmail 2-Step Verification App Password"

**Nguồn chính thức:**
- **Google Account Help**: https://support.google.com/accounts/answer/185833
- **Google Support**: https://support.google.com/accounts/answer/185833?hl=en

**Các bước:**
1. Đăng nhập vào Google Account: https://myaccount.google.com/
2. Vào **Security** (Bảo mật)
3. Bật **2-Step Verification** (Xác minh 2 bước) nếu chưa bật
4. Vào **App passwords** (Mật khẩu ứng dụng)
5. Tạo App Password mới cho "Mail" và "Other (Custom name)"
6. Nhập tên: "Nodemailer" hoặc "SMTP"
7. Copy mật khẩu 16 ký tự (không có dấu cách)

**Lưu ý quan trọng:**
- ❌ **KHÔNG** dùng mật khẩu Gmail thông thường
- ✅ **PHẢI** dùng App Password (16 ký tự)
- ✅ **PHẢI** bật 2-Step Verification trước

### 3. Kiểm Tra Cấu Hình Nodemailer với Gmail

**Tìm kiếm trên Google:**
- "Nodemailer Gmail configuration"
- "Nodemailer Gmail setup example"
- "Nodemailer SMTP Gmail"

**Nguồn chính thức:**
- **Nodemailer Documentation**: https://nodemailer.com/about/
- **Nodemailer Gmail Guide**: https://nodemailer.com/usage/using-gmail/
- **Nodemailer GitHub**: https://github.com/nodemailer/nodemailer

**Cấu hình mẫu:**
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
}
```

### 4. Kiểm Tra Các Vấn Đề Thường Gặp

**Tìm kiếm trên Google:**
- "Gmail SMTP authentication failed"
- "Nodemailer Gmail not working"
- "Gmail App Password not working"

**Các lỗi phổ biến:**
1. **"Invalid login"**: 
   - Kiểm tra lại App Password (không phải mật khẩu thường)
   - Đảm bảo 2-Step Verification đã bật

2. **"Connection timeout"**:
   - Kiểm tra firewall/antivirus
   - Thử port 465 với `secure: true`

3. **"Less secure app access"**:
   - Gmail đã tắt tính năng này từ 2022
   - **PHẢI** dùng App Password

## Tóm Tắt Các Link Quan Trọng

### Google Support
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [App Passwords Guide](https://support.google.com/accounts/answer/185833)
- [2-Step Verification](https://support.google.com/accounts/answer/185839)

### Nodemailer Documentation
- [Nodemailer Homepage](https://nodemailer.com/)
- [Using Gmail with Nodemailer](https://nodemailer.com/usage/using-gmail/)
- [Nodemailer GitHub](https://github.com/nodemailer/nodemailer)

### Google Account Management
- [Google Account Security](https://myaccount.google.com/security)
- [App Passwords Page](https://myaccount.google.com/apppasswords)

## Kiểm Tra Nhanh

### ✅ Checklist Cấu Hình Đúng

- [ ] SMTP_HOST = `smtp.gmail.com`
- [ ] SMTP_PORT = `587` (hoặc `465`)
- [ ] SMTP_USER = email Gmail đầy đủ (ví dụ: `user@gmail.com`)
- [ ] SMTP_PASSWORD = App Password 16 ký tự (KHÔNG phải mật khẩu thường)
- [ ] Đã bật 2-Step Verification trên Google Account
- [ ] Đã tạo App Password mới trong Google Account Settings

### 🔍 Cách Test Cấu Hình

1. Kiểm tra kết nối SMTP bằng telnet:
   ```bash
   telnet smtp.gmail.com 587
   ```

2. Test gửi email đơn giản với Nodemailer
3. Kiểm tra logs để xem lỗi cụ thể

## Lưu Ý Bảo Mật

⚠️ **QUAN TRỌNG**: 
- **KHÔNG** commit file `.env` lên Git
- **KHÔNG** chia sẻ App Password
- **KHÔNG** dùng mật khẩu Gmail thông thường
- App Password chỉ hiển thị 1 lần khi tạo, lưu lại ngay

