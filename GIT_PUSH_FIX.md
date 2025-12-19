# 🔧 Hướng dẫn xử lý lỗi Push bị Reject

## ❌ Lỗi hiện tại:
```
! [rejected]            ThuanDH30 -> ThuanDH30 (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally.
```

## 📋 Nguyên nhân:
Remote branch `ThuanDH30` có các commit mà local branch không có. Cần pull trước khi push.

---

## ✅ Giải pháp (Chọn 1 trong 2 cách):

### **Cách 1: Pull với Merge (Khuyến nghị)**

```powershell
# 1. Pull latest changes từ remote
git pull origin ThuanDH30

# 2. Nếu có conflict, giải quyết conflict rồi:
# git add .
# git commit -m "Merge remote changes"

# 3. Push lại
git push origin ThuanDH30
```

### **Cách 2: Pull với Rebase (Giữ lịch sử sạch hơn)**

```powershell
# 1. Pull với rebase
git pull --rebase origin ThuanDH30

# 2. Nếu có conflict, giải quyết conflict rồi:
# git add .
# git rebase --continue

# 3. Push lại
git push origin ThuanDH30
```

---

## 🔄 Workflow đầy đủ:

```powershell
# ============================================
# BƯỚC 1: Pull latest changes
# ============================================
git pull origin ThuanDH30

# ============================================
# BƯỚC 2: Kiểm tra status
# ============================================
git status

# ============================================
# BƯỚC 3: Nếu có conflict, giải quyết
# ============================================
# Mở file conflict, sửa, rồi:
# git add .
# git commit -m "Resolve merge conflicts"

# ============================================
# BƯỚC 4: Push lại
# ============================================
git push origin ThuanDH30
```

---

## ⚠️ Lưu ý:

### **Nếu dùng rebase và có conflict:**
```powershell
# Sau khi giải quyết conflict:
git add .
git rebase --continue

# Nếu muốn hủy rebase:
git rebase --abort
```

### **Nếu muốn xem sự khác biệt:**
```powershell
# Xem commits trên remote mà local không có
git fetch origin ThuanDH30
git log HEAD..origin/ThuanDH30

# Xem commits trên local mà remote không có
git log origin/ThuanDH30..HEAD
```

### **Nếu chắc chắn muốn ghi đè remote (CẨN THẬN):**
```powershell
# Chỉ dùng khi chắc chắn muốn ghi đè remote
git push --force-with-lease origin ThuanDH30
```

**⚠️ CẢNH BÁO:** `--force-with-lease` sẽ ghi đè remote. Chỉ dùng khi:
- Bạn chắc chắn muốn ghi đè
- Không có người khác đang làm việc trên branch này
- Đã backup code quan trọng

---

## 🎯 Khuyến nghị:

**Dùng Cách 1 (Pull với Merge)** nếu:
- Làm việc nhóm
- Không chắc về rebase
- Muốn giữ nguyên lịch sử

**Dùng Cách 2 (Pull với Rebase)** nếu:
- Muốn lịch sử commit sạch hơn
- Đã quen với rebase
- Làm việc một mình trên branch

---

## 📖 Tài liệu tham khảo:

- Git Pull: https://git-scm.com/docs/git-pull
- Git Rebase: https://git-scm.com/docs/git-rebase
- Force Push: https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-lease

---

**Chúc bạn push thành công! 🎉**

