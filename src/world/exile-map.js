// Authored compact blocks. Building dimensions remain at character scale;
// density comes from plot placement and street widths, never sprite scaling.
import {
  insidePolygon,
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintsOverlap,
  footprintPoints,
} from "./map.js";
export const EXILE_ZONE = "exile";
export const MAP_SIZE = Object.freeze({ width: 1440, height: 1240 });
export const EXILE_SPAWN = Object.freeze({ x: 720, y: 1010 });
export const EXILE_RETURN = Object.freeze({ x: 720, y: 1160 });
export const FOUNTAIN = Object.freeze({ x: 720, y: 620 });
export const EXILE_DEV_POINTS = {
  plaza: { x: 720, y: 710 },
  artisans: { x: 380, y: 820 },
  gardens: { x: 720, y: 160 },
};
const shore = [
  [90, 100],
  [350, 65],
  [690, 80],
  [1040, 65],
  [1330, 100],
  [1385, 340],
  [1395, 620],
  [1340, 870],
  [1270, 970],
  [1120, 1000],
  [940, 990],
  [830, 1030],
  [630, 1030],
  [510, 985],
  [300, 980],
  [130, 1005],
  [75, 800],
  [45, 490],
];
export const LAND = shore.flatMap((a, i) => {
  const b = shore[(i + 1) % shore.length],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    d = Math.hypot(dx, dy),
    n = Math.ceil(d / 25);
  return Array.from({ length: n }, (_, j) => {
    const t = j / n,
      w = Math.sin(t * Math.PI) * Math.sin(j * 1.7 + i) * 3;
    return [
      Math.round(a[0] + dx * t - (dy / d) * w),
      Math.round(a[1] + dy * t + (dx / d) * w),
    ];
  });
});
export const DOCKS = [
  { x: 690, y: 1000, w: 60, h: 190 },
  { x: 310, y: 960, w: 48, h: 190 },
  { x: 1120, y: 975, w: 48, h: 185 },
  { x: 310, y: 1100, w: 440, h: 36 },
];
export const SHIPS = [
  { x: 800, y: 1115, color: "#83a9a4" },
  { x: 1205, y: 1100, color: "#ba8475" },
];
export const QUAY_EDGE = [
  [130, 997],
  [300, 972],
  [510, 977],
  [630, 1022],
  [830, 1022],
  [940, 982],
  [1120, 992],
  [1270, 962],
];
export const isLand = (x, y) => insidePolygon(x, y, LAND);
export const landDistance = (x, y) => polygonDistance(x, y, LAND);
export const onDock = (x, y, margin = 0) =>
  DOCKS.some(
    (d) =>
      x >= d.x + margin &&
      x <= d.x + d.w - margin &&
      y >= d.y + margin &&
      y <= d.y + d.h - margin,
  );
function smooth(points) {
  for (let pass = 0; pass < 2; pass++) {
    const next = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      next.push(
        [0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]],
        [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]],
      );
    }
    next.push(points.at(-1));
    points = next;
  }
  return points;
}
const road = (id, width, points) => ({ id, width, points: smooth(points) });
export const ROADS = [
  road("avenue-du-refuge", 36, [
    [720, 1020],
    [710, 850],
    [720, 620],
    [740, 400],
    [720, 140],
  ]),
  road("rue-du-premier-accueil", 24, [
    [120, 300],
    [380, 300],
    [650, 300],
    [720, 310],
    [1060, 300],
    [1320, 300],
  ]),
  road("rue-des-echoppes", 26, [
    [120, 510],
    [380, 510],
    [610, 520],
    [720, 620],
    [840, 520],
    [1060, 510],
    [1320, 510],
  ]),
  road("rue-des-artisans", 26, [
    [120, 685],
    [380, 685],
    [620, 680],
    [720, 700],
    [820, 680],
    [1060, 685],
    [1320, 685],
  ]),
  road("rue-des-voiles", 24, [
    [120, 820],
    [380, 820],
    [650, 825],
    [720, 830],
    [1060, 820],
    [1320, 820],
  ]),
  road("promenade-des-quais", 34, [
    [140, 950],
    [310, 970],
    [510, 975],
    [720, 990],
    [940, 970],
    [1120, 975],
    [1290, 945],
  ]),
  road("passage-des-tisserands", 22, [
    [380, 260],
    [380, 510],
    [380, 685],
    [380, 820],
    [380, 970],
  ]),
  road("passage-du-levant", 22, [
    [1060, 260],
    [1060, 510],
    [1060, 685],
    [1060, 820],
    [1060, 970],
  ]),
  road("ruelle-occidentale", 20, [
    [120, 300],
    [120, 510],
    [120, 685],
    [120, 820],
    [140, 950],
  ]),
  road("ruelle-orientale", 20, [
    [1320, 300],
    [1320, 510],
    [1320, 685],
    [1320, 820],
    [1290, 945],
  ]),
];
export const PLAZAS = [
  { ...FOUNTAIN, rx: 79, ry: 64 },
  { x: 720, y: 990, rx: 62, ry: 28 },
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
  for (const p of PLAZAS)
    d = Math.min(
      d,
      (Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry) - 1) *
        Math.min(p.rx, p.ry),
    );
  return d;
}
export const isRoad = (x, y) => roadDistance(x, y) <= 0;
export const URBAN_GROUND = [
  [120, 270],
  [350, 230],
  [650, 250],
  [800, 250],
  [1050, 230],
  [1320, 270],
  [1330, 860],
  [1270, 970],
  [830, 1025],
  [630, 1025],
  [160, 940],
  [100, 820],
];
export const PARKS = [
  { x: 720, y: 160, rx: 65, ry: 42 },
  { x: 1300, y: 150, rx: 38, ry: 30 },
];
export const isUrbanGround = (x, y) =>
  insidePolygon(x, y, URBAN_GROUND) &&
  !PARKS.some((p) => Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry) < 1);
