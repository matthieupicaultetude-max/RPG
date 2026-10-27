import {
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintPoints,
  footprintsOverlap,
} from "./map.js";

export const MAP_SIZE = { width: 640, height: 400 };
export const TUTORIAL_SPAWN = { x: 230, y: 250 };
export const TUTORIAL_COMBAT = { x: 430, y: 255 };
export const TUTORIAL_MONSTER = { x: 470, y: 245 };
export const TUTORIAL_EXIT = { x: 570, y: 255 };
export const LAND = [
  [32, 150],
  [58, 112],
  [105, 96],
  [200, 94],
  [268, 108],
  [330, 97],
  [400, 104],
  [468, 90],
  [555, 110],
  [597, 148],
  [615, 210],
  [608, 292],
  [577, 345],
  [507, 364],
  [419, 358],
  [343, 371],
  [258, 356],
  [181, 367],
  [97, 350],
  [49, 313],
  [29, 246],
];
export const landDistance = (x, y) => polygonDistance(x, y, LAND);
export const isLand = (x, y) => landDistance(x, y) >= 0;
export const ROADS = [
  {
    width: 25,
    points: [
      [135, 200],
      [137, 220],
      [167, 238],
      [230, 250],
      [291, 258],
      [350, 256],
      [410, 248],
      [460, 245],
      [570, 255],
    ],
  },
  {
    width: 21,
    points: [
      [230, 250],
      [255, 291],
      [316, 310],
      [367, 287],
      [410, 248],
    ],
  },
];
export function roadDistance(x, y) {
  let distance = Math.hypot(x - 467, y - 252) - 60;
  for (const road of ROADS)
    for (let i = 1; i < road.points.length; i++)
      distance = Math.min(
        distance,
        Math.sqrt(segmentDistanceSq(x, y, road.points[i - 1], road.points[i])) -
          road.width / 2,
      );
  return distance;
}
export const isRoad = (x, y) => roadDistance(x, y) <= 0;
const circle = (radius) => ({ type: "circle", radius });
export const PROPS = [
  {
    id: "academy",
    kind: "house",
    x: 135,
    y: 200,
    footprint: { type: "box", left: -58, right: 54, top: -46, bottom: 0 },
  },
  ...[
    [61, 204],
    [83, 302],
    [157, 331],
    [281, 142],
    [346, 142],
    [412, 145],
    [536, 152],
    [578, 311],
    [477, 331],
    [349, 338],
  ].map(([x, y], i) => ({
    id: `academy-tree-${i}`,
    kind: "tree",
    x,
    y,
    variant: i % 3,
    wood: "ash",
    footprint: circle(9),
    rootRadius: 12,
  })),
  {
    id: "supplies",
    kind: "crate",
    x: 210,
    y: 170,
    footprint: { type: "box", left: -9, right: 9, top: -6, bottom: 0 },
  },
  { id: "water-barrel", kind: "barrel", x: 75, y: 215, footprint: circle(6) },
  {
    id: "rest-bench",
    kind: "bench",
    x: 301,
    y: 342,
    footprint: { type: "box", left: -18, right: 18, top: -4, bottom: 1 },
  },
];
export const DECORATIONS = [
  { id: "welcome-sign", kind: "sign", x: 195, y: 222, text: "ACCUEIL" },
  { id: "arena-sign", kind: "sign", x: 389, y: 218, text: "ENTRAINEMENT" },
  { id: "exit-sign", kind: "sign", x: 556, y: 286, text: "VILLAGE" },
  ...[
    [91, 180],
    [158, 179],
    [210, 310],
    [373, 316],
    [546, 194],
    [566, 323],
  ].map(([x, y], i) => ({ id: `academy-flowers-${i}`, kind: "flowers", x, y })),
];
export const FENCES = [
  { x1: 391, x2: 525, y: 190 },
  { x1: 396, x2: 525, y: 315 },
].map((f, i) => ({
  ...f,
  id: `academy-fence-${i}`,
  kind: "fence",
  x: f.x1,
  footprint: { type: "box", left: 0, right: f.x2 - f.x1, top: -2, bottom: 4 },
}));
export const SOLIDS = [...PROPS, ...FENCES];
export const MARKERS = [
  { x: 230, y: 276, text: "PLACE DES PREMIERS PAS" },
  { x: 467, y: 285, text: "COUR DES EPREUVES" },
];
export const NPCS = [
  {
    id: "iris",
    name: "Iris · Guide",
    role: "support",
    x: 199,
    y: 190,
    facing: "down",
    moving: false,
    equipment: {},
  },
];
export const placementOnLand = (prop) =>
  footprintPoints(prop).every(([x, y]) => landDistance(x, y) >= 2);
export const canWalkTutorial = (x, y) =>
  x >= 14 &&
  x <= 626 &&
  y >= 65 &&
  y <= 386 &&
  landDistance(x, y) >= 5 &&
  !SOLIDS.some((prop) => inFootprint(x, y, prop));
export function validateMap() {
  const errors = [];
  for (const prop of [...SOLIDS, ...DECORATIONS])
    if (!placementOnLand(prop)) errors.push(`${prop.id}: outside land`);
  for (let i = 0; i < SOLIDS.length; i++)
    for (let j = i + 1; j < SOLIDS.length; j++)
      if (footprintsOverlap(SOLIDS[i], SOLIDS[j]))
        errors.push(`${SOLIDS[i].id}/${SOLIDS[j].id}: overlapping footprints`);
  return errors;
}
