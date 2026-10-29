import { sections, disclosure } from "./organization.js";
import { SLOTS } from "../dev/sandbox.js";
import { ELEMENTS } from "../data/equipment.js";
import { MONSTERS } from "../data/monsters.js";
import { HYBRID_SLIMES } from "../data/hybrid-slimes.js";
const button = (action, label, disabled = false) =>
  `<button data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
const buttons = (items) =>
  `<div class="tool-buttons">${items.map(([action, label, disabled]) => button(action, label, disabled)).join("")}</div>`;
export function renderDevTools(s, source = "slime") {
  const progression = `<section class="tool-group"><h3>Personnages</h3>${buttons(
    [
      ["xp", "+50 XP à l’équipe"],
      ["heal", "Soigner la troupe"],
      ["spell-charge", "Charger les ultimes"],
    ],
  )}<button data-action="auto" aria-pressed="${s.autoAttack}">Attaque auto · ${s.autoAttack ? "Oui" : "Non"}</button></section><section class="tool-group"><h3>Métiers</h3>${buttons(
    [
      ["job-xp", "+30 XP bûcheron"],
      ["handyman-xp", "+30 XP bricoleur"],
      ["job-wood", "10 bois de frêne"],
    ],
  )}</section>`;
  const objects = `<section class="tool-group"><h3>Panoplies</h3>${buttons([
    ["maximized-sets", "4 panoplies débutantes chromatiques"],
    ["boss-sets", "4 panoplies biélément · Niv. 10"],
    ["boss-materials", "Matériaux chromatiques biélément"],
    ["boss-loot", "4 familiers + 4 morceaux royaux"],
  ])}</section><section class="tool-group"><h3>Noyaux</h3><small>Débutants</small><div class="tool-buttons">${Object.entries(
    ELEMENTS,
  )
    .map(([id, e]) => `<button data-core="${id}">${e.name}</button>`)
    .join(
      "",
    )}</div><small>Biélément · Niveau 10</small><div class="tool-buttons">${Object.values(
    HYBRID_SLIMES,
  )
    .map((h) => `<button data-core="${h.id}">${h.name}</button>`)
    .join(
      "",
    )}</div></section><section class="tool-group"><h3>Ressources</h3><label for="loot-monster">Monstre</label><select id="loot-monster">${MONSTERS.filter(
    (m) => !m.boss,
  )
    .map(
      (m) =>
        `<option value="${m.id}" ${m.id === source ? "selected" : ""}>${m.name}</option>`,
    )
    .join(
      "",
    )}</select><div class="loot-buttons"><button data-loot="normal">Normale</button><button data-loot="rare">Rare</button><button data-loot="normal" data-chromatic="true">Normale chromatique</button><button data-loot="rare" data-chromatic="true">Rare chromatique</button></div></section>${disclosure(
    "dev-key-supplies",
    "Ingrédients de clés",
    buttons([
      ["key-supplies", "Crevasse"],
      ["volcano-key-supplies", "Volcan"],
      ["storm-key-supplies", "Tempêtes"],
      ["furnace-key-supplies", "Vents Rouges"],
    ]),
  )}${disclosure("dev-trial-equipment", "Équipement d’essai", `<label for="equipment-slot">Emplacement</label><select id="equipment-slot">${SLOTS.map((slot) => `<option>${slot}</option>`).join("")}</select>${button("equipment", "Ajouter au sac")}`)}`;
  const blocked = s.zone === "tutorial";
  const travel = `<section class="tool-group"><h3>Village</h3>${buttons([
    ["home", "Maison"],
    ["forge-teleport", "Forge"],
    ["animalerie", "Animalerie"],
    ["fountain-teleport", "Fontaine"],
    ["handyman-teleport", "Bricoleur"],
    ["sawmill-teleport", "Scierie"],
    ["woodcutting-teleport", "Bosquet"],
    ["combat", "Combat"],
  ])}</section><section class="tool-group"><h3>Zones</h3>${buttons(
    [
      ["marsh-teleport", "Marais"],
      ["mountains-teleport", "Montagnes"],
      ["fire-teleport", "Braises"],
      ["wind-teleport", "Alizés"],
    ].map(([a, l]) => [a, l, blocked]),
  )}</section><section class="tool-group"><h3>Donjons · Accès gratuit en dev</h3>${buttons(
    [
      ["depths-teleport", "Crevasse"],
      ["volcano-teleport", "Volcan"],
      ["storm-teleport", "Tempêtes"],
      ["furnace-teleport", "Vents Rouges"],
    ].map(([a, l]) => [a, l, blocked]),
  )}<h3>Approcher un boss</h3>${buttons(
    [
      ["boss-teleport", "Gorgelimon"],
      ["volcano-boss-teleport", "Pyroclaste"],
      ["storm-boss-teleport", "Nimbulimon"],
      ["furnace-boss-teleport", "Siroccolimon"],
    ].map(([a, l]) => [a, l, blocked]),
  )}</section>`;
  return `<div class="panel-heading"><p class="eyebrow">DÉVELOPPEMENT</p><h2>Outils de test</h2>${button("chest-teleport", "Rejoindre le coffre · Tous les objets ×99", blocked)}</div>${sections(
    "dev-tools",
    [
      { id: "progress", label: "Progression", content: progression },
      { id: "objects", label: "Objets", content: objects },
      { id: "travel", label: "Voyages", content: travel },
      {
        id: "journal",
        label: "Journal",
        content: `<section class="journal"><h3>Derniers événements</h3><ul>${s.log.map((line) => `<li>${line}</li>`).join("")}</ul></section>`,
      },
    ],
  )}`;
}
