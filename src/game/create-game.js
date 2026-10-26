import { SPAWN } from './config.js';
import { createState, update } from './state.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls) {
  const state = createState();
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  let previous;
  let frame;
  function tick(now) {
    const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    update(state, controls.direction(), dt);
    render(state);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return {
    reset() { Object.assign(state.player, SPAWN, { facing: 'down', moving: false }); canvas.focus({ preventScroll: true }); },
    destroy() { cancelAnimationFrame(frame); controls.destroy(); },
  };
}
