import { useMemo, useState, useCallback } from 'react';
import { MOODS, getCatConfig, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import { useEvents } from '../../hooks/useEvents';
import SpotDetail from '../MapView/SpotDetail';
import EventDetail from '../EventDetail/EventDetail';
import './HomeView.css';

const EV_CAT_COLOR = {
  'DJ Set': '#A78BFA', 'Concert': '#FB7185', 'Happy Hour': '#06B6D4',
  'Soirée': '#EC4899', 'Brunch': '#4ade80', 'Expo': '#FBBF24',
  'Afterwork': '#F59E0B',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Bonne nuit', sub: "Les spots les plus tardifs t'attendent" };
  if (h < 12) return { text: 'Bonjour', sub: 'Brunch, café, que du bon à Toulouse' };
  if (h < 18) return { text: 'Bonne journée', sub: 'Prépare ta soirée dès maintenant' };
  return { text: 'Ce soir à Toulouse', sub: 'Trouve le spot parfait pour ta nuit' };
}

/* ── SpotCard — carte verticale photo-forward ── */
function SpotCard({ spot, onClick, userPos, index = 0 }) {
  const cat    = getCatConfig(spot.category);
  const hasH   = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open   = hasH ? isOpenNow(spot) : null;
  const dist   = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const photo  = spot.photos?.[0] || spot.photo_url || null;
  const qColor = QUARTIER_COLORS[spot.quartier] || cat.color;
  const rating = spot.google_rating;

  return (
    <button
      className="hv-spot-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="hv-spot-photo" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} loading="lazy" onError={e => e.target.style.display='none'} />
          : <span className="hv-spot-photo-emoji">{cat.emoji}</span>}
        <div className="hv-spot-photo-overlay">
          {open === true  && <span className="hv-badge hv-badge-open">● Ouvert</span>}
          {open === false && <span className="hv-badge hv-badge-closed">Fermé</span>}
        </div>
        <div className="hv-spot-photo-fade" />
      </div>
      <div className="hv-spot-info">
        <div className="hv-spot-name">{spot.name}</div>
        <div className="hv-spot-meta-row">
          <span className="hv-spot-cat-chip" style={{ color: cat.color, background: cat.color + '1A', border: `1px solid ${cat.color}30` }}>
            {spot.category}
          </span>
          {rating && <span className="hv-spot-rating">★ {rating.toFixed(1)}</span>}
        </div>
        <div className="hv-spot-footer-row">
          {spot.quartier && (
            <span className="hv-spot-q" style={{ background: qColor + '22', color: qColor }}>
              {spot.quartier}
            </span>
          )}
          {dist != null && <span className="hv-spot-dist">{formatDistance(dist)}</span>}
        </div>
      </div>
    </button>
  );
}

