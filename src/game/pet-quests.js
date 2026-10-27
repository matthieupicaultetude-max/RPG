import { SET_SLOTS, ELEMENTS } from "../data/equipment.js";
import {
  PET_FOOD_XP,
  PET_MAX_LEVEL,
  createPet,
  petDefinition,
  petLevelXp,
  petStats,
} from "../data/pets.js";
import { PET_SHOP } from "../world/map.js";

const tell = (s, text) => {
  s.log.unshift(text);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
};
export const nearPetShop = (s) =>
  (s.zone||"garden")==="garden" && Math.hypot(s.player.x - PET_SHOP.npc.x, s.player.y - PET_SHOP.npc.y) < 52;
export function recordSetLoot(s, item) {
  if (!item.setId || !SET_SLOTS.includes(item.slot)) return;
  const slots = (s.collections[item.setId] ||= []);
  if (!slots.includes(item.slot)) slots.push(item.slot);
}
export function adoptionProgress(s, element) {
  return SET_SLOTS.map((slot) => ({
    slot,
    obtained: (s.collections[element] || []).includes(slot),
  }));
}
export function acceptAdoption(s, element) {
  if (!nearPetShop(s)) {
    tell(s, "Approchez de Nola à l’animalerie.");
    return false;
  }
  if (!petDefinition(element) || s.petQuests[element]) return false;
  s.petQuests[element] = { status: "active" };
  s.bag.push({
    id: s.nextItem++,
    kind: "certificate",
    questId: element,
    name: `Certificat d’adoption — ${ELEMENTS[element].set}`,
    element,
    quantity: 1,
    chromatic: false,
  });
  tell(s, `Nola vous remet le certificat d’adoption ${ELEMENTS[element].set}.`);
  return true;
}
export function claimPet(s, element) {
  if (!nearPetShop(s)) {
    tell(s, "Revenez à l’animalerie pour échanger votre certificat.");
    return null;
  }
  if (s.petQuests[element]?.status !== "active") return null;
  if (!adoptionProgress(s, element).every((p) => p.obtained)) {
    tell(s, "Il manque des pièces obtenues dans cette panoplie.");
    return null;
  }
  const index = s.bag.findIndex(
    (i) => i.kind === "certificate" && i.questId === element,
  );
  if (index < 0) {
    tell(s, "Le certificat est nécessaire pour adopter ce familier.");
    return null;
  }
  const pet = { ...createPet(element), id: s.nextItem++ };
  s.bag.splice(index, 1);
  s.bag.push(pet);
  s.petQuests[element] = { status: "completed", petId: pet.id };
  tell(
    s,
    `Certificat échangé : ${pet.name} rejoint votre sac ! Les équipements sont conservés.`,
  );
  return pet;
}
export function feedPet(s, id) {
  const owned = [
    ...s.bag,
    ...s.team.flatMap((m) => Object.values(m.equipment)),
  ];
  const pet = owned.find((i) => i.id === id && i.kind === "pet");
  const def = pet && petDefinition(pet.petId);
  if (!def) return false;
  if (pet.level >= PET_MAX_LEVEL) {
    tell(s, "Ce familier a atteint son niveau maximum.");
    return false;
  }
  const index = s.bag.findIndex(
    (i) =>
      i.name === def.food && i.type === "rare" && i.chromatic && i.quantity > 0,
  );
  if (index < 0) {
    tell(s, `${pet.name} mange uniquement : ${def.food} chromatique (rare).`);
    return false;
  }
  if (--s.bag[index].quantity === 0) s.bag.splice(index, 1);
  pet.xp += PET_FOOD_XP;
  while (pet.level < PET_MAX_LEVEL && pet.xp >= petLevelXp(pet.level)) {
    pet.xp -= petLevelXp(pet.level);
    pet.level++;
  }
  if (pet.level === PET_MAX_LEVEL) pet.xp = 0;
  pet.stats = petStats(pet.element, pet.level);
  tell(s, `${pet.name} a mangé : +${PET_FOOD_XP} XP · Niveau ${pet.level}.`);
  return true;
}
