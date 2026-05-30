import { useMemo, useState } from 'react';
import { MOODS, CATEGORY_CONFIG, getCatConfig, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { distanceKm, formatDistance } from '../../utils/distance';
import { isOpenNow } from '../../utils/isOpenNow';
import SpotCard from '../SpotCard/SpotCard';
import SpotDetail from '../MapView/SpotDetail';
import './SearchView.css';

const SORTS = [
  { key: 'pertinence', label: 'Pertinence' },
  { key: 'note',       label: '★ Note' },
  { key: 'distance',   label: '📍 Proche' },
];

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([name, cfg]) => ({
  name, emoji: cfg.emoji, color: cfg.color,
}));

// Mini card pour la vue quartiers
function QSpotCard({ spot, onClick, userPos }) {
  const cat   = getCatConfig(spot.category);
  const photo = spot.photos?.[0] || spot.photo_url || null;
  const hasH  = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open  = hasH ? isOpenNow(spot) : null;
  const dist  = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;

  return (
    <button className="sv-qcard" onClick={onClick}>
      <div className="sv-qcard-thumb" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} onError={e => { e.target.style.display = 'none'; }} />
          : <span>{cat.emoji}</span>}
        {open === true  && <div className="sv-qcard-dot sv-qcard-dot--open" />}
        {open === false && <div className="sv-qcard-dot sv-qcard-dot--closed" />}
      </div>
      <div className="sv-qcard-body">
        <div className="sv-qcard-name">{spot.name}</div>
        <div className="sv-qcard-cat" style={{ color: cat.color }}>{cat.emoji} {spot.category}</div>
        {dist != null && <div className="sv-qcard-dist">📍 {formatDistance(dist)}</div>}
      </div>
    </button>
  );
}

