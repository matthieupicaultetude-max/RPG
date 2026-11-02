import { ARTISAN_BUILDINGS } from "../data/artisan-buildings.js";
import { BLUE_PROPS } from "../data/blue-props.js";
import { GREENERY } from "../data/greenery.js";
import { HARBOR_ASSETS } from "../data/harbor-assets.js";
const catalog = new Map(
  [...ARTISAN_BUILDINGS, ...BLUE_PROPS, ...GREENERY, ...HARBOR_ASSETS].map(
    (p) => [p.id, p],
  ),
);
export function cityAsset(template, x, y, id = `comptoir-${template}`) {
  const source = catalog.get(template);
  if (!source) throw Error(`Unknown Comptoir asset: ${template}`);
  return { ...structuredClone(source), id, x, y };
}
export function dressArtisanDistrict(buildings) {
  const houses = buildings.filter((p) => p.x > 800 && p.y >= 595);
  const forge = houses.find((p) => p.service === "forge");
  const ordered = [forge, ...houses.filter((p) => p !== forge)];
  if (ordered.length !== ARTISAN_BUILDINGS.length)
    throw Error("Artisan plots must match the authored catalog");
  ordered.forEach((p, i) => {
    const model = ARTISAN_BUILDINGS[i];
    p.asset = model.asset;
    p.h = Math.round(((p.w + 12) * model.h) / (model.w + 12));
    p.district = "artisans";
    p.roof = "navy";
  });
}
export function comptoirDecor() {
  return [
    ["blue-prop-workbench", 960, 620],
    ["blue-prop-crates", 1040, 620],
    ["blue-prop-anvil", 1000, 828],
    ["blue-prop-stone-stack", 1190, 660],
    ["blue-prop-tool-rack", 1260, 660],
    ["blue-prop-barrels", 1278, 790],
    ["blue-prop-lumber-rack", 1195, 790],
    ["blue-prop-banner-lamp", 1062, 720],
    ["blue-prop-bench", 940, 955],
    ["blue-prop-planter", 1020, 952],
    ["blue-prop-well", 1190, 940],
    ["blue-prop-market-stall", 1105, 940],
    ["greenery-leafy-tree", 620, 180],
    ["greenery-birch", 790, 200],
    ["greenery-potted-topiary", 675, 585],
    ["greenery-cypress", 780, 585],
    ["greenery-bush", 680, 650],
    ["greenery-hedge", 770, 730],
    ["greenery-flowerbed", 655, 770],
    ["greenery-rosebush", 785, 760],
    ["greenery-ivy-trellis", 655, 430],
    ["greenery-flowerpot", 800, 680],
    ["greenery-fern", 1080, 575],
    ["greenery-grasses", 748, 85],

    ["harbor-bollard", 740, 1160],
    ["harbor-cargo", 350, 1030],
    ["harbor-fishing-rack", 395, 1130],
    ["harbor-crane", 1190, 1150],
    ["harbor-lamp", 1095, 1150],
    ["harbor-fish-stall", 375, 1150],
  ].map(([template, x, y]) => {
    const p = cityAsset(template, x, y);
    if (
      template === "harbor-crane" ||
      template === "harbor-cargo" ||
      template === "harbor-bollard"
    )
      p.footprint = { type: "box", left: -10, right: 10, top: -12, bottom: 0 };
    return p;
  });
}

export function portWalkways() {
  const segments = [
    ["vertical", 720, 1120, 72, "arrival-0"],
    ["vertical", 720, 1184, 72, "arrival-1"],
    ["vertical", 334, 1052, 64, "fish-0"],
    ["vertical", 334, 1136, 64, "fish-1"],
    ["horizontal", 360, 1160, 148, "fish-head"],
    ["vertical", 1144, 1092, 80, "cargo-0"],
    ["vertical", 1144, 1192, 80, "cargo-1"],
    ["horizontal", 1120, 1200, 240, "cargo-head"],
  ];
  return segments.map(([direction, x, y, width, key]) => {
    const p = cityAsset(
        `harbor-pier-${direction}`,
        x,
        y,
        `comptoir-port-${key}`,
      ),
      factor = width / p.w;
    p.w = width;
    p.h = Math.round(p.h * factor);
    p.walkSurface = {
      type: "box",
      left: -width / 2 + 5,
      right: width / 2 - 5,
      top: -p.h + 4,
      bottom: -2,
    };
    return p;
  });
}

export function shipGangways() {
  const routes = [
    [745, 1112, 42, 16, "comptoir-barque-arrivee", "arrival-boat"],
    [969, 1162, 44, 24, "comptoir-cogue", "merchant"],
    [1228, 1155, 60, 16, "comptoir-caravelle", "caravel"],
    [256, 1109, 44, 16, "comptoir-voilier", "fishing-west"],
    [421, 1152, 18, 28, "comptoir-barque", "rowboat-west"],
    [420, 1140, 84, 18, "comptoir-voilier-cotier", "fishing-east-0"],
    [483, 1140, 24, 58, "comptoir-voilier-cotier", "fishing-east-1"],
  ];
  return routes.map(([x, y, w, h, boardingShip, key]) => {
    const p = cityAsset(
      w >= h ? "harbor-pier-horizontal" : "harbor-pier-vertical",
      x + w / 2,
      y + h,
      `comptoir-port-gangway-${key}`,
    );
    return {
      ...p,
      w,
      h,
      isGangway: true,
      boardingShip,
      walkSurface: {
        type: "box",
        left: -w / 2,
        right: w / 2,
        top: -h,
        bottom: 0,
      },
    };
  });
}
