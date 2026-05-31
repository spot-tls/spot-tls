import os
root = r'C:\Users\basti\Google Drive\marketing\SPOT cabau lesavre\Mise en route\APP\spot-app-v2\src'

# ── 1. useEventBookmarks.js ───────────────────────────────────────────────────
bookmarks = """\
import { useState } from 'react';

const KEY = 'spottls_event_bookmarks';
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function useEventBookmarks() {
  const [ids, setIds] = useState(load);

  const toggle = (id) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const isBookmarked = (id) => ids.includes(id);
  return { ids, toggle, isBookmarked };
}
"""
with open(os.path.join(root, 'hooks', 'useEventBookmarks.js'), 'w', encoding='utf-8') as f:
    f.write(bookmarks)
print(f"useEventBookmarks.js written ({len(bookmarks.splitlines())} lines)")

# ── 2. EventDetail.jsx ────────────────────────────────────────────────────────
os.makedirs(os.path.join(root, 'components', 'EventDetail'), exist_ok=True)

event_detail_jsx = """\
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
"""
with open(os.path.join(root, 'components', 'EventDetail', 'EventDetail.jsx'), 'w', encoding='utf-8') as f:
    f.write(event_detail_jsx)
print(f"EventDetail.jsx written ({len(event_detail_jsx.splitlines())} lines)")

# ── 3. EventDetail.css ────────────────────────────────────────────────────────
event_detail_css = """\
/* ── EventDetail — bottom sheet ─────────────────────────────── */
.ed-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: flex-end;
  animation: fade-in .2s ease;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

.ed-sheet {
  width: 100%; max-width: 480px; max-height: 88dvh;
  margin: 0 auto;
  background: var(--bg-elevated);
  border-radius: 24px 24px 0 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -12px 48px rgba(0,0,0,0.5);
  animation: sheet-up .32s cubic-bezier(.16,1,.3,1);
}
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.ed-handle {
  width: 36px; height: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  margin: 10px auto 0;
  flex-shrink: 0;
}

/* Hero */
.ed-hero {
  position: relative;
  height: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.ed-hero-fade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.78) 100%);
}
.ed-hero-emoji {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -55%);
  font-size: 64px;
}
.ed-close {
  position: absolute; top: 12px; right: 14px; z-index: 2;
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(8px);
  color: #fff; font-size: 20px; font-weight: 300;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.ed-hero-bottom {
  position: relative; z-index: 1;
  padding: 0 18px 18px;
  display: flex; flex-direction: column; gap: 8px;
}
.ed-hero-chips {
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
}
.ed-cat-chip {
  font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 99px;
  backdrop-filter: blur(8px);
}
.ed-featured-chip {
  font-size: 11px; font-weight: 700;
  color: #FDE68A; background: rgba(251,191,36,0.2);
  padding: 3px 10px; border-radius: 99px;
}
.ed-date-chip {
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
  padding: 3px 10px; border-radius: 99px;
}
.ed-hero-title {
  font-size: 22px; font-weight: 800;
  color: #fff; line-height: 1.15;
  font-family: var(--font-title);
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  margin: 0;
}

/* Body */
.ed-body {
  flex: 1; overflow-y: auto; scrollbar-width: none;
  padding: 18px 20px 32px;
  display: flex; flex-direction: column; gap: 14px;
}
.ed-body::-webkit-scrollbar { display: none; }

/* Venue row */
.ed-venue-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.ed-venue-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.ed-venue-name {
  font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3;
}
.ed-venue-quartier { color: var(--text-muted); font-weight: 500; }
.ed-venue-time { font-size: 13px; color: var(--text-dim); }
.ed-spot-btn {
  flex-shrink: 0;
  font-size: 12px; font-weight: 700;
  color: var(--secondary);
  background: rgba(167,139,250,0.1);
  border: 1px solid rgba(167,139,250,0.3);
  padding: 6px 12px; border-radius: 99px;
  white-space: nowrap;
  transition: background .15s ease;
}
.ed-spot-btn:hover { background: rgba(167,139,250,0.2); }

/* Prix */
.ed-price-row { display: flex; }
.ed-price-pill {
  font-size: 12px; font-weight: 700;
  color: var(--text-dim);
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 4px 12px; border-radius: 99px;
}

/* Description */
.ed-desc {
  font-size: 14px; line-height: 1.6;
  color: var(--text-dim); margin: 0;
}

/* Actions */
.ed-actions {
  display: flex; gap: 10px; margin-top: 4px;
}
.ed-btn-bookmark {
  flex: 1; padding: 13px;
  border-radius: 14px;
  font-size: 14px; font-weight: 700;
  background: rgba(255,255,255,0.06);
  border: 1.5px solid var(--border);
  color: var(--text-muted);
  transition: all .15s ease;
}
.ed-btn-bookmark.active {
  background: rgba(167,139,250,0.15);
  border-color: rgba(167,139,250,0.5);
  color: var(--secondary);
}
.ed-btn-ticket {
  flex: 1.4; padding: 13px;
  border-radius: 14px;
  font-size: 14px; font-weight: 800;
  background: var(--gradient-brand);
  color: #fff; text-align: center;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity .15s ease;
}
.ed-btn-ticket:hover { opacity: .88; }
"""
with open(os.path.join(root, 'components', 'EventDetail', 'EventDetail.css'), 'w', encoding='utf-8') as f:
    f.write(event_detail_css)
print(f"EventDetail.css written ({len(event_detail_css.splitlines())} lines)")
