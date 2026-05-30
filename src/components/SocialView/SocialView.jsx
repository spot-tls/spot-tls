import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getCatConfig } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import './SocialView.css';

const MOODS_LABELS = {
  chill: '🌿 Chill', branche: '⚡ Branché', chic: '💎 Chic',
  underground: '🎛️ Underground', aprem: '☀️ Aprem', jusqu_au_bout: '🔥 Jusqu\'au bout',
};

/* ── Avatar ── */
function Avatar({ profile, size = 38 }) {
  if (!profile) return <div className="sv-avatar-placeholder" style={{ width: size, height: size }} />;
  return (
    <div
      className="sv-avatar"
      style={{ width: size, height: size, background: profile.avatar_color, fontSize: size * 0.45 }}
    >
      {profile.avatar_emoji}
    </div>
  );
}

/* ── Review Card ── */
function ReviewCard({ review, onSpotClick }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const spot  = review.spots;
  const cat   = spot ? getCatConfig(spot.category) : null;
  const date  = new Date(review.created_at);
  const rel   = formatRelative(date);

  return (
    <div className="sv-review-card">
      {/* Header */}
      <div className="sv-review-header">
        <Avatar profile={review.profiles} size={38} />
        <div className="sv-review-meta">
          <span className="sv-review-username">{review.profiles?.username || 'Anonyme'}</span>
          <span className="sv-review-time">{rel}</span>
        </div>
        <div className="sv-review-rating" title={`${review.rating}/5`}>{stars}</div>
      </div>

      {/* Spot */}
      {spot && (
        <button className="sv-review-spot" onClick={() => onSpotClick?.(spot)}>
          <span className="sv-review-spot-icon" style={{ background: cat?.color + '22' }}>
            {cat?.emoji}
          </span>
          <div className="sv-review-spot-info">
            <span className="sv-review-spot-name">{spot.name}</span>
            {spot.quartier && (
              <span className="sv-review-spot-q">📍 {spot.quartier}</span>
            )}
          </div>
          <span className="sv-review-spot-arrow">›</span>
        </button>
      )}

      {/* Mood */}
      {review.mood && (
        <span className="sv-review-mood">{MOODS_LABELS[review.mood] || review.mood}</span>
      )}

      {/* Commentaire */}
      {review.comment && (
        <p className="sv-review-comment">{review.comment}</p>
      )}
    </div>
  );
}

/* ── Checkin actif ── */
function ActiveCheckin({ checkin, onCheckout }) {
  if (!checkin) return null;
  const spot = checkin.spots;
  const cat  = spot ? getCatConfig(spot.category) : null;
  return (
    <div className="sv-active-checkin">
      <div className="sv-checkin-pulse" />
      <div className="sv-checkin-body">
        <span className="sv-checkin-label">Tu es à</span>
        <span className="sv-checkin-spot">{spot?.name || '…'}</span>
        {spot?.quartier && <span className="sv-checkin-q">{spot.quartier}</span>}
      </div>
      <button className="sv-checkin-out" onClick={onCheckout}>Partir →</button>
    </div>
  );
}

