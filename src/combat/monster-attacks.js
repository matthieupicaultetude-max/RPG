import {onBossLanding} from '../game/depths-boss.js';
import { onDepthsLanding } from '../game/slime-depths.js';
import {onSlimeLanding,slimeVulnerable} from '../game/slime-marsh.js';
import { monsterAttack, monsterAttackDamage } from "../data/monster-attacks.js";
import { distance, lineClear } from "./attacks.js";
import { segmentDistanceSq } from "../world/map.js";
import { emitSound } from "../audio/events.js";

export const activeParty = (state) =>
  state.team.filter(
    (member) => member.hp > 0 && (member.id === state.main || state.deployed),
  );
export function isolatedPartyMember(members, monster) {
  if (!members.length) return null;
  const centre = {
    x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
    y: members.reduce((sum, p) => sum + p.y, 0) / members.length,
  };
  return [...members].sort(
    (a, b) =>
      distance(b, centre) - distance(a, centre) ||
      distance(b, monster) - distance(a, monster) ||
      a.id - b.id,
  )[0];
}
export function clearMonsterAttacks(state) {
  for (const monster of state.monsters) {
    if(monster.intent?.phase==='flight')Object.assign(monster,monster.intent.from);
    delete monster.intent;
    monster.lift = 0;
    monster.moving = false;
  }
  state.monsterTornadoes = [];
  state.monsterImpacts = [];
}
function face(monster, point) {
  const dx = point.x - monster.x,
    dy = point.y - monster.y;
  monster.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
        ? "down"
        : "up";
}
function clippedEnd(from, to, canStand) {
  const length = distance(from, to);
  let end = { ...from };
  for (let travelled = 2; travelled < length + 2; travelled += 2) {
    const t = Math.min(1, travelled / (length || 1)),
      next = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    if (!canStand(next.x, next.y)) break;
    end = next;
  }
  return end;
}
export function startMonsterAttack(state, monster, ctx) {
  const spec = monsterAttack(monster),
    members = activeParty(state);
  if (
    !spec ||
    monster.hp <= 0 ||
    monster.intent ||
    monster.cooldown > 0 ||
    monster.spellState?.root > 0 ||
    !members.length
  )
    return false;
  const nearest = [...members].sort(
    (a, b) => distance(a, monster) - distance(b, monster),
  )[0];
  if (
    distance(nearest, { x: monster.homeX, y: monster.homeY }) >
    monster.detection
  )
    return false;
  let target =
    spec.kind === "leap" ? isolatedPartyMember(members, monster) : nearest;
  if (spec.kind === "tornado") {
    const candidates = members
      .filter(
        (p) =>
          distance(p, monster) <= spec.range &&
          lineClear(monster, p, ctx.canStand),
      )
      .sort((a, b) => distance(a, monster) - distance(b, monster));
    target = candidates[(monster.attackSerial || 0) % candidates.length];
  }
  if (!target || distance(monster, target) > spec.range) return false;
  const from = { x: monster.x, y: monster.y };
  let to = { x: target.x, y: target.y };
  if (spec.kind === "leap") {
    if (!ctx.canStand(to.x, to.y)) return false;
  } else {
    const angle = Math.atan2(to.y - from.y, to.x - from.x),
      length = Math.min(spec.range, Math.max(55, distance(from, to) + 24));
    to = clippedEnd(
      from,
      {
        x: from.x + Math.cos(angle) * length,
        y: from.y + Math.sin(angle) * length,
      },
      ctx.canStand,
    );
    if (distance(from, to) < 8) return false;
  }
  monster.intent = {
    spec: { ...spec },
    kind: spec.kind,
    element: spec.element,
    phase: "windup",
    age: 0,
    windup: monster.tutorial ? 1.5 : spec.windup,
    from,
    to,
    radius: spec.radius,
    targetId: target.id,
    damage: monsterAttackDamage(monster),
    hitIds: [],
  };
  monster.attackSerial = (monster.attackSerial || 0) + 1;
  monster.moving = false;
  face(monster, to);
  state.revision++;
  emitSound(state, "cast", monster, {
    element: spec.element,
    style: spec.kind === "charge" ? "sword" : "magic",
  });
  return true;
}
function finish(monster, spec) {
  delete monster.intent;
  monster.lift = 0;
  monster.moving = false;
  monster.cooldown = spec.recovery;
}
function sweptHit(member, from, to, radius, canStand) {
  if (
    segmentDistanceSq(member.x, member.y, [from.x, from.y], [to.x, to.y]) >
    radius * radius
  )
    return false;
  const dx = to.x - from.x,
    dy = to.y - from.y,
    t = Math.max(
      0,
      Math.min(
        1,
        ((member.x - from.x) * dx + (member.y - from.y) * dy) /
          (dx * dx + dy * dy || 1),
      ),
    );
  return lineClear(
    { x: from.x + dx * t, y: from.y + dy * t },
    member,
    canStand,
  );
}
function strikePath(state, attack, from, to, monster, ctx) {
  for (const member of activeParty(state))
    if (
      !attack.hitIds.includes(member.id) &&
      sweptHit(member, from, to, attack.radius, ctx.canStand)
    ) {
      attack.hitIds.push(member.id);
      ctx.damage(member, attack.damage, monster, attack.element, attack.kind);
    }
}
export function stepMonsterAbility(state, monster, dt, ctx) {
  const spec = monster.intent?.spec || monsterAttack(monster),
    a = monster.intent;
  if (!spec) return false;
  if (monster.hp <= 0) {
    delete monster.intent;
    monster.lift = 0;
    return false;
  }
  if (!a) {if(slimeVulnerable(state,monster)){monster.moving=false;return true;}return startMonsterAttack(state, monster, ctx);}
  if (dt <= 0) return true;
  if (
    (monster.spellState?.root > 0 && a.phase !== "flight") ||
    (a.phase === "windup" &&
      !activeParty(state).some((p) => p.id === a.targetId))
  ) {
    finish(monster, spec);
    return true;
  }
  a.age += dt;
  monster.moving = false;
  if (a.phase === "windup") {
    // Recoil can move the caster; the destination always stays locked to the announced ground point.
    a.from = { x: monster.x, y: monster.y };
    if (a.kind !== "leap") a.to = clippedEnd(a.from, a.to, ctx.canStand);
    face(monster, a.to);
    if (a.age < a.windup) return true;
    a.age = 0;
    if (a.kind === "tornado") {
      state.monsterTornadoes ??= [];
      state.monsterTornadoes.push({
        ...a,
        phase: "travel",
        owner: state.monsters.indexOf(monster),
        x: a.from.x,
        y: a.from.y,
        travelled: 0,
        hitIds: [],
      });
      emitSound(state, "magic", monster, { element: a.element });
      finish(monster, spec);
    } else {
      a.phase = a.kind === "leap" ? "flight" : "charge";
      emitSound(state, "magic", monster, { element: a.element });
    }
    return true;
  }
  if (a.phase === "flight") {
    const progress = Math.min(1, a.age / spec.flight);
    monster.x = a.from.x + (a.to.x - a.from.x) * progress;
    monster.y = a.from.y + (a.to.y - a.from.y) * progress;
    monster.lift = Math.sin(progress * Math.PI) * 22;
    monster.moving = true;
    if (progress >= 1) {
      if (ctx.canStand(a.to.x, a.to.y)) {
        let hitCount=0;
        for (const member of activeParty(state))
          if (
            distance(member, a.to) <= a.radius &&
            lineClear(a.to, member, ctx.canStand)
          ){ctx.damage(member, a.damage, monster, a.element, a.kind);hitCount++;}
        onSlimeLanding(state,monster,a.to,hitCount);
        onDepthsLanding(state,monster,a.to,hitCount);
        onBossLanding(state,monster,hitCount);
        state.monsterImpacts ??= [];
        state.monsterImpacts.push({
          ...a.to,
          radius: a.radius,
          element: a.element,
          life: 0.5,
        });
        emitSound(state, "magic", a.to, { element: a.element });
      } else Object.assign(monster, a.from);
      finish(monster, spec);
    }
  } else if (a.phase === "charge") {
    const length = distance(a.from, a.to),
      progress = Math.min(1, (a.age * spec.speed) / (length || 1)),
      next = {
        x: a.from.x + (a.to.x - a.from.x) * progress,
        y: a.from.y + (a.to.y - a.from.y) * progress,
      },
      previous = { x: monster.x, y: monster.y };
    if (!lineClear(previous, next, ctx.canStand)) {
      finish(monster, spec);
      return true;
    }
    monster.x = next.x;
    monster.y = next.y;
    monster.moving = true;
    strikePath(state, a, previous, next, monster, ctx);
    if (progress >= 1) finish(monster, spec);
  }
  return true;
}
export function stepMonsterHazards(state, dt, ctx) {
  state.monsterImpacts = (state.monsterImpacts || []).filter((a) => {
    a.life -= dt;
    return a.life > 0;
  });
  state.monsterTornadoes = (state.monsterTornadoes || []).filter((a) => {
    const monster = state.monsters[a.owner];
    if (!monster || monster.hp <= 0) return false;
    if (dt <= 0) return true;
    const spec = monsterAttack(monster);
    if (!spec) return false;
    const length = distance(a.from, a.to),
      previous = { x: a.x, y: a.y };
    a.age += dt;
    a.travelled = Math.min(length, a.travelled + spec.speed * dt);
    const progress = a.travelled / (length || 1),
      next = {
        x: a.from.x + (a.to.x - a.from.x) * progress,
        y: a.from.y + (a.to.y - a.from.y) * progress,
      };
    if (!lineClear(previous, next, ctx.canStand)) return false;
    a.x = next.x;
    a.y = next.y;
    strikePath(state, a, previous, next, monster, ctx);
    return progress < 1;
  });
}
