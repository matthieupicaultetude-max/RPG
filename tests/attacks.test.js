import { stepSpells } from "../src/combat/spells.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  attack,
  canStand,
  chooseMain,
} from "../src/dev/sandbox.js";
import { guidedTarget } from "../src/combat/attacks.js";
import { viewport, screenToWorld } from "../src/rendering/viewport.js";
const hit = (_s, m, damage) => {
  m.hp -= damage;
};
const advance = (s, dt) => stepSpells(s, dt, { canStand, hitMonster: hit });
function setup(role = 0) {
  const s = createSandbox();
  chooseMain(s, role);
  Object.assign(s.player, { x: 300, y: 230 });
  Object.assign(s.team[s.main], s.player);
  s.monsters = [
    { x: 330, y: 230, hp: 100 },
    { x: 310, y: 255, hp: 100 },
  ];
  return s;
}
test("visée : la cible sous le curseur prime sur le monstre le plus proche", () => {
  const s = setup();
  const point = { x: 330, y: 222 };
  assert.equal(guidedTarget(s, point, canStand).target, s.monsters[0]);
  attack(s, point);
  assert.equal(s.monsters[0].hp, 100);
  advance(s, 0.13);
  assert.equal(s.monsters[0].hp, 88);
  assert.equal(s.monsters[1].hp, 100);
});
test("coup : délai respecté, pas de spam ni de dégâts si la cible sort de portée", () => {
  const s = setup();
  assert.equal(attack(s, { x: 330, y: 222 }), true);
  assert.equal(attack(s), false);
  advance(s, 0.05);
  assert.equal(s.monsters[0].hp, 100);
  s.monsters[0].x = 400;
  advance(s, 0.1);
  assert.equal(s.monsters[0].hp, 100);
});
test("trait perforant : préparation, projectile traversant et un impact par ennemi", () => {
  const s = setup(2);
  s.monsters = [
    { x: 365, y: 230, hp: 100 },
    { x: 395, y: 230, hp: 100 },
  ];
  attack(s, { x: 365, y: 222 });
  assert.equal(s.spellEvents[0].kind, "launch");
  assert.equal(s.spellMissiles.length, 0);
  for (let i = 0; i < 60; i++) advance(s, 1 / 60);
  assert.equal(s.monsters[0].hp, 88);
  assert.equal(s.monsters[1].hp, 88);
  assert.equal(s.spellMissiles.length, 0);
});
test("visée : cible hors portée ou derrière la maison ne peut être verrouillée pour infliger des dégâts", () => {
  const s = setup();
  s.monsters = [{ x: 420, y: 230, hp: 100 }];
  assert.equal(guidedTarget(s, { x: 420, y: 222 }, canStand).inRange, false);
  Object.assign(s.player, { x: 40, y: 85 });
  Object.assign(s.team[0], s.player);
  s.monsters = [{ x: 175, y: 85, hp: 100 }];
  assert.equal(guidedTarget(s, { x: 175, y: 77 }, canStand).clear, false);
  attack(s, { x: 175, y: 77 });
  for (let i = 0; i < 60; i++) advance(s, 1 / 60);
  assert.equal(s.monsters[0].hp, 100);
});
test("soutien : le premier sort de base soigne sans blesser un ennemi", () => {
  const s = setup(1);
  s.team[1].hp = 50;
  attack(s, { x: 300, y: 222 });
  assert.equal(s.team[1].hp, 68);
  assert.equal(s.monsters[0].hp, 100);
  assert.equal(s.spellVisuals[0].element, "earth");
});
test("conversion curseur/caméra identique au rendu sur desktop, portrait et fenêtre décalée", () => {
  for (const [width, height, left, top] of [
    [1440, 900, 0, 0],
    [390, 844, 0, 0],
    [900, 500, 20, 35],
  ]) {
    const player = { x: 480, y: 255 };
    const view = viewport(width, height, player);
    const world = { x: 475, y: 250 };
    const point = screenToWorld(
      left + (world.x - view.x) * view.scale,
      top + (world.y - view.y) * view.scale,
      { width, height, left, top },
      player,
    );
    assert.ok(Math.abs(point.x - world.x) < 1e-8);
    assert.ok(Math.abs(point.y - world.y) < 1e-8);
  }
});
