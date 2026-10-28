import {canWalkWind} from './slime-wind-map.js';
import {canWalkVolcano} from './volcano-map.js';
import {resetVolcanoBoss} from '../game/volcano.js';
import {canWalkFire} from './slime-fire-map.js';
import {canWalkMountains} from './slime-mountains-map.js';
import {resetDepthsBoss} from '../game/depths-boss.js';
import { canWalkDepths } from './slime-depths-map.js';
import { clearDepthsFusions } from '../game/slime-depths.js';
import {canWalkMarsh} from './slime-marsh-map.js';
import { clearMonsterAttacks } from '../combat/monster-attacks.js';
import { canWalkMap } from "./map.js";
import { canWalkTutorial, TUTORIAL_EXIT } from "./tutorial-map.js";
import { clearRoute, placeAllies } from "../ai/companions.js";
export const inTutorialZone = (state) => state.zone === "tutorial";
export const canWalkZone = (x, y, zone) =>
  zone === "slime-wind" ? canWalkWind(x,y) : zone === "slime-volcano" ? canWalkVolcano(x,y) : zone === "slime-fire" ? canWalkFire(x,y) : zone === "slime-mountains" ? canWalkMountains(x,y) : zone === "slime-depths" ? canWalkDepths(x,y) : zone === "tutorial" ? canWalkTutorial(x, y) : zone === "slime-marsh" ? canWalkMarsh(x,y) : canWalkMap(x, y);
export const nearTutorialExit = (state) =>
  inTutorialZone(state) &&
  Math.hypot(
    state.player.x - TUTORIAL_EXIT.x,
    state.player.y - TUTORIAL_EXIT.y,
  ) < 30;
export function movePartyToZone(state, zone, point) {
  resetDepthsBoss(state);
  resetVolcanoBoss(state);
  clearDepthsFusions(state);
  state.zone = zone;
  clearMonsterAttacks(state);
  state.woodcutting.action = null;
  state.spellCharge = null;
  state.aim.active = false;
  for (const key of [
    "attacks",
    "spellEvents",
    "spellMissiles",
    "spellAreas",
    "spellVisuals",
    "effects",
  ])
    state[key] = [];
  Object.assign(state.player, point, { facing: "down", moving: false });
  for (const member of state.team) {
    Object.assign(member, state.player);
    clearRoute(member);
  }
  if(state.deployed)placeAllies(state,(x,y)=>canWalkZone(x,y,state.zone));
  state.revision++;
}
