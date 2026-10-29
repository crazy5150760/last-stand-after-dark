"""Original Last Stand monogram icons; no changes to accepted game artwork."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / 'pwa' / 'icons'
root.mkdir(exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf', 205)

def draw_icon(maskable=False):
    im = Image.new('RGB', (512, 512), '#090d19')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((38, 38, 474, 474), 96, fill='#142a36', outline='#425c68', width=4)
    d.ellipse((288, 86, 380, 178), fill='#ffdb8d')
    d.ellipse((316, 74, 398, 156), fill='#142a36')
    for x, y, w in [(84, 316, 42), (132, 288, 43), (181, 338, 34), (296, 318, 45), (350, 276, 38), (396, 302, 30)]:
        d.rectangle((x, y, x+w, 430), fill='#0b1724')
    d.text((256, 270), 'LS', font=font, anchor='mm', fill='#ffedc2', stroke_width=1)
    d.line((144, 378, 368, 378), fill='#a7ffda', width=10)
    if maskable:
        # All essential marks are inside the central 80% mask-safe diameter.
        small = im.resize((410, 410), Image.Resampling.LANCZOS)
        im = Image.new('RGB', (512, 512), '#090d19')
        im.paste(small, (51, 51))
    return im

image = draw_icon()
image.save(root / 'icon-512.png', optimize=True)
image.resize((192, 192), Image.Resampling.LANCZOS).save(root / 'icon-192.png', optimize=True)
draw_icon(True).save(root / 'maskable-512.png', optimize=True)
