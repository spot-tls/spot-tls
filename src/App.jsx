import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import TopBar    from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import HomeView  from './components/HomeView/HomeView';
import { useSpots }      from './hooks/useSpots';
import { updateSpotCoords } from './lib/supabaseAdmin';
import { useFavorites }  from './hooks/useFavorites';
import { useGeolocation } from './hooks/useGeolocation';
import { useTheme }      from './hooks/useTheme';
import { useSpotEdits }  from './hooks/useSpotEdits';
import { useAdminMode }  from './hooks/useAdminMode';
import { useNewSpots }   from './hooks/useNewSpots';
import { useAuth }       from './hooks/useAuth';
import { useEvents }     from './hooks/useEvents';
import EventDetail       from './components/EventDetail/EventDetail';

// Vues lazy-loadées — chargées seulement à la première visite
const MapView        = lazy(() => import('./components/MapView/MapView'));
const SearchView     = lazy(() => import('./components/SearchView/SearchView'));
const FavoritesView  = lazy(() => import('./components/FavoritesView/FavoritesView'));
const SocialView     = lazy(() => import('./components/SocialView/SocialView'));
const EventsView     = lazy(() => import('./components/EventsView/EventsView'));
const BetaModal      = lazy(() => import('./components/BetaModal/BetaModal'));
const SplashScreen   = lazy(() => import('./components/Onboarding/SplashScreen'));
const ShareLanding   = lazy(() => import('./components/ShareLanding/ShareLanding'));
const AuthModal      = lazy(() => import('./components/Auth/AuthModal'));
const SettingsDrawer = lazy(() => import('./components/Settings/SettingsDrawer'));

const SHARE_SPOT_ID    = new URLSearchParams(window.location.search).get('spot');
const SHARE_EVENT_ID   = new URLSearchParams(window.location.search).get('event');
const IS_AUTH_CALLBACK = window.location.hash.includes('access_token') || window.location.hash.includes('error=');

