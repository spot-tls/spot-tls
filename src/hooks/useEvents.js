import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import eventsData from '../data/events.json';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date) {
  return date.toISOString().slice(0, 10);
}

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function useEvents() {
  const [allEvents, setAllEvents] = useState([]);
  const [activeDay,  setActiveDay]  = useState(dateToIso(TODAY));
  const [activeCategory, setActiveCategory] = useState('all');
  const weekDays = useMemo(() => getWeekDays(), []);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .gte('date', dateToIso(TODAY))
          .order('date', { ascending: true })
          .order('time_start', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          setAllEvents(data);
        } else {
          throw new Error('Supabase events vide');
        }
      } catch (e) {
        console.warn('[useEvents] fallback local:', e.message);
        const valid = eventsData.filter(e => parseDate(e.date) >= TODAY);
        valid.sort((a, b) => parseDate(a.date) - parseDate(b.date));
        setAllEvents(valid);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      const matchDay = e.date === activeDay;
      const matchCat = activeCategory === 'all' || e.category === activeCategory;
      return matchDay && matchCat;
    });
  }, [allEvents, activeDay, activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(allEvents.map(e => e.category).filter(Boolean));
    return ['all', ...cats];
  }, [allEvents]);

  const hasDayEvents = useMemo(() => {
    const map = {};
    allEvents.forEach(e => { map[e.date] = true; });
    return map;
  }, [allEvents]);

  return {
    events: filtered,
    allEvents,
    weekDays,
    activeDay,
    setActiveDay,
    activeCategory,
    setActiveCategory,
    categories,
    hasDayEvents,
  };
}
