import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:mfarigoulle@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const { title = 'SpotTLS 🔥', body = 'Ce soir à Toulouse — voir les events du soir !', url = '/' } = req.body || {};

  const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const payload = JSON.stringify({ title, body, url });
  let sent = 0, failed = 0;

  await Promise.all(subs.map(async ({ subscription }) => {
    try {
      await webpush.sendNotification(JSON.parse(subscription), payload);
      sent++;
    } catch (e) {
      failed++;
      if (e.statusCode === 410) {
        // Subscription expired — clean up
        const sub = JSON.parse(subscription);
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }));

  res.status(200).json({ sent, failed });
}
