import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getCatConfig, MOODS, matchMood } from '../../utils/config';
import { isOpenNow, getNextOpening } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';

const WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const TODAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date().getDay()];

const TAG_COLORS = {
  cosy: '#06B6D4', calme: '#06B6D4', tranquille: '#06B6D4', lounge: '#06B6D4',
  'branché': '#EC4899', hype: '#EC4899', tendance: '#EC4899', dj: '#EC4899',
  chic: '#F59E0B', 'élégant': '#F59E0B', rooftop: '#F59E0B', luxe: '#F59E0B',
  underground: '#7C3AED', alternatif: '#7C3AED', techno: '#7C3AED', rave: '#7C3AED',
  terrasse: '#4ade80', 'extérieur': '#4ade80',
  dansant: '#A78BFA', festif: '#A78BFA', tardif: '#EC4899',
  romantique: '#F472B6', instagrammable: '#F472B6',
  'étudiant': '#22D3EE', pub: '#FCD34D',
  latino: '#FB7185', 'live-music': '#FB7185',
};

function StarRating({ value }) {
  if (!value) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push('full');
    else if (value >= i - 0.5) stars.push('half');
    else stars.push('empty');
  }
  return (
    <span className="sd-stars" title={`${value}/5`}>
      {stars.map((s, i) => (
        <span key={i} className={s !== 'empty' ? 'sd-star-filled' : 'sd-star-empty'}>
          {s === 'empty' ? '☆' : '★'}
        </span>
      ))}
      <span className="sd-stars-val">{value}</span>
    </span>
  );
}

