import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  setCombatMode,
  toggleCombatMode,
  chooseMain,
  stepSandbox,
  canStand,
} from "../src/dev/sandbox.js";
import { update } from "../src/game/state.js";

test("combat par défaut, trois personnages sur des positions praticables et distinctes", () => {
  const s = createSandbox();
  assert.equal(s.deployed, true);
  assert.equal(s.ultimate, undefined);
  for (const m of s.team) assert.equal(canStand(m.x, m.y), true);
  for (let i = 0; i < 3; i++)
    for (let j = i + 1; j < 3; j++)
      assert.ok(
        Math.hypot(s.team[i].x - s.team[j].x, s.team[i].y - s.team[j].y) > 18,
      );
});
test("modes librement basculables : aucune durée ni recharge, personnage conservé", () => {
  const s = createSandbox();
  s.monsters = [];
  const initial = { ...s.player };
  s.team[0].hp = 48;
  for (let i = 0; i < 10; i++) {
    assert.equal(toggleCombatMode(s), true);
    assert.equal(s.deployed, i % 2 !== 0);
  }
  assert.deepEqual(s.player, initial);
  assert.equal(s.team[0].hp, 48);
  stepSandbox(s, { x: 0, y: 0 }, 0, 5000);
  assert.equal(s.deployed, true);
  setCombatMode(s, false);
  const ally = { x: s.team[1].x, y: s.team[1].y };
  stepSandbox(s, { x: 1, y: 0 }, 0.05);
  assert.deepEqual({ x: s.team[1].x, y: s.team[1].y }, ally);
});
test("exploration : vitesse exactement augmentée de 50 %, y compris en diagonale", () => {
  for (const direction of [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]) {
    const combat = createSandbox(),
      exploration = createSandbox();
    setCombatMode(exploration, false);
    update(combat, direction, 0.1);
    update(exploration, direction, 0.1);
    const distance = (s) => Math.hypot(s.player.x - 320, s.player.y - 220);
    assert.ok(Math.abs(distance(exploration) / distance(combat) - 1.5) < 1e-10);
  }
});
test("changement de héros dans les deux modes, morts indisponibles, jauges et recharges conservées", () => {
  const s = createSandbox();
  s.team[1].hp = 72;
  s.team[1].ultimateCharge = 44;
  s.team[1].cooldown = 0.4;
  const position = { x: s.team[1].x, y: s.team[1].y };
  chooseMain(s, 1);
  assert.equal(s.player.x, position.x);
  assert.equal(s.player.y, position.y);
  setCombatMode(s, false);
  const old = { ...s.player };
  chooseMain(s, 2);
  assert.equal(s.player.x, old.x);
  assert.equal(s.player.y, old.y);
  s.team[0].hp = 0;
  assert.equal(chooseMain(s, 0), false);
  assert.equal(s.team[1].hp, 72);
  assert.equal(s.team[1].ultimateCharge, 44);
  assert.equal(s.team[1].cooldown, 0.4);
});
