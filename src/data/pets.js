import { ELEMENTS } from "./equipment.js";
import { monsterDefinition } from "./monsters.js";

export const PET_MAX_LEVEL = 20;
export const PET_FOOD_XP = 10;
const recipes = [
  ["earth", "boar", "Roncinet"],
  ["fire", "firefly", "Flammèche"],
  ["air", "moth", "Zéphyr"],
  ["water", "slime", "Gélutin"],
];
export const PETS = Object.freeze(
  recipes.map(([element, monster, name]) =>
    Object.freeze({
      id: `pet-${element}`,
      element,
      monster,
      name,
      food: monsterDefinition(monster).rare,
    }),
  ),
);
export function petDefinition(id) {
  return PETS.find((p) => p.id === id || p.element === id);
}
export const petLevelXp = (level) => level * 10;
export function petStats(element, level) {
  return { [ELEMENTS[element].stat]: level + 1 };
}
export function createPet(element) {
  const def = petDefinition(element);
  if (!def) throw new Error("Familier inconnu");
  return {
    kind: "pet",
    petId: def.id,
    petSpecies: def.monster,
    name: def.name,
    element,
    slot: "Familier",
    level: 1,
    xp: 0,
    requiredLevel: 1,
    stats: petStats(element, 1),
    color: ELEMENTS[element].color,
    quantity: 1,
    chromatic: false,
  };
}
export function foodQuantity(state, pet) {
  const def = petDefinition(pet.petId);
  if (!def) return 0;
  return state.bag
    .filter((i) => i.name === def.food && i.type === "rare" && i.chromatic)
    .reduce((n, i) => n + i.quantity, 0);
}
