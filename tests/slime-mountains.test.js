import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
} from "../src/dev/sandbox.js";
import { createMonster } from "../src/data/monsters.js";
import {
  startMonsterAttack,
  stepMonsterAbility,
} from "../src/combat/monster-attacks.js";
import {
  travelToZone,
  nearZoneGate,
  useZoneGate,
  GARDEN_MOUNTAIN_GATE,
} from "../src/game/zone-travel.js";
import { movePartyToZone, canWalkZone } from "../src/world/zones.js";
import { findPath } from "../src/ai/companions.js";
import {
  breakMountainShell,
  resetMountainSlime,
} from "../src/game/mountain-slimes.js";
import * as map from "../src/world/slime-mountains-map.js";
import { nearForge } from "../src/game/forge.js";
import { nearSawmill } from "../src/game/woodcutting.js";
import { renderBestiary, bestiaryValues } from "../src/ui/bestiary.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-mountains");
  return s;
};
function encounter(x = 120, y = 205, target = { x: 150, y: 205 }) {
  const s = setup(),
    m = createMonster("mountain-slime", x, y, 5);
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.player, target);
  Object.assign(s.team[0], target);
  const hits = [],
    ctx = {
      canStand: map.canWalkMountains,
      damage: (p, n, monster, element) => hits.push({ id: p.id, n, element }),
    };
  const step = (seconds) => {
    for (let i = 0; i < Math.ceil(seconds / 0.025); i++) {
      s.time += 0.025;
      stepMonsterAbility(s, m, 0.025, ctx);
    }
  };
  return { s, m, hits, ctx, step };
}

