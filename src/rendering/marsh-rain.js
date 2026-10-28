import { hash } from "./textures.js";
import { isLand, SEA_SINKHOLE } from "../world/slime-marsh-map.js";
const wrap = (n, size) => ((n % size) + size) % size;
const drops = Array.from({ length: 320 }, (_, i) => ({
  x: hash(i, 1, 103) % 700,
  y: hash(i, 2, 103) % 450,
  speed: 165 + (hash(i, 3, 103) % 135),
  length: 6 + (hash(i, 4, 103) % 8),
}));
const splashes = Array.from({ length: 100 }, (_, i) => {
  const x = hash(i, 5, 107) % 640,
    y = hash(i, 6, 107) % 400;
  return {
    x,
    y,
    water: !isLand(x, y),
    phase: (hash(i, 7, 107) % 1000) / 1000,
    period: 0.55 + (hash(i, 8, 107) % 500) / 1000,
  };
}).filter((p) => Math.hypot(p.x - SEA_SINKHOLE.x, p.y - SEA_SINKHOLE.y) > 32);
export function createMarshRain() {
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  function streaks(g, s, front) {
    if (s.zone !== "slime-marsh") return;
    const still = reduced?.matches,
      time = still ? 0 : s.time;
    const start = front ? 220 : 0,
      end = front ? 320 : 220;
    g.save();
    g.fillStyle = front ? "#d1e9ef" : "#abcbdc";
    g.globalAlpha = front ? 0.28 : 0.16;
    for (let i = start; i < end; i++) {
      if (still && i % 4) continue;
      const p = drops[i],
        x = Math.round(wrap(p.x - time * p.speed * 0.28, 700) - 30),
        y = Math.round(wrap(p.y + time * p.speed, 450) - 25);
      const length = front ? p.length + 3 : p.length;
      for (let d = 0; d < length; d += 2)
        g.fillRect(x - Math.round(d * 0.28), y + d, 1, 2);
    }
    g.restore();
  }
  return {
    ground(g, s) {
      if (s.zone !== "slime-marsh") return;
      const time = reduced?.matches ? 0 : s.time;
      g.save();
      g.fillStyle = "#23415e";
      g.globalAlpha = 0.16;
      g.fillRect(0, 0, 640, 400);
      // Rain ripples are small and pale, distinct from the large slime puddles.
      for (const p of splashes) {
        const phase = wrap(time / p.period + p.phase, 1);
        if (phase > 0.7) continue;
        const age = phase / 0.7,
          r = 1 + Math.floor(age * 4);
        g.globalAlpha = (1 - age) * (p.water ? 0.42 : 0.34);
        g.fillStyle = "#badfe4";
        if (p.water) {
          g.fillRect(p.x - r, p.y, r * 2 + 1, 1);
          g.fillRect(p.x - r + 1, p.y - 1, 1, 1);
          g.fillRect(p.x + r - 1, p.y + 1, 1, 1);
        } else {
          g.fillRect(p.x - r, p.y - 1, 2, 1);
          g.fillRect(p.x + r - 1, p.y, 2, 1);
          if (age < 0.35) g.fillRect(p.x, p.y - 3 - Math.floor(age * 5), 1, 2);
        }
      }
      g.restore();
      streaks(g, s, false);
    },
    foreground(g, s) {
      streaks(g, s, true);
    },
  };
}
