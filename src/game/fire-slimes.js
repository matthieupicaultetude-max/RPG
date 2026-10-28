import { createMonster } from "../data/monsters.js";
import { FIRE_SLIMES } from "../world/slime-fire-map.js";
import { lineClear } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
export const FIRE_RULES = Object.freeze({
  spacing: 7,
  trailRadius: 9,
  trailWindup: 0.35,
  trailDuration: 4,
  tick: 0.6,
  explosionWindup: 0.9,
  explosionRadius: 36,
});
export function createFireWorld() {
  return {
    monsters: FIRE_SLIMES.map((p) => createMonster("fire-slime", p.x, p.y, 5)),
    bots: [],
    npcs: [],
    trees: [],
  };
}
export function clearFireHazards(s) {
  s.fireTrails = [];
  s.fireExplosions = [];
  s.nextFireDamage = {};
  for (const m of s.monsters || []) if (m.fireSlime) delete m.fireTrailPoint;
}
export function resetFireSlime(m) {
  if (m.fireSlime) {
    delete m.fireDeathQueued;
    delete m.fireTrailPoint;
  }
}
// Freeze origin and damage at death: respawning or removing the caster cannot cancel the blast.
export function onFireSlimeDeath(s, m) {
  if (!m.fireSlime || m.hp > 0 || m.fireDeathQueued) return false;
  m.fireDeathQueued = true;
  s.fireExplosions ??= [];
  s.fireExplosions.push({
    x: m.x,
    y: m.y,
    age: 0,
    radius: FIRE_RULES.explosionRadius,
    damage: Math.round(m.damage * 1.6),
    source: { x: m.x, y: m.y, name: m.name, element: "fire" },
  });
  emitSound(s, "cast", m, { element: "fire" });
  return true;
}
export function leaveFireTrail(s, m, canStand) {
  if (!m.fireSlime || m.hp <= 0) return;
  const p = m.fireTrailPoint;
  if (!p) {
    m.fireTrailPoint = { x: m.x, y: m.y };
    return;
  }
  const dx = m.x - p.x,
    dy = m.y - p.y,
    d = Math.hypot(dx, dy);
  s.fireTrails ??= [];
  const steps = Math.floor(d / FIRE_RULES.spacing);
  for (let i = 1; i <= steps; i++) {
    const x = p.x + (dx / d) * i * FIRE_RULES.spacing,
      y = p.y + (dy / d) * i * FIRE_RULES.spacing;
    if (canStand(x, y))
      s.fireTrails.push({
        x,
        y,
        age: 0,
        radius: FIRE_RULES.trailRadius,
        damage: Math.max(1, Math.round(m.damage * 0.4)),
        source: { x, y, name: m.name, element: "fire" },
      });
  }
  if (steps)
    m.fireTrailPoint = {
      x: p.x + (dx / d) * steps * FIRE_RULES.spacing,
      y: p.y + (dy / d) * steps * FIRE_RULES.spacing,
    };
}
export function stepFireHazards(s, dt, ctx) {
  if (dt <= 0) return;
  s.nextFireDamage ??= {};
  const members = () =>
    s.team.filter((p) => p.hp > 0 && (p.id === s.main || s.deployed));
  const hits = (h, p) =>
    Math.hypot(p.x - h.x, p.y - h.y) <= h.radius &&
    lineClear(h, p, ctx.canStand);
  s.fireTrails = (s.fireTrails || []).filter((h) => {
    h.age += dt;
    return h.age < FIRE_RULES.trailWindup + FIRE_RULES.trailDuration;
  });
  for (const p of members()) {
    if ((s.nextFireDamage[p.id] || 0) > s.time) continue;
    const h = s.fireTrails.find(
      (h) => h.age >= FIRE_RULES.trailWindup && hits(h, p),
    );
    if (h) {
      s.nextFireDamage[p.id] = s.time + FIRE_RULES.tick;
      ctx.damage(p, h.damage, h.source, "fire", "burn");
    }
  }
  s.fireExplosions = (s.fireExplosions || []).filter((h) => {
    h.age += dt;
    if (h.age < FIRE_RULES.explosionWindup) return true;
    for (const p of members())
      if (hits(h, p)) ctx.damage(p, h.damage, h.source, "fire", "explosion");
    s.monsterImpacts ??= [];
    s.monsterImpacts.push({
      x: h.x,
      y: h.y,
      radius: h.radius,
      element: "fire",
      life: 0.5,
    });
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI) / 7;
      s.effects.push({
        x: h.x,
        y: h.y - 4,
        vx: Math.cos(a) * 55,
        vy: Math.sin(a) * 45 - 12,
        particle: true,
        color: i % 2 ? "#ffc65e" : "#f07836",
        life: 0.55,
      });
    }
    emitSound(s, "magic", h, { element: "fire" });
    return false;
  });
}
