import { readFileSync } from "node:fs";
import atlasFrames from "../src/assets/exile/atlas-frames.json" with { type: "json" };
import { texturePixel } from "../src/rendering/textures.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  MAP_SIZE,
  RAMPARTS,
  NORTH_GATE,
  TERRACES,
  TERRACE_STAIRS,
  terraceBoundaryY,
  elevationAt,
  rampartDistance,
  SHIPS,
  GATE_TOWERS,
  PORT_GATE,
  STAIRS,
  onDock,
  isLand,
  FOUNTAIN,
  EXILE_DEV_POINTS,
  LAND,
  PROPS,
  BUILDINGS,
  ENTRANCES,
  ROADS,
  SIDEWALKS,
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
test("Comptoir : surface réduite, quartiers médiévaux mitoyens raccordés, aucune empreinte superposée ou arbre dans l’eau", () => {
  assert.ok(MAP_SIZE.width * MAP_SIZE.height < 2240 * 1760 * 0.5);
  assert.ok(BUILDINGS.length >= 40);
  const attached = BUILDINGS.filter((p) => p.attachedTo);
  assert.ok(attached.length > BUILDINGS.length / 2);
  for (const p of attached) {
    const neighbor = BUILDINGS.find((b) => b.id === p.attachedTo);
    assert.ok(neighbor);
    assert.equal(p.y, neighbor.y);
    const joint = p.x + ((neighbor.x > p.x ? 1 : -1) * p.w) / 2;
    assert.equal(canWalkExile(joint, p.y - 12), false, "mur mitoyen fermé");
    assert.ok(
      Math.abs(Math.abs(p.x - neighbor.x) - (p.w + neighbor.w) / 2) < 2,
    );
  }
  assert.ok(BUILDINGS.every((p) => p.floors >= 2));
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
  const cols = MAP_SIZE.width / 10,
    rows = MAP_SIZE.height / 10,
    key = (x, y) => y * cols + x,
    seen = new Set([key(EXILE_SPAWN.x / 10, EXILE_SPAWN.y / 10)]),
    queue = [[EXILE_SPAWN.x / 10, EXILE_SPAWN.y / 10]],
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
  const player = { ...EXILE_SPAWN },
    view = viewport(1280, 800, player, MAP_SIZE);
  assert.equal(view.x, EXILE_SPAWN.x - 320);
  assert.equal(view.y, EXILE_SPAWN.y - 200);
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
  assert.ok(s.player.y < EXILE_SPAWN.y);
  assert.ok(canWalkZone(s.player.x, s.player.y, "exile"));
  assert.equal(worldSize("garden").width, 640);
});
test("Alliés et navigation contournent les obstacles au-delà de l’ancienne carte", () => {
  const canStand = Object.assign((x, y) => canWalkExile(x, y), {
    bounds: MAP_SIZE,
  });
  const path = findPath(
    { x: FOUNTAIN.x, y: FOUNTAIN.y + 50 },
    { x: FOUNTAIN.x, y: FOUNTAIN.y - 50 },
    canStand,
  );
  assert.ok(path.length > 1);
  for (const p of path) assert.ok(canStand(p.x, p.y));
  const s = town();
  movePartyToZone(s, "exile", EXILE_DEV_POINTS.plaza);
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
  movePartyToZone(s, "exile", { x: FOUNTAIN.x, y: FOUNTAIN.y + 40 });
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
  movePartyToZone(s, "exile", EXILE_DEV_POINTS.plaza);
  const saved = decodeSave(JSON.stringify(progressSnapshot(s))),
    restored = createSandbox();
  restoreProgress(restored, saved);
  assert.equal(restored.zone, "exile");
  assert.equal(restored.player.x, EXILE_DEV_POINTS.plaza.x);
  assert.equal(restored.player.y, EXILE_DEV_POINTS.plaza.y);
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

test("Une ancienne position du grand Comptoir revient au port sans perte de progression", () => {
  const s = town();
  s.gold = 123;
  const save = progressSnapshot(s);
  save.progress.location = { zone: "exile", x: 1120, y: 1400 };
  const restored = createSandbox();
  restoreProgress(restored, decodeSave(JSON.stringify(save)));
  assert.equal(restored.gold, 123);
  assert.equal(restored.zone, "exile");
  assert.equal(restored.player.x, EXILE_SPAWN.x);
  assert.equal(restored.player.y, EXILE_SPAWN.y);
});

test("Les navires restent dans l’eau sans recouvrir un ponton", () => {
  for (const p of SHIPS)
    for (const dx of [-28, 0, 28])
      for (const dy of [-78, 0, 78]) {
        assert.equal(isLand(p.x + dx, p.y + dy), false);
        assert.equal(onDock(p.x + dx, p.y + dy), false);
      }
});

test("Le port garde une porte franchissable, des tours solides et deux escaliers accessibles", () => {
  assert.ok(canWalkExile(PORT_GATE.x, PORT_GATE.y - 10));
  for (const tower of GATE_TOWERS)
    assert.equal(canWalkExile(tower.x, tower.y - 12), false);
  for (const stairs of STAIRS)
    for (let y = stairs.y - stairs.length; y <= stairs.y; y += 5)
      assert.ok(canWalkExile(stairs.x, y));
});
test("Les quartiers et les ateliers suivent la référence marchands à l’ouest, artisans à l’est", () => {
  assert.ok(
    BUILDINGS.filter((p) => p.district === "merchants").every((p) => p.x < 720),
  );
  assert.ok(
    BUILDINGS.filter((p) => p.district === "artisans").every((p) => p.x > 720),
  );
  for (const id of ["forge", "handyman", "sawmill"])
    assert.ok(SERVICES[id].x > 720);
  for (const id of ["armor", "magic", "trader"])
    assert.ok(SERVICES[id].x < 720);
  assert.deepEqual(
    BUILDINGS.filter((p) => p.asset)
      .map((p) => p.asset)
      .sort(),
    ["forge", "guildhall", "warehouse"],
  );
});
test("Les sols et l’eau du port restent périodiques aux raccords", () => {
  for (const material of ["harbor-stone", "harbor-water"])
    for (let y = -5; y < 70; y++)
      for (let x = -5; x < 70; x++) {
        assert.deepEqual(
          texturePixel(material, x, y),
          texturePixel(material, x + 64, y),
        );
        assert.deepEqual(
          texturePixel(material, x, y),
          texturePixel(material, x, y + 64),
        );
      }
});

test("La troupe franchit la porte depuis le port sans traverser les tours", () => {
  const s = town();
  movePartyToZone(s, "exile", EXILE_RETURN);
  for (let i = 0; i < 80; i++) stepSandbox(s, { x: 0, y: -1 }, 0.05);
  assert.ok(s.player.y < PORT_GATE.y - 70);
  for (const m of s.team) assert.ok(canWalkExile(m.x, m.y));
});

test("Les cadres des bâtiments et de la tour restent dans les atlas", () => {
  const all = atlasFrames.flatMap((bank) => Object.entries(bank.frames));
  assert.equal(all.length, 38);
  for (const bank of atlasFrames) {
    const bytes = readFileSync(
      new URL(`../src/assets/exile/${bank.file}`, import.meta.url),
    );
    const width = bytes.readUInt32BE(16),
      height = bytes.readUInt32BE(20);
    for (const [key, rect] of Object.entries(bank.frames)) {
      assert.ok(rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0, key);
      assert.ok(rect.x + rect.w <= width && rect.y + rect.h <= height, key);
    }
  }
});

test("Les remparts ferment le périmètre tout en gardant les portes et pontons ouverts", () => {
  assert.ok(RAMPARTS.length >= 6);
  for (const wall of RAMPARTS)
    for (let i = 1; i < wall.length; i++) {
      const a = wall[i - 1],
        b = wall[i],
        x = (a[0] + b[0]) / 2,
        y = (a[1] + b[1]) / 2;
      assert.ok(rampartDistance(x, y) < 0.01);
      assert.equal(canWalkExile(x, y), false);
    }
  assert.ok(canWalkExile(NORTH_GATE.x, NORTH_GATE.y));
  assert.ok(canWalkExile(PORT_GATE.x, PORT_GATE.y - 10));
  assert.ok(canWalkExile(EXILE_RETURN.x, EXILE_RETURN.y));
});
test("Le relief possède trois niveaux et bloque les faces hors des escaliers", () => {
  assert.equal(elevationAt(720, 950), 0);
  assert.equal(elevationAt(720, 710), 18);
  assert.equal(elevationAt(720, 160), 38);
  for (const terrace of TERRACES) {
    for (const x of [250, 500, 950, 1200])
      assert.equal(
        canWalkExile(x, terraceBoundaryY(terrace, x) - terrace.height / 2),
        false,
      );
    for (const stair of TERRACE_STAIRS.filter((p) => p.terrace === terrace.id))
      assert.ok(canWalkExile(stair.x, stair.y - terrace.height / 2));
  }
  const s = town(),
    t = TERRACES[0],
    edge = terraceBoundaryY(t, 250);
  movePartyToZone(s, "exile", { x: 250, y: edge - t.height - 10 });
  for (let i = 0; i < 30; i++) stepSandbox(s, { x: 0, y: 1 }, 0.05);
  assert.ok(s.player.y < edge - t.height);
});
test("La troupe emprunte un escalier pour gagner la ville haute", () => {
  const s = town(),
    t = TERRACES[0],
    edge = terraceBoundaryY(t, 720);
  movePartyToZone(s, "exile", { x: 720, y: edge + 20 });
  for (let i = 0; i < 60; i++) stepSandbox(s, { x: 0, y: -1 }, 0.05);
  for (let i = 0; i < 80; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  for (const p of s.team) {
    assert.ok(p.y < edge - t.height, p.name);
    assert.ok(canWalkExile(p.x, p.y));
  }
});
test("Les îlots gardent des murs mitoyens mais varient alignements et largeurs", () => {
  assert.ok(new Set(BUILDINGS.map((p) => p.y)).size > 12);
  assert.ok(new Set(BUILDINGS.map((p) => p.w)).size > 10);
  const shops = BUILDINGS.filter((p) => p.service);
  assert.ok(new Set(shops.map((p) => p.y)).size > 6);
});

test("Les habitants gardent une approche libre entre façades, escaliers et remparts", () => {
  for (const p of Object.values(SERVICES)) {
    assert.ok(canWalkExile(p.x, p.y), p.id);
    assert.ok(canWalkExile(p.x, p.y + 16), `${p.id} : approche`);
  }
});

test("Chaque façade possède un trottoir jusqu’aux portes et une rue raccordée aux ruelles", () => {
  for (const entrance of ENTRANCES) {
    const apron = SIDEWALKS.find(
      (s) =>
        Math.abs(s.points[0][1] - entrance.y) < s.width / 2 &&
        entrance.x >= s.points[0][0] &&
        entrance.x <= s.points[1][0],
    );
    assert.ok(apron, entrance.id);
  }
  for (const street of ROADS.filter((r) => r.id.startsWith("frontage-"))) {
    for (const endpoint of [street.points[0], street.points.at(-1)]) {
      assert.ok(
        ROADS.some(
          (r) =>
            !r.id.startsWith("frontage-") &&
            r.points.slice(1).some((b, i) => {
              const a = r.points[i],
                dx = b[0] - a[0],
                dy = b[1] - a[1];
              const t = Math.max(
                0,
                Math.min(
                  1,
                  ((endpoint[0] - a[0]) * dx + (endpoint[1] - a[1]) * dy) /
                    (dx * dx + dy * dy),
                ),
              );
              return (
                Math.hypot(
                  endpoint[0] - a[0] - t * dx,
                  endpoint[1] - a[1] - t * dy,
                ) < 0.01
              );
            }),
        ),
        street.id,
      );
    }
  }
  for (const material of ["harbor-sidewalk", "harbor-cobbles"])
    for (let i = 0; i < 64; i++) {
      assert.deepEqual(
        texturePixel(material, i, 0),
        texturePixel(material, i, 64),
      );
      assert.deepEqual(
        texturePixel(material, 0, i),
        texturePixel(material, 64, i),
      );
    }
});
