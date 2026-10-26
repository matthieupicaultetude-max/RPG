import {
  bonusTargetPosition,
  BONUS_TARGET_DURATION,
  BONUS_TARGET_RADIUS,
} from "../combat/bonus-targets.js";
export function drawBonusTargets(ctx, state) {
  ctx.save();
  ctx.lineWidth = 1;
  for (const monster of state.monsters) {
    if (
      monster.hp <= 0 ||
      !monster.bonusTarget ||
      monster.bonusTarget.time <= 0
    )
      continue;
    const point = bonusTargetPosition(monster),
      x = Math.round(point.x),
      y = Math.round(point.y),
      hover =
        state.aim.active &&
        Math.hypot(state.aim.x - point.x, state.aim.y - point.y) <=
          BONUS_TARGET_RADIUS;
    ctx.fillStyle = "#17362ee8";
    ctx.strokeStyle = hover ? "#fff6d5" : "#ffda7f";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff0bd";
    ctx.fillRect(x, y, 1, 1);
    ctx.strokeStyle = "#9ee9de";
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      9,
      -Math.PI / 2,
      -Math.PI / 2 +
        (Math.PI * 2 * monster.bonusTarget.time) / BONUS_TARGET_DURATION,
    );
    ctx.stroke();
    ctx.fillStyle = hover ? "#fff6d5" : "#ffda7f";
    ctx.fillRect(x - 9, y, 3, 1);
    ctx.fillRect(x + 7, y, 3, 1);
    ctx.fillRect(x, y - 9, 1, 3);
    ctx.fillRect(x, y + 7, 1, 3);
  }
  ctx.restore();
}
