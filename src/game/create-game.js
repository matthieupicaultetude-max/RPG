import { screenToWorld } from '../rendering/viewport.js';
import { createCharacterWheel } from '../input/character-wheel.js';
import { createSandbox, stepSandbox, attack, teleport, activateUltimate, cycleMain } from '../dev/sandbox.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls, onChange, onTimers = () => {}) {
  const state = createSandbox();
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  const controller = new AbortController();
  let previous, frame, lastRevision = -1, lastHome;
  let interfaceOpen = false;
  canvas.addEventListener('wheel', createCharacterWheel(direction => { if (!interfaceOpen) cycleMain(state, direction); }), { passive: false, signal: controller.signal });
  canvas.addEventListener('keydown', event => {
    if (interfaceOpen) return;
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); activateUltimate(state); }
  }, { signal: controller.signal });
  let pointer = null;
  function updateAim(event) {
    pointer = { clientX: event.clientX, clientY: event.clientY };
    Object.assign(state.aim, screenToWorld(event.clientX,event.clientY,canvas.getBoundingClientRect(),state.player), { active: !interfaceOpen });
  }
  canvas.addEventListener('pointermove', updateAim, { signal: controller.signal });
  canvas.addEventListener('pointerleave', () => { pointer = null; state.aim.active = false; }, { signal: controller.signal });
  canvas.addEventListener('contextmenu', event => event.preventDefault(), { signal: controller.signal });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 2 || interfaceOpen) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    updateAim(event);
    attack(state);
  }, { signal: controller.signal });
  function tick(now) {
    const elapsed = previous === undefined ? 0 : Math.max(0, (now - previous) / 1000);
    const dt = document.hidden ? 0 : Math.min(elapsed, .05);
    previous = now;
    if (pointer && !interfaceOpen) updateAim(pointer);
    const autoAttack = state.autoAttack;
    if (interfaceOpen) state.autoAttack = false;
    stepSandbox(state, interfaceOpen ? { x: 0, y: 0 } : controls.direction(), dt, elapsed);
    state.autoAttack = autoAttack;
    onTimers(state);
    render(state);
    const home = Math.hypot(state.player.x - 110, state.player.y - 135) < 65;
    if (lastRevision !== state.revision || lastHome !== home) {
      lastRevision = state.revision; lastHome = home; onChange(state);
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return { state, setInterfaceOpen(open) { interfaceOpen = open; state.aim.active = false; controls.clear(); }, refresh() { state.revision++; }, reset() { teleport(state, 'maison'); }, destroy() { cancelAnimationFrame(frame); controls.destroy(); controller.abort(); } };
}
