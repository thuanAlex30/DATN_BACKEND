#!/bin/bash
# ===========================================
# Script: contribution_percentage.sh
# Mục đích: Tính phần trăm đóng góp của từng contributor trong repo Git
# ===========================================

echo "🔍 Calculating contribution percentage... (please wait)"
echo ""

# Đếm số dòng code hiện tại thuộc về mỗi contributor
git ls-files | while read file; do
  git blame --line-porcelain "$file" 2>/dev/null | grep "^author " | sort | uniq -c
done | awk '
{
  count[$2" "$3]+=$1
}
END {
  for (name in count) total+=count[name];
  printf "%-25s %10s %10s\n", "Contributor", "Lines", "Percent";
  print "---------------------------------------------------------";
  for (name in count)
    printf "%-25s %10d %9.2f%%\n", name, count[name], count[name]/total*100;
}' | sort -k2 -nr
