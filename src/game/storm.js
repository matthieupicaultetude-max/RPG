import { createMonster } from "../data/monsters.js";
import { lineClear, distance } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
import { cancelWoodcutting } from "./woodcutting.js";
import {
  STORM_SLIMES,
  STORM_BOSS_HOME,
  CURRENTS,
  FLOWERS,
  ROOMS,
  canWalkStorm,
  poolAt,
} from "../world/storm-map.js";
export const STORM_RULES = Object.freeze({
  inflate: 1.8,
  suctionRadius: 76,
  pullSpeed: 22,
  burstRadius: 37,
  flight: 0.6,
  pause: 0.3,
  recovery: 3.2,
  exposed: 6,
  maxSlimes: 12,
  flowerCooldown: 10,
});
const party = (s) =>
  s.team.filter((p) => p.hp > 0 && (p.id === s.main || s.deployed));
const roomOf = (m) => (m.stormBoss ? 3 : (m.stormRoom ?? 0));
const inRoom = (p, room, margin = 5) =>
  p.x >= room.x + margin &&
  p.x <= room.x + room.w - margin &&
  p.y >= room.y + margin &&
  p.y <= room.y + room.h - margin;
function clampPoint(point, room) {
  for (const shift of [0, 12, -12, 24, -24, 40, -40]) {
    const p = {
      x: Math.max(room.x + 14, Math.min(room.x + room.w - 14, point.x + shift)),
      y: Math.max(room.y + 14, Math.min(room.y + room.h - 14, point.y + shift)),
    };
    if (canWalkStorm(p.x, p.y)) return p;
  }
  return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
}
function grow(m, size) {
  const ratio = m.hp / m.maxHp;
  m.growth = Math.max(1, Math.min(3, size));
  m.maxHp = m.stormBoss
    ? m.baseMaxHp
    : Math.round(m.baseMaxHp * (1 + 0.25 * (m.growth - 1)));
  m.hp = Math.max(1, Math.min(m.maxHp, Math.round(m.maxHp * ratio)));
}
export function createStormWorld() {
  const monsters = STORM_SLIMES.map((p) => {
    const m = createMonster("foam-slime", p.x, p.y, 6);
    Object.assign(m, { stormRoom: p.room, baseMaxHp: m.maxHp });
    grow(m, p.growth);
    return m;
  });
  const b = createMonster(
    "nimbulimon",
    STORM_BOSS_HOME.x,
    STORM_BOSS_HOME.y,
    10,
  );
  Object.assign(b, { baseMaxHp: b.maxHp, stormRoom: 3 });
  grow(b, 3);
  monsters.push(b);
  return { monsters, bots: [], npcs: [], trees: [] };
}
export const stormBoss = (s) =>
  s.zone === "slime-storm" ? s.monsters.find((m) => m.stormBoss) : null;
