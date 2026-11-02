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
    : p.surface === "water"
      ? {
          placement: "water",
          hullFootprint: {
            type: "box",
            left: -p.w * 0.4,
            right: p.w * 0.4,
            top: -Math.max(
              p.h * 0.3,
              p.id === "harbor-rowboat" ? p.h * 0.75 : 26,
            ),
            bottom: 0,
          },
          walkSurface: {
            type: "box",
            left: -p.w * 0.32,
            right: p.w * 0.32,
            top:
              p.id === "harbor-rowboat"
                ? -p.h * 0.65
                : -Math.max(24, p.h * 0.24),
            bottom: p.id === "harbor-rowboat" ? -p.h * 0.15 : -4,
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

// A narrow floor connector reuses the pontoon planks, with no end posts.
HARBOR_ASSETS.push({
  id: "harbor-gangway",
  name: "Passerelle de bateau",
  asset: "harbor-pier-horizontal",
  kind: "exile-prop",
  collection: "harbor",
  surface: "gangway",
  isGangway: true,
  x: 720,
  y: 200,
  w: 48,
  h: 18,
  walkSurface: { type: "box", left: -24, right: 24, top: -18, bottom: 0 },
});
