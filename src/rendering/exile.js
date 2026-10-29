import {
  drawTerraceGround,
  rampartPieces,
  portSpriteSize,
  loadPortAssets,
  portAssetVersion,
  drawPortLandmark,
  drawPortResidence,
  drawHarborGate,
  drawCargoCrane,
  drawPortGround,
  drawPortEmblem,
  drawWorkshopDetails,
} from "./exile-port-assets.js";
import * as map from "../world/exile-map.js";
import { createSpriteAtlas } from "./sprites.js";
import { texturePixel, hash } from "./textures.js";
const poly = (g, pts, fill, stroke) => {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1;
    g.stroke();
  }
};
const ellipse = (g, x, y, rx, ry, c) => {
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
};
const rect = (g, x, y, w, h, c) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function tile(material) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d"),
    pixels = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      let rgba;
      rgba = texturePixel(
        ["pavers", "courtyard"].includes(material) ? "harbor-stone" : material,
        x,
        y,
      );
      if (material === "courtyard")
        rgba = rgba.map((v, i) => (i < 3 ? v - 12 : v));
      pixels.data.set(rgba, (y * 64 + x) * 4);
    }
  g.putImageData(pixels, 0, 0);
  return c;
}
function path(g, r) {
  g.beginPath();
  r.points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
}
function plotGround(g, map) {
  const water = g.createPattern(tile("harbor-water"), "repeat"),
    grass = g.createPattern(tile("grass"), "repeat"),
    pavers = g.createPattern(tile("pavers"), "repeat"),
    cobbles = g.createPattern(tile("harbor-cobbles"), "repeat"),
    sidewalk = g.createPattern(tile("harbor-sidewalk"), "repeat");
  rect(g, 0, 0, map.MAP_SIZE.width, map.MAP_SIZE.height, water);
  poly(g, map.LAND, "#596e65");
  g.save();
  poly(g, map.LAND);
  g.clip();
  rect(g, 0, 0, map.MAP_SIZE.width, map.MAP_SIZE.height, grass);
  poly(g, map.URBAN_GROUND, g.createPattern(tile("courtyard"), "repeat"));
  for (const p of map.PARKS) ellipse(g, p.x, p.y, p.rx, p.ry, grass);
  poly(g, map.LAND);
  // Exposed stone coast is drawn from the same contour used for collision.
  g.strokeStyle = "#708f86";
  g.lineWidth = 15;
  g.stroke();
  g.save();
  poly(g, map.LAND);
  g.clip();
  g.strokeStyle = "#c3c9aa";
  g.lineWidth = 5;
  g.stroke();
  g.restore();
  // All border strokes precede all paving strokes: intersections share one material.
  g.lineCap = g.lineJoin = "round";
  for (const r of map.ROADS) {
    path(g, r);
    g.lineWidth = r.width + 20;
    g.strokeStyle = "#747d80";
    g.stroke();
  }
  for (const p of map.PLAZAS)
    ellipse(g, p.x, p.y, p.rx + 5, p.ry + 5, "#ab9f82");
  for (const r of map.ROADS) {
    path(g, r);
    g.lineWidth = r.width + 16;
    g.strokeStyle = sidewalk;
    g.stroke();
  }
  for (const p of map.PLAZAS)
    ellipse(g, p.x, p.y, p.rx + 2, p.ry + 2, "#e5d5ad");
  for (const r of map.ROADS) {
    path(g, r);
    g.lineWidth = r.width;
    g.strokeStyle = cobbles;
    g.stroke();
  }
  for (const r of map.SIDEWALKS) {
    path(g, r);
    g.lineCap = "butt";
    g.lineWidth = r.width;
    g.strokeStyle = sidewalk;
    g.stroke();
  }
  g.lineCap = "round";
  for (const p of map.PLAZAS) ellipse(g, p.x, p.y, p.rx, p.ry, pavers);
  // Gardens, clover and flower beds are planted off every road and building apron.
  for (let i = 0; i < 2200; i++) {
    const x = 80 + (hash(i, 2, 18) % (map.MAP_SIZE.width - 160)),
      y = 90 + (hash(i, 3, 18) % (map.MAP_SIZE.height - 200));
    if (
      map.isUrbanGround(x, y) ||
      map.roadDistance(x, y) < 12 ||
      map.BUILDINGS.some(
        (p) =>
          Math.abs(x - p.x) < p.w / 2 + 10 &&
          y > p.y - p.h * 0.5 &&
          y < p.y + 20,
      )
    )
      continue;
    rect(g, x, y, 2, 1, i % 7 ? "#92a35f" : "#dce5ad");
    if (i % 13 === 0) {
      rect(g, x, y - 2, 1, 3, "#75965c");
      rect(g, x - 1, y - 3, 3, 2, i % 2 ? "#f5dfb8" : "#dab2c5");
    }
  }
  // Quays: dressed stone follows the southern shoreline, with deliberate breaks for piers.
  g.strokeStyle = "#778984";
  g.lineWidth = 10;
  g.beginPath();
  map.QUAY_EDGE.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.strokeStyle = "#d3cfab";
  g.lineWidth = 3;
  g.stroke();
  drawTerraceGround(g, map);
  drawPortGround(g, map);
  // A memorial mosaic belongs to the square, not to the paving texture.
  g.strokeStyle = "#c7b77c";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(map.FOUNTAIN.x, map.FOUNTAIN.y, 52, 39, 0, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ellipse(
      g,
      map.FOUNTAIN.x + Math.cos(a) * 46,
      map.FOUNTAIN.y + Math.sin(a) * 33,
      7,
      5,
      ["#85bacc", "#c3a26d", "#bf775d", "#a7c6af"][i],
    );
  }
  g.restore();
  for (const d of map.DOCKS) {
    rect(g, d.x - 3, d.y - 3, d.w + 6, d.h + 6, "#5a5143");
    rect(g, d.x, d.y, d.w, d.h, "#b79260");
    for (let y = d.y; y < d.y + d.h; y += 9) {
      rect(g, d.x, y, d.w, 1, "#735c42");
      rect(g, d.x + 2, y + 1, d.w - 4, 1, "#d4b782");
      for (let x = d.x + 5; x < d.x + d.w - 3; x += 28)
        rect(g, x, y + 3, 1, 1, "#6c5a43");
    }
    for (let y = d.y; y < d.y + d.h; y += 40) {
      for (const x of [d.x, d.x + d.w - 3]) {
        rect(g, x - 2, y, 6, 8, "#786347");
        rect(g, x - 2, y, 6, 2, "#e1c997");
      }
    }
  }
}
const roofColors = {
  navy: ["#2f496c", "#496d92", "#809bb4"],
  clay: ["#8e493b", "#b86748", "#d79768"],
  ochre: ["#9b6245", "#bf8a59", "#d9b179"],
  teal: ["#527c80", "#709598", "#94b2ac"],
  wine: ["#8f535b", "#b27672", "#d49a85"],
  slate: ["#647a83", "#879699", "#afbbb0"],
};
function window(g, x, y, w = 18, h = 22) {
  rect(g, x - 2, y - 2, w + 4, h + 4, "#6c5640");
  rect(g, x, y, w, h, "#739a9b");
  rect(g, x + 2, y + 2, w - 4, 2, "#b9c8ad");
  rect(g, x + w / 2, y, 2, h, "#ddc696");
  rect(g, x, y + h / 2, w, 2, "#ddc696");
  rect(g, x - 5, y, 3, h, "#9b7952");
  rect(g, x + w + 2, y, 3, h, "#9b7952");
  rect(g, x - 3, y + h + 3, w + 6, 4, "#7e6548");
  for (let i = 0; i < 5; i++) {
    rect(g, x + i * 4, y + h + 1, 3, 3, "#659261");
    rect(g, x + i * 4, y + h, 2, 2, i % 2 ? "#efbd9d" : "#d58faa");
  }
}
function building(g, p) {
  if (p.asset ? drawPortLandmark(g, p) : drawPortResidence(g, p)) return;
  const w = p.w,
    a = w / 2,
    floors = p.floors || 2,
    wall = floors * 34 + 32,
    h = p.h,
    roof = roofColors[p.roof] || roofColors.clay;
  const plaster = ["#dfcba7", "#d9b99a", "#d4c6a9", "#e5d4ad"][
    Math.floor(p.x + p.y) % 4
  ];
  ellipse(g, 3, 4, a + 5, 8, "#384e4733");
  // Party walls meet exactly; adjoining façades form a continuous street frontage.
  rect(g, -a, -wall, w, wall, "#735b45");
  rect(g, -a + 3, -wall + 2, w - 6, wall - 3, plaster);
  for (let y = -24; y < 0; y += 8)
    for (let x = -a + 2; x < a - 2; x += 16)
      rect(g, x + (y % 16 ? 0 : 7), y, 14, 7, y % 16 ? "#a5a992" : "#c1bea0");
  for (const x of [-a + 1, a - 4]) rect(g, x, -wall, 3, wall, "#735540");
  for (let floor = 1; floor <= floors; floor++) {
    const y = -floor * 34 - 7;
    rect(g, -a, y + 28, w, 4, "#866147");
    const bay = w > 115 ? 3 : 2,
      bayWidth = Math.min(17, Math.floor(w / (bay * 2.4)));
    for (let i = 0; i < bay; i++) {
      const x = -a + ((i + 1) * w) / (bay + 1) - bayWidth / 2;
      window(g, x, y, bayWidth, 20);
    }
    // Diagonal timber braces on alternating plaster bays.
    if (floor % 2 === 0) {
      g.strokeStyle = "#9b7652";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-a + 6, y + 24);
      g.lineTo(-a + 20, y + 5);
      g.moveTo(a - 6, y + 24);
      g.lineTo(a - 20, y + 5);
      g.stroke();
    }
  }
  rect(g, -12, -29, 24, 30, "#654833");
  rect(g, -9, -26, 18, 26, "#a67b4d");
  for (let x = -7; x < 9; x += 4) rect(g, x, -25, 1, 25, "#705034");
  rect(g, 5, -13, 2, 2, "#e7c580");
  rect(g, -17, 0, 34, 4, "#c4bfa0");
  const back = [-4, -h],
    front = [0, -wall - 40],
    left = [-a - 3, -wall - 40],
    right = [a + 3, -wall - 40],
    lf = [-a - 3, -wall],
    rf = [a + 3, -wall];
  poly(g, [lf, front, rf], plaster, "#70553e");
  const plane = (pts, shade, direction) => {
    g.save();
    poly(g, pts, roof[shade], "#674c3c");
    g.clip();
    for (let y = -h - 50; y < -wall + 60; y += 6) {
      g.strokeStyle = roof[Math.min(2, shade + 1)];
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-a - 12, y - direction * a * 0.6);
      g.lineTo(a + 12, y + direction * a * 0.6);
      g.stroke();
      for (let x = -a - 12; x < a + 12; x += 9) {
        rect(
          g,
          x + (Math.round(y / 6) % 2) * 4,
          y + direction * x * 0.6,
          1,
          5,
          roof[0],
        );
      }
    }
    g.restore();
  };
  plane([left, back, front, lf], 1, -1);
  plane([back, right, rf, front], 0, 1);
  g.strokeStyle = "#b59b79";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(...back);
  g.lineTo(...front);
  g.stroke();
  g.strokeStyle = "#73523c";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(...lf);
  g.lineTo(...front);
  g.lineTo(...rf);
  g.stroke();
  if (w > 85) window(g, -7, -wall - 24, 14, 15);
  const chimneyX = a * 0.48;
  rect(g, chimneyX, -h + 14, 10, 25, "#9c8c73");
  for (let yy = -h + 16; yy < -h + 36; yy += 6)
    rect(g, chimneyX, yy, 10, 1, "#cbb89a");
  rect(g, chimneyX - 2, -h + 12, 14, 4, "#d6c5a6");
  // Small projecting bays and shop canopies break up long rows of façades.
  if (!p.service && p.x % 3 === 0) {
    rect(g, -a - 2, -65, 3, 28, "#d3c19e");
    rect(g, -a - 3, -67, 5, 4, "#856046");
  }
  if (p.service) {
    const labels = {
      forge: "FORGE",
      handyman: "BRICOLAGE",
      sawmill: "SCIERIE",
      petshop: "ANIMALERIE",
      armor: "ARMURERIE",
      magic: "ENCHANTEUR",
      trader: "ÉCHOPPE",
      harbor: "CAPITAINERIE",
      inn: "AUBERGE",
      history: "PREMIER ACCUEIL",
    };
    const canopy = Math.min(w - 8, 100);
    poly(
      g,
      [
        [-canopy / 2, -29],
        [-canopy / 2 + 4, -43],
        [canopy / 2 - 4, -43],
        [canopy / 2, -29],
      ],
      "#e0d0a5",
    );
    for (let i = 0; i < 8; i += 2)
      poly(
        g,
        [
          [-canopy / 2 + (i * canopy) / 8, -29],
          [-canopy / 2 + 4 + (i * (canopy - 8)) / 8, -43],
          [-canopy / 2 + 4 + ((i + 1) * (canopy - 8)) / 8, -43],
          [-canopy / 2 + ((i + 1) * canopy) / 8, -29],
        ],
        p.roof === "wine" ? "#ab6157" : "#658c87",
      );
    rect(g, -a + 6, -20, w - 12, 9, "#526b60");
    g.font = "6px monospace";
    g.textAlign = "center";
    g.fillStyle = "#f0dfb4";
    g.fillText(labels[p.service], 0, -13);
  }
  drawWorkshopDetails(g, p);
}
function lamp(g) {
  rect(g, -2, -38, 4, 38, "#536358");
  rect(g, -5, -41, 10, 5, "#40584e");
  rect(g, -4, -36, 8, 10, "#c7ad6c");
  rect(g, -2, -35, 4, 7, "#ffe6a2");
  rect(g, -4, -26, 8, 2, "#6c7054");
}
function fountain(g) {
  ellipse(g, 2, 4, 40, 19, "#435f542e");
  ellipse(g, 0, -2, 34, 23, "#778e86");
  ellipse(g, 0, -6, 34, 21, "#d5ceaa");
  ellipse(g, 0, -7, 28, 16, "#5d9296");
  ellipse(g, 0, -8, 23, 12, "#8fbec0");
  rect(g, -5, -35, 10, 28, "#99a99a");
  rect(g, -8, -37, 16, 5, "#ddd5b3");
  ellipse(g, 0, -39, 13, 6, "#b2bba4");
  ellipse(g, 0, -40, 10, 4, "#70a5a5");
  ellipse(g, 0, -48, 7, 8, "#d8c484");
  rect(g, -2, -57, 4, 5, "#e8d9a0");
}
function stall(g, p) {
  rect(g, -22, -15, 44, 15, "#a98558");
  rect(g, -25, -17, 50, 4, "#d9b77d");
  for (let i = 0; i < 6; i++) {
    rect(g, -22 + i * 8, -42, 8, 14, i % 2 ? "#d9d2a9" : "#749f99");
  }
  poly(
    g,
    [
      [-25, -27],
      [-18, -43],
      [18, -43],
      [25, -27],
    ],
    "#ddd5b2",
  );
  for (let i = -2; i <= 2; i++)
    poly(
      g,
      [
        [i * 8 - 4, -27],
        [i * 6 - 3, -43],
        [i * 6 + 2, -43],
        [i * 8 + 3, -27],
      ],
      p.x % 3 ? "#739e98" : "#b47e6d",
    );
  rect(g, -22, -27, 3, 17, "#826646");
  rect(g, 19, -27, 3, 17, "#826646");
  for (let i = 0; i < 8; i++)
    ellipse(
      g,
      -17 + i * 5,
      -20 - (i % 2) * 2,
      3,
      3,
      ["#c98365", "#d4be78", "#8aa86c"][i % 3],
    );
}
function ship(g, x, y, color, caravel = false) {
  g.save();
  g.translate(x, y);
  ellipse(g, 2, 8, 30, 69, "#244e5b44");
  poly(
    g,
    [
      [0, -78],
      [27, -49],
      [28, 47],
      [0, 78],
      [-28, 47],
      [-27, -49],
    ],
    "#574b3c",
    "#d0ae78",
  );
  poly(
    g,
    [
      [0, -69],
      [21, -43],
      [22, 42],
      [0, 63],
      [-22, 42],
      [-21, -43],
    ],
    "#a27c51",
  );
  for (let yy = -45; yy < 50; yy += 8) rect(g, -20, yy, 40, 1, "#775a3d");
  rect(g, -2, -66, 4, 120, "#6e5138");
  g.strokeStyle = "#dac598";
  g.lineWidth = 1;
  for (const yy of [-44, 30]) {
    g.beginPath();
    g.moveTo(0, -65);
    g.lineTo(-24, yy);
    g.moveTo(0, -65);
    g.lineTo(24, yy);
    g.stroke();
  }
  poly(
    g,
    [
      [2, -56],
      [36, -7],
      [2, 18],
    ],
    color,
  );
  poly(
    g,
    [
      [-2, -50],
      [-29, -9],
      [-2, 13],
    ],
    "#e7dbb4",
  );
  rect(g, -2, 20, 4, 25, "#74533b");
  rect(g, -19, 39, 38, 13, "#7b6950");
  window(g, -12, 41, 8, 7);
  if (caravel)
    for (const yy of [-37, 32]) {
      rect(g, -1, yy - 25, 3, 55, "#604d37");
      poly(
        g,
        [
          [1, yy - 24],
          [29, yy + 5],
          [1, yy + 19],
        ],
        "#e6d9a6",
      );
      g.strokeStyle = "#d9bf86";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, yy - 22);
      g.lineTo(-20, yy + 21);
      g.stroke();
    }
  g.restore();
}
export function createExileEnvironment(mapOverride = map) {
  const map = mapOverride;
  loadPortAssets();
  const errors = map.validateExileMap();
  if (errors.length) throw Error(errors.join("; "));
  const ground = document.createElement("canvas");
  Object.assign(ground, map.MAP_SIZE);
  const g = ground.getContext("2d");
  g.imageSmoothingEnabled = false;
  plotGround(g, map);
  for (const p of map.SHIPS) ship(g, p.x, p.y, p.color, p.caravel);
  const atlas = createSpriteAtlas();
  const props = map.PROPS.map((p) => {
    const custom = [
      "exile-house",
      "exile-prop",
      "exile-gate",
      "exile-city-gate",
      "exile-rampart-tower",
      "exile-crane",
      "exile-lamp",
      "exile-fountain",
      "exile-stall",
    ].includes(p.kind);
    let sprite;
    if (!custom) sprite = atlas(p);
    else {
      const canvas = document.createElement("canvas");
      const size = [
        "exile-house",
        "exile-prop",
        "exile-gate",
        "exile-city-gate",
        "exile-rampart-tower",
      ].includes(p.kind)
        ? portSpriteSize(p)
        : null;
      canvas.width = Math.max(p.w || 80, size?.w || 0) + 70;
      canvas.height = Math.max(p.h || 90, size?.h || 0) + 35;
      const cg = canvas.getContext("2d"),
        anchorX = canvas.width / 2,
        anchorY = canvas.height - 10;
      cg.imageSmoothingEnabled = false;
      cg.translate(anchorX, anchorY);
      if (p.kind === "exile-prop") {
        if (!drawPortLandmark(cg, p))
          rect(cg, -p.w / 2, -p.h, p.w, p.h, "#526e81");
      } else if (p.kind === "exile-house") building(cg, p);
      else if (["exile-gate", "exile-city-gate"].includes(p.kind))
        drawHarborGate(cg, p);
      else if (p.kind === "exile-rampart-tower") drawPortLandmark(cg, p);
      else if (p.kind === "exile-crane") drawCargoCrane(cg);
      else if (p.kind === "exile-lamp") lamp(cg);
      else if (p.kind === "exile-fountain") fountain(cg);
      else stall(cg, p);
      sprite = { canvas, anchorX, anchorY };
    }
    const tight =
      p.kind === "exile-prop" ? portSpriteSize(p) || { w: p.w, h: p.h } : null;
    return {
      ...p,
      bounds: tight
        ? {
            left: p.x - tight.w / 2,
            right: p.x + tight.w / 2,
            top: p.y - tight.h,
            bottom: p.y,
          }
        : {
            left: p.x - sprite.anchorX,
            right: p.x - sprite.anchorX + sprite.canvas.width,
            top: p.y - sprite.anchorY,
            bottom: p.y - sprite.anchorY + sprite.canvas.height,
          },
      hitTest(x, y) {
        const sx = Math.floor(x - p.x + sprite.anchorX),
          sy = Math.floor(y - p.y + sprite.anchorY);
        return (
          sx >= 0 &&
          sy >= 0 &&
          sx < sprite.canvas.width &&
          sy < sprite.canvas.height &&
          sprite.canvas.getContext("2d").getImageData(sx, sy, 1, 1).data[3] > 32
        );
      },
      draw(ctx) {
        ctx.drawImage(
          sprite.canvas,
          p.x - sprite.anchorX,
          p.y - sprite.anchorY,
        );
      },
    };
  });
  return {
    ground,
    props: [...props, ...rampartPieces(map)],
    markers: [],
    land: map.LAND,
    assetVersion: portAssetVersion(),
  };
}
export function drawExileLife(g, s, foreground = false) {
  if (s.zone !== "exile") return;
  const t = s.time;
  if (!foreground) {
    // Shore glints and foam move on water only; docks are never overwritten.
    for (let i = 0; i < 44; i++) {
      const x = 120 + i * 29,
        y = 1050 + (i % 6) * 25;
      if (map.isLand(x, y) || map.onDock(x, y)) continue;
      rect(g, x + Math.sin(t * 0.6 + i) * 4, y, 6 + (i % 4), 1, "#b5d8ce88");
    }
    for (const p of map.BUILDINGS.filter(
      (p) => p.service === "forge" || p.service === "sawmill",
    ))
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.2 + i * 0.33) % 1;
        ellipse(
          g,
          p.x + p.w * 0.24 + Math.sin(t + i) * 3,
          p.y - p.h * 0.92 - k * 32,
          3 + k * 5,
          2 + k * 3,
          `rgba(225,222,198,${0.22 * (1 - k)})`,
        );
      }
    return;
  }
  const forge = map.BUILDINGS.find((p) => p.asset === "forge");
  if (forge)
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.7 + i * 0.25) % 1;
      rect(
        g,
        forge.x - 10 + Math.sin(t + i) * 4,
        forge.y - 24 - k * 18,
        1,
        2,
        i % 2 ? "#edb765" : "#e7d799",
      );
    }
  const f = map.FOUNTAIN;
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7,
      phase = (t * 1.3 + i * 0.15) % 1;
    rect(
      g,
      f.x + Math.cos(a) * phase * 23,
      f.y - 38 + phase * 28 - Math.sin(phase * Math.PI) * 12,
      1,
      3,
      "#d2eddf",
    );
  }
  for (const p of map.BUILDINGS.filter(
    (p) => p.service && !p.asset && portAssetVersion() < 2,
  )) {
    const x = p.x - p.w / 2 + 7,
      y = p.y - p.h * 0.55;
    rect(g, x, y, 2, 27, "#6b5d43");
    poly(
      g,
      [
        [x + 2, y],
        [x + 19, y + 2 + Math.sin(t * 2 + p.x) * 2],
        [x + 17, y + 14],
        [x + 2, y + 12],
      ],
      p.roof === "wine" ? "#c98c78" : "#86b4ac",
    );
  }
  for (const side of [-1, 1]) {
    const x = map.PORT_GATE.x + side * 106,
      y = map.PORT_GATE.y;
    rect(g, x - 1, y - 95, 2, 90, "#796d51");
    poly(
      g,
      [
        [x + 2, y - 91],
        [x + 20, y - 90 + Math.sin(t * 2) * 2],
        [x + 18, y - 51],
        [x + 10, y - 56],
        [x + 2, y - 51],
      ],
      "#345e86",
    );
    drawPortEmblem(g, x + 10, y - 71);
  }
  for (let i = 0; i < 7; i++) {
    const x = 200 + i * 150 + Math.sin(t * 0.12 + i) * 100,
      y = 1060 + (i % 3) * 45 + Math.cos(t * 0.3 + i) * 9;
    g.strokeStyle = "#e7e7cb";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 4, y + Math.sin(t * 5 + i) * 2);
    g.lineTo(x, y);
    g.lineTo(x + 4, y + Math.sin(t * 5 + i) * 2);
    g.stroke();
  }
}
