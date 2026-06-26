const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const producersDataPath = path.join(__dirname, '../src/data/producers.json');
const oilsDataPath = path.join(__dirname, '../src/data/oils.json');
const tempDir = path.join(__dirname, '../public/images/temp_bottles');

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function run() {
  const producers = JSON.parse(fs.readFileSync(producersDataPath, 'utf8'));
  const oils = JSON.parse(fs.readFileSync(oilsDataPath, 'utf8'));
  
  const producerMap = {};
  for (const p of producers) {
    producerMap[p.slug] = p.name;
  }
  
  const missing = oils.filter(o => !o.image);
  console.log(`Found ${missing.length} missing bottles. Searching via Bing HTML...`);
  
  let downloaded = 0;
  
  for (const oil of missing) {
    const producerName = producerMap[oil.producerSlug] || oil.producerSlug;
    const query = `${producerName} ${oil.name} olive oil bottle`;
    console.log(`\nSearching: ${query}`);
    
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
      const res = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(res.data);
      let imgUrls = [];
      
      // Bing uses m="{murl:'...'}" attributes
      $('a.iusc').each((i, el) => {
        const mAttr = $(el).attr('m');
        if (mAttr) {
          try {
            const m = JSON.parse(mAttr);
            if (m.murl) imgUrls.push(m.murl);
          } catch(e) {}
        }
      });
      
      if (imgUrls.length === 0) {
        console.log(`  -> No results found.`);
        continue;
      }
      
      let success = false;
      for (const imgUrl of imgUrls.slice(0, 3)) {
        console.log(`  -> Found: ${imgUrl}`);
        try {
          const imgRes = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          
          if (imgRes.status === 200) {
            let ext = '.jpg';
            if (imgUrl.toLowerCase().includes('.png')) ext = '.png';
            if (imgUrl.toLowerCase().includes('.webp')) ext = '.webp';
            
            const filename = `bottle__${oil.producerSlug}__${oil.slug}${ext}`;
            fs.writeFileSync(path.join(tempDir, filename), imgRes.data);
            console.log(`  -> Saved as ${filename}`);
            downloaded++;
            success = true;
            break;
          }
        } catch (e) {
          console.log(`  -> Download error`);
        }
      }
      
      if (!success) console.log(`  -> Failed to download any images.`);
      
    } catch (err) {
      console.log(`  -> Error searching: ${err.message}`);
    }
    
    // sleep
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nFinished! Downloaded ${downloaded} bottles.`);
}

run().catch(console.error);
