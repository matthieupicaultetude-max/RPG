import { DEPTHS_BOSS_HOME } from "../world/slime-depths-map.js";
function poly(g, p, color) {
  g.fillStyle = color;
  g.beginPath();
  p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function oval(g, x, y, rx, ry, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
export function drawBossActor(g, b, time) {
  g.save();
  g.translate(Math.round(b.x), Math.round(b.y));
  oval(g, 1, 4, 32, 9, "#0a142d88");
  g.translate(0, -Math.round(b.lift || 0));
  const exposed = (b.vulnerableUntil || 0) > time,
    split = b.bossPhase === "split",
    dormant = b.bossPhase === "dormant";
  const pulse = Math.round(Math.sin(time * 3) * 1);
  if (split) {
    poly(
      g,
      [
        [-32, 3],
        [-29, -11],
        [-18, -6],
        [-12, 3],
      ],
      "#7d715c",
    );
    poly(
      g,
      [
        [15, 3],
        [22, -12],
        [31, -7],
        [34, 4],
      ],
      "#667b80",
    );
    oval(g, 0, -5, 17, 7, "#3b8391");
  } else {
    if (b.intent?.phase === "windup") {
      const p = Math.min(1, b.intent.age / b.intent.windup);
      g.scale(1 + p * 0.08, 1 - p * 0.12);
    }
    g.translate(0, pulse);
    poly(
      g,
      [
        [-31, 3],
        [-34, -7],
        [-30, -21],
        [-22, -29],
        [-19, -39],
        [-8, -46],
        [8, -46],
        [20, -39],
        [24, -28],
        [32, -20],
        [35, -7],
        [30, 4],
      ],
      "#173a51",
    );
    poly(
      g,
      [
        [-29, 0],
        [-31, -9],
        [-27, -20],
        [-18, -27],
        [-15, -38],
        [-7, -42],
        [7, -42],
        [17, -36],
        [21, -25],
        [28, -19],
        [31, -7],
        [28, 1],
      ],
      "#367c91",
    );
    poly(
      g,
      [
        [-22, -20],
        [-16, -30],
        [-13, -36],
        [-5, -39],
        [8, -38],
        [14, -31],
        [9, -28],
        [-5, -31],
        [-13, -21],
      ],
      "#69b3be",
    );
    poly(
      g,
      [
        [-30, -4],
        [-22, -18],
        [-11, -15],
        [-4, -3],
        [6, 3],
        [-27, 3],
      ],
      "#806d4d",
    );
    poly(
      g,
      [
        [16, -4],
        [19, -25],
        [29, -19],
        [33, -6],
        [28, 2],
      ],
      "#978057",
    );
    for (const [x, y] of [
      [-21, -28],
      [-7, -43],
      [11, -40],
      [24, -20],
    ]) {
      poly(
        g,
        [
          [x - 5, y + 3],
          [x - 3, y - 11],
          [x + 1, y - 15],
          [x + 6, y + 3],
        ],
        "#40535e",
      );
      poly(
        g,
        [
          [x - 3, y + 1],
          [x, y - 12],
          [x + 2, y - 4],
          [x + 2, y + 1],
        ],
        "#91a8a8",
      );
    }
    g.fillStyle = "#163344";
    g.fillRect(-18, -23, 8, 4);
    g.fillRect(12, -23, 8, 4);
    if (!dormant) {
      g.fillStyle = b.bossStage >= 2 ? "#ffd194" : "#b4eef1";
      g.fillRect(-15, -23, 3, 3);
      g.fillRect(13, -23, 3, 3);
    }
    g.fillStyle = "#1e3e4a";
    g.fillRect(-5, -7, 12, 3);
  }
  const cy = split ? -19 : -19;
  oval(
    g,
    1,
    cy,
    split ? 15 : 13,
    split ? 17 : 14,
    exposed ? "#b8f2e555" : "#8dd8dc22",
  );
  poly(
    g,
    [
      [-8, cy],
      [0, cy - 12],
      [9, cy - 2],
      [6, cy + 10],
      [-2, cy + 13],
      [-9, cy + 4],
    ],
    "#173847",
  );
  poly(
    g,
    [
      [-6, cy],
      [0, cy - 9],
      [6, cy - 1],
      [4, cy + 8],
      [-1, cy + 10],
      [-6, cy + 3],
    ],
    split ? "#78b6c3" : exposed ? "#e3f9d6" : "#86d4dc",
  );
  g.strokeStyle = b.bossStage >= 2 ? "#ffbd7d" : "#e5d29b";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, cy - 8);
  g.lineTo(2, cy - 1);
  g.lineTo(-2, cy + 3);
  g.lineTo(1, cy + 9);
  g.stroke();
  if (exposed) {
    for (let i = 0; i < 5; i++) {
      const a = time * 2 + i * 1.26;
      g.fillStyle = "#f3e1a7";
      g.fillRect(
        Math.round(Math.cos(a) * 21),
        Math.round(cy + Math.sin(a) * 15),
        2,
        2,
      );
    }
  }
  g.restore();
}
function text(g, label, x, y) {
  g.font = "7px monospace";
  g.textAlign = "center";
  const w = g.measureText(label).width + 8;
  g.fillStyle = "#152a35ed";
  g.fillRect(x - w / 2, y - 8, w, 11);
  g.fillStyle = "#e3d7ab";
  g.fillText(label, x, y);
}
export function drawBossGround(g, s) {
  if (s.zone !== "slime-depths") return;
  const b = s.monsters.find((m) => m.boss);
  if (!b || b.hp <= 0) return;
  g.save();
  const h = DEPTHS_BOSS_HOME;
  g.strokeStyle = "#9c987252";
  g.lineWidth = 1;
  g.setLineDash([4, 6]);
  g.beginPath();
  g.ellipse(h.x, h.y, 69, 36, 0, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.fillStyle = i % 2 ? "#a38b6077" : "#82cbd077";
    g.fillRect(
      Math.round(h.x + Math.cos(a) * 66) - 2,
      Math.round(h.y + Math.sin(a) * 35) - 1,
      4,
      3,
    );
  }
  if (b.bossPhase === "dormant")
    text(g, "GORGELIMON · Niv. 8 · F", b.x, b.y - 70);
  if (b.bossPhase === "split") {
    const owner = s.monsters.indexOf(b);
    for (const m of s.monsters.filter(
      (m) => m.bossOwner === owner && m.hp > 0,
    )) {
      g.strokeStyle = m.element === "earth" ? "#d2b27699" : "#80ccdf99";
      g.lineWidth = 1;
      g.setLineDash([3, 4]);
      g.beginPath();
      g.moveTo(b.x, b.y - 9);
      g.lineTo(m.x, m.y - 4);
      g.stroke();
      g.setLineDash([]);
    }
    text(
      g,
      `COEUR PROTEGE · ${Math.ceil(Math.max(0, b.splitUntil - s.time))}s`,
      b.x,
      b.y - 43,
    );
  }
  const a = b.intent;
  if (a?.kind === "boss-quake")
    for (const z of a.zones) {
      const p = Math.min(1, a.age / a.windup);
      oval(g, z.x, z.y, a.radius, a.radius, "#d5ac6b44");
      g.strokeStyle = "#e5bc7b";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(z.x, z.y, a.radius, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.arc(
        z.x,
        z.y,
        a.radius + 3,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * p,
      );
      g.stroke();
      g.strokeStyle = "#8f7453";
      g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        g.beginPath();
        g.moveTo(z.x + Math.cos(angle) * 5, z.y + Math.sin(angle) * 5);
        g.lineTo(z.x + Math.cos(angle) * 20, z.y + Math.sin(angle) * 20);
        g.stroke();
      }
      text(g, "EBOULEMENT · TERRE", z.x, z.y + a.radius + 13);
    }
  g.restore();
}
