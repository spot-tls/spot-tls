import { useMemo, useState } from 'react';
import { MOODS, CATEGORY_CONFIG, getCatConfig, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { distanceKm, formatDistance } from '../../utils/distance';
import { isOpenNow } from '../../utils/isOpenNow';
import SpotCard from '../SpotCard/SpotCard';
import SpotDetail from '../MapView/SpotDetail';
import './SearchView.css';

// Carte horizontale "Spot du moment"
function SpotMomentCard({ spot, onClick, userPos }) {
  const cat  = getCatConfig(spot.category);
  const photo = spot.photos?.[0] || spot.photo_url || null;
  const hasH = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open  = hasH ? isOpenNow(spot) : null;
  const dist  = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const rating = spot.google_rating ? spot.google_rating.toFixed(1) : null;

  return (
    <button className="sm-card" onClick={onClick}>
      <div className="sm-card-thumb" style={{ background: photo ? undefined : cat.gradient }}>
        {photo
          ? <img src={photo} alt={spot.name} onError={e => { e.target.style.display='none'; }} />
          : <span className="sm-card-emoji">{cat.emoji}</span>}
        {open === true && <span className="sm-card-badge sm-card-badge--open">Ouvert</span>}
        {rating && <span className="sm-card-rating">★ {rating}</span>}
      </div>
      <div className="sm-card-body">
        <div className="sm-card-name">{spot.name}</div>
        <div className="sm-card-meta">
          <span style={{ color: cat.color }}>{cat.emoji} {spot.category}</span>
          {dist != null && <span className="sm-card-dist">{formatDistance(dist)}</span>}
        </div>
      </div>
    </button>
  );
}

const SORTS = [
  { key: 'pertinence', label: 'Pertinence' },
  { key: 'note',       label: '★ Note' },
  { key: 'distance',   label: '📍 Proche' },
];

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([name, cfg]) => ({
  name, emoji: cfg.emoji, color: cfg.color,
}));

