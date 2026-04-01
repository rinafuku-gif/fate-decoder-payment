#!/usr/bin/env python3
"""
星の図書館 OGP画像生成スクリプト
1200x630px — ダーク背景 + ゴールドアクセント + キャラ配置

レイヤー順序:
1. ダーク背景 + 星空 + 本棚シルエット
2. キャラクター（左右）
3. 中央暗幕（テキスト可読性）
4. テキスト（タイトル + サブコピー + フッター）
5. 装飾（ゴールドライン、ビネット）
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance
import random
import os

# ━━━ Config ━━━
W, H = 1200, 630
BG = (12, 10, 8)
GOLD = (201, 169, 110)
GOLD_LIGHT = (232, 213, 168)
GOLD_WARM = (184, 154, 90)
WHITE = (255, 255, 255)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(BASE_DIR, "public")
OUTPUT = os.path.join(PUBLIC, "og-image.png")
FONT_MINCHO = "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"

# ━━━ Layer 1: Background ━━━
img = Image.new("RGBA", (W, H), BG + (255,))

# Radial warm glow from center
glow_bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gbd = ImageDraw.Draw(glow_bg)
cx, cy = W // 2, int(H * 0.42)
for r in range(600, 0, -3):
    alpha = int(max(0, min(25, (600 - r) / 600 * 25)))
    gbd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(GOLD[0], GOLD[1], GOLD[2], alpha))
img = Image.alpha_composite(img, glow_bg)

# Stars
stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(stars)
random.seed(42)
for _ in range(150):
    x, y = random.randint(0, W), random.randint(0, H)
    s = random.choice([1, 1, 1, 2])
    a = random.randint(25, 90)
    sd.ellipse([x, y, x + s, y + s], fill=(255, 255, 255, a))
for _ in range(20):
    x, y = random.randint(0, W), random.randint(0, H)
    a = random.randint(60, 130)
    sd.ellipse([x - 1, y - 1, x + 2, y + 2], fill=(GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2], a))
img = Image.alpha_composite(img, stars)

# Bookshelf silhouette at bottom
shelf = Image.new("RGBA", (W, H), (0, 0, 0, 0))
shd = ImageDraw.Draw(shelf)
random.seed(7)
for i in range(80):
    bx = random.randint(0, W)
    bw = random.randint(6, 16)
    bh = random.randint(40, 90)
    by = H - bh - random.randint(0, 15)
    a = random.randint(8, 22)
    shd.rectangle([bx, by, bx + bw, H], fill=(GOLD[0], GOLD[1], GOLD[2], a))
# Bottom edge darkening
for y in range(H - 100, H):
    a = int((y - (H - 100)) / 100 * 40)
    shd.line([(0, y), (W, y)], fill=(BG[0], BG[1], BG[2], a))
img = Image.alpha_composite(img, shelf)


# ━━━ Layer 2: Characters ━━━
def place_character(canvas, path, position, size, alpha_mult=1.0, fade_inner=150):
    """Place character with smooth edge fades"""
    char = Image.open(path).convert("RGBA")
    target_w, target_h = size

    # Resize to fill
    ratio = char.width / char.height
    if ratio > target_w / target_h:
        new_h = target_h
        new_w = int(new_h * ratio)
    else:
        new_w = target_w
        new_h = int(new_w / ratio)
    char = char.resize((new_w, new_h), Image.LANCZOS)

    # Crop from center
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    char = char.crop((left, top, left + target_w, top + target_h))

    # Vertical fade mask
    v_mask = Image.new("L", (target_w, target_h), 0)
    vd = ImageDraw.Draw(v_mask)
    fade_top, fade_bot = 50, 100
    for y in range(target_h):
        if y < fade_top:
            a = int(y / fade_top * 240 * alpha_mult)
        elif y > target_h - fade_bot:
            a = int((target_h - y) / fade_bot * 240 * alpha_mult)
        else:
            a = int(240 * alpha_mult)
        vd.line([(0, y), (target_w, y)], fill=a)

    # Horizontal fade toward center
    h_mask = Image.new("L", (target_w, target_h), 0)
    hd = ImageDraw.Draw(h_mask)
    is_left = position[0] < W // 2
    for x in range(target_w):
        if is_left:
            a = int(max(0, min(255, (target_w - x) / fade_inner * 255))) if x > target_w - fade_inner else 255
        else:
            a = int(max(0, min(255, x / fade_inner * 255))) if x < fade_inner else 255
        hd.line([(x, 0), (x, target_h)], fill=a)

    final_mask = ImageChops.multiply(v_mask, h_mask)
    r, g, b, a = char.split()
    a = ImageChops.multiply(a, final_mask)
    char = Image.merge("RGBA", (r, g, b, a))

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(char, position, char)
    return Image.alpha_composite(canvas, layer)


# Use full-body images
urara_path = os.path.join(PUBLIC, "urara-full.png")
reki_path = os.path.join(PUBLIC, "reki-full.png")
if not os.path.exists(urara_path):
    urara_path = os.path.join(PUBLIC, "urara.png")
    reki_path = os.path.join(PUBLIC, "reki.png")

char_w, char_h = 400, 500
img = place_character(img, urara_path, (-20, 80), (char_w, char_h), alpha_mult=0.9, fade_inner=160)
img = place_character(img, reki_path, (W - char_w + 20, 80), (char_w, char_h), alpha_mult=0.9, fade_inner=160)


# ━━━ Layer 3: Center darkening for text ━━━
band = Image.new("RGBA", (560, 360), BG + (200,))
band = band.filter(ImageFilter.GaussianBlur(radius=80))
band_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
band_layer.paste(band, (320, 90), band)
img = Image.alpha_composite(img, band_layer)


# ━━━ Layer 4: Text ━━━
text_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(text_layer)

title_font = ImageFont.truetype(FONT_MINCHO, 80)
sub_font = ImageFont.truetype(FONT_MINCHO, 24)
small_font = ImageFont.truetype(FONT_MINCHO, 13)
tiny_font = ImageFont.truetype(FONT_MINCHO, 15)

# --- Title glow ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gld = ImageDraw.Draw(glow)
title = "星の図書館"
bbox = gld.textbbox((0, 0), title, font=title_font)
tw = bbox[2] - bbox[0]
tx = (W - tw) // 2
ty = 170

# Double glow: wide soft + tight bright
gld.text((tx, ty), title, fill=GOLD + (70,), font=title_font)
glow_wide = glow.filter(ImageFilter.GaussianBlur(radius=30))
img = Image.alpha_composite(img, glow_wide)

glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gld2 = ImageDraw.Draw(glow2)
gld2.text((tx, ty), title, fill=GOLD + (120,), font=title_font)
glow_tight = glow2.filter(ImageFilter.GaussianBlur(radius=8))
img = Image.alpha_composite(img, glow_tight)

# Title text — bright gold
td.text((tx, ty), title, fill=GOLD_LIGHT + (255,), font=title_font)

# --- Subtitle ---
sub = "2人の司書が、あなたの星を読み解く"
bbox_s = td.textbbox((0, 0), sub, font=sub_font)
sw = bbox_s[2] - bbox_s[0]
sx = (W - sw) // 2
sy = ty + 110
td.text((sx, sy), sub, fill=WHITE + (150,), font=sub_font)

# --- Decorative gold line under subtitle ---
line_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
lld = ImageDraw.Draw(line_layer)
line_y = sy + 48
for x in range(W // 2 - 100, W // 2 + 100):
    dist = abs(x - W // 2) / 100
    a = int(max(0, (1 - dist ** 0.7) * 80))
    lld.point((x, line_y), fill=(GOLD[0], GOLD[1], GOLD[2], a))
    lld.point((x, line_y + 1), fill=(GOLD[0], GOLD[1], GOLD[2], a // 2))
text_layer = Image.alpha_composite(text_layer, line_layer)

# --- "無料で診断してみる" CTA hint ---
cta = "無料であなたの星を診断"
bbox_cta = td.textbbox((0, 0), cta, font=tiny_font)
ctaw = bbox_cta[2] - bbox_cta[0]
td.text(((W - ctaw) // 2, line_y + 18), cta, fill=GOLD + (80,), font=tiny_font)

# --- Bottom: credit + hashtags ---
hash_text = "#星の図書館   #うらら担   #れき担"
bbox_h = td.textbbox((0, 0), hash_text, font=small_font)
hw = bbox_h[2] - bbox_h[0]
td.text(((W - hw) // 2, H - 68), hash_text, fill=WHITE + (35,), font=small_font)

credit = "Produced by SATOYAMA AI BASE"
bbox_c = td.textbbox((0, 0), credit, font=small_font)
cw = bbox_c[2] - bbox_c[0]
td.text(((W - cw) // 2, H - 42), credit, fill=WHITE + (30,), font=small_font)

img = Image.alpha_composite(img, text_layer)


# ━━━ Layer 5: Decorations ━━━
deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dd = ImageDraw.Draw(deco)

# Gold horizontal lines (top & bottom frame)
for x in range(250, 950):
    dist = abs(x - 600) / 350
    a = int(max(0, (1 - dist) * 45))
    dd.point((x, 50), fill=(GOLD[0], GOLD[1], GOLD[2], a))
    dd.point((x, H - 50), fill=(GOLD[0], GOLD[1], GOLD[2], a))

# Decorative stars
star_f = ImageFont.truetype(FONT_MINCHO, 14)
for sx, sy, sa in [(350, 155, 50), (840, 155, 50), (420, 390, 35), (770, 390, 35), (300, 310, 25), (890, 310, 25)]:
    dd.text((sx, sy), "✦", fill=GOLD + (sa,), font=star_f)

img = Image.alpha_composite(img, deco)

# Vignette
vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
vd = ImageDraw.Draw(vignette)
for i in range(180):
    a = int(max(0, (180 - i) * 0.45))
    vd.rectangle([i, i, W - i, H - i], outline=(0, 0, 0, a))
img = Image.alpha_composite(img, vignette)


# ━━━ Save ━━━
final = img.convert("RGB")
final.save(OUTPUT, "PNG", optimize=True)
print(f"OGP image saved: {OUTPUT}")
print(f"Size: {final.size}")
