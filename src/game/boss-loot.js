import { hybridForMonster, royalPart } from "../data/hybrid-slimes.js";
import { createPet } from "../data/pets.js";
// Called only by the once-per-victory reward path. Key part and pet roll are independent.
export function grantBossLoot(state, monster, random = Math.random) {
  const h = hybridForMonster(monster);
  if (!h) return [];
  const part = royalPart(h.id),
    existing = state.bag.find(
      (i) => i.kind === part.kind && i.hybridId === h.id,
    );
  if (existing) existing.quantity++;
  else {
    part.id = state.nextItem++;
    state.bag.push(part);
  }
  const rewards = [existing || part];
  if (random() < 0.05) {
    const pet = { ...createPet(h.id), id: state.nextItem++ };
    state.bag.push(pet);
    rewards.push(pet);
  }
  state.log.unshift(
    `Butin de boss : ${part.name}${rewards.length > 1 ? ` · ${rewards[1].name} vous rejoint !` : ""}`,
  );
  state.log.length = Math.min(6, state.log.length);
  state.revision++;
  return rewards;
}
