import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [status, setStatus]   = useState('idle'); // idle | loading | granted | denied | unsupported
  const [swReg,  setSwReg]    = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        setSwReg(reg);
        if (Notification.permission === 'granted') setStatus('granted');
        else if (Notification.permission === 'denied') setStatus('denied');
      })
      .catch(() => setStatus('unsupported'));
  }, []);

  const subscribe = async () => {
    if (!swReg || !VAPID_PUBLIC_KEY) return;
    setStatus('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return; }

      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      setStatus('granted');
    } catch (e) {
      console.error('Push subscribe error:', e);
      setStatus('idle');
    }
  };

  return { status, subscribe };
}
