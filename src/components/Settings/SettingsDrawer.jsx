import './SettingsDrawer.css';

export default function SettingsDrawer({ onClose, theme, onToggleTheme, onJoinBeta, admin, onSecretTap, editCount, onExportJson, onSignOut, profile, onRequireAuth }) {
  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-drawer">
        <div className="settings-handle" />
        <div className="settings-header">
          <span className="settings-title">⚙️ Paramètres</span>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        {/* ── Compte ── */}
        <div className="settings-section">
          <div className="settings-section-label">Compte</div>
          {profile ? (
            <>
              <div className="settings-row settings-row-info">
                <div className="settings-row-avatar" style={{ background: profile.avatar_color }}>
                  {profile.avatar_emoji}
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">{profile.username}</span>
                  <span className="settings-row-sub">Connecté</span>
                </div>
              </div>
              <button className="settings-row settings-row-danger" onClick={onSignOut}>
                <span className="settings-row-icon">🚪</span>
                <span className="settings-row-title">Se déconnecter</span>
              </button>
            </>
          ) : (
            <button className="settings-row" onClick={() => { onRequireAuth(); onClose(); }}>
              <span className="settings-row-icon">👤</span>
              <div className="settings-row-text">
                <span className="settings-row-title">Créer mon profil</span>
                <span className="settings-row-sub">Check-in, avis, communauté</span>
              </div>
              <span className="settings-row-arrow">›</span>
            </button>
          )}
        </div>

        {/* ── Apparence ── */}
        <div className="settings-section">
          <div className="settings-section-label">Apparence</div>
          <div className="settings-row">
            <span className="settings-row-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <div className="settings-row-text">
              <span className="settings-row-title">Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
              <span className="settings-row-sub">Thème actuel de l'app</span>
            </div>
            <button
              className={`settings-toggle${theme === 'dark' ? ' on' : ''}`}
              onClick={onToggleTheme}
            >
              <div className="settings-toggle-thumb" />
            </button>
          </div>
        </div>

        {/* ── Beta ── */}
        <div className="settings-section">
          <div className="settings-section-label">Bêta & communauté</div>
          <button className="settings-row" onClick={() => { onJoinBeta(); onClose(); }}>
            <span className="settings-row-icon">✨</span>
            <div className="settings-row-text">
              <span className="settings-row-title">Rejoindre la bêta</span>
              <span className="settings-row-sub">Accès anticipé · Nouvelles fonctionnalités</span>
            </div>
            <span className="settings-row-arrow">›</span>
          </button>
        </div>

        {/* ── Données ── */}
        {editCount > 0 && (
          <div className="settings-section">
            <div className="settings-section-label">Données</div>
            <button className="settings-row" onClick={onExportJson}>
              <span className="settings-row-icon">📥</span>
              <div className="settings-row-text">
                <span className="settings-row-title">Exporter mes données</span>
                <span className="settings-row-sub">{editCount} modifications locales</span>
              </div>
              <span className="settings-row-arrow">›</span>
            </button>
          </div>
        )}

        {/* ── Admin (caché) ── */}
        <div className="settings-section">
          <div className="settings-section-label">Zone secrète</div>
          <button className="settings-row" onClick={onSecretTap}>
            <span className="settings-row-icon">{admin ? '🔓' : '🔒'}</span>
            <div className="settings-row-text">
              <span className="settings-row-title">{admin ? 'Mode admin actif' : 'Mode admin'}</span>
              <span className="settings-row-sub">{admin ? 'Ajouter, déplacer, supprimer' : 'Tape 5x pour déverrouiller'}</span>
            </div>
          </button>
        </div>

        <div className="settings-footer">SpotTLS · Toulouse · Bêta 2025</div>
      </div>
    </div>
  );
}
