# SpotTLS — Contexte Claude Code

## C'est quoi ce projet ?

SpotTLS est une app mobile PWA (React 18 + Vite) pour découvrir les bars, clubs et concerts à Toulouse la nuit. Déployé sur Vercel : https://spot-tls.vercel.app

**Stack :** React 18, Vite, MapLibre GL JS, Supabase (PostgreSQL + Auth), Vercel

---

## Règles critiques — à ne JAMAIS violer

### 1. Pas de JOIN Supabase depuis checkins/reviews vers spots
`spot_id` est TEXT sans FK enregistrée → PostgREST ne peut pas auto-joindre.
```js
// ❌ NE PAS FAIRE
const { data } = await supabase.from('checkins').select('*, spots(*)')

// ✅ TOUJOURS faire un lookup local
const spotsMap = Object.fromEntries(spots.map(s => [s.id, s]));
const spot = spotsMap[checkin.spot_id];
```

### 2. Écriture de fichiers volumineux sur Google Drive
Les fichiers >~200 lignes sur un mount Google Drive doivent être écrits via Python (pas Edit/Write tools qui tronquent silencieusement) :
```bash
python3 -c "
with open('chemin/vers/fichier.jsx', 'w', encoding='utf-8') as f:
    f.write(contenu)
"
```

### 3. Emojis dans les strings Python
Ne jamais utiliser `r"""..."""` (raw strings) avec des emojis — `\U0001f303` s'écrit littéralement.
Utiliser `"""..."""` non-raw, les emojis s'insèrent directement.

### 4. Git — index.lock
Tous les `git add/commit/push` doivent être lancés depuis PowerShell Windows (pas depuis le terminal Claude Code si mount Google Drive). Le sandbox peut avoir des conflits de lock.

### 5. Build — erreur EPERM sur dist/
Inoffensif — Google Drive ne permet pas de supprimer les anciens fichiers dist. Vercel déploie depuis le source, pas dist/.

---

## Architecture des fichiers

```
src/
├── App.jsx                    — Router principal, gestion états globaux
├── components/
│   ├── Layout/                — TopBar, BottomNav
│   ├── HomeView/              — Page d'accueil (Shotgun style)
│   ├── MapView/               — Carte MapLibre + SpotDetail + SpotEditor
│   ├── SearchView/            — Discover style (cartes quartier + sections horizontales)
│   ├── FavoritesView/         — Spots favoris
│   ├── SocialView/            — Feed social, check-ins, avis
│   ├── EventsView/            — Agenda événements
│   ├── Onboarding/            — SplashScreen (3 slides)
│   ├── Auth/                  — AuthModal (email magic link + Google)
│   ├── Settings/              — SettingsDrawer
│   ├── ShareLanding/          — Landing page deep link ?spot=ID
│   └── SpotCard/              — Carte spot réutilisable
├── hooks/
│   ├── useSpots.js            — Fetch spots depuis Supabase
│   ├── useAuth.js             — Supabase Auth (magic link + Google OAuth)
│   ├── useFavorites.js        — localStorage + sync Supabase si connecté
│   ├── useReactions.js        — Réactions par spot (🔥❤️😍🆕)
│   ├── useEvents.js           — Fetch events Supabase avec fallback JSON
│   ├── useGeolocation.js      — Position GPS utilisateur
│   ├── useTheme.js            — Dark/light mode
│   ├── useSpotEdits.js        — Admin : éditions locales exportables en JSON
│   ├── useAdminMode.js        — Mode admin (triple tap secret)
│   └── useNewSpots.js         — Admin : ajout de nouveau spot en mémoire
├── utils/
│   ├── config.js              — MOODS, CATEGORY_CONFIG, QUARTIER_COLORS, getCatConfig()
│   ├── distance.js            — distanceKm(), formatDistance() (Haversine)
│   └── isOpenNow.js           — isOpenNow(spot) → boolean
└── lib/
    ├── supabase.js            — Client Supabase public
    └── supabaseAdmin.js       — Fonctions admin (updateSpotCoords, deleteSpot...)
```

---

