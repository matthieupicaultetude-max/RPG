import test from "node:test";
import assert from "node:assert/strict";
import * as map from "../src/world/slime-wind-map.js";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
  teleport,
} from "../src/dev/sandbox.js";
import { createMonster, monsterLoot } from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import {
  travelToZone,
  useZoneGate,
  nearZoneGate,
} from "../src/game/zone-travel.js";
import { movePartyToZone, canWalkZone } from "../src/world/zones.js";
import { findPath } from "../src/ai/companions.js";
import { WIND_RULES, stepWindSuction } from "../src/game/wind-slimes.js";
import {
  startMonsterAttack,
  stepMonsterAbility,
  clearMonsterAttacks,
} from "../src/combat/monster-attacks.js";
import { renderBestiary, bestiaryValues } from "../src/ui/bestiary.js";
import { renderItemIcon } from "../src/ui/item-art.js";
import { canWalkMountains } from "../src/world/slime-mountains-map.js";
function setup() {
  const s = createSandbox();
  travelToZone(s, "slime-wind");
  s.windGuideOpen = false;
  return s;
}
function fixture() {
  const s = setup(),
    m = createMonster("wind-slime", 130, 245, 5);
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.player, { x: 160, y: 245 });
  Object.assign(s.team[0], s.player);
  const hits = [],
    ctx = {
      canStand: map.canWalkWind,
      damage: (p, n, monster, element, kind) =>
        hits.push({ id: p.id, n, element, kind }),
    };
  const tick = (n) => {
    for (let t = 0; t < n - 1e-8; t += 0.025) {
      s.time += 0.025;
      m.cooldown = Math.max(0, m.cooldown - 0.025);
      stepWindSuction(s, 0.025, ctx);
      stepMonsterAbility(s, m, 0.025, ctx);
    }
  };
  return { s, m, hits, ctx, tick };
}

