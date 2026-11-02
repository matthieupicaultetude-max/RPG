import test from "node:test";
import assert from "node:assert/strict";
import {
  newQuest,
  newObjective,
  validateQuestContent,
} from "../src/data/quest-schema.js";
import {
  CUSTOM_QUESTS,
  CUSTOM_QUEST_NPCS,
} from "../src/world/custom-quests.js";
import {
  acceptQuest,
  advanceQuest,
  questEvent,
  stageReady,
  questRecord,
  questAvailable,
  abandonQuest,
  updateQuestVisits,
} from "../src/game/custom-quests.js";
import { createSandbox, grantXp } from "../src/dev/sandbox.js";
import { captureMap, applyMap } from "../src/dev/map-editor-model.js";
import { SERVICES } from "../src/world/exile-map.js";
import { DEV_ITEMS } from "../src/data/dev-items.js";
import {
  progressSnapshot,
  decodeSave,
  restoreProgress,
} from "../src/game/browser-save.js";
const giver = Object.values(SERVICES)[0];
function setup() {
  const s = createSandbox();
  s.zone = "exile";
  s.npcs = [{ ...giver }];
  Object.assign(s.player, { x: giver.x, y: giver.y });
  const q = newQuest(giver.id);
  q.enabled = true;
  q.rewards = { gold: 20, xp: 10, items: [] };
  CUSTOM_QUESTS.splice(0, CUSTOM_QUESTS.length, q);
  return { s, q };
}
test("sequential objectives, proximity, reward exactly once and saved quest progress", () => {
  const { s, q } = setup();
  q.stages[0].objectives = [newObjective("kill", "slime")];
  questEvent(s, "kill", "slime");
  assert.equal(acceptQuest(s, q.id), true);
  assert.equal(stageReady(s, q), false);
  questEvent(s, "kill", "slime");
  assert.equal(stageReady(s, q), true);
  s.player.x += 100;
  assert.equal(advanceQuest(s, q.id, grantXp), false);
  s.player.x -= 100;
  assert.equal(advanceQuest(s, q.id, grantXp), true);
  assert.equal(s.gold, 20);
  assert.equal(s.team[0].xp, 10);
  assert.equal(advanceQuest(s, q.id, grantXp), false);
  assert.equal(acceptQuest(s, q.id), false);
  const restored = createSandbox();
  restoreProgress(restored, decodeSave(JSON.stringify(progressSnapshot(s))));
  assert.equal(restored.customQuests[q.id].status, "completed");
  assert.equal(restored.customQuests[q.id].runs, 1);
  CUSTOM_QUESTS.length = 0;
});
test("collect hand-in aggregates duplicate requirements and consumes atomically", () => {
  const { s, q } = setup();
  const entry =
    DEV_ITEMS.find((i) => i.item.kind === "resource") || DEV_ITEMS[0];
  s.bag = [{ ...structuredClone(entry.item), id: 1, quantity: 3 }];
  q.stages[0].objectives = [
    { ...newObjective("collect", entry.key), amount: 2, consume: true },
    { ...newObjective("collect", entry.key), amount: 2, consume: true },
  ];
  acceptQuest(s, q.id);
  assert.equal(stageReady(s, q), false);
  assert.equal(advanceQuest(s, q.id), false);
  assert.equal(s.bag[0].quantity, 3);
  s.bag[0].quantity = 5;
  assert.equal(advanceQuest(s, q.id), true);
  assert.equal(s.bag[0].quantity, 1);
  CUSTOM_QUESTS.length = 0;
});
test("visits, stages, prerequisites, cooldown and abandonment", () => {
  const { s, q } = setup();
  q.repeatable = true;
  q.cooldown = 60;
  q.stages[0].objectives = [
    { ...newObjective("visit"), zone: "exile", x: giver.x, y: giver.y },
  ];
  q.stages.push({
    ...structuredClone(q.stages[0]),
    id: "second",
    objectives: [newObjective("talk", giver.id)],
  });
  assert.equal(acceptQuest(s, q.id, 1000), true);
  updateQuestVisits(s);
  assert.equal(stageReady(s, q), true);
  assert.equal(
    advanceQuest(s, q.id, () => {}, 2000),
    true,
  );
  assert.equal(questRecord(s, q).stage, 1);
  assert.equal(
    advanceQuest(s, q.id, () => {}, 3000),
    true,
  );
  assert.equal(questAvailable(s, q, 4000), false);
  assert.equal(questAvailable(s, q, 63000), true);
  assert.equal(acceptQuest(s, q.id, 64000), true);
  abandonQuest(s, q.id);
  assert.equal(questRecord(s, q).completedAt, 3000);
  assert.equal(questRecord(s, q).runs, 1);
  const next = newQuest(giver.id);
  next.id = "followup";
  next.enabled = true;
  next.prerequisites = [q.id];
  assert.equal(questAvailable(s, next, 65000), true);
  CUSTOM_QUESTS.length = 0;
});
test("editing active definition resets counters without deleting completion history", () => {
  const { s, q } = setup();
  q.stages[0].objectives = [newObjective("kill", "slime")];
  acceptQuest(s, q.id);
  questEvent(s, "kill", "slime");
  q.title = "Changed";
  assert.equal(stageReady(s, q), false);
  assert.deepEqual(questRecord(s, q).counts, {});
  CUSTOM_QUESTS.length = 0;
});
test("schema rejects bad refs, cycles, duplicate NPCs and unknown monsters", () => {
  const q = newQuest(giver.id);
  q.enabled = true;
  const ids = Object.values(SERVICES).map((n) => n.id);
  assert.equal(validateQuestContent([q], [], ids), true);
  q.stages[0].objectives = [newObjective("kill", "slime")];
  assert.equal(validateQuestContent([q], [], ids), true);
  q.stages[0].objectives[0].target = "missing";
  assert.throws(() => validateQuestContent([q], [], ids), /cible/);
  q.enabled = false;
  assert.equal(validateQuestContent([q], [], ids), true);
  const b = newQuest(giver.id);
  b.id = "second";
  q.prerequisites = [b.id];
  b.prerequisites = [q.id];
  assert.throws(() => validateQuestContent([q, b], [], ids), /Cycle/);
});
test("map roundtrip, legacy documents and rollback on inaccessible quest NPC", () => {
  CUSTOM_QUESTS.length = 0;
  const baseline = captureMap();
  try {
    const doc = structuredClone(baseline),
      q = newQuest(giver.id);
    q.enabled = true;
    doc.quests = [q];
    doc.npcs = [
      {
        id: "quest-person",
        name: "Auteur",
        greeting: "Bonjour",
        role: "support",
        x: 720,
        y: 710,
      },
    ];
    applyMap(doc);
    assert.equal(captureMap().quests[0].title, q.title);
    assert.equal(CUSTOM_QUEST_NPCS.length, 1);
    const bad = captureMap();
    bad.npcs[0].x = 20;
    bad.npcs[0].y = 1200;
    assert.throws(() => applyMap(bad), /inaccessible/);
    assert.equal(CUSTOM_QUEST_NPCS[0].x, 720);
    const legacy = structuredClone(baseline);
    delete legacy.quests;
    delete legacy.npcs;
    applyMap(legacy);
    assert.equal(CUSTOM_QUESTS.length, 0);
  } finally {
    applyMap(baseline);
  }
});

