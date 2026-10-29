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
export function texturePixel(material, worldX, worldY) {
  const x = mod(worldX, TEXTURE_SIZE),
    y = mod(worldY, TEXTURE_SIZE),
    grain = hash(x, y, 7);
  if (material === 'harbor-sidewalk' || material === 'harbor-cobbles') {
    const slab = material === 'harbor-sidewalk', w = slab ? 16 : 8, h = slab ? 8 : 4;
    const row = Math.floor(y / h), sx = (x + (row % 2) * w / 2) % w, sy = y % h;
    const shade = hash(Math.floor((x + (row % 2) * w / 2) / w) % (64 / w), row, 73) % 9;
    if (!sx || !sy) return slab ? [107,115,119,255] : [109,111,106,255];
    if (sy === 1) return slab ? [203,208,209,255] : [188,187,171,255];
    return slab ? [166+shade,174+shade,178+shade,255] : [149+shade,151+shade,139+shade,255];
  }
  if(material==='harbor-stone'){
    const row=Math.floor(y/8),offset=(row%2)*4,sx=(x+offset)%8,sy=y%8,h=hash(Math.floor((x+offset)/8)%8,row,32)%4;
    if(sx===0||sy===0||(sx===1&&sy===1))return [166,160,133,255];
    if(sy===1)return [242,229,195,255];
    return [211+h*3,204+h*2,175+h*2,255];
  }
  if(material==='harbor-water'){
    const row=Math.floor(y/8),start=hash(row,0,15)%64,len=4+hash(row,2,15)%9;
    if(y%8===3&&mod(x-start,64)<len)return [102,192,195,255];
    return [30+grain%4,133+grain%4,153+grain%4,255];
  }
  if(material==='town-stone'){
    const row=Math.floor(y/8),offset=(row%2)*4,sx=(x+offset)%8,sy=y%8,h=hash(Math.floor((x+offset)/8)%8,row,32)%4;
    if(sx===0||sy===0||(sx===1&&sy===1)||(sx===7&&sy===7))return [132,143,131,255];
    if(sy===1)return [198+h,201+h,175+h,255];
    return [168+h*3,177+h*2,161+h*2,255];
  }
  if (material === "water") {
    const row = Math.floor(y / 8),
      start = hash(row, 0, 15) % 64,
      length = 4 + (hash(row, 2, 15) % 9);
    if (y % 8 === 3 && mod(x - start, 64) < length) return [116, 165, 163, 255];
    const shift = grain % 3;
    return [60 + shift, 125 + shift, 134 + shift, 255];
  }
  if (material === "dirt") {
    if (grain % 113 === 0) return [190, 169, 115, 255];
    if (grain % 97 === 0) return [225, 206, 155, 255];
    const n = grain % 4;
    return [210 + n, 190 + n, 139 + n, 255];
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
