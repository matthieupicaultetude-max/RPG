import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
  grantLoot,
  teleport,
} from "../src/dev/sandbox.js";
import {
  createMonster,
  monsterLoot,
  monsterStats,
} from "../src/data/monsters.js";
import {
  createStormWorld,
  stepStormMonster,
  stepStormEnvironment,
  onStormLanding,
  currentState,
  stormBoss,
  awakenStormBoss,
  resetStormBoss,
  finishStormBoss,
  STORM_RULES,
} from "../src/game/storm.js";
import {
  STORM_SPAWN,
  STORM_ENTRY,
  STORM_BOSS_HOME,
  WIND_STORM_GATE,
  STORM_SLIMES,
  ROOMS,
  CURRENTS,
  POOLS,
  FLOWERS,
  canWalkStorm,
  validateMap,
} from "../src/world/storm-map.js";
import { canWalkWind } from "../src/world/slime-wind-map.js";
import { findPath } from "../src/ai/companions.js";
import { travelToZone, useZoneGate } from "../src/game/zone-travel.js";
import { movePartyToZone } from "../src/world/zones.js";
import {
  KEY_RECIPES,
  createDungeonKey,
  dungeonKeyCount,
} from "../src/data/handyman.js";
import { craftDungeonKeys } from "../src/game/handyman.js";
import { addWoodItem } from "../src/game/woodcutting.js";
import { renderBestiary } from "../src/ui/bestiary.js";
function fixture(boss = false) {
  const s = createSandbox();
  Object.assign(s, createStormWorld(), {
    zone: "slime-storm",
    deployed: false,
  });
  const m = boss ? stormBoss(s) : s.monsters[0];
  s.monsters = [m];
  Object.assign(s.player, { x: m.x, y: m.y + 30 });
  Object.assign(s.team[0], s.player);
  const hits = [],
    ctx = { canStand: canWalkStorm, damage: (...a) => hits.push(a) };
  return { s, m, hits, ctx };
}

test("storm map: all four rooms, shallow basins and spawn points are connected, deep water blocks walking", () => {
  assert.deepEqual(validateMap(), []);
  assert.equal(canWalkStorm(240, 300), false);
  assert.equal(canWalkWind(WIND_STORM_GATE.x, WIND_STORM_GATE.y), true);
  for (const p of [STORM_BOSS_HOME, ...STORM_SLIMES, ...POOLS, ...FLOWERS])
    assert.ok(findPath(STORM_SPAWN, p, canWalkStorm).length, `${p.x},${p.y}`);
  assert.equal(ROOMS.length, 4);
});

test("storm key: correct distinct recipe, consumes one per party, free exit and fresh reentry", () => {
  const s = createSandbox();
  teleport(s, "bricoleur");
  const ingredients = KEY_RECIPES["slime-storm"].ingredients;
  assert.deepEqual(
    ingredients.map((i) => [i.name, i.quantity]),
    [
      ["Planche de châtaignier", 5],
      ["Cœur d’air", 1],
      ["Cœur d’eau", 1],
    ],
  );
  addWoodItem(s, "chestnut", "plank", 10);
  grantLoot(s, "rare", false, "wind-slime");
  grantLoot(s, "rare", false, "wind-slime");
  grantLoot(s, "rare", false, "slime");
  grantLoot(s, "rare", false, "slime");
  assert.equal(craftDungeonKeys(s, 2, "slime-storm"), true);
  assert.equal(travelToZone(s, "slime-wind"), true);
  Object.assign(s.player, WIND_STORM_GATE);
  assert.equal(useZoneGate(s), true);
  assert.equal(s.zone, "slime-storm");
  assert.equal(dungeonKeyCount(s, "slime-storm"), 1);
  assert.equal(s.dungeonRun.active, true);
  const old = s.monsters;
  old[0].hp = 0;
  movePartyToZone(s, "slime-storm", STORM_ENTRY);
  assert.equal(useZoneGate(s), true);
  assert.equal(s.zone, "slime-wind");
  assert.equal(s.dungeonRun.active, false);
  Object.assign(s.player, WIND_STORM_GATE);
  assert.equal(useZoneGate(s), true);
  assert.notEqual(s.monsters, old);
  assert.ok(s.monsters.every((m) => m.hp > 0));
  assert.equal(dungeonKeyCount(s, "slime-storm"), 0);
  movePartyToZone(s, "slime-storm", STORM_ENTRY);
  useZoneGate(s);
  Object.assign(s.player, WIND_STORM_GATE);
  assert.equal(useZoneGate(s), false);
  assert.equal(s.zone, "slime-wind");
});

test("storm development travel is free and return home works", () => {
  const s = createSandbox();
  assert.equal(travelToZone(s, "slime-storm"), true);
  assert.equal(s.bag.length,0);
  teleport(s, "maison");
  assert.equal(s.zone, "garden");
});

