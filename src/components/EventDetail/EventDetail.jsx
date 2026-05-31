import { createPortal } from 'react-dom';
import { useEventBookmarks } from '../../hooks/useEventBookmarks';
import './EventDetail.css';

const CAT_CONFIG = {
  'DJ Set':     { emoji: '🎛️', color: '#A78BFA' },
  'Concert':    { emoji: '🎤', color: '#FB7185' },
  'Happy Hour': { emoji: '🍹', color: '#06B6D4' },
  'Soirée':     { emoji: '🎉', color: '#EC4899' },
  'Brunch':     { emoji: '☕', color: '#4ade80' },
  'Expo':       { emoji: '🎭', color: '#FBBF24' },
  'Afterwork':  { emoji: '🍸', color: '#F59E0B' },
};
function getCat(k) { return CAT_CONFIG[k] ?? { emoji: '📅', color: '#A78BFA' }; }

const MONTH_FR = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_FR[m - 1]} ${y}`;
}

export default function EventDetail({ event, onClose, onOpenSpot, spots = [] }) {
  const { toggle, isBookmarked } = useEventBookmarks();
  if (!event) return null;

  const cat       = getCat(event.category);
  const bookmarked = isBookmarked(event.id);
  const linkedSpot = event.spot_id
    ? spots.find(s => String(s.id) === String(event.spot_id))
    : null;

  const bg = event.photo_url
    ? { backgroundImage: `url(${event.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(160deg,#1a1035,#2d1052,${cat.color}55)` };

  return createPortal(
    <div className="ed-overlay" onClick={onClose}>
      <div className="ed-sheet" onClick={e => e.stopPropagation()}>
        <div className="ed-handle" />

        {/* Hero */}
        <div className="ed-hero" style={bg}>
          <div className="ed-hero-fade" />
          {!event.photo_url && <span className="ed-hero-emoji">{cat.emoji}</span>}
          <button className="ed-close" onClick={onClose}>×</button>

          <div className="ed-hero-bottom">
            <div className="ed-hero-chips">
              <span className="ed-cat-chip" style={{ color: cat.color, background: cat.color + '28' }}>
                {cat.emoji} {event.category}
              </span>
              {event.featured && <span className="ed-featured-chip">✨ À la une</span>}
              <span className="ed-date-chip">📅 {formatDate(event.date)}</span>
            </div>
            <h2 className="ed-hero-title">{event.title}</h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="ed-body">

          {/* Venue / heure */}
          <div className="ed-venue-row">
            <div className="ed-venue-info">
              <div className="ed-venue-name">
                📍 {event.spot_name}
                {event.quartier && <span className="ed-venue-quartier"> · {event.quartier}</span>}
              </div>
              {(event.time_start || event.time_end) && (
                <div className="ed-venue-time">
                  🕐 {event.time_start}{event.time_end ? ` — ${event.time_end}` : ''}
                </div>
              )}
            </div>
            {linkedSpot && (
              <button className="ed-spot-btn" onClick={() => onOpenSpot?.(linkedSpot)}>
                Voir le spot →
              </button>
            )}
          </div>

          {/* Prix */}
          {(event.price_detail || event.price) && (
            <div className="ed-price-row">
              <span className="ed-price-pill">{event.price_detail || event.price}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="ed-desc">{event.description}</p>
          )}

          {/* Actions */}
          <div className="ed-actions">
            <button
              className={`ed-btn-bookmark${bookmarked ? ' active' : ''}`}
              onClick={() => toggle(event.id)}
            >
              {bookmarked ? '🔖 Sauvegardé' : '🔖 Sauvegarder'}
            </button>
            {event.link && (
              <a className="ed-btn-ticket" href={event.link} target="_blank" rel="noreferrer">
                🎟️ Billetterie
              </a>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
