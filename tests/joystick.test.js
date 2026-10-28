import test from "node:test";
import assert from "node:assert/strict";
import { joystickVector } from "../src/input/joystick.js";
import { createState, update } from "../src/game/state.js";

test("joystick : centre et zone morte arrêtent le personnage sans dérive", () => {
  for (const [x, y] of [
    [0, 0],
    [2, 0],
    [-2, 2],
    [0, -3],
  ])
    assert.deepEqual(joystickVector(x, y, 40), { x: 0, y: 0 });
});
test("joystick : diagonales et mouvements au-delà du socle restent bornés à la vitesse normale", () => {
  for (const [x, y] of [
    [80, 0],
    [-80, 80],
    [0, -80],
    [800, 900],
  ]) {
    const v = joystickVector(x, y, 40);
    assert.ok(Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-9);
    assert.equal(Math.sign(v.x), Math.sign(x));
    assert.equal(Math.sign(v.y), Math.sign(y));
  }
});
test("joystick : inclinaison légère, vitesse progressive et sens conservé", () => {
  const slow = joystickVector(12, 0, 40),
    fast = joystickVector(30, 0, 40);
  assert.ok(slow.x > 0 && slow.x < fast.x && fast.x < 1);
  const a = createState(),
    b = createState();
  const initial = a.player.x;
  update(a, slow, 1);
  update(b, fast, 1);
  assert.ok(a.player.x - initial < b.player.x - initial);
  update(a, { x: 0, y: 0 }, 1);
  assert.equal(a.player.moving, false);
});
test("déplacement : même inclinaison analogique, même vitesse en diagonale et tout droit", () => {
  const a = createState(),
    b = createState(),
    start = { ...a.player };
  update(a, { x: 0.5, y: 0 }, 1);
  update(b, { x: 0.5 / Math.sqrt(2), y: 0.5 / Math.sqrt(2) }, 1);
  assert.ok(
    Math.abs(
      Math.hypot(b.player.x - start.x, b.player.y - start.y) -
        (a.player.x - start.x),
    ) < 1e-8,
  );
});
