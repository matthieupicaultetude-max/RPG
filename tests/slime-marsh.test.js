import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  spellContext,
  stepSandbox,
} from "../src/dev/sandbox.js";
import {
  travelToZone,
  nearZoneGate,
  useZoneGate,
  GARDEN_MARSH_GATE,
} from "../src/game/zone-travel.js";
import {
  onSlimeLanding,
  stepSlimeMarsh,
  resetMarshSlime,
  slimeVulnerable,
  MARSH_RULES,
} from "../src/game/slime-marsh.js";
import {
  monsterAttack,
  monsterAttackDamage,
} from "../src/data/monster-attacks.js";
import { startMonsterAttack } from "../src/combat/monster-attacks.js";
import { canWalkZone } from "../src/world/zones.js";
import * as map from "../src/world/slime-marsh-map.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-marsh");
  return s;
};
test("carte : rives, mares infranchissables, fleurs accessibles et chemins connectés", async () => {
  const { findPath } = await import("../src/ai/companions.js");
  assert.deepEqual(map.validateMap(), []);
  const walk = (x, y) => canWalkZone(x, y, "slime-marsh");
  for (const [x, y] of [
    [235, 150],
    [455, 280],
    [135, 285],
  ])
    assert.equal(walk(x, y), false);
  for (const point of [...map.SPONGE_FLOWERS, ...map.SLIME_SPAWNS]) {
    assert.equal(walk(point.x, point.y), true);
    assert.ok(findPath(map.MARSH_ENTRY, point, walk).length);
  }
});
test("passages : voyage aux portes, progression et monde du village conservés, services isolés par zone", async () => {
  const { nearForge } = await import("../src/game/forge.js"),
    { nearSawmill } = await import("../src/game/woodcutting.js");
  const s = createSandbox(),
    world = s.monsters;
  s.gold = 42;
  s.team[0].hp = 71;
  s.bag.push({ id: 999, name: "Souvenir", quantity: 1 });
  assert.equal(useZoneGate(s), false);
  Object.assign(s.player, GARDEN_MARSH_GATE);
  assert.equal(nearZoneGate(s).destination, "slime-marsh");
  assert.equal(useZoneGate(s), true);
  assert.equal(s.monsters.length, 5);
  assert.ok(s.monsters.every((m) => m.species === "marsh-slime"));
  assert.equal(s.gold, 42);
  assert.equal(s.team[0].hp, 71);
  assert.equal(nearForge(s), false);
  assert.equal(nearSawmill(s), false);
  assert.equal(s.marshGuideOpen, true);
  const creatures = s.monsters;
  creatures[0].hp = 70;
  Object.assign(s.player, map.MARSH_ENTRY);
  assert.equal(useZoneGate(s), true);
  assert.equal(s.monsters, world);
  assert.equal(travelToZone(s, "slime-marsh"), true);
  assert.equal(s.monsters, creatures);
  assert.equal(s.monsters[0].hp, 70);
  assert.equal(s.marshGuideOpen, false);
  assert.equal(s.bag[0].name, "Souvenir");
  assert.doesNotThrow(() => JSON.stringify(s));
});
test("gelée : flaques temporaires, absorption, trois tailles au maximum et pas de restauration gratuite du pourcentage de PV", () => {
  const s = setup(),
    m = s.monsters[0],
    point = { x: m.x, y: m.y };
  m.hp = m.maxHp / 2;
  onSlimeLanding(s, m, point, 1);
  assert.equal(m.growth, 1);
  assert.equal(s.slimeMarsh.puddles.length, 1);
  onSlimeLanding(s, m, point, 1);
  assert.equal(m.growth, 2);
  assert.equal(m.maxHp, 161);
  assert.ok(Math.abs(m.hp / m.maxHp - 0.5) < 0.01);
  assert.equal(s.slimeMarsh.puddles.length, 1);
  onSlimeLanding(s, m, point, 1);
  assert.equal(m.growth, 3);
  assert.equal(m.maxHp, 198);
  const hp = m.hp;
  onSlimeLanding(s, m, point, 1);
  assert.equal(m.growth, 3);
  assert.equal(m.hp, hp);
  s.time += MARSH_RULES.puddleLife + 1;
  stepSlimeMarsh(s);
  assert.equal(s.slimeMarsh.puddles.length, 0);
});
test("taille : dégâts et cercle renforcés, préparation plus lente ; valeurs verrouillées pour le saut annoncé", () => {
  const s = setup(),
    m = s.monsters[0];
  m.growth = 3;
  const spec = monsterAttack(m);
  assert.equal(spec.radius, 36);
  assert.ok(Math.abs(spec.windup - 1.8) < 1e-8);
  assert.equal(monsterAttackDamage(m), 17);
  s.deployed = false;
  Object.assign(s.player, { x: m.x - 40, y: m.y });
  Object.assign(s.team[0], s.player);
  assert.equal(
    startMonsterAttack(s, m, { canStand: (x, y) => canWalkZone(x, y, s.zone) }),
    true,
  );
  assert.equal(m.intent.radius, 36);
  assert.equal(m.intent.damage, 17);
  m.growth = 1;
  assert.equal(m.intent.radius, 36);
});
test("saut raté : fenêtre vulnérable, dégâts +50 %, sans doubler le bonus des cibles dorées ; respawn réinitialisé", () => {
  const s = setup(),
    m = s.monsters[1];
  onSlimeLanding(s, m, { x: m.x, y: m.y }, 0);
  assert.equal(slimeVulnerable(s, m), true);
  let before = m.hp;
  spellContext.hitMonster(s, m, 10, s.team[0]);
  assert.equal(m.hp, before - 15);
  before = m.hp;
  spellContext.hitMonster(s, m, 15, s.team[0], { bonus: true });
  assert.equal(m.hp, before - 15);
  s.time += 2.6;
  assert.equal(slimeVulnerable(s, m), false);
  before = m.hp;
  spellContext.hitMonster(s, m, 10, s.team[0]);
  assert.equal(m.hp, before - 10);
  m.growth = 3;
  m.hp = 0;
  resetMarshSlime(m);
  assert.equal(m.growth, m.spawnGrowth);
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.vulnerableUntil, 0);
});
test("fleur éponge : nettoyage avant absorption, halo anti-gelée puis repos et réactivation", () => {
  const s = setup(),
    m = s.monsters[0],
    f = s.slimeMarsh.flowers[0];
  const puddle = (x) => ({
    id: s.slimeMarsh.nextPuddle++,
    x,
    y: f.y,
    radius: 18,
    expiresAt: 100,
  });
  s.slimeMarsh.puddles = [puddle(f.x), puddle(f.x + 30), puddle(f.x + 130)];
  onSlimeLanding(s, m, f, 1);
  assert.equal(m.growth, 1);
  assert.equal(s.slimeMarsh.puddles.length, 1);
  assert.equal(f.safeUntil, 6);
  assert.equal(f.readyAt, 10);
  s.time = 1;
  onSlimeLanding(s, m, { x: f.x + 40, y: f.y }, 1);
  assert.equal(s.slimeMarsh.puddles.length, 1);
  assert.equal(f.safeUntil, 6);
  s.time = 7;
  onSlimeLanding(s, m, f, 1);
  assert.equal(s.slimeMarsh.puddles.length, 2);
  assert.equal(f.readyAt, 10);
  s.time = 11;
  onSlimeLanding(s, m, f, 1);
  assert.equal(s.slimeMarsh.puddles.length, 1);
  assert.equal(f.safeUntil, 17);
  assert.equal(f.readyAt, 21);
});
test("hors marais : les slimes ordinaires gardent leurs règles et aucune flaque spéciale ne se crée", () => {
  const s = createSandbox(),
    m = s.monsters[0];
  onSlimeLanding(s, m, m, 0);
  assert.equal(s.slimeMarsh, undefined);
  assert.equal(monsterAttack(m).radius, 24);
  assert.equal(slimeVulnerable(s, m), false);
});

