import { ELEMENTS, SET_SLOTS, levelBand } from "./equipment.js";
import { HYBRID_SLIMES } from "./hybrid-slimes.js";
export const CORE_FRAGMENT_COST = 10;
export const coreType = (key) =>
  HYBRID_SLIMES[key]
    ? { ...HYBRID_SLIMES[key], element: HYBRID_SLIMES[key].elements[0] }
    : ELEMENTS[key]
      ? { ...ELEMENTS[key], element: key }
      : null;
export function fragmentForEquipment(item) {
  if (
    !item ||
    item.chromatic ||
    !SET_SLOTS.includes(item.slot) ||
    !ELEMENTS[item.element]
  )
    return null;
  const hybrid = HYBRID_SLIMES[item.setId],
    band = hybrid ? { min: 10, max: 19 } : levelBand(item.requiredLevel || 1);
  return {
    kind: "core-fragment",
    type: "material",
    name: `Fragment de noyau de ${hybrid?.name || ELEMENTS[item.element].name}`,
    element: item.element,
    ...(hybrid ? { setId: hybrid.id, elements: [...hybrid.elements] } : {}),
    band,
    chromatic: false,
    quantity: 1,
    color: hybrid?.color || ELEMENTS[item.element].color,
  };
}
export const matchingFragment = (item, key, min) =>
  item.kind === "core-fragment" &&
  !item.chromatic &&
  (HYBRID_SLIMES[key]
    ? item.setId === key
    : !item.setId && item.element === key) &&
  item.band?.min === min &&
  item.band?.max === min + 9;
export const fragmentCount = (state, key, min = 1) =>
  state.bag
    .filter((i) => matchingFragment(i, key, min))
    .reduce((n, i) => n + i.quantity, 0);
export function fragmentGroups(state) {
  const keys = new Set([
    ...Object.keys(ELEMENTS).map((e) => `${e}:1`),
    ...Object.keys(HYBRID_SLIMES).map((id) => `${id}:10`),
  ]);
  for (const item of state.bag) {
    const key = item.setId || item.element,
      min = item.band?.min;
    if (
      item.kind === "core-fragment" &&
      coreType(key) &&
      Number.isSafeInteger(min) &&
      (HYBRID_SLIMES[key] ? min === 10 : min >= 1 && min % 10 === 1)
    )
      keys.add(`${key}:${min}`);
  }
  return [...keys].map((k) => {
    const [element, n] = k.split(":"),
      min = Number(n);
    return {
      element,
      band: { min, max: min + 9 },
      quantity: fragmentCount(state, element, min),
    };
  });
}
