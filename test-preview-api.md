# Cách test generatePreviewPdf

Có 3 cách để test hàm `generatePreviewPdf`:

## 1. Test trực tiếp bằng script (Khuyến nghị)

Chạy script test đơn giản:

```bash
node test-preview-pdf.js
```

Script này sẽ:
- Tạo PDF preview với dữ liệu test
- Hiển thị URL của PDF đã tạo
- Không cần authentication

## 2. Test qua API endpoint

### Yêu cầu:
- Server đang chạy (`npm start` hoặc `npm run dev`)
- Có token authentication (nếu endpoint yêu cầu)

### Request:

```bash
POST http://localhost:3000/api/pricing/contract-preview
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "planType": "monthly",
  "companyInfo": {
    "name": "Công Ty TNHH Lam Danh Mai ABC",
    "email": "lamakakigarc@gmail.com",
    "address": "Số 30 Lê Thánh Tông",
    "phone": "0779418439",
    "taxCode": "1234567890"
  },
  "contactPerson": {
    "name": "Nguyễn Thành Vũ",
    "position": "Giám đốc",
    "email": "nguyenthanhvu@example.com",
    "phone": "0123456789"
  }
}
```

### Sử dụng curl:

```bash
curl -X POST http://localhost:3000/api/pricing/contract-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "planType": "monthly",
    "companyInfo": {
      "name": "Công Ty TNHH Lam Danh Mai ABC",
      "email": "lamakakigarc@gmail.com",
      "address": "Số 30 Lê Thánh Tông",
      "phone": "0779418439",
      "taxCode": "1234567890"
    },
    "contactPerson": {
      "name": "Nguyễn Thành Vũ",
      "position": "Giám đốc",
      "email": "nguyenthanhvu@example.com",
      "phone": "0123456789"
    }
  }'
```

### Sử dụng Postman/Insomnia:

1. Method: `POST`
2. URL: `http://localhost:3000/api/pricing/contract-preview`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN` (nếu cần)
4. Body (JSON):
```json
{
  "planType": "monthly",
  "companyInfo": {
    "name": "Công Ty TNHH Lam Danh Mai ABC",
    "email": "lamakakigarc@gmail.com",
    "address": "Số 30 Lê Thánh Tông",
    "phone": "0779418439",
    "taxCode": "1234567890"
  },
  "contactPerson": {
    "name": "Nguyễn Thành Vũ",
    "position": "Giám đốc",
    "email": "nguyenthanhvu@example.com",
    "phone": "0123456789"
  }
}
```

## 3. Test qua Frontend

1. Mở trang: `http://localhost:5173/pricing/order?plan=monthly`
2. Điền đầy đủ thông tin form
3. Click "Tiếp tục thanh toán"
4. Hệ thống sẽ tự động gọi API và hiển thị PDF preview

## Response

Khi thành công, response sẽ có dạng:

```json
{
  "success": true,
  "message": "Tạo preview hợp đồng thành công",
  "data": {
    "previewPdfUrl": "http://localhost:3000/uploads/contracts/preview-1234567890.pdf"
  }
}
```

## Kiểm tra kết quả

1. **Mở PDF URL** trong browser để xem preview
2. **Kiểm tra các trường**:
   - Tên Công ty có đúng vị trí không?
   - Email Công ty có đúng vị trí không?
   - Địa chỉ có đúng vị trí không?
   - Điện thoại có đúng vị trí không?
   - Mã số thuế có đúng vị trí không?
   - Đại diện có đúng vị trí không?
3. **Kiểm tra font**: Text tiếng Việt có hiển thị đúng không?

## Troubleshooting

### Lỗi "Template PDF không tồn tại"
- Đảm bảo file `CHMS_HopDongThanhToan.pdf` có trong `uploads/contracts/`

### Lỗi "WinAnsi cannot encode"
- Font không hỗ trợ tiếng Việt
- Kiểm tra xem font Noto Sans đã được tải chưa (xem `download-font.md`)

### Text không hiển thị
- Kiểm tra console log để xem tọa độ đã được vẽ
- Kiểm tra xem font có được load thành công không

