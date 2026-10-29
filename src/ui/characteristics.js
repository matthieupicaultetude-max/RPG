import { renderWornSets, renderResistances } from "./set-bonuses.js";
import { sections, disclosure } from "./organization.js";
import { ALLOCATABLE_STATS, nearFountain } from "../data/progression.js";
import { characterStats, equipmentStats } from "../data/equipment.js";
const help = {
  Vitalité: "+1 PV max.",
  Force: "Dégâts Terre",
  Intelligence: "Dégâts Feu",
  Agilité: "Dégâts Air",
  Chance: "Dégâts Eau",
  Sagesse: "+1 % XP par point",
};
export function renderCharacteristics(state) {
  const m = state.team[state.main],
    total = characterStats(m),
    gear = equipmentStats(m),
    nearby = nearFountain(state),
    spent = Object.values(m.allocatedStats).reduce((a, b) => a + b, 0);
  const allocate = `<div class="characteristic-budget"><strong>${m.characteristicPoints} points disponibles</strong><label for="stat-quantity">Points par clic <input id="stat-quantity" type="number" min="1" step="1" max="${Math.max(1, m.characteristicPoints)}" value="1" ${m.characteristicPoints ? "" : "disabled"}/></label></div><div class="characteristics-grid">${ALLOCATABLE_STATS.map((stat) => `<article><div><h3>${stat}</h3><p>${help[stat]}</p></div><strong>${total[stat] || 0}</strong><small>${m.allocatedStats[stat]} investis · ${gear[stat] || 0} équipement</small><button data-allocate-stat="${stat}" ${m.characteristicPoints ? "" : "disabled"}>+ ${stat}</button></article>`).join("")}</div><p class="panel-hint">5 points par niveau. La vitalité investie ne soigne pas.</p>`;
  const combat = `<div class="stat-summary">${[
    ["PV", `${m.hp} / ${m.maxHp}`],
    ["Puissance", total.Puissance || 0],
    ["Bonus XP", `+${total.Sagesse || 0} %`],
    ["Niveau", m.level],
  ]
    .map(
      ([name, value]) =>
        `<article><span>${name}</span><strong>${value}</strong></article>`,
    )
    .join(
      "",
    )}</div>${renderResistances(total)}${disclosure("characteristic-formulas", "Comprendre les bonus", "<p>Puissance : bonus de dégâts et soins dans tous les éléments. Sagesse : bonus d’XP. Les valeurs affichées incluent l’équipement et les panoplies.</p>")}`;
  const reset = `<section class="fountain-reset"><h3>Fontaine du renouveau</h3><p>Récupérez les ${spent} points investis de ${m.name}.</p><span class="shop-location">${nearby ? "Fontaine à portée" : "Rejoignez la fontaine du village · F"}</span><button data-reset-characteristics ${!nearby || !spent ? "disabled" : ""}>Réinitialiser · ${spent} points</button><small>Niveaux, sorts et équipement conservés. Aucun soin.</small></section>`;
  return `<div class="petshop-heading"><p class="eyebrow">HÉROS · NIVEAU ${m.level}</p><h2>Caractéristiques</h2></div><div class="spellbook-party">${state.team.map((member) => `<button data-main="${member.id}" aria-pressed="${member.id === state.main}">${member.name}</button>`).join("")}</div>${sections(
    "characteristics",
    [
      { id: "allocate", label: "Répartition", content: allocate },
      { id: "combat", label: "Combat", content: combat },
      { id: "sets", label: "Panoplies", content: renderWornSets(m) },
      { id: "reset", label: "Réinitialiser", content: reset },
    ],
  )}`;
}
