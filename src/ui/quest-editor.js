import {
  newQuest,
  newObjective,
  QUEST_TYPES,
  QUEST_ZONES,
  QUEST_RECIPES,
  validateQuestContent,
} from "../data/quest-schema.js";
import { DEV_ITEMS } from "../data/dev-items.js";
import { MONSTERS } from "../data/monsters.js";
import { WOODS } from "../data/woodcutting.js";
import { SERVICES } from "../world/exile-map.js";
export const escapeQuest = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const e = escapeQuest;
const options = (values, current) =>
  values
    .map(
      ([id, name]) =>
        `<option value="${e(id)}" ${id === current ? "selected" : ""}>${e(name)}</option>`,
    )
    .join("");
const itemOptions = () =>
  DEV_ITEMS.map((i) => [i.key, i.item.name + (i.item.chromatic ? " ✧" : "")]);
export function mountQuestEditor(
  dialog,
  getDoc,
  change,
  status,
  resetProgress = () => {},
) {
  let selected = null;
  const header = dialog.querySelector("header");
  header.insertAdjacentHTML(
    "beforeend",
    '<nav class="quest-editor-tabs"><button data-workspace="map" aria-pressed="true">Carte</button><button data-workspace="quests" aria-pressed="false">Quêtes</button></nav>',
  );
  const root = document.createElement("section");
  root.className = "quest-editor-workspace";
  root.hidden = true;
  dialog.querySelector("footer").before(root);
  const npcs = () =>
    [...Object.values(SERVICES), ...(getDoc().npcs || [])].map((n) => [
      n.id,
      n.name,
    ]);
  function setTab(tab) {
    dialog.dispatchEvent(new Event("quest-cancel-position"));
    root.hidden = tab !== "quests";
    for (const c of dialog.querySelectorAll(
      ".map-editor-body,.map-editor-tools",
    ))
      c.hidden = tab === "quests";
    for (const b of header.querySelectorAll("[data-workspace]"))
      b.setAttribute("aria-pressed", String(b.dataset.workspace === tab));
    if (tab === "quests") render();
    window.dispatchEvent(new Event("resize"));
  }
  function input(label, field, value, type = "text", extra = "") {
    return `<label>${e(label)}<input data-q-field="${field}" type="${type}" value="${e(value)}" ${extra}></label>`;
  }
  function text(label, field, value) {
    return `<label>${e(label)}<textarea data-q-field="${field}" maxlength="4000">${e(value)}</textarea></label>`;
  }
  function select(label, field, values, value) {
    return `<label>${e(label)}<select data-q-field="${field}">${options(values, value)}</select></label>`;
  }
  function objective(o, si, oi) {
    const base = `stages.${si}.objectives.${oi}`;
    let targets =
      o.type === "talk"
        ? npcs()
        : o.type === "kill"
          ? MONSTERS.map((m) => [m.id, m.name])
          : o.type === "collect"
            ? itemOptions()
            : o.type === "harvest"
              ? WOODS.map((w) => [w.id, w.name])
              : QUEST_RECIPES.map((r) => [r.id, r.name]);
    return `<fieldset><legend>Objectif ${oi + 1}</legend>${select("Action", `${base}.type`, Object.entries(QUEST_TYPES), o.type)}${o.type === "visit" ? `${select("Zone", `${base}.zone`, Object.entries(QUEST_ZONES), o.zone)}${input("X", `${base}.x`, o.x, "number", 'min="0"')}${input("Y", `${base}.y`, o.y, "number", 'min="0"')}${input("Rayon", `${base}.radius`, o.radius, "number", 'min="8" max="160"')}<button data-quest-locate="${si}:${oi}">Choisir sur la carte</button>` : select("Cible", `${base}.target`, [["", "Choisir…"], ...targets], o.target)}${o.type !== "visit" ? input("Quantité", `${base}.amount`, o.amount, "number", 'min="1" max="999"') : ""}${o.type === "collect" ? `<label><input data-q-field="${base}.consume" type="checkbox" ${o.consume ? "checked" : ""}> Retirer les objets à la validation</label>` : ""}<button data-q-remove-objective="${si}:${oi}">Supprimer l’objectif</button></fieldset>`;
  }
  function render() {
    const scroll = [
      root.querySelector("aside")?.scrollTop || 0,
      root.querySelector("main")?.scrollTop || 0,
    ];
    const disclosures = new Map(
      [...root.querySelectorAll("[data-disclosure]")].map((d) => [
        d.dataset.disclosure,
        d.open,
      ]),
    );
    const doc = getDoc();
    doc.quests ??= [];
    doc.npcs ??= [];
    const q = doc.quests.find((q) => q.id === selected);
    root.innerHTML = `<aside><h2>Quêtes</h2><button data-q-action="new">+ Nouvelle quête</button><button data-q-action="example">+ Exemple jouable</button><div><button data-q-action="undo">Annuler</button><button data-q-action="redo">Rétablir</button></div><div class="quest-editor-list">${doc.quests.map((q) => `<button data-q-select="${q.id}" aria-pressed="${q.id === selected}">${q.enabled ? "●" : "○"} ${e(q.title)}</button>`).join("") || "<p>Aucune quête.</p>"}</div><p>○ Brouillon · ● Active en jeu</p><h3>PNJ de quête</h3><button data-q-action="npc">+ Nouveau PNJ</button>${doc.npcs
      .map(
        (n, i) =>
          `<details data-disclosure="npc-${n.id}" open><summary>${e(n.name)}</summary><label>Nom<input data-npc="${i}:name" value="${e(n.name)}" maxlength="80"></label><label>Accueil<textarea data-npc="${i}:greeting">${e(n.greeting)}</textarea></label><label>Apparence<select data-npc="${i}:role">${options(
            [
              ["melee", "Combattant"],
              ["support", "Soutien"],
              ["ranged", "Distance"],
            ],
            n.role,
          )}</select></label><label>X<input type="number" data-npc="${i}:x" value="${n.x}"></label><label>Y<input type="number" data-npc="${i}:y" value="${n.y}"></label><button data-npc-place="${i}">Placer sur la carte</button><button data-npc-delete="${i}">Supprimer</button></details>`,
      )
      .join("")}</aside><main>${
      q
        ? `<div class="quest-editor-actions"><button data-q-action="duplicate">Dupliquer</button><button data-q-action="validate">Vérifier</button><button data-q-action="reset-progress">Réinitialiser mon test</button><button data-q-action="delete">Supprimer</button></div><h2>${e(q.title)}</h2><p>Les changements sont locaux. « Appliquer et sauvegarder » les active en jeu. Export JSON inclut quêtes et PNJ.</p><fieldset><legend>Présentation</legend>${input("Titre", "title", q.title, "text", 'maxlength="120"')}<label><input data-q-field="enabled" type="checkbox" ${q.enabled ? "checked" : ""}> Activer en jeu (décoché : brouillon)</label>${select("Donneur", "giver", [["", "Choisir…"], ...npcs()], q.giver)}${text("Description", "description", q.description)}${text("Dialogue de proposition", "offer", q.offer)}${text("Dialogue final", "finish", q.finish)}</fieldset><details data-disclosure="prerequisites"><summary>Prérequis et répétition</summary>${input("Niveau minimum", "minLevel", q.minLevel, "number", 'min="1" max="1000"')}<label>Quêtes à terminer<select data-q-prerequisites multiple>${doc.quests
            .filter((x) => x.id !== q.id)
            .map(
              (x) =>
                `<option value="${x.id}" ${q.prerequisites.includes(x.id) ? "selected" : ""}>${e(x.title)}</option>`,
            )
            .join(
              "",
            )}</select></label><label><input data-q-field="repeatable" type="checkbox" ${q.repeatable ? "checked" : ""}> Répétable</label>${input("Délai avant répétition (secondes)", "cooldown", q.cooldown, "number", 'min="0" max="604800"')}</details><h3>Étapes · dans l’ordre</h3>${q.stages.map((s, i) => `<section class="quest-stage"><h3>Étape ${i + 1}</h3>${input("Titre", `stages.${i}.title`, s.title, "text", 'maxlength="120"')}${select("PNJ de validation", `stages.${i}.npc`, [["", "Choisir…"], ...npcs()], s.npc)}${text("Dialogue de validation", `stages.${i}.dialogue`, s.dialogue)}${s.objectives.map((o, j) => objective(o, i, j)).join("")}<button data-q-add-objective="${i}">+ Objectif</button><button data-q-move="${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button><button data-q-move="${i}:1" ${i === q.stages.length - 1 ? "disabled" : ""}>↓</button><button data-q-remove-stage="${i}" ${q.stages.length === 1 ? "disabled" : ""}>Supprimer l’étape</button></section>`).join("")}<button data-q-action="stage">+ Étape</button><fieldset><legend>Récompenses finales</legend>${input("Pièces d’or", "rewards.gold", q.rewards.gold, "number", 'min="0" max="1000000"')}${input("XP de base (sagesse appliquée)", "rewards.xp", q.rewards.xp, "number", 'min="0" max="1000000"')}${q.rewards.items.map((r, i) => `<div>${select("Objet", `rewards.items.${i}.key`, itemOptions(), r.key)}${input("Quantité", `rewards.items.${i}.quantity`, r.quantity, "number", 'min="1" max="999"')}<button data-q-remove-reward="${i}">Retirer</button></div>`).join("")}<button data-q-action="reward">+ Objet</button></fieldset>`
        : "<h2>Éditeur de quêtes</h2><p>Créez un scénario à étapes, associez ses PNJ, objectifs et récompenses. Les objectifs d’une étape se réalisent dans n’importe quel ordre ; le PNJ valide ensuite l’étape.</p><p>Les brouillons sont exportés mais invisibles en jeu. Les événements antérieurs à l’acceptation ne comptent pas, sauf les objets déjà possédés. Modifier une quête active recommence ses objectifs ; ses récompenses déjà obtenues sont conservées.</p>"
    }</main>`;
    for (const d of root.querySelectorAll("[data-disclosure]"))
      if (disclosures.has(d.dataset.disclosure))
        d.open = disclosures.get(d.dataset.disclosure);
    root.querySelector("aside").scrollTop = scroll[0];
    root.querySelector("main").scrollTop = scroll[1];
  }
  function mutate(fn) {
    change(() =>
      fn(
        getDoc(),
        getDoc().quests?.find((q) => q.id === selected),
      ),
    );
    render();
  }
  root.addEventListener("change", (event) => {
    const el = event.target;
    try {
      if (el.dataset.qField) {
        const path = el.dataset.qField.split(".");
        mutate((doc, q) => {
          let dest = q;
          for (const k of path.slice(0, -1)) dest = dest[k];
          dest[path.at(-1)] =
            el.type === "checkbox"
              ? el.checked
              : el.type === "number"
                ? Number(el.value)
                : el.value;
          if (path.at(-1) === "type") {
            dest.target = "";
            dest.amount = 1;
          }
        });
      }
      if (el.hasAttribute("data-q-prerequisites"))
        mutate(
          (d, q) =>
            (q.prerequisites = [...el.selectedOptions].map((o) => o.value)),
        );
      if (el.dataset.npc) {
        const [i, key] = el.dataset.npc.split(":");
        mutate(
          (d) =>
            (d.npcs[i][key] =
              el.type === "number" ? Number(el.value) : el.value),
        );
      }
    } catch (err) {
      status(err.message);
    }
  });
  root.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    event.stopPropagation();
    try {
      if (["undo", "redo"].includes(b.dataset.qAction)) {
        dialog.querySelector(`[data-edit="${b.dataset.qAction}"]`).click();
        render();
        return;
      }
      if (b.dataset.qAction === "reset-progress") {
        resetProgress(selected);
        status(
          "Progression de cette quête réinitialisée pour votre personnage.",
        );
        return;
      }
      if (b.dataset.qSelect) {
        selected = b.dataset.qSelect;
        render();
        return;
      }
      if (b.dataset.qAction === "new" || b.dataset.qAction === "example") {
        mutate((d) => {
          const q = newQuest(npcs()[0]?.[0] || "");
          if (b.dataset.qAction === "example") {
            q.title = "Bienvenue au Comptoir";
            q.description =
              "Découvrez le port puis revenez raconter votre promenade.";
            q.enabled = true;
            q.rewards = { gold: 25, xp: 20, items: [] };
            q.stages[0].title = "Découvrir le port";
            q.stages[0].objectives = [
              { ...newObjective("visit"), x: 720, y: 1010, radius: 65 },
            ];
          }
          selected = q.id;
          d.quests.push(q);
        });
        return;
      }
      if (b.dataset.qAction === "validate") {
        validateQuestContent(
          getDoc().quests,
          getDoc().npcs,
          Object.values(SERVICES).map((n) => n.id),
        );
        status("Quêtes valides. Appliquez la carte pour les tester en jeu.");
        return;
      }
      if (b.dataset.qAction === "npc") {
        mutate((d) =>
          d.npcs.push({
            id: `quest-npc-${Date.now()}`,
            name: "Nouveau PNJ",
            greeting: "Bonjour, aventurier !",
            role: "support",
            x: 720,
            y: 710,
          }),
        );
        return;
      }
      if (b.dataset.npcPlace || b.dataset.questLocate) {
        const npc = b.dataset.npcPlace,
          point = b.dataset.questLocate;
        setTab("map");
        status("Cliquez sur la carte pour choisir la position.");
        dialog.dispatchEvent(
          new CustomEvent("quest-pick-position", {
            detail: {
              done: (x, y) => {
                mutate((d, q) => {
                  if (npc !== undefined)
                    Object.assign(d.npcs[Number(npc)], { x, y });
                  else {
                    const [si, oi] = point.split(":").map(Number);
                    Object.assign(q.stages[si].objectives[oi], {
                      x,
                      y,
                      zone: "exile",
                    });
                  }
                });
                setTab("quests");
              },
            },
          }),
        );
        return;
      }
      mutate((d, q) => {
        if (b.dataset.npcDelete !== undefined) {
          const n = d.npcs[Number(b.dataset.npcDelete)];
          if (
            d.quests.some(
              (q) =>
                q.giver === n.id ||
                q.stages.some(
                  (s) =>
                    s.npc === n.id ||
                    s.objectives.some(
                      (o) => o.type === "talk" && o.target === n.id,
                    ),
                ),
            )
          )
            throw Error(
              "Ce PNJ est utilisé dans une quête. Retirez ses références avant de le supprimer.",
            );
          d.npcs.splice(Number(b.dataset.npcDelete), 1);
        }
        if (b.dataset.qAction === "duplicate") {
          const c = structuredClone(q);
          c.id = `quest-${Date.now()}`;
          c.title += " (copie)";
          c.enabled = false;
          d.quests.push(c);
          selected = c.id;
        }
        if (b.dataset.qAction === "delete") {
          if (d.quests.some((x) => x.prerequisites.includes(q.id)))
            throw Error(
              "Cette quête est un prérequis : retirez la référence avant de la supprimer.",
            );
          d.quests.splice(d.quests.indexOf(q), 1);
          selected = null;
        }
        if (b.dataset.qAction === "stage" && q.stages.length < 20)
          q.stages.push({
            ...newQuest(q.giver).stages[0],
            id: `stage-${Date.now()}`,
            title: "Nouvelle étape",
          });
        if (b.dataset.qAction === "reward" && q.rewards.items.length < 12)
          q.rewards.items.push({ key: DEV_ITEMS[0].key, quantity: 1 });
        if (b.dataset.qRemoveReward !== undefined)
          q.rewards.items.splice(Number(b.dataset.qRemoveReward), 1);
        if (b.dataset.qAddObjective !== undefined) {
          const a = q.stages[Number(b.dataset.qAddObjective)].objectives;
          if (a.length < 8) a.push(newObjective("talk", q.giver));
        }
        if (b.dataset.qRemoveObjective) {
          const [si, oi] = b.dataset.qRemoveObjective.split(":").map(Number);
          if (q.stages[si].objectives.length > 1)
            q.stages[si].objectives.splice(oi, 1);
        }
        if (b.dataset.qRemoveStage !== undefined && q.stages.length > 1)
          q.stages.splice(Number(b.dataset.qRemoveStage), 1);
        if (b.dataset.qMove) {
          const [i, dir] = b.dataset.qMove.split(":").map(Number);
          [q.stages[i], q.stages[i + dir]] = [q.stages[i + dir], q.stages[i]];
        }
      });
    } catch (err) {
      status(err.message);
    }
  });
  header.addEventListener("click", (event) => {
    const b = event.target.closest("[data-workspace]");
    if (b) setTab(b.dataset.workspace);
  });
  return { render };
}
