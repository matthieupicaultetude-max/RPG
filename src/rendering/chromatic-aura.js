import { CHROMATIC_COLORS, completeChromaticSet } from "../data/chromatic.js";

// Layered translucent pixel particles, no canvas blur or fractional sprite positions.
export function drawSetAura(ctx, person, time) {
  const set = completeChromaticSet(person);
  if (!set || !person.moving) return;
  const x = Math.round(person.x),
    y = Math.round(person.y);
  const backward = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[
    person.facing
  ] || [0, -1];
  ctx.save();
  ctx.fillStyle = CHROMATIC_COLORS[set];
  ctx.strokeStyle = CHROMATIC_COLORS[set];
  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 19, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 16, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 18; i++) {
    const phase = (time * 1.5 + i / 18) % 1,
      angle = i * 2.4 + time;
    ctx.globalAlpha = (1 - phase) * 0.8;
    const distance = 8 + phase * 19;
    const px = x + Math.cos(angle) * distance + backward[0] * phase * 14;
    const py =
      y +
      Math.sin(angle) * distance * 0.4 -
      phase * 14 +
      backward[1] * phase * 14;
    ctx.fillRect(Math.round(px), Math.round(py), phase < 0.5 ? 2 : 1, 2);
  }
  ctx.restore();
}
const POSITIONS = {
  Coiffe: [0, -29],
  Cape: [-7, -14],
  Ceinture: [0, -3],
  Bottes: [3, 2],
  Amulette: [0, -12],
  "Anneau 1": [-8, -6],
  "Anneau 2": [8, -6],
  Arme: [10, -18],
  Bouclier: [-10, -10],
};
export function drawEquipmentGlints(ctx, person, time) {
  ctx.save();
  let index = 0;
  for (const [slot, item] of Object.entries(person.equipment || {})) {
    if (!item.chromatic || !POSITIONS[slot]) continue;
    const [x, y] = POSITIONS[slot],
      phase = (time * 0.7 + index++ * 0.19) % 1;
    ctx.fillStyle = CHROMATIC_COLORS[item.setId] || CHROMATIC_COLORS[item.element] || "#ebbbff";
    ctx.globalAlpha = 0.3 + Math.sin(phase * Math.PI) * 0.65;
    const px = Math.round(person.x + x + (person.facing === "left" ? -2 : 2)),
      py = Math.round(person.y + y - phase * 5);
    ctx.fillRect(px - 2, py, 5, 1);
    ctx.fillRect(px, py - 2, 1, 5);
  }
  ctx.restore();
}
