import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  rewardMonster,
} from "../src/dev/sandbox.js";
import { createMonster } from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import {
  travelToZone,
  useZoneGate,
  nearZoneGate,
} from "../src/game/zone-travel.js";
import { movePartyToZone, canWalkZone } from "../src/world/zones.js";
import {
  MARSH_DEPTHS_GATE,
  SEA_SINKHOLE,
  canWalkMarsh,
} from "../src/world/slime-marsh-map.js";
import * as map from "../src/world/slime-depths-map.js";
import {
  stepDepthsSlimes,
  onDepthsLanding,
  DEPTHS_RULES,
} from "../src/game/slime-depths.js";
import { findPath } from "../src/ai/companions.js";
import { nearSawmill } from "../src/game/woodcutting.js";
import { nearForge } from "../src/game/forge.js";
import { nearPetShop } from "../src/game/pet-quests.js";
import { nearFountain } from "../src/data/progression.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-depths");
  return s;
};
const mass = (s) =>
  s.monsters.filter((m) => m.hp > 0 && !m.boss).reduce((n, m) => n + m.growth, 0);
function pair(s, a = 1, b = 1) {
  s.monsters = [
    createMonster("depths-water-slime", 350, 245, 5),
    createMonster("depths-earth-slime", 374, 245, 5),
  ];
  s.monsters[0].growth = a;
  s.monsters[1].growth = b;
  return s.monsters;
}

