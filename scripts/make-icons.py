"""Render Moi's app/home-screen icons from the Figma lockup geometry (Logo/Moi lockup, 40:400).

Run from the repo root:  python3 scripts/make-icons.py
Writes assets/icon.png (1024, full-bleed; iOS rounds the corners) and the web icons in public/.
"""
import glob, math
from PIL import Image, ImageDraw, ImageFont

FONT = glob.glob('node_modules/@expo-google-fonts/young-serif/**/*.ttf', recursive=True)[0]
CROWN = Image.open('assets/crown.png').convert('RGBA')
INK = (247, 241, 230, 255)            # cream wordmark
TOP, BOTTOM = (166, 180, 171), (100, 118, 114)  # sage gradient, top-left → bottom-right

# Figma lockup, 64px master: letter x positions, text box top, crown rect + CCW rotation about its top-left.
LETTERS = [('M', -1.9), ('o', 63.8), ('i', 99.5)]
TEXT_TOP, LINE_H = -3.7, 90
CROWN_X, CROWN_Y, CROWN_W, CROWN_H, CROWN_ROT = 53.8, 14.6, 32.2, 34, 27


def background(n):
    img = Image.new('RGB', (n, n))
    px = img.load()
    for y in range(n):
        for x in range(n):
            t = (x + y) / (2 * (n - 1))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
    return img.convert('RGBA')


def lockup(k):
    """The wordmark at scale k (k=1 → 64px master), on a transparent canvas with its true bounds."""
    pad = round(20 * k)
    w, h = round(123 * k) + 2 * pad, round(70 * k) + 2 * pad
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    font = ImageFont.truetype(FONT, round(64 * k))
    ascent, descent = font.getmetrics()
    # Figma centres the font's content area in the line box; PIL draws from the ascent top.
    y0 = pad + (TEXT_TOP + (LINE_H - (ascent + descent) / k) / 2) * k
    d = ImageDraw.Draw(layer)
    for ch, x in LETTERS:
        d.text((pad + x * k, y0), ch, font=font, fill=INK)
    c = CROWN.resize((round(CROWN_W * k), round(CROWN_H * k)), Image.LANCZOS)
    r = math.radians(CROWN_ROT)
    cx = CROWN_X + math.cos(r) * CROWN_W / 2 + math.sin(r) * CROWN_H / 2
    cy = CROWN_Y - math.sin(r) * CROWN_W / 2 + math.cos(r) * CROWN_H / 2
    c = c.rotate(CROWN_ROT, expand=True, resample=Image.BICUBIC)   # PIL: positive = counter-clockwise
    layer.alpha_composite(c, (round(pad + cx * k - c.width / 2), round(pad + cy * k - c.height / 2)))
    return layer.crop(layer.getbbox())


def icon(n, fill):
    """fill = share of the icon width the wordmark spans (smaller for maskable safe zones)."""
    bg = background(n)
    mark = lockup(n * fill / 123)
    bg.alpha_composite(mark, ((n - mark.width) // 2, (n - mark.height) // 2))
    return bg


icon(1024, 0.62).convert('RGB').save('assets/icon.png')
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (48, 'favicon.png')]:
    icon(1024, 0.62).resize((size, size), Image.LANCZOS).convert('RGB').save(f'public/{name}')
icon(1024, 0.5).resize((512, 512), Image.LANCZOS).convert('RGB').save('public/icon-maskable-512.png')
print('icons written')
