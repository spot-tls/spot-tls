import { createPortal } from 'react-dom';
import { useState, useMemo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import AdminEventForm from '../AdminEventForm/AdminEventForm';
import EventDetail from '../EventDetail/EventDetail';
import './EventsView.css';

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

const CAT_CONFIG = {
  'all':        { label: 'Tous',       emoji: '🗓️', color: '#EC4899', gradient: 'linear-gradient(135deg,#1a0a1a,#831843,#EC4899)' },
  'DJ Set':     { label: 'DJ Set',     emoji: '🎛️', color: '#A78BFA', gradient: 'linear-gradient(135deg,#0f0f1a,#4c1d95,#A78BFA)' },
  'Concert':    { label: 'Concert',    emoji: '🎤', color: '#FB7185', gradient: 'linear-gradient(135deg,#1a0a2e,#6B21A8,#FB7185)' },
  'Happy Hour': { label: 'Happy Hour', emoji: '🍹', color: '#06B6D4', gradient: 'linear-gradient(135deg,#0a1520,#0e4b62,#06B6D4)' },
  'Soirée':     { label: 'Soirée',     emoji: '🎉', color: '#F472B6', gradient: 'linear-gradient(135deg,#1a0a1a,#9d174d,#F472B6)' },
  'Brunch':     { label: 'Brunch',     emoji: '☕', color: '#10B981', gradient: 'linear-gradient(135deg,#0a1f0f,#065f46,#10B981)' },
  'Expo':       { label: 'Expo',       emoji: '🎭', color: '#FBBF24', gradient: 'linear-gradient(135deg,#1a150a,#78350f,#FBBF24)' },
  'Afterwork':  { label: 'Afterwork',  emoji: '🍸', color: '#F59E0B', gradient: 'linear-gradient(135deg,#1a100a,#7c2d12,#F59E0B)' },
};
function getCat(key) {
  return CAT_CONFIG[key] ?? { label: key, emoji: '📅', color: '#A78BFA', gradient: 'linear-gradient(135deg,#0f0f1a,#A78BFA)' };
}

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
    const d = new Date(); d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function FeaturedCard({ event, spots, onClick }) {
  const cat = getCat(event.category);
  const bg = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : cat.gradient;
  return (
    <button className="ev3-featured" style={{ background: bg }} onClick={onClick}>
      <div className="ev3-featured-overlay">
        <div className="ev3-featured-top">
          <span className="ev3-badge-cat" style={{ background: cat.color + '33', color: cat.color, borderColor: cat.color + '55' }}>
            {cat.emoji} {event.category}
          </span>
          <span className="ev3-badge-star">✨ À la une</span>
        </div>
        <div className="ev3-featured-body">
          <div className="ev3-featured-title">{event.title}</div>
          <div className="ev3-featured-row">
            <span className="ev3-badge-time">{event.time_start}</span>
            <span className="ev3-featured-venue">📍 {event.spot_name || event.venue}</span>
          </div>
          {event.price_detail && <span className="ev3-badge-price">{event.price_detail}</span>}
        </div>
      </div>
    </button>
  );
}

function EventCard({ event, onClick }) {
  const cat = getCat(event.category);
  const bg = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : cat.gradient;
  return (
    <button className="ev3-card" style={{ background: bg }} onClick={onClick}>
      <div className="ev3-card-overlay">
        <div className="ev3-card-top">
          <span className="ev3-badge-cat small" style={{ background: cat.color + '33', color: cat.color, borderColor: cat.color + '55' }}>
            {cat.emoji} {event.category}
          </span>
          <span className="ev3-badge-time small">{event.time_start}</span>
        </div>
        <div className="ev3-card-body">
          <div className="ev3-card-title">{event.title}</div>
          <div className="ev3-card-venue">📍 {event.spot_name || event.venue}{event.quartier ? ` · ${event.quartier}` : ''}</div>
        </div>
      </div>
    </button>
  );
}

function SectionHeader({ count, timeFilter }) {
  if (count === 0) return null;
  const map = {
    tonight: count === 1 ? '1 événement ce soir' : `${count} événements ce soir`,
    weekend: count === 1 ? '1 événement ce weekend' : `${count} événements ce weekend`,
    week:    count === 1 ? '1 événement cette semaine' : `${count} événements cette semaine`,
    day:     count === 1 ? '1 événement' : `${count} événements`,
  };
  return <div className="ev3-section-header">{map[timeFilter] ?? `${count} événements`}</div>;
}

function CatDrawer({ categories, active, onSelect, onClose }) {
  return (
    <div className="ev3-cat-drawer-backdrop" onClick={onClose}>
      <div className="ev3-cat-drawer" onClick={e => e.stopPropagation()}>
        <div className="ev3-cat-drawer-handle" />
        <div className="ev3-cat-drawer-title">Filtrer par catégorie</div>
        <div className="ev3-cat-drawer-grid">
          {categories.map(cat => {
            const cfg = getCat(cat);
            const isActive = active === cat;
            return (
              <button
                key={cat}
                className={`ev3-cat-drawer-btn${isActive ? ' active' : ''}`}
                style={isActive ? { background: cfg.gradient, borderColor: 'transparent' } : {}}
                onClick={() => { onSelect(cat); onClose(); }}
              >
                <span className="ev3-cat-drawer-emoji">{cfg.emoji}</span>
                <span className="ev3-cat-drawer-label" style={isActive ? { color: '#fff' } : {}}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TIME_FILTERS = [
  { key: 'tonight', label: 'Ce soir' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'week',    label: 'Semaine' },
  { key: 'day',     label: 'Par jour' },
];

export default function EventsView({ onClose, admin, spots = [] }) {
  const {
    events, allEvents, weekDays, activeDay, setActiveDay,
    activeCategory, setActiveCategory, categories, hasDayEvents,
  } = useEvents();

  const [editingEvent,  setEditingEvent]  = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timeFilter,    setTimeFilter]    = useState('tonight');
  const [showCatDrawer, setShowCatDrawer] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const displayEvents = useMemo(() => {
    const catOk = e => activeCategory === 'all' || e.category === activeCategory;
    if (timeFilter === 'tonight') return allEvents.filter(e => e.date === TODAY_ISO && catOk(e));
    if (timeFilter === 'weekend') { const wD = getWeekendDates(); return allEvents.filter(e => wD.includes(e.date) && catOk(e)); }
    if (timeFilter === 'week')    { const wD = getWeekDates();    return allEvents.filter(e => wD.includes(e.date) && catOk(e)); }
    return events;
  }, [timeFilter, allEvents, events, activeCategory]);

  const featured = displayEvents.find(e => e.featured);
  const others   = displayEvents.filter(e => e !== featured);

  return createPortal(
    <div className="ev3-overlay" onClick={onClose}>
      <div className="ev3-panel" onClick={e => e.stopPropagation()}>
        <div className="ev3-handle" />

        <div className="ev3-header">
          <div>
            <div className="ev3-title">Agenda Toulouse</div>
            <div className="ev3-sub">La nuit en direct</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {admin && <button className="ev3-admin-add" onClick={() => setEditingEvent({})}>➕</button>}
            <button className="ev3-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="ev3-filters-row">
          <div className="ev3-time-pills">
            {TIME_FILTERS.map(t => (
              <button
                key={t.key}
                className={`ev3-time-pill${timeFilter === t.key ? ' active' : ''}`}
                onClick={() => setTimeFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            className={`ev3-filter-icon${activeCategory !== 'all' ? ' has-filter' : ''}`}
            onClick={() => setShowCatDrawer(true)}
          >
            🎛️
          </button>
        </div>

        {timeFilter === 'day' && (
          <div className="ev3-week">
            {weekDays.map(day => {
              const iso     = day.toISOString().slice(0, 10);
              const isToday = day.toDateString() === today.toDateString();
              const isAct   = iso === activeDay;
              const hasEvs  = hasDayEvents[iso];
              return (
                <button
                  key={iso}
                  className={`ev3-day-btn${isAct ? ' active' : ''}${isToday ? ' today' : ''}`}
                  onClick={() => setActiveDay(iso)}
                >
                  <span className="ev3-day-label">{DAY_LABELS[day.getDay()]}</span>
                  <span className="ev3-day-num">{day.getDate()}</span>
                  {hasEvs && <span className="ev3-day-dot" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="ev3-body">
          {displayEvents.length === 0 ? (
            <div className="ev3-empty">
              <div className="ev3-empty-icon">🌙</div>
              <div className="ev3-empty-text">
                {timeFilter === 'tonight' ? 'Rien ce soir' : "Pas d'événements"}
              </div>
              <div className="ev3-empty-sub">Essaie une autre période</div>
              {timeFilter === 'tonight' && (
                <button className="ev3-empty-cta" onClick={() => setTimeFilter('weekend')}>
                  Voir le weekend →
                </button>
              )}
            </div>
          ) : (
            <>
              <SectionHeader count={displayEvents.length} timeFilter={timeFilter} />
              {featured && (
                <div style={{ position: 'relative' }}>
                  <FeaturedCard event={featured} spots={spots} onClick={() => setSelectedEvent(featured)} />
                  {admin && <button className="ev3-edit-btn" onClick={e => { e.stopPropagation(); setEditingEvent(featured); }}>✏️</button>}
                </div>
              )}
              {others.map(e => (
                <div key={e.id} style={{ position: 'relative' }}>
                  <EventCard event={e} spots={spots} onClick={() => setSelectedEvent(e)} />
                  {admin && <button className="ev3-edit-btn" onClick={ev => { ev.stopPropagation(); setEditingEvent(e); }}>✏️</button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showCatDrawer && (
        <CatDrawer
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
          onClose={() => setShowCatDrawer(false)}
        />
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          spots={spots}
          onOpenSpot={() => setSelectedEvent(null)}
        />
      )}

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
