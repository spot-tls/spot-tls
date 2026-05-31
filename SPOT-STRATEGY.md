# SpotTLS — Stratégie & Roadmap

_Dernière mise à jour : Mai 2026_

---

## Vision

App de découverte de la vie nocturne toulousaine.
**Pas Google Maps** — Google Maps donne les horaires. Spot donne l'ambiance en temps réel.

---

## Utilisateur cible

- **L'habitué local** : Toulousain qui sort régulièrement, veut découvrir de nouveaux spots
- **Le bar/club** : Gérant qui veut toucher plus de clients (B2B)

---

## Différenciateurs vs Google Maps / Shotgun

1. **Ambiance en temps réel** — check-ins + humeur du moment (quand masse critique atteinte)
2. **Communauté locale** — avis de vrais Toulousains, pas touristes anonymes
3. **Events exclusifs** — partenariats avec bars pour annoncer en avant-première
4. **Curation humaine** — sélections faites par quelqu'un qui connaît vraiment la scène

---

## Killer Feature (à construire quand 100+ users actifs)

**Thermomètre en temps réel :**
- Bar à Moustache — 🔥 Chaud · 8 check-ins ce soir · Dernier : il y a 4 min
- Le Père Léon — 😴 Calme · 1 check-in
- Le Florida — 💥 Bondé · 23 check-ins

Alimenté par les check-ins déjà dans l'app. Google Maps ne peut jamais faire ça.

---

## Monétisation

### Qui paie : les bars (B2B d'abord, pas les users)

