import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
  teleport,
  grantLoot,
} from "../src/dev/sandbox.js";
import { createMonster, monsterLoot } from "../src/data/monsters.js";
import {
  createFurnaceWorld,
  furnaceState,
  furnaceBoss,
  awakenFurnaceBoss,
  resetFurnaceBoss,
  stepFurnaceMonster,
  stepFurnaceHazards,
  onFurnaceDeath,
  addFurnaceEmber,
  projectFurnaceEmbers,
  resolveFurnaceBreath,
  inFurnaceCone,
  FURNACE_RULES,
} from "../src/game/furnace.js";
import {
  FURNACE_ENTRY,
  FURNACE_SPAWN,
  FIRE_FURNACE_GATE,
  FURNACE_BOSS_HOME,
  FURNACE_SLIMES,
  BRAZIERS,
  canWalkFurnace,
  validateMap,
} from "../src/world/furnace-map.js";
import { canWalkFire } from "../src/world/slime-fire-map.js";
import { findPath } from "../src/ai/companions.js";
import { travelToZone, useZoneGate } from "../src/game/zone-travel.js";
import { movePartyToZone } from "../src/world/zones.js";
import {
  createDungeonKey,
  dungeonKeyCount,
  KEY_RECIPES,
} from "../src/data/handyman.js";
import { craftDungeonKeys } from "../src/game/handyman.js";
import { addWoodItem } from "../src/game/woodcutting.js";
import { renderBestiary, bestiaryValues } from "../src/ui/bestiary.js";
function fixture(boss = false) {
  const s = createSandbox();
  Object.assign(s, createFurnaceWorld(), {
    zone: "slime-furnace",
    deployed: false,
  });
  const m = boss ? furnaceBoss(s) : s.monsters[0];
  s.monsters = [m];
  Object.assign(s.player, { x: m.x, y: m.y + 25 });
  Object.assign(s.team[0], s.player);
  const hits = [],
    ctx = { canStand: canWalkFurnace, damage: (...args) => hits.push(args) };
  return { s, m, ctx, hits };
}
const aim = (from, to, range = 200) => ({
  from: { x: from.x, y: from.y },
  angle: Math.atan2(to.y - from.y, to.x - from.x),
  range,
  halfAngle: FURNACE_RULES.halfAngle,
});

test("furnace map: four connected chambers, all spawns/braziers reachable and entrance outside lava", () => {
  assert.deepEqual(validateMap(), []);
  assert.ok(canWalkFire(FIRE_FURNACE_GATE.x, FIRE_FURNACE_GATE.y));
  assert.equal(canWalkFurnace(260, 270), false);
  for (const p of [FURNACE_BOSS_HOME, ...FURNACE_SLIMES, ...BRAZIERS])
    assert.ok(
      findPath(FURNACE_SPAWN, p, canWalkFurnace).length,
      `${p.x},${p.y}`,
    );
});

test("furnace key: Air/Fire recipe, one key per fresh party entry and free exit", () => {
  const s = createSandbox();
  teleport(s, "bricoleur");
  assert.deepEqual(
    KEY_RECIPES["slime-furnace"].ingredients.map((i) => [i.name, i.quantity]),
    [
      ["Planche de châtaignier", 5],
      ["Cœur de feu", 1],
      ["Cœur d’air", 1],
    ],
  );
  addWoodItem(s, "chestnut", "plank", 10);
  for (let i = 0; i < 2; i++) {
    grantLoot(s, "rare", false, "fire-slime");
    grantLoot(s, "rare", false, "wind-slime");
  }
  assert.equal(craftDungeonKeys(s, 2, "slime-furnace"), true);
  travelToZone(s, "slime-fire");
  Object.assign(s.player, FIRE_FURNACE_GATE);
  assert.equal(useZoneGate(s), true);
  assert.equal(s.zone, "slime-furnace");
  assert.equal(dungeonKeyCount(s, "slime-furnace"), 1);
  const old = s.monsters;
  old[0].hp = 0;
  movePartyToZone(s, "slime-furnace", FURNACE_ENTRY);
  assert.equal(useZoneGate(s), true);
  assert.equal(s.zone, "slime-fire");
  assert.equal(s.dungeonRun.active, false);
  Object.assign(s.player, FIRE_FURNACE_GATE);
  assert.equal(useZoneGate(s), true);
  assert.notEqual(s.monsters, old);
  assert.ok(s.monsters.every((m) => m.hp > 0));
  assert.equal(dungeonKeyCount(s, "slime-furnace"), 0);
  movePartyToZone(s, "slime-furnace", FURNACE_ENTRY);
  useZoneGate(s);
  Object.assign(s.player, FIRE_FURNACE_GATE);
  assert.equal(useZoneGate(s), false);
  assert.equal(s.zone, "slime-fire");
});

