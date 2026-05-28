import './TopBar.css';

export default function TopBar({ onJoinBeta, theme, onToggleTheme, onOpenEvents, onGoMap }) {
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
        <button
          className="topbar-theme-btn"
          onClick={onOpenEvents}
          aria-label="Événements"
          title="Agenda des sorties"
        >
          🎫
        </button>
        <button
          className="topbar-theme-btn"
          onClick={onToggleTheme}
          aria-label="Changer de thème"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="btn-pill topbar-beta" onClick={onJoinBeta}>
          Rejoindre la bêta
        </button>
      </div>
    </header>
  );
}
