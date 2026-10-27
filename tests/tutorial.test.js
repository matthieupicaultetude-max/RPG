import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  chooseMain,
  rewardMonster,
} from "../src/dev/sandbox.js";
import {
  beginTutorial,
  startTutorialFight,
  stepTutorial,
  finishTutorial,
} from "../src/game/tutorial.js";
import { allocateCharacteristic } from "../src/data/progression.js";

test("tutoriel : classes, déplacement réel, combat, niveau et points", () => {
  const s = createSandbox(),
    original = s.monsters;
  assert.equal(beginTutorial(s), true);
  assert.equal(beginTutorial(s), false);
  assert.equal(s.monsters.length, 0);
  chooseMain(s, 1);
  stepTutorial(s);
  chooseMain(s, 2);
  stepTutorial(s);
  assert.equal(s.tutorial.visited.length, 3);
  s.tutorial.step = "move";
  s.tutorial.previous = { ...s.player };
  s.player.x += 100;
  stepTutorial(s);
  assert.equal(s.tutorial.distance, 0);
  for (let i = 0; i < 12; i++) {
    s.player.x += 5;
    stepTutorial(s);
  }
  assert.equal(s.tutorial.step, "ready");
  assert.equal(startTutorialFight(s), true);
  assert.equal(startTutorialFight(s), false);
  const m = s.monsters[0];
  assert.equal(m.damage, 2);
  m.hp = 0;
  rewardMonster(s, m, () => 0.9);
  stepTutorial(s);
  assert.equal(s.tutorial.step, "stats");
  assert.ok(s.team.every((m) => m.level === 2 && m.characteristicPoints === 5));
  const gold = s.gold;
  rewardMonster(s, m);
  assert.equal(s.gold, gold);
  allocateCharacteristic(s, "Intelligence", 5);
  stepTutorial(s);
  assert.equal(s.tutorial.step, "spells");
  assert.equal(s.team[s.main].loadout[1], null);
  s.team[s.main].loadout[1] = "ranged-fire-0";
  stepTutorial(s);
  assert.equal(s.tutorial.spellRead, true);
  finishTutorial(s);
  assert.equal(s.monsters, original);
  assert.equal(s.tutorial.step, "done");
  assert.equal(s.team[s.main].level, 2);
});
test("passer le tutoriel restaure les monstres sans récompense gratuite", () => {
  const s = createSandbox(),
    original = s.monsters;
  beginTutorial(s);
  finishTutorial(s, true);
  finishTutorial(s, true);
  assert.equal(s.monsters, original);
  assert.equal(s.tutorial.step, "skipped");
  assert.ok(s.team.every((m) => m.level === 1 && m.xp === 0));
  assert.equal(s.gold, 0);
});

for (const slot of [0, 1, 2])
  test(`tutoriel : le sort Feu valide l’étape dans l’emplacement ${slot + 1}`, async () => {
    const { equipSpell } = await import("../src/data/spells.js");
    const s = createSandbox();
    beginTutorial(s);
    s.team[0].level = 2;
    Object.assign(s.tutorial, { step: "spells", manualSpell: true, member: 0 });
    assert.equal(equipSpell(s, 0, slot, "melee-fire-0"), true);
    stepTutorial(s);
    assert.equal(s.tutorial.spellRead, true);
    const loadout = [...s.team[0].loadout];
    finishTutorial(s);
    assert.deepEqual(s.team[0].loadout, loadout);
  });

test("zone tutoriel : apparition sur terre, bâtiments solides et passages accessibles", async () => {
  const map = await import("../src/world/tutorial-map.js");
  const { canWalkZone } = await import("../src/world/zones.js");
  const { findPath } = await import("../src/ai/companions.js");
  const { stepSandbox } = await import("../src/dev/sandbox.js");
  assert.deepEqual(map.validateMap(), []);
  const s = createSandbox();
  beginTutorial(s);
  assert.equal(s.zone, "tutorial");
  assert.deepEqual({ x: s.player.x, y: s.player.y }, map.TUTORIAL_SPAWN);
  assert.ok(s.team.every((m) => m.x === s.player.x && m.y === s.player.y));
  assert.equal(s.npcs[0].id, "iris");
  assert.equal(s.bots.length, 0);
  assert.equal(s.trees.length, 2);
  const walkable = (x, y) => canWalkZone(x, y, s.zone);
  assert.equal(walkable(135, 180), false);
  assert.equal(walkable(5, 100), false);
  for (const point of [
    map.TUTORIAL_SPAWN,
    map.TUTORIAL_COMBAT,
    map.TUTORIAL_MONSTER,
    map.TUTORIAL_EXIT,
  ])
    assert.equal(walkable(point.x, point.y), true);
  for (const [from, to] of [
    [map.TUTORIAL_SPAWN, map.TUTORIAL_COMBAT],
    [map.TUTORIAL_COMBAT, map.TUTORIAL_EXIT],
  ])
    assert.ok(findPath(from, to, walkable)?.length);
  Object.assign(s.player, { x: 135, y: 208 });
  Object.assign(s.team[s.main], s.player);
  for (let i = 0; i < 20; i++) stepSandbox(s, { x: 0, y: -1 }, 0.05);
  assert.ok(s.player.y >= 200);
  assert.equal(walkable(s.player.x, s.player.y), true);
});
test("sortie du tutoriel : village restauré et progression conservée", async () => {
  const { canWalkZone, nearTutorialExit } = await import(
    "../src/world/zones.js"
  );
  const { TUTORIAL_EXIT } = await import("../src/world/tutorial-map.js");
  const { nearFountain } = await import("../src/data/progression.js");
  const { nearForge } = await import("../src/game/forge.js");
  const { nearPetShop } = await import("../src/game/pet-quests.js");
  const { nearSawmill } = await import("../src/game/woodcutting.js");
  const s = createSandbox(),
    saved = {
      monsters: s.monsters,
      bots: s.bots,
      npcs: s.npcs,
      trees: s.trees,
    };
  beginTutorial(s);
  for (const check of [nearFountain, nearForge, nearPetShop, nearSawmill])
    assert.equal(check(s), false);
  Object.assign(s.player, TUTORIAL_EXIT);
  assert.equal(nearTutorialExit(s), true);
  s.team[0].level = 2;
  s.team[0].allocatedStats.Force = 5;
  s.bag.push({ id: 999, name: "Souvenir", quantity: 1 });
  finishTutorial(s);
  assert.equal(s.zone, "garden");
  for (const key of Object.keys(saved)) assert.equal(s[key], saved[key]);
  assert.equal(s.team[0].level, 2);
  assert.equal(s.team[0].allocatedStats.Force, 5);
  assert.equal(s.bag[0].name, "Souvenir");
  assert.equal(canWalkZone(s.player.x, s.player.y, s.zone), true);
  assert.equal(nearTutorialExit(s), false);
});