export const nearStormBoss = (s) => {
  const b = stormBoss(s);
  return (
    !!b &&
    b.hp > 0 &&
    b.bossPhase === "dormant" &&
    s.team[s.main].hp > 0 &&
    distance(s.player, b) < 65
  );
};
export function awakenStormBoss(s, b = stormBoss(s)) {
  if (
    !b ||
    !b.stormBoss ||
    b.hp <= 0 ||
    b.bossPhase !== "dormant" ||
    s.zone !== "slime-storm" ||
    s.team[s.main].hp <= 0 ||
    distance(s.player, b) > 100
  )
    return false;
  b.bossPhase = "combat";
  b.cooldown = 1;
  s.log.unshift(
    "Nimbulimon s’éveille : guidez son dernier ricochet sur une dalle sèche !",
  );
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
  emitSound(s, "magic", b, { element: "water" });
  return true;
}
export function resetStormBoss(s) {
  const b = stormBoss(s);
  if (!b) return;
  delete s.stormRageStarted;
  for (const m of s.monsters)
    if (m.stormSpawn && m.stormRoom === 3) {
      m.hp = 0;
      delete m.intent;
    }
  if (b.hp <= 0) {
    b.bossPhase = "dead";
    delete b.intent;
    return;
  }
  Object.assign(b, {
    x: b.homeX,
    y: b.homeY,
    hp: b.maxHp,
    bossPhase: "dormant",
    cooldown: 1,
    vulnerableUntil: 0,
    lift: 0,
    moving: false,
  });
  grow(b, 3);
  b.hp = b.maxHp;
  for (const key of [
    "intent",
    "spellState",
    "bonusTarget",
    "lastReceivedDamage",
  ])
    delete b[key];
}
export function finishStormBoss(s, b) {
  b.bossPhase = "dead";
  delete b.intent;
  b.lift = 0;
  for (const m of s.monsters)
    if (m.stormSpawn && m.stormRoom === 3) {
      m.hp = 0;
      delete m.intent;
    }
  if (s.dungeonRun?.dungeonId === "slime-storm") {
    s.dungeonRun.completed = true;
    s.dungeonRun.completedAt = s.time;
  }
  s.log.unshift("La tempête s’apaise. Nimbulimon est vaincu !");
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
}
export function currentState(s, c) {
  const boss = stormBoss(s),
    rage =
      c.room === 3 &&
      !!boss &&
      boss.bossPhase === "combat" &&
      boss.hp < boss.maxHp * 0.4;
  const period = rage ? 4.5 : 6,
    t = (rage ? s.time - (s.stormRageStarted ?? s.time) : s.time) + c.offset,
    phase = ((t % period) + period) % period;
  return {
    warning: phase < 1,
    active: phase >= 1 && phase < 3,
    direction: Math.floor(t / period) % 2 ? -1 : 1,
  };
}
function shift(s, p, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
  let moved = false;
  for (let i = 0; i < steps; i++) {
    const x = p.x + dx / steps,
      y = p.y + dy / steps;
    if (!canWalkStorm(x, y)) break;
    p.x = x;
    p.y = y;
    moved = true;
  }
  if (moved && p.id === s.main && !p.species) {
    Object.assign(s.player, { x: p.x, y: p.y });
    cancelWoodcutting(s);
  }
}
export function stepStormEnvironment(s, dt) {
  if (s.zone !== "slime-storm" || dt <= 0) return;
  const boss = stormBoss(s);
  if (
    boss?.bossPhase === "combat" &&
    boss.hp < boss.maxHp * 0.4 &&
    s.stormRageStarted === undefined
  ) {
    s.stormRageStarted = s.time;
    s.revision++;
  }
  const alive = s.monsters.filter((m) => m.stormSlime && m.hp > 0);
  if (s.stormFlowers?.length !== FLOWERS.length)
    s.stormFlowers = FLOWERS.map(() => 0);
  for (const m of alive) {
    if (m.intent || (m.boss && m.bossPhase !== "combat")) continue;
    m.waterTime = (m.waterTime || 0) + dt;
    if (m.waterTime >= 2) {
      m.waterTime = 0;
      if (poolAt(m) && m.growth < 3) {
        grow(m, m.growth + 1);
        s.revision++;
      }
    }
    FLOWERS.forEach((f, i) => {
      if (m.growth < 3 && distance(m, f) < 20 && s.stormFlowers[i] <= s.time) {
        grow(m, m.growth + 1);
        s.stormFlowers[i] = s.time + STORM_RULES.flowerCooldown;
        s.revision++;
      }
    });
  }
  for (const c of CURRENTS) {
    if (c.room === 3 && stormBoss(s)?.bossPhase !== "combat") continue;
    const flow = currentState(s, c);
    if (!flow.active) continue;
    for (const p of [...party(s), ...alive.filter((m) => !m.stormBoss)]) {
      if (p.hp <= 0 || p.intent?.phase === "flight" || !inRoom(p, c, 0))
        continue;
      const dx = c.room === 1 ? 0 : flow.direction * 18 * dt,
        dy = c.room === 1 ? flow.direction * 18 * dt : 0;
      shift(s, p, dx, dy);
    }
  }
  // Only one aspiration at a time: no compounded pull fields.
  const m = alive.find((m) => m.intent?.phase === "inflate");
  if (m)
    for (const p of party(s)) {
      const d = distance(p, m);
      if (
        d < 8 ||
        d > STORM_RULES.suctionRadius ||
        !lineClear(m, p, canWalkStorm)
      )
        continue;
      shift(
        s,
        p,
        ((m.x - p.x) / d) * STORM_RULES.pullSpeed * dt,
        ((m.y - p.y) / d) * STORM_RULES.pullSpeed * dt,
      );
    }
}
function face(m, p) {
  const x = p.x - m.x,
    y = p.y - m.y;
  m.facing =
    Math.abs(x) > Math.abs(y)
      ? x > 0
        ? "right"
        : "left"
      : y > 0
        ? "down"
        : "up";
}
function isolated(s, m) {
  const members = party(s).filter((p) => inRoom(p, ROOMS[roomOf(m)]));
  if (!members.length) return null;
  const center = {
    x: members.reduce((n, p) => n + p.x, 0) / members.length,
    y: members.reduce((n, p) => n + p.y, 0) / members.length,
  };
  return members.sort(
    (a, b) =>
      distance(b, center) - distance(a, center) ||
      distance(b, m) - distance(a, m),
  )[0];
}
function beginInflate(s, m, a) {
  if (
    s.monsters.some(
      (other) =>
        other !== m &&
        other.hp > 0 &&
        other.intent?.kind === "storm-cycle" &&
        other.intent.phase === "inflate",
    )
  ) {
    a.phase = "wait-air";
    a.age = 0;
    return;
  }
  const target = isolated(s, m);
  if (!target) {
    finish(m);
    return;
  }
  const room = ROOMS[roomOf(m)],
    last = clampPoint(target, room);
  const first = clampPoint(
    { x: (m.x + last.x) / 2 + 30, y: (m.y + last.y) / 2 - 25 },
    room,
  );
  a.landings = [first, last];
  a.phase = "inflate";
  a.age = 0;
  a.element = "air";
  a.from = { x: m.x, y: m.y };
  a.windup = STORM_RULES.inflate;
  a.radius = (m.stormBoss ? 30 : 20) + 4 * (m.growth - 1);
  emitSound(s, "cast", m, { element: "air" });
  s.revision++;
}
function finish(m, seconds = STORM_RULES.recovery) {
  delete m.intent;
  m.lift = 0;
  m.moving = false;
  m.cooldown = seconds;
}
function impact(s, m, a, point, element, ctx) {
  let hits = 0;
  for (const p of party(s))
    if (distance(point, p) <= a.radius && lineClear(point, p, ctx.canStand)) {
      ctx.damage(
        p,
        Math.round(m.damage * (1 + 0.2 * (m.growth - 1))),
        m,
        element,
        "leap",
      );
      hits++;
    }
  s.monsterImpacts.push({ ...point, radius: a.radius, element, life: 0.55 });
  emitSound(s, "magic", point, { element });
  return hits;
}
function spawnChild(s, m) {
  if (
    s.monsters.filter((n) => n.stormSlime && n.hp > 0).length >=
      STORM_RULES.maxSlimes ||
    s.monsters.length >= 64
  )
    return;
  const room = ROOMS[roomOf(m)];
  const point = clampPoint({ x: m.x + 23, y: m.y + 18 }, room);
  const child = createMonster("foam-slime", point.x, point.y, m.level);
  const hp = m.stormBoss
    ? Math.round(child.maxHp * 0.4)
    : Math.min(child.maxHp, Math.max(1, Math.floor(m.hp * 0.2)));
  if (!m.stormBoss) m.hp = Math.max(1, m.hp - hp);
  Object.assign(child, {
    stormSpawn: true,
    stormRoom: roomOf(m),
    growth: 1,
    baseMaxHp: child.maxHp,
    hp,
    cooldown: 2,
  });
  // Append only: existing spell/buff monster indices remain stable.
  s.monsters.push(child);
}
export function onStormLanding(s, m, point, hits, final = false) {
  if (poolAt(point)) {
    if (m.growth < 3) grow(m, m.growth + 1);
    return false;
  }
  if (hits === 0 && m.growth > 1 && (!m.stormBoss || final)) {
    spawnChild(s, m);
    grow(m, m.growth - 1);
    m.vulnerableUntil = s.time + (m.stormBoss ? STORM_RULES.exposed : 2.5);
    s.revision++;
    return true;
  }
  return false;
}
export function stepStormMonster(s, m, dt, ctx) {
  if (m.hp <= 0) {
    delete m.intent;
    m.lift = 0;
    return;
  }
  if (m.stormBoss) {
    if (m.bossPhase !== "combat") return;
    if (!party(s).some((p) => inRoom(p, ROOMS[3]))) {
      resetStormBoss(s);
      return;
    }
  }
  let a = m.intent;
  if (!a) {
    if ((m.vulnerableUntil || 0) > s.time) return;
    if (m.cooldown > 0 || m.spellState?.root > 0) return;
    const target = isolated(s, m);
    if (!target) return;
    if (m.stormBoss && m.growth < 3) grow(m, m.growth + 1);
    a = m.intent = {
      kind: "storm-cycle",
      phase: "water-windup",
      age: 0,
      windup: 1.2 + 0.2 * (m.growth - 1),
      element: "water",
      from: { x: m.x, y: m.y },
      to: clampPoint(target, ROOMS[roomOf(m)]),
      radius: (m.stormBoss ? 31 : 20) + 5 * (m.growth - 1),
      leg: -1,
    };
    face(m, a.to);
    m.moving = false;
    s.revision++;
    return;
  }
  if (dt <= 0) return;
  if (m.spellState?.root > 0 && a.phase !== "flight") {
    finish(m);
    return;
  }
  a.age += dt;
  m.moving = false;
  if (a.phase === "water-windup") {
    if (a.age < a.windup) return;
    a.phase = "flight";
    a.age = 0;
    a.from = { x: m.x, y: m.y };
    return;
  }
  if (a.phase === "wait-air") {
    if (a.age >= 0.2) beginInflate(s, m, a);
    return;
  }
  if (a.phase === "inflate") {
    if (a.age < a.windup) return;
    impact(
      s,
      m,
      { radius: STORM_RULES.burstRadius + (m.stormBoss ? 8 : 0) },
      m,
      "air",
      ctx,
    );
    a.phase = "flight";
    a.age = 0;
    a.leg = 0;
    a.from = { x: m.x, y: m.y };
    a.to = a.landings[0];
    face(m, a.to);
    return;
  }
  if (a.phase === "bounce") {
    if (a.age < STORM_RULES.pause) return;
    a.phase = "flight";
    a.age = 0;
    a.leg = 1;
    a.element = "water";
    a.from = { x: m.x, y: m.y };
    a.to = a.landings[1];
    face(m, a.to);
    return;
  }
  if (a.phase === "flight") {
    const t = Math.min(1, a.age / STORM_RULES.flight);
    m.x = a.from.x + (a.to.x - a.from.x) * t;
    m.y = a.from.y + (a.to.y - a.from.y) * t;
    m.lift = Math.sin(t * Math.PI) * (m.stormBoss ? 36 : 24);
    m.moving = true;
    if (t < 1) return;
    m.lift = 0;
    m.moving = false;
    const hits = impact(s, m, a, a.to, a.leg === 0 ? "air" : "water", ctx);
    if (a.leg === -1) {
      onStormLanding(s, m, a.to, hits);
      beginInflate(s, m, a);
    } else if (a.leg === 0) {
      a.phase = "bounce";
      a.age = 0;
    } else {
      const missed = onStormLanding(s, m, a.to, hits, true);
      if (m.stormBoss) {
        m.vulnerableUntil = s.time + (missed ? STORM_RULES.exposed : 2);
        finish(m, missed ? STORM_RULES.exposed : 3.2);
      } else finish(m);
    }
  }
}
