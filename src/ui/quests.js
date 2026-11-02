import { CUSTOM_QUESTS } from "../world/custom-quests.js";
import {
  questRecord,
  questAvailable,
  objectiveCount,
  stageReady,
  nearQuestNpc,
} from "../game/custom-quests.js";
import {
  QUEST_TYPES,
  QUEST_ZONES,
  QUEST_RECIPES,
} from "../data/quest-schema.js";
import { DEV_ITEMS } from "../data/dev-items.js";
import { MONSTERS } from "../data/monsters.js";
import { WOODS } from "../data/woodcutting.js";
import { SERVICES } from "../world/exile-map.js";
import { CUSTOM_QUEST_NPCS } from "../world/custom-quests.js";
import { escapeQuest as e } from "./quest-editor.js";
const npcName = (id) =>
  [...Object.values(SERVICES), ...CUSTOM_QUEST_NPCS].find((n) => n.id === id)
    ?.name || id;
function targetName(o) {
  return o.type === "talk"
    ? npcName(o.target)
    : o.type === "visit"
      ? `${QUEST_ZONES[o.zone]} · ${o.x}, ${o.y}`
      : o.type === "kill"
        ? MONSTERS.find((m) => m.id === o.target)?.name
        : o.type === "collect"
          ? DEV_ITEMS.find((i) => i.key === o.target)?.item.name
          : o.type === "harvest"
            ? WOODS.find((w) => w.id === o.target)?.name
            : QUEST_RECIPES.find((r) => r.id === o.target)?.name;
}
export function renderQuestCard(s, q) {
  const r = questRecord(s, q),
    active = r?.status === "active",
    stage = active ? q.stages[r.stage] : null,
    available = questAvailable(s, q),
    near = nearQuestNpc(s, active ? stage?.npc : q.giver);
  const rewards =
    [
      q.rewards.gold ? `${q.rewards.gold} or` : "",
      q.rewards.xp ? `${q.rewards.xp} XP` : "",
      ...q.rewards.items.map(
        (r) =>
          `${r.quantity} × ${DEV_ITEMS.find((i) => i.key === r.key)?.item.name}`,
      ),
    ]
      .filter(Boolean)
      .join(" · ") || "Aucune";
  return `<article class="quest-card"><div class="quest-card-heading"><h3>${e(q.title)}</h3><small>${active ? "En cours" : available ? "Disponible" : r?.completedAt ? "Terminée" : "Verrouillée"} · Niv. ${q.minLevel}</small></div><p>${e(q.description)}</p>${active ? `<h4>Étape ${r.stage + 1}/${q.stages.length} · ${e(stage.title)}</h4><ul>${stage.objectives.map((o) => `<li>${objectiveCount(s, r, o) >= o.amount ? "✓" : "○"} ${e(QUEST_TYPES[o.type])} : ${e(targetName(o))} <strong>${Math.min(o.amount, objectiveCount(s, r, o))}/${o.amount}</strong>${o.consume ? " · remis au PNJ" : ""}</li>`).join("")}</ul><p>${e(stage.dialogue)}</p><p>Validation : ${e(npcName(stage.npc))}</p>${near ? `<button data-quest-talk="${e(stage.npc)}">Parler</button><button data-quest-advance="${q.id}" ${!stageReady(s, q) ? "disabled" : ""}>${r.stage === q.stages.length - 1 ? "Terminer la quête" : "Valider l’étape"}</button>` : "<small>Approchez du PNJ de validation au Comptoir.</small>"}<button data-quest-abandon="${q.id}">Abandonner</button>` : available ? `<p>${e(q.offer)}</p><p>Donneur : ${e(npcName(q.giver))}</p><button data-quest-accept="${q.id}" ${near ? "" : "disabled"}>Accepter</button>${!near ? "<small>Rejoignez le donneur au Comptoir.</small>" : ""}` : `<p>${r?.completedAt ? e(q.finish) : "Prérequis : niveau " + q.minLevel + (q.prerequisites.length ? " et " + q.prerequisites.map((id) => e(CUSTOM_QUESTS.find((x) => x.id === id)?.title)).join(", ") : "")}${q.repeatable && r?.completedAt ? " · Répétable après " + q.cooldown + " s" : ""}</p>`}<footer>Récompenses : ${e(rewards)}</footer></article>`;
}
export function renderQuestJournal(s) {
  const quests = CUSTOM_QUESTS.filter((q) => q.enabled);
  return `<section class="quest-journal"><p class="eyebrow">AVENTURES</p><h2>Journal de quêtes</h2><p>Acceptez et validez les quêtes auprès de leurs PNJ au Comptoir. La progression est sauvegardée automatiquement.</p>${[
    "En cours",
    "Disponibles",
    "Terminées et verrouillées",
  ]
    .map((name, i) => {
      const list = quests.filter((q) => {
        const r = questRecord(s, q);
        return i === 0
          ? r?.status === "active"
          : i === 1
            ? r?.status !== "active" && questAvailable(s, q)
            : r?.status !== "active" && !questAvailable(s, q);
      });
      return `<details ${i < 2 ? "open" : ""}><summary>${name} · ${list.length}</summary>${list.map((q) => renderQuestCard(s, q)).join("") || "<p>Aucune quête.</p>"}</details>`;
    })
    .join(
      "",
    )}${!quests.length ? "<p>Les quêtes créées dans l’éditeur apparaîtront ici une fois activées et appliquées.</p>" : ""}</section>`;
}
export function renderNpcQuests(s, id) {
  if (!id) return "";
  const quests = CUSTOM_QUESTS.filter(
    (q) =>
      q.enabled &&
      (q.giver === id ||
        q.stages[questRecord(s, q)?.stage]?.npc === id ||
        q.stages[questRecord(s, q)?.stage]?.objectives.some(
          (o) => o.type === "talk" && o.target === id,
        )),
  );
  return quests.length
    ? `<section class="npc-quests"><h3>Quêtes</h3><button data-quest-talk="${e(id)}">Parler des missions</button>${quests.map((q) => renderQuestCard(s, q)).join("")}</section>`
    : "";
}
