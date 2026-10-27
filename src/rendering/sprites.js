import { HOUSE_ROOF } from "./house-geometry.js";

// Original pixel art, drawn once for the terrain and sorted by depth for the trees.
const seed = (x, y, n = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + n * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const poly = (ctx, points, fill, stroke) => {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
};
function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function barrel(g, x, y) {
  oval(g, x + 2, y + 2, 9, 3, "#75683f44");
  g.fillStyle = "#6c5138";
  g.fillRect(x - 6, y - 12, 12, 13);
  g.fillStyle = "#ab8151";
  g.fillRect(x - 5, y - 12, 9, 12);
  for (let dx = -3; dx < 5; dx += 3) {
    g.fillStyle = "#775836";
    g.fillRect(x + dx, y - 10, 1, 10);
  }
  g.fillStyle = "#cab185";
  g.fillRect(x - 6, y - 9, 12, 2);
  g.fillRect(x - 6, y - 2, 12, 2);
  oval(g, x, y - 12, 6, 3, "#d2b58a");
  oval(g, x, y - 12, 4, 1, "#9a784d");
}
function crate(g, x, y) {
  g.fillStyle = "#604a34";
  g.fillRect(x - 9, y - 18, 19, 19);
  g.fillStyle = "#ad8757";
  g.fillRect(x - 8, y - 17, 17, 17);
  for (let dx = -5; dx <= 6; dx += 4) {
    g.fillStyle = "#89663f";
    g.fillRect(x + dx, y - 15, 1, 14);
  }
  g.strokeStyle = "#d0ae75";
  g.strokeRect(x - 7.5, y - 16.5, 15, 15);
  g.beginPath();
  g.moveTo(x - 7, y - 16);
  g.lineTo(x + 7, y - 2);
  g.stroke();
}
function flowers(g, x, y) {
  g.fillStyle = "#667839";
  g.fillRect(x - 5, y, 11, 3);
  for (let i = 0; i < 4; i++) {
    const xx = x - 4 + i * 3;
    g.fillStyle = "#798b40";
    g.fillRect(xx, y - 5 - (i % 2) * 2, 1, 6);
    g.fillStyle = i % 2 ? "#efe7b4" : "#d6ad78";
    g.fillRect(xx - 1, y - 7 - (i % 2) * 2, 3, 2);
    g.fillStyle = "#d3bd6e";
    g.fillRect(xx, y - 6 - (i % 2) * 2, 1, 1);
  }
}
function bush(g, x, y, s = 1) {
  oval(g, x + 3, y + 2, 11 * s, 4 * s, "#65703755");
  for (let i = 0; i < 25; i++) {
    const a = seed(x, y, i) * 6.28,
      r = seed(y, x, i) * 10 * s;
    g.fillStyle = ["#6c813b", "#839344", "#9ca74c", "#b7b960"][
      Math.floor(seed(x, i, y) * 4)
    ];
    g.fillRect(
      Math.round(x + Math.cos(a) * r) - 3,
      Math.round(y - 7 + Math.sin(a) * r * 0.6) - 3,
      6,
      5,
    );
  }
}
function fence(g, x1, x2, y) {
  g.fillStyle = "#6f5238";
  g.fillRect(x1, y - 13, x2 - x1, 3);
  g.fillRect(x1, y - 5, x2 - x1, 3);
  g.fillStyle = "#c2a376";
  g.fillRect(x1, y - 14, x2 - x1, 1);
  g.fillRect(x1, y - 6, x2 - x1, 1);
  for (const x of new Set([
    ...Array.from(
      { length: Math.floor((x2 - x1) / 21) + 1 },
      (_, i) => x1 + i * 21,
    ),
    x2,
  ])) {
    g.fillStyle = "#725239";
    g.fillRect(x - 2, y - 20, 5, 24);
    g.fillStyle = "#be9a67";
    g.fillRect(x - 1, y - 19, 3, 22);
    g.fillStyle = "#e0c18e";
    g.fillRect(x - 2, y - 20, 5, 2);
  }
}
function tree(g, x, y, size = 1, wood="ash") {
  const colors={ash:["#597744","#74964c","#93af5e","#b2c97d","#d0df9b"],chestnut:["#6d7439","#8d913e","#b0ac50","#cbbd69","#e1ce89"],walnut:["#70563b","#8a7043","#a58a50","#c0a365","#dbc28b"]}[wood];
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.scale(size, size);
  oval(g, 9, 3, 22, 6, "#5a653142");
  poly(
    g,
    [
      [-5, 2],
      [-3, -38],
      [4, -38],
      [5, 2],
      [9, 5],
      [1, 4],
      [-7, 6],
    ],
    wood==="ash"?"#d3c7a0":wood==="chestnut"?"#aa8354":"#8f6d4c",
    "#726044",
  );
  g.fillStyle = wood==="ash"?"#e8dcba":wood==="chestnut"?"#c19e70":"#b18b62";
  g.fillRect(-2, -33, 3, 35);
  for (const yy of [-29, -19, -9]) {
    g.fillStyle = wood==="ash"?"#8b8766":"#6d543c";
    g.fillRect(-4, yy, 3, 2);
    g.fillRect(1, yy + 4, 3, 1);
  }
  const crown = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2,
      r = 0.92 + seed(x, y, i + 101) * 0.15;
    return [
      Math.round(Math.cos(a) * 26 * r),
      Math.round(-43 + Math.sin(a) * 22 * r),
    ];
  });
  poly(g, crown, colors[1], colors[0]);
  g.save();
  g.clip();
  for (let i = 0; i < 95; i++) {
    const angle = seed(x, y, i) * 6.28,
      r = Math.sqrt(seed(y + 19, x - 7, i + 37)) * 25;
    const xx = Math.round(Math.cos(angle) * r),
      yy = Math.round(-43 + Math.sin(angle) * r * 0.79);
    const light = yy < -44 ? 1 : 0;
    g.fillStyle = colors[
      Math.min(4, Math.floor(seed(i, x, y) * 4) + light)
    ];
    g.fillRect(xx - 4, yy - 3, 8, 6);
    g.fillRect(xx - 2, yy - 5, 4, 9);
    if (i % 7 === 0) {
      g.fillStyle = "#d8cf83";
      g.fillRect(xx - 3, yy - 3, 3, 2);
    }
  }
  g.restore();
  g.restore();
}
function roofPlane(g, corners, rows, columns, dark) {
  g.save();
  poly(g, corners, dark ? "#828174" : "#a3a294");
  g.clip();
  const lerp = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const t0 = row / rows,
        t1 = (row + 1) / rows,
        u0 = col / columns,
        u1 = (col + 1) / columns;
      const l0 = lerp(corners[0], corners[3], t0),
        r0 = lerp(corners[1], corners[2], t0),
        l1 = lerp(corners[0], corners[3], t1),
        r1 = lerp(corners[1], corners[2], t1);
      const points = [
        lerp(l0, r0, u0),
        lerp(l0, r0, u1),
        lerp(l1, r1, u1),
        lerp(l1, r1, u0),
      ].map(([x, y]) => [Math.round(x), Math.round(y)]);
      const palette = dark
        ? ["#747267", "#828174", "#908d7e"]
        : ["#929388", "#a3a294", "#b2ad99"];
      poly(g, points, palette[(row * 7 + col * 5) % 3], "#665d4b");
      g.strokeStyle = dark ? "#a49c83" : "#c5bba2";
      g.beginPath();
      g.moveTo(points[0][0] + 1, points[0][1] + 1);
      g.lineTo(points[1][0] - 1, points[1][1] + 1);
      g.stroke();
    }
  g.restore();
}
function house(g) {
  oval(g, 115, 111, 64, 10, "#5f633841");
  g.fillStyle = "#66503a";
  g.fillRect(57, 62, 105, 47);
  g.save();
  g.beginPath();
  g.rect(59, 65, 101, 43);
  g.clip();
  for (let y = 65; y < 108; y += 7)
    for (let x = 59; x < 160; x += 13) {
      const offset = ((y - 65) / 7) % 2 ? 6 : 0;
      g.fillStyle = ["#b4a98b", "#c3b695", "#a69e82"][(x + y) % 3];
      g.fillRect(x + offset, y, 12, 6);
    }
  g.restore();
  g.fillStyle = "#b99a69";
  g.fillRect(67, 62, 86, 23);
  for (let x = 70; x < 151; x += 8) {
    g.fillStyle = "#d1b082";
    g.fillRect(x, 65, 1, 18);
  }
  for (const x of [62, 99, 153]) {
    g.fillStyle = "#705135";
    g.fillRect(x, 61, 5, 46);
    g.fillStyle = "#bc9765";
    g.fillRect(x, 61, 1, 46);
  }
  g.fillStyle = "#745339";
  g.fillRect(62, 83, 96, 4);
  for (const x of [74, 129]) {
    g.fillStyle = "#684d35";
    g.fillRect(x - 2, 69, 19, 16);
    g.fillStyle = "#55716d";
    g.fillRect(x, 71, 14, 11);
    g.strokeStyle = "#d8b97f";
    g.beginPath();
    g.moveTo(x, 71);
    g.lineTo(x + 14, 82);
    g.moveTo(x + 14, 71);
    g.lineTo(x, 82);
    g.moveTo(x + 7, 71);
    g.lineTo(x + 7, 82);
    g.stroke();
  }
  g.fillStyle = "#62462f";
  g.fillRect(103, 82, 18, 27);
  g.fillStyle = "#af8555";
  g.fillRect(105, 83, 14, 25);
  for (let x = 108; x < 120; x += 4) {
    g.fillStyle = "#88623d";
    g.fillRect(x, 84, 1, 24);
  }
  g.fillStyle = "#e1bc72";
  g.fillRect(115, 97, 2, 2);
  roofPlane(g, HOUSE_ROOF.left, 6, 5, false);
  roofPlane(g, HOUSE_ROOF.right, 6, 5, true);
  poly(g, HOUSE_ROOF.gable, "#bda477", "#715136");
  // The visible timber follows the same front edge as the slate planes.
  g.strokeStyle = "#765138";
  g.lineWidth = 3;
  g.beginPath();
  HOUSE_ROOF.frontTrim.forEach(([x, y], i) =>
    i ? g.lineTo(x, y) : g.moveTo(x, y),
  );
  g.moveTo(110, 33);
  g.lineTo(110, 63);
  g.stroke();
  g.lineWidth = 1;
  g.fillStyle = "#735338";
  g.fillRect(103, 48, 17, 16);
  g.fillStyle = "#536c67";
  g.fillRect(106, 51, 11, 10);
  g.fillStyle = "#d9b77e";
  g.fillRect(111, 51, 1, 10);
  g.fillStyle = "#68513c";
  g.fillRect(80, 12, 12, 16);
  g.fillStyle = "#b1aa8d";
  g.fillRect(81, 11, 10, 15);
  g.fillStyle = "#d0c5a3";
  g.fillRect(78, 9, 16, 4);
  g.fillStyle = "#6c6352";
  g.fillRect(81, 9, 10, 1);
  g.fillStyle = "#8a8063";
  g.fillRect(98, 109, 30, 4);
  g.fillStyle = "#c6b48b";
  g.fillRect(97, 108, 30, 3);
  g.fillRect(94, 112, 36, 3);
  g.fillStyle = "#927043";
  g.fillRect(74, 100, 20, 6);
  flowers(g, 83, 100);
}

