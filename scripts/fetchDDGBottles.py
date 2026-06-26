import json
import os
import time
import requests
from duckduckgo_search import DDGS

PRODUCERS_FILE = "../src/data/producers.json"
OILS_FILE = "../src/data/oils.json"
TEMP_DIR = "../public/images/temp_bottles"

os.makedirs(TEMP_DIR, exist_ok=True)

with open(PRODUCERS_FILE, 'r', encoding='utf-8') as f:
    producers = json.load(f)

with open(OILS_FILE, 'r', encoding='utf-8') as f:
    oils = json.load(f)

producer_map = {p['slug']: p['name'] for p in producers}

missing_oils = [o for o in oils if not o.get('image')]
print(f"Found {len(missing_oils)} missing bottle images. Starting DuckDuckGo search...")

downloaded_count = 0
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36)"
}

ddgs = DDGS()

for oil in missing_oils:
    producer_name = producer_map.get(oil['producerSlug'], oil['producerSlug'])
    query = f'"{producer_name}" "{oil["name"]}" olive oil bottle'
    print(f"\nSearching: {query}")
    
    try:
        results = list(ddgs.images(query, max_results=3))
        if not results:
            print("  -> No results found, retrying broadly")
            query = f'{producer_name} {oil["name"]} olive oil'
            results = list(ddgs.images(query, max_results=2))
            if not results:
                print("  -> Still no results.")
                continue
            
        success = False
        for res_img in results:
            img_url = res_img['image']
            print(f"  -> Found: {img_url}")
            try:
                res = requests.get(img_url, headers=headers, timeout=10)
                if res.status_code == 200:
                    ext = ".jpg"
                    if "png" in img_url.lower(): ext = ".png"
                    elif "webp" in img_url.lower(): ext = ".webp"
                    
                    filename = f"bottle__{oil['producerSlug']}__{oil['slug']}{ext}"
                    filepath = os.path.join(TEMP_DIR, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(res.content)
                    print(f"  -> Saved as {filename}")
                    downloaded_count += 1
                    success = True
                    break
                else:
                    print(f"  -> Failed download (Status {res.status_code})")
            except Exception as e:
                print(f"  -> Download error: {str(e)[:50]}")
        
        if not success:
            print("  -> Could not download any images for this bottle.")
            
    except Exception as e:
        print(f"  -> DDG error: {str(e)}")
        
    time.sleep(1.5)

print(f"\nFinished! Downloaded {downloaded_count} images to {TEMP_DIR}.")
