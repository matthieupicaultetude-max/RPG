import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTER_SETS,
  ELEMENTS,
  SET_SLOTS,
  setProgress,
  setBonusStats,
  rawEquipmentStats,
  equipmentStats,
  characterStats,
  syncEquipmentHealth,
  rollCoreEquipment,
  createCore,
  weaponDamage,
} from "../src/data/equipment.js";
import {
  chromaticVersion,
  completeChromaticSet,
} from "../src/data/chromatic.js";
import {
  createSandbox,
  equip,
  unequip,
  grantXp,
  teleport,
} from "../src/dev/sandbox.js";
import { spellById, spellAmount } from "../src/data/spells.js";
import { receiveSpellDamage } from "../src/combat/spells.js";
import { recycleEquipment } from "../src/game/forge.js";
import { renderInventory } from "../src/ui/inventory.js";
import { renderCharacteristics } from "../src/ui/characteristics.js";
import { renderSetDetails } from "../src/ui/set-bonuses.js";
const setFor = (e) => STARTER_SETS.find((s) => s.element === e);
function put(s, element, slot, chromatic = false, member = 0) {
  const source = setFor(element).pieces.find((p) => p.slot === slot);
  const item = {
    ...(chromatic ? chromaticVersion(source) : source),
    stats: { ...(chromatic ? chromaticVersion(source) : source).stats },
    id: s.nextItem++,
    quantity: 1,
  };
  s.bag.push(item);
  const previous = s.main;
  s.main = member;
  equip(s, item.id);
  s.main = previous;
  return item;
}
function full(s, element, chromatic = false) {
  return SET_SLOTS.map((slot) => put(s, element, slot, chromatic));
}

