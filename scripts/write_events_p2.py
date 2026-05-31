import os
root = r'C:\Users\basti\Google Drive\marketing\SPOT cabau lesavre\Mise en route\APP\spot-app-v2\src'

# ── 4. EventsView.jsx ─────────────────────────────────────────────────────────
events_view_jsx = """\
import { createPortal } from 'react-dom';
import { useState, useMemo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import AdminEventForm from '../AdminEventForm/AdminEventForm';
import EventDetail from '../EventDetail/EventDetail';
import './EventsView.css';

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

const CAT_CONFIG = {
  'all':        { label: 'Tous',       emoji: '🗓️', color: '#EC4899' },
  'DJ Set':     { label: 'DJ Set',     emoji: '🎛️', color: '#A78BFA' },
  'Concert':    { label: 'Concert',    emoji: '🎤', color: '#FB7185' },
  'Happy Hour': { label: 'Happy Hour', emoji: '🍹', color: '#06B6D4' },
  'Soirée':     { label: 'Soirée',     emoji: '🎉', color: '#EC4899' },
  'Brunch':     { label: 'Brunch',     emoji: '☕', color: '#4ade80' },
  'Expo':       { label: 'Expo',       emoji: '🎭', color: '#FBBF24' },
  'Afterwork':  { label: 'Afterwork',  emoji: '🍸', color: '#F59E0B' },
};
function getCat(key) { return CAT_CONFIG[key] ?? { label: key, emoji: '📅', color: '#A78BFA' }; }

// ── Cartes ────────────────────────────────────────────────────────────────────
function FeaturedCard({ event, spots, onClick }) {
  const cat = getCat(event.category);
  const bg  = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : 'linear-gradient(160deg,#1a1035,#2d1052,#3b0764)';
  const linked = event.spot_id ? spots.find(s => String(s.id) === String(event.spot_id)) : null;

  return (
    <button className="ev2-featured" style={{ background: bg }} onClick={onClick}>
      <div className="ev2-featured-overlay">
        <div className="ev2-featured-top">
          <span className="ev2-cat-chip" style={{ color: cat.color, background: cat.color + '22' }}>
            {cat.emoji} {event.category}
          </span>
          <span className="ev2-featured-star">✨ À la une</span>
        </div>
        <div className="ev2-featured-body">
          <div className="ev2-featured-title">{event.title}</div>
          <div className="ev2-featured-meta">
            <span>📍 {event.spot_name}</span>
            {event.quartier && <><span className="ev2-dot">·</span><span>{event.quartier}</span></>}
            <span className="ev2-dot">·</span>
            <span style={{ color: cat.color, fontWeight: 600 }}>{event.time_start}</span>
          </div>
          {linked && <span className="ev2-spot-chip">🏠 {linked.name}</span>}
          {event.price_detail && <span className="ev2-price-pill">{event.price_detail}</span>}
        </div>
      </div>
    </button>
  );
}

function EventCard({ event, spots, onClick }) {
  const cat    = getCat(event.category);
  const linked = event.spot_id ? spots.find(s => String(s.id) === String(event.spot_id)) : null;
  return (
    <button className="ev2-card" onClick={onClick}>
      <div className="ev2-card-thumb" style={{
        background: event.photo_url ? `url(${event.photo_url}) center/cover` : cat.color + '22'
      }}>
        {!event.photo_url && <span className="ev2-card-thumb-emoji">{cat.emoji}</span>}
      </div>
      <div className="ev2-card-body">
        <div className="ev2-card-top">
          <span className="ev2-cat-chip small" style={{ color: cat.color, background: cat.color + '18' }}>
            {cat.emoji} {event.category}
          </span>
          <span className="ev2-card-time">{event.time_start}</span>
        </div>
        <div className="ev2-card-title">{event.title}</div>
        <div className="ev2-card-spot">
          📍 {event.spot_name}{event.quartier ? ` · ${event.quartier}` : ''}
        </div>
        {linked && <div className="ev2-card-spot-link">🏠 {linked.name}</div>}
        {event.price_detail && <div className="ev2-card-price">{event.price_detail}</div>}
      </div>
      <span className="ev2-card-chevron">›</span>
    </button>
  );
}

// ── Filtre rapide ─────────────────────────────────────────────────────────────
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function getWeekendDates() {
  const d = new Date();
  const dow = d.getDay();
  const sat = new Date(d); sat.setDate(d.getDate() + ((6 - dow + 7) % 7 || 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return [sat.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

function getWeekDates() {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EventsView({ onClose, admin, spots = [] }) {
  const {
    events, allEvents, weekDays, activeDay, setActiveDay,
    activeCategory, setActiveCategory, categories, hasDayEvents,
  } = useEvents();

  const [editingEvent,   setEditingEvent]   = useState(null);
  const [selectedEvent,  setSelectedEvent]  = useState(null);
  const [selectedSpot,   setSelectedSpot]   = useState(null);
  const [timeFilter,     setTimeFilter]     = useState('day'); // 'day' | 'tonight' | 'weekend' | 'week'

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Events filtrés selon le mode temps
  const displayEvents = useMemo(() => {
    const catOk = e => activeCategory === 'all' || e.category === activeCategory;
    if (timeFilter === 'tonight') {
      return allEvents.filter(e => e.date === TODAY_ISO && catOk(e));
    }
    if (timeFilter === 'weekend') {
      const wDates = getWeekendDates();
      return allEvents.filter(e => wDates.includes(e.date) && catOk(e));
    }
    if (timeFilter === 'week') {
      const wDates = getWeekDates();
      return allEvents.filter(e => wDates.includes(e.date) && catOk(e));
    }
    // 'day' mode → utilise activeDay (comportement existant)
    return events;
  }, [timeFilter, allEvents, events, activeCategory]);

  const featured = displayEvents.find(e => e.featured);
  const others   = displayEvents.filter(e => e !== featured);

  const TIME_FILTERS = [
    { key: 'tonight', label: 'Ce soir' },
    { key: 'weekend', label: 'Weekend' },
    { key: 'week',    label: 'Semaine' },
    { key: 'day',     label: 'Par jour' },
  ];

  return createPortal(
    <div className="ev2-overlay" onClick={onClose}>
      <div className="ev2-panel" onClick={e => e.stopPropagation()}>
        <div className="ev2-handle" />

        {/* Header */}
        <div className="ev2-header">
          <div className="ev2-header-left">
            <div className="ev2-title">Agenda Toulouse</div>
            <div className="ev2-sub">
              {timeFilter === 'day' ? 'Sélectionne un jour' : TIME_FILTERS.find(t => t.key === timeFilter)?.label}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {admin && (
              <button className="ev2-admin-add" onClick={() => setEditingEvent({})}>➕</button>
            )}
            <button className="ev2-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Filtre rapide */}
        <div className="ev2-time-filters">
          {TIME_FILTERS.map(t => (
            <button
              key={t.key}
              className={`ev2-time-btn${timeFilter === t.key ? ' active' : ''}`}
              onClick={() => setTimeFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Week strip — visible seulement en mode 'day' */}
        {timeFilter === 'day' && (
          <div className="ev2-week">
            {weekDays.map(day => {
              const iso      = day.toISOString().slice(0, 10);
              const isToday  = day.toDateString() === today.toDateString();
              const isActive = iso === activeDay;
              const hasEvs   = hasDayEvents[iso];
              return (
                <button
                  key={iso}
                  className={`ev2-day-btn${isActive ? ' active' : ''}${isToday ? ' today' : ''}`}
                  onClick={() => setActiveDay(iso)}
                >
                  <span className="ev2-day-label">{DAY_LABELS[day.getDay()]}</span>
                  <span className="ev2-day-num">{day.getDate()}</span>
                  {hasEvs && <span className="ev2-day-dot" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Category filters */}
        <div className="ev2-cats">
          {categories.map(cat => {
            const cfg      = getCat(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                className={`ev2-cat-btn${isActive ? ' active' : ''}`}
                style={isActive ? { background: cfg.color, color: '#fff', borderColor: cfg.color } : {}}
                onClick={() => setActiveCategory(cat)}
              >
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="ev2-body">
          {displayEvents.length === 0 ? (
            <div className="ev2-empty">
              <div className="ev2-empty-icon">📭</div>
              <div className="ev2-empty-text">Pas d'événements</div>
              <div className="ev2-empty-sub">Essaie une autre période ou catégorie</div>
            </div>
          ) : (
            <>
              {featured && (
                <div style={{ position: 'relative' }}>
                  <FeaturedCard event={featured} spots={spots} onClick={() => setSelectedEvent(featured)} />
                  {admin && (
                    <button className="ev2-edit-btn" onClick={e => { e.stopPropagation(); setEditingEvent(featured); }}>✏️</button>
                  )}
                </div>
              )}
              {others.map(e => (
                <div key={e.id} style={{ position: 'relative' }}>
                  <EventCard event={e} spots={spots} onClick={() => setSelectedEvent(e)} />
                  {admin && (
                    <button className="ev2-edit-btn" onClick={ev => { ev.stopPropagation(); setEditingEvent(e); }}>✏️</button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* EventDetail modal */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          spots={spots}
          onOpenSpot={spot => { setSelectedEvent(null); setSelectedSpot(spot); }}
        />
      )}

      {/* Admin form */}
      {editingEvent !== null && (
        <AdminEventForm
          event={Object.keys(editingEvent).length ? editingEvent : null}
          spots={spots}
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); window.location.reload(); }}
          onDeleted={() => { setEditingEvent(null); window.location.reload(); }}
        />
      )}
    </div>,
    document.body
  );
}
"""
with open(os.path.join(root, 'components', 'EventsView', 'EventsView.jsx'), 'w', encoding='utf-8') as f:
    f.write(events_view_jsx)
print(f"EventsView.jsx written ({len(events_view_jsx.splitlines())} lines)")
