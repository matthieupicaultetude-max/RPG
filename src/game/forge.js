import { emitSound } from "../audio/events.js";
import {
  canUpgrade,
  CHROMATIC_POWER,
  chromaticRecipe,
  chromaticVersion,
} from "../data/chromatic.js";
import { FORGE } from "../world/map.js";

export const nearForge = (state) =>
  Math.hypot(state.player.x - FORGE.npc.x, state.player.y - FORGE.npc.y) < 48;
export function forgeItems(state) {
  return [
    ...state.bag,
    ...state.team.flatMap((member) => Object.values(member.equipment)),
  ].filter(canUpgrade);
}
const matches = (item, ingredient) =>
  !item.slot &&
  item.kind !== "core" &&
  item.name === ingredient.name &&
  item.type === ingredient.type &&
  item.chromatic === ingredient.chromatic &&
  (!ingredient.kind || item.kind === ingredient.kind) &&
  (!ingredient.wood || item.wood === ingredient.wood);
export function recipeStatus(state, item) {
  return chromaticRecipe(item).map((ingredient) => ({
    ...ingredient,
    available: state.bag
      .filter((resource) => matches(resource, ingredient))
      .reduce((sum, resource) => sum + resource.quantity, 0),
  }));
}
export function upgradeChromatic(state, id) {
  const tell = (text) => {
    state.log.unshift(text);
    state.log.length = Math.min(6, state.log.length);
    state.revision++;
  };
  if (!nearForge(state)) {
    tell("Approchez de Borin à la forge.");
    return null;
  }
  const item = forgeItems(state).find((item) => item.id === id);
  if (!item) return null;
  const recipe = recipeStatus(state, item);
  if (recipe.some((ingredient) => ingredient.available < ingredient.quantity)) {
    tell("Il manque des ressources pour cette amélioration.");
    return null;
  }
  // Validate all costs before consuming anything. Upgrade the same object, including equipped pieces.
  for (const ingredient of recipe) {
    let remaining = ingredient.quantity;
    for (const resource of state.bag.filter((resource) =>
      matches(resource, ingredient),
    )) {
      const used = Math.min(remaining, resource.quantity);
      resource.quantity -= used;
      remaining -= used;
      if (!remaining) break;
    }
  }
  state.bag = state.bag.filter((item) => item.quantity > 0);
  Object.assign(item, chromaticVersion(item));
  emitSound(state,"forge",state.player,{owner:state.main});
  tell(
    `${item.name} amélioré en chromatique : +${CHROMATIC_POWER} Puissance !`,
  );
  return item;
}
