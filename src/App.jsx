import { useState, useMemo } from 'react';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import HomeView from './components/HomeView/HomeView';
import MapView from './components/MapView/MapView';
import SearchView from './components/SearchView/SearchView';
import FavoritesView from './components/FavoritesView/FavoritesView';
import ProfileView from './components/ProfileView/ProfileView';
import EventsView from './components/EventsView/EventsView';
import BetaModal from './components/BetaModal/BetaModal';
import SplashScreen from './components/Onboarding/SplashScreen';
import { useSpots } from './hooks/useSpots';
import { updateSpotCoords } from './lib/supabaseAdmin';
import { useFavorites } from './hooks/useFavorites';
import { useGeolocation } from './hooks/useGeolocation';
import { useTheme } from './hooks/useTheme';
import { useSpotEdits } from './hooks/useSpotEdits';
import { useAdminMode } from './hooks/useAdminMode';
import { useNewSpots } from './hooks/useNewSpots';

export default function App() {
  const [activePage,  setActivePage]  = useState('home');
  const [showBeta,    setShowBeta]    = useState(false);
  const [showSplash,  setShowSplash]  = useState(true);
  const [showEvents,  setShowEvents]  = useState(false);
  const dismissSplash = () => setShowSplash(false);

  const { spots, loading, error, removeSpot, moveSpot }    = useSpots();
  const [repositioningSpot, setRepositioningSpot]          = useState(null);
  const { favoriteIds, isFavorite, toggleFavorite, count } = useFavorites();
  const { position: userPos, status: geoStatus, locate }   = useGeolocation();
  const { theme, toggleTheme }                             = useTheme();
  const { edits, saveEdit, editCount, exportJson }         = useSpotEdits();
  const { admin, handleSecretTap }                         = useAdminMode();
  const { newSpots, addSpot }                              = useNewSpots();

  const mergedSpots = useMemo(() => {
    const base = spots.map((s) => (edits[s.id] ? { ...s, ...edits[s.id] } : s));
    return [...newSpots, ...base];
  }, [spots, edits, newSpots]);

  const goMap  = () => setActivePage('map');
  const goHome = () => setActivePage('home');

  const centerScreen = (children) => (
    <div style={{
      position: 'absolute', inset: 'var(--topbar-h) 0 var(--bottomnav-h) 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, textAlign: 'center', padding: 32, color: 'var(--text-dim)',
    }}>{children}</div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <TopBar
        onJoinBeta={() => setShowBeta(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenEvents={() => setShowEvents(true)}
        onGoMap={goMap}
      />

      {loading && centerScreen(<span>Chargement...</span>)}
      {!loading && error && centerScreen(
        <><span style={{ fontSize: 44 }}>!</span><p style={{ maxWidth: 320 }}>{error}</p></>
      )}

      {!loading && !error && (
        <>
          {activePage === 'home' && (
            <HomeView
              spots={mergedSpots}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              userPos={userPos}
              onGoMap={goMap}
              onOpenEvents={() => setShowEvents(true)}
            />
          )}

          <div style={{ display: activePage === 'map' ? 'block' : 'none' }}>
            <MapView
              spots={mergedSpots}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              userPos={userPos}
              geoStatus={geoStatus}
              onLocate={locate}
              onEditSpot={saveEdit}
              admin={admin}
              onAddSpot={addSpot}
              onDeleteSpot={removeSpot}
              repositioningSpot={repositioningSpot}
              onStartReposition={(spot) => { setRepositioningSpot(spot); setActivePage('map'); }}
              onRepositionSave={async (lat, lng) => {
                  try { await updateSpotCoords(repositioningSpot.id, lat, lng); } catch (e) { console.error('Reposition error:', e); }
                  moveSpot(repositioningSpot.id, lat, lng);
                  setRepositioningSpot(null);
                }}
              onRepositionCancel={() => setRepositioningSpot(null)}
            />
          </div>

          {activePage === 'search' && (
            <SearchView
              spots={mergedSpots}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              userPos={userPos}
            />
          )}

          {activePage === 'favs' && (
            <FavoritesView
              spots={mergedSpots}
              favoriteIds={favoriteIds}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              userPos={userPos}
              onGoSearch={() => setActivePage('search')}
            />
          )}

          {activePage === 'profile' && (
            <ProfileView
              spots={mergedSpots}
              favoriteIds={favoriteIds}
              theme={theme}
              onToggleTheme={toggleTheme}
              onJoinBeta={() => setShowBeta(true)}
              editCount={editCount}
              onExportJson={() => exportJson(mergedSpots)}
              admin={admin}
              onSecretTap={handleSecretTap}
            />
          )}
        </>
      )}

      <BottomNav activePage={activePage} onChange={setActivePage} favCount={count} />
      {showBeta   && <BetaModal onClose={() => setShowBeta(false)} />}
      {showEvents && <EventsView onClose={() => setShowEvents(false)} />}
      {showSplash && (
        <SplashScreen onDismiss={dismissSplash} onJoinBeta={() => setShowBeta(true)} />
      )}
    </div>
  );
}
