import { texturePixel } from "../src/rendering/textures.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  MAP_SIZE,
  LAND,
  PROPS,
  BUILDINGS,
  ENTRANCES,
  ROADS,
  EXILE_SPAWN,
  EXILE_RETURN,
  SERVICES,
  canWalkExile,
  validateExileMap,
  placementOnLand,
} from "../src/world/exile-map.js";
import { inFootprint } from "../src/world/map.js";
import { SCENE } from "../src/game/config.js";
import { createSandbox, stepSandbox } from "../src/dev/sandbox.js";
import {
  travelToZone,
  nearZoneGate,
  useZoneGate,
} from "../src/game/zone-travel.js";
import { movePartyToZone, canWalkZone } from "../src/world/zones.js";
import { viewport, screenToWorld } from "../src/rendering/viewport.js";
import { worldSize } from "../src/world/dimensions.js";
import { findPath } from "../src/ai/companions.js";
import { nearForge } from "../src/game/forge.js";
import { nearPetShop } from "../src/game/pet-quests.js";
import { nearSawmill } from "../src/game/woodcutting.js";
import { nearHandyman } from "../src/game/handyman.js";
import { nearFountain } from "../src/data/progression.js";
import {
  EXILE_GOODS,
  buyExileItem,
  sellExileItem,
  restAtExileInn,
} from "../src/game/exile-commerce.js";
import {
  progressSnapshot,
  decodeSave,
  restoreProgress,
} from "../src/game/browser-save.js";
const town = () => {
  const s = createSandbox();
  s.tutorial = { step: "skipped", visited: [0, 1, 2] };
  assert.ok(travelToZone(s, "exile"));
  return s;
};
const approach = (s, id) =>
  movePartyToZone(s, "exile", { x: SERVICES[id].x, y: SERVICES[id].y + 16 });
