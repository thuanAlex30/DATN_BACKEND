# Hướng dẫn sử dụng PDF Grid để xác định tọa độ

## 📄 Cách mở PDF Grid

### Cách 1: Mở trực tiếp từ file system (Khuyến nghị)

1. **Tìm file grid PDF**:
   - Đường dẫn: `DATN_BACKEND/uploads/contracts/grid-reference-*.pdf`
   - File mới nhất sẽ có timestamp lớn nhất

2. **Mở bằng PDF viewer**:
   - **Windows**: Double-click file → Mở bằng Adobe Reader, Edge, hoặc PDF viewer mặc định
   - **Mac**: Double-click file → Mở bằng Preview (mặc định)
   - **Linux**: Double-click hoặc dùng `evince`, `okular`, hoặc `xpdf`

3. **Hoặc mở từ terminal**:
   ```powershell
   # Windows PowerShell
   cd DATN_BACKEND\uploads\contracts
   Get-ChildItem grid-reference-*.pdf | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Start-Process $_.FullName }
   ```

   ```bash
   # Linux/Mac
   cd DATN_BACKEND/uploads/contracts
   open grid-reference-*.pdf  # Mac
   # hoặc
   evince grid-reference-*.pdf  # Linux
   ```

### Cách 2: Mở qua Browser

1. **Tìm URL của grid PDF**:
   - Chạy script: `node generate-grid-pdf.js`
   - Copy URL từ output (ví dụ: `http://localhost:3000/uploads/contracts/grid-reference-*.pdf`)

2. **Mở trong browser**:
   - Paste URL vào address bar
   - Hoặc click vào link nếu có
   - Browser sẽ mở PDF viewer tích hợp

3. **Hoặc mở trực tiếp**:
   ```
   http://localhost:3000/uploads/contracts/grid-reference-[timestamp].pdf
   ```

### Cách 3: Mở từ code (tự động)

Thêm vào script `generate-grid-pdf.js` để tự động mở:

```javascript
// Thêm vào cuối file generate-grid-pdf.js
const { exec } = require('child_process');
const os = require('os');

// Tự động mở PDF sau khi tạo
const platform = os.platform();
if (platform === 'win32') {
  exec(`start "" "${filePath}"`);
} else if (platform === 'darwin') {
  exec(`open "${filePath}"`);
} else {
  exec(`xdg-open "${filePath}"`);
}
```

## 🎯 Cách sử dụng Grid để xác định tọa độ

### Bước 1: Mở cả Grid và Template PDF

**Option A: Side-by-side (Khuyến nghị)**
1. Mở Grid PDF trong một cửa sổ
2. Mở Template PDF (`CHMS_HopDongThanhToan.pdf`) trong cửa sổ khác
3. Đặt 2 cửa sổ cạnh nhau để so sánh

**Option B: Overlay (Nếu PDF viewer hỗ trợ)**
1. Mở Grid PDF
2. Import Template PDF như một layer
3. Điều chỉnh opacity để thấy cả 2

**Option C: Print và overlay vật lý**
1. In Grid PDF
2. In Template PDF (cùng kích thước)
3. Đặt template lên grid và dùng đèn để thấy grid bên dưới

### Bước 2: Xác định tọa độ các trường

1. **Tìm vị trí của label** (ví dụ: "Tên Công ty:")
   - Đọc số X (màu xanh) ở dưới cùng
   - Đọc số Y (màu đỏ) ở bên trái
   - Ví dụ: X = 100, Y = 600

2. **Tìm vị trí bắt đầu text** (sau dấu ":")
   - Thường cách label khoảng 10-20px
   - Ví dụ: X = 130, Y = 600

3. **Ghi chú tọa độ**:
   ```
   Tên Công ty:     X = 130, Y = 600
   Email Công ty:   X = 130, Y = 580
   Địa chỉ:         X = 130, Y = 560
   Điện thoại:      X = 130, Y = 540
   Mã số thuế:      X = 130, Y = 520
   Đại diện:        X = 130, Y = 500
   ```

### Bước 3: Chuyển đổi tọa độ

⚠️ **QUAN TRỌNG**: PDF sử dụng hệ tọa độ từ dưới lên!

- **Grid Y**: Từ dưới lên (0 ở dưới, 841.68 ở trên)
- **Code cần**: `y = height - gridY`

Ví dụ:
- Grid cho thấy Y = 600 (từ dưới lên)
- Trong code: `y = 841.68 - 600 = 241.68` (từ trên xuống)
- Hoặc: `baseY = height - 241.68 = 600` ✅

### Bước 4: Cập nhật vào code

Sau khi xác định tọa độ, cập nhật vào `contractService.js`:

```javascript
// Trong generatePreviewPdf
const baseY = 600;  // Từ grid (từ dưới lên)
const textX = 130;  // Từ grid
const lineHeight = 20;  // Khoảng cách giữa các dòng
```

## 🛠️ Tools hỗ trợ

### Adobe Acrobat Reader
- **Overlay**: File → Combine Files → Merge Files
- **Measure**: Tools → Measure → Distance Tool

### PDF-XChange Editor
- **Layers**: View → Layers
- **Measure**: Tools → Measure

### Foxit Reader
- **Layers**: View → Layers
- **Measure**: Tools → Measure

### Online Tools
- **PDF24**: https://tools.pdf24.org/
- **ILovePDF**: https://www.ilovepdf.com/

## 📝 Checklist

- [ ] Đã tạo Grid PDF (`node generate-grid-pdf.js`)
- [ ] Đã mở Grid PDF trong viewer
- [ ] Đã mở Template PDF để so sánh
- [ ] Đã xác định tọa độ của các trường
- [ ] Đã chuyển đổi tọa độ (nếu cần)
- [ ] Đã cập nhật vào `contractService.js`
- [ ] Đã test lại với endpoint debug

## 💡 Tips

1. **Zoom in**: Phóng to để đọc tọa độ chính xác hơn
2. **Snap to grid**: Sử dụng grid 20px để dễ đọc
3. **Ghi chú**: Viết tọa độ ra giấy hoặc file text
4. **Test nhiều lần**: Test với các tọa độ khác nhau để tìm vị trí tốt nhất
5. **Sử dụng debug endpoint**: Test nhanh với `/api/contracts/debug/test-overlay`

## 🔍 Ví dụ thực tế

Giả sử bạn thấy trong Grid:
- "Tên Công ty:" label ở X=100, Y=600
- Text bắt đầu ở X=130, Y=600

Trong code:
```javascript
// Company Name
if (textFields.companyName) {
  firstPage.drawText(textFields.companyName, {
    x: 130,  // Từ grid
    y: 600,  // Từ grid (từ dưới lên)
    size: 11,
    font: font,
  });
}
```

## ❓ Troubleshooting

### Grid không hiển thị số?
- Kiểm tra font có được embed không
- Thử tăng fontSize

### Tọa độ không khớp?
- Nhớ chuyển đổi Y coordinate (từ dưới lên → từ trên xuống)
- Kiểm tra page size có đúng không (595.44 x 841.68)

### Text bị lệch?
- Kiểm tra textX có đúng không
- Kiểm tra baseY có đúng không
- Thử điều chỉnh từng giá trị một