test("Cimes de Schiste : trois plateaux reliés par des ponts, tous les groupes accessibles et précipices solides", () => {
  assert.deepEqual(map.validateMap(), []);
  const walk = (x, y) => canWalkZone(x, y, "slime-mountains");
  for (const p of [
    map.MOUNTAIN_ENTRY,
    ...map.MOUNTAIN_SLIMES,
    ...map.BRIDGES.map((b) => ({
      x: (b.left + b.right) / 2,
      y: (b.top + b.bottom) / 2,
    })),
  ]) {
    assert.ok(walk(p.x, p.y));
    assert.ok(findPath(map.MOUNTAIN_SPAWN, p, walk).length);
  }
  for (const [x, y] of [
    [250, 150],
    [450, 190],
    [10, 10],
    [190, 205],
  ])
    assert.equal(walk(x, y), false);
  assert.equal(map.isMountainImpact(190, 205), true);
  assert.equal(map.isMountainImpact(250, 150), false);
});
test("textures rocheuses et sentiers : continuité périodique, y compris les coordonnées négatives", () => {
  for (const material of ["stone", "dirt"])
    for (let x = -5; x < 65; x += 9)
      for (let y = -5; y < 65; y += 11) {
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
test("voyage : porte nord-est du village et retour, progression et état des carapaces conservés", () => {
  const s = createSandbox(),
    garden = s.monsters;
  movePartyToZone(s, "garden", GARDEN_MOUNTAIN_GATE);
  s.gold = 77;
  assert.equal(nearZoneGate(s).destination, "slime-mountains");
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-mountains");
  assert.equal(s.monsters.length, 6);
  assert.ok(s.mountainGuideOpen);
  const m = s.monsters[0];
  m.shellBroken = true;
  m.hp = 60;
  const world = s.monsters;
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters, garden);
  assert.equal(s.zone, "garden");
  assert.ok(useZoneGate(s));
  assert.equal(s.monsters, world);
  assert.equal(m.shellBroken, true);
  assert.equal(m.hp, 60);
  assert.equal(s.gold, 77);
  assert.equal(s.mountainGuideOpen, false);
  assert.ok(s.team.every((p) => map.canWalkMountains(p.x, p.y)));
  Object.assign(s.player, { x: 212, y: 334 });
  assert.equal(nearForge(s), false);
  assert.equal(nearSawmill(s), false);
  assert.doesNotThrow(() => JSON.stringify(s));
});
test("charge : annonce verrouillée, aucun dégât pendant la préparation, collision contre le rocher puis cœur exposé", () => {
  const { s, m, hits, ctx, step } = encounter();
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.ok(m.intent.wallCollision);
  assert.ok(m.intent.to.x < 176);
  const end = { ...m.intent.to };
  step(1);
  assert.equal(hits.length, 0);
  assert.equal(m.shellBroken, false);
  Object.assign(s.team[0], { x: 150, y: 245 });
  step(1);
  assert.equal(m.shellBroken, true);
  assert.equal(hits.length, 0);
  assert.deepEqual({ x: m.x, y: m.y }, end);
  assert.ok(m.vulnerableUntil > s.time);
  assert.ok(s.soundEvents.some((e) => e.kind === "rock-break"));
  const n = s.effects.filter((e) => e.particle).length;
  assert.equal(breakMountainShell(s, m), false);
  assert.equal(s.effects.filter((e) => e.particle).length, n);
});
test("charge : un personnage dans le couloir reçoit une seule touche Terre puis la carapace se brise au rocher", () => {
  const { m, s, hits, ctx, step } = encounter();
  startMonsterAttack(s, m, ctx);
  step(2);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].element, "earth");
  assert.equal(m.shellBroken, true);
});
test("arrêt au précipice : le slime reste sur le plateau et conserve sa carapace", () => {
  const { s, m, hits, ctx, step } = encounter(300, 200, { x: 330, y: 200 });
  startMonsterAttack(s, m, ctx);
  assert.equal(m.intent.wallCollision, false);
  Object.assign(s.team[0], { x: 330, y: 240 });
  step(3);
  assert.equal(m.shellBroken, false);
  assert.ok(map.canWalkMountains(m.x, m.y));
  assert.equal(hits.length, 0);
});
test("carapace : réduction 40 %, bonus copié exact, exposition +50 % puis protection perdue jusqu’au respawn", () => {
  const { s, m } = encounter();
  m.hp = m.maxHp = 1000;
  const owner = s.team[0];
  spellContext.hitMonster(s, m, 100, owner);
  assert.equal(m.hp, 940);
  spellContext.hitMonster(s, m, 60, owner, { bonus: true });
  assert.equal(m.hp, 880);
  breakMountainShell(s, m);
  spellContext.hitMonster(s, m, 100, owner);
  assert.equal(m.hp, 730);
  spellContext.hitMonster(s, m, 150, owner, { bonus: true });
  assert.equal(m.hp, 580);
  s.time = 4;
  spellContext.hitMonster(s, m, 100, owner);
  assert.equal(m.hp, 480);
  assert.equal(m.shellBroken, true);
  resetMountainSlime(m);
  assert.equal(m.shellBroken, false);
  assert.equal(m.vulnerableUntil, 0);
});
test("enracinement : une interruption avant la collision ne brise pas la carapace", () => {
  const { s, m, ctx, step } = encounter();
  startMonsterAttack(s, m, ctx);
  m.spellState = { root: 1 };
  step(0.05);
  assert.equal(m.intent, undefined);
  assert.equal(m.shellBroken, false);
});
test("respawn : une nouvelle vie restaure la carapace et les PV au point d’origine", () => {
  const { s, m } = encounter();
  m.hp = 0;
  m.respawn = 0.01;
  m.shellBroken = true;
  m.vulnerableUntil = 100;
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(m.hp, m.maxHp);
  assert.equal(m.shellBroken, false);
  assert.equal(m.vulnerableUntil, 0);
  assert.equal(m.x, m.homeX);
  assert.equal(m.y, m.homeY);
});
test("défaite en montagne : retour au col, troupe soignée et or conservé", () => {
  const { s, m } = encounter();
  s.team.forEach((p) => (p.hp = 0));
  s.team[0].hp = 1;
  s.gold = 42;
  m.damage = 1000;
  for (let i = 0; i < 80 && s.team[0].hp === 1; i++)
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-mountains");
  assert.equal(s.player.x, map.MOUNTAIN_SPAWN.x);
  assert.equal(s.player.y, map.MOUNTAIN_SPAWN.y);
  assert.equal(s.gold, 42);
  assert.ok(s.team.every((p) => p.hp === p.maxHp));
});
test("bestiaire et butin : fiche Terre, carapace expliquée, ressources de schiste et noyau de la bonne tranche", () => {
  const s = setup(),
    m = s.monsters[0],
    markup = renderBestiary("mountain-slime", 5),
    stats = bestiaryValues("mountain-slime", 5);
  assert.ok(markup.includes("40 %"));
  assert.ok(markup.includes("3 secondes"));
  assert.equal(/undefined|NaN/.test(markup), false);
  assert.equal(stats.maxHp, "133");
  rewardMonster(s, m, () => 0);
  assert.ok(s.bag.some((i) => i.name === "Cœur de terre"));
  assert.ok(
    s.bag.some(
      (i) => i.kind === "core" && i.element === "earth" && i.band.min === 1,
    ),
  );
});

test("collision contre une paroi : la charge verticale brise aussi la carapace", () => {
  const { s, m, ctx, step } = encounter(350, 200, { x: 350, y: 150 });
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.ok(m.intent.wallCollision);
  Object.assign(s.team[0], { x: 395, y: 150 });
  step(2.1);
  assert.equal(m.shellBroken, true);
  assert.ok(m.y >= 113);
  assert.ok(map.canWalkMountains(m.x, m.y));
});
