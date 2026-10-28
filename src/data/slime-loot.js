export const SLIME_RESOURCES = Object.freeze({
  water: Object.freeze({
    normal: "Gelée d’eau",
    rare: "Cœur d’eau",
    base: "#5babc3",
    light: "#bceaf0",
    dark: "#32657d",
  }),
  earth: Object.freeze({
    normal: "Gelée de terre",
    rare: "Cœur de terre",
    base: "#c59a4d",
    light: "#efd497",
    dark: "#8f672e",
  }),
  fire: Object.freeze({
    normal: "Gelée de feu",
    rare: "Cœur de feu",
    base: "#ef803d",
    light: "#ffcf72",
    dark: "#9b4535",
  }),
  air: Object.freeze({
    normal: "Gelée d’air",
    rare: "Cœur d’air",
    base: "#8ed8d0",
    light: "#d8f5d8",
    dark: "#4b999d",
  }),
});
export const monsterElements = (m) =>
  m.dualElement ? ["water", "earth"] : [...new Set(m.elements || [m.element])];
export function slimeResource(element, type = "normal", chromatic = false) {
  const r = SLIME_RESOURCES[element];
  return r
    ? {
        name: type === "rare" ? r.rare : r.normal,
        type,
        chromatic,
        element,
        kind: "slime-resource",
      }
    : null;
}
export function slimeResourceByName(name) {
  for (const [element, r] of Object.entries(SLIME_RESOURCES))
    for (const type of ["normal", "rare"])
      if (name === r[type]) return slimeResource(element, type);
  return null;
}
