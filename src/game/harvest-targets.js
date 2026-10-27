import {
  BONUS_TARGET_DURATION,
  BONUS_TARGET_RADIUS,
} from "../combat/bonus-targets.js";
export function harvestTargetAt(s, point) {
  const action = s.woodcutting.action,
    target = action?.target;
  return (
    action?.phase === "cut" &&
    action.owner === s.main &&
    s.team[s.main].hp > 0 &&
    target?.time > 0 &&
    Math.hypot(point.x - target.x, point.y - target.y) <= BONUS_TARGET_RADIUS
  );
}
export function clickHarvestTarget(s, point) {
  if (!harvestTargetAt(s, point)) return false;
  const action = s.woodcutting.action,
    target = action.target;
  delete action.target;
  action.progress = Math.min(
    action.duration,
    action.progress + action.duration * 0.25,
  );
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    s.effects.push({
      x: target.x,
      y: target.y,
      vx: Math.cos(angle) * 30,
      vy: Math.sin(angle) * 30,
      particle: true,
      color: "#a9f5e8",
      life: 0.35,
    });
  }
  s.revision++;
  return true;
}
export function stepHarvestTarget(
  s,
  action,
  tree,
  elapsed,
  canStand,
  random = Math.random,
) {
  if (action.target) {
    action.target.time -= Math.max(0, elapsed);
    if (action.target.time <= 0) delete action.target;
  }
  if (
    action.targetOffered ||
    action.progress < action.duration * 0.25 ||
    action.progress >= action.duration
  )
    return;
  action.targetOffered = true;
  const start = random() * Math.PI * 2;
  for (let i = 0; i < 16; i++) {
    const angle = start + (i * Math.PI) / 8,
      x = Math.round(tree.x + Math.cos(angle) * 20),
      y = Math.round(tree.y - 35 + Math.sin(angle) * 18);
    // The target floats on the crown; validate the associated ground, not the trunk's solid centre.
    if (!canStand(x, tree.y + Math.sin(angle) * 24)) continue;
    action.target = { x, y, time: BONUS_TARGET_DURATION };
    return;
  }
}
