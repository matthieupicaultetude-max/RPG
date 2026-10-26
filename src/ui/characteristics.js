import { ALLOCATABLE_STATS, nearFountain } from "../data/progression.js";
import { characterStats, equipmentStats } from "../data/equipment.js";
const help = {
  Vitalité: "+1 PV maximum. Investir ne soigne pas.",
  Force: "Augmente les sorts Terre.",
  Intelligence: "Augmente les sorts Feu.",
  Agilité: "Augmente les sorts Air.",
  Chance: "Augmente les sorts Eau.",
  Sagesse: "+1 % d’XP gagnée par point.",
};
export function renderCharacteristics(state) {
  const member = state.team[state.main],
    total = characterStats(member),
    gear = equipmentStats(member),
    nearby = nearFountain(state),
    spent = Object.values(member.allocatedStats).reduce((a, b) => a + b, 0);
  return `<div class="petshop-heading"><p class="eyebrow">PROGRESSION DU PERSONNAGE</p><h2>Caractéristiques de ${member.name}</h2><p>Niveau ${member.level} · 5 points par montée de niveau · 1 point investi = +1 caractéristique.</p></div><div class="spellbook-party">${state.team.map((m) => `<button data-main="${m.id}" aria-pressed="${m.id === state.main}">${m.name}</button>`).join("")}</div><div class="characteristic-budget"><strong>${member.characteristicPoints} points disponibles</strong><label for="stat-quantity">Points par clic <input id="stat-quantity" type="number" min="1" step="1" max="${Math.max(1, member.characteristicPoints)}" value="1" ${member.characteristicPoints ? "" : "disabled"}/></label></div><div class="characteristics-grid">${ALLOCATABLE_STATS.map((stat) => `<article><div><h3>${stat}</h3><p>${help[stat]}</p></div><strong>${total[stat] || 0}</strong><small>${member.allocatedStats[stat]} investis · ${gear[stat] || 0} équipement</small><button data-allocate-stat="${stat}" ${member.characteristicPoints ? "" : "disabled"}>Investir en ${stat}</button></article>`).join("")}</div><section class="fountain-reset"><h3>Fontaine du renouveau</h3><p>La fontaine du village restitue gratuitement les points investis de ce personnage. Vos équipements, sorts, XP et niveaux sont conservés.</p><span class="shop-location">${nearby ? "Vous êtes près de la fontaine" : "Rejoignez la fontaine du village · F à proximité"}</span><button data-reset-characteristics ${!nearby || !spent ? "disabled" : ""}>Réinitialiser · Récupérer ${spent} points</button><small>La réinitialisation ne soigne pas. Les PV actuels sont limités au nouveau maximum.</small></section>`;
}
