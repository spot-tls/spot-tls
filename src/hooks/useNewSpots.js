import { useState, useCallback } from 'react';

const KEY = 'spotfr_newspots_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function persist(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
}

export function useNewSpots() {
  const [newSpots, setNewSpots] = useState(load);

  const addSpot = useCallback((spot) => {
    const entry = {
      ...spot,
      id: 'new_' + Date.now(),
      _isNew: true,
    };
    setNewSpots((prev) => {
      const next = [entry, ...prev];
      persist(next);
      return next;
    });
    return entry;
  }, []);

  const removeNewSpot = useCallback((id) => {
    setNewSpots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { newSpots, addSpot, removeNewSpot };
}
