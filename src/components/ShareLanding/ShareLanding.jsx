import { getCatConfig, MOODS } from '../../utils/config';
import { isOpenNow, hasHours } from '../../utils/isOpenNow';
import './ShareLanding.css';

export default function ShareLanding({ spot, onEnter }) {
  if (!spot) {
    return (
      <div className="sl-overlay">
        <div className="sl-loading">
          <div className="sl-spinner" />
          <p>Chargement du spot…</p>
        </div>
      </div>
    );
  }

  const cat       = getCatConfig(spot.category);
  const photo     = spot.photos?.[0] || spot.photo_url || null;
  const photoCount = spot.photos?.length ?? 0;
  const rating    = spot.google_rating;
  const open      = hasHours(spot) ? isOpenNow(spot) : null;
  const spotMoods = MOODS.filter(m => spot.moods?.includes(m.id));
  const tags      = spot.tags?.slice(0, 4) ?? [];

  return (
    <div className="sl-overlay">
      {photo && (
        <div className="sl-bg-blur" style={{ backgroundImage: `url(${photo})` }} />
      )}

      <div className="sl-card">

        {/* Hero */}
        <div
          className="sl-hero"
          style={photo
            ? { backgroundImage: `url(${photo})` }
            : { background: cat.gradient }
          }
        >
          <div className="sl-hero-fade" />
          {!photo && <span className="sl-hero-emoji">{cat.emoji}</span>}

          <div className="sl-hero-top">
            <span className="sl-cat-badge" style={{ color: cat.color }}>
              {cat.emoji} {spot.category}
            </span>
            {open !== null && (
              <span className={`sl-open-badge ${open ? 'sl-open' : 'sl-closed'}`}>
                {open ? '● Ouvert' : '● Fermé'}
              </span>
            )}
          </div>

          {photoCount > 1 && (
            <div className="sl-photo-count">
              🖼️ {photoCount} photos
            </div>
          )}
        </div>

        {/* Body */}
        <div className="sl-body">
          <div className="sl-brand">
            <span className="sl-brand-spot">Spot</span>
            <span className="sl-brand-tls">TLS</span>
            <span className="sl-brand-label"> · Toulouse</span>
          </div>

          <h1 className="sl-name">{spot.name}</h1>

          <div className="sl-meta">
            {spot.quartier && (
              <span className="sl-quartier">📍 {spot.quartier}</span>
            )}
            {rating && (
              <span className="sl-rating">
                ⭐ <strong>{rating}</strong>
                <span className="sl-rating-max">/5</span>
              </span>
            )}
            {spot.price_level && (
              <span className="sl-price">{spot.price_level}</span>
            )}
          </div>

          {spotMoods.length > 0 && (
            <div className="sl-moods">
              {spotMoods.map(m => (
                <span key={m.id} className="sl-mood">{m.emoji} {m.label}</span>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="sl-tags">
              {tags.map(t => (
                <span key={t} className="sl-tag">#{t}</span>
              ))}
            </div>
          )}

          {spot.description && (
            <p className="sl-desc">{spot.description}</p>
          )}

          <button className="sl-cta" onClick={onEnter}
            style={{ background: cat.gradient }}>
            Ouvrir dans SpotTLS →
          </button>

          <p className="sl-sub">Découvre les meilleurs spots de Toulouse la nuit</p>
        </div>
      </div>
    </div>
  );
}