// Four narrow blocks per row; the 40–50 pixel gaps are traversable alleys.
const lots = [
  { left: 150, widths: [90, 100] },
  { left: 400, widths: [80, 70, 70] },
  { left: 820, widths: [90, 70, 60] },
  { left: 1090, widths: [100, 95] },
];
const servicesAt = {
  "4-0-0": ["entrepot", "Entrepôt des arrivages", null],
  "3-2-0": ["halle", "Halle des compagnons", null],
  "0-2-0": ["maison-du-roi", "Maison du Premier Accueil", "history"],
  "1-1-0": ["magicien", "Le Bâton étoilé", "magic"],
  "1-2-0": ["armurier", "La Maille du Refuge", "armor"],
  "2-0-0": ["bricoleur", "Atelier de Tessa", "handyman"],
  "2-3-0": ["epicerie", "Échoppe des voyageurs", "trader"],
  "3-0-0": ["scierie", "Scierie des voyageurs", "sawmill"],
  "3-1-0": ["forge", "Forge de Borin", "forge"],
  "3-3-0": ["animalerie", "Refuge de Nola", "petshop"],
  "4-1-0": ["capitainerie", "Capitainerie", "harbor"],
  "4-2-0": ["auberge", "Auberge des Quatre Vents", "inn"],
};
export const BUILDINGS = [],
  ENTRANCES = [],
  FRONTAGES = [];
for (const [row, y] of [240, 450, 610, 780, 940].entries())
  for (const [block, lot] of lots.entries()) {
    const widths =
      row === 0
        ? [110, lot.widths.reduce((a, b) => a + b, 0) - 110]
        : lot.widths;
    let edge = lot.left,
      previous = null;
    const frontage = [];
    for (const [index, w] of widths.entries()) {
      const special = servicesAt[`${row}-${block}-${index}`],
        id = special?.[0] || `logis-${row}-${block}-${index}`,
        floors = special ? 3 : 2 + ((row + block + index) % 2);
      const p = {
        id,
        kind: "exile-house",
        name:
          special?.[1] ||
          [
            "Logis des Voiliers",
            "Logis des Tisserands",
            "Logis des Embruns",
            "Logis du Refuge",
          ][(row + block + index) % 4],
        service: special?.[2] || null,
        x: edge + w / 2,
        y,
        w,
        h: floors * 34 + 116,
        floors,
        roof: ["clay", "wine", "ochre", "slate"][(row + block + index) % 4],
        footprint: {
          type: "box",
          left: -w / 2,
          right: w / 2,
          top: -62,
          bottom: 0,
        },
        ...(previous ? { attachedTo: previous.id } : {}),
      };
      BUILDINGS.push(p);
      frontage.push(p.id);
      ENTRANCES.push({ id, x: p.x, y: y + 10 });
      previous = p;
      edge += w;
    }
    FRONTAGES.push(frontage);
    // A short shared sidewalk opens at both ends into the neighboring alley.
    ROADS.push(
      road(`frontage-${row}-${block}`, 12, [
        [lot.left - 14, y + 14],
        [edge + 14, y + 14],
      ]),
    );
  }
