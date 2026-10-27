import { movePartyToZone } from "../world/zones.js";
import {
  MARSH_ENTRY,
  MARSH_DEPTHS_GATE,
  SEA_SINKHOLE,
} from "../world/slime-marsh-map.js";
import { DEPTHS_ENTRY, DEPTHS_SPAWN } from "../world/slime-depths-map.js";
import { createMarshWorld, stepSlimeMarsh } from "./slime-marsh.js";
import { createDepthsWorld, clearDepthsFusions } from "./slime-depths.js";
import { clearMonsterAttacks } from "../combat/monster-attacks.js";
import { emitSound } from "../audio/events.js";
export const GARDEN_MARSH_GATE = { x: 390, y: 355 };
const ZONES = ["garden", "slime-marsh", "slime-depths"];
export function nearZoneGate(state) {
  if (state.zoneDive) return null;
  const gates =
    state.zone === "garden"
      ? [
          {
            ...GARDEN_MARSH_GATE,
            destination: "slime-marsh",
            label: "Entrer dans les Marais de Gelée",
          },
        ]
      : state.zone === "slime-marsh"
        ? [
            {
              ...MARSH_ENTRY,
              destination: "garden",
              label: "Revenir au village",
            },
            {
              ...MARSH_DEPTHS_GATE,
              destination: "slime-depths",
              label: "Sauter par la cascade",
            },
          ]
        : state.zone === "slime-depths"
          ? [
              {
                ...DEPTHS_ENTRY,
                destination: "slime-marsh",
                label: "Remonter aux marais",
              },
            ]
          : [];
  return (
    gates.find(
      (g) => Math.hypot(state.player.x - g.x, state.player.y - g.y) < 32,
    ) || null
  );
}
export function travelToZone(state, destination) {
  if (
    !ZONES.includes(state.zone) ||
    !ZONES.includes(destination) ||
    state.zone === destination
  )
    return false;
  const origin = state.zone;
  // Cancel on the departing world before replacing its monster array.
  clearMonsterAttacks(state);
  clearDepthsFusions(state);
  state.zoneWorlds ??= {};
  state.zoneWorlds[origin] = {
    monsters: state.monsters,
    bots: state.bots,
    npcs: state.npcs,
    trees: state.trees,
  };
  let world = state.zoneWorlds[destination];
  if (destination === "slime-depths" && world?.monsters.every((m) => m.hp <= 0))
    world = null;
  world ||=
    destination === "slime-depths"
      ? createDepthsWorld(state.time)
      : destination === "slime-marsh"
        ? createMarshWorld(state)
        : null;
  if (!world) return false;
  delete state.zoneDive;
  Object.assign(state, world);
  const point =
    destination === "slime-depths"
      ? DEPTHS_SPAWN
      : destination === "slime-marsh"
        ? origin === "slime-depths"
          ? { x: MARSH_DEPTHS_GATE.x, y: MARSH_DEPTHS_GATE.y - 15 }
          : { x: MARSH_ENTRY.x + 30, y: MARSH_ENTRY.y }
        : { x: GARDEN_MARSH_GATE.x, y: GARDEN_MARSH_GATE.y - 25 };
  movePartyToZone(state, destination, point);
  state.marshGuideOpen = false;
  state.depthsGuideOpen = false;
  if (destination === "slime-marsh") {
    stepSlimeMarsh(state);
    state.marshGuideOpen = !state.slimeMarsh.visited;
    state.slimeMarsh.visited = true;
  }
  if (destination === "slime-depths") {
    state.depthsGuideOpen = !state.visitedDepths;
    state.visitedDepths = true;
    emitSound(state, "magic", point, { element: "water" });
  }
  state.log.unshift(
    destination === "slime-depths"
      ? "Crevasse des profondeurs : bonds rapides, scissions et fusions Eau / Terre."
      : destination === "slime-marsh"
        ? "Marais de Gelée : attention, les fleurs éponges font grossir les slimes !"
        : "Retour au village.",
  );
  state.log.length = Math.min(6, state.log.length);
  state.revision++;
  return true;
}
export function useZoneGate(state) {
  const gate = nearZoneGate(state);
  if (!gate) return false;
  if (gate.destination !== "slime-depths")
    return travelToZone(state, gate.destination);
  clearMonsterAttacks(state);
  for (const key of [
    "attacks",
    "spellEvents",
    "spellMissiles",
    "spellAreas",
    "spellVisuals",
    "effects",
  ])
    state[key] = [];
  state.woodcutting.action = null;
  state.spellCharge = null;
  state.aim.active = false;
  state.zoneDive = {
    age: 0,
    duration: 1.1,
    from: { x: state.player.x, y: state.player.y },
    to: SEA_SINKHOLE,
    members: state.team.map((m) => ({ x: m.x, y: m.y })),
  };
  state.revision++;
  emitSound(state, "magic", gate, { element: "water" });
  return true;
}
export function stepZoneDive(state, dt) {
  const dive = state.zoneDive;
  if (!dive) return false;
  dive.age += dt;
  state.time += dt;
  const t = Math.min(1, dive.age / dive.duration);
  Object.assign(state.player, {
    x: dive.from.x + (dive.to.x - dive.from.x) * t,
    y: dive.from.y + (dive.to.y - dive.from.y) * t,
    moving: false,
  });
  for (const [i, m] of state.team.entries()) {
    if (i === state.main) Object.assign(m, state.player);
    else {
      const p = Math.min(1, Math.max(0, t * 1.2 - 0.1 * (i + 1))),
        from = dive.members[i];
      Object.assign(m, {
        x: from.x + (dive.to.x - from.x) * p,
        y: from.y + (dive.to.y - from.y) * p,
        moving: false,
      });
    }
  }
  if (t >= 1) travelToZone(state, "slime-depths");
  return true;
}
