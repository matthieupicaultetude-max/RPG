import { TUTORIAL_SAWMILL } from '../world/tutorial-map.js';
import { emitSound } from "../audio/events.js";
import { stepHarvestTarget } from './harvest-targets.js';
import {
  WOODS,
  woodById,
  woodItem,
  woodcuttingLevelXp,
  cuttingDuration,
} from "../data/woodcutting.js";
import { PROPS, SAWMILL } from "../world/map.js";
import { findPath } from "../ai/companions.js";
import { distance, lineClear } from "../combat/attacks.js";
import { playerSpeed } from "./config.js";
const tell = (s, message) => {
  s.log.unshift(message);
  s.log.length = Math.min(6, s.log.length);
  s.revision++;
};
export const createTrees = (props=PROPS) =>
  props.filter((prop) => prop.kind === "tree").map((prop) => ({
    id: prop.id,
    x: prop.x,
    y: prop.y,
    wood: prop.wood,
    respawn: 0,
  }));
export const nearSawmill = (s) => !["slime-marsh","slime-depths"].includes(s.zone) && distance(s.player, s.zone === "tutorial" ? TUTORIAL_SAWMILL : SAWMILL) < 48;
export function grantWoodcuttingXp(s, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const job = s.woodcutting;
  job.xp += amount;
  while (job.xp >= woodcuttingLevelXp(job.level)) {
    job.xp -= woodcuttingLevelXp(job.level);
    job.level++;
  }
  s.revision++;
}
export function addWoodItem(s, wood, kind, quantity) {
  const item = woodItem(wood, kind),
    existing = s.bag.find(
      (i) => i.kind === kind && i.wood === wood && !i.chromatic,
    );
  if (existing) existing.quantity += quantity;
  else s.bag.push({ ...item, id: s.nextItem++, quantity });
  s.revision++;
}
export function woodQuantity(s, wood, kind = "wood") {
  return s.bag
    .filter((i) => i.kind === kind && i.wood === wood && !i.chromatic)
    .reduce((sum, i) => sum + i.quantity, 0);
}
export function cancelWoodcutting(s) {
  if (s.woodcutting.action) {
    s.woodcutting.action = null;
    s.player.moving = false;
    s.revision++;
  }
}
export function treeAt(s, point) {
  return s.trees
    .filter((tree) =>
      tree.respawn > 0
        ? Math.hypot((point.x - tree.x) / 14, (point.y - tree.y) / 8) <= 1
        : Math.hypot((point.x - tree.x) / 28, (point.y - tree.y + 43) / 25) <=
            1 ||
          (Math.abs(point.x - tree.x) < 9 &&
            point.y >= tree.y - 40 &&
            point.y <= tree.y + 5),
    )
    .sort((a, b) => b.y - a.y)[0];
}
export function requestCut(s, id, canStand) {
  const tree = s.trees.find((t) => t.id === id),
    job = s.woodcutting,
    member = s.team[s.main];
  if (!tree || member.hp <= 0) return false;
  const wood = woodById(tree.wood);
  if (job.level < wood.level) {
    tell(s, `${wood.name} : bûcheron niveau ${wood.level} requis.`);
    return false;
  }
  if (tree.respawn > 0) {
    tell(s, `${wood.name} : repousse dans ${Math.ceil(tree.respawn)} s.`);
    return false;
  }
  if (job.action?.tree === id) return true;
  const spots = Array.from({ length: 16 }, (_, index) => {
    const a = (index * Math.PI) / 8;
    return { x: tree.x + Math.cos(a) * 25, y: tree.y + Math.sin(a) * 25 };
  })
    .filter(
      (p) =>
        canStand(p.x, p.y) &&
        lineClear(
          p,
          tree,
          (x, y) => Math.hypot(x - tree.x, y - tree.y) < 17 || canStand(x, y),
        ),
    )
    .sort((a, b) => distance(a, s.player) - distance(b, s.player));
  for (const spot of spots) {
    const path = lineClear(s.player, spot, canStand)
      ? [spot]
      : findPath(s.player, spot, canStand);
    if (!path.length) continue;
    job.action = {
      tree: id,
      owner: s.main,
      phase: "walk",
      path,
      progress: 0,
      duration: cuttingDuration(job.level),
      particle: 0,
    };
    s.revision++;
    return true;
  }
  tell(s, "Aucun chemin accessible vers cet arbre.");
  return false;
}
export function stepWoodcutting(s, direction, dt, elapsed, canStand) {
  for (const tree of s.trees) {
    const before = tree.respawn;
    tree.respawn = Math.max(0, tree.respawn - Math.max(0, elapsed));
    if (before > 0 && tree.respawn === 0) s.revision++;
  }
  const action = s.woodcutting.action;
  if (!action) return false;
  const tree = s.trees.find((t) => t.id === action.tree);
  if (
    !tree ||
    tree.respawn > 0 ||
    action.owner !== s.main ||
    s.team[s.main].hp <= 0 ||
    Math.hypot(direction.x, direction.y) > 0
  ) {
    cancelWoodcutting(s);
    return false;
  }
  if (action.phase === "walk") {
    while (action.path.length && distance(s.player, action.path[0]) < 0.25)
      action.path.shift();
    const goal = action.path[0];
    if (goal) {
      const angle = Math.atan2(goal.y - s.player.y, goal.x - s.player.x),
        length = Math.min(playerSpeed(s) * dt, distance(s.player, goal));
      for (let n = 0; n < length; n += 2) {
        const step = Math.min(2, length - n),
          x = s.player.x + Math.cos(angle) * step,
          y = s.player.y + Math.sin(angle) * step;
        if (!canStand(x, y)) {
          cancelWoodcutting(s);
          return false;
        }
        s.player.x = x;
        s.player.y = y;
      }
      s.player.moving = true;
      s.player.facing =
        Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
          ? Math.cos(angle) > 0
            ? "right"
            : "left"
          : Math.sin(angle) > 0
            ? "down"
            : "up";
      return true;
    }
    if (distance(s.player, tree) > 34) {
      cancelWoodcutting(s);
      return false;
    }
    action.phase = "cut";
    action.origin = { x: s.player.x, y: s.player.y };
    s.revision++;
  }
  if (distance(s.player, tree) > 34 || distance(s.player, action.origin) > 3) {
    cancelWoodcutting(s);
    return false;
  }
  s.player.moving = false;
  s.player.facing =
    Math.abs(tree.x - s.player.x) > Math.abs(tree.y - s.player.y)
      ? tree.x < s.player.x
        ? "left"
        : "right"
      : tree.y < s.player.y
        ? "up"
        : "down";
  action.progress += dt;
  stepHarvestTarget(s,action,tree,elapsed,canStand);
  action.particle += dt;
  if (action.particle > 0.35) {
    action.particle = 0;
    emitSound(s,"chop",tree,{owner:s.main});
    for (let i = 0; i < 3; i++)
      s.effects.push({
        x: tree.x,
        y: tree.y - 8,
        vx: (i - 1) * 22,
        vy: -16 - i * 8,
        particle: true,
        color: "#dfbf81",
        life: 0.35,
      });
  }
  if (action.progress >= action.duration) {
    const wood = woodById(tree.wood);
    tree.respawn = wood.respawn;
    emitSound(s,"gather",tree,{owner:s.main});
    s.woodcutting.action = null;
    addWoodItem(s, wood.id, "wood", 1);
    if(s.zone === "tutorial" && s.tutorial?.step === "gather" && tree.id.startsWith("tutorial-ash-"))s.tutorial.harvested=(s.tutorial.harvested||0)+1;
    grantWoodcuttingXp(s, wood.xp);
    tell(s, `${wood.log} récolté · +${wood.xp} XP bûcheron.`);
  }
  return true;
}
export function craftPlanks(s, id, quantity) {
  const wood = woodById(id),
    job = s.woodcutting;
  if (!wood || !Number.isSafeInteger(quantity) || quantity < 1) return false;
  if (!nearSawmill(s)) {
    tell(s, "Rejoignez la scierie pour fabriquer des planches.");
    return false;
  }
  if (job.level < wood.level || woodQuantity(s, id) < quantity * 2)
    return false;
  let cost = quantity * 2;
  for (const item of s.bag.filter(
    (i) => i.kind === "wood" && i.wood === id && !i.chromatic,
  )) {
    const used = Math.min(cost, item.quantity);
    item.quantity -= used;
    cost -= used;
    if (!cost) break;
  }
  s.bag = s.bag.filter((i) => i.quantity > 0);
  addWoodItem(s, id, "plank", quantity);
  if(s.zone === "tutorial" && s.tutorial?.step === "craft" && id === "ash")s.tutorial.crafted=true;
  emitSound(s,"craft",s.player,{owner:s.main});
  grantWoodcuttingXp(s, quantity * 10);
  tell(
    s,
    `${quantity} ${wood.plank} fabriquée(s) · +${quantity * 10} XP bûcheron.`,
  );
  return true;
}
