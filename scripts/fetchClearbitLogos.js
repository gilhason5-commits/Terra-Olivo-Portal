const fs = require('fs');
const path = require('path');
const axios = require('axios');

const producersDataPath = path.join(__dirname, '../src/data/producers.json');
const logosDir = path.join(__dirname, '../public/images/producers');

if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

async function run() {
  const producers = JSON.parse(fs.readFileSync(producersDataPath, 'utf8'));
  let updated = 0;
  
  for (const producer of producers) {
    if (producer.website && !producer.logo) {
      try {
        let hostname = new URL(producer.website).hostname.replace(/^www\./, '');
        // Google S2 API: https://www.google.com/s2/favicons?domain=:domain&sz=128
        const logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
        const destPath = path.join(logosDir, `logo__${producer.slug}.png`);
        
        console.log(`[Google S2] Trying logo for ${hostname}...`);
        
        const response = await axios({
          url: logoUrl,
          method: 'GET',
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        // Google S2 returns a default icon if not found, usually size is very small, we should check bytes.
        // A standard fallback globe icon is ~420 bytes, sometimes ~800 bytes.
        // We'll save it if it's > 1000 bytes.
        if (response.data.length > 1000) {
            fs.writeFileSync(destPath, response.data);
            producer.logo = `/images/producers/logo__${producer.slug}.png`;
            updated++;
            console.log(`  -> Success! Size: ${response.data.length} bytes`);
        } else {
            console.log(`  -> Fallback ignored (Size: ${response.data.length} bytes)`);
        }
      } catch (err) {
        console.log(`  -> Error: ${err.message}`);
      }
    }
  }
  
  if (updated > 0) {
    fs.writeFileSync(producersDataPath, JSON.stringify(producers, null, 2), 'utf8');
    console.log(`\nUpdated ${updated} logos using Google S2!`);
  } else {
    console.log(`\nNo new logos found via Google S2.`);
  }
}

run().catch(console.error);
