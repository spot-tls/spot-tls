// Régénère src/data/spots.json à partir d'un CSV rempli (template SpotFR).
// Usage : npm run data            (lit ./data-source/spots.csv)
//         npm run data ./chemin/vers/spots.csv
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || 'data-source/spots.csv';
const output = 'src/data/spots.json';

if (!fs.existsSync(input)) {
  console.error(`\n❌ Fichier introuvable : ${input}`);
  console.error('   Place ton CSV rempli ici : data-source/spots.csv (ou passe le chemin en argument).\n');
  process.exit(1);
}

const DAY_KEYS  = ['hours_lun','hours_mar','hours_mer','hours_jeu','hours_ven','hours_sam','hours_dim'];
const DAY_NAMES = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', inQ = false;
  text = text.replace(/^﻿/, ''); // strip BOM
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\r') { /* skip */ }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function normTime(t) {
  t = t.trim().replace(/h/gi, ':');
  if (/^\d{1,2}$/.test(t)) t += ':00';
  if (t.endsWith(':')) t += '00';
  let [h, m = '00'] = t.split(':');
  h = h.padStart(2, '0'); m = m.padStart(2, '0');
  if (h === '24') h = '00';
  return `${h}:${m}`;
}
function parseHours(raw) {
  if (!raw) return null;
  raw = String(raw).trim();
  if (!raw || /à compléter|fermé/i.test(raw)) return null;
  const first = raw.split(',')[0].trim();
  const m = first.match(/^\s*(\d{1,2}[h:]?\d{0,2})\s*[-–]\s*(\d{1,2}[h:]?\d{0,2})\s*$/);
  if (!m) return null;
  return { open: normTime(m[1]), close: normTime(m[2]) };
}

const rows = parseCSV(fs.readFileSync(input, 'utf-8'));
const headerRaw = rows[0].map(h => h.trim());
// map French header labels OR raw keys to internal keys
const ALIASES = {
  'nom': 'name', 'catégorie': 'category', 'categorie': 'category', 'quartier': 'quartier',
  'adresse': 'address', 'latitude': 'latitude', 'longitude': 'longitude',
  'mood principal': 'main_mood', 'vibe tags (séparés par virgule)': 'vibe_tags', 'vibe tags': 'vibe_tags',
  'prix': 'price', 'description': 'description', 'note google': 'google_rating',
  'site web': 'website', 'téléphone': 'phone', 'telephone': 'phone', 'url photo': 'photo_url',
  'instagram': 'insta',
  'lundi': 'hours_lun', 'mardi': 'hours_mar', 'mercredi': 'hours_mer', 'jeudi': 'hours_jeu',
  'vendredi': 'hours_ven', 'samedi': 'hours_sam', 'dimanche': 'hours_dim',
};
const keys = headerRaw.map(h => ALIASES[h.toLowerCase()] || h);

const out = [];
for (let i = 1; i < rows.length; i++) {
  const get = (k) => { const j = keys.indexOf(k); return j >= 0 ? (rows[i][j] ?? '').trim() : ''; };
  const lat = parseFloat(get('latitude')), lng = parseFloat(get('longitude'));
  if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
  const hours = {};
  DAY_KEYS.forEach((k, d) => { const h = parseHours(get(k)); if (h) hours[DAY_NAMES[d]] = h; });
  const rating = parseFloat(get('google_rating'));
  out.push({
    id: `${get('name')}_${i}`,
    name: get('name'), category: get('category'), quartier: get('quartier'),
    address: get('address'), lat, lng, main_mood: get('main_mood'),
    vibe_tags: get('vibe_tags') ? get('vibe_tags').split(',').map(s => s.trim()).filter(Boolean) : [],
    event_tags: get('event_tags') ? get('event_tags').split(',').map(s => s.trim()).filter(Boolean) : [],
    price: get('price'), description: get('description'),
    google_rating: Number.isNaN(rating) ? null : rating,
    hours: Object.keys(hours).length ? hours : null,
    insta: get('insta'), website: get('website'), phone: get('phone'), photo_url: get('photo_url'),
  });
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(out, null, 2), 'utf-8');
console.log(`✅ ${out.length} spots écrits dans ${output}`);
console.log(`   ${out.filter(s => s.hours).length} avec horaires, ${out.filter(s => s.photo_url).length} avec photo.`);
