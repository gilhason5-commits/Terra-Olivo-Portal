import sys
import os
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OILS_DIR = ROOT / "public" / "images" / "oils"

def has_white_background(filepath):
    try:
        img = Image.open(filepath).convert("RGB")
        w, h = img.size
        # Sample 4 corners
        # Add midpoints too, to catch cases where corners have shadows but borders are white
        points = [
            img.getpixel((0, 0)), img.getpixel((w-1, 0)),
            img.getpixel((0, h-1)), img.getpixel((w-1, h-1)),
            img.getpixel((w//2, 0)), img.getpixel((w//2, h-1)),
            img.getpixel((0, h//2)), img.getpixel((w-1, h//2))
        ]
        
        # Lower threshold from 250 to 220 to catch off-white or shadowed white backgrounds
        white_count = sum(1 for (r,g,b) in points if r > 220 and g > 220 and b > 220)
        
        # If at least 3 edge/corner points are whitish, we assume it's a white background
        return white_count >= 3
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False

def main():
    files = [f for f in OILS_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.png', '.webp']]
    
    to_process = []
    for f in files:
        if has_white_background(f):
            to_process.append(f)
            
    print(f"Agent 3: Found {len(to_process)} bottles with a white background.")
    
    # Process them using process-single-bottle.py
    for f in to_process:
        print(f"\nProcessing {f.name}...")
        try:
            # We copy it to a temp location because process-single-bottle will overwrite the output
            temp_path = ROOT / "public" / "images" / "temp_bottles" / f.name
            temp_path.parent.mkdir(exist_ok=True)
            import shutil
            shutil.copy(f, temp_path)
            
            subprocess.run(["python3", "scripts/process-single-bottle.py", str(temp_path)], check=True)
            
            # Remove temp
            os.remove(temp_path)
        except Exception as e:
            print(f"Failed to process {f.name}: {e}")

    print("\nAgent 3 finished!")

if __name__ == "__main__":
    main()
