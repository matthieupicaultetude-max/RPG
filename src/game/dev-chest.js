import { DEV_ITEMS } from "../data/dev-items.js";
import { DEV_CHEST } from "../world/dev-chest.js";
import { putInBag } from "./item-stacks.js";
import { recordSetLoot } from "./pet-quests.js";
export const nearDevChest = (s) =>
  (s.zone || "garden") === "garden" &&
  s.team[s.main].hp > 0 &&
  Math.hypot(s.player.x - DEV_CHEST.x, s.player.y - DEV_CHEST.y) < 46;
export function devChestStock(s) {
  s.devChest ??= {};
  for (const entry of DEV_ITEMS)
    if (!Object.hasOwn(s.devChest, entry.key)) s.devChest[entry.key] = 99;
  return s.devChest;
}
const tell = (s, text) => {
  s.log.unshift(text);
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
};
export function withdrawDevItem(s, key, quantity = 99) {
  if (
    !nearDevChest(s) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  )
    return null;
  const entry = DEV_ITEMS.find((e) => e.key === key);
  if (!entry) return null;
  const stock = devChestStock(s),
    count = Math.min(stock[key], quantity);
  if (count < 1) return null;
  const item = putInBag(s, entry.item, count);
  stock[key] -= count;
  recordSetLoot(s, item);
  tell(s, `${count} × ${item.name} retiré(s) du coffre.`);
  return item;
}
export function withdrawAllDevItems(s) {
  if (!nearDevChest(s)) return 0;
  let count = 0;
  for (const entry of DEV_ITEMS) {
    const item = withdrawDevItem(s, entry.key, 99);
    if (item) count++;
  }
  tell(s, `${count} piles transférées du coffre vers le sac.`);
  return count;
}
export function refillDevChest(s) {
  if (!nearDevChest(s)) return false;
  s.devChest = Object.fromEntries(DEV_ITEMS.map((e) => [e.key, 99]));
  tell(
    s,
    "Coffre de développement réapprovisionné à 99 exemplaires par objet.",
  );
  return true;
}
