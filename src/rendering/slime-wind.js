import { WIND_RULES } from "../game/wind-slimes.js";
import {
  WIND_ENTRY,
  MOUNTAIN_WIND_GATE,
  BRIDGES,
} from "../world/slime-wind-map.js";
function ring(g, p, r, fill, stroke) {
  g.beginPath();
  g.arc(p.x, p.y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 1;
  g.stroke();
}
function label(g, text, x, y) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(text).width + 8;
  g.fillStyle = "#294941dd";
  g.fillRect(x - w / 2, y - 8, w, 11);
  g.fillStyle = "#e1f6d0";
  g.fillText(text, x, y);
}
export function drawWindGround(g, s) {
  if (!["slime-mountains", "slime-wind"].includes(s.zone)) return;
  g.save();
  const gate = s.zone === "slime-wind" ? WIND_ENTRY : MOUNTAIN_WIND_GATE;
  ring(g, gate, 17, "#9bdcce33", "#d4f3d4");
  g.strokeStyle = "#d1f7d9";
  g.beginPath();
  g.arc(gate.x, gate.y - 3, 8, 0, Math.PI * 1.6);
  g.stroke();
  label(
    g,
    s.zone === "slime-wind" ? "MONTAGNES · F" : "HAUTS DES ALIZÉS · F",
    gate.x,
    gate.y + 23,
  );
  if (s.zone !== "slime-wind") {
    g.restore();
    return;
  }
  for (const b of BRIDGES)
    for (const y of [b.top, b.bottom]) {
      g.strokeStyle = "#c1bb8a";
      g.beginPath();
      g.moveTo(b.left, y - 7);
      g.quadraticCurveTo((b.left + b.right) / 2, y - 2, b.right, y - 7);
      g.stroke();
      for (let x = b.left; x <= b.right; x += 15) {
        g.fillStyle = "#6c7863";
        g.fillRect(x, y - 9, 2, 11);
      }
    }
  for (const m of s.monsters) {
    const a = m.intent;
    if (m.hp <= 0 || !m.windSlime || !a) continue;
    if (a.phase === "windup") {
      const t = Math.min(1, a.age / a.windup);
      g.setLineDash([3, 4]);
      ring(g, m, WIND_RULES.suctionRadius, "#b1ead416", "#c5eed2");
      g.setLineDash([]);
      ring(g, m, WIND_RULES.blastRadius, "#86cab43b", "#e0f8c9");
      ring(
        g,
        m,
        Math.max(1, WIND_RULES.blastRadius * t),
        "#a8e2b01b",
        "#efffd2",
      );
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 + s.time * 0.7,
          r =
            12 +
            (1 - ((s.time * 0.8 + i * 0.13) % 1)) *
              (WIND_RULES.suctionRadius - 14),
          x = m.x + Math.cos(angle) * r,
          y = m.y + Math.sin(angle) * r;
        g.strokeStyle = "#d4f8d5";
        g.beginPath();
        g.moveTo(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6);
        g.lineTo(x, y);
        g.stroke();
      }
      label(
        g,
        "ASPIRATION → EXPLOSION",
        m.x,
        m.y - WIND_RULES.suctionRadius - 6,
      );
    }
    for (const [i, p] of a.landings.entries()) {
      const spent = i < a.leg || (i === 0 && a.phase === "bounce");
      if (spent) continue;
      ring(
        g,
        p,
        a.radius,
        i === a.leg ? "#a5dfc93b" : "#c3e9cf22",
        i === a.leg ? "#eaffcc" : "#b8dfcd",
      );
      g.fillStyle = "#eaffcf";
      g.font = "bold 9px monospace";
      g.textAlign = "center";
      g.fillText(String(i + 1), p.x, p.y + 3);
    }
    g.setLineDash([2, 4]);
    g.strokeStyle = "#c1e9cc";
    g.beginPath();
    g.moveTo(m.x, m.y);
    if(a.leg===0&&a.phase!=="bounce")g.lineTo(a.landings[0].x, a.landings[0].y);
    g.lineTo(a.landings[1].x, a.landings[1].y);
    g.stroke();
    g.setLineDash([]);
  }
  g.restore();
}
export function drawWindSlime(g, m, time) {
  g.save();
  g.translate(Math.round(m.x), Math.round(m.y));
  g.fillStyle = "#365d6140";
  g.beginPath();
  g.ellipse(1, 4, 14, 4, 0, 0, Math.PI * 2);
  g.fill();
  const a = m.intent,
    inflate = a?.phase === "windup" ? Math.min(1, a.age / a.windup) : 0,
    hop =
      m.moving && !a
        ? Math.abs(Math.sin(time * 7 + m.homeX)) * 3
        : Math.sin(time * 3 + m.homeX);
  g.translate(0, -Math.round((m.lift || 0) + hop));
  g.scale(1 + inflate * 0.55, 1 + inflate * 0.65);
  g.fillStyle = "#4b999d";
  g.fillRect(-12, -7, 24, 10);
  g.fillRect(-9, -13, 18, 14);
  g.fillRect(-5, -17, 10, 10);
  g.fillStyle = "#8ed8d0";
  g.fillRect(-10, -7, 20, 8);
  g.fillRect(-7, -12, 14, 12);
  g.fillRect(-3, -16, 6, 10);
  g.fillStyle = "#d8f5d8";
  g.fillRect(-6, -11, 10, 3);
  g.fillRect(-2, -15, 4, 3);
  g.strokeStyle = "#d7f6dc";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, -5, 4, time * 1.8, time * 1.8 + Math.PI * 1.7);
  g.stroke();
  g.fillStyle = "#326674";
  const look = m.facing === "left" ? -1 : m.facing === "right" ? 1 : 0;
  g.fillRect(-6 + look, -5, 2, 3);
  g.fillRect(5 + look, -5, 2, 3);
  g.fillRect(-1, 0, 3, 1);
  g.fillStyle = "#f1ffe5";
  g.fillRect(-6 + look, -5, 1, 1);
  g.fillRect(5 + look, -5, 1, 1);
  g.restore();
}
export function drawWindmillRotor(g, p, time) {
  g.save();
  g.translate(p.x, p.y - 35);
  g.rotate(time * 0.65 + p.x);
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 2);
    g.fillStyle = "#5a786f";
    g.fillRect(0, -1, 23, 2);
    g.fillStyle = "#e1e3bd";
    g.fillRect(7, -5, 14, 4);
    g.fillStyle = "#a9bf9c";
    g.fillRect(9, -3, 1, 2);
    g.fillRect(16, -3, 1, 2);
  }
  g.fillStyle = "#546b66";
  g.fillRect(-3, -3, 6, 6);
  g.restore();
}
export function drawWindAtmosphere(g, s) {
  if (s.zone !== "slime-wind") return;
  g.save();
  g.strokeStyle = "#e3f4d4";
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const x = ((i * 101 + s.time * (18 + (i % 4))) % 720) - 40,
      y = 75 + ((i * 47) % 290);
    g.globalAlpha = 0.16 + (i % 3) * 0.04;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 12, y - 5, x + 25, y - 2);
    g.stroke();
  }
  for (let i = 0; i < 12; i++) {
    g.globalAlpha = 0.4;
    g.fillStyle = i % 2 ? "#d6dca4" : "#9bbd85";
    g.fillRect(
      Math.round((i * 137 + s.time * 25) % 640),
      Math.round(90 + ((i * 41) % 270) + Math.sin(s.time + i) * 6),
      2,
      1,
    );
  }
  g.restore();
}
