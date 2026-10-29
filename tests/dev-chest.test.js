import test from "node:test";
import assert from "node:assert/strict";
import { DEV_ITEMS } from "../src/data/dev-items.js";
import { ALL_SETS } from "../src/data/equipment.js";
import { ALL_PETS, createPet } from "../src/data/pets.js";
import { KEY_RECIPES } from "../src/data/handyman.js";
import { createSandbox, equip, unequip } from "../src/dev/sandbox.js";
import {
  nearDevChest,
  devChestStock,
  withdrawDevItem,
  withdrawAllDevItems,
  refillDevChest,
} from "../src/game/dev-chest.js";
import { DEV_CHEST, DEV_CHEST_APPROACH } from "../src/world/dev-chest.js";
import { canWalkMap, validateMap } from "../src/world/map.js";
import { findPath } from "../src/ai/companions.js";
import { stackKey, putInBag } from "../src/game/item-stacks.js";
import { upgradeChromatic, recycleEquipment } from "../src/game/forge.js";
import { feedPet } from "../src/game/pet-quests.js";
import { HYBRID_SLIMES } from "../src/data/hybrid-slimes.js";
import { createBrowserSave } from "../src/game/browser-save.js";
import { beginTutorial, finishTutorial } from "../src/game/tutorial.js";
import { renderDevChest } from "../src/ui/dev-chest.js";
const fixture = () => {
  const s = createSandbox();
  Object.assign(s.player, DEV_CHEST_APPROACH);
  return s;
};
const entry = (predicate) => DEV_ITEMS.find((e) => predicate(e.item));
const take = (s, predicate, q = 99) =>
  withdrawDevItem(s, entry(predicate).key, q);

test("dev chest: catalogue covers all actual sets/variants, pets, keys and resources without duplicates", () => {
  assert.equal(DEV_ITEMS.length, 247);
  assert.equal(new Set(DEV_ITEMS.map((e) => e.key)).size, DEV_ITEMS.length);
  assert.equal(
    new Set(DEV_ITEMS.map((e) => stackKey(e.item))).size,
    DEV_ITEMS.length,
  );
  assert.equal(
    DEV_ITEMS.filter((e) => e.item.slot && e.item.setId).length,
    ALL_SETS.length * 9 * 2,
  );
  for (const p of ALL_PETS)
    assert.ok(DEV_ITEMS.some((e) => e.item.petId === p.id));
  for (const id of Object.keys(KEY_RECIPES))
    assert.ok(DEV_ITEMS.some((e) => e.item.dungeonId === id));
  assert.equal(
    DEV_ITEMS.filter((e) => e.item.kind === "royal-key-part").length,
    4,
  );
  assert.equal(
    DEV_ITEMS.filter((e) => e.item.kind === "wood" || e.item.kind === "plank")
      .length,
    6,
  );
});

test("dev chest: physical footprint is off roads, blocked and reachable from home", () => {
  assert.deepEqual(validateMap(), []);
  assert.equal(canWalkMap(DEV_CHEST.x, DEV_CHEST.y), false);
  assert.equal(canWalkMap(DEV_CHEST_APPROACH.x, DEV_CHEST_APPROACH.y), true);
  assert.ok(
    findPath({ x: 110, y: 155 }, DEV_CHEST_APPROACH, canWalkMap).length,
  );
});

test("dev chest: finite stacks of 99, quantity validation and proximity including zone/death", () => {
  const s = fixture(),
    e = DEV_ITEMS[0];
  assert.equal(nearDevChest(s), true);
  assert.equal(devChestStock(s)[e.key], 99);
  for (const q of [0, -1, 100, NaN, 1.5, "1"])
    assert.equal(withdrawDevItem(s, e.key, q), null);
  assert.equal(s.bag.length, 0);
  const item = withdrawDevItem(s, e.key, 20);
  assert.equal(item.quantity, 20);
  assert.equal(s.devChest[e.key], 79);
  assert.equal(withdrawDevItem(s, e.key, 99).quantity, 99);
  assert.equal(s.bag.length, 1);
  assert.equal(s.devChest[e.key], 0);
  assert.equal(withdrawDevItem(s, e.key, 1), null);
  for (const zone of ["tutorial", "slime-marsh", "slime-volcano"]) {
    s.zone = zone;
    assert.equal(withdrawDevItem(s, DEV_ITEMS[1].key), null);
  }
  s.zone = "garden";
  s.team[0].hp = 0;
  assert.equal(withdrawAllDevItems(s), 0);
  s.team[0].hp = 100;
  s.player.x = 500;
  assert.equal(refillDevChest(s), false);
});

