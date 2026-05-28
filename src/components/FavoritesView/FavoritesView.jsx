import { useMemo, useState } from 'react';
import { distanceKm } from '../../utils/distance';
import { isOpenNow } from '../../utils/isOpenNow';
import SpotCard from '../SpotCard/SpotCard';
import SpotDetail from '../MapView/SpotDetail';
import './FavoritesView.css';

const FILTERS = [
  { key: 'all',      label: 'Tous' },
  { key: 'open',     label: 'Ouverts' },
  { key: 'rating',   label: '★ Note' },
  { key: 'distance', label: '📍 Proches' },
];

export default function FavoritesView({ spots, favoriteIds, isFavorite, onToggleFavorite, userPos, onGoSearch }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const favs = useMemo(() => spots.filter((s) => favoriteIds.has(s.id)), [spots, favoriteIds]);

  const filteredFavs = useMemo(() => {
    let list = [...favs];
    if (filter === 'open') {
      list = list.filter((s) => {
        const hasHours = !!s.hours && Object.keys(s.hours).length > 0;
        return hasHours ? isOpenNow(s) : false;
      });
    } else if (filter === 'rating') {
      list = list.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
    } else if (filter === 'distance' && userPos) {
      list = list.sort((a, b) =>
        distanceKm(userPos, { lat: a.lat, lng: a.lng }) - distanceKm(userPos, { lat: b.lat, lng: b.lng }));
    }
    return list;
  }, [favs, filter, userPos]);

  // Suggestions : meilleurs spots non favoris (par note)
  const suggestions = useMemo(() => {
    if (favs.length > 0) return [];
    return [...spots]
      .filter((s) => !favoriteIds.has(s.id))
      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 4);
  }, [spots, favoriteIds, favs]);

  const distOrNull = (s) => userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null;

  return (
    <div className="favview">

      {/* ── Header ── */}
      <div className="favview-hero">
        <div className="favview-hero-left">
          <h2 className="favview-hero-title">Mes favoris</h2>
          <p className="favview-hero-sub">
            {favs.length === 0
              ? 'Sauvegarde tes spots préférés'
              : `${favs.length} spot${favs.length > 1 ? 's' : ''} sauvegardé${favs.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="favview-hero-count">{favs.length}</div>
      </div>

      {favs.length > 0 && (
        <div className="favview-filters">
          {FILTERS.map((f) => {
            const disabled = f.key === 'distance' && !userPos;
            return (
              <button
                key={f.key}
                className={`sort-pill${filter === f.key ? ' active' : ''}`}
                disabled={disabled}
                title={disabled ? 'Active la géoloc sur la carte' : undefined}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Liste ou empty ── */}
      <div className="favview-list">
        {favs.length === 0 ? (
          /* ── Empty state avec suggestions ── */
          <div className="favview-empty">
            <div className="favview-empty-ring">❤️</div>
            <p className="favview-empty-title">Aucun favori pour l'instant</p>
            <p className="favview-empty-sub">
              Touche le cœur sur un spot pour le retrouver ici.
            </p>

            {suggestions.length > 0 && (
              <div className="favview-suggestions">
                <div className="favview-suggestions-label">✨ Les mieux notés</div>
                {suggestions.map((s) => (
                  <SpotCard
                    key={s.id}
                    spot={s}
                    onClick={() => setSelected(s)}
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                    distanceKm={distOrNull(s)}
                  />
                ))}
              </div>
            )}

            {onGoSearch && (
              <button className="btn-pill favview-cta" onClick={onGoSearch}>
                Explorer les spots
              </button>
            )}
          </div>
        ) : (
          filteredFavs.map((s) => (
            <SpotCard
              key={s.id}
              spot={s}
              onClick={() => setSelected(s)}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
              distanceKm={distOrNull(s)}
            />
          ))
        )}
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
