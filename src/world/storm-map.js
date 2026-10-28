import { polygonDistance, inFootprint, footprintPoints } from "./map.js";
import { hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const STORM_ENTRY = { x: 65, y: 325 },
  STORM_SPAWN = { x: 95, y: 325 };
export const WIND_STORM_GATE = { x: 575, y: 300 };
export const STORM_BOSS_HOME = { x: 540, y: 190 };
export const ROOMS = [
  { name: "1 · LES SOURCES", x: 25, y: 235, w: 185, h: 140 },
  { name: "2 · LES SOUFFLES", x: 30, y: 60, w: 185, h: 140 },
  { name: "3 · LES BOURRASQUES", x: 255, y: 70, w: 160, h: 280 },
  { name: "4 · L’ŒIL DE LA TEMPÊTE", x: 455, y: 85, w: 170, h: 275 },
];
export const BRIDGES = [
  { x: 102, y: 185, w: 32, h: 65 },
  { x: 198, y: 115, w: 74, h: 32 },
  { x: 400, y: 285, w: 70, h: 32 },
];
const rectangle = (r) => [
  [r.x, r.y],
  [r.x + r.w, r.y],
  [r.x + r.w, r.y + r.h],
  [r.x, r.y + r.h],
];
const chamber = (r) => {
  const k = 14;
  return [
    [r.x + k, r.y],
    [r.x + r.w - k, r.y],
    [r.x + r.w, r.y + k],
    [r.x + r.w, r.y + r.h - k],
    [r.x + r.w - k, r.y + r.h],
    [r.x + k, r.y + r.h],
    [r.x, r.y + r.h - k],
    [r.x, r.y + k],
  ];
};
const regions = [...ROOMS.map(chamber), ...BRIDGES.map(rectangle)];
export const LAND = [
  [20, 50],
  [630, 50],
  [630, 380],
  [20, 380],
];
export const landDistance = (x, y) =>
  Math.max(...regions.map((p) => polygonDistance(x, y, p)));
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const POOLS = [
  { x: 155, y: 277, r: 23 },
  { x: 315, y: 177, r: 22 },
  { x: 365, y: 285, r: 21 },
  { x: 500, y: 165, r: 22 },
  { x: 581, y: 267, r: 23 },
];
export const FLOWERS = [
  { x: 180, y: 340 },
  { x: 285, y: 255 },
  { x: 590, y: 125 },
];
export const PILLARS = [
  { x: 82, y: 115 },
  { x: 180, y: 158 },
  { x: 365, y: 120 },
  { x: 300, y: 310 },
  { x: 490, y: 230 },
  { x: 585, y: 205 },
];
export const PROPS = PILLARS.map((p, i) => ({
  id: `storm-pillar-${i}`,
  kind: "stalagmite",
  ...p,
  footprint: { type: "circle", radius: 9 },
}));
export const DECORATIONS = [],
  SOLIDS = PROPS,
  FENCES = [],
  MARKERS = [];
export const ROADS = [],
  floorDecorations = false;
export const roadDistance = () => Infinity,
  isRoad = () => false;
export const canWalkStorm = (x, y) =>
  landDistance(x, y) >= 4 && !SOLIDS.some((p) => inFootprint(x, y, p));
export const poolAt = (point) =>
  POOLS.find((p) => Math.hypot(point.x - p.x, point.y - p.y) <= p.r);
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const STORM_SLIMES = [
  { x: 155, y: 302, growth: 1, room: 0 },
  { x: 175, y: 345, growth: 2, room: 0 },
  { x: 130, y: 110, growth: 1, room: 1 },
  { x: 160, y: 165, growth: 2, room: 1 },
  { x: 310, y: 185, growth: 2, room: 2 },
  { x: 360, y: 270, growth: 2, room: 2 },
];
export const CURRENTS = [
  { x: 102, y: 85, w: 54, h: 90, room: 1, offset: 0 },
  { x: 274, y: 205, w: 120, h: 45, room: 2, offset: 2 },
  { x: 475, y: 278, w: 130, h: 45, room: 3, offset: 0 },
];
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5),
    n = hash(((x % 64) + 64) % 64, ((y % 64) + 64) % 64, 317) % 5;
  if (d < 0) {
    if (d > -3) return [142, 194, 188, 255];
    if (d > -13) return [58 + n, 99 + n + Math.floor(d / 2), 106 + n, 255];
    return [25 + n, 91 + n, 111 + n, 255];
  }
  const bridge = BRIDGES.find(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
  if (bridge) {
    const seam = (bridge.w > bridge.h ? x : y) % 8 === 0;
    return seam ? [85, 119, 122, 255] : [161 + n, 183 + n, 165 + n, 255];
  }
  if (d < 2) return [164, 201, 173, 255];
  const pool = poolAt({ x, y });
  if (pool) {
    const edge = pool.r - Math.hypot(x - pool.x, y - pool.y);
    return edge < 2 ? [151, 211, 190, 255] : [59 + n, 151 + n, 165 + n, 255];
  }
  const moss = hash(Math.floor(x / 6), Math.floor(y / 6), 321) % 7 === 0;
  if (d < 9 && moss) return [99 + n, 150 + n, 113 + n, 255];
  const seam = (x + (Math.floor(y / 12) % 2) * 8) % 17 === 0 || y % 12 === 0;
  if (hash(x, y, 323) % 173 === 0) return [173, 193, 157, 255];
  const grain = hash(Math.floor(x / 17), Math.floor(y / 12), 329) % 9;
  return seam
    ? [96 + n, 130 + n, 124 + n, 255]
    : [128 + grain + n, 156 + grain + n, 139 + grain + n, 255];
}
export function validateMap() {
  const errors = [];
  for (const p of [...PROPS, ...DECORATIONS])
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (const p of [
    STORM_ENTRY,
    STORM_SPAWN,
    STORM_BOSS_HOME,
    ...STORM_SLIMES,
    ...FLOWERS,
    ...POOLS,
  ])
    if (!canWalkStorm(p.x, p.y))
      errors.push(`invalid storm point ${p.x},${p.y}`);
  return errors;
}