function PhotoGallery({ photos, name }) {
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});
  const validPhotos = photos.filter((_, i) => !err[i]);
  if (!validPhotos.length) return null;
  const prev = (e) => { e.stopPropagation(); setIdx((v) => Math.max(0, v - 1)); };
  const next = (e) => { e.stopPropagation(); setIdx((v) => Math.min(validPhotos.length - 1, v + 1)); };
  return (
    <div className="sd-gallery">
      <div className="sd-gallery-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {photos.map((url, i) =>
          err[i] ? null : (
            <img key={i} src={url} alt={`${name} ${i + 1}`} className="sd-gallery-img"
              onError={() => setErr((e) => ({ ...e, [i]: true }))} />
          )
        )}
      </div>
      {validPhotos.length > 1 && (
        <>
          {idx > 0 && <button className="sd-gallery-arrow left" onClick={prev}>‹</button>}
          {idx < validPhotos.length - 1 && <button className="sd-gallery-arrow right" onClick={next}>›</button>}
          <div className="sd-gallery-dots">
            {validPhotos.map((_, i) => (
              <button key={i} className={`sd-gallery-dot${i === idx ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SpotDetail({ spot, onClose, isFavorite, onToggleFavorite, userPos, onEdit }) {
  const [shared, setShared] = useState(false);
  if (!spot) return null;

  const cat      = getCatConfig(spot.category);
  const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open     = hasHours ? isOpenNow(spot) : null;
  const next     = open === false ? getNextOpening(spot) : null;
  const fav      = isFavorite?.(spot.id);
  const dist     = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const matchingMoods = MOODS.filter((m) => matchMood(spot, m.key));
  const mapsUrl  = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + (spot.address || ''))}`;
  const instaUrl = spot.insta ? (spot.insta.startsWith('http') ? spot.insta : `https://instagram.com/${spot.insta.replace(/^@/, '')}`) : null;
  const siteUrl  = spot.website || null;
  const telUrl   = spot.phone ? `tel:${spot.phone.replace(/\s/g, '')}` : null;
  const resaUrl  = spot.reservation_url || null;
  const photos   = spot.photos?.length ? spot.photos : spot.photo_url ? [spot.photo_url] : [];
  const hasGallery = photos.length > 0;

  const share = async () => {
    const text = spot.name + ' — ' + spot.category + (spot.quartier ? ' · ' + spot.quartier : '') + '\n' + mapsUrl;
    if (navigator.share) {
      try { await navigator.share({ title: spot.name, text, url: mapsUrl }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2000); } catch {}
    }
  };

  return createPortal(
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sd-handle" />

        {hasGallery && (
          <div className="sd-hero-photo">
            <PhotoGallery photos={photos} name={spot.name} />
            <div className="sd-hero-fade" />
            <div className="sd-hero-overlay-actions">
              {onToggleFavorite && (
                <button className={`sd-icon-btn${fav ? ' active' : ''}`}
                  onClick={() => onToggleFavorite(spot.id)} aria-label="Favori">
                  {fav ? '❤️' : '🤍'}
                </button>
              )}
              <button className="sd-icon-btn" onClick={share} aria-label="Partager">{shared ? '✓' : '↗'}</button>
              {onEdit && (
                <button className="sd-icon-btn" onClick={() => onEdit(spot)} aria-label="Modifier">✏️</button>
              )}
              <button className="sd-icon-btn" onClick={onClose} aria-label="Fermer">×</button>
            </div>
          </div>
        )}

        <div className="sd-header">
          {!hasGallery && <div className="sd-glow" style={{ background: `radial-gradient(circle, ${cat.color}44, transparent 70%)` }} />}
          {spot.google_rating >= 4.5 && <div className="sd-coup-badge">❤️ Coup de cœur</div>}

          <div className="sd-header-main">
            {!hasGallery && (
              <div className="sd-avatar" style={{ background: cat.gradient }}>
                <span>{cat.emoji}</span>
              </div>
            )}
            <div className="sd-titles">
              <h2 className="sd-name">{spot.name}</h2>
              <div className="sd-meta-row">
                <span className="sd-cat" style={{ color: cat.color }}>{spot.category}</span>
                {spot.quartier && <><span className="sd-mdot" /><span className="sd-quartier">{spot.quartier}</span></>}
                <span className="sd-mdot" />
                <span className={open === null ? 'sd-unknown' : open ? 'sd-open' : 'sd-closed'}>
                  {open === null ? 'Horaires à venir' : open ? '● Ouvert' : next ? `Fermé · ouvre ${next.day} ${next.time}` : 'Fermé'}
                </span>
              </div>
              <div className="sd-rating-row">
                {spot.google_rating && <StarRating value={spot.google_rating} />}
                {dist != null && <span className="sd-dist">📍 {formatDistance(dist)}</span>}
                {spot.price && <span className="sd-price-badge">{spot.price}</span>}
              </div>
            </div>
            {!hasGallery && (
              <div className="sd-header-actions">
                {onToggleFavorite && (
                  <button className={`sd-icon-btn${fav ? ' active' : ''}`}
                    onClick={() => onToggleFavorite(spot.id)} aria-label="Favori">
                    {fav ? '❤️' : '🤍'}
                  </button>
                )}
                <button className="sd-icon-btn" onClick={share} aria-label="Partager">{shared ? '✓' : '↗'}</button>
                {onEdit && (
                  <button className="sd-icon-btn" onClick={() => onEdit(spot)} aria-label="Modifier">✏️</button>
                )}
                <button className="sd-icon-btn" onClick={onClose} aria-label="Fermer">×</button>
              </div>
            )}
            {hasGallery && (
              <button className="sd-icon-btn" onClick={onClose} aria-label="Fermer" style={{ flexShrink: 0 }}>×</button>
            )}
          </div>

          {spot.address && (
            <a className="sd-address" href={mapsUrl} target="_blank" rel="noreferrer">
              📍 {spot.address}
            </a>
          )}

          {spot.vibe_tags?.length > 0 && (
            <div className="sd-tags">
              {spot.vibe_tags.map((t) => {
                const color = TAG_COLORS[t.toLowerCase()] || cat.color;
                return <span key={t} className="sd-tag" style={{ '--tag-color': color }}>#{t}</span>;
              })}
            </div>
          )}
          {matchingMoods.length > 0 && (
            <div className="sd-moods">
              {matchingMoods.map((m) => (
                <span key={m.key} className="sd-mood-pill">{m.emoji} {m.label}</span>
              ))}
            </div>
          )}
        </div>

        {resaUrl && (
          <div className="sd-resa-banner">
            <span className="sd-resa-label">Disponibilités en ligne</span>
            <a className="sd-resa-btn" href={resaUrl} target="_blank" rel="noreferrer">🗓️ Réserver</a>
          </div>
        )}

        <div className="sd-divider" />

        <div className="sd-body">
          {spot.description && <p className="sd-desc">{spot.description}</p>}
          <div className="sd-info-grid">
            {spot.price && (
              <div className="sd-info-item">
                <span className="sd-info-label">💶 Prix</span>
                <span className="sd-info-val">{spot.price} — {
                  spot.price === '€' ? 'Petit budget' :
                  spot.price === '€€' ? 'Prix modérés' :
                  spot.price === '€€€' ? 'Haut de gamme' : spot.price
                }</span>
              </div>
            )}
            {spot.phone && (
              <div className="sd-info-item">
                <span className="sd-info-label">📞 Téléphone</span>
                <a className="sd-info-val sd-info-link" href={telUrl}>{spot.phone}</a>
              </div>
            )}
          </div>
          {hasHours && (
            <div className="sd-hours">
              <div className="sd-hours-title">Horaires</div>
              {WEEK.map((day) => {
                const h = spot.hours[day];
                return (
                  <div key={day} className={`sd-hours-row${day === TODAY ? ' is-today' : ''}`}>
                    <span className="sd-hours-day">{day}</span>
                    <span className="sd-hours-val">{h ? `${h.open} – ${h.close}` : 'Fermé'}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="sd-actions">
            <a className="sd-btn sd-btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">🧭 Itinéraire</a>
            {resaUrl && <a className="sd-btn sd-btn-resa" href={resaUrl} target="_blank" rel="noreferrer">🗓️ Réserver</a>}
            {telUrl  && <a className="sd-btn" href={telUrl}>📞 Appeler</a>}
            <button className="sd-btn" onClick={share}>{shared ? '✓ Copié' : '↗ Partager'}</button>
            {instaUrl && <a className="sd-btn" href={instaUrl} target="_blank" rel="noreferrer">📸 Instagram</a>}
            {siteUrl  && <a className="sd-btn" href={siteUrl}  target="_blank" rel="noreferrer">🌐 Site web</a>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
