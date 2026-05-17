"""
Remove backgrounds from all bottle images, then composite on the
olive-50 gradient that matches the card placeholder.

Usage: python3 scripts/remove-bg.py
"""
import os
import sys
from pathlib import Path
from io import BytesIO
from PIL import Image
from rembg import remove, new_session

SRC = Path(__file__).resolve().parent.parent / "public" / "images"
OUT_W, OUT_H = 600, 800
PADDING = 30

# Use isnet-general-use for cleaner edges on products
session = new_session("isnet-general-use")

files = sorted(f for f in os.listdir(SRC)
               if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
               and (SRC / f).is_file())
print(f"Removing backgrounds from {len(files)} images...")

for i, fname in enumerate(files, 1):
    src_path = SRC / fname
    try:
        with open(src_path, "rb") as f:
            input_bytes = f.read()

        # Remove background → transparent PNG
        out_bytes = remove(input_bytes, session=session)
        bottle = Image.open(BytesIO(out_bytes)).convert("RGBA")

        # Trim to bounding box of the bottle (kill empty borders)
        bbox = bottle.getbbox()
        if bbox:
            bottle = bottle.crop(bbox)

        # Scale to fit inside (OUT_W-2*PAD)×(OUT_H-2*PAD)
        max_w = OUT_W - 2 * PADDING
        max_h = OUT_H - 2 * PADDING
        ratio = min(max_w / bottle.width, max_h / bottle.height)
        new_size = (int(bottle.width * ratio), int(bottle.height * ratio))
        bottle = bottle.resize(new_size, Image.LANCZOS)

        # Build canvas with olive-50 → olive-100 gradient bg
        canvas = Image.new("RGB", (OUT_W, OUT_H), (244, 246, 238))  # olive-50
        # Simple vertical gradient
        for y in range(OUT_H):
            t = y / OUT_H
            r = int(244 + (229 - 244) * t)  # olive-50 → olive-100
            g = int(246 + (234 - 246) * t)
            b = int(238 + (211 - 238) * t)
            for x in range(OUT_W):
                canvas.putpixel((x, y), (r, g, b))

        # Paste centered
        x = (OUT_W - bottle.width) // 2
        y = (OUT_H - bottle.height) // 2
        canvas.paste(bottle, (x, y), bottle)  # use alpha as mask

        # Save back to same name (always .jpg)
        out_name = Path(fname).stem + ".jpg"
        out_path = SRC / out_name
        canvas.save(out_path, "JPEG", quality=90, optimize=True)
        # If we changed ext, remove old file
        if out_name != fname:
            src_path.unlink()
        print(f"  ✓ [{i}/{len(files)}] {fname}")
    except Exception as e:
        print(f"  ✗ [{i}/{len(files)}] {fname}: {e}")

print("\n✅ Done.")
