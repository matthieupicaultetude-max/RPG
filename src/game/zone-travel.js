import { movePartyToZone } from "../world/zones.js";
import { MARSH_ENTRY } from "../world/slime-marsh-map.js";
import { createMarshWorld, stepSlimeMarsh } from "./slime-marsh.js";
export const GARDEN_MARSH_GATE = { x: 390, y: 355 };
export function nearZoneGate(state) {
  const gate =
    state.zone === "garden"
      ? {
          ...GARDEN_MARSH_GATE,
          destination: "slime-marsh",
          label: "Entrer dans les Marais de Gelée",
        }
      : state.zone === "slime-marsh"
        ? { ...MARSH_ENTRY, destination: "garden", label: "Revenir au village" }
        : null;
  return gate &&
    Math.hypot(state.player.x - gate.x, state.player.y - gate.y) < 32
    ? gate
    : null;
}
export function travelToZone(state, destination) {
  if (
    !["garden", "slime-marsh"].includes(state.zone) ||
    !["garden", "slime-marsh"].includes(destination) ||
    state.zone === destination
  )
    return false;
  state.zoneWorlds ??= {};
  state.zoneWorlds[state.zone] = {
    monsters: state.monsters,
    bots: state.bots,
    npcs: state.npcs,
    trees: state.trees,
  };
  const world =
    state.zoneWorlds[destination] ||
    (destination === "slime-marsh" ? createMarshWorld(state) : null);
  if (!world) return false;
  Object.assign(state, world);
  movePartyToZone(
    state,
    destination,
    destination === "slime-marsh"
      ? { x: MARSH_ENTRY.x + 30, y: MARSH_ENTRY.y }
      : { x: GARDEN_MARSH_GATE.x, y: GARDEN_MARSH_GATE.y - 25 },
  );
  if (destination === "slime-marsh") {
    stepSlimeMarsh(state);
    state.marshGuideOpen = !state.slimeMarsh.visited;
    state.slimeMarsh.visited = true;
  } else state.marshGuideOpen = false;
  state.log.unshift(
    destination === "slime-marsh"
      ? "Marais de Gelée : attention, les fleurs éponges font grossir les slimes !"
      : "Retour au village.",
  );
  state.log.length = Math.min(6, state.log.length);
  state.revision++;
  return true;
}
export function useZoneGate(state) {
  const gate = nearZoneGate(state);
  return gate ? travelToZone(state, gate.destination) : false;
}
