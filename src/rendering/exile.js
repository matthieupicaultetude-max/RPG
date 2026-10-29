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
        material === "pavers" ? "town-stone" : material,
        x,
        y,
      );
      pixels.data.set(rgba, (y * 64 + x) * 4);
    }
  g.putImageData(pixels, 0, 0);
  return c;
}
function path(g, r) {
  g.beginPath();
  r.points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
}
function plotGround(g) {
  const water = g.createPattern(tile("water"), "repeat"),
    grass = g.createPattern(tile("grass"), "repeat"),
    pavers = g.createPattern(tile("pavers"), "repeat");
  rect(g, 0, 0, map.MAP_SIZE.width, map.MAP_SIZE.height, water);
  poly(g, map.LAND, "#596e65");
  g.save();
  poly(g, map.LAND);
  g.clip();
  rect(g, 0, 0, map.MAP_SIZE.width, map.MAP_SIZE.height, grass);
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
    g.lineWidth = r.width + 10;
    g.strokeStyle = "#7f8b70";
    g.stroke();
  }
  for (const p of map.PLAZAS)
    ellipse(g, p.x, p.y, p.rx + 5, p.ry + 5, "#7f8b70");
  for (const r of map.ROADS) {
    path(g, r);
    g.lineWidth = r.width + 5;
    g.strokeStyle = "#d2c79d";
    g.stroke();
  }
  for (const p of map.PLAZAS)
    ellipse(g, p.x, p.y, p.rx + 2, p.ry + 2, "#d2c79d");
  for (const r of map.ROADS) {
    path(g, r);
    g.lineWidth = r.width;
    g.strokeStyle = pavers;
    g.stroke();
  }
  for (const p of map.PLAZAS) ellipse(g, p.x, p.y, p.rx, p.ry, pavers);
  // Gardens, clover and flower beds are planted off every road and building apron.
  for (let i = 0; i < 2200; i++) {
    const x = 180 + (hash(i, 2, 18) % 1870),
      y = 110 + (hash(i, 3, 18) % 1250);
    if (
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
  for (const p of map.BUILDINGS) {
    for (const side of [-1, 1]) {
      const cx = p.x + side * (p.w / 2 + 17),
        cy = p.y + 4;
      if (map.roadDistance(cx, cy) < 20 || !map.isLand(cx, cy)) continue;
      ellipse(g, cx, cy, 15, 19, "#7a8c55");
      ellipse(g, cx, cy - 1, 12, 16, "#5c8158");
      for (let k = 0; k < 18; k++) {
        const xx = cx - 9 + (hash(k, p.x, 8) % 19),
          yy = cy - 14 + (hash(k, p.y, 9) % 29);
        rect(
          g,
          xx,
          yy,
          3,
          2,
          k % 3 ? "#94ae75" : p.roof === "wine" ? "#e1b690" : "#c5acd0",
        );
      }
      rect(g, cx - 17, cy + 20, 34, 3, "#b0b295");
      rect(g, cx - 15, cy + 19, 30, 1, "#e0d3ac");
    }
  }
  // Quays: dressed stone follows the southern shoreline, with deliberate breaks for piers.
  for (let x = 310; x < 1990; x += 16) {
    const y = 1400 + Math.sin(x * 0.008) * 12;
    if (!map.isLand(x, y) || !map.isLand(x, y - 10)) continue;
    rect(g, x, y - 4, 16, 9, "#778984");
    rect(g, x, y - 5, 15, 3, "#d3cfab");
    rect(g, x + 1, y, 13, 3, "#9da99b");
  }
  // A memorial mosaic belongs to the square, not to the paving texture.
  g.strokeStyle = "#c7b77c";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(1120, 808, 67, 47, 0, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ellipse(
      g,
      1120 + Math.cos(a) * 58,
      808 + Math.sin(a) * 40,
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
  const { w, h } = p,
    a = w / 2,
    top = -h * 0.45,
    roof = roofColors[p.roof],
    wall = p.roof === "wine" ? "#e2cfaa" : "#e4d6b3";
  ellipse(g, 4, 4, a + 8, 10, "#384e4733");
  rect(g, -a + 7, top, w - 14, -top, "#67543f");
  rect(g, -a + 10, top + 3, w - 20, -top - 6, wall);
  // Stone foundation, offset coursing, and a shared timber frame on every house.
  for (let row = 0; row < 3; row++) {
    const y = -row * 9 - 9;
    for (let x = -a + 10; x < a - 9; x += 20) {
      const xx = x + (row % 2) * 8;
      rect(g, xx, y, 18, 7, row % 2 ? "#a7ad98" : "#bcc0a6");
    }
  }
  for (const x of [-a + 12, -a + 34, a - 34, a - 15])
    rect(g, x, top + 3, 4, -top - 4, "#856445");
  rect(g, -a + 9, top + 5, w - 18, 4, "#94724e");
  rect(g, -a + 8, -29, w - 16, 4, "#94724e");
  rect(g, -14, -38, 28, 39, "#715338");
  rect(g, -11, -36, 22, 35, "#ae8555");
  for (let x = -8; x < 10; x += 5) rect(g, x, -35, 1, 34, "#7b5b3e");
  rect(g, 7, -19, 3, 3, "#e8cf87");
  rect(g, -21, 0, 42, 5, "#b7b7a0");
  rect(g, -25, 5, 50, 3, "#d6ceb0");
  window(g, -a + 27, -53, 19, 21);
  window(g, a - 46, -53, 19, 21);
  const backRidge = [-5, -h],
    frontRidge = [0, -h * 0.72],
    backLeft = [-a - 7, -h * 0.71],
    frontLeft = [-a, -h * 0.43],
    backRight = [a, -h * 0.71],
    frontRight = [a + 7, -h * 0.43];
  poly(g, [frontLeft, frontRidge, frontRight], wall, "#785d42");
  rect(g, -2, -h * 0.7, 4, h * 0.27, "#846344");
  window(g, -9, -h * 0.58, 18, 19);
  function slope(points, shade) {
    g.save();
    poly(g, points, roof[shade], "#4d5a57");
    g.clip();
    for (let row = 0; row < 25; row++) {
      const y = -h + row * 7;
      g.strokeStyle = roof[Math.min(2, shade + 1)];
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-a - 20, y + 31);
      g.lineTo(a + 20, y - 31);
      g.stroke();
      for (let col = -12; col < 12; col++) {
        const x = col * 12 + (row % 2) * 6;
        g.strokeStyle = roof[0];
        g.beginPath();
        g.moveTo(x, y - x * 0.38);
        g.lineTo(x + 2, y + 7 - x * 0.38);
        g.stroke();
      }
    }
    g.restore();
  }
  slope([backLeft, backRidge, frontRidge, frontLeft], 1);
  slope([backRidge, backRight, frontRight, frontRidge], 0);
  g.strokeStyle = "#c4baa0";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(...backRidge);
  g.lineTo(...frontRidge);
  g.stroke();
  g.strokeStyle = "#776149";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(...frontLeft);
  g.lineTo(...frontRidge);
  g.lineTo(...frontRight);
  g.stroke();
  rect(g, a * 0.48, -h * 0.88, 12, 29, "#8b8f7e");
  rect(g, a * 0.48 + 2, -h * 0.88, 7, 27, "#bfc0a6");
  rect(g, a * 0.48 - 2, -h * 0.89, 16, 5, "#d7cfaf");
  if (["armor", "magic", "trader", "petshop"].includes(p.service)) {
    const left = -w * 0.32,
      right = w * 0.32;
    poly(
      g,
      [
        [left - 5, -34],
        [left, -49],
        [right, -49],
        [right + 5, -34],
      ],
      "#e3d7b2",
      "#796b51",
    );
    for (let i = 0; i < 8; i++)
      if (i % 2 === 0)
        poly(
          g,
          [
            [left - 5 + ((right - left + 10) * i) / 8, -34],
            [left + ((right - left) * i) / 8, -49],
            [left + ((right - left) * (i + 1)) / 8, -49],
            [left - 5 + ((right - left + 10) * (i + 1)) / 8, -34],
          ],
          p.roof === "wine" ? "#b57a70" : "#73a09b",
        );
    rect(g, left - 3, -34, 2, 28, "#8f704c");
    rect(g, right + 2, -34, 2, 28, "#8f704c");
  }
  if (p.service) {
    rect(g, -a + 20, -27, w - 40, 9, "#5e6f61");
    rect(g, -a + 23, -26, w - 46, 1, "#c9c69b");
    g.fillStyle = "#eee2bb";
    g.font = "6px monospace";
    g.textAlign = "center";
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
    g.fillText(labels[p.service], 0, -20);
  }
  // Ivy and planters are part of the façade silhouette, never collision walls.
  for (let i = 0; i < 9; i++) {
    const xx = -a + 13 + (i % 3) * 3,
      yy = -12 - i * 4;
    rect(g, xx, yy, 4, 4, i % 2 ? "#78995b" : "#587e58");
  }
  rect(g, a - 17, -8, 9, 8, "#ab7e54");
  ellipse(g, a - 13, -10, 8, 5, "#7a9e61");
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
function ship(g, x, y, color) {
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
  g.restore();
}
export function createExileEnvironment() {
  const errors = map.validateExileMap();
  if (errors.length) throw Error(errors.join("; "));
  const ground = document.createElement("canvas");
  Object.assign(ground, map.MAP_SIZE);
  const g = ground.getContext("2d");
  g.imageSmoothingEnabled = false;
  plotGround(g);
  ship(g, 1040, 1550, "#83a9a4");
  ship(g, 1665, 1535, "#ba8475");
  const atlas = createSpriteAtlas();
  const props = map.PROPS.map((p) => {
    const custom = [
      "exile-house",
      "exile-lamp",
      "exile-fountain",
      "exile-stall",
    ].includes(p.kind);
    let sprite;
    if (!custom) sprite = atlas(p);
    else {
      const canvas = document.createElement("canvas");
      canvas.width = (p.w || 80) + 70;
      canvas.height = (p.h || 90) + 35;
      const cg = canvas.getContext("2d"),
        anchorX = canvas.width / 2,
        anchorY = canvas.height - 10;
      cg.translate(anchorX, anchorY);
      if (p.kind === "exile-house") building(cg, p);
      else if (p.kind === "exile-lamp") lamp(cg);
      else if (p.kind === "exile-fountain") fountain(cg);
      else stall(cg, p);
      sprite = { canvas, anchorX, anchorY };
    }
    return {
      ...p,
      bounds: {
        left: p.x - (p.w || 70) / 2,
        right: p.x + (p.w || 70) / 2,
        top: p.y - (p.h || 80),
        bottom: p.y + 8,
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
  return { ground, props, markers: [], land: map.LAND };
}
export function drawExileLife(g, s, foreground = false) {
  if (s.zone !== "exile") return;
  const t = s.time;
  if (!foreground) {
    // Shore glints and foam move on water only; docks are never overwritten.
    for (let i = 0; i < 44; i++) {
      const x = 300 + i * 41,
        y = 1480 + (i % 6) * 35;
      if (map.isLand(x, y) || map.onDock(x, y)) continue;
      rect(g, x + Math.sin(t * 0.6 + i) * 4, y, 6 + (i % 4), 1, "#b5d8ce88");
    }
    for (const p of map.BUILDINGS.filter((p) => p.service))
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
  for (const p of map.BUILDINGS.filter((p) => p.service)) {
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
  for (let i = 0; i < 7; i++) {
    const x = 670 + i * 143 + Math.sin(t * 0.12 + i) * 100,
      y = 1450 + (i % 3) * 60 + Math.cos(t * 0.3 + i) * 9;
    g.strokeStyle = "#e7e7cb";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 4, y + Math.sin(t * 5 + i) * 2);
    g.lineTo(x, y);
    g.lineTo(x + 4, y + Math.sin(t * 5 + i) * 2);
    g.stroke();
  }
}
