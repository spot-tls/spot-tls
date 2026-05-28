import { useEffect, useState } from 'react';
import spotsData from '../data/spots.json';

// Spots are bundled at build time from data/spots.json.
// The hook keeps the async-loading shape so the UI can show a loading state
// and so a remote source could be swapped in later without touching callers.
export function useSpots() {
  const [spots, setSpots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    try {
      const valid = spotsData.filter(
        (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
          && !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
      );
      setSpots(valid);
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Données introuvables');
      setLoading(false);
    }
  }, []);

  return { spots, loading, error };
}
