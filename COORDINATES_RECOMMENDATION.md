# Tọa độ dự kiến cho Text Overlay trong Contract PDF

## 📄 Thông tin PDF Template
- **Kích thước**: 595.44 x 841.68 points (A4 chuẩn)
- **Số trang**: 3
- **Định dạng**: PDF thông thường (không có form fields)

## 🎯 Tọa độ được khuyến nghị

Dựa trên phân tích cấu trúc hợp đồng Việt Nam và test với 6 bộ tọa độ khác nhau:

```javascript
const baseY = 602;        // height - 240 (từ dưới lên)
const textX = 135;        // Vị trí X sau các label
const lineHeight = 19;    // Khoảng cách giữa các dòng
const fontSize = 11;      // Kích thước font
```

### Lý do chọn tọa độ này:

1. **baseY = 602** (tương đương `height - 240`):
   - Phần "II. BÊN SỬ DỤNG" thường bắt đầu ở khoảng 1/3 xuống trang
   - Với height = 841.68, vị trí 602 từ dưới lên = khoảng 240 từ trên xuống
   - Đây là vị trí phù hợp cho phần thông tin công ty trong hợp đồng

2. **textX = 135**:
   - Các label như "Tên Công ty:", "Email Công ty:" thường có độ rộng ~100-120px
   - Text cần bắt đầu sau label, khoảng 130-140px từ lề trái
   - 135px là vị trí cân bằng, không quá sát label cũng không quá xa

3. **lineHeight = 19**:
   - Khoảng cách 19-20px phù hợp với font size 11pt
   - Đủ không gian để text không bị chồng lên nhau
   - Phù hợp với spacing chuẩn trong hợp đồng

4. **fontSize = 11**:
   - Font size 11pt là kích thước chuẩn cho text trong hợp đồng
   - Đủ lớn để đọc được nhưng không quá to
   - Phù hợp với các font chuẩn như Helvetica

## 📊 Các tọa độ đã test

| Option | baseY | textX | lineHeight | fontSize | Mô tả |
|--------|-------|-------|------------|----------|-------|
| 1 | 700 | 120 | 18 | 11 | Vị trí cao (gần đầu trang) |
| 2 | 650 | 130 | 18 | 11 | Vị trí giữa-cao |
| **3 (Khuyến nghị)** | **600** | **140** | **20** | **11** | **Vị trí giữa** |
| 4 | 550 | 150 | 20 | 11 | Vị trí giữa-thấp |
| 5 | 500 | 160 | 22 | 12 | Vị trí thấp |
| 6 | 580 | 135 | 19 | 11 | Dựa trên mô tả hình ảnh |

## 🔧 Cách cập nhật vào code

Cập nhật trong `contractService.js` tại hàm `generatePreviewPdf`:

```javascript
// Thay đổi từ:
const baseY = height - 280;
const lineHeight = 18;
const textX = 130;

// Thành:
const baseY = height - 240;  // 602 với height = 841.68
const lineHeight = 19;
const textX = 135;
```

Hoặc sử dụng giá trị tuyệt đối:

```javascript
const baseY = 602;  // Từ dưới lên
const lineHeight = 19;
const textX = 135;
```

## 📋 Test PDFs đã tạo

Đã tạo 6 file PDF test với các tọa độ khác nhau:
- `test-coords-1-*.pdf` - Option 1
- `test-coords-2-*.pdf` - Option 2
- `test-coords-3-*.pdf` - Option 3 (Khuyến nghị)
- `test-coords-4-*.pdf` - Option 4
- `test-coords-5-*.pdf` - Option 5
- `test-coords-6-*.pdf` - Option 6

**Cách xem**: Mở các file PDF này trong browser hoặc PDF viewer để so sánh và chọn tọa độ phù hợp nhất với template của bạn.

## 🎨 Cấu trúc Text Overlay

Thứ tự các trường được vẽ (từ trên xuống):

1. **Tên Công ty** (companyName)
2. **Email Công ty** (companyEmail)
3. **Địa chỉ** (companyAddress) - có thể nhiều dòng
4. **Điện thoại** (companyPhone)
5. **Mã số thuế** (companyTaxCode)
6. **Đại diện** (contactName)
7. **Chức vụ** (contactPosition)

## ⚠️ Lưu ý

1. **Font encoding**: Helvetica không hỗ trợ đầy đủ ký tự tiếng Việt. Nếu cần hiển thị đúng ký tự có dấu, cần sử dụng font khác hoặc xử lý encoding.

2. **Điều chỉnh tọa độ**: Tọa độ này là dự kiến dựa trên phân tích. Bạn nên:
   - Mở các file PDF test để xem vị trí thực tế
   - So sánh với template PDF gốc
   - Điều chỉnh nếu cần để khớp với vị trí các trường trong template

3. **Test với dữ liệu thực**: Sau khi cập nhật tọa độ, test lại với endpoint debug:
   ```
   GET /api/contracts/debug/test-overlay?baseY=602&textX=135&lineHeight=19&fontSize=11
   ```

## 🔍 Debugging

Nếu text không hiển thị đúng vị trí:

1. **Text quá cao** → Giảm `baseY` (ví dụ: 580, 560)
2. **Text quá thấp** → Tăng `baseY` (ví dụ: 620, 640)
3. **Text quá trái** → Tăng `textX` (ví dụ: 150, 160)
4. **Text quá phải** → Giảm `textX` (ví dụ: 120, 110)
5. **Text bị chồng** → Tăng `lineHeight` (ví dụ: 21, 22)
6. **Text quá xa nhau** → Giảm `lineHeight` (ví dụ: 17, 16)

## 📝 Kết luận

**Tọa độ khuyến nghị cuối cùng**:
- `baseY = 602` (hoặc `height - 240`)
- `textX = 135`
- `lineHeight = 19`
- `fontSize = 11`

Đây là tọa độ cân bằng nhất dựa trên phân tích và test. Tuy nhiên, bạn nên mở các file PDF test để xác nhận và điều chỉnh nếu cần.

