import { DEV_CHEST } from "../world/dev-chest.js";
export function drawDevChest(g, s) {
  const p = DEV_CHEST;
  g.save();
  g.translate(p.x, p.y);
  g.fillStyle = "#2b362454";
  g.beginPath();
  g.ellipse(2, 4, 17, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#493c33";
  g.fillRect(-14, -14, 28, 17);
  g.fillStyle = "#936339";
  g.fillRect(-12, -13, 24, 14);
  g.fillStyle = "#bc8b4e";
  g.fillRect(-11, -11, 22, 3);
  for (const x of [-10, 7]) {
    g.fillStyle = "#cbb67c";
    g.fillRect(x, -14, 3, 16);
    g.fillStyle = "#655c44";
    g.fillRect(x + 1, -8, 1, 1);
  }
  g.fillStyle = "#6d4b32";
  g.fillRect(-14, -19, 28, 7);
  g.fillStyle = "#b4884b";
  g.fillRect(-12, -20, 24, 6);
  g.fillStyle = "#e1cb8b";
  g.fillRect(-13, -16, 26, 2);
  if (s.devChestOpen) {
    g.fillStyle = "#352b29";
    g.fillRect(-10, -17, 20, 5);
    g.fillStyle = "#d4b568";
    g.fillRect(-12, -25, 24, 6);
    g.fillStyle = "#ead7a0";
    g.fillRect(-12, -25, 24, 2);
  }
  g.fillStyle = "#e3cf88";
  g.fillRect(-3, -12, 6, 8);
  g.fillStyle = "#655c44";
  g.fillRect(-1, -9, 2, 3);
  g.font = "7px monospace";
  g.textAlign = "center";
  g.fillStyle = "#243a2bdd";
  g.fillRect(-32, 9, 64, 12);
  g.fillStyle = "#f1dfa7";
  g.fillText("COFFRE DEV · F", 0, 18);
  g.restore();
}
