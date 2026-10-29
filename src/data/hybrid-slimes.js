// Shared identity for each dungeon's set, core, materials, pet and royal key part.
export const HYBRID_SLIMES = Object.freeze(
  Object.fromEntries(
    [
      {
        id: "depths",
        name: "Gouffre",
        elements: ["water", "earth"],
        boss: "gorgelimon",
        monster: "depths-water-slime",
        pet: "Limonceau",
        color: "#649d97",
        normal: "Gelée de limon abyssal",
        rare: "Cœur de limon abyssal",
      },
      {
        id: "magma",
        name: "Pyroclaste",
        elements: ["earth", "fire"],
        boss: "volcano-slime",
        monster: "magma-slime",
        pet: "Pyrolin",
        color: "#c27d4d",
        normal: "Gelée de magma",
        rare: "Cœur de magma",
      },
      {
        id: "storm",
        name: "Nimbulimon",
        elements: ["air", "water"],
        boss: "nimbulimon",
        monster: "foam-slime",
        pet: "Nimbulin",
        color: "#80c9d4",
        normal: "Gelée d’écume",
        rare: "Cœur d’écume",
      },
      {
        id: "furnace",
        name: "Siroccolimon",
        elements: ["fire", "air"],
        boss: "siroccolimon",
        monster: "cinder-slime",
        pet: "Siroccotin",
        color: "#d88b64",
        normal: "Gelée de tison",
        rare: "Cœur de tison",
      },
    ]
      .map(Object.freeze)
      .map((h) => [h.id, h]),
  ),
);
export const hybridForMonster = (monster) => {
  if (typeof monster === "string")
    return Object.values(HYBRID_SLIMES).find(
      (h) => h.boss === monster || (h.id !== "depths" && h.monster === monster),
    );
  if (monster?.dualElement) return HYBRID_SLIMES.depths;
  return Object.values(HYBRID_SLIMES).find(
    (h) =>
      h.boss === (monster?.species || monster?.id) ||
      (h.id !== "depths" && h.monster === (monster?.species || monster?.id)),
  );
};
export function hybridResource(id, type = "normal", chromatic = false) {
  const h = HYBRID_SLIMES[id];
  return h
    ? {
        kind: "hybrid-resource",
        hybridId: id,
        name: h[type],
        type,
        chromatic,
        element: h.elements[0],
        elements: [...h.elements],
        color: h.color,
      }
    : null;
}
export const royalPart = (id) => {
  const h = HYBRID_SLIMES[id];
  return h
    ? {
        kind: "royal-key-part",
        hybridId: id,
        name: `Morceau de clé royale — ${h.name}`,
        type: "material",
        quantity: 1,
        chromatic: false,
        color: h.color,
      }
    : null;
};
