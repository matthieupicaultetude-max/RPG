import {
  SPONGE_FLOWERS,
  SLIME_SPAWNS,
  canWalkMarsh,
} from "../world/slime-marsh-map.js";
import { createMonster } from "../data/monsters.js";
import { emitSound } from "../audio/events.js";
export const MARSH_RULES = {
  maxGrowth: 3,
  puddleLife: 18,
  bloomDuration: 1,
  flowerCooldown: 10,
  triggerRadius: 20,
  vulnerability: 2.5,
};
export const isMarshSlime = (monster) => monster.marshSlime === true;
export const slimeScale = (monster) =>
  (isMarshSlime(monster)||monster.depthsSlime===true) ? 1 + ((monster.growth || 1) - 1) * 0.22 : 1;
export const slimeVulnerable = (state, monster) =>
  (isMarshSlime(monster)||monster.depthsSlime===true||monster.stormSlime===true||monster.boss===true||monster.mountainSlime===true) && (monster.vulnerableUntil || 0) > state.time;
export function resetMarshSlime(monster) {
  if (!isMarshSlime(monster)) return;
  monster.growth = monster.spawnGrowth || 1;
  monster.maxHp = Math.round(
    monster.baseMaxHp * (1 + 0.3 * (monster.growth - 1)),
  );
  monster.vulnerableUntil = 0;
  monster.hp = monster.maxHp;
}
export function createMarshWorld(state) {
  state.slimeMarsh ??= {
    puddles: [],
    flowers: SPONGE_FLOWERS.map((f) => ({ ...f, readyAt: 0, bloomUntil: 0 })),
    nextPuddle: 1,
    visited: false,
  };
  return {
    monsters: SLIME_SPAWNS.map((p) => {
      const m = createMonster("marsh-slime", p.x, p.y, 3);
      Object.assign(m, {
        marshSlime: true,
        spawnGrowth: p.growth || 1,
        baseMaxHp: m.maxHp,
      });
      resetMarshSlime(m);
      return m;
    }),
    bots: [],
    npcs: [],
    trees: [],
  };
}
export function stepSlimeMarsh(state) {
  if (state.zone !== "slime-marsh" || !state.slimeMarsh) return;
  state.slimeMarsh.puddles = state.slimeMarsh.puddles.filter(
    (p) => p.expiresAt > state.time,
  );
}
export function onSlimeLanding(state, monster, point, hitCount) {
  if (
    state.zone !== "slime-marsh" ||
    !isMarshSlime(monster) ||
    !state.slimeMarsh
  )
    return;
  const marsh = state.slimeMarsh;
  const splits = !hitCount && monster.growth >= 2;
  stepSlimeMarsh(state);
  const flower = marsh.flowers
    .filter(
      (f) =>
        !splits &&
        f.readyAt <= state.time &&
        Math.hypot(f.x - point.x, f.y - point.y) <= MARSH_RULES.triggerRadius,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - point.x, a.y - point.y) -
        Math.hypot(b.x - point.x, b.y - point.y),
    )[0];
  if (flower) {
    flower.bloomUntil = state.time + MARSH_RULES.bloomDuration;
    flower.readyAt = state.time + MARSH_RULES.flowerCooldown;
    growSlime(state, monster);
    state.effects.push({
      x: flower.x,
      y: flower.y - 23,
      text: "Nectar de croissance !",
      color: "#f1c8ff",
      life: 1.2,
    });
    emitSound(state, "heal", flower);
  }
  // A landing consumes at most one growth source: nectar takes priority.
  if (!flower && !splits) {
    const index = marsh.puddles.findIndex(
      (p) => Math.hypot(p.x - point.x, p.y - point.y) <= p.radius,
    );
    if (index >= 0) {
      marsh.puddles.splice(index, 1);
      growSlime(state, monster);
    }
  }
  {
    marsh.puddles.push({
      id: marsh.nextPuddle++,
      x: point.x,
      y: point.y,
      radius: 18 + (monster.growth - 1) * 3,
      expiresAt: state.time + MARSH_RULES.puddleLife,
    });
    if (marsh.puddles.length > 32) marsh.puddles.shift();
  }
  if (splits) {
    splitSlime(state, monster, point);
    monster.vulnerableUntil = state.time + MARSH_RULES.vulnerability;
    state.effects.push({
      x: monster.x,
      y: monster.y - 35,
      text: "Vulnérable !",
      color: "#ffe1a0",
      life: 1.1,
    });
  }
  state.revision++;
}

function growSlime(state, monster) {
  if (monster.growth >= MARSH_RULES.maxGrowth) return;
  const ratio = monster.hp / monster.maxHp;
  monster.growth++;
  monster.maxHp = Math.round(
    monster.baseMaxHp * (1 + 0.3 * (monster.growth - 1)),
  );
  monster.hp = Math.max(1, Math.round(monster.maxHp * ratio));
  state.effects.push({
    x: monster.x,
    y: monster.y - 32,
    text: `Taille ${monster.growth} !`,
    color: "#b9edc8",
    life: 1,
  });
}

function splitSlime(state, monster, point) {
  const ratio = monster.hp / monster.maxHp;
  monster.growth--;
  monster.maxHp = Math.round(
    monster.baseMaxHp * (1 + 0.3 * (monster.growth - 1)),
  );
  monster.hp = Math.max(1, Math.round(monster.maxHp * ratio));
  let spawn = point;
  search: for (const radius of [24, 16, 8]) {
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const p = {
        x: point.x + Math.cos(a) * radius,
        y: point.y + Math.sin(a) * radius,
      };
      if (canWalkMarsh(p.x, p.y)) {
        spawn = p;
        break search;
      }
    }
  }
  const child = createMonster("marsh-slime", spawn.x, spawn.y, monster.level);
  child.splitSpawn = true;
  child.cooldown = 1.2;
  state.monsters.push(child);
  state.effects.push({
    x: point.x,
    y: point.y - 25,
    text: "Scission ! −1 taille",
    color: "#a0dded",
    life: 1.2,
  });
}
