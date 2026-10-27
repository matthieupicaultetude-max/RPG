import { woodItem } from "../src/data/woodcutting.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTER_SETS,
  weaponDamage,
  equipmentStats,
} from "../src/data/equipment.js";
import {
  canUpgrade,
  chromaticVersion,
  completeChromaticSet,
  CHROMATIC_POWER,
} from "../src/data/chromatic.js";
import {
  forgeItems,
  recipeStatus,
  upgradeChromatic,
  nearForge,
} from "../src/game/forge.js";
import {
  createSandbox,
  teleport,
  grantLoot,
  equip,
} from "../src/dev/sandbox.js";
import { MONSTERS } from "../src/data/monsters.js";
import {
  drawSetAura,
  drawEquipmentGlints,
} from "../src/rendering/chromatic-aura.js";
const piece = (s, element = "earth", index = 0) => {
  const item = {
    ...STARTER_SETS.find((set) => set.id === element).pieces[index],
    stats: {
      ...STARTER_SETS.find((set) => set.id === element).pieces[index].stats,
    },
    id: s.nextItem++,
    quantity: 1,
    chromatic: false,
  };
  s.bag.push(item);
  return item;
};
function supplies(s, monster) {
  s.bag.push({...woodItem("ash","plank"),quantity:5,id:s.nextItem++});
  grantLoot(s, "normal", true, monster);
  for (let i = 0; i < 10; i++) grantLoot(s, "normal", false, monster);
  for (let i = 0; i < 5; i++) grantLoot(s, "rare", false, monster);
}

test("36 versions chromatiques : statistiques conservées, bonus de puissance et aucune double amélioration", () => {
  for (const set of STARTER_SETS)
    for (const original of set.pieces) {
      const upgraded = chromaticVersion(original);
      assert.ok(upgraded.chromatic);
      assert.equal(upgraded.stats.Puissance, CHROMATIC_POWER);
      for (const [stat, value] of Object.entries(original.stats))
        assert.equal(upgraded.stats[stat], value);
      assert.notEqual(upgraded.stats, original.stats);
      assert.equal(chromaticVersion(upgraded), null);
    }
  assert.equal(canUpgrade({ slot: "Familier" }), false);
  assert.equal(canUpgrade({ slot: "Trophée 1" }), false);
});
test("recettes : ressources du bon monstre, quantités exactes et rare chromatique conservé", () => {
  for (const monster of MONSTERS.filter(m=>!m.depthsSlime&&!m.boss)) {
    const s = createSandbox(),
      item = piece(s, monster.element);
    teleport(s, "forge");
    supplies(s, monster.id);
    grantLoot(s, "rare", true, monster.id);
    grantLoot(s, "normal", false, monster.id);
    const recipe = recipeStatus(s, item);
    assert.deepEqual(
      recipe.map((i) => i.quantity),
      [1, 10, 5, 5],
    );
    const result = upgradeChromatic(s, item.id);
    assert.equal(result, item);
    assert.equal(result.id, item.id);
    assert.equal(
      s.bag.find((i) => i.name === monster.normal && !i.chromatic).quantity,
      1,
    );
    assert.equal(
      s.bag.find((i) => i.name === monster.rare && i.chromatic).quantity,
      1,
    );
    assert.equal(
      s.bag.some((i) => i.name === monster.normal && i.chromatic),
      false,
    );
    assert.equal(
      s.bag.some((i) => i.name === monster.rare && !i.chromatic),
      false,
    );
    assert.equal(upgradeChromatic(s, item.id), null);
  }
});
test("validation atomique : distance, ressource manquante et mauvais monstre ne consomment rien", () => {
  const s = createSandbox(),
    item = piece(s);
  supplies(s, "boar");
  const before = JSON.stringify(s.bag);
  assert.equal(nearForge(s), false);
  assert.equal(upgradeChromatic(s, item.id), null);
  assert.equal(JSON.stringify(s.bag), before);
  teleport(s, "forge");
  const rare = s.bag.find((i) => i.type === "rare");
  rare.quantity = 4;
  const missing = JSON.stringify(s.bag);
  assert.equal(upgradeChromatic(s, item.id), null);
  assert.equal(JSON.stringify(s.bag), missing);
  const other = createSandbox(),
    water = piece(other, "water");
  teleport(other, "forge");
  supplies(other, "boar");
  assert.equal(upgradeChromatic(other, water.id), null);
  assert.equal(water.chromatic, false);
});
test("amélioration équipée conserve objet, PV, collection et augmente les dégâts via puissance", () => {
  const s = createSandbox(),
    weapon = piece(s, "earth", 7);
  equip(s, weapon.id);
  teleport(s, "forge");
  supplies(s, "boar");
  const hp = s.team[0].hp,
    max = s.team[0].maxHp,
    before = weaponDamage(s.team[0], 100);
  assert.equal(upgradeChromatic(s, weapon.id), weapon);
  assert.equal(s.team[0].equipment.Arme, weapon);
  assert.equal(s.team[0].hp, hp);
  assert.equal(s.team[0].maxHp, max);
  assert.equal(equipmentStats(s.team[0]).Puissance, 2);
  assert.equal(weaponDamage(s.team[0], 100), before + 2);
  assert.deepEqual(s.collections, {});
  assert.equal(forgeItems(s).length, 0);
});
test("aura de panoplie : neuf pièces chromatiques du même ensemble sur le même personnage", () => {
  const s = createSandbox(),
    member = s.team[0];
  for (let i = 0; i < 9; i++) {
    const item = piece(s, "air", i);
    equip(s, item.id);
    Object.assign(item, chromaticVersion(item));
  }
  assert.equal(completeChromaticSet(member), "air");
  member.equipment.Arme.chromatic = false;
  assert.equal(completeChromaticSet(member), null);
  member.equipment.Arme.chromatic = true;
  member.equipment.Arme.setId = "fire";
  assert.equal(completeChromaticSet(member), null);
  member.equipment.Arme.setId = "air";
  delete member.equipment["Anneau 2"];
  assert.equal(completeChromaticSet(member), null);
});
test("rendu : aura de déplacement seulement en mouvement avec panoplie complète, éclats des pièces au repos", () => {
  let draws = 0;
  const ctx = new Proxy(
    {},
    {
      get: () => () => {
        draws++;
      },
      set: () => true,
    },
  );
  const member = {
    x: 100,
    y: 100,
    equipment: Object.fromEntries(
      STARTER_SETS[0].pieces.map((item) => [item.slot, chromaticVersion(item)]),
    ),
    moving: false,
  };
  drawSetAura(ctx, member, 1);
  assert.equal(draws, 0);
  member.moving = true;
  drawSetAura(ctx, member, 1);
  assert.ok(draws > 0);
  draws = 0;
  delete member.equipment.Arme;
  drawSetAura(ctx, member, 1);
  assert.equal(draws, 0);
  drawEquipmentGlints(ctx, member, 1);
  assert.ok(draws > 0);
});