test("Alizés : plateaux, ponts et chaque groupe accessibles, précipices et moulins solides", () => {
  assert.deepEqual(map.validateMap(), []);
  for (const p of [
    map.WIND_ENTRY,
    ...map.WIND_SLIMES,
    ...map.BRIDGES.map((b) => ({
      x: (b.left + b.right) / 2,
      y: (b.top + b.bottom) / 2,
    })),
  ]) {
    assert.ok(canWalkZone(p.x, p.y, "slime-wind"));
    assert.ok(
      findPath(map.WIND_SPAWN, p, map.canWalkWind).length,
      JSON.stringify(p),
    );
  }
  assert.ok(
    canWalkMountains(map.MOUNTAIN_WIND_GATE.x, map.MOUNTAIN_WIND_GATE.y),
  );
  for (const [x, y] of [
    [0, 0],
    [245, 150],
    [450, 160],
    [100, 148],
  ])
    assert.equal(map.canWalkWind(x, y), false);
  for (const material of ["grass", "dirt"])
    for (const [x, y] of [
      [-8, -3],
      [0, 0],
      [63, 63],
    ])
      assert.deepEqual(
        map.texturePixel(material, x, y),
        map.texturePixel(material, x + 64, y + 64),
      );
});
test("passage montagnes ↔ alizés sans clé, retour au village et conservation des blessures", () => {
  const s = createSandbox();
  travelToZone(s, "slime-mountains");
  movePartyToZone(s, "slime-mountains", map.MOUNTAIN_WIND_GATE);
  assert.equal(nearZoneGate(s).destination, "slime-wind");
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters.length, 6);
  assert.equal(s.windGuideOpen, true);
  const m = s.monsters[0];
  m.hp -= 10;
  movePartyToZone(s, "slime-wind", map.WIND_ENTRY);
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-mountains");
  assert.ok(
    Math.hypot(
      s.player.x - map.MOUNTAIN_WIND_GATE.x,
      s.player.y - map.MOUNTAIN_WIND_GATE.y,
    ) < 32,
  );
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters[0], m);
  assert.equal(s.windGuideOpen, false);
  teleport(s, "maison");
  assert.equal(s.zone, "garden");
  assert.ok(canWalkZone(s.player.x, s.player.y, s.zone));
});
test("cycle : gonflement annoncé, deux destinations valides et distinctes, verrouillage sans dégâts précoces", () => {
  const { s, m, hits, ctx, tick } = fixture();
  assert.ok(startMonsterAttack(s, m, ctx));
  const a = m.intent,
    points = structuredClone(a.landings);
  assert.equal(a.phase, "windup");
  assert.equal(a.kind, "wind-cycle");
  assert.equal(a.element, "air");
  assert.ok(
    Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) > 30,
  );
  assert.ok(points.every((p) => map.canWalkWind(p.x, p.y)));
  Object.assign(s.team[0], { x: 180, y: 285 });
  tick(1.5);
  assert.equal(hits.length, 0);
  assert.deepEqual(a.landings, points);
  assert.equal(m.x, 130);
  assert.equal(m.y, 245);
  assert.equal(monsterAttack(m).recovery, WIND_RULES.recovery);
});
test("aspiration : déplacement progressif des membres actifs, synchronisation du héros et annulation de coupe", () => {
  const { s, m, ctx } = fixture();
  startMonsterAttack(s, m, ctx);
  s.woodcutting.action = { phase: "walk", owner: 0 };
  Object.assign(s.team[1], { x: 160, y: 245 });
  const old = s.team[1].x;
  stepWindSuction(s, 0.1, ctx);
  assert.ok(s.team[0].x < 160 && s.team[0].x > 157);
  assert.equal(s.player.x, s.team[0].x);
  assert.equal(s.woodcutting.action, null);
  assert.equal(s.team[1].x, old);
  s.deployed = true;
  stepWindSuction(s, 0.1, ctx);
  assert.ok(s.team[1].x < old);
});
test("aspirations superposées bornées, aucun déplacement à travers un obstacle ni hors du terrain", () => {
  const { s, m, ctx } = fixture();
  startMonsterAttack(s, m, ctx);
  const copies = Array.from({ length: 8 }, () => ({
    ...m,
    intent: { ...m.intent },
  }));
  s.monsters.push(...copies);
  const before = s.player.x;
  stepWindSuction(s, 0.1, ctx);
  assert.ok(before - s.player.x <= WIND_RULES.maxPullSpeed * 0.1 + 1e-8);
  ctx.canStand = (x, y) => map.canWalkWind(x, y) && !(x > 143 && x < 148);
  const x = s.player.x;
  stepWindSuction(s, 0.3, ctx);
  assert.equal(s.player.x, x);
  ctx.canStand = map.canWalkWind;
  Object.assign(m, { x: 215, y: 190 });
  Object.assign(s.player, { x: 213, y: 190 });
  Object.assign(s.team[0], s.player);
  for (let i = 0; i < 60; i++) stepWindSuction(s, 0.05, ctx);
  assert.ok(map.canWalkWind(s.player.x, s.player.y));
});
test("explosion à gonflement maximal : dégâts Air de zone, tous les membres déployés, une seule touche", () => {
  const { s, m, hits, ctx } = fixture();
  s.deployed = true;
  s.team.forEach((p, i) => Object.assign(p, { x: 130 + i * 10, y: 270 }));
  Object.assign(s.player, s.team[0]);
  assert.ok(startMonsterAttack(s, m, ctx));
  stepMonsterAbility(s, m, 1.79, ctx);
  assert.equal(hits.length, 0);
  stepMonsterAbility(s, m, 0.02, ctx);
  assert.equal(m.intent.phase, "flight");
  assert.deepEqual(
    hits.map((h) => h.id),
    [0, 1, 2],
  );
  assert.ok(hits.every((h) => h.element === "air" && h.kind === "air-burst"));
  stepMonsterAbility(s, m, 0.1, ctx);
  assert.equal(hits.length, 3);
});
test("esquiver le souffle n’annule pas les deux ricochets, les dégâts viennent des zones d’atterrissage", () => {
  const { s, m, hits, ctx } = fixture();
  assert.ok(startMonsterAttack(s, m, ctx));
  const a = m.intent,
    first = { ...a.landings[0] },
    second = { ...a.landings[1] };
  Object.assign(s.team[0], { x: 100, y: 315 });
  stepMonsterAbility(s, m, 1.81, ctx);
  assert.equal(hits.length, 0);
  Object.assign(s.team[0], { x: first.x + 15, y: first.y });
  stepMonsterAbility(s, m, 0.25, ctx);
  assert.equal(hits.length, 0);
  assert.ok(m.lift > 0);
  stepMonsterAbility(s, m, 0.26, ctx);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, "leap");
  assert.equal(a.phase, "bounce");
  assert.equal(m.lift, 0);
  Object.assign(s.team[0], { x: second.x - 15, y: second.y });
  stepMonsterAbility(s, m, 0.23, ctx);
  assert.equal(a.leg, 1);
  assert.equal(a.phase, "flight");
  stepMonsterAbility(s, m, 0.51, ctx);
  assert.equal(hits.length, 2);
  assert.ok(hits.every((h) => h.element === "air"));
  assert.equal(m.intent, undefined);
  assert.equal(m.cooldown, 3.2);
  assert.equal(startMonsterAttack(s, m, ctx), false);
});
test("immobilisation interrompt le gonflement ou la pause, sans arrêter un saut déjà lancé", () => {
  for (const phase of ["windup", "bounce"]) {
    const { s, m, hits, ctx } = fixture();
    startMonsterAttack(s, m, ctx);
    if (phase === "bounce") {
      stepMonsterAbility(s, m, 1.81, ctx);
      stepMonsterAbility(s, m, 0.51, ctx);
    }
    const n = hits.length;
    m.spellState = { root: 2 };
    stepMonsterAbility(s, m, 0.05, ctx);
    assert.equal(m.intent, undefined);
    assert.equal(m.lift, 0);
    assert.equal(hits.length, n);
    assert.equal(startMonsterAttack(s, m, ctx), false);
  }
  const { s, m, ctx } = fixture();
  startMonsterAttack(s, m, ctx);
  stepMonsterAbility(s, m, 1.81, ctx);
  m.spellState = { root: 2 };
  stepMonsterAbility(s, m, 0.25, ctx);
  assert.equal(m.intent.phase, "flight");
  stepMonsterAbility(s, m, 0.26, ctx);
  assert.equal(m.intent.phase, "bounce");
  stepMonsterAbility(s, m, 0.05, ctx);
  assert.equal(m.intent, undefined);
});
test("cycle annulé à la mort et au changement de zone, retour aérien sur un point valide", () => {
  const { s, m, ctx } = fixture();
  startMonsterAttack(s, m, ctx);
  stepMonsterAbility(s, m, 1.81, ctx);
  stepMonsterAbility(s, m, 0.2, ctx);
  assert.ok(m.lift > 0);
  clearMonsterAttacks(s);
  assert.equal(m.intent, undefined);
  assert.equal(m.lift, 0);
  assert.ok(map.canWalkWind(m.x, m.y));
  m.cooldown = 0;
  startMonsterAttack(s, m, ctx);
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(m.intent, undefined);
  assert.equal(m.hp, 0);
  m.respawn = 0.01;
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.lift, 0);
  travelToZone(s, "slime-mountains");
  assert.equal(s.zone, "slime-mountains");
});
test("résistance Air et recul du souffle appliqués dans la simulation, cooldown respecté", () => {
  const { s, m } = fixture();
  s.team[0].resistances = { air: 50 };
  const hp = s.team[0].hp;
  for (let i = 0; i < 38; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.team[0].lastDamageElement, "air");
  assert.equal(
    s.team[0].hp,
    hp - Math.round(Math.round(m.damage * 1.25) * 0.5),
  );
  assert.equal(m.intent.phase, "flight");
  for (let i = 0; i < 30; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(m.intent, undefined);
  assert.ok(m.cooldown > 2.5);
});
test("défaite : retour à l’entrée des alizés et cycle nettoyé", () => {
  const { s, m, ctx } = fixture();
  s.deployed = true;
  s.team.forEach((p) =>
    Object.assign(p, { x: 140, y: 245, hp: 1, loadout: [] }),
  );
  Object.assign(s.player, { x: 140, y: 245 });
  startMonsterAttack(s, m, ctx);
  m.intent.age = 1.79;
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(s.team.every((p) => p.hp > 0));
  assert.equal(s.zone, "slime-wind");
  assert.deepEqual({ x: s.player.x, y: s.player.y }, map.WIND_SPAWN);
  assert.equal(m.intent, undefined);
});
test("bestiaire, statistiques par niveau, ressources chromatiques et noyau Air", () => {
  const html = renderBestiary("wind-slime", 5);
  assert.ok(html.includes("Hauts des Alizés"));
  assert.ok(html.includes("deux atterrissages"));
  assert.ok(html.includes("Cœur d’air"));
  assert.equal(/NaN|undefined/.test(html), false);
  assert.notEqual(
    bestiaryValues("wind-slime", 1).maxHp,
    bestiaryValues("wind-slime", 10).maxHp,
  );
  for (const item of monsterLoot("wind-slime"))
    assert.match(renderItemIcon(item), /<svg/);
  const s = setup();
  rewardMonster(s, s.monsters[0], () => 0);
  assert.ok(s.bag.some((i) => i.name === "Cœur d’air"));
  assert.ok(s.bag.some((i) => i.kind === "core" && i.element === "air"));
});

test("arrivée abritée : lire le guide sans subir une aspiration ni déclencher les compagnons", () => {
  const s = setup();
  s.windGuideOpen = true;
  for (let i = 0; i < 200; i++) {
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
    assert.ok(s.monsters.every((m) => !m.intent));
  }
  assert.ok(s.team.every((m) => m.hp === m.maxHp));
  assert.deepEqual({ x: s.player.x, y: s.player.y }, map.WIND_SPAWN);
});
