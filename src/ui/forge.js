import { CHROMATIC_POWER, chromaticVersion } from "../data/chromatic.js";
import { forgeItems, nearForge, recipeStatus } from "../game/forge.js";
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
  return `<div class="petshop-heading"><p class="eyebrow">FORGE DU VILLAGE</p><h2>Borin · Artisan chromatique</h2><p>« Confie-moi une pièce et les ressources de son monstre : je conserverai ses caractéristiques et lui ajouterai +${CHROMATIC_POWER} Puissance. »</p><span class="shop-location">${nearby ? "Vous êtes près de Borin · Forge disponible" : "Rejoignez Borin à la forge · Touche F à proximité"}</span></div><div class="forge-layout"><section><h3>Pièces à améliorer</h3><div class="forge-items">${items.map((gear) => `<button data-forge-select="${gear.id}" aria-pressed="${gear.id === item?.id}">${renderItemIcon(gear)}<span>${gear.name}<small>${state.bag.includes(gear) ? "Dans le sac" : "Équipé"}</small></span></button>`).join("") || '<p class="panel-hint">Obtenez une pièce de panoplie dans un noyau pour commencer.</p>'}</div></section><section class="forge-recipe">${
    item
      ? `<div class="forge-preview"><div>${renderItemIcon(item)}<small>Pièce d’origine</small></div><span>→</span><div class="chromatic-preview">${renderItemIcon(chromaticVersion(item))}<small>Version chromatique</small></div></div><h3>${item.name} chromatique</h3><p class="panel-hint">${owner ? `Porté par ${owner.name}` : "Dans le sac"} · La pièce est transformée, sans duplication.</p><p class="forge-stats">${Object.entries(
          chromaticVersion(item).stats,
        )
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(
            " · ",
          )}</p><h4>Ressources nécessaires</h4><ul class="forge-costs">${recipe.map((ingredient) => `<li class="${ingredient.available >= ingredient.quantity ? "enough" : "missing"}">${renderItemIcon(ingredient)}<span>${ingredient.name}${ingredient.chromatic ? " chromatique" : ingredient.kind==="plank"?"":" standard"}<small>${ingredient.kind==="plank"?"Planche · Niveau 1":ingredient.type === "rare" ? "Rare" : "Normale"}</small></span><strong>${ingredient.available}/${ingredient.quantity}</strong></li>`).join("")}</ul><button data-forge-upgrade="${item.id}" ${!nearby || recipe.some((ingredient) => ingredient.available < ingredient.quantity) ? "disabled" : ""}>Améliorer en chromatique · +${CHROMATIC_POWER} Puissance</button>`
      : '<h3>Aucune pièce disponible</h3><p class="panel-hint">Les pièces déjà chromatiques, trophées et familiers ne peuvent pas être améliorés ici.</p>'
  }<p class="panel-hint">Chaque pièce possède une aura. Portez les neuf pièces chromatiques d’une même panoplie pour activer l’aura de déplacement. Les ressources rares chromatiques sont réservées aux familiers.</p></section></div>`;
}
