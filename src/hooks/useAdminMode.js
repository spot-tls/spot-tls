import { useState, useCallback } from 'react';

const KEY = 'spotfr_admin_v1';
const SECRET_TAPS = 5;

export function useAdminMode() {
  const [admin, setAdmin] = useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const [tapCount, setTapCount] = useState(0);

  // Secret: tap the logo 5x to toggle admin
  const handleSecretTap = useCallback(() => {
    setTapCount((n) => {
      const next = n + 1;
      if (next >= SECRET_TAPS) {
        setAdmin((prev) => {
          const val = !prev;
          try { localStorage.setItem(KEY, val ? '1' : '0'); } catch {}
          return val;
        });
        return 0;
      }
      return next;
    });
  }, []);

  return { admin, handleSecretTap };
}
