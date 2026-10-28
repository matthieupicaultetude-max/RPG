import {
  MAGMA_RULES,
  volcanoBoss,
  isVolcanoInvulnerable,
} from "../game/volcano.js";
import { FIRE_VOLCANO_GATE, VOLCANO_ENTRY } from "../world/volcano-map.js";
function circle(g, p, r, fill, stroke) {
  g.beginPath();
  g.arc(p.x, p.y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 1;
  g.stroke();
}
function poly(g, p, c) {
  g.fillStyle = c;
  g.beginPath();
  p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
export function drawVolcanoGround(g, s) {
  if (!["slime-fire", "slime-volcano"].includes(s.zone)) return;
  g.save();
  const p = s.zone === "slime-fire" ? FIRE_VOLCANO_GATE : VOLCANO_ENTRY;
  circle(g, p, 18, "#f56c3633", "#ffc67d");
  poly(
    g,
    [
      [p.x - 12, p.y + 3],
      [p.x - 5, p.y - 12],
      [p.x + 5, p.y - 12],
      [p.x + 12, p.y + 3],
    ],
    "#574347",
  );
  g.fillStyle = "#f58e3e";
  g.fillRect(p.x - 4, p.y - 10, 8, 4);
  g.font = "7px monospace";
  g.textAlign = "center";
  g.fillStyle = "#ffdc9e";
  g.fillText(
    s.zone === "slime-fire" ? "VOLCAN · 1 CLÉ · F" : "SORTIE · F",
    p.x,
    p.y + 25,
  );
  if (s.zone !== "slime-volcano") {
    g.restore();
    return;
  }
  for (const h of s.magmaPatches || []) {
    circle(g, h, h.radius, "#d34d2cbb", "#ffb856");
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? "#f98e3d" : "#ffd172";
      g.fillRect(
        Math.round(h.x - 8 + i * 5),
        Math.round(h.y + Math.sin(s.time * 4 + i) * 3 - 2),
        3,
        4,
      );
    }
  }
  for (const h of s.magmaBlasts || []) {
    circle(g, h, h.radius, "#eb9b3c33", "#fcd792");
    circle(
      g,
      h,
      Math.max(1, h.radius * Math.min(1, h.age / MAGMA_RULES.shellWindup)),
      "#f1763c22",
      "#ffe3a0",
    );
    g.font = "7px monospace";
    g.textAlign = "center";
    g.fillStyle = "#ffdf9b";
    g.fillText("CARAPACE · EXPLOSION", h.x, h.y - h.radius - 5);
  }
  const b = volcanoBoss(s);
  if (isVolcanoInvulnerable(b)) {
    g.setLineDash([4, 4]);
    circle(
      g,
      b,
      MAGMA_RULES.blastRadius + MAGMA_RULES.bossHitRadius,
      "#e5ad3c11",
      "#f3d493",
    );
    g.setLineDash([]);
    g.font = "7px monospace";
    g.textAlign = "center";
    g.fillStyle = "#ffe2a6";
    g.fillText("EXPLOSION D’INVOCATION ICI", b.x, b.y + 58);
  }
  for (const z of b?.intent?.zones || []) {
    circle(
      g,
      z,
      b.intent.radius,
      b.intent.element === "earth" ? "#c59a4d44" : "#ee763633",
      b.intent.element === "earth" ? "#efd497" : "#ffc076",
    );
    g.font = "7px monospace";
    g.fillStyle = "#ffe0ac";
    g.fillText("ÉRUPTION", z.x, z.y - 26);
  }
  for (const h of s.volcanoFlights || []) {
    circle(g, h.to, h.radius, "#ee763644", "#ffd58d");
  }
  if (b?.bossPhase === "dormant" && b.hp > 0) {
    g.font = "7px monospace";
    g.fillStyle = "#ffdc9d";
    g.textAlign = "center";
    g.fillText("PYROCLASTE · F", b.x, b.y + 35);
  }
  g.restore();
}
export function drawVolcanoProjectiles(g, s) {
  if (s.zone !== "slime-volcano") return;
  g.save();
  for (const h of s.volcanoFlights || []) {
    const t = Math.min(1, h.age / h.duration),
      x = h.from.x + (h.to.x - h.from.x) * t,
      y =
        h.from.y +
        (h.to.y - h.from.y) * t -
        Math.sin(t * Math.PI) * (h.summon ? 65 : 30);
    g.fillStyle = "#ffe197";
    g.fillRect(Math.round(x - 3), Math.round(y - 3), 6, 6);
    g.fillStyle = "#df6433";
    g.fillRect(Math.round(x - 5), Math.round(y + 2), 10, 4);
    if (h.summon) {
      g.fillStyle = h.species === "magma-slime" ? "#59474a" : "#ee873d";
      g.fillRect(Math.round(x - 7), Math.round(y - 7), 14, 10);
      g.fillStyle = "#ffd372";
      g.fillRect(Math.round(x - 2), Math.round(y - 4), 4, 4);
    }
  }
  g.restore();
}
export function drawMagmaSlime(g, m, time) {
  g.save();
  g.translate(Math.round(m.x), Math.round(m.y));
  g.fillStyle = "#271c2855";
  g.beginPath();
  g.ellipse(1, 3, 15, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(0, -Math.round(m.lift || Math.abs(Math.sin(time * 4 + m.homeX))));
  if (m.intent?.phase === "windup") {
    const t = Math.min(1, m.intent.age / m.intent.windup);
    g.scale(1 + t * 0.15, 1 - t * 0.2);
  }
  poly(
    g,
    [
      [-14, 1],
      [-14, -8],
      [-9, -16],
      [-2, -20],
      [8, -17],
      [14, -8],
      [13, 2],
    ],
    "#92542e",
  );
  poly(
    g,
    [
      [-11, -2],
      [-8, -12],
      [-1, -16],
      [7, -13],
      [11, -5],
      [9, 1],
    ],
    "#c59a4d",
  );
  g.fillStyle = "#ffb957";
  g.fillRect(-4, -13, 8, 10);
  g.fillStyle = "#fff1a0";
  g.fillRect(-1, -10, 3, 6);
  if (!m.shellBroken) {
    poly(
      g,
      [
        [-15, 0],
        [-17, -13],
        [-9, -24],
        [-1, -21],
        [-4, -10],
        [-2, 1],
      ],
      "#4c454b",
    );
    poly(
      g,
      [
        [4, -17],
        [8, -24],
        [15, -16],
        [18, -3],
        [12, 2],
        [7, -5],
      ],
      "#62535a",
    );
    g.fillStyle = "#ef7b3a";
    g.fillRect(-10, -18, 2, 10);
    g.fillRect(11, -15, 2, 8);
    if ((m.shellDamage || 0) > 0) {
      g.strokeStyle = "#ffcc79";
      g.beginPath();
      g.moveTo(-7, -22);
      g.lineTo(-10, -14);
      g.lineTo(-5, -8);
      g.stroke();
    }
  }
  g.fillStyle = "#ffdfa0";
  g.fillRect(-6, -6, 3, 2);
  g.fillRect(5, -6, 3, 2);
  g.fillStyle = "#6d342e";
  g.fillRect(-1, 0, 3, 1);
  g.restore();
}
export function drawVolcanoBoss(g, b, time) {
  g.save();
  g.translate(Math.round(b.x), Math.round(b.y));
  g.fillStyle = "#241a2477";
  g.beginPath();
  g.ellipse(0, 7, 44, 12, 0, 0, Math.PI * 2);
  g.fill();
  const pulse = b.intent ? Math.sin(time * 19) * 2 : Math.sin(time * 2);
  g.translate(0, pulse);
  poly(
    g,
    [
      [-43, 4],
      [-39, -18],
      [-25, -37],
      [-15, -65],
      [16, -65],
      [29, -39],
      [43, -15],
      [45, 4],
      [28, 12],
      [-25, 12],
    ],
    "#463b45",
  );
  poly(
    g,
    [
      [-30, -7],
      [-19, -33],
      [-10, -58],
      [3, -55],
      [0, -22],
      [16, 9],
      [-25, 8],
    ],
    "#766056",
  );
  poly(
    g,
    [
      [8, -55],
      [17, -59],
      [24, -33],
      [35, -10],
      [24, 6],
      [14, -21],
    ],
    "#94714d",
  );
  g.fillStyle = "#dd6936";
  g.beginPath();
  g.ellipse(1, -62, 18, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffd57a";
  g.beginPath();
  g.ellipse(1, -63, 11, 3, 0, 0, Math.PI * 2);
  g.fill();
  poly(
    g,
    [
      [1, -58],
      [7, -50],
      [3, -36],
      [13, -26],
      [8, -10],
      [15, 5],
      [6, 5],
      [1, -14],
      [5, -25],
      [-5, -37],
    ],
    "#ef8b3c",
  );
  g.fillStyle = "#ffe09a";
  g.fillRect(-1, -46, 3, 12);
  g.fillRect(6, -23, 3, 10);
  g.fillStyle = b.bossPhase === "dormant" ? "#9e7852" : "#ffe3a0";
  g.fillRect(-24, -20, 12, 3);
  g.fillRect(20, -20, 12, 3);
  g.fillStyle = "#362935";
  g.fillRect(-10, -2, 25, 4);
  for (let i = 0; i < 8; i++) {
    const t = (time * (b.intent ? 1.5 : 0.5) + i * 0.13) % 1;
    g.globalAlpha = 1 - t;
    g.fillStyle = i % 2 ? "#e88943" : "#ffd98b";
    g.fillRect(
      Math.round((i - 4) * 3 + Math.sin(time + i) * 4),
      Math.round(-66 - t * 26),
      2,
      3,
    );
  }
  g.restore();
  if (isVolcanoInvulnerable(b)) {
    g.save();
    g.globalAlpha = 0.8 + 0.15 * Math.sin(time * 4);
    g.strokeStyle = "#ffe0a3";
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(b.x, b.y - 28, 52, 54, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#ffe0a3";
    g.font = "bold 7px monospace";
    g.textAlign = "center";
    g.fillText("INVULNÉRABLE", b.x, b.y - 91);
    g.restore();
  }
}
