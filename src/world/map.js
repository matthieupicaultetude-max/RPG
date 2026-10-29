import {DEV_CHEST} from './dev-chest.js';
import { SCENE } from "../game/config.js";

export const MAP_SIZE = Object.freeze({
  width: SCENE.width,
  height: SCENE.height,
});
export const LAND = [
  [13, 42],
  [42, 38],
  [88, 36],
  [144, 40],
  [180, 37],
  [220, 43],
  [263, 38],
  [310, 40],
  [365, 36],
  [420, 41],
  [480, 37],
  [540, 41],
  [594, 36],
  [626, 44],
  [633, 100],
  [628, 180],
  [634, 250],
  [628, 320],
  [633, 389],
  [580, 394],
  [510, 391],
  [440, 396],
  [370, 391],
  [300, 394],
  [230, 390],
  [160, 394],
  [90, 390],
  [10, 391],
  [6, 330],
  [12, 260],
  [6, 180],
  [10, 110],
];

export function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}
export function segmentDistanceSq(x, y, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)),
  );
  return (x - a[0] - dx * t) ** 2 + (y - a[1] - dy * t) ** 2;
}
export function polygonDistance(x, y, points) {
  let squared = Infinity;
  for (let i = 0; i < points.length; i++)
    squared = Math.min(
      squared,
      segmentDistanceSq(x, y, points[i], points[(i + 1) % points.length]),
    );
  return Math.sqrt(squared) * (insidePolygon(x, y, points) ? 1 : -1);
}
export const landDistance = (x, y) => polygonDistance(x, y, LAND);
export const isLand = (x, y) => insidePolygon(x, y, LAND);

// Every branch ends on an explicit shared junction or inside a destination.
export const ROAD_JUNCTIONS = Object.freeze({
  north: [320, 180],
  crossroads: [320, 250],
  south: [320, 300],
});
function smooth(points) {
  const result = [points[0]];
  for (let pass = 0; pass < 2; pass++) {
    const source = pass === 0 ? points : result.splice(0);
    const next = [source[0]];
    for (let i = 0; i < source.length - 1; i++) {
      const a = source[i],
        b = source[i + 1];
      next.push(
        [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
        [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
      );
    }
    next.push(source.at(-1));
    result.splice(0, result.length, ...next);
  }
  return result;
}
export const HANDYMAN_WORKSHOP=Object.freeze({x:85,y:300,npc:{id:"tessa",name:"Tessa · Bricoleuse",x:112,y:315,role:"ranged",facing:"down",moving:false,equipment:{}}});
export const SAWMILL = Object.freeze({x:76,y:205});
export const FOUNTAIN = Object.freeze({x:365,y:125});
export const FORGE = Object.freeze({npc:{id:'borin',name:'Borin',x:212,y:314,role:'melee',facing:'down',moving:false,equipment:{}}});
export const PET_SHOP = Object.freeze({x:250,y:138,npc:{id:'nola',name:'Nola',x:268,y:153,role:'support',facing:'down',moving:false,equipment:{}}});
export const ROADS = [
 {id:"handyman-route",width:16,points:[[140,180],[125,220],[125,318],[100,318]]},
 {id:"mountain-route",width:18,points:[[470,180],[520,145],[565,100]]},
 {id:"slime-marsh-route",width:20,points:[[320,300],[345,330],[390,355]]},
 {id:"sawmill",width:18,points:[[76,222],[110,222],[110,180]]},
  {id:"fountain",width:18,points:[[365,150],[365,180]]},
  {id:'petshop',width:20,points:[[250,148],[250,180]]},
  {
    id: "village",
    width: 26,
    points: smooth([
      [110, 114],
      [110, 150],
      [140, 178],
      [220, 180],
      ROAD_JUNCTIONS.north,
    ]),
  },
  {
    id: "prairie-north",
    width: 26,
    points: smooth([ROAD_JUNCTIONS.north, [402, 180], [447, 195], [479, 226]]),
  },
  {
    id: "spine-north",
    width: 24,
    points: [ROAD_JUNCTIONS.north, ROAD_JUNCTIONS.crossroads],
  },
  {
    id: "spine-south",
    width: 24,
    points: [ROAD_JUNCTIONS.crossroads, ROAD_JUNCTIONS.south],
  },
  {
    id: "market",
    width: 24,
    points: smooth([
      ROAD_JUNCTIONS.south,
      [320, 322],
      [274, 322],
      [213, 322],
      [190, 311],
      [190, 298],
    ]),
  },
  {
    id: "prairie-west",
    width: 24,
    points: smooth([
      ROAD_JUNCTIONS.crossroads,
      [387, 250],
      [449, 253],
      [476, 257],
    ]),
  },
];
export const CLEARINGS = [
  Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2,
      r = 1 + 0.026 * Math.sin(i * 2.3) + 0.018 * Math.cos(i * 1.7);
    return [502 + Math.cos(angle) * 98 * r, 258 + Math.sin(angle) * 64 * r];
  }),
];
export function roadDistance(x, y) {
  let result = Infinity;
  for (const road of ROADS) {
    let squared = Infinity;
    for (let i = 1; i < road.points.length; i++)
      squared = Math.min(
        squared,
        segmentDistanceSq(x, y, road.points[i - 1], road.points[i]),
      );
    result = Math.min(result, Math.sqrt(squared) - road.width / 2);
  }
  for (const clearing of CLEARINGS)
    result = Math.min(result, -polygonDistance(x, y, clearing));
  return result;
}
export const isRoad = (x, y) => roadDistance(x, y) <= 0;

