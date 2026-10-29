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
export const VOLCANO_DUNGEON = "slime-volcano";
export const VOLCANO_KEY_RECIPE = Object.freeze({
  id: "volcano-key",
  name: "Clé du Volcan",
  level: 1,
  xp: 25,
  ingredients: Object.freeze(
    [
      { ...woodItem("chestnut", "plank"), quantity: 5 },
      {
        name: monsterDefinition("fire-slime").rare,
        type: "rare",
        chromatic: false,
        quantity: 1,
      },
      {
        name: monsterDefinition("mountain-slime").rare,
        type: "rare",
        chromatic: false,
        quantity: 1,
      },
    ].map(Object.freeze),
  ),
});
export const STORM_DUNGEON = 'slime-storm';
export const STORM_KEY_RECIPE = Object.freeze({
 id:'storm-key', name:'Clé de l’Œil des Tempêtes', level:1, xp:25,
 ingredients:Object.freeze([
  {...woodItem('chestnut','plank'),quantity:5},
  {name:monsterDefinition('wind-slime').rare,type:'rare',chromatic:false,quantity:1},
  {name:monsterDefinition('slime').rare,type:'rare',chromatic:false,quantity:1},
 ].map(Object.freeze)),
});
export const FURNACE_DUNGEON='slime-furnace';
export const FURNACE_KEY_RECIPE=Object.freeze({id:'furnace-key',name:'Clé de la Fournaise des Vents Rouges',level:1,xp:25,
 ingredients:Object.freeze([{...woodItem('chestnut','plank'),quantity:5},{name:monsterDefinition('fire-slime').rare,type:'rare',chromatic:false,quantity:1},{name:monsterDefinition('wind-slime').rare,type:'rare',chromatic:false,quantity:1}].map(Object.freeze)),
});
export const KEY_RECIPES = Object.freeze({
 [FURNACE_DUNGEON]:FURNACE_KEY_RECIPE,
  [STORM_DUNGEON]: STORM_KEY_RECIPE,
  [CREVASSE_DUNGEON]: KEY_RECIPE,
  [VOLCANO_DUNGEON]: VOLCANO_KEY_RECIPE,
});
export const handymanLevelXp = (level) => 30 * level;
export function createDungeonKey(dungeonId = CREVASSE_DUNGEON) {
  const recipe = KEY_RECIPES[dungeonId];
  if (!recipe) return null;
  return {
    kind: "dungeon-key",
    dungeonId,
    name: recipe.name,
    type: "material",
    chromatic: false,
    quantity: 1,
    color: dungeonId === VOLCANO_DUNGEON ? "#ed9752" : "#7db9b6",
  };
}
export const isDungeonKey = (item, dungeonId = CREVASSE_DUNGEON) =>
  item.kind === "dungeon-key" &&
  !!KEY_RECIPES[dungeonId] &&
  item.dungeonId === dungeonId &&
  !item.chromatic &&
  Number.isSafeInteger(item.quantity) &&
  item.quantity > 0;
export const dungeonKeyCount = (s, dungeonId = CREVASSE_DUNGEON) =>
  s.bag
    .filter((item) => isDungeonKey(item, dungeonId))
    .reduce((n, item) => n + item.quantity, 0);
