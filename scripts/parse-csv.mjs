import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH =
  process.argv[2] ||
  "/root/.claude/uploads/427200e9-4115-4a5b-8336-43348aa0c89d/c1f5f487-Awards_Terraolivo_2025.csv";

const CERT_DIR = join(__dirname, "../public/certificates");
mkdirSync(CERT_DIR, { recursive: true });

// ── Download helper ────────────────────────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (existsSync(destPath)) { resolve(true); return; }
    const mod = url.startsWith("https") ? https : http;
    const file = { chunks: [] };
    const req = mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      res.on("data", (chunk) => file.chunks.push(chunk));
      res.on("end", () => {
        writeFileSync(destPath, Buffer.concat(file.chunks));
        resolve(true);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

// ── CSV parser (handles quoted multiline fields) ───────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field.trim()); field = ""; i++; continue; }
    if (ch === '\n') {
      row.push(field.trim()); field = "";
      if (row.some(f => f.length > 0)) rows.push(row);
      row = []; i++; continue;
    }
    if (ch === '\r') { i++; continue; }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field.trim()); rows.push(row); }
  return rows;
}

// ── Extract filename + URL from "filename (https://...)" format ────────────
function extractFileAndUrl(fieldValue) {
  const match = fieldValue.match(/^(.+?)\s*\((https?:\/\/[^)]+)\)$/);
  if (!match) return { filename: null, url: null };
  return { filename: match[1].trim(), url: match[2].trim() };
}

// ── Slug generator ─────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ── Olive variety detection ────────────────────────────────────────────────
const VARIETIES = [
  "Koroneiki", "Picual", "Coratina", "Arbequina", "Arbequino", "Barnea",
  "Picholine", "Pichuline", "Picholina", "Souri", "Frantoio", "Peranzana",
  "Leccino", "Lecciana", "Hojiblanca", "Manzanilla", "Nocellara",
  "Maurino", "Moraiolo", "Itrana", "Chetoui", "Memecik", "Nabali", "Chemlali",
  "Ascolana", "Cobrançosa", "Cobrancosa", "Galega", "Cornicabra", "Empeltre",
  "Taggiasca", "Ogliarola", "Carolea", "Biancolilla", "Verdial", "Changlot",
  "Blanqueta", "Farga", "Sevillenca", "Morisca", "Gemlik", "Ayvalik",
  "Tonda Iblea", "Nocellara del Belice", "Maalot", "Picholine Marocaine",
];

function detectVarieties(name) {
  const found = [];
  const lower = name.toLowerCase();
  for (const v of VARIETIES) {
    if (lower.includes(v.toLowerCase())) {
      let canon = v;
      if (v === "Arbequino") canon = "Arbequina";
      if (v === "Pichuline" || v === "Picholina") canon = "Picholine";
      if (v === "Lecciana") canon = "Leccino";
      if (v === "Cobrancosa") canon = "Cobrançosa";
      if (!found.includes(canon)) found.push(canon);
    }
  }
  if (found.length === 0 && /\bblend\b/i.test(name)) found.push("Blend");
  return found;
}

// ── Main ───────────────────────────────────────────────────────────────────
const text = readFileSync(CSV_PATH, "utf-8");
const rows = parseCSV(text);
const [header, ...dataRows] = rows;
console.log(`Header: ${JSON.stringify(header)}`);
console.log(`Data rows: ${dataRows.length}`);

const producerMap = new Map();
const oilMap = new Map();
// Store pending downloads: { url, localPath, localUrl }
const pendingDownloads = [];

