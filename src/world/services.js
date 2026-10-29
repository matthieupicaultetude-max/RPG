import { SERVICES, FOUNTAIN as EXILE_FOUNTAIN } from "./exile-map.js";
import {
  FORGE,
  PET_SHOP,
  HANDYMAN_WORKSHOP,
  SAWMILL,
  FOUNTAIN,
} from "./map.js";
const garden = {
  forge: FORGE.npc,
  petshop: PET_SHOP.npc,
  handyman: HANDYMAN_WORKSHOP.npc,
  sawmill: SAWMILL,
  fountain: FOUNTAIN,
};
export function servicePoint(s, id) {
  return s.zone === "exile"
    ? id === "fountain"
      ? EXILE_FOUNTAIN
      : SERVICES[id]
    : !s.zone || s.zone === "garden"
      ? garden[id]
      : null;
}
export function nearService(s, id, radius = 44) {
  const p = servicePoint(s, id);
  return !!p && Math.hypot(s.player.x - p.x, s.player.y - p.y) < radius;
}
