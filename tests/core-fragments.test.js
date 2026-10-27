import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  teleport,
  equip,
  openCore,
} from "../src/dev/sandbox.js";
import { STARTER_SETS, syncEquipmentHealth } from "../src/data/equipment.js";
import {
  fragmentForEquipment,
  fragmentCount,
} from "../src/data/core-fragments.js";
import { recycleEquipment, exchangeCoreFragments } from "../src/game/forge.js";
const gear = (s, piece) => {
  const item = {
    ...piece,
    stats: { ...piece.stats },
    quantity: 1,
    chromatic: false,
    id: s.nextItem++,
  };
  s.bag.push(item);
  return item;
};
test("recyclage : toutes les pièces normales, un fragment du même élément ; chromatiques, trophées et familiers refusés", () => {
  const s = createSandbox();
  teleport(s, "forge");
  for (const set of STARTER_SETS)
    for (const piece of set.pieces) {
      const item = gear(s, piece);
      const previous = fragmentCount(s, set.element);
      const fragment = recycleEquipment(s, item.id);
      assert.equal(fragment.element, set.element);
      assert.equal(fragmentCount(s, set.element), previous + 1);
      assert.equal(
        s.bag.some((i) => i.id === item.id),
        false,
      );
      assert.equal(recycleEquipment(s, item.id), null);
    }
  for (const piece of [
    { ...STARTER_SETS[0].pieces[0], chromatic: true },
    { slot: "Familier", element: "earth" },
    { slot: "Trophée 1", element: "earth" },
  ])
    assert.equal(fragmentForEquipment(piece), null);
  const item = gear(s, STARTER_SETS[0].pieces[0]);
  item.chromatic = true;
  assert.equal(recycleEquipment(s, item.id), null);
  assert.ok(s.bag.includes(item));
});
test("10 fragments : consommation exacte, aucune combinaison entre éléments ou tranches et ouverture partout", () => {
  const s = createSandbox();
  teleport(s, "forge");
  const add = (element, level, count) => {
    for (let i = 0; i < count; i++)
      recycleEquipment(
        s,
        gear(s, {
          ...STARTER_SETS.find((set) => set.element === element).pieces[0],
          requiredLevel: level,
        }).id,
      );
  };
  add("fire", 1, 9);
  add("earth", 1, 1);
  add("fire", 11, 1);
  const before = structuredClone(s.bag);
  assert.equal(exchangeCoreFragments(s, "fire", 1), null);
  assert.deepEqual(s.bag, before);
  add("fire", 1, 3);
  const core = exchangeCoreFragments(s, "fire", 1);
  assert.equal(core.element, "fire");
  assert.deepEqual(core.band, { min: 1, max: 10 });
  assert.equal(fragmentCount(s, "fire"), 2);
  assert.equal(fragmentCount(s, "earth"), 1);
  assert.equal(fragmentCount(s, "fire", 11), 1);
  const unchanged = structuredClone(s.bag);
  assert.equal(exchangeCoreFragments(s, "fire", 0), null);
  assert.equal(exchangeCoreFragments(s, "fire", 2), null);
  assert.deepEqual(s.bag, unchanged);
  teleport(s, "combat");
  assert.equal(openCore(s, core.id, () => 0).element, "fire");
});
test("pièce équipée : retrait réel, recalcul des PV sans soin ; aucun échange loin du forgeron", () => {
  const s = createSandbox();
  const item = gear(s, STARTER_SETS[0].pieces[0]);
  equip(s, item.id);
  s.team[0].hp = 103;
  syncEquipmentHealth(s.team[0]);
  const before = structuredClone(s);
  assert.equal(recycleEquipment(s, item.id), null);
  assert.deepEqual(s, before);
  teleport(s, "forge");
  recycleEquipment(s, item.id);
  assert.equal(s.team[0].equipment.Coiffe, undefined);
  assert.equal(s.team[0].maxHp, 100);
  assert.equal(s.team[0].hp, 100);
  for (let i = 0; i < 9; i++)
    recycleEquipment(s, gear(s, STARTER_SETS[0].pieces[0]).id);
  teleport(s, "combat");
  const bag = structuredClone(s.bag);
  assert.equal(exchangeCoreFragments(s, "earth"), null);
  assert.deepEqual(s.bag, bag);
  assert.equal(s.gold, 0);
});