test("Comptoir : grande carte, 24 maisons raccordées, aucune empreinte superposée ou arbre dans l’eau", () => {
  assert.ok(MAP_SIZE.width * MAP_SIZE.height > SCENE.width * SCENE.height * 15);
  assert.equal(BUILDINGS.length, 24);
  assert.equal(ENTRANCES.length, BUILDINGS.length);
  assert.deepEqual(validateExileMap(), []);
  for (const p of PROPS) assert.ok(placementOnLand(p), p.id);
  for (const r of ROADS.filter((r) => !r.id.startsWith("entrance-")))
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i],
        n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5);
      for (let j = 0; j <= n; j++)
        assert.ok(
          !BUILDINGS.some((p) =>
            inFootprint(
              a[0] + ((b[0] - a[0]) * j) / n,
              a[1] + ((b[1] - a[1]) * j) / n,
              p,
            ),
          ),
          r.id,
        );
    }
});
test("Tous les commerces, portes et pontons sont accessibles à pied depuis le port", () => {
  const cols = 224,
    rows = 176,
    key = (x, y) => y * cols + x,
    seen = new Set([key(112, 140)]),
    queue = [[112, 140]],
    cache = new Map();
  const walk = (x, y) => {
    const k = key(x, y);
    if (!cache.has(k)) cache.set(k, canWalkExile(x * 10, y * 10));
    return cache.get(k);
  };
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (
        nx < 1 ||
        ny < 1 ||
        nx >= cols - 1 ||
        ny >= rows - 1 ||
        seen.has(k) ||
        !walk(nx, ny)
      )
        continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  for (const p of [...Object.values(SERVICES), ...ENTRANCES, EXILE_RETURN])
    assert.ok(
      queue.some(([x, y]) => Math.hypot(x * 10 - p.x, y * 10 - p.y) < 14),
      p.id || "return",
    );
  assert.ok(!canWalkExile(1000, 1700));
  assert.ok(canWalkExile(EXILE_RETURN.x, EXILE_RETURN.y));
});
test("Caméra, souris et déplacements gardent les coordonnées du grand monde", () => {
  const player = { x: 1120, y: 1400 },
    view = viewport(1280, 800, player, MAP_SIZE);
  assert.equal(view.x, 800);
  assert.equal(view.y, 1200);
  assert.deepEqual(
    screenToWorld(
      640,
      400,
      { left: 0, top: 0, width: 1280, height: 800 },
      player,
      MAP_SIZE,
    ),
    player,
  );
  const s = town();
  stepSandbox(s, { x: 0, y: -1 }, 0.05);
  assert.ok(s.player.x > 640 && s.player.y > 400);
  assert.ok(s.player.y < 1400);
  assert.ok(canWalkZone(s.player.x, s.player.y, "exile"));
  assert.equal(worldSize("garden").width, 640);
});
test("Alliés et navigation contournent les obstacles au-delà de l’ancienne carte", () => {
  const canStand = Object.assign((x, y) => canWalkExile(x, y), {
    bounds: MAP_SIZE,
  });
  const path = findPath({ x: 1120, y: 860 }, { x: 1120, y: 750 }, canStand);
  assert.ok(path.length > 1);
  for (const p of path) assert.ok(canStand(p.x, p.y));
  const s = town();
  movePartyToZone(s, "exile", { x: 1120, y: 930 });
  for (let i = 0; i < 100; i++) stepSandbox(s, { x: 0, y: 1 }, 0.05);
  for (const m of s.team) {
    assert.ok(m.x > 640 && m.y > 400);
    assert.ok(canWalkExile(m.x, m.y));
    assert.ok(Math.hypot(m.x - s.player.x, m.y - s.player.y) < 160);
  }
});
test("Le trajet gratuit conserve les mondes et les habitants circulent sans combat", () => {
  const s = createSandbox(),
    monsters = s.monsters;
  assert.ok(travelToZone(s, "exile"));
  assert.equal(s.monsters.length, 0);
  assert.equal(s.npcs.length, Object.keys(SERVICES).length);
  assert.equal(s.bots.length, 16);
  const before = s.bots.map((b) => ({ x: b.x, y: b.y }));
  for (let i = 0; i < 300; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  for (const b of s.bots) assert.ok(canWalkExile(b.x, b.y), b.name);
  assert.ok(
    s.bots.some(
      (b, i) => Math.hypot(b.x - before[i].x, b.y - before[i].y) > 30,
    ),
  );
  movePartyToZone(s, "exile", EXILE_RETURN);
  assert.equal(nearZoneGate(s).destination, "garden");
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "garden");
  assert.equal(s.monsters, monsters);
  assert.ok(travelToZone(s, "exile"));
  assert.equal(s.monsters.length, 0);
});
test("Les artisans existants et la fontaine fonctionnent aux adresses du Comptoir", () => {
  const s = town();
  for (const [id, near] of [
    ["forge", nearForge],
    ["petshop", nearPetShop],
    ["handyman", nearHandyman],
    ["sawmill", nearSawmill],
  ]) {
    approach(s, id);
    assert.ok(near(s), id);
  }
  movePartyToZone(s, "exile", { x: 1120, y: 850 });
  assert.ok(nearFountain(s));
  assert.ok(!nearForge(s));
});
test("Achats, revente et repos vérifient portée, prix et quantité sans toucher aux panoplies", () => {
  const s = town();
  s.gold = 100;
  assert.ok(!buyExileItem(s, "hat"));
  approach(s, "armor");
  assert.ok(buyExileItem(s, "hat"));
  assert.equal(s.gold, 85);
  assert.equal(s.bag[0].setId, undefined);
  assert.ok(buyExileItem(s, "hat"));
  assert.equal(s.bag[0].quantity, 2);
  s.gold = 0;
  assert.ok(!buyExileItem(s, "blade"));
  approach(s, "trader");
  s.bag.push(
    { id: s.nextItem++, name: "Gelée d’eau", type: "normal", quantity: 3 },
    {
      id: s.nextItem++,
      name: "Gelée chromatique",
      type: "normal",
      chromatic: true,
      quantity: 3,
    },
  );
  const item = s.bag[1];
  assert.ok(!sellExileItem(s, item.id, 4));
  assert.ok(sellExileItem(s, item.id, 2));
  assert.equal(item.quantity, 1);
  assert.equal(s.gold, 4);
  assert.ok(!sellExileItem(s, s.bag[2].id));
  approach(s, "inn");
  s.team[0].hp = 1;
  assert.ok(!restAtExileInn(s));
  s.gold = 5;
  assert.ok(restAtExileInn(s));
  assert.equal(s.team[0].hp, s.team[0].maxHp);
  assert.equal(s.gold, 0);
});
test("La sauvegarde retrouve le Comptoir sans effacer les anciennes progressions", () => {
  const s = town();
  s.gold = 74;
  movePartyToZone(s, "exile", { x: 1120, y: 930 });
  const saved = decodeSave(JSON.stringify(progressSnapshot(s))),
    restored = createSandbox();
  restoreProgress(restored, saved);
  assert.equal(restored.zone, "exile");
  assert.equal(restored.player.x, 1120);
  assert.equal(restored.player.y, 930);
  assert.equal(restored.gold, 74);
  assert.equal(restored.monsters.length, 0);
  delete saved.progress.location;
  const legacy = createSandbox();
  restoreProgress(legacy, saved);
  assert.equal(legacy.zone, "garden");
  assert.equal(legacy.gold, 74);
});

test("Les pavés utilisent un échantillonnage périodique en coordonnées monde", () => {
  for (let y = -7; y < 72; y++)
    for (let x = -7; x < 72; x++) {
      const pixel = texturePixel("town-stone", x, y);
      assert.deepEqual(pixel, texturePixel("town-stone", x + 64, y));
      assert.deepEqual(pixel, texturePixel("town-stone", x, y + 64));
    }
});
