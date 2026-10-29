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
  artisans: { x: 1060, y: 820 },
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
  { x: 900, y: 1140, color: "#d9be83", caravel: true },
  { x: 230, y: 1110, color: "#a66f52" },
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
// Authored setbacks and uneven street lengths replace the repeated row grid.
export const BLOCK_LAYOUT = [
  [
    { left: 165, y: 260, widths: [96, 94] },
    { left: 410, y: 290, widths: [84, 136] },
    { left: 810, y: 250, widths: [120, 100] },
    { left: 1095, y: 285, widths: [84, 111] },
  ],
  [
    { left: 140, y: 445, widths: [108, 82] },
    { left: 405, y: 470, widths: [100, 120] },
    { left: 815, y: 430, widths: [64, 92, 64] },
    { left: 1110, y: 460, widths: [78, 117] },
  ],
  [
    { left: 170, y: 615, widths: [80, 110] },
    { left: 420, y: 625, widths: [62, 96, 62] },
    { left: 835, y: 595, widths: [110, 54, 56] },
    { left: 1105, y: 635, widths: [118, 77] },
  ],
  [
    { left: 145, y: 790, widths: [102, 88] },
    { left: 390, y: 770, widths: [64, 80, 76] },
    { left: 820, y: 805, widths: [112, 108] },
    { left: 1110, y: 765, widths: [72, 123] },
  ],
  [
    { left: 160, y: 930, widths: [100, 90] },
    { left: 400, y: 930, widths: [96, 64, 60] },
    { left: 825, y: 925, widths: [76, 88, 56] },
    { left: 1090, y: 915, widths: [120, 75] },
  ],
];
export const ROADS = [
  road("avenue-du-refuge", 36, [
    [720, 1020],
    [704, 870],
    [720, 710],
    [720, 620],
    [740, 400],
    [720, 140],
  ]),
  road("promenade-des-quais", 34, [
    [150, 957],
    [310, 970],
    [510, 975],
    [720, 990],
    [940, 970],
    [1120, 975],
    [1280, 940],
  ]),
  road("passage-des-tisserands", 22, [
    [385, 280],
    [380, 360],
    [370, 490],
    [390, 545],
    [390, 670],
    [365, 820],
    [380, 970],
  ]),
  road("passage-du-levant", 22, [
    [1065, 270],
    [1075, 410],
    [1080, 540],
    [1080, 690],
    [1080, 840],
    [1065, 965],
  ]),
  road("ruelle-occidentale", 20, [
    [122, 310],
    [118, 480],
    [120, 680],
    [130, 805],
    [142, 845],
    [150, 957],
  ]),
  road("ruelle-orientale", 20, [
    [1330, 337],
    [1330, 480],
    [1330, 675],
    [1320, 805],
    [1298, 835],
    [1280, 940],
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
  "3-2-0": ["forge", "Forge de Borin", "forge"],
  "0-2-0": ["maison-du-roi", "Maison du Premier Accueil", "history"],
  "1-0-0": ["magicien", "Le Bâton étoilé", "magic"],
  "1-1-0": ["armurier", "Halle des Marchands", "armor"],
  "2-2-0": ["bricoleur", "Atelier de Tessa", "handyman"],
  "2-0-0": ["epicerie", "Échoppe des voyageurs", "trader"],
  "3-3-0": ["scierie", "Scierie des voyageurs", "sawmill"],
  "3-1-0": ["animalerie", "Refuge de Nola", "petshop"],
  "4-2-0": ["capitainerie", "Capitainerie", "harbor"],
  "4-1-0": ["auberge", "Auberge des Quatre Vents", "inn"],
};
const landmarks = { "1-1": "guildhall", "3-2": "forge", "4-0": "warehouse" };
export const BUILDINGS = [],
  ENTRANCES = [],
  FRONTAGES = [];
for (const [row, layout] of BLOCK_LAYOUT.entries())
  for (const [block, lot] of lots.entries()) {
    const { left, y } = layout[block];
    const plotWidths = layout[block].widths;
    const widths = landmarks[`${row}-${block}`]
      ? [plotWidths.reduce((a, b) => a + b, 0)]
      : plotWidths;
    let edge = left,
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
        district: block < 2 ? "merchants" : "artisans",
        roof:
          block < 2
            ? ["clay", "wine", "ochre"][(row + index) % 3]
            : ["navy", "slate", "teal"][(row + index) % 3],
        archetype: block < 2 ? (index % 2 ? "arcade" : "merchant") : "workshop",
        ...(landmarks[`${row}-${block}`]
          ? { asset: landmarks[`${row}-${block}`] }
          : {}),
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
    // Each street follows its own facade setback and joins the two real alleys.
    // No smoothing here: the endpoints must meet the existing street exactly.
    const alleys = [
      "ruelle-occidentale",
      "passage-des-tisserands",
      "avenue-du-refuge",
      "passage-du-levant",
      "ruelle-orientale",
    ];
    const streetY = y + 36;
    const atY = (id) => {
      const points = ROADS.find((r) => r.id === id).points;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        if (
          streetY >= Math.min(a[1], b[1]) &&
          streetY <= Math.max(a[1], b[1])
        ) {
          const t = (streetY - a[1]) / (b[1] - a[1]);
          return [a[0] + (b[0] - a[0]) * t, streetY];
        }
      }
      return points.reduce((a, b) =>
        Math.abs(a[1] - streetY) < Math.abs(b[1] - streetY) ? a : b,
      );
    };
    ROADS.push({
      id: `frontage-${row}-${block}`,
      width: 18,
      points: [
        atY(alleys[block]),
        [left, streetY],
        [edge, streetY],
        atY(alleys[block + 1]),
      ],
    });
  }
export const SIDEWALKS = BLOCK_LAYOUT.flatMap((row, r) =>
  row.map((lot, b) => ({
    id: `sidewalk-${r}-${b}`,
    width: 24,
    points: [
      [lot.left, lot.y + 12],
      [lot.left + lot.widths.reduce((a, b) => a + b, 0), lot.y + 12],
    ],
  })),
);
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
    y: house.y + 18,
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
  [660, 565],
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
  [285, 485],
  [335, 485],
  [490, 645],
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
export const PORT_GATE = {
  id: "porte-du-refuge",
  kind: "exile-gate",
  asset: "gate",
  x: 720,
  y: 1018,
  w: 210,
  h: 190,
};
export const GATE_TOWERS = [-1, 1].map((side) => ({
  id: `porte-tour-${side}`,
  kind: "gate-collision",
  x: 720 + side * 65,
  y: 1018,
  footprint: { type: "box", left: -25, right: 25, top: -35, bottom: 0 },
}));
export const STAIRS = [
  { x: 720, y: 940, w: 82, length: 62 },
  { x: 730, y: 355, w: 64, length: 40 },
];
for (const [x, y] of [
  [320, 1050],
  [743, 1080],
])
  STREET_PROPS.push({
    id: `grue-${x}`,
    kind: "exile-crane",
    x,
    y,
    w: 70,
    h: 120,
    onDock: true,
    footprint: { type: "circle", radius: 3 },
  });
for (const [x, y] of [
  [333, 1080],
  [735, 1125],
])
  STREET_PROPS.push({
    id: `cargaison-${x}`,
    kind: "crate",
    x,
    y,
    onDock: true,
    footprint: { type: "box", left: -9, right: 9, top: -16, bottom: 0 },
  });
export const RAMPARTS = [
  [
    [130, 140],
    [390, 110],
    [640, 125],
    [675, 125],
  ],
  [
    [765, 125],
    [1040, 110],
    [1310, 150],
  ],
  [
    [130, 140],
    [95, 360],
    [85, 570],
    [110, 800],
    [150, 950],
    [300, 956],
  ],
  [
    [1310, 150],
    [1350, 400],
    [1345, 780],
    [1300, 870],
    [1255, 940],
  ],
  [
    [370, 956],
    [510, 977],
    [620, 1008],
  ],
  [
    [820, 1008],
    [940, 978],
    [1105, 968],
  ],
  [
    [1178, 960],
    [1255, 940],
  ],
];
export function rampartDistance(x, y) {
  let d = Infinity;
  for (const wall of RAMPARTS)
    for (let i = 1; i < wall.length; i++)
      d = Math.min(d, Math.sqrt(segmentDistanceSq(x, y, wall[i - 1], wall[i])));
  return d;
}
export const RAMPART_TOWERS = [
  [130, 140],
  [390, 110],
  [1040, 110],
  [1310, 150],
  [95, 400],
  [110, 800],
  [150, 950],
  [1350, 440],
  [1345, 780],
  [1255, 940],
].map(([x, y], i) => ({
  id: `rempart-tour-${i}`,
  kind: "exile-rampart-tower",
  asset: "tower",
  x,
  y,
  w: 32,
  h: 100,
  footprint: { type: "circle", radius: 12 },
}));
export const NORTH_GATE = {
  id: "porte-du-sanctuaire",
  kind: "exile-city-gate",
  asset: "gate",
  x: 720,
  y: 125,
  w: 120,
  h: 90,
};
export const NORTH_GATE_SOLIDS = [-1, 1].map((side) => ({
  id: `porte-nord-${side}`,
  kind: "gate-collision",
  x: 720 + side * 37,
  y: 125,
  footprint: { type: "circle", radius: 12 },
}));
const lineY = (x, points) => {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (x <= b[0])
      return a[1] + (b[1] - a[1]) * Math.max(0, (x - a[0]) / (b[0] - a[0]));
  }
  return points.at(-1)[1];
};
export const TERRACES = [
  {
    id: "ville-haute",
    height: 20,
    points: [
      [105, 515],
      [390, 520],
      [650, 535],
      [720, 540],
      [810, 500],
      [1080, 500],
      [1340, 530],
    ],
  },
  {
    id: "terrasse-des-ateliers",
    height: 18,
    points: [
      [105, 848],
      [390, 840],
      [650, 842],
      [720, 850],
      [810, 862],
      [1048, 862],
      [1080, 842],
      [1335, 830],
    ],
  },
];
export const TERRACE_STAIRS = TERRACES.flatMap((t) =>
  (t.id === "ville-haute"
    ? [120, 390, 720, 1080, 1320]
    : [142, 390, 720, 1080, 1298]
  ).map((x) => ({
    id: `${t.id}-${x}`,
    terrace: t.id,
    x,
    y: lineY(x, t.points),
    w: x === 720 ? 74 : x === 142 ? 24 : x === 1298 ? 20 : 30,
    length: t.height + 10,
  })),
);
STAIRS.push(...TERRACE_STAIRS);
export const terraceBoundaryY = (terrace, x) => lineY(x, terrace.points);
export function blockedByTerrace(x, y) {
  return TERRACES.some((t) => {
    const edge = lineY(x, t.points);
    return (
      y >= edge - t.height &&
      y <= edge + 3 &&
      !TERRACE_STAIRS.some(
        (s) => s.terrace === t.id && Math.abs(x - s.x) < s.w / 2 - 1,
      )
    );
  });
}
export function elevationAt(x, y) {
  return TERRACES.reduce((height, t) => {
    const edge = lineY(x, t.points);
    return (
      height +
      (y < edge - t.height
        ? t.height
        : TERRACE_STAIRS.some(
              (s) => s.terrace === t.id && Math.abs(x - s.x) < s.w / 2,
            ) && y < edge
          ? (t.height * (edge - y)) / t.height
          : 0)
    );
  }, 0);
}
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
  if (
    landDistance(x, y) < 18 ||
    roadDistance(x, y) < 19 ||
    rampartDistance(x, y) < 20 ||
    blockedByTerrace(x, y)
  )
    continue;
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
export const PROPS = [
  ...BUILDINGS,
  TOWN_FOUNTAIN,
  PORT_GATE,
  NORTH_GATE,
  ...RAMPART_TOWERS,
  ...STREET_PROPS,
  ...trees,
];
export const SOLIDS = [
  ...PROPS.filter((p) => p.footprint),
  ...GATE_TOWERS,
  ...NORTH_GATE_SOLIDS,
];
export function canWalkExile(x, y) {
  return (
    x > 15 &&
    x < MAP_SIZE.width - 15 &&
    y > 15 &&
    y < MAP_SIZE.height - 15 &&
    (landDistance(x, y) >= 6 || onDock(x, y, 5)) &&
    rampartDistance(x, y) > 5 &&
    !blockedByTerrace(x, y) &&
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
  footprintPoints(p).every(
    ([x, y]) => landDistance(x, y) >= 2 || (p.onDock && onDock(x, y, 1)),
  );
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
        ? "Le quartier des marchands"
        : x > 810
          ? "Le quartier des artisans"
          : "La place du Refuge";
}
