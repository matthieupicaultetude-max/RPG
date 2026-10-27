import { gainCharge } from "./spells.js";
import { distance, lineClear } from "./attacks.js";
export const BONUS_TARGET_CHANCE = 0.2;
export const BONUS_TARGET_DURATION = 1;
export const BONUS_TARGET_RADIUS = 6;
export const BONUS_TARGET_COOLDOWN = 4;
export const bonusTargetPosition = (monster) => ({
  x: monster.x + monster.bonusTarget.dx,
  y: monster.y - 12 + monster.bonusTarget.dy,
});
function clearSpot(state, monster, point, canStand) {
  return (
    [
      [0, 0],
      [6, 0],
      [-6, 0],
      [0, 6],
      [0, -6],
    ].every(([x, y]) => canStand(point.x + x, point.y + y)) &&
    lineClear(monster, point, canStand) &&
    lineClear(state.player, point, canStand)
  );
}
export function recordBonusOpportunity(
  state,
  monster,
  damage,
  member,
  canStand,
  random = Math.random,
) {
  if (!Number.isFinite(damage) || damage <= 0) return false;
  monster.lastReceivedDamage = damage;
  if (monster.hp <= 0) {
    delete monster.bonusTarget;
    return false;
  }
  if (
    member.id !== state.main ||
    member.hp <= 0 ||
    monster.bonusTarget ||
    (monster.bonusTargetCooldown || 0) > 0 ||
    state.monsters.filter((m) => m.hp > 0 && m.bonusTarget?.time > 0).length >=
      3
  )
    return false;
  if (random() >= BONUS_TARGET_CHANCE) return false;
  const start = random() * Math.PI * 2;
  for (let i = 0; i < 16; i++) {
    const angle = start + (i * Math.PI) / 8,
      dx = Math.round(Math.cos(angle) * 26),
      dy = Math.round(Math.sin(angle) * 26),
      point = { x: monster.x + dx, y: monster.y - 12 + dy };
    if (!clearSpot(state, monster, point, canStand)) continue;
    monster.bonusTarget = { dx, dy, time: BONUS_TARGET_DURATION };
    monster.bonusTargetCooldown = BONUS_TARGET_COOLDOWN;
    return true;
  }
  return false;
}
export function stepBonusTargets(state, elapsed, canStand) {
  for (const monster of state.monsters) {
    monster.bonusTargetCooldown = Math.max(
      0,
      (monster.bonusTargetCooldown || 0) - Math.max(0, elapsed),
    );
    if (!monster.bonusTarget) continue;
    monster.bonusTarget.time -= Math.max(0, elapsed);
    if (
      monster.hp <= 0 ||
      monster.bonusTarget.time <= 0 ||
      !clearSpot(state, monster, bonusTargetPosition(monster), canStand)
    )
      delete monster.bonusTarget;
  }
}
export function clickBonusTarget(state, point, canStand, hitMonster) {
  const member = state.team[state.main];
  if (member.hp <= 0) return false;
  const monster = state.monsters
    .filter(
      (m) =>
        m.hp > 0 &&
        m.bonusTarget?.time > 0 &&
        distance(point, bonusTargetPosition(m)) <= BONUS_TARGET_RADIUS,
    )
    .sort(
      (a, b) =>
        distance(point, bonusTargetPosition(a)) -
        distance(point, bonusTargetPosition(b)),
    )[0];
  if (
    !monster ||
    !clearSpot(state, monster, bonusTargetPosition(monster), canStand) ||
    !(monster.lastReceivedDamage > 0)
  )
    return false;
  const position = bonusTargetPosition(monster),
    damage = monster.lastReceivedDamage;
  delete monster.bonusTarget;
  const before = monster.hp;
  hitMonster(state, monster, damage, member, { bonus: true });
  gainCharge(member, Math.min(5, Math.max(0, before - monster.hp) / 5));
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    state.effects.push({
      x: position.x,
      y: position.y,
      vx: Math.cos(angle) * 38,
      vy: Math.sin(angle) * 38,
      particle: true,
      color: "#a9f5e8",
      life: 0.4,
    });
  }
  return true;
}
