"""Render Moi's app/home-screen icons: the "Moi" wordmark (capital M, Young Serif, black) with the
pink velvet crown on the o, on white. Crown placement matches the brand reference and <Logo> in
src/components/ui.tsx exactly, because both are drawn by a real browser from the same numbers.

Needs Python Playwright and Chrome:  python3 scripts/make-icons.py
Writes assets/icon.png (1024, full-bleed; iOS rounds the corners), the web icons in public/,
the Android adaptive foreground, and versioned copies so home screens refresh.
"""
import asyncio, glob, os, shutil, io
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
FONT = Path(glob.glob(str(ROOT / 'node_modules/@expo-google-fonts/young-serif/**/*.ttf'), recursive=True)[0])
CROWN_PNG = ROOT / 'assets/crown-pink.png'
# Same as ui.tsx (64 px master): letters, text box, crown box and tilt.
LETTERS = [('M', -1.9), ('o', 63.8), ('i', 99.5)]
CROWN = dict(w=32.3, h=32.8, left=59.85, top=6.6, rotate=-14)
INK = '#0A0A0A'
VER = 'v4'


def page(n, fill):
    k = n * fill / 123
    w, h = 123 * k, 64 * k
    letters = ''.join(f'<span style="position:absolute;left:{x*k}px;top:{-3.7*k}px;font-size:{64*k}px;line-height:{90*k}px">{c}</span>' for c, x in LETTERS)
    crown = (f'<img src="{CROWN_PNG.as_uri()}" style="position:absolute;left:{CROWN["left"]*k}px;top:{CROWN["top"]*k}px;'
             f'width:{CROWN["w"]*k}px;height:{CROWN["h"]*k}px;transform:rotate({CROWN["rotate"]}deg)">')
    return f'''<html><head><style>@font-face{{font-family:YS;src:url("{FONT.as_uri()}")}}
html,body{{margin:0;width:{n}px;height:{n}px;background:transparent;overflow:hidden}}
.m{{position:absolute;left:{(n-w)/2}px;top:{(n-h)/2 + 2*k}px;width:{w}px;height:{h}px;font-family:YS;color:{INK}}}</style></head>
<body><div class="m">{letters}{crown}</div></body></html>'''


async def render(n, fill):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=shutil.which('google-chrome') or None, args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': n, 'height': n})
        html = ROOT / 'node_modules/.cache-icon.html'
        html.write_text(page(n, fill))
        await pg.goto(html.as_uri()); await pg.wait_for_timeout(600)
        png = await pg.screenshot(omit_background=True)
        await b.close(); html.unlink()
        return Image.open(io.BytesIO(png)).convert('RGBA')


def on_white(mark):
    bg = Image.new('RGBA', mark.size, (255, 255, 255, 255)); bg.alpha_composite(mark); return bg.convert('RGB')


async def main():
    os.chdir(ROOT)
    master = on_white(await render(1024, 0.66))
    master.save('assets/icon.png')
    for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (48, 'favicon.png')]:
        master.resize((size, size), Image.LANCZOS).save(f'public/{name}')
    master.resize((48, 48), Image.LANCZOS).save('assets/favicon.png')
    on_white(await render(1024, 0.52)).resize((512, 512), Image.LANCZOS).save('public/icon-maskable-512.png')   # Android safe zone
    (await render(1024, 0.48)).resize((512, 512), Image.LANCZOS).save('assets/android-icon-foreground.png')     # transparent
    os.makedirs(f'public/icons/{VER}', exist_ok=True)
    for name in ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']:
        shutil.copy(f'public/{name}', f'public/icons/{VER}/{name}')
    print('icons written')

asyncio.run(main())
