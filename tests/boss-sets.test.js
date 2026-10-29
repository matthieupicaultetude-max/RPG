import test from "node:test";
import assert from "node:assert/strict";
import {
  HYBRID_SLIMES,
  hybridResource,
  royalPart,
} from "../src/data/hybrid-slimes.js";
import {
  BOSS_SETS,
  STARTER_SETS,
  createHybridCore,
  createCore,
  rollCoreEquipment,
  equipmentStats,
  setProgress,
} from "../src/data/equipment.js";
import {
  createSandbox,
  grantCore,
  openCore,
  openCores,
  rewardMonster,
  equip,
  teleport,
  spellContext,
} from "../src/dev/sandbox.js";
import { createMonster, monsterLoot } from "../src/data/monsters.js";
import {
  chromaticRecipe,
  chromaticVersion,
  completeChromaticSet,
} from "../src/data/chromatic.js";
import {
  upgradeChromatic,
  recycleEquipment,
  exchangeCoreFragments,
} from "../src/game/forge.js";
import {
  createPet,
  foodQuantity,
  BOSS_PETS,
  petDefinition,
} from "../src/data/pets.js";
import { feedPet, acceptAdoption } from "../src/game/pet-quests.js";
import { woodItem } from "../src/data/woodcutting.js";
import { craftDungeonKeys } from "../src/game/handyman.js";
import { KEY_RECIPES } from "../src/data/handyman.js";
import { createBrowserSave } from "../src/game/browser-save.js";
import { beginTutorial, finishTutorial } from "../src/game/tutorial.js";
import { renderInventory } from "../src/ui/inventory.js";
import { renderForge } from "../src/ui/forge.js";
import { renderBestiary } from "../src/ui/bestiary.js";
import { renderPetShop } from "../src/ui/petshop.js";
import { renderItemIcon } from "../src/ui/item-art.js";
const add = (s, item) => {
  const copy = structuredClone({
    ...item,
    id: s.nextItem++,
    quantity: item.quantity || 1,
  });
  s.bag.push(copy);
  return copy;
};
const advance = (s) =>
  s.team.forEach((m) => Object.assign(m, { level: 10, maxHp: 190, hp: 190 }));

test("four level-10 sets: nine pieces, two characteristics, power/wisdom/resistances and progressive set bonuses", () => {
  assert.equal(BOSS_SETS.length, 4);
  assert.equal(STARTER_SETS.length, 4);
  for (const set of BOSS_SETS) {
    assert.equal(set.pieces.length, 9);
    assert.equal(set.minLevel, 10);
    for (const piece of set.pieces) {
      assert.equal(piece.requiredLevel, 10);
      assert.equal(piece.elements.length, 2);
      assert.ok(
        piece.stats.Vitalité > 0 &&
          piece.stats.Puissance > 0 &&
          piece.stats.Sagesse > 0,
      );
      assert.equal(
        Object.keys(piece.stats).filter((k) =>
          ["Force", "Intelligence", "Agilité", "Chance"].includes(k),
        ).length,
        2,
      );
    }
    const s = createSandbox();
    advance(s);
    for (const piece of set.pieces) equip(s, add(s, piece).id);
    const stats = equipmentStats(s.team[0]);
    assert.equal(stats.Vitalité, 162);
    assert.equal(stats.Puissance, 15);
    assert.equal(stats.Sagesse, 20);
    assert.equal(setProgress(s.team[0], set.id).count, 9);
    assert.equal(setProgress(s.team[1], set.id).count, 0);
  }
});

test("hybrid cores: only their own nine pieces, independent stacks, quantity opening and no chromatic rolls", () => {
  const s = createSandbox();
  for (const h of Object.values(HYBRID_SLIMES)) {
    const first = grantCore(s, h.id);
    grantCore(s, h.id);
    grantCore(s, h.elements[0]);
    assert.equal(s.bag.find((i) => i.id === first).quantity, 2);
    const rolls = openCores(s, first, 2, () => 0.999);
    assert.equal(rolls.length, 2);
    assert.ok(rolls.every((i) => i.setId === h.id && !i.chromatic));
  }
  assert.equal(
    rollCoreEquipment(createCore("earth"), () => 0).requiredLevel,
    1,
  );
  for (const h of Object.values(HYBRID_SLIMES))
    for (let i = 0; i < 9; i++)
      assert.equal(
        rollCoreEquipment(createHybridCore(h.id), () => i / 9 + 0.001).slot,
        BOSS_SETS.find((s) => s.id === h.id).pieces[i].slot,
      );
});