// Sprite origin is its ground anchor. Only the footprint blocks movement.
export const PROPS = [
 {id:"handyman-workshop",kind:"workshop",x:85,y:300,footprint:{type:"box",left:-25,right:25,top:-25,bottom:0}},
 {id:"sawmill",kind:"sawmill",x:SAWMILL.x,y:SAWMILL.y,footprint:{type:"box",left:-20,right:20,top:-7,bottom:0}},
  {id:"fountain",kind:"fountain",x:FOUNTAIN.x,y:FOUNTAIN.y,footprint:{type:"circle",radius:13}},
  {id:'petshop',kind:'petshop',x:PET_SHOP.x,y:PET_SHOP.y,footprint:{type:'box',left:-34,right:34,top:-36,bottom:0}},
  {
    id: "house",
    kind: "house",
    x: 110,
    y: 108,
    footprint: { type: "box", left: -58, right: 54, top: -46, bottom: 0 },
  },
  {
    id: "market",
    kind: "market",
    x: 190,
    y: 297,
    footprint: { type: "box", left: -33, right: 33, top: -19, bottom: -10 },
  },
  ...[
    [207, 82],
    [268, 80],
    [411, 82],
    [478, 83],
    [594, 99],
    [35, 147],
    [31, 290],
    [46, 363],
    [253, 363],
    [581, 362],
    [605, 313],
    [602, 137],
  ].map(([x, y], i) => ({
    id: `tree-${i}`,
    kind: "tree",
    x,
    y,
    variant: i % 3,
    wood:["ash","ash","chestnut","walnut","walnut","ash","ash","ash","chestnut","chestnut","walnut","walnut"][i],
    footprint: { type: "circle", radius: 9 },
    rootRadius: 12,
  })),
  ...[
    [39, 110],
    [238, 292],
    [184, 72],
  ].map(([x, y], i) => ({
    id: `barrel-${i}`,
    kind: "barrel",
    x,
    y,
    footprint: { type: "circle", radius: 6 },
  })),
  ...[
    [175, 115],
    [143, 294],
    [145, 275],
    [207, 70],
  ].map(([x, y], i) => ({
    id: `crate-${i}`,
    kind: "crate",
    x,
    y,
    footprint: { type: "box", left: -9, right: 9, top: -6, bottom: 0 },
  })),
  ...[
    [192, 132],
    [246, 344],
  ].map(([x, y], i) => ({
    id: `bench-${i}`,
    kind: "bench",
    x,
    y,
    footprint: { type: "box", left: -17, right: 17, top: -7, bottom: 0 },
  })),
  {
    id: "woodpile",
    kind: "woodpile",
    x: 62,
    y: 144,
    footprint: { type: "box", left: -10, right: 10, top: -7, bottom: 0 },
  },
  ...[
    [140, 139, "VILLAGE"],
    [218, 303, "FORGE"],
    [397, 326, "PRAIRIE"],
  ].map(([x, y, text], i) => ({
    id: `sign-${i}`,
    kind: "sign",
    x,
    y,
    text,
    footprint: { type: "circle", radius: 3 },
  })),
];
export const DECORATIONS = [
  ...[
    [69, 133],
    [151, 134],
    [250, 279],
    [357, 215],
    [332, 355],
    [288, 150],
    [565, 160],
    [76, 343],
  ].map(([x, y], i) => ({ id: `flowers-${i}`, kind: "flowers", x, y })),
  ...[
    [31, 112],
    [233, 85],
    [288, 76],
    [447, 80],
    [529, 80],
    [600, 163],
    [30, 263],
    [79, 366],
    [290, 368],
    [557, 365],
    [605, 289],
  ].map(([x, y], i) => ({ id: `bush-${i}`, kind: "bush", x, y })),
  ...[
    [29, 190],
    [618, 205],
    [27, 342],
  ].map(([x, y], i) => ({ id: `rock-${i}`, kind: "rock", x, y })),
];
export const FENCES = [
  { x1: 18, x2: 43, y: 57 },
  { x1: 177, x2: 617, y: 57 },
  { x1: 20, x2: 105, y: 382 },
  { x1: 376, x2: 617, y: 382 },
].map((fence, i) => ({
  ...fence,
  id: `fence-${i}`,
  kind: "fence",
  x: fence.x1,
  footprint: {
    type: "box",
    left: 0,
    right: fence.x2 - fence.x1,
    top: -2,
    bottom: 4,
  },
}));
export const SOLIDS = [...PROPS, ...FENCES, DEV_CHEST];

