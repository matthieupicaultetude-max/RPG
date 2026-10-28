import { FIRE_RULES } from "../game/fire-slimes.js";
import { FIRE_ENTRY, LAVA_POOLS } from "../world/slime-fire-map.js";
import { MOUNTAIN_FIRE_GATE } from "../game/zone-travel.js";
function circle(g, x, y, r, fill, stroke) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1;
    g.stroke();
  }
}
function label(g, text, p) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(text).width + 8;
  g.fillStyle = "#382a29e8";
  g.fillRect(p.x - w / 2, p.y + 14, w, 12);
  g.fillStyle = "#ffdaa0";
  g.fillText(text, p.x, p.y + 23);
}
export function drawFireGround(g, s) {
  if (!["slime-fire", "slime-mountains", "slime-volcano"].includes(s.zone))
    return;
  g.save();
  if (s.zone !== "slime-volcano") {
    const p = s.zone === "slime-fire" ? FIRE_ENTRY : MOUNTAIN_FIRE_GATE;
    circle(g, p.x, p.y, 17, "#65362c66", "#f3ae69");
    g.fillStyle = "#ffb15a";
    g.fillRect(p.x - 5, p.y - 5, 10, 9);
    g.fillStyle = "#fff1ad";
    g.fillRect(p.x - 2, p.y - 9, 4, 10);
    label(
      g,
      s.zone === "slime-fire" ? "MONTAGNES · F" : "CHAMPS DE BRAISE · F",
      p,
    );
  }
  if (s.zone === "slime-mountains") {
    g.restore();
    return;
  }
  // Lava is decoration outside the walk mask, never a hidden damaging floor.
  for (const pool of s.zone === "slime-fire" ? LAVA_POOLS : []) {
    const x = pool.reduce((n, p) => n + p[0], 0) / pool.length,
      y = pool.reduce((n, p) => n + p[1], 0) / pool.length;
    for (let i = 0; i < 3; i++) {
      const t = (s.time * 0.55 + i * 0.33) % 1;
      g.globalAlpha = (1 - t) * 0.6;
      g.strokeStyle = "#ffd177";
      g.beginPath();
      g.ellipse(x + (i - 1) * 8, y, 3 + t * 9, 2 + t * 4, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  for (const h of s.fireTrails || []) {
    const pending = h.age < FIRE_RULES.trailWindup,
      fade = Math.min(
        1,
        (FIRE_RULES.trailDuration + FIRE_RULES.trailWindup - h.age) * 2,
      );
    g.globalAlpha = fade;
    circle(
      g,
      h.x,
      h.y,
      h.radius,
      pending ? "#e6884133" : "#a63c2466",
      pending ? "#f7be75" : "#e88a3b",
    );
    if (!pending) {
      for (let i = 0; i < 3; i++) {
        const phase = (s.time * 5 + i + h.x) % 3;
        g.fillStyle = i % 2 ? "#ffd075" : "#ef7134";
        g.fillRect(
          Math.round(h.x + (i - 1) * 4),
          Math.round(h.y - 2 - phase * 2),
          3,
          3 + phase,
        );
      }
    }
  }
  g.globalAlpha = 1;
  for (const h of s.fireExplosions || []) {
    const t = Math.min(1, h.age / FIRE_RULES.explosionWindup);
    circle(g, h.x, h.y, h.radius, "#f16b3b33", "#ffcd86");
    circle(g, h.x, h.y, Math.max(2, h.radius * t), "#e7753933", "#ffe4a1");
    circle(g, h.x, h.y, 7 + Math.sin(s.time * 25) * 2, "#fff0b2", "#ec6a34");
    g.fillStyle = "#fff0c8";
    g.font = "bold 8px monospace";
    g.textAlign = "center";
    g.fillText("EXPLOSION", h.x, h.y - h.radius - 4);
  }
  g.restore();
}
export function drawFireSlime(g, m, time) {
  const birth = m.emergence,
    t = birth ? Math.min(1, birth.age / birth.duration) : 1;
  const x = Math.round(
      birth ? birth.from.x + (birth.to.x - birth.from.x) * t : m.x,
    ),
    y = Math.round(
      birth ? birth.from.y + (birth.to.y - birth.from.y) * t : m.y,
    );
  g.save();
  g.translate(x, y);
  g.fillStyle = "#251e2255";
  g.beginPath();
  g.ellipse(1, 3, 13, 4, 0, 0, Math.PI * 2);
  g.fill();
  const idleHop =
    m.moving && !m.intent
      ? Math.abs(Math.sin(time * 9 + m.homeX)) * 4
      : Math.sin(time * 4 + m.homeX);
  g.translate(
    0,
    -Math.round((birth ? Math.sin(t * Math.PI) * 34 : m.lift || 0) + idleHop),
  );
  if (m.intent?.phase === "windup") {
    const t = Math.min(1, m.intent.age / m.intent.windup);
    g.scale(1 + t * 0.18, 1 - t * 0.25);
  }
  g.fillStyle = "#a64031";
  g.fillRect(-12, -7, 24, 10);
  g.fillRect(-9, -13, 18, 14);
  g.fillRect(-5, -17, 10, 12);
  g.fillStyle = "#ef803d";
  g.fillRect(-10, -7, 20, 8);
  g.fillRect(-7, -12, 14, 12);
  g.fillRect(-3, -16, 6, 10);
  g.fillStyle = "#ffc966";
  g.fillRect(-6, -11, 10, 3);
  g.fillRect(-2, -15, 4, 3);
  g.fillRect(-2, -5, 5, 5);
  g.fillStyle = "#6c322c";
  g.fillRect(-8, 0, 16, 3);
  g.fillRect(-6, -6, 2, 3);
  g.fillRect(5, -6, 2, 3);
  g.fillRect(-1, 0, 3, 1);
  g.fillStyle = "#fff1b9";
  g.fillRect(-6, -6, 1, 1);
  g.fillRect(5, -6, 1, 1);
  const look = m.facing === "left" ? -1 : m.facing === "right" ? 1 : 0;
  g.fillStyle = "#431f26";
  g.fillRect(-6 + look, -5, 1, 2);
  g.fillRect(5 + look, -5, 1, 2);
  for (let i = 0; i < 3; i++) {
    const t = (time * 1.7 + i * 0.34) % 1;
    g.fillStyle = i % 2 ? "#f7cc6d" : "#d56d38";
    g.globalAlpha = 1 - t;
    g.fillRect(Math.round((i - 1) * 7), Math.round(-19 - t * 9), 2, 2);
  }
  g.restore();
}
export function drawFireAtmosphere(g, s) {
  if (!["slime-fire", "slime-volcano"].includes(s.zone)) return;
  g.save();
  g.fillStyle = "#a4381810";
  g.fillRect(0, 0, 640, 400);
  for (let i = 0; i < 32; i++) {
    const x = (i * 113 + s.time * 8) % 640,
      y = 400 - ((i * 71 + s.time * (9 + (i % 4))) % 400);
    g.globalAlpha = 0.25 + 0.25 * Math.sin(i + s.time);
    g.fillStyle = i % 3 ? "#eaa66b" : "#ffe1a0";
    g.fillRect(Math.round(x), Math.round(y), 1, i % 3 === 0 ? 2 : 1);
  }
  g.restore();
}