test("quatre ensembles débutants guerriers : profils équilibrés, totaux de pièces et aucun bonus non demandé", () => {
  for (const set of STARTER_SETS) {
    assert.equal(set.source, "slime");
    assert.equal(set.archetype, "guerrier");
    const s = createSandbox();
    full(s, set.element);
    const raw = rawEquipmentStats(s.team[0]),
      total = equipmentStats(s.team[0]);
    assert.equal(raw.Vitalité, 54);
    assert.equal(raw[ELEMENTS[set.element].stat], 30);
    assert.equal(raw.Sagesse, 6);
    assert.equal(total.Vitalité, 76);
    assert.equal(total[ELEMENTS[set.element].stat], 40);
    assert.equal(total.Sagesse, 10);
    for (const [element, e] of Object.entries(ELEMENTS)) {
      assert.equal(
        total[`Résistance ${e.name}`],
        element === set.element ? 12 : 6,
      );
      if (element !== set.element) assert.equal(total[e.stat], 0);
    }
    assert.equal(total.Puissance, undefined);
    assert.equal(total.Critique, undefined);
    assert.equal(s.team[0].maxHp, 176);
    assert.equal(s.team[0].hp, 100);
  }
});
test("paliers 2 à 9 : seul le total du palier courant est actif, progression monotone", () => {
  const s = createSandbox(),
    m = s.team[0];
  let previous = {};
  for (const [i, slot] of SET_SLOTS.entries()) {
    put(s, "earth", slot);
    const progress = setProgress(m, "earth");
    assert.equal(progress.count, i + 1);
    if (i === 0) {
      assert.equal(progress.active, null);
      assert.equal(progress.next.pieces, 2);
      assert.deepEqual(setBonusStats(m), {});
    } else {
      assert.equal(progress.active.pieces, i + 1);
      assert.deepEqual(setBonusStats(m), progress.active.stats);
      for (const [stat, value] of Object.entries(previous))
        assert.ok((progress.active.stats[stat] || 0) >= value);
      previous = progress.active.stats;
    }
  }
  assert.equal(setProgress(m, "earth").next, null);
  assert.equal(setBonusStats(m).Vitalité, 22);
  assert.notEqual(setBonusStats(m).Vitalité, 105);
});
test("mix de panoplies : bonus séparés, pas de pièces du sac ni d’un autre personnage", () => {
  const s = createSandbox();
  put(s, "earth", "Coiffe");
  put(s, "earth", "Cape");
  put(s, "fire", "Ceinture");
  put(s, "fire", "Bottes");
  put(s, "earth", "Arme", false, 1);
  const spare = { ...setFor("earth").pieces[8], id: s.nextItem++ };
  s.bag.push(spare);
  const bonus = setBonusStats(s.team[0]);
  assert.deepEqual(bonus, { Vitalité: 8, Force: 1, Intelligence: 1 });
  assert.equal(setProgress(s.team[0], "earth").count, 2);
  assert.equal(setProgress(s.team[1], "earth").count, 1);
  assert.equal(setBonusStats(s.team[1]).Force, undefined);
});
test("pas de doublons : faux emplacements, familier et trophées ne complètent pas une panoplie", () => {
  const s = createSandbox(),
    m = s.team[0];
  put(s, "air", "Coiffe");
  const fake = { ...m.equipment.Coiffe };
  m.equipment["Anneau 1"] = fake;
  m.equipment.Familier = { ...fake, slot: "Familier" };
  m.equipment["Trophée 1"] = { ...fake, slot: "Trophée 1" };
  assert.equal(setProgress(m, "air").count, 1);
  fake.slot = "Anneau 1";
  assert.equal(setProgress(m, "air").count, 1);
  assert.deepEqual(setBonusStats(m), {});
});
test("normales et chromatiques comptent ensemble, sans doubler les bonus ni modifier les pièces", () => {
  const s = createSandbox();
  for (const [i, slot] of SET_SLOTS.entries())
    put(s, "water", slot, i % 2 === 0);
  const m = s.team[0],
    before = JSON.stringify(m.equipment);
  assert.equal(setProgress(m, "water").count, 9);
  assert.equal(setBonusStats(m).Vitalité, 22);
  assert.equal(equipmentStats(m).Puissance, 10);
  assert.equal(completeChromaticSet(m), null);
  equipmentStats(m);
  characterStats(m);
  assert.equal(JSON.stringify(m.equipment), before);
  const f = createSandbox();
  full(f, "water", true);
  assert.equal(completeChromaticSet(f.team[0]), "water");
  assert.equal(equipmentStats(f.team[0]).Puissance, 18);
  assert.equal(equipmentStats(f.team[0]).Chance, 40);
});
test("PV : franchir ou perdre un palier ajuste le maximum sans soigner ni cumuler après remplacement", () => {
  const s = createSandbox(),
    m = s.team[0];
  put(s, "earth", "Coiffe");
  assert.equal(m.maxHp, 108);
  put(s, "earth", "Cape");
  assert.equal(m.maxHp, 119);
  assert.equal(m.hp, 100);
  put(s, "earth", "Cape");
  assert.equal(m.maxHp, 119);
  assert.equal(m.hp, 100);
  unequip(s, "Cape");
  assert.equal(m.maxHp, 108);
  m.hp = 108;
  unequip(s, "Coiffe");
  assert.equal(m.maxHp, 100);
  assert.equal(m.hp, 100);
  syncEquipmentHealth(m);
  assert.equal(m.maxHp, 100);
});
test("recyclage d’une pièce portée retire aussi le palier de panoplie", () => {
  const s = createSandbox();
  put(s, "earth", "Coiffe");
  const cape = put(s, "earth", "Cape");
  teleport(s, "forge");
  assert.ok(recycleEquipment(s, cape.id));
  assert.equal(setProgress(s.team[0], "earth").count, 1);
  assert.equal(s.team[0].maxHp, 108);
  assert.equal(s.team[0].hp, 100);
});
test("dégâts, résistances et sagesse utilisent effectivement les bonus de panoplie", () => {
  const s = createSandbox(),
    m = s.team[0];
  full(s, "earth");
  assert.equal(weaponDamage(m, 100), 140);
  assert.equal(spellAmount(m, spellById("melee-earth-0"), 100), 140);
  assert.equal(spellAmount(m, spellById("melee-fire-0"), 100), 100);
  m.hp = 176;
  assert.equal(receiveSpellDamage(s, m, 100, null, "earth"), 88);
  m.hp = 176;
  assert.equal(receiveSpellDamage(s, m, 100, null, "fire"), 94);
  grantXp(s, 10);
  assert.equal(m.xp, 11);
  assert.equal(s.team[1].xp, 10);
  m.allocatedStats.Force = 5;
  assert.equal(characterStats(m).Force, 45);
  assert.equal(spellAmount(m, spellById("melee-earth-0"), 100), 145);
});
test("noyaux : les pièces tirées ont le nouveau profil ; données du catalogue immuables", () => {
  for (const set of STARTER_SETS) {
    const item = rollCoreEquipment(createCore(set.element), () => 0);
    assert.equal(item.stats.Vitalité, 8);
    assert.equal(item.stats.Sagesse, 1);
    item.stats.Vitalité = 999;
    assert.equal(set.pieces[0].stats.Vitalité, 8);
    assert.ok(Object.isFrozen(set.bonuses));
    assert.ok(set.bonuses.every((t) => Object.isFrozen(t.stats)));
  }
});
test("interface : total actif, prochain palier, tous les paliers et résistances en pourcentage", () => {
  const s = createSandbox();
  put(s, "fire", "Coiffe");
  put(s, "fire", "Cape");
  const detail = renderSetDetails(s.team[0], "fire");
  assert.ok(detail.includes("2/9 pièces portées"));
  assert.ok(detail.includes("Bonus actif (2 pièces)"));
  assert.ok(detail.includes("Prochain palier : 3 pièces"));
  assert.equal((detail.match(/data-set-tier=/g) || []).length, 8);
  const inv = renderInventory(s, { source: "equipment", slot: "Coiffe" });
  assert.ok(inv.includes("Voir les bonus de 2 à 9 pièces"));
  assert.ok(inv.includes("+1 % Résistance Feu"));
  const stats = renderCharacteristics(s);
  assert.ok(stats.includes("Résistances élémentaires"));
  assert.ok(stats.includes('data-worn-set="fire"'));
  assert.ok(stats.includes("équipement et les panoplies"));
  assert.equal(/NaN|undefined/.test(detail + inv + stats), false);
});
