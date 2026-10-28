import { characterStats, ELEMENTS } from "../data/equipment.js";
import { emitSound, impactKind } from "../audio/events.js";
import { isSpellUnlocked } from "../data/progression.js";
import { spellById, spellAmount } from "../data/spells.js";
import { distance, lineClear } from "./attacks.js";
const live = (s) =>
  s.team.filter((m) => m.hp > 0 && (m.id === s.main || s.deployed));
const status = (m) => (m.spellState ??= { fractures: {}, embers: [], root: 0 });
const active = (s, owner) =>
  s.team[owner]?.hp > 0 && (owner === s.main || s.deployed);
const bump = (s) => s.revision++;
export function gainCharge(member, amount) {
  if (!(member.ultimateLock > 0))
    member.ultimateCharge = Math.min(
      100,
      (member.ultimateCharge || 0) + amount,
    );
}
function text(s, p, message, color = "#c4e9cd") {
  s.effects.push({ x: p.x, y: p.y - 25, text: message, color, life: 0.8 });
  bump(s);
}
function shield(member, amount, kind = "normal", time = 5) {
  member.buffs ??= {};
  member.buffs.shield = {
    amount: Math.max(member.buffs.shield?.amount || 0, amount),
    kind,
    time,
  };
}
function heal(s, member, amount, owner, share = true) {
  if (!member || member.hp <= 0) return 0;
  const effective = Math.min(member.maxHp - member.hp, amount);
  member.hp += effective;
  if (effective > 0) {
    text(s, member, `+${effective}`);
    emitSound(s, "heal", member, { owner: owner.id });
    gainCharge(owner, Math.min(6, effective / 4));
  }
  if (share && member.buffs?.link?.time > 0) {
    const other = live(s).find((m) => m.id === member.buffs.link.other);
    if (other) heal(s, other, Math.round(effective * 0.4), owner, false);
  }
  return effective;
}
function hit(s, m, amount, owner, element, ctx, procs = true) {
  if (!m || m.hp <= 0 || amount <= 0) return;
  const before = m.hp,
    resist = Math.max(-50, Math.min(80, m.resistances?.[element] || 0));
  ctx.hitMonster(
    s,
    m,
    Math.max(1, Math.round(amount * (1 - resist / 100))),
    owner,
    { sound: impactKind(owner, ctx.soundSpell), element },
  );
  gainCharge(owner, Math.min(5, Math.max(0, before - m.hp) / 5));
  const seal = status(m).seal;
  if (procs && seal?.time > 0 && seal.charges > 0 && active(s, seal.owner)) {
    seal.charges--;
    const caster = s.team[seal.owner];
    hit(
      s,
      m,
      seal.amount,
      caster,
      "fire",
      { ...ctx, soundSpell: spellById("support-fire-1") },
      false,
    );
    const linked = live(s).find(
      (ally) =>
        ally.buffs?.share?.enemy === s.monsters.indexOf(m) &&
        ally.buffs.share.owner === seal.owner &&
        ally.buffs.share.time > 0,
    );
    if (linked) heal(s, linked, seal.amount, caster);
  }
}
function move(s, entity, point, limit, ctx) {
  const angle = Math.atan2(point.y - entity.y, point.x - entity.x),
    d = Math.min(limit, distance(entity, point));
  for (let travelled = 0; travelled < d; travelled += 3) {
    const step = Math.min(3, d - travelled),
      x = entity.x + Math.cos(angle) * step,
      y = entity.y + Math.sin(angle) * step;
    if (!ctx.canStand(x, y)) break;
    entity.x = x;
    entity.y = y;
  }
  if (entity.id === s.main)
    Object.assign(s.player, {
      x: entity.x,
      y: entity.y,
      facing: entity.facing,
    });
}
function push(s, m, from, amount, ctx) {
  move(
    s,
    m,
    { x: m.x + (m.x - from.x) * 10, y: m.y + (m.y - from.y) * 10 },
    amount,
    ctx,
  );
}
function enemies(s, point, radius, owner, ctx) {
  return s.monsters.filter(
    (m) =>
      m.hp > 0 && !m.emergence &&
      distance(m, point) <= radius &&
      lineClear(owner, m, ctx.canStand),
  );
}
function arc(s, owner, point, range, ctx) {
  const a = Math.atan2(point.y - owner.y, point.x - owner.x);
  return enemies(s, owner, range, owner, ctx).filter(
    (m) =>
      Math.abs(
        Math.atan2(
          Math.sin(Math.atan2(m.y - owner.y, m.x - owner.x) - a),
          Math.cos(Math.atan2(m.y - owner.y, m.x - owner.x) - a),
        ),
      ) < 1.05,
  );
}
function ember(m, owner, amount) {
  const state = status(m);
  if (state.embers.filter((e) => e.owner === owner.id).length < 3)
    state.embers.push({ owner: owner.id, time: 4, tick: 1, amount });
}
function visual(s, owner, spell, point, radius = 20, duration = 0.35) {
  s.spellVisuals.push({
    x: point.x,
    y: point.y,
    radius,
    age: 0,
    duration,
    owner: owner.id,
    spell: spell.id,
    element: spell.element,
    name: spell.name,
  });
}
function area(s, owner, spell, point, extra = {}) {
  const result = {
    id: s.nextSpell++,
    owner: owner.id,
    spell: spell.id,
    x: point.x,
    y: point.y,
    radius: 30,
    time: 6,
    tick: 0,
    amount: spellAmount(owner, spell),
    ...extra,
  };
  s.spellAreas.push(result);
  return result;
}
function event(s, owner, spell, point, extra = {}) {
  s.spellEvents.push({
    owner: owner.id,
    spell: spell.id,
    x: point.x,
    y: point.y,
    delay: 0.12,
    amount: spellAmount(owner, spell),
    ...extra,
  });
}
function missile(s, owner, spell, point, extra = {}) {
  const angle = Math.atan2(point.y - owner.y, point.x - owner.x);
  s.spellMissiles.push({
    owner: owner.id,
    spell: spell.id,
    x: owner.x,
    y: owner.y,
    angle,
    age: 0,
    travel: 0,
    range: spell.range,
    speed: 250,
    amount: spellAmount(owner, spell),
    hits: [],
    returning: false,
    ...extra,
  });
}
const nearLine = (p, a, b, width) => {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) <= width;
};
export function castSpell(s, owner, slot, point, ctx, options = {}) {
  const spell = spellById(owner.loadout?.[slot]);
  if (
    !spell ||
    spell.role !== owner.role ||
    !isSpellUnlocked(owner, spell) ||
    !active(s, owner.id)
  )
    return false;
  owner.buffs ??= {};
  owner.spellCooldowns ??= {};
  if (slot === 3 && owner.buffs.dance?.time > 0) {
    move(s, owner, point || owner, 60, ctx);
    delete owner.buffs.dance;
    s.spellEvents = s.spellEvents.filter(
      (e) => e.owner !== owner.id || e.kind !== "dance",
    );
    visual(s, owner, spell, owner, 25);
    return true;
  }
  if (
    owner.cooldown > 0 ||
    (owner.spellCooldowns[spell.id] || 0) > 0 ||
    (slot === 3 && (owner.ultimateCharge || 0) < 100)
  )
    return false;
  const possible = s.monsters.filter(
    (m) =>
      m.hp > 0 && !m.emergence &&
      distance(owner, m) <= spell.range &&
      lineClear(owner, m, ctx.canStand),
  );
  const target = point
    ? possible
        .slice()
        .sort((a, b) => distance(a, point) - distance(b, point))[0]
    : possible
        .slice()
        .sort((a, b) => distance(a, owner) - distance(b, owner))[0];
  const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
    owner.facing
  ] || [0, 1];
  let aim = point ||
    target || {
      x: owner.x + facing[0] * (spell.range || 1),
      y: owner.y + facing[1] * (spell.range || 1),
    };
  if (
    target &&
    point &&
    distance(target, point) < 28 &&
    [
      "fracture",
      "hammer",
      "ember",
      "crosscut",
      "tideSlash",
      "pierce",
      "firebolt",
      "waterOrb",
      "shatter",
      "trigger",
      "boomerang",
      "backstep",
      "skyHunt",
      "dance",
      "detonate",
    ].includes(spell.effect)
  )
    aim = { x: target.x, y: target.y };
  const length = distance(owner, aim);
  if (length > spell.range && spell.range > 0)
    aim = {
      x: owner.x + ((aim.x - owner.x) * spell.range) / length,
      y: owner.y + ((aim.y - owner.y) * spell.range) / length,
    };
  const candidates = live(s).filter(
    (m) =>
      distance(owner, m) <= Math.max(spell.range, 1) &&
      lineClear(owner, m, ctx.canStand),
  );
  const ally = point
    ? candidates
        .slice()
        .sort((a, b) => distance(a, point) - distance(b, point))[0]
    : candidates.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const ownPools = s.spellAreas.filter(
    (a) => a.owner === owner.id && a.kind === "pool",
  );
  const pool = ownPools
    .slice()
    .sort((a, b) => distance(a, aim) - distance(b, aim))[0];
  if (
    ["freeze", "crossCurrent"].includes(spell.effect) &&
    (!pool ||
      distance(owner, pool) > spell.range ||
      (spell.effect === "crossCurrent" && ownPools.length < 2))
  )
    return false;
  if (["seal", "windMark", "dance"].includes(spell.effect) && !target)
    return false;
  if (spell.effect === "swap" && (!ally || ally === owner)) return false;
  const marked = s.monsters.find(
    (m) =>
      status(m).seal?.owner === owner.id &&
      m.spellState.seal.time > 0 &&
      m.hp > 0 && !m.emergence &&
      distance(owner, m) <= 125,
  );
  if (spell.effect === "share" && !marked) return false;
  const ground = [
    "pillar",
    "roots",
    "spring",
    "updraft",
    "sanctuary",
    "cyclone",
    "bomb",
    "meteors",
  ];
  if (
    ground.includes(spell.effect) &&
    (!ctx.canStand(aim.x, aim.y) || !lineClear(owner, aim, ctx.canStand))
  )
    return false;
  ctx = { ...ctx, soundSpell: spell };
  emitSound(s, slot === 3 ? "ultimate" : "cast", owner, {
    owner: owner.id,
    style: impactKind(owner, spell),
    element: spell.element,
  });
  owner.cooldown = 0.35;
  owner.spellCooldowns[spell.id] = spell.cooldown;
  if (slot === 3) {
    owner.ultimateCharge = 0;
    owner.ultimateLock = 8;
    owner.spellCooldowns[spell.id] = 20;
  }
  const angle = Math.atan2(aim.y - owner.y, aim.x - owner.x);
  owner.facing =
    Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
      ? Math.cos(angle) > 0
        ? "right"
        : "left"
      : Math.sin(angle) > 0
        ? "down"
        : "up";
  const amount = spellAmount(owner, spell);
  visual(
    s,
    owner,
    spell,
    [
      "guard",
      "quake",
      "spin",
      "foamGuard",
      "anchor",
      "furnace",
      "maelstrom",
      "phoenix",
    ].includes(spell.effect)
      ? owner
      : aim,
    spell.ultimate ? 40 : 18,
  );
  const front = () => arc(s, owner, aim, spell.range, ctx);
  switch (spell.effect) {
    case "fracture":
    case "hammer":
    case "ember":
    case "crosscut":
    case "tideSlash":
      event(s, owner, spell, aim);
      break;
    case "guard":
      shield(owner, amount, "rock");
      break;
    case "foamGuard":
      shield(owner, amount, "foam");
      break;
    case "quake":
      for (const m of enemies(s, owner, 75, owner, ctx)) {
        hit(s, m, amount, owner, spell.element, ctx);
        status(m).fractures[owner.id] = 3;
        shield(owner, (owner.buffs.shield?.amount || 0) + 8);
      }
      break;
    case "fireDash": {
      const start = { x: owner.x, y: owner.y };
      move(s, owner, aim, 70, ctx);
      for (const m of s.monsters.filter(
        (m) =>
          m.hp > 0 && !m.emergence &&
          nearLine(m, start, owner, 15) &&
          lineClear(start, m, ctx.canStand),
      )) {
        hit(s, m, amount, owner, "fire", ctx);
        ember(m, owner, spellAmount(owner, spell, 3));
      }
      break;
    }
    case "sidestep": {
      const start = { x: owner.x, y: owner.y };
      move(s, owner, aim, 45, ctx);
      if (
        s.monsters.some(
          (m) =>
            m.hp > 0 && !m.emergence &&
            distance(m, start) < 55 &&
            distance(m, owner) < 55 &&
            Math.abs(
              Math.atan2(
                Math.sin(
                  Math.atan2(start.y - m.y, start.x - m.x) -
                    Math.atan2(owner.y - m.y, owner.x - m.x),
                ),
                Math.cos(
                  Math.atan2(start.y - m.y, start.x - m.x) -
                    Math.atan2(owner.y - m.y, owner.x - m.x),
                ),
              ),
            ) > 0.6,
        )
      )
        owner.buffs.flank = { time: 5 };
      break;
    }
    case "spin":
      for (const m of enemies(s, owner, 48, owner, ctx))
        hit(s, m, amount, owner, "air", ctx);
      break;
    case "detonate":
      for (const m of front()) {
        const embers = status(m).embers.filter((e) => e.owner === owner.id),
          bonus = embers.reduce(
            (sum, e) => sum + e.amount * Math.ceil(e.time),
            0,
          );
        status(m).embers = status(m).embers.filter((e) => e.owner !== owner.id);
        hit(s, m, amount + bonus, owner, "fire", ctx);
        for (const other of enemies(s, m, 28, owner, ctx).filter(
          (other) => other !== m,
        ))
          hit(s, other, Math.round((amount + bonus) * 0.5), owner, "fire", ctx);
      }
      break;
    case "rupture": {
      const foam = owner.buffs.foam || 0;
      owner.buffs.foam = 0;
      for (const m of front()) {
        hit(s, m, amount + foam, owner, "water", ctx);
        push(s, m, owner, 24, ctx);
      }
      for (const a of live(s).filter((a) => distance(a, owner) < 65))
        shield(a, Math.round(foam * 0.6));
      break;
    }
    case "furnace":
    case "maelstrom":
      area(s, owner, spell, owner, {
        kind: spell.effect,
        time: spell.effect === "furnace" ? 7 : 5,
        radius: spell.range,
        follow: true,
      });
      break;
    case "dance":
      owner.buffs.dance = { time: 3 };
      for (let i = 0; i < 4; i++)
        event(s, owner, spell, target, {
          kind: "dance",
          target,
          index: i,
          delay: i * 0.35,
          amount,
        });
      break;
    case "sap": {
      const actual = heal(s, ally, amount, owner);
      if (ally) shield(ally, Math.min(15, amount - actual));
      break;
    }
    case "kindFlame":
      heal(s, ally, amount, owner);
      if (ally)
        ally.buffs.regen = {
          time: 3,
          tick: 1,
          amount: spellAmount(owner, spell, 4),
          owner: owner.id,
        };
      break;
    case "pillar":
      area(s, owner, spell, aim, {
        kind: "pillar",
        time: 8,
        radius: 30,
        hp: 40,
      });
      for (const a of live(s).filter((a) => distance(a, aim) < 35))
        shield(a, amount);
      break;
    case "roots":
      event(s, owner, spell, aim, { kind: "roots", delay: 0.6, radius: 32 });
      break;
    case "sanctuary":
      area(s, owner, spell, aim, { kind: "sanctuary", time: 7, radius: 65 });
      for (const a of live(s).filter((a) => distance(a, aim) < 65))
        heal(s, a, amount, owner);
      for (const p of s.spellAreas.filter(
        (a) => a.kind === "pillar" && distance(a, aim) < 65,
      )) {
        p.hp += 60;
        p.time = Math.max(p.time, 7);
      }
      break;
    case "seal":
      status(target).seal = { time: 6, charges: 5, amount, owner: owner.id };
      break;
    case "share":
      if (ally)
        ally.buffs.share = {
          time: 6,
          owner: owner.id,
          enemy: s.monsters.indexOf(marked),
        };
      break;
    case "phoenix":
      for (const a of candidates)
        a.buffs.phoenix = { time: 8, amount, owner: owner.id };
      break;
    case "healingWind":
      for (const a of candidates.filter((a) => nearLine(a, owner, aim, 20)))
        heal(s, a, amount, owner);
      break;
    case "swap":
      if (
        lineClear(owner, ally, ctx.canStand) &&
        ctx.canStand(owner.x, owner.y) &&
        ctx.canStand(ally.x, ally.y)
      ) {
        const start = { x: owner.x, y: owner.y };
        Object.assign(owner, { x: ally.x, y: ally.y });
        Object.assign(ally, start);
        shield(owner, amount);
        shield(ally, amount);
        if (owner.id === s.main)
          Object.assign(s.player, { x: owner.x, y: owner.y });
        if (ally.id === s.main)
          Object.assign(s.player, { x: ally.x, y: ally.y });
      }
      break;
    case "updraft":
    case "cyclone":
      area(s, owner, spell, aim, {
        kind: spell.effect,
        time: spell.effect === "cyclone" ? 7 : 3,
        radius: spell.effect === "cyclone" ? 65 : 35,
      });
      for (const m of enemies(
        s,
        aim,
        spell.effect === "cyclone" ? 65 : 35,
        owner,
        ctx,
      ))
        push(s, m, aim, 24, ctx);
      break;
    case "spring":
      area(s, owner, spell, aim, { kind: "spring", radius: 32, time: 6 });
      break;
    case "riverLink":
      if (ally && ally !== owner) {
        ally.buffs.link = { time: 8, other: owner.id };
        owner.buffs.link = { time: 8, other: ally.id };
      }
      break;
    case "cleanse": {
      if (ally) {
        const dirty = (ally.root || 0) > 0 || (ally.buffs.snare?.time || 0) > 0;
        ally.root = 0;
        delete ally.buffs.snare;
        heal(
          s,
          ally,
          amount + (dirty ? 0 : spellAmount(owner, spell, 8)),
          owner,
        );
      }
      break;
    }
    case "greatTide":
      for (const a of candidates.filter((a) => nearLine(a, owner, aim, 48)))
        heal(s, a, amount, owner);
      for (const m of s.monsters.filter(
        (m) =>
          m.hp > 0 && !m.emergence &&
          nearLine(m, owner, aim, 48) &&
          lineClear(owner, m, ctx.canStand),
      ))
        push(s, m, owner, 35, ctx);
      for (const a of s.spellAreas.filter(
        (a) => a.kind === "spring" && nearLine(a, owner, aim, 48),
      ))
        a.time += 5;
      break;
    case "pierce": {
      const anchored =
        owner.buffs.anchor && distance(owner, owner.buffs.anchor) < 18;
      const extra =
        (anchored ? 18 : 0) + Math.round(Math.min(1, options.charge || 0) * 14);
      delete owner.buffs.anchor;
      event(s, owner, spell, aim, {
        kind: "launch",
        delay: 0.2,
        amount: spellAmount(owner, spell, spell.base + extra),
      });
      break;
    }
    case "shatter":
    case "firebolt":
    case "waterOrb":
    case "trigger":
      missile(s, owner, spell, aim);
      break;
    case "anchor":
      owner.buffs.anchor = { time: 8, x: owner.x, y: owner.y };
      break;
    case "mountain":
      event(s, owner, spell, aim, {
        kind: "mountain",
        delay: 0.8,
        startX: owner.x,
        startY: owner.y,
        radius: 16,
      });
      break;
    case "bomb": {
      const bombs = s.spellAreas.filter(
        (a) => a.kind === "bomb" && a.owner === owner.id,
      );
      if (bombs.length >= 3) bombs[0].time = 0;
      area(s, owner, spell, aim, { kind: "bomb", time: 3, radius: 32 });
      break;
    }
    case "meteors":
      for (let i = 0; i < 5; i++) {
        const a = i * 2.4,
          r = i === 0 ? 0 : 22;
        event(
          s,
          owner,
          spell,
          { x: aim.x + Math.cos(a) * r, y: aim.y + Math.sin(a) * r },
          { kind: "meteor", delay: 0.65 + i * 0.45, radius: 28 },
        );
      }
      break;
    case "boomerang":
      missile(s, owner, spell, aim, { boomerang: true });
      break;
    case "backstep":
      move(
        s,
        owner,
        { x: owner.x - (aim.x - owner.x), y: owner.y - (aim.y - owner.y) },
        40,
        ctx,
      );
      missile(s, owner, spell, aim);
      break;
    case "windMark":
      status(target).windMark = { time: 6, owner: owner.id };
      break;
    case "skyHunt":
      for (let i = -1; i <= 1; i++)
        missile(s, owner, spell, aim, {
          boomerang: true,
          angle: angle + i * 0.35,
        });
      break;
    case "crossCurrent": {
      const second = ownPools
        .filter((a) => a !== pool)
        .sort((a, b) => distance(a, pool) - distance(b, pool))[0];
      area(s, owner, spell, pool, {
        kind: "current",
        time: 4,
        toX: second.x,
        toY: second.y,
        radius: 12,
      });
      break;
    }
    case "freeze":
      s.spellAreas = s.spellAreas.filter((a) => a !== pool);
      event(s, owner, spell, pool, {
        kind: "freeze",
        delay: 0.6,
        radius: pool.radius,
      });
      break;
    case "deluge":
      owner.buffs.deluge = { time: 7 };
      for (const a of ownPools) {
        a.radius = 44;
        a.time = Math.max(a.time, 7);
      }
      break;
  }
  if (owner.id === s.main) s.player.facing = owner.facing;
  if (owner.id === s.main) {
    s.log.unshift(`${owner.name} · ${spell.name}`);
    s.log.length = Math.min(6, s.log.length);
  }
  bump(s);
  return true;
}
function impact(s, spell, m, projectile, owner, ctx) {
  ctx = { ...ctx, soundSpell: spell };
  hit(s, m, projectile.amount, owner, spell.element, ctx);
  if (spell.effect === "firebolt")
    ember(m, owner, spellAmount(owner, spell, 3));
  if (spell.effect === "waterOrb")
    area(s, owner, spell, m, {
      kind: "pool",
      time: 7,
      radius: owner.buffs.deluge?.time > 0 ? 44 : 26,
      amount: spellAmount(owner, spell, 8),
    });
  if (spell.effect === "shatter")
    for (const other of s.monsters.filter(
      (other) =>
        other !== m &&
        other.hp > 0 &&
        distance(m, other) < 50 &&
        Math.abs(
          Math.atan2(
            Math.sin(
              Math.atan2(other.y - m.y, other.x - m.x) - projectile.angle,
            ),
            Math.cos(
              Math.atan2(other.y - m.y, other.x - m.x) - projectile.angle,
            ),
          ),
        ) <
          Math.PI / 5 &&
        lineClear(m, other, ctx.canStand),
    ))
      hit(s, other, Math.round(projectile.amount * 0.6), owner, "earth", ctx);
  const mark = status(m).windMark;
  if (projectile.boomerang && mark?.time > 0 && mark.owner === owner.id) {
    delete m.spellState.windMark;
    const next = s.monsters.find(
      (other) =>
        other !== m &&
        other.hp > 0 &&
        distance(m, other) < 65 &&
        lineClear(m, other, ctx.canStand),
    );
    if (next) {
      projectile.bounce = s.monsters.indexOf(next);
      projectile.returning = false;
    }
  }
}
function explodeBomb(s, a, ctx) {
  if (a.exploded) return;
  a.exploded = true;
  a.time = 0;
  const owner = s.team[a.owner],
    spell = spellById(a.spell);
  if (!active(s, a.owner)) return;
  ctx = { ...ctx, soundSpell: spell };
  visual(s, owner, spell, a, a.radius, 0.5);
  for (const m of enemies(s, a, a.radius, owner, ctx))
    hit(s, m, a.amount, owner, "fire", ctx);
  for (const other of s.spellAreas.filter(
    (b) => b.kind === "bomb" && !b.exploded && distance(b, a) < a.radius + 8,
  ))
    explodeBomb(s, other, ctx);
}
export function receiveSpellDamage(s, target, amount, attacker, element=attacker?.element) {
  const resistance=ELEMENTS[element] ? (characterStats(target)[`Résistance ${ELEMENTS[element].name}`]||0)+(target.resistances?.[element]||0) : 0;
  let damage = Math.max(0,Math.round(amount*(1-Math.max(-50,Math.min(80,resistance))/100)));
  for (const area of s.spellAreas.filter(
    (a) =>
      ["pillar", "updraft"].includes(a.kind) &&
      a.time > 0 &&
      active(s, a.owner) &&
      distance(target, a) < a.radius,
  )) {
    if (area.kind === "pillar") {
      const absorbed = Math.min(damage, area.hp);
      area.hp -= absorbed;
      damage -= absorbed;
      gainCharge(s.team[area.owner], absorbed / 5);
      if (area.hp <= 0) area.time = 0;
    } else damage = 0;
    if (damage === 0) break;
  }
  const protection = target.buffs?.shield;
  if (protection?.time > 0) {
    const absorbed = Math.min(damage, protection.amount);
    protection.amount -= absorbed;
    damage -= absorbed;
    if (protection.kind === "foam")
      target.buffs.foam = Math.min(30, (target.buffs.foam || 0) + absorbed);
    if (protection.kind === "rock")
      target.buffs.rock = Math.min(20, (target.buffs.rock || 0) + absorbed);
    gainCharge(target, absorbed / 5);
  }
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp === 0 && target.buffs?.phoenix?.time > 0) {
    const blessing = target.buffs.phoenix;
    delete target.buffs.phoenix;
    target.hp = Math.min(target.maxHp, blessing.amount);
    text(s, target, "Phénix !");
  }
  return damage;
}
export function stepSpells(s, dt, context) {
  const ctx = context;
  for (const owner of s.team) {
    owner.buffs ??= {};
    owner.spellCooldowns ??= {};
    owner.ultimateLock = Math.max(0, (owner.ultimateLock || 0) - dt);
    for (const id of Object.keys(owner.spellCooldowns))
      owner.spellCooldowns[id] = Math.max(0, owner.spellCooldowns[id] - dt);
    for (const [key, buff] of Object.entries(owner.buffs)) {
      if (!buff || typeof buff !== "object" || buff.time === undefined)
        continue;
      buff.time -= dt;
      if (buff.time <= 0) {
        delete owner.buffs[key];
        continue;
      }
      if (key === "regen" && active(s, owner.id)) {
        buff.tick -= dt;
        if (buff.tick <= 0) {
          buff.tick += 1;
          heal(s, owner, buff.amount, s.team[buff.owner]);
        }
      }
    }
    if (owner.buffs.anchor && distance(owner, owner.buffs.anchor) > 18)
      delete owner.buffs.anchor;
  }
  for (const m of s.monsters) {
    const state = status(m);
    state.root = Math.max(0, (state.root || 0) - dt);
    if (m.hp <= 0) {
      m.spellState = { fractures: {}, embers: [], root: 0 };
      continue;
    }
    for (const key of ["seal", "windMark"])
      if (state[key]) {
        state[key].time -= dt;
        if (state[key].time <= 0) delete state[key];
      }
    for (const ember of state.embers) {
      ember.time -= dt;
      ember.tick -= dt;
      if (ember.tick <= 0 && active(s, ember.owner)) {
        ember.tick += 1;
        hit(s, m, ember.amount, s.team[ember.owner], "fire", {
          ...ctx,
          soundSpell: spellById("ranged-fire-0"),
        });
      }
    }
    state.embers = state.embers.filter((e) => e.time > 0);
  }
  s.spellVisuals = s.spellVisuals.filter((v) => {
    v.age += dt;
    return v.age < v.duration && active(s, v.owner);
  });
  const events = s.spellEvents;
  s.spellEvents = [];
  for (const e of events) {
    if (!active(s, e.owner)) continue;
    e.delay -= dt;
    if (e.delay > 0) {
      s.spellEvents.push(e);
      continue;
    }
    const owner = s.team[e.owner],
      spell = spellById(e.spell);
    const ctx = { ...context, soundSpell: spell };
    visual(s, owner, spell, e, e.radius || 22);
    if (e.kind === "launch") {
      missile(s, owner, spell, e, { amount: e.amount, piercing: true });
      continue;
    }
    if (e.kind === "dance") {
      if (
        owner.buffs.dance &&
        e.target.hp > 0 &&
        distance(owner, e.target) < 100
      ) {
        const a = (e.index * Math.PI) / 2;
        move(
          s,
          owner,
          {
            x: e.target.x + Math.cos(a) * 22,
            y: e.target.y + Math.sin(a) * 22,
          },
          35,
          ctx,
        );
        hit(s, e.target, e.amount, owner, "air", ctx);
      }
      continue;
    }
    if (e.kind === "mountain") {
      const start = { x: e.startX, y: e.startY };
      for (const m of s.monsters.filter(
        (m) =>
          m.hp > 0 && !m.emergence &&
          (nearLine(m, start, e, 15) || distance(m, e) < 30) &&
          lineClear(start, m, ctx.canStand),
      ))
        hit(s, m, e.amount, owner, "earth", ctx);
      continue;
    }
    if (["roots", "freeze", "meteor"].includes(e.kind)) {
      for (const m of enemies(s, e, e.radius, owner, ctx)) {
        hit(s, m, e.amount, owner, spell.element, ctx);
        if (e.kind !== "meteor") status(m).root = 2;
      }
      if (e.kind === "meteor")
        for (const a of s.spellAreas.filter(
          (a) => a.kind === "bomb" && distance(a, e) < e.radius + a.radius,
        ))
          explodeBomb(s, a, ctx);
      continue;
    }
    for (const m of arc(s, owner, e, spell.range, ctx)) {
      let amount = e.amount;
      if (spell.effect === "hammer") {
        const n = status(m).fractures[owner.id] || 0;
        amount += spellAmount(owner, spell, n * 8 + (owner.buffs.rock || 0));
        status(m).fractures[owner.id] = 0;
        if (n >= 3) m.cooldown = Math.max(m.cooldown || 0, 0.8);
      }
      hit(s, m, amount, owner, spell.element, ctx);
      if (spell.effect === "fracture")
        status(m).fractures[owner.id] = Math.min(
          3,
          (status(m).fractures[owner.id] || 0) + 1,
        );
      if (spell.effect === "ember")
        ember(m, owner, spellAmount(owner, spell, 3));
      if (spell.effect === "tideSlash") move(s, m, owner, 12, ctx);
      if (spell.effect === "crosscut" && e.kind !== "second")
        event(s, owner, spell, e, {
          kind: "second",
          delay: 0.12,
          amount: spellAmount(
            owner,
            spell,
            spell.base + (owner.buffs.flank ? 10 : 0),
          ),
        });
    }
    if (spell.effect === "hammer") owner.buffs.rock = 0;
    if (spell.effect === "crosscut" && e.kind !== "second")
      delete owner.buffs.flank;
  }
  // Missiles use swept collisions so small targets cannot be skipped between frames.
  s.spellMissiles = s.spellMissiles.filter((p) => {
    if (!active(s, p.owner)) return false;
    const owner = s.team[p.owner],
      spell = spellById(p.spell);
    const ctx = { ...context, soundSpell: spell };
    p.age += dt;
    if (p.bounce !== undefined) {
      const destination = s.monsters[p.bounce];
      if (destination?.hp > 0)
        p.angle = Math.atan2(destination.y - p.y, destination.x - p.x);
      else {
        delete p.bounce;
        p.returning = true;
        p.hits = [];
      }
    }
    if (
      p.bounce === undefined &&
      p.boomerang &&
      (p.travel >= p.range || p.returning)
    ) {
      if (!p.returning) {
        p.returning = true;
        p.hits = [];
      }
      p.angle = Math.atan2(owner.y - p.y, owner.x - p.x);
      if (distance(p, owner) < 8) return false;
    }
    const next = {
      x: p.x + Math.cos(p.angle) * p.speed * dt,
      y: p.y + Math.sin(p.angle) * p.speed * dt,
    };
    if (!lineClear(p, next, ctx.canStand)) return false;
    if (spell.effect === "trigger")
      for (const a of s.spellAreas.filter(
        (a) => a.kind === "bomb" && nearLine(a, p, next, 12),
      ))
        explodeBomb(s, a, ctx);
    for (const m of s.monsters.filter(
      (m) =>
        m.hp > 0 && !m.emergence &&
        !p.hits.includes(s.monsters.indexOf(m)) &&
        nearLine(m, p, next, 10),
    )) {
      p.hits.push(s.monsters.indexOf(m));
      impact(s, spell, m, p, owner, ctx);
      if (p.bounce === s.monsters.indexOf(m)) {
        delete p.bounce;
        p.returning = true;
        p.hits = [];
      }
      if (!p.boomerang && !p.piercing) return false;
    }
    p.x = next.x;
    p.y = next.y;
    p.travel += p.speed * dt;
    return p.age < 3 && (p.boomerang || p.travel < p.range);
  });
  for (const a of [...s.spellAreas]) {
    if (!active(s, a.owner)) {
      a.time = 0;
      a.exploded = true;
      continue;
    }
    const owner = s.team[a.owner],
      spell = spellById(a.spell);
    const ctx = { ...context, soundSpell: spell };
    a.time -= dt;
    a.tick -= dt;
    if (a.follow) {
      a.x = owner.x;
      a.y = owner.y;
    }
    if (a.kind === "pool") a.radius = owner.buffs.deluge?.time > 0 ? 44 : 26;
    if (a.kind === "bomb" && a.time <= 0) {
      explodeBomb(s, a, ctx);
      continue;
    }
    if (a.kind === "maelstrom" && a.time <= 0) {
      const foam = owner.buffs.foam || 0;
      owner.buffs.foam = 0;
      for (const m of enemies(s, a, a.radius, owner, ctx)) {
        hit(s, m, spellAmount(owner, spell, 16) + foam, owner, "water", ctx);
        push(s, m, a, 24, ctx);
      }
      for (const ally of live(s).filter((m) => distance(m, a) < 65))
        shield(ally, Math.round(foam * 0.6));
      continue;
    }
    if (a.tick > 0 || a.time <= 0) continue;
    a.tick += 1;
    if (a.kind === "spring")
      for (const ally of live(s).filter((m) => distance(m, a) < a.radius))
        heal(s, ally, a.amount, owner);
    if (a.kind === "sanctuary")
      for (const ally of live(s).filter((m) => distance(m, a) < a.radius))
        shield(ally, 10);
    if (a.kind === "cyclone") {
      for (const ally of live(s).filter((m) => distance(m, a) < a.radius * 0.6))
        heal(s, ally, a.amount, owner);
      for (const m of enemies(s, a, a.radius, owner, ctx).filter(
        (m) => distance(m, a) > a.radius * 0.6,
      ))
        push(s, m, a, 15, ctx);
    }
    if (a.kind === "current")
      for (const m of s.monsters.filter(
        (m) =>
          m.hp > 0 && !m.emergence &&
          nearLine(m, a, { x: a.toX, y: a.toY }, 12) &&
          lineClear(owner, m, ctx.canStand),
      )) {
        hit(s, m, a.amount, owner, "water", ctx);
        move(s, m, { x: a.toX, y: a.toY }, 10, ctx);
      }
    if (a.kind === "pool" && owner.buffs.deluge?.time > 0)
      for (const m of enemies(s, a, a.radius, owner, ctx))
        hit(s, m, a.amount, owner, "water", ctx);
    if (a.kind === "furnace")
      for (const m of enemies(s, a, a.radius, owner, ctx)) {
        hit(s, m, a.amount, owner, "fire", ctx);
        ember(m, owner, spellAmount(owner, spell, 3));
      }
    if (a.kind === "maelstrom")
      for (const m of enemies(s, a, a.radius, owner, ctx)) {
        hit(s, m, a.amount, owner, "water", ctx);
        move(s, m, a, 12, ctx);
      }
  }
  s.spellAreas = s.spellAreas.filter((a) => a.time > 0 && !a.exploded);
}
