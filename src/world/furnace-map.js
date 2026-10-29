import { polygonDistance, inFootprint, footprintPoints } from "./map.js";
import { hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const FURNACE_ENTRY = { x: 55, y: 335 },
  FURNACE_SPAWN = { x: 85, y: 335 };
export const FIRE_FURNACE_GATE = { x: 535, y: 325 },
  FURNACE_BOSS_HOME = { x: 480, y: 200 };
export const ROOMS = [
  { name: "1 · FORGES ÉTEINTES", x: 25, y: 265, w: 190, h: 110 },
  { name: "2 · SOUFFLERIES", x: 30, y: 150, w: 185, h: 85 },
  { name: "3 · CHEMINÉES ROUGES", x: 35, y: 35, w: 195, h: 85 },
  { name: "4 · LE GRAND FOYER", x: 330, y: 60, w: 290, h: 300 },
];
export const BRIDGES = [
  { x: 100, y: 220, w: 32, h: 60 },
  { x: 110, y: 105, w: 32, h: 60 },
  { x: 215, y: 76, w: 135, h: 34 },
];
const rect = (r) => [
  [r.x, r.y],
  [r.x + r.w, r.y],
  [r.x + r.w, r.y + r.h],
  [r.x, r.y + r.h],
];
const chamber = (r) => {
  const k = 12;
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
const regions = [...ROOMS.map(chamber), ...BRIDGES.map(rect)];
export const LAND = [
  [20, 20],
  [630, 20],
  [630, 385],
  [20, 385],
];
export const landDistance = (x, y) =>
  Math.max(...regions.map((p) => polygonDistance(x, y, p)));
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const PILLARS = [
  { x: 50, y: 290 },
  { x: 190, y: 195 },
  { x: 62, y: 62 },
  { x: 600, y: 95 },
  { x: 350, y: 325 },
  { x: 593, y: 324 },
];
export const PROPS = PILLARS.map((p, i) => ({
  id: `furnace-pillar-${i}`,
  kind: "stalagmite",
  ...p,
  footprint: { type: "circle", radius: 9 },
}));
export const FORGES = [
  { id: "forge-south", x: 60, y: 350 },
  { id: "forge-north", x: 185, y: 285 },
  { id: "chimney-forge-west", x: 67, y: 95 },
  { id: "chimney-forge-east", x: 200, y: 95 },
].map((p) => ({ ...p, footprint: { type: "circle", radius: 11 } }));
export const DECORATIONS = [],
  FENCES = [],
  MARKERS = [],
  SOLIDS = [...PROPS, ...FORGES];
export const ROADS = [],
  floorDecorations = false,
  roadDistance = () => Infinity,
  isRoad = () => false;
export const canWalkFurnace = (x, y) =>
  landDistance(x, y) >= 4 && !SOLIDS.some((p) => inFootprint(x, y, p));
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const BRAZIERS = [
  { id: "chimney-west", x: 95, y: 68, room: 2 },
  { id: "chimney-east", x: 183, y: 87, room: 2 },
  { id: "foyer-west", x: 420, y: 145, room: 3 },
  { id: "foyer-east", x: 555, y: 150, room: 3 },
  { id: "foyer-south", x: 505, y: 285, room: 3 },
];
export const CURRENTS = [
  { x: 65, y: 169, w: 100, h: 42, offset: 0 },
  { x: 225, y: 78, w: 100, h: 30, offset: 2 },
];
export const FURNACE_SLIMES = [
  { x: 150, y: 310, room: 0 },
  { x: 172, y: 350, room: 0 },
  { x: 97, y: 185, room: 1 },
  { x: 162, y: 191, room: 1 },
  { x: 114, y: 80, room: 2 },
  { x: 190, y: 60, room: 2 },
];
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5),
    n = hash(((x % 64) + 64) % 64, ((y % 64) + 64) % 64, 401) % 7;
  if (d < 0) {
    if (d > -3) return [148, 72, 45, 255];
    if (d > -12) return [74 + n, 42 + n, 40 + n, 255];
    const flow =
      Math.sin(x * 0.038 + Math.sin(y * 0.027) * 1.6) +
      Math.cos(y * 0.045 + Math.sin(x * 0.022));
    return flow > 1.5
      ? [235, 134 + n, 50, 255]
      : flow > 0.5
        ? [174 + n, 62 + n, 36 + n, 255]
        : [112 + n, 42 + n, 36 + n, 255];
  }
  const bridge = BRIDGES.find(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
  if (bridge) {
    const seam = (bridge.w > bridge.h ? x : y) % 7 === 0;
    return seam ? [44, 44, 49, 255] : [103 + n, 85 + n, 74 + n, 255];
  }
  if (d < 2) return [164, 111, 77, 255];
  const seam = (x + (Math.floor(y / 14) % 2) * 10) % 21 === 0 || y % 14 === 0;
  const tint = hash(Math.floor(x / 21), Math.floor(y / 14), 409) % 9;
  if (hash(x, y, 411) % 137 === 0) return [180, 112, 65, 255];
  return seam
    ? [52 + n, 47 + n, 49 + n, 255]
    : [83 + n + tint, 69 + n + tint, 67 + n + tint, 255];
}
export function validateMap() {
  const errors = [];
  for (const p of SOLIDS)
    if (!placementOnLand(p)) errors.push(`${p.id}: outside floor`);
  for (const p of [
    FURNACE_ENTRY,
    FURNACE_SPAWN,
    FURNACE_BOSS_HOME,
    ...FURNACE_SLIMES,
    ...BRAZIERS,
  ])
    if (!canWalkFurnace(p.x, p.y))
      errors.push(`invalid furnace point ${p.x},${p.y}`);
  return errors;
}
