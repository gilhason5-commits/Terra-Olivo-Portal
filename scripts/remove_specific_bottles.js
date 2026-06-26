const fs = require('fs');
const path = require('path');

const oilsPath = path.join(__dirname, '../src/data/oils.json');
const oils = JSON.parse(fs.readFileSync(oilsPath, 'utf8'));

const targets = [
  "Ben Yaacov Picual organic",
  "BVS JerusalemOliveOil With Chipotle",
  "Irina Pgi Lesvos",
  "Etz Hasade Koroneiki",
  "BVS JerusalemOliveOil Heart Notes Blend",
  "BVS JerusalemOliveOil Picual"
];

let removedCount = 0;

for (const oil of oils) {
  if (targets.includes(oil.name)) {
    delete oil.image;
    delete oil.format;
    removedCount++;
  }
}

fs.writeFileSync(oilsPath, JSON.stringify(oils, null, 2), 'utf8');
console.log(`Removed images from ${removedCount} specific oils.`);
