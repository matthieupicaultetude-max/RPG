import { findPath } from "../ai/companions.js";
import { createMonster } from "../data/monsters.js";
import { monsterAttack, monsterAttackDamage } from "../data/monster-attacks.js";
import { activeParty, stepMonsterAbility } from "../combat/monster-attacks.js";
import { lineClear, distance } from "../combat/attacks.js";
import { canWalkDepths, DEPTHS_BOSS_HOME } from "../world/slime-depths-map.js";
import { emitSound } from "../audio/events.js";
export const BOSS_RULES = {
  splitDuration: 12,
  exposedDuration: 5,
  missDuration: 2,
  healPerMass: 0.04,
  leash: 200,
};
export const depthsBoss = (s) =>
  s.zone === "slime-depths" ? s.monsters.find((m) => m.boss) : null;
export function createDepthsBoss() {
  return createMonster("gorgelimon", DEPTHS_BOSS_HOME.x, DEPTHS_BOSS_HOME.y, 8);
}
function say(s, b, text, color = "#b9eef0") {
  s.effects.push({ x: b.x, y: b.y - 58, text, color, life: 1.5 });
  s.revision++;
}
export function nearDepthsBoss(s) {
  const b = depthsBoss(s);
  return (
    !!b &&
    s.team[s.main].hp > 0 &&
    b.hp > 0 &&
    b.bossPhase === "dormant" &&
    !s.zoneDive &&
    distance(s.player, b) < 65
  );
}
export function awakenDepthsBoss(s, b = depthsBoss(s)) {
  if (
    !b ||
    s.team[s.main].hp <= 0 ||
    !b.boss ||
    b.hp <= 0 ||
    s.zone !== "slime-depths" ||
    b.bossPhase !== "dormant"
  )
    return false;
  if (distance(s.player, DEPTHS_BOSS_HOME) > 130) return false;
  b.bossPhase = "combat";
  b.cooldown = 1.2;
  b.bossStage = 0;
  say(s, b, "Gorgelimon s’éveille !");
  emitSound(s, "magic", b, { element: "water" });
  return true;
}
function clearSummons(s, b) {
  const owner = s.monsters.indexOf(b);
  for (const m of s.monsters)
    if (m.bossOwner === owner) {
      m.hp = 0;
      m.merged = true;
      delete m.intent;
      delete m.fusionWith;
      delete m.bonusTarget;
    }
}
export function resetDepthsBoss(s) {
  const b = depthsBoss(s);
  if (!b) return;
  clearSummons(s, b);
  if (b.hp <= 0) {
    b.bossPhase = "dead";
    delete b.intent;
    return;
  }
  if (b.bossPhase === "dormant") return;
  Object.assign(b, {
    hp: b.maxHp,
    x: b.homeX,
    y: b.homeY,
    bossPhase: "dormant",
    bossStage: 0,
    cooldown: 1.2,
    lift: 0,
    attackSerial: 0,
    vulnerableUntil: 0,
    bonusTargetCooldown: 0,
  });
  for (const key of [
    "intent",
    "splitUntil",
    "bonusTarget",
    "lastReceivedDamage",
    "spellState",
    "bossRoute",
    "bossRouteAt",
  ])
    delete b[key];
  s.revision++;
}
export function finishDepthsBoss(s, b) {
  b.bossPhase = "dead";
  delete b.intent;
  b.lift = 0;
  clearSummons(s, b);
  emitSound(s, "bonus", b, { element: "water" });
  say(s, b, "Le cœur du gouffre s’éteint…", "#f3d991");
}
export function onBossLanding(s, b, hits) {
  if (!b.boss || hits || b.hp <= 0) return;
  b.vulnerableUntil = s.time + BOSS_RULES.missDuration;
  say(s, b, "Cœur fissuré !", "#ffe2a4");
}
function spawnAspect(s, b, element) {
  const owner = s.monsters.indexOf(b),
    angle = element === "water" ? Math.PI : 0;
  let point = { x: b.x, y: b.y };
  for (let i = 0; i < 16; i++) {
    const a = angle + (i * Math.PI) / 8,
      p = { x: b.x + Math.cos(a) * 38, y: b.y + Math.sin(a) * 38 };
    if (canWalkDepths(p.x, p.y) && lineClear(b, p, canWalkDepths)) {
      point = p;
      break;
    }
  }
  const m = createMonster(
    element === "water" ? "depths-water-slime" : "depths-earth-slime",
    point.x,
    point.y,
    b.level,
  );
  m.baseMaxHp = Math.round(m.baseMaxHp * 0.45);
  m.growth = 2;
  m.maxHp = Math.round(m.baseMaxHp * 1.3);
  m.hp = m.maxHp;
  m.bossOwner = owner;
  m.fusionReadyAt = s.time + 3;
  m.cooldown = 1;
  s.monsters.push(m);
}
function split(s, b) {
  // An airborne boss first returns to a valid floor before shedding its shell.
  if (b.intent?.phase === "flight") Object.assign(b, b.intent.from);
  delete b.intent;
  b.lift = 0;
  b.moving = false;
  b.bossStage++;
  b.bossPhase = "split";
  b.splitUntil = s.time + BOSS_RULES.splitDuration;
  delete b.bonusTarget;
  spawnAspect(s, b, "water");
  spawnAspect(s, b, "earth");
  say(s, b, "Scission du cœur · 12 s !", "#e6c797");
  emitSound(s, "magic", b, { element: "earth" });
}
function reform(s, b) {
  const owner = s.monsters.indexOf(b),
    survivors = s.monsters.filter((m) => m.bossOwner === owner && m.hp > 0);
  if (survivors.length && s.time < b.splitUntil) return;
  if (survivors.length) {
    const mass = survivors.reduce((n, m) => n + m.growth, 0),
      healing = Math.round(b.maxHp * BOSS_RULES.healPerMass * mass);
    b.hp = Math.min(b.maxHp, b.hp + healing);
    say(s, b, `Réabsorption · +${healing} PV`, "#a7e1be");
  } else {
    b.vulnerableUntil = s.time + BOSS_RULES.exposedDuration;
    say(s, b, "Cœur exposé · dégâts +50 % !", "#ffe2a4");
  }
  clearSummons(s, b);
  emitSound(s, survivors.length ? "heal" : "bonus", b, { element: "water" });
  b.bossPhase = "combat";
  b.cooldown = 1.4;
  delete b.splitUntil;
  s.revision++;
}
export function stepDepthsBoss(s, b, dt, ctx) {
  if (b.hp <= 0 || b.bossPhase === "dormant") return;
  if (
    !activeParty(s).some(
      (p) => distance(p, DEPTHS_BOSS_HOME) < BOSS_RULES.leash,
    )
  ) {
    resetDepthsBoss(s);
    say(s, b, "Gorgelimon retourne au sommeil.");
    return;
  }
  if (b.bossPhase === "split") {
    reform(s, b);
    return;
  }
  if (
    (b.vulnerableUntil || 0) <= s.time &&
    ((b.bossStage === 0 && b.hp <= b.maxHp * 0.7) ||
      (b.bossStage === 1 && b.hp <= b.maxHp * 0.35))
  ) {
    split(s, b);
    return;
  }
  if ((b.vulnerableUntil || 0) > s.time) {
    b.moving = false;
    return;
  }
  const a = b.intent;
  if (a?.kind === "boss-quake") {
    if (b.spellState?.root > 0) {
      delete b.intent;
      b.cooldown = 0.8;
      say(s, b, "Éboulement interrompu !");
      return;
    }
    a.age += dt;
    if (a.age < a.windup) return;
    for (const p of activeParty(s))
      if (
        a.zones.some(
          (z) => distance(p, z) <= a.radius && lineClear(z, p, ctx.canStand),
        )
      )
        ctx.damage(p, a.damage, b, "earth", "quake");
    s.monsterImpacts ??= [];
    for (const z of a.zones)
      s.monsterImpacts.push({
        ...z,
        radius: a.radius,
        element: "earth",
        life: 0.5,
      });
    emitSound(s, "magic", b, { element: "earth" });
    delete b.intent;
    b.cooldown = monsterAttack(b).recovery;
    return;
  }
  if (a || monsterAttack(b).kind !== "quake") {
    if (!stepMonsterAbility(s, b, dt, ctx)) pursue(s, b, dt, ctx);
    return;
  }
  if (b.cooldown > 0 || b.spellState?.root > 0) return;
  const targets = activeParty(s).filter((p) => distance(p, b) <= 230);
  if (!targets.length) {
    pursue(s, b, dt, ctx);
    return;
  }
  const spec = monsterAttack(b),
    zones = targets.map((p) => ({ x: p.x, y: p.y }));
  b.intent = {
    kind: "boss-quake",
    phase: "windup",
    age: 0,
    windup: spec.windup,
    radius: spec.radius,
    damage: monsterAttackDamage(b),
    element: "earth",
    from: { x: b.x, y: b.y },
    to: zones[0],
    zones,
  };
  b.attackSerial = (b.attackSerial || 0) + 1;
  s.revision++;
  emitSound(s, "cast", b, { element: "earth", style: "magic" });
}

function pursue(s, b, dt, ctx) {
  if (b.spellState?.root > 0) return;
  const target = activeParty(s).sort(
    (a, c) => distance(a, b) - distance(c, b),
  )[0];
  if (!target || distance(b, target) < 65) {
    b.moving = false;
    return;
  }
  if ((b.bossRouteAt || 0) <= s.time) {
    b.bossRoute = lineClear(b, target, ctx.canStand)
      ? [{ x: target.x, y: target.y }]
      : findPath(b, target, ctx.canStand);
    b.bossRouteAt = s.time + 0.75;
  }
  while (b.bossRoute?.length && distance(b, b.bossRoute[0]) < 4)
    b.bossRoute.shift();
  const p = b.bossRoute?.[0];
  if (!p) return;
  const d = distance(b, p),
    step = Math.min(d, b.speed * dt),
    x = b.x + ((p.x - b.x) / d) * step,
    y = b.y + ((p.y - b.y) / d) * step;
  if (ctx.canStand(x, y)) {
    b.x = x;
    b.y = y;
    b.moving = true;
  }
}
