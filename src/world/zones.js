import { canWalkMap } from "./map.js";
import { canWalkTutorial, TUTORIAL_EXIT } from "./tutorial-map.js";
import { clearRoute, placeAllies } from "../ai/companions.js";
export const inTutorialZone = (state) => state.zone === "tutorial";
export const canWalkZone = (x, y, zone) =>
  zone === "tutorial" ? canWalkTutorial(x, y) : canWalkMap(x, y);
export const nearTutorialExit = (state) =>
  inTutorialZone(state) &&
  Math.hypot(
    state.player.x - TUTORIAL_EXIT.x,
    state.player.y - TUTORIAL_EXIT.y,
  ) < 30;
export function movePartyToZone(state, zone, point) {
  state.zone = zone;
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
