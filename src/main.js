import './style.css';
import { createGame } from './game/create-game.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <header><a class="brand" href="./">AURORIA <span>RPG</span></a><span class="badge">Nouveau départ</span></header>
  <main>
    <section class="intro"><p class="eyebrow">LE DÉBUT D’UNE AVENTURE</p><h1>Un monde à construire.</h1><p>Une clairière, un aventurier et une nouvelle histoire qui commence.</p></section>
    <section class="scene" aria-label="Scène de départ du jeu">
      <canvas width="640" height="400" tabindex="0" aria-label="Clairière explorable. Déplacez-vous avec les flèches, ZQSD ou WASD."></canvas>
      <div class="scene-caption"><span><i></i> Clairière de départ</span><button id="reset" type="button">Recentrer le personnage</button></div>
    </section>
    <p class="controls">Déplacement : <kbd>↑ ↓ ← →</kbd> ou <kbd>Z Q S D</kbd> / <kbd>W A S D</kbd></p>
    <nav class="touch-controls" aria-label="Déplacement tactile"><button data-direction="up" aria-label="Haut">↑</button><div><button data-direction="left" aria-label="Gauche">←</button><button data-direction="down" aria-label="Bas">↓</button><button data-direction="right" aria-label="Droite">→</button></div></nav>
  </main><footer>Auroria · Première pierre du nouveau monde</footer>`;

const game = createGame(app.querySelector('canvas'), app.querySelector('.touch-controls'));
app.querySelector('#reset').addEventListener('click', game.reset);
if (import.meta.hot) import.meta.hot.dispose(() => game.destroy());
