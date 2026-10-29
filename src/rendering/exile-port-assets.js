// Frame bounds are measured from source alpha and stored in the atlas manifest.
// Loading only decodes images; collision geometry remains independent.
import atlasFrames from "../assets/exile/atlas-frames.json" with { type: "json" };
const banks = [
  {
    url: new URL("../assets/exile/port-landmarks.png", import.meta.url).href,
    frames: atlasFrames[0].frames,
  },
  {
    url: new URL("../assets/exile/port-streets.png", import.meta.url).href,
    frames: atlasFrames[1].frames,
  },
];
let version = 0;
const frames = {};
export const portAssetVersion = () => version;
export function loadPortAssets() {
  if (typeof Image === "undefined") return;
  for (const bank of banks) {
    if (bank.image) continue;
    const image = new Image();
    bank.image = image;
    image.onload = () => {
      for (const [key, rect] of Object.entries(bank.frames))
        frames[key] = { ...rect, image };
      version++;
    };
    image.src = bank.url;
  }
}
function drawFrame(g, key, p) {
  const f = frames[key];
  if (!f) return false;
  const w = p.w + (p.asset === "gate" ? 0 : 12),
    h = (w * f.h) / f.w;
  g.drawImage(f.image, f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
  return true;
}
export function drawPortLandmark(g, p) {
  return drawFrame(g, p.asset, p);
}
const residenceKey = (p) =>
  `${p.district === "artisans" ? "artisan" : "merchant"}-${Math.floor(p.x + p.y) % 3}`;
export function portSpriteSize(p) {
  const f = frames[p.asset || residenceKey(p)];
  if (!f) return null;
  const w = p.w + (p.asset === "gate" ? 0 : 12);
  return { w, h: (w * f.h) / f.w };
}
export function drawPortResidence(g, p) {
  return drawFrame(g, residenceKey(p), p);
}

const box = (g, x, y, w, h, color) => {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const line = (g, x, y, xx, yy, color, width = 1) => {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
};
function arch(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + w / 2);
  g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  g.lineTo(x + w, y + h);
  g.closePath();
  g.fill();
}
export function drawHarborGate(g, p) {
  if (drawPortLandmark(g, p)) return;
  // Immediate fallback during the single atlas load; the central route stays visible.
  for (const side of [-1, 1]) {
    box(g, side * 65 - 24, -90, 48, 90, "#c4baa0");
    box(g, side * 65 - 20, -89, 39, 88, "#e2d3b0");
    for (let y = -83; y < 0; y += 9)
      line(g, side * 65 - 23, y, side * 65 + 23, y, "#a89a7c");
    for (let x = side * 65 - 25; x < side * 65 + 22; x += 13)
      box(g, x, -96, 8, 11, "#e5d5af");
    box(g, side * 65 - 9, -73, 18, 47, "#365e89");
  }
  arch(g, -48, -67, 96, 38, "#d3c19a");
  g.save();
  g.globalCompositeOperation = "destination-out";
  arch(g, -36, -58, 72, 61, "#000");
  g.restore();
}
export function drawCargoCrane(g) {
  box(g, -10, -4, 20, 7, "#79654c");
  box(g, -7, -11, 14, 8, "#b19a6a");
  box(g, -3, -87, 6, 80, "#6c503a");
  box(g, -2, -86, 2, 76, "#c09b60");
  line(g, -1, -82, 36, -57, "#85613e", 6);
  line(g, 0, -52, 35, -57, "#b18a54", 3);
  line(g, 30, -60, 30, -12, "#d3bd84");
  line(g, 29, -12, 33, -8, "#59605b", 2);
  line(g, 33, -8, 30, -5, "#59605b", 2);
  line(g, -1, -76, 35, -57, "#d4bb82");
  box(g, -11, -38, 15, 12, "#876240");
  box(g, -10, -37, 13, 2, "#c2a16a");
  for (let i = 0; i < 5; i++) box(g, -8 + i * 2, -35, 1, 7, "#d8bc7c");
}
export function drawPortGround(g, map) {
  // Limestone revetment sits on the coast, leaving the three pier approaches open.
  for (let i = 1; i < map.QUAY_EDGE.length; i++) {
    const a = map.QUAY_EDGE[i - 1],
      b = map.QUAY_EDGE[i],
      n = Math.ceil((b[0] - a[0]) / 12);
    for (let j = 0; j < n; j++) {
      const t = j / n,
        x = a[0] + (b[0] - a[0]) * t,
        y = a[1] + (b[1] - a[1]) * t - 4;
      if (
        map.DOCKS.some((d) => x + 12 > d.x - 7 && x < d.x + d.w + 7) ||
        Math.abs(x - map.PORT_GATE.x) < 100
      )
        continue;
      box(g, x, y - 23, 13, 27, "#8c8f81");
      box(g, x, y - 24, 12, 24, "#c3b999");
      for (let row = 0; row < 3; row++) {
        line(g, x, y - 20 + row * 7, x + 12, y - 20 + row * 7, "#9a987f");
        box(g, x + (row % 2 ? 2 : 7), y - 18 + row * 7, 1, 5, "#a5a087");
      }
      if (j % 4 === 1) {
        arch(g, x - 1, y - 19, 14, 18, "#798b82");
        arch(g, x + 2, y - 16, 8, 14, "#526e6d");
      }
      box(g, x - 1, y - 28, 14, 4, "#e1d2ac");
      if (j % 3 === 0) box(g, x, y - 33, 6, 7, "#d9c9a3");
    }
  }
  for (const p of map.STAIRS) {
    const left = p.x - p.w / 2,
      top = p.y - p.length;
    box(g, left - 5, top - 4, p.w + 10, p.length + 8, "#9f9982");
    box(g, left - 3, top - 3, p.w + 6, p.length + 6, "#e4d5af");
    for (let y = top; y < p.y; y += 5) {
      box(g, left, y, p.w, 4, "#d2c5a3");
      box(g, left, y, p.w, 1, "#f3e4bf");
      box(g, left, y + 4, p.w, 1, "#9b9d89");
    }
    for (const x of [left - 6, left + p.w + 2]) {
      box(g, x, top - 5, 5, p.length + 12, "#c5ba99");
      box(g, x, top - 7, 5, 3, "#ecddba");
    }
  }
}
export function drawPortEmblem(g, x, y, color = "#d6b766") {
  box(g, x - 6, y - 5, 12, 6, color);
  box(g, x - 4, y - 8, 8, 5, color);
  box(g, x - 2, y - 10, 4, 3, color);
  box(g, x - 3, y - 4, 1, 2, "#6a6149");
  box(g, x + 2, y - 4, 1, 2, "#6a6149");
  box(g, x - 2, y - 8, 4, 1, "#f5df9a");
}
export function drawWorkshopDetails(g, p) {
  if (p.asset) return;
  const a = p.w / 2;
  if (p.district === "artisans") {
    // Copper vent and external timber hoist identify working buildings.
    box(g, a - 12, -p.h + 33, 6, 31, "#a16b43");
    box(g, a - 14, -p.h + 34, 10, 3, "#d4a168");
    line(g, a - 6, -62, a - 23, -74, "#785b3b", 3);
    line(g, a - 21, -74, a - 21, -36, "#cdb17d");
    box(g, a - 26, -35, 10, 7, "#8f7250");
    if (p.w > 75) {
      box(g, -a + 8, -13, 19, 4, "#6e7b7a");
      box(g, -a + 3, -16, 26, 3, "#aeb5a0");
      box(g, -a + 11, -9, 10, 7, "#686a5e");
    }
  } else if (p.archetype === "arcade") {
    for (const x of [-a + 5, a - 21]) {
      arch(g, x, -31, 16, 30, "#9d8968");
      arch(g, x + 2, -28, 12, 26, "#605c4b");
      box(g, x - 2, -4, 20, 4, "#bdb697");
    }
  }
}

// Terraces and ramparts use the same stone palette as the harbor gate.
export function drawTerraceGround(g, map) {
  g.save();
  g.beginPath();
  map.URBAN_GROUND.forEach(([x, y], i) =>
    i ? g.lineTo(x, y) : g.moveTo(x, y),
  );
  g.closePath();
  g.clip();
  for (const t of map.TERRACES) {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(map.MAP_SIZE.width, 0);
    g.lineTo(map.MAP_SIZE.width, t.points.at(-1)[1] - t.height);
    for (const [x, y] of [...t.points].reverse()) g.lineTo(x, y - t.height);
    g.lineTo(0, t.points[0][1] - t.height);
    g.closePath();
    g.fillStyle = "rgba(255,239,197,.085)";
    g.fill();
  }
  g.restore();
  for (const t of map.TERRACES) {
    g.save();
    g.beginPath();
    t.points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (const [x, y] of [...t.points].reverse()) g.lineTo(x, y - t.height);
    g.closePath();
    g.fillStyle = "#a49e86";
    g.fill();
    g.clip();
    for (
      let y = Math.min(...t.points.map((p) => p[1])) - t.height;
      y < Math.max(...t.points.map((p) => p[1]));
      y += 6
    )
      for (let x = 90; x < 1350; x += 14) {
        box(g, x + (Math.round(y / 6) % 2) * 7, y, 12, 5, "#c6b99a");
        box(g, x + (Math.round(y / 6) % 2) * 7, y, 12, 1, "#ddcfac");
      }
    g.restore();
    g.strokeStyle = "#eee0bd";
    g.lineWidth = 3;
    g.beginPath();
    t.points.forEach(([x, y], i) =>
      i ? g.lineTo(x, y - t.height) : g.moveTo(x, y - t.height),
    );
    g.stroke();
    g.strokeStyle = "#776f5b55";
    g.lineWidth = 2;
    g.beginPath();
    t.points.forEach(([x, y], i) =>
      i ? g.lineTo(x, y + 2) : g.moveTo(x, y + 2),
    );
    g.stroke();
  }
}
export function rampartPieces(map) {
  return map.RAMPARTS.flatMap((line, wall) =>
    line.slice(1).map((b, i) => {
      const a = line[i];
      return {
        id: `courtine-${wall}-${i}`,
        kind: "exile-rampart",
        x: (a[0] + b[0]) / 2,
        y: Math.max(a[1], b[1]),
        bounds: {
          left: Math.min(a[0], b[0]) - 12,
          right: Math.max(a[0], b[0]) + 12,
          top: Math.min(a[1], b[1]) - 48,
          bottom: Math.max(a[1], b[1]) + 5,
        },
        draw(g) {
          drawRampart(g, a, b);
        },
      };
    }),
  );
}
function drawRampart(g, a, b) {
  const minX = Math.min(a[0], b[0]) - 7,
    maxX = Math.max(a[0], b[0]) + 7,
    minY = Math.min(a[1], b[1]) - 39,
    maxY = Math.max(a[1], b[1]);
  g.save();
  g.beginPath();
  g.moveTo(a[0] - 6, a[1]);
  g.lineTo(b[0] + 6, b[1]);
  g.lineTo(b[0] + 6, b[1] - 38);
  g.lineTo(a[0] - 6, a[1] - 38);
  g.closePath();
  g.fillStyle = "#b8ad91";
  g.fill();
  g.clip();
  for (let y = Math.floor(minY / 8) * 8; y <= maxY; y += 8)
    for (let x = Math.floor(minX / 16) * 16; x <= maxX; x += 16) {
      box(g, x + (y % 16 ? 0 : 8), y, 14, 7, "#cbbb9a");
      box(g, x + (y % 16 ? 0 : 8), y, 14, 1, "#e4d4af");
    }
  g.restore();
  line(g, a[0], a[1] - 38, b[0], b[1] - 38, "#eadbb8", 5);
  line(g, a[0], a[1] + 1, b[0], b[1] + 1, "#756e5755", 2);
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 17));
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      x = a[0] + (b[0] - a[0]) * t,
      y = a[1] + (b[1] - a[1]) * t;
    box(g, x - 4, y - 46, 8, 10, "#c8b797");
    box(g, x - 4, y - 47, 8, 2, "#f0dfb8");
  }
}
