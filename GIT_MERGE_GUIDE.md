# 📚 Hướng dẫn Commit và Merge vào Main

## 🎯 Mục tiêu
Merge các thay đổi từ branch `ThuanDH30` vào branch `main`.

---

## 📋 Các bước thực hiện

### **Bước 1: Kiểm tra trạng thái hiện tại**

```powershell
# Kiểm tra branch hiện tại và các thay đổi
git status

# Xem các file đã thay đổi
git status --short
```

**Kết quả mong đợi:** Bạn sẽ thấy danh sách các file:
- `M` = Modified (đã sửa)
- `D` = Deleted (đã xóa)
- `??` = Untracked (chưa được track)

---

### **Bước 2: Add tất cả thay đổi vào staging**

```powershell
# Add tất cả thay đổi (bao gồm modified, deleted, và new files)
git add -A
```

**Giải thích:**
- `git add -A` = Add tất cả thay đổi (modified, deleted, new files)
- `git add .` = Chỉ add modified và new files (không add deleted)
- `git add -u` = Chỉ add modified và deleted files (không add new files)

**Sau khi add, kiểm tra lại:**
```powershell
git status
```

Bạn sẽ thấy các file chuyển từ màu đỏ sang màu xanh (staged).

---

### **Bước 3: Commit các thay đổi**

```powershell
# Commit với message mô tả rõ ràng
git commit -m "feat: Cải thiện PayOS service với retry logic và error handling"
```

**Các loại commit message phổ biến:**
- `feat:` - Tính năng mới
- `fix:` - Sửa lỗi
- `refactor:` - Refactor code
- `docs:` - Cập nhật tài liệu
- `style:` - Format code
- `chore:` - Công việc bảo trì

**Kiểm tra commit đã tạo:**
```powershell
git log --oneline -1
```

---

### **Bước 4: Push lên remote branch ThuanDH30**

```powershell
# Push commit lên remote branch ThuanDH30
git push origin ThuanDH30
```

**Nếu push bị reject:**
```powershell
# Pull trước rồi push lại
git pull origin ThuanDH30
git push origin ThuanDH30
```

---

### **Bước 5: Chuyển sang branch main**

```powershell
# Chuyển sang branch main
git checkout main

# Hoặc dùng lệnh mới hơn
git switch main
```

**Kiểm tra branch hiện tại:**
```powershell
git branch
```

Bạn sẽ thấy `*` ở trước branch đang active.

---

### **Bước 6: Pull latest changes từ remote main**

```powershell
# Pull latest changes từ remote main
git pull origin main
```

**Nếu có conflict hoặc local changes:**
```powershell
# Option 1: Stash local changes
git stash
git pull origin main
git stash pop

# Option 2: Pull với rebase
git pull --rebase origin main
```

---

### **Bước 7: Merge ThuanDH30 vào main**

```powershell
# Merge branch ThuanDH30 vào main
git merge ThuanDH30
```

**Kết quả có thể:**
- ✅ **Fast-forward merge:** Thành công, không có conflict
- ⚠️ **Merge commit:** Tạo merge commit, có thể có conflict
- ❌ **Conflict:** Cần giải quyết conflict

---

### **Bước 8: Giải quyết conflict (nếu có)**

**Nếu có conflict, Git sẽ báo:**
```
Auto-merging <file>
CONFLICT (content): Merge conflict in <file>
```

**Các bước giải quyết:**

1. **Mở file conflict:**
   - Tìm các dòng có `<<<<<<<`, `=======`, `>>>>>>>`
   - Chọn code muốn giữ lại
   - Xóa các marker conflict

2. **Sau khi giải quyết conflict:**
```powershell
# Add file đã giải quyết conflict
git add <file>

# Hoặc add tất cả
git add .

# Commit merge
git commit -m "Merge ThuanDH30 into main"
```

---

### **Bước 9: Push main lên remote**

```powershell
# Push main lên remote
git push origin main
```

**Nếu push bị reject:**
```powershell
# Pull với rebase trước
git pull --rebase origin main
git push origin main

# Hoặc force push (CẨN THẬN - chỉ dùng khi chắc chắn)
git push --force-with-lease origin main
```

---

## 🔄 Workflow đầy đủ (Copy-paste từng bước)

```powershell
# ============================================
# BƯỚC 1: Kiểm tra trạng thái
# ============================================
git status

# ============================================
# BƯỚC 2: Add thay đổi
# ============================================
git add -A

# ============================================
# BƯỚC 3: Commit
# ============================================
git commit -m "feat: Cải thiện PayOS service với retry logic và error handling"

# ============================================
# BƯỚC 4: Push ThuanDH30
# ============================================
git push origin ThuanDH30

# ============================================
# BƯỚC 5: Chuyển sang main
# ============================================
git checkout main

# ============================================
# BƯỚC 6: Pull latest main
# ============================================
git pull origin main

# ============================================
# BƯỚC 7: Merge ThuanDH30
# ============================================
git merge ThuanDH30

# ============================================
# BƯỚC 8: Giải quyết conflict (nếu có)
# ============================================
# Mở file conflict, sửa, rồi:
# git add .
# git commit -m "Merge ThuanDH30 into main"

# ============================================
# BƯỚC 9: Push main
# ============================================
git push origin main
```

---

## ⚠️ Lưu ý quan trọng

### **1. Trước khi merge:**
- ✅ Đảm bảo code đã test và hoạt động
- ✅ Review các thay đổi: `git diff main..ThuanDH30`
- ✅ Đảm bảo không có uncommitted changes trên main

### **2. Nếu có conflict:**
- ⚠️ Đọc kỹ conflict markers
- ⚠️ Test lại sau khi giải quyết conflict
- ⚠️ Không xóa code quan trọng

### **3. Nếu push bị reject:**
- 🔄 Luôn pull trước khi push
- 🔄 Dùng `--force-with-lease` thay vì `--force` (an toàn hơn)
- 🔄 Kiểm tra xem có người khác đã push lên main không

### **4. Best practices:**
- 📝 Commit message rõ ràng, mô tả đúng thay đổi
- 📝 Commit thường xuyên, không commit quá nhiều thay đổi cùng lúc
- 📝 Test trước khi merge vào main
- 📝 Tạo pull request nếu làm việc nhóm (khuyến nghị)

---

## 🆘 Troubleshooting

### **Lỗi: "Your local changes would be overwritten by merge"**
```powershell
# Stash local changes
git stash
git merge ThuanDH30
git stash pop
```

### **Lỗi: "refusing to merge unrelated histories"**
```powershell
# Merge với flag --allow-unrelated-histories
git merge ThuanDH30 --allow-unrelated-histories
```

### **Lỗi: "Updates were rejected because the remote contains work"**
```powershell
# Pull với rebase
git pull --rebase origin main
git push origin main
```

### **Muốn hủy merge đang diễn ra:**
```powershell
# Hủy merge
git merge --abort
```

---

## 📖 Tài liệu tham khảo

- Git Documentation: https://git-scm.com/doc
- Git Merge Guide: https://git-scm.com/docs/git-merge
- Git Conflict Resolution: https://git-scm.com/docs/git-merge#_how_to_resolve_conflicts

---

**Chúc bạn merge thành công! 🎉**

