# Hướng dẫn tải Font hỗ trợ tiếng Việt

Để PDF hiển thị đúng tiếng Việt, bạn cần tải font file `.ttf` và đặt vào thư mục `fonts/`.

## Cách 1: Tải Noto Sans (Khuyến nghị)

1. Truy cập: https://fonts.google.com/noto/specimen/Noto+Sans
2. Click "Download family"
3. Giải nén file
4. Copy file `NotoSans-Regular.ttf` vào thư mục `DATN_BACKEND/fonts/`

## Cách 2: Sử dụng font có sẵn trên Windows

Nếu bạn đang dùng Windows, hệ thống sẽ tự động tìm font trong `C:\Windows\Fonts\`:
- `arial.ttf` - Arial
- `times.ttf` - Times New Roman

## Cách 3: Tải font khác hỗ trợ tiếng Việt

Các font khác bạn có thể dùng:
- **Roboto**: https://fonts.google.com/specimen/Roboto
- **Open Sans**: https://fonts.google.com/specimen/Open+Sans
- **Inter**: https://fonts.google.com/specimen/Inter

Sau khi tải, copy file `.ttf` vào `DATN_BACKEND/fonts/` với tên:
- `NotoSans-Regular.ttf`
- `NotoSans-Vietnamese.ttf`
- `Arial.ttf`
- `TimesNewRoman.ttf`

## Kiểm tra

Sau khi đặt font vào thư mục `fonts/`, restart server và test lại. Log sẽ hiển thị:
```
✅ [Font] Loaded custom font: NotoSans-Regular.ttf
```

Nếu không có font, hệ thống sẽ fallback về Times-Roman và bỏ dấu tiếng Việt.

