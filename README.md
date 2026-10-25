# Auroria — L'île des premiers pas

RPG fantasy en pixel art jouable dans un navigateur. Le monde, les personnages et les effets sont dessinés avec Canvas 2D. Les bruitages sont synthétisés avec Web Audio. Aucun compte, serveur de données ou secret n'est nécessaire ; les polices Google sont facultatives et ont des polices de repli.

## Démarrer

Node.js 20.19+ ou 22.12+ recommandé ; vérifié avec Node 24.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

- `npm run build` produit le site statique dans `dist/`.
- `npm run preview` permet de vérifier la compilation.
- `npm test` exécute les tests de logique du jeu.
- Le workflow GitHub Actions publie `main` sur GitHub Pages lorsque Pages est activé dans le dépôt.

## Commandes

| Action | Commande |
| --- | --- |
| Déplacement | Flèches, ZQSD ou WASD |
| Attaque | Espace ou clic sur un monstre |
| Pouvoir de classe | F, récupération de 7 secondes |
| Déployer / rappeler les compagnons | E |
| Parler à un PNJ / ouvrir sa boutique | T à proximité, ou clic sur le PNJ |
| Soigner toute la compagnie | R près du feu de la place |
| Inventaire | I |
| Fermer une fenêtre | Échap |

Les boutons de l'interface et les commandes tactiles permettent aussi de jouer. Le bouton carte montre les régions et votre position. Le son se débloque à la première interaction ; le bouton Son mémorise votre préférence.

## Compagnie

Le panneau de composition impose un héros par rôle :

- Tank : Gardien ou Paladin ; davantage de PV, armure et priorité d'attaque des monstres proches.
- Combattant : Guerrier ou Duelliste ; dégâts au corps à corps.
- Distance : Mage ou Rôdeur ; attaques à distance et recul si un ennemi approche.

Le joueur contrôle le héros principal choisi dans le formulaire ou en cliquant sur sa carte. Les deux autres restent en réserve jusqu'à E, puis suivent et combattent automatiquement. Leur butin est partagé. Rappel et changement de principal conservent les PV ; un héros à terre ne peut pas être contrôlé avant soin. R au feu soigne toute l'équipe, même les héros à terre ou en réserve. Une défaite du principal ramène la compagnie au feu sans perte de butin.

## Monde et ville

L'île mesure 3600 × 2800 unités ; la caméra suit le principal. Bourg-Aurore occupe 1664 × 1528 unités et conserve 23 bâtiments, désormais répartis en petits groupes espacés. Les façades gardent au moins 40 unités d'écart. Les sept allées sont arrondies, avec des chemins secondaires qui desservent chaque maison. Les jardins et pelouses remplacent le pavage uniforme hors de la place et des cours.

Les remparts, quatre portes, habitants, boutiques, arbres et objets ont été repositionnés. Les champs, la forêt et la plaine sont éloignés pour préserver les espaces entre les quartiers et les territoires sauvages.

- **Centre** : place et fontaine animée, feu de soin, auberge, Marius et les échoppes.
- **Nord** : cour des Tisserands, maisons et Tessa.
- **Sud** : faubourg des Jardins et Hugo.
- **Est** : allée des Artisans et Simon.
- **À l'ouest de la ville** : champs de Blévent, moulin animé, épouvantails et navets farouches.
- **À l'est et au nord** : forêt de Sylve, champignons et sangliers.
- **Au sud des remparts** : plaine des Rosées et slimes.

Les bâtiments, remparts, fontaine, troncs et grands objets bloquent le passage. Les tirs ne traversent pas les obstacles. Les monstres ne peuvent pas entrer en ville et regagnent leur territoire s'ils s'éloignent trop. Ils réapparaissent après 12 secondes.

## Boutiques et progression

Brune vend les armures ; Iris vend les capes et les bâtons. Un achat équipe le personnage principal et remplace l'objet du même emplacement. Armures et capes réduisent les dégâts ; les bâtons augmentent les dégâts du Mage uniquement. Les objets restent attachés au rôle : un bâton est inactif si le rôle Distance est attribué au Rôdeur.

Marius rachète gelées, paille enchantée, racines, spores et fourrures. La sauvegarde locale reprend automatiquement l'ancien inventaire de gelées.

La composition, le principal, le butin, l'or, les objectifs, l'équipement et le réglage audio sont sauvegardés dans le `localStorage` du navigateur, sous la clé `auroria`. Au rechargement, les héros sont soignés et les compagnons rentrent en réserve. La position n'est pas sauvegardée. Le prototype est solo, sans sauvegarde serveur.

## Validation

19 tests couvrent l'équipe, les déplacements, l'orientation, le recul, les particules, les collisions, les accès aux régions et aux PNJ, la protection de la ville, les achats, les chemins des façades et l'espacement des maisons. Les tests utilisent les mêmes courbes que le rendu pour vérifier les allées.

Le parcours Chromium vérifie déplacements au clavier, boutiques déplacées, achats et vente, dialogues, exploration des quartiers et des trois régions, combats IA, sauvegarde de l'équipement et carte mobile. La compilation de production est vérifiée avec Vite.
