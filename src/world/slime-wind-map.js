import {
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintPoints,
} from "./map.js";
import { hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const WIND_ENTRY = { x: 75, y: 300 },
  WIND_SPAWN = { x: 100, y: 300 },
  MOUNTAIN_WIND_GATE = { x: 350, y: 145 };
export const PLATEAUS = [
  [
    [35, 170],
    [65, 118],
    [140, 92],
    [201, 120],
    [230, 183],
    [222, 270],
    [204, 342],
    [140, 369],
    [68, 346],
    [32, 282],
  ],
  [
    [270, 128],
    [306, 77],
    [375, 63],
    [420, 106],
    [438, 171],
    [429, 248],
    [439, 305],
    [392, 353],
    [315, 342],
    [270, 293],
  ],
  [
    [474, 151],
    [508, 105],
    [562, 90],
    [606, 129],
    [623, 200],
    [608, 288],
    [576, 345],
    [508, 358],
    [467, 315],
    [458, 236],
  ],
];
export const BRIDGES = [
  { left: 205, right: 288, top: 206, bottom: 236 },
  { left: 414, right: 485, top: 257, bottom: 287 },
];
const regions = [
  ...PLATEAUS,
  ...BRIDGES.map((b) => [
    [b.left, b.top],
    [b.right, b.top],
    [b.right, b.bottom],
    [b.left, b.bottom],
  ]),
];
export const LAND = [
  [25, 80],
  [635, 60],
  [638, 380],
  [20, 385],
];
export const landDistance = (x, y) =>
  Math.max(...regions.map((p) => polygonDistance(x, y, p)));
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const floorDecorations = false;
export const ROADS = [
  {
    width: 18,
    points: [
      [75, 300],
      [137, 274],
      [195, 221],
      [285, 221],
      [345, 244],
      [423, 272],
      [480, 272],
      [540, 303],
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
export function texturePixel(material, x, y) {
  const u = ((Math.floor(x) % 64) + 64) % 64,
    v = ((Math.floor(y) % 64) + 64) % 64,
    n = hash(u, v, 227),
    grain = n % 5,
    patch = Math.round(
      3 * Math.sin((u * Math.PI) / 32) * Math.cos((v * Math.PI) / 32),
    );
  if (material === "dirt") return [180 + grain, 173 + grain, 130 + grain, 255];
  return n % 103 === 0
    ? [190, 208, 153, 255]
    : [113 + grain + patch, 155 + grain + patch, 121 + grain + patch, 255];
}
export function terrainPixel(x, y) {
  const bridge = BRIDGES.find(
    (b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom,
  );
  if (bridge) {
    const n = ((x % 8) + 8) % 8;
    return n === 0
      ? [74, 92, 88, 255]
      : y < bridge.top + 2 || y > bridge.bottom - 2
        ? [98, 103, 82, 255]
        : [167 + n, 151 + n, 108 + n, 255];
  }
  const d = landDistance(x + 0.5, y + 0.5);
  if (d < 0) {
    if (d > -3) return [111, 134, 125, 255];
    if (d > -16)
      return [82, 108 + Math.floor(d / 3), 112 + Math.floor(d / 3), 255];
    const cloud = Math.sin(x * 0.017) * Math.cos(y * 0.031) > 0.55,
      n = hash(x, y, 229) % 3;
    return cloud
      ? [173 + n, 207 + n, 210 + n, 255]
      : [120 + n, 172 + n, 190 + n, 255];
  }
  if (d < 2) return [161, 183, 134, 255];
  return texturePixel(isRoad(x, y) ? "dirt" : "grass", x, y);
}
export const WINDMILLS = [
  { id: "west-windmill", kind: "windmill", x: 100, y: 148 },
  { id: "center-windmill", kind: "windmill", x: 379, y: 125 },
  { id: "east-windmill", kind: "windmill", x: 560, y: 153 },
];
export const PROPS = WINDMILLS.map((p) => ({
  ...p,
  footprint: { type: "circle", radius: 11 },
}));
export const DECORATIONS = [
  [65, 213],
  [170, 149],
  [190, 305],
  [295, 160],
  [401, 186],
  [325, 310],
  [493, 183],
  [583, 238],
  [542, 331],
].map(([x, y], i) => ({ id: `wind-grass-${i}`, kind: "alpine-tuft", x, y }));
export const SOLIDS = PROPS,
  FENCES = [],
  MARKERS = [];
export const canWalkWind = (x, y) =>
  landDistance(x, y) >= 4 && !SOLIDS.some((p) => inFootprint(x, y, p));
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const WIND_SLIMES = [
  { x: 170, y: 145 },
  { x: 195, y: 170 },
  { x: 330, y: 170 },
  { x: 375, y: 285 },
  { x: 535, y: 215 },
  { x: 540, y: 310 },
];
export function validateMap() {
  const errors = [];
  for (const p of [...PROPS, ...DECORATIONS])
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (const p of [WIND_ENTRY, WIND_SPAWN, ...WIND_SLIMES])
    if (!canWalkWind(p.x, p.y)) errors.push("invalid spawn");
  return errors;
}
