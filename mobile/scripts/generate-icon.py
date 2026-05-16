"""
Generate WHERE·io app icons (Wordmark W·io — Icon E design).

Produces:
  assets/icon.png          1024×1024  iOS + general
  assets/adaptive-icon.png 1024×1024  Android foreground (transparent bg)
  assets/favicon.png         48×48   Web
"""

from PIL import Image, ImageDraw, ImageFont
import math, os, sys

# ── Paths ────────────────────────────────────────────────────────────────────
BASE   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS  = os.path.join(BASE, "node_modules")
FONT_W = os.path.join(FONTS, "@expo-google-fonts/space-grotesk/SpaceGrotesk_700Bold.ttf")
FONT_M = os.path.join(FONTS, "@expo-google-fonts/jetbrains-mono/JetBrainsMono_500Medium.ttf")
OUT    = os.path.join(BASE, "assets")

# ── Design tokens (from tokens.js) ──────────────────────────────────────────
BG      = (10, 16, 40)       # #0A1028
INK     = (242, 244, 255)    # #F2F4FF  — "W"
INK3    = (110, 118, 153)    # #6E7699  — "·io"
CORAL   = (255, 107, 94)     # #FF6B5E  — dot

# ── Draw one icon at target size ─────────────────────────────────────────────
def draw_icon(size: int, transparent_bg: bool = False) -> Image.Image:
    scale = size / 180          # design is in 180×180 viewBox

    # canvas
    mode = "RGBA" if transparent_bg else "RGB"
    img  = Image.new(mode, (size, size), (0, 0, 0, 0) if transparent_bg else BG)
    d    = ImageDraw.Draw(img)

    if not transparent_bg:
        d.rectangle([0, 0, size, size], fill=BG)

    # ── "W" ──────────────────────────────────────────────────────────────────
    # Original: x=90 (center), y=118 (baseline), fontSize=92, letterSpacing=-6
    w_size   = max(1, int(92 * scale))
    font_w   = ImageFont.truetype(FONT_W, w_size)
    letter   = "W"

    # measure bounding box so we can centre it properly
    bbox = d.textbbox((0, 0), letter, font=font_w)
    w_tw = bbox[2] - bbox[0]
    w_th = bbox[3] - bbox[1]

    # SVG y=118 is the text baseline; convert to top-left for Pillow
    # baseline ≈ top + ascent  — approximate: ascent ~80% of fontSize
    ascent_approx = w_size * 0.80
    baseline_y    = 118 * scale
    top_y         = baseline_y - ascent_approx - bbox[1]
    left_x        = size / 2 - w_tw / 2 - bbox[0]

    d.text((left_x, top_y), letter, font=font_w, fill=INK)

    # ── Coral dot ────────────────────────────────────────────────────────────
    # Original: cx=138, cy=108, r=6
    dot_cx = 138 * scale
    dot_cy = 108 * scale
    dot_r  = max(1, 6 * scale)
    d.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=CORAL,
    )

    # ── "·io" ─────────────────────────────────────────────────────────────────
    # Original: x=90 (center), y=148, fontSize=14, letterSpacing=6
    io_size  = max(1, int(14 * scale))
    font_m   = ImageFont.truetype(FONT_M, io_size)
    io_text  = "·io"   # ·io

    io_bbox = d.textbbox((0, 0), io_text, font=font_m)
    io_tw   = io_bbox[2] - io_bbox[0]

    io_ascent = io_size * 0.75
    io_base_y = 148 * scale
    io_top    = io_base_y - io_ascent - io_bbox[1]
    io_left   = size / 2 - io_tw / 2 - io_bbox[0]

    d.text((io_left, io_top), io_text, font=font_m, fill=INK3)

    return img


# ── Produce all sizes ────────────────────────────────────────────────────────
os.makedirs(OUT, exist_ok=True)

print("Generating assets/icon.png (1024×1024)…")
draw_icon(1024).save(os.path.join(OUT, "icon.png"))

print("Generating assets/adaptive-icon.png (1024×1024, transparent bg)…")
draw_icon(1024, transparent_bg=True).save(os.path.join(OUT, "adaptive-icon.png"))

print("Generating assets/favicon.png (48×48)…")
draw_icon(48).save(os.path.join(OUT, "favicon.png"))

print("Done.")
