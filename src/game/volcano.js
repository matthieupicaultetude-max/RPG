import { createMonster } from "../data/monsters.js";
import {
  MAGMA_SLIMES,
  VOLCANO_BOSS_HOME,
  canWalkVolcano,
} from "../world/volcano-map.js";
import { lineClear } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
export const MAGMA_RULES = Object.freeze({
  shellReduction: 0.6,
  shellThreshold: 0.25,
  shellWindup: 1.1,
  blastRadius: 33,
  patchRadius: 14,
  patchWindup: 0.9,
  tick: 0.6,
  maxPatches: 100,
  maxSummons: 6,
  eruptionWindup: 1.5,
  flight: 0.8,
});
export const volcanoBoss = (s) =>
  s.zone === "slime-volcano" ? s.monsters.find((m) => m.volcanoBoss) : null;
export function createVolcanoWorld() {
  return {
    monsters: [
      ...MAGMA_SLIMES.map((p) => createMonster("magma-slime", p.x, p.y, 6)),
      createMonster(
        "volcano-slime",
        VOLCANO_BOSS_HOME.x,
        VOLCANO_BOSS_HOME.y,
        9,
      ),
    ],
    bots: [],
    npcs: [],
    trees: [],
  };
}
const party = (s) =>
  s.team.filter((p) => p.hp > 0 && (p.id === s.main || s.deployed));
