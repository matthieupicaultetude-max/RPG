import { spellById } from "../data/spells.js";
import { castSpell } from "../combat/spells.js";
import { distance } from "../combat/attacks.js";
const healing = new Set([
  "sap",
  "kindFlame",
  "spring",
  "healingWind",
  "cleanse",
  "sanctuary",
  "greatTide",
  "cyclone",
]);
const protection = new Set([
  "guard",
  "foamGuard",
  "pillar",
  "updraft",
  "phoenix",
]);
export function castCompanionSpell(s, member, target, ctx) {
  if (member.cooldown > 0) return false;
  const injured = s.team
    .filter(
      (a) =>
        a.hp > 0 &&
        a.hp < a.maxHp &&
        (a.id === s.main || s.deployed) &&
        distance(a, member) < 120,
    )
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const healFirst = injured
    ? [0, 1, 2, 3].filter((slot) =>
        healing.has(spellById(member.loadout[slot])?.effect),
      )
    : [];
  const order = [...new Set([...healFirst, 3, 1, 2, 0])];
  for (const slot of order) {
    const spell = spellById(member.loadout[slot]);
    if (!spell) continue;
    let point = target;
    if (healing.has(spell.effect)) {
      if (!injured) continue;
      point = injured;
    } else if (protection.has(spell.effect)) {
      if (!target || member.hp > member.maxHp * 0.75) continue;
      point = member;
    } else if (!target) continue;
    if (
      target &&
      distance(member, target) > spell.range &&
      spell.range > 0 &&
      !healing.has(spell.effect)
    )
      continue;
    if (
      spell.effect === "hammer" &&
      (target?.spellState?.fractures?.[member.id] || 0) < 2
    )
      continue;
    if (
      spell.effect === "detonate" &&
      !target?.spellState?.embers?.some((e) => e.owner === member.id)
    )
      continue;
    if (spell.effect === "anchor" && member.buffs.anchor) continue;
    if (spell.effect === "share") {
      if (!injured) continue;
      point = injured;
    }
    if (spell.effect === "swap") {
      if (
        !injured ||
        injured === member ||
        !target ||
        distance(injured, target) > 35 ||
        distance(member, target) < 55
      )
        continue;
      point = injured;
    }
    if (spell.effect === "sidestep") {
      if (!target || distance(member, target) > 45 || member.buffs.flank)
        continue;
      const angle = Math.atan2(member.y - target.y, member.x - target.x) + 1.1;
      point = {
        x: target.x + Math.cos(angle) * 26,
        y: target.y + Math.sin(angle) * 26,
      };
    }
    if (spell.effect === "riverLink") {
      if (!injured || member.buffs.link) continue;
      point = injured;
    }
    if (castSpell(s, member, slot, point, ctx)) return true;
  }
  return false;
}
