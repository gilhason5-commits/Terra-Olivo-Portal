const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const producersDataPath = path.join(__dirname, '../src/data/producers.json');
const logosDir = path.join(__dirname, '../public/images/producers');

if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

async function run() {
  const producers = JSON.parse(fs.readFileSync(producersDataPath, 'utf8'));
  let updated = 0;
  
  const missing = producers.filter(p => !p.logo);
  console.log(`Agent 1: Searching for ${missing.length} missing logos...`);
  
  for (const producer of missing) {
    const query = `${producer.name} olive oil logo`;
    console.log(`\nSearching: ${query}`);
    
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
      const res = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      });
      
      const $ = cheerio.load(res.data);
      let imgUrls = [];
      
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
        console.log(`  -> No results`);
        continue;
      }
      
      let success = false;
      for (const imgUrl of imgUrls.slice(0, 3)) {
        try {
          const imgRes = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          
          if (imgRes.status === 200 && imgRes.data.length > 2000) {
            let ext = '.png';
            if (imgUrl.toLowerCase().includes('.jpg')) ext = '.jpg';
            if (imgUrl.toLowerCase().includes('.webp')) ext = '.webp';
            
            const filename = `logo__${producer.slug}${ext}`;
            fs.writeFileSync(path.join(logosDir, filename), imgRes.data);
            console.log(`  -> Saved: ${filename}`);
            producer.logo = `/images/producers/${filename}`;
            updated++;
            success = true;
            break;
          }
        } catch (e) {
          // ignore error, try next
        }
      }
      if (!success) console.log(`  -> Failed to download.`);
      
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  if (updated > 0) {
    fs.writeFileSync(producersDataPath, JSON.stringify(producers, null, 2), 'utf8');
    console.log(`\nAgent 1 finished! Updated ${updated} logos.`);
  } else {
    console.log(`\nAgent 1 finished! No new logos found.`);
  }
}

run().catch(console.error);
