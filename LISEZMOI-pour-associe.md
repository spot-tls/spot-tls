# SpotFR — Lancer le site sur ton Mac

Salut ! Voici comment faire tourner la version v1 de **SpotFR** sur ton ordinateur (Mac).
Compte environ 10 minutes la première fois. Suis les étapes dans l'ordre, c'est plus simple qu'il n'y paraît.

---

## Étape 0 — Récupérer le projet

Tu as dû recevoir un fichier **`spot-app-v2.zip`**.

1. Double-clique dessus pour le décompresser.
2. Tu obtiens un dossier **`spot-app-v2`**. Pose-le quelque part de simple, par exemple sur ton **Bureau**.

---

## Étape 1 — Installer Node.js (une seule fois)

Node.js est l'outil qui fait tourner le site. C'est gratuit.

1. Va sur **https://nodejs.org**
2. Clique sur le gros bouton **« LTS »** (version recommandée).
3. Ouvre le fichier téléchargé et installe-le comme une application normale (Suivant → Suivant → Terminé).

Pour vérifier que c'est bon : ouvre l'application **Terminal**
(dans `Applications → Utilitaires → Terminal`, ou via Spotlight : `Cmd + Espace` puis tape « Terminal »).

Dans le Terminal, tape ceci puis Entrée :

```
node -v
```

Si un numéro s'affiche (par ex. `v20.11.0`), c'est parfait. Passe à la suite.

---

## Étape 2 — Ouvrir le dossier dans le Terminal

Dans le Terminal, tape `cd ` (avec un espace après), **puis fais glisser le dossier `spot-app-v2`** depuis le Finder directement dans la fenêtre du Terminal. Le chemin se remplit tout seul. Ça donne un truc comme :

```
cd /Users/tonnom/Desktop/spot-app-v2
```

Appuie sur **Entrée**.

---

## Étape 3 — Installer les dépendances (une seule fois)

Toujours dans le Terminal, tape :

```
npm install
```

Patiente : ça télécharge ce dont le site a besoin (1 à 2 minutes). C'est normal de voir défiler du texte.

---

## Étape 4 — Lancer le site

Tape :

```
npm run dev
```

Au bout de quelques secondes, tu verras apparaître quelque chose comme :

```
  ➜  Local:   http://localhost:5173/
```

Ouvre ton navigateur (Safari, Chrome…) et va à l'adresse **http://localhost:5173**
👉 SpotFR s'affiche !

> Astuce : le site est pensé pour mobile. Sur Chrome/Safari tu peux activer l'affichage mobile
> (clic droit → Inspecter → icône téléphone) pour le voir comme sur un smartphone.

---

## Pour arrêter / relancer

- **Arrêter** : reviens dans le Terminal et fais `Ctrl + C`.
- **Relancer plus tard** : rouvre le Terminal, refais l'étape 2 (`cd …`), puis directement `npm run dev`
  (pas besoin de refaire `npm install`).

---

## Ce que c'est (et ce que ce n'est pas encore)

C'est une **v1 de démonstration** : carte interactive de Toulouse, filtres d'ambiance (Chill, Branché, Chic, Underground, Terrasse, Jusqu'au bout), recherche, fiches de spots, et un formulaire « Rejoindre la bêta ».

⚠️ Les **horaires d'ouverture ne sont pas encore renseignés** dans les données, donc tous les lieux apparaissent « fermés » et le filtre « Ouvert maintenant » ne renvoie rien pour le moment. C'est juste une question de données à compléter, pas un bug.

---

## Si ça coince

- **« command not found: npm »** → Node.js n'est pas (ou mal) installé. Reprends l'étape 1, puis ferme et rouvre le Terminal.
- **Une erreur pendant `npm install`** → vérifie ta connexion internet et réessaie la commande.
- **La page ne s'ouvre pas** → assure-toi que le Terminal affiche bien `npm run dev` en cours (il ne doit pas être « rendu » à la ligne). Garde la fenêtre ouverte tant que tu utilises le site.

Bon test ! 🚀
