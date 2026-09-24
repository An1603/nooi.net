#!/usr/bin/env bash
# Đồng bộ Thư viện ảnh từ vault (~/hermes-notes/dev/nooi-gallery) vào nooi.net/public/gallery
#
# Dùng khi Ngài An cập nhật thư viện ở vault (npm run refresh) và muốn nooi.net
# phục vụ bản mới. Ảnh KHÔNG commit vào Git (xem .gitignore) — script này là
# cách duy nhất đưa ảnh lên production.
#
# Cách dùng:
#   bash scripts/sync-gallery.sh          # đồng bộ (chỉ copy thêm/cập nhật)
#   bash scripts/sync-gallery.sh --delete # đồng bộ + xoá file đã bị bỏ ở nguồn
set -euo pipefail

SRC="${GALLERY_SRC:-$HOME/hermes-notes/dev/nooi-gallery}"
DST="$(cd "$(dirname "$0")/.." && pwd)/public/gallery"

if [ ! -f "$SRC/index.html" ]; then
  echo "✗ Không thấy thư viện nguồn tại: $SRC" >&2
  exit 1
fi

DELETE_FLAG=""
if [ "${1:-}" = "--delete" ]; then DELETE_FLAG="--delete"; fi

mkdir -p "$DST"

EXCLUDES=(
  --exclude '.DS_Store'
  --exclude 'node_modules'
  --exclude '.git'
  --exclude 'scripts/'
  --exclude 'README.md'
  --exclude 'package.json'
  --exclude 'package-lock.json'
  --exclude '*.command'
  --exclude 'data/pins-raw.json'   # dữ liệu thô, chỉ script cần
)

echo "→ Đồng bộ file nhỏ (html/css/js/assets/data)…"
rsync -a --info=stats2 "${EXCLUDES[@]}" --exclude 'images/' $DELETE_FLAG "$SRC/" "$DST/"

echo "→ Đồng bộ ảnh (thumbs + full)…"
rsync -a "${EXCLUDES[@]}" --exclude 'images/' $DELETE_FLAG "$SRC/images/" "$DST/images/"

echo
echo "→ Thêm <base href=\"/gallery/\"> cho bản deploy…"
python3 - "$DST/index.html" <<'PY'
import sys, re
p = sys.argv[1]
html = open(p, encoding='utf-8').read()
if '<base ' not in html:
    html = re.sub(r'(<meta charset="UTF-8" />)',
                  r'\1\n<base href="/gallery/" />',
                  html, count=1)
    open(p, 'w', encoding='utf-8').write(html)
    print("  ✓ đã thêm")
else:
    print("  · đã có, bỏ qua")
PY

echo
echo "✓ Xong. Kiểm tra:"
echo "  ảnh full : $(ls "$DST/images/full" | wc -l) file"
echo "  ảnh thumb: $(ls "$DST/images/thumbs" | wc -l) file"
du -sh "$DST"