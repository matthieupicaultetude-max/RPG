import * as villageMap from "../world/map.js";
import { paintTerrain } from "./terrain.js";
import { createSpriteAtlas, drawFence } from "./sprites.js";
import { hash } from "./textures.js";

export function createEnvironment(map = villageMap) {
  const {MAP_SIZE, PROPS, DECORATIONS, FENCES, placementOnLand, validateMap, isLand, isRoad, landDistance} = map;
  const errors = validateMap();
  if (errors.length) throw new Error(`Invalid map: ${errors.join("; ")}`);
  const ground = document.createElement("canvas");
  ground.width = MAP_SIZE.width;
  ground.height = MAP_SIZE.height;
  const ctx = ground.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  paintTerrain(ctx, MAP_SIZE.width, MAP_SIZE.height, map);
  const spriteFor = createSpriteAtlas();
  // Ground decoration follows semantic material data, never sampled RGB values.
  for (let i = 0; i < 80; i++) {
    const x = 16 + (hash(i, 1, 47) % 608),
      y = 66 + (hash(i, 2, 47) % 312);
    if (!isLand(x, y) || isRoad(x, y) || landDistance(x, y) < 12) continue;
    if (PROPS.some((prop) => Math.hypot(prop.x - x, prop.y - y) < 24)) continue;
    const sprite = spriteFor({ kind: "daisy" });
    ctx.globalAlpha = 0.8;
    ctx.drawImage(sprite.canvas, x - sprite.anchorX, y - sprite.anchorY);
    ctx.globalAlpha = 1;
  }
  const props = [...PROPS, ...DECORATIONS].map((prop) => {
    if (!placementOnLand(prop))
      throw new Error(`Invalid land placement: ${prop.id}`);
    const sprite = spriteFor(prop);
    const stump=prop.kind==="tree"?spriteFor({...prop,kind:"stump"}):null;
    return {
      ...prop,
      bounds: {
        left: prop.x - sprite.anchorX,
        right: prop.x - sprite.anchorX + sprite.canvas.width,
        top: prop.y - sprite.anchorY,
        bottom: prop.y - sprite.anchorY + sprite.canvas.height,
      },
      draw(g,felled=false) {
        const image=felled&&stump?stump:sprite;
        g.drawImage(
          image.canvas,
          Math.round(prop.x) - image.anchorX,
          Math.round(prop.y) - image.anchorY,
        );
      },
    };
  });
  for (const fence of FENCES)
    props.push({
      ...fence,
      draw(g) {
        drawFence(g, fence);
      },
    });
  return { ground, props, markers:map.MARKERS || [], land:map.LAND };
}