export default function SearchView({ spots, isFavorite, onToggleFavorite, userPos, admin, onAdminReposition, onAdminDelete }) {
  const [query,    setQuery]    = useState('');
  const [mood,     setMood]     = useState(null);
  const [category, setCategory] = useState(null);
  const [quartier, setQuartier] = useState(null);
  const [sort,     setSort]     = useState('pertinence');
  const [selected, setSelected] = useState(null);

  const availableCats = useMemo(() => {
    const present = new Set(spots.map(s => s.category));
    return CATEGORIES.filter(c => present.has(c.name));
  }, [spots]);

  const quartiers = useMemo(() => {
    const counts = {};
    spots.forEach(s => { const q = s.quartier; if (q) counts[q] = (counts[q]||0)+1; });
    return Object.entries(counts)
      .filter(([,n]) => n >= 2)
      .sort((a,b) => b[1]-a[1])
      .map(([q]) => q);
  }, [spots]);

  const hasFilters = !!(query || mood || category || quartier);
  const clearAll   = () => { setQuery(''); setMood(null); setCategory(null); setQuartier(null); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = spots.filter(s => {
      if (!matchMood(s, mood)) return false;
      if (category && s.category !== category) return false;
      if (quartier && s.quartier !== quartier) return false;
      if (!q) return true;
      const hay = [s.name, s.category, s.quartier, s.address, s.description, ...(s.tags||[]), ...(s.moods||[])].join(' ').toLowerCase();
      return hay.includes(q);
    });
    if (sort === 'note') {
      list = [...list].sort((a,b) => (b.google_rating||0)-(a.google_rating||0));
    } else if (sort === 'distance' && userPos) {
      list = [...list].sort((a,b) =>
        distanceKm(userPos,{lat:a.lat,lng:a.lng}) - distanceKm(userPos,{lat:b.lat,lng:b.lng}));
    }
    return list;
  }, [spots, query, mood, category, quartier, sort, userPos]);

  // Spots du moment : ouverts en ce moment, triés par note
  const spotsNow = useMemo(() => {
    return spots
      .filter(s => {
        const hasH = !!s.hours && Object.keys(s.hours).length > 0;
        return hasH ? isOpenNow(s) : false;
      })
      .sort((a,b) => (b.google_rating||0)-(a.google_rating||0))
      .slice(0, 10);
  }, [spots]);

  // Coups de coeur : meilleure note globale (>= 4.5 ou top 8)
  const coupDeCoeur = useMemo(() => {
    return spots
      .filter(s => (s.google_rating||0) >= 4.5)
      .sort((a,b) => (b.google_rating||0)-(a.google_rating||0))
      .slice(0, 8);
  }, [spots]);

  return (
    <div className="searchview">

      {/* ── Sticky filters ── */}
      <div className="search-sticky">

        {/* Barre recherche */}
        <div className="search-field">
          <span className="search-icon">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Spot, quartier, ambiance…"
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}>×</button>}
        </div>

        {/* Ambiance */}
        <div className="search-section-label">
          Ambiance
          {hasFilters && <button className="search-reset-inline" onClick={clearAll}>Tout effacer</button>}
        </div>
        <div className="search-chips-row">
          {MOODS.map(m => (
            <button
              key={m.key}
              className={`chip mood${mood === m.key ? ' active' : ''}`}
              onClick={() => setMood(v => v === m.key ? null : m.key)}
            >
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>

        {/* Quartiers */}
        <div className="search-section-label">Quartier</div>
        <div className="search-chips-row">
          {quartiers.map(q => {
            const color = QUARTIER_COLORS[q] || '#A78BFA';
            const active = quartier === q;
            return (
              <button
                key={q}
                className={`chip quartier${active ? ' active' : ''}`}
                style={active ? { borderColor: color, color, background: color+'18' } : {}}
                onClick={() => setQuartier(v => v === q ? null : q)}
              >
                {q}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Vue filtrée ── */}
      {hasFilters ? (
        <div className="search-list">
          {filtered.length === 0 ? (
            <div className="search-empty">
              <div className="search-empty-emoji">🤷</div>
              <p className="search-empty-title">Aucun spot trouvé</p>
              <p className="search-empty-sub">Essaie un autre mot-clé ou enlève un filtre.</p>
              <button className="btn-pill search-empty-cta" onClick={clearAll}>Effacer les filtres</button>
            </div>
          ) : (
            <>
              <div className="search-results-header">
                <span className="search-count">{filtered.length} spot{filtered.length > 1 ? 's' : ''}</span>
                <div className="search-sorts">
                  {SORTS.map(s => {
                    const disabled = s.key === 'distance' && !userPos;
                    return (
                      <button
                        key={s.key}
                        className={`sort-pill${sort === s.key ? ' active' : ''}`}
                        disabled={disabled}
                        onClick={() => setSort(s.key)}
                      >{s.label}</button>
                    );
                  })}
                </div>
              </div>
              {filtered.map(s => (
                <SpotCard
                  key={s.id} spot={s}
                  onClick={() => setSelected(s)}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  distanceKm={userPos ? distanceKm(userPos,{lat:s.lat,lng:s.lng}) : null}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        /* ── Vue défaut (pas de filtre) ── */
        <div className="search-home">

          {/* Spots du moment */}
          {spotsNow.length > 0 && (
            <div className="sh-section">
              <div className="sh-section-header">
                <span className="sh-section-title">🔥 Spots du moment</span>
                <span className="sh-section-sub">Ouverts maintenant</span>
              </div>
              <div className="sh-scroll">
                {spotsNow.map(s => (
                  <SpotMomentCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} />
                ))}
              </div>
            </div>
          )}

          {/* Coups de coeur */}
          {coupDeCoeur.length > 0 && (
            <div className="sh-section">
              <div className="sh-section-header">
                <span className="sh-section-title">⭐ Coup de cœur SpotTLS</span>
                <span className="sh-section-sub">Sélection de l’équipe</span>
              </div>
              <div className="sh-scroll">
                {coupDeCoeur.map(s => (
                  <SpotMomentCard key={s.id} spot={s} onClick={() => setSelected(s)} userPos={userPos} />
                ))}
              </div>
            </div>
          )}

          {/* Tous les spots */}
          <div className="sh-section">
            <div className="sh-section-header">
              <span className="sh-section-title">📍 Tous les spots</span>
              <span className="sh-section-sub">{spots.length} adresses</span>
            </div>
            <div className="search-list search-list--flush">
              {spots.map(s => (
                <SpotCard
                  key={s.id} spot={s}
                  onClick={() => setSelected(s)}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  distanceKm={userPos ? distanceKm(userPos,{lat:s.lat,lng:s.lng}) : null}
                />
              ))}
            </div>
          </div>

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
