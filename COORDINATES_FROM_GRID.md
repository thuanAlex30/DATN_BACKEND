# Tọa độ từ Grid Overlay - Phân tích

## 📊 Tọa độ chính xác từ Grid Overlay

Dựa trên đo đạc từ grid overlay, các tọa độ chính xác cho các trường trong Section "II. BÊN SỬ DỤNG":

### Tọa độ đã được đo chính xác:

| Trường | X Coordinate | Y Coordinate | Notes |
|--------|--------------|--------------|-------|
| **Tên Công ty** | 110 | 505 | Trường đầu tiên |
| **Email Công ty** | 140 | 485 | +20 từ Tên Công ty |
| **Địa chỉ** | 110 | 465 | +20 từ Email |
| **Điện thoại** | 140 | 445 | +20 từ Địa chỉ |
| **Mã số thuế** | 140 | 425 | +20 từ Điện thoại |
| **Đại diện** | 110 | 405 | +20 từ Mã số thuế |

### Lưu ý:
- **Y coordinates**: Từ dưới lên (0 ở dưới, 841.68 ở trên)
- **X coordinates**: Có 2 giá trị (110 và 140) tùy theo vị trí text trong template
- **Khoảng cách**: Mỗi trường cách nhau 20px (Y giảm 20)

## 🎯 Tọa độ đã cập nhật vào code

```javascript
// Company Name - "Tên Công ty:" - (x ≈ 110, y ≈ 505)
firstPage.drawText(textFields.companyName, { x: 110, y: 505, ... });

// Company Email - "Email Công ty:" - (x ≈ 140, y ≈ 485)
firstPage.drawText(textFields.companyEmail, { x: 140, y: 485, ... });

// Company Address - "Địa chỉ:" - (x ≈ 110, y ≈ 465)
firstPage.drawText(textFields.companyAddress, { x: 110, y: 465, ... });

// Company Phone - "Điện thoại:" - (x ≈ 140, y ≈ 445)
firstPage.drawText(textFields.companyPhone, { x: 140, y: 445, ... });

// Company Tax Code - "Mã số thuế:" - (x ≈ 140, y ≈ 425)
firstPage.drawText(textFields.companyTaxCode, { x: 140, y: 425, ... });

// Contact Person - "Đại diện:" - (x ≈ 110, y ≈ 405)
firstPage.drawText(textFields.contactName, { x: 110, y: 405, ... });
```

## ⚠️ Lưu ý

1. **Y coordinates trong PDF**: Từ dưới lên (0 ở dưới, 841.68 ở trên)
2. **Code sử dụng**: Cũng từ dưới lên, nên có thể dùng trực tiếp
3. **Điều chỉnh**: Có thể cần fine-tune ±5-10px để khớp chính xác

