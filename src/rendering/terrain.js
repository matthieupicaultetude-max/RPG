import { landDistance, roadDistance } from "../world/map.js";
import { texturePixel, hash } from "./textures.js";

export function terrainPixel(x, y) {
  const land = landDistance(x + 0.5, y + 0.5);
  if (land < -5) return texturePixel("water", x, y);
  if (land < 0) {
    if (land < -3.7) return [154, 191, 174, 255];
    return texturePixel("stone", x, y);
  }
  const dirt = roadDistance(x + 0.5, y + 0.5);
  if (dirt <= 0) {
    const color = texturePixel("dirt", x, y);
    // Only the exterior of the UNION is shaded, never an individual branch.
    if (dirt > -1.2) return [188, 177, 119, 255];
    return color;
  }
  const grass = texturePixel("grass", x, y);
  if (dirt < 1.8 && hash(x, y, 19) % 3 === 0) return [157, 160, 78, 255];
  if (land < 2) return [137, 149, 77, 255];
  return grass;
}
export function terrainRaster(x, y, width, height) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++)
      pixels.set(terrainPixel(x + col, y + row), (row * width + col) * 4);
  return pixels;
}
export function paintTerrain(ctx, width, height) {
  const data = ctx.createImageData(width, height);
  data.data.set(terrainRaster(0, 0, width, height));
  ctx.putImageData(data, 0, 0);
}
