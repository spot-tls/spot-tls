import { createPortal } from 'react-dom';
import { useEvents } from '../../hooks/useEvents';
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
};

function getCat(key) {
  return CAT_CONFIG[key] ?? { label: key, emoji: '📅', color: '#A78BFA' };
}

function FeaturedCard({ event }) {
  const cat = getCat(event.category);
  const bg = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : 'linear-gradient(160deg,#1a1035,#2d1052,#3b0764)';

  return (
    <div className="ev2-featured" style={{ background: bg }}>
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
            {event.quartier && <span className="ev2-dot">·</span>}
            {event.quartier && <span>{event.quartier}</span>}
            <span className="ev2-dot">·</span>
            <span style={{ color: cat.color, fontWeight: 600 }}>{event.time_start}</span>
          </div>
          {event.price_detail && (
            <span className="ev2-price-pill">{event.price_detail}</span>
          )}
        </div>
        {event.link && (
          <a className="ev2-featured-cta" href={event.link} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}>
            Réserver →
          </a>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }) {
  const cat = getCat(event.category);
  return (
    <div className="ev2-card">
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
        <div className="ev2-card-spot">📍 {event.spot_name}{event.quartier ? ` · ${event.quartier}` : ''}</div>
        {event.price_detail && <div className="ev2-card-price">{event.price_detail}</div>}
      </div>
      {event.link && (
        <a className="ev2-card-link" href={event.link} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}>›</a>
      )}
    </div>
  );
}

export default function EventsView({ onClose }) {
  const {
    events, weekDays, activeDay, setActiveDay,
    activeCategory, setActiveCategory, categories, hasDayEvents,
  } = useEvents();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const featured = events.find(e => e.featured);
  const others   = events.filter(e => !e.featured || e !== featured);

  return createPortal(
    <div className="ev2-overlay" onClick={onClose}>
      <div className="ev2-panel" onClick={e => e.stopPropagation()}>
        <div className="ev2-handle" />

        {/* Header */}
        <div className="ev2-header">
          <div className="ev2-header-left">
            <div className="ev2-title">Agenda Toulouse</div>
            <div className="ev2-sub">Sélectionne un jour</div>
          </div>
          <button className="ev2-close" onClick={onClose}>×</button>
        </div>

        {/* Week strip */}
        <div className="ev2-week">
          {weekDays.map(day => {
            const iso = day.toISOString().slice(0, 10);
            const isToday = day.toDateString() === today.toDateString();
            const isActive = iso === activeDay;
            const hasEvents = hasDayEvents[iso];
            return (
              <button
                key={iso}
                className={`ev2-day-btn${isActive ? ' active' : ''}${isToday ? ' today' : ''}`}
                onClick={() => setActiveDay(iso)}
              >
                <span className="ev2-day-label">{DAY_LABELS[day.getDay()]}</span>
                <span className="ev2-day-num">{day.getDate()}</span>
                {hasEvents && <span className="ev2-day-dot" />}
              </button>
            );
          })}
        </div>

        {/* Category filters */}
        <div className="ev2-cats">
          {categories.map(cat => {
            const cfg = getCat(cat);
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
          {events.length === 0 ? (
            <div className="ev2-empty">
              <div className="ev2-empty-icon">📭</div>
              <div className="ev2-empty-text">Pas d'événements ce jour</div>
              <div className="ev2-empty-sub">Essaie un autre jour ou une autre catégorie</div>
            </div>
          ) : (
            <>
              {featured && <FeaturedCard event={featured} />}
              {others.map(e => <EventCard key={e.id} event={e} />)}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
