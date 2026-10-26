import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, activateUltimate, advanceUltimate, chooseMain, stepSandbox, heal, teleport } from '../src/dev/sandbox.js';

test('ultime prêt au départ, déploiement pendant 30 s et 300 s entre activations', () => {
  const s = createSandbox();
  assert.equal(s.deployed, false);
  assert.equal(activateUltimate(s), true);
  assert.equal(s.ultimate.remaining, 30);
  assert.equal(s.ultimate.cooldown, 300);
  advanceUltimate(s, 29);
  assert.equal(s.deployed, true);
  assert.equal(activateUltimate(s), false);
  advanceUltimate(s, 1);
  assert.equal(s.deployed, false);
  assert.equal(s.ultimate.cooldown, 270);
  assert.equal(activateUltimate(s), false);
  advanceUltimate(s, 269.9);
  assert.equal(activateUltimate(s), false);
  advanceUltimate(s, .1);
  assert.equal(activateUltimate(s), true);
});
test('switch hors ultime conserve la position et les PV/équipements/délais individuels', () => {
  const s = createSandbox();
  Object.assign(s.player, { x: 100, y: 250 });
  s.team[0].hp = 48;
  s.team[1].hp = 72;
  s.team[1].cooldown = .4;
  s.team[1].equipment.Arme = { id: 99 };
  assert.equal(chooseMain(s, 1), true);
  assert.equal(s.player.x, 100);
  assert.equal(s.player.y, 250);
  assert.equal(s.team[1].hp, 72);
  assert.equal(s.team[1].cooldown, .4);
  assert.equal(s.team[1].equipment.Arme.id, 99);
  chooseMain(s, 0);
  assert.equal(s.team[0].hp, 48);
  assert.equal(s.deployed, false);
});
test('switch pendant ultime ne relance ni la durée ni la recharge, morts indisponibles', () => {
  const s = createSandbox();
  activateUltimate(s);advanceUltimate(s, 10);chooseMain(s, 2);
  assert.equal(s.ultimate.remaining, 20);
  assert.equal(s.ultimate.cooldown, 290);
  s.team[0].hp = 0;
  assert.equal(chooseMain(s, 0), false);
  advanceUltimate(s, 20);
  assert.equal(s.main, 2);
  assert.equal(s.deployed, false);
  heal(s);teleport(s, 'maison');
  assert.equal(s.ultimate.cooldown, 270);
});
test('temps écoulé prolongé retire les compagnons sans rattraper la simulation physique', () => {
  const s = createSandbox();activateUltimate(s);
  stepSandbox(s, { x: 0, y: 0 }, 0, 301);
  assert.equal(s.ultimate.cooldown, 0);
  assert.equal(s.ultimate.remaining, 0);
  assert.equal(s.deployed, false);
});