test("dev chest: take all creates one 99-stack per entry, refill merges instead of duplicating piles", () => {
  const s = fixture();
  assert.equal(withdrawAllDevItems(s), DEV_ITEMS.length);
  assert.equal(s.bag.length, DEV_ITEMS.length);
  assert.ok(s.bag.every((i) => i.quantity === 99));
  assert.ok(Object.values(s.devChest).every((n) => n === 0));
  assert.equal(withdrawAllDevItems(s), 0);
  refillDevChest(s);
  withdrawAllDevItems(s);
  assert.equal(s.bag.length, DEV_ITEMS.length);
  assert.ok(s.bag.every((i) => i.quantity === 198));
  assert.equal(new Set(s.bag.map((i) => i.id)).size, s.bag.length);
});

test("dev chest: equip splits exactly one with independent stats/id, swapping and unequipping restack", () => {
  const s = fixture(),
    pile = take(
      s,
      (i) => i.setId === "water" && i.slot === "Coiffe" && !i.chromatic,
    );
  const worn = equip(s, pile.id);
  assert.equal(pile.quantity, 98);
  assert.equal(worn.quantity, 1);
  assert.notEqual(pile.id, worn.id);
  assert.notEqual(pile.stats, worn.stats);
  assert.equal(s.team[1].equipment.Coiffe, undefined);
  unequip(s, "Coiffe");
  assert.equal(s.bag.length, 1);
  assert.equal(pile.quantity, 99);
  assert.equal(s.team[0].equipment.Coiffe, undefined);
  const high = take(
    s,
    (i) => i.setId === "magma" && i.slot === "Coiffe" && !i.chromatic,
  );
  assert.equal(equip(s, high.id), undefined);
  assert.equal(high.quantity, 99);
});

test("dev chest: forging a stacked armour upgrades only one and merges with identical chromatic gear", () => {
  const s = fixture();
  const pile = take(
      s,
      (i) => i.setId === "magma" && i.slot === "Coiffe" && !i.chromatic,
    ),
    chroma = take(
      s,
      (i) => i.setId === "magma" && i.slot === "Coiffe" && i.chromatic,
    );
  take(s, (i) => i.kind === "wood" && i.wood === "walnut");
  take(
    s,
    (i) =>
      i.kind === "hybrid-resource" &&
      i.hybridId === "magma" &&
      i.type === "normal" &&
      i.chromatic,
  );
  Object.assign(s.player, { x: 212, y: 334 });
  const upgraded = upgradeChromatic(s, pile.id);
  assert.equal(upgraded.id, chroma.id);
  assert.equal(chroma.quantity, 100);
  assert.equal(pile.quantity, 98);
  assert.equal(pile.chromatic, false);
  assert.equal(pile.stats.Puissance, 1);
  assert.equal(chroma.stats.Puissance, 3);
  assert.equal(s.bag.find((i) => i.kind === "wood").quantity, 98);
  assert.equal(s.bag.find((i) => i.kind === "hybrid-resource").quantity, 98);
});

test("dev chest: missing forge supplies never split or consume the armour pile", () => {
  const s = fixture(),
    pile = take(
      s,
      (i) => i.setId === "magma" && i.slot === "Coiffe" && !i.chromatic,
    );
  Object.assign(s.player, { x: 212, y: 334 });
  const before = JSON.stringify(s.bag);
  assert.equal(upgradeChromatic(s, pile.id), null);
  assert.equal(JSON.stringify(s.bag), before);
});

