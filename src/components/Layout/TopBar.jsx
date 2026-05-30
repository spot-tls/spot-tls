import './TopBar.css';

export default function TopBar({ onJoinBeta, theme, onToggleTheme, onOpenEvents, onGoMap, onOpenSettings }) {
  return (
    <header className="topbar">
      <button className="topbar-brand" onClick={onGoMap} aria-label="Retour à la carte">
        <div className="topbar-logo">
          <span className="topbar-logo-spot">Spot</span>
          <span className="topbar-logo-fr">TLS</span>
        </div>
        <span className="topbar-city">📍 Toulouse</span>
      </button>

      <div className="topbar-actions">
        <button className="topbar-agenda-btn" onClick={onOpenEvents} aria-label="Ouvrir l'agenda">
          🎫 <span>Agenda</span>
        </button>
        <button
          className="topbar-theme-btn"
          onClick={onToggleTheme}
          aria-label="Changer de thème"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          className="topbar-settings-btn"
          onClick={onOpenSettings}
          aria-label="Paramètres"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
