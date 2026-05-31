import { CalendarDays, Sun, Moon, Settings } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ onJoinBeta, theme, onToggleTheme, onOpenEvents, onGoMap, onOpenSettings }) {
  return (
    <header className="topbar">
      <button className="topbar-brand" onClick={onGoMap} aria-label="Retour à la carte">
        <img
          src="/logo.png"
          alt="Spot"
          className="topbar-logo-img"
        />
        <span className="topbar-city">Toulouse</span>
      </button>

      <div className="topbar-actions">
        <button className="topbar-agenda-btn" onClick={onOpenEvents} aria-label="Ouvrir l'agenda">
          <CalendarDays size={14} strokeWidth={2} />
          <span>Agenda</span>
        </button>
        <button
          className="topbar-theme-btn"
          onClick={onToggleTheme}
          aria-label="Changer de thème"
        >
          {theme === 'dark'
            ? <Sun size={16} strokeWidth={1.8} />
            : <Moon size={16} strokeWidth={1.8} />}
        </button>
        <button
          className="topbar-settings-btn"
          onClick={onOpenSettings}
          aria-label="Paramètres"
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