test("combat réel dans le marais : plusieurs bonds sur la gelée déclenchent la croissance jusqu’à la taille 3", () => {
  const s = setup(),
    m = s.monsters[0];
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.player, { x: 310, y: 240 });
  Object.assign(s.team[0], s.player, { hp: 1000, maxHp: 1000 });
  for (let i = 0; i < 360 && m.growth < 3; i++)
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(m.growth, 3);
  assert.ok(s.slimeMarsh.puddles.length > 0);
  assert.equal(s.team[0].lastDamageElement, "water");
  assert.ok(s.team[0].hp < 1000);
});

test("défaite dans le marais : réapparition à l’entrée, personnages soignés et progression conservée", () => {
  const s = setup(),
    m = s.monsters[0];
  s.monsters = [m];
  s.deployed = false;
  s.gold = 55;
  s.team.forEach((p) => (p.hp = 0));
  Object.assign(s.player, { x: 310, y: 240 });
  Object.assign(s.team[0], s.player, { hp: 1 });
  m.damage = 1000;
  for (let i = 0; i < 70 && s.team[0].hp < 2; i++)
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-marsh");
  assert.equal(s.player.x, map.MARSH_ENTRY.x + 30);
  assert.equal(s.player.y, map.MARSH_ENTRY.y);
  assert.ok(s.team.every((p) => p.hp === p.maxHp));
  assert.equal(s.gold, 55);
  assert.equal(m.intent, undefined);
});
test("interruption d’un bond par changement de zone : le slime retrouve un point terrestre valide", () => {
  const s = setup(),
    m = s.monsters[0];
  m.intent = {
    phase: "flight",
    from: { x: 270, y: 240 },
    to: { x: 310, y: 240 },
  };
  m.x = 235;
  m.y = 150;
  m.lift = 20;
  travelToZone(s, "garden");
  travelToZone(s, "slime-marsh");
  assert.equal(m.intent, undefined);
  assert.equal(m.lift, 0);
  assert.equal(map.canWalkMarsh(m.x, m.y), true);
});
