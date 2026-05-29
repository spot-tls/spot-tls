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
          throw new Error('Supabas