import { useState } from 'react';
import './AuthModal.css';

const AVATAR_EMOJIS = ['🎉','🔥','🍸','🎶','🌙','⚡','💎','🌴','🎭','🏆','🦋','🎸'];
const AVATAR_COLORS = [
  '#EC4899','#A78BFA','#06B6D4','#4ade80','#FBBF24','#FB7185',
  '#818CF8','#34D399','#F97316','#E879F9','#38BDF8','#A3E635',
];

/**
 * AuthModal — 3 étapes
 * 1. Saisie email → magic link
 * 2. Confirmation "vérifie ta boîte"
 * 3. Choix username + avatar (si premier login)
 */
export default function AuthModal({ onClose, signInWithEmail, createProfile, needsProfile }) {
  const [step,       setStep]       = useState(needsProfile ? 'profile' : 'email');
  const [email,      setEmail]      = useState('');
  const [username,   setUsername]   = useState('');
  const [emoji,      setEmoji]      = useState('🎉');
  const [color,      setColor]      = useState('#A78BFA');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  /* Étape 1 : envoyer magic link */
  async function handleSendLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim().toLowerCase());
      setStep('sent');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  /* Étape 3 : créer le profil */
  async function handleCreateProfile(e) {
    e.preventDefault();
    const u = username.trim();
    if (!u || u.length < 2) { setError('Pseudo trop court (min 2 caractères)'); return; }
    if (u.length > 20) { setError('Pseudo trop long (max 20 caractères)'); return; }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(u)) {
      setError('Lettres, chiffres, _ - . uniquement');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createProfile({ username: u, avatarEmoji: emoji, avatarColor: color });
      onClose();
    } catch (err) {
      if (err.code === '23505') setError('Ce pseudo est déjà pris, choisis-en un autre');
      else setError(err.message || 'Erreur création profil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        {/* Close */}
        {!needsProfile && (
          <button className="auth-close" onClick={onClose}>×</button>
        )}

        {/* ── Étape 1 : email ── */}
        {step === 'email' && (
          <>
            <div className="auth-icon">🔑</div>
            <h2 className="auth-title">Rejoindre SpotTLS</h2>
            <p className="auth-sub">Saisis ton email — on t'envoie un lien magique, aucun mot de passe.</p>
            <form onSubmit={handleSendLink} className="auth-form">
              <input
                className="auth-input"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Envoi…' : '✉️ Envoyer le lien magique'}
              </button>
            </form>
            <p className="auth-disclaimer">
              En continuant, tu acceptes que tes check-ins et avis soient visibles publiquement.
              Tes données sont stockées en Europe (Supabase EU).
            </p>
          </>
        )}

        {/* ── Étape 2 : confirmé ── */}
        {step === 'sent' && (
          <>
            <div className="auth-icon">✉️</div>
            <h2 className="auth-title">Vérifie ta boîte mail</h2>
            <p className="auth-sub">
              On a envoyé un lien à <strong>{email}</strong>.<br />
              Clique dessus pour activer ton compte — ça prend 10 secondes.
            </p>
            <p className="auth-hint">Pas reçu ? Vérifie les spams ou</p>
            <button className="auth-btn-ghost" onClick={() => setStep('email')}>
              Réessayer avec un autre email
            </button>
          </>
        )}

        {/* ── Étape 3 : profil ── */}
        {step === 'profile' && (
          <>
            <div className="auth-icon" style={{ fontSize: 48 }}>{emoji}</div>
            <h2 className="auth-title">Crée ton profil</h2>
            <p className="auth-sub">Choisis ton pseudo et ton avatar — visible par les autres.</p>
            <form onSubmit={handleCreateProfile} className="auth-form">
              <input
                className="auth-input"
                type="text"
                placeholder="ton_pseudo"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={20}
                autoFocus
              />

              {/* Choix emoji */}
              <p className="auth-label">Ton avatar</p>
              <div className="auth-emoji-grid">
                {AVATAR_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    className={`auth-emoji-btn${emoji === e ? ' selected' : ''}`}
                    style={emoji === e ? { background: color + '30', borderColor: color } : {}}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Choix couleur */}
              <p className="auth-label">Couleur</p>
              <div className="auth-color-row">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`auth-color-dot${color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading || !username.trim()}>
                {loading ? 'Création…' : '🚀 C\'est parti !'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
