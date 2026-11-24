"""Cut 3x3 icon sheets (generated in Figma on a flat background) into transparent PNGs.

    python3 scripts/cut-icons.py sheet.png id1,id2,...,id9 [assets/icons3d]

Each cell's border colour is taken as the background. Pixels close to it become transparent with
a soft edge, and the colour is un-mixed from the background so no halo is left. Output: 256×256.
"""
import sys
import numpy as np
from PIL import Image

sheet, ids = sys.argv[1], sys.argv[2].split(',')
out_dir = sys.argv[3] if len(sys.argv) > 3 else 'assets/icons3d'
im = np.asarray(Image.open(sheet).convert('RGB')).astype(float)
ch, cw = im.shape[0] // 3, im.shape[1] // 3
for k, name in enumerate(ids):
    r, c = divmod(k, 3)
    cell = im[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
    border = np.concatenate([cell[:6].reshape(-1, 3), cell[-6:].reshape(-1, 3), cell[:, :6].reshape(-1, 3), cell[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    a = np.clip((np.sqrt(((cell - bg) ** 2).sum(-1)) - 10) / 30, 0, 1)
    al = np.maximum(a[..., None], 1e-3)
    rgb = np.clip((cell - bg * (1 - al)) / al, 0, 255)
    icon = Image.fromarray(np.dstack([rgb, a * 255]).astype('uint8'), 'RGBA')
    icon = icon.crop(Image.fromarray((a > 0.35).astype('uint8') * 255).getbbox())
    s = max(icon.size)
    square = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    square.paste(icon, ((s - icon.width) // 2, (s - icon.height) // 2))
    square.resize((256, 256), Image.LANCZOS).save(f'{out_dir}/{name}.png')
print(f'wrote {len(ids)} icons to {out_dir}')