const source = (m) => ({ x: m.x, y: m.y, name: m.name, element: "fire" });
export function clearMagmaHazards(s) {
  s.magmaPatches = [];
  s.magmaBlasts = [];
  s.volcanoFlights = [];
  s.nextMagmaDamage = {};
}
export function magmaDamage(m, n, bonus = false) {
  return m.magmaSlime && !m.shellBroken && !bonus
    ? Math.max(1, Math.round(n * MAGMA_RULES.shellReduction))
    : n;
}
export function recordMagmaDamage(s, m, n) {
  if (!m.magmaSlime || m.shellBroken || n <= 0) return;
  m.shellDamage = (m.shellDamage || 0) + n;
  if (m.shellDamage < Math.ceil(m.maxHp * MAGMA_RULES.shellThreshold)) return;
  m.shellBroken = true;
  s.magmaBlasts ??= [];
  s.magmaBlasts.push({
    x: m.x,
    y: m.y,
    age: 0,
    radius: MAGMA_RULES.blastRadius,
    damage: Math.round(m.damage * 1.3),
    source: source(m),
  });
  emitSound(s, "rock-break", m, { element: "earth" });
  s.revision++;
}
export function addMagmaPatch(s, p, damage, owner) {
  if (!canWalkVolcano(p.x, p.y)) return false;
  s.magmaPatches ??= [];
  // Merge nearby splashes instead of silently removing older permanent hazards.
  const old = s.magmaPatches.find(
    (h) => Math.hypot(h.x - p.x, h.y - p.y) < MAGMA_RULES.patchRadius,
  );
  if (old) {
    old.damage = Math.max(old.damage, damage);
    return true;
  }
  if (s.magmaPatches.length >= MAGMA_RULES.maxPatches) return false;
  s.magmaPatches.push({
    ...p,
    age: 0,
    radius: MAGMA_RULES.patchRadius,
    damage,
    source: owner,
  });
  return true;
}
export function nearVolcanoBoss(s) {
  const b = volcanoBoss(s);
  return (
    !!b &&
    b.hp > 0 &&
    b.bossPhase === "dormant" &&
    s.team[s.main].hp > 0 &&
    Math.hypot(s.player.x - b.x, s.player.y - b.y) < 70
  );
}
export function awakenVolcanoBoss(s, b = volcanoBoss(s)) {
  if (
    !b ||
    !b.volcanoBoss ||
    b.hp <= 0 ||
    b.bossPhase !== "dormant" ||
    s.zone !== "slime-volcano" ||
    s.team[s.main].hp <= 0 ||
    Math.hypot(s.player.x - b.x, s.player.y - b.y) > 140
  )
    return false;
  b.bossPhase = "combat";
  b.cooldown = 1;
  b.eruptionSerial = 0;
  s.revision++;
  emitSound(s, "magic", b, { element: "fire" });
  return true;
}
function clearSummons(s, deadOnly = false) {
  const old = s.monsters,
    kept = [],
    indices = new Map();
  for (const [i, m] of old.entries()) {
    if (m.volcanoSummon && (!deadOnly || m.hp <= 0)) {
      m.hp = 0;
      delete m.intent;
      delete m.bonusTarget;
      continue;
    }
    indices.set(i, kept.length);
    kept.push(m);
  }
  if (kept.length === old.length) return;
  // Spell hits, ricochets and sharing seals refer to monster indices. Preserve
  // their targets when pruning dead invocations during a long boss encounter.
  for (const p of s.spellMissiles || []) {
    p.hits = (p.hits || [])
      .filter((i) => indices.has(i))
      .map((i) => indices.get(i));
    if (p.bounce !== undefined) {
      if (indices.has(p.bounce)) p.bounce = indices.get(p.bounce);
      else delete p.bounce;
    }
  }
  for (const member of s.team) {
    const share = member.buffs?.share;
    if (share) {
      if (indices.has(share.enemy)) share.enemy = indices.get(share.enemy);
      else delete member.buffs.share;
    }
  }
  s.monsterTornadoes = (s.monsterTornadoes || [])
    .filter((p) => indices.has(p.owner))
    .map((p) => ({ ...p, owner: indices.get(p.owner) }));
  s.monsters = kept;
}
export function resetVolcanoBoss(s) {
  const b = volcanoBoss(s);
  if (!b) return;
  clearSummons(s);
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
    cooldown: 1,
    eruptionSerial: 0,
    moving: false,
    lift: 0,
  });
  for (const key of [
    "intent",
    "spellState",
    "bonusTarget",
    "lastReceivedDamage",
    "vulnerableUntil",
  ])
    delete b[key];
  clearMagmaHazards(s);
  s.revision++;
}
export function finishVolcanoBoss(s, b) {
  b.bossPhase = "dead";
  delete b.intent;
  clearSummons(s);
  s.volcanoFlights = [];
  if (s.dungeonRun?.active && s.dungeonRun.dungeonId === "slime-volcano") {
    s.dungeonRun.completed = true;
    s.dungeonRun.completedAt = s.time;
  }
  emitSound(s, "bonus", b, { element: "fire" });
  s.log.unshift("Pyroclaste vaincu ! Le volcan s’apaise.");
  s.log.length = Math.min(6, s.log.length);
}
function safeTarget(p, offset = 0) {
  for (let r = 0; r <= 48; r += 8)
    for (let i = 0; i < 12; i++) {
      const a = offset + (i * Math.PI) / 6,
        q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
      if (canWalkVolcano(q.x, q.y)) return q;
    }
  return null;
}
export function stepVolcanoBoss(s, b, dt) {
  b.moving = false;
  if (b.hp <= 0 || b.bossPhase === "dormant" || dt <= 0) return;
  if (!party(s).some((p) => Math.hypot(p.x - b.homeX, p.y - b.homeY) < 250)) {
    resetVolcanoBoss(s);
    return;
  }
  if (b.intent) {
    b.intent.age += dt;
    if (b.intent.age < b.intent.windup) return;
    const owner = source(b);
    s.volcanoFlights ??= [];
    for (const to of b.intent.zones)
      s.volcanoFlights.push({
        from: { x: b.x, y: b.y - 62 },
        to,
        age: 0,
        duration: MAGMA_RULES.flight,
        radius: 21,
        damage: Math.round(b.damage * 1.3),
        source: owner,
        summon: true,
        species: b.intent.species,
        element: b.intent.element,
        level: b.level,
      });
    delete b.intent;
    b.eruptionSerial++;
    b.cooldown = b.hp < b.maxHp * 0.4 ? 3.8 : 5.5;
    s.revision++;
    emitSound(s, "magic", b, { element: "fire" });
    return;
  }
  if (b.cooldown > 0 || b.spellState?.root > 0) return;
  const targets = party(s),
    count = b.hp < b.maxHp * 0.4 ? 3 : 2,
    zones = [];
  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    if (!target) break;
    const p = safeTarget({ x: target.x + i * 20, y: target.y + i * 14 }, i);
    if (p && !zones.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 15))
      zones.push(p);
  }
  if (!zones.length) return;
  b.intent = {
    kind: "volcano-eruption",
    phase: "windup",
    age: 0,
    windup: MAGMA_RULES.eruptionWindup,
    element: (b.eruptionSerial || 0) % 2 ? "earth" : "fire",
    species: (b.eruptionSerial || 0) % 2 ? "magma-slime" : "fire-slime",
    zones,
    radius: 21,
    from: { x: b.x, y: b.y },
    to: zones[0],
  };
  s.revision++;
  emitSound(s, "cast", b, { element: "fire" });
}
export function stepMagmaHazards(s, dt, ctx) {
  if (dt <= 0) return;
  const hit = (h, p) =>
    Math.hypot(p.x - h.x, p.y - h.y) <= h.radius &&
    lineClear(h, p, ctx.canStand);
  s.magmaBlasts = (s.magmaBlasts || []).filter((h) => {
    h.age += dt;
    if (h.age < MAGMA_RULES.shellWindup) return true;
    for (const p of party(s))
      if (hit(h, p)) ctx.damage(p, h.damage, h.source, "earth", "explosion");
    s.monsterImpacts ??= [];
    s.monsterImpacts.push({
      x: h.x,
      y: h.y,
      radius: h.radius,
      element: "fire",
      life: 0.5,
    });
    s.volcanoFlights ??= [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        to = safeTarget(
          { x: h.x + Math.cos(a) * 43, y: h.y + Math.sin(a) * 43 },
          a,
        );
      if (to)
        s.volcanoFlights.push({
          from: { x: h.x, y: h.y - 8 },
          to,
          age: 0,
          duration: MAGMA_RULES.patchWindup,
          radius: MAGMA_RULES.patchRadius,
          damage: Math.max(1, Math.round(h.damage * 0.4)),
          source: h.source,
        });
    }
    emitSound(s, "magic", h, { element: "fire" });
    return false;
  });
  s.volcanoFlights = (s.volcanoFlights || []).filter((h) => {
    h.age += dt;
    if (h.age < h.duration) return true;
    if (h.summon) {
      const b = volcanoBoss(s);
      if (!b || b.hp <= 0 || b.bossPhase !== "combat") return false;
      for (const p of party(s))
        if (hit({ ...h.to, radius: h.radius }, p))
          ctx.damage(p, h.damage, h.source, h.element || "fire", "eruption");
      // Prune spent summons and cap the living population; no infinite XP/loot farm.
      clearSummons(s, true);
      if (
        s.monsters.filter((m) => m.volcanoSummon && m.hp > 0).length <
        MAGMA_RULES.maxSummons
      ) {
        const m = createMonster(h.species, h.to.x, h.to.y, h.level);
        m.volcanoSummon = true;
        m.cooldown = 0.8;
        m.maxHp = Math.round(m.maxHp * 0.55);
        m.hp = m.maxHp;
        s.monsters.push(m);
      }
      addMagmaPatch(s, h.to, Math.max(1, Math.round(h.damage * 0.3)), h.source);
    } else addMagmaPatch(s, h.to, h.damage, h.source);
    emitSound(s, "magic", h.to, { element: "fire" });
    return false;
  });
  s.nextMagmaDamage ??= {};
  for (const h of s.magmaPatches || []) h.age += dt;
  for (const p of party(s)) {
    if ((s.nextMagmaDamage[p.id] || 0) > s.time) continue;
    const h = (s.magmaPatches || []).find((h) => hit(h, p));
    if (h) {
      s.nextMagmaDamage[p.id] = s.time + MAGMA_RULES.tick;
      ctx.damage(p, h.damage, h.source, "fire", "burn");
    }
  }
}