test("storm growth: shallow water and rechargeable sponge flowers increase size up to three", () => {
  const { s, m } = fixture();
  Object.assign(m, POOLS[0]);
  m.growth = 1;
  stepStormEnvironment(s, 2);
  assert.equal(m.growth, 2);
  stepStormEnvironment(s, 2);
  assert.equal(m.growth, 3);
  m.growth = 1;
  Object.assign(m, FLOWERS[0]);
  stepStormEnvironment(s, 0.1);
  assert.equal(m.growth, 2);
  stepStormEnvironment(s, 0.1);
  assert.equal(m.growth, 2);
  s.time = 11;
  stepStormEnvironment(s, 0.1);
  assert.equal(m.growth, 3);
});

test("storm attacks: initial Water landing hits across its preview circle without sprite contact", () => {
  const { s, m, hits, ctx } = fixture();
  stepStormMonster(s, m, 0.1, ctx);
  assert.equal(m.intent.phase, "water-windup");
  const landing = { ...m.intent.to },
    radius = m.intent.radius;
  Object.assign(s.team[0], { x: landing.x + radius - 2, y: landing.y });
  stepStormMonster(s, m, 2, ctx);
  assert.equal(m.intent.phase, "flight");
  stepStormMonster(s, m, 1, ctx);
  assert.equal(hits.length, 1);
  assert.equal(hits[0][3], "water");
  assert.equal(m.intent.phase, "inflate");
  assert.ok(Math.hypot(m.x - s.team[0].x, m.y - s.team[0].y) > 15);
});

test("storm cycles: only one inflation, locked ricochets, Air burst and impacts then recovery", () => {
  const { s, m, ctx, hits } = fixture();
  const other = createMonster("foam-slime", 175, 310, 6);
  other.stormRoom = 0;
  s.monsters.push(other);
  stepStormMonster(s, m, 0.1, ctx);
  stepStormMonster(s, m, 2, ctx);
  stepStormMonster(s, m, 1, ctx);
  stepStormMonster(s, other, 0.1, ctx);
  stepStormMonster(s, other, 2, ctx);
  stepStormMonster(s, other, 1, ctx);
  assert.equal(m.intent.phase, "inflate");
  assert.equal(other.intent.phase, "wait-air");
  const points = structuredClone(m.intent.landings);
  Object.assign(s.team[0], { x: 70, y: 340 });
  stepStormMonster(s, m, 2, ctx);
  assert.equal(m.intent.leg, 0);
  assert.deepEqual(m.intent.landings, points);
  stepStormMonster(s, other, 0.3, ctx);
  assert.equal(other.intent.phase, "inflate");
  stepStormMonster(s, m, 1, ctx);
  assert.equal(m.intent.phase, "bounce");
  stepStormMonster(s, m, 1, ctx);
  assert.equal(m.intent.leg, 1);
  stepStormMonster(s, m, 1, ctx);
  assert.equal(m.intent, undefined);
  assert.ok(m.cooldown > 0);
  assert.ok(s.monsterImpacts.some((a) => a.element === "air"));
});

test("storm scission: dry missed impact spawns an Air/Water child, water instead grows and children give no rewards", () => {
  const { s, m } = fixture();
  m.growth = 3;
  m.maxHp = Math.round(m.baseMaxHp * 1.5);
  m.hp = m.maxHp;
  const hp = m.hp;
  assert.equal(onStormLanding(s, m, { x: 120, y: 290 }, 0), true);
  assert.equal(m.growth, 2);
  assert.equal(s.monsters.length, 2);
  const child = s.monsters[1];
  assert.deepEqual(child.elements, ["air", "water"]);
  assert.equal(child.growth, 1);
  assert.ok(m.hp + child.hp <= hp);
  rewardMonster(s, child);
  assert.equal(s.bag.length,0);
  assert.equal(s.gold, 0);
  assert.equal(s.team[0].xp, 0);
  assert.equal(onStormLanding(s, m, POOLS[0], 0), false);
  assert.equal(m.growth, 3);
  const count = s.monsters.length;
  onStormLanding(s, m, { x: 120, y: 290 }, 1);
  assert.equal(s.monsters.length, count);
});

test("Nimbulimon: wake, fixed HP scaling, only final dry miss exposes for six seconds and pool restores mass", () => {
  const { s, m } = fixture(true);
  assert.equal(m.maxHp, monsterStats("nimbulimon", 10).maxHp);
  assert.equal(awakenStormBoss(s), true);
  const hp = m.hp,
    max = m.maxHp;
  assert.equal(onStormLanding(s, m, { x: 540, y: 230 }, 0, false), false);
  assert.equal(m.growth, 3);
  assert.equal(onStormLanding(s, m, { x: 540, y: 230 }, 0, true), true);
  assert.equal(m.growth, 2);
  assert.equal(m.vulnerableUntil, s.time + 6);
  assert.equal(m.hp, hp);
  assert.equal(m.maxHp, max);
  onStormLanding(s, m, POOLS[3], 0, true);
  assert.equal(m.growth, 3);
  resetStormBoss(s);
  assert.equal(m.bossPhase, "dormant");
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.vulnerableUntil, 0);
  assert.equal(s.monsters.filter((n) => n.stormSpawn && n.hp > 0).length, 0);
});

