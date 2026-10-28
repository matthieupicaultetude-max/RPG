import { AMBER_SLIME } from "../data/rock-shell.js";
function poly(g, p, color) {
  g.fillStyle = color;
  g.beginPath();
  p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
export function drawRockShell(g, m, time) {
  if (!m.shellBroken) {
    poly(
      g,
      [
        [-16, -2],
        [-16, -14],
        [-10, -24],
        [-1, -25],
        [3, -16],
        [-3, -7],
      ],
      "#697a7d",
    );
    poly(
      g,
      [
        [-14, -15],
        [-8, -23],
        [-2, -23],
        [-1, -17],
        [-7, -10],
      ],
      "#b2bbb0",
    );
    poly(
      g,
      [
        [2, -16],
        [6, -26],
        [13, -23],
        [18, -10],
        [14, 1],
        [7, -3],
      ],
      "#7b8d8c",
    );
    poly(
      g,
      [
        [6, -24],
        [11, -22],
        [14, -13],
        [7, -15],
      ],
      "#bcc2ac",
    );
    g.fillStyle = "#d8bb7c";
    g.fillRect(-9, -18, 2, 7);
    g.fillRect(11, -14, 1, 7);
    const cracks = Math.floor((1 - m.hp / m.maxHp) * 3);
    if (cracks > 0) {
      g.strokeStyle = "#354a50";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-5, -24);
      g.lineTo(-8, -17);
      g.lineTo(-4, -12);
      g.stroke();
    }
    if (cracks > 1) {
      g.beginPath();
      g.moveTo(9, -23);
      g.lineTo(12, -17);
      g.lineTo(9, -11);
      g.stroke();
    }
  } else {
    g.fillStyle =
      (m.vulnerableUntil || 0) > time ? "#ffe6a0" : AMBER_SLIME.core;
    g.fillRect(-4, -10, 8, 8);
    g.fillRect(-2, -13, 4, 13);
  }
}
