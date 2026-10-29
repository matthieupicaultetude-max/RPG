import {
  ROOMS,
  BRAZIERS,
  CURRENTS,
  FURNACE_ENTRY,
  FIRE_FURNACE_GATE,
  BRIDGES,
} from "../world/furnace-map.js";
import { furnaceCurrent, FURNACE_RULES } from "../game/furnace.js";
function ring(g, p, r, color = "#ffd296", fill = "#ed78332b") {
  g.beginPath();
  g.arc(p.x, p.y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.stroke();
}
function label(g, text, x, y) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(text).width + 6;
  g.fillStyle = "#3e282be0";
  g.fillRect(x - w / 2, y - 8, w, 11);
  g.fillStyle = "#ffe2b8";
  g.fillText(text, x, y);
}
function cone(g, a) {
  g.beginPath();
  g.moveTo(a.from.x, a.from.y);
  g.arc(
    a.from.x,
    a.from.y,
    a.range,
    a.angle - a.halfAngle,
    a.angle + a.halfAngle,
  );
  g.closePath();
}
export function drawFurnaceGround(g, s) {
  if (!["slime-fire", "slime-furnace"].includes(s.zone)) return;
  g.save();
  const gate = s.zone === "slime-fire" ? FIRE_FURNACE_GATE : FURNACE_ENTRY;
  ring(g, gate, 16);
  label(
    g,
    s.zone === "slime-fire" ? "VENTS ROUGES · F" : "SORTIE · BRAISES · F",
    gate.x,
    gate.y + 24,
  );
  if (s.zone !== "slime-furnace") {
    g.restore();
    return;
  }
  for (const r of ROOMS) label(g, r.name, r.x + r.w / 2, r.y + 12);
  // Iron rails follow the passable bridges rather than cutting across the rooms.
  for (const b of BRIDGES) {
    g.strokeStyle = "#a48a70";
    for (const side of [0, 1]) {
      g.beginPath();
      if (b.w > b.h) {
        const y = b.y + side * b.h;
        g.moveTo(b.x, y);
        g.lineTo(b.x + b.w, y);
      } else {
        const x = b.x + side * b.w;
        g.moveTo(x, b.y);
        g.lineTo(x, b.y + b.h);
      }
      g.stroke();
    }
  }
  const f = s.furnace;
  for (const b of f?.braziers || BRAZIERS) {
    if (b.lit) {
      ring(
        g,
        b,
        15,
        b.dangerAt > s.time ? "#ffdb9e" : "#f39a5c",
        b.dangerAt > s.time ? "#f5bc4320" : "#d459343b",
      );
    } else ring(g, b, 12, "#768b8c", "#658b8b20");
  }
  for (const c of CURRENTS) {
    const flow = furnaceCurrent(s, c);
    if (!flow.warning && !flow.active) continue;
    g.fillStyle = flow.warning ? "#e7d39622" : "#ceebdd2a";
    g.fillRect(c.x, c.y, c.w, c.h);
    g.strokeStyle = flow.warning ? "#e5b879" : "#d8eddf";
    g.setLineDash(flow.warning ? [3, 3] : []);
    g.strokeRect(c.x, c.y, c.w, c.h);
    g.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const x = c.x + ((i + 0.5) * c.w) / 4,
        y = c.y + c.h / 2,
        d = flow.direction;
      g.beginPath();
      g.moveTo(x - 7 * d, y);
      g.lineTo(x + 7 * d, y);
      g.lineTo(x + 3 * d, y - 4);
      g.moveTo(x + 7 * d, y);
      g.lineTo(x + 3 * d, y + 4);
      g.stroke();
    }
  }
  for (const e of f?.embers || []) {
    if (e.flight) {
      const p = e.flight.to;
      ring(g, p, e.radius, "#ffda9b", "#fc8f3824");
      g.setLineDash([2, 3]);
      g.strokeStyle = "#d6e8c8";
      g.beginPath();
      g.moveTo(e.x, e.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      g.setLineDash([]);
      const t = Math.max(
        0,
        Math.min(
          1,
          1 - (e.flight.landsAt - s.time) / FURNACE_RULES.projectionWarning,
        ),
      );
      g.fillStyle = "#ffe0a1";
      g.fillRect(
        Math.round(e.x + (p.x - e.x) * t) - 1,
        Math.round(e.y + (p.y - e.y) * t - Math.sin(t * Math.PI) * 13) - 1,
        3,
        3,
      );
      continue;
    }
    ring(
      g,
      e,
      e.radius,
      e.readyAt > s.time ? "#f6cd8a" : "#ed9655",
      e.readyAt > s.time ? "#e69c3820" : "#db623649",
    );
    if (e.readyAt <= s.time) {
      g.fillStyle = "#f6bd69";
      g.fillRect(Math.round(e.x) - 2, Math.round(e.y) - 2, 4, 3);
      g.fillStyle = "#ffe0a0";
      g.fillRect(Math.round(e.x), Math.round(e.y) - 4, 1, 3);
    }
  }
  for (const b of f?.blasts || []) {
    ring(g, b, b.radius, "#ffd398", "#f06b3a3c");
    const remaining = Math.max(0, b.explodesAt - s.time);
    label(
      g,
      b.diverted ? "EXPLOSION DÉPORTÉE" : "EXPLOSION",
      b.x,
      b.y - b.radius - 5,
    );
    ring(
      g,
      b,
      Math.max(1, b.radius * (1 - remaining / FURNACE_RULES.blastWarning)),
      "#ffb873",
      "#ffb86a18",
    );
    if (b.from) {
      g.setLineDash([2, 3]);
      g.strokeStyle = "#d9eee4";
      g.beginPath();
      g.moveTo(b.from.x, b.from.y);
      g.lineTo(b.x, b.y);
      g.stroke();
      g.setLineDash([]);
    }
  }
  for (const m of s.monsters) {
    if (!m.furnaceSlime || m.hp <= 0) continue;
    const a = m.intent;
    if (m.vulnerableUntil > s.time) {
      ring(g, m, 30, "#c8eee8", "#b5efdf28");
      label(g, "CŒUR REFROIDI · +50 %", m.x, m.y - 65);
    }
    if (!a) continue;
    if (a.phase === "charge-warning" || a.phase === "charge") {
      g.strokeStyle = "#f3a46b";
      g.lineCap = "round";
      g.globalAlpha = 0.25;
      g.lineWidth = a.radius * 2;
      g.beginPath();
      g.moveTo(a.from.x, a.from.y);
      g.lineTo(a.to.x, a.to.y);
      g.stroke();
      g.globalAlpha = 1;
      g.lineWidth = 1;
      g.setLineDash([3, 3]);
      g.beginPath();
      g.moveTo(a.from.x, a.from.y);
      g.lineTo(a.to.x, a.to.y);
      g.stroke();
      g.setLineDash([]);
      ring(g, a.to, a.radius, "#ffc77e", "#ef845b22");
    }
    if (a.phase === "breath") {
      g.fillStyle = "#bde8d625";
      g.strokeStyle = a.locked ? "#e9ffe0" : "#b9d8cf";
      cone(g, a);
      g.fill();
      g.setLineDash(a.locked ? [] : [3, 3]);
      g.stroke();
      g.setLineDash([]);
      label(
        g,
        a.locked ? "SOUFFLE VERROUILLÉ · ESQUIVEZ" : "ORIENTEZ LE SOUFFLE",
        m.x,
        m.y - 52,
      );
    }
  }
  g.restore();
}
export function drawFurnaceBrazier(g, b, s) {
  g.save();
  g.translate(b.x, b.y);
  g.fillStyle = "#292b32";
  g.fillRect(-8, -5, 16, 9);
  g.fillStyle = "#81716c";
  g.fillRect(-6, -5, 12, 5);
  g.fillStyle = "#c39b6e";
  g.fillRect(-8, -9, 16, 3);
  g.fillStyle = "#4b3e3e";
  g.fillRect(-6, -13, 12, 5);
  if (b.lit) {
    const flicker = Math.round(Math.sin(s.time * 13 + b.x) * 2);
    g.fillStyle = "#e9763e";
    g.fillRect(-5, -20 + flicker, 10, 10 - flicker);
    g.fillStyle = "#f6b760";
    g.fillRect(-3, -24 - flicker, 6, 13 + flicker);
    g.fillStyle = "#ffe5a0";
    g.fillRect(-1, -19, 3, 8);
  } else {
    g.fillStyle = "#91b8b3";
    g.fillRect(-4, -12, 8, 2);
    g.fillStyle = "#67767b";
    g.fillRect(-1, -18, 2, 4);
  }
  g.restore();
}
export function drawFurnaceSlime(g, m, time) {
  g.save();
  g.translate(Math.round(m.x), Math.round(m.y));
  const size = m.furnaceBoss ? 2.4 : 1;
  g.fillStyle = "#201d2e65";
  g.beginPath();
  g.ellipse(1, 4, 13 * size, 4 * size, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(0, -Math.round(Math.sin(time * 4 + m.homeX) * 1));
  const inflate =
    m.intent?.phase === "breath"
      ? Math.min(1, m.intent.age / m.intent.windup)
      : 0;
  g.scale(size * (1 + inflate * 0.25), size * (1 + inflate * 0.2));
  g.fillStyle = "#70383c";
  g.fillRect(-13, -7, 26, 10);
  g.fillRect(-10, -14, 20, 12);
  g.fillRect(-6, -19, 12, 9);
  g.fillStyle = "#bd5142";
  g.fillRect(-11, -7, 22, 8);
  g.fillRect(-8, -13, 16, 12);
  g.fillRect(-4, -18, 8, 10);
  g.fillStyle = "#f29455";
  g.fillRect(-7, -11, 6, 4);
  g.fillRect(-3, -17, 5, 3);
  g.strokeStyle = m.vulnerableUntil > time ? "#a3e5e2" : "#ffde94";
  g.beginPath();
  g.arc(0, -5, 5, time * 2, time * 2 + Math.PI * 1.7);
  g.stroke();
  g.fillStyle = m.vulnerableUntil > time ? "#a3e5e2" : "#ffce70";
  g.fillRect(-1, -8, 3, 5);
  const look = m.facing === "left" ? -1 : m.facing === "right" ? 1 : 0;
  g.fillStyle = "#e6efe1";
  g.fillRect(-7 + look, -6, 3, 2);
  g.fillRect(5 + look, -6, 3, 2);
  for (let i = 0; i < 3; i++) {
    const x = -8 + i * 8,
      y = -19 - (i % 2) * 4 - Math.sin(time * 8 + i) * 2;
    g.fillStyle = "#e99053";
    g.fillRect(Math.round(x), Math.round(y), 2, 5);
  }
  if (m.furnaceBoss) {
    g.fillStyle = "#b29c84";
    g.fillRect(-9, -22, 18, 3);
    g.fillStyle = "#66545c";
    g.fillRect(-10, -27, 4, 7);
    g.fillRect(7, -27, 4, 7);
    g.fillStyle = "#efd799";
    g.fillRect(-2, -24, 5, 4);
  }
  g.restore();
}
export function drawFurnaceAtmosphere(g, s) {
  if (s.zone !== "slime-furnace") return;
  g.save();
  for (let i = 0; i < 35; i++) {
    const x = (i * 113 + s.time * (6 + (i % 4))) % 640,
      y = 400 - ((i * 61 + s.time * (12 + (i % 5))) % 400);
    g.globalAlpha = 0.2 + (i % 3) * 0.15;
    g.fillStyle = i % 3 ? "#e89c62" : "#f7d59c";
    g.fillRect(Math.round(x), Math.round(y), 1, 2);
  }
  g.globalAlpha = 0.12;
  g.strokeStyle = "#dec0b2";
  for (let i = 0; i < 8; i++) {
    const x = ((i * 137 + s.time * 22) % 700) - 30,
      y = 45 + ((i * 49) % 310);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 20, y - 6, x + 37, y - 1);
    g.stroke();
  }
  g.restore();
}

