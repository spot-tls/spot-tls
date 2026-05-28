import { useState } from 'react';

// On-demand geolocation. Call locate() (e.g. from a button) to request the
// browser permission and store the user's position.
export function useGeolocation() {
  const [position, setPosition] = useState(null); // { lat, lng }
  const [status, setStatus]     = useState('idle'); // idle | loading | ready | denied | error

  const locate = () => {
    if (!('geolocation' in navigator)) { setStatus('error'); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ready');
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clear = () => { setPosition(null); setStatus('idle'); };

  return { position, status, locate, clear };
}
