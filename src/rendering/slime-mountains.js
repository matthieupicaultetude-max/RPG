import { BRIDGES, MOUNTAIN_ENTRY } from "../world/slime-mountains-map.js";
import { GARDEN_MOUNTAIN_GATE } from "../game/zone-travel.js";
function poly(g, p, c) {
  g.fillStyle = c;
  g.beginPath();
  p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function label(g, text, x, y) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(text).width + 8;
  g.fillStyle = "#283a35e0";
  g.fillRect(x - w / 2, y - 8, w, 12);
  g.fillStyle = "#eee0b5";
  g.fillText(text, x, y + 1);
}
export function drawMountainGround(g, s) {
  if (!["garden", "slime-mountains"].includes(s.zone)) return;
  g.save();
  if (s.zone === "slime-mountains") {
    // Distant peaks sit in the void behind the playable plateaus.
    for (const [x, y, w, h] of [
      [55, 79, 60, 60],
      [244, 77, 65, 73],
      [449, 72, 60, 57],
      [596, 72, 44, 56],
    ]) {
      poly(
        g,
        [
          [x - w / 2, y],
          [x - w * 0.15, y - h * 0.7],
          [x, y - h],
          [x + w / 2, y],
        ],
        "#617f8c",
      );
      poly(
        g,
        [
          [x - w * 0.15, y - h * 0.7],
          [x, y - h],
          [x + w * 0.18, y - h * 0.64],
          [x + w * 0.03, y - h * 0.72],
          [x - w * 0.04, y - h * 0.6],
        ],
        "#cad7d0",
      );
    }
    for (const b of BRIDGES) {
      for (const y of [b.top, b.bottom]) {
        g.strokeStyle = "#baa777";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(b.left, y - 6);
        g.quadraticCurveTo((b.left + b.right) / 2, y - 1, b.right, y - 6);
        g.stroke();
        for (let x = b.left; x <= b.right; x += 14) {
          g.fillStyle = "#62523e";
          g.fillRect(x - 1, y - 8, 3, 10);
          g.fillStyle = "#c7b184";
          g.fillRect(x - 1, y - 9, 3, 2);
        }
      }
    }
  }
  const p = s.zone === "garden" ? GARDEN_MOUNTAIN_GATE : MOUNTAIN_ENTRY;
  g.strokeStyle = "#d4c18d";
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(p.x, p.y, 18, 9, 0, 0, Math.PI * 2);
  g.stroke();
  poly(
    g,
    [
      [p.x - 10, p.y],
      [p.x - 2, p.y - 12],
      [p.x + 5, p.y - 3],
      [p.x + 9, p.y - 9],
      [p.x + 15, p.y],
    ],
    "#bfc5ac",
  );
  label(
    g,
    s.zone === "garden" ? "MONTAGNES · F" : "VILLAGE · F",
    p.x,
    p.y + 21,
  );
  g.restore();
}
export function drawMountainSlime(g, m, time) {
  g.save();
  g.translate(Math.round(m.x), Math.round(m.y));
  g.fillStyle = "#4c563a55";
  g.beginPath();
  g.ellipse(1, 3, 15, 4, 0, 0, Math.PI * 2);
  g.fill();
  const a = m.intent,
    rolling = a?.phase === "charge",
    preparing = a?.phase === "windup";
  if (rolling) g.rotate(a.age * 14 * (m.facing === "left" ? -1 : 1));
  else {
    g.translate(0, Math.round(Math.sin(time * 3 + m.homeX)));
    if (preparing) {
      const p = Math.min(1, a.age / a.windup);
      g.scale(1 + p * 0.1, 1 - p * 0.16);
    }
  }
  poly(
    g,
    [
      [-13, 1],
      [-15, -6],
      [-10, -15],
      [-4, -19],
      [5, -19],
      [12, -13],
      [15, -5],
      [12, 2],
    ],
    "#8f672e",
  );
  poly(
    g,
    [
      [-11, -1],
      [-12, -6],
      [-7, -14],
      [-2, -16],
      [5, -15],
      [11, -9],
      [12, -2],
    ],
    "#c59a4d",
  );
  g.fillStyle = "#efd497";
  g.fillRect(-6, -13, 10, 3);
  g.fillRect(-3, -16, 6, 2);
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
    g.fillStyle = (m.vulnerableUntil || 0) > time ? "#ffe6a0" : "#e6bb68";
    g.fillRect(-4, -10, 8, 8);
    g.fillRect(-2, -13, 4, 13);
  }
  g.fillStyle = "#463c2e";
  g.fillRect(-7, -6, 2, 3);
  g.fillRect(6, -6, 2, 3);
  g.fillRect(-1, -1, 3, 1);
  g.fillStyle = "#fff0b9";
  g.fillRect(-7, -6, 1, 1);
  g.fillRect(6, -6, 1, 1);
  g.restore();
}
export function drawMountainStatus(g, m, s) {
  if (
    !m.mountainSlime ||
    m.hp <= 0 ||
    m.shellBroken ||
    Math.hypot(m.x - s.player.x, m.y - s.player.y) > 100
  )
    return;
  g.save();
  label(g, "CARAPACE −40 %", m.x, m.y - 47);
  g.restore();
}
