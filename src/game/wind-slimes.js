import { createMonster } from "../data/monsters.js";
import { WIND_SLIMES } from "../world/slime-wind-map.js";
import { lineClear } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
import { cancelWoodcutting } from "./woodcutting.js";
export const WIND_RULES = Object.freeze({
  inflate: 1.8,
  suctionRadius: 78,
  pullSpeed: 22,
  maxPullSpeed: 28,
  blastRadius: 43,
  blastMultiplier: 1.25,
  landingRadius: 23,
  flight: 0.5,
  bouncePause: 0.22,
  recovery: 3.2,
  range: 160,
});
const party = (s) =>
  s.team.filter((p) => p.hp > 0 && (p.id === s.main || s.deployed));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function createWindWorld() {
  return {
    monsters: WIND_SLIMES.map((p) => createMonster("wind-slime", p.x, p.y, 5)),
    bots: [],
    npcs: [],
    trees: [],
  };
}
function finish(m) {
  delete m.intent;
  m.lift = 0;
  m.moving = false;
  m.cooldown = WIND_RULES.recovery;
}
function face(m, p) {
  const dx = p.x - m.x,
    dy = p.y - m.y;
  m.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
        ? "down"
        : "up";
}
function secondLanding(m, first, canStand) {
  const angle = Math.atan2(first.y - m.y, first.x - m.x);
  for (const radius of [49, 36, 65])
    for (const offset of [0, 0.65, -0.65, 1.3, -1.3, Math.PI]) {
      const a = angle + offset,
        p = {
          x: first.x + Math.cos(a) * radius,
          y: first.y + Math.sin(a) * radius,
        };
      if (canStand(p.x, p.y)) return p;
    }
  return null;
}
export function startWindCycle(s, m, ctx) {
  if (m.hp <= 0 || m.intent || m.cooldown > 0 || m.spellState?.root > 0)
    return false;
  const targets = party(s)
    .filter(
      (p) =>
        distance(p, { x: m.homeX, y: m.homeY }) <= m.detection &&
        distance(p, m) <= WIND_RULES.range &&
        ctx.canStand(p.x, p.y),
    )
    .sort((a, b) => distance(a, m) - distance(b, m));
  const target = targets[0];
  if (!target) return false;
  const first = { x: target.x, y: target.y },
    second = secondLanding(m, first, ctx.canStand);
  if (!second) return false;
  m.intent = {
    kind: "wind-cycle",
    phase: "windup",
    element: "air",
    age: 0,
    windup: WIND_RULES.inflate,
    from: { x: m.x, y: m.y },
    to: first,
    landings: [first, second],
    leg: 0,
    radius: WIND_RULES.landingRadius,
    damage: Math.round(m.damage * WIND_RULES.blastMultiplier),
  };
  m.moving = false;
  face(m, first);
  s.revision++;
  emitSound(s, "cast", m, { element: "air" });
  return true;
}
// Combine the suction of every inflating slime before moving a member once.
// Manual movement remains faster, even when several suction fields overlap.
export function stepWindSuction(s, dt, ctx) {
  if (dt <= 0) return;
  const inflating = s.monsters.filter(
    (m) =>
      m.windSlime &&
      m.hp > 0 &&
      m.intent?.phase === "windup" &&
      !(m.spellState?.root > 0),
  );
  for (const p of party(s)) {
    let vx = 0,
      vy = 0;
    for (const m of inflating) {
      const d = distance(p, m);
      if (
        d < 7 ||
        d > WIND_RULES.suctionRadius ||
        !lineClear(m, p, ctx.canStand)
      )
        continue;
      vx += ((m.x - p.x) / d) * WIND_RULES.pullSpeed;
      vy += ((m.y - p.y) / d) * WIND_RULES.pullSpeed;
    }
    const speed = Math.hypot(vx, vy);
    if (!speed) continue;
    const ratio = Math.min(1, WIND_RULES.maxPullSpeed / speed),
      dx = vx * ratio * dt,
      dy = vy * ratio * dt,
      steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
    let moved = false;
    for (let i = 0; i < steps; i++) {
      const x = p.x + dx / steps,
        y = p.y + dy / steps;
      if (!ctx.canStand(x, y)) break;
      p.x = x;
      p.y = y;
      moved = true;
    }
    if (moved && p.id === s.main) {
      s.player.x = p.x;
      s.player.y = p.y;
      cancelWoodcutting(s);
    }
  }
}
function impact(s, m, point, radius, damage, kind, ctx) {
  for (const p of party(s))
    if (distance(p, point) <= radius && lineClear(point, p, ctx.canStand))
      ctx.damage(p, damage, m, "air", kind);
  s.monsterImpacts ??= [];
  s.monsterImpacts.push({ ...point, radius, element: "air", life: 0.5 });
  emitSound(s, "magic", point, { element: "air" });
}
export function stepWindSlime(s, m, dt, ctx) {
  if (m.hp <= 0) {
    delete m.intent;
    m.lift = 0;
    return false;
  }
  const a = m.intent;
  if (!a) return startWindCycle(s, m, ctx);
  if (dt <= 0) return true;
  if ((m.spellState?.root > 0 && a.phase !== "flight") || !party(s).length) {
    finish(m);
    return true;
  }
  a.age += dt;
  m.moving = false;
  if (a.phase === "windup") {
    a.from = { x: m.x, y: m.y };
    if (a.age < a.windup) return true;
    impact(s, m, a.from, WIND_RULES.blastRadius, a.damage, "air-burst", ctx);
    a.phase = "flight";
    a.age = 0;
    face(m, a.to);
    return true;
  }
  if (a.phase === "bounce") {
    if (a.age < WIND_RULES.bouncePause) return true;
    a.leg = 1;
    a.from = { x: m.x, y: m.y };
    a.to = a.landings[1];
    if (!ctx.canStand(a.to.x, a.to.y)) {
      finish(m);
      return true;
    }
    a.phase = "flight";
    a.age = 0;
    face(m, a.to);
    return true;
  }
  if (a.phase === "flight") {
    const t = Math.min(1, a.age / WIND_RULES.flight);
    m.x = a.from.x + (a.to.x - a.from.x) * t;
    m.y = a.from.y + (a.to.y - a.from.y) * t;
    m.lift = Math.sin(t * Math.PI) * 26;
    m.moving = true;
    if (t < 1) return true;
    if (!ctx.canStand(a.to.x, a.to.y)) {
      Object.assign(m, a.from);
      finish(m);
      return true;
    }
    m.lift = 0;
    impact(s, m, a.to, a.radius, m.damage, "leap", ctx);
    if (a.leg === 0) {
      a.phase = "bounce";
      a.age = 0;
      m.moving = false;
    } else finish(m);
  }
  return true;
}
