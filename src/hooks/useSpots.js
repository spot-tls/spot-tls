import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import spotsData from '../data/spots.json';

// Tente de charger les spots depuis Supabase.
// Si Supabase est indisponible (env manquant, réseau...), bascule sur spots.json local.
export function useSpots() {
  const [spots, setSpots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function loadSpots() {
      try {
        const { data, error: sbError } = await supabase
          .from('spots')
          .select('*');

        if (sbError) throw sbError;

        const valid = (data || []).filter(
          (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
            && !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
        );

        if (valid.length === 0) throw new Error('Supabase vide — bascule locale.');
        setSpots(valid);
      } catch (e) {
        // Fallback : données locales packagées au build
        console.warn('[useSpots] Supabase indisponible, données locales utilisées :', e.message);
        const valid = spotsData.filter(
          (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
            && !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
        );
        if (valid.length === 0) {
          setError('Aucun spot disponible pour le moment.');
        } else {
          setSpots(valid);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSpots();
  }, []);

  return { spots, loading, error };
}
