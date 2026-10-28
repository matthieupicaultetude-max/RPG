import test from "node:test";
import assert from "node:assert/strict";
import {
  MONSTERS,
  createMonster,
  monsterDefinition,
  monsterLoot,
} from "../src/data/monsters.js";
import { SLIME_RESOURCES } from "../src/data/slime-loot.js";
import {
  createSandbox,
  grantLoot,
  rewardMonster,
  teleport,
} from "../src/dev/sandbox.js";
import {
  renderBestiary,
  renderBestiaryNavigation,
  coreDropMarkup,
} from "../src/ui/bestiary.js";
import { renderItemIcon } from "../src/ui/item-art.js";
import { KEY_RECIPES } from "../src/data/handyman.js";
import { craftDungeonKeys } from "../src/game/handyman.js";
import { addWoodItem } from "../src/game/woodcutting.js";
import { petDefinition } from "../src/data/pets.js";
const rng = (values) => () => values.shift() ?? 0.9;

test("Slime est une catégorie unique avec tous les normaux avant tous les boss, sans doublon", () => {
  const nav = renderBestiaryNavigation("slime"),
    slime = nav.slice(
      nav.indexOf('data-category="slime"'),
      nav.indexOf("</details>"),
    );
  assert.equal(MONSTERS.filter((m) => m.category === "slime").length, 10);
  assert.ok(
    slime.indexOf('data-monster-group="normal"') <
      slime.indexOf('data-monster-group="boss"'),
  );
  const bossStart = slime.indexOf('data-monster-group="boss"');
  for (const m of MONSTERS) {
    assert.equal(
      (nav.match(new RegExp(`data-monster="${m.id}"`, "g")) || []).length,
      1,
    );
    if (m.category === "slime") {
      assert.ok(slime.includes(`data-monster="${m.id}"`));
      assert.equal(
        slime.indexOf(`data-monster="${m.id}"`) > bossStart,
        !!m.boss,
      );
    } else assert.ok(!slime.includes(`data-monster="${m.id}"`));
  }
  assert.ok(
    renderBestiaryNavigation("boar").includes('data-category="beast" open'),
  );
});
test("gelées et cœurs sont identiques par élément pour chaque slime et possèdent leurs variantes", () => {
  for (const m of MONSTERS.filter((m) => m.category === "slime" && !m.boss)) {
    const drops = monsterLoot(m.id),
      elements = m.elements || [m.element];
    assert.equal(drops.length, 4 * elements.length);
    for (const element of elements) {
      const r = SLIME_RESOURCES[element],
        group = drops.filter((d) => d.element === element);
      assert.deepEqual(
        new Set(group.map((d) => d.name)),
        new Set([r.normal, r.rare]),
      );
      assert.equal(group.filter((d) => d.chromatic).length, 2);
      assert.ok(group.every((d) => d.kind === "slime-resource"));
    }
    assert.ok(Math.abs(drops.reduce((n, d) => n + d.chance, 0) - 1) < 1e-12);
  }
  assert.deepEqual(monsterLoot("slime"), monsterLoot("marsh-slime"));
  assert.deepEqual(monsterLoot("slime"), monsterLoot("depths-water-slime"));
  assert.deepEqual(
    monsterLoot("mountain-slime"),
    monsterLoot("depths-earth-slime"),
  );
});
test("récompense multi-élément : une ressource et éventuellement un noyau du même élément", () => {
  for (const [choice, element] of [
    [0.1, "earth"],
    [0.9, "fire"],
  ]) {
    const s = createSandbox(),
      m = createMonster("magma-slime", 100, 100, 6);
    rewardMonster(s, m, rng([choice, 0.1, 0.01, 0.01]));
    const resource = s.bag.find((i) => i.kind === "slime-resource"),
      core = s.bag.find((i) => i.kind === "core");
    assert.equal(resource.name, SLIME_RESOURCES[element].rare);
    assert.equal(resource.chromatic, true);
    assert.equal(resource.element, element);
    assert.equal(core.element, element);
    assert.equal(core.chromatic, false);
    assert.equal(s.bag.length, 2);
  }
  for (const [choice, element] of [
    [0.1, "water"],
    [0.9, "earth"],
  ]) {
    const s = createSandbox(),
      m = createMonster("depths-water-slime", 100, 100, 5);
    m.dualElement = true;
    rewardMonster(s, m, rng([choice, 0.9, 0.9, 0.01]));
    assert.ok(s.bag.some((i) => i.name === SLIME_RESOURCES[element].normal));
    assert.ok(s.bag.some((i) => i.kind === "core" && i.element === element));
  }
});
test("même élément, même pile ; rareté et chromatique restent séparées", () => {
  const s = createSandbox();
  for (const source of ["slime", "marsh-slime", "depths-water-slime"])
    grantLoot(s, "normal", false, source);
  assert.equal(s.bag.length, 1);
  assert.equal(s.bag[0].quantity, 3);
  grantLoot(s, "rare", false, "slime");
  grantLoot(s, "rare", true, "depths-water-slime");
  grantLoot(s, "normal", true, "marsh-slime");
  assert.equal(s.bag.length, 4);
  assert.ok(s.bag.every((i) => i.element === "water"));
});
test("boss : aucune ressource ni noyau, même depuis les outils dev ; XP/or restent uniques", () => {
  for (const def of MONSTERS.filter((m) => m.boss)) {
    const s = createSandbox(),
      b = createMonster(def.id, 100, 100, 8),
      bag = structuredClone(s.bag),
      gold = s.gold;
    assert.deepEqual(monsterLoot(def.id), []);
    assert.equal(def.normal, null);
    assert.equal(def.rare, null);
    assert.equal(grantLoot(s, "normal", false, def.id), false);
    assert.equal(grantLoot(s, "rare", true, def.id), false);
    rewardMonster(s, b, () => 0);
    assert.deepEqual(s.bag, bag);
    assert.equal(s.gold, gold + b.gold);
    const awardedGold = s.gold;
    rewardMonster(s, b, () => 0);
    assert.equal(s.gold, awardedGold);
    const html = renderBestiary(def.id, 8);
    assert.ok(html.includes("Aucun butin pour le moment"));
    assert.ok(!html.includes('class="monster-loot '));
    assert.ok(!html.includes("bestiary-core"));
    assert.ok(!coreDropMarkup(def.id, 8).includes("garanti"));
  }
});
test("recettes et familier Eau suivent les ressources communes des zones de donjon", () => {
  assert.equal(petDefinition("water").food, "Cœur d’eau");
  assert.deepEqual(
    KEY_RECIPES["slime-depths"].ingredients.slice(1).map((i) => i.name),
    ["Cœur d’eau", "Cœur de terre"],
  );
  assert.deepEqual(
    KEY_RECIPES["slime-volcano"].ingredients.slice(1).map((i) => i.name),
    ["Cœur de feu", "Cœur de terre"],
  );
  const s = createSandbox();
  teleport(s, "bricoleur");
  addWoodItem(s, "chestnut", "plank", 5);
  grantLoot(s, "rare", false, "depths-water-slime");
  grantLoot(s, "rare", false, "depths-earth-slime");
  assert.ok(craftDungeonKeys(s));
});
test("les monstres hors Slime conservent leurs ressources ; huit dessins élémentaires distincts", () => {
  assert.equal(monsterDefinition("boar").normal, "Soie de sanglier");
  assert.equal(monsterDefinition("firefly").rare, "Étincelle vive");
  assert.equal(monsterDefinition("moth").rare, "Aile de zéphyr");
  const icons = [];
  for (const r of Object.values(SLIME_RESOURCES))
    for (const name of [r.normal, r.rare]) {
      const a = renderItemIcon({ name }),
        b = renderItemIcon({ name, chromatic: true });
      assert.match(a, /<svg/);
      assert.notEqual(a, b);
      assert.equal(/NaN|undefined/.test(a + b), false);
      icons.push(a);
    }
  assert.equal(new Set(icons).size, 8);
});
