import { ELEMENTS, SET_SLOTS, levelBand } from "./equipment.js";
export const CORE_FRAGMENT_COST = 10;
export function fragmentForEquipment(item) {
  if (
    !item ||
    item.chromatic ||
    !SET_SLOTS.includes(item.slot) ||
    !ELEMENTS[item.element]
  )
    return null;
  const band = levelBand(item.requiredLevel || 1),
    element = item.element;
  return {
    kind: "core-fragment",
    type: "material",
    name: `Fragment de noyau de ${ELEMENTS[element].name}`,
    element,
    band,
    chromatic: false,
    quantity: 1,
    color: ELEMENTS[element].color,
  };
}
export const matchingFragment = (item, element, min) =>
  item.kind === "core-fragment" &&
  !item.chromatic &&
  item.element === element &&
  item.band?.min === min &&
  item.band?.max === min + 9;
export const fragmentCount = (state, element, min = 1) =>
  state.bag
    .filter((item) => matchingFragment(item, element, min))
    .reduce((sum, item) => sum + item.quantity, 0);
export function fragmentGroups(state) {
  const keys = new Set(Object.keys(ELEMENTS).map((element) => `${element}:1`));
  for (const item of state.bag)
    if (
      item.kind === "core-fragment" &&
      ELEMENTS[item.element] &&
      Number.isSafeInteger(item.band?.min) &&
      item.band.min >= 1 &&
      item.band.min % 10 === 1
    )
      keys.add(`${item.element}:${item.band.min}`);
  return [...keys].map((key) => {
    const [element, min] = key.split(":");
    return {
      element,
      band: levelBand(Number(min)),
      quantity: fragmentCount(state, element, Number(min)),
    };
  });
}
