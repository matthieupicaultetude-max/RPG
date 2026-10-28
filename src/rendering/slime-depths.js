import { LAND, PONDS, DEPTHS_ENTRY } from "../world/slime-depths-map.js";
import { MARSH_DEPTHS_GATE, SEA_SINKHOLE } from "../world/slime-marsh-map.js";
import { DEPTHS_RULES } from "../game/slime-depths.js";
function ellipse(g, x, y, rx, ry, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
function caption(g, text, x, y) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(text).width + 8;
  g.fillStyle = "#142b38ed";
  g.fillRect(x - w / 2, y - 8, w, 12);
  g.fillStyle = "#b9eced";
  g.fillText(text, x, y + 1);
}
function waterfall(g, x, y, width, height, time) {
  g.fillStyle = "#234852";
  g.fillRect(x - 3, y - 2, width + 6, height + 4);
  g.fillStyle = "#589aa9";
  g.fillRect(x, y, width, height);
  for (let i = 0; i < width; i += 3) {
    g.fillStyle = i % 2 ? "#93cbd2" : "#366d83";
    g.fillRect(x + i, y, 2, height);
  }
  for (let i = 0; i < 6; i++) {
    const yy = y + ((i * 13 + Math.floor(time * 30)) % height);
    g.fillStyle = "#c2e9e4bb";
    g.fillRect(x + 2 + (i % 3), yy, width - 5, 2);
  }
  ellipse(g, x + width / 2, y + height, width * 0.8, 4, "#a7dcda88");
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4 + time * 1.5;
    g.fillStyle = "#c9f4e4aa";
    g.fillRect(
      Math.round(x + width / 2 + Math.cos(a) * (width * 0.5 + 4)),
      Math.round(y + height + Math.sin(a) * 4),
      2,
      2,
    );
  }
}
export function drawSeaSinkhole(g, s) {
  if (s.zone !== "slime-marsh") return;
  const h = SEA_SINKHOLE,
    p = MARSH_DEPTHS_GATE;
  g.save();
  ellipse(g, h.x, h.y, 34, 23, "#233b4d");
  ellipse(g, h.x, h.y, 29, 19, "#397e91");
  ellipse(g, h.x, h.y + 1, 23, 14, "#112438");
  ellipse(g, h.x, h.y + 2, 17, 10, "#080f20");
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = ["#81c5d1", "#568caa", "#b1d7d0"][i];
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(
      h.x,
      h.y,
      25 + i * 3,
      15 + i * 2,
      0,
      s.time * 0.6 + i * 2,
      s.time * 0.6 + i * 2 + 1.7,
    );
    g.stroke();
  }
  // Stone lip, falling stream, then the dark mouth beneath it.
  g.fillStyle = "#6f7971";
  g.fillRect(576, 326, 22, 7);
  g.fillStyle = "#a0aaa0";
  g.fillRect(574, 324, 23, 3);
  waterfall(g, 580, 328, 14, 31, s.time);
  g.strokeStyle = "#b7e6dc";
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(p.x, p.y, 14, 7, 0, 0, Math.PI * 2);
  g.stroke();
  caption(g, "DONJON · F", p.x, p.y - 13);
  g.restore();
}
export function drawDepthsGround(g, s) {
  if (s.zone !== "slime-depths") return;
  g.save();
  // A rock rim remains outside the navigable polygon.
  g.beginPath();
  g.rect(0, 0, 640, 400);
  LAND.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip("evenodd");
  g.strokeStyle = "#40505c";
  g.lineWidth = 18;
  g.beginPath();
  LAND.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.stroke();
  g.strokeStyle = "#1c2632";
  g.lineWidth = 5;
  g.stroke();
  g.restore();
  g.save();
  for (const [x, y, w, h] of [
    [146, 78, 20, 49],
    [309, 55, 23, 79],
    [539, 113, 16, 80],
  ])
    waterfall(g, x, y, w, h, s.time);
  // Small luminous mushrooms and mineral seams. Their light never obscures telegraphs.
  for (const [x, y, c] of [
    [110, 305, "#69bfc4"],
    [215, 185, "#849bd2"],
    [395, 112, "#5abdb6"],
    [492, 300, "#8fcdb3"],
    [364, 345, "#88a8cc"],
    [566, 264, "#69bfc4"],
  ]) {
    ellipse(g, x, y - 3, 17, 7, c + "17");
    g.fillStyle = "#506a78";
    g.fillRect(x - 1, y - 7, 2, 8);
    g.fillStyle = c;
    g.fillRect(x - 5, y - 8, 10, 3);
    g.fillRect(x - 3, y - 10, 6, 3);
  }
  for (const polygon of PONDS) {
    const [x, y] = polygon[0];
    ellipse(g, x - 10, y, 12, 2, "#78bbce33");
  }
  ellipse(g, DEPTHS_ENTRY.x, DEPTHS_ENTRY.y, 16, 8, "#729fbd55");
  g.strokeStyle = "#bce8ec";
  g.beginPath();
  g.ellipse(DEPTHS_ENTRY.x, DEPTHS_ENTRY.y, 16, 8, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#bce8ec";
  g.beginPath();
  g.moveTo(DEPTHS_ENTRY.x - 5, DEPTHS_ENTRY.y - 2);
  g.lineTo(DEPTHS_ENTRY.x, DEPTHS_ENTRY.y - 8);
  g.lineTo(DEPTHS_ENTRY.x + 5, DEPTHS_ENTRY.y - 2);
  g.stroke();
  caption(g, "REMONTEE · F", DEPTHS_ENTRY.x, DEPTHS_ENTRY.y + 20);
  for (const m of s.monsters) {
    if (m.hp <= 0 || m.fusionWith === undefined) continue;
    const b = s.monsters[m.fusionWith];
    if (!b || s.monsters.indexOf(m) > m.fusionWith) continue;
    const p = Math.min(
      1,
      (s.time - m.fusionStartedAt) / DEPTHS_RULES.fusionWindup,
    );
    g.strokeStyle = "#e1ca87";
    g.lineWidth = 2;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(m.x, m.y);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.setLineDash([]);
    for (const a of [m, b]) {
      g.strokeStyle = "#e8cf8b";
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(a.x, a.y, 19 + 5 * p, 8 + 3 * p, 0, 0, Math.PI * 2);
      g.stroke();
    }
    caption(g, "FUSION", (m.x + b.x) / 2, Math.min(m.y, b.y) - 42);
  }
  g.restore();
}
export function drawDepthsAtmosphere(g, s) {
  if (s.zone === "slime-depths") {
    g.save();
    const shade = g.createRadialGradient(320, 220, 100, 320, 200, 365);
    shade.addColorStop(0, "#091c3200");
    shade.addColorStop(1, "#050d2466");
    g.fillStyle = shade;
    g.fillRect(0, 0, 640, 400);
    // Pixel droplets in wet recesses; no full-screen blur or scaling.
    for (let i = 0; i < 12; i++) {
      const x = 48 + ((i * 73) % 550),
        y = 70 + ((s.time * 14 + i * 37) % 270);
      g.fillStyle = "#a9dae647";
      g.fillRect(x, Math.floor(y), 1, 3);
    }
    g.restore();
  }
  if (s.zoneDive) {
    const t = s.zoneDive.age / s.zoneDive.duration;
    g.fillStyle = `rgba(5,15,30,${Math.max(0, (t - 0.45) / 0.55)})`;
    g.fillRect(0, 0, 640, 400);
    if (t > 0.7)
      caption(g, "VERS LES PROFONDEURS…", s.player.x, s.player.y - 28);
  }
}
