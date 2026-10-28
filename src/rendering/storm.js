import {
  ROOMS,
  POOLS,
  FLOWERS,
  CURRENTS,
  STORM_ENTRY,
  WIND_STORM_GATE,
} from "../world/storm-map.js";
import { currentState, STORM_RULES } from "../game/storm.js";
function ring(g, p, r, color = "#b5f4e8", fill = "#8adfe725") {
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
  g.fillStyle = "#183d46df";
  g.fillRect(x - w / 2, y - 8, w, 11);
  g.fillStyle = "#d6f3e7";
  g.fillText(text, x, y);
}
export function drawStormGround(g, s) {
  if (!["slime-wind", "slime-storm"].includes(s.zone)) return;
  g.save();
  const gate = s.zone === "slime-wind" ? WIND_STORM_GATE : STORM_ENTRY;
  ring(g, gate, 16);
  label(
    g,
    s.zone === "slime-wind" ? "ŒIL DES TEMPÊTES · F" : "SORTIE · ALIZÉS · F",
    gate.x,
    gate.y + 24,
  );
  if (s.zone !== "slime-storm") {
    g.restore();
    return;
  }
  for (const r of ROOMS) label(g, r.name, r.x + r.w / 2, r.y + 13);
  for (const p of POOLS) {
    g.save();
    g.beginPath();
    g.arc(p.x, p.y, p.r - 2, 0, Math.PI * 2);
    g.clip();
    g.strokeStyle = "#c7f8e16b";
    for (let i = 0; i < 5; i++) {
      const y = p.y - p.r + ((s.time * 8 + i * 11) % (p.r * 2));
      g.beginPath();
      g.moveTo(p.x - p.r, y);
      g.quadraticCurveTo(p.x, y - 3, p.x + p.r, y);
      g.stroke();
    }
    g.restore();
  }
  FLOWERS.forEach((f, i) => {
    const ready = (s.stormFlowers?.[i] || 0) <= s.time;
    g.fillStyle = "#6eae8a";
    g.fillRect(f.x - 1, f.y - 11, 2, 12);
    for (let petal = 0; petal < 5; petal++) {
      const a = (petal * Math.PI * 2) / 5;
      g.fillStyle = ready ? "#baadf0" : "#697e92";
      g.fillRect(
        Math.round(f.x + Math.cos(a) * 5) - 3,
        Math.round(f.y - 13 + Math.sin(a) * 4) - 3,
        6,
        6,
      );
    }
    g.fillStyle = ready ? "#edf5b5" : "#7f9392";
    g.fillRect(f.x - 2, f.y - 15, 4, 4);
  });
  for (const c of CURRENTS) {
    const boss = s.monsters.find((m) => m.stormBoss);
    if (c.room === 3 && boss?.bossPhase !== "combat") continue;
    const flow = currentState(s, c);
    if (!flow.warning && !flow.active) continue;
    g.fillStyle = flow.warning ? "#f3dda62b" : "#b2f5ea35";
    g.fillRect(c.x, c.y, c.w, c.h);
    g.setLineDash(flow.warning ? [3, 3] : []);
    g.strokeStyle = flow.warning ? "#f1d9a0" : "#d5fff1";
    g.strokeRect(c.x, c.y, c.w, c.h);
    g.setLineDash([]);
    g.strokeStyle = "#e2fff1";
    for (let i = 0; i < 3; i++) {
      const x = c.x + (c.w * (i + 0.5)) / 3,
        y = c.y + c.h / 2;
      g.save();
      g.translate(x, y);
      g.rotate(
        c.room === 1
          ? (flow.direction * Math.PI) / 2
          : flow.direction === 1
            ? 0
            : Math.PI,
      );
      g.beginPath();
      g.moveTo(-9, 0);
      g.lineTo(9, 0);
      g.lineTo(4, -4);
      g.moveTo(9, 0);
      g.lineTo(4, 4);
      g.stroke();
      g.restore();
    }
  }
  for (const m of s.monsters) {
    const a = m.intent;
    if (!m.stormSlime || m.hp <= 0) continue;
    if (m.vulnerableUntil > s.time) {
      ring(g, m, m.stormBoss ? 32 : 20, "#ffe3a1", "#ffe3a125");
      if (m.stormBoss) label(g, "CŒUR EXPOSÉ · +50 %", m.x, m.y - 66);
    }
    if (!a) continue;
    if (a.phase === "water-windup" || (a.phase === "flight" && a.leg === -1)) {
      ring(g, a.to, a.radius, "#8ad9fa", "#6fb9e740");
      label(g, "EAU · IMPACT", a.to.x, a.to.y - a.radius - 5);
    }
    if (a.phase === "inflate") {
      g.setLineDash([3, 4]);
      ring(g, m, STORM_RULES.suctionRadius, "#b9f5df", "#b5e7d916");
      g.setLineDash([]);
      ring(
        g,
        m,
        STORM_RULES.burstRadius + (m.stormBoss ? 8 : 0),
        "#eaffdb",
        "#b8eacf35",
      );
      label(g, "ASPIRATION → SOUFFLE AIR", m.x, m.y - 48);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + s.time * 0.7,
          r = 12 + (1 - ((s.time * 0.8 + i * 0.13) % 1)) * 60;
        g.fillStyle = "#e0ffe6";
        g.fillRect(
          Math.round(m.x + Math.cos(angle) * r),
          Math.round(m.y + Math.sin(angle) * r),
          2,
          1,
        );
      }
    }
    if (a.landings) {
      const firstSpent = a.leg === 1 || a.phase === "bounce";
      a.landings.forEach((p, i) => {
        if (i === 0 && firstSpent) return;
        ring(
          g,
          p,
          a.radius,
          i ? "#8ad9fa" : "#d8ffda",
          i ? "#72b6e22d" : "#b0e9c42d",
        );
        label(g, `${i + 1} · ${i ? "EAU" : "AIR"}`, p.x, p.y + 3);
      });
      g.setLineDash([2, 4]);
      g.strokeStyle = "#c4f3e0";
      g.beginPath();
      g.moveTo(m.x, m.y);
      if (!firstSpent) g.lineTo(a.landings[0].x, a.landings[0].y);
      g.lineTo(a.landings[1].x, a.landings[1].y);
      g.stroke();
      g.setLineDash([]);
    }
  }
  g.restore();
}
export function drawStormSlime(g, m, time) {
  g.save();
  g.translate(Math.round(m.x), Math.round(m.y));
  const size = (m.stormBoss ? 1.65 : 1) * (1 + 0.2 * ((m.growth || 1) - 1));
  g.fillStyle = "#173a4b60";
  g.beginPath();
  g.ellipse(1, 4, 14 * size, 4 * size, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(0, -Math.round(m.lift || Math.sin(time * 3 + m.homeX)));
  const a = m.intent,
    inflate = a?.phase === "inflate" ? Math.min(1, a.age / a.windup) : 0;
  g.scale(size * (1 + inflate * 0.3), size * (1 + inflate * 0.45));
  g.fillStyle = "#326d8b";
  g.fillRect(-13, -7, 26, 11);
  g.fillRect(-10, -14, 20, 15);
  g.fillRect(-6, -19, 12, 12);
  g.fillStyle = "#68c7d7";
  g.fillRect(-11, -7, 22, 9);
  g.fillRect(-8, -13, 16, 13);
  g.fillRect(-4, -18, 8, 12);
  g.fillStyle = "#a9ebd7";
  g.fillRect(-8, -12, 6, 4);
  g.fillRect(-3, -17, 5, 3);
  g.strokeStyle = "#e1fff1";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, -5, m.stormBoss ? 7 : 4, time * 1.5, time * 1.5 + Math.PI * 1.7);
  g.stroke();
  g.fillStyle = "#edfff4";
  for (let i = 0; i < 5; i++) {
    const x = -10 + i * 5,
      y = 1 - (i % 2) * 2;
    g.fillRect(x, y, 4, 2);
  }
  const look = m.facing === "left" ? -1 : m.facing === "right" ? 1 : 0;
  g.fillStyle = "#234c72";
  g.fillRect(-7 + look, -7, 2, 3);
  g.fillRect(6 + look, -7, 2, 3);
  if (m.stormBoss) {
    g.fillStyle = "#f4e5a5";
    g.fillRect(-7, -22, 14, 3);
    g.fillRect(-7, -26, 3, 5);
    g.fillRect(-1, -28, 3, 7);
    g.fillRect(5, -26, 3, 5);
  }
  g.restore();
}
export function drawStormAtmosphere(g, s) {
  if (s.zone !== "slime-storm") return;
  g.save();
  // Cascades fall down exposed cliff faces, never across the walkable floor.
  for (const p of [
    { x: 60, y: 375 },
    { x: 335, y: 350 },
    { x: 540, y: 360 },
  ]) {
    g.fillStyle = "#9bd5dc66";
    g.fillRect(p.x - 8, p.y, 16, 25);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? "#b2ebdd" : "#d7f9ef";
      g.fillRect(
        p.x - 7 + i * 3,
        Math.round(p.y + ((s.time * 23 + i * 4) % 22)),
        1,
        5,
      );
    }
    g.fillStyle = "#d3f5e975";
    g.fillRect(p.x - 11, p.y + 22, 22, 2);
  }
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.15 + (i % 3) * 0.06;
    g.fillStyle = "#c4f4eb";
    g.fillRect(
      Math.round((i * 101 + s.time * 18) % 640),
      Math.round(60 + ((i * 47) % 320) + Math.sin(s.time + i) * 6),
      3,
      1,
    );
  }
  g.restore();
}
