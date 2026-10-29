import { ELEMENTS } from "../data/equipment.js";
const COLOURS = {
  earth: "#dcac66",
  water: "#76cee8",
  fire: "#ff9660",
  air: "#b3e6c2",
};
function shape(ctx, a) {
  ctx.beginPath();
  if (a.kind === "leap") ctx.arc(a.to.x, a.to.y, a.radius, 0, Math.PI * 2);
  else {
    ctx.moveTo(a.from.x, a.from.y);
    ctx.lineTo(a.to.x, a.to.y);
  }
}
function groundWarning(ctx, a, state) {
  const colour = COLOURS[a.element],
    progress = a.phase === "windup" ? Math.min(1, a.age / a.windup) : 1;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  shape(ctx, a);
  if (a.kind === "leap") {
    ctx.fillStyle = "#182825";
    ctx.globalAlpha = 0.24;
    ctx.fill();
    ctx.strokeStyle = "#1b302e";
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.2 + progress * 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = "#242e27";
    ctx.lineWidth = a.radius * 2 + 3;
    ctx.stroke();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.23 + progress * 0.1;
    ctx.lineWidth = a.radius * 2;
    ctx.stroke();
    const dx = a.to.x - a.from.x,
      dy = a.to.y - a.from.y,
      length = Math.hypot(dx, dy) || 1,
      nx = (-dy / length) * a.radius,
      ny = (dx / length) * a.radius;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(a.from.x + nx * sign, a.from.y + ny * sign);
      ctx.lineTo(a.to.x + nx * sign, a.to.y + ny * sign);
      ctx.strokeStyle = "#1b302e";
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = colour;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.setLineDash([]);
    for (const t of [0.3, 0.55, 0.8]) {
      const x = a.from.x + dx * t,
        y = a.from.y + dy * t,
        ux = dx / length,
        uy = dy / length;
      ctx.beginPath();
      ctx.moveTo(x - ux * 4 - uy * 3, y - uy * 4 + ux * 3);
      ctx.lineTo(x, y);
      ctx.lineTo(x - ux * 4 + uy * 3, y - uy * 4 - ux * 3);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    a.to.x,
    a.to.y,
    a.kind === "leap" ? a.radius + 3 : 9,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progress,
  );
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(a.to.x - 4, a.to.y);
  ctx.lineTo(a.to.x + 4, a.to.y);
  ctx.moveTo(a.to.x, a.to.y - 4);
  ctx.lineTo(a.to.x, a.to.y + 4);
  ctx.stroke();
  if (a.phase === "windup") {
    const name = `${a.kind === "charge" ? "CHARGE" : a.kind === "leap" ? "SAUT" : "TORNADE"} · ${ELEMENTS[a.element].name.toUpperCase()}`;
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    const width = ctx.measureText(name).width + 8;
    ctx.fillStyle = "#182725e8";
    ctx.fillRect(
      Math.round(a.to.x - width / 2),
      Math.round(a.to.y + a.radius + 6),
      width,
      11,
    );
    ctx.fillStyle = colour;
    ctx.fillText(name, Math.round(a.to.x), Math.round(a.to.y + a.radius + 14));
  }
  ctx.restore();
}
export function drawMonsterTelegraphs(ctx, state, land) {
  ctx.save();
  ctx.beginPath();
  land.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  for (const monster of state.monsters)
    if (monster.hp > 0 && monster.intent && !["furnace-cycle","storm-cycle","boss-quake","volcano-eruption","wind-cycle"].includes(monster.intent.kind))
      groundWarning(ctx, monster.intent, state);
  for (const a of state.monsterTornadoes || []) {
    ctx.strokeStyle = COLOURS[a.element];
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const a of state.monsterImpacts || []) {
    ctx.strokeStyle = COLOURS[a.element];
    ctx.fillStyle = COLOURS[a.element];
    ctx.globalAlpha = a.life * 0.4;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius * (1 + (0.5 - a.life) * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a.life * 1.5;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}
export function drawMonsterAttackEffects(ctx, state) {
  for (const monster of state.monsters) {
    const a = monster.intent;
    if (!a || monster.hp <= 0) continue;
    if (a.phase === "windup") {
      ctx.save();
      ctx.strokeStyle = COLOURS[a.element];
      ctx.fillStyle = COLOURS[a.element];
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1;
      const angle = Math.atan2(a.to.y - monster.y, a.to.x - monster.x);
      for (let i = 0; i < 3; i++) {
        const t = state.time * 1.2 + i * 2.1;
        ctx.fillRect(
          Math.round(monster.x + Math.cos(t) * 17),
          Math.round(monster.y - 10 + Math.sin(t) * 6),
          2,
          2,
        );
      }
      if (a.kind === "charge") {
        ctx.beginPath();
        ctx.moveTo(monster.x, monster.y - 9);
        ctx.lineTo(
          monster.x + Math.cos(angle) * 19,
          monster.y - 9 + Math.sin(angle) * 9,
        );
        ctx.stroke();
      }
      ctx.restore();
    } else if (a.phase === "charge") {
      ctx.save();
      ctx.fillStyle = COLOURS.earth;
      const angle = Math.atan2(a.to.y - a.from.y, a.to.x - a.from.x);
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = (6 - i) * 0.1;
        ctx.fillRect(
          Math.round(monster.x - Math.cos(angle) * i * 6 - 2),
          Math.round(monster.y - Math.sin(angle) * i * 6 + Math.sin(i * 2) * 3),
          4,
          3,
        );
      }
      ctx.restore();
    }
  }
  for (const a of state.monsterTornadoes || []) {
    ctx.save();
    const colour = COLOURS[a.element],
      angle = Math.atan2(a.to.y - a.from.y, a.to.x - a.from.x);
    for (let trail = 3; trail >= 0; trail--) {
      const x = a.x - Math.cos(angle) * trail * 5,
        y = a.y - Math.sin(angle) * trail * 5;
      ctx.globalAlpha = trail ? 0.12 : 0.7;
      ctx.strokeStyle = colour;
      ctx.fillStyle = colour;
      for (let ring = 0; ring < 4; ring++) {
        const radius = a.radius * (1 - ring * 0.17),
          yy = y - ring * 6 - 3,
          spin = a.age * 10 + ring * 1.4;
        ctx.lineWidth = ring === 0 ? 3 : 2;
        ctx.beginPath();
        ctx.ellipse(
          Math.round(x),
          Math.round(yy),
          radius,
          3 + ring * 0.2,
          0,
          spin,
          spin + Math.PI * 1.7,
        );
        ctx.strokeStyle = a.element === "fire" ? "#8d4c36" : "#3b7765";
        ctx.stroke();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (!trail) {
          ctx.fillRect(
            Math.round(x + Math.cos(spin) * radius),
            Math.round(yy + Math.sin(spin) * 3),
            2,
            2,
          );
        }
      }
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = a.element === "fire" ? "#ffe2a2" : "#e6ffe6";
    ctx.fillRect(Math.round(a.x - 1), Math.round(a.y - 13), 2, 6);
    ctx.restore();
  }
}
