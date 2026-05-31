import { useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteSpot } from '../../lib/supabaseAdmin';
import { getCatConfig, MOODS, matchMood } from '../../utils/config';
import { isOpenNow, getNextOpening } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import { useReactions, REACTION_EMOJIS } from '../../hooks/useReactions';

const WEEK = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const TODAY = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][new Date().getDay()];

const TAG_COLORS = {
  cosy:'#06B6D4', calme:'#06B6D4', tranquille:'#06B6D4', lounge:'#06B6D4',
  'branché':'#EC4899', hype:'#EC4899', tendance:'#EC4899', dj:'#EC4899',
  chic:'#F59E0B', 'élégant':'#F59E0B', rooftop:'#F59E0B', luxe:'#F59E0B',
  underground:'#7C3AED', alternatif:'#7C3AED', techno:'#7C3AED', rave:'#7C3AED',
  terrasse:'#4ade80', 'extérieur':'#4ade80',
  dansant:'#A78BFA', festif:'#A78BFA', tardif:'#EC4899',
  romantique:'#F472B6', instagrammable:'#F472B6',
  'étudiant':'#22D3EE', pub:'#FCD34D', latino:'#FB7185', 'live-music':'#FB7185',
};

function StarRating({ value }) {
  if (!value) return null;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="sd-stars">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i} className="sd-star-on">★</span>;
        if (i === full && half) return <span key={i} className="sd-star-half">★</span>;
        return <span key={i} className="sd-star-off">☆</span>;
      })}
      <span className="sd-stars-val">{value}</span>
    </span>
  );
}

