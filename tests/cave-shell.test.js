import test from "node:test";
import assert from "node:assert/strict";
import { createSandbox, spellContext } from "../src/dev/sandbox.js";
import { createMonster } from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import { hasRockShell, AMBER_SLIME } from "../src/data/rock-shell.js";
import { travelToZone } from "../src/game/zone-travel.js";
import { stepDepthsSlimes, onDepthsLanding } from "../src/game/slime-depths.js";
import {
  startMonsterAttack,
  stepMonsterAbility,
} from "../src/combat/monster-attacks.js";
import { breakRockShell } from "../src/game/mountain-slimes.js";
import {
  canWalkDepths,
  isDepthsRockImpact,
} from "../src/world/slime-depths-map.js";
import { renderBestiary } from "../src/ui/bestiary.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-depths");
  return s;
};
function pair(s, broken = false) {
  const a = createMonster("depths-water-slime", 350, 245, 5),
    b = createMonster("depths-earth-slime", 374, 245, 5);
  b.shellBroken = broken;
  s.monsters = [a, b];
  stepDepthsSlimes(s);
  s.time += 1.01;
  stepDepthsSlimes(s);
  return a;
}
test("formes de la caverne : Terre protégée, Eau pure sans carapace et fusion mixte protégée", () => {
  const s = setup(),
    a = pair(s);
  assert.equal(hasRockShell(createMonster("depths-water-slime", 0, 0)), false);
  assert.equal(hasRockShell(createMonster("depths-earth-slime", 0, 0)), true);
  assert.equal(a.dualElement, true);
  assert.equal(hasRockShell(a), true);
  assert.equal(a.shellBroken, false);
  a.hp = a.maxHp = 1000;
  spellContext.hitMonster(s, a, 100, s.team[0]);
  assert.equal(a.hp, 940);
  spellContext.hitMonster(s, a, 60, s.team[0], { bonus: true });
  assert.equal(a.hp, 880);
});
test("fusion : ajouter de l’Eau ne répare pas une carapace cassée ; une composante Terre intacte apporte sa protection", () => {
  const s = setup(),
    a = pair(s, true);
  assert.equal(a.shellBroken, true);
  const b = createMonster("depths-earth-slime", a.x + 15, a.y, 5);
  s.monsters = [a, b];
  a.growth = 1;
  a.fusionReadyAt = 0;
  s.time = 10;
  stepDepthsSlimes(s);
  s.time = 11.1;
  stepDepthsSlimes(s);
  assert.equal(a.shellBroken, false);
  assert.equal(a.growth, 2);
});
test("mixte : alternance entre bond Eau et roulade Terre, avec spécification figée pendant le vol", () => {
  const s = setup(),
    m = pair(s);
  assert.equal(monsterAttack(m).kind, "leap");
  m.attackSerial = 1;
  assert.equal(monsterAttack(m).kind, "charge");
  assert.equal(monsterAttack(m).element, "earth");
  m.attackSerial = 2;
  assert.equal(monsterAttack(m).kind, "leap");
  s.monsters = [m];
  m.cooldown = 0;
  m.fusionReadyAt = 0;
  s.deployed = false;
  Object.assign(s.team[0], { x: 330, y: 245 });
  const ctx = { canStand: canWalkDepths, damage: () => {} };
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.equal(m.intent.kind, "leap");
  for (let i = 0; i < 65 && m.intent; i++) stepMonsterAbility(s, m, 0.025, ctx);
  assert.ok(Number.isFinite(m.x) && Number.isFinite(m.y));
  assert.equal(m.intent, undefined);
});
test("mixte : une roulade contre une stalagmite brise la carapace et expose le cœur 3 s", () => {
  const s = setup(),
    m = createMonster("depths-water-slime", 130, 238, 5);
  m.dualElement = true;
  m.attackSerial = 1;
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.team[0], { x: 160, y: 238 });
  const hits = [],
    ctx = { canStand: canWalkDepths, damage: (p) => hits.push(p.id) };
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.equal(m.intent.kind, "charge");
  assert.ok(m.intent.wallCollision);
  Object.assign(s.team[0], { x: 160, y: 270 });
  for (let i = 0; i < 80 && m.intent; i++) {
    s.time += 0.025;
    stepMonsterAbility(s, m, 0.025, ctx);
  }
  assert.equal(m.shellBroken, true);
  assert.ok(m.vulnerableUntil > s.time);
  assert.equal(hits.length, 0);
  m.hp = m.maxHp = 1000;
  spellContext.hitMonster(s, m, 100, s.team[0]);
  assert.equal(m.hp, 850);
  spellContext.hitMonster(s, m, 150, s.team[0], { bonus: true });
  assert.equal(m.hp, 700);
});
test("caverne : les parois sont rocheuses, les rives des mares ne brisent pas la protection", () => {
  assert.ok(isDepthsRockImpact(20, 200));
  assert.ok(isDepthsRockImpact(192, 238));
  assert.equal(isDepthsRockImpact(510, 220), false);
  const s = setup(),
    m = createMonster("depths-earth-slime", 400, 220, 5);
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.team[0], { x: 440, y: 220 });
  const ctx = { canStand: canWalkDepths, damage: () => {} };
  assert.ok(startMonsterAttack(s, m, ctx));
  assert.equal(m.intent.wallCollision, false);
  Object.assign(s.team[0], { x: 440, y: 260 });
  for (let i = 0; i < 150 && m.intent; i++)
    stepMonsterAbility(s, m, 0.025, ctx);
  assert.equal(m.shellBroken, false);
  assert.ok(canWalkDepths(m.x, m.y));
});
test("scission : parent et descendant mixtes conservent la rupture de leur carapace", () => {
  const s = setup(),
    m = pair(s);
  s.monsters = [m];
  m.growth = 3;
  breakRockShell(s, m);
  s.time += 4;
  onDepthsLanding(s, m, { x: m.x, y: m.y }, 0);
  const child = s.monsters.at(-1);
  assert.equal(m.growth, 2);
  assert.equal(child.growth, 1);
  assert.ok(child.dualElement);
  assert.equal(m.shellBroken, true);
  assert.equal(child.shellBroken, true);
  assert.ok(hasRockShell(child));
});
test("bestiaire : teinte ambrée partagée, carapace et nouvelle roulade Terre expliquées", () => {
  const markup = renderBestiary("depths-earth-slime", 5);
  assert.ok(markup.includes(AMBER_SLIME.base));
  assert.ok(markup.includes(AMBER_SLIME.light));
  assert.ok(markup.includes("carapace"));
  assert.ok(markup.includes("Roulade de limon"));
  assert.equal(/undefined|NaN/.test(markup), false);
});
