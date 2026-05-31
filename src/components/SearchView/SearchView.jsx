import { useMemo, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { MOODS, CATEGORY_CONFIG, getCatConfig, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { distanceKm, formatDistance } from '../../utils/distance';
import { isOpenNow } from '../../utils/isOpenNow';
import SpotCard from '../SpotCard/SpotCard';
import SpotDetail from '../MapView/SpotDetail';
import './SearchView.css';

/* ── Carte horizontale spot ── */
function SpotSlide({ spot, onClick, userPos }) {
  const cat   = getCatConfig(spot.category);
  const photo = spot.photos?.[0] || spot.photo_url || null;
  const hasH  = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open  = hasH ? isOpenNow(spot) : null;
  const dist  = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const rating = spot.google_rating ? spot.google_rating.toFixed(1) : null;

  return (
    <button className="ds-spot-slide" onClick={onClick}>
      <div className="ds-spot-thumb" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} onError={e => { e.target.style.display = 'none'; }} />
          : <span className="ds-spot-emoji">{cat.emoji}</span>}
        <div className="ds-spot-overlay">
          {open === true && <span className="ds-badge ds-badge--open">Ouvert</span>}
          {rating && <span className="ds-badge ds-badge--rating">★ {rating}</span>}
        </div>
      </div>
      <div className="ds-spot-info">
        <div className="ds-spot-name">{spot.name}</div>
        <div className="ds-spot-meta" style={{ color: cat.color }}>{cat.emoji} {spot.category}</div>
        {dist != null && <div className="ds-spot-dist">{formatDistance(dist)}</div>}
      </div>
    </button>
  );
}

/* ── Grande carte quartier ── */
function QuartierCard({ name, spots, color, onClick, active }) {
  const photo = spots.find(s => s.photos?.[0] || s.photo_url)?.photos?.[0]
    || spots.find(s => s.photo_url)?.photo_url || null;
  const openCount = spots.filter(s => {
    const hasH = !!s.hours && Object.keys(s.hours).length > 0;
    return hasH ? isOpenNow(s) : false;
  }).length;

  return (
    <button
      className={`ds-quartier-card${active ? ' active' : ''}`}
      style={{ '--q-color': color }}
      onClick={onClick}
    >
      <div
        className="ds-quartier-bg"
        style={{
          background: photo
            ? `url(${photo}) center/cover`
            : `linear-gradient(135deg, ${color}cc, ${color}66)`,
        }}
      />
      <div className="ds-quartier-overlay" />
      <div className="ds-quartier-content">
        <div className="ds-quartier-name">{name}</div>
        <div className="ds-quartier-meta">
          {spots.length} spots
          {openCount > 0 && <span className="ds-quartier-open"> · {openCount} ouverts</span>}
        </div>
      </div>
    </button>
  );
}

/* ── Section horizontale de spots ── */
function SpotSection({ title, spots, onSpotClick, userPos, emptyMsg }) {
  if (!spots || spots.length === 0) return null;
  return (
    <div className="ds-section">
      <div className="ds-section-title">{title}</div>
      <div className="ds-section-scroll">
        {spots.map(s => (
          <SpotSlide key={s.id} spot={s} onClick={() => onSpotClick(s)} userPos={userPos} />
        ))}
      </div>
    </div>
  );
}

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([name, cfg]) => ({
  name, emoji: cfg.emoji, color: cfg.color,
}));

const SORTS = [
  { key: 'pertinence', label: 'Pertinence' },
  { key: 'note',       label: '★ Note' },
  { key: 'distance',   label: '📍 Proche' },
];

