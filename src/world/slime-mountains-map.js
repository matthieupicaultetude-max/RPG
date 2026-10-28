import {
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintPoints,
  footprintsOverlap,
} from "./map.js";
import { hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const MOUNTAIN_ENTRY = { x: 75, y: 300 };
export const MOUNTAIN_SPAWN = { x: 100, y: 300 };
export const LAND = [
  [20, 95],
  [78, 65],
  [220, 65],
  [294, 42],
  [405, 43],
  [455, 74],
  [550, 55],
  [628, 115],
  [635, 321],
  [585, 380],
  [62, 378],
  [20, 325],
];
export const PLATEAUS = [
  [
    [36, 150],
    [70, 100],
    [168, 95],
    [219, 140],
    [236, 208],
    [220, 280],
    [235, 327],
    [180, 354],
    [88, 350],
    [37, 310],
  ],
  [
    [276, 115],
    [302, 80],
    [382, 74],
    [425, 118],
    [430, 210],
    [416, 260],
    [437, 320],
    [394, 357],
    [312, 350],
    [270, 305],
    [275, 230],
  ],
  [
    [470, 140],
    [493, 102],
    [545, 84],
    [594, 120],
    [616, 177],
    [608, 246],
    [618, 310],
    [571, 352],
    [501, 355],
    [464, 321],
    [451, 263],
    [460, 207],
  ],
];
export const BRIDGES = [
  { id: "west-bridge", left: 210, right: 296, top: 198, bottom: 226 },
  { id: "east-bridge", left: 410, right: 493, top: 245, bottom: 275 },
];
const bridgePolygon = (b) => [
  [b.left, b.top],
  [b.right, b.top],
  [b.right, b.bottom],
  [b.left, b.bottom],
];
const regions = [...PLATEAUS, ...BRIDGES.map(bridgePolygon)];
export const landDistance = (x, y) =>
  Math.max(...regions.map((p) => polygonDistance(x, y, p)));
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const floorDecorations = false;
export const ROADS = [
  {
    width: 19,
    points: [
      [75, 300],
      [120, 275],
      [150, 235],
      [220, 212],
      [290, 212],
      [340, 235],
      [420, 260],
      [480, 260],
      [535, 285],
    ],
  },
];
export function roadDistance(x, y) {
  let d = Infinity;
  for (const r of ROADS)
    for (let i = 1; i < r.points.length; i++)
      d = Math.min(
        d,
        Math.sqrt(segmentDistanceSq(x, y, r.points[i - 1], r.points[i])) -
          r.width / 2,
      );
  return d;
}
export const isRoad = (x, y) => roadDistance(x, y) <= 0;
export function texturePixel(material, x, y) {
  const u = ((Math.floor(x) % 64) + 64) % 64,
    v = ((Math.floor(y) % 64) + 64) % 64,
    n = hash(u, v, 151),
    grain = n % 6;
  if (material === "dirt")
    return n % 97 === 0
      ? [204, 183, 137, 255]
      : [174 + grain, 158 + grain, 122 + grain, 255];
  const patch = Math.round(
    4 * Math.sin((u * Math.PI) / 32) * Math.cos((v * Math.PI) / 32),
  );
  if (n % 71 === 0) return [171, 178, 167, 255];
  if (
    hash(Math.floor(u / 4), Math.floor(v / 4), 59) % 23 === 0 &&
    u % 4 < 2 &&
    v % 4 < 2
  )
    return [126, 141, 131, 255];
  return [137 + grain + patch, 148 + grain + patch, 142 + grain + patch, 255];
}
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5),
    bridge = BRIDGES.find(
      (b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom,
    );
  if (bridge) {
    const seam = ((x % 8) + 8) % 8;
    return seam === 0
      ? [79, 68, 55, 255]
      : y < bridge.top + 2 || y > bridge.bottom - 2
        ? [94, 76, 54, 255]
        : [159 + seam, 130 + seam, 84 + seam, 255];
  }
  if (d < 0) {
    if (d > -5) return [78, 89, 89, 255];
    if (d > -20) {
      const band = Math.floor(-d / 5),
        n = hash(x, y, 137) % 5;
      return [87 - band * 9 + n, 97 - band * 8 + n, 99 - band * 6 + n, 255];
    }
    const n = hash(x, y, 139) % 4;
    return [44 + n, 61 + n, 77 + n, 255];
  }
  if (d < 2) return [181, 183, 161, 255];
  return texturePixel(isRoad(x, y) ? "dirt" : "stone", x, y);
}
const rock = (id, x, y, radius = 14) => ({
  id,
  kind: "mountain-boulder",
  x,
  y,
  variant: id.length % 3,
  footprint: { type: "circle", radius },
});
const wall = (id, x, y) => ({
  id,
  kind: "mountain-ridge",
  x,
  y,
  footprint: { type: "box", left: -28, right: 28, top: -6, bottom: 7 },
});
export const PROPS = [
  rock("west-training-rock", 190, 205),
  rock("west-upper-rock", 95, 130, 12),
  wall("west-wall", 165, 325),
  wall("central-wall", 350, 106),
  rock("central-east-rock", 385, 230, 16),
  rock("central-low-rock", 310, 315, 12),
  rock("central-south-rock", 400, 310),
  wall("east-wall", 550, 132),
  rock("east-lower-rock", 570, 285),
  rock("east-south-rock", 500, 325),
];
export const DECORATIONS = [
  ...[
    [70, 220],
    [182, 135],
    [210, 310],
    [295, 150],
    [410, 165],
    [368, 328],
    [476, 185],
    [594, 238],
    [546, 336],
  ].map(([x, y], i) => ({ id: `alpine-tuft-${i}`, kind: "alpine-tuft", x, y })),
  { id: "mountain-sign", kind: "sign", x: 90, y: 272, text: "VILLAGE" },
];
export const FENCES = [],
  MARKERS = [];
export const SOLIDS = PROPS;
export const isMountainImpact = (x, y) =>
  SOLIDS.some((p) => inFootprint(x, y, p));
export const canWalkMountains = (x, y) =>
  landDistance(x, y) >= 4 && !isMountainImpact(x, y);
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const MOUNTAIN_SLIMES = [
  { x: 130, y: 175 },
  { x: 175, y: 145 },
  { x: 325, y: 180 },
  { x: 350, y: 285 },
  { x: 520, y: 195 },
  { x: 535, y: 310 },
];
export function validateMap() {
  const errors = [];
  for (const p of [...PROPS, ...DECORATIONS])
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (const p of [MOUNTAIN_ENTRY, MOUNTAIN_SPAWN, ...MOUNTAIN_SLIMES])
    if (!canWalkMountains(p.x, p.y)) errors.push("invalid spawn");
  for (let i = 0; i < SOLIDS.length; i++)
    for (let j = i + 1; j < SOLIDS.length; j++)
      if (footprintsOverlap(SOLIDS[i], SOLIDS[j]))
        errors.push("overlapping rocks");
  return errors;
}
