# Hướng dẫn thêm Placeholder vào Word Template

## Vấn đề
File Word template `CHMS_HopDongThanhToan.docx` chưa có placeholder, nên data không được điền vào.

## Giải pháp
Cần mở file Word và thêm placeholder thủ công.

## Các bước:

1. **Mở file Word template:**
   - Đường dẫn: `DATN_BACKEND/uploads/contracts/CHMS_HopDongThanhToan.docx`
   - Mở bằng Microsoft Word

2. **Tìm các trường cần thêm placeholder:**
   - Tìm phần "BÊN SỬ DỤNG (Sau đây gọi tắt là Bên B)"
   - Trong phần này, tìm các dòng:
     - `Tên Công ty`
     - `Email Công ty :`
     - `Địa chỉ :`
     - `Điện thoại :`
     - `Mã số thuế :`
     - `Đại diện :`

3. **Thêm placeholder sau mỗi trường:**
   - `Tên Công ty` → `Tên Công ty: {{COMPANY_NAME}}`
   - `Email Công ty :` → `Email Công ty: {{COMPANY_EMAIL}}`
   - `Địa chỉ :` → `Địa chỉ: {{COMPANY_ADDRESS}}` (đã có sẵn)
   - `Điện thoại :` → `Điện thoại: {{COMPANY_PHONE}}` (đã có sẵn)
   - `Mã số thuế :` → `Mã số thuế: {{COMPANY_TAX_CODE}}`
   - `Đại diện :` → `Đại diện: {{CONTACT_NAME}}`

4. **Thêm placeholder cho ngày tháng:**
   - Tìm: `Hôm nay, ngày …. tháng ….năm ……`
   - Thay thành: `Hôm nay, ngày {{SIGN_DAY}} tháng {{SIGN_MONTH}} năm {{SIGN_YEAR}}`

5. **Lưu file và thử lại**

## Lưu ý:
- Placeholder phải chính xác: `{{COMPANY_NAME}}` (không có khoảng trắng)
- Có thể copy-paste placeholder từ đây để đảm bảo đúng format
- Sau khi thêm, test lại bằng cách generate preview

