import { useState, useEffect, useCallback } from 'react';
import { MapPin, PenLine, MessageCircle, RefreshCw, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCatConfig } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import './SocialView.css';

const MOODS_LABELS = {
  chill: '🌿 Chill', branche: '⚡ Branché', chic: '💎 Chic',
  underground: '🎛️ Underground', aprem: '☀️ Aprem', jusqu_au_bout: "🔥 Jusqu'au bout",
};

function Avatar({ profile, size = 38 }) {
  if (!profile) return <div className="sv-avatar-placeholder" style={{ width: size, height: size }} />;
  if (profile.avatar_url) {
    return <img className="sv-avatar sv-avatar-img" src={profile.avatar_url} alt={profile.username} style={{ width: size, height: size }} />;
  }
  return (
    <div className="sv-avatar" style={{ width: size, height: size, background: profile.avatar_color || '#A78BFA', fontSize: size * 0.45 }}>
      {profile.avatar_emoji || '🎉'}
    </div>
  );
}

function ReviewCard({ review, spotsMap, onSpotClick }) {
  const rating = review.rating || 0;
  const stars  = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
  const spot   = spotsMap?.[review.spot_id] || null;
  const cat    = spot ? getCatConfig(spot.category) : null;
  const rel    = formatRelative(new Date(review.created_at));
  return (
    <div className="sv-review-card">
      <div className="sv-review-header">
        <Avatar profile={review.profiles} size={38} />
        <div className="sv-review-meta">
          <span className="sv-review-username">{review.profiles?.username || 'Anonyme'}</span>
          <span className="sv-review-time">{rel}</span>
        </div>
        <div className="sv-review-rating">{stars}</div>
      </div>
      {spot && (
        <button className="sv-review-spot" onClick={() => onSpotClick?.(spot)}>
          <span className="sv-review-spot-icon" style={{ background: (cat?.color || '#A78BFA') + '22' }}>{cat?.emoji || '📍'}</span>
          <div className="sv-review-spot-info">
            <span className="sv-review-spot-name">{spot.name}</span>
            {spot.quartier && <span className="sv-review-spot-q">{spot.quartier}</span>}
          </div>
          <span className="sv-review-spot-arrow">›</span>
        </button>
      )}
      {review.mood && <span className="sv-review-mood">{MOODS_LABELS[review.mood] || review.mood}</span>}
      {review.comment && <p className="sv-review-comment">{review.comment}</p>}
    </div>
  );
}

