import test from "node:test";
import assert from "node:assert/strict";
import * as map from "../src/world/slime-fire-map.js";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
} from "../src/dev/sandbox.js";
import {
  createMonster,
  monsterLoot,
  monsterStats,
} from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import {
  travelToZone,
  useZoneGate,
  nearZoneGate,
  MOUNTAIN_FIRE_GATE,
} from "../src/game/zone-travel.js";
import { canWalkZone, movePartyToZone } from "../src/world/zones.js";
import { findPath } from "../src/ai/companions.js";
import {
  leaveFireTrail,
  stepFireHazards,
  onFireSlimeDeath,
  resetFireSlime,
  FIRE_RULES,
} from "../src/game/fire-slimes.js";
import {
  startMonsterAttack,
  stepMonsterAbility,
  clearMonsterAttacks,
} from "../src/combat/monster-attacks.js";
import { renderBestiary, bestiaryValues } from "../src/ui/bestiary.js";
import { renderItemIcon } from "../src/ui/item-art.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-fire");
  s.fireGuideOpen = false;
  return s;
};
function fixture() {
  const s = setup();
  s.deployed = false;
  const m = createMonster("fire-slime", 150, 240, 5);
  s.monsters = [m];
  Object.assign(s.player, { x: 180, y: 240 });
  Object.assign(s.team[s.main], s.player);
  const hits = [];
  const ctx = {
    canStand: map.canWalkFire,
    damage: (p, n, source, element, kind) =>
      hits.push({ id: p.id, n, element, kind }),
  };
  const step = (dt) => {
    s.time += dt;
    stepFireHazards(s, dt, ctx);
  };
  return { s, m, hits, ctx, step };
}

