import { useMemo, useState } from 'react';
import { MOODS } from '../../utils/config';
import './ProfileView.css';

const PREF_KEY = 'spotfr_prefs_v1';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
}

function Avatar({ name }) {
  const letter = (name || 'S')[0].toUpperCase();
  return (
    <div className="pv-avatar">
      <div className="pv-avatar-inner"><span>{letter}</span></div>
      <div className="pv-avatar-ring" />
    </div>
  );
}

export default function ProfileView({
  spots, favoriteIds, theme, onToggleTheme, onJoinBeta, editCount = 0, onExportJson,
  admin, onSecretTap,
}) {
  const [prefs, setPrefs]       = useState(loadPrefs);
  const [feedback, setFeedback] = useState('');
  const [fbSent, setFbSent]     = useState(false);
  const [copied, setCopied]     = useState(false);

  const favCount       = favoriteIds?.size ?? 0;
  const spotsCount     = spots?.length ?? 0;
  const quartiersCount = useMemo(() => {
    if (!spots) return 0;
    return new Set(spots.map((s) => s.quartier).filter(Boolean)).size;
  }, [spots]);

  const toggleMood = (key) => {
    const moods = prefs.moods || [];
    const next  = moods.includes(key) ? moods.filter((m) => m !== key) : [...moods, key];
    const updated = { ...prefs, moods: next };
    setPrefs(updated);
    savePrefs(updated);
  };

  const sendFeedback = () => {
    if (!feedback.trim()) return;
    setFbSent(true);
    setFeedback('');
    setTimeout(() => setFbSent(false), 3000);
  };

  const shareApp = async () => {
    const text = 'SpotFR \u2014 Les meilleures sorties a Toulouse\nhttps://spotfr.app';
    if (navigator.share) {
      try { await navigator.share({ title: 'SpotFR', text, url: 'https://spotfr.app' }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    }
  };

  return (
    <div className="profileview">

      {/* Hero card */}
      <div className="pv-hero">
        <div className="pv-hero-bg" />
        <Avatar name="Toi" />
        <div className="pv-hero-info">
          <div className="pv-hero-name">Mon profil</div>
          <div className="pv-hero-sub">Explorateur de Toulouse</div>
        </div>
        <div className="pv-stats">
          <div className="pv-stat">
            <span className="pv-stat-val">{favCount}</span>
            <span className="pv-stat-label">Favoris</span>
          </div>
          <div className="pv-stat-sep" />
          <div className="pv-stat">
            <span className="pv-stat-val">{spotsCount}</span>
            <span className="pv-stat-label">Spots dispo</span>
          </div>
          <div className="pv-stat-sep" />
          <div className="pv-stat">
            <span className="pv-stat-val">{quartiersCount}</span>
            <span className="pv-stat-label">Quartiers</span>
          </div>
        </div>
      </div>

      <div className="pv-sections">

        {/* Preferences ambiance */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-icon">⚡</span>
            <div>
              <div className="pv-section-title">Mes ambiances</div>
              <div className="pv-section-sub">Selectionne tes vibes preferees</div>
            </div>
          </div>
          <div className="pv-mood-grid">
            {MOODS.map((m) => {
              const active = (prefs.moods || []).includes(m.key);
              return (
                <button key={m.key} className={`pv-mood-chip${active ? ' active' : ''}`} onClick={() => toggleMood(m.key)}>
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                  {active && <span className="pv-mood-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-icon">🎨</span>
            <div>
              <div className="pv-section-title">Apparence</div>
              <div className="pv-section-sub">Personnalise l&#39;interface</div>
            </div>
          </div>
          <div className="pv-row" onClick={onToggleTheme}>
            <div className="pv-row-left">
              <span className="pv-row-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <div>
                <div className="pv-row-label">Mode {theme === 'dark' ? 'sombre' : 'clair'}</div>
                <div className="pv-row-sub">Theme actuel de l&#39;app</div>
              </div>
            </div>
            <div className={`pv-toggle${theme === 'dark' ? ' on' : ''}`}>
              <div className="pv-toggle-knob" />
            </div>
          </div>
        </div>

        {/* Admin — Export */}
        {onExportJson && (
          <div className="pv-section">
            <div className="pv-section-header">
              <span className="pv-section-icon">🗃️</span>
              <div>
                <div className="pv-section-title">Donnees spots</div>
                <div className="pv-section-sub">{editCount} spot{editCount !== 1 ? 's' : ''} modifie{editCount !== 1 ? 's' : ''} localement</div>
              </div>
            </div>
            <button className="pv-row" onClick={onExportJson}>
              <div className="pv-row-left">
                <span className="pv-row-icon">📥</span>
                <div>
                  <div className="pv-row-label">Exporter spots_updated.json</div>
                  <div className="pv-row-sub">Telecharge les donnees avec tes modifications</div>
                </div>
              </div>
              <span className="pv-row-chevron">›</span>
            </button>
          </div>
        )}

        {/* Beta & partage */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-icon">✨</span>
            <div>
              <div className="pv-section-title">Beta &amp; communaute</div>
              <div className="pv-section-sub">Fais partie de l&#39;aventure</div>
            </div>
          </div>

          <button className="pv-cta-card" onClick={onJoinBeta}>
            <div className="pv-cta-card-left">
              <div className="pv-cta-card-title">Rejoindre la beta</div>
              <div className="pv-cta-card-sub">Acces anticipe · Nouvelles fonctionnalites</div>
            </div>
            <span className="pv-cta-card-arrow">→</span>
          </button>

          <button className="pv-row" onClick={shareApp}>
            <div className="pv-row-left">
              <span className="pv-row-icon">↗</span>
              <div>
                <div className="pv-row-label">{copied ? 'Lien copie !' : 'Inviter des amis'}</div>
                <div className="pv-row-sub">Partager SpotFR autour de toi</div>
              </div>
            </div>
            <span className="pv-row-chevron">›</span>
          </button>

          <div className="pv-feedback">
            <div className="pv-feedback-label">💬 Ton avis compte</div>
            <textarea
              className="pv-feedback-input"
              placeholder="Une idee, un bug, un spot manquant..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <button
              className={`pv-feedback-send${fbSent ? ' sent' : ''}`}
              onClick={sendFeedback}
              disabled={!feedback.trim()}
            >
              {fbSent ? 'Envoye, merci !' : 'Envoyer'}
            </button>
          </div>
        </div>

        {/* Admin access */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-icon">🔑</span>
            <div>
              <div className="pv-section-title">Administration</div>
              <div className="pv-section-sub">{admin ? 'Mode admin actif' : 'Accès équipe SpotTLS'}</div>
            </div>
          </div>
          <button className="pv-row" onClick={onSecretTap}>
            <div c