test("storm currents: warning before push, collision-safe displacement, rage starts with warning", () => {
  const { s, m } = fixture(true);
  s.time = 0;
  const c = CURRENTS[0];
  assert.equal(currentState(s, c).warning, true);
  Object.assign(s.team[0], { x: 125, y: 140 });
  Object.assign(s.player, s.team[0]);
  const y = s.player.y;
  stepStormEnvironment(s, 0.1);
  assert.equal(s.player.y, y);
  s.time = 1.2;
  stepStormEnvironment(s, 0.1);
  assert.ok(s.player.y > y);
  assert.ok(canWalkStorm(s.player.x, s.player.y));
  Object.assign(s.team[0], { x: 525, y: 235 });
  Object.assign(s.player, s.team[0]);
  awakenStormBoss(s);
  m.hp = m.maxHp * 0.3;
  s.time = 20;
  stepStormEnvironment(s, 0.1);
  assert.equal(currentState(s, CURRENTS[2]).warning, true);
});

test("storm roots interrupt preparation, paused frames cause no impacts and dead enemies stop attacking", () => {
  const { s, m, ctx, hits } = fixture();
  stepStormMonster(s, m, 0.1, ctx);
  const age = m.intent.age;
  stepStormMonster(s, m, 0, ctx);
  assert.equal(m.intent.age, age);
  m.spellState = { root: 1 };
  stepStormMonster(s, m, 0.1, ctx);
  assert.equal(m.intent, undefined);
  assert.equal(hits.length, 0);
  m.hp = 0;
  stepStormMonster(s, m, 3, ctx);
  assert.equal(hits.length, 0);
});

test("storm bestiary and rewards: standard Air/Water resources, boss with royal loot and victory recorded once", () => {
  const drops = monsterLoot("foam-slime");
  assert.equal(drops.length, 4);
  assert.deepEqual(drops[0].elements, ["air", "water"]);
  assert.deepEqual(monsterLoot("nimbulimon").map(i=>i.chance), [1,.05]);
  assert.ok(
    renderBestiary("nimbulimon", 10).includes("Dernier impact sur dalle sèche"),
  );
  const { s, m } = fixture(true);
  s.dungeonRun = { dungeonId: "slime-storm", active: true, completed: false };
  m.hp = 0;
  finishStormBoss(s, m);
  rewardMonster(s, m);
  const gold = s.gold;
  rewardMonster(s, m);
  assert.equal(s.gold, gold);
  assert.ok(gold > 0);
  assert.equal(s.bag.filter(i=>i.kind==='royal-key-part').length, 1);
  assert.equal(s.dungeonRun.completed, true);
});

test("storm full combat pipeline: exposed damage and boss victory with royal loot", () => {
  const { s, m } = fixture(true);
  assert.equal(awakenStormBoss(s), true);
  m.vulnerableUntil = s.time + 6;
  const before = m.hp;
  spellContext.hitMonster(s, m, 10, s.team[0]);
  assert.equal(before - m.hp, 15);
  s.dungeonRun = { dungeonId: "slime-storm", active: true, completed: false };
  spellContext.hitMonster(s, m, 99999, s.team[0]);
  assert.equal(m.bossPhase, "dead");
  assert.equal(s.dungeonRun.completed, true);
  assert.equal(s.bag.filter(i=>i.kind==='royal-key-part').length, 1);
  const gold = s.gold;
  spellContext.hitMonster(s, m, 99999, s.team[0]);
  assert.equal(s.gold, gold);
});

test("storm full combat pipeline: defeat heals at entrance and resets boss without consuming another key", () => {
  const { s, m } = fixture(true);
  awakenStormBoss(s);
  s.team[1].hp = 0;
  s.team[2].hp = 0;
  s.team[0].hp = 1;
  s.bag.push({ ...createDungeonKey("slime-storm"), id: s.nextItem++ });
  m.damage = 99999;
  m.intent = {
    kind: "storm-cycle",
    phase: "flight",
    age: 0.59,
    leg: 1,
    from: { x: m.x, y: m.y },
    to: { x: s.player.x, y: s.player.y },
    landings: [
      { x: 525, y: 235 },
      { x: s.player.x, y: s.player.y },
    ],
    radius: 41,
    element: "water",
  };
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-storm");
  assert.equal(s.player.x, STORM_SPAWN.x);
  assert.equal(s.player.y, STORM_SPAWN.y);
  assert.ok(s.team.every((p) => p.hp === p.maxHp));
  assert.equal(m.bossPhase, "dormant");
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.intent, undefined);
  assert.equal(dungeonKeyCount(s, "slime-storm"), 1);
});
