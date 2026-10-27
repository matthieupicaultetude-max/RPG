import { fillUnlockedSlots } from "../data/progression.js";
import { createMonster } from "../data/monsters.js";

// A separate encounter keeps the lesson safe without changing ordinary monsters.
export function beginTutorial(state) {
  if (state.tutorial) return false;
  state.tutorial = {
    step: "classes",
    visited: [state.main],
    distance: 0,
    previous: { ...state.player },
    savedMonsters: state.monsters,
    defeated: false,
  };
  state.monsters = [];
  state.autoAttack = false;
  state.revision++;
  return true;
}
export function startTutorialFight(state) {
  const t = state.tutorial;
  if (t?.step !== "ready") return false;
  t.member = state.main;
  const monster = createMonster("slime", 455, 220);
  Object.assign(monster, {
    name: "Slime d’entraînement",
    tutorial: true,
    damage: 2,
    xp: state.team.reduce((max, m) => Math.max(max, m.level * 50 - m.xp), 0),
    respawnDelay: 1e9,
    detection: 160,
  });
  state.monsters = [monster];
  t.step = "combat";
  state.revision++;
  return true;
}
export function stepTutorial(state) {
  const t = state.tutorial;
  if (!t || ["done", "skipped"].includes(t.step)) return;
  if (t.step === "classes" && !t.visited.includes(state.main))
    t.visited.push(state.main);
  if (t.step === "move") {
    const d = Math.hypot(
      state.player.x - t.previous.x,
      state.player.y - t.previous.y,
    );
    if (d < 10) t.distance += d; // Teleports never satisfy the movement lesson.
    if (t.distance >= 55) {
      t.step = "ready";
      state.revision++;
    }
  }
  t.previous = { ...state.player };
  if (
    t.step === "spells" &&
    t.manualSpell &&
    state.team[t.member].loadout[1] === `${state.team[t.member].role}-fire-0`
  )
    t.spellRead = true;
  if (t.step === "combat" && t.defeated) {
    const member = state.team[t.member];
    // The lesson asks the player to equip the newly unlocked spell themselves.
    if (member.level === 2 && member.loadout[1] === `${member.role}-fire-0`) {
      member.loadout[1] = null;
      t.manualSpell = true;
    }
    t.step = "stats";
    state.revision++;
  }
  if (t.step === "stats" && state.team[t.member].characteristicPoints === 0) {
    t.step = "spells";
    state.revision++;
  }
}
export function finishTutorial(state, skipped = false) {
  const t = state.tutorial;
  if (!t || ["done", "skipped"].includes(t.step)) return;
  if (t.manualSpell) fillUnlockedSlots(state.team[t.member]);
  state.monsters = t.savedMonsters;
  delete t.savedMonsters;
  state.spellEvents = [];
  state.spellMissiles = [];
  state.spellAreas = [];
  state.attacks = [];
  t.step = skipped ? "skipped" : "done";
  state.revision++;
}
