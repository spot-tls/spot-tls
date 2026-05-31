/**
 * sync-google-photos.js
 *
 * Récupère les photos Google Places pour tous les spots Supabase
 * qui ont photos[] vide, et les stocke dans photos[].
 *
 * Usage :
 *   GOOGLE_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/sync-google-photos.js
 *
 * Ou créer un fichier .env.local à la racine :
 *   GOOGLE_API_KEY=AIza...
 *   SUPABASE_URL=https://nnxuewtauidiwrvxjbtr.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...
 *
 * NOTE : si la colonne place_id n'existe pas encore dans la table spots,
 * exécuter d'abord dans Supabase SQL Editor :
 *   ALTER TABLE spots ADD COLUMN IF NOT EXISTS place_id TEXT;
 *
 * Ensuite peupler place_id manuellement ou via :
 *   node scripts/sync-google-photos.js --find-place-ids
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { config } from 'dotenv';

// Charge .env.local si présent
config({ path: '.env.local' });

const GOOGLE_API_KEY   = process.env.GOOGLE_API_KEY;
const SUPABASE_URL     = process.env.SUPABASE_URL     || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const MAX_PHOTOS       = 5;    // photos par spot
const PHOTO_MAX_WIDTH  = 1200; // px
const DRY_RUN          = process.argv.includes('--dry-run');
const FIND_IDS_MODE    = process.argv.includes('--find-place-ids');

if (!GOOGLE_API_KEY) { console.error('❌ GOOGLE_API_KEY manquant'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_KEY manquants'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

// Recherche le place_id Google via Text Search (nom + "Toulouse")
async function findPlaceId(spotName, address) {
  const query  = encodeURIComponent(`${spotName} ${address || 'Toulouse'}`);
  const url    = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`
               + `?input=${query}&inputtype=textquery&fields=place_id,name`
               + `&locationbias=circle:5000@43.6047,1.4442&key=${GOOGLE_API_KEY}`;
  const res    = await get(url);
  return res.candidates?.[0]?.place_id || null;
}

// Récupère les photo_references d'un place_id
async function getPlacePhotos(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`
            + `?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`;
  const res = await get(url);
  return res.result?.photos || [];
}

// Construit l'URL publique d'une photo Google
function photoUrl(photoRef) {
  return `https://maps.googleapis.com/maps/api/place/photo`
       + `?maxwidth=${PHOTO_MAX_WIDTH}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
}

// Résout l'URL finale d'une photo Google (redirect → vraie URL CDN)
function resolvePhotoUrl(photoRef) {
  return new Promise((resolve) => {
    const url = photoUrl(photoRef);
    https.get(url, (res) => {
      // Google renvoie un 302 vers l'URL réelle
      resolve(res.headers.location || url);
      res.destroy();
    }).on('error', () => resolve(url));
  });
}

async function main() {
  console.log(`🔍 Chargement des spots Supabase…`);
  const { data: spots, error } = await supabase.from('spots').select('id, name, address, place_id, photos');
  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  console.log(`📍 ${spots.length} spots chargés`);

  if (FIND_IDS_MODE) {
    // Mode : cherche et stocke les place_id manquants
    const toFind = spots.filter(s => !s.place_id);
    console.log(`🔎 ${toFind.length} spots sans place_id — recherche en cours…`);
    for (const spot of toFind) {
      await sleep(200); // évite rate limit Google
      const pid = await findPlaceId(spot.name, spot.address);
      if (pid) {
        console.log(`  ✅ ${spot.name} → ${pid}`);
        if (!DRY_RUN) {
          await supabase.from('spots').update({ place_id: pid }).eq('id', spot.id);
        }
      } else {
        console.log(`  ⚠️  ${spot.name} → non trouvé`);
      }
    }
    console.log('✅ Recherche place_id terminée.');
    return;
  }

  // Mode principal : sync photos pour spots sans photos[]
  const toSync = spots.filter(s => !s.photos || s.photos.length === 0);
  console.log(`📸 ${toSync.length} spots sans photos à synchroniser`);

  let updated = 0;
  let skipped = 0;

  for (const spot of toSync) {
    await sleep(300);

    let placeId = spot.place_id;

    // Pas de place_id → on cherche
    if (!placeId) {
      console.log(`  🔎 Recherche place_id pour "${spot.name}"…`);
      placeId = await findPlaceId(spot.name, spot.address);
      if (!placeId) {
        console.log(`  ⚠️  "${spot.name}" non trouvé sur Google Places — ignoré`);
        skipped++;
        continue;
      }
      if (!DRY_RUN) {
        await supabase.from('spots').update({ place_id: placeId }).eq('id', spot.id);
      }
    }

    // Récupère les photos
    const googlePhotos = await getPlacePhotos(placeId);
    if (!googlePhotos.length) {
      console.log(`  ⚠️  "${spot.name}" — aucune photo Google`);
      skipped++;
      continue;
    }

    // Résout les URLs CDN réelles
    const photoRefs = googlePhotos.slice(0, MAX_PHOTOS).map(p => p.photo_reference);
    const urls      = await Promise.all(photoRefs.map(resolvePhotoUrl));

    console.log(`  ✅ "${spot.name}" — ${urls.length} photos`);

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from('spots')
        .update({ photos: urls })
        .eq('id', spot.id);
      if (upErr) console.error(`     ❌ Update error:`, upErr.message);
      else updated++;
    } else {
      console.log(`     [dry-run] photos:`, urls.map(u => u.slice(0, 80) + '…'));
      updated++;
    }
  }

  console.log(`\n🎉 Terminé : ${updated} spots mis à jour, ${skipped} ignorés.`);
  if (DRY_RUN) console.log('ℹ️  Mode --dry-run : aucune écriture Supabase.');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(e => { console.error(e); process.exit(1); });
