import { useMemo, useState } from 'react';
import { MOODS, getCatConfig, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import { useEvents } from '../../hooks/useEvents';
import SpotDetail from '../MapView/SpotDetail';
import './HomeView.css';

const EV_CAT_COLOR = {
  'DJ Set': '#A78BFA', 'Concert': '#FB7185', 'Happy Hour': '#06B6D4',
  'Soirée': '#EC4899', 'Brunch': '#4ade80', 'Expo': '#FBBF24',
};
const EV_CAT_EMOJI = {
  'DJ Set': '🎛️', 'Concert': '🎤', 'Happy Hour': '🍹',
  'Soirée': '🎉', 'Brunch': '☕', 'Expo': '🎭',
};

function FeaturedEventCard({ event, onOpen }) {
  const color = EV_CAT_COLOR[event.category] || '#A78BFA';
  const emoji = EV_CAT_EMOJI[event.category] || '📅';
  const bg = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : 'linear-gradient(160deg,#1a1035,#2d1052,#3b0764)';
  return (
    <button className="hv-ev-featured" style={{ background: bg }} onClick={onOpen}>
      <div className="hv-ev-featured-overlay">
        <div className="hv-ev-featured-top">
          <span className="hv-ev-chip" style={{ color, background: color + '22' }}>{emoji} {event.category}</span>
          {event.featured && <span className="hv-ev-star">✨ À la une</span>}
        </div>
        <div className="hv-ev-featured-title">{event.title}</div>
        <div className="hv-ev-featured-meta">
          📍 {event.spot_name}
          {event.quartier ? ` · ${event.quartier}` : ''}
          <span style={{ color, fontWeight: 600 }}> · {event.time_start}</span>
        </div>
      </div>
    </button>
  );
}

function EventRow({ event, onOpen }) {
  const color = EV_CAT_COLOR[event.category] || '#A78BFA';
  const emoji = EV_CAT_EMOJI[event.category] || '📅';
  return (
    <button className="hv-ev-row" onClick={onOpen}>
      <div className="hv-ev-row-icon" style={{ background: color + '20' }}>{emoji}</div>
      <div className="hv-ev-row-body">
        <div className="hv-ev-row-title">{event.title}</div>
        <div className="hv-ev-row-meta">📍 {event.spot_name} · <span style={{ color }}>{event.time_start}</span></div>
      </div>
      <span className="hv-ev-row-chevron">›</span>
    </button>
  );
}


function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Bonne nuit 🌙', sub: "Les spots les plus tardifs t'attendent" };
  if (h < 12) return { text: 'Bonjour ☀️',   sub: 'Brunch, café, que du bon à Toulouse' };
  if (h < 18) return { text: 'Bonne journée 🌤️', sub: 'Prépare ta soirée dès maintenant' };
  return { text: 'Ce soir à Toulouse 🔥', sub: 'Trouve le spot parfait pour ta nuit' };
}

function SpotCard({ spot, onClick, userPos }) {
  const cat   = getCatConfig(spot.category);
  const hasH  = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open  = hasH ? isOpenNow(spot) : null;
  const dist  = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const photo = spot.photos?.[0] || spot.photo_url || null;
  const qColor = QUARTIER_COLORS[spot.quartier] || cat.color;

  return (
    <button className="hv-spot-card" onClick={onClick}>
      <div className="hv-spot-thumb" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} onError={e => e.target.style.display='none'} />
          : <span>{cat.emoji}</span>}
        {open === true && <div className="hv-spot-open-dot" />}
        {spot.google_rating >= 4.5 && <div className="hv-spot-coup">❤️</div>}
      </div>
      <div className="hv-spot-info">
        <div className="hv-spot-name">{spot.name}</div>
        <div className="hv-spot-meta">
          <span className="hv-spot-cat" style={{ color: cat.color }}>{cat.emoji} {spot.category}</span>
        </div>
        <div className="hv-spot-footer">
          <span className="hv-spot-q" style={{ background: qColor + '22', color: qColor }}>
            {spot.quartier}
          </span>
          {dist != null && <span className="hv-spot-dist">📍 {formatDistance(dist)}</span>}
        </div>
      </div>
    </button>
  );
}

function EventPill({ event, onClick }) {
  const EMOJI = { 'DJ Set': '🎛️', Concert: '🎤', 'Happy Hour': '🍹', Soirée: '🎉', Expo: '🎭', Brunch: '☕' };
  const COLORS = { 'DJ Set': '#A78BFA', Concert: '#FB7185', 'Happy Hour': '#06B6D4', Soirée: '#EC4899', Expo: '#FBBF24', Brunch: '#4ade80' };
  const color = COLORS[event.category] || '#A78BFA';
  const emoji = EMOJI[event.category] || '📅';
  return (
    <button className="hv-event-pill" onClick={onClick} style={{ '--ev-color': color }}>
      <div className="hv-event-pill-cat" style={{ color, background: color + '20' }}>{emoji} {event.category}</div>
      <div className="hv-event-pill-title">{event.title}</div>
      <div className="hv-event-pill-meta">
        <span>📍 {event.spot_name}</span>
        <span className="hv-event-pill-time">{event.time_start}</span>
      </div>
      {event.featured && <div className="hv-event-pill-star">✨</div>}
    </button>
  );
}

