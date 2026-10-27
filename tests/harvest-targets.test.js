import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  teleport,
  canStand,
  stepSandbox,
} from "../src/dev/sandbox.js";
import {
  requestCut,
  woodQuantity,
  cancelWoodcutting,
} from "../src/game/woodcutting.js";
import { clickHarvestTarget } from "../src/game/harvest-targets.js";
import {
  BONUS_TARGET_DURATION,
  recordBonusOpportunity,
} from "../src/combat/bonus-targets.js";
const tick = (s, n) => {
  for (let i = 0; i < Math.ceil(n * 60); i++)
    stepSandbox(s, { x: 0, y: 0 }, 1 / 60);
};
function ready() {
  const s = createSandbox();
  s.monsters = [];
  teleport(s, "bucheron");
  requestCut(s, s.trees[0].id, canStand);
  for (let i = 0; i < 120 && !s.woodcutting.action?.target; i++)
    tick(s, 1 / 60);
  assert.ok(s.woodcutting.action?.target);
  return s;
}
test("durée commune : une seconde en combat et en récolte", () => {
  assert.equal(BONUS_TARGET_DURATION, 1);
  const s = ready();
  assert.equal(s.woodcutting.action.target.time, 1);
  const m = { x: 440, y: 240, hp: 100 };
  s.monsters = [m];
  recordBonusOpportunity(
    s,
    m,
    12,
    s.team[0],
    () => true,
    () => 0,
  );
  assert.equal(m.bonusTarget.time, 1);
});
test("cible de récolte : clic précis, progression +25 %, aucun bois ni XP gratuit, une utilisation", () => {
  const s = ready(),
    action = s.woodcutting.action,
    point = { ...action.target },
    before = action.progress;
  assert.equal(clickHarvestTarget(s, { x: point.x + 8, y: point.y }), false);
  assert.equal(clickHarvestTarget(s, point), true);
  assert.equal(action.progress, before + action.duration * 0.25);
  assert.equal(clickHarvestTarget(s, point), false);
  assert.equal(woodQuantity(s, "ash"), 0);
  assert.equal(s.woodcutting.xp, 0);
  tick(s, 2.1);
  assert.equal(woodQuantity(s, "ash"), 1);
  assert.equal(s.woodcutting.xp, 15);
});
test("une cible manquée expire sans pénalité et ne réapparaît pas pendant la même coupe", () => {
  const s = ready();
  tick(s, 1.1);
  assert.equal(s.woodcutting.action.target, undefined);
  assert.equal(woodQuantity(s, "ash"), 0);
  tick(s, 0.4);
  assert.equal(s.woodcutting.action.target, undefined);
  tick(s, 2);
  assert.equal(woodQuantity(s, "ash"), 1);
});
test("cible annulée ou expirée inutilisable", () => {
  const s = ready(),
    point = { ...s.woodcutting.action.target };
  s.woodcutting.action.target.time = 0;
  assert.equal(clickHarvestTarget(s, point), false);
  cancelWoodcutting(s);
  assert.equal(clickHarvestTarget(s, point), false);
  assert.equal(woodQuantity(s, "ash"), 0);
});