test("level gate: cannot equip level-10 pieces at nine; both elements enter character stats at ten", () => {
  const s = createSandbox(),
    piece = add(s, BOSS_SETS[0].pieces[0]);
  s.team[0].level = 9;
  equip(s, piece.id);
  assert.equal(s.team[0].equipment.Coiffe, undefined);
  advance(s);
  equip(s, piece.id);
  assert.equal(s.team[0].equipment.Coiffe.id, piece.id);
  assert.equal(equipmentStats(s.team[0]).Chance, 5);
  assert.equal(equipmentStats(s.team[0]).Force, 5);
});

test("chromatic craft: exactly one walnut log and one matching normal chromatic resource, atomic and no duplicate item", () => {
  for (const set of BOSS_SETS) {
    const s = createSandbox(),
      piece = add(s, set.pieces[0]);
    teleport(s, "forge");
    const recipe = chromaticRecipe(piece);
    assert.deepEqual(
      recipe.map((i) => [i.kind, i.quantity]),
      [
        ["wood", 1],
        ["hybrid-resource", 1],
      ],
    );
    add(s, woodItem("walnut", "wood"));
    add(s, hybridResource(set.id, "rare", true));
    assert.equal(upgradeChromatic(s, piece.id), null);
    assert.ok(s.bag.some((i) => i.kind === "wood"));
    add(s, hybridResource(set.id, "normal", true));
    assert.equal(upgradeChromatic(s, piece.id), piece);
    assert.equal(piece.chromatic, true);
    assert.equal(piece.stats.Puissance, set.pieces[0].stats.Puissance + 2);
    assert.equal(s.bag.filter((i) => i.id === piece.id).length, 1);
    assert.ok(s.bag.some((i) => i.type === "rare" && i.chromatic));
    assert.equal(upgradeChromatic(s, piece.id), null);
  }
});

test("normal and chromatic equipment share set bonuses, only full chromatic gear activates the moving aura", () => {
  for (const set of BOSS_SETS) {
    const s = createSandbox();
    advance(s);
    for (const p of set.pieces) equip(s, add(s, chromaticVersion(p)).id);
    assert.equal(completeChromaticSet(s.team[0]), set.id);
    assert.equal(equipmentStats(s.team[0]).Puissance, 33);
    s.team[0].equipment.Coiffe = { ...set.pieces[0] };
    assert.equal(completeChromaticSet(s.team[0]), null);
    assert.equal(setProgress(s.team[0], set.id).count, 9);
  }
});

test("hybrid loot and cores only on real bi-element monsters, not single-element slimes or summons", () => {
  for (const h of Object.values(HYBRID_SLIMES)) {
    const s = createSandbox(),
      m = createMonster(h.monster, 100, 100, 6);
    if (h.id === "depths") m.dualElement = true;
    const numbers = [0.1, 0.1, 0.01, 0.01];
    rewardMonster(s, m, () => numbers.shift() ?? 0);
    assert.ok(
      s.bag.some((i) => i.kind === "hybrid-resource" && i.hybridId === h.id),
    );
    assert.ok(s.bag.some((i) => i.kind === "core" && i.setId === h.id));
  }
  for (const flag of ["volcanoSummon", "stormSpawn", "bossOwner"]) {
    const s = createSandbox(),
      m = createMonster("magma-slime", 100, 100, 6);
    m[flag] = flag === "bossOwner" ? 0 : true;
    rewardMonster(s, m, () => 0);
    assert.equal(s.bag.length, 0);
    assert.equal(s.gold, 0);
  }
  const s = createSandbox();
  rewardMonster(s, createMonster("slime", 100, 100), () => 0);
  assert.ok(s.bag.some((i) => i.kind === "core" && !i.setId));
});

test("boss pet rate boundary: independent 5% roll, guaranteed correct royal part, no duplicate victory rewards", () => {
  for (const h of Object.values(HYBRID_SLIMES))
    for (const roll of [0, 0.049999, 0.05, 0.99]) {
      const s = createSandbox(),
        b = createMonster(h.boss, 100, 100, 10);
      rewardMonster(s, b, () => roll);
      assert.equal(
        s.bag.filter((i) => i.kind === "royal-key-part" && i.hybridId === h.id)
          .length,
        1,
      );
      assert.equal(
        s.bag.filter((i) => i.kind === "pet").length,
        roll < 0.05 ? 1 : 0,
      );
      const before = JSON.stringify(s.bag);
      rewardMonster(s, b, () => 0);
      assert.equal(JSON.stringify(s.bag), before);
      assert.ok(s.bag.every((i) => i.kind !== "core" && !i.setId));
    }
});

