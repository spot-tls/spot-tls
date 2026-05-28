import { useMemo, useRef, useState } from 'react';
import { getCatConfig } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import SpotDetail from '../MapView/SpotDetail';
import './QuartiersView.css';

// Ambiance taglines par quartier
const QUARTIER_VIBES = {
  'Capitole':       'Le cœur battant de Toulouse',
  'Saint-Cyprien':  'Bohème et branché, rive gauche',
  'Carmes':         'Entre terrasses et cocktails',
  'Centre-ville':   'Toute la nuit dans tous les styles',
  'Wilson':         'Hype et haut de gamme',
  'Arnaud-Bernard': 'Culture, concerts et bonnes tables',
  'Saint-Georges':  'Mix parfait de clubs et de bars',
  'Saint-Aubin':    'Village dans la ville',
  'Compans':        'Parcs, bières et bonne humeur',
  'Minimes':        'Authentique et sans chichis',
};

function dominantCat(spots) {
  const counts = {};
  spots.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

function SpotMiniCard({ spot, onClick, isFavorite, onToggleFavorite, userPos }) {
  const cat  = getCatConfig(spot.category);
  const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open = hasHours ? isOpenNow(spot) : null;
  const dist = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const fav  = isFavorite?.(spot.id);
  const photo = spot.photos?.[0] || spot.photo_url || null;

  return (
    <button className="qv-mini-card" onClick={onClick}>
      <div className="qv-mini-thumb" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} className="qv-mini-photo" onError={(e) => { e.target.style.display = 'none'; }} />
          : <span className="qv-mini-emoji">{cat.emoji}</span>
        }
        <div className="qv-mini-overlay">
          <span className={`qv-mini-status ${open === null ? 'unknown' : open ? 'on' : 'off'}`}>
            {open === null ? '—' : open ? '● Ouvert' : 'Fermé'}
          </span>
          {onToggleFavorite && (
            <button
              className="qv-mini-fav"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(spot.id); }}
            >
              {fav ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>
      <div className="qv-mini-info">
        <div className="qv-mini-name">{spot.name}</div>
        <div className="qv-mini-meta">
          <span style={{ color: cat.color }}>{cat.emoji}</span>
          {dist != null && <span className="qv-mini-dist">{formatDistance(dist)}</span>}
        </div>
        {spot.google_rating >= 4.5 && (
          <div className="qv-mini-coup">❤️ Coup de cœur</div>
        )}
      </div>
    </button>
  );
}

export default function QuartiersView({ spots, isFavorite, onToggleFavorite, userPos }) {
  const [selected,      setSelected]      = useState(null);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const sectionRefs = useRef({});

  const quartiers = useMemo(() => {
    const map = {};
    spots.forEach((s) => {
      const q = s.quartier || 'Autre';
      if (!map[q]) map[q] = [];
      map[q].push(s);
    });
    return Object.entries(map)
      .map(([name, list]) => {
        const dom = dominantCat(list);
        const cat = getCatConfig(dom);
        const openCount = list.filter((s) => {
          const hasHours = !!s.hours && Object.keys(s.hours).length > 0;
          return hasHours ? isOpenNow(s) : false;
        }).length;
        const vibe = QUARTIER_VIBES[name] || `${list.length} spots à découvrir`;
        return { name, list, dom, cat, openCount, vibe };
      })
      .sort((a, b) => b.list.length - a.list.length);
  }, [spots]);

  const visibleQuartiers = useMemo(() => {
    if (activeFilter === 'all') return quartiers;
    return quartiers.filter((q) => q.name === activeFilter);
  }, [quartiers, activeFilter]);

  const scrollTo = (name) => {
    setActiveFilter(name);
    if (name !== 'all') {
      setTimeout(() => {
        sectionRefs.current[name]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <div className="quartiersview">

      {/* ── Chip bar ── */}
      <div className="qv-chipbar">
        <button
          className={`qv-chip${activeFilter === 'all' ? ' active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          🗺️ Tous
        </button>
        {quartiers.map((q) => (
          <button
            key={q.name}
            className={`qv-chip${activeFilter === q.name ? ' active' : ''}`}
            onClick={() => scrollTo(q.name)}
          >
            {q.cat.emoji} {q.name}
            {q.openCount > 0 && <span className="qv-chip-dot" />}
          </button>
        ))}
      </div>

      {/* ── Sections scroll ── */}
      <div className="qv-feed">
        {visibleQuartiers.map((q) => (
          <section
            key={q.name}
            className="qv-section"
            ref={(el) => { sectionRefs.current[q.name] = el; }}
          >
            {/* Section header */}
            <div className="qv-section-header" style={{ '--q-color': q.cat.color }}>
              <div className="qv-section-glow" style={{ background: `radial-gradient(circle at 20% 50%, ${q.cat.color}30, transparent 70%)` }} />
              <div className="qv-section-icon" style={{ background: q.cat.gradient }}>
                {q.cat.emoji}
              </div>
              <div className="qv-section-info">
                <div className="qv-section-name">{q.name}</div>
                <div className="qv-section-vibe">{q.vibe}</div>
              </div>
              <div className="qv-section-stats">
                <div className="qv-stat-pill">{q.list.length} spots</div>
                {q.openCount > 0 && (
                  <div className="qv-stat-pill open">{q.openCount} ouverts</div>
                )}
              </div>
            </div>

            {/* Horizontal scroll of mini cards */}
            <div className="qv-scroll-track">
              {q.list.map((s) => (
                <SpotMiniCard
                  key={s.id}
                  spot={s}
                  onClick={() => setSelected(s)}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  userPos={userPos}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="qv-feed-footer">
          <div className="qv-feed-footer-text">
            {spots.length} spots dans {quartiers.length} quartiers
          </div>
        </div>
      </div>

      {selected && (
        <SpotDetail
          spot={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          userPos={userPos}
        />
      )}
    </div>
  );
}
