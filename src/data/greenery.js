import catalog from "../assets/exile/greenery-catalog.json" with { type: "json" };
// Manually placed scenery only. Decorative trees are not harvest resources.
export const GREENERY = catalog.map((p) => ({
  ...p,
  kind: "exile-prop",
  asset: p.id,
  collection: "greenery",
  x: 720,
  y: 200,
}));
