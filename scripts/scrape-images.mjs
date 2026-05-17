/**
 * Run this locally (not on the server) to scrape bottle images from bestoliveoils.org
 *
 * Setup (one time):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Run:
 *   node scripts/scrape-images.mjs
 *
 * Output:
 *   - Downloads images to public/images/
 *   - Updates src/data/oils.json with local image paths
 *   - Prints a summary at the end
 */

import { chromium } from "playwright";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, "../public/images");
const OILS_JSON  = join(__dirname, "../src/data/oils.json");

mkdirSync(IMAGES_DIR, { recursive: true });

// ── Download helper ────────────────────────────────────────────────────────
function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    if (existsSync(destPath)) { resolve(true); return; }
    const mod = url.startsWith("https") ? https : http;
    const chunks = [];
    const req = mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, destPath).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      res.on("data", c => chunks.push(c));
      res.on("end", () => { writeFileSync(destPath, Buffer.concat(chunks)); resolve(true); });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(15000, () => { req.destroy(); resolve(false); });
  });
}

// ── Slug → search name ─────────────────────────────────────────────────────
function searchName(oil) {
  // Try name first, fall back to removing variety names for cleaner search
  return oil.name.replace(/\s*[-–]\s*(extra virgin|evoo|dop|igp|pdo|pgi).*/i, "").trim();
}

// ── Main ───────────────────────────────────────────────────────────────────
const oils = JSON.parse(readFileSync(OILS_JSON, "utf-8"));
const needImage = oils.filter(o => !o.image);
console.log(`\n🫒 Scraping images for ${needImage.length} oils...\n`);

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
});
const page = await ctx.newPage();

let found = 0, notFound = 0;
const results = {};

for (let i = 0; i < needImage.length; i++) {
  const oil = needImage[i];
  const query = searchName(oil);
  const destFile = `${oil.slug}.jpg`;
  const destPath = join(IMAGES_DIR, destFile);

  if (existsSync(destPath)) {
    results[oil.slug] = `/images/${destFile}`;
    found++;
    continue;
  }

  try {
    // Search on bestoliveoils.org
    await page.goto(`https://bestoliveoils.org/search?q=${encodeURIComponent(query)}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Try to find the first product card image
    const imgUrl = await page.evaluate(() => {
      // Look for product card images
      const selectors = [
        '.product-card img',
        '.oil-card img',
        '.search-result img',
        'article img',
        '.card img',
        'img[src*="bottle"]',
        'img[src*="oil"]',
        'img[src*="product"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.src && !el.src.includes('logo') && !el.src.includes('icon')) {
          return el.src;
        }
      }
      // fallback: first meaningful img
      const imgs = [...document.querySelectorAll('img')].filter(
        img => img.width > 80 && img.src && !img.src.includes('logo')
      );
      return imgs[0]?.src || null;
    });

    if (imgUrl) {
      const ok = await downloadImage(imgUrl, destPath);
      if (ok) {
        results[oil.slug] = `/images/${destFile}`;
        found++;
        console.log(`✓ [${i+1}/${needImage.length}] ${oil.name}`);
      } else {
        notFound++;
        console.log(`✗ [${i+1}/${needImage.length}] ${oil.name} (download failed)`);
      }
    } else {
      notFound++;
      console.log(`– [${i+1}/${needImage.length}] ${oil.name} (not found)`);
    }
  } catch (e) {
    notFound++;
    console.log(`! [${i+1}/${needImage.length}] ${oil.name} (${e.message.slice(0, 50)})`);
  }

  // Polite delay
  await new Promise(r => setTimeout(r, 300));
}

await browser.close();

// ── Update oils.json ───────────────────────────────────────────────────────
let updated = 0;
for (const oil of oils) {
  if (results[oil.slug]) {
    oil.image = results[oil.slug];
    updated++;
  }
}
writeFileSync(OILS_JSON, JSON.stringify(oils, null, 2));

console.log(`\n✅ Done: ${found} images found, ${notFound} not found`);
console.log(`📝 Updated ${updated} entries in oils.json`);
console.log(`\nNext steps:`);
console.log(`  git add public/images src/data/oils.json`);
console.log(`  git commit -m "Add bottle images"`);
console.log(`  git push`);
