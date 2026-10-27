import {
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintPoints,
  footprintsOverlap,
} from "./map.js";
import { texturePixel as basePixel } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const MARSH_ENTRY = { x: 70, y: 220 };
export const LAND = [
  [25, 110],
  [65, 80],
  [135, 70],
  [205, 78],
  [300, 53],
  [420, 70],
  [540, 64],
  [605, 110],
  [622, 210],
  [601, 321],
  [533, 369],
  [424, 360],
  [300, 378],
  [182, 365],
  [68, 340],
  [26, 254],
];
const oval = (x, y, rx, ry) =>
  Array.from({ length: 40 }, (_, i) => {
    const a = (i * Math.PI) / 20,
      r = 1 + 0.035 * Math.sin(i * 2.1);
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
export const PONDS = [
  oval(235, 150, 48, 29),
  oval(455, 280, 52, 30),
  oval(135, 285, 38, 25),
];
export const landDistance = (x, y) =>
  Math.min(
    polygonDistance(x, y, LAND),
    ...PONDS.map((pond) => -polygonDistance(x, y, pond)),
  );
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const ROADS = [
  {
    width: 24,
    points: [
      [70, 220],
      [140, 220],
      [220, 225],
      [310, 235],
      [390, 215],
      [465, 200],
      [560, 200],
    ],
  },
  {
    width: 20,
    points: [
      [310, 235],
      [350, 295],
      [385, 335],
      [520, 335],
      [560, 280],
      [560, 200],
    ],
  },
];
export function roadDistance(x, y) {
  let d = Infinity;
  for (const road of ROADS)
    for (let i = 1; i < road.points.length; i++)
      d = Math.min(
        d,
        Math.sqrt(segmentDistanceSq(x, y, road.points[i - 1], road.points[i])) -
          road.width / 2,
      );
  return d;
}
export const isRoad = (x, y) => roadDistance(x, y) <= 0;
export function texturePixel(material, x, y) {
  const p = basePixel(material, x, y);
  if (material === "grass") return [p[0] - 38, p[1] - 10, p[2] + 28, 255];
  if (material === "water") return [p[0] - 5, p[1] + 18, p[2] + 9, 255];
  if (material === "dirt") return [p[0] - 8, p[1] + 1, p[2] + 12, 255];
  return p;
}
export const SPONGE_FLOWERS = [
  { id: "sponge-west", x: 195, y: 235 },
  { id: "sponge-centre", x: 365, y: 180 },
  { id: "sponge-east", x: 530, y: 240 },
];
export const SLIME_SPAWNS = [
  { x: 270, y: 240 },
  { x: 350, y: 265, growth: 2 },
  { x: 465, y: 200 },
  { x: 550, y: 305 },
  { x: 390, y: 340 },
];
const circle = (radius) => ({ type: "circle", radius });
export const PROPS = [
  ...[
    [66, 140],
    [165, 107],
    [318, 107],
    [415, 118],
    [552, 130],
    [590, 245],
    [305, 332],
    [215, 333],
    [78, 324],
  ].map(([x, y], i) => ({
    id: `marsh-mushroom-${i}`,
    kind: "mushroom",
    x,
    y,
    variant: i % 3,
    footprint: circle(7),
  })),
  ...[
    [110, 142],
    [340, 156],
    [525, 95],
    [583, 174],
    [556, 331],
    [251, 306],
  ].map(([x, y], i) => ({
    id: `marsh-rock-${i}`,
    kind: "rock",
    x,
    y,
    footprint: circle(6),
  })),
];
export const DECORATIONS = [
  ...[
    [176, 145],
    [275, 178],
    [392, 267],
    [491, 318],
    [94, 246],
    [182, 315],
    [339, 99],
    [568, 331],
    [65, 263],
    [590, 150],
    [202, 317],
    [512, 268],
  ].map(([x, y], i) => ({
    id: `marsh-reeds-${i}`,
    kind: "reeds",
    x,
    y,
    variant: i % 3,
  })),
  { id: "marsh-sign", kind: "sign", x: 92, y: 190, text: "VILLAGE" },
];
export const WATER_DECORATIONS = [
  { id: "lily-0", kind: "waterlily", x: 235, y: 150 },
  { id: "lily-1", kind: "waterlily", x: 448, y: 278 },
  { id: "lily-2", kind: "waterlily", x: 140, y: 288 },
];
export const FENCES = [];
export const MARKERS = [];
export const SOLIDS = PROPS;
export const placementOnLand = (prop) =>
  footprintPoints(prop).every(([x, y]) => landDistance(x, y) >= 2);
export const canWalkMarsh = (x, y) =>
  x >= 14 &&
  x <= 626 &&
  y >= 65 &&
  y <= 386 &&
  landDistance(x, y) >= 4 &&
  !SOLIDS.some((prop) => inFootprint(x, y, prop));
export function validateMap() {
  const errors = [];
  for (const prop of [...SOLIDS, ...DECORATIONS])
    if (!placementOnLand(prop)) errors.push(`${prop.id}: outside land`);
  for (const prop of WATER_DECORATIONS)
    if (landDistance(prop.x, prop.y) > -6)
      errors.push(`${prop.id}: not on deep water`);
  for (const flower of SPONGE_FLOWERS)
    if (!canWalkMarsh(flower.x, flower.y))
      errors.push(`${flower.id}: inaccessible`);
  for (const p of [MARSH_ENTRY, ...SLIME_SPAWNS])
    if (!canWalkMarsh(p.x, p.y)) errors.push("invalid spawn");
  for (let i = 0; i < SOLIDS.length; i++)
    for (let j = i + 1; j < SOLIDS.length; j++)
      if (footprintsOverlap(SOLIDS[i], SOLIDS[j]))
        errors.push("overlapping props");
  return errors;
}
