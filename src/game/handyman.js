import {
  KEY_RECIPE,
  handymanLevelXp,
  createDungeonKey,
  dungeonKeyCount,
  isDungeonKey,
} from "../data/handyman.js";
import { HANDYMAN_WORKSHOP } from "../world/map.js";
import { emitSound } from "../audio/events.js";
const tell = (s, text) => {
  s.log.unshift(text);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
};
export const nearHandyman = (s) =>
  (s.zone || "garden") === "garden" &&
  Math.hypot(
    s.player.x - HANDYMAN_WORKSHOP.npc.x,
    s.player.y - HANDYMAN_WORKSHOP.npc.y,
  ) < 44;
const matches = (item, ingredient) =>
  !item.slot &&
  !item.chromatic &&
  item.name === ingredient.name &&
  item.type === ingredient.type &&
  (!ingredient.kind || item.kind === ingredient.kind) &&
  (!ingredient.wood || item.wood === ingredient.wood);
export function keyRecipeStatus(s, quantity = 1) {
  return KEY_RECIPE.ingredients.map((ingredient) => ({
    ...ingredient,
    required: ingredient.quantity * quantity,
    available: s.bag
      .filter((i) => matches(i, ingredient))
      .reduce((n, i) => n + i.quantity, 0),
  }));
}
export function grantHandymanXp(s, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const job = s.handyman;
  job.xp += amount;
  while (job.xp >= handymanLevelXp(job.level)) {
    job.xp -= handymanLevelXp(job.level);
    job.level++;
  }
  s.revision++;
  return true;
}
export function craftDungeonKeys(s, quantity = 1) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999)
    return false;
  if (!nearHandyman(s)) {
    tell(s, "Rejoignez Tessa à l’atelier de bricolage du village.");
    return false;
  }
  if (s.team[s.main].hp <= 0 || s.handyman.level < KEY_RECIPE.level)
    return false;
  const costs = keyRecipeStatus(s, quantity);
  if (costs.some((c) => c.available < c.required)) {
    tell(
      s,
      "Il manque des ingrédients : 5 planches de châtaignier, 1 Cœur de gelée et 1 Cœur d’ambre par clé (ressources non chromatiques).",
    );
    return false;
  }
  if (!Number.isSafeInteger(dungeonKeyCount(s) + quantity)) return false;
  for (const cost of costs) {
    let left = cost.required;
    for (const item of s.bag.filter((i) => matches(i, cost))) {
      const n = Math.min(left, item.quantity);
      item.quantity -= n;
      left -= n;
      if (!left) break;
    }
  }
  s.bag = s.bag.filter((i) => i.quantity > 0);
  const existing = s.bag.find(isDungeonKey);
  if (existing) existing.quantity += quantity;
  else s.bag.push({ ...createDungeonKey(), id: s.nextItem++, quantity });
  grantHandymanXp(s, quantity * KEY_RECIPE.xp);
  emitSound(s, "craft", s.player, { owner: s.main });
  tell(
    s,
    `${quantity} Clé(s) de la Crevasse fabriquée(s) · +${quantity * KEY_RECIPE.xp} XP bricoleur.`,
  );
  return true;
}
export function consumeDungeonKey(s) {
  const key = s.bag.find(isDungeonKey);
  if (!key) return false;
  key.quantity--;
  if (!key.quantity) s.bag.splice(s.bag.indexOf(key), 1);
  s.revision++;
  return true;
}
