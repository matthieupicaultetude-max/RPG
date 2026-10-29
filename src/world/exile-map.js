// World coordinates are independent from the 640 × 400 rendering window.
import {
  insidePolygon,
  polygonDistance,
  segmentDistanceSq,
  inFootprint,
  footprintsOverlap,
  footprintPoints,
} from "./map.js";
export const EXILE_ZONE = "exile";
export const MAP_SIZE = Object.freeze({ width: 2240, height: 1760 });
export const EXILE_SPAWN = Object.freeze({ x: 1120, y: 1400 });
export const EXILE_RETURN = Object.freeze({ x: 1120, y: 1580 });
const SHORE = [
  [180, 70],
  [600, 40],
  [1080, 65],
  [1530, 40],
  [1980, 110],
  [2110, 350],
  [2150, 760],
  [2070, 1120],
  [1990, 1370],
  [1740, 1430],
  [1450, 1400],
  [1350, 1460],
  [990, 1460],
  [880, 1410],
  [640, 1440],
  [330, 1370],
  [160, 1180],
  [100, 870],
  [130, 450],
];
export const LAND = SHORE.flatMap((a, i) => {
  const b = SHORE[(i + 1) % SHORE.length],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = Math.hypot(dx, dy),
    n = Math.ceil(length / 28);
  return Array.from({ length: n }, (_, j) => {
    const t = j / n,
      bend = Math.sin(t * Math.PI) * Math.sin(j * 1.7 + i) * 5;
    return [
      Math.round(a[0] + dx * t - (dy / length) * bend),
      Math.round(a[1] + dy * t + (dx / length) * bend),
    ];
  });
});
export const DOCKS = [
  { x: 1090, y: 1400, w: 60, h: 240 },
  { x: 650, y: 1390, w: 58, h: 210 },
  { x: 1580, y: 1390, w: 58, h: 220 },
  { x: 650, y: 1510, w: 500, h: 46 },
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
// Chaikin subdivision produces the same centerline for paving and navigation tests.
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
  road("avenue-du-refuge", 58, [
    [1120, 1450],
    [1120, 1260],
    [1080, 1030],
    [1120, 820],
    [1160, 580],
    [1120, 260],
  ]),
  road("rue-des-artisans", 48, [
    [320, 920],
    [590, 890],
    [830, 930],
    [1120, 820],
    [1450, 900],
    [1810, 880],
    [2010, 970],
  ]),
  road("rue-des-jardins", 38, [
    [320, 920],
    [360, 640],
    [520, 450],
    [800, 380],
    [1120, 260],
    [1450, 370],
    [1780, 550],
    [1810, 880],
  ]),
  road("promenade-des-quais", 48, [
    [320, 1230],
    [650, 1350],
    [900, 1340],
    [1120, 1370],
    [1450, 1330],
    [1780, 1330],
    [1990, 1230],
  ]),
  road("ruelle-des-voiles", 36, [
    [320, 920],
    [420, 1130],
    [650, 1350],
  ]),
  road("rue-du-couchant", 36, [
    [1810, 880],
    [1810, 1100],
    [1780, 1330],
  ]),
  road("cour-des-metiers", 32, [
    [590, 890],
    [610, 1050],
    [650, 1130],
    [790, 1140],
    [1080, 1030],
  ]),
  road("allee-des-tilleuls", 30, [
    [1450, 900],
    [1500, 1080],
    [1450, 1330],
  ]),
  road("jardin-du-roi", 32, [
    [1160, 580],
    [950, 520],
    [800, 380],
  ]),
];
export const PLAZAS = [
  { x: 1120, y: 820, rx: 146, ry: 113 },
  { x: 1120, y: 1365, rx: 128, ry: 54 },
  { x: 650, y: 1130, rx: 92, ry: 60 },
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
const building = (id, name, x, y, w, h, roof, service = null) => ({
  id,
  kind: "exile-house",
  name,
  x,
  y,
  w,
  h,
  roof,
  service,
  footprint: {
    type: "box",
    left: -w / 2 + 9,
    right: w / 2 - 9,
    top: -h * 0.44,
    bottom: 0,
  },
});
export const BUILDINGS = [
  building(
    "capitainerie",
    "Capitainerie",
    940,
    1290,
    142,
    146,
    "teal",
    "harbor",
  ),
  building(
    "auberge",
    "Auberge des Quatre Vents",
    1300,
    1240,
    174,
    178,
    "wine",
    "inn",
  ),
  building("forge", "Forge de Borin", 820, 860, 150, 160, "slate", "forge"),
  building(
    "bricoleur",
    "Atelier de Tessa",
    480,
    1020,
    140,
    148,
    "teal",
    "handyman",
  ),
  building(
    "scierie",
    "Scierie des voyageurs",
    790,
    1110,
    146,
    144,
    "slate",
    "sawmill",
  ),
  building(
    "animalerie",
    "Refuge de Nola",
    1660,
    1070,
    148,
    152,
    "teal",
    "petshop",
  ),
  building(
    "armurier",
    "La Maille du Refuge",
    1380,
    790,
    142,
    166,
    "wine",
    "armor",
  ),
  building("magicien", "Le Bâton étoilé", 900, 670, 130, 181, "teal", "magic"),
  building(
    "epicerie",
    "Échoppe des voyageurs",
    1550,
    870,
    122,
    140,
    "slate",
    "trader",
  ),
  building(
    "maison-du-roi",
    "Maison du Premier Accueil",
    1330,
    470,
    176,
    190,
    "wine",
    "history",
  ),
  building("residence-1", "Maison des Hortensias", 570, 340, 136, 152, "teal"),
  building("residence-2", "Maison du Canal", 800, 260, 146, 160, "slate"),
  building("residence-3", "Maison du Levant", 1440, 250, 144, 166, "wine"),
  building("residence-4", "Les Trois Lucarnes", 1640, 410, 150, 164, "teal"),
  building("residence-5", "Logis des Messagers", 1850, 650, 136, 150, "slate"),
  building("residence-6", "Maison des Filets", 1860, 1230, 132, 140, "wine"),
  building("residence-7", "Maison des Voiliers", 1660, 1240, 128, 148, "teal"),
  building("residence-8", "Maison des Tisserands", 250, 800, 124, 148, "wine"),
  building("residence-9", "Maison des Potiers", 560, 750, 140, 158, "slate"),
  building("residence-10", "Maison des Glycines", 720, 590, 130, 148, "wine"),
  building("residence-11", "Maison du Verger", 1520, 620, 142, 158, "slate"),
  building("residence-12", "Logis du Phare", 350, 1190, 124, 144, "teal"),
  building("entrepot", "Entrepôt des arrivages", 730, 1290, 152, 134, "slate"),
  building("halle", "Halle des compagnons", 1900, 1040, 158, 166, "teal"),
];
// Every front door has an explicit approach to the shared street network.
export const ENTRANCES = [];
const streets = [...ROADS];
function connectEntrance(house) {
  const door = [house.x, house.y + 12],
    apron = [house.x, house.y + 26];
  let nearest = null,
    best = Infinity;
  for (const street of streets)
    for (let i = 1; i < street.points.length; i++) {
      const a = street.points[i - 1],
        b = street.points[i],
        dx = b[0] - a[0],
        dy = b[1] - a[1];
      let t = Math.max(
        0,
        Math.min(
          1,
          ((apron[0] - a[0]) * dx + (apron[1] - a[1]) * dy) /
            (dx * dx + dy * dy || 1),
        ),
      );
      if (a[1] + dy * t < apron[1]) {
        if (Math.max(a[1], b[1]) < apron[1]) continue;
        t = dy ? (apron[1] - a[1]) / dy : t;
      }
      const point = [a[0] + dx * t, a[1] + dy * t],
        distance = Math.hypot(point[0] - apron[0], point[1] - apron[1]);
      if (distance >= best) continue;
      let clear = true;
      for (let step = 0; step <= Math.ceil(distance / 5); step++) {
        const f = step / Math.max(1, Math.ceil(distance / 5)),
          x = apron[0] + (point[0] - apron[0]) * f,
          y = apron[1] + (point[1] - apron[1]) * f;
        if (BUILDINGS.some((p) => inFootprint(x, y, p))) {
          clear = false;
          break;
        }
      }
      if (clear) {
        best = distance;
        nearest = point;
      }
    }
  if (nearest) {
    ROADS.push(road(`entrance-${house.id}`, 16, [door, apron, nearest]));
    ENTRANCES.push({ id: house.id, x: door[0], y: door[1] });
  }
}
for (const house of BUILDINGS) connectEntrance(house);
export const FOUNTAIN = { x: 1120, y: 808 };
const npc = (id, name, x, y, role = "support") => ({
  id,
  name,
  x,
  y,
  role,
  facing: "down",
  moving: false,
  equipment: {},
});
export const SERVICES = {
  forge: {
    ...npc("borin", "Borin · Forgeron", 847, 890, "melee"),
    panel: "forge",
  },
  handyman: {
    ...npc("tessa", "Tessa · Bricoleuse", 507, 1050, "ranged"),
    panel: "handyman",
  },
  sawmill: {
    ...npc("erwan", "Erwan · Scieur", 822, 1140, "melee"),
    panel: "professions",
  },
  petshop: {
    ...npc("nola", "Nola · Animalerie", 1685, 1100),
    panel: "petshop",
  },
  armor: {
    ...npc("maela", "Maëla · Armurière", 1407, 820, "melee"),
    panel: "town",
  },
  magic: { ...npc("oriel", "Oriel · Enchanteur", 925, 700), panel: "town" },
  trader: {
    ...npc("silo", "Silo · Marchand", 1572, 900, "ranged"),
    panel: "town",
  },
  harbor: {
    ...npc("capitaine", "Ysée · Capitainerie", 967, 1320, "ranged"),
    panel: "town",
  },
  inn: { ...npc("aubergiste", "Mina · Aubergiste", 1330, 1270), panel: "town" },
  history: {
    ...npc("archiviste", "Lys · Archiviste", 1360, 500),
    panel: "town",
  },
};
SERVICES.ambassador = {
  ...npc("ambassadeur", "Ambre · Émissaire slime", 1190, 890),
  panel: "town",
  slimeResident: true,
};
SERVICES.gardener = {
  ...npc("jardinier", "Mousse · Jardinier slime", 980, 570),
  panel: "town",
  slimeResident: true,
};
export const TOWN_FOUNTAIN = {
  id: "exile-fountain",
  kind: "exile-fountain",
  x: 1120,
  y: 808,
  footprint: { type: "circle", radius: 29 },
};
export const STREET_PROPS = [];
const add = (kind, x, y, extra = {}) =>
  STREET_PROPS.push({
    id: `exile-${kind}-${STREET_PROPS.length}`,
    kind,
    x,
    y,
    ...extra,
  });
// Street furniture always sits beside the walkable centerline, not on it.
for (const [x, y] of [
  [1010, 750],
  [1230, 750],
  [1010, 890],
  [1230, 890],
  [1040, 1250],
  [1190, 1320],
  [590, 1185],
  [720, 1190],
  [1740, 890],
  [1870, 1110],
  [410, 1000],
  [1650, 550],
  [630, 415],
])
  add("exile-lamp", x, y, { footprint: { type: "circle", radius: 4 } });
for (const [x, y] of [
  [995, 797],
  [1245, 797],
  [1080, 935],
  [1200, 935],
  [1030, 1280],
  [1550, 1260],
  [510, 1160],
  [1750, 660],
])
  add("bench", x, y, {
    footprint: { type: "box", left: -17, right: 17, top: -7, bottom: 0 },
  });
for (const [x, y] of [
  [860, 1285],
  [850, 1262],
  [835, 1245],
  [1710, 1390],
  [1750, 1390],
  [620, 1390],
  [640, 1275],
  [410, 1040],
  [470, 1050],
])
  add("crate", x, y, {
    footprint: { type: "box", left: -9, right: 9, top: -16, bottom: 0 },
  });
for (const [x, y] of [
  [870, 1295],
  [630, 1300],
  [1635, 1410],
  [1730, 1405],
  [459, 1072],
  [910, 862],
])
  add("barrel", x, y, { footprint: { type: "circle", radius: 7 } });
for (const [x, y] of [
  [970, 900],
  [1270, 920],
  [465, 700],
  [620, 760],
  [1570, 660],
  [1700, 1160],
  [850, 1195],
  [1465, 1295],
  [850, 490],
  [1020, 570],
])
  add("flowers", x, y);
for (const [x, y] of [
  [640, 1240],
  [800, 1220],
  [1660, 1350],
  [1750, 1350],
])
  add("exile-stall", x, y, {
    footprint: { type: "box", left: -22, right: 22, top: -15, bottom: 0 },
  });
// Continuous medieval frontages: adjoining plots share their party-wall line.
// Preserve service doors and the road network while replacing isolated villas by blocks.
export const URBAN_GROUND = [
  [250, 510],
  [490, 300],
  [940, 230],
  [1500, 240],
  [1930, 500],
  [2010, 1040],
  [1960, 1360],
  [1450, 1380],
  [1090, 1410],
  [620, 1370],
  [290, 1260],
  [190, 860],
];
export const PARKS = [
  { x: 980, y: 550, rx: 70, ry: 60 },
  { x: 1120, y: 170, rx: 145, ry: 60 },
];
export const isUrbanGround = (x, y) =>
  insidePolygon(x, y, URBAN_GROUND) &&
  !PARKS.some((p) => Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry) < 1);