function market(g) {
  g.fillStyle = "#705035";
  g.fillRect(-31, -40, 4, 41);
  g.fillRect(29, -40, 4, 41);
  const roof = [
    [-39, -35],
    [-28, -54],
    [29, -54],
    [40, -35],
  ];
  poly(g, roof, "#d7c799");
  g.save();
  g.clip();
  for (let x = -45; x < 45; x += 9) {
    g.fillStyle = Math.floor((x + 45) / 9) % 2 ? "#ded1a6" : "#7e9b8b";
    g.fillRect(x, -55, 9, 22);
  }
  g.restore();
  poly(g, roof, null, "#795d3d");
  g.fillStyle = "#6c4d31";
  g.fillRect(-33, -17, 66, 7);
  g.fillRect(-30, -10, 4, 10);
  g.fillRect(26, -10, 4, 10);
  g.fillStyle = "#be9864";
  g.fillRect(-33, -18, 66, 3);
  for (let x = -30; x < 33; x += 9) {
    g.fillStyle = "#8d6940";
    g.fillRect(x, -17, 1, 4);
  }
  g.fillStyle = "#b7bba0";
  g.fillRect(-15, -23, 24, 3);
  g.fillStyle = "#79593b";
  g.fillRect(-8, -27, 3, 11);
  g.fillStyle = "#d7bd77";
  g.fillRect(-11, -24, 10, 2);
}
function forge(g) {
  market(g);
  // Brick hearth and anvil inside the existing workshop footprint.
  g.fillStyle='#6c655a';g.fillRect(-25,-41,19,24);
  g.fillStyle='#afa189';g.fillRect(-24,-40,17,3);g.fillRect(-24,-33,17,2);
  g.fillStyle='#4f4338';g.fillRect(-21,-30,11,11);
  g.fillStyle='#b85e3c';g.fillRect(-20,-27,9,8);g.fillStyle='#efc56c';g.fillRect(-18,-25,5,6);
  g.fillStyle='#495958';g.fillRect(9,-24,10,6);g.fillRect(5,-29,20,5);g.fillRect(12,-20,5,3);
  g.fillStyle='#a8b5a6';g.fillRect(5,-29,20,2);
}
function bench(g) {
  g.fillStyle = "#6f5135";
  g.fillRect(-13, -7, 4, 7);
  g.fillRect(10, -7, 4, 7);
  g.fillStyle = "#c3a374";
  g.fillRect(-17, -9, 34, 4);
  g.fillRect(-17, -18, 34, 5);
  g.fillStyle = "#947244";
  g.fillRect(-17, -14, 34, 1);
  g.fillRect(-17, -6, 34, 1);
}
function woodpile(g) {
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const x = -9 + col * 6 + (row % 2) * 2,
        y = -3 - row * 4;
      g.fillStyle = "#6c4f35";
      g.fillRect(x - 2, y - 2, 7, 4);
      g.fillStyle = "#a57d4d";
      g.fillRect(x - 1, y - 2, 5, 3);
      g.fillStyle = "#d3b27c";
      g.fillRect(x + 3, y - 1, 2, 2);
    }
}
function sign(g, text) {
  g.fillStyle = "#705238";
  g.fillRect(-1, -19, 3, 19);
  g.fillStyle = "#a78451";
  g.fillRect(-17, -26, 37, 10);
  g.fillStyle = "#d0b47d";
  g.fillRect(-16, -26, 34, 1);
  g.fillStyle = "#4d4932";
  g.font = "5px monospace";
  g.textAlign = "center";
  g.fillText(text, 1, -19);
}
function rock(g) {
  poly(
    g,
    [
      [-6, 0],
      [-5, -8],
      [2, -11],
      [7, -4],
      [6, 1],
    ],
    "#aaa58b",
    "#7c7b59",
  );
  g.fillStyle = "#d2c7a1";
  g.fillRect(-3, -7, 5, 2);
}
function petshop(g) {
  g.fillStyle="#73583b";g.fillRect(-34,-36,68,36);
  g.fillStyle="#c2af83";g.fillRect(-32,-34,64,33);
  for(let x=-30;x<33;x+=8){g.fillStyle="#dec498";g.fillRect(x,-32,1,30);}
  for(const x of [-33,29]){g.fillStyle="#775236";g.fillRect(x,-35,4,35);}
  const ridgeBack=[-4,-70],ridgeFront=[0,-55],left=[-40,-31],right=[40,-31];
  roofPlane(g,[[-44,-46],ridgeBack,ridgeFront,left],4,4,false);
  roofPlane(g,[ridgeBack,[36,-46],right,ridgeFront],4,4,true);
  poly(g,[left,ridgeFront,right],"#c5aa78","#765238");
  g.fillStyle="#6c5139";g.fillRect(-10,-18,20,18);g.fillStyle="#9e7c51";g.fillRect(-8,-16,16,16);
  g.fillStyle="#d3bd89";g.fillRect(4,-8,2,2);
  for(const x of [-25,17]){g.fillStyle="#6a5136";g.fillRect(x,-28,10,12);g.fillStyle="#8baca0";g.fillRect(x+1,-27,8,9);g.fillStyle="#d6bd84";g.fillRect(x+4,-27,1,9);}
  g.fillStyle="#66563a";g.fillRect(-12,-44,25,14);g.fillStyle="#b29965";g.fillRect(-11,-43,23,12);
  g.fillStyle="#4e6149";g.fillRect(-4,-36,9,5);for(const[x,y]of[[-6,-40],[-1,-42],[4,-41],[8,-38]])g.fillRect(x,y,3,3);
  g.fillStyle="#caba8f";g.fillRect(-12,0,25,3);
  g.fillStyle="#70583d";g.fillRect(-28,-1,12,4);g.fillStyle="#a9c0a2";g.fillRect(-26,0,8,2);
}
function fountain(g){
 oval(g,2,4,25,8,'#52694744');
 oval(g,0,0,25,13,'#6a786b');oval(g,0,-3,24,12,'#c7c3a0');oval(g,0,-4,19,8,'#528f9e');oval(g,0,-5,15,5,'#83bfc3');
 g.fillStyle='#8d9a89';g.fillRect(-4,-21,8,19);g.fillStyle='#d0cfac';g.fillRect(-3,-21,3,18);
 oval(g,0,-20,11,5,'#a9b59e');oval(g,0,-22,10,4,'#7bb6c0');
 g.fillStyle='#d9edcf';g.fillRect(-1,-31,2,10);g.fillRect(-5,-26,2,9);g.fillRect(4,-26,2,9);g.fillStyle='#b5dfd3';g.fillRect(-15,-9,7,1);g.fillRect(7,-5,6,1);
}
function sawmill(g){
 g.fillStyle='#745338';g.fillRect(-22,-7,44,7);g.fillRect(-19,0,4,5);g.fillRect(15,0,4,5);g.fillStyle='#bf9d64';g.fillRect(-24,-10,48,4);
 g.fillStyle='#a8b7af';g.fillRect(-9,-16,27,3);g.fillStyle='#6b5035';g.fillRect(-14,-20,7,15);g.fillStyle='#ddbf82';g.fillRect(-17,-20,13,3);
 g.fillStyle='#9a7848';g.fillRect(-19,-27,15,9);g.fillStyle='#d1b57e';g.fillRect(-18,-28,13,3);g.fillStyle='#66513a';g.fillRect(8,-31,3,17);g.fillStyle='#c9c5a7';g.fillRect(3,-30,18,3);
}
function stump(g){g.fillStyle='#81603f';g.fillRect(-8,-7,16,11);oval(g,0,-6,10,5,'#c5a76b');oval(g,0,-7,6,3,'#e2c895');g.fillStyle='#a18350';g.fillRect(-3,-8,6,1);g.fillRect(0,-9,1,5);}
const DEFINITIONS = {
 sawmill:{bounds:[-29,-35,60,44],origin:[0,0],paint:sawmill},
 stump:{bounds:[-14,-14,30,23],origin:[0,0],paint:stump},
 fountain:{bounds:[-29,-35,59,47],origin:[0,0],paint:fountain},
  petshop:{bounds:[-47,-73,95,80],origin:[0,0],paint:petshop},
  house: { bounds: [40, 0, 140, 124], origin: [110, 108], paint: house },
  market: { bounds: [-42, -58, 86, 61], origin: [0, 0], paint: forge },
  tree: {
    bounds: [-35, -72, 75, 82],
    origin: [0, 0],
    paint: (g, prop) => {
      const offset = prop.variant * 17;
      g.save();
      g.translate(-offset, 0);
      tree(g, offset, 0, 1, prop.wood||"ash");
      g.restore();
    },
  },
  barrel: {
    bounds: [-10, -17, 22, 22],
    origin: [0, 0],
    paint: (g) => barrel(g, 0, 0),
  },
  crate: {
    bounds: [-11, -20, 23, 23],
    origin: [0, 0],
    paint: (g) => crate(g, 0, 0),
  },
  bench: { bounds: [-19, -20, 39, 23], origin: [0, 0], paint: bench },
  woodpile: { bounds: [-13, -14, 29, 18], origin: [0, 0], paint: woodpile },
  sign: {
    bounds: [-19, -28, 42, 31],
    origin: [0, 0],
    paint: (g, p) => sign(g, p.text),
  },
  flowers: {
    bounds: [-8, -13, 18, 18],
    origin: [0, 0],
    paint: (g) => flowers(g, 0, 0),
  },
  bush: {
    bounds: [-17, -20, 38, 29],
    origin: [0, 0],
    paint: (g) => bush(g, 0, 0, 1),
  },
  daisy: {
    bounds: [-3, -7, 8, 10],
    origin: [0, 0],
    paint: (g) => {
      g.fillStyle = "#849443";
      g.fillRect(0, -4, 1, 5);
      g.fillRect(1, -2, 2, 1);
      g.fillStyle = "#ede6b8";
      g.fillRect(-1, -6, 3, 3);
      g.fillRect(-2, -5, 5, 1);
      g.fillStyle = "#d1b86e";
      g.fillRect(0, -5, 1, 1);
    },
  },
  rock: { bounds: [-9, -14, 20, 19], origin: [0, 0], paint: rock },
};
export function createSpriteAtlas() {
  const cache = new Map();
  return (prop) => {
    const key = `${prop.kind}:${prop.variant || 0}:${prop.wood||""}:${prop.text || ""}`;
    if (cache.has(key)) return cache.get(key);
    const def = DEFINITIONS[prop.kind];
    if (!def) throw new Error(`Unknown sprite: ${prop.kind}`);
    const [left, top, width, height] = def.bounds;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.translate(-left, -top);
    def.paint(g, { ...prop, variant: prop.variant || 0 });
    // Snap silhouette coverage once when baking; no fractional sprite scales at runtime.
    const data = g.getImageData(0, 0, width, height);
    for (let i = 3; i < data.data.length; i += 4)
      data.data[i] = data.data[i] >= 128 ? 255 : 0;
    g.putImageData(data, 0, 0);
    const sprite = {
      canvas,
      anchorX: def.origin[0] - left,
      anchorY: def.origin[1] - top,
    };
    cache.set(key, sprite);
    return sprite;
  };
}
export function drawFence(g, segment) {
  fence(g, segment.x1, segment.x2, segment.y);
}