test("furnace dash: full warning, continuous collision-safe movement, one hit per charge, finite trail", () => {
  const { s, m, ctx, hits } = fixture();
  stepFurnaceMonster(s, m, 0.05, ctx);
  assert.equal(m.intent.phase, "charge-warning");
  const from = { x: m.x, y: m.y };
  stepFurnaceMonster(s, m, 1, ctx);
  assert.equal(m.y, from.y);
  assert.equal(hits.length, 0);
  stepFurnaceMonster(s, m, 0.1, ctx);
  for (let i = 0; i < 10 && m.intent.phase === "charge"; i++) {
    s.time += 0.05;
    stepFurnaceMonster(s, m, 0.05, ctx);
    assert.ok(canWalkFurnace(m.x, m.y));
  }
  assert.equal(hits.length, 1);
  assert.equal(hits[0][3], "fire");
  assert.equal(m.intent.phase, "breath");
  assert.ok(furnaceState(s).embers.length > 0);
  s.time = 10;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(s.furnace.embers.length, 0);
});

test("furnace breath: tracks briefly, locks a full second and never hits behind pillars or outside cone", () => {
  const { s, m, ctx } = fixture(true);
  awakenFurnaceBoss(s);
  m.intent = {
    kind: "furnace-cycle",
    phase: "breath",
    age: 0,
    windup: 1.8,
    from: { x: m.x, y: m.y },
    angle: 0,
    to: { x: 555, y: 150 },
    range: 200,
    halfAngle: 0.45,
    locked: false,
  };
  Object.assign(s.team[0], { x: 580, y: 135 });
  stepFurnaceMonster(s, m, 0.7, ctx);
  const angle = m.intent.angle;
  stepFurnaceMonster(s, m, 0.2, ctx);
  assert.equal(m.intent.locked, true);
  Object.assign(s.team[0], { x: 400, y: 280 });
  stepFurnaceMonster(s, m, 0.4, ctx);
  assert.equal(m.intent.angle, angle);
  assert.equal(
    inFurnaceCone({ x: 470, y: 200 }, aim(m, { x: 600, y: 200 })),
    false,
  );
  assert.equal(
    inFurnaceCone({ x: 610, y: 95 }, aim({ x: 570, y: 95 }, { x: 620, y: 95 })),
    false,
  );
  assert.equal(
    inFurnaceCone({ x: 600, y: 200 }, aim(m, { x: 600, y: 200 }, 50)),
    false,
  );
});

test("furnace projected embers: same item count, previewed landing, no burn in flight and no life extension", () => {
  const { s, m, ctx, hits } = fixture(true);
  const ember = addFurnaceEmber(s, { x: 450, y: 200 }, m),
    expires = ember.expiresAt;
  projectFurnaceEmbers(s, aim({ x: 420, y: 200 }, { x: 550, y: 200 }));
  assert.equal(s.furnace.embers.length, 1);
  assert.ok(ember.flight);
  const to = { ...ember.flight.to };
  assert.ok(canWalkFurnace(to.x, to.y));
  Object.assign(s.team[0], to);
  s.time = 0.5;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 0);
  s.time = 0.9;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(ember.flight, undefined);
  assert.equal(hits.length, 1);
  assert.equal(ember.expiresAt, expires);
  assert.equal(s.furnace.embers.length, 1);
});

test("furnace burns: overlaps aggregate, remain on contact, and tick no faster than .6 seconds", () => {
  const { s, m, ctx, hits } = fixture();
  Object.assign(s.team[0], { x: 150, y: 340 });
  const e = addFurnaceEmber(s, { x: 150, y: 340 }, m);
  s.furnace.embers.push({ ...e, x: 151 });
  s.time = 0.5;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 1);
  assert.equal(s.furnace.embers.length, 2);
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 1);
  s.time = 1.2;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 2);
});

test("furnace death: one explosion only, current redirects once and grants a full new warning", () => {
  const { s, m, ctx, hits } = fixture();
  Object.assign(m, { x: 100, y: 190, hp: 0 });
  s.time = 1.2;
  assert.equal(onFurnaceDeath(s, m), true);
  assert.equal(onFurnaceDeath(s, m), false);
  stepFurnaceHazards(s, 0.1, ctx);
  const blast = s.furnace.blasts[0];
  assert.equal(blast.diverted, true);
  assert.ok(blast.x > 100);
  assert.equal(blast.explodesAt, s.time + 1);
  Object.assign(s.team[0], { x: blast.x + 25, y: blast.y });
  s.time = 2.1;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 0);
  s.time = 2.3;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(hits.length, 1);
  assert.equal(hits[0][3], "fire");
  assert.equal(s.furnace.blasts.length, 0);
});

