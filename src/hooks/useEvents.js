import { useMemo, useState } from 'react';
import eventsData from '../data/events.json';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date;
}

function isTonight(dateStr) {
  const d = parseDate(dateStr);
  return d.toDateString() === TODAY.toDateString();
}

function isWeekend(dateStr) {
  const d = parseDate(dateStr);
  const day = d.getDay(); // 0=Sun 6=Sat
  return day === 5 || day === 6 || day === 0;
}

function isThisWeek(dateStr) {
  const d = parseDate(dateStr);
  const diffMs = d - TODAY;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 7;
}

export function useEvents() {
  const [filter, setFilter] = useState('all'); // 'all' | 'tonight' | 'weekend' | 'week'

  const events = useMemo(() => {
    return eventsData
      .filter((e) => parseDate(e.date) >= TODAY)
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'tonight') return events.filter((e) => isTonight(e.date));
    if (filter === 'weekend') return events.filter((e) => isWeekend(e.date));
    if (filter === 'week')    return events.filter((e) => isThisWeek(e.date));
    return events;
  }, [events, filter]);

  return { events: filtered, allEvents: events, filter, setFilter };
}