/* ── NearbyCard — grande carte paysage avec photo en fond ── */
function NearbyCard({ spot, onClick, userPos, index = 0 }) {
  const cat    = getCatConfig(spot.category);
  const photo  = spot.photos?.[0] || spot.photo_url || null;
  const dist   = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const open   = spot.hours && Object.keys(spot.hours).length > 0 ? isOpenNow(spot) : null;
  const qColor = QUARTIER_COLORS[spot.quartier] || cat.color;

  return (
    <button
      className="hv-nearby-card"
      onClick={onClick}
      style={{
        backgroundImage: photo ? `url(${photo})` : undefined,
        background:      photo ? undefined : cat.gradient,
        animationDelay:  `${index * 60}ms`,
      }}
    >
      <div className="hv-nearby-fade" />
      {!photo && <span className="hv-nearby-emoji">{cat.emoji}</span>}
      <div className="hv-nearby-content">
        <div className="hv-nearby-top">
          {open === true  && <span className="hv-badge hv-badge-open">● Ouvert</span>}
          {open === false && <span className="hv-badge hv-badge-closed">Fermé</span>}
          {spot.google_rating && (
            <span className="hv-nearby-rating">★ {spot.google_rating.toFixed(1)}</span>
          )}
        </div>
        <div className="hv-nearby-bottom">
          <div className="hv-nearby-name">{spot.name}</div>
          <div className="hv-nearby-meta">
            {dist != null && <span>{formatDistance(dist)}</span>}
            {spot.quartier && <span style={{ color: qColor }}>{spot.quartier}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Featured Event Card ── */
function FeaturedEventCard({ event, onOpen }) {
  const color = EV_CAT_COLOR[event.category] || '#A78BFA';
  const bg    = event.photo_url
    ? `url(${event.photo_url}) center/cover no-repeat`
    : `linear-gradient(160deg,#1a1035,#2d1052,#3b0764)`;
  return (
    <button className="hv-ev-featured" style={{ background: bg }} onClick={onOpen}>
      <div className="hv-ev-featured-overlay">
        <div className="hv-ev-featured-top">
          <span className="hv-ev-chip" style={{ color, background: color + '22', border: `1px solid ${color}40` }}>{event.category}</span>
          {event.featured && <span className="hv-ev-star">À la une</span>}
        </div>
        <div className="hv-ev-featured-title">{event.title}</div>
        <div className="hv-ev-featured-meta">
          {event.spot_name}
          {event.quartier ? ` · ${event.quartier}` : ''}
          <span style={{ color, fontWeight: 600 }}> · {event.time_start}</span>
        </div>
      </div>
    </button>
  );
}

function EventRow({ event, onOpen }) {
  const color = EV_CAT_COLOR[event.category] || '#A78BFA';
  const initial = (event.category || '?')[0].toUpperCase();
  return (
    <button className="hv-ev-row" onClick={onOpen}>
      <div className="hv-ev-row-icon" style={{ background: color + '20', color, border: `1px solid ${color}30` }}>{initial}</div>
      <div className="hv-ev-row-body">
        <div className="hv-ev-row-title">{event.title}</div>
        <div className="hv-ev-row-meta">{event.spot_name} · <span style={{ color }}>{event.time_start}</span></div>
      </div>
      <span className="hv-ev-row-chevron">›</span>
    </button>
  );
}

/* ── MoodChip ── */
function MoodChip({ mood, active, count, onClick }) {
  return (
    <button
      className={`hv-mood-chip${active ? ' active' : ''}`}
      onClick={onClick}
      style={active ? { '--mood-color': mood.color || '#A78BFA' } : {}}
    >
      <span className="hv-mood-emoji">{mood.emoji}</span>
      <span className="hv-mood-label">{mood.label}</span>
      {count > 0 && <span className="hv-mood-count">{count}</span>}
    </button>
  );
}

/* ══════════════════════════════════════════════ */
export default function HomeView({ spots, isFavorite, onToggleFavorite, userPos, geoStatus, onLocate, onGoMap, onOpenEvents, admin, onAdminReposition, onAdminDelete }) {
  const [activeMood,     setActiveMood]     = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [selectedEvent,  setSelectedEvent]  = useState(null);
  const [surpriseAnim,   setSurpriseAnim]   = useState(false);
  const { text, sub } = greeting();
  const { allEvents } = useEvents();

  /* ── Spots calculés ── */
  const openSpots = useMemo(() =>
    spots.filter(s => {
      const hasH = !!s.hours && Object.keys(s.hours).length > 0;
      return hasH && isOpenNow(s);
    }).slice(0, 12),
  [spots]);

  const moodSpots = useMemo(() => {
    if (!activeMood) return [];
    return spots.filter(s => matchMood(s, activeMood)).slice(0, 12);
  }, [spots, activeMood]);

  const topSpots = useMemo(() =>
    [...spots].filter(s => s.google_rating >= 4.5)
      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 10),
  [spots]);

  const nearbySpots = useMemo(() => {
    if (!userPos) return [];
    return [...spots]
      .map(s => ({ ...s, _dist: distanceKm(userPos, { lat: s.lat, lng: s.lng }) }))
      .filter(s => s._dist != null && s._dist < 3)
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 8);
  }, [spots, userPos]);

  const moodCounts = useMemo(() => {
    const counts = {};
    MOODS.forEach(m => { counts[m.key] = spots.filter(s => matchMood(s, m.key)).length; });
    return counts;
  }, [spots]);

  const tonightEvents = useMemo(() => {
    if (!allEvents?.length) return [];
    const today = new Date().toISOString().slice(0, 10);
    return allEvents.filter(e => e.date === today).slice(0, 4);
  }, [allEvents]);

  const featuredEvent = tonightEvents.find(e => e.featured) || tonightEvents[0] || null;
  const otherEvents   = tonightEvents.filter(e => e !== featuredEvent).slice(0, 2);

  const displaySpots = activeMood ? moodSpots : openSpots;
  const sectionLabel = activeMood
    ? `${MOODS.find(m => m.key === activeMood)?.label || ''}`
    : openSpots.length > 0 ? `${openSpots.length} spots ouverts` : 'Spots du moment';

  /* ── Surprise me ── */
  const handleSurprise = useCallback(() => {
    const pool = openSpots.length > 0 ? openSpots : topSpots;
    if (!pool.length) return;
    setSurpriseAnim(true);
    setTimeout(() => setSurpriseAnim(false), 600);
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  }, [openSpots, topSpots]);

  return (
    <div className="homeview">

      {/* ══ HERO ══ */}
      <div className="hv-hero">
        <div className="hv-hero-glow" />
        <div className="hv-hero-glow2" />
        <div className="hv-hero-label">Toulouse · Vie nocturne</div>
        <div className="hv-greeting">{text}</div>
        <div className="hv-greeting-sub">{sub}</div>
        <div className="hv-hero-actions">
          <button className="hv-cta-map" onClick={onGoMap}>Explorer</button>
          <button
            className={`hv-cta-surprise${surpriseAnim ? ' anim' : ''}`}
            onClick={handleSurprise}
          >Surprise</button>
        </div>
      </div>

      {/* ══ MOOD PICKER ══ */}
      <div className="hv-section hv-section-mood">
        <div className="hv-section-header">
          <span className="hv-section-title">Ton ambiance du soir</span>
          {activeMood && (
            <button className="hv-section-link" onClick={() => setActiveMood(null)}>Tout voir</button>
          )}
        </div>
        <div className="hv-mood-strip">
          {MOODS.map(m => (
            <MoodChip
              key={m.key}
              mood={m}
              active={activeMood === m.key}
              count={moodCounts[m.key] || 0}
              onClick={() => setActiveMood(v => v === m.key ? null : m.key)}
            />
          ))}
        </div>
      </div>

      {/* ══ SPOTS — ouverts ou filtrés par mood ══ */}
      <div className="hv-section">
        <div className="hv-section-header">
          <span className="hv-section-title">
            {activeMood ? `${sectionLabel} · ${moodSpots.length} spots` : sectionLabel}
          </span>
          <button className="hv-section-link" onClick={onGoMap}>Voir carte</button>
        </div>
        {displaySpots.length > 0 ? (
          <div className="hv-scroll-row">
            {displaySpots.map((s, i) => (
              <SpotCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} index={i} />
            ))}
          </div>
        ) : (
          <div className="hv-empty">
            <span className="hv-empty-icon">🌙</span>
            <span>Aucun spot pour cette ambiance ce soir</span>
          </div>
        )}
      </div>

      {/* ══ AUTOUR DE MOI — grandes cartes photo ══ */}
      <div className="hv-section">
        <div className="hv-section-header">
          <span className="hv-section-title">Autour de toi</span>
          {userPos && <button className="hv-section-link" onClick={onGoMap}>Voir carte</button>}
        </div>
        {!userPos ? (
          <button className="hv-locate-btn" onClick={onLocate} disabled={geoStatus === 'loading'}>
            {geoStatus === 'loading' ? 'Localisation…' : 'Activer ma position'}
          </button>
        ) : nearbySpots.length === 0 ? (
          <div className="hv-empty">
            <span className="hv-empty-icon">🗺️</span>
            <span>Aucun spot dans un rayon de 3 km</span>
          </div>
        ) : (
          <div className="hv-nearby-row">
            {nearbySpots.map((s, i) => (
              <NearbyCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ══ ÉVÉNEMENTS CE SOIR ══ */}
      {featuredEvent && (
        <div className="hv-section">
          <div className="hv-section-header">
            <span className="hv-section-title">Ce soir à Toulouse</span>
            <button className="hv-section-link" onClick={onOpenEvents}>Agenda</button>
          </div>
          <FeaturedEventCard event={featuredEvent} onOpen={() => setSelectedEvent(featuredEvent)} />
          {otherEvents.length > 0 && (
            <div className="hv-ev-rows">
              {otherEvents.map(e => <EventRow key={e.id} event={e} onOpen={() => setSelectedEvent(e)} />)}
            </div>
          )}
        </div>
      )}

      {/* ══ COUPS DE CŒUR ══ */}
      {topSpots.length > 0 && (
        <div className="hv-section">
          <div className="hv-section-header">
            <span className="hv-section-title">Coups de cœur Toulouse</span>
            <button className="hv-section-link" onClick={onGoMap}>Voir carte</button>
          </div>
          <div className="hv-scroll-row">
            {topSpots.map((s, i) => (
              <SpotCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} index={i} />
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

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          spots={spots}
          onOpenSpot={spot => { setSelectedEvent(null); setSelected(spot); }}
        />
      )}
    </div>
  );
}
