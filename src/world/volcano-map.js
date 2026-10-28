import {
  polygonDistance,
  inFootprint,
  footprintPoints,
  segmentDistanceSq,
} from "./map.js";
import { texturePixel } from "./slime-fire-map.js";
export { texturePixel };
export const MAP_SIZE = { width: 640, height: 400 };
export const VOLCANO_ENTRY = { x: 70, y: 310 },
  VOLCANO_SPAWN = { x: 100, y: 310 },
  VOLCANO_BOSS_HOME = { x: 480, y: 185 };
export const LAND = [
  [25, 185],
  [65, 130],
  [170, 90],
  [265, 65],
  [405, 48],
  [535, 64],
  [610, 120],
  [625, 240],
  [590, 350],
  [465, 382],
  [305, 373],
  [170, 385],
  [55, 355],
  [22, 285],
];
export const LAVA_POOLS = [
  [
    [155, 155],
    [199, 132],
    [244, 146],
    [264, 185],
    [225, 214],
    [174, 205],
  ],
  [
    [296, 270],
    [340, 245],
    [385, 270],
    [371, 321],
    [326, 335],
    [294, 310],
  ],
  [
    [388, 93],
    [430, 76],
    [462, 99],
    [447, 128],
    [405, 132],
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
    width: 24,
    points: [
      [70, 310],
      [155, 290],
      [265, 240],
      [320, 195],
      [400, 185],
      [480, 185],
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
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5);
  if (d < 0) {
    if (d > -3) return [118, 46, 34, 255];
    const n = (Math.floor(x / 6) + Math.floor(y / 4)) % 7;
    return [199 + n * 5, 62 + n * 9, 28 + n * 3, 255];
  }
  if (d < 3) return [151, 81, 46, 255];
  return texturePixel(isRoad(x, y) ? "dirt" : "basalt", x, y);
}
export const PROPS = [
  [115, 187],
  [276, 130],
  [270, 335],
  [555, 288],
  [583, 185],
  [355, 105],
].map(([x, y], i) => ({
  id: `volcanic-rock-${i}`,
  kind: "mountain-boulder",
  x,
  y,
  variant: i % 3,
  footprint: { type: "circle", radius: 14 },
}));
export const DECORATIONS = [],
  FENCES = [],
  MARKERS = [];
export const SOLIDS = PROPS;
export const canWalkVolcano = (x, y) =>
  landDistance(x, y) >= 4 && !SOLIDS.some((p) => inFootprint(x, y, p));
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export const MAGMA_SLIMES = [
  { x: 155, y: 265 },
  { x: 260, y: 265 },
  { x: 305, y: 175 },
  { x: 360, y: 190 },
  { x: 435, y: 310 },
];
export const FIRE_VOLCANO_GATE = { x: 470, y: 155 };
export function validateMap() {
  const errors = [];
  for (const p of PROPS)
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (const p of [
    VOLCANO_ENTRY,
    VOLCANO_SPAWN,
    VOLCANO_BOSS_HOME,
    ...MAGMA_SLIMES,
  ])
    if (!canWalkVolcano(p.x, p.y)) errors.push("invalid spawn");
  return errors;
}
