import { useState } from 'react';
import { MOODS, QUARTIER_COLORS } from '../../utils/config';
import './AuthModal.css';

const QUARTIERS = [
  'Capitole','Carmes','Saint-Cyprien','Compans','Arnaud-Bernard',
  'Rangueil','Côte Pavée','Borderouge','Empalot','Jolimont',
];

const CURRENT_YEAR = new Date().getFullYear();
const AGE_RANGE = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - 18 - i); // 18-47 ans

/**
 * AuthModal v2 — 3 étapes
 * 1. Choix méthode : Google ou email magic link
 * 2. Email envoyé
 * 3. Setup profil (si nouvel utilisateur)
 */
export default function AuthModal({ onClose, signInWithEmail, signInWithGoogle, createProfile, needsProfile, user }) {
  const [step,      setStep]      = useState(needsProfile ? 'profile' : 'method');
  const [email,     setEmail]     = useState('');
  const [username,  setUsername]  = useState(user?.user_metadata?.full_name?.split(' ')[0]?.toLowerCase() || '');
  const [quartier,  setQuartier]  = useState('');
  const [selMoods,  setSelMoods]  = useState([]);
  const [birthYear, setBirthYear] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  function toggleMood(key) {
    setSelMoods(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key]);
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); setLoading(false); }
  }

  async function handleSendLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try { await signInWithEmail(email.trim().toLowerCase()); setStep('sent'); }
    catch (err) { setError(err.message || 'Erreur envoi'); }
    finally { setLoading(false); }
  }

  async function handleCreateProfile(e) {
    e.preventDefault();
    const u = username.trim().toLowerCase().replace(/\s+/g, '_');
    if (u.length < 2) { setError('Pseudo trop court'); return; }
    if (!/^[a-z0-9_\-\.]+$/.test(u)) { setError('Lettres minuscules, chiffres, _ uniquement'); return; }
    setLoading(true); setError('');
    try {
      await createProfile({
        username: u,
        quartier: quartier || null,
        moods: selMoods,
        birthYear: birthYear ? parseInt(birthYear) : null,
      });
      onClose();
    } catch (err) {
      if (err.code === '23505') setError('Ce pseudo est déjà pris');
      else setError(err.message || 'Erreur création profil');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && !needsProfile && onClose()}>
      <div className="auth-modal">
        {!needsProfile && step !== 'profile' && (
          <button className="auth-close" onClick={onClose}>×</button>
        )}

        {/* ── Étape 1 : choix méthode ── */}
        {step === 'method' && (
          <>
            <div className="auth-icon">🍸</div>
            <h2 className="auth-title">Rejoins SpotTLS</h2>
            <p className="auth-sub">Partage tes soirées, note les spots, rejoins la communauté toulousaine.</p>

            <button
              className="auth-btn-google"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.7 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.6l6.2 5.2C36.9 39.4 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
              Continuer avec Google
            </button>

            <div className="auth-divider"><span>ou</span></div>

            <form onSubmit={handleSendLink} className="auth-form">
              <input
                className="auth-input"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Envoi…' : '✉️ Lien magique par email'}
              </button>
            </form>

            <p className="auth-disclaimer">
              Tes check-ins et avis seront visibles publiquement.
              Données stockées en Europe · RGPD compliant.
            </p>
          </>
        )}

        {/* ── Étape 2 : email envoyé ── */}
        {step === 'sent' && (
          <>
            <div className="auth-icon">✉️</div>
            <h2 className="auth-title">Vérifie ta boîte mail</h2>
            <p className="auth-sub">
              Lien envoyé à <strong>{email}</strong>.<br/>
              Clique dessus pour continuer.
            </p>
            <button className="auth-btn-ghost" onClick={() => setStep('method')}>
              ← Réessayer
            </button>
          </>
        )}

        {/* ── Étape 3 : setup profil ── */}
        {step === 'profile' && (
          <>
            <div className="auth-profile-top">
              {user?.user_metadata?.avatar_url ? (
                <img
                  className="auth-google-avatar"
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                />
              ) : (
                <div className="auth-avatar-placeholder">👤</div>
              )}
              {user?.user_metadata?.full_name && (
                <p className="auth-google-name">Bonjour, {user.user_metadata.full_name.split(' ')[0]} 👋</p>
              )}
            </div>

            <h2 className="auth-title">Personnalise ton profil</h2>
            <p className="auth-sub">Ces infos nous permettent de te montrer les meilleurs spots pour toi.</p>

            <form onSubmit={handleCreateProfile} className="auth-form">
              {/* Pseudo */}
              <div className="auth-field-label">Ton pseudo *</div>
              <input
                className="auth-input"
                type="text"
                placeholder="pseudo_cool"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={20}
                autoFocus
              />

              {/* Quartier */}
              <div className="auth-field-label">Ton quartier (optionnel)</div>
              <div className="auth-quartier-grid">
                {QUARTIERS.map(q => {
                  const color = QUARTIER_COLORS[q] || '#A78BFA';
                  return (
                    <button
                      key={q}
                      type="button"
                      className={`auth-quartier-chip${quartier === q ? ' selected' : ''}`}
                      style={quartier === q ? { borderColor: color, background: color + '20', color } : {}}
                      onClick={() => setQuartier(v => v === q ? '' : q)}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>

              {/* Ambiances favorites */}
              <div className="auth-field-label">Tes ambiances préférées (optionnel)</div>
              <div className="auth-moods-grid">
                {MOODS.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    className={`auth-mood-chip${selMoods.includes(m.key) ? ' selected' : ''}`}
                    onClick={() => toggleMood(m.key)}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              {/* Année de naissance */}
              <div className="auth-field-label">Ton âge (optionnel — aide à personnaliser)</div>
              <select
                className="auth-input auth-select"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
              >
                <option value="">Préfère ne pas dire</option>
                {AGE_RANGE.map(y => (
                  <option key={y} value={y}>{CURRENT_YEAR - y} ans</option>
                ))}
              </select>

              {error && <p className="auth-error">{error}</p>}
              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading || !username.trim()}
              >
                {loading ? 'Création…' : '🚀 C\'est parti !'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
