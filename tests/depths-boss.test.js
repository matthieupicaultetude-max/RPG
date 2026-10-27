import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  rewardMonster,
} from "../src/dev/sandbox.js";
import { createMonster } from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import { travelToZone } from "../src/game/zone-travel.js";
import {
  canWalkDepths,
  DEPTHS_BOSS_HOME,
  DEPTHS_SPAWN,
} from "../src/world/slime-depths-map.js";
import {
  awakenDepthsBoss,
  nearDepthsBoss,
  stepDepthsBoss,
  onBossLanding,
  resetDepthsBoss,
  BOSS_RULES,
} from "../src/game/depths-boss.js";
import { onDepthsLanding, stepDepthsSlimes } from "../src/game/slime-depths.js";
import {
  bestiaryValues,
  renderBestiary,
  coreDropMarkup,
} from "../src/ui/bestiary.js";
const setup = () => {
  const s = createSandbox();
  travelToZone(s, "slime-depths");
  const b = s.monsters.find((m) => m.boss);
  s.monsters = [b];
  s.deployed = false;
  Object.assign(s.player, { x: b.x - 45, y: b.y });
  Object.assign(s.team[0], s.player, { hp: 10000, maxHp: 10000 });
  return { s, b };
};
const liveAspects = (s) =>
  s.monsters.filter((m) => m.bossOwner !== undefined && m.hp > 0);