const blocksApron = (a, b) =>
  b.kind === "exile-house" &&
  a.y !== b.y &&
  footprintsOverlap(
    {
      ...a,
      footprint: { ...a.footprint, left: -a.w / 2, right: a.w / 2, bottom: 32 },
    },
    {
      ...b,
      footprint: { ...b.footprint, left: -b.w / 2, right: b.w / 2, bottom: 32 },
    },
  );
const anchors = [...BUILDINGS];
for (const p of anchors) {
  p.floors = p.service ? 3 : 2 + (p.x % 3 === 0 ? 1 : 0);
  p.h = p.floors * 34 + 116;
}
for (const anchor of anchors) {
  for (const side of [-1, 1]) {
    let edge = anchor.x + (side * anchor.w) / 2;
    for (let n = 0; n < 4; n++) {
      const w = 64 + ((anchor.x + anchor.y + n * 17) % 4) * 8,
        x = edge + (side * w) / 2,
        y = anchor.y;
      const floors = 2 + ((anchor.x + n) % 3 === 0 ? 1 : 0),
        candidate = building(
          `block-${anchor.id}-${side}-${n}`,
          [
            "Logis des Navigateurs",
            "Logis des Tisserands",
            "Logis des Écumeurs",
            "Logis du Refuge",
          ][(n + anchor.x) % 4],
          x,
          y,
          w,
          floors * 34 + 116,
          ["clay", "wine", "ochre", "slate"][(n + anchor.y) % 4],
        );
      candidate.floors = floors;
      candidate.attachedTo = n
        ? `block-${anchor.id}-${side}-${n - 1}`
        : anchor.id;
      candidate.footprint = {
        type: "box",
        left: -w / 2 + 1,
        right: w / 2 - 1,
        top: anchor.footprint.top,
        bottom: 0,
      };
      const box = candidate.footprint;
      let clear = true;
      for (let yy = box.top - 4; yy <= 8; yy += 5)
        for (let xx = box.left - 3; xx <= box.right + 3; xx += 5) {
          if (
            landDistance(x + xx, y + yy) < 22 ||
            roadDistance(x + xx, y + yy) < 5
          ) {
            clear = false;
            break;
          }
        }
      if (
        !clear ||
        [...BUILDINGS, ...STREET_PROPS, TOWN_FOUNTAIN].some(
          (p) => footprintsOverlap(candidate, p) || blocksApron(candidate, p),
        ) ||
        Object.values(SERVICES).some(
          (p) =>
            Math.abs(p.x - x) < w / 2 + 18 &&
            p.y > y + box.top - 18 &&
            p.y < y + 25,
        )
      )
        break;
      BUILDINGS.push(candidate);
      edge = x + (side * w) / 2;
    }
  }
}
// Fill the former lawns with residential blocks; keep parks and all existing streets open.
for (const y of [330, 450, 520, 690, 880, 960, 1050, 1140, 1220])
  for (let x = 300; x < 1980; x += 72) {
    const w = 72,
      floors = 2 + ((x + y) % 5 === 0 ? 1 : 0),
      candidate = building(
        `urban-${x}-${y}`,
        "Logis du Comptoir",
        x,
        y,
        w,
        floors * 34 + 116,
        ["clay", "wine", "ochre"][(x + y) % 3],
      );
    candidate.floors = floors;
    candidate.footprint = {
      type: "box",
      left: -35,
      right: 35,
      top: -62,
      bottom: 0,
    };
    let clear = true;
    for (let yy = -70; yy <= 22; yy += 6)
      for (let xx = -39; xx <= 39; xx += 6)
        if (
          !isUrbanGround(x + xx, y + yy) ||
          landDistance(x + xx, y + yy) < 32 ||
          roadDistance(x + xx, y + yy) < 9
        )
          clear = false;
    if (
      !clear ||
      [...BUILDINGS, ...STREET_PROPS, TOWN_FOUNTAIN].some(
        (p) => footprintsOverlap(candidate, p) || blocksApron(candidate, p),
      ) ||
      Object.values(SERVICES).some(
        (p) => Math.abs(p.x - x) < 55 && p.y > y - 80 && p.y < y + 33,
      )
    )
      continue;
    const neighbor = BUILDINGS.find(
      (p) => p.y === y && Math.abs(Math.abs(p.x - x) - (p.w + w) / 2) < 2,
    );
    if (neighbor) candidate.attachedTo = neighbor.id;
    BUILDINGS.push(candidate);
  }

