import { nearTutorialExit } from '../world/zones.js';
import { finishTutorial } from './tutorial.js';
import { clickHarvestTarget } from './harvest-targets.js';
import { requestCut, treeAt, cancelWoodcutting, nearSawmill } from './woodcutting.js';
import { nearFountain } from '../data/progression.js';
import { spellById } from '../data/spells.js';
import { nearForge } from './forge.js';
import { nearPetShop } from './pet-quests.js';
import { screenToWorld } from '../rendering/viewport.js';
import { createCharacterWheel } from '../input/character-wheel.js';
import { createSandbox, stepSandbox, attack, teleport, activateUltimate, cycleMain, castEquipped, clickBonus, canStand } from '../dev/sandbox.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls, onChange, onTimers = () => {}, onInteraction = () => {}) {
  const state = createSandbox();
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  const controller = new AbortController();
  let previous, frame, lastRevision = -1, lastHome;
  let interfaceOpen = false;
  canvas.addEventListener('wheel', createCharacterWheel(direction => { if (!interfaceOpen) cycleMain(state, direction); }), { passive: false, signal: controller.signal });
  canvas.addEventListener('keydown', event => {
    if (interfaceOpen) return;
    if (event.code === 'KeyF' && !event.repeat) {event.preventDefault();if(nearTutorialExit(state)&&state.tutorial?.spellRead)finishTutorial(state);else if(nearSawmill(state))onInteraction('professions');else if(nearFountain(state))onInteraction('characteristics');else if(nearForge(state))onInteraction('forge');else if(nearPetShop(state))onInteraction('petshop');}
    const slot={KeyR:1,KeyC:2,KeyT:3}[event.code];
    if(slot!==undefined&&!event.repeat){event.preventDefault();castEquipped(state,slot);}
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
    if (![0,2].includes(event.button) || interfaceOpen) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    updateAim(event);
    if(event.button===0){const point=screenToWorld(event.clientX,event.clientY,canvas.getBoundingClientRect(),state.player);if(!clickHarvestTarget(state,point)&&!clickBonus(state,point)){const tree=treeAt(state,point);if(tree)requestCut(state,tree.id,canStand);}return;}
    if(spellById(state.team[state.main].loadout[0])?.effect==='pierce')state.spellCharge={time:0,owner:state.main};else attack(state);
  }, { signal: controller.signal });
  window.addEventListener('pointerup',event=>{if(event.button===2&&state.spellCharge){if(!interfaceOpen&&state.spellCharge.owner===state.main)castEquipped(state,0,undefined,{charge:state.spellCharge.time});state.spellCharge=null;}},{signal:controller.signal});
  window.addEventListener('blur',()=>{state.spellCharge=null;},{signal:controller.signal});
  canvas.addEventListener('blur',()=>{state.spellCharge=null;},{signal:controller.signal});
  function tick(now) {
    const elapsed = previous === undefined ? 0 : Math.max(0, (now - previous) / 1000);
    const dt = document.hidden ? 0 : Math.min(elapsed, .05);
    previous = now;
    if(state.spellCharge){if(interfaceOpen||state.spellCharge.owner!==state.main)state.spellCharge=null;else{state.spellCharge.time+=dt;if(state.spellCharge.time>=1){castEquipped(state,0,undefined,{charge:1});state.spellCharge=null;}}}
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
  return { state, setInterfaceOpen(open) { interfaceOpen = open;if(open)cancelWoodcutting(state); state.spellCharge=null; state.aim.active = false; controls.clear(); }, refresh() { state.revision++; }, reset() { teleport(state, 'maison'); }, destroy() { cancelAnimationFrame(frame); controls.destroy(); controller.abort(); } };
}