export function footprintPoints(prop) {
  const f = prop.footprint;
  if (f?.type === "box")
    return [
      [f.left, f.top],
      [f.right, f.top],
      [f.right, f.bottom],
      [f.left, f.bottom],
      [0, 0],
    ].map(([x, y]) => [x + prop.x, y + prop.y]);
  const radius = prop.rootRadius || f?.radius || 5;
  return Array.from({ length: 16 }, (_, i) => [
    prop.x + Math.cos((i * Math.PI) / 8) * radius,
    prop.y + Math.sin((i * Math.PI) / 8) * radius,
  ]);
}
export function placementOnLand(prop) {
  return footprintPoints(prop).every(
    ([x, y]) => isLand(x, y) && landDistance(x, y) >= 2,
  );
}
export function inFootprint(x, y, prop) {
  const f = prop.footprint;
  if (!f) return false;
  if (f.type === "circle")
    return Math.hypot(x - prop.x, y - prop.y) <= f.radius;
  return (
    x > prop.x + f.left &&
    x < prop.x + f.right &&
    y >= prop.y + f.top &&
    y < prop.y + f.bottom
  );
}
export function canWalkMap(x, y) {
  return (
    x >= 14 &&
    x <= 626 &&
    y >= 65 &&
    y <= 386 &&
    landDistance(x, y) >= 4 &&
    !SOLIDS.some((prop) => inFootprint(x, y, prop))
  );
}

export function footprintsOverlap(a, b) {
  const af = a.footprint,
    bf = b.footprint;
  if (!af || !bf) return false;
  if (af.type === "circle" && bf.type === "circle")
    return Math.hypot(a.x - b.x, a.y - b.y) < af.radius + bf.radius;
  const box = (prop) => ({
    left: prop.x + prop.footprint.left,
    right: prop.x + prop.footprint.right,
    top: prop.y + prop.footprint.top,
    bottom: prop.y + prop.footprint.bottom,
  });
  if (af.type === "box" && bf.type === "box") {
    const aa = box(a),
      bb = box(b);
    return (
      aa.left < bb.right &&
      aa.right > bb.left &&
      aa.top < bb.bottom &&
      aa.bottom > bb.top
    );
  }
  const circle = af.type === "circle" ? a : b,
    rect = box(af.type === "box" ? a : b);
  const x = Math.max(rect.left, Math.min(rect.right, circle.x)),
    y = Math.max(rect.top, Math.min(rect.bottom, circle.y));
  return Math.hypot(circle.x - x, circle.y - y) < circle.footprint.radius;
}
export function validateMap() {
  const errors = [];
  for (const prop of [...SOLIDS, ...DECORATIONS]) {
    if (!placementOnLand(prop))
      errors.push(`${prop.id}: footprint outside land`);
    if (
      !["house", "market", "petshop", "fence"].includes(prop.kind) &&
      footprintPoints(prop).some(([x, y]) => isRoad(x, y))
    )
      errors.push(`${prop.id}: footprint on a road`);
  }
  for (let i = 0; i < SOLIDS.length; i++)
    for (let j = i + 1; j < SOLIDS.length; j++)
      if (footprintsOverlap(SOLIDS[i], SOLIDS[j]))
        errors.push(`${SOLIDS[i].id}/${SOLIDS[j].id}: overlapping footprints`);
  return errors;
}
