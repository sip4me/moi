"""Render Moi's app/home-screen icons: a leaning "o" wearing the pink velvet crown, on white.
Placement follows the Figma app-icon reference: the crown is wider than the o, tilted left,
and its band wraps the top third of the o so it reads as worn, not floating.

Run from the repo root:  python3 scripts/make-icons.py
Writes assets/icon.png (1024, full-bleed; iOS rounds the corners) and the web icons in public/.
"""
import os, shutil
import numpy as np
from PIL import Image, ImageDraw
CROWN = Image.open('assets/crown-pink.png').convert('RGBA')
# trim crown to its opaque bounds (alpha > 128) to place precisely
a = np.asarray(CROWN)[..., 3]; ys, xs = np.where(a > 128)
CROWN = CROWN.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
O_COLOR = (47, 61, 59, 255)  # brand ink #2F3D3B

def crowned_o(n, scale=1.0, fill=0.56):
    """App icon: a tall, slightly leaning 'o' wearing the pink crown (reference: Figma icon set)."""
    S = 4; N = n * S  # supersample
    img = Image.new('RGBA', (N, N), (255, 255, 255, 255))
    # the o: thick oval ring, drawn upright then leaned ~12° to the right
    ring = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(ring)
    ow, oh = 0.30 * N * scale, 0.40 * N * scale; iw, ih = 0.125 * N * scale, 0.235 * N * scale
    cx, cy = 0.53 * N, 0.61 * N
    d.ellipse((cx - ow / 2, cy - oh / 2, cx + ow / 2, cy + oh / 2), fill=O_COLOR)
    d.ellipse((cx - iw / 2, cy - ih / 2 + 0.006 * N, cx + iw / 2, cy + ih / 2 + 0.006 * N), fill=(0, 0, 0, 0))
    ring = ring.rotate(-12, center=(cx, cy), resample=Image.BICUBIC)
    img.alpha_composite(ring)
    # the crown: wider than the o, tilted left, its band hugging the top third of the o
    cw = 0.38 * N * scale; ch = cw * CROWN.height / CROWN.width
    c = CROWN.resize((round(cw), round(ch)), Image.LANCZOS).rotate(14, expand=True, resample=Image.BICUBIC)
    ccx, ccy = cx - 0.03 * N * scale, cy - 0.255 * N * scale
    img.alpha_composite(c, (round(ccx - c.width / 2), round(ccy - c.height / 2)))
    # centre the whole mark vertically
    bb = Image.fromarray((np.asarray(img)[..., :3].min(-1) < 250).astype('uint8') * 255).getbbox()
    mark = img.crop(bb)
    k = fill * N / mark.height  # the mark fills ~56% of the icon's height, like the reference
    mark = mark.resize((round(mark.width * k), round(mark.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (N, N), (255, 255, 255, 255))
    out.alpha_composite(mark, ((N - mark.width) // 2, (N - mark.height) // 2))
    return out.resize((n, n), Image.LANCZOS)



icon = crowned_o(1024)
icon.convert('RGB').save('assets/icon.png')
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (48, 'favicon.png')]:
    icon.resize((size, size), Image.LANCZOS).convert('RGB').save(f'public/{name}')
icon.resize((48, 48), Image.LANCZOS).convert('RGB').save('assets/favicon.png')
# Maskable (Android): keep the mark inside the safe circle.
crowned_o(1024, fill=0.44).resize((512, 512), Image.LANCZOS).convert('RGB').save('public/icon-maskable-512.png')
# Android adaptive icon: white background, transparent foreground with the mark in the safe zone.
fg = crowned_o(1024, fill=0.40)
arr = np.asarray(fg).copy(); arr[..., 3][arr[..., :3].min(-1) > 248] = 0
Image.fromarray(arr).resize((512, 512), Image.LANCZOS).save('assets/android-icon-foreground.png')
# Versioned copies: the page links these, so home screens that cached an older icon pick up the new one.
VER = 'v3'
os.makedirs(f'public/icons/{VER}', exist_ok=True)
for name in ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']:
    shutil.copy(f'public/{name}', f'public/icons/{VER}/{name}')
print('icons written')
