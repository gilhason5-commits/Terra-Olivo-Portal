import sys
import os
import json
from pathlib import Path
from io import BytesIO
from PIL import Image
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images" / "oils"
OUT_W, OUT_H = 600, 800
BOTTLE_HEIGHT_PCT = 0.85
HORIZONTAL_PAD_PCT = 0.10

def build_gradient(w, h):
    canvas = Image.new("RGB", (w, h))
    px = canvas.load()
    for y in range(h):
        t = y / h
        r = int(244 + (229 - 244) * t)
        g = int(246 + (234 - 246) * t)
        b = int(238 + (211 - 238) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return canvas

def process_file(filepath, session):
    img = Image.open(filepath).convert("RGB")
    buf = BytesIO()
    img.save(buf, "PNG")
    out_bytes = remove(
        buf.getvalue(),
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=10,
    )
    bottle = Image.open(BytesIO(out_bytes)).convert("RGBA")

    bbox = bottle.getbbox()
    if bbox:
        bottle = bottle.crop(bbox)

    target_h = int(OUT_H * BOTTLE_HEIGHT_PCT)
    ratio = target_h / bottle.height
    new_w = int(bottle.width * ratio)
    max_w = int(OUT_W * (1 - 2 * HORIZONTAL_PAD_PCT))
    if new_w > max_w:
        ratio = max_w / bottle.width
        target_h = int(bottle.height * ratio)
        new_w = max_w
    bottle = bottle.resize((new_w, target_h), Image.LANCZOS)

    canvas = build_gradient(OUT_W, OUT_H)
    x = (OUT_W - bottle.width) // 2
    y = (OUT_H - bottle.height) // 2
    canvas.paste(bottle, (x, y), bottle)

    return canvas

def main():
    file = Path(sys.argv[1])
    try:
        session = new_session("birefnet-general")
        canvas = process_file(file, session)
        base_name = file.stem 
        out_filename = f"{base_name}.jpg"
        out_path = OUT_DIR / out_filename
        canvas.save(out_path, "JPEG", quality=90, optimize=True)
        
        oils_path = ROOT / "src" / "data" / "oils.json"
        with open(oils_path, 'r', encoding='utf-8') as f:
            oils = json.load(f)
            
        parts = base_name.split("__")
        if len(parts) >= 3:
            producer_slug = parts[1]
            oil_slug = parts[2]
            for o in oils:
                if o['producerSlug'] == producer_slug and o['slug'] == oil_slug:
                    o['image'] = f"/images/oils/{out_filename}"
                    break
        with open(oils_path, 'w', encoding='utf-8') as f:
            json.dump(oils, f, indent=2, ensure_ascii=False)
            
        print(f"SUCCESS: {out_filename}")
    except Exception as e:
        print(f"ERROR processing {file.name}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