| Offre | Prix | Ce que ça donne |
|-------|------|-----------------|
| Spot Free | Gratuit | Fiche de base, visible dans les recherches |
| Spot Pro | 29€/mois | Stats (vues, check-ins, pics d'affluence), badge vérifié, gestion events |
| Spot Boost | 9€/event | Event épinglé en tête pendant 24h |

**Règle :** ne jamais faire payer les users en MVP.

---

## Go-to-Market — La scène électro en premier

### Pourquoi Interférence / Le Bikini / Arena

- Public early adopter, partagent les apps
- Sortent régulièrement (pas juste fêtes)
- Communauté soudée : 5 users → 20 followers
- Planifient leurs sorties : cherchent activement les dates

### Stratégie physique avec 100€

**La boîte "Spot, carry ta soirée"**
Contenu : chewing gum, Smint, déo pocket, préservatifs, tampons, Doliprane
Format : petite boîte craft avec sticker Spot + QR code
Placement : comptoir des bars, toilettes des clubs

Budget estimé :
- 10-15 boîtes craft (Amazon) → ~25€
- Contenu → ~35€
- Stickers + QR codes (Canva + imprimeur local) → ~30€

Pitch bar : "Je développe une app de découverte de la scène Toulouse, on couvre déjà Le Bikini et l'Interférence. J'aimerais poser cette boîte au bar ce soir."

La boîte = prétexte pour revenir toutes les 2-3 semaines recharger → relation gérant → futur Spot Pro.

### Autres idées marketing
- Autocollants "Spot Validé" + QR code
- Briquets Spot (notoriété passive)
- TikTok/Instagram : "Top 3 spots Toulouse ce weekend" chaque jeudi

---

## Résoudre le problème poulet/oeuf

### Phase 1 — Muriel EST le contenu (mois 1-2)
- Events ajoutés manuellement via admin form (formulaire déjà dans l'app)
- Check-ins amorcés par toi
- Descriptions de spots rédigées par toi
- Curation 100% humaine : "Spot de la semaine"

### Phase 2 — Acquisition (mois 2-3)
- 5 bars avec boîte "carry ta soirée" → QR code → premiers users
- TikTok hebdo → audience avant d'aller voir les bars
- Présence physique aux soirées Interférence / Bikini

### Phase 3 — Monétisation (mois 3-4)
- Premier Spot Boost à 9€ (facile à vendre, pas d'engagement)
- Spot Pro 29€/mois quand t'as des stats à montrer

---

## Timeline réaliste

| Période | Objectif |
|---------|----------|
| Juin-Juil 2026 | 100 users, 10 bars en fiche complète, 5 events/semaine manuels |
| Août 2026 | Premier bar qui paie (Spot Boost 9€) |
| Sep 2026 | 300 users, 3 bars en Spot Pro, pitch aux autres |

---

## Associé

Situation : 3 semaines de "je commence demain". Avancer seul en attendant.
Tâches à lui déléguer (non-critiques) : contenu réseaux, recherche partenariats, démarchage bars.

---

## État du code — Ce qui a été fait (session Mai 2026)

### Design premium glassmorphism — TOUT FAIT ✅
- `src/styles/theme.css` — tokens : `--bg: #08061A`, `--glass-card`, `--glass-border`, `--gradient-brand-intense`, `--font-title: 'Clash Display'`
- `src/components/HomeView/HomeView.css/.jsx` — SpotCards, NearbyCards, Mood chips, Hero glows, zéro emoji
- `src/components/Layout/BottomNav.jsx/.css` — Lucide icons (Home, Map, Heart, Search, Wine)
- `src/components/Layout/TopBar.jsx/.css` — Lucide icons, logo `public/logo.svg` (texte "spot" gradient rose→violet)
- `src/components/MapView/MapView.css` — SpotDetail glassmorphism
- `src/components/MapView/SpotDetail.jsx` — zéro emoji sur les boutons
- `src/components/EventsView/EventsView.jsx/.css` — glassmorphism, bookmarks (Bookmark icon), Lucide SlidersHorizontal
- `src/components/EventDetail/EventDetail.jsx/.css` — Share (Share2), Bookmark, Ticket Lucide, deep link ?event=ID, lineup display
- `src/components/AdminEventForm/AdminEventForm.jsx` — champ lineup (textarea, 1 artiste/ligne → array)
- `src/components/SearchView/SearchView.css/.jsx` — topbar glass blur, titre gradient, mood chips glass, spot slides glass, Lucide Search/X
- `src/components/SocialView/SocialView.css/.jsx` — header glass card, review cards glass, boutons Lucide (MapPin, PenLine, MessageCircle, RefreshCw)
- `src/components/FavoritesView/FavoritesView.css` — hero card glass + titre gradient, sort pills glass, empty ring neon glow

### Features ajoutées — FAIT
- **Bookmarks events** — `useEventBookmarks` hook localStorage, toggle sur chaque card EventsView
- **Deep link ?event=ID** — App.jsx détecte le param, ouvre EventDetail automatiquement
- **Partage event** — URL générée `spot-tls.vercel.app?event=<id>` avec navigator.share
- **Line-up DJs** — champ `lineup TEXT[]` dans AdminEventForm + section affichage dans EventDetail
- **EventDetail depuis HomeView** — clic sur featured event → ouvre EventDetail directement

### Bugs fixés — FAIT
- **SpotCards iOS scroll** — `touch-action: pan-x` + `overflow-y: visible` sur `.hv-scroll-row` et `.hv-nearby-row`
- **Logo TopBar** — `public/logo.svg` texte "spot" gradient rose→violet (SVG, pas de dépendance image externe)

### Scripts ajoutés
- `scripts/scrape-shotgun.py` — scraper Playwright (Shotgun bloque les headless → à retravailler)
- `scripts/scrape-events.py` — scraper Facebook API (nécessite token FB)
- `scripts/import-events.mjs` — import JSON → Supabase (upsert par source_id)

### À FAIRE DANS SUPABASE
- `ALTER TABLE events ADD COLUMN IF NOT EXISTS lineup TEXT[] DEFAULT '{}';`
- `ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id TEXT;` (pour import scraping)

---

## Features dev — Priorités restantes

### Priorité 1 — Settings drawer
- [ ] Settings drawer — redesign glassmorphism (seule vue pas encore refaite)

### Priorité 2 — Contenu & onboarding
- [ ] Ajouter 5-10 vrais events Toulouse manuellement via admin form
- [ ] Onboarding repensé (SplashScreen — reset via `localStorage.removeItem('spottls_splash_seen')`)
- [ ] Page profil utilisateur (check-ins, avis, historique)

### Priorité 3 — Features
- [ ] Notifications push (bar favori a un event)
- [ ] Scraping RA.co (alternative à Shotgun, plus ouvert)
- [ ] Spot Boost en self-service (bar paie en ligne)

---

## Infos techniques clés

- **Supabase URL** : https://nnxuewtauidiwrvxjbtr.supabase.co
- **Déploiement** : Vercel auto depuis branch `main`
- **URL prod** : https://spot-tls.vercel.app
- **Logo** : `public/logo.svg` — texte "spot" gradient rose→violet (height: 26px auto dans TopBar)
- **Font** : Clash Display (Fontshare CDN) + Space Grotesk fallback
- **Icons** : Lucide React (installé)
- **Règle critique** : pas de JOIN Supabase checkins/reviews → spots (spot_id TEXT sans FK)
- **Écriture fichiers** : >200 lignes sur Google Drive → utiliser python3 script (voir `scripts/write_css.py` comme exemple)
- **Commits** : c'est l'utilisateur qui fait git add / commit / push — Claude prépare seulement les commandes
