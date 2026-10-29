import { ARTISAN_BUILDINGS } from "../src/data/artisan-buildings.js";
import artisanFrames from "../src/assets/exile/atlas-frames.json" with { type: "json" };
import test from "node:test";
import assert from "node:assert/strict";
import {
  captureMap,
  finishMapTraces,
  palette,
  defaultMap,
  previewMap,
  applyMap,
  validateDocument,
  restoreEditedMap,
  MAP_STORAGE_KEY,
} from "../src/dev/map-editor-model.js";
import * as map from "../src/world/exile-map.js";
const copy = (v) => structuredClone(v);
test("Le brouillon ne modifie ni la carte jouée ni ses collisions", () => {
  const doc = captureMap(),
    p = doc.objects.find((p) => p.id === "armurier"),
    old = map.BUILDINGS.find((q) => q.id === p.id).x;
  p.x += 24;
  const preview = previewMap(doc);
  assert.equal(preview.BUILDINGS.find((q) => q.id === p.id).x, old + 24);
  assert.equal(map.BUILDINGS.find((q) => q.id === p.id).x, old);
});
test("Une application invalide restaure aussi les services et les collisions", () => {
  const before = captureMap(),
    doc = copy(before);
  doc.objects.find((p) => p.id === "armurier").x = 1;
  assert.throws(() => applyMap(doc), /Placement impossible/);
  assert.deepEqual(captureMap(), before);
  assert.deepEqual(map.validateExileMap(), []);
});
test("Les monuments et commerces sont protégés contre les suppressions et les imports malformés", () => {
  const doc = copy(defaultMap);
  doc.objects = doc.objects.filter((p) => p.id !== "armurier");
  assert.throws(() => validateDocument(doc), /commerce/);
  const invalid = copy(defaultMap);
  invalid.roads[0].points[0][0] = NaN;
  assert.throws(() => validateDocument(invalid), /Route/);
  const duplicate = copy(defaultMap);
  duplicate.objects.push(copy(duplicate.objects[0]));
  assert.throws(() => validateDocument(duplicate), /Objet/);
});
test("Routes et trottoirs se sauvegardent et se restaurent sans modifier la progression", () => {
  const doc = copy(defaultMap);
  doc.roads[0].width = 40;
  doc.sidewalks[0].width = 26;
  applyMap(doc);
  assert.equal(map.ROADS[0].width, 40);
  assert.equal(map.SIDEWALKS[0].width, 26);
  const stored = JSON.stringify(doc);
  applyMap(defaultMap);
  assert.equal(
    restoreEditedMap({
      getItem: (key) => (key === MAP_STORAGE_KEY ? stored : null),
    }),
    null,
  );
  assert.equal(map.ROADS[0].width, 40);
  applyMap(defaultMap);
  assert.match(restoreEditedMap({ getItem: () => "{bad" }), /.+/);
  assert.deepEqual(map.validateExileMap(), []);
});
test("Dupliquer un bâtiment crée un décor sans dupliquer son service", () => {
  const doc = copy(defaultMap),
    template = doc.objects.find((p) => p.id === "armurier");
  doc.objects.push({ ...template, id: "copie-armurier" });
  const p = previewMap(doc).PROPS.find((p) => p.id === "copie-armurier");
  assert.equal(p.service, undefined);
  assert.equal(p.attachedTo, undefined);
});
test("Déplacer un commerce déplace son entrée, son PNJ et sa collision", () => {
  const doc = copy(defaultMap),
    p = doc.objects.find((p) => p.id === "armurier"),
    oldY = p.y;
  p.y -= 8;
  applyMap(doc);
  assert.equal(map.SERVICES.armor.y, oldY - 8 + 18);
  assert.equal(map.ENTRANCES.find((q) => q.id === p.id).y, p.y + 10);
  assert.equal(map.SOLIDS.find((q) => q.id === p.id).y, p.y);
  applyMap(defaultMap);
});

test("Les tracés provisoires ne bloquent pas la sauvegarde et les tracés terminés sont conservés", () => {
  const doc = copy(defaultMap);
  doc.roads.push({ id: "unfinished-road", width: 22, points: [[720, 200]] });
  doc.sidewalks.push({ id: "unfinished-sidewalk", width: 12, points: [] });
  doc.roads.push({
    id: "finished-road",
    width: 22,
    points: [
      [720, 200],
      [720, 240],
    ],
  });
  const ready = finishMapTraces(doc);
  assert.equal(ready.roads.length, defaultMap.roads.length + 1);
  assert.equal(ready.sidewalks.length, defaultMap.sidewalks.length);
  assert.equal(doc.roads.length, defaultMap.roads.length + 2);
  assert.doesNotThrow(() => validateDocument(ready));
  applyMap(ready);
  assert.ok(map.ROADS.some((r) => r.id === "finished-road"));
  applyMap(defaultMap);
  ready.roads[0].width = 90;
  assert.throws(() => validateDocument(finishMapTraces(ready)), /Route/);
});

test("La palette couvre les variantes de maisons et leur apparence reste stable au déplacement", () => {
  const houses = palette.filter((p) => p.kind === "exile-house" && !p.asset);
  for (const district of ["merchants", "artisans"])
    assert.equal(
      new Set(
        houses
          .filter((p) => p.district === district)
          .map((p) => p.residenceVariant),
      ).size,
      3,
    );
  const template = houses[0],
    doc = copy(defaultMap);
  doc.objects.push({
    id: "preview-house",
    template: template.id,
    x: 720,
    y: 200,
  });
  const first = previewMap(doc).PROPS.find((p) => p.id === "preview-house");
  doc.objects.at(-1).x += 1;
  const moved = previewMap(doc).PROPS.find((p) => p.id === "preview-house");
  assert.equal(first.residenceVariant, moved.residenceVariant);
});

test("Les quinze bâtiments d’artisans sont séparés, disponibles en palette et absents de la ville par défaut", () => {
  assert.equal(ARTISAN_BUILDINGS.length, 15);
  for (const template of ARTISAN_BUILDINGS) {
    assert.ok(palette.some((p) => p.id === template.id));
    assert.ok(artisanFrames[2].frames[template.asset]);
    assert.ok(!defaultMap.objects.some((p) => p.id === template.id));
  }
  const frames = Object.values(artisanFrames[2].frames);
  for (let i = 0; i < frames.length; i++)
    for (let j = i + 1; j < frames.length; j++) {
      const a = frames[i],
        b = frames[j];
      assert.ok(
        a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y,
      );
    }
  const doc = copy(defaultMap);
  doc.objects.push({
    id: "atelier-test",
    template: "artisans-small-forge",
    x: 720,
    y: 320,
  });
  applyMap(doc);
  assert.equal(
    map.PROPS.find((p) => p.id === "atelier-test").asset,
    "artisans-small-forge",
  );
  const saved = captureMap();
  applyMap(defaultMap);
  applyMap(saved);
  assert.ok(map.SOLIDS.some((p) => p.id === "atelier-test"));
  applyMap(defaultMap);
});
