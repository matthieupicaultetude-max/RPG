import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  castEquipped,
  spellContext,
  clickBonus,
} from "../src/dev/sandbox.js";
import { stepSpells } from "../src/combat/spells.js";
import {
  recordBonusOpportunity,
  stepBonusTargets,
  bonusTargetPosition,
  clickBonusTarget,
  BONUS_TARGET_DURATION,
} from "../src/combat/bonus-targets.js";
const ground = () => true;
function setup() {
  const s = createSandbox();
  Object.assign(s.player, { x: 420, y: 240 });
  Object.assign(s.team[0], s.player);
  s.monsters = [{ x: 445, y: 240, hp: 1000, maxHp: 1000, cooldown: 0 }];
  return s;
}
function spawn(s) {
  return recordBonusOpportunity(
    s,
    s.monsters[0],
    17,
    s.team[0],
    ground,
    () => 0,
  );
}
const hit = (_s, m, damage, _member, options) => {
  assert.equal(options.bonus, true);
  m.hp -= damage;
};

test("apparition occasionnelle, une cible par ennemi et pas de génération par les alliés IA", () => {
  const s = setup(),
    m = s.monsters[0];
  assert.equal(
    recordBonusOpportunity(s, m, 17, s.team[0], ground, () => 0.99),
    false,
  );
  assert.equal(spawn(s), true);
  const first = m.bonusTarget;
  assert.equal(spawn(s), false);
  assert.equal(m.bonusTarget, first);
  const other = setup();
  assert.equal(
    recordBonusOpportunity(
      other,
      other.monsters[0],
      8,
      other.team[1],
      ground,
      () => 0,
    ),
    false,
  );
  assert.equal(other.monsters[0].lastReceivedDamage, 8);
});
test("clic précis : raté sans conséquence, dernière attaque reçue au moment du clic, utilisation unique", () => {
  const s = setup(),
    m = s.monsters[0];
  spawn(s);
  let point = bonusTargetPosition(m);
  assert.equal(
    clickBonusTarget(s, { x: point.x + 8, y: point.y }, ground, hit),
    false,
  );
  assert.ok(m.bonusTarget);
  recordBonusOpportunity(s, m, 31, s.team[1], ground, () => 0);
  assert.equal(clickBonusTarget(s, point, ground, hit), true);
  assert.equal(m.hp, 969);
  assert.equal(m.bonusTarget, undefined);
  assert.equal(clickBonusTarget(s, point, ground, hit), false);
  assert.equal(m.hp, 969);
});
test("la cible suit le monstre et un nouveau coup ne renouvelle pas sa durée", () => {
  const s = setup(),
    m = s.monsters[0];
  spawn(s);
  const before = bonusTargetPosition(m);
  m.x += 10;
  m.y += 4;
  assert.deepEqual(bonusTargetPosition(m), {
    x: before.x + 10,
    y: before.y + 4,
  });
  stepBonusTargets(s, 0.4, ground);
  recordBonusOpportunity(s, m, 20, s.team[0], ground, () => 0);
  assert.equal(m.bonusTarget.time, BONUS_TARGET_DURATION - 0.4);
  stepBonusTargets(s, 2, ground);
  assert.equal(m.bonusTarget, undefined);
  assert.equal(spawn(s), false);
  stepBonusTargets(s, 1.6, ground);
  assert.equal(spawn(s), true);
});
test("obstacles, mort et longue absence suppriment les opportunités inutilisables", () => {
  const s = setup(),
    m = s.monsters[0];
  assert.equal(
    recordBonusOpportunity(
      s,
      m,
      17,
      s.team[0],
      () => false,
      () => 0,
    ),
    false,
  );
  spawn(s);
  stepBonusTargets(s, 0.01, () => false);
  assert.equal(m.bonusTarget, undefined);
  m.bonusTargetCooldown = 0;
  spawn(s);
  m.hp = 0;
  stepBonusTargets(s, 0.01, ground);
  assert.equal(m.bonusTarget, undefined);
  m.hp = 100;
  m.bonusTargetCooldown = 0;
  spawn(s);
  stepBonusTargets(s, 60, ground);
  assert.equal(m.bonusTarget, undefined);
  assert.equal(m.bonusTargetCooldown, 0);
});
test("pas de clic valide pour un joueur à terre, une cible expirée ou cachée par un obstacle", () => {
  const s = setup(),
    m = s.monsters[0];
  spawn(s);
  const point = bonusTargetPosition(m);
  s.team[0].hp = 0;
  assert.equal(clickBonusTarget(s, point, ground, hit), false);
  s.team[0].hp = 100;
  assert.equal(
    clickBonusTarget(s, point, () => false, hit),
    false,
  );
  m.bonusTarget.time = 0;
  assert.equal(clickBonusTarget(s, point, ground, hit), false);
  assert.equal(m.hp, 1000);
});
test("trois cibles simultanées au maximum", () => {
  const s = setup();
  s.monsters = Array.from({ length: 4 }, (_, index) => ({
    x: 400 + index * 30,
    y: 240,
    hp: 100,
  }));
  for (let index = 0; index < 4; index++)
    assert.equal(
      recordBonusOpportunity(
        s,
        s.monsters[index],
        10,
        s.team[0],
        ground,
        () => 0,
      ),
      index < 3,
    );
});
test("combat réel : copie après résistances, sans nouvelle amplification, sans recharge ou chaîne", () => {
  const s = setup(),
    m = s.monsters[0];
  s.team[0].equipment.Arme = { stats: { Force: 200, Puissance: 100 } };
  m.resistances = { earth: 50 };
  castEquipped(s, 0, { x: m.x, y: m.y - 8 });
  stepSpells(s, 0.13, spellContext);
  assert.equal(m.lastReceivedDamage, 24);
  assert.equal(m.hp, 976);
  m.bonusTarget = { dx: 26, dy: 0, time: BONUS_TARGET_DURATION };
  const charge = s.team[0].ultimateCharge,
    cooldown = s.team[0].spellCooldowns["melee-earth-0"];
  assert.equal(clickBonus(s, bonusTargetPosition(m)), true);
  assert.equal(m.hp, 952);
  assert.equal(m.bonusTarget, undefined);
  assert.equal(m.lastReceivedDamage, 24);
  assert.equal(s.team[0].ultimateCharge, charge + 24 / 5);
  assert.equal(s.team[0].spellCooldowns["melee-earth-0"], cooldown);
});

test("un bonus fatal donne les récompenses une seule fois et le respawn efface les anciennes données", async () => {
  const { stepSandbox } = await import("../src/dev/sandbox.js");
  const s = createSandbox(),
    m = s.monsters[0];
  s.monsters = [m];
  Object.assign(s.player, { x: 430, y: 220 });
  Object.assign(s.team[0], s.player);
  m.hp = 10;
  m.lastReceivedDamage = 17;
  m.bonusTarget = { dx: 26, dy: 0, time: BONUS_TARGET_DURATION };
  const point = bonusTargetPosition(m);
  assert.equal(clickBonus(s, point), true);
  assert.equal(m.hp, 0);
  assert.equal(s.gold, 5);
  assert.equal(s.bag.filter((item) => item.type).length, 1);
  assert.equal(clickBonus(s, point), false);
  assert.equal(s.gold, 5);
  for (let i = 0; i < 145; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(m.hp > 0);
  assert.equal(m.bonusTarget, undefined);
  assert.equal(m.lastReceivedDamage, undefined);
  assert.equal(m.bonusTargetCooldown, 0);
});
