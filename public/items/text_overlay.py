#!/usr/bin/env python3
"""Add Vietnamese text overlays to NOOI graphic items using Pillow."""

from PIL import Image, ImageDraw, ImageFont
import os

BASE_DIR = "/home/hadmin/nooi.net/public/items"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

def add_text_centered(draw, text, font, fill, y_pos, w, shadow=False):
    """Draw text centered horizontally."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (w - tw) // 2
    if shadow:
        draw.text((x+2, y_pos+2), text, font=font, fill=(0,0,0,80))
    draw.text((x, y_pos), text, font=font, fill=fill)

# ─── 1. POSTER 4 TRỤ CỘT ───────────────────────────────────────
print("=== POSTER 4 TRỤ CỘT ===")
img = Image.open(os.path.join(BASE_DIR, "poster-4-tru-cot-base.png")).convert("RGBA")
w, h = img.size
draw = ImageDraw.Draw(img)

# Semi-transparent overlay for readability
overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# Title
title_font = ImageFont.truetype(FONT_SERIF_BOLD, 40)
add_text_centered(overlay_draw, "BỐN TRỤ CỘT", title_font, (255, 255, 255, 220), 60, w)

# Subtitle
sub_font = ImageFont.truetype(FONT_BOLD, 24)
add_text_centered(overlay_draw, "Four Pillars of Transformation", sub_font, (200, 200, 200, 160), 110, w)

# 4 pillars - large bold text
pillar_font = ImageFont.truetype(FONT_SERIF_BOLD, 72)
pillar_sub = ImageFont.truetype(FONT_REG, 18)
pillars = [
    ("THẤY", "See clearly", 220),
    ("HIỂU", "Understand deeply", 340),
    ("SỐNG", "Live fully", 460),
    ("LAN TỎA", "Radiate widely", 580),
]

colors = [
    (180, 140, 255, 220),  # tím
    (100, 180, 255, 220),  # xanh
    (255, 200, 80, 220),   # vàng
    (255, 160, 80, 220),   # cam
]

for (pillar, sub, y), color in zip(pillars, colors):
    add_text_centered(overlay_draw, pillar, pillar_font, color, y, w, shadow=True)
    add_text_centered(overlay_draw, sub, pillar_sub, (200, 200, 200, 140), y + 75, w)

# Bottom line
line_font = ImageFont.truetype(FONT_BOLD, 16)
add_text_centered(overlay_draw, "NOOI — Hành trình chuyển hóa thân tâm", line_font, (180, 180, 180, 120), h - 50, w)

img = Image.alpha_composite(img, overlay)
img.convert("RGB").save(os.path.join(BASE_DIR, "poster-4-tru-cot.png"), "PNG")
print("  ✓ poster-4-tru-cot.png")

# ─── 2. WALLPAPER NOOI 1 (phone) ──────────────────────────────
print("=== WALLPAPER NOOI 1 ===")
img = Image.open(os.path.join(BASE_DIR, "wallpaper-nooi-1.png")).convert("RGBA")
w, h = img.size
overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# NOOI logo big
logo_font = ImageFont.truetype(FONT_SERIF_BOLD, 120)
add_text_centered(overlay_draw, "NOOI", logo_font, (255, 200, 100, 220), h//2 - 100, w, shadow=True)

# Subtitle
tag_font = ImageFont.truetype(FONT_REG, 24)
add_text_centered(overlay_draw, "Tỉnh thức • Chuyển hóa • An nhiên", tag_font, (200, 200, 200, 160), h//2 + 40, w)

# Bottom dot
dot_font = ImageFont.truetype(FONT_BOLD, 14)
add_text_centered(overlay_draw, "✦", dot_font, (255, 200, 100, 100), h - 100, w)

img = Image.alpha_composite(img, overlay)
img.convert("RGB").save(os.path.join(BASE_DIR, "wallpaper-nooi-1.png"), "PNG")
print("  ✓ wallpaper-nooi-1.png (updated with text)")

# ─── 3. WALLPAPER NOOI 2 (desktop) ────────────────────────────
print("=== WALLPAPER NOOI 2 ===")
img = Image.open(os.path.join(BASE_DIR, "wallpaper-nooi-2.png")).convert("RGBA")
w, h = img.size
overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# Main text
main_font = ImageFont.truetype(FONT_SERIF_BOLD, 80)
add_text_centered(overlay_draw, "Thân khỏe — Tâm minh", main_font, (220, 180, 140, 230), h//2 - 80, w, shadow=True)

# Sub
sub_font2 = ImageFont.truetype(FONT_BOLD, 22)
add_text_centered(overlay_draw, "NOOI - Hành trình chuyển hóa", sub_font2, (180, 160, 140, 140), h//2 + 20, w)

img = Image.alpha_composite(img, overlay)
img.convert("RGB").save(os.path.join(BASE_DIR, "wallpaper-nooi-2.png"), "PNG")
print("  ✓ wallpaper-nooi-2.png (updated with text)")

# ─── 4. JOURNAL TEMPLATE ───────────────────────────────────────
print("=== JOURNAL TEMPLATE ===")
# Create a clean A4-ratio (595x842) journal template from scratch
from PIL import Image as PILImage

jpw, jph = 1240, 1754  # ~A4 at 150dpi
bg_color = (250, 248, 242)  # warm cream
journal = PILImage.new("RGB", (jpw, jph), bg_color)
jdraw = ImageDraw.Draw(journal)

# Borders
margin = 80
jpink = (200, 180, 160)  # soft brown

# Outer border
jdraw.rectangle([margin-10, margin-10, jpw-margin+10, jph-margin+10], outline=jpink, width=2)
# Inner border
jdraw.rectangle([margin, margin, jpw-margin, jph-margin], outline=jpink, width=1)

# Header
header_font = ImageFont.truetype(FONT_SERIF_BOLD, 42)
htext = "NHẬT KÝ THÂN - TÂM - HÀNH"
hb = jdraw.textbbox((0, 0), htext, font=header_font)
jdraw.text(((jpw - (hb[2]-hb[0]))//2, margin + 20), htext, font=header_font, fill=(80, 60, 40))

# Line under header
jdraw.line([margin + 40, margin + 80, jpw - margin - 40, margin + 80], fill=jpink, width=1)

# Date
date_font = ImageFont.truetype(FONT_REG, 18)
date_text = "Ngày: ____ / ____ / ________            Tuần: ____"
jdraw.text((margin + 40, margin + 95), date_text, font=date_font, fill=(140, 120, 100))

# Three columns
col_w = (jpw - 2*margin - 40) // 3
col_y_start = margin + 140
col_h = jph - margin - 160

col_headers = [
    ("THÂN", "Cơ thể khỏe mạnh", (100, 160, 100)),    # green tint
    ("TÂM", "Tâm hồn an nhiên", (160, 120, 180)),     # purple tint
    ("HÀNH", "Hành động tỉnh thức", (180, 140, 100)),  # amber tint
]

col_font = ImageFont.truetype(FONT_SERIF_BOLD, 28)
col_sub_font = ImageFont.truetype(FONT_REG, 14)

for i, (title, subtitle, accent) in enumerate(col_headers):
    cx = margin + 10 + i * (col_w + 20)
    
    # Column box
    jdraw.rectangle([cx, col_y_start, cx + col_w, col_y_start + col_h], outline=jpink, width=1, fill=(248, 246, 240))
    
    # Column header
    jdraw.text((cx + 10, col_y_start + 10), title, font=col_font, fill=accent)
    jdraw.text((cx + 10, col_y_start + 42), subtitle, font=col_sub_font, fill=(160, 150, 140))
    
    # Divider
    jdraw.line([cx + 10, col_y_start + 65, cx + col_w - 10, col_y_start + 65], fill=jpink, width=1)
    
    # Journaling lines (12 lines per column)
    line_h = 32
    prompt_font = ImageFont.truetype(FONT_REG, 13)
    prompts = {
        0: ["Cảm nhận cơ thể:", "Năng lượng hôm nay:", "Vận động:", "Giấc ngủ:", "Dinh dưỡng:"],
        1: ["Cảm xúc chính:", "Điều biết ơn:", "Suy ngẫm:", "Tĩnh lặng:", "Bài học:"],
        2: ["Việc đã làm:", "Việc đang làm:", "Việc sẽ làm:", "Tác động:", "Cam kết:"],
    }
    
    for j in range(12):
        ly = col_y_start + 75 + j * line_h
        
        if j < len(prompts[i]):
            jdraw.text((cx + 12, ly), prompts[i][j], font=prompt_font, fill=(160, 140, 130))
        else:
            # Just a line
            pass
        
        # Line for writing
        jdraw.line([cx + 10, ly + 20, cx + col_w - 10, ly + 20], fill=(220, 215, 205), width=1)

# Footer
footer_font = ImageFont.truetype(FONT_REG, 12)
jdraw.text((margin + 40, jph - margin - 25), "NOOI — thiennooi.com", font=footer_font, fill=(180, 170, 160))

journal.save(os.path.join(BASE_DIR, "journal-template.png"), "PNG")
# Also save as PDF
journal.convert("RGB").save(os.path.join(BASE_DIR, "journal-template.pdf"), "PDF", resolution=150.0)
print("  ✓ journal-template.png")
print("  ✓ journal-template.pdf")

# ─── DONE ──────────────────────────────────────────────────────
print("\n=== ALL DONE ===")
print("\nFiles created:")
for f in sorted(os.listdir(BASE_DIR)):
    if f.endswith((".png", ".pdf")) and f != "text_overlay.py" and "base" not in f:
        size = os.path.getsize(os.path.join(BASE_DIR, f))
        print(f"  {f:45s} {size//1024:>4d} KB")

