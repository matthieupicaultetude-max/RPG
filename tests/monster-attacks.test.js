import test from "node:test";
import assert from "node:assert/strict";
import { createSandbox } from "../src/dev/sandbox.js";
import { createMonster } from "../src/data/monsters.js";
import {
  startMonsterAttack,
  stepMonsterAbility,
  stepMonsterHazards,
  clearMonsterAttacks,
  isolatedPartyMember,
  activeParty,
} from "../src/combat/monster-attacks.js";
import { receiveSpellDamage } from "../src/combat/spells.js";
const setup = (species = "boar") => {
  const s = createSandbox();
  s.monsters = [createMonster(species, 100, 200)];
  s.team.forEach((p, i) => Object.assign(p, { x: 160 + i * 80, y: 200 }));
  const hits = [],
    ctx = {
      canStand: (x, y) => x >= 20 && x <= 600 && y >= 70 && y <= 380,
      damage: (p, amount, m, element) => {
        hits.push({ id: p.id, amount, element });
        receiveSpellDamage(s, p, amount, m, element);
      },
    };
  const step = (seconds) => {
    for (let i = 0; i < Math.ceil(seconds / 0.025); i++) {
      const m = s.monsters[0];
      m.cooldown = Math.max(0, m.cooldown - 0.025);
      stepMonsterAbility(s, m, 0.025, ctx);
      stepMonsterHazards(s, 0.025, ctx);
    }
  };
  return { s, m: s.monsters[0], hits, ctx, step };
};
test("sanglier : cible et couloir figés, pas de dégâts pendant la préparation, impact Terre unique", () => {
  const { s, m, hits, ctx, step } = setup();
  assert.equal(startMonsterAttack(s, m, ctx), true);
  const end = { ...m.intent.to };
  step(0.8);
  assert.equal(hits.length, 0);
  assert.equal(m.intent.phase, "windup");
  step(0.9);
  assert.equal(hits.filter((h) => h.id === 0).length, 1);
  assert.equal(hits[0].element, "earth");
  assert.equal(hits[0].amount, 12);
  assert.equal(m.x, end.x);
  assert.equal(m.y, end.y);
  const dodge = setup();
  startMonsterAttack(dodge.s, dodge.m, dodge.ctx);
  const locked = { ...dodge.m.intent.to };
  dodge.s.team[0].y += 70;
  dodge.step(0.9);
  assert.deepEqual(dodge.m.intent.to, locked);
  dodge.step(0.9);
  assert.equal(
    dodge.hits.some((h) => h.id === 0),
    false,
  );
});
test("slime : cible la plus isolée du groupe, même si elle est proche du monstre ; atterrissage verrouillé et esquivable", () => {
  const { s, m, hits, ctx, step } = setup("slime");
  Object.assign(m, { x: 280, homeX: 280 });
  [150, 160, 240].forEach((x, i) => (s.team[i].x = x));
  assert.equal(isolatedPartyMember(activeParty(s), m).id, 2);
  startMonsterAttack(s, m, ctx);
  assert.equal(m.intent.targetId, 2);
  assert.equal(m.intent.to.x, 240);
  step(1);
  assert.equal(hits.length, 0);
  step(0.4);
  assert.ok(m.lift > 0);
  assert.equal(hits.length, 0);
  s.team[2].y = 270;
  step(0.6);
  assert.equal(m.lift, 0);
  assert.equal(m.x, 240);
  assert.equal(m.y, 200);
  assert.equal(hits.length, 0);
  assert.equal(s.monsterImpacts[0].element, "water");
  s.deployed = false;
  assert.deepEqual(
    activeParty(s).map((p) => p.id),
    [0],
  );
  s.team[0].hp = 0;
  assert.equal(isolatedPartyMember(activeParty(s), m), null);
});
test("slime : dégâts Eau une seule fois à l’atterrissage et cible de la préparation inchangée", () => {
  const { s, m, hits, ctx, step } = setup("slime");
  s.deployed = false;
  startMonsterAttack(s, m, ctx);
  step(1.95);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].element, "water");
  assert.equal(hits[0].amount, 10);
  assert.equal(s.team[0].hp, 90);
});
for (const [species, element] of [
  ["firefly", "fire"],
  ["moth", "air"],
])
  test(`${species} : tornade ${element}, avertissement préalable et impact unique lors du passage`, () => {
    const { s, m, hits, ctx, step } = setup(species);
    s.deployed = false;
    startMonsterAttack(s, m, ctx);
    step(1);
    assert.equal(hits.length, 0);
    assert.equal(s.monsterTornadoes.length, 0);
    step(0.25);
    assert.equal(s.monsterTornadoes.length, 1);
    assert.equal(s.monsterTornadoes[0].element, element);
    step(1.2);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].element, element);
    assert.equal(s.team[0].hp, 94);
    assert.equal(s.monsterTornadoes.length, 0);
  });
test("couloirs arrêtés par les obstacles : ni charge, ni tornade, ni dégâts à travers un mur", () => {
  for (const species of ["boar", "firefly"]) {
    const { s, m, hits, ctx, step } = setup(species);
    s.deployed = false;
    s.team[0].x = 240;
    m.detection = 200;
    ctx.canStand = (x, y) => x >= 20 && x < 190 && y >= 70 && y <= 380;
    const started = startMonsterAttack(s, m, ctx);
    assert.equal(started, species === "boar");
    if (started) assert.ok(m.intent.to.x < 190);
    step(2.8);
    assert.equal(hits.length, 0);
    assert.ok(m.x < 190);
  }
});
test("enracinement, décès et sortie : annulation des préparations et disparition des tornades du lanceur mort", () => {
  const { s, m, hits, ctx, step } = setup("firefly");
  s.deployed = false;
  startMonsterAttack(s, m, ctx);
  m.spellState = { root: 1 };
  step(0.1);
  assert.equal(m.intent, undefined);
  assert.equal(hits.length, 0);
  m.spellState.root = 0;
  m.cooldown = 0;
  startMonsterAttack(s, m, ctx);
  step(1.25);
  assert.equal(s.monsterTornadoes.length, 1);
  m.hp = 0;
  stepMonsterHazards(s, 0.1, ctx);
  assert.equal(s.monsterTornadoes.length, 0);
  m.hp = m.maxHp;
  m.cooldown = 0;
  startMonsterAttack(s, m, ctx);
  clearMonsterAttacks(s);
  assert.equal(m.intent, undefined);
  assert.deepEqual(s.monsterTornadoes, []);
});
test("résistance élémentaire avant le bouclier, sans effet secondaire des caractéristiques élémentaires", () => {
  const s = createSandbox(),
    p = s.team[0];
  p.equipment.Coiffe = { stats: { "Résistance Eau": 50, Chance: 500 } };
  p.buffs.shield = { time: 3, amount: 3 };
  assert.equal(receiveSpellDamage(s, p, 20, s.monsters[0], "water"), 7);
  assert.equal(p.hp, 93);
  assert.equal(receiveSpellDamage(s, p, 20, s.monsters[1], "earth"), 20);
  assert.equal(p.hp, 73);
});
