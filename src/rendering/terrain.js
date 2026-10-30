import { landDistance, roadDistance } from "../world/map.js";
import { texturePixel, hash } from "./textures.js";

export function terrainPixel(x, y, map = { landDistance, roadDistance }) {
  if (map.terrainPixel) return map.terrainPixel(x, y);
  const sample = map.texturePixel || texturePixel;
  const land = map.landDistance(x + 0.5, y + 0.5);
  const sandyCoast = !map.texturePixel || map.texturePixel === texturePixel;
  if (land < -5) return sample("water", x, y);
  if (land < 0) {
    if (sandyCoast) {
      if (land >= -3.7) return sample("wet-sand", x, y);
      const water = sample("water", x, y);
      return water.map((v, i) =>
        i < 3 ? Math.round(v * 0.7 + [142, 196, 184][i] * 0.3) : v,
      );
    }
    if (land < -3.7) return [154, 191, 174, 255];
    return sample("stone", x, y);
  }
  const dirt = map.roadDistance(x + 0.5, y + 0.5);
  if (dirt <= 0) {
    const color = sample("dirt", x, y);
    // Only the exterior of the UNION is shaded, never an individual branch.
    if (dirt > -1.2) return [188, 177, 119, 255];
    return color;
  }
  if (sandyCoast && (land < 6 || (land < 9 && hash(x, y, 98) % 3 === 0)))
    return sample("sand", x, y);
  const grass = sample("grass", x, y);
  if (dirt < 1.8 && hash(x, y, 19) % 3 === 0) return [157, 160, 78, 255];
  if (land < 2) return [137, 149, 77, 255];
  return grass;
}
export function terrainRaster(x, y, width, height, map) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++)
      pixels.set(terrainPixel(x + col, y + row, map), (row * width + col) * 4);
  return pixels;
}
export function paintTerrain(ctx, width, height, map) {
  const data = ctx.createImageData(width, height);
  data.data.set(terrainRaster(0, 0, width, height, map));
  ctx.putImageData(data, 0, 0);
}