export default function SearchView({ spots, isFavorite, onToggleFavorite, userPos, admin, onAdminReposition, onAdminDelete }) {
  const [query,    setQuery]    = useState('');
  const [mood,     setMood]     = useState(null);
  const [category, setCategory] = useState(null);
  const [sort,     setSort]     = useState('pertinence');
  const [viewMode, setViewMode] = useState('quartiers');
  const [selected, setSelected] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const availableCats = useMemo(() => {
    const present = new Set(spots.map((s) => s.category));
    return CATEGORIES.filter((c) => present.has(c.name));
  }, [spots]);

  const hasFilters = !!(query || mood || category);
  const clearAll = () => { setQuery(''); setMood(null); setCategory(null); };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = spots.filter((s) => {
      if (!matchMood(s, mood)) return false;
      if (category && s.category !== category) return false;
      if (!q) return true;
      const hay = [s.name, s.category, s.quartier, s.address, s.description, ...(s.tags || []), ...(s.moods || [])]
        .join(' ').toLowerCase();
      return hay.includes(q);
    });
    if (sort === 'note') {
      list = [...list].sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
    } else if (sort === 'distance' && userPos) {
      list = [...list].sort((a, b) =>
        distanceKm(userPos, { lat: a.lat, lng: a.lng }) - distanceKm(userPos, { lat: b.lat, lng: b.lng }));
    }
    return list;
  }, [spots, query, mood, category, sort, userPos]);

  const quartierGroups = useMemo(() => {
    const map = {};
    spots.forEach((s) => {
      const q = s.quartier || 'Autre';
      if (!map[q]) map[q] = [];
      map[q].push(s);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].length - a[1].length);
  }, [spots]);

  const toggleCollapse = (q) => setCollapsed((c) => ({ ...c, [q]: !c[q] }));

  const showQuartiers = !hasFilters && viewMode === 'quartiers';

  return (
    <div className="searchview">

      {/* ── Zone sticky filtres ── */}
      <div className="search-sticky">
        <div className="search-field">
          <span className="search-icon">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spot, quartier, ambiance…"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Effacer">×</button>
          )}
        </div>

        <div className="search-filter-row">
          <span className="search-filter-label">Ambiance</span>
          {hasFilters && (
            <button className="search-reset" onClick={clearAll}>Réinitialiser</button>
          )}
        </div>
        <div className="search-moods">
          {MOODS.map((m) => (
            <button
              key={m.key}
              className={`chip mood${mood === m.key ? ' active' : ''}`}
              onClick={() => setMood((v) => (v === m.key ? null : m.key))}
            >
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>

        <div className="search-filter-label" style={{ marginBottom: 8 }}>Catégorie</div>
        <div className="search-cats">
          {availableCats.map((c) => (
            <button
              key={c.name}
              className={`cat-chip${category === c.name ? ' active' : ''}`}
              style={category === c.name ? { borderColor: c.color, color: c.color } : {}}
              onClick={() => setCategory((v) => (v === c.name ? null : c.name))}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Toggle vue (uniquement sans filtre) ── */}
      {!hasFilters && (
        <div className="sv-view-toggle">
          <button
            className={`sv-toggle-btn${viewMode === 'quartiers' ? ' active' : ''}`}
            onClick={() => setViewMode('quartiers')}
          >
            🏘️ Quartiers
          </button>
          <button
            className={`sv-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 Liste
          </button>
        </div>
      )}

      {/* ── Vue Quartiers ── */}
      {showQuartiers ? (
        <div className="sv-quartiers">
          {quartierGroups.map(([qName, qSpots]) => {
            const color = QUARTIER_COLORS[qName] || '#A78BFA';
            const isCollapsed = collapsed[qName];
            const openCount = qSpots.filter((s) => {
              const hasH = !!s.hours && Object.keys(s.hours).length > 0;
              return hasH ? isOpenNow(s) : false;
            }).length;

            return (
              <div key={qName} className="sv-quartier-section">
                <button
                  className="sv-quartier-header"
                  onClick={() => toggleCollapse(qName)}
                  style={{ '--q-color': color }}
                >
                  <div className="sv-quartier-header-left">
                    <div className="sv-quartier-color-bar" />
                    <div>
                      <div className="sv-quartier-name">{qName}</div>
                      <div className="sv-quartier-meta">
                        <span>{qSpots.length} spot{qSpots.length > 1 ? 's' : ''}</span>
                        {openCount > 0 && (
                          <span className="sv-quartier-open">• {openCount} ouvert{openCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`sv-quartier-chevron${isCollapsed ? ' collapsed' : ''}`}>‹</span>
                </button>

                {!isCollapsed && (
                  <div className="sv-quartier-scroll">
                    {qSpots.map((s) => (
                      <QSpotCard
                        key={s.id}
                        spot={s}
                        onClick={() => setSelected(s)}
                        userPos={userPos}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Vue Liste (filtrée ou mode liste) ── */
        <div className="search-list">
          {results.length === 0 ? (
            <div className="search-empty">
              <div className="search-empty-emoji">🤷</div>
              <p className="search-empty-title">Aucun spot trouvé</p>
              <p className="search-empty-sub">Essaie un autre mot-clé ou enlève un filtre.</p>
              {hasFilters && (
                <button className="btn-pill search-empty-cta" onClick={clearAll}>
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="search-results-header">
                <span className="search-count">
                  {results.length} spot{results.length > 1 ? 's' : ''}
                </span>
                <div className="search-sorts">
                  {SORTS.map((s) => {
                    const disabled = s.key === 'distance' && !userPos;
                    return (
                      <button
                        key={s.key}
                        className={`sort-pill${sort === s.key ? ' active' : ''}`}
                        disabled={disabled}
                        title={disabled ? 'Active « Autour de moi » sur la carte' : undefined}
                        onClick={() => setSort(s.key)}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {results.map((s) => (
                <SpotCard
                  key={s.id}
                  spot={s}
                  onClick={() => setSelected(s)}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  distanceKm={userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null}
                />
              ))}
            </>
          )}
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