// Close shared collision walls as well as the visible façades.
for (const p of BUILDINGS.filter((p) => p.attachedTo)) {
  const neighbor = BUILDINGS.find((b) => b.id === p.attachedTo);
  if (p.x < neighbor.x) {
    p.footprint.right = p.w / 2;
    neighbor.footprint.left = -neighbor.w / 2;
  } else {
    p.footprint.left = -p.w / 2;
    neighbor.footprint.right = neighbor.w / 2;
  }
}
// A frontage shares one sidewalk and one street connection instead of a path per door.
ROADS.splice(streets.length);
ENTRANCES.length = 0;
export const FRONTAGES = [];
for (const y of new Set(BUILDINGS.map((p) => p.y))) {
  const row = BUILDINGS.filter((p) => p.y === y).sort((a, b) => a.x - b.x);
  let block = [];
  const finish = () => {
    if (!block.length) return;
    FRONTAGES.push(block.map((p) => p.id));
    if (block.length > 1) {
      const first = block[0],
        last = block.at(-1);
      ROADS.push(
        road(`frontage-${first.id}`, 14, [
          [first.x - first.w / 2, y + 14],
          [last.x + last.w / 2, y + 14],
        ]),
      );
    }
    const representative = [...block].sort(
      (a, b) => roadDistance(a.x, a.y + 28) - roadDistance(b.x, b.y + 28),
    )[0];
    connectEntrance(representative);
    for (const p of block)
      if (!ENTRANCES.some((e) => e.id === p.id))
        ENTRANCES.push({ id: p.id, x: p.x, y: p.y + 12 });
    block = [];
  };
  for (const house of row) {
    const previous = block.at(-1);
    if (previous && house.x - house.w / 2 - (previous.x + previous.w / 2) > 6)
      finish();
    block.push(house);
  }
  finish();
}
const trees = [];
for (let y = 170; y < 1370; y += 93)
  for (let x = 240; x < 2040; x += 119) {
    const px = x + Math.round(Math.sin(x + y) * 23),
      py = y + Math.round(Math.cos(x - y) * 19);
    if (
      landDistance(px, py) < 48 ||
      roadDistance(px, py) < 53 ||
      isUrbanGround(px, py)
    )
      continue;
    if (
      [...BUILDINGS, ...STREET_PROPS].some(
        (p) =>
          Math.abs(px - p.x) < (p.w || 70) / 2 + 43 &&
          py > p.y - (p.h || 70) - 20 &&
          py < p.y + 55,
      )
    )
      continue;
    trees.push({
      id: `exile-tree-${trees.length}`,
      kind: "tree",
      x: px,
      y: py,
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
  for (const p of [EXILE_SPAWN, EXILE_RETURN, ...Object.values(SERVICES)])
    if (!canWalkExile(p.x, p.y))
      errors.push(`${p.id || "entry"}: inaccessible`);
  return errors;
}
export function exileDistrict(x, y) {
  return y > 1300
    ? "Le port de l’Exil"
    : y < 600
      ? "Les jardins du Premier Accueil"
      : x < 900
        ? "Le quartier des artisans"
        : x > 1450
          ? "Les allées du Levant"
          : "La place du Refuge";
}