test("boss pets: matching rare chromatic hybrid food only, equipped stats and HP update without healing", () => {
  assert.equal(BOSS_PETS.length, 4);
  assert.equal(petDefinition(undefined), undefined);
  for (const h of Object.values(HYBRID_SLIMES)) {
    const s = createSandbox();
    advance(s);
    const pet = add(s, createPet(h.id));
    equip(s, pet.id);
    const hp = s.team[0].hp,
      max = s.team[0].maxHp;
    assert.equal(foodQuantity(s, pet), 0);
    assert.equal(feedPet(s, pet.id), false);
    add(s, hybridResource(h.id, "normal", true));
    add(s, hybridResource(h.id, "rare", false));
    assert.equal(feedPet(s, pet.id), false);
    add(s, hybridResource(h.id, "rare", true));
    assert.equal(feedPet(s, pet.id), true);
    assert.equal(pet.level, 2);
    assert.equal(s.team[0].hp, hp);
    assert.equal(s.team[0].maxHp, max + 2);
    assert.equal(pet.stats.Vitalité, 4);
    assert.equal(acceptAdoption(s, h.id), false);
  }
});

test("royal key craft: exactly four different parts, missing one is atomic and duplicates cannot replace it", () => {
  const s = createSandbox();
  teleport(s, "bricoleur");
  assert.equal(KEY_RECIPES["slime-king"].ingredients.length, 4);
  const ids = Object.keys(HYBRID_SLIMES);
  for (const id of ids.slice(0, 3)) add(s, royalPart(id));
  add(s, royalPart(ids[0]));
  const before = JSON.stringify(s.bag);
  assert.equal(craftDungeonKeys(s, 1, "slime-king"), false);
  assert.equal(JSON.stringify(s.bag), before);
  add(s, royalPart(ids[3]));
  assert.equal(craftDungeonKeys(s, 1, "slime-king"), true);
  assert.equal(
    s.bag.filter(
      (i) => i.kind === "dungeon-key" && i.dungeonId === "slime-king",
    ).length,
    1,
  );
  assert.equal(s.bag.filter((i) => i.kind === "royal-key-part").length, 1);
  assert.equal(craftDungeonKeys(s, 1, "slime-king"), false);
});

test("recycling keeps hybrid fragments separate and ten reconstruct the correct hybrid core", () => {
  for (const set of BOSS_SETS) {
    const s = createSandbox();
    teleport(s, "forge");
    for (let i = 0; i < 10; i++) recycleEquipment(s, add(s, set.pieces[0]).id);
    assert.equal(s.bag.length, 1);
    assert.equal(s.bag[0].setId, set.id);
    assert.equal(s.bag[0].quantity, 10);
    assert.equal(exchangeCoreFragments(s, set.element, 1), null);
    const core = exchangeCoreFragments(s, set.id, 10);
    assert.equal(core.setId, set.id);
    assert.equal(s.bag.length, 1);
    assert.equal(openCore(s, core.id, () => 0).setId, set.id);
  }
});

test("browser save restores new cores, pieces, pets, chromatic materials and royal parts without a schema reset", () => {
  const s = createSandbox();
  beginTutorial(s);
  finishTutorial(s, true);
  advance(s);
  for (const h of Object.values(HYBRID_SLIMES)) {
    grantCore(s, h.id);
    add(s, createPet(h.id));
    add(s, royalPart(h.id));
    add(s, hybridResource(h.id, "normal", true));
  }
  equip(s, add(s, chromaticVersion(BOSS_SETS[0].pieces[0])).id);
  const map = new Map(),
    storage = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
    };
  assert.equal(createBrowserSave(s, storage).save(), true);
  const restored = createSandbox();
  createBrowserSave(restored, storage);
  assert.deepEqual(restored.bag, s.bag);
  assert.deepEqual(restored.team[0].equipment, s.team[0].equipment);
  assert.equal(restored.saveStatus.error, false);
});

test("UI and item art describe all four sets, boss food and royal parts without undefined values", () => {
  const s = createSandbox();
  advance(s);
  for (const h of Object.values(HYBRID_SLIMES)) {
    const core = add(s, createHybridCore(h.id));
    const piece = add(s, BOSS_SETS.find((t) => t.id === h.id).pieces[0]);
    const pet = add(s, createPet(h.id));
    for (const item of [
      core,
      piece,
      pet,
      add(s, royalPart(h.id)),
      add(s, hybridResource(h.id, "normal", true)),
    ])
      assert.equal(
        /undefined|NaN/.test(
          renderInventory(s, { source: "bag", id: item.id }),
        ),
        false,
      );
    assert.equal(
      /undefined|NaN/.test(
        renderForge(s, piece.id) + renderBestiary(h.boss, 10),
      ),
      false,
    );
    assert.ok(renderBestiary(h.boss, 10).includes("5 %"));
    assert.ok(renderBestiary(h.monster, 6).includes("Noyau"));
  }
  assert.ok(renderPetShop(s).includes("Familiers de boss"));
  assert.notEqual(
    renderItemIcon(createHybridCore("magma")),
    renderItemIcon(createCore("earth")),
  );
});
