import test from "node:test";
import assert from "node:assert/strict";
import {
  PROPS,
  ROADS,
  ROAD_JUNCTIONS,
  isLand,
  isRoad,
  canWalkMap,
  validateMap,
  footprintPoints,
} from "../src/world/map.js";
import { texturePixel, TEXTURE_SIZE } from "../src/rendering/textures.js";
import { terrainPixel, terrainRaster } from "../src/rendering/terrain.js";
import { viewport } from "../src/rendering/viewport.js";

test("map: all footprints grounded, no obstacles overlap paths or one another", () => {
  assert.deepEqual(validateMap(), []);
  for (const tree of PROPS.filter((p) => p.kind === "tree"))
    for (const [x, y] of footprintPoints(tree))
      assert.ok(isLand(x, y) && !isRoad(x, y));
});
test("textures: periodic in both axes including negative coordinates", () => {
  for (const material of ["grass", "dirt", "water", "stone"])
    for (let x = -71; x < 130; x += 7)
      for (let y = -75; y < 128; y += 9) {
        assert.deepEqual(
          texturePixel(material, x, y),
          texturePixel(material, x + TEXTURE_SIZE, y),
        );
        assert.deepEqual(
          texturePixel(material, x, y),
          texturePixel(material, x, y - TEXTURE_SIZE),
        );
      }
});
test("raster: independently painted non-aligned chunks match a single render pixel for pixel", () => {
  const x = 287,
    y = 155,
    w = 96,
    h = 96,
    split = 37;
  const full = terrainRaster(x, y, w, h),
    left = terrainRaster(x, y, split, h),
    right = terrainRaster(x + split, y, w - split, h);
  for (let row = 0; row < h; row++)
    for (let col = 0; col < w; col++) {
      const source = col < split ? left : right,
        sourceWidth = col < split ? split : w - split,
        sourceX = col < split ? col : col - split;
      const index = (row * sourceWidth + sourceX) * 4;
      assert.deepEqual(
        full.slice((row * w + col) * 4, (row * w + col + 1) * 4),
        source.slice(index, index + 4),
      );
    }
});
test("road unions: no grass or crossing outline inside junctions; road centres stay walkable", () => {
  for (const [x, y] of Object.values(ROAD_JUNCTIONS))
    for (let dx = -7; dx <= 7; dx++)
      for (let dy = -7; dy <= 7; dy++) {
        const pixel = terrainPixel(x + dx, y + dy);
        assert.ok(
          pixel[0] >= 190 && pixel[1] >= 160,
          "internal border at junction",
        );
      }
  for (const road of ROADS)
    for (let i = 1; i < road.points.length; i++)
      for (let t = 0; t <= 1; t += 0.2) {
        const a = road.points[i - 1],
          b = road.points[i],
          x = a[0] + (b[0] - a[0]) * t,
          y = a[1] + (b[1] - a[1]) * t;
        assert.ok(
          canWalkMap(x, y),
          `${road.id}: blocked road centre ${x},${y}`,
        );
      }
});
test("navigation: village, workshop and combat area connected; water and solid roots blocked", () => {
  const start = [320, 220],
    targets = [
      [110, 135],
      [190, 295],
      [480, 255],
      [530, 165],
      [585, 240],
    ],
    queue = [start],
    seen = new Set(["320,220"]);
  for (let i = 0; i < queue.length; i++)
    for (const [dx, dy] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
    ]) {
      const [x, y] = queue[i],
        nx = x + dx,
        ny = y + dy,
        key = `${nx},${ny}`;
      if (!seen.has(key) && canWalkMap(nx, ny)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  for (const [x, y] of targets)
    assert.ok(
      queue.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < 6),
      `unreachable ${x},${y}`,
    );
  for (const tree of PROPS.filter((p) => p.kind === "tree"))
    assert.equal(canWalkMap(tree.x, tree.y), false);
  for (let y = 0; y < 400; y += 8)
    for (let x = 0; x < 640; x += 8)
      if (!isLand(x, y)) assert.equal(canWalkMap(x, y), false);
});
test("pixel-perfect camera: integer zoom and integer source origin at all tested sizes", () => {
  for (const [w, h] of [
    [390, 844],
    [1280, 720],
    [1467, 967],
    [1920, 1080],
  ])
    for (const x of [100.1, 320.7, 580.2]) {
      const view = viewport(w, h, { x, y: 210.3 });
      assert.ok(
        Number.isInteger(view.scale) &&
          Number.isInteger(view.x) &&
          Number.isInteger(view.y),
      );
      assert.ok(640 * view.scale >= w && 400 * view.scale >= h);
    }
});
