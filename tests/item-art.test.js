import test from "node:test";
import assert from "node:assert/strict";
import { renderItemIcon } from "../src/ui/item-art.js";
import {
  STARTER_SETS,
  createCore,
  rollCoreEquipment,
} from "../src/data/equipment.js";
import { MONSTERS, monsterLoot } from "../src/data/monsters.js";

test("les 36 pièces possèdent un dessin identifié et distinct", () => {
  const drawings = STARTER_SETS.flatMap((set) =>
    set.pieces.map((piece) =>
      renderItemIcon(piece).replace(/data-art="[^"]*"/g, ""),
    ),
  );
  assert.equal(drawings.length, 36);
  assert.equal(new Set(drawings).size, 36);
  for (const svg of drawings) {
    assert.ok(svg.startsWith("<svg"));
    assert.equal(/undefined|NaN/.test(svg), false);
  }
});
test("toutes les ressources ont des silhouettes distinctes et leurs variantes restent lisibles", () => {
  const drops = MONSTERS.flatMap((m) => monsterLoot(m.id)),
    standard = drops.filter((i) => !i.chromatic).map(renderItemIcon);
  assert.equal(new Set(standard).size, new Set(drops.filter(i=>!i.chromatic).map(i=>i.name)).size);
  for (const item of drops) {
    const svg = renderItemIcon(item);
    assert.equal(/undefined|NaN/.test(svg), false);
    if (item.chromatic)
      assert.notEqual(svg, renderItemIcon({ ...item, chromatic: false }));
  }
});
test("noyaux toujours standards, même si un ancien objet prétend être chromatique", () => {
  const core = createCore("fire");
  assert.equal(core.chromatic, false);
  assert.equal(
    rollCoreEquipment({ ...core, chromatic: true }, () => 0).chromatic,
    false,
  );
  assert.equal(
    renderItemIcon(core),
    renderItemIcon({ ...core, chromatic: true }),
  );
});
