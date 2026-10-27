export const WOODS = Object.freeze(
  [
    {
      id: "ash",
      name: "Frêne",
      level: 1,
      log: "Bois de frêne",
      plank: "Planche de frêne",
      xp: 15,
      respawn: 30,
      color: "#b9a574",
    },
    {
      id: "chestnut",
      name: "Châtaignier",
      level: 5,
      log: "Bois de châtaignier",
      plank: "Planche de châtaignier",
      xp: 25,
      respawn: 45,
      color: "#bd8551",
    },
    {
      id: "walnut",
      name: "Noyer",
      level: 10,
      log: "Bois de noyer",
      plank: "Planche de noyer",
      xp: 40,
      respawn: 60,
      color: "#87704d",
    },
  ].map(Object.freeze),
);
export const woodById = (id) => WOODS.find((wood) => wood.id === id);
export const woodcuttingLevelXp = (level) => 30 * level;
export const cuttingDuration = (level) =>
  Math.max(1, 4 / (1 + 0.06 * (level - 1)));
export function woodItem(id, kind = "wood") {
  const wood = woodById(id);
  if (!wood || !["wood", "plank"].includes(kind))
    throw new Error("Bois inconnu");
  return {
    kind,
    wood: id,
    name: kind === "plank" ? wood.plank : wood.log,
    requiredLevel: wood.level,
    type: "material",
    chromatic: false,
    quantity: 1,
    color: wood.color,
  };
}
