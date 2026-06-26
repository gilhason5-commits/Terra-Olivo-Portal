import json
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OILS_JSON = ROOT / "src" / "data" / "oils.json"

def classify_format(filepath):
    # Returns 'good' or 'bad' based on heuristic
    try:
        img = Image.open(filepath).convert("RGB")
        w, h = img.size
        # We need to find the bounding box of the "bottle" (ignoring the green gradient)
        # Green gradient is around R:229-244, G:234-246, B:211-238
        # Let's just calculate the aspect ratio of the non-gradient pixels
        # But wait, a simpler way: just check if the image has a transparent background
        # Actually, all processed images are on a green gradient and 600x800.
        # But wait, how do we distinguish multiple bottles from one bottle?
        # A single bottle's width is usually < 50% of its height.
        
        # Let's scan columns and rows to find the bbox of pixels that deviate from gradient
        min_x, max_x, min_y, max_y = w, 0, h, 0
        pixels = img.load()
        
        for y in range(h):
            # approximate gradient color for this row
            t = y / h
            bg_r = int(244 + (229 - 244) * t)
            bg_g = int(246 + (234 - 246) * t)
            bg_b = int(238 + (211 - 238) * t)
            
            for x in range(w):
                pr, pg, pb = pixels[x, y]
                # Diff from background
                diff = abs(pr - bg_r) + abs(pg - bg_g) + abs(pb - bg_b)
                if diff > 45: # Threshold
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    
        if max_x < min_x or max_y < min_y:
            return "bad" # Empty or couldn't find bottle
            
        bw = max_x - min_x
        bh = max_y - min_y
        
        aspect_ratio = bw / float(bh)
        
        # If aspect ratio is greater than 0.65, it's too wide (probably a box or multiple bottles)
        # If aspect ratio is less than 0.1, it's a stick.
        if 0.15 <= aspect_ratio <= 0.65:
            return "good"
        else:
            return "bad"
            
    except Exception as e:
        print(f"Error classifying {filepath}: {e}")
        return "bad"

def main():
    with open(OILS_JSON, 'r', encoding='utf-8') as f:
        oils = json.load(f)
        
    updated = 0
    bad_count = 0
    good_count = 0
    
    for oil in oils:
        if oil.get('image'):
            # Convert /images/oils/file.jpg to absolute path
            rel_path = oil['image'].lstrip('/')
            abs_path = ROOT / "public" / rel_path
            if abs_path.exists():
                fmt = classify_format(abs_path)
                if oil.get('format') != fmt:
                    oil['format'] = fmt
                    updated += 1
                if fmt == "bad": bad_count += 1
                else: good_count += 1
            else:
                oil['format'] = "bad"
                
    if updated > 0:
        with open(OILS_JSON, 'w', encoding='utf-8') as f:
            json.dump(oils, f, indent=2, ensure_ascii=False)
            
    print(f"Agent 2 Classification Complete. Good: {good_count}, Bad: {bad_count}, Updated: {updated}")

if __name__ == "__main__":
    main()