for (const row of dataRows) {
  if (row.length < 4) continue;
  let [evooName, brandName, country, medal, medalFile, certificate] = row;

  brandName = (brandName || "").replace(/\s+/g, " ").trim();
  evooName  = (evooName  || "").replace(/\s+/g, " ").trim();
  country   = (country   || "").replace(/\s+/g, " ").trim();
  medal     = (medal     || "").replace(/\s+/g, " ").trim();

  if (!brandName && !evooName) continue;

  const oilName      = evooName || brandName;
  const producerName = brandName || oilName;

  if (!producerMap.has(producerName)) {
    producerMap.set(producerName, {
      slug: slugify(producerName),
      name: producerName,
      country,
      region: "",
      description: `${producerName} is an award-winning olive oil producer from ${country}.`,
    });
  }

  const producer = producerMap.get(producerName);
  const oilKey   = `${oilName}||${producerName}`;

  if (!oilMap.has(oilKey)) {
    oilMap.set(oilKey, {
      slug: slugify(oilName),
      name: oilName,
      producerSlug: producer.slug,
      country,
      region: "",
      varieties: detectVarieties(oilName),
      intensity: "Medium",
      description: `${oilName} is an award-winning extra virgin olive oil from ${country}.`,
      tastingNotes: [],
      awards: [],
    });
  }

  const oil = oilMap.get(oilKey);

  // Prefer medal PNG image; fall back to certificate PDF
  const { filename: mfn, url: murl } = extractFileAndUrl(medalFile || "");
  const { filename: cfn, url: curl } = extractFileAndUrl(certificate || "");
  const imageUrl = murl || curl;
  const imageFilename = mfn || cfn;

  let localCertPath = undefined;
  if (imageUrl && imageFilename) {
    // Build a stable local filename from slug + medal
    const ext = imageFilename.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const localName = `${slugify(oilName)}_${slugify(medal)}.${ext}`;
    const localPath = join(CERT_DIR, localName);
    const localUrl  = `/certificates/${localName}`;
    pendingDownloads.push({ url: imageUrl, localPath, localUrl, award: null });
    localCertPath = localUrl;
    // We'll attach after push — store index
    oil.awards.push({ year: 2025, prize: medal, certificateImage: localCertPath, _dlIdx: pendingDownloads.length - 1 });
  } else {
    oil.awards.push({ year: 2025, prize: medal });
  }
}

// ── Deduplicate slugs ──────────────────────────────────────────────────────
const usedSlugs = new Map();
for (const oil of oilMap.values()) {
  const base = oil.slug;
  let candidate = base;
  let n = 2;
  while (usedSlugs.has(candidate) && usedSlugs.get(candidate) !== `${oil.name}||${oil.producerSlug}`) {
    candidate = `${base}-${n++}`;
  }
  usedSlugs.set(candidate, `${oil.name}||${oil.producerSlug}`);
  oil.slug = candidate;
}

const usedPSlugs = new Map();
for (const p of producerMap.values()) {
  const base = p.slug;
  let candidate = base;
  let n = 2;
  while (usedPSlugs.has(candidate) && usedPSlugs.get(candidate) !== p.name) {
    candidate = `${base}-${n++}`;
  }
  usedPSlugs.set(candidate, p.name);
  p.slug = candidate;
}

// Re-sync producerSlug after dedup
for (const oil of oilMap.values()) {
  const found = Array.from(producerMap.values()).find(p => p.slug === oil.producerSlug);
  if (!found) {
    const brandEntry = Array.from(producerMap.entries()).find(([name]) => slugify(name) === oil.producerSlug);
    if (brandEntry) oil.producerSlug = brandEntry[1].slug;
  }
}

// ── Download certificate images ────────────────────────────────────────────
console.log(`\nDownloading ${pendingDownloads.length} certificate images...`);
let ok = 0, fail = 0;
for (let i = 0; i < pendingDownloads.length; i++) {
  const { url, localPath, localUrl } = pendingDownloads[i];
  const success = await downloadFile(url, localPath);
  if (success) ok++; else fail++;
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${pendingDownloads.length} (${ok} ok, ${fail} failed)`);
}
console.log(`Done: ${ok} downloaded, ${fail} failed`);

// Strip internal _dlIdx field; fall back to original Airtable URL if download failed
for (const oil of oilMap.values()) {
  for (const award of oil.awards) {
    if ("_dlIdx" in award) {
      const { url, localPath } = pendingDownloads[award._dlIdx];
      if (!existsSync(localPath)) award.certificateImage = url; // use Airtable URL as fallback
      delete award._dlIdx;
    }
  }
}

const producers = Array.from(producerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
const oils      = Array.from(oilMap.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log(`\nProducers: ${producers.length}`);
console.log(`Oils: ${oils.length}`);
console.log(`\nMedal types:`);
const medals = [...new Set(oils.flatMap(o => o.awards.map(a => a.prize)))].sort();
medals.forEach(m => console.log(`  - ${m}`));

const outDir = join(__dirname, "../src/data");
writeFileSync(join(outDir, "producers.json"), JSON.stringify(producers, null, 2));
writeFileSync(join(outDir, "oils.json"), JSON.stringify(oils, null, 2));
console.log(`\nWrote ${producers.length} producers and ${oils.length} oils.`);
