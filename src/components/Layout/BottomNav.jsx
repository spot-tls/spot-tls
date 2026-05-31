import { Home, Map, Heart, Search, Martini } from 'lucide-react';
import './BottomNav.css';

const TABS = [
  { key: 'home',   label: 'Accueil',   Icon: Home },
  { key: 'map',    label: 'Carte',     Icon: Map },
  { key: 'favs',   label: 'Favoris',   Icon: Heart },
  { key: 'search', label: 'Recherche', Icon: Search },
  { key: 'social', label: 'Soirée',    Icon: Martini },
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
            <span className="bottomnav-icon">
              <tab.Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
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
