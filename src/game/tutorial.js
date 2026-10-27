import { createTrees } from "./woodcutting.js";
import {
  TUTORIAL_SPAWN,
  TUTORIAL_COMBAT,
  TUTORIAL_MONSTER,
  NPCS,
  TUTORIAL_TREES,
  TUTORIAL_SAWMILL,
} from "../world/tutorial-map.js";
import { movePartyToZone } from "../world/zones.js";
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
    savedWorld: { bots: state.bots, npcs: state.npcs, trees: state.trees },
    defeated: false,
  };
  state.monsters = [];
  state.bots = [];
  state.npcs = NPCS.map((npc) => ({ ...npc }));
  state.trees = createTrees(TUTORIAL_TREES);
  movePartyToZone(state, "tutorial", TUTORIAL_SPAWN);
  state.tutorial.previous = { ...state.player };
  state.autoAttack = false;
  state.log.unshift(
    "Bienvenue sur l’île des premiers pas. Iris vous accompagne.",
  );
  state.log.length = Math.min(6, state.log.length);
  state.revision++;
  return true;
}
export function startTutorialFight(state) {
  const t = state.tutorial;
  if (t?.step !== "ready") return false;
  t.member = state.main;
  movePartyToZone(state, "tutorial", TUTORIAL_COMBAT);
  const monster = createMonster(
    "slime",
    TUTORIAL_MONSTER.x,
    TUTORIAL_MONSTER.y,
  );
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
  if (t.step === "loot" && t.armorId) {
    t.step = "armor";
    state.revision++;
  }
  if (
    t.step === "armor" &&
    state.team.some((m) =>
      Object.values(m.equipment).some((item) => item.id === t.armorId),
    )
  ) {
    t.step = "professions";
    state.revision++;
  }
  if (t.step === "gather" && t.harvested >= 2) {
    t.step = "craft";
    state.revision++;
  }
  if (t.step === "craft" && t.crafted) {
    t.step = "complete";
    state.revision++;
  }
  if (
    t.step === "spells" &&
    t.manualSpell &&
    state.team[t.member].loadout
      .slice(0, 3)
      .includes(`${state.team[t.member].role}-fire-0`)
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
  state.monsters = t.savedMonsters;
  delete t.savedMonsters;
  Object.assign(state, t.savedWorld);
  delete t.savedWorld;
  movePartyToZone(state, "garden", { x: 110, y: 155 });
  state.spellEvents = [];
  state.spellMissiles = [];
  state.spellAreas = [];
  state.attacks = [];
  t.step = skipped ? "skipped" : "done";
  state.revision++;
}

export const canLeaveTutorial = (state) =>
  state.zone === "tutorial" && state.tutorial?.step === "complete";
export function advanceTutorial(state) {
  const t = state.tutorial;
  if (t?.step === "spells" && t.spellRead) t.step = "bestiary";
  else if (t?.step === "bestiary" && t.bestiaryRead) {
    t.step = "loot";
  } else if (t?.step === "professions" && t.professionsRead) t.step = "gather";
  else return false;
  state.revision++;
  return true;
}
export function visitTutorialPanel(state, tab) {
  const t = state.tutorial;
  if (t?.step === "professions" && tab === "professions") {
    t.professionsRead = true;
    state.revision++;
  }
}
export function inspectTutorialMonster(state, species, level) {
  const t = state.tutorial;
  if (t?.step === "bestiary" && species === "slime" && level > 1) {
    t.bestiaryRead = true;
    state.revision++;
  }
}
export function approachTutorialSawmill(state) {
  if (state.tutorial?.step !== "craft") return false;
  movePartyToZone(state, "tutorial", {
    x: TUTORIAL_SAWMILL.x + 30,
    y: TUTORIAL_SAWMILL.y - 25,
  });
  return true;
}
