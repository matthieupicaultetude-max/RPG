import catalog from "../assets/exile/harbor-catalog.json" with { type: "json" };
export const HARBOR_ASSETS = catalog.map((p) => ({
  ...p,
  kind: "exile-prop",
  asset: p.id,
  collection: "harbor",
  x: 720,
  y: 200,
  ...(p.surface === "pier"
    ? {
        walkSurface: {
          type: "box",
          left: -p.w / 2 + 5,
          right: p.w / 2 - 5,
          top: -p.h + 4,
          bottom: -2,
        },
      }
    : {
        onDock: p.surface === "quay",
        placement: p.surface === "water" ? "water" : "land",
        footprint: {
          type: "box",
          left: -p.w * 0.4,
          right: p.w * 0.4,
          top: -Math.min(p.h * 0.22, 30),
          bottom: 0,
        },
      }),
}));
