import { DEV_ITEMS } from "./dev-items.js";
import { MONSTERS } from "./monsters.js";
import { WOODS } from "./woodcutting.js";
import { KEY_RECIPES } from "./handyman.js";
export const QUEST_ZONES = {
  exile: "Comptoir",
  garden: "Jardin",
  "slime-marsh": "Marais",
  "slime-mountains": "Montagnes",
  "slime-fire": "Braises",
  "slime-wind": "Alizés",
  "slime-depths": "Crevasse",
  "slime-volcano": "Volcan",
  "slime-storm": "Tempêtes",
  "slime-furnace": "Fournaise",
  tutorial: "Tutoriel",
};
export const QUEST_TYPES = {
  talk: "Parler à un PNJ",
  visit: "Visiter un lieu",
  kill: "Vaincre des monstres",
  collect: "Rapporter des objets",
  harvest: "Récolter du bois",
  craft: "Fabriquer",
};
export const QUEST_RECIPES = [
  ...WOODS.map((w) => ({ id: `plank:${w.id}`, name: w.plank })),
  ...Object.entries(KEY_RECIPES).map(([id, r]) => ({
    id: `key:${id}`,
    name: r.name,
  })),
  { id: "chromatic", name: "Améliorer une pièce chromatique" },
];
const identifier = (v) =>
  typeof v === "string" &&
  /^[a-z0-9][a-z0-9_-]{0,79}$/.test(v) &&
  !["constructor", "prototype"].includes(v);
const text = (v, max = 4000) => typeof v === "string" && v.length <= max;
const integer = (v, min, max) =>
  Number.isSafeInteger(v) && v >= min && v <= max;
export function validateQuestContent(quests = [], npcs = [], residentIds = []) {
  if (
    !Array.isArray(quests) ||
    quests.length > 100 ||
    !Array.isArray(npcs) ||
    npcs.length > 80
  )
    throw Error("Trop de quêtes ou de PNJ.");
  const ids = new Set(residentIds),
    questIds = new Set();
  for (const n of npcs) {
    if (
      !identifier(n.id) ||
      ids.has(n.id) ||
      !text(n.name, 80) ||
      !n.name.trim() ||
      !text(n.greeting) ||
      !["melee", "ranged", "support"].includes(n.role) ||
      !Number.isFinite(n.x) ||
      !Number.isFinite(n.y) ||
      n.x < 15 ||
      n.x > 1425 ||
      n.y < 15 ||
      n.y > 1225
    )
      throw Error("PNJ de quête invalide ou identifiant déjà utilisé.");
    ids.add(n.id);
  }
  for (const q of quests) {
    if (
      !identifier(q.id) ||
      questIds.has(q.id) ||
      typeof q.enabled !== "boolean" ||
      !text(q.title, 120) ||
      !text(q.description) ||
      !text(q.offer) ||
      !text(q.finish) ||
      !integer(q.minLevel, 1, 1000) ||
      !Array.isArray(q.prerequisites) ||
      q.prerequisites.length > 20 ||
      !integer(q.cooldown, 0, 604800) ||
      typeof q.repeatable !== "boolean" ||
      !Array.isArray(q.stages) ||
      q.stages.length < 1 ||
      q.stages.length > 20 ||
      !q.rewards ||
      !integer(q.rewards.gold, 0, 1000000) ||
      !integer(q.rewards.xp, 0, 1000000) ||
      !Array.isArray(q.rewards.items) ||
      q.rewards.items.length > 12
    )
      throw Error("Définition de quête invalide.");
    questIds.add(q.id);
    if (q.enabled && (!q.title.trim() || !ids.has(q.giver)))
      throw Error(
        `${q.title || q.id} : choisissez un donneur de quête valide.`,
      );
    for (const reward of q.rewards.items)
      if (
        !DEV_ITEMS.some((i) => i.key === reward.key) ||
        !integer(reward.quantity, 1, 999)
      )
        throw Error(`${q.title} : récompense invalide.`);
    const stageIds = new Set();
    for (const s of q.stages) {
      if (
        !identifier(s.id) ||
        stageIds.has(s.id) ||
        !text(s.title, 120) ||
        !text(s.dialogue) ||
        !Array.isArray(s.objectives) ||
        s.objectives.length < 1 ||
        s.objectives.length > 8
      )
        throw Error(`${q.title} : étape invalide.`);
      stageIds.add(s.id);
      if (q.enabled && !ids.has(s.npc))
        throw Error(`${q.title} : PNJ de validation manquant.`);
      const objectiveIds = new Set();
      for (const o of s.objectives) {
        if (
          !identifier(o.id) ||
          objectiveIds.has(o.id) ||
          !Object.hasOwn(QUEST_TYPES, o.type) ||
          !integer(o.amount, 1, 999) ||
          typeof o.consume !== "boolean"
        )
          throw Error(`${q.title} : objectif invalide.`);
        objectiveIds.add(o.id);
        if (!q.enabled) continue;
        if (
          (o.type === "talk" && !ids.has(o.target)) ||
          (o.type === "kill" && !MONSTERS.some((m) => m.id === o.target)) ||
          (o.type === "collect" &&
            !DEV_ITEMS.some((i) => i.key === o.target)) ||
          (o.type === "harvest" && !WOODS.some((w) => w.id === o.target)) ||
          (o.type === "craft" && !QUEST_RECIPES.some((r) => r.id === o.target))
        )
          throw Error(`${q.title} : cible d’objectif introuvable.`);
        if (
          o.type === "visit" &&
          (!Object.hasOwn(QUEST_ZONES, o.zone) ||
            !Number.isFinite(o.x) ||
            !Number.isFinite(o.y) ||
            o.x < 0 ||
            o.x > (o.zone === "exile" ? 1440 : 640) ||
            o.y < 0 ||
            o.y > (o.zone === "exile" ? 1240 : 400) ||
            !integer(o.radius, 8, 160))
        )
          throw Error(`${q.title} : destination invalide.`);
      }
    }
  }
  const graph = new Map(quests.map((q) => [q.id, q.prerequisites]));
  for (const q of quests)
    if (q.prerequisites.some((id) => !questIds.has(id) || id === q.id))
      throw Error(`${q.title} : prérequis manquant ou autoréférence.`);
  const visiting = new Set(),
    done = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw Error("Cycle entre les prérequis de quêtes.");
    if (done.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id)) visit(next);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of questIds) visit(id);
  return true;
}
export const questFingerprint = (q) => JSON.stringify(q);
export function newObjective(type = "talk", target = "capitaine") {
  return {
    id: `objective-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    target,
    amount: 1,
    consume: false,
    zone: "exile",
    x: 720,
    y: 1160,
    radius: 32,
  };
}
export function newQuest(giver = "capitaine") {
  return {
    id: `quest-${Date.now()}`,
    enabled: false,
    title: "Nouvelle quête",
    description: "",
    giver,
    offer: "Pouvez-vous m’aider ?",
    finish: "Merci pour votre aide !",
    minLevel: 1,
    prerequisites: [],
    repeatable: false,
    cooldown: 0,
    rewards: { gold: 0, xp: 0, items: [] },
    stages: [
      {
        id: `stage-${Date.now()}`,
        title: "Première étape",
        npc: giver,
        dialogue: "",
        objectives: [newObjective("talk", giver)],
      },
    ],
  };
}
