import {formatSetStats} from './set-bonuses.js';
import { ELEMENTS } from "../data/equipment.js";
import {
  coreType,
  fragmentGroups,
  fragmentForEquipment,
  CORE_FRAGMENT_COST,
} from "../data/core-fragments.js";
import { CHROMATIC_POWER, chromaticVersion } from "../data/chromatic.js";
import {
  forgeItems,
  nearForge,
  recipeStatus,
  recyclableItems,
} from "../game/forge.js";
import { renderItemIcon } from "./item-art.js";

export function renderForge(state, selectedId) {
  const items = forgeItems(state),
    item = items.find((item) => item.id === selectedId) || items[0],
    nearby = nearForge(state);
  const recipe = item ? recipeStatus(state, item) : [];
  const owner =
    item &&
    state.team.find((member) =>
      Object.values(member.equipment).some((gear) => gear.id === item.id),
    );
  return `<div class="petshop-heading"><p class="eyebrow">FORGE DU VILLAGE</p><h2>Borin · Forgeron</h2><p>« Confie-moi une pièce et les ressources de son monstre : je conserverai ses caractéristiques et lui ajouterai +${CHROMATIC_POWER} Puissance. »</p><span class="shop-location">${nearby ? "Vous êtes près de Borin · Forge disponible" : "Rejoignez Borin à la forge · Touche F à proximité"}</span></div><div class="forge-layout"><section><h3>Pièces à améliorer</h3><div class="forge-items">${items.map((gear) => `<button data-forge-select="${gear.id}" aria-pressed="${gear.id === item?.id}">${renderItemIcon(gear)}<span>${gear.name}<small>${state.bag.includes(gear) ? "Dans le sac" : "Équipé"}</small></span></button>`).join("") || '<p class="panel-hint">Obtenez une pièce de panoplie dans un noyau pour commencer.</p>'}</div></section><section class="forge-recipe">${
    item
      ? `<div class="forge-preview"><div>${renderItemIcon(item)}<small>Pièce d’origine</small></div><span>→</span><div class="chromatic-preview">${renderItemIcon(chromaticVersion(item))}<small>Version chromatique</small></div></div><h3>${item.name} chromatique</h3><p class="panel-hint">${owner ? `Porté par ${owner.name}` : "Dans le sac"} · La pièce est transformée, sans duplication.</p><p class="forge-stats">${formatSetStats(chromaticVersion(item).stats)}</p><h4>Ressources nécessaires</h4><ul class="forge-costs">${recipe.map((ingredient) => `<li class="${ingredient.available >= ingredient.quantity ? "enough" : "missing"}">${renderItemIcon(ingredient)}<span>${ingredient.name}${ingredient.chromatic ? " chromatique" : ingredient.kind === "plank" ? "" : " standard"}<small>${ingredient.kind === "wood" ? "Bois · Récolte niveau 10" : ingredient.kind === "plank" ? "Planche · Niveau 1" : ingredient.type === "rare" ? "Rare" : "Normale"}</small></span><strong>${ingredient.available}/${ingredient.quantity}</strong></li>`).join("")}</ul><button data-forge-upgrade="${item.id}" ${!nearby || recipe.some((ingredient) => ingredient.available < ingredient.quantity) ? "disabled" : ""}>Améliorer en chromatique · +${CHROMATIC_POWER} Puissance</button>`
      : '<h3>Aucune pièce disponible</h3><p class="panel-hint">Les pièces déjà chromatiques, trophées et familiers ne peuvent pas être améliorés ici.</p>'
  }<p class="panel-hint">Chaque pièce possède une aura. Portez les neuf pièces chromatiques d’une même panoplie pour activer l’aura de déplacement. Les ressources rares chromatiques sont réservées aux familiers.</p></section></div>${renderRecycling(state, nearby)}`;
}

function renderRecycling(state, nearby) {
  return `<section class="forge-recycling"><h3>Recycler les pièces normales</h3><p>Une pièce normale donne un fragment du même élément et de sa tranche de niveaux. Les armes, boucliers et bijoux de panoplie sont aussi acceptés. Une pièce recyclée est consommée ; une pièce équipée est retirée de son personnage. Les pièces chromatiques, familiers et trophées sont conservés.</p><div class="forge-items">${
    recyclableItems(state)
      .map((item) => {
        const fragment = fragmentForEquipment(item),
          owner = state.team.find(
            (member) => member.equipment[item.slot]?.id === item.id,
          );
        return `<div class="forge-recycle-item">${renderItemIcon(item)}<span>${item.name}<small>${owner ? `Porté par ${owner.name}` : "Dans le sac"} · ${coreType(fragment.setId||fragment.element).name} · Niv. ${fragment.band.min}–${fragment.band.max}</small></span><button data-forge-recycle="${item.id}" ${nearby ? "" : "disabled"}>Recycler${owner ? " la pièce équipée" : ""} · 1 fragment</button></div>`;
      })
      .join("") || "<p>Aucune pièce normale recyclable.</p>"
  }</div><h3>Échanger les fragments</h3><p>${CORE_FRAGMENT_COST} fragments du même élément et de la même tranche donnent un noyau correspondant. Les noyaux s’ouvrent partout.</p><div class="forge-fragments">${fragmentGroups(
    state,
  )
    .map(
      (group) =>
        `<article>${renderItemIcon({ kind: "core-fragment", element: coreType(group.element).element, setId: coreType(group.element).id })}<h4>${coreType(group.element).name} · Niv. ${group.band.min}–${group.band.max}</h4><p>${group.quantity} / ${CORE_FRAGMENT_COST} fragments</p><button data-exchange-core="${group.element}" data-fragment-level="${group.band.min}" ${!nearby || group.quantity < CORE_FRAGMENT_COST ? "disabled" : ""}>Échanger 10 fragments · 1 noyau</button></article>`,
    )
    .join("")}</div></section>`;
}
