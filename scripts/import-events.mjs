#!/usr/bin/env node
/**
 * import-events.mjs — Importe scraped-events.json dans Supabase
 *
 * USAGE :
 *   node scripts/import-events.mjs              (import reel)
 *   node scripts/import-events.mjs --dry-run    (apercu sans ecrire)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync }  from 'fs';

// Clés lues depuis .env.local (jamais hardcodées dans le repo)
function loadEnv() {
  const env = {};
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const i = t.indexOf('=');
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  }
  return env;
}
const ENV = loadEnv();

const SUPABASE_URL = ENV.VITE_SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const raw    = JSON.parse(readFileSync('scripts/scraped-events.json', 'utf8'));
const events = raw.events;

console.log(events.length + ' events a importer' + (DRY_RUN ? ' (DRY RUN — rien ecrit)' : '') + '...\n');

if (DRY_RUN) {
  events.forEach(e => {
    const date  = e.date  || '?';
    const title = (e.title || '').slice(0, 50);
    const cat   = e.category || '?';
    const venue = e.spot_name || '';
    console.log('[' + date + '] ' + title + (venue ? ' @ ' + venue : '') + ' [' + cat + ']');
  });
  console.log('\nTotal : ' + events.length + ' events');
  process.exit(0);
}

// Colonnes qui existent dans la table Supabase
const toInsert = events.map(e => ({
  title:        e.title,
  date:         e.date,
  time_start:   e.time_start   || null,
  category:     e.category,
  description:  e.description  || null,
  spot_name:    e.spot_name    || null,
  quartier:     e.quartier     || null,
  photo_url:    e.photo_url    || null,
  featured:     e.featured     ?? false,
  link:         e.link         || null,
  price_detail: e.price_detail || null,
  source_id:    e.source_id    || null,
}));

// Upsert par source_id pour eviter les doublons a chaque re-scrape
const { error } = await supabase
  .from('events')
  .upsert(toInsert, { onConflict: 'source_id', ignoreDuplicates: true });

if (error) {
  // Si source_id n'existe pas encore, on fait un insert simple
  if (error.message.includes('source_id')) {
    console.log('Colonne source_id absente — insert simple...');
    const { error: err2 } = await supabase.from('events').insert(toInsert);
    if (err2) { console.error('Erreur :', err2.message); process.exit(1); }
  } else {
    console.error('Erreur Supabase :', error.message);
    process.exit(1);
  }
}

console.log('OK - ' + toInsert.length + ' events importes dans Supabase !');
