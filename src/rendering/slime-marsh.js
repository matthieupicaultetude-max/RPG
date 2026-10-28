import {
  MARSH_RULES,
  slimeScale,
  slimeVulnerable,
} from "../game/slime-marsh.js";
import { GARDEN_MARSH_GATE } from "../game/zone-travel.js";
import { MARSH_ENTRY, LAND, PONDS } from "../world/slime-marsh-map.js";
function ring(g, x, y, r, color, alpha = 1) {
  g.strokeStyle = color;
  g.globalAlpha = alpha;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
}
export function drawZonePassage(g, state) {
  const gate =
    state.zone === "garden"
      ? GARDEN_MARSH_GATE
      : state.zone === "slime-marsh"
        ? MARSH_ENTRY
        : null;
  if (!gate) return;
  const { x, y } = gate;
  g.save();
  g.fillStyle = "#365c6455";
  g.beginPath();
  g.ellipse(x, y, 22, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a5debc";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(x, y, 20, 10, 0, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    g.fillStyle = i % 2 ? "#d9deaa" : "#71b8ae";
    g.fillRect(
      Math.round(x + Math.cos(a) * 23) - 2,
      Math.round(y + Math.sin(a) * 13) - 2,
      4,
      3,
    );
  }
  const title = state.zone === "garden" ? "MARAIS DE GELEE · F" : "VILLAGE · F";
  g.font = "7px monospace";
  g.textAlign = "center";
  const width = g.measureText(title).width + 8;
  g.fillStyle = "#183229dd";
  g.fillRect(x - width / 2, y + 17, width, 12);
  g.fillStyle = "#e2ead0";
  g.fillText(title, x, y + 25);
  g.restore();
}
export function drawMarshGround(g, state) {
  if (state.zone !== "slime-marsh" || !state.slimeMarsh) return;
  const marsh = state.slimeMarsh;
  g.save();
  g.beginPath();
  for (const polygon of [LAND, ...PONDS]) {
    polygon.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }
  g.clip("evenodd");
  for (const p of marsh.puddles) {
    const fade = Math.min(1, (p.expiresAt - state.time) / 3);
    g.globalAlpha = 0.45 * fade;
    g.fillStyle = "#4c9e9a";
    g.strokeStyle = "#c2ebbe";
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12,
        r = p.radius * (1 + 0.06 * Math.sin(i * 2 + p.id));
      const x = Math.round(p.x + Math.cos(a) * r),
        y = Math.round(p.y + Math.sin(a) * r);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    g.fill();
    g.globalAlpha = 0.6 * fade;
    g.stroke();
    g.fillStyle = "#b4e6cc";
    for (let i = 0; i < 4; i++) {
      const a = i * 2.4 + p.id,
        xx = p.x + Math.cos(a) * p.radius * 0.55,
        yy = p.y + Math.sin(a) * p.radius * 0.55;
      g.fillRect(Math.round(xx), Math.round(yy), 2, 2);
    }
  }
  for (const f of marsh.flowers) {
    const active = f.bloomUntil > state.time;
    if (active) {
      g.fillStyle = "#9ae7c9";
      g.globalAlpha = 0.1;
      g.beginPath();
      g.arc(f.x, f.y, MARSH_RULES.triggerRadius, 0, Math.PI * 2);
      g.fill();
      g.setLineDash([3, 4]);
      ring(g, f.x, f.y, MARSH_RULES.triggerRadius, "#d0ffde", 0.6);
      g.setLineDash([]);
    }
    g.globalAlpha = 1;
    g.fillStyle = "#355c4e";
    g.fillRect(f.x - 2, f.y - 9, 4, 13);
    g.fillStyle = "#58926d";
    g.fillRect(f.x - 10, f.y - 1, 9, 3);
    g.fillRect(f.x + 2, f.y - 5, 10, 3);
    const ready = f.readyAt <= state.time;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        x = f.x + Math.cos(a) * (ready || active ? 10 : 5),
        y = f.y - 13 + Math.sin(a) * (ready || active ? 7 : 4);
      g.fillStyle = active ? "#cefff0" : ready ? "#bf91c7" : "#70658a";
      g.fillRect(Math.round(x) - 4, Math.round(y) - 3, 8, 6);
      g.fillStyle = active ? "#f0ffde" : "#e5b6d5";
      g.fillRect(Math.round(x) - 2, Math.round(y) - 3, 3, 2);
    }
    g.fillStyle = "#4a7c78";
    g.fillRect(f.x - 6, f.y - 18, 12, 11);
    g.fillStyle = active ? "#e4ffe9" : "#e1d594";
    g.fillRect(f.x - 4, f.y - 16, 8, 7);
    g.fillStyle = "#8da67c";
    g.fillRect(f.x - 2, f.y - 14, 2, 2);
    g.fillRect(f.x + 2, f.y - 12, 2, 2);
    if (!ready) {
      const progress =
        1 - (f.readyAt - state.time) / MARSH_RULES.flowerCooldown;
      g.strokeStyle = "#d5ead6";
      g.lineWidth = 1;
      g.beginPath();
      g.arc(
        f.x,
        f.y - 13,
        16,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.max(0, progress),
      );
      g.stroke();
    }
    if (Math.hypot(f.x - state.player.x, f.y - state.player.y) < 85) {
      const label = active
        ? "NECTAR DE CROISSANCE"
        : ready
          ? "FLEUR EPONGE"
          : `REPOS ${Math.ceil(f.readyAt - state.time)}s`;
      g.font = "6px monospace";
      g.textAlign = "center";
      g.fillStyle = "#183229d9";
      g.fillRect(f.x - 43, f.y + 9, 86, 10);
      g.fillStyle = "#e3efd4";
      g.fillText(label, f.x, f.y + 16);
    }
  }
  g.restore();
}
export function drawMarshSlimeStatus(g, monster, state) {
  if ((!monster.marshSlime&&!monster.depthsSlime&&!monster.mountainSlime) || monster.hp <= 0) return;
  const scale = slimeScale(monster),
    y = monster.y - 30 * scale - (monster.lift || 0);
  g.save();
  if (slimeVulnerable(state, monster)) {
    g.fillStyle = "#ffe2a4";
    for (let i = 0; i < 3; i++) {
      const a = state.time * 3 + (i * Math.PI * 2) / 3,
        x = monster.x + Math.cos(a) * 13,
        yy = y + Math.sin(a) * 4;
      g.fillRect(Math.round(x) - 2, Math.round(yy), 5, 1);
      g.fillRect(Math.round(x), Math.round(yy) - 2, 1, 5);
    }
    g.font = "7px monospace";
    g.textAlign = "center";
    g.fillStyle = "#2a2633e0";
    g.fillRect(monster.x - 39, y - 16, 78, 11);
    g.fillStyle = "#ffe2a4";
    g.fillText("VULNERABLE", monster.x, y - 8);
  }
  g.restore();
}