function Gallery({ photos, name }) {
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});
  const valid = photos.filter((_, i) => !err[i]);
  if (!valid.length) return null;
  return (
    <div className="sd-gallery">
      <div className="sd-gallery-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {photos.map((url, i) => err[i] ? null : (
          <img key={i} src={url} alt={`${name} ${i + 1}`} className="sd-gallery-img"
            onError={() => setErr(e => ({ ...e, [i]: true }))} />
        ))}
      </div>
      {valid.length > 1 && (
        <>
          {idx > 0 && <button className="sd-gallery-arrow left" onClick={e => { e.stopPropagation(); setIdx(v => v - 1); }}>‹</button>}
          {idx < valid.length - 1 && <button className="sd-gallery-arrow right" onClick={e => { e.stopPropagation(); setIdx(v => v + 1); }}>›</button>}
          <div className="sd-gallery-dots">
            {valid.map((_, i) => (
              <button key={i} className={`sd-gallery-dot${i === idx ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SpotDetail({ spot, onClose, isFavorite, onToggleFavorite, userPos, onEdit, onReposition, onDelete }) {
  const [shared, setShared]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const { react, getReactions, getUserVote } = useReactions();

  if (!spot) return null;

  const cat      = getCatConfig(spot.category);
  const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
  const open     = hasHours ? isOpenNow(spot) : null;
  const next     = open === false ? getNextOpening(spot) : null;
  const fav      = isFavorite?.(spot.id);
  const dist     = userPos ? distanceKm(userPos, { lat: spot.lat, lng: spot.lng }) : null;
  const moods    = MOODS.filter(m => matchMood(spot, m.key));
  const photos   = spot.photos?.length ? spot.photos : spot.photo_url ? [spot.photo_url] : [];
  const hasPhoto = photos.length > 0;
  const isCoup   = (spot.google_rating || 0) >= 4.5;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + (spot.address || ''))}`;
  const instaUrl = spot.insta ? (spot.insta.startsWith('http') ? spot.insta : `https://instagram.com/${spot.insta.replace(/^@/, '')}`) : null;
  const siteUrl  = spot.website || null;
  const telUrl   = spot.phone ? `tel:${spot.phone.replace(/\s/g, '')}` : null;
  const resaUrl  = spot.reservation_url || null;

  const share = async () => {
    const url  = `https://spot-tls.vercel.app/?spot=${spot.id}`;
    const text = `${spot.name} — ${spot.category}${spot.quartier ? ' · ' + spot.quartier : ''}\n📍 Découvre ce spot sur SpotTLS`;
    if (navigator.share) {
      try { await navigator.share({ title: spot.name, text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); } catch {}
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try { await deleteSpot(spot.id); onDelete?.(spot.id); onClose(); }
    catch (e) { alert('Erreur : ' + e.message); setDeleting(false); }
  };

  /* Boutons d'action en overlay sur le hero */
  const HeroActions = () => (
    <div className="sd-hero-actions">
      {onToggleFavorite && (
        <button className={`sd-hero-btn${fav ? ' fav' : ''}`} onClick={() => onToggleFavorite(spot.id)}>
          {fav ? '❤️' : '🤍'}
        </button>
      )}
      <button className="sd-hero-btn" onClick={share}>{shared ? '✓' : '↗'}</button>
      {onEdit && <button className="sd-hero-btn" onClick={() => onEdit(spot)}>✏️</button>}
      <button className="sd-hero-btn sd-hero-close" onClick={onClose}>×</button>
    </div>
  );

  return createPortal(
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-sheet" onClick={e => e.stopPropagation()}>
        <div className="sd-handle" />

        {/* ── HERO ── */}
        {hasPhoto ? (
          <div className="sd-hero sd-hero--photo">
            <Gallery photos={photos} name={spot.name} />
            <div className="sd-hero-fade" />
            <HeroActions />
            {isCoup && <div className="sd-coup-badge">❤️ Coup de cœur</div>}
            <div className="sd-hero-bottom">
              <h2 className="sd-hero-name">{spot.name}</h2>
              <div className="sd-hero-meta">
                <span style={{ color: cat.color }}>{cat.emoji} {spot.category}</span>
                {spot.quartier && <span className="sd-hero-dot" />}
                {spot.quartier && <span>{spot.quartier}</span>}
                {open !== null && <span className="sd-hero-dot" />}
                {open === true  && <span className="sd-status-open">● Ouvert</span>}
                {open === false && <span className="sd-status-closed">{next ? `Ouvre ${next.day} ${next.time}` : 'Fermé'}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="sd-hero sd-hero--gradient" style={{ background: cat.gradient }}>
            <div className="sd-hero-gradient-overlay" />
            <HeroActions />
            {isCoup && <div className="sd-coup-badge">❤️ Coup de cœur</div>}
            <div className="sd-hero-bottom">
              <div className="sd-hero-emoji">{cat.emoji}</div>
              <div>
                <h2 className="sd-hero-name">{spot.name}</h2>
                <div className="sd-hero-meta">
                  <span>{spot.category}</span>
                  {spot.quartier && <span className="sd-hero-dot" />}
                  {spot.quartier && <span>{spot.quartier}</span>}
                  {open !== null && <span className="sd-hero-dot" />}
                  {open === true  && <span className="sd-status-open">● Ouvert</span>}
                  {open === false && <span className="sd-status-closed">{next ? `Ouvre ${next.day} ${next.time}` : 'Fermé'}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INFOS RAPIDES ── */}
        <div className="sd-quickinfo">
          {spot.google_rating && (
            <div className="sd-qi-item">
              <StarRating value={spot.google_rating} />
            </div>
          )}
          {dist != null && (
            <div className="sd-qi-item sd-qi-sep">
              📍 {formatDistance(dist)}
            </div>
          )}
          {spot.price && (
            <div className="sd-qi-item sd-qi-sep">
              <span className="sd-price">{spot.price}</span>
            </div>
          )}
          {open === null && (
            <div className="sd-qi-item sd-qi-sep sd-qi-muted">Horaires à venir</div>
          )}
        </div>

        {/* ── RÉACTIONS ── */}
        <div className="sd-reactions">
          {REACTION_EMOJIS.map(emoji => {
            const count = getReactions(spot.id)[emoji] || 0;
            const sel   = getUserVote(spot.id) === emoji;
            return (
              <button key={emoji} className={`sd-reaction${sel ? ' active' : ''}`} onClick={() => react(spot.id, emoji)}>
                <span>{emoji}</span>
                {count > 0 && <span className="sd-reaction-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── ACTIONS PRINCIPALES ── */}
        <div className="sd-actions-row">
          <a className="sd-action-primary" href={mapsUrl} target="_blank" rel="noreferrer">
            🧭 Itinéraire
          </a>
          {resaUrl && (
            <a className="sd-action-secondary" href={resaUrl} target="_blank" rel="noreferrer">
              📅 Réserver
            </a>
          )}
          <button className="sd-action-secondary" onClick={share}>
            {shared ? '✓ Copié' : '↗ Partager'}
          </button>
          {telUrl && <a className="sd-action-secondary" href={telUrl}>📞</a>}
          {instaUrl && <a className="sd-action-secondary" href={instaUrl} target="_blank" rel="noreferrer">📸</a>}
          {siteUrl && <a className="sd-action-secondary" href={siteUrl} target="_blank" rel="noreferrer">🌐</a>}
        </div>

        {/* ── CORPS ── */}
        <div className="sd-body">

          {/* Adresse */}
          {spot.address && (
            <a className="sd-address" href={mapsUrl} target="_blank" rel="noreferrer">
              📍 {spot.address}
            </a>
          )}

          {/* Description */}
          {spot.description && <p className="sd-desc">{spot.description}</p>}

          {/* Tags ambiance */}
          {(spot.vibe_tags?.length > 0 || moods.length > 0) && (
            <div className="sd-tags-row">
              {spot.vibe_tags?.map(t => {
                const color = TAG_COLORS[t.toLowerCase()] || cat.color;
                return <span key={t} className="sd-tag" style={{ '--tc': color }}>#{t}</span>;
              })}
              {moods.map(m => (
                <span key={m.key} className="sd-mood-pill">{m.emoji} {m.label}</span>
              ))}
            </div>
          )}

          {/* Réservation banner */}
          {resaUrl && (
            <a className="sd-resa-banner" href={resaUrl} target="_blank" rel="noreferrer">
              <div>
                <div className="sd-resa-title">Disponibilités en ligne</div>
                <div className="sd-resa-sub">TheFork, Shotgun ou site officiel</div>
              </div>
              <span className="sd-resa-btn">📅 Réserver</span>
            </a>
          )}

          {/* Horaires */}
          {hasHours && (
            <div className="sd-hours">
              <div className="sd-hours-title">Horaires</div>
              {WEEK.map(day => {
                const h = spot.hours[day];
                return (
                  <div key={day} className={`sd-hours-row${day === TODAY ? ' today' : ''}`}>
                    <span className="sd-hours-day">{day}</span>
                    <span className="sd-hours-val">{h ? `${h.open} – ${h.close}` : 'Fermé'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact */}
          {spot.phone && (
            <a className="sd-contact-row" href={telUrl}>
              📞 {spot.phone}
            </a>
          )}

        </div>

        {/* ── ADMIN (discret, tout en bas) ── */}
        {onReposition && (
          <div className="sd-admin">
            <button className="sd-admin-btn" onClick={() => { onClose(); onReposition(spot); }}>
              📍 Repositionner
            </button>
            <button
              className={`sd-admin-btn sd-admin-delete${confirmDel ? ' confirm' : ''}`}
              onClick={handleDelete} disabled={deleting}
            >
              {deleting ? '...' : confirmDel ? '⚠️ Confirmer' : '🗑️ Supprimer'}
            </button>
            {confirmDel && <button className="sd-admin-btn" onClick={() => setConfirmDel(false)}>Annuler</button>}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