export function drawFurnaceForge(g, p, s) {
  g.save();
  if (
    s.player.y < p.y &&
    s.player.y > p.y - 44 &&
    Math.abs(s.player.x - p.x) < 18
  )
    g.globalAlpha = 0.55;
  g.translate(p.x, p.y);
  g.fillStyle = "#221e2a70";
  g.beginPath();
  g.ellipse(2, 3, 18, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#393840";
  g.fillRect(-15, -16, 30, 20);
  g.fillStyle = "#82746d";
  g.fillRect(-13, -17, 26, 18);
  g.fillStyle = "#b2a18b";
  g.fillRect(-15, -20, 30, 4);
  g.fillStyle = "#24242e";
  g.fillRect(-7, -12, 14, 14);
  g.fillRect(-4, -15, 8, 4);
  g.fillStyle = "#6e4841";
  g.fillRect(-5, -2, 10, 3);
  g.fillStyle = "#a97751";
  g.fillRect(-3, -1, 3, 1);
  g.fillStyle = "#45434b";
  g.fillRect(-9, -42, 13, 23);
  g.fillStyle = "#9a8a7e";
  g.fillRect(-7, -41, 9, 21);
  g.fillStyle = "#b9aa94";
  g.fillRect(-11, -44, 17, 4);
  g.fillStyle = "#625c5e";
  for (let y = -37; y < -20; y += 6) g.fillRect(-7, y, 9, 1);
  g.fillRect(-12, -8, 4, 1);
  g.fillRect(8, -7, 4, 1);
  g.strokeStyle = "#6e7272";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(11, -18);
  g.lineTo(11, -31);
  g.lineTo(17, -31);
  g.stroke();
  g.fillStyle = "#a99a83";
  g.fillRect(-16, 1, 32, 3);
  g.restore();
}
