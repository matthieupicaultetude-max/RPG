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
- T près d'un PNJ : dialoguer, ouvrir sa boutique ou vendre son butin à Marius sur la place.
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

`npm test` lance seize tests de logique d'équipe, de mouvement, de monde et d'économie : composition valide, compagnons selon le principal, suivi et cadence d'attaque, priorité du tank, personnages à terre et collisions.

Compilation Vite et parcours Chromium vérifiés : choix du trio, choix du principal, E pour déployer/rappeler, éliminations autonomes et butin partagé, changement du principal, sauvegarde après rechargement, formulaire mobile sans débordement et absence d'erreurs JavaScript. La vente chez Marius utilise désormais T.

Vérifications Chromium supplémentaires : orientation dans quatre directions, recul sur monstres et joueur, émission de particules, animation des compagnons, contexte Web Audio actif, silence après désactivation et persistance du réglage audio.

## Bourg-Aurore et les régions de l'île

La carte mesure maintenant 2400 × 1800 unités et la caméra suit le personnage principal. Le bouton de carte en haut à droite montre les quatre régions et votre position.

- **Bourg-Aurore, au centre** : ville protégée, quatre portes, fontaine, feu de soin, auberge, habitations et huit PNJ. T près d'un PNJ ouvre son dialogue ou sa boutique.
- **Champs de Blévent, à l'ouest** : parcelles de blé, moulin aux ailes animées, épouvantails éveillés et navets farouches.
- **Forêt de Sylve, à l'est et au nord** : arbres, clairières, champignons sylvestres et sangliers.
- **Plaine des Rosées, au sud** : prairie et gelées des prés.

Les bâtiments, murs et la fontaine bloquent les déplacements. Les quatre portes restent accessibles. Les monstres ne peuvent pas entrer dans la ville et reviennent vers leur territoire s'ils s'en éloignent trop. Les tirs ne traversent pas les bâtiments ou remparts.

### Marchands et équipement

Brune vend deux armures à la forge au nord-ouest de la place. Iris vend deux capes et deux bâtons dans la tour de magie au nord-est. Marius rachète tout le butin sur la place : gelées, paille enchantée, racines, spores et fourrures.

Les achats équipent automatiquement le héros principal. Armures et capes réduisent les dégâts reçus ; les bâtons augmentent les dégâts du Mage uniquement. L'équipement est conservé par rôle, avec la composition et la progression, dans le stockage du navigateur. Un bâton est inactif si le rôle Distance est ensuite attribué au Rôdeur. L'ancien butin de gelées est repris automatiquement.

La suite comporte désormais 16 tests, dont les accès aux régions et aux PNJ, les collisions, la protection de la ville, la migration du butin et les règles d'achat. Le parcours navigateur vérifie des déplacements réels jusqu'aux boutiques et aux trois régions, les achats d'armure/cape/bâton, la vente, le combat IA, la sauvegarde de l'équipement et la carte mobile.


## Detailed city art pass

Bourg-Aurore now has nine staggered town buildings with varied heights, roof colours, dormers, gables, timber frames, individual roof tiles, shutters, flower boxes and striped awnings. Its ground uses varied, worn cobbles, patches of moss, softened walking routes and a stone ring around the animated tiered fountain.

The town also includes leafy trees, benches, lamps, planted borders, market produce, barrels, crates, a cart, a well, firewood, hanging laundry, banners, shop signs, an armour stand and magical crystals. Larger ground props and tree trunks block movement. Routes to all shops, four gates, regions and house entrances are checked; existing purchases, combat and saves remain compatible.
