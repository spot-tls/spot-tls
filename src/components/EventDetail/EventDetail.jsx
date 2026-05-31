import { createPortal } from 'react-dom';
import { useState } from 'react';
import { Bookmark, Ticket, MapPin, Clock, Share2, Music2 } from 'lucide-react';
import { useEventBookmarks } from '../../hooks/useEventBookmarks';
import './EventDetail.css';

const CAT_CONFIG = {
  'DJ Set':     { color: '#A78BFA' },
  'Concert':    { color: '#FB7185' },
  'Happy Hour': { color: '#06B6D4' },
  'Soirée':     { color: '#EC4899' },
  'Brunch':     { color: '#4ade80' },
  'Expo':       { color: '#FBBF24' },
  'Afterwork':  { color: '#F59E0B' },
};
function getCat(k) { return CAT_CONFIG[k] ?? { color: '#A78BFA' }; }

const MONTH_FR = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_FR[m - 1]} ${y}`;
}

export default function EventDetail({ event, onClose, onOpenSpot, spots = [] }) {
  const { toggle, isBookmarked } = useEventBookmarks();
  const [shared, setShared] = useState(false);
  if (!event) return null;

  const cat        = getCat(event.category);
  const bookmarked = isBookmarked(event.id);
  const linkedSpot = event.spot_id
    ? spots.find(s => String(s.id) === String(event.spot_id))
    : null;

  const bg = event.photo_url
    ? { backgroundImage: `url(${event.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(160deg,#1a1035,#2d1052,${cat.color}55)` };

  const handleShare = async () => {
    const base = `${window.location.origin}${window.location.pathname}`;
    const url  = `${base}?event=${event.id}`;
    const text = `${event.title} — ${event.category}${event.spot_name ? '\n@ ' + event.spot_name : ''}${event.date ? '\n' + formatDate(event.date) : ''}`;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2500); } catch {}
    }
  };

  return createPortal(
    <div className="ed-overlay" onClick={onClose}>
      <div className="ed-sheet" onClick={e => e.stopPropagation()}>
        <div className="ed-handle" />

        {/* Hero */}
        <div className="ed-hero" style={bg}>
          <div className="ed-hero-fade" />
          <button className="ed-close" onClick={onClose}>×</button>

          <div className="ed-hero-bottom">
            <div className="ed-hero-chips">
              <span className="ed-cat-chip" style={{ color: cat.color, background: cat.color + '28' }}>
                {event.category}
              </span>
              {event.featured && <span className="ed-featured-chip">À la une</span>}
              <span className="ed-date-chip">{formatDate(event.date)}</span>
            </div>
            <h2 className="ed-hero-title">{event.title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="ed-body">

          {/* Venue / heure */}
          <div className="ed-venue-row">
            <div className="ed-venue-info">
              <div className="ed-venue-name">
                <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 5, opacity: 0.6 }} />
                {event.spot_name}
                {event.quartier && <span className="ed-venue-quartier"> · {event.quartier}</span>}
              </div>
              {(event.time_start || event.time_end) && (
                <div className="ed-venue-time">
                  <Clock size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 5, opacity: 0.5 }} />
                  {event.time_start}{event.time_end ? ` — ${event.time_end}` : ''}
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

          {/* Line-up */}
          {event.lineup?.length > 0 && (
            <div className="ed-lineup">
              <div className="ed-lineup-header">
                <Music2 size={13} strokeWidth={2} style={{ opacity: 0.6 }} />
                <span>Line-up</span>
              </div>
              <div className="ed-lineup-list">
                {event.lineup.map((artist, i) => (
                  <div key={i} className="ed-lineup-artist">
                    <span className="ed-lineup-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ed-lineup-name">{artist}</span>
                  </div>
                ))}
              </div>
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
              <Bookmark size={16} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
              {bookmarked ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
            <button className="ed-btn-share" onClick={handleShare}>
              <Share2 size={16} strokeWidth={2} />
              {shared ? 'Copié !' : 'Partager'}
            </button>
            {event.link && (
              <a className="ed-btn-ticket" href={event.link} target="_blank" rel="noreferrer">
                <Ticket size={16} strokeWidth={2} />
                Billetterie
              </a>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
