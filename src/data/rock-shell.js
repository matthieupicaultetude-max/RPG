// Earth gel uses the same amber palette in the mountains and underground.
export const AMBER_SLIME = Object.freeze({
  dark: "#8f672e",
  base: "#c59a4d",
  light: "#efd497",
  edge: "#9c7137",
  core: "#e6bb68",
});
export const hasRockShell = (m) =>
  m.mountainSlime === true ||
  m.species === "mountain-slime" ||
  ((m.depthsSlime === true || m.species?.startsWith("depths-")) &&
    (m.element === "earth" ||
      m.species === "depths-earth-slime" ||
      m.dualElement === true));
export function mergedShellBroken(a, b) {
  const earthParts = [a, b].filter(hasRockShell);
  return (
    earthParts.length > 0 && earthParts.every((m) => m.shellBroken === true)
  );
}
