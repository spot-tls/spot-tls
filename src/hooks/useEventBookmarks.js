import { useState } from 'react';

const KEY = 'spottls_event_bookmarks';
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function useEventBookmarks() {
  const [ids, setIds] = useState(load);

  const toggle = (id) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const isBookmarked = (id) => ids.includes(id);
  return { ids, toggle, isBookmarked };
}
