# Auroria

Nouveau départ du RPG en pixel art sur navigateur. Le projet se trouve directement à la racine du dépôt, sans application imbriquée.

Cette version contient uniquement une clairière et un personnage déplaçable. Les anciennes villes, classes, combats, inventaires et sauvegardes ne sont plus utilisés. L’ancienne version reste accessible dans l’historique Git, au commit `6225b31`.

## Démarrer

Prérequis : Node.js 24 et npm.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Cliquer sur la scène pour utiliser les flèches, ZQSD ou WASD. Les boutons directionnels permettent aussi de jouer au tactile.

```sh
npm test
npm run build
npm run preview
```

## Organisation

- `index.html` : point d’entrée HTML.
- `src/main.js` : interface et démarrage.
- `src/game/` : configuration, état et boucle du jeu.
- `src/input/` : clavier et commandes tactiles.
- `src/rendering/` : rendu Canvas et terrain.
- `src/style.css` : présentation responsive.
- `tests/` : règles de déplacement.
- `.github/workflows/deploy.yml` : publication sur GitHub Pages après un push sur `main`.

La logique du jeu est indépendante du rendu. Les déplacements diagonaux sont normalisés, le personnage reste dans la scène, et les commandes se relâchent lorsque la fenêtre perd le focus. Aucune dépendance graphique ni ressource externe n’est nécessaire.

## Publication

Le workflow existant est conservé. Le dépôt doit avoir GitHub Pages activé avec la source **GitHub Actions**.

Jeu : https://matthieupicaultetude-max.github.io/RPG/
