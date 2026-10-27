import { BONUS_TARGET_DURATION } from "../combat/bonus-targets.js";
import { treeAt } from "../game/woodcutting.js";
import { woodById } from "../data/woodcutting.js";
export function drawWoodcutting(ctx, s) {
  const action = s.woodcutting.action,
    tree = action
      ? s.trees.find((t) => t.id === action.tree)
      : s.aim.active
        ? treeAt(s, s.aim)
        : null;
  if (tree) {
    const wood = woodById(tree.wood);
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#193126e8";
    const label =
      tree.respawn > 0
        ? `${wood.name} · Repousse ${Math.ceil(tree.respawn)} s`
        : `${wood.name} · Niv. ${wood.level}${s.woodcutting.level < wood.level ? " · Verrouillé" : ""}`;
    const width = ctx.measureText(label).width + 8;
    const labelY = Math.max(12, tree.y - (tree.respawn > 0 ? 18 : 78));
    ctx.fillRect(tree.x - width / 2, labelY - 10, width, 13);
    ctx.fillStyle = "#f2dbab";
    ctx.fillText(label, tree.x, labelY);
  }
  if (action?.phase !== "cut") return;
  const target = action.target;
  if (target?.time > 0) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.fillStyle = "#17362ee8";
    ctx.strokeStyle = "#ffda7f";
    ctx.beginPath();
    ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff0bd";
    ctx.fillRect(target.x, target.y, 1, 1);
    ctx.strokeStyle = "#9ee9de";
    ctx.beginPath();
    ctx.arc(
      target.x,
      target.y,
      9,
      -Math.PI / 2,
      -Math.PI / 2 + (Math.PI * 2 * target.time) / BONUS_TARGET_DURATION,
    );
    ctx.stroke();
    ctx.restore();
  }
  const p = s.player,
    phase = Math.sin(action.progress * 11),
    angle = Math.atan2(tree.y - 8 - (p.y - 12), tree.x - p.x);
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y - 12));
  ctx.rotate(angle + phase * 0.55);
  ctx.fillStyle = "#845d37";
  ctx.fillRect(5, -2, 21, 3);
  ctx.fillStyle = "#bfc9b8";
  ctx.fillRect(22, -9, 7, 9);
  ctx.fillStyle = "#ecdfaf";
  ctx.fillRect(27, -9, 2, 9);
  ctx.restore();
  ctx.fillStyle = "#142b22";
  ctx.fillRect(p.x - 18, p.y - 44, 36, 4);
  ctx.fillStyle = "#dbb977";
  ctx.fillRect(
    p.x - 18,
    p.y - 44,
    36 * Math.min(1, action.progress / action.duration),
    4,
  );
}
