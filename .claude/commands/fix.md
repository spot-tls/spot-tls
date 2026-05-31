# Fix & Build

Lance `npm run build`. Si des erreurs apparaissent, lis les fichiers concernés, corrige les bugs un par un, relance le build. Répète jusqu'à ce que les 129 modules se transforment sans erreur (ignore EPERM sur dist/).

Rappel critique : les fichiers >200 lignes sur ce mount Google Drive doivent être écrits via Python (open/write), pas avec les outils Edit/Write qui tronquent silencieusement.
