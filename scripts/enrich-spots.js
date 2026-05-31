/**
 * enrich-spots.js
 *
 * Enrichit les spots Supabase avec : horaires, quartier, place_id.
 *
 * Usage :
 *   node scripts/enrich-spots.js [options]
 *
 * Options :
 *   --dry-run          Affiche ce qui serait fait sans écrire en base
 *   --limit <n>        Traite seulement n spots (ex: --limit 10)
 *   --only-hours       Enrichit seulement les horaires
 *   --only-quartier    Enrichit seulement les quartiers
 *
 * Prérequis Supabase (SQL à exécuter une fois) :
 *   ALTER TABLE spots ADD COLUMN IF NOT EXISTS place_id TEXT;
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

// ── Config ───────────────────────────────────────────────────────────────────
const GOOGLE_KEY  = process.env.GOOGLE_API_KEY;
const SB_URL      = process.env.SUPABASE_URL      || process.env.VITE_SUPABASE_URL;
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const DRY_RUN      = process.argv.includes('--dry-run');
const ONLY_HOURS   = process.argv.includes('--only-hours');
const ONLY_QUARTIER = process.argv.includes('--only-quartier');
const LIMIT_IDX    = process.argv.indexOf('--limit');
const LIMIT        = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : Infinity;
const DELAY_MS     = 250; // entre chaque appel Google (évite rate limit)

if (!GOOGLE_KEY) { console.error('❌ GOOGLE_API_KEY manquant dans .env.local'); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_KEY manquants'); process.exit(1); }

const supabase = createClient(SB_URL, SB_KEY);

// ── Utilitaires HTTP ─────────────────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('JSON parse: ' + raw.slice(0, 120))); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Google Places : recherche par nom + ville ────────────────────────────────
async function findPlaceId(name, address) {
  const q   = encodeURIComponent(`${name} ${address || 'Toulouse France'}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`
            + `?input=${q}&inputtype=textquery&fields=place_id,name`
            + `&locationbias=circle:8000@43.6047,1.4442&key=${GOOGLE_KEY}`;
  const res = await httpsGet(url);
  if (res.status !== 'OK' && res.status !== 'ZERO_RESULTS') {
    console.warn(`    ⚠️  findPlace API: ${res.status} — ${res.error_message || ''}`);
  }
  return res.candidates?.[0]?.place_id || null;
}

// ── Google Places : détails (horaires) ──────────────────────────────────────
async function getPlaceDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`
            + `?place_id=${placeId}&fields=opening_hours,address_components,formatted_address`
            + `&language=fr&key=${GOOGLE_KEY}`;
  const res = await httpsGet(url);
  if (res.status !== 'OK') {
    console.warn(`    ⚠️  placeDetails API: ${res.status}`);
    return null;
  }
  return res.result || null;
}

// ── Google Geocoding : reverse (lat,lng → adresse) ───────────────────────────
async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json`
            + `?latlng=${lat},${lng}&language=fr&key=${GOOGLE_KEY}`;
  const res = await httpsGet(url);
  return res.results?.[0] || null;
}

// ── Convertit opening_hours.periods Google → format Supabase ─────────────────
// Format Supabase : { lundi: { open: "18:00", close: "02:00" }, ... }
const DAY_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function parseGoogleHours(opening_hours) {
  if (!opening_hours?.periods?.length) return null;

  const hours = {};

  for (const period of opening_hours.periods) {
    if (!period.open) continue;

    const dayName = DAY_FR[period.open.day];
    if (!dayName) continue;

    const openTime  = period.open.time
      ? `${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`
      : null;
    const closeTime = period.close?.time
      ? `${period.close.time.slice(0, 2)}:${period.close.time.slice(2)}`
      : null;

    if (openTime) {
      hours[dayName] = { open: openTime, close: closeTime || '23:59' };
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

// ── Déduit le quartier depuis l'adresse / les composants geocoding ────────────
const QUARTIER_RULES = [
  // Chaque règle : { quartier, keywords[] }
  // Les keywords sont testés en lowercase sur l'adresse complète
  { quartier: 'Capitole',        keywords: ['capitole', 'rue alsace', 'rue de la pomme', 'place du capitole', 'place wilson', 'rue saint-rome', 'rue des filatiers', 'rue de la dalbade', 'esquirol', '31000'] },
  { quartier: 'Carmes',          keywords: ['carmes', 'place des carmes', 'rue de la dalbade', 'rue ozenne', 'rue pargaminières', 'rue du languedoc'] },
  { quartier: 'Saint-Cyprien',   keywords: ['saint-cyprien', 'st-cyprien', 'rive gauche', 'allées charles de fitte', 'rue de la république', 'allées paul feuga', '31300'] },
  { quartier: 'Arnaud-Bernard',  keywords: ['arnaud-bernard', 'arnaud bernard', 'rue du taur', 'place arnaud', 'rue des lois', 'boulevard bonrepos'] },
  { quartier: 'Saint-Aubin',     keywords: ['saint-aubin', 'st-aubin', 'place saint-aubin', 'rue saint-aubin', 'boulevard de strasbourg'] },
  { quartier: 'Wilson',          keywords: ['place wilson', 'boulevard de strasbourg', 'rue de metz', 'allées jean jaurès', 'allées jean-jaurès'] },
  { quartier: 'Compans',         keywords: ['compans', 'caffarelli', 'boulevard lascrosses', 'place dupuy'] },
  { quartier: 'Minimes',         keywords: ['minimes', 'route de launaguet', 'avenue de grande bretagne', '31200'] },
];

function guessQuartierFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const rule of QUARTIER_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.quartier;
  }
  return null;
}

// Extrait le sous-quartier depuis les composants Google Geocoding
function quartierFromComponents(components) {
  if (!components) return null;
  const types = ['neighborhood', 'sublocality_level_1', 'sublocality'];
  for (const t of types) {
    const comp = components.find(c => c.types.includes(t));
    if (comp) {
      const name = comp.long_name;
      const guess = guessQuartierFromText(name);
      if (guess) return guess;
    }
  }
  return null;
}

// ── Stat counters ─────────────────────────────────────────────────────────────
const stats = { processed: 0, hoursSet: 0, quartierSet: 0, placeIdSet: 0, skipped: 0, errors: 0 };

// ── Traitement d'un spot ──────────────────────────────────────────────────────
async function enrichSpot(spot) {
  const updates = {};
  let placeId = spot.place_id || null;
  let label = `"${spot.name}"`;

  // 1. Résoudre le place_id si manquant (nécessaire pour les horaires)
  if (!placeId && !ONLY_QUARTIER) {
    await sleep(DELAY_MS);
    placeId = await findPlaceId(spot.name, spot.address);
    if (placeId) {
      console.log(`  🔍 place_id trouvé : ${placeId}`);
      updates.place_id = placeId;
      stats.placeIdSet++;
    } else {
      console.log(`  ⚠️  ${label} — place_id introuvable`);
    }
  }

  // 2. Horaires (via Places Details)
  if (!ONLY_QUARTIER) {
    const needsHours = !spot.hours || Object.keys(spot.hours).length === 0;
    if (needsHours && placeId) {
      await sleep(DELAY_MS);
      const details = await getPlaceDetails(placeId);
      if (details?.opening_hours) {
        const hours = parseGoogleHours(details.opening_hours);
        if (hours) {
          console.log(`  🕐 Horaires : ${Object.keys(hours).join(', ')}`);
          updates.hours = hours;
          stats.hoursSet++;
        } else {
          console.log(`  ⚠️  ${label} — horaires vides dans Places API`);
        }
      } else {
        console.log(`  ⚠️  ${label} — pas d'horaires dans Places API`);
      }
    } else if (!needsHours) {
      console.log(`  ✅ Horaires déjà présents — ignoré`);
    }
  }

  // 3. Quartier
  if (!ONLY_HOURS) {
    const needsQuartier = !spot.quartier || spot.quartier === 'Autre' || spot.quartier === '';
    if (needsQuartier) {
      // Tentative 1 : depuis l'adresse en base
      let quartier = guessQuartierFromText(spot.address);

      // Tentative 2 : reverse geocoding sur lat/lng
      if (!quartier && spot.lat && spot.lng) {
        await sleep(DELAY_MS);
        const geoResult = await reverseGeocode(spot.lat, spot.lng);
        if (geoResult) {
          quartier = quartierFromComponents(geoResult.address_components)
                  || guessQuartierFromText(geoResult.formatted_address);
        }
      }

      if (quartier) {
        console.log(`  📍 Quartier : ${quartier}`);
        updates.quartier = quartier;
        stats.quartierSet++;
      } else {
        console.log(`  ⚠️  ${label} — quartier non déductible`);
      }
    } else {
      console.log(`  ✅ Quartier "${spot.quartier}" déjà présent — ignoré`);
    }
  }

  // 4. Écriture Supabase
  if (Object.keys(updates).length === 0) {
    console.log(`  ─ Rien à mettre à jour`);
    stats.skipped++;
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] update:`, JSON.stringify(updates, null, 2).split('\n').join('\n  '));
  } else {
    const { error } = await supabase.from('spots').update(updates).eq('id', spot.id);
    if (error) {
      console.error(`  ❌ Erreur Supabase : ${error.message}`);
      stats.errors++;
    } else {
      console.log(`  💾 Sauvegardé`);
    }
  }

  stats.processed++;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 SpotTLS — Enrichissement des spots');
  console.log(`   Mode : ${DRY_RUN ? '🔍 dry-run (pas d\'écriture)' : '✍️  écriture Supabase'}`);
  if (ONLY_HOURS)    console.log('   Filtre : horaires seulement');
  if (ONLY_QUARTIER) console.log('   Filtre : quartiers seulement');
  if (LIMIT !== Infinity) console.log(`   Limite : ${LIMIT} spots`);
  console.log('');

  // Charger les spots
  const { data: spots, error } = await supabase
    .from('spots')
    .select('id, name, address, lat, lng, place_id, hours, quartier');

  if (error) { console.error('❌ Supabase fetch:', error.message); process.exit(1); }
  console.log(`📍 ${spots.length} spots chargés depuis Supabase\n`);

  const toProcess = spots.slice(0, LIMIT);

  for (let i = 0; i < toProcess.length; i++) {
    const spot = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${spot.name}`);
    try {
      await enrichSpot(spot);
    } catch (e) {
      console.error(`  ❌ Erreur inattendue : ${e.message}`);
      stats.errors++;
    }
    console.log('');
  }

  // Résumé
  console.log('─'.repeat(48));
  console.log('✅ Terminé !');
  console.log(`   Spots traités     : ${stats.processed}`);
  console.log(`   Horaires ajoutés  : ${stats.hoursSet}`);
  console.log(`   Quartiers déduits : ${stats.quartierSet}`);
  console.log(`   Place IDs trouvés : ${stats.placeIdSet}`);
  console.log(`   Rien à faire      : ${stats.skipped}`);
  console.log(`   Erreurs           : ${stats.errors}`);
  if (DRY_RUN) console.log('\nℹ️  Mode --dry-run : aucune donnée écrite.');
}

main().catch(e => { console.error(e); process.exit(1); });
