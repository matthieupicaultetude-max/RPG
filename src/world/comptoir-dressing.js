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
    ["harbor-pier-vertical", 334, 1194],
    ["harbor-pier-horizontal", 1144, 1200],
    ["harbor-bollard", 738, 1150],
    ["harbor-cargo", 334, 1042],
    ["harbor-fishing-rack", 1146, 1035],
    ["harbor-crane", 1144, 1085],
    ["harbor-lamp", 1138, 1135],
    ["harbor-fish-stall", 490, 969],
  ].map(([template, x, y]) => {
    const p = cityAsset(template, x, y);
    if (template === "harbor-crane")
      p.footprint = { type: "box", left: -10, right: 10, top: -12, bottom: 0 };
    return p;
  });
}
