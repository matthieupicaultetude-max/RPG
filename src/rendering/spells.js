import { ELEMENTS } from "../data/equipment.js";
import { spellById } from "../data/spells.js";
function ring(ctx, x, y, r, color, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.25;
  ctx.fill();
  ctx.restore();
}
export function drawSpellGround(ctx, s) {
  for (const a of s.spellAreas) {
    const color = ELEMENTS[spellById(a.spell).element].color;
    ring(ctx, a.x, a.y, a.radius, color, 0.65);
    if (a.kind === "current") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.toX, a.toY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (a.kind === "pillar") {
      ctx.fillStyle = "#7b8070";
      ctx.fillRect(Math.round(a.x) - 6, Math.round(a.y) - 22, 12, 22);
      ctx.fillStyle = "#c3c79d";
      ctx.fillRect(Math.round(a.x) - 7, Math.round(a.y) - 24, 14, 4);
    }
    if (a.kind === "bomb") {
      ctx.fillStyle = "#694d44";
      ctx.fillRect(Math.round(a.x) - 5, Math.round(a.y) - 7, 10, 9);
      ctx.fillStyle = "#efbc76";
      ctx.fillRect(Math.round(a.x), Math.round(a.y) - 10, 2, 4);
    }
    if (a.kind === "pool" || a.kind === "spring") {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 5; i++) {
        const angle = s.time * 2 + i * 1.25;
        ctx.fillRect(
          Math.round(a.x + Math.cos(angle) * a.radius * 0.5),
          Math.round(a.y + Math.sin(angle) * a.radius * 0.3),
          4,
          1,
        );
      }
      ctx.globalAlpha = 1;
    }
  }
  for (const e of s.spellEvents) {
    if (!["roots", "freeze", "meteor", "mountain"].includes(e.kind)) continue;
    const color = ELEMENTS[spellById(e.spell).element].color;
    ring(ctx, e.x, e.y, e.radius || 25, color, 0.75);
    if (e.kind === "mountain") {
      ctx.strokeStyle = color;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(e.startX, e.startY);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
export function drawSpellOverlays(ctx, s) {
  for (const p of s.spellMissiles) {
    const spell = spellById(p.spell);
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y - 8));
    ctx.rotate(p.boomerang ? s.time * 14 : p.angle);
    ctx.fillStyle = ELEMENTS[spell.element].color;
    ctx.fillRect(-8, -2, 13, 4);
    ctx.fillStyle = "#f5e4be";
    ctx.fillRect(-2, -1, 8, 2);
    if (p.boomerang) ctx.fillRect(-2, -6, 3, 12);
    ctx.restore();
  }
  for (const v of s.spellVisuals) {
    const progress = v.age / v.duration;
    const caster = s.team[v.owner];
    if (spellById(v.spell)?.role === "melee" && progress < 0.9) {
      ctx.save();
      ctx.translate(caster.x, caster.y - 10);
      ctx.rotate(Math.atan2(v.y - caster.y, v.x - caster.x));
      ctx.strokeStyle = ELEMENTS[v.element].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -1 + progress * 2, -0.3 + progress * 2);
      ctx.stroke();
      ctx.restore();
    }
    ring(
      ctx,
      v.x,
      v.y,
      v.radius * (0.5 + progress),
      ELEMENTS[v.element].color,
      1 - progress,
    );
  }
  for (const m of s.team.filter(
    (m) => m.hp > 0 && (m.id === s.main || s.deployed),
  )) {
    if (m.buffs?.anchor)
      ring(ctx, m.buffs.anchor.x, m.buffs.anchor.y, 18, "#c3b47d", 0.65);
    if (m.buffs?.shield?.amount > 0)
      ring(ctx, m.x, m.y - 12, 14, "#bad6e7", 0.7);
    if (m.buffs?.phoenix) ring(ctx, m.x, m.y, 18, "#ffc786", 0.7);
    if (m.buffs?.link) {
      const other = s.team[m.buffs.link.other];
      if (!other || other.hp <= 0 || (!s.deployed && other.id !== s.main))
        continue;
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#8ec8d3";
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - 10);
      ctx.lineTo(other.x, other.y - 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.font = "7px monospace";
  ctx.textAlign = "center";
  for (const m of s.monsters.filter((m) => m.hp > 0)) {
    const status = m.spellState;
    if (!status) continue;
    const marks = [
      Object.values(status.fractures).reduce((a, b) => a + b, 0) > 0
        ? `◆${Object.values(status.fractures).reduce((a, b) => a + b, 0)}`
        : "",
      status.embers.length ? `♨${status.embers.length}` : "",
      status.root > 0 ? "❄" : "",
      status.seal ? "✦" : "",
      status.windMark ? "≋" : "",
    ]
      .filter(Boolean)
      .join(" ");
    ctx.fillStyle = "#fff0bd";
    ctx.fillText(marks, m.x, m.y - 30);
  }
  if (s.spellCharge) {
    const m = s.team[s.main];
    ctx.fillStyle = "#344638";
    ctx.fillRect(m.x - 15, m.y - 42, 30, 3);
    ctx.fillStyle = "#eed39c";
    ctx.fillRect(m.x - 15, m.y - 42, 30 * Math.min(1, s.spellCharge.time), 3);
  }
}
