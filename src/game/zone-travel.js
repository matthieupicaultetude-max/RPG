import {createFurnaceWorld,resetFurnaceBoss} from './furnace.js';
import {FURNACE_ENTRY,FURNACE_SPAWN,FIRE_FURNACE_GATE} from '../world/furnace-map.js';
import {createStormWorld,resetStormBoss} from './storm.js';
import {STORM_ENTRY,STORM_SPAWN,WIND_STORM_GATE} from '../world/storm-map.js';
import { createWindWorld } from "./wind-slimes.js";
import {
  WIND_ENTRY,
  WIND_SPAWN,
  MOUNTAIN_WIND_GATE,
} from "../world/slime-wind-map.js";
import { createVolcanoWorld, resetVolcanoBoss } from "./volcano.js";
import {
  VOLCANO_ENTRY,
  VOLCANO_SPAWN,
  FIRE_VOLCANO_GATE,
} from "../world/volcano-map.js";
import { createFireWorld } from "./fire-slimes.js";
import { FIRE_ENTRY, FIRE_SPAWN } from "../world/slime-fire-map.js";
export const MOUNTAIN_FIRE_GATE = { x: 590, y: 330 };
import { consumeDungeonKey } from "./handyman.js";
import { dungeonKeyCount } from "../data/handyman.js";
import { createMountainWorld } from "./mountain-slimes.js";
import {
  MOUNTAIN_ENTRY,
  MOUNTAIN_SPAWN,
} from "../world/slime-mountains-map.js";
import { resetDepthsBoss } from "./depths-boss.js";
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
export const GARDEN_MOUNTAIN_GATE = { x: 565, y: 100 };
export const GARDEN_MARSH_GATE = { x: 390, y: 355 };
const ZONES = [
  "slime-furnace",
  "slime-storm",
  "slime-wind",
  "slime-volcano",
  "slime-fire",
  "garden",
  "slime-marsh",
  "slime-depths",
  "slime-mountains",
];
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
          {
            ...GARDEN_MOUNTAIN_GATE,
            destination: "slime-mountains",
            label: "Gravir les Cimes de Schiste",
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
              label: `Entrer dans le donjon · 1 clé (${dungeonKeyCount(state)} en sac)`,
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
          : state.zone === "slime-furnace" ? [{...FURNACE_ENTRY,destination:'slime-fire',label:'Sortir vers les Champs de Braise'}]
          : state.zone === "slime-storm"
          ? [{...STORM_ENTRY,destination:'slime-wind',label:'Sortir vers les Hauts des Alizés'}]
          : state.zone === "slime-wind"
            ? [
                {
                  ...WIND_STORM_GATE, destination:'slime-storm',
                label:`Entrer dans l’Œil des Tempêtes · 1 clé (${dungeonKeyCount(state,'slime-storm')} en sac)`,
              },
              {
                ...WIND_ENTRY,
                  destination: "slime-mountains",
                  label: "Revenir aux Cimes de Schiste",
                },
              ]
            : state.zone === "slime-volcano"
              ? [
                  {
                    ...VOLCANO_ENTRY,
                    destination: "slime-fire",
                    label: "Sortir du volcan",
                  },
                ]
              : state.zone === "slime-fire"
                ? [
                    {
                      ...FIRE_FURNACE_GATE,destination:'slime-furnace',label:`Entrer dans la Fournaise · 1 clé (${dungeonKeyCount(state,'slime-furnace')} en sac)`,
                    },
                    {
                      ...FIRE_ENTRY,
                      destination: "slime-mountains",
                      label: "Revenir aux Cimes de Schiste",
                    },
                    {
                      ...FIRE_VOLCANO_GATE,
                      destination: "slime-volcano",
                      label: `Entrer dans le Volcan · 1 clé (${dungeonKeyCount(state, "slime-volcano")} en sac)`,
                    },
                  ]
                : state.zone === "slime-mountains"
                  ? [
                      {
                        ...MOUNTAIN_ENTRY,
                        destination: "garden",
                        label: "Redescendre au village",
                      },
                      {
                        ...MOUNTAIN_WIND_GATE,
                        destination: "slime-wind",
                        label: "Rejoindre les Hauts des Alizés",
                      },
                      {
                        ...MOUNTAIN_FIRE_GATE,
                        destination: "slime-fire",
                        label: "Entrer dans les Champs de Braise",
                      },
                    ]
                  : [];
  return (
    gates.find(
      (g) => Math.hypot(state.player.x - g.x, state.player.y - g.y) < 32,
    ) || null
  );
}
// Direct travel is used by developer tools. Normal paid entry goes through useZoneGate.
export function travelToZone(
  state,
  destination,
  { freshDungeon = false } = {},
) {
  if (
    !ZONES.includes(state.zone) ||
    !ZONES.includes(destination) ||
    state.zone === destination
  )
    return false;
  const origin = state.zone;
  if (origin === state.dungeonRun?.dungeonId && state.dungeonRun?.active) {
    state.dungeonRun.active = false;
    state.dungeonRun.endedAt = state.time;
  }
  // Cancel on the departing world before replacing its monster array.
  resetFurnaceBoss(state);
  resetStormBoss(state);
  resetDepthsBoss(state);
  resetVolcanoBoss(state);
  clearMonsterAttacks(state);
  clearDepthsFusions(state);
  state.zoneWorlds ??= {};
  state.zoneWorlds[origin] = {
    monsters: state.monsters,
    bots: state.bots,
    npcs: state.npcs,
    trees: state.trees,
  };
  let world =
    freshDungeon && ["slime-depths", "slime-volcano", "slime-storm", "slime-furnace"].includes(destination)
      ? null
      : state.zoneWorlds[destination];
  if (destination === "slime-depths" && world?.monsters.every((m) => m.hp <= 0))
    world = null;
  world ||=
    destination === "slime-furnace" ? createFurnaceWorld() : destination === "slime-storm" ? createStormWorld() : destination === "slime-wind"
      ? createWindWorld()
      : destination === "slime-volcano"
        ? createVolcanoWorld()
        : destination === "slime-fire"
          ? createFireWorld()
          : destination === "slime-mountains"
            ? createMountainWorld()
            : destination === "slime-depths"
              ? createDepthsWorld(state.time)
              : destination === "slime-marsh"
                ? createMarshWorld(state)
                : null;
  if (!world) return false;
  delete state.zoneDive;
  Object.assign(state, world);
  const point =
    destination === "slime-furnace" ? FURNACE_SPAWN : destination === "slime-storm" ? STORM_SPAWN : destination === "slime-wind"
      ? origin === "slime-storm" ? {x:WIND_STORM_GATE.x-22,y:WIND_STORM_GATE.y} : WIND_SPAWN
      : destination === "slime-volcano"
        ? VOLCANO_SPAWN
        : destination === "slime-fire"
          ? origin === "slime-furnace" ? {x:FIRE_FURNACE_GATE.x-22,y:FIRE_FURNACE_GATE.y} : origin === "slime-volcano"
            ? { x: FIRE_VOLCANO_GATE.x - 20, y: FIRE_VOLCANO_GATE.y + 10 }
            : FIRE_SPAWN
          : destination === "slime-mountains"
            ? origin === "slime-wind"
              ? { x: MOUNTAIN_WIND_GATE.x, y: MOUNTAIN_WIND_GATE.y + 20 }
              : origin === "slime-fire"
                ? { x: MOUNTAIN_FIRE_GATE.x - 15, y: MOUNTAIN_FIRE_GATE.y }
                : MOUNTAIN_SPAWN
            : destination === "slime-depths"
              ? DEPTHS_SPAWN
              : destination === "slime-marsh"
                ? origin === "slime-depths"
                  ? { x: MARSH_DEPTHS_GATE.x, y: MARSH_DEPTHS_GATE.y - 15 }
                  : { x: MARSH_ENTRY.x + 30, y: MARSH_ENTRY.y }
                : origin === "slime-mountains"
                  ? {
                      x: GARDEN_MOUNTAIN_GATE.x - 15,
                      y: GARDEN_MOUNTAIN_GATE.y + 15,
                    }
                  : { x: GARDEN_MARSH_GATE.x, y: GARDEN_MARSH_GATE.y - 25 };
  movePartyToZone(state, destination, point);
  state.marshGuideOpen = false;
  state.depthsGuideOpen = false;
  state.mountainGuideOpen = false;
  state.fireGuideOpen = false;
  state.volcanoGuideOpen = false;
  state.windGuideOpen = false;
  state.furnaceGuideOpen = false;
  if(destination === "slime-furnace"){state.furnaceGuideOpen=!state.visitedFurnace;state.visitedFurnace=true;}
  state.stormGuideOpen = false;
  if(destination === "slime-storm") { state.stormFlowers = []; state.stormGuideOpen = !state.visitedStorm; state.visitedStorm = true; }
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
  if (destination === "slime-volcano") {
    state.volcanoGuideOpen = !state.visitedVolcano;
    state.visitedVolcano = true;
  }
  if (destination === "slime-fire") {
    state.fireGuideOpen = !state.visitedFire;
    state.visitedFire = true;
  }
  if (destination === "slime-wind") {
    state.windGuideOpen = !state.visitedWind;
    state.visitedWind = true;
  }
  if (destination === "slime-mountains") {
    state.mountainGuideOpen = !state.visitedMountains;
    state.visitedMountains = true;
  }
  state.log.unshift(
    destination === "slime-furnace" ? "Fournaise des Vents Rouges : le vent déplace les braises et éteint les braseros. Guidez le souffle de Siroccolimon !" : destination === "slime-storm" ? "Œil des Tempêtes : bassins, aspirations et ricochets Air / Eau. Guidez le dernier bond sur une dalle sèche !" : destination === "slime-wind"
      ? "Hauts des Alizés : sortez de l’aspiration, puis esquivez les deux ricochets !"
      : destination === "slime-volcano"
        ? "Donjon du Volcan : carapaces explosives, magma persistant et éruptions de slimes !"
        : destination === "slime-fire"
          ? "Champs de Braise : évitez les traînées et éloignez-vous des slimes vaincus avant leur explosion !"
          : destination === "slime-mountains"
            ? "Cimes de Schiste : attirez les charges contre les rochers pour briser les carapaces !"
            : destination === "slime-depths"
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
  if(gate.destination === 'slime-furnace') {
    if(state.team[state.main].hp<=0)return false;
    if(!consumeDungeonKey(state,'slime-furnace')){state.log.unshift('Clé de la Fournaise requise : Tessa demande 5 planches de châtaignier, 1 Cœur de feu et 1 Cœur d’air.');state.log.length=Math.min(6,state.log.length);state.revision++;return false;}
    if(!travelToZone(state,'slime-furnace',{freshDungeon:true}))return false;
    state.nextDungeonRun=(state.nextDungeonRun||0)+1;
    state.dungeonRun={id:state.nextDungeonRun,dungeonId:'slime-furnace',active:true,startedAt:state.time,completed:false};state.revision++;return true;
  }
  if(gate.destination === 'slime-storm') {
    if(state.team[state.main].hp<=0)return false;
    if(!consumeDungeonKey(state,'slime-storm')) {
      state.log.unshift('Clé de l’Œil des Tempêtes requise : Tessa demande 5 planches de châtaignier, 1 Cœur d’air et 1 Cœur d’eau.');
      state.log.length=Math.min(6,state.log.length);state.revision++;return false;
    }
    if(!travelToZone(state,'slime-storm',{freshDungeon:true}))return false;
    state.nextDungeonRun=(state.nextDungeonRun||0)+1;
    state.dungeonRun={id:state.nextDungeonRun,dungeonId:'slime-storm',active:true,startedAt:state.time,completed:false};
    state.revision++;return true;
  }
  if (gate.destination === "slime-volcano") {
    if (state.team[state.main].hp <= 0) return false;
    if (!consumeDungeonKey(state, "slime-volcano")) {
      state.log.unshift(
        "Clé du Volcan requise : Tessa demande 5 planches de châtaignier, 1 Cœur de feu et 1 Cœur de terre.",
      );
      state.log.length = Math.min(6, state.log.length);
      state.revision++;
      return false;
    }
    if (!travelToZone(state, "slime-volcano", { freshDungeon: true }))
      return false;
    state.nextDungeonRun = (state.nextDungeonRun || 0) + 1;
    state.dungeonRun = {
      id: state.nextDungeonRun,
      dungeonId: "slime-volcano",
      active: true,
      startedAt: state.time,
      completed: false,
    };
    state.revision++;
    return true;
  }
  if (gate.destination !== "slime-depths")
    return travelToZone(state, gate.destination);
  if (state.team[state.main].hp <= 0) return false;
  if (!consumeDungeonKey(state)) {
    state.log.unshift(
      "Clé de la Crevasse requise : fabriquez-la auprès de Tessa au village (5 planches de châtaignier, 1 Cœur d’eau, 1 Cœur de terre).",
    );
    state.log.length = Math.min(state.log.length, 6);
    state.revision++;
    return false;
  }
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
    paidDungeon: true,
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
  if (
    t >= 1 &&
    travelToZone(state, "slime-depths", {
      freshDungeon: dive.paidDungeon === true,
    })
  ) {
    state.nextDungeonRun = (state.nextDungeonRun || 0) + 1;
    state.dungeonRun = {
      id: state.nextDungeonRun,
      dungeonId: "slime-depths",
      active: true,
      startedAt: state.time,
      completed: false,
    };
    state.log.unshift(
      "Une clé consommée pour toute la troupe · Nouvelle expédition dans le Donjon de la Crevasse.",
    );
    state.log.length = Math.min(state.log.length, 6);
    state.revision++;
  }
  return true;
}
