import './BottomNav.css';

const TABS = [
  { key: 'home',    label: 'Accueil',   emoji: '🏠' },
  { key: 'map',     label: 'Carte',     emoji: '🗺️' },
  { key: 'favs',    label: 'Favoris',   emoji: '❤️' },
  { key: 'search',  label: 'Recherche', emoji: '🔍' },
  { key: 'profile', label: 'Profil',    emoji: '👤' },
];

export default function BottomNav({ activePage, onChange, favCount = 0 }) {
  return (
    <nav className="bottomnav">
      {TABS.map((tab) => {
        const active = activePage === tab.key;
        return (
          <button
            key={tab.key}
            className={"bottomnav-tab" + (active ? ' active' : '')}
            onClick={() => onChange(tab.key)}
          >
            <span className="bottomnav-emoji">
              {tab.emoji}
              {tab.key === 'favs' && favCount > 0 && (
                <span className="bottomnav-badge">{favCount}</span>
              )}
            </span>
            <span className="bottomnav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
