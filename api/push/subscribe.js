import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const subscription = req.body;
    const endpoint = subscription.endpoint;

    await supabase.from('push_subscriptions').upsert(
      { endpoint, subscription: JSON.stringify(subscription) },
      { onConflict: 'endpoint' }
    );

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
