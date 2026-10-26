import { SCENE, SPAWN } from './config.js';

export function createState() {
  return { player: { ...SPAWN, facing: 'down', moving: false }, time: 0 };
}

export function update(state, direction, dt) {
  state.time += dt;
  const length = Math.hypot(direction.x, direction.y);
  const player = state.player;
  player.moving = length > 0;
  if (!player.moving) return;
  player.facing = Math.abs(direction.x) > Math.abs(direction.y)
    ? (direction.x > 0 ? 'right' : 'left') : (direction.y > 0 ? 'down' : 'up');
  player.x = Math.max(SCENE.margin, Math.min(SCENE.width - SCENE.margin, player.x + direction.x / length * SCENE.speed * dt));
  player.y = Math.max(SCENE.margin, Math.min(SCENE.height - SCENE.margin, player.y + direction.y / length * SCENE.speed * dt));
}
