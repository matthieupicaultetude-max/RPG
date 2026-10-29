import { HYBRID_SLIMES, hybridResource } from "./hybrid-slimes.js";
import { woodItem } from "./woodcutting.js";
import { ALL_SETS, SET_SLOTS } from "./equipment.js";
import { MONSTERS } from "./monsters.js";

export const CHROMATIC_POWER = 2;
export const CHROMATIC_COLORS = {
  depths: "#b4ece1",
  magma: "#ffb9d3",
  storm: "#c2caff",
  furnace: "#ffd1a6",
  earth: "#c6b3f0",
  fire: "#f7a9dd",
  air: "#b0f5ed",
  water: "#a6c2ff",
};
export function canUpgrade(item) {
  return (
    !!item &&
    !item.chromatic &&
    ALL_SETS.some(
      (set) =>
        set.id === item.setId &&
        set.element === item.element &&
        set.pieces.some((piece) => piece.slot === item.slot),
    )
  );
}
export function chromaticVersion(item) {
  if (!canUpgrade(item)) return null;
  return {
    ...item,
    chromatic: true,
    color: CHROMATIC_COLORS[item.setId] || CHROMATIC_COLORS[item.element],
    stats: {
      ...item.stats,
      Puissance: (item.stats?.Puissance || 0) + CHROMATIC_POWER,
    },
  };
}
export function chromaticRecipe(item) {
  if (HYBRID_SLIMES[item?.setId])
    return [
      { ...woodItem("walnut", "wood"), quantity: 1 },
      { ...hybridResource(item.setId, "normal", true), quantity: 1 },
    ];
  const monster = MONSTERS.find((m) => m.element === item?.element);
  if (!monster) return [];
  return [
    { name: monster.normal, type: "normal", chromatic: true, quantity: 1 },
    { name: monster.normal, type: "normal", chromatic: false, quantity: 10 },
    { name: monster.rare, type: "rare", chromatic: false, quantity: 5 },
    { ...woodItem("ash", "plank"), quantity: 5 },
  ];
}
export function completeChromaticSet(member) {
  const first = member.equipment?.[SET_SLOTS[0]];
  if (!first?.chromatic || !ALL_SETS.some((set) => set.id === first.setId))
    return null;
  return SET_SLOTS.every(
    (slot) =>
      member.equipment[slot]?.chromatic &&
      member.equipment[slot].setId === first.setId &&
      member.equipment[slot].slot === slot,
  )
    ? first.setId
    : null;
}