export default function App() {
  const [activePage,     setActivePage]     = useState('home');
  const [showBeta,       setShowBeta]       = useState(false);
  const [showSplash,     setShowSplash]     = useState(() => {
    if (SHARE_SPOT_ID || SHARE_EVENT_ID || IS_AUTH_CALLBACK) return false;
    // Pour tester l'onboarding : vide le cache → localStorage.removeItem('spottls_splash_seen')
    return !localStorage.getItem('spottls_splash_seen');
  });
  const [showEvents,     setShowEvents]     = useState(false);
  const [showAuth,       setShowAuth]       = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [shareDismissed, setShareDismissed] = useState(false);
  const [deepLinkEvent,  setDeepLinkEvent]  = useState(null);
  // MapView est monté en différé : évite de charger MapLibre (~800 KB) au démarrage
  const [mapEverActive,  setMapEverActive]  = useState(false);

  useEffect(() => {
    if (activePage === 'map') setMapEverActive(true);
  }, [activePage]);

  const dismissSplash = () => {
    localStorage.setItem('spottls_splash_seen', '1');
    setShowSplash(false);
  };

  const { spots, loading, error, removeSpot, moveSpot }      = useSpots();
  const { allEvents }                                        = useEvents();

  // Deep link ?event=ID — ouvre EventDetail dès que les events sont chargés
  useEffect(() => {
    if (!SHARE_EVENT_ID || !allEvents?.length) return;
    const ev = allEvents.find(e => String(e.id) === SHARE_EVENT_ID);
    if (ev) {
      setDeepLinkEvent(ev);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [allEvents]);

  const [repositioningSpot, setRepositioningSpot]            = useState(null);
  const { favoriteIds, isFavorite, toggleFavorite, count }   = useFavorites();
  const { position: userPos, status: geoStatus, locate }     = useGeolocation();
  const { theme, toggleTheme }                               = useTheme();
  const { edits, saveEdit, editCount, exportJson }           = useSpotEdits();
  const { admin, handleSecretTap }                           = useAdminMode();
  const { newSpots, addSpot }                                = useNewSpots();
  const { user, profile, needsProfile,
          signInWithEmail, signInWithGoogle, createProfile, signOut } = useAuth();

  const mergedSpots = useMemo(() => {
    const base = spots.map((s) => (edits[s.id] ? { ...s, ...edits[s.id] } : s));
    return [...newSpots, ...base];
  }, [spots, edits, newSpots]);

  const goMap             = () => setActivePage('map');
  const handleRequireAuth = () => setShowAuth(true);

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
        onOpenSettings={() => setShowSettings(true)}
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
              geoStatus={geoStatus}
              onLocate={locate}
              onGoMap={goMap}
              onOpenEvents={() => setShowEvents(true)}
              admin={admin}
              onAdminReposition={(spot) => { setRepositioningSpot(spot); setActivePage('map'); }}
              onAdminDelete={removeSpot}
            />
          )}

          {/* MapView différé : MapLibre ne charge qu'à la 1re visite de la carte */}
          {mapEverActive && (
            <div style={{ display: activePage === 'map' ? 'block' : 'none' }}>
              <Suspense fallback={null}>
                <MapView
                  isActive={activePage === 'map'}
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
              </Suspense>
            </div>
          )}

          {activePage === 'search' && (
            <Suspense fallback={null}>
              <SearchView
                spots={mergedSpots}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                userPos={userPos}
                admin={admin}
                onAdminReposition={(spot) => { setRepositioningSpot(spot); setActivePage('map'); }}
                onAdminDelete={removeSpot}
              />
            </Suspense>
          )}

          {activePage === 'favs' && (
            <Suspense fallback={null}>
              <FavoritesView
                spots={mergedSpots}
                favoriteIds={favoriteIds}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                userPos={userPos}
                onGoSearch={() => setActivePage('search')}
                admin={admin}
                onAdminReposition={(spot) => { setRepositioningSpot(spot); setActivePage('map'); }}
                onAdminDelete={removeSpot}
              />
            </Suspense>
          )}

          {activePage === 'social' && (
            <Suspense fallback={null}>
              <SocialView
                currentUser={user}
                currentProfile={profile}
                spots={mergedSpots}
                userPos={userPos}
                onRequireAuth={handleRequireAuth}
                onOpenSpot={() => setActivePage('map')}
              />
            </Suspense>
          )}
        </>
      )}

      <BottomNav activePage={activePage} onChange={setActivePage} favCount={count} />

      {showBeta && (
        <Suspense fallback={null}>
          <BetaModal onClose={() => setShowBeta(false)} />
        </Suspense>
      )}

      {showEvents && (
        <Suspense fallback={null}>
          <EventsView onClose={() => setShowEvents(false)} admin={admin} spots={mergedSpots} />
        </Suspense>
      )}

      {(showAuth || needsProfile) && (
        <Suspense fallback={null}>
          <AuthModal
            onClose={() => setShowAuth(false)}
            signInWithEmail={signInWithEmail}
            signInWithGoogle={signInWithGoogle}
            user={user}
            createProfile={createProfile}
            needsProfile={needsProfile}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsDrawer
            onClose={() => setShowSettings(false)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onJoinBeta={() => setShowBeta(true)}
            admin={admin}
            onSecretTap={handleSecretTap}
            editCount={editCount}
            onExportJson={() => exportJson(mergedSpots)}
            onSignOut={signOut}
            profile={profile}
            onRequireAuth={handleRequireAuth}
          />
        </Suspense>
      )}

      {showSplash && (
        <Suspense fallback={null}>
          <SplashScreen onDismiss={dismissSplash} onJoinBeta={() => setShowBeta(true)} />
        </Suspense>
      )}

      {SHARE_SPOT_ID && !shareDismissed && (
        <Suspense fallback={null}>
          <ShareLanding
            spot={mergedSpots.find((s) => String(s.id) === SHARE_SPOT_ID) || null}
            onEnter={() => {
              setShareDismissed(true);
              setActivePage('map');
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        </Suspense>
      )}

      {deepLinkEvent && (
        <EventDetail
          event={deepLinkEvent}
          onClose={() => setDeepLinkEvent(null)}
          spots={mergedSpots}
          onOpenSpot={() => { setDeepLinkEvent(null); setActivePage('map'); }}
        />
      )}
    </div>
  );
}
