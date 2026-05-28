/**
 * useSpotEdits — overrides de spots sauvegardées en localStorage.
 * Les champs édités sont mergés par-dessus les données de base dans App.jsx.
 */
import { useState, useCallback } from 'react';

const EDITS_KEY = 'spotfr_edits_v1';

function loadEdits() {
  try { return JSON.parse(localStorage.getItem(EDITS_KEY) || '{}'); } catch { return {}; }
}
function persistEdits(edits) {
  try { localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); } catch {}
}

export function useSpotEdits() {
  const [edits, setEdits] = useState(loadEdits);

  /** Sauvegarde des champs édités pour un spot donné */
  const saveEdit = useCallback((spotId, fields) => {
    setEdits((prev) => {
      const next = { ...prev, [spotId]: { ...(prev[spotId] || {}), ...fields } };
      persistEdits(next);
      return next;
    });
  }, []);

  /** Retourne les overrides d'un spot */
  const getEdits = useCallback((spotId) => edits[spotId] || {}, [edits]);

  /** Nombre de spots édités */
  const editCount = Object.keys(edits).length;

  /** Export JSON — merge base + overrides → télécharge spots_updated.json */
  const exportJson = useCallback((baseSpots) => {
    const merged = baseSpots.map((s) => ({ ...s, ...(edits[s.id] || {}) }));
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spots_updated.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [edits]);

  return { edits, saveEdit, getEdits, editCount, exportJson };
}