test("real combat and profession hooks count only successful actions", async () => {
  const { rewardMonster, teleport, stepSandbox } = await import(
    "../src/dev/sandbox.js"
  );
  const { requestCut, craftPlanks, addWoodItem } = await import(
    "../src/game/woodcutting.js"
  );
  const { createMonster } = await import("../src/data/monsters.js");
  const { s, q } = setup();
  q.stages[0].objectives = [
    newObjective("kill", "slime"),
    newObjective("harvest", "ash"),
    newObjective("craft", "plank:ash"),
  ];
  acceptQuest(s, q.id);
  const monster = createMonster("slime", 455, 220);
  rewardMonster(s, { ...monster, volcanoSummon: true });
  assert.equal(questRecord(s, q).counts[q.stages[0].objectives[0].id] || 0, 0);
  rewardMonster(s, monster, () => 0.5);
  assert.equal(questRecord(s, q).counts[q.stages[0].objectives[0].id], 1);
  s.zone = "garden";
  teleport(s, "bucheron");
  s.monsters = [];
  assert.equal(
    requestCut(s, s.trees[0].id, () => true),
    true,
  );
  for (let i = 0; i < 600 && s.woodcutting.action; i++)
    stepSandbox(s, { x: 0, y: 0 }, 1 / 60);
  assert.equal(questRecord(s, q).counts[q.stages[0].objectives[1].id], 1);
  teleport(s, "scierie");
  addWoodItem(s, "ash", "wood", 2);
  assert.equal(craftPlanks(s, "ash", 1), true);
  assert.equal(questRecord(s, q).counts[q.stages[0].objectives[2].id], 1);
  CUSTOM_QUESTS.length = 0;
});
test("item rewards stack and malformed progress is rejected without changing old save compatibility", () => {
  const { s, q } = setup();
  q.rewards.items = [{ key: DEV_ITEMS[0].key, quantity: 3 }];
  acceptQuest(s, q.id);
  assert.equal(advanceQuest(s, q.id), true);
  assert.equal(s.bag[0].quantity, 3);
  assert.equal(advanceQuest(s, q.id), false);
  const save = progressSnapshot(s);
  save.progress.customQuests[q.id].counts.bad = -1;
  assert.throws(
    () => decodeSave(JSON.stringify(save)),
    /invalid-custom-quests/,
  );
  delete save.progress.customQuests;
  assert.ok(decodeSave(JSON.stringify(save)));
  CUSTOM_QUESTS.length = 0;
});
