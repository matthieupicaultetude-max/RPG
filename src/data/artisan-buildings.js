import catalog from "../assets/exile/artisan-catalog.json" with { type: "json" };
// Catalog only: registering a template never places a building in the live town.
export const ARTISAN_BUILDINGS = catalog.map((p) => ({
  ...p,
  kind: "exile-house",
  asset: p.id,
  district: "artisans",
  roof: "navy",
  floors: 1,
  x: 720,
  y: 200,
  footprint: {
    type: "box",
    left: -p.w / 2,
    right: p.w / 2,
    top: -Math.min(52, p.h * 0.5),
    bottom: 0,
  },
}));
