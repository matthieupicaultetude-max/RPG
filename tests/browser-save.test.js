import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, grantCore, openCore } from '../src/dev/sandbox.js';
import { beginTutorial, finishTutorial, startTutorialFight } from '../src/game/tutorial.js';
import { SAVE_KEY, BACKUP_KEY, createBrowserSave, progressSnapshot, decodeSave, restoreProgress } from '../src/game/browser-save.js';
const memory = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
const completed = () => { const s = createSandbox(); beginTutorial(s); finishTutorial(s, true); return s; };

test('browser save: round trip equipment, bag, XP, allocation, spells, jobs and adoption', () => {
  const s = completed(), store = memory(), save = createBrowserSave(s, store);
  const core = grantCore(s, 'water', 1); openCore(s, core);
  const item = s.bag.find(i => i.slot); assert.ok(item);
  s.team[0].equipment[item.slot] = item; s.bag = s.bag.filter(i => i !== item);
  Object.assign(s.team[0], { level: 5, xp: 12, characteristicPoints: 15, allocatedStats: { Vitalité: 5 }, learnedUltimates: ['melee-water-3'], loadout: ['melee-earth-0', null, null, 'melee-water-3'], emptySpellSlots: [1, 2] });
  s.gold = 72; s.main = 2; s.deployed = false;
  s.woodcutting = { level: 6, xp: 15, action: { phase: 'cut' } };
  s.handyman = { level: 2, xp: 10 }; s.petQuests.water = { status: 'active' };
  s.collections.water = [item.slot];
  assert.equal(save.save(), true);
  const restored = createSandbox(); createBrowserSave(restored, store);
  assert.deepEqual(progressSnapshot(restored).progress, progressSnapshot(s).progress);
  assert.equal(restored.team[0].maxHp, 140 + 5 + (item.stats.Vitalité || 0));
  assert.equal(restored.woodcutting.action, null);
  assert.equal(restored.zone, 'garden'); assert.equal(restored.main, 2);
  assert.deepEqual(restored.team[0].spellCooldowns, {});
});

test('browser save: unfinished tutorial resumes without duplicating combat XP or loot', () => {
  for (const defeated of [false, true]) {
    const s = createSandbox(); beginTutorial(s); s.tutorial.step = 'ready'; startTutorialFight(s);
    s.tutorial.defeated = defeated; s.tutorial.coreId = 99;
    const restored = createSandbox(); restoreProgress(restored, decodeSave(JSON.stringify(progressSnapshot(s))));
    assert.equal(restored.zone, 'tutorial'); assert.equal(restored.tutorial.step, 'combat');
    assert.equal(restored.tutorial.defeated, defeated);
    assert.equal(restored.monsters.length, defeated ? 0 : 1);
    assert.equal(restored.tutorial.coreId, 99);
    finishTutorial(restored, true); assert.equal(restored.monsters.length, 4);
  }
});

test('browser save: retains a valid previous generation and recovers corrupted primary', () => {
  const s = completed(), store = memory(), persistence = createBrowserSave(s, store);
  s.gold = 10; assert.equal(persistence.save(), true);
  s.gold = 20; assert.equal(persistence.save(), true);
  assert.equal(decodeSave(store.getItem(BACKUP_KEY)).progress.gold, 10);
  store.setItem(SAVE_KEY, '{bad');
  const restored = createSandbox(), recovered = createBrowserSave(restored, store);
  assert.equal(restored.gold, 10); assert.equal(recovered.save(), true);
  assert.equal(decodeSave(store.getItem(BACKUP_KEY)).progress.gold, 10);
});

test('browser save: unknown future schema or both corrupted copies are never overwritten', () => {
  for (const raw of ['{"version":99}', 'broken']) {
    const store = memory(); store.setItem(SAVE_KEY, raw);
    const s = createSandbox(), persistence = createBrowserSave(s, store);
    assert.equal(persistence.save(), false); assert.equal(store.getItem(SAVE_KEY), raw);
    assert.equal(s.saveStatus.error, true);
  }
});

test('browser save: unavailable/quota-limited storage does not crash or lose last good save', () => {
  const s = completed();
  assert.equal(createBrowserSave(s, { getItem() { throw Error('denied'); } }).save(), false);
  const store = memory(), persistence = createBrowserSave(s, store); persistence.save();
  const previous = store.getItem(SAVE_KEY); store.setItem = () => { throw Error('quota'); };
  s.gold++; assert.equal(persistence.save(), false); assert.equal(store.getItem(SAVE_KEY), previous);
});

test('browser save: repairs next item counter and excludes transient combat/world data', () => {
  const s = completed(); grantCore(s, 'fire', 1);
  const snapshot = progressSnapshot(s); snapshot.progress.nextItem = 1;
  s.monsters[0].hp = 0; s.effects.push({ life: 1 });
  const restored = createSandbox(); restoreProgress(restored, decodeSave(JSON.stringify(snapshot)));
  assert.ok(restored.nextItem > restored.bag[0].id);
  assert.equal(restored.monsters[0].hp > 0, true); assert.deepEqual(restored.effects, []);
});
