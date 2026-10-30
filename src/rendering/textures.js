// Periodic samplers on a torus: features crossing an edge continue on the other side.
export const TEXTURE_SIZE = 64;
export function hash(x, y, salt = 0) {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
const mod = (value, size) => ((Math.floor(value) % size) + size) % size;
// Wrapped lattice noise keeps both the value and slope continuous across a tile.
function noise(x, y, cell, salt) {
  const cx = Math.floor(x / cell),
    cy = Math.floor(y / cell),
    period = 64 / cell;
  const smooth = (t) => t * t * (3 - 2 * t),
    u = smooth((x % cell) / cell),
    v = smooth((y % cell) / cell);
  const n = (dx, dy) =>
    (hash(mod(cx + dx, period), mod(cy + dy, period), salt) % 1024) / 1023 -
    0.5;
  return (
    (n(0, 0) * (1 - u) + n(1, 0) * u) * (1 - v) +
    (n(0, 1) * (1 - u) + n(1, 1) * u) * v
  );
}
function waterPixel(x, y, harbor) {
  const n =
    Math.round((noise(x, y, 32, 71) * 20 + noise(x, y, 16, 72) * 8) / 2) * 2;
  const base = harbor ? [36 + n, 136 + n, 153 + n] : [54 + n, 128 + n, 143 + n];
  const cx = Math.floor(x / 16),
    cy = Math.floor(y / 16);
  // Short curved wavelets cross cell and tile edges; no regularly spaced rows.
  for (const dx of [0, -1])
    for (const dy of [0, -1]) {
      const gx = mod(cx + dx, 4),
        gy = mod(cy + dy, 4),
        h = hash(gx, gy, 83);
      if (h % 3 === 0) continue;
      const px = gx * 16 + (h % 16),
        py = gy * 16 + ((h >>> 5) % 16),
        len = 5 + ((h >>> 9) % 9);
      const sx = mod(x - px, 64),
        sy = mod(y - py, 64),
        bend = sx < len * 0.3 ? 1 : sx < len * 0.75 ? 0 : 1;
      if (sx < len && sy === bend)
        return [base[0] + 23, base[1] + 27, base[2] + 20, 255];
      if (sx < len * 0.6 && sy === bend + 2)
        return [base[0] - 4, base[1] - 5, base[2] - 3, 255];
    }
  return [...base, 255];
}
function sandPixel(x, y, material) {
  const wet = material === "wet-sand",
    dirt = material === "dirt";
  const n = Math.round(noise(x, y, 32, 91) * 10 + noise(x, y, 8, 92) * 4),
    grain = hash(x, y, 93);
  const shift = grain % 97 === 0 ? 8 : grain % 71 === 0 ? -8 : (grain % 3) - 1;
  const base = wet ? [174, 163, 122] : dirt ? [213, 194, 149] : [229, 212, 169];
  // Tiny grains sit on gentle broad patches instead of a speckled grid.
  return [base[0] + n + shift, base[1] + n + shift, base[2] + n + shift, 255];
}
const naturalTiles = new Map();
function naturalPixel(material, x, y) {
  let tile = naturalTiles.get(material);
  if (!tile) {
    tile = Array.from({ length: 4096 }, (_, i) =>
      material.includes("water")
        ? waterPixel(i % 64, Math.floor(i / 64), material === "harbor-water")
        : sandPixel(i % 64, Math.floor(i / 64), material),
    );
    naturalTiles.set(material, tile);
  }
  return tile[y * 64 + x].slice();
}
export function texturePixel(material, worldX, worldY) {
  const x = mod(worldX, TEXTURE_SIZE),
    y = mod(worldY, TEXTURE_SIZE),
    grain = hash(x, y, 7);
  if (["water", "harbor-water", "sand", "wet-sand", "dirt"].includes(material))
    return naturalPixel(material, x, y);
  if (material === "harbor-sidewalk" || material === "harbor-cobbles") {
    const slab = material === "harbor-sidewalk",
      w = slab ? 16 : 8,
      h = slab ? 8 : 4;
    const row = Math.floor(y / h),
      sx = (x + ((row % 2) * w) / 2) % w,
      sy = y % h;
    const shade =
      hash(Math.floor((x + ((row % 2) * w) / 2) / w) % (64 / w), row, 73) % 9;
    if (!sx || !sy) return slab ? [107, 115, 119, 255] : [109, 111, 106, 255];
    if (sy === 1) return slab ? [203, 208, 209, 255] : [188, 187, 171, 255];
    return slab
      ? [166 + shade, 174 + shade, 178 + shade, 255]
      : [149 + shade, 151 + shade, 139 + shade, 255];
  }
  if (material === "harbor-stone") {
    const row = Math.floor(y / 8),
      offset = (row % 2) * 4,
      sx = (x + offset) % 8,
      sy = y % 8,
      h = hash(Math.floor((x + offset) / 8) % 8, row, 32) % 4;
    if (sx === 0 || sy === 0 || (sx === 1 && sy === 1))
      return [166, 160, 133, 255];
    if (sy === 1) return [242, 229, 195, 255];
    return [211 + h * 3, 204 + h * 2, 175 + h * 2, 255];
  }
  if (material === "town-stone") {
    const row = Math.floor(y / 8),
      offset = (row % 2) * 4,
      sx = (x + offset) % 8,
      sy = y % 8,
      h = hash(Math.floor((x + offset) / 8) % 8, row, 32) % 4;
    if (
      sx === 0 ||
      sy === 0 ||
      (sx === 1 && sy === 1) ||
      (sx === 7 && sy === 7)
    )
      return [132, 143, 131, 255];
    if (sy === 1) return [198 + h, 201 + h, 175 + h, 255];
    return [168 + h * 3, 177 + h * 2, 161 + h * 2, 255];
  }
  if (material === "grass") {
    // Sparse wrapped tufts: no grid of opaque tiles and no stripes along tile edges.
    const cellX = Math.floor(x / 8),
      cellY = Math.floor(y / 8);
    for (const offset of [0, -1]) {
      const cy = mod(cellY + offset, 8),
        origin = hash(cellX, cy, 3);
      const tx = cellX * 8 + (origin % 8),
        ty = cy * 8 + ((origin >>> 4) % 8);
      if (origin % 3 === 0 && mod(x - tx, 64) === 0 && mod(y - ty, 64) < 2)
        return [142, 153, 70, 255];
    }
    if (grain % 59 === 0) return [179, 182, 91, 255];
    const n = grain % 4;
    return [163 + n, 173 + n, 79 + n, 255];
  }
  if (material === "stone") {
    const bx = mod(x + (Math.floor(y / 8) % 2) * 8, 16),
      by = y % 8;
    if (bx === 0 || by === 0) return [119, 122, 94, 255];
    return by === 1
      ? [186, 184, 146, 255]
      : [160 + (grain % 7), 163 + (grain % 7), 130 + (grain % 5), 255];
  }
  throw new Error(`Unknown material: ${material}`);
}