export const TOWN_FOUNTAIN = {
  id: "exile-fountain",
  kind: "exile-fountain",
  ...FOUNTAIN,
  footprint: { type: "circle", radius: 26 },
};
const identities = {
  forge: ["borin", "Borin · Forgeron", "melee", "forge"],
  handyman: ["tessa", "Tessa · Bricoleuse", "ranged", "handyman"],
  sawmill: ["erwan", "Erwan · Scieur", "melee", "professions"],
  petshop: ["nola", "Nola · Animalerie", "support", "petshop"],
  armor: ["maela", "Maëla · Armurière", "melee", "town"],
  magic: ["oriel", "Oriel · Enchanteur", "support", "town"],
  trader: ["silo", "Silo · Marchand", "ranged", "town"],
  harbor: ["capitaine", "Ysée · Capitainerie", "ranged", "town"],
  inn: ["aubergiste", "Mina · Aubergiste", "support", "town"],
  history: ["archiviste", "Lys · Archiviste", "support", "town"],
};
export const SERVICES = {};
for (const [key, [id, name, role, panel]] of Object.entries(identities)) {
  const house = BUILDINGS.find((p) => p.service === key);
  SERVICES[key] = {
    id,
    name,
    role,
    panel,
    x: house.x + 16,
    y: house.y + 32,
    facing: "down",
    moving: false,
    equipment: {},
  };
}
SERVICES.ambassador = {
  id: "ambassadeur",
  name: "Ambre · Émissaire slime",
  x: 785,
  y: 695,
  role: "support",
  panel: "town",
  slimeResident: true,
  facing: "down",
  moving: false,
  equipment: {},
};
SERVICES.gardener = {
  id: "jardinier",
  name: "Mousse · Jardinier slime",
  x: 760,
  y: 165,
  role: "support",
  panel: "town",
  slimeResident: true,
  facing: "down",
  moving: false,
  equipment: {},
};
export const STREET_PROPS = [];
const add = (kind, x, y, footprint) =>
  STREET_PROPS.push({
    id: `exile-${kind}-${STREET_PROPS.length}`,
    kind,
    x,
    y,
    ...(footprint ? { footprint } : {}),
  });
for (const [x, y] of [
  [642, 565],
  [800, 565],
  [642, 670],
  [800, 670],
  [675, 960],
  [770, 960],
  [363, 850],
  [1078, 850],
  [363, 335],
  [1078, 335],
])
  add("exile-lamp", x, y, { type: "circle", radius: 3 });
for (const [x, y] of [
  [657, 620],
  [783, 620],
  [680, 698],
  [760, 698],
  [665, 190],
  [775, 190],
])
  add("bench", x, y, { type: "box", left: -17, right: 17, top: -7, bottom: 0 });
for (const [x, y] of [
  [260, 965],
  [280, 965],
  [1175, 975],
  [1200, 965],
  [625, 975],
])
  add("crate", x, y, { type: "box", left: -9, right: 9, top: -16, bottom: 0 });
for (const [x, y] of [
  [300, 950],
  [1225, 960],
  [600, 995],
])
  add("barrel", x, y, { type: "circle", radius: 7 });
for (const [x, y] of [
  [560, 975],
  [1000, 975],
])
  add("exile-stall", x, y, {
    type: "box",
    left: -22,
    right: 22,
    top: -15,
    bottom: 0,
  });
for (const [x, y] of [
  [650, 560],
  [790, 560],
  [685, 160],
  [820, 165],
  [105, 420],
  [1345, 420],
])
  add("flowers", x, y);
const trees = [];
for (const [x, y] of [
  [95, 260],
  [90, 550],
  [100, 740],
  [1335, 200],
  [1350, 420],
  [1340, 680],
  [675, 150],
  [790, 150],
]) {
  if (landDistance(x, y) < 18 || roadDistance(x, y) < 19) continue;
  trees.push({
    id: `exile-tree-${trees.length}`,
    kind: "tree",
    x,
    y,
    variant: trees.length % 3,
    footprint: { type: "circle", radius: 9 },
    rootRadius: 15,
  });
}
export const PROPS = [...BUILDINGS, TOWN_FOUNTAIN, ...STREET_PROPS, ...trees];
export const SOLIDS = PROPS.filter((p) => p.footprint);
export function canWalkExile(x, y) {
  return (
    x > 15 &&
    x < MAP_SIZE.width - 15 &&
    y > 15 &&
    y < MAP_SIZE.height - 15 &&
    (landDistance(x, y) >= 6 || onDock(x, y, 5)) &&
    !SOLIDS.some((p) =>
      p.footprint.type === "box"
        ? x >= p.x + p.footprint.left &&
          x <= p.x + p.footprint.right &&
          y >= p.y + p.footprint.top &&
          y <= p.y + p.footprint.bottom
        : inFootprint(x, y, p),
    )
  );
}
export const placementOnLand = (p) =>
  footprintPoints(p).every(([x, y]) => landDistance(x, y) >= 2);
export function validateExileMap() {
  const errors = [];
  for (const p of PROPS)
    if (!placementOnLand(p)) errors.push(`${p.id}: outside land`);
  for (let i = 0; i < SOLIDS.length; i++)
    for (let j = i + 1; j < SOLIDS.length; j++)
      if (footprintsOverlap(SOLIDS[i], SOLIDS[j]))
        errors.push(`${SOLIDS[i].id}/${SOLIDS[j].id}: overlap`);
  for (const p of [
    EXILE_SPAWN,
    EXILE_RETURN,
    ...Object.values(SERVICES),
    ...Object.values(EXILE_DEV_POINTS),
  ])
    if (!canWalkExile(p.x, p.y))
      errors.push(`${p.id || "entry"}: inaccessible`);
  return errors;
}
export function exileDistrict(x, y) {
  return y > 945
    ? "Le port de l’Exil"
    : y < 340
      ? "Le Premier Accueil"
      : x < 640
        ? "Le quartier des artisans"
        : x > 810
          ? "Les ruelles du Levant"
          : "La place du Refuge";
}
