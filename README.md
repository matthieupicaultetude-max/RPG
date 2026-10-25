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
- E près de l'étal au nord-est : parler à Marius et vendre les gelées.
- I : afficher le sac ; Échap : fermer une fenêtre.
- Sur écran tactile : croix directionnelle, boutons d'action et bouton d'interaction.

Les trois classes sont disponibles dès le départ. Le guerrier frappe au corps à corps, le mage et le rôdeur attaquent à distance. Le pouvoir touche les ennemis dans une zone. Les monstres réapparaissent après 12 secondes. Une défaite ramène au feu de camp sans perte d'inventaire.

Les pièces, le butin, les classes essayées et les monstres vaincus sont conservés localement dans le navigateur (`localStorage`, clé `auroria`). La position et la vie sont réinitialisées au chargement. Ce prototype est solo, sans compte ni sauvegarde serveur.

## Validation de cette version

Compilation Vite réussie. Parcours vérifié dans Chromium avec Playwright : trois classes, élimination de monstres, attribution de butin, vente, sauvegarde après rechargement, guide et affichage à 390 px sans débordement. Aucun test de parcours n'est installé comme dépendance du jeu.
