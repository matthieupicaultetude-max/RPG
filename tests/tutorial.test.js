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

for (const slot of [0,1,2]) test(`tutoriel : le sort Feu valide l’étape dans l’emplacement ${slot+1}`, async()=>{
  const { equipSpell } = await import('../src/data/spells.js');
  const s=createSandbox();beginTutorial(s);
  s.team[0].level=2;
  Object.assign(s.tutorial,{step:'spells',manualSpell:true,member:0});
  assert.equal(equipSpell(s,0,slot,'melee-fire-0'),true);
  stepTutorial(s);assert.equal(s.tutorial.spellRead,true);
  const loadout=[...s.team[0].loadout];
  finishTutorial(s);assert.deepEqual(s.team[0].loadout,loadout);
});
