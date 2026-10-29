import { setProgress, wornSets, ELEMENTS } from "../data/equipment.js";
export const formatSetStats = (stats) =>
  Object.entries(stats)
    .map(([key, value]) =>
      key.startsWith("Résistance ") ? `+${value} % ${key}` : `+${value} ${key}`,
    )
    .join(" · ");
export function renderSetDetails(member, setId) {
  const progress = setProgress(member, setId);
  if (!progress) return "";
  const { set, count, active, next } = progress;
  return `<p class="set-info">${set.name} · Slime ${(set.elements||[set.element]).map(e=>ELEMENTS[e].name).join(" / ")} · Niveau ${set.minLevel} · ${count}/9 pièces portées</p><p class="set-active" data-active-set="${set.id}">${active ? `Bonus actif (${count} pièces) : ${formatSetStats(active.stats)}` : "Bonus à partir de 2 pièces distinctes."}</p>${next ? `<p class="set-next">Prochain palier : ${next.pieces} pièces · ${formatSetStats(next.stats)}</p>` : '<p class="set-next">Panoplie complète · Tous les bonus sont actifs.</p>'}<details class="set-bonus-details" data-set-bonus-details="${set.id}"><summary>Voir les bonus de 2 à 9 pièces</summary><p>Chaque palier indique le bonus total et remplace le précédent. Pièces normales et chromatiques comptent ensemble.</p><ol>${set.bonuses.map((tier) => `<li data-set-tier="${tier.pieces}" class="${active?.pieces === tier.pieces ? "current" : tier.pieces < count ? "unlocked" : "locked"}"><strong>${tier.pieces} pièces${active?.pieces === tier.pieces ? " · actif" : ""}</strong><span>${formatSetStats(tier.stats)}</span></li>`).join("")}</ol></details>`;
}
export function renderWornSets(member) {
  const sets = wornSets(member);
  return `<section class="worn-set-bonuses"><h3>Bonus de panoplie</h3><p>Inclus dans vos caractéristiques. Une pièce par emplacement ; les versions chromatiques comptent dans la même panoplie.</p>${sets.length ? sets.map((p) => `<article data-worn-set="${p.set.id}"><strong>${p.set.name} · ${p.count}/9 pièces</strong><p>${p.active ? formatSetStats(p.active.stats) : "Aucun bonus avant 2 pièces."}</p>${p.next ? `<small>Prochain palier : ${p.next.pieces} pièces · ${formatSetStats(p.next.stats)}</small>` : "<small>Panoplie complète</small>"}</article>`).join("") : "<p>Aucune pièce de panoplie portée.</p>"}</section>`;
}
export function renderResistances(stats) {
  return `<section class="equipment-resistances"><h3>Résistances élémentaires</h3><div>${Object.values(
    ELEMENTS,
  )
    .map(
      (e) =>
        `<span>${e.name}<strong>${stats[`Résistance ${e.name}`] || 0} %</strong></span>`,
    )
    .join("")}</div></section>`;
}