/* ── Modal Laisser un avis ── */
function ReviewModal({ spot, checkinId, userId, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0);
  const [mood,    setMood]    = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const MOODS = [
    { key: 'chill',         label: '🌿 Chill'        },
    { key: 'branche',       label: '⚡ Branché'       },
    { key: 'chic',          label: '💎 Chic'          },
    { key: 'underground',   label: '🎛️ Underground'   },
    { key: 'aprem',         label: '☀️ Aprem'         },
    { key: 'jusqu_au_bout', label: '🔥 Jusqu\'au bout'},
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError('Donne une note !'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.from('reviews').insert({
        user_id:    userId,
        spot_id:    spot.id,
        checkin_id: checkinId || null,
        rating,
        mood:    mood || null,
        comment: comment.trim() || null,
        is_public: true,
      });
      if (err) throw err;
      onSubmit();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <button className="sv-modal-close" onClick={onClose}>×</button>
        <h3 className="sv-modal-title">Ton avis sur</h3>
        <p className="sv-modal-spot">{spot.name}</p>

        {/* Stars */}
        <div className="sv-stars-row">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`sv-star${rating >= n ? ' active' : ''}`}
              onClick={() => setRating(n)}
            >★</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Mood */}
          <div className="sv-modal-label">L'ambiance</div>
          <div className="sv-mood-row">
            {MOODS.map(m => (
              <button
                key={m.key}
                type="button"
                className={`sv-mood-chip${mood === m.key ? ' active' : ''}`}
                onClick={() => setMood(v => v === m.key ? '' : m.key)}
              >{m.label}</button>
            ))}
          </div>

          {/* Commentaire */}
          <div className="sv-modal-label">Ton post (optionnel)</div>
          <textarea
            className="sv-textarea"
            placeholder="C'était comment ce soir ? Partage avec la communauté…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            maxLength={280}
          />
          <div className="sv-char-count">{comment.length}/280</div>

          {error && <p className="sv-modal-error">{error}</p>}
          <button className="sv-modal-submit" type="submit" disabled={loading || rating === 0}>
            {loading ? 'Envoi…' : '📮 Publier mon avis'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Utilitaire date relative ── */
function formatRelative(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)   return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ══════════════════════════════════════════════ */
export default function SocialView({ currentUser, currentProfile, spots, userPos, onRequireAuth, onOpenSpot }) {
  const [reviews,      setReviews]      = useState([]);
  const [activeCheckin, setActiveCheckin] = useState(null);
  const [reviewTarget,  setReviewTarget]  = useState(null); // spot à noter
  const [loading,       setLoading]       = useState(true);
  const [showCheckinPicker, setShowCheckinPicker] = useState(false);
  const [reviewAfterCheckin, setReviewAfterCheckin] = useState(false);

  /* Charger le feed de reviews */
  const loadFeed = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (id, username, avatar_emoji, avatar_color),
        spots    (id, name, category, quartier)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error) setReviews(data || []);
    setLoading(false);
  }, []);

  /* Charger le check-in actif de l'user */
  const loadActiveCheckin = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('checkins')
      .select('*, spots(id, name, category, quartier)')
      .eq('user_id', currentUser.id)
      .is('departed_at', null)
      .order('arrived_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveCheckin(data || null);
  }, [currentUser]);

  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { loadActiveCheckin(); }, [loadActiveCheckin]);

  /* Check-in dans un spot */
  async function handleCheckin(spot) {
    if (!currentUser) { onRequireAuth(); return; }
    // Ferme l'ancien check-in s'il y en a un
    if (activeCheckin) {
      await supabase.from('checkins')
        .update({ departed_at: new Date().toISOString() })
        .eq('id', activeCheckin.id);
    }
    const { data } = await supabase.from('checkins').insert({
      user_id:   currentUser.id,
      spot_id:   spot.id,
      is_public: true,
    }).select('*, spots(id, name, category, quartier)').single();
    setActiveCheckin(data);
    setShowCheckinPicker(false);
    if (reviewAfterCheckin) {
      setReviewTarget({ spot, checkinId: data?.id });
      setReviewAfterCheckin(false);
    }
  }

  /* Check-out et proposer une review */
  async function handleCheckout() {
    if (!activeCheckin) return;
    await supabase.from('checkins')
      .update({ departed_at: new Date().toISOString() })
      .eq('id', activeCheckin.id);
    const spot = spots.find(s => s.id === activeCheckin.spot_id) || activeCheckin.spots;
    setActiveCheckin(null);
    if (spot) setReviewTarget({ spot, checkinId: activeCheckin.id });
  }

  /* Stats rapides */
  const myReviewCount  = reviews.filter(r => r.user_id === currentUser?.id).length;
  const openSpotsCount = spots.filter(s => s.hours && Object.keys(s.hours).length > 0 && isOpenNow(s)).length;

  return (
    <div className="socialview">

      {/* ── Header user ── */}
      <div className="sv-header">
        {currentProfile ? (
          <div className="sv-user-row">
            <Avatar profile={currentProfile} size={46} />
            <div className="sv-user-info">
              <span className="sv-username">{currentProfile.username}</span>
              <span className="sv-user-stats">
                {myReviewCount} avis · {openSpotsCount} spots ouverts ce soir
              </span>
            </div>
          </div>
        ) : (
          <div className="sv-login-prompt">
            <span className="sv-login-icon">👤</span>
            <div>
              <div className="sv-login-title">Rejoins la communauté</div>
              <div className="sv-login-sub">Check-in, note tes soirées, partage avec Toulouse</div>
            </div>
            <button className="sv-login-btn" onClick={onRequireAuth}>Rejoindre</button>
          </div>
        )}
      </div>

      {/* ── Check-in actif ── */}
      <ActiveCheckin checkin={activeCheckin} onCheckout={handleCheckout} />

      {/* ── Boutons actions ── */}
      <div className="sv-actions">
        <button
          className="sv-action-btn sv-action-checkin"
          onClick={() => currentUser ? setShowCheckinPicker(true) : onRequireAuth()}
        >
          📍 J'y suis !
        </button>
        <button
          className="sv-action-btn sv-action-review"
          onClick={() => {
            if (!currentUser) { onRequireAuth(); return; }
            if (activeCheckin?.spots) setReviewTarget({ spot: activeCheckin.spots, checkinId: activeCheckin.id });
            else { setReviewAfterCheckin(true); setShowCheckinPicker(true); }
          }}
        >
          ✍️ Laisser un avis
        </button>
      </div>

      {/* ── Picker spot pour check-in ── */}
      {showCheckinPicker && (
        <div className="sv-modal-overlay" onClick={e => e.target === e.currentTarget && setShowCheckinPicker(false)}>
          <div className="sv-modal sv-picker">
            <button className="sv-modal-close" onClick={() => setShowCheckinPicker(false)}>×</button>
            <h3 className="sv-modal-title">Tu es où ?</h3>
            <div className="sv-spot-list">
              {spots
                .filter(s => s.hours && Object.keys(s.hours).length > 0 && isOpenNow(s))
                .slice(0, 20)
                .map(s => {
                  const cat = getCatConfig(s.category);
                  return (
                    <button key={s.id} className="sv-spot-row" onClick={() => handleCheckin(s)}>
                      <span className="sv-spot-row-icon" style={{ background: cat.color + '22' }}>{cat.emoji}</span>
                      <div className="sv-spot-row-info">
                        <span className="sv-spot-row-name">{s.name}</span>
                        {s.quartier && <span className="sv-spot-row-q">📍 {s.quartier}</span>}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Feed reviews ── */}
      <div className="sv-feed-header">
        <span className="sv-feed-title">🗣️ Ce que dit la communauté</span>
        <button className="sv-refresh-btn" onClick={loadFeed}>↻</button>
      </div>

      {loading ? (
        <div className="sv-loading">Chargement du feed…</div>
      ) : reviews.length === 0 ? (
        <div className="sv-empty">
          <span className="sv-empty-icon">🌙</span>
          <p>Sois le premier à partager ta soirée !</p>
        </div>
      ) : (
        <div className="sv-feed">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} onSpotClick={onOpenSpot} />
          ))}
        </div>
      )}

      {/* ── Modal review ── */}
      {reviewTarget && (
        <ReviewModal
          spot={reviewTarget.spot}
          checkinId={reviewTarget.checkinId}
          userId={currentUser?.id}
          onClose={() => setReviewTarget(null)}
          onSubmit={() => { setReviewTarget(null); loadFeed(); }}
        />
      )}
    </div>
  );
}
