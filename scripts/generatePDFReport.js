const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const producersPath = path.join(__dirname, '../src/data/producers.json');
const oilsPath = path.join(__dirname, '../src/data/oils.json');

const producers = JSON.parse(fs.readFileSync(producersPath, 'utf8'));
const oils = JSON.parse(fs.readFileSync(oilsPath, 'utf8'));

let missingLogos = producers.filter(p => !p.logo);
let missingImages = oils.filter(o => !o.image);

// Group missing images by producer
let missingImagesByProducer = {};
missingImages.forEach(oil => {
  if (!missingImagesByProducer[oil.producerSlug]) {
    missingImagesByProducer[oil.producerSlug] = [];
  }
  missingImagesByProducer[oil.producerSlug].push(oil.name);
});

// HTML Generation
let html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>דוח חוסרים - Terra Olivo</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
    h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; }
    .stat-box { background: #f7fafc; border: 1px solid #cbd5e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 1.1em; }
    ul { list-style-type: none; padding-right: 0; }
    li { background: #fff; border: 1px solid #e2e8f0; margin-bottom: 10px; padding: 15px; border-radius: 8px; }
    .producer-name { font-weight: bold; font-size: 1.1em; color: #2c5282; margin-bottom: 5px; }
    .oil-name { background: #edf2f7; display: inline-block; padding: 4px 8px; border-radius: 4px; margin: 4px 0 4px 8px; font-size: 0.9em; border: 1px solid #cbd5e0; }
    .badge { display: inline-block; background: #e53e3e; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 10px; }
  </style>
</head>
<body>
  <h1>דוח נכסים חסרים (תמונות ולוגואים)</h1>
  <div class="stat-box">
    סה"כ מפיקים שחסר להם לוגו: ${missingLogos.length}<br>
    סה"כ בקבוקי שמן שחסרה להם תמונה: ${missingImages.length}
  </div>

  <h2>רשימת חוסרים לפי מפיק</h2>
  <ul>
`;

const allProducerSlugs = new Set([
  ...missingLogos.map(p => p.slug),
  ...Object.keys(missingImagesByProducer)
]);

Array.from(allProducerSlugs).sort().forEach(slug => {
  const producer = producers.find(p => p.slug === slug) || { name: slug };
  const isMissingLogo = missingLogos.some(p => p.slug === slug);
  const missingOils = missingImagesByProducer[slug] || [];

  html += `
    <li>
      <div class="producer-name">${producer.name}</div>
      ${isMissingLogo ? `<span class="badge">חסר לוגו</span>` : ''}
      ${missingOils.length > 0 ? `
        <div style="margin-top: 10px;">
          <strong>בקבוקים חסרים:</strong><br>
          ${missingOils.map(oil => `<span class="oil-name">${oil}</span>`).join('')}
        </div>
      ` : ''}
    </li>
  `;
});

html += `
  </ul>
</body>
</html>
`;

async function generatePDF() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Set content directly
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const destPath = path.join('/Users/gilhasson/Desktop', 'missing_assets_report.pdf');
  
  await page.pdf({
    path: destPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
  });
  
  await browser.close();
  console.log('PDF generated successfully at:', destPath);
}

generatePDF().catch(err => {
  console.error("Failed to generate PDF:", err);
  process.exit(1);
});
