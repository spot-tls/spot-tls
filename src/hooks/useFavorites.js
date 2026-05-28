import { useCallback, useEffect, useState } from 'react';

const KEY = 'spotfr_favorites';

function read() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return new Set(); }
}

export function useFavorites() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch {}
  }, [ids]);

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  const toggleFavorite = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return { favoriteIds: ids, isFavorite, toggleFavorite, count: ids.size };
}