test("profondeurs : collision cohérente, bassins infranchissables et tous les groupes accessibles", () => {
  assert.deepEqual(map.validateMap(), []);
  assert.ok(canWalkMarsh(MARSH_DEPTHS_GATE.x, MARSH_DEPTHS_GATE.y));
  assert.equal(canWalkMarsh(SEA_SINKHOLE.x, SEA_SINKHOLE.y), false);
  const walk = (x, y) => canWalkZone(x, y, "slime-depths");
  for (const p of [map.DEPTHS_ENTRY, ...map.DEPTHS_SLIMES]) {
    assert.ok(walk(p.x, p.y));
    assert.ok(findPath(map.DEPTHS_SPAWN, p, walk).length);
  }
  for (const [x, y] of [
    [160, 145],
    [320, 157],
    [548, 220],
    [270, 310],
    [5, 5],
  ])
    assert.equal(walk(x, y), false);
});
test("cascade : F lance un bond puis la chute transporte la troupe et préserve sa progression", () => {
  const s = createSandbox();
  travelToZone(s, "slime-marsh");
  movePartyToZone(s, "slime-marsh", MARSH_DEPTHS_GATE);
  s.gold = 123;
  s.team[0].hp = 75;
  const bag = s.bag;
  assert.equal(nearZoneGate(s).destination, "slime-depths");
  assert.equal(useZoneGate(s), true);
  assert.ok(s.zoneDive);
  assert.equal(useZoneGate(s), false);
  stepSandbox(s, { x: -1, y: 0 }, 0.55);
  assert.equal(s.zone, "slime-marsh");
  assert.ok(s.player.y > MARSH_DEPTHS_GATE.y);
  stepSandbox(s, { x: 0, y: 0 }, 0.6);
  assert.equal(s.zone, "slime-depths");
  assert.equal(s.zoneDive, undefined);
  assert.equal(s.player.x, map.DEPTHS_SPAWN.x);
  assert.equal(s.bag, bag);
  assert.equal(s.gold, 123);
  assert.equal(s.team[0].hp, 75);
  assert.ok(s.team.every((m) => canWalkZone(m.x, m.y, s.zone)));
});
test("remontée : retour à la cascade, blessures persistantes, fusions et attaques interrompues au départ", () => {
  const s = setup(),
    [a, b] = pair(s);
  a.hp = 70;
  stepDepthsSlimes(s);
  assert.equal(a.fusionWith, 1);
  movePartyToZone(s, "slime-depths", map.DEPTHS_ENTRY);
  assert.equal(a.fusionWith, undefined);
  a.intent = {
    phase: "flight",
    from: { x: 350, y: 245 },
    to: { x: 160, y: 145 },
  };
  a.x = 160;
  a.y = 145;
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-marsh");
  assert.ok(nearZoneGate(s));
  assert.equal(a.intent, undefined);
  assert.equal(a.x, 350);
  travelToZone(s, "slime-depths");
  assert.equal(s.monsters[0], a);
  assert.equal(a.hp, 70);
  Object.assign(s.player, { x: 212, y: 334 });
  assert.equal(nearForge(s), false);
  assert.equal(nearSawmill(s), false);
  assert.equal(nearPetShop(s), false);
  assert.equal(nearFountain(s), false);
});
test("agressivité : Eau et Terre, prévisualisations plus rapides et délai plus court que le marais", () => {
  const s = setup(),
    marsh = monsterAttack(createMonster("marsh-slime", 0, 0));
  for (const m of s.monsters.filter(m=>!m.boss)) {
    const spec = monsterAttack(m);
    assert.ok(spec.windup < marsh.windup);
    assert.ok(spec.recovery < marsh.recovery);
    assert.ok(m.detection > 88);
    assert.ok(m.speed > 32);
    assert.equal(spec.element, m.element);
  }
  assert.deepEqual(
    new Set(s.monsters.map((m) => m.element)),
    new Set(["water", "earth"]),
  );
});
test("scission des profondeurs : masse conservée, petit au même niveau, pas de scission sur un coup réussi", () => {
  const s = setup(),
    m = s.monsters[0];
  s.monsters = [m];
  m.growth = 3;
  m.maxHp = Math.round(m.baseMaxHp * 1.6);
  m.hp = m.maxHp / 2;
  m.dualElement = true;
  onDepthsLanding(s, m, m, 1);
  assert.equal(s.monsters.length, 1);
  onDepthsLanding(s, m, { x: m.x, y: m.y }, 0);
  assert.equal(mass(s), 3);
  assert.equal(m.growth, 2);
  const child = s.monsters[1];
  assert.equal(child.growth, 1);
  assert.equal(child.level, 5);
  assert.equal(child.dualElement, true);
  assert.ok(map.canWalkDepths(child.x, child.y));
  assert.ok(Math.abs(m.hp / m.maxHp - 0.5) < 0.01);
  assert.equal(m.fusionReadyAt, s.time + 5);
  onDepthsLanding(s, m, m, 0);
  assert.equal(mass(s), 3);
  assert.equal(s.monsters.length, 3);
  onDepthsLanding(s, m, m, 0);
  assert.equal(s.monsters.length, 3);
});
test("fusion : avertissement une seconde, taille limitée à trois, masse et blessure conservées, attaques mixtes", () => {
  const s = setup(),
    [a, b] = pair(s, 1, 2),
    gold = s.gold,
    xp = s.team[0].xp;
  a.hp = a.maxHp / 2;
  b.hp = b.maxHp / 2;
  stepDepthsSlimes(s);
  assert.equal(a.fusionWith, 1);
  assert.equal(b.hp, b.maxHp / 2);
  s.time = 0.9;
  stepDepthsSlimes(s);
  assert.equal(a.growth, 1);
  s.time = 1.01;
  stepDepthsSlimes(s);
  assert.equal(a.growth, 3);
  assert.equal(b.hp, 0);
  assert.ok(b.merged);
  assert.equal(mass(s), 3);
  assert.ok(a.dualElement);
  assert.ok(Math.abs(a.hp / a.maxHp - 0.5) < 0.01);
  assert.equal(s.gold, gold);
  assert.equal(s.team[0].xp, xp);
  assert.equal(monsterAttack(a).element, "water");
  a.attackSerial = 1;
  assert.equal(monsterAttack(a).element, "earth");
  assert.equal(a.fusionReadyAt, s.time + 5);
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(b.hp, 0);
});
test("fusion : séparation, mort, enracinement et saut en cours empêchent la fusion ; pas de taille 4", () => {
  for (const change of [
    (b) => (b.x += 50),
    (b) => (b.hp = 0),
    (b) => (b.spellState = { root: 1 }),
  ]) {
    const s = setup(),
      [a, b] = pair(s);
    stepDepthsSlimes(s);
    change(b);
    s.time = 2;
    stepDepthsSlimes(s);
    assert.equal(a.fusionWith, undefined);
    assert.equal(a.growth, 1);
  }
  const s = setup(),
    [a, b] = pair(s, 2, 2);
  stepDepthsSlimes(s);
  assert.equal(a.fusionWith, undefined);
  a.growth = b.growth = 1;
  a.intent = { phase: "windup" };
  stepDepthsSlimes(s);
  assert.equal(a.fusionWith, undefined);
});
test("combat réel : la fusion suspend les bonds puis les ennemis reprennent leurs attaques élémentaires", () => {
  const s = setup(),
    [a, b] = pair(s);
  s.deployed = false;
  // Pre-existing fusion must freeze both partners despite a target within range.
  stepDepthsSlimes(s);
  Object.assign(s.player, { x: 330, y: 245 });
  Object.assign(s.team[0], s.player, { hp: 2000, maxHp: 2000 });
  for (let i = 0; i < 15; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(a.intent, undefined);
  assert.equal(b.intent, undefined);
  for (let i = 0; i < 80; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(s.team[0].hp < 2000);
  assert.ok(["water", "earth"].includes(s.team[0].lastDamageElement));
});
test("expédition : ennemis vaincus sans respawn individuel, renouvellement après nettoyage et nouvelle entrée", () => {
  const s = setup(),
    old = s.monsters;
  s.monsters.forEach((m) => {
    m.hp = 0;
    m.respawn = 0;
  });
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(s.monsters.every((m) => m.hp === 0));
  travelToZone(s, "slime-marsh");
  travelToZone(s, "slime-depths");
  assert.notEqual(s.monsters, old);
  assert.equal(s.monsters.length, 8);
  assert.ok(s.monsters.every((m) => m.hp > 0));
});
test("défaite : retour soigné sur la berge de la grotte, sans perdre or ni butin", () => {
  const s = setup(),
    m = s.monsters[0];
  s.monsters = [m];
  s.gold = 77;
  s.deployed = false;
  s.team.forEach((p) => (p.hp = 0));
  Object.assign(s.player, { x: m.x + 30, y: m.y });
  Object.assign(s.team[0], s.player, { hp: 1 });
  m.damage = 1000;
  for (let i = 0; i < 100 && s.team[0].hp < 2; i++)
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-depths");
  assert.equal(s.player.x, map.DEPTHS_SPAWN.x);
  assert.equal(s.player.y, map.DEPTHS_SPAWN.y);
  assert.equal(s.gold, 77);
  assert.ok(s.team.every((p) => p.hp === p.maxHp));
});
test("butin : noyaux du bon élément et ressources propres aux profondeurs", () => {
  const s = setup();
  const random = () => 0;
  const water = s.monsters.find((m) => m.element === "water"),
    earth = s.monsters.find((m) => m.element === "earth");
  rewardMonster(s, water, random);
  rewardMonster(s, earth, random);
  assert.ok(s.bag.some((i) => i.name === "Perle des profondeurs"));
  assert.ok(s.bag.some((i) => i.name === "Géode suintante"));
  assert.ok(s.bag.some((i) => i.kind === "core" && i.element === "water"));
  assert.ok(s.bag.some((i) => i.kind === "core" && i.element === "earth"));
});

test("horde en simulation : scissions et fusions naturelles, taille et masse bornées sans prolifération", () => {
  const s = setup();
  s.deployed = false;
  Object.assign(s.player, { x: 365, y: 240 });
  Object.assign(s.team[0], s.player, { hp: 100000, maxHp: 100000 });
  const initialMass = mass(s),
    initialCount = s.monsters.length;
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];
  for (let i = 0; i < 1600; i++) {
    stepSandbox(s, directions[Math.floor(i / 40) % 4], 0.05);
    assert.equal(mass(s), initialMass);
    for (const m of s.monsters.filter((m) => m.hp > 0 && !m.boss)) {
      assert.ok(m.growth >= 1 && m.growth <= 3);
      if (m.intent?.phase !== "flight") assert.ok(map.canWalkDepths(m.x, m.y));
    }
  }
  assert.ok(s.monsters.length > initialCount);
  assert.ok(s.monsters.some((m) => m.merged));
});
test("sol de grotte : textures périodiques sans joint pour les matériaux humides", () => {
  for (const material of ["grass", "water", "stone"])
    for (let x = -5; x < 65; x += 7)
      for (let y = -5; y < 65; y += 7) {
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
