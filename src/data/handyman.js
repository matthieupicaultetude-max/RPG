import { woodItem } from "./woodcutting.js";
import { monsterDefinition } from "./monsters.js";
export const CREVASSE_DUNGEON = "slime-depths";
export const KEY_RECIPE = Object.freeze({
  id: "crevasse-key",
  name: "Clé de la Crevasse",
  level: 1,
  xp: 25,
  ingredients: Object.freeze([
    Object.freeze({ ...woodItem("chestnut", "plank"), quantity: 5 }),
    Object.freeze({
      name: monsterDefinition("slime").rare,
      type: "rare",
      chromatic: false,
      quantity: 1,
    }),
    Object.freeze({
      name: monsterDefinition("mountain-slime").rare,
      type: "rare",
      chromatic: false,
      quantity: 1,
    }),
  ]),
});
export const handymanLevelXp = (level) => 30 * level;
export function createDungeonKey() {
  return {
    kind: "dungeon-key",
    dungeonId: CREVASSE_DUNGEON,
    name: KEY_RECIPE.name,
    type: "material",
    chromatic: false,
    quantity: 1,
    color: "#7db9b6",
  };
}
export const isDungeonKey = (item) =>
  item.kind === "dungeon-key" &&
  item.dungeonId === CREVASSE_DUNGEON &&
  !item.chromatic &&
  Number.isSafeInteger(item.quantity) &&
  item.quantity > 0;
export const dungeonKeyCount = (s) =>
  s.bag.filter(isDungeonKey).reduce((n, item) => n + item.quantity, 0);