## Variables CSS globales (index.css)

```css
--bg, --bg-elevated, --bg-card   /* Fonds */
--border                          /* Bordures */
--primary: #EC4899               /* Rose SpotTLS */
--secondary: #A78BFA             /* Violet */
--text, --text-muted, --text-dim  /* Textes */
--gradient-brand                  /* Gradient rose → violet */
--font-title: 'Bricolage Grotesque'
--topbar-h, --bottomnav-h        /* Heights layout */
--radius-pill
```

## Constantes importantes (config.js)

```js
QUARTIER_COLORS = {
  Capitole: '#EC4899', 'Saint-Cyprien': '#A78BFA', Carmes: '#06B6D4',
  'Arnaud-Bernard': '#F59E0B', 'Saint-Aubin': '#10B981', ...
}

CATEGORY_CONFIG = {
  Bar:   { emoji: '🍸', color: '#EC4899', gradient: 'linear-gradient(135deg,#EC4899,#A78BFA)' },
  Club:  { emoji: '🎵', color: '#A78BFA', gradient: '...' },
  ...
}

MOODS = [
  { id: 'chill',        label: 'Chill',        emoji: '🌿' },
  { id: 'branche',      label: 'Branché',      emoji: '⚡' },
  { id: 'chic',         label: 'Chic',         emoji: '💎' },
  { id: 'underground',  label: 'Underground',  emoji: '👾' },
  { id: 'aprem',        label: 'Aprem',        emoji: '🌤️' },
  { id: 'jusquaubout',  label: "Jusqu'au bout", emoji: '🔥' },
]
```

---

## Supabase — tables principales

- **spots** — id (TEXT), name, category, quartier, address, lat, lng, photos (TEXT[]), photo_url, google_rating, hours (JSONB), description, tags (TEXT[]), moods (TEXT[]), phone, instagram, website, reservation_url, price_level
- **events** — id, title, date, time, venue, category, description, photo_url, ticket_url, is_featured
- **checkins** — id, user_id, spot_id (TEXT, pas de FK), mood, note (TEXT), created_at
- **reviews** — id, user_id, spot_id (TEXT, pas de FK), rating (1-5), comment, created_at
- **reactions** — id, user_id, spot_id (TEXT), reaction_type
- **profiles** — id (= auth.users.id), username, avatar_url, bio

---

## Fonctionnalités en place

- ✅ PWA installable (manifest + service worker)
- ✅ Auth Supabase (magic link email + Google OAuth)
- ✅ Carte MapLibre avec pins gradient par catégorie + clustering
- ✅ SearchView Discover (cartes quartier + sections horizontales)
- ✅ SpotDetail bottom sheet (hero gradient, galerie photos, réactions)
- ✅ Favoris (localStorage + sync Supabase)
- ✅ Réactions par spot (🔥❤️😍🆕)
- ✅ Feed social (check-ins + avis communauté)
- ✅ Agenda événements (Supabase + fallback JSON)
- ✅ SplashScreen onboarding (3 slides, PNG logo, persistance localStorage)
- ✅ Mode admin (triple tap → repositionner/supprimer spots)
- ✅ Deep link partage (?spot=ID → ShareLanding)
- ✅ Dark/light mode

## Tâches en cours / à venir

- 🔄 Fix map blanche au premier chargement (isActive prop → resize)
- 📋 Page de partage belle (Open Graph, landing stylée)
- 📋 Admin events — créer/modifier événements in-app
- 📋 Settings — compte, RGPD, déconnexion

---

## Déploiement

- **Vercel** — déploiement auto depuis `main` branch
- Variables d'env Vercel : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Pas de build local nécessaire — Vercel build depuis source

## Commandes utiles

```bash
npm run dev      # Dev server
npm run build    # Build prod (ignore EPERM sur dist/)
```

Push depuis PowerShell Windows (pas terminal Claude Code) :
```powershell
cd "C:\Users\basti\Google Drive\marketing\SPOT cabau lesavre\Mise en route\APP\spot-app-v2"
git add -A
git commit -m "feat: ..."
git push
```
