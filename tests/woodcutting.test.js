import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  canStand,
  stepSandbox,
  teleport,
  castEquipped,
  chooseMain,
  grantCore,
  openCore,
  grantLoot,
} from "../src/dev/sandbox.js";
import {
  requestCut,
  craftPlanks,
  addWoodItem,
  grantWoodcuttingXp,
  woodQuantity,
  treeAt,
} from "../src/game/woodcutting.js";
import { cuttingDuration, woodItem } from "../src/data/woodcutting.js";
import { upgradeChromatic } from "../src/game/forge.js";
const simulate = (s, seconds) => {
  for (let i = 0; i < Math.ceil(seconds * 60); i++)
    stepSandbox(s, { x: 0, y: 0 }, 1 / 60);
};
function setup() {
  const s = createSandbox();
  s.monsters = [];
  teleport(s, "bucheron");
  return s;
}

test("coupe au clic : déplacement sans traverser les obstacles, récolte retardée, souche et repousse", () => {
  const s = createSandbox();
  s.monsters = [];
  const tree = s.trees[0];
  assert.equal(treeAt(s, { x: tree.x, y: tree.y - 43 }).id, tree.id);
  assert.equal(requestCut(s, tree.id, canStand), true);
  assert.equal(woodQuantity(s, "ash"), 0);
  for (let i = 0; i < 600 && s.woodcutting.action; i++) {
    stepSandbox(s, { x: 0, y: 0 }, 1 / 60);
    assert.ok(canStand(s.player.x, s.player.y));
  }
  assert.equal(woodQuantity(s, "ash"), 1);
  assert.equal(s.woodcutting.xp, 15);
  assert.ok(tree.respawn > 0);
  assert.equal(requestCut(s, tree.id, canStand), false);
  simulate(s, 31);
  assert.equal(tree.respawn, 0);
  assert.equal(canStand(tree.x, tree.y), false);
});
test("interruption : déplacement, sort, changement de personnage et décès ne donnent pas de bois", () => {
  for (const cancel of [
    (s) => stepSandbox(s, { x: 1, y: 0 }, 0.05),
    (s) => castEquipped(s, 0),
    (s) => chooseMain(s, 1),
    (s) => {
      s.team[0].hp = 0;
      stepSandbox(s, { x: 0, y: 0 }, 0.05);
    },
  ]) {
    const s = setup();
    requestCut(s, s.trees[0].id, canStand);
    simulate(s, 0.7);
    cancel(s);
    simulate(s, 5);
    assert.equal(woodQuantity(s, "ash"), 0);
    assert.equal(s.woodcutting.action, null);
  }
});
test("niveaux métier 1/5/10 et accélération avec plancher ; XP indépendante des personnages", () => {
  const s = setup(),
    chest = s.trees.find((t) => t.wood === "chestnut"),
    walnut = s.trees.find((t) => t.wood === "walnut");
  assert.equal(requestCut(s, chest.id, canStand), false);
  grantWoodcuttingXp(s, 300);
  assert.equal(s.woodcutting.level, 5);
  assert.equal(s.woodcutting.xp, 0);
  assert.equal(requestCut(s, chest.id, canStand), true);
  assert.equal(requestCut(s, walnut.id, canStand), false);
  grantWoodcuttingXp(s, 1050);
  assert.equal(s.woodcutting.level, 10);
  assert.equal(requestCut(s, walnut.id, canStand), true);
  assert.ok(cuttingDuration(10) < cuttingDuration(1));
  assert.equal(cuttingDuration(1000), 1);
  assert.ok(s.team.every((member) => member.level === 1 && member.xp === 0));
});
test("planches : scierie obligatoire, 2 bois par planche, lots et XP de craft sans bois chromatique", () => {
  const s = setup();
  addWoodItem(s, "ash", "wood", 12);
  const before = JSON.stringify(s.bag);
  assert.equal(craftPlanks(s, "ash", 5), false);
  assert.equal(JSON.stringify(s.bag), before);
  teleport(s, "scierie");
  assert.equal(craftPlanks(s, "ash", 5), true);
  assert.equal(woodQuantity(s, "ash"), 2);
  assert.equal(woodQuantity(s, "ash", "plank"), 5);
  assert.equal(s.woodcutting.level, 2);
  assert.equal(s.woodcutting.xp, 20);
  assert.ok(s.bag.every((item) => !item.chromatic));
  for (const n of [0, -1, 1.5, NaN, Infinity, 100])
    assert.equal(craftPlanks(s, "ash", n), false);
  addWoodItem(s, "chestnut", "wood", 2);
  assert.equal(craftPlanks(s, "chestnut", 1), false);
  assert.equal(woodItem("walnut").chromatic, false);
});
test("armure : cinq planches de niveau 1 exigées, ni bois brut ni planches de niveau supérieur ne remplacent la recette", () => {
  const s = setup();
  teleport(s, "forge");
  grantCore(s, "earth");
  const gear = openCore(s, s.bag[0].id, () => 0);
  grantLoot(s, "normal", true, "boar");
  for (let i = 0; i < 10; i++) grantLoot(s, "normal", false, "boar");
  for (let i = 0; i < 5; i++) grantLoot(s, "rare", false, "boar");
  addWoodItem(s, "ash", "wood", 10);
  addWoodItem(s, "walnut", "plank", 5);
  const before = JSON.stringify(s.bag);
  assert.equal(upgradeChromatic(s, gear.id), null);
  assert.equal(JSON.stringify(s.bag), before);
  teleport(s, "scierie");
  craftPlanks(s, "ash", 5);
  teleport(s, "forge");
  assert.equal(upgradeChromatic(s, gear.id), gear);
  assert.equal(woodQuantity(s, "ash", "plank"), 0);
  assert.equal(woodQuantity(s, "walnut", "plank"), 5);
  assert.equal(gear.chromatic, true);
});

test("un dégât reçu pendant la récolte annule la coupe sans récompense", async () => {
  const { createMonster } = await import("../src/data/monsters.js");
  const s = setup();
  s.monsters = [createMonster("slime", s.player.x + 5, s.player.y)];
  requestCut(s, s.trees[0].id, canStand);
  simulate(s, 0.2);
  assert.ok(s.team[0].hp < 100);
  assert.equal(s.woodcutting.action, null);
  assert.equal(woodQuantity(s, "ash"), 0);
  assert.equal(s.woodcutting.xp, 0);
});
