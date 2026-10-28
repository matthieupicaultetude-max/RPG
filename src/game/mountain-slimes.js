import { createMonster } from "../data/monsters.js";
import {
  MOUNTAIN_SLIMES,
  isMountainImpact,
} from "../world/slime-mountains-map.js";
import { emitSound } from "../audio/events.js";
export const MOUNTAIN_RULES = { damageMultiplier: 0.6, exposedDuration: 3 };
export function createMountainWorld() {
  return {
    monsters: MOUNTAIN_SLIMES.map((p) =>
      createMonster("mountain-slime", p.x, p.y, 5),
    ),
    bots: [],
    npcs: [],
    trees: [],
  };
}
export function resetMountainSlime(m) {
  if (!m.mountainSlime) return;
  m.shellBroken = false;
  m.vulnerableUntil = 0;
}
export function shellDamage(m, damage, bonus = false) {
  return m.mountainSlime && !m.shellBroken && !bonus
    ? Math.max(1, Math.round(damage * MOUNTAIN_RULES.damageMultiplier))
    : damage;
}
export function traceMountainCharge(from, goal, canStand) {
  const dx = goal.x - from.x,
    dy = goal.y - from.y,
    length = Math.hypot(dx, dy);
  let to = { ...from };
  for (let d = 2; d < length + 2; d += 2) {
    const t = Math.min(1, d / (length || 1)),
      p = { x: from.x + dx * t, y: from.y + dy * t };
    if (!canStand(p.x, p.y))
      return { to, wallCollision: isMountainImpact(p.x, p.y), impactPoint: p };
    to = p;
  }
  return { to, wallCollision: false };
}
export function breakMountainShell(s, m, point = m) {
  if (!m.mountainSlime || m.shellBroken || m.hp <= 0) return false;
  m.shellBroken = true;
  m.vulnerableUntil = s.time + MOUNTAIN_RULES.exposedDuration;
  m.moving = false;
  s.effects.push({
    x: m.x,
    y: m.y - 62,
    text: "Carapace brisée !",
    color: "#ffdfa1",
    life: 1.3,
  });
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    s.effects.push({
      x: point.x,
      y: point.y - 8,
      vx: Math.cos(a) * 40,
      vy: Math.sin(a) * 30 - 16,
      particle: true,
      color: i % 2 ? "#a9b4b3" : "#e0c18c",
      life: 0.6,
    });
  }
  emitSound(s, "rock-break", m, { element: "earth" });
  s.revision++;
  return true;
}