test("furnace ordinary braziers: breath extinguishes for ten seconds, then warns before relighting", () => {
  const { s, m, ctx } = fixture();
  const b = furnaceState(s).braziers.find((b) => b.room === 2);
  resolveFurnaceBreath(s, m, aim({ x: b.x - 20, y: b.y }, b), ctx);
  assert.equal(b.lit, false);
  assert.equal(b.relightAt, 10);
  s.time = 9.9;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(b.lit, false);
  s.time = 10;
  stepFurnaceHazards(s, 0.1, ctx);
  assert.equal(b.lit, true);
  assert.equal(b.dangerAt, 11);
});

test("Siroccolimon: own breath extinguishes three persistent braziers, exposes eight seconds then relights", () => {
  const { s, m, ctx } = fixture(true);
  assert.equal(awakenFurnaceBoss(s), true);
  const braziers = furnaceState(s).braziers.filter((b) => b.room === 3);
  const normal = createMonster("cinder-slime", 480, 200, 6);
  resolveFurnaceBreath(s, normal, aim(m, braziers[0]), ctx);
  assert.equal(braziers[0].lit, true);
  for (let i = 0; i < 3; i++) {
    resolveFurnaceBreath(s, m, aim(m, braziers[i]), ctx);
    assert.equal(braziers.filter((b) => !b.lit).length, i + 1);
    if (i < 2) assert.equal(m.vulnerableUntil, undefined);
  }
  assert.equal(m.vulnerableUntil, 8);
  assert.equal(m.cooldown, 8);
  assert.equal(m.needsRelight, true);
  const hp = m.hp;
  spellContext.hitMonster(s, m, 10, s.team[0]);
  assert.equal(hp - m.hp, 15);
  s.time = 8.1;
  m.cooldown = 0;
  stepFurnaceMonster(s, m, 0.1, ctx);
  assert.ok(braziers.every((b) => b.lit));
  assert.equal(m.intent.phase, "charge-warning");
});

test("furnace interruptions: roots stop preparation and paused frames never advance or hit", () => {
  const { s, m, ctx, hits } = fixture();
  stepFurnaceMonster(s, m, 0.1, ctx);
  stepFurnaceMonster(s, m, 0, ctx);
  assert.equal(m.intent.age, 0);
  m.spellState = { root: 1 };
  stepFurnaceMonster(s, m, 0.1, ctx);
  assert.equal(m.intent, undefined);
  assert.equal(hits.length, 0);
});

test("furnace full pipeline: defeat returns to entrance and cleans hazards without another key", () => {
  const { s, m } = fixture(true);
  awakenFurnaceBoss(s);
  s.team[0].hp = 1;
  s.team[1].hp = 0;
  s.team[2].hp = 0;
  m.damage = 99999;
  s.bag.push({ ...createDungeonKey("slime-furnace"), id: s.nextItem++ });
  m.intent = {
    kind: "furnace-cycle",
    phase: "breath",
    age: 1.79,
    windup: 1.8,
    from: { x: m.x, y: m.y },
    to: { x: s.player.x, y: s.player.y },
    angle: Math.PI / 2,
    range: 200,
    halfAngle: 0.45,
    locked: true,
  };
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-furnace");
  assert.equal(s.player.x, FURNACE_SPAWN.x);
  assert.equal(s.player.y, FURNACE_SPAWN.y);
  assert.ok(s.team.every((p) => p.hp === p.maxHp));
  assert.equal(m.bossPhase, "dormant");
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.intent, undefined);
  assert.equal(dungeonKeyCount(s, "slime-furnace"), 1);
  assert.equal(s.furnace?.embers.length || 0, 0);
  assert.equal(s.furnace?.blasts.length || 0, 0);
});

test("furnace victory, loot, bestiary and developer entry follow shared dungeon rules", () => {
  const { s, m } = fixture(true);
  awakenFurnaceBoss(s);
  s.dungeonRun = { dungeonId: "slime-furnace", active: true, completed: false };
  spellContext.hitMonster(s, m, 99999, s.team[0]);
  assert.equal(m.bossPhase, "dead");
  assert.equal(s.dungeonRun.completed, true);
  assert.deepEqual(s.bag, []);
  assert.ok(s.furnace.braziers.every((b) => !b.lit));
  const gold = s.gold;
  rewardMonster(s, m);
  assert.equal(s.gold, gold);
  assert.deepEqual(monsterLoot("siroccolimon"), []);
  assert.equal(monsterLoot("cinder-slime").length, 8);
  assert.ok(
    renderBestiary("siroccolimon", 10).includes("Les braseros restent éteints"),
  );
  assert.equal(
    bestiaryValues("siroccolimon", 10).respawnDelay,
    "Nouvelle expédition",
  );
  const dev = createSandbox();
  assert.equal(travelToZone(dev, "slime-furnace"), true);
  teleport(dev, "maison");
  assert.equal(dev.zone, "garden");
  assert.equal(dungeonKeyCount(dev, "slime-furnace"), 0);
});
