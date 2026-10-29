import {worldSize} from '../world/dimensions.js';
import {nearExileResident} from './exile.js';
import {nearDevChest} from './dev-chest.js';
import {DEV_CHEST} from '../world/dev-chest.js';
import {nearFurnaceBoss,awakenFurnaceBoss} from './furnace.js';
import {nearStormBoss,awakenStormBoss} from './storm.js';
import { createBrowserSave } from './browser-save.js';
import {nearVolcanoBoss,awakenVolcanoBoss} from './volcano.js';
import {nearHandyman} from './handyman.js';
import {nearDepthsBoss,awakenDepthsBoss} from './depths-boss.js';
import {useZoneGate,nearZoneGate} from './zone-travel.js';
import { nearTutorialExit, canWalkZone } from '../world/zones.js';
import { finishTutorial, canLeaveTutorial } from './tutorial.js';
import { clickHarvestTarget } from './harvest-targets.js';
import { requestCut, treeAt, cancelWoodcutting, nearSawmill } from './woodcutting.js';
import { nearFountain } from '../data/progression.js';
import { spellById } from '../data/spells.js';
import { nearForge } from './forge.js';
import { nearPetShop } from './pet-quests.js';
import { screenToWorld } from '../rendering/viewport.js';
import { createCharacterWheel } from '../input/character-wheel.js';
import { createSandbox, stepSandbox, attack, teleport, toggleCombatMode, cycleMain, castEquipped, clickBonus } from '../dev/sandbox.js';
import { createControls } from '../input/controls.js';
import { createRenderer } from '../rendering/scene.js';

export function createGame(canvas, touchControls, onChange, onTimers = () => {}, onInteraction = () => {}) {
  const state = createSandbox();
  const persistence = createBrowserSave(state);
  try { state.lighting=localStorage.getItem("auroria-lighting-v1")!=="off"; } catch {}
  const controls = createControls(canvas, touchControls);
  const render = createRenderer(canvas);
  const controller = new AbortController();
  let previous, frame, lastRevision = -1, lastHome;
  let interfaceOpen = false, editorOpen = false;
  const saveTimer = setInterval(() => persistence.save(), 2000);
  window.addEventListener('pagehide', () => persistence.save(), { signal: controller.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) persistence.save(); }, { signal: controller.signal });
  canvas.addEventListener('wheel', createCharacterWheel(direction => { if (!interfaceOpen && !state.zoneDive) cycleMain(state, direction); }), { passive: false, signal: controller.signal });
  canvas.addEventListener('keydown', event => {
    if (interfaceOpen || state.zoneDive) return;
    if (event.code === 'KeyF' && !event.repeat) {event.preventDefault();if(nearZoneGate(state))useZoneGate(state);else if(nearFurnaceBoss(state))awakenFurnaceBoss(state);else if(nearStormBoss(state))awakenStormBoss(state);else if(nearVolcanoBoss(state))awakenVolcanoBoss(state);else if(nearDepthsBoss(state))awakenDepthsBoss(state);else if(nearTutorialExit(state)&&canLeaveTutorial(state))finishTutorial(state);else if(nearDevChest(state))onInteraction('chest');else if(nearHandyman(state))onInteraction('handyman');else if(nearSawmill(state))onInteraction('professions');else if(nearFountain(state))onInteraction('characteristics');else if(nearForge(state))onInteraction('forge');else if(nearPetShop(state))onInteraction('petshop');else if(nearExileResident(state)){state.townResident=nearExileResident(state).id;onInteraction('town');}}
    const slot={KeyR:1,KeyC:2,KeyT:3}[event.code];
    if(slot!==undefined&&!event.repeat){event.preventDefault();castEquipped(state,slot);}
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); toggleCombatMode(state); }
  }, { signal: controller.signal });
  let pointer = null;
  function updateAim(event) {
    pointer = { clientX: event.clientX, clientY: event.clientY };
    Object.assign(state.aim, screenToWorld(event.clientX,event.clientY,canvas.getBoundingClientRect(),state.player,worldSize(state.zone)), { active: !interfaceOpen && !state.zoneDive });
  }
  canvas.addEventListener('pointermove', updateAim, { signal: controller.signal });
  canvas.addEventListener('pointerleave', () => { pointer = null; state.aim.active = false; }, { signal: controller.signal });
  canvas.addEventListener('contextmenu', event => event.preventDefault(), { signal: controller.signal });
  canvas.addEventListener('pointerdown', event => {
    if (![0,2].includes(event.button) || interfaceOpen || state.zoneDive) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    updateAim(event);
    if(event.button===0){const point=screenToWorld(event.clientX,event.clientY,canvas.getBoundingClientRect(),state.player,worldSize(state.zone));if(nearDevChest(state)&&Math.abs(point.x-DEV_CHEST.x)<18&&point.y>DEV_CHEST.y-26&&point.y<DEV_CHEST.y+5){onInteraction('chest');return;}const resident=nearExileResident(state);if(resident&&Math.hypot(point.x-resident.x,point.y-resident.y+12)<24){state.townResident=resident.id;onInteraction(resident.panel==='handyman'?'handyman':resident.panel||'town');return;}if(!clickHarvestTarget(state,point)&&!clickBonus(state,point)){const tree=treeAt(state,point);if(tree)requestCut(state,tree.id,(x,y)=>canWalkZone(x,y,state.zone));}return;}
    if(spellById(state.team[state.main].loadout[0])?.effect==='pierce')state.spellCharge={time:0,owner:state.main};else attack(state);
  }, { signal: controller.signal });
  window.addEventListener('pointerup',event=>{if(event.button===2&&state.spellCharge){if(!interfaceOpen&&state.spellCharge.owner===state.main)castEquipped(state,0,undefined,{charge:state.spellCharge.time});state.spellCharge=null;}},{signal:controller.signal});
  window.addEventListener('blur',()=>{state.spellCharge=null;},{signal:controller.signal});
  canvas.addEventListener('blur',()=>{state.spellCharge=null;},{signal:controller.signal});
  function tick(now) {
    const elapsed = previous === undefined ? 0 : Math.max(0, (now - previous) / 1000);
    const dt = document.hidden || editorOpen ? 0 : Math.min(elapsed, .05);
    previous = now;
    if(state.spellCharge){if(interfaceOpen||state.spellCharge.owner!==state.main)state.spellCharge=null;else{state.spellCharge.time+=dt;if(state.spellCharge.time>=1){castEquipped(state,0,undefined,{charge:1});state.spellCharge=null;}}}
    if (pointer && !interfaceOpen) updateAim(pointer);
    const autoAttack = state.autoAttack;
    if (interfaceOpen) state.autoAttack = false;
    if(!editorOpen)stepSandbox(state, interfaceOpen ? { x: 0, y: 0 } : controls.direction(), dt, elapsed);
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
  return { state, setEditorOpen(open){editorOpen=open;controls.clear();}, clearInput(){controls.clear();state.spellCharge=null;state.aim.active=false;}, setInterfaceOpen(open) { interfaceOpen = open;if(open)cancelWoodcutting(state); state.spellCharge=null; state.aim.active = false; controls.clear(); }, refresh() { state.revision++; }, reset() { teleport(state, 'maison'); }, destroy() { persistence.save(); clearInterval(saveTimer); cancelAnimationFrame(frame); controls.destroy(); render.destroy?.(); controller.abort(); } };
}
