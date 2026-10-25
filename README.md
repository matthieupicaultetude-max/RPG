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

## Ville construite d'après le plan fourni

Le tracé de Bourg-Aurore suit les principaux repères du dessin de référence. `src/city-plan.js` contient les positions exprimées dans le repère du plan et leur conversion en coordonnées du jeu.

- **Nord** : baie ouverte, quai, quatre pontons praticables et bateaux.
- **Ouest** : château avec enceinte polygonale, six tours, porte côté ville et cour accessible.
- **Nord-ouest et sud-ouest de la place** : îlots compacts de maisons et quartier des Tisserands.
- **Centre** : place du Marché, fontaine, feu et commerces.
- **Est** : bourg autour d'une rue en boucle, maisons et échoppes.
- **Sorties** : routes rayonnantes vers les champs, la forêt et la plaine.

La ville compte 70 bâtiments, dont 65 maisons, et douze rues, routes et passages. Vingt nouvelles façades bordent directement les rues existantes. Chaque façade est accessible depuis le réseau de rues. La carte propose une vue rapprochée de la ville et une vue de l'île entière, avec votre position.

L'île mesure 3600 × 2800 unités. Le joueur ne peut pas marcher dans la baie, sauf sur les pontons. Les bâtiments, tours, murs du château, arbres et grands objets bloquent les déplacements ; les tirs ne traversent pas les obstacles. Les monstres restent hors des secteurs protégés. Les compagnons se déploient uniquement sur des positions praticables, y compris sur les quais étroits.

Les champs de Blévent à l'ouest gardent le moulin animé, les épouvantails et les navets. La forêt de Sylve à l'est abrite champignons et sangliers ; la plaine des Rosées au sud abrite les slimes. Les monstres regagnent leur territoire s'ils s'éloignent trop et réapparaissent après 12 secondes.

## Boutiques et progression

Brune vend les armures ; Iris vend les capes et les bâtons. Un achat équipe le personnage principal et remplace l'objet du même emplacement. Armures et capes réduisent les dégâts ; les bâtons augmentent les dégâts du Mage uniquement. Les objets restent attachés au rôle : un bâton est inactif si le rôle Distance est attribué au Rôdeur.

Marius rachète gelées, paille enchantée, racines, spores et fourrures. La sauvegarde locale reprend automatiquement l'ancien inventaire de gelées.

La composition, le principal, le butin, l'or, les objectifs, l'équipement et le réglage audio sont sauvegardés dans le `localStorage` du navigateur, sous la clé `auroria`. Au rechargement, les héros sont soignés et les compagnons rentrent en réserve. La position n'est pas sauvegardée. Le prototype est solo, sans sauvegarde serveur.

## Validation

25 tests couvrent équipe, mouvement, orientation, recul, particules, économie, collisions, eau, pontons, six tours, porte et cour du château, rues, accès à chaque façade, régions et PNJ. La recherche de trajets vérifie aussi la liaison de chaque ponton et de la cour avec la place. Les tests couvrent la périodicité des pavés et la circulation des habitants pendant une minute simulée.

Le parcours Chromium vérifie achats et vente, traversée de la porte du château et de sa cour, marche sur les pontons, changement de vue de carte, combats IA, régions extérieures, sauvegarde et carte mobile. La compilation de production est vérifiée avec Vite.


## Rues pavées et vie de quartier

Les rues, carrefours, cours et passages vers les façades sont fusionnés dans des masques uniques. Les pavés et bordures utilisent des textures périodiques de 96 × 64 pixels, ancrées aux coordonnées du monde. Ainsi les raccords ne dépendent ni du tronçon, ni de la caméra, ni des découpes de rendu ; les bordures ne traversent pas les intersections. Un contrôle Chromium compare pixel par pixel un rendu entier avec deux rendus indépendants assemblés.

Douze arbres de rue supplémentaires et des plates-bandes adoucissent les îlots. Les accès aux façades et les trajets restent réservés.

Les onze PNJ nommés et commerçants sont rejoints par vingt-quatre habitants. Ces derniers suivent des itinéraires de rue, s'orientent en marchant, marquent des pauses et affichent parfois une courte phrase. Ils s'arrêtent et regardent le joueur lorsqu'il approche. Toute la circulation se suspend dans les fenêtres de dialogue. Les boutiques restent prioritaires à portée de T pour faciliter les achats dans la foule.
