import { SCENE } from '../game/config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const ground = document.createElement('canvas');
  ground.width = SCENE.width;
  ground.height = SCENE.height;
  const terrain = ground.getContext('2d');
  terrain.fillStyle = '#638d53';
  terrain.fillRect(0, 0, ground.width, ground.height);
  for (let y = 0; y < ground.height; y += 8) {
    for (let x = 0; x < ground.width; x += 8) {
      const seed = (x * 13 + y * 37) % 97;
      terrain.fillStyle = seed < 48 ? '#70995c' : '#577f49';
      terrain.fillRect(x + seed % 7, y + seed % 5, 2, 1);
      if (seed < 4) {
        terrain.fillStyle = '#e4ce88';
        terrain.fillRect(x + 3, y + 3, 2, 2);
      }
    }
  }
  return state => {
    ctx.drawImage(ground, 0, 0);
    const p = state.player;
    const x = Math.round(p.x), y = Math.round(p.y);
    const step = p.moving ? Math.sin(state.time * 14) * 2 : 0;
    ctx.fillStyle = '#355b4080';
    ctx.fillRect(x - 7, y + 3, 14, 4);
    ctx.fillStyle = '#373c49';
    ctx.fillRect(x - 5, y - 1 + step, 4, 6);
    ctx.fillRect(x + 1, y - 1 - step, 4, 6);
    ctx.fillStyle = '#ded6a7';
    ctx.fillRect(x - 6, y - 13, 12, 13);
    ctx.fillStyle = '#526e91';
    ctx.fillRect(x - 4, y - 12, 8, 11);
    ctx.fillStyle = '#e9b78a';
    ctx.fillRect(x - 4, y - 21, 8, 9);
    ctx.fillStyle = '#573f38';
    ctx.fillRect(x - 5, y - 23, 10, p.facing === 'up' ? 10 : 5);
    if (p.facing !== 'up') {
      ctx.fillStyle = '#343544';
      if (p.facing !== 'right') ctx.fillRect(x - 3, y - 17, 1, 2);
      if (p.facing !== 'left') ctx.fillRect(x + 2, y - 17, 1, 2);
    }
  };
}
