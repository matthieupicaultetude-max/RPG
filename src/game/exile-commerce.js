import { nearExileResident } from "./exile.js";
import { putInBag } from "./item-stacks.js";
const goods = (id, name, slot, stats, price, vendor, color) => ({
  id,
  name,
  slot,
  stats,
  price,
  vendor,
  color,
  level: 1,
  requiredLevel: 1,
  quantity: 1,
  rarity: "Commun",
});
// Starter travel gear is intentionally outside loot-only elemental panoplies.
export const EXILE_GOODS = [
  goods(
    "hat",
    "Coiffe du voyageur",
    "Coiffe",
    { Vitalité: 5 },
    15,
    "maela",
    "#a9956b",
  ),
  goods(
    "belt",
    "Ceinture du voyageur",
    "Ceinture",
    { Vitalité: 4 },
    12,
    "maela",
    "#9e805e",
  ),
  goods(
    "boots",
    "Bottes du voyageur",
    "Bottes",
    { Vitalité: 5 },
    15,
    "maela",
    "#796c54",
  ),
  goods(
    "shield",
    "Bouclier du Refuge",
    "Bouclier",
    { Vitalité: 8 },
    22,
    "maela",
    "#789b91",
  ),
  goods(
    "blade",
    "Épée du débarquement",
    "Arme",
    { Force: 3 },
    18,
    "maela",
    "#b9c3ae",
  ),
  goods(
    "cloak",
    "Cape du Premier Accueil",
    "Cape",
    { Vitalité: 4, Sagesse: 1 },
    18,
    "oriel",
    "#7897a5",
  ),
  goods(
    "staff",
    "Bâton des embruns",
    "Arme",
    { Intelligence: 3 },
    18,
    "oriel",
    "#85b5b2",
  ),
  goods(
    "amulet",
    "Amulette des voyageurs",
    "Amulette",
    { Vitalité: 3, Sagesse: 1 },
    20,
    "oriel",
    "#bfaa78",
  ),
];
export function nearTownVendor(s, id) {
  return nearExileResident(s)?.id === id;
}
export function buyExileItem(s, id) {
  const offer = EXILE_GOODS.find((g) => g.id === id);
  if (!offer || !nearTownVendor(s, offer.vendor) || s.gold < offer.price)
    return false;
  const { vendor, price, id: offerId, ...item } = offer;
  s.gold -= price;
  putInBag(s, { ...item, stats: { ...item.stats }, id: s.nextItem++ });
  s.log.unshift(`${item.name} acheté · ${price} or.`);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
  return true;
}
export const canSellExile = (item) =>
  !item.slot &&
  !item.chromatic &&
  !item.kind &&
  ["normal", "rare"].includes(item.type);
export const exileSellPrice = (item) => (item.type === "rare" ? 8 : 2);
export function sellExileItem(s, id, quantity = 1) {
  const item = s.bag.find((i) => i.id === id);
  if (
    !nearTownVendor(s, "silo") ||
    !item ||
    !canSellExile(item) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > item.quantity
  )
    return false;
  const value = exileSellPrice(item) * quantity;
  item.quantity -= quantity;
  if (!item.quantity) s.bag.splice(s.bag.indexOf(item), 1);
  s.gold += value;
  s.log.unshift(`${quantity} × ${item.name} vendus · +${value} or.`);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
  return true;
}
export function restAtExileInn(s) {
  if (
    !nearTownVendor(s, "aubergiste") ||
    s.gold < 5 ||
    s.team.every((m) => m.hp === m.maxHp)
  )
    return false;
  s.gold -= 5;
  for (const m of s.team) m.hp = m.maxHp;
  s.log.unshift("La troupe se repose à l’auberge · Tous les PV restaurés.");
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
  return true;
}