test("dev chest: feeding one of 99 pets isolates its progression and keeps the other 98 unchanged", () => {
  const s = fixture(),
    pile = take(s, (i) => i.petId === "pet-magma");
  take(
    s,
    (i) =>
      i.kind === "hybrid-resource" &&
      i.hybridId === "magma" &&
      i.type === "rare" &&
      i.chromatic,
  );
  assert.equal(feedPet(s, pile.id), true);
  const fed = s.bag.find((i) => i.id === s.lastFedPetId);
  assert.equal(pile.quantity, 98);
  assert.equal(pile.level, 1);
  assert.equal(pile.xp, 0);
  assert.equal(fed.quantity, 1);
  assert.equal(fed.level, 2);
  assert.equal(fed.xp, 0);
  assert.notEqual(fed.stats, pile.stats);
  assert.equal(feedPet(s, pile.id), true);
  assert.equal(pile.quantity, 97);
  assert.equal(fed.quantity, 2);
  assert.equal(s.bag.filter((i) => i.kind === "pet").length, 2);
});

test("dev chest: recycling consumes one normal piece, not the whole stack", () => {
  const s = fixture(),
    pile = take(
      s,
      (i) => i.setId === "water" && i.slot === "Coiffe" && !i.chromatic,
    );
  Object.assign(s.player, { x: 212, y: 334 });
  recycleEquipment(s, pile.id);
  assert.equal(pile.quantity, 98);
  assert.equal(s.bag.find((i) => i.kind === "core-fragment").quantity, 1);
});

test("dev chest: identical objects merge regardless of field order, distinct pet XP never merges", () => {
  const s = fixture();
  const a = putInBag(
      s,
      { name: "Test", kind: "resource", stats: { Force: 2, Chance: 1 } },
      2,
    ),
    b = putInBag(
      s,
      {
        kind: "resource",
        stats: { Chance: 1, Force: 2 },
        name: "Test",
        chromatic: false,
      },
      3,
    );
  assert.equal(a.id, b.id);
  assert.equal(a.quantity, 5);
  const pet = createPet("water");
  putInBag(s, pet, 99);
  putInBag(s, { ...pet, xp: 5 }, 1);
  assert.equal(s.bag.filter((i) => i.kind === "pet").length, 2);
});

test("dev chest: stock and withdrawn stacks survive reload, old saves initialize a full chest", () => {
  const s = fixture();
  beginTutorial(s);
  finishTutorial(s, true);
  Object.assign(s.player, DEV_CHEST_APPROACH);
  withdrawDevItem(s, DEV_ITEMS[0].key, 20);
  const values = new Map(),
    storage = {
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => values.set(k, v),
    };
  assert.equal(createBrowserSave(s, storage).save(), true);
  const restored = createSandbox();
  createBrowserSave(restored, storage);
  assert.equal(devChestStock(restored)[DEV_ITEMS[0].key], 79);
  assert.equal(restored.bag[0].quantity, 20);
  const old = createSandbox();
  assert.equal(devChestStock(old)[DEV_ITEMS[0].key], 99);
});

test("dev chest: rendered catalogue exposes search, categories, count and mobile-safe controls", () => {
  const s = fixture(),
    markup = renderDevChest(s);
  assert.ok(markup.includes("247 objets"));
  assert.ok(markup.includes("99 / 99"));
  assert.ok(markup.includes("chest-search"));
  assert.ok(markup.includes("chest-take-all"));
  assert.equal(/undefined|NaN/.test(markup), false);
  const pets = renderDevChest(s, "pets");
  assert.equal(
    (pets.match(/data-dev-chest-item=/g) || []).length,
    ALL_PETS.length,
  );
});

test("dev chest: adoption consumes one certificate from a stack rather than all 99", async () => {
  const { acceptAdoption, claimPet } = await import(
    "../src/game/pet-quests.js"
  );
  const { SET_SLOTS } = await import("../src/data/equipment.js");
  const s = fixture(),
    certificate = take(
      s,
      (i) => i.kind === "certificate" && i.questId === "water",
    );
  s.collections.water = [...SET_SLOTS];
  Object.assign(s.player, { x: 268, y: 153 });
  assert.equal(acceptAdoption(s, "water"), true);
  const total = () =>
    s.bag
      .filter((i) => i.kind === "certificate" && i.questId === "water")
      .reduce((n, i) => n + i.quantity, 0);
  assert.equal(total(), 100);
  assert.ok(claimPet(s, "water"));
  assert.equal(total(), 99);
  assert.equal(certificate.quantity, 98);
});
