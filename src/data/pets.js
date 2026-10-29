import { HYBRID_SLIMES } from "./hybrid-slimes.js";
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
export const BOSS_PETS = Object.freeze(
  Object.values(HYBRID_SLIMES).map((h) =>
    Object.freeze({
      id: `pet-${h.id}`,
      setId: h.id,
      element: h.elements[0],
      elements: h.elements,
      monster: h.monster,
      boss: h.boss,
      name: h.pet,
      food: h.rare,
      hybridId: h.id,
      dropChance: 0.05,
    }),
  ),
);
export const ALL_PETS = Object.freeze([...PETS, ...BOSS_PETS]);
export function petDefinition(id) {
  if (!id) return undefined;
  return ALL_PETS.find(
    (p) => p.id === id || p.setId === id || (!p.setId && p.element === id),
  );
}
export const petLevelXp = (level) => level * 10;
export function petStats(element, level) {
  const def = petDefinition(element);
  if (def?.elements)
    return {
      Vitalité: level * 2,
      ...Object.fromEntries(
        def.elements.map((e) => [ELEMENTS[e].stat, level + 1]),
      ),
    };
  return { [ELEMENTS[def?.element || element].stat]: level + 1 };
}
export function createPet(element) {
  const def = petDefinition(element);
  if (!def) throw new Error("Familier inconnu");
  return {
    kind: "pet",
    petId: def.id,
    petSpecies: def.monster,
    name: def.name,
    element: def.element,
    ...(def.elements
      ? { elements: [...def.elements], hybridId: def.hybridId }
      : {}),
    slot: "Familier",
    level: 1,
    xp: 0,
    requiredLevel: def.elements ? 10 : 1,
    stats: petStats(def.id, 1),
    color: HYBRID_SLIMES[def.setId]?.color || ELEMENTS[def.element].color,
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
