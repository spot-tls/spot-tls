import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueHVld3RhdWlkaXdydnhqYnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk1NzU2NCwiZXhwIjoyMDk1NTMzNTY0fQ.AJOaH27t9WHab6OILnHf-wUklLN5KHQux7erMhQSoRM';

export const supabaseAdmin = createClient(supabaseUrl, SERVICE_KEY);

export async function deleteSpot(id) {
  const { error } = await supabaseAdmin.from('spots').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSpotCoords(id, lat, lng) {
  const { error } = await supabaseAdmin.from('spots').update({ lat, lng }).eq('id', id);
  if (error) throw error;
}
