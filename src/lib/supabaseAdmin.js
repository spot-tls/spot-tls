import { createClient } from '@supabase/supabase-js';

// ⚠️ Clé service_role retirée le 2026-06-01 (avait fuité sur GitHub → révoquée, renvoie 401).
// Client temporaire en clé PUBLIQUE : évite de casser les imports (storage, etc.),
// mais ne bypass PAS RLS. Les vraies écritures admin doivent passer par une route
// serveur /api/admin (pattern x-admin-secret comme api/push) — chantier à venir.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseAdmin = createClient(supabaseUrl, PUBLIC_KEY);

export async function deleteSpot(id) {
  const { error } = await supabaseAdmin.from('spots').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSpotCoords(id, lat, lng) {
  const { error } = await supabaseAdmin.from('spots').update({ lat, lng }).eq('id', id);
  if (error) throw error;
}

export async function updateSpot(id, data) {
  const { error } = await supabaseAdmin.from('spots').update(data).eq('id', id);
  if (error) throw error;
}

export async function createEvent(eventData) {
  const { error } = await supabaseAdmin.from('events').insert([eventData]);
  if (error) throw error;
}

export async function updateEvent(id, eventData) {
  const { error } = await supabaseAdmin.from('events').update(eventData).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id) {
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) throw error;
}
