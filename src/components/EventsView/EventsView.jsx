import { useEvents } from '../../hooks/useEvents';
import './EventsView.css';

const CATEGORY_EMOJI = {
  'DJ Set':     '🎛️',
  'Concert':    '🎤',
  'Happy Hour': '🍹',
  'Soirée':     '🎉',
  'Expo':       '🎭',
  'Brunch':     '☕',
};

const CAT_COLOR = {
  'DJ Set':     '#A78BFA',
  'Concert':    '#FB7185',
  'Happy Hour': '#06B6D4',
  'Soirée':     '#EC4899',
  'Expo':       '#FBBF24',
  'Brunch':     '#4ade80',
};

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return "Ce soir";
  if (diff === 1) return "Demain";
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function EventCard({ event }) {
  const emoji = CATEGORY_EMOJI[event.category] || '📅';
  const color = CAT_COLOR[event.category] || '#A78BFA';

  return (
    <div className="ev-card">
      {event.featured && <div className="ev-featured-badge">✨ À ne pas manquer</div>}
      <div className="ev-card-header" style={{ '--ev-color': color }}>
        <div className="ev-cat-chip" style={{ color, borderColor: color + '44', background: color + '18' }}>
          {emoji} {event.category}
        </div>
        <div className="ev-time">{event.time_start}–{event.time_end}</div>
      </div>
      <div className="ev-card-body">
        <div className="ev-title">{event.title}</div>
        <div className="ev-spot-row">
          <span className="ev-spot-name">📍 {event.spot_name}</span>
          <span className="ev-quartier">{event.quartier}</span>
        </div>
        <p className="ev-desc">{event.description}</p>
        <div className="ev-tags">
          {event.tags.slice(0, 3).map((t) => (
            <span key={t} className="ev-tag">#{t}</span>
          ))}
        </div>
      </div>
      <div className="ev-card-footer">
        <div className="ev-price">
          <span className="ev-price-badge">{event.price}</span>
          {event.price_detail && <span className="ev-price-detail">{event.price_detail}</span>}
        </div>
        {event.link && (
          <a className="ev-cta" href={event.link} target="_blank" rel="noreferrer">
            Réserver →
          </a>
        )}
      </div>
    </div>
  );
}

function groupByDate(events) {
  const groups = {};
  events.forEach((e) => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

const FILTERS = [
  { key: 'all',     label: '🗓️ Tous' },
  { key: 'tonight', label: '🌙 Ce soir' },
  { key: 'weekend', label: '🎉 Weekend' },
  { key: 'week',    label: '📅 Cette semaine' },
];

export default function EventsView({ onClose }) {
  const { events, filter, setFilter } = useEvents();
  const groups = groupByDate(events);

  return (
    <div className="evview-overlay" onClick={onClose}>
      <div className="evview-panel" onClick={(e) => e.stopPropagation()}>
        <div className="evview-handle" />

        <div className="evview-header">
          <div className="evview-title">🎫 Événements</div>
          <div className="evview-sub">Toulouse · agenda des sorties</div>
          <button className="evview-close" onClick={onClose}>×</button>
        </div>

        <div className="evview-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`evview-filter-chip${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="evview-body">
          {groups.length === 0 && (
            <div className="evview-empty">
              <div className="evview-empty-icon">📭</div>
              <div className="evview-empty-text">Pas d'événements pour ce filtre</div>
            </div>
          )}
          {groups.map(([date, dayEvents]) => (
            <div key={date} className="ev-day-group">
              <div className="ev-day-label">{formatDate(date)}</div>
              {dayEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
