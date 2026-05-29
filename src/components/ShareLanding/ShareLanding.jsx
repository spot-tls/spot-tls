import { getCatConfig } from '../../utils/config';
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

  const cat    = getCatConfig(spot.category);
  const photo  = spot.photos?.[0] || spot.photo_url || null;
  const rating = spot.google_rating;

  return (
    <div className="sl-overlay">
      <div className="sl-card">

        {/* Hero */}
        <div className="sl-hero" style={photo ? { backgroundImage: `url(${photo})` } : { background: cat.gradient }}>
          <div className="sl-hero-fade" />
          {!photo && <span className="sl-hero-emoji">{cat.emoji}</span>}
          <div className="sl-hero-badge" style={{ color: cat.color }}>
            {cat.emoji} {spot.category}
          </div>
        </div>

        {/* Contenu */}
        <div className="sl-body">
          <div className="sl-brand">
            <span className="sl-brand-spot">Spot</span>
            <span className="sl-brand-tls">TLS</span>
            <span className="sl-brand-label"> · Toulouse</span>
          </div>

          <h1 className="sl-name">{spot.name}</h1>

          <div className="sl-meta">
            {spot.quartier && <span className="sl-quartier">📍 {spot.quartier}</span>}
            {rating && (
              <span className="sl-rating">⭐ {rating}</span>
            )}
            {spot.price && <span className="sl-price">{spot.price}</span>}
          </div>

          {spot.vibe_tags?.length > 0 && (
            <div className="sl-tags">
              {spot.vibe_tags.slice(0, 4).map((t) => (
                <span key={t} className="sl-tag">#{t}</span>
              ))}
            </div>
          )}

          {spot.description && (
            <p className="sl-desc">{spot.description}</p>
          )}

          <button className="sl-cta" onClick={onEnter}>
            Voir sur la carte →
          </button>

          <p className="sl-sub">Découvre les meilleurs spots de Toulouse</p>
        </div>
      </div>
    </div>
  );
}
