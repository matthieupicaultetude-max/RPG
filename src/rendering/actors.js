import { drawSetAura, drawEquipmentGlints } from "./chromatic-aura.js";
import { CLASS_STYLES } from "../data/appearance.js";

const polygon = (g, points, color) => {
  g.fillStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
};
export function drawAdventurer(ctx, p, time, animation) {
  const role = p.role in CLASS_STYLES ? p.role : "melee",
    style = CLASS_STYLES[role],
    gear = p.equipment || {};
  const step = p.moving
    ? Math.round(Math.sin(time * 12 + (p.id ?? p.phase ?? 0) * 0.9) * 1.5)
    : 0;
  const thrust = animation
    ? Math.round(Math.sin(Math.min(1, animation.age / 0.3) * Math.PI) * 2)
    : 0;
  const x = Math.round(
      p.x + (animation ? Math.cos(animation.angle) * thrust : 0),
    ),
    y = Math.round(p.y + (animation ? Math.sin(animation.angle) * thrust : 0));
  drawSetAura(ctx, p, time);
  ctx.save();
  ctx.translate(x, y);
  if (p.facing === "left") ctx.scale(-1, 1);
  ctx.fillStyle = "#34463c55";
  ctx.beginPath();
  ctx.ellipse(1, 3, role === "melee" ? 10 : 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const cloth = gear.Cape?.color || style.cloth,
    boot = gear.Bottes?.color || style.dark;
  // Cloaks, shoulder widths, robes and quivers carry the silhouette, independently of gear colour.
  if (role === "melee") {
    polygon(
      ctx,
      [
        [-9, -22],
        [8, -22],
        [10, 1],
        [4, -2],
        [0, 2],
        [-10, 0],
      ],
      cloth,
    );
    ctx.fillStyle = "#ffffff20";
    ctx.fillRect(-8, -19, 2, 15);
  } else if (role === "support") {
    polygon(
      ctx,
      [
        [-7, -23],
        [7, -23],
        [10, 2],
        [5, 4],
        [0, 2],
        [-8, 4],
        [-10, 1],
      ],
      style.dark,
    );
    polygon(
      ctx,
      [
        [-6, -22],
        [6, -22],
        [8, 1],
        [1, 2],
        [-7, 1],
      ],
      cloth,
    );
  } else {
    polygon(
      ctx,
      [
        [-7, -22],
        [5, -23],
        [7, -3],
        [2, -5],
        [-3, 0],
        [-9, -4],
      ],
      cloth,
    );
    ctx.fillStyle = style.dark;
    ctx.fillRect(-12, -23, 5, 19);
    ctx.fillStyle = "#9d704c";
    ctx.fillRect(-11, -22, 3, 15);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#d6bf86";
      ctx.fillRect(-13 + i * 3, -32 + (i % 2) * 2, 1, 11);
      ctx.fillStyle = "#eee4c0";
      ctx.fillRect(-14 + i * 3, -33 + (i % 2) * 2, 3, 3);
    }
  }
  ctx.fillStyle = style.dark;
  ctx.fillRect(-5, -5 + step, 4, 9);
  ctx.fillRect(1, -5 - step, 4, 9);
  ctx.fillStyle = boot;
  ctx.fillRect(-6, 1 + step, 5, 5);
  ctx.fillRect(1, 1 - step, 6, 5);
  ctx.fillStyle = style.trim;
  ctx.fillRect(-6, 4 + step, 5, 1);
  ctx.fillRect(1, 4 - step, 6, 1);
  if (role === "melee") {
    ctx.fillStyle = style.dark;
    ctx.fillRect(-9, -22, 18, 20);
    ctx.fillRect(-12, -23, 7, 8);
    ctx.fillRect(5, -23, 8, 8);
    ctx.fillStyle = style.base;
    ctx.fillRect(-7, -21, 14, 15);
    ctx.fillRect(-11, -22, 7, 6);
    ctx.fillRect(5, -22, 7, 6);
    ctx.fillStyle = style.light;
    ctx.fillRect(-10, -22, 6, 2);
    ctx.fillRect(5, -22, 6, 2);
    ctx.fillRect(-6, -20, 3, 10);
    ctx.fillStyle = "#4c697c";
    ctx.fillRect(-2, -19, 7, 9);
    ctx.fillStyle = style.trim;
    ctx.fillRect(-6, -7, 12, 2);
    ctx.fillRect(-1, -17, 3, 5);
    for (const side of [-1, 1]) {
      ctx.fillStyle = style.dark;
      ctx.fillRect(side < 0 ? -11 : 8, -15 + side * step, 4, 10);
      ctx.fillStyle = style.base;
      ctx.fillRect(side < 0 ? -10 : 8, -13 + side * step, 3, 6);
    }
  } else if (role === "support") {
    polygon(
      ctx,
      [
        [-6, -22],
        [6, -22],
        [9, 1],
        [0, 3],
        [-8, 1],
      ],
      style.base,
    );
    polygon(
      ctx,
      [
        [-2, -22],
        [3, -22],
        [4, 1],
        [-1, 1],
      ],
      cloth,
    );
    ctx.fillStyle = style.light;
    ctx.fillRect(-6, -20, 2, 11);
    ctx.fillStyle = style.trim;
    ctx.fillRect(-8, 0, 16, 2);
    ctx.fillRect(-1, -20, 2, 19);
    polygon(
      ctx,
      [
        [-7, -22],
        [-11, -14],
        [-10, -4],
        [-5, -4],
        [-5, -20],
      ],
      cloth,
    );
    polygon(
      ctx,
      [
        [6, -22],
        [10, -14],
        [10, -4],
        [5, -4],
        [5, -20],
      ],
      cloth,
    );
    ctx.fillStyle = style.trim;
    ctx.fillRect(-10, -6, 5, 2);
    ctx.fillRect(5, -6, 5, 2);
  } else {
    ctx.fillStyle = style.dark;
    ctx.fillRect(-7, -21, 14, 18);
    ctx.fillStyle = style.base;
    ctx.fillRect(-6, -20, 12, 16);
    ctx.fillStyle = cloth;
    ctx.fillRect(-7, -21, 14, 5);
    ctx.fillRect(-8, -19, 4, 8);
    ctx.fillRect(5, -19, 4, 8);
    ctx.fillStyle = "#edd1a1";
    ctx.fillRect(-8, -11 - step, 3, 6);
    ctx.fillRect(6, -11 + step, 3, 6);
    polygon(
      ctx,
      [
        [-6, -21],
        [-3, -21],
        [6, -6],
        [3, -6],
      ],
      style.dark,
    );
    ctx.fillStyle = style.trim;
    ctx.fillRect(0, -12, 2, 3);
    ctx.fillStyle = "#725039";
    ctx.fillRect(-8, -8, 3, 5);
    ctx.fillRect(6, -8, 3, 5);
  }
  ctx.fillStyle = "#725238";
  ctx.fillRect(-6, -5, 12, 3);
  ctx.fillStyle = gear.Ceinture?.color || style.trim;
  ctx.fillRect(-1, -5, 3, 3);
  if (role !== "melee") {
    ctx.fillStyle = "#e3bb8b";
    ctx.fillRect(-9, -4 - step, 3, 3);
    ctx.fillRect(7, -4 + step, 3, 3);
  }
  // Face and role-specific headgear; side profiles and backs have their own markings.
  ctx.fillStyle = "#8f624b";
  ctx.fillRect(-5, -30, 10, 10);
  ctx.fillStyle = "#edc494";
  ctx.fillRect(-4, -29, 8, 9);
  const hat = gear.Coiffe?.color || (role === "melee" ? style.base : cloth);
  if (role === "melee") {
    ctx.fillStyle = style.dark;
    ctx.fillRect(-7, -33, 14, 7);
    ctx.fillRect(-7, -27, 3, 8);
    ctx.fillRect(4, -27, 3, 8);
    ctx.fillStyle = hat;
    ctx.fillRect(-6, -32, 12, 5);
    ctx.fillRect(-6, -27, 2, 6);
    ctx.fillRect(4, -27, 2, 6);
    ctx.fillStyle = style.light;
    ctx.fillRect(-5, -32, 8, 1);
    ctx.fillStyle = style.trim;
    ctx.fillRect(-7, -28, 14, 2);
    ctx.fillStyle = "#9b4544";
    ctx.fillRect(-1, -38, 3, 5);
    ctx.fillRect(1, -37, 4, 2);
    ctx.fillStyle = style.dark;
    ctx.fillRect(-3, -26, 6, 2);
    ctx.fillStyle = "#d2e8db";
    ctx.fillRect(-2, -26, 1, 1);
    ctx.fillRect(2, -26, 1, 1);
    ctx.fillStyle = hat;
    ctx.fillRect(-1, -26, 2, 6);
    ctx.fillStyle = style.light;
    ctx.fillRect(-1, -25, 1, 5);
  } else if (role === "support") {
    polygon(
      ctx,
      [
        [-7, -26],
        [-6, -33],
        [-1, -38],
        [3, -36],
        [7, -29],
        [6, -20],
        [4, -22],
        [4, -29],
        [-3, -30],
        [-4, -22],
        [-7, -20],
      ],
      style.dark,
    );
    polygon(
      ctx,
      [
        [-6, -27],
        [-5, -33],
        [0, -37],
        [3, -34],
        [6, -28],
        [5, -22],
        [3, -24],
        [3, -30],
        [-3, -31],
        [-5, -23],
      ],
      hat,
    );
    ctx.fillStyle = style.trim;
    ctx.fillRect(-6, -28, 2, 6);
    ctx.fillRect(4, -28, 2, 6);
    ctx.fillRect(-1, -35, 2, 3);
  } else {
    polygon(
      ctx,
      [
        [-8, -26],
        [-6, -32],
        [0, -35],
        [7, -30],
        [8, -23],
        [5, -19],
        [4, -29],
        [-3, -30],
        [-5, -20],
      ],
      style.dark,
    );
    polygon(
      ctx,
      [
        [-7, -26],
        [-5, -31],
        [0, -34],
        [6, -29],
        [6, -23],
        [5, -22],
        [3, -30],
        [-3, -31],
        [-5, -24],
      ],
      hat,
    );
    ctx.fillStyle = "#8dbb83";
    ctx.fillRect(-3, -32, 4, 1);
    ctx.fillStyle = style.trim;
    ctx.fillRect(-6, -25, 1, 4);
  }
  if (p.facing === "up") {
    ctx.fillStyle = hat;
    ctx.fillRect(-4, -29, 8, 10);
    ctx.fillStyle = style.dark;
    ctx.fillRect(-3, -22, 6, 3);
    ctx.fillStyle = style.trim;
    ctx.fillRect(-1, -29, 2, 4);
  } else if (role !== "melee") {
    ctx.fillStyle = "#34413e";
    if (p.facing === "right" || p.facing === "left") ctx.fillRect(3, -26, 2, 2);
    else {
      ctx.fillRect(-3, -26, 1, 2);
      ctx.fillRect(2, -26, 1, 2);
    }
    ctx.fillStyle = "#ac7859";
    ctx.fillRect(0, -22, 3, 1);
  }
  const theme = gear.Coiffe?.element;
  if (theme === "earth") {
    ctx.fillStyle = "#70834a";
    ctx.fillRect(-7, -33, 3, 3);
    ctx.fillRect(5, -33, 3, 3);
  }
  if (theme === "fire") {
    ctx.fillStyle = "#efc076";
    ctx.fillRect(5, -36, 2, 5);
    ctx.fillStyle = "#bc6846";
    ctx.fillRect(6, -33, 2, 3);
  }
  if (theme === "air") {
    ctx.fillStyle = "#e3e8c8";
    ctx.fillRect(6, -38, 2, 7);
    ctx.fillRect(8, -39, 1, 5);
  }
  if (theme === "water") {
    ctx.fillStyle = "#9cd7d5";
    ctx.fillRect(-6, -34, 3, 2);
    ctx.fillRect(-5, -35, 1, 4);
  }
  if (gear.Amulette) {
    ctx.fillStyle = gear.Amulette.color || style.trim;
    ctx.fillRect(0, -16, 3, 4);
  }
  if (gear["Anneau 1"]) {
    ctx.fillStyle = gear["Anneau 1"].color || style.trim;
    ctx.fillRect(-9, -3 - step, 2, 1);
  }
  if (gear["Anneau 2"]) {
    ctx.fillStyle = gear["Anneau 2"].color || style.trim;
    ctx.fillRect(8, -3 + step, 2, 1);
  }
  if (!animation?.harvesting && (!animation || role !== "melee")) {
    if (role === "ranged") {
      ctx.strokeStyle = "#523d32";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, -25);
      ctx.lineTo(16, -19);
      ctx.lineTo(17, -12);
      ctx.lineTo(15, -4);
      ctx.lineTo(10, 2);
      ctx.stroke();
      ctx.strokeStyle = gear.Arme?.color || "#d9b476";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(11, -24);
      ctx.lineTo(15, -18);
      ctx.lineTo(16, -12);
      ctx.lineTo(14, -5);
      ctx.lineTo(10, 1);
      ctx.stroke();
      ctx.strokeStyle = "#eee3bb";
      ctx.beginPath();
      ctx.moveTo(11, -24);
      ctx.lineTo(10, 1);
      ctx.stroke();
    } else if (role === "support") {
      ctx.fillStyle = "#634b3d";
      ctx.fillRect(12, -29, 2, 34);
      ctx.fillStyle = style.trim;
      ctx.fillRect(11, -24, 4, 2);
      ctx.fillRect(11, -10, 4, 2);
      polygon(
        ctx,
        [
          [13, -39],
          [18, -33],
          [16, -27],
          [11, -27],
          [9, -33],
        ],
        style.dark,
      );
      polygon(
        ctx,
        [
          [13, -37],
          [16, -33],
          [14, -28],
          [11, -31],
        ],
        gear.Arme?.color || "#94d8d2",
      );
      ctx.fillStyle = "#e8fff0";
      ctx.fillRect(12, -35, 2, 4);
    } else {
      ctx.fillStyle = "#624b3e";
      ctx.fillRect(12, -3, 3, 8);
      ctx.fillStyle = style.trim;
      ctx.fillRect(8, -6, 10, 3);
      polygon(
        ctx,
        [
          [12, -27],
          [15, -31],
          [17, -25],
          [16, -6],
          [12, -6],
        ],
        style.dark,
      );
      polygon(
        ctx,
        [
          [13, -25],
          [15, -28],
          [16, -24],
          [15, -7],
          [13, -7],
        ],
        gear.Arme?.color || "#d6e2de",
      );
      ctx.fillStyle = "#f5f3d7";
      ctx.fillRect(13, -23, 1, 15);
    }
  }
  if (gear.Bouclier) {
    polygon(
      ctx,
      [
        [-13, -17],
        [-5, -15],
        [-5, -5],
        [-9, 0],
        [-14, -6],
      ],
      style.dark,
    );
    polygon(
      ctx,
      [
        [-12, -16],
        [-6, -14],
        [-6, -5],
        [-9, -2],
        [-13, -6],
      ],
      gear.Bouclier.color || style.base,
    );
    ctx.fillStyle = style.trim;
    ctx.fillRect(-10, -13, 2, 9);
  }
  if (p.equipment?.Familier) {
    const pet = p.equipment.Familier,
      kind = pet.petSpecies;
    ctx.save();
    ctx.translate(17, 1);
    if (kind === "slime") {
      ctx.fillStyle = "#5c9c9c";
      ctx.fillRect(-4, -4, 9, 6);
      ctx.fillRect(-2, -7, 5, 5);
      ctx.fillStyle = "#b5daba";
      ctx.fillRect(-2, -6, 3, 2);
    } else if (kind === "boar") {
      ctx.fillStyle = "#a4895b";
      ctx.fillRect(-5, -5, 11, 7);
      ctx.fillRect(-4, -8, 3, 4);
      ctx.fillRect(3, -8, 3, 4);
      ctx.fillStyle = "#e0c99c";
      ctx.fillRect(-2, -1, 5, 3);
    } else if (kind === "firefly" || kind === "moth") {
      const bob = Math.round(Math.sin(time * 10));
      ctx.fillStyle = kind === "firefly" ? "#e5bf80" : "#c5d6b5";
      ctx.fillRect(-7, -8 + bob, 5, 4);
      ctx.fillRect(3, -8 - bob, 5, 4);
      ctx.fillStyle = pet.color;
      ctx.fillRect(-2, -9, 5, 10);
      ctx.fillStyle = "#eddbac";
      ctx.fillRect(-1, -1, 3, 2);
    } else {
      ctx.fillStyle = "#8a704b";
      ctx.fillRect(-4, -1, 8, 5);
      ctx.fillRect(-3, -5, 6, 5);
      ctx.fillRect(-4, -6, 2, 3);
      ctx.fillRect(2, -6, 2, 3);
    }
    ctx.fillStyle = "#334b3b";
    ctx.fillRect(-1, -4, 1, 1);
    ctx.fillRect(2, -4, 1, 1);
    ctx.restore();
  }
  ctx.restore();
  drawEquipmentGlints(ctx, p, time);
}
export function drawCreature(ctx, m, time) {
  if (m.hp <= 0) return;
  const x = Math.round(m.x),
    y = Math.round(m.y),
    bob = Math.round(Math.sin(time * 4 + m.homeX) * 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#55633b45";
  ctx.beginPath();
  ctx.ellipse(2, 4, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (m.species === "slime" || m.name === "Slime") {
    ctx.translate(0, bob);
    ctx.fillStyle = "#54765a";
    ctx.fillRect(-12, -7, 24, 10);
    ctx.fillRect(-9, -13, 18, 14);
    ctx.fillRect(-5, -16, 10, 9);
    ctx.fillStyle = "#82ad82";
    ctx.fillRect(-11, -7, 22, 9);
    ctx.fillRect(-8, -12, 16, 12);
    ctx.fillRect(-4, -15, 8, 9);
    ctx.fillStyle = "#b1cd94";
    ctx.fillRect(-7, -11, 12, 4);
    ctx.fillRect(-3, -14, 6, 3);
    ctx.fillStyle = "#dbdeaa";
    ctx.fillRect(-6, -10, 3, 2);
    ctx.fillStyle = "#47705b";
    ctx.fillRect(-9, 0, 18, 3);
    ctx.fillStyle = "#425847";
    ctx.fillRect(-5, -5, 2, 3);
    ctx.fillRect(4, -5, 2, 3);
    ctx.fillRect(-1, 0, 3, 1);
    ctx.fillStyle = "#e0dca5";
    ctx.fillRect(-4, -5, 1, 1);
    ctx.fillRect(5, -5, 1, 1);
  } else if (m.species === "boar" || m.name === "Sanglier") {
    ctx.fillStyle = "#60533c";
    ctx.fillRect(-14, -10, 28, 12);
    ctx.fillRect(-10, -17, 20, 18);
    ctx.fillRect(-12, 0, 5, 6);
    ctx.fillRect(6, 0, 5, 6);
    ctx.fillStyle = "#92734f";
    ctx.fillRect(-13, -10, 26, 11);
    ctx.fillRect(-9, -16, 18, 15);
    ctx.fillStyle = "#b39765";
    ctx.fillRect(-8, -15, 14, 5);
    ctx.fillRect(-11, -9, 9, 3);
    ctx.fillStyle = "#79603e";
    ctx.fillRect(-10, -20, 6, 8);
    ctx.fillRect(5, -20, 6, 8);
    ctx.fillStyle = "#ba9f6c";
    ctx.fillRect(-9, -19, 3, 5);
    ctx.fillRect(6, -19, 3, 5);
    ctx.fillStyle = "#c4a37b";
    ctx.fillRect(-5, -6, 11, 7);
    ctx.fillStyle = "#765e43";
    ctx.fillRect(-2, -4, 2, 2);
    ctx.fillRect(3, -4, 2, 2);
    ctx.fillStyle = "#3f4939";
    ctx.fillRect(-8, -9, 2, 2);
    ctx.fillRect(7, -9, 2, 2);
    ctx.fillStyle = "#e6d5a4";
    ctx.fillRect(-9, -2, 3, 4);
    ctx.fillRect(-10, -4, 2, 3);
    ctx.fillRect(8, -2, 3, 4);
    ctx.fillRect(10, -4, 2, 3);
  } else {
    const wing = Math.round(Math.sin(time * 17) * 2),
      fire = m.species === "firefly";
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(3, -13);
      ctx.lineTo(12, -23 + wing);
      ctx.lineTo(19, -18 + wing);
      ctx.lineTo(18, -9);
      ctx.lineTo(8, -4);
      ctx.lineTo(3, -6);
      ctx.closePath();
      ctx.fillStyle = fire ? "#e5c087" : "#c1d0b0";
      ctx.fill();
      ctx.strokeStyle = "#8c885c";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = fire ? "#f3deb0" : "#e3e3c4";
      ctx.fillRect(11, -18 + wing, 4, 5);
      ctx.fillStyle = fire ? "#c49356" : "#8ba989";
      ctx.fillRect(9, -9, 3, 2);
      ctx.restore();
    }

    ctx.fillStyle = "#716443";
    ctx.fillRect(-4, -17, 8, 20);
    ctx.fillStyle = fire ? "#bb8952" : "#7f9e80";
    ctx.fillRect(-3, -16, 6, 17);
    ctx.fillStyle = fire ? "#edd385" : "#bac99b";
    ctx.fillRect(-3, -2, 6, 5);
    ctx.fillStyle = "#d8d2a0";
    ctx.fillRect(-2, -19, 1, 3);
    ctx.fillRect(2, -19, 1, 3);
    ctx.fillStyle = "#3b5241";
    ctx.fillRect(-2, -12, 1, 2);
    ctx.fillRect(2, -12, 1, 2);
  }
  ctx.restore();
}
