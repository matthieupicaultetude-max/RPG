import test from "node:test";
import assert from "node:assert/strict";
import { HOUSE_ROOF } from "../src/rendering/house-geometry.js";
import { insidePolygon } from "../src/world/map.js";

test("roof slopes are untwisted parallelograms sharing the exact ridge", () => {
  for (const plane of [HOUSE_ROOF.left, HOUSE_ROOF.right])
    for (const axis of [0, 1])
      assert.equal(
        plane[0][axis] + plane[2][axis],
        plane[1][axis] + plane[3][axis],
      );
  assert.deepEqual(HOUSE_ROOF.left[1], HOUSE_ROOF.right[0]);
  assert.deepEqual(HOUSE_ROOF.left[2], HOUSE_ROOF.right[3]);
});
test("gable and tile planes share both front eaves without a separate gray underlay", () => {
  assert.deepEqual(HOUSE_ROOF.gable, [
    HOUSE_ROOF.left[3],
    HOUSE_ROOF.left[2],
    HOUSE_ROOF.right[2],
  ]);
  assert.deepEqual(HOUSE_ROOF.frontTrim, HOUSE_ROOF.gable);
  for (const x of [62, 99, 153])
    assert.ok(
      insidePolygon(x + 2, 61, HOUSE_ROOF.gable),
      "upper wall post exposed beside gable",
    );
  assert.ok(insidePolygon(72, 63, HOUSE_ROOF.gable));
  assert.equal(insidePolygon(72, 63, HOUSE_ROOF.left), false);
  assert.ok(
    insidePolygon(85, 26, HOUSE_ROOF.left),
    "chimney base must rest on a roof slope",
  );
});