export default function HomeView({ spots, isFavorite, onToggleFavorite, userPos, onGoMap, onOpenEvents, admin, onAdminReposition, onAdminDelete }) {
  const [activeMood, setActiveMood] = useState(null);
  const [selected,   setSelected]   = useState(null);
  const { text, sub } = greeting();
  const { allEvents } = useEvents();

  const openSpots = useMemo(() =>
    spots.filter(s => {
      const hasH = !!s.hours && Object.keys(s.hours).length > 0;
      return hasH && isOpenNow(s);
    }).slice(0, 12),
  [spots]);

  const moodSpots = useMemo(() => {
    if (!activeMood) return [];
    return spots.filter(s => matchMood(s, activeMood)).slice(0, 10);
  }, [spots, activeMood]);

  const topSpots = useMemo(() =>
    [...spots].filter(s => s.google_rating >= 4.5)
      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 10),
  [spots]);

  const tonightEvents = useMemo(() => {
    if (!allEvents?.length) return [];
    const today = new Date().toISOString().slice(0, 10);
    return allEvents.filter(e => e.date === today).slice(0, 4);
  }, [allEvents]);

  const featuredEvent = tonightEvents.find(e => e.featured) || tonightEvents[0] || null;
  const otherEvents   = tonightEvents.filter(e => e !== featuredEvent).slice(0, 2);

  const displaySpots = activeMood ? moodSpots : openSpots;
  const sectionTitle = activeMood
    ? `Spots ${MOODS.find(m => m.key === activeMood)?.label || ''}`
    : openSpots.length > 0 ? `${openSpots.length} spots ouverts maintenant` : 'Spots tendance ce soir';

  return (
    <div className="homeview">
      {/* ── Hero greeting ── */}
      <div className="hv-hero">
        <div className="hv-hero-glow" />
        <div className="hv-hero-glow2" />
        <div className="hv-greeting">{text}</div>
        <div className="hv-greeting-sub">{sub}</div>
        <button className="hv-cta-map" onClick={onGoMap}>
          🗺️ Explorer les spots
        </button>
      </div>

      {/* ── Mood picker ── */}
      <div className="hv-section">
        <div className="hv-section-header">
          <span className="hv-section-title">Quelle est ton ambiance ?</span>
        </div>
        <div className="hv-mood-strip">
          {MOODS.map(m => (
            <button
              key={m.key}
              className={`hv-mood-chip${activeMood === m.key ? ' active' : ''}`}
              onClick={() => setActiveMood(v => v === m.key ? null : m.key)}
            >
              <span className="hv-mood-emoji">{m.emoji}</span>
              <span className="hv-mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Événements ce soir ── */}
      {featuredEvent && (
        <div className="hv-section">
          <div className="hv-section-header">
            <span className="hv-section-title">🎫 Ce soir à Toulouse</span>
            <button className="hv-section-link" onClick={onOpenEvents}>Agenda complet</button>
          </div>
          <FeaturedEventCard event={featuredEvent} onOpen={onOpenEvents} />
          {otherEvents.length > 0 && (
            <div className="hv-ev-rows">
              {otherEvents.map(e => <EventRow key={e.id} event={e} onOpen={onOpenEvents} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Spots ouverts / mood ── */}
      <div className="hv-section">
        <div className="hv-section-header">
          <span className="hv-section-title">{sectionTitle}</span>
          <button className="hv-section-link" onClick={onGoMap}>Tout voir</button>
        </div>
        {displaySpots.length > 0 ? (
          <div className="hv-scroll-row">
            {displaySpots.map(s => (
              <SpotCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} />
            ))}
          </div>
        ) : (
          <div className="hv-empty">Aucun spot ouvert pour cette ambiance</div>
        )}
      </div>

      {/* ── Coups de coeur ── */}
      {topSpots.length > 0 && (
        <div className="hv-section">
          <div className="hv-section-header">
            <span className="hv-section-title">❤️ Coups de cœur</span>
            <button className="hv-section-link" onClick={onGoMap}>Voir sur carte</button>
          </div>
          <div className="hv-scroll-row">
            {topSpots.map(s => (
              <SpotCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} />
            ))}
          </div>
        </div>
      )}

      <div className="hv-footer-pad" />

      {selected && (
        <SpotDetail
          spot={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          userPos={userPos}
          onReposition={admin ? onAdminReposition : undefined}
          onDelete={admin ? onAdminDelete : undefined}
        />
      )}
    </div>
  );
}

