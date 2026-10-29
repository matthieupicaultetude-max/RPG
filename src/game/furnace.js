import { createMonster } from "../data/monsters.js";
import { distance, lineClear } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
import {
  FURNACE_SLIMES,
  FURNACE_BOSS_HOME,
  ROOMS,
  BRAZIERS,
  CURRENTS,
  canWalkFurnace,
} from "../world/furnace-map.js";
export const FURNACE_RULES = Object.freeze({
  trailLife: 4,
  trailWarning: 0.35,
  tick: 0.6,
  blastWarning: 1,
  blastRadius: 32,
  projectionWarning: 0.8,
  breathWarning: 1.8,
  breathLock: 1,
  breathRange: 200,
  halfAngle: 0.45,
  exposed: 8,
  maxEmbers: 160,
});
const party = (s) =>
  s.team.filter((p) => p.hp > 0 && (p.id === s.main || s.deployed));
const within = (p, r, margin = 5) =>
  p.x >= r.x + margin &&
  p.x <= r.x + r.w - margin &&
  p.y >= r.y + margin &&
  p.y <= r.y + r.h - margin;
export const furnaceBoss = (s) =>
  s.zone === "slime-furnace" ? s.monsters.find((m) => m.furnaceBoss) : null;
export function furnaceState(s) {
  return (s.furnace ??= {
    embers: [],
    blasts: [],
    braziers: BRAZIERS.map((b) => ({
      ...b,
      lit: b.room !== 3,
      dangerAt: s.time + 1,
      relightAt: 0,
    })),
    nextDamage: {},
  });
}
export function createFurnaceWorld() {
  return {
    monsters: [
      ...FURNACE_SLIMES.map((p) =>
        Object.assign(createMonster("cinder-slime", p.x, p.y, 6), {
          furnaceRoom: p.room,
        }),
      ),
      Object.assign(
        createMonster(
          "siroccolimon",
          FURNACE_BOSS_HOME.x,
          FURNACE_BOSS_HOME.y,
          10,
        ),
        { furnaceRoom: 3 },
      ),
    ],
    bots: [],
    npcs: [],
    trees: [],
  };
}
export function clearFurnaceHazards(s) {
  delete s.furnace;
}
export const nearFurnaceBoss = (s) => {
  const b = furnaceBoss(s);
  return (
    !!b &&
    b.hp > 0 &&
    b.bossPhase === "dormant" &&
    s.team[s.main].hp > 0 &&
    distance(s.player, b) < 65
  );
};
function lightBossBraziers(s) {
  for (const b of furnaceState(s).braziers)
    if (b.room === 3) {
      b.lit = true;
      b.dangerAt = s.time + 1;
      b.relightAt = 0;
    }
  s.revision++;
}
export function awakenFurnaceBoss(s, b = furnaceBoss(s)) {
  if (
    !b ||
    !b.furnaceBoss ||
    s.zone !== "slime-furnace" ||
    b.hp <= 0 ||
    b.bossPhase !== "dormant" ||
    s.team[s.main].hp <= 0 ||
    distance(s.player, b) > 110
  )
    return false;
  b.bossPhase = "combat";
  b.cooldown = 1;
  emitSound(s, "magic", b, { element: "fire" });
  lightBossBraziers(s);
  s.log.unshift(
    "Siroccolimon : placez un brasero entre lui et vous pour guider son souffle !",
  );
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
  return true;
}
export function resetFurnaceBoss(s) {
  const b = furnaceBoss(s);
  if (!b) return;
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
    needsRelight: false,
    lift: 0,
    moving: false,
  });
  for (const key of [
    "intent",
    "spellState",
    "bonusTarget",
    "lastReceivedDamage",
  ])
    delete b[key];
  if (s.furnace) {
    s.furnace.embers = [];
    s.furnace.blasts = [];
    s.furnace.nextDamage = {};
    for (const f of s.furnace.braziers) if (f.room === 3) f.lit = false;
  }
  s.revision++;
}
export function finishFurnaceBoss(s, b) {
  b.bossPhase = "dead";
  delete b.intent;
  const f = furnaceState(s);
  f.embers = [];
  f.blasts = [];
  for (const brazier of f.braziers) {
    brazier.lit = false;
    brazier.relightAt = 0;
  }
  if (s.dungeonRun?.dungeonId === "slime-furnace") {
    s.dungeonRun.completed = true;
    s.dungeonRun.completedAt = s.time;
  }
  s.log.unshift("Le Grand Foyer s’éteint. Siroccolimon est vaincu !");
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
}
export function inFurnaceCone(point, cone, canStand = canWalkFurnace) {
  const dx = point.x - cone.from.x,
    dy = point.y - cone.from.y,
    d = Math.hypot(dx, dy);
  return (
    d <= cone.range &&
    (d < 1 ||
      (dx * Math.cos(cone.angle) + dy * Math.sin(cone.angle)) / d >=
        Math.cos(cone.halfAngle)) &&
    lineClear(cone.from, point, canStand)
  );
}
function face(m, point) {
  const dx = point.x - m.x,
    dy = point.y - m.y;
  m.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
        ? "down"
        : "up";
}
function clipped(from, to, canStand = canWalkFurnace) {
  const d = distance(from, to);
  let point = { x: from.x, y: from.y };
  for (let n = 2; n < d + 2; n += 2) {
    const t = Math.min(1, n / (d || 1)),
      p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    if (!canStand(p.x, p.y)) break;
    point = p;
  }
  return point;
}
export function addFurnaceEmber(s, point, source) {
  if (!canWalkFurnace(point.x, point.y)) return null;
  const f = furnaceState(s);
  if (
    f.embers.length >= FURNACE_RULES.maxEmbers ||
    f.embers.some((e) => distance(e, point) < 7 && !e.flight)
  )
    return null;
  const e = {
    x: point.x,
    y: point.y,
    radius: 8,
    readyAt: s.time + FURNACE_RULES.trailWarning,
    expiresAt: s.time + FURNACE_RULES.trailWarning + FURNACE_RULES.trailLife,
    damage: Math.max(1, Math.round(source.damage * 0.4)),
    source: { x: point.x, y: point.y, name: source.name },
  };
  f.embers.push(e);
  return e;
}
export function projectFurnaceEmbers(s, cone) {
  for (const e of furnaceState(s).embers) {
    if (e.flight || !inFurnaceCone(e, cone)) continue;
    const to = clipped(e, {
      x: e.x + Math.cos(cone.angle) * 45,
      y: e.y + Math.sin(cone.angle) * 45,
    });
    if (distance(e, to) < 4) continue;
    e.flight = {
      from: { x: e.x, y: e.y },
      to,
      landsAt: s.time + FURNACE_RULES.projectionWarning,
    };
  }
}
export function resolveFurnaceBreath(s, m, cone, ctx) {
  for (const p of party(s))
    if (inFurnaceCone(p, cone, ctx.canStand))
      ctx.damage(p, Math.round(m.damage * 1.2), m, "air", "air-burst");
  projectFurnaceEmbers(s, cone);
  const f = furnaceState(s);
  for (const b of f.braziers)
    if (
      b.lit &&
      (b.room !== 3 || m.furnaceBoss) &&
      inFurnaceCone(b, cone, ctx.canStand)
    ) {
      b.lit = false;
      b.relightAt = b.room === 3 ? 0 : s.time + 10;
      s.effects.push({
        x: b.x,
        y: b.y - 20,
        text: "Brasero éteint",
        color: "#bde9e0",
        life: 1,
      });
      s.revision++;
    }
  if (
    m.furnaceBoss &&
    f.braziers.filter((b) => b.room === 3).every((b) => !b.lit)
  ) {
    m.vulnerableUntil = s.time + FURNACE_RULES.exposed;
    m.cooldown = FURNACE_RULES.exposed;
    m.needsRelight = true;
    delete m.intent;
    s.log.unshift(
      "Les trois braseros sont éteints : cœur exposé pendant 8 secondes !",
    );
    s.log.length = Math.min(6, s.log.length);
    s.revision++;
  }
  emitSound(s, "magic", m, { element: "air" });
}
export function onFurnaceDeath(s, m) {
  if (!m.furnaceSlime || m.furnaceBoss || m.hp > 0 || m.furnaceDeathQueued)
    return false;
  m.furnaceDeathQueued = true;
  furnaceState(s).blasts.push({
    x: m.x,
    y: m.y,
    radius: FURNACE_RULES.blastRadius,
    explodesAt: s.time + FURNACE_RULES.blastWarning,
    damage: Math.round(m.damage * 1.5),
    source: { x: m.x, y: m.y, name: m.name },
  });
  s.revision++;
  return true;
}
export function furnaceCurrent(s, c) {
  const phase = (((s.time + c.offset) % 6) + 6) % 6;
  return {
    warning: phase < 1,
    active: phase >= 1 && phase < 3,
    serial: Math.floor((s.time + c.offset) / 6),
    direction: Math.floor((s.time + c.offset) / 6) % 2 ? -1 : 1,
  };
}
export function stepFurnaceHazards(s, dt, ctx) {
  if (s.zone !== "slime-furnace" || dt <= 0) return;
  const f = furnaceState(s);
  for (const b of f.braziers)
    if (!b.lit && b.room !== 3 && b.relightAt && s.time >= b.relightAt) {
      b.lit = true;
      b.dangerAt = s.time + 1;
      b.relightAt = 0;
      s.revision++;
    }
  for (const c of CURRENTS) {
    const flow = furnaceCurrent(s, c);
    if (!flow.active) continue;
    const cone = {
      from: { x: flow.direction > 0 ? c.x : c.x + c.w, y: c.y + c.h / 2 },
      angle: flow.direction > 0 ? 0 : Math.PI,
      range: c.w + 20,
      halfAngle: 0.7,
    };
    for (const e of f.embers)
      if (
        within(e, c, 0) &&
        e.currentPulse !== `${c.x}:${flow.serial}` &&
        !e.flight
      ) {
        e.currentPulse = `${c.x}:${flow.serial}`;
        projectOne(e, cone);
      }
    for (const blast of f.blasts)
      if (!blast.diverted && within(blast, c, 0)) {
        const from = { x: blast.x, y: blast.y },
          to = clipped(from, { x: from.x + flow.direction * 45, y: from.y });
        if (distance(from, to) > 4) {
          Object.assign(blast, to, {
            from,
            diverted: true,
            explodesAt: s.time + FURNACE_RULES.blastWarning,
          });
          Object.assign(blast.source, to);
          s.revision++;
        }
      }
  }
  function projectOne(e, cone) {
    const to = clipped(e, { x: e.x + Math.cos(cone.angle) * 45, y: e.y });
    if (distance(e, to) > 4)
      e.flight = {
        from: { x: e.x, y: e.y },
        to,
        landsAt: s.time + FURNACE_RULES.projectionWarning,
      };
  }
  for (const e of f.embers)
    if (e.flight && s.time >= e.flight.landsAt) {
      Object.assign(e, e.flight.to);
      delete e.flight;
      e.readyAt = s.time;
    }
  f.embers = f.embers.filter((e) => e.expiresAt > s.time);
  for (const p of party(s)) {
    if ((f.nextDamage[p.id] || 0) > s.time) continue;
    const ember = f.embers.find(
      (e) =>
        !e.flight &&
        e.readyAt <= s.time &&
        distance(e, p) <= e.radius &&
        lineClear(e, p, ctx.canStand),
    );
    const brazier = f.braziers.find(
      (b) =>
        b.lit &&
        b.dangerAt <= s.time &&
        distance(b, p) <= 15 &&
        lineClear(b, p, ctx.canStand),
    );
    if (ember || brazier) {
      const h = ember || brazier;
      ctx.damage(p, ember?.damage || 6, h.source || h, "fire", "burn");
      f.nextDamage[p.id] = s.time + FURNACE_RULES.tick;
    }
  }
  f.blasts = f.blasts.filter((b) => {
    if (s.time < b.explodesAt) return true;
    for (const p of party(s))
      if (distance(p, b) <= b.radius && lineClear(b, p, ctx.canStand))
        ctx.damage(p, b.damage, b.source, "fire", "explosion");
    s.monsterImpacts.push({
      x: b.x,
      y: b.y,
      radius: b.radius,
      element: "fire",
      life: 0.6,
    });
    emitSound(s, "magic", b, { element: "fire" });
    return false;
  });
}
function target(s, m) {
  const choices = party(s).filter((p) => within(p, ROOMS[m.furnaceRoom ?? 3]));
  return (
    (m.furnaceBoss ? choices.find((p) => p.id === s.main) : null) ||
    choices.sort((a, b) => distance(a, m) - distance(b, m))[0]
  );
}
function beginCharge(s, m, to, leg) {
  const end = clipped(m, to),
    angle = Math.atan2(end.y - m.y, end.x - m.x);
  m.intent = {
    kind: "furnace-cycle",
    phase: "charge-warning",
    element: "fire",
    age: 0,
    windup: 1.05,
    from: { x: m.x, y: m.y },
    to: end,
    angle,
    leg,
    radius: m.furnaceBoss ? 14 : 10,
    hitIds: [],
    trailPoint: { x: m.x, y: m.y },
  };
  m.moving = false;
  face(m, end);
  emitSound(s, "cast", m, { element: "fire" });
  s.revision++;
}
function beginBreath(s, m) {
  const p = target(s, m);
  if (!p) {
    finish(m);
    return;
  }
  m.intent = {
    kind: "furnace-cycle",
    phase: "breath",
    element: "air",
    age: 0,
    windup: FURNACE_RULES.breathWarning,
    from: { x: m.x, y: m.y },
    to: { x: p.x, y: p.y },
    angle: Math.atan2(p.y - m.y, p.x - m.x),
    range: m.furnaceBoss ? 200 : 140,
    halfAngle: FURNACE_RULES.halfAngle,
    locked: false,
  };
  m.moving = false;
  emitSound(s, "cast", m, { element: "air" });
  s.revision++;
}
function finish(m) {
  delete m.intent;
  m.moving = false;
  m.cooldown = m.furnaceBoss ? 1.8 : 3;
}
export function stepFurnaceMonster(s, m, dt, ctx) {
  if (m.hp <= 0) {
    delete m.intent;
    return;
  }
  if (m.furnaceBoss) {
    if (m.bossPhase !== "combat") return;
    if (!party(s).some((p) => within(p, ROOMS[3]))) {
      resetFurnaceBoss(s);
      return;
    }
  }
  let a = m.intent;
  if (!a) {
    if (
      m.cooldown > 0 ||
      (m.vulnerableUntil || 0) > s.time ||
      m.spellState?.root > 0
    )
      return;
    const p = target(s, m);
    if (!p) return;
    if (m.needsRelight) {
      lightBossBraziers(s);
      m.needsRelight = false;
    }
    const length = Math.min(m.furnaceBoss ? 110 : 85, distance(m, p)),
      angle = Math.atan2(p.y - m.y, p.x - m.x);
    beginCharge(
      s,
      m,
      { x: m.x + Math.cos(angle) * length, y: m.y + Math.sin(angle) * length },
      0,
    );
    return;
  }
  if (dt <= 0) return;
  if (m.spellState?.root > 0) {
    finish(m);
    return;
  }
  a.age += dt;
  m.moving = false;
  if (a.phase === "charge-warning") {
    a.from = { x: m.x, y: m.y };
    a.to = clipped(a.from, a.to);
    if (a.age >= a.windup) {
      a.phase = "charge";
      a.age = 0;
      face(m, a.to);
    }
    return;
  }
  if (a.phase === "charge") {
    const from = { x: m.x, y: m.y },
      speed = m.furnaceBoss && m.hp < m.maxHp * 0.4 ? 240 : 180,
      d = distance(m, a.to),
      step = Math.min(d, speed * dt);
    const angle = Math.atan2(a.to.y - m.y, a.to.x - m.x);
    Object.assign(
      m,
      clipped(
        m,
        { x: m.x + Math.cos(angle) * step, y: m.y + Math.sin(angle) * step },
        ctx.canStand,
      ),
    );
    m.moving = true;
    const travelled = distance(from, m),
      samples = Math.max(1, Math.ceil(travelled / 3));
    for (let n = 0; n <= samples; n++) {
      const p = {
        x: from.x + ((m.x - from.x) * n) / samples,
        y: from.y + ((m.y - from.y) * n) / samples,
      };
      if (distance(p, a.trailPoint) >= 7) {
        addFurnaceEmber(s, p, m);
        a.trailPoint = p;
      }
      for (const hero of party(s))
        if (
          !a.hitIds.includes(hero.id) &&
          distance(p, hero) <= a.radius &&
          lineClear(p, hero, ctx.canStand)
        ) {
          a.hitIds.push(hero.id);
          ctx.damage(hero, Math.round(m.damage * 1.3), m, "fire", "charge");
        }
    }
    if (distance(m, a.to) < 1 || travelled < 0.1) {
      m.moving = false;
      if (m.furnaceBoss && a.leg === 0)
        beginCharge(s, m, { x: m.homeX, y: m.homeY }, 1);
      else beginBreath(s, m);
    }
    return;
  }
  if (a.phase === "breath") {
    // Track only during the first .8s, then give a full second with a locked cone.
    a.from = { x: m.x, y: m.y };
    if (a.age < FURNACE_RULES.breathWarning - FURNACE_RULES.breathLock) {
      const p = target(s, m);
      if (p) {
        a.to = { x: p.x, y: p.y };
        a.angle = Math.atan2(p.y - m.y, p.x - m.x);
        face(m, p);
      }
    } else if (!a.locked) {
      a.locked = true;
      s.revision++;
    }
    if (a.age < a.windup) return;
    resolveFurnaceBreath(s, m, a, ctx);
    if (m.intent) finish(m);
  }
}
