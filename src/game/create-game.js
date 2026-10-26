import { createSandbox, stepSandbox, attack, teleport, activateUltimate, chooseMain } from '../dev/sandbox.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls, onChange, onTimers = () => {}) {
  const state = createSandbox();
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  const controller = new AbortController();
  let previous, frame, lastRevision = -1, lastHome;
  canvas.addEventListener('keydown', event => {
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); activateUltimate(state); }
    const slot = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[event.code];
    if (slot !== undefined && !event.repeat) { event.preventDefault(); chooseMain(state, slot); }
    if (event.code === 'Space') { event.preventDefault(); attack(state); }
  }, { signal: controller.signal });
  function tick(now) {
    const elapsed = previous === undefined ? 0 : Math.max(0, (now - previous) / 1000);
    const dt = document.hidden ? 0 : Math.min(elapsed, .05);
    previous = now;
    stepSandbox(state, controls.direction(), dt, elapsed);
    onTimers(state);
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
