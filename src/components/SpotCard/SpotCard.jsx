import { getCatConfig } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { formatDistance } from '../../utils/distance';
import './SpotCard.css';

const COUP_DE_COEUR = 4.5;

export default function SpotCard({ spot, onClick, isFavorite, onToggleFavorite, distanceKm }) {
  const cat      = getCatConfig(spot.category);
  const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open     = hasHours ? isOpenNow(spot) : null; // null = horaires inconnus
  const fav      = isFavorite?.(spot.id);
  const loved = spot.google_rating >= COUP_DE_COEUR;

  return (
    <div className="spot-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="spot-card-emoji" style={{ background: cat.gradient }}>
        {spot.photo_url
          ? <img src={spot.photo_url} alt="" loading="lazy" />
          : cat.emoji}
        {loved && <span className="spot-card-love" title="Coup de cœur">❤️</span>}
      </div>

      <div className="spot-card-body">
        <div className="spot-card-top">
          <span className="spot-card-name">{spot.name}</span>
          <span className={`spot-card-status ${open === null ? 'unknown' : open ? 'on' : 'off'}`}>
            {open === null ? '· · ·' : open ? 'Ouvert' : 'Fermé'}
          </span>
        </div>
        <div className="spot-card-meta">
          <span style={{ color: cat.color }}>{spot.category}</span>
          {spot.quartier && <span> · {spot.quartier}</span>}
          {spot.price && <span> · {spot.price}</span>}
          {spot.google_rating && <span> · ★ {spot.google_rating}</span>}
          {distanceKm != null && <span className="spot-card-dist"> · 📍 {formatDistance(distanceKm)}</span>}
        </div>
        {spot.vibe_tags?.length > 0 && (
          <div className="spot-card-tags">
            {spot.vibe_tags.slice(0, 3).map((t) => (
              <span key={t} className="spot-card-tag">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {onToggleFavorite && (
        <button
          className={`spot-card-fav${fav ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(spot.id); }}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {fav ? '❤️' : '🤍'}
        </button>
      )}
    </div>
  );
}
