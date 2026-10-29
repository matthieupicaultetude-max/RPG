import catalog from "../assets/exile/blue-props-catalog.json" with { type: "json" };
// Editor templates only: props are placed explicitly and carry no service.
export const BLUE_PROPS = catalog.map((p) => ({
  ...p,
  kind: "exile-prop",
  asset: p.id,
  district: "artisans",
  collection: "blue-props",
  x: 720,
  y: 200,
  footprint: {
    type: "box",
    left: -p.w * 0.4,
    right: p.w * 0.4,
    top: -p.depth,
    bottom: 0,
  },
}));