test("Champs de Braise : accès à toutes les rencontres, basalte périodique et lave infranchissable", () => {
  assert.deepEqual(map.validateMap(), []);
  for (const p of [map.FIRE_ENTRY, ...map.FIRE_SLIMES]) {
    assert.ok(canWalkZone(p.x, p.y, "slime-fire"));
    assert.ok(
      findPath(map.FIRE_SPAWN, p, map.canWalkFire).length,
      JSON.stringify(p),
    );
  }
  for (const [x, y] of [
    [200, 140],
    [420, 230],
    [540, 130],
    [0, 0],
  ])
    assert.equal(map.canWalkFire(x, y), false);
  for (const material of ["basalt", "dirt"])
    for (const [x, y] of [
      [-3, -11],
      [0, 0],
      [63, 63],
      [21, 30],
    ]) {
      assert.deepEqual(
        map.texturePixel(material, x, y),
        map.texturePixel(material, x + 64, y),
      );
      assert.deepEqual(
        map.texturePixel(material, x, y),
        map.texturePixel(material, x, y + 64),
      );
    }
});
test("passages montagnes ↔ braises, retours village, monde conservé et outils maison", () => {
  const s = createSandbox();
  travelToZone(s, "slime-mountains");
  movePartyToZone(s, "slime-mountains", MOUNTAIN_FIRE_GATE);
  assert.equal(nearZoneGate(s).destination, "slime-fire");
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters.length, 6);
  assert.equal(s.fireGuideOpen, true);
  const first = s.monsters[0];
  first.hp -= 10;
  movePartyToZone(s, "slime-fire", map.FIRE_ENTRY);
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-mountains");
  assert.ok(
    Math.hypot(
      s.player.x - MOUNTAIN_FIRE_GATE.x,
      s.player.y - MOUNTAIN_FIRE_GATE.y,
    ) < 32,
  );
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters[0], first);
  assert.equal(s.fireGuideOpen, false);
  travelToZone(s, "garden");
  assert.ok(canWalkZone(s.player.x, s.player.y, "garden"));
});
test("traînée continue en marche et en vol, sans flammes sur lave ni production à l’arrêt", () => {
  const { s, m } = fixture();
  leaveFireTrail(s, m, map.canWalkFire);
  m.x += 30;
  leaveFireTrail(s, m, map.canWalkFire);
  assert.equal(s.fireTrails.length, 4);
  assert.ok(s.fireTrails.every((h) => map.canWalkFire(h.x, h.y)));
  const n = s.fireTrails.length;
  leaveFireTrail(s, m, map.canWalkFire);
  assert.equal(s.fireTrails.length, n);
  m.fireTrailPoint = { x: 145, y: 145 };
  m.x = 265;
  m.y = 145;
  leaveFireTrail(s, m, map.canWalkFire);
  assert.ok(s.fireTrails.every((h) => map.canWalkFire(h.x, h.y)));
  m.hp = 0;
  const before = s.fireTrails.length;
  m.x += 30;
  leaveFireTrail(s, m, map.canWalkFire);
  assert.equal(s.fireTrails.length, before);
});
test("braises : délai, dégâts Feu limités malgré superposition, expiration et morts hors cible", () => {
  const { s, m, hits, step } = fixture();
  leaveFireTrail(s, m, map.canWalkFire);
  m.x = 185;
  leaveFireTrail(s, m, map.canWalkFire);
  s.fireTrails.push(...s.fireTrails.map((h) => ({ ...h })));
  step(0.3);
  assert.equal(hits.length, 0);
  step(0.06);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].element, "fire");
  assert.equal(hits[0].kind, "burn");
  step(0.2);
  assert.equal(hits.length, 1);
  step(0.41);
  assert.equal(hits.length, 2);
  s.team[0].hp = 0;
  step(0.7);
  assert.equal(hits.length, 2);
  step(4);
  assert.equal(s.fireTrails.length, 0);
});
test("explosion post-mortem : cercle verrouillé, déclenchement unique, esquive et troupe déployée", () => {
  const { s, m, hits, step } = fixture();
  s.deployed = true;
  Object.assign(s.team[1], { x: 160, y: 240 });
  Object.assign(s.team[2], { x: 250, y: 240 });
  assert.equal(onFireSlimeDeath(s, m), false);
  m.hp = 0;
  assert.ok(onFireSlimeDeath(s, m));
  assert.equal(onFireSlimeDeath(s, m), false);
  m.x = 300;
  step(0.85);
  assert.equal(hits.length, 0);
  step(0.06);
  assert.deepEqual(hits.map((h) => h.id).sort(), [0, 1]);
  assert.ok(hits.every((h) => h.element === "fire" && h.kind === "explosion"));
  assert.equal(s.fireExplosions.length, 0);
  step(1);
  assert.equal(hits.length, 2);
  const f = fixture();
  f.m.hp = 0;
  onFireSlimeDeath(f.s, f.m);
  Object.assign(f.s.team[0], { x: 230, y: 240 });
  f.step(1);
  assert.equal(f.hits.length, 0);
});
test("flammes et explosion ne touchent pas à travers un obstacle ni les alliés non déployés", () => {
  const { s, m, hits, step, ctx } = fixture();
  s.deployed = false;
  Object.assign(s.team[1], { x: 150, y: 240 });
  s.team[0].x = 170;
  m.hp = 0;
  onFireSlimeDeath(s, m);
  ctx.canStand = (x, y) => map.canWalkFire(x, y) && !(x > 156 && x < 162);
  step(1);
  assert.equal(hits.length, 0);
});
test("coup fatal récompensé une seule fois, explosion maintenue, respawn réarme la mécanique", () => {
  const { s, m } = fixture();
  const gold = s.gold;
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  assert.equal(s.gold, gold + m.gold);
  assert.equal(s.fireExplosions.length, 1);
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  assert.equal(s.gold, gold + m.gold);
  assert.equal(s.fireExplosions.length, 1);
  for (let i = 0; i < 405; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(m.hp > 0);
  assert.equal(m.fireDeathQueued, undefined);
  assert.equal(s.fireExplosions.length, 0);
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  assert.equal(s.fireExplosions.length, 1);
});
test("mort de la troupe et transitions nettoient les dangers et ne créent pas de traînée de téléportation", () => {
  const { s, m } = fixture();
  s.team.forEach((p) => (p.hp = 1));
  s.deployed = true;
  s.team.forEach((p) => Object.assign(p, { x: m.x, y: m.y }));
  Object.assign(s.player, { x: m.x, y: m.y });
  m.hp = 0;
  onFireSlimeDeath(s, m);
  s.fireExplosions[0].radius = 200;
  for (let i = 0; i < 20; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-fire");
  assert.ok(s.team.every((p) => p.hp > 0));
  assert.equal(s.fireExplosions.length, 0);
  assert.equal(s.fireTrails.length, 0);
  assert.deepEqual({ x: s.player.x, y: s.player.y }, map.FIRE_SPAWN);
  const f = fixture();
  leaveFireTrail(f.s, f.m, map.canWalkFire);
  f.m.x += 25;
  leaveFireTrail(f.s, f.m, map.canWalkFire);
  f.m.hp = 0;
  onFireSlimeDeath(f.s, f.m);
  travelToZone(f.s, "slime-mountains");
  assert.equal(f.s.fireTrails.length, 0);
  assert.equal(f.s.fireExplosions.length, 0);
  travelToZone(f.s, "slime-fire");
  assert.equal(f.m.fireTrailPoint, undefined);
  clearMonsterAttacks(f.s);
  resetFireSlime(f.m);
  assert.equal(f.m.fireDeathQueued, undefined);
});
test("bond Feu : cible isolée, annonce sans dégâts puis impact de zone et traînée en vol", () => {
  const { s, m, hits, ctx } = fixture();
  m.cooldown = 0;
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.equal(monsterAttack(m).element, "fire");
  assert.equal(m.intent.phase, "windup");
  const target = { ...m.intent.to };
  Object.assign(s.team[0], { x: target.x + 15, y: target.y });
  leaveFireTrail(s, m, ctx.canStand);
  for (let i = 0; i < 23; i++) {
    stepMonsterAbility(s, m, 0.05, ctx);
    leaveFireTrail(s, m, ctx.canStand);
  }
  assert.equal(hits.length, 0);
  for (let i = 0; i < 15; i++) {
    stepMonsterAbility(s, m, 0.05, ctx);
    leaveFireTrail(s, m, ctx.canStand);
  }
  assert.equal(hits.length, 1);
  assert.equal(hits[0].element, "fire");
  assert.ok(s.fireTrails.length > 0);
  assert.ok(m.cooldown > 0);
});
test("résistances Feu et stats de niveau appliquées aux dangers dans la simulation", () => {
  const s = setup();
  s.deployed = false;
  s.monsters = [];
  Object.assign(s.player, { x: 150, y: 240 });
  Object.assign(s.team[0], s.player);
  s.team[0].resistances = { fire: 50 };
  const m = createMonster("fire-slime", 150, 240, 5);
  m.hp = 0;
  onFireSlimeDeath(s, m);
  const hp = s.team[0].hp;
  for (let i = 0; i < 19; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.team[0].hp, hp - Math.round(Math.round(m.damage * 1.6) * 0.5));
  assert.equal(s.team[0].lastDamageElement, "fire");
});
test("bestiaire, loot et noyau Feu disposent des nouveaux visuels et statistiques", () => {
  const html = renderBestiary("fire-slime", 5);
  assert.ok(html.includes("Champs de Braise"));
  assert.ok(html.includes("EXPLOSION") || html.includes("Explosion à la mort"));
  assert.ok(!html.includes("<p><path"));
  assert.ok(!html.includes("NaN"));
  assert.notEqual(
    bestiaryValues("fire-slime", 1).maxHp,
    bestiaryValues("fire-slime", 10).maxHp,
  );
  assert.ok(monsterStats("fire-slime", 5).maxHp > 95);
  for (const loot of monsterLoot("fire-slime")) {
    assert.match(renderItemIcon(loot), /<svg/);
  }
  const s = setup();
  rewardMonster(s, s.monsters[0], () => 0);
  assert.ok(s.bag.some((i) => i.name === "Cœur de braise"));
  assert.ok(s.bag.some((i) => i.element === "fire" && i.kind === "core"));
});
