import * as world from "../world/exile-map.js";
const copy = (value) => structuredClone(value);
const originalProps = copy(world.PROPS).map((p) =>
  p.kind === "exile-house"
    ? { ...p, residenceVariant: Math.floor(p.x + p.y) % 3 }
    : p,
);
const templates = new Map(originalProps.map((p) => [p.id, p]));
const protectedKinds = new Set([
  "exile-fountain",
  "exile-gate",
  "exile-city-gate",
  "exile-rampart-tower",
  "exile-crane",
]);
export const editableProp = (p) => !protectedKinds.has(p.kind);
export const palette = originalProps.filter(
  (p, i, a) =>
    editableProp(p) &&
    a.findIndex(
      (q) =>
        q.kind === p.kind &&
        q.asset === p.asset &&
        q.district === p.district &&
        q.variant === p.variant &&
        q.residenceVariant === p.residenceVariant,
    ) === i,
);
export let mapRevision = 0;
export function captureMap() {
  return {
    schema: 1,
    zone: "exile",
    objects: world.PROPS.map((p) => ({
      id: p.id,
      template: p.editorTemplate || p.id,
      x: p.x,
      y: p.y,
    })),
    roads: copy(world.ROADS),
    sidewalks: copy(world.SIDEWALKS),
  };
}
export const defaultMap = captureMap();
// A first click is a provisional anchor, not a usable road. Never persist it.
export function finishMapTraces(doc) {
  const completed = copy(doc);
  for (const type of ["roads", "sidewalks"])
    completed[type] = completed[type].filter(
      (r) => !Array.isArray(r.points) || r.points.length >= 2,
    );
  return completed;
}
export function validateDocument(doc) {
  if (
    doc?.schema !== 1 ||
    doc.zone !== "exile" ||
    !Array.isArray(doc.objects) ||
    doc.objects.length > 600 ||
    !Array.isArray(doc.roads) ||
    !doc.roads.length ||
    doc.roads.length > 200 ||
    !Array.isArray(doc.sidewalks) ||
    doc.sidewalks.length > 200
  )
    throw Error("Format de carte invalide.");
  const ids = new Set();
  const point = (x, y) =>
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    y >= 0 &&
    x <= world.MAP_SIZE.width &&
    y <= world.MAP_SIZE.height;
  for (const p of doc.objects) {
    if (
      typeof p.id !== "string" ||
      p.id.length > 100 ||
      ids.has(p.id) ||
      !templates.has(p.template) ||
      !point(p.x, p.y)
    )
      throw Error("Objet ou position invalide.");
    ids.add(p.id);
    const base = templates.get(p.id);
    if (
      base &&
      (p.template !== p.id ||
        (!editableProp(base) && (p.x !== base.x || p.y !== base.y)))
    )
      throw Error("Les portes, tours et la fontaine sont verrouillées.");
    if (!base && !editableProp(templates.get(p.template)))
      throw Error("Cet élément ne peut pas être dupliqué.");
  }
  for (const p of originalProps)
    if ((p.service || !editableProp(p)) && !ids.has(p.id))
      throw Error("Un commerce ou un monument ne peut pas être supprimé.");
  for (const lines of [doc.roads, doc.sidewalks]) {
    const lineIds = new Set();
    for (const r of lines) {
      if (
        typeof r.id !== "string" ||
        lineIds.has(r.id) ||
        !Number.isFinite(r.width) ||
        r.width < 4 ||
        r.width > 80 ||
        !Array.isArray(r.points) ||
        r.points.length < 2 ||
        r.points.length > 128 ||
        r.points.some(
          (p) => !Array.isArray(p) || p.length !== 2 || !point(...p),
        )
      )
        throw Error(
          "Route invalide : 2 points minimum, largeur entre 4 et 80.",
        );
      lineIds.add(r.id);
    }
  }
  return doc;
}
export function previewMap(doc) {
  validateDocument(doc);
  const props = doc.objects.map((item) => {
    const p = {
      ...copy(templates.get(item.template)),
      id: item.id,
      x: item.x,
      y: item.y,
      editorTemplate: item.template,
    };
    if (item.id !== item.template) {
      delete p.service;
      delete p.attachedTo;
      p.name = "Décor · " + (p.name || p.kind);
    }
    return p;
  });
  return {
    ...world,
    PROPS: props,
    BUILDINGS: props.filter((p) => p.kind === "exile-house"),
    ROADS: doc.roads,
    SIDEWALKS: doc.sidewalks,
    validateExileMap: () => [],
  };
}
function install(doc) {
  const map = previewMap(doc);
  world.PROPS.splice(0, world.PROPS.length, ...map.PROPS);
  world.BUILDINGS.splice(0, world.BUILDINGS.length, ...map.BUILDINGS);
  world.ROADS.splice(0, world.ROADS.length, ...copy(doc.roads));
  world.SIDEWALKS.splice(0, world.SIDEWALKS.length, ...copy(doc.sidewalks));
  world.SOLIDS.splice(
    0,
    world.SOLIDS.length,
    ...world.PROPS.filter((p) => p.footprint),
    ...world.GATE_TOWERS,
    ...world.NORTH_GATE_SOLIDS,
  );
  world.ENTRANCES.splice(
    0,
    world.ENTRANCES.length,
    ...world.BUILDINGS.map((p) => ({ id: p.id, x: p.x, y: p.y + 10 })),
  );
  for (const [service, npc] of Object.entries(world.SERVICES)) {
    const p = world.BUILDINGS.find((p) => p.service === service);
    if (p) {
      npc.x = p.x + 16;
      npc.y = p.y + 18;
    }
  }
}
export function applyMap(doc) {
  validateDocument(doc);
  const previous = captureMap();
  try {
    install(doc);
    const errors = world.validateExileMap();
    for (const p of world.ENTRANCES)
      if (!world.canWalkExile(p.x, p.y))
        errors.push(`${p.id}: porte inaccessible`);
    for (const p of Object.values(world.SERVICES))
      if (!world.canWalkExile(p.x, p.y + 16))
        errors.push(`${p.id}: accès PNJ bloqué`);
    if (errors.length)
      throw Error("Placement impossible : " + errors.slice(0, 4).join(" ; "));
  } catch (error) {
    install(previous);
    throw error;
  }
  mapRevision++;
}
export const MAP_STORAGE_KEY = "auroria-map-exile-v1";
export function restoreEditedMap(storage = localStorage) {
  try {
    const raw = storage.getItem(MAP_STORAGE_KEY);
    if (raw) applyMap(JSON.parse(raw));
    return null;
  } catch (e) {
    return e.message;
  }
}
