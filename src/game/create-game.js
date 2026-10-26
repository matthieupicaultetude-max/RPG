import { createSandbox, stepSandbox, attack, teleport, toggleAllies } from '../dev/sandbox.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls, onChange) {
  const state = createSandbox();
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  const controller = new AbortController();
  let previous, frame, lastRevision = -1, lastHome;
  canvas.addEventListener('keydown', event => {
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); toggleAllies(state); }
    if (event.code === 'Space') { event.preventDefault(); attack(state); }
  }, { signal: controller.signal });
  function tick(now) {
    const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
    previous = now;
    stepSandbox(state, controls.direction(), dt);
    render(state);
    const home = Math.hypot(state.player.x - 110, state.player.y - 135) < 65;
    if (lastRevision !== state.revision || lastHome !== home) {
      lastRevision = state.revision; lastHome = home; onChange(state);
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return { state, refresh() { state.revision++; }, reset() { teleport(state, 'maison'); }, destroy() { cancelAnimationFrame(frame); controls.destroy(); controller.abort(); } };
}
