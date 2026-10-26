import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  grantXp,
  teleport,
  spellContext,
} from "../src/dev/sandbox.js";
import {
  allocateCharacteristic,
  resetCharacteristics,
  nearFountain,
  normalSpellLevel,
  isSpellUnlocked,
  learnUltimate,
  ultimateChoices,
} from "../src/data/progression.js";
import { characterStats, syncEquipmentHealth } from "../src/data/equipment.js";
import {
  SPELLS,
  spellById,
  spellAmount,
  equipSpell,
} from "../src/data/spells.js";
import { castSpell } from "../src/combat/spells.js";

test("départ niveau 1 : Terre uniquement, aucune dépense possible ni ultime", () => {
  const s = createSandbox(),
    m = s.team[0];
  assert.deepEqual(m.loadout, ["melee-earth-0", null, null, null]);
  assert.equal(m.characteristicPoints, 0);
  assert.equal(allocateCharacteristic(s, "Force", 1), false);
  assert.equal(equipSpell(s, 0, 1, "melee-fire-0"), false);
  assert.equal(learnUltimate(s, "melee-fire-3"), false);
  m.loadout[1] = "melee-fire-0";
  assert.equal(castSpell(s, m, 1, null, spellContext), false);
});
test("montées multiples : cinq points chacune et XP restante conservée", () => {
  const s = createSandbox();
  grantXp(s, 175);
  for (const m of s.team) {
    assert.equal(m.level, 3);
    assert.equal(m.xp, 25);
    assert.equal(m.characteristicPoints, 10);
    assert.deepEqual(m.loadout, [
      `${m.role}-earth-0`,
      `${m.role}-fire-0`,
      `${m.role}-air-0`,
      null,
    ]);
  }
  grantXp(s, 125);
  assert.equal(s.team[0].level, 4);
  assert.equal(s.team[0].characteristicPoints, 15);
});
test("cycle de douze sorts : Terre, Feu, Air, Eau puis deuxième et troisième sorts", () => {
  for (const role of ["melee", "support", "ranged"]) {
    const normals = SPELLS.filter(
      (spell) => spell.role === role && !spell.ultimate,
    ).sort((a, b) => normalSpellLevel(a) - normalSpellLevel(b));
    assert.deepEqual(
      normals.map((spell) => normalSpellLevel(spell)),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    );
    assert.deepEqual(
      normals.map((spell) => spell.element),
      [
        "earth",
        "fire",
        "air",
        "water",
        "earth",
        "fire",
        "air",
        "water",
        "earth",
        "fire",
        "air",
        "water",
      ],
    );
    for (let level = 1; level <= 12; level++)
      assert.equal(
        normals.filter((spell) => isSpellUnlocked({ role, level }, spell))
          .length,
        level,
      );
  }
});
test("déblocages : ne remplacent pas une barre personnalisée et ne permettent pas un sort futur", () => {
  const s = createSandbox();
  grantXp(s, 300);
  assert.equal(equipSpell(s, 0, 1, "melee-water-0"), true);
  const before = s.team[0].loadout.slice();
  grantXp(s, 200);
  assert.deepEqual(s.team[0].loadout, before);
  assert.equal(equipSpell(s, 0, 2, "melee-earth-1"), true);
  assert.equal(equipSpell(s, 0, 0, "melee-fire-1"), false);
});
test("répartition : budget entier, six caractéristiques seulement et effets sur les dégâts", () => {
  const s = createSandbox();
  grantXp(s, 50);
  assert.equal(allocateCharacteristic(s, "Force", 3), true);
  assert.equal(allocateCharacteristic(s, "Intelligence", 2), true);
  assert.equal(s.team[0].characteristicPoints, 0);
  for (const [stat, n] of [
    ["Chance", 1],
    ["Force", -1],
    ["Force", 1.5],
    ["Force", NaN],
    ["Puissance", 1],
    ["Prospection", 1],
  ])
    assert.equal(allocateCharacteristic(s, stat, n), false);
  assert.equal(characterStats(s.team[0]).Force, 3);
  assert.equal(spellAmount(s.team[0], spellById("melee-earth-0"), 100), 103);
  assert.equal(spellAmount(s.team[0], spellById("melee-fire-0"), 100), 102);
});
test("Vitalité et fontaine : remboursement exact, équipement conservé, aucun soin ou reset de progression", () => {
  const s = createSandbox(),
    m = s.team[0];
  grantXp(s, 500);
  learnUltimate(s, "melee-fire-3");
  m.equipment.Coiffe = { id: 99, stats: { Vitalité: 7 } };
  syncEquipmentHealth(m);
  allocateCharacteristic(s, "Vitalité", 10);
  allocateCharacteristic(s, "Force", 10);
  assert.equal(m.maxHp, 157);
  assert.equal(m.hp, 140);
  assert.equal(resetCharacteristics(s), false);
  assert.equal(m.allocatedStats.Vitalité, 10);
  m.hp = 150;
  m.ultimateCharge = 44;
  m.spellCooldowns["melee-fire-3"] = 12;
  teleport(s, "fontaine");
  assert.equal(nearFountain(s), true);
  assert.equal(resetCharacteristics(s), true);
  assert.equal(m.characteristicPoints, 20);
  assert.equal(m.maxHp, 147);
  assert.equal(m.hp, 147);
  assert.equal(m.equipment.Coiffe.id, 99);
  assert.equal(m.level, 5);
  assert.equal(m.xp, 0);
  assert.deepEqual(m.learnedUltimates, ["melee-fire-3"]);
  assert.equal(m.ultimateCharge, 44);
  assert.equal(m.spellCooldowns["melee-fire-3"], 12);
  assert.equal(resetCharacteristics(s), false);
  assert.equal(m.characteristicPoints, 20);
  allocateCharacteristic(s, "Vitalité", 10);
  assert.equal(m.maxHp, 157);
  assert.equal(m.hp, 147);
});
test("Sagesse : bonus individuel d’XP, équipements et points investis additionnés", () => {
  const s = createSandbox();
  grantXp(s, 10500);
  assert.equal(s.team[0].level, 21);
  assert.equal(allocateCharacteristic(s, "Sagesse", 100), true);
  s.team[0].equipment["Trophée 1"] = { stats: { Sagesse: 25 } };
  grantXp(s, 100);
  assert.equal(s.team[0].xp, 225);
  assert.equal(s.team[1].xp, 100);
  assert.equal(characterStats(s.team[0]).Sagesse, 125);
});
test("ultimes : choix stocké tous les cinq niveaux, aucun doublon ni accès à une autre classe", () => {
  const s = createSandbox(),
    m = s.team[0];
  grantXp(s, 500);
  assert.equal(ultimateChoices(m), 1);
  assert.equal(learnUltimate(s, "ranged-air-3"), false);
  assert.equal(learnUltimate(s, "melee-fire-0"), false);
  assert.equal(learnUltimate(s, "melee-air-3"), true);
  assert.equal(m.loadout[3], "melee-air-3");
  assert.equal(ultimateChoices(m), 0);
  assert.equal(learnUltimate(s, "melee-air-3"), false);
  assert.equal(learnUltimate(s, "melee-fire-3"), false);
  grantXp(s, 1750);
  assert.equal(m.level, 10);
  assert.equal(ultimateChoices(m), 1);
  assert.equal(learnUltimate(s, "melee-fire-3"), true);
  assert.equal(m.loadout[3], "melee-air-3");
  assert.equal(equipSpell(s, 0, 3, "melee-fire-3"), true);
  assert.equal(s.team[1].learnedUltimates.length, 0);
});
test("tous les ultimes acquis : choix supplémentaires en réserve, pas de duplication", () => {
  const s = createSandbox(),
    m = s.team[0];
  grantXp(s, 15000);
  assert.equal(m.level, 25);
  for (const element of ["earth", "fire", "air", "water"])
    assert.equal(learnUltimate(s, `melee-${element}-3`), true);
  assert.equal(ultimateChoices(m), 1);
  assert.equal(learnUltimate(s, "melee-earth-3"), false);
  assert.equal(ultimateChoices(m), 1);
});