const tick = (s, n = 1) => {
  for (let i = 0; i < n; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
};

test("Gorgelimon : sommeil, activation volontaire de proximité, aucun réveil par un allié", () => {
  const { s, b } = setup();
  assert.ok(nearDepthsBoss(s));
  tick(s, 40);
  assert.equal(b.bossPhase, "dormant");
  assert.equal(b.intent, undefined);
  spellContext.hitMonster(s, b, 10, s.team[1]);
  assert.equal(b.hp, b.maxHp);
  assert.equal(b.bossPhase, "dormant");
  assert.ok(awakenDepthsBoss(s));
  assert.equal(b.bossPhase, "combat");
  assert.equal(awakenDepthsBoss(s), false);
  resetDepthsBoss(s);
  Object.assign(s.player, DEPTHS_SPAWN);
  assert.equal(nearDepthsBoss(s), false);
  assert.equal(awakenDepthsBoss(s), false);
});
test("attaques réelles : bond Eau, charge Terre et éboulement se succèdent sans coordonnée invalide", () => {
  const { s, b } = setup();
  Object.assign(s.player, { x: b.x - 20, y: b.y });
  Object.assign(s.team[0], s.player);
  awakenDepthsBoss(s);
  b.cooldown = 0;
  const attacks = new Set(),
    elements = new Set();
  for (let i = 0; i < 260; i++) {
    tick(s);
    if (b.intent) attacks.add(b.intent.kind);
    if (s.team[0].lastDamageElement) elements.add(s.team[0].lastDamageElement);
    assert.ok(
      Number.isFinite(b.x) &&
        Number.isFinite(b.y) &&
        Number.isFinite(b.lift || 0),
    );
  }
  assert.ok(attacks.has("leap"));
  assert.ok(attacks.has("charge"));
  assert.ok(attacks.has("boss-quake"));
  assert.deepEqual(elements, new Set(["water", "earth"]));
});
test("éboulement : positions verrouillées, aucune blessure pendant l’annonce, une seule touche malgré les cercles superposés", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  b.cooldown = 0;
  b.attackSerial = 2;
  Object.assign(s.team[1], s.team[0], { id: 1, hp: 1000 });
  s.deployed = true;
  const hits = [];
  const ctx = {
    canStand: canWalkDepths,
    damage: (p, n, m, e) => hits.push({ id: p.id, n, e }),
  };
  stepDepthsBoss(s, b, 0.01, ctx);
  const zones = JSON.stringify(b.intent.zones);
  assert.equal(hits.length, 0);
  s.team[0].x += 100;
  stepDepthsBoss(s, b, 0.5, ctx);
  assert.equal(JSON.stringify(b.intent.zones), zones);
  assert.equal(hits.length, 0);
  stepDepthsBoss(s, b, 1.2, ctx);
  assert.equal(hits.filter((h) => h.id === 0).length, 0);
  assert.equal(hits.filter((h) => h.id === 1).length, 1);
  assert.ok(hits.every((h) => h.e === "earth"));
});
test("scission à 70 % : deux aspects, cœur protégé, dégâts ignorés et exposition de cinq secondes si tous sont vaincus", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  b.hp = Math.floor(b.maxHp * 0.69);
  tick(s);
  assert.equal(b.bossPhase, "split");
  assert.equal(b.bossStage, 1);
  assert.equal(liveAspects(s).length, 2);
  assert.deepEqual(
    new Set(liveAspects(s).map((m) => m.element)),
    new Set(["water", "earth"]),
  );
  assert.ok(liveAspects(s).every((m) => canWalkDepths(m.x, m.y)));
  const before = b.hp;
  spellContext.hitMonster(s, b, 100, s.team[0]);
  assert.equal(b.hp, before);
  for (const m of liveAspects(s)) m.hp = 0;
  tick(s);
  assert.equal(b.bossPhase, "combat");
  assert.equal(b.vulnerableUntil, s.time + 5);
  spellContext.hitMonster(s, b, 10, s.team[0]);
  assert.equal(b.hp, before - 15);
  spellContext.hitMonster(s, b, 15, s.team[0], { bonus: true });
  assert.equal(b.hp, before - 30);
});
test("réabsorption : soin selon la masse survivante, pas de récompense gratuite et scission limitée à deux seuils", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  b.hp = Math.floor(b.maxHp * 0.69);
  tick(s);
  const before = b.hp,
    gold = s.gold;
  s.time = b.splitUntil;
  stepDepthsBoss(s, b, 0.01, { canStand: canWalkDepths, damage: () => {} });
  assert.equal(b.hp, Math.min(b.maxHp, before + Math.round(b.maxHp * 0.16)));
  assert.equal(s.gold, gold);
  assert.equal(liveAspects(s).length, 0);
  b.hp = Math.floor(b.maxHp * 0.34);
  tick(s);
  assert.equal(b.bossStage, 2);
  assert.equal(b.bossPhase, "split");
  for (const m of liveAspects(s)) m.hp = 0;
  tick(s);
  s.time = b.vulnerableUntil + 0.01;
  tick(s);
  assert.equal(b.bossPhase, "combat");
  assert.equal(b.bossStage, 2);
  assert.ok(monsterAttack(b).recovery < 1.8);
});
test("aspects : scissions et fusions entre eux, sans fusion avec les monstres ordinaires", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  b.hp = b.maxHp * 0.69;
  tick(s);
  const aspect = liveAspects(s)[0];
  onDepthsLanding(s, aspect, aspect, 0);
  const child = s.monsters.at(-1);
  assert.equal(child.bossOwner, 0);
  assert.equal(child.baseMaxHp, aspect.baseMaxHp);
  assert.equal(child.maxHp, aspect.baseMaxHp);
  const outsider = createMonster("depths-earth-slime", child.x + 5, child.y, 5);
  s.monsters.push(outsider);
  aspect.hp = 0;
  for (const m of s.monsters)
    if (m !== b && m !== child && m !== outsider) m.hp = 0;
  s.time += 6;
  stepDepthsSlimes(s);
  assert.equal(child.fusionWith, undefined);
  assert.equal(outsider.fusionWith, undefined);
});
test("bond raté : cœur fissuré deux secondes, sans créer d’aspect hors des seuils de phase", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  onBossLanding(s, b, 0);
  assert.equal(b.vulnerableUntil, s.time + 2);
  assert.equal(s.monsters.length, 1);
  const before = b.hp;
  spellContext.hitMonster(s, b, 10, s.team[0]);
  assert.equal(b.hp, before - 15);
});
test("fuite et changement de zone : réinitialisation du boss et nettoyage des aspects sans loot", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  b.hp = b.maxHp * 0.69;
  tick(s);
  const aspects = liveAspects(s),
    gold = s.gold;
  travelToZone(s, "slime-marsh");
  assert.equal(b.bossPhase, "dormant");
  assert.equal(b.hp, b.maxHp);
  assert.ok(aspects.every((m) => m.hp === 0));
  assert.equal(s.gold, gold);
  travelToZone(s, "slime-depths");
  Object.assign(s.player, { x: b.x - 45, y: b.y });
  Object.assign(s.team[0], s.player);
  awakenDepthsBoss(s);
  Object.assign(s.player, DEPTHS_SPAWN);
  Object.assign(s.team[0], s.player);
  tick(s);
  assert.equal(b.bossPhase, "dormant");
  assert.equal(b.x, DEPTHS_BOSS_HOME.x);
});
test("mort du boss : deux noyaux garantis, récompense unique, suppression des invocations et absence de respawn individuel", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  spellContext.hitMonster(s, b, b.hp + 1, s.team[0]);
  assert.equal(b.hp, 0);
  assert.equal(b.bossPhase, "dead");
  const cores = s.bag.filter((i) => i.kind === "core");
  assert.equal(cores.find((i) => i.element === "water").quantity, 1);
  assert.equal(cores.find((i) => i.element === "earth").quantity, 1);
  const gold = s.gold,
    xp = s.team[0].xp;
  rewardMonster(s, b, () => 0);
  assert.equal(s.gold, gold);
  assert.equal(s.team[0].xp, xp);
  tick(s, 5);
  assert.equal(b.hp, 0);
});
test("bestiaire du boss : statistiques, illustration et récompenses cohérentes", () => {
  const values = bestiaryValues("gorgelimon", 8),
    markup = renderBestiary("gorgelimon", 8);
  assert.equal(values.respawnDelay, "Nouvelle expédition");
  assert.ok(Number(values.maxHp) > 700);
  assert.ok(markup.includes("70 %"));
  assert.ok(coreDropMarkup("gorgelimon", 8).includes("garantis"));
  assert.equal(/undefined|NaN/.test(markup), false);
});

test("le boss poursuit une cible hors de portée au lieu de rester figé et l’enracinement interrompt l’éboulement", () => {
  const { s, b } = setup();
  awakenDepthsBoss(s);
  Object.assign(s.player, { x: 330, y: 230 });
  Object.assign(s.team[0], s.player);
  b.x = 570;
  b.y = 330;
  b.cooldown = 1;
  const before = { x: b.x, y: b.y };
  stepDepthsBoss(s, b, 0.05, { canStand: canWalkDepths, damage: () => {} });
  assert.ok(Math.hypot(b.x - before.x, b.y - before.y) > 0);
  b.x = b.homeX;
  b.y = b.homeY;
  b.attackSerial = 2;
  b.cooldown = 0;
  b.intent = undefined;
  const hits = [];
  const ctx = { canStand: canWalkDepths, damage: () => hits.push(1) };
  stepDepthsBoss(s, b, 0.01, ctx);
  assert.equal(b.intent.kind, "boss-quake");
  b.spellState = { root: 1 };
  stepDepthsBoss(s, b, 2, ctx);
  assert.equal(b.intent, undefined);
  assert.equal(hits.length, 0);
});
