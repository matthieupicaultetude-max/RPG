import { syncEquipmentHealth } from "./equipment.js";
import { FOUNTAIN } from "../world/map.js";
export const ALLOCATABLE_STATS = [
  "Vitalité",
  "Force",
  "Intelligence",
  "Agilité",
  "Chance",
  "Sagesse",
];
export const ELEMENT_ORDER = ["earth", "fire", "air", "water"];
export const emptyAllocation = () =>
  Object.fromEntries(ALLOCATABLE_STATS.map((stat) => [stat, 0]));
export function normalSpellLevel(spell) {
  return spell.ultimate
    ? null
    : Number(spell.id.split("-").at(-1)) * 4 +
        ELEMENT_ORDER.indexOf(spell.element) +
        1;
}
export function isSpellUnlocked(member, spell) {
  return (
    !!spell &&
    member.role === spell.role &&
    (spell.ultimate
      ? (member.learnedUltimates || []).includes(spell.id)
      : member.level >= normalSpellLevel(spell))
  );
}
export const ultimateChoices = (member) =>
  Math.max(
    0,
    Math.floor(member.level / 5) - (member.learnedUltimates?.length || 0),
  );
export function fillUnlockedSlots(member, previousLevel = 0) {
  for (let level = previousLevel + 1; level <= Math.min(12, member.level); level++) {
    const id = `${member.role}-${ELEMENT_ORDER[(level - 1) % 4]}-${Math.floor((level - 1) / 4)}`;
    if (member.loadout.includes(id)) continue;
    const index = member.loadout.slice(0, 3).findIndex((id, slot) => id === null && !member.emptySpellSlots?.includes(slot));
    if (index < 0) break;
    member.loadout[index] = id;
  }
}
export function learnUltimate(state, id) {
  const member = state.team[state.main];
  const match = /^(melee|support|ranged)-(earth|fire|air|water)-3$/.exec(id);
  if (
    !match ||
    match[1] !== member.role ||
    ultimateChoices(member) < 1 ||
    member.learnedUltimates.includes(id)
  )
    return false;
  member.learnedUltimates.push(id);
  if (!member.loadout[3] && !member.emptySpellSlots?.includes(3)) member.loadout[3] = id;
  state.revision++;
  return true;
}
export const nearFountain = (state) =>
  Math.hypot(state.player.x - FOUNTAIN.x, state.player.y - FOUNTAIN.y) < 48;
export function allocateCharacteristic(state, stat, quantity) {
  const member = state.team[state.main];
  if (
    !ALLOCATABLE_STATS.includes(stat) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > member.characteristicPoints
  )
    return false;
  member.allocatedStats[stat] += quantity;
  member.characteristicPoints -= quantity;
  syncEquipmentHealth(member);
  state.revision++;
  return true;
}
export function resetCharacteristics(state) {
  if (!nearFountain(state)) return false;
  const member = state.team[state.main],
    refund = Object.values(member.allocatedStats).reduce(
      (sum, value) => sum + value,
      0,
    );
  if (!refund) return false;
  member.characteristicPoints += refund;
  member.allocatedStats = emptyAllocation();
  syncEquipmentHealth(member);
  state.revision++;
  state.log.unshift(
    `${member.name} : ${refund} points récupérés à la fontaine.`,
  );
  state.log.length = Math.min(6, state.log.length);
  return true;
}
