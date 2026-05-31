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

1. **Ambiance en temps réel** — check-ins + humeur du moment (quand la masse critique est atteinte)
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

## Feature à coder : Line-up DJ/Artists

Pour les soirées électro (Interférence, Le Bikini, Arena), afficher les DJs dans les events.
- Champ "line_up" dans le formulaire admin EventForm
- Affiché dans EventDetail
- Killer feature pour la scène techno toulousaine

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
- Contenu (chewing gum, etc.) → ~35€
- Stickers + QR codes (Canva + imprimeur local) → ~30€

**Comment entrer dans un bar :**
_"Je développe une app de découverte de la scène Toulouse, on couvre déjà Le Bikini et l'Interférence. J'aimerais poser cette boîte au bar ce soir — les gens scannent le QR code et trouvent les prochaines dates."_

**Avantage boîte :** prétexte pour revenir toutes les 2-3 semaines recharger → relation gérant → futur Spot Pro.

### Autres idées marketing
- Autocollants "Spot Validé" + QR code
- Briquets Spot (notoriété passive)
- TikTok/Instagram : "Top 3 spots Toulouse ce weekend" chaque jeudi

---

## Résoudre le problème poulet/oeuf

### Phase 1 — Muriel EST le contenu (mois 1-2)
- Events ajoutés manuellement via admin form
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

## Features dev — Priorités

### À faire maintenant
- [ ] Line-up DJ dans les events (formulaire admin + EventDetail)

### Moyen terme
- [ ] "Ambiance en temps réel" (compteur check-ins visible sur la home)
- [ ] Notifications "ton spot favori a un event ce soir"
- [ ] Page stats pour les bars (vues, check-ins) → Spot Pro

### Plus tard
- [ ] Scraping RA.co pour les events automatiques
- [ ] Spot Boost en self-service (le bar paie en ligne)
- [ ] Line-up avec pages artistes

---

## Associé

Situation : 3 semaines de "je commence demain". Avancer seul en attendant.
Tâches à lui déléguer (non-critiques) : contenu réseaux, recherche partenariats, démarchage bars.
