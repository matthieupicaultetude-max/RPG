import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, update } from '../src/game/state.js';
import { SCENE } from '../src/game/config.js';

test('les diagonales ont la même vitesse que les déplacements droits', () => {
  const straight = createState();
  const diagonal = createState();
  const start = { ...straight.player };
  update(straight, { x: 1, y: 0 }, 1);
  update(diagonal, { x: 1, y: 1 }, 1);
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - start.x, diagonal.player.y - start.y) - (straight.player.x - start.x)) < 0.0001);
});

test('le personnage reste dans la scène et s’arrête sans entrée', () => {
  const state = createState();
  update(state, { x: -1, y: -1 }, 100);
  assert.equal(state.player.x, SCENE.margin);
  assert.equal(state.player.y, SCENE.margin);
  update(state, { x: 1, y: 1 }, 100);
  assert.equal(state.player.x, SCENE.width - SCENE.margin);
  assert.equal(state.player.y, SCENE.height - SCENE.margin);
  const position = { ...state.player };
  update(state, { x: 0, y: 0 }, 1);
  assert.equal(state.player.x, position.x);
  assert.equal(state.player.y, position.y);
  assert.equal(state.player.moving, false);
});
