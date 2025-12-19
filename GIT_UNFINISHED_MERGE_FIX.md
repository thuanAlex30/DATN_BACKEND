# 🔧 Hướng dẫn xử lý lỗi "Unfinished Merge"

## ❌ Lỗi hiện tại:
```
fatal: Exiting because of unfinished merge.
error: You have not concluded your merge (MERGE_HEAD exists)
hint: Please, commit your changes before merging.
```

## 📋 Nguyên nhân:
Có một merge đang diễn ra nhưng chưa hoàn thành. Git không cho phép thực hiện thao tác khác cho đến khi merge được hoàn thành hoặc hủy.

---

## ✅ Giải pháp (Chọn 1 trong 3 cách):

### **Cách 1: Hoàn thành merge (Nếu muốn giữ merge)**

```powershell
# 1. Kiểm tra trạng thái
git status

# 2. Nếu có conflict, giải quyết conflict:
# - Mở file conflict
# - Sửa code
# - Add file đã sửa

# 3. Add tất cả thay đổi
git add .

# 4. Commit để hoàn thành merge
git commit -m "Merge remote changes into ThuanDH30"

# 5. Sau đó mới pull được
git pull origin ThuanDH30
```

### **Cách 2: Hủy merge (Nếu không muốn merge)**

```powershell
# Hủy merge đang diễn ra
git merge --abort

# Sau đó pull lại
git pull origin ThuanDH30
```

### **Cách 3: Reset về trạng thái trước merge (Cẩn thận - mất thay đổi)**

```powershell
# Reset về commit trước merge (CẨN THẬN - sẽ mất thay đổi)
git reset --hard HEAD

# Sau đó pull lại
git pull origin ThuanDH30
```

---

## 🔍 Kiểm tra trạng thái hiện tại:

```powershell
# Xem trạng thái chi tiết
git status

# Xem các file conflict (nếu có)
git diff --name-only --diff-filter=U

# Xem log để hiểu merge đang merge cái gì
git log --oneline --graph -10
```

---

## 🔄 Workflow khuyến nghị:

### **Bước 1: Kiểm tra trạng thái**
```powershell
git status
```

**Kết quả có thể:**
- `All conflicts fixed but you are still merging` → Cần commit
- `Unmerged paths:` → Có conflict cần giải quyết
- `Changes to be committed:` → Đã sẵn sàng commit

### **Bước 2: Xử lý theo trạng thái**

#### **Nếu có conflict:**
```powershell
# 1. Xem file conflict
git status

# 2. Mở file conflict, tìm các dòng:
#    <<<<<<< HEAD
#    (code của bạn)
#    =======
#    (code từ remote)
#    >>>>>>> branch-name

# 3. Sửa code, giữ lại phần muốn giữ, xóa markers

# 4. Add file đã sửa
git add <file>

# 5. Commit
git commit -m "Resolve merge conflicts"
```

#### **Nếu không có conflict (chỉ cần commit):**
```powershell
# Add và commit
git add .
git commit -m "Merge remote changes"
```

### **Bước 3: Pull lại**
```powershell
git pull origin ThuanDH30
```

### **Bước 4: Push**
```powershell
git push origin ThuanDH30
```

---

## ⚠️ Lưu ý quan trọng:

### **1. Trước khi hủy merge:**
- ⚠️ `git merge --abort` sẽ hủy merge và quay về trạng thái trước merge
- ⚠️ Các thay đổi chưa commit sẽ bị mất
- ✅ An toàn nếu chưa có thay đổi quan trọng

### **2. Trước khi reset hard:**
- ⚠️ `git reset --hard` sẽ xóa TẤT CẢ thay đổi chưa commit
- ⚠️ Không thể khôi phục sau khi reset hard
- ✅ Chỉ dùng khi chắc chắn muốn bỏ tất cả thay đổi

### **3. Khi có conflict:**
- ✅ Luôn đọc kỹ conflict markers
- ✅ Test lại code sau khi giải quyết conflict
- ✅ Commit ngay sau khi giải quyết xong

---

## 🎯 Khuyến nghị:

**Nếu không chắc chắn:**
1. ✅ Dùng `git status` để xem trạng thái
2. ✅ Nếu có conflict, giải quyết conflict
3. ✅ Commit để hoàn thành merge
4. ✅ Sau đó pull và push

**Nếu muốn bỏ merge:**
1. ✅ Dùng `git merge --abort` (an toàn hơn)
2. ✅ Sau đó pull lại

**Nếu muốn bỏ tất cả thay đổi:**
1. ⚠️ Dùng `git reset --hard HEAD` (CẨN THẬN)
2. ✅ Sau đó pull lại

---

## 📖 Tài liệu tham khảo:

- Git Merge: https://git-scm.com/docs/git-merge
- Git Merge Abort: https://git-scm.com/docs/git-merge#Documentation/git-merge.txt---abort
- Git Reset: https://git-scm.com/docs/git-reset

---

## 🆘 Quick Fix (Copy-paste):

```powershell
# Kiểm tra trạng thái
git status

# Nếu muốn hủy merge (an toàn)
git merge --abort

# Pull lại
git pull origin ThuanDH30

# Push
git push origin ThuanDH30
```

---

**Chúc bạn giải quyết thành công! 🎉**

