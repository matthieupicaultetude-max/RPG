import test from 'node:test';
import assert from 'node:assert/strict';
import { createCharacterWheel } from '../src/input/character-wheel.js';
import { createSandbox, cycleMain } from '../src/dev/sandbox.js';

test('molette : accumulation trackpad, un changement par geste et sens inverse', () => {
  let time = 0;
  const steps = [];
  const wheel = createCharacterWheel(direction => steps.push(direction), () => time);
  const event = deltaY => ({ deltaY, preventDefault() {}, deltaMode: 0 });
  wheel(event(15));wheel(event(15));assert.deepEqual(steps, []);
  wheel(event(15));wheel(event(120));assert.deepEqual(steps, [1]);
  time = 200;wheel(event(-120));assert.deepEqual(steps, [1,-1]);
  time = 500;wheel({ ...event(120), ctrlKey: true });assert.deepEqual(steps, [1,-1]);
});
test('cycle : boucle sur les vivants sans changer la position ni réveiller un personnage à terre', () => {
  const s = createSandbox();
  s.deployed=false;
  s.team[1].hp = 0;
  const position = { ...s.player };
  cycleMain(s, 1);assert.equal(s.main, 2);
  cycleMain(s, 1);assert.equal(s.main, 0);
  cycleMain(s, -1);assert.equal(s.main, 2);
  assert.equal(s.player.x, position.x);assert.equal(s.player.y, position.y);
  s.team[0].hp = 0;
  assert.equal(cycleMain(s, 1), false);assert.equal(s.main, 2);
});