export default function SearchView({ spots, isFavorite, onToggleFavorite, userPos, admin, onAdminReposition, onAdminDelete }) {
  const [query,    setQuery]    = useState('');
  const [mood,     setMood]     = useState(null);
  const [quartier, setQuartier] = useState(null);
  const [sort,     setSort]     = useState('pertinence');
  const [selected, setSelected] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  const hasFilters = !!(query || mood || quartier);
  const clearAll   = () => { setQuery(''); setMood(null); setQuartier(null); setSort('pertinence'); };

  /* Quartiers */
  const quartierGroups = useMemo(() => {
    const map = {};
    spots.forEach(s => {
      const q = s.quartier || 'Autre';
      if (!map[q]) map[q] = [];
      map[q].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [spots]);

  /* Spots filtrés */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = spots.filter(s => {
      if (!matchMood(s, mood)) return false;
      if (quartier && s.quartier !== quartier) return false;
      if (!q) return true;
      const hay = [s.name, s.category, s.quartier, s.address, ...(s.tags||[]), ...(s.moods||[])].join(' ').toLowerCase();
      return hay.includes(q);
    });
    if (sort === 'note') list = [...list].sort((a,b) => (b.google_rating||0)-(a.google_rating||0));
    else if (sort === 'distance' && userPos) {
      list = [...list].sort((a,b) =>
        distanceKm(userPos,{lat:a.lat,lng:a.lng}) - distanceKm(userPos,{lat:b.lat,lng:b.lng}));
    }
    return list;
  }, [spots, query, mood, quartier, sort, userPos]);

  /* Sections discover */
  const openNow = useMemo(() =>
    spots.filter(s => { const h = !!s.hours && Object.keys(s.hours).length>0; return h ? isOpenNow(s) : false; })
      .sort((a,b) => (b.google_rating||0)-(a.google_rating||0)).slice(0,10),
    [spots]);

  const topRated = useMemo(() =>
    spots.filter(s => (s.google_rating||0) >= 4.5)
      .sort((a,b) => (b.google_rating||0)-(a.google_rating||0)).slice(0,10),
    [spots]);

  const byCat = useMemo(() => {
    const map = {};
    spots.forEach(s => {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    });
    return Object.entries(map)
      .filter(([,arr]) => arr.length >= 3)
      .sort((a,b) => b[1].length - a[1].length)
      .slice(0,4);
  }, [spots]);

  return (
    <div className="searchview">

      {/* ── TopBar Discover ── */}
      <div className="ds-topbar">
        {searchOpen ? (
          <div className="ds-search-expanded">
            <div className="ds-search-field">
              <Search size={15} strokeWidth={2} className="ds-search-icon" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Spot, quartier, ambiance…"
              />
              {query && <button className="ds-search-clear" onClick={() => setQuery('')}><X size={13} strokeWidth={2.5} /></button>}
            </div>
            <button className="ds-search-cancel" onClick={() => { setSearchOpen(false); setQuery(''); }}>Annuler</button>
          </div>
        ) : (
          <div className="ds-topbar-row">
            <div>
              <div className="ds-topbar-title">Découvrir</div>
              <div className="ds-topbar-sub">Toulouse, ce soir</div>
            </div>
            <div className="ds-topbar-actions">
              {hasFilters && (
                <button className="ds-topbar-clear" onClick={clearAll}>Effacer</button>
              )}
              <button className="ds-search-btn" onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
                <Search size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Moods */}
        <div className="ds-moods-row">
          {MOODS.map(m => (
            <button
              key={m.key}
              className={`ds-mood-chip${mood === m.key ? ' active' : ''}`}
              onClick={() => setMood(v => v === m.key ? null : m.key)}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vue filtrée ── */}
      {hasFilters ? (
        <div className="ds-filtered">
          <div className="ds-filtered-header">
            <span className="ds-filtered-count">
              {filtered.length} spot{filtered.length !== 1 ? 's' : ''}
              {quartier && <span className="ds-filtered-tag"> · {quartier}</span>}
              {mood && <span className="ds-filtered-tag"> · {MOODS.find(m=>m.key===mood)?.label}</span>}
            </span>
            <div className="ds-sorts">
              {SORTS.map(s => {
                const disabled = s.key === 'distance' && !userPos;
                return (
                  <button
                    key={s.key}
                    className={`ds-sort-btn${sort === s.key ? ' active' : ''}`}
                    disabled={disabled}
                    onClick={() => setSort(s.key)}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="ds-empty">
              <div className="ds-empty-icon">🤷</div>
              <p className="ds-empty-title">Aucun spot trouvé</p>
              <p className="ds-empty-sub">Essaie un autre mot-clé ou enlève un filtre.</p>
              <button className="ds-empty-cta" onClick={clearAll}>Effacer les filtres</button>
            </div>
          ) : (
            <div className="ds-list">
              {filtered.map(s => (
                <SpotCard
                  key={s.id} spot={s}
                  onClick={() => setSelected(s)}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  distanceKm={userPos ? distanceKm(userPos,{lat:s.lat,lng:s.lng}) : null}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Vue Discover ── */
        <div className="ds-home">

          {/* Quartiers — grandes cartes horizontales */}
          <div className="ds-section ds-section--quartiers">
            <div className="ds-section-title">Par quartier</div>
            <div className="ds-section-scroll">
              {quartierGroups.map(([qName, qSpots]) => (
                <QuartierCard
                  key={qName}
                  name={qName}
                  spots={qSpots}
                  color={QUARTIER_COLORS[qName] || '#A78BFA'}
                  active={quartier === qName}
                  onClick={() => setQuartier(v => v === qName ? null : qName)}
                />
              ))}
            </div>
          </div>

          {/* Ouverts maintenant */}
          <SpotSection
            title="🔥 Ouverts maintenant"
            spots={openNow}
            onSpotClick={setSelected}
            userPos={userPos}
          />

          {/* Coups de coeur */}
          <SpotSection
            title="⭐ Coup de cœur SpotTLS"
            spots={topRated}
            onSpotClick={setSelected}
            userPos={userPos}
          />

          {/* Par catégorie */}
          {byCat.map(([catName, catSpots]) => {
            const cfg = getCatConfig(catName);
            return (
              <SpotSection
                key={catName}
                title={`${cfg.emoji} ${catName}`}
                spots={catSpots.slice(0,10)}
                onSpotClick={setSelected}
                userPos={userPos}
              />
            );
          })}

        </div>
      )}

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
