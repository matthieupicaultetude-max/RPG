import { polygonDistance, inFootprint, footprintPoints } from "./map.js";
import { texturePixel as basePixel, hash } from "../rendering/textures.js";
export const MAP_SIZE = { width: 640, height: 400 };
export const DEPTHS_BOSS_HOME = { x: 462, y: 292 };
export const DEPTHS_ENTRY = { x: 88, y: 210 };
export const DEPTHS_SPAWN = { x: 105, y: 230 };
export const LAND = [
  [28, 120],
  [55, 78],
  [140, 63],
  [210, 80],
  [265, 50],
  [365, 48],
  [415, 78],
  [520, 65],
  [600, 112],
  [614, 210],
  [590, 290],
  [610, 342],
  [540, 377],
  [430, 365],
  [365, 382],
  [255, 371],
  [190, 380],
  [85, 355],
  [35, 295],
];
const oval = (x, y, rx, ry) =>
  Array.from({ length: 40 }, (_, i) => {
    const a = (i * Math.PI) / 20,
      r = 1 + 0.035 * Math.sin(i * 2.1);
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
export const PONDS = [
  oval(160, 145, 51, 27),
  oval(320, 157, 62, 30),
  oval(548, 220, 35, 30),
  oval(270, 310, 58, 28),
];
export const landDistance = (x, y) =>
  Math.min(
    polygonDistance(x, y, LAND),
    ...PONDS.map((p) => -polygonDistance(x, y, p)),
  );
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const roadDistance = () => Infinity;
export const isRoad = () => false;
export const floorDecorations = false;
export function texturePixel(material, x, y) {
  const u = ((Math.floor(x) % 64) + 64) % 64,
    v = ((Math.floor(y) % 64) + 64) % 64;
  const p = basePixel(material, x, y),
    grain = hash(u, v, 91),
    n = grain % 5;
  if (material === "water") return [17 + n, 47 + n, 61 + n, 255];
  if (material === "grass") {
    const patch = Math.round(
      3 * Math.sin((u * Math.PI) / 32) * Math.cos((v * Math.PI) / 32),
    );
    if (grain % 83 === 0) return [91, 115, 119, 255];
    if (
      hash(Math.floor(u / 4), Math.floor(v / 4), 39) % 31 === 0 &&
      u % 4 < 2 &&
      v % 4 < 2
    )
      return [73 + n, 88 + n, 95 + n, 255];
    return [51 + patch + n, 66 + patch + n, 75 + patch + n, 255];
  }
  return [p[0] * 0.28, p[1] * 0.35, p[2] * 0.43, 255];
}
// Material boundaries share the exact same signed-distance geometry as collision.
export function terrainPixel(x, y) {
  const d = landDistance(x + 0.5, y + 0.5),
    outer = polygonDistance(x + 0.5, y + 0.5, LAND);
  if (outer < -5) {
    const n = hash(x, y, 43) % 4;
    return [18 + n, 25 + n, 35 + n, 255];
  }
  if (d < -4) return texturePixel("water", x, y);
  if (d < 0) return d < -2 ? [66, 105, 112, 255] : texturePixel("stone", x, y);
  const p = texturePixel("grass", x, y);
  return d < 3 ? [50, 76, 78, 255] : p;
}
export const PROPS = [
  [65, 140],
  [238, 110],
  [415, 100],
  [580, 145],
  [192, 238],
  [325, 350],
  [525, 345],
  [64, 315],
].map(([x, y], i) => ({
  id: `depths-rock-${i}`,
  kind: "stalagmite",
  x,
  y,
  footprint: { type: "circle", radius: 7 },
}));
export const DECORATIONS = [
  [90, 280],
  [232, 205],
  [375, 202],
  [480, 285],
  [209, 345],
  [580, 310],
].map(([x, y], i) => ({ id: `depths-reeds-${i}`, kind: "reeds", x, y }));
export const FENCES = [],
  MARKERS = [];
export const placementOnLand = (prop) =>
  footprintPoints(prop).every(([x, y]) => landDistance(x, y) >= 2);
// Outer cave edges and stalagmites are rock; pool shores are not.
export const isDepthsRockImpact=(x,y)=>polygonDistance(x,y,LAND)<4||PROPS.some(p=>inFootprint(x,y,p));
export const canWalkDepths = (x, y) =>
  landDistance(x, y) >= 4 && !PROPS.some((p) => inFootprint(x, y, p));
export const DEPTHS_SLIMES = [
  { species: "depths-water-slime", x: 350, y: 245, growth: 2 },
  { species: "depths-earth-slime", x: 380, y: 250, growth: 1 },
  { species: "depths-water-slime", x: 450, y: 135, growth: 1 },
  { species: "depths-earth-slime", x: 480, y: 160, growth: 2 },
  { species: "depths-water-slime", x: 400, y: 320, growth: 2 },
  { species: "depths-earth-slime", x: 440, y: 330, growth: 1 },
  { species: "depths-water-slime", x: 545, y: 285, growth: 1 },
];
export function validateMap() {
  const errors = [];
  for (const prop of [...PROPS, ...DECORATIONS])
    if (!placementOnLand(prop)) errors.push(`${prop.id}: outside land`);
  for (const p of [DEPTHS_ENTRY, DEPTHS_SPAWN, DEPTHS_BOSS_HOME, ...DEPTHS_SLIMES])
    if (!canWalkDepths(p.x, p.y)) errors.push("invalid spawn");
  return errors;
}