function ActiveCheckin({ checkin, spot, onCheckout }) {
  if (!checkin) return null;
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

function ReviewModal({ spot, checkinId, userId, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0);
  const [mood,    setMood]    = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const MOODS = [
    { key: 'chill',         label: '🌿 Chill'         },
    { key: 'branche',       label: '⚡ Branché'      },
    { key: 'chic',          label: '💎 Chic'          },
    { key: 'underground',   label: '🎛️ Underground' },
    { key: 'aprem',         label: '☀️ Aprem'       },
    { key: 'jusqu_au_bout', label: "🔥 Jusqu'au bout" },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError('Donne une note !'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.from('reviews').insert({
        user_id: userId, spot_id: spot.id, checkin_id: checkinId || null,
        rating, mood: mood || null, comment: comment.trim() || null, is_public: true,
      });
      if (err) throw err;
      onSubmit(); onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally { setLoading(false); }
  }

  return (
    <div className="sv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <button className="sv-modal-close" onClick={onClose}>×</button>
        <h3 className="sv-modal-title">Ton avis sur</h3>
        <p className="sv-modal-spot">{spot?.name}</p>
        <div className="sv-stars-row">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button" className={`sv-star${rating >= n ? ' active' : ''}`} onClick={() => setRating(n)}>★</button>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="sv-modal-label">L'ambiance</div>
          <div className="sv-mood-row">
            {MOODS.map(m => (
              <button key={m.key} type="button" className={`sv-mood-chip${mood === m.key ? ' active' : ''}`} onClick={() => setMood(v => v === m.key ? '' : m.key)}>{m.label}</button>
            ))}
          </div>
          <div className="sv-modal-label">Ton post (optionnel)</div>
          <textarea className="sv-textarea" placeholder="C'était comment ce soir ? Partage avec la communauté…" value={comment} onChange={e => setComment(e.target.value)} rows={3} maxLength={280} />
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

function distM(lat1, lon1, lat2, lon2) {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(m) { return m < 1000 ? Math.round(m)+'m' : (m/1000).toFixed(1)+'km'; }

function SpotPicker({ spots, userPos, onSelect, onClose }) {
  const [search,   setSearch]   = useState('');
  const [quartier, setQuartier] = useState('');
  const [sortMode, setSortMode] = useState('open');

  const quartiers = [...new Set((spots||[]).map(s => s.quartier).filter(Boolean))].sort();
  const hasGps = !!userPos;

  const withDist = (spots||[]).map(s => ({
    ...s,
    _dist: (userPos && s.lat && s.lng) ? distM(userPos.lat, userPos.lng, s.lat, s.lng) : null,
  }));

  const filtered = withDist
    .filter(s => {
      if (quartier && s.quartier !== quartier) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.quartier||'').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortMode === 'near' && a._dist !== null && b._dist !== null) return a._dist - b._dist;
      if (sortMode === 'alpha') return a.name.localeCompare(b.name);
      const aO = a.hours && Object.keys(a.hours).length > 0 && isOpenNow(a);
      const bO = b.hours && Object.keys(b.hours).length > 0 && isOpenNow(b);
      if (aO && !bO) return -1; if (!aO && bO) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 50);

  return (
    <div className="sv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal sv-picker">
        <button className="sv-modal-close" onClick={onClose}>×</button>
        <h3 className="sv-modal-title">Tu es où ?</h3>
        <input className="sv-picker-search" type="text" placeholder="Rechercher un spot…" value={search}
          onChange={e => { setSearch(e.target.value); setQuartier(''); }} autoFocus />
        <div className="sv-picker-sort">
          <button className={`sv-sort-btn${sortMode==='open'  ? ' active' : ''}`} onClick={() => setSortMode('open')}>🟢 Ouverts</button>
          {hasGps && <button className={`sv-sort-btn${sortMode==='near' ? ' active' : ''}`} onClick={() => setSortMode('near')}>📍 Près de moi</button>}
          <button className={`sv-sort-btn${sortMode==='alpha' ? ' active' : ''}`} onClick={() => setSortMode('alpha')}>A–Z</button>
        </div>
        {!search && quartiers.length > 0 && (
          <div className="sv-picker-quartiers">
            <button className={`sv-quartier-chip${quartier==='' ? ' active' : ''}`} onClick={() => setQuartier('')}>Tous</button>
            {quartiers.map(q => (
              <button key={q} className={`sv-quartier-chip${quartier===q ? ' active' : ''}`} onClick={() => setQuartier(v => v===q ? '' : q)}>{q}</button>
            ))}
          </div>
        )}
        <div className="sv-spot-list">
          {filtered.length === 0 && <div className="sv-picker-empty">Aucun spot trouvé</div>}
          {filtered.map(s => {
            const cat = getCatConfig(s.category);
            const isOpen = s.hours && Object.keys(s.hours).length > 0 && isOpenNow(s);
            return (
              <button key={s.id} className="sv-spot-row" onClick={() => onSelect(s)}>
                <span className="sv-spot-row-icon" style={{ background: cat.color+'22' }}>{cat.emoji}</span>
                <div className="sv-spot-row-info">
                  <span className="sv-spot-row-name">{s.name}</span>
                  <span className="sv-spot-row-q">
                    {s.quartier && <span>📍 {s.quartier}</span>}
                    {s._dist !== null && <span> · {fmtDist(s._dist)}</span>}
                  </span>
                </div>
                {isOpen && <span className="sv-spot-row-open">Ouvert</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatRelative(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return "il y a quelques secondes";
  if (diff < 3600)  return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function SocialView({ currentUser, currentProfile, spots, userPos, onRequireAuth, onOpenSpot }) {
  const [reviews,            setReviews]           = useState([]);
  const [activeCheckin,      setActiveCheckin]      = useState(null);
  const [reviewTarget,       setReviewTarget]       = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [showCheckinPicker,  setShowCheckinPicker]  = useState(false);
  const [reviewAfterCheckin, setReviewAfterCheckin] = useState(false);

  const spotsMap   = Object.fromEntries((spots||[]).map(s => [s.id, s]));
  const activeSpot = activeCheckin ? (spotsMap[activeCheckin.spot_id] || null) : null;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles (id, username, avatar_emoji, avatar_color, avatar_url)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error) setReviews(data || []);
    setLoading(false);
  }, []);

  const loadActiveCheckin = useCallback(async () => {
    if (!currentUser) { setActiveCheckin(null); return; }
    const { data, error } = await supabase
      .from('checkins')
      .select('id, spot_id, arrived_at, is_public')
      .eq('user_id', currentUser.id)
      .is('departed_at', null)
      .order('arrived_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) setActiveCheckin(data || null);
  }, [currentUser]);

  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { loadActiveCheckin(); }, [loadActiveCheckin]);

  async function handleCheckin(spot) {
    if (!currentUser) { onRequireAuth(); return; }
    try {
      if (activeCheckin) {
        await supabase.from('checkins').update({ departed_at: new Date().toISOString() }).eq('id', activeCheckin.id);
      }
      const { data, error } = await supabase
        .from('checkins')
        .insert({ user_id: currentUser.id, spot_id: spot.id, is_public: true })
        .select('id, spot_id, arrived_at, is_public')
        .single();
      if (error) throw error;
      setActiveCheckin(data);
      setShowCheckinPicker(false);
      if (reviewAfterCheckin) { setReviewTarget({ spot, checkinId: data?.id }); setReviewAfterCheckin(false); }
    } catch (err) { console.error('Check-in error:', err.message); }
  }

  async function handleCheckout() {
    if (!activeCheckin) return;
    try {
      await supabase.from('checkins').update({ departed_at: new Date().toISOString() }).eq('id', activeCheckin.id);
      const spot = activeSpot;
      setActiveCheckin(null);
      if (spot) setReviewTarget({ spot, checkinId: activeCheckin.id });
    } catch (err) { console.error('Checkout error:', err.message); }
  }

  const myReviewCount  = reviews.filter(r => r.user_id === currentUser?.id).length;
  const openSpotsCount = (spots||[]).filter(s => s.hours && Object.keys(s.hours).length > 0 && isOpenNow(s)).length;

  return (
    <div className="socialview">
      <div className="sv-header">
        {currentProfile ? (
          <div className="sv-user-row">
            <Avatar profile={currentProfile} size={46} />
            <div className="sv-user-info">
              <span className="sv-username">{currentProfile.username}</span>
              <span className="sv-user-stats">{myReviewCount} avis · {openSpotsCount} spots ouverts ce soir</span>
            </div>
          </div>
        ) : (
          <div className="sv-login-prompt">
            <span className="sv-login-icon"><User size={22} strokeWidth={1.8} /></span>
            <div>
              <div className="sv-login-title">Rejoins la communauté</div>
              <div className="sv-login-sub">Check-in, note tes soirées, partage avec Toulouse</div>
            </div>
            <button className="sv-login-btn" onClick={onRequireAuth}>Rejoindre</button>
          </div>
        )}
      </div>

      <ActiveCheckin checkin={activeCheckin} spot={activeSpot} onCheckout={handleCheckout} />

      <div className="sv-actions">
        <button className="sv-action-btn sv-action-checkin" onClick={() => currentUser ? setShowCheckinPicker(true) : onRequireAuth()}>
          <MapPin size={15} strokeWidth={2} /> J'y suis !
        </button>
        <button className="sv-action-btn sv-action-review" onClick={() => {
          if (!currentUser) { onRequireAuth(); return; }
          if (activeCheckin && activeSpot) { setReviewTarget({ spot: activeSpot, checkinId: activeCheckin.id }); }
          else { setReviewAfterCheckin(true); setShowCheckinPicker(true); }
        }}>
          <PenLine size={15} strokeWidth={2} /> Laisser un avis
        </button>
      </div>

      {showCheckinPicker && (
        <SpotPicker spots={spots||[]} userPos={userPos} onSelect={handleCheckin}
          onClose={() => { setShowCheckinPicker(false); setReviewAfterCheckin(false); }} />
      )}

      <div className="sv-feed-header">
        <span className="sv-feed-title">
          <MessageCircle size={16} strokeWidth={2} className="sv-feed-title-icon" />
          Ce que dit la communauté
        </span>
        <button className="sv-refresh-btn" onClick={loadFeed}><RefreshCw size={15} strokeWidth={2} /></button>
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
            <ReviewCard key={r.id} review={r} spotsMap={spotsMap} onSpotClick={onOpenSpot} />
          ))}
        </div>
      )}

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