test("suite du guide : bestiaire vérifié, noyau garanti, armure et vrais crafts de métier", async () => {
  const {
    advanceTutorial,
    inspectTutorialMonster,
    visitTutorialPanel,
    approachTutorialSawmill,
    canLeaveTutorial,
  } = await import("../src/game/tutorial.js");
  const { openCore, equip, stepSandbox } = await import(
    "../src/dev/sandbox.js"
  );
  const { equipSpell } = await import("../src/data/spells.js");
  const { requestCut, craftPlanks, woodQuantity } = await import(
    "../src/game/woodcutting.js"
  );
  const { canWalkZone } = await import("../src/world/zones.js");
  const s = createSandbox(),
    originalTrees = s.trees;
  beginTutorial(s);
  s.tutorial.step = "ready";
  startTutorialFight(s);
  s.monsters[0].hp = 0;
  rewardMonster(s, s.monsters[0], () => 0.99);
  stepTutorial(s);
  const core = s.bag.find((item) => item.id === s.tutorial.coreId);
  assert.equal(core.element, "water");
  assert.equal(core.quantity, 1);
  const count = s.bag.length;
  rewardMonster(s, s.monsters[0]);
  assert.equal(s.bag.length, count);
  allocateCharacteristic(s, "Chance", 5);
  stepTutorial(s);
  equipSpell(s, 0, 2, "melee-fire-0");
  stepTutorial(s);
  assert.equal(advanceTutorial(s), true);
  assert.equal(s.tutorial.step, "bestiary");
  assert.equal(canLeaveTutorial(s), false);
  assert.equal(advanceTutorial(s), false);
  inspectTutorialMonster(s, "boar", 20);
  assert.equal(advanceTutorial(s), false);
  inspectTutorialMonster(s, "slime", 1);
  assert.equal(advanceTutorial(s), false);
  inspectTutorialMonster(s, "slime", 10);
  assert.equal(advanceTutorial(s), true);
  assert.equal(s.tutorial.step, "loot");
  const item = openCore(s, core.id, () => 0.2);
  stepTutorial(s);
  assert.equal(s.tutorial.step, "armor");
  assert.equal(s.tutorial.armorId, item.id);
  equip(s, item.id);
  stepTutorial(s);
  assert.equal(s.tutorial.step, "professions");
  assert.equal(advanceTutorial(s), false);
  visitTutorialPanel(s, "equipment");
  assert.equal(advanceTutorial(s), false);
  visitTutorialPanel(s, "professions");
  assert.equal(advanceTutorial(s), true);
  const canStand = (x, y) => canWalkZone(x, y, s.zone);
  for (const [i, tree] of s.trees.entries()) {
    assert.equal(requestCut(s, tree.id, canStand), true);
    for (let n = 0; n < 400 && s.woodcutting.action; n++) {
      stepSandbox(s, { x: 0, y: 0 }, 0.05);
      stepTutorial(s);
    }
    assert.equal(s.tutorial.harvested, i + 1);
    assert.ok(tree.respawn > 0);
  }
  assert.equal(s.tutorial.step, "craft");
  assert.equal(woodQuantity(s, "ash"), 2);
  assert.equal(canLeaveTutorial(s), false);
  assert.equal(approachTutorialSawmill(s), true);
  assert.equal(craftPlanks(s, "ash", 1), true);
  stepTutorial(s);
  assert.equal(s.tutorial.step, "complete");
  assert.equal(canLeaveTutorial(s), true);
  assert.equal(woodQuantity(s, "ash"), 0);
  assert.equal(woodQuantity(s, "ash", "plank"), 1);
  const job = structuredClone(s.woodcutting);
  finishTutorial(s);
  assert.equal(s.trees, originalTrees);
  assert.deepEqual(s.woodcutting, job);
  assert.equal(s.team[0].equipment[item.slot].id, item.id);
});
