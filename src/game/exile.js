import {
  SERVICES,
  ROADS,
  canWalkExile,
  EXILE_SPAWN,
} from "../world/exile-map.js";
export function createExileWorld() {
  const bots = [];
  for (let i = 0; i < 16; i++) {
    const road = ROADS[i % ROADS.length],
      index = 2 + (i % (road.points.length - 4)),
      p = road.points[index];
    bots.push({
      id: `exile-walker-${i}`,
      name: [
        "Naël",
        "Alma",
        "Tilio",
        "Éloi",
        "Rose",
        "Nell",
        "Ivo",
        "Lune",
        "Perrin",
        "Malo",
        "Sol",
        "Adèle",
        "Léon",
        "Sana",
        "Olwen",
        "Brune",
      ][i],
      role: ["melee", "support", "ranged"][i % 3],
      x: p[0],
      y: p[1],
      facing: "down",
      moving: false,
      phase: i,
      route: i % ROADS.length,
      waypoint: index,
      routeDirection: i % 2 ? 1 : -1,
      pause: i * 0.17,
      target: { x: p[0], y: p[1] },
    });
  }
  return {
    monsters: [],
    bots,
    npcs: Object.values(SERVICES).map((p) => ({ ...p, equipment: {} })),
    trees: [],
  };
}
export function stepExileResidents(s, dt) {
  if (s.zone !== "exile") return;
  for (const b of s.bots) {
    b.pause = Math.max(0, b.pause - dt);
    if (b.pause) {
      b.moving = false;
      continue;
    }
    const road = ROADS[b.route],
      p = road.points[b.waypoint];
    const dx = p[0] - b.x,
      dy = p[1] - b.y,
      d = Math.hypot(dx, dy);
    if (d < 4) {
      if (
        b.waypoint + b.routeDirection >= road.points.length ||
        b.waypoint + b.routeDirection < 0
      ) {
        b.routeDirection *= -1;
        b.pause = 1.5 + (b.phase % 3);
      }
      b.waypoint += b.routeDirection;
      b.phase++;
      if (b.phase % 7 === 0) b.pause = 1 + (b.phase % 4);
      b.moving = false;
      continue;
    }
    const speed = 19 + (b.phase % 4) * 3,
      step = Math.min(d, speed * dt);
    let nx = b.x + (dx / d) * step,
      ny = b.y + (dy / d) * step;
    if (canWalkExile(nx, ny)) {
      b.x = nx;
      b.y = ny;
      b.moving = true;
      b.facing =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
    } else {
      b.routeDirection *= -1;
      b.waypoint = Math.max(
        0,
        Math.min(road.points.length - 1, b.waypoint + b.routeDirection),
      );
      b.pause = 0.8;
    }
  }
}
export function nearExileResident(s) {
  if (s.zone !== "exile" || s.team[s.main].hp <= 0) return null;
  return (
    s.npcs
      .filter((p) => Math.hypot(p.x - s.player.x, p.y - s.player.y) < 43)
      .sort(
        (a, b) =>
          Math.hypot(a.x - s.player.x, a.y - s.player.y) -
          Math.hypot(b.x - s.player.x, b.y - s.player.y),
      )[0] || null
  );
}
export const EXILE_CHECKPOINT = EXILE_SPAWN;
