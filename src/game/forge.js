import {putInBag,takeOne} from './item-stacks.js';
import {HYBRID_SLIMES} from '../data/hybrid-slimes.js';
import {
  fragmentForEquipment,
  matchingFragment,
  fragmentCount,
  CORE_FRAGMENT_COST,
} from "../data/core-fragments.js";
import {
  ELEMENTS,
  createCore,
  createHybridCore,
  syncEquipmentHealth,
} from "../data/equipment.js";
import { emitSound } from "../audio/events.js";
import {
  canUpgrade,
  CHROMATIC_POWER,
  chromaticRecipe,
  chromaticVersion,
} from "../data/chromatic.js";
import { FORGE } from "../world/map.js";

export const nearForge = (state) =>
  (state.zone||"garden")==="garden" &&
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
  let item = forgeItems(state).find((item) => item.id === id);
  if (!item) return null;
  const recipe = recipeStatus(state, item);
  if (recipe.some((ingredient) => ingredient.available < ingredient.quantity)) {
    tell("Il manque des ressources pour cette amélioration.");
    return null;
  }
  // Split one piece only after the complete recipe has been validated.
  const split=state.bag.includes(item)&&item.quantity>1;
  if(split)item=takeOne(state,item.id);
  // Equipped or single pieces retain their identity.
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
  emitSound(state, "forge", state.player, { owner: state.main });
  tell(
    `${item.name} amélioré en chromatique : +${CHROMATIC_POWER} Puissance !`,
  );
  return split?putInBag(state,item):item;
}

export function recyclableItems(state) {
  return [
    ...state.bag,
    ...state.team.flatMap((member) => Object.values(member.equipment)),
  ].filter((item) => fragmentForEquipment(item));
}
function recordExchange(state, text) {
  state.log.unshift(text);
  state.log.length = Math.min(6, state.log.length);
  state.revision++;
  emitSound(state, "forge", state.player, { owner: state.main });
}
export function recycleEquipment(state, id) {
  if (!nearForge(state)) return null;
  const item = recyclableItems(state).find((item) => item.id === id);
  if (!item) return null;
  const fragment = fragmentForEquipment(item);
  const index = state.bag.findIndex((gear) => gear.id === id);
  if (index >= 0) {
    if (state.bag[index].quantity > 1) state.bag[index].quantity--;
    else state.bag.splice(index, 1);
  } else {
    const owner = state.team.find(
      (member) => member.equipment[item.slot]?.id === id,
    );
    if (!owner) return null;
    delete owner.equipment[item.slot];
    syncEquipmentHealth(owner);
  }
  const existing = state.bag.find((resource) =>
    matchingFragment(resource, fragment.setId||fragment.element, fragment.band.min),
  );
  if (existing) existing.quantity++;
  else state.bag.push({ ...fragment, id: state.nextItem++ });
  recordExchange(
    state,
    `${item.name} recyclé : +1 ${fragment.name} (niveaux ${fragment.band.min}–${fragment.band.max}).`,
  );
  return existing || state.bag.at(-1);
}
export function exchangeCoreFragments(state, element, min = 1) {
  if (
    !nearForge(state) ||
    !(ELEMENTS[element]||HYBRID_SLIMES[element]) ||
    !Number.isSafeInteger(min) ||
    min < 1 ||
    (HYBRID_SLIMES[element]?min!==10:min%10!==1) ||
    fragmentCount(state, element, min) < CORE_FRAGMENT_COST
  )
    return null;
  let remaining = CORE_FRAGMENT_COST;
  for (const item of state.bag.filter((item) =>
    matchingFragment(item, element, min),
  )) {
    const used = Math.min(remaining, item.quantity);
    item.quantity -= used;
    remaining -= used;
    if (!remaining) break;
  }
  state.bag = state.bag.filter((item) => item.quantity > 0);
  const existing = state.bag.find(
    (item) =>
      item.kind === "core" &&
      !item.chromatic &&
      (HYBRID_SLIMES[element]?item.setId===element:!item.setId&&item.element===element) &&
      item.band.min === min,
  );
  const core = existing || {
    ...(HYBRID_SLIMES[element]?createHybridCore(element):createCore(element, min)),
    id: state.nextItem++,
  };
  if (existing) existing.quantity++;
  else state.bag.push(core);
  recordExchange(
    state,
    `10 fragments échangés contre un ${core.name} (niveaux ${core.band.min}–${core.band.max}).`,
  );
  return core;
}
