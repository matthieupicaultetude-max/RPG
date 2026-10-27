import { createMonster } from "../data/monsters.js";
import { DEPTHS_SLIMES, canWalkDepths } from "../world/slime-depths-map.js";
import { lineClear } from "../combat/attacks.js";
import { emitSound } from "../audio/events.js";
export const DEPTHS_RULES = {
  maxSize: 3,
  fusionRadius: 30,
  fusionWindup: 1,
  separationTime: 5,
  vulnerability: 1.5,
};
export const isDepthsSlime = (m) => m.depthsSlime === true;
export function createDepthsWorld(time = 0) {
  return {
    monsters: DEPTHS_SLIMES.map((p) => {
      const m = createMonster(p.species, p.x, p.y, 5);
      m.growth = p.growth;
      resize(m, 1);
      m.fusionReadyAt = time + 3;
      return m;
    }),
    bots: [],
    npcs: [],
    trees: [],
  };
}
function resize(m, ratio) {
  m.maxHp = Math.round(m.baseMaxHp * (1 + 0.3 * (m.growth - 1)));
  m.hp = Math.max(1, Math.round(m.maxHp * ratio));
}
function effect(s, m, text) {
  s.effects.push({ x: m.x, y: m.y - 30, text, color: "#9ee9ed", life: 1.1 });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    s.effects.push({
      x: m.x,
      y: m.y - 8,
      vx: Math.cos(a) * 25,
      vy: Math.sin(a) * 20 - 8,
      particle: true,
      color: m.element === "earth" ? "#c5ac7e" : "#80d9ec",
      life: 0.45,
    });
  }
  s.revision++;
}
export function onDepthsLanding(s, m, point, hits) {
  if (s.zone !== "slime-depths" || !isDepthsSlime(m) || hits || m.growth < 2)
    return;
  const ratio = m.hp / m.maxHp;
  m.growth--;
  resize(m, ratio);
  m.vulnerableUntil = s.time + DEPTHS_RULES.vulnerability;
  m.fusionReadyAt = s.time + DEPTHS_RULES.separationTime;
  let spawn = point;
  search: for (const r of [26, 18, 10])
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        p = { x: point.x + Math.cos(a) * r, y: point.y + Math.sin(a) * r };
      if (canWalkDepths(p.x, p.y) && lineClear(point, p, canWalkDepths)) {
        spawn = p;
        break search;
      }
    }
  const child = createMonster(m.species, spawn.x, spawn.y, m.level);
  child.fusionReadyAt = m.fusionReadyAt;
  child.dualElement = m.dualElement;
  child.cooldown = 0.8;
  s.monsters.push(child);
  effect(s, m, "Scission !");
  emitSound(s, "magic", point, { element: m.element });
}
function available(m, s) {
  return (
    isDepthsSlime(m) &&
    m.hp > 0 &&
    !m.intent &&
    !m.merged &&
    !(m.spellState?.root > 0) &&
    !(m.vulnerableUntil > s.time) &&
    (m.fusionReadyAt || 0) <= s.time
  );
}
function cancelFusion(s, a) {
  const b = s.monsters[a.fusionWith];
  delete a.fusionWith;
  delete a.fusionStartedAt;
  if (b) {
    delete b.fusionWith;
    delete b.fusionStartedAt;
  }
}
export function clearDepthsFusions(s) {
  for (const m of s.monsters) {
    delete m.fusionWith;
    delete m.fusionStartedAt;
  }
}
export function stepDepthsSlimes(s) {
  if (s.zone !== "slime-depths") return;
  for (let i = 0; i < s.monsters.length; i++) {
    const a = s.monsters[i];
    if (a.fusionWith === undefined) continue;
    const j = a.fusionWith,
      b = s.monsters[j];
    if (
      !b ||
      b.fusionWith !== i ||
      !available(a, s) ||
      !available(b, s) ||
      Math.hypot(a.x - b.x, a.y - b.y) > DEPTHS_RULES.fusionRadius ||
      !lineClear(a, b, canWalkDepths)
    ) {
      cancelFusion(s, a);
      continue;
    }
    if (i > j || s.time - a.fusionStartedAt < DEPTHS_RULES.fusionWindup)
      continue;
    const ratio = (a.hp + b.hp) / (a.maxHp + b.maxHp);
    a.growth += b.growth;
    a.dualElement = a.dualElement || b.dualElement || a.element !== b.element;
    resize(a, ratio);
    a.fusionReadyAt = s.time + DEPTHS_RULES.separationTime;
    a.cooldown = 0.55;
    b.hp = 0;
    b.merged = true;
    delete b.bonusTarget;
    cancelFusion(s, a);
    effect(s, a, a.dualElement ? "Fusion Eau / Terre !" : "Fusion !");
    emitSound(s, "magic", a, { element: a.element });
  }
  for (let i = 0; i < s.monsters.length; i++) {
    const a = s.monsters[i];
    if (!available(a, s) || a.fusionWith !== undefined || a.growth >= 3)
      continue;
    const j = s.monsters.findIndex(
      (b, k) =>
        k > i &&
        available(b, s) &&
        b.fusionWith === undefined &&
        a.growth + b.growth <= DEPTHS_RULES.maxSize &&
        Math.hypot(a.x - b.x, a.y - b.y) <= DEPTHS_RULES.fusionRadius &&
        lineClear(a, b, canWalkDepths),
    );
    if (j < 0) continue;
    const b = s.monsters[j];
    a.fusionWith = j;
    b.fusionWith = i;
    a.fusionStartedAt = b.fusionStartedAt = s.time;
    a.moving = b.moving = false;
    effect(s, a, "Fusion imminente…");
  }
}
