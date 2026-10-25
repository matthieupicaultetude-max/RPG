# Auroria — L'île des premiers pas

Première version jouable d'un RPG fantasy en pixel art pour navigateur. Le décor et les personnages sont dessinés avec Canvas 2D ; aucun service externe ni clé API n'est nécessaire. Les polices Google sont facultatives et disposent de polices de repli.

## Démarrer

Node.js 20.19+ ou 22.12+ recommandé (vérifié avec Node 24).

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

`npm run build` produit le site statique dans `dist/`. `npm run preview` permet de vérifier cette compilation.

## Jouer

- Flèches, ZQSD ou WASD : se déplacer.
- Espace ou clic sur un monstre : attaquer le monstre le plus proche à portée.
- F : pouvoir de classe, avec un délai de récupération de 7 secondes.
- R près du feu de camp : récupérer toute sa vie.
- T près de l'étal au nord-est : parler à Marius et vendre les gelées.
- E : déployer ou rappeler les deux compagnons IA.
- I : afficher le sac ; Échap : fermer une fenêtre.
- Sur écran tactile : croix directionnelle, boutons d'action et bouton d'interaction.

## Compagnie de trois héros

Le panneau « Choisir ma composition » impose un héros par rôle :

- Tank : Gardien ou Paladin (davantage de PV, armure et priorité d'attaque des monstres proches).
- Combattant : Guerrier ou Duelliste (dégâts au corps à corps).
- Distance : Mage ou Rôdeur (attaques à distance et recul si un monstre s'approche).

Choisissez le principal dans le formulaire ou cliquez sur sa carte. Les deux autres restent en réserve jusqu'à l'appui sur E ; un second appui les rappelle. Ils suivent le principal, attaquent automatiquement les ennemis proches et partagent les récompenses. Les PV sont conservés lors des changements de principal et rappels. Un compagnon à terre ne peut plus combattre ni être contrôlé avant d'être soigné. R près du feu restaure toute la compagnie, y compris les personnages en réserve ou à terre. La défaite du principal ramène la compagnie au feu sans perte de butin.

Les monstres réapparaissent après 12 secondes. La composition et le principal sont sauvegardés ; au rechargement les héros sont soignés et les compagnons reviennent en réserve.

Les pièces, le butin, les classes essayées et les monstres vaincus sont conservés localement dans le navigateur (`localStorage`, clé `auroria`). La position et la vie sont réinitialisées au chargement. Ce prototype est solo, sans compte ni sauvegarde serveur.

## Mouvement, impacts et son

Les monstres choisissent des destinations autour de leur territoire et alternent pauses et déplacements. Les compagnons ont une formation variable, des accélérations progressives et une séparation pour limiter les superpositions ; ils conservent leurs comportements de rôle en combat.

Les héros et monstres s'orientent sur quatre directions. Les coups déclenchent un léger recul amorti qui respecte les limites de l'île, un flash, des particules et des chiffres de dégâts. Les attaques de contact des monstres ont un délai de récupération (environ une seconde).

Les sons sont synthétisés localement avec Web Audio : pas, armes, magie, impacts, gelées, éliminations, soins, pièces et déploiement. Ils se débloquent à la première interaction avec la page. Le bouton Son coupe ou réactive les bruitages et mémorise ce choix.

## Validation

`npm test` lance dix tests de logique d'équipe et de mouvement : composition valide, compagnons selon le principal, suivi et cadence d'attaque, priorité du tank, personnages à terre et collisions.

Compilation Vite et parcours Chromium vérifiés : choix du trio, choix du principal, E pour déployer/rappeler, éliminations autonomes et butin partagé, changement du principal, sauvegarde après rechargement, formulaire mobile sans débordement et absence d'erreurs JavaScript. La vente chez Marius utilise désormais T.

Vérifications Chromium supplémentaires : orientation dans quatre directions, recul sur monstres et joueur, émission de particules, animation des compagnons, contexte Web Audio actif, silence après désactivation et persistance du réglage audio.
