import {
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintPoints,
} from "./map.js";
import { hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const FIRE_ENTRY = { x: 75, y: 300 };
export const FIRE_SPAWN = { x: 100, y: 300 };
export const LAND = [
  [22, 135],
  [72, 85],
  [190, 66],
  [280, 82],
  [375, 58],
  [500, 68],
  [610, 118],
  [625, 240],
  [595, 360],
  [470, 382],
  [325, 365],
  [200, 380],
  [65, 355],
  [25, 290],
];
export const LAVA_POOLS = [
  [
    [165, 120],
    [208, 102],
    [248, 125],
    [236, 177],
    [192, 185],
    [165, 160],
  ],
  [
    [380, 210],
    [421, 183],
    [465, 207],
    [474, 258],
    [442, 284],
    [390, 268],
  ],
  [
    [500, 106],
    [541, 99],
    [575, 132],
    [553, 169],
    [509, 156],
  ],
];
export const landDistance = (x, y) =>
  Math.min(
    polygonDistance(x, y, LAND),
    ...LAVA_POOLS.map((p) => -polygonDistance(x, y, p)),
  );
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const ROADS = [
  {
    width: 22,
    points: [
      [75, 300],
      [142, 278],
      [210, 245],
      [300, 220],
      [340, 160],
      [420, 135],
      [475, 155],
    ],
  },
];
export const roadDistance = (x, y) =>
  Math.min(
    ...ROADS.flatMap((r) =>
      r.points
        .slice(1)
        .map(
          (p, i) =>
            Math.sqrt(segmentDistanceSq(x, y, r.points[i], p)) - r.width / 2,
        ),
    ),
  );
export const isRoad = (x, y) => roadDistance(x, y) <= 0;
export const floorDecorations = false;
export function texturePixel(material, x, y) {
  const u = ((Math.floor(x) % 64) + 64) % 64,
    v = ((Math.floor(y) % 64) + 64) % 64,
    n = hash(u, v, 197),
    grain = n % 7;
  if (material === "dirt") return [115 + grain, 83 + grain, 67 + grain, 255];
  const patch = Math.round(
    3 * Math.sin((u * Math.PI) / 32) * Math.cos((v * Math.PI) / 32),
  );
  return n % 83 === 0
    ? [151, 116, 88, 255]
    : [72 + grain + patch, 66 + grain + patch, 65 + grain + patch, 255];
}
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5);
  if (d < 0) {
    const n = hash(Math.floor(x / 3), Math.floor(y / 3), 201) % 15;
    if (d > -3) return [110, 48, 34, 255];
    const vein = (Math.floor(x / 8) + Math.floor(y / 6)) % 5 === 0;
    return vein ? [255, 188 + n, 76, 255] : [197 + n, 66 + n, 30, 255];
  }
  if (d < 3) return [144, 86, 55, 255];
  return texturePixel(isRoad(x, y) ? "dirt" : "basalt", x, y);
}
export const PROPS = [
  [130, 140],
  [290, 115],
  [340, 315],
  [540, 300],
  [580, 218],
  [255, 335],
].map(([x, y], i) => ({
  id: `basalt-${i}`,
  kind: "mountain-boulder",
  x,
  y,
  variant: i % 3,
  footprint: { type: "circle", radius: 14 },
}));
export const DECORATIONS = [];
export const SOLIDS = PROPS;
export const FENCES = [],
  MARKERS = [];
export const canWalkFire = (x, y) =>
  landDistance(x, y) >= 4 && !SOLIDS.some((p) => inFootprint(x, y, p));
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const FIRE_SLIMES = [
  { x: 175, y: 245 },
  { x: 280, y: 195 },
  { x: 340, y: 125 },
  { x: 355, y: 275 },
  { x: 490, y: 320 },
  { x: 560, y: 195 },
];
export function validateMap() {
  const errors = [];
  for (const p of PROPS)
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (const p of [FIRE_ENTRY, FIRE_SPAWN, ...FIRE_SLIMES])
    if (!canWalkFire(p.x, p.y)) errors.push("invalid spawn");
  return errors;
}
