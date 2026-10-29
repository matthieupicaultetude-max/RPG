import {
  ALL_SETS,
  ELEMENTS,
  SET_SLOTS,
  createCore,
  createHybridCore,
} from "./equipment.js";
import { HYBRID_SLIMES, hybridResource, royalPart } from "./hybrid-slimes.js";
import { MONSTERS, monsterLoot } from "./monsters.js";
import { chromaticVersion } from "./chromatic.js";
import { ALL_PETS, PETS, createPet } from "./pets.js";
import { WOODS, woodItem } from "./woodcutting.js";
import { KEY_RECIPES, createDungeonKey } from "./handyman.js";
import { fragmentForEquipment } from "./core-fragments.js";
import { stackKey } from "../game/item-stacks.js";
const templates = [];
for (const set of ALL_SETS) {
  templates.push(
    ...set.pieces.map((p) => ({ ...p, chromatic: false, quantity: 1 })),
    ...set.pieces.map(chromaticVersion),
  );
  templates.push(fragmentForEquipment(set.pieces[0]));
}
for (const element of Object.keys(ELEMENTS))
  templates.push(createCore(element));
for (const h of Object.values(HYBRID_SLIMES)) {
  templates.push(createHybridCore(h.id), royalPart(h.id));
  for (const type of ["normal", "rare"])
    for (const chromatic of [false, true])
      templates.push(hybridResource(h.id, type, chromatic));
}
for (const m of MONSTERS.filter((m) => !m.boss))
  for (const drop of monsterLoot(m.id)) {
    const { chance, ...item } = drop;
    templates.push({ ...item, quantity: 1 });
  }
for (const wood of WOODS)
  for (const kind of ["wood", "plank"]) templates.push(woodItem(wood.id, kind));
for (const p of ALL_PETS) templates.push(createPet(p.id));
for (const p of PETS)
  templates.push({
    kind: "certificate",
    questId: p.element,
    name: `Certificat d’adoption — ${ELEMENTS[p.element].set}`,
    element: p.element,
    quantity: 1,
    chromatic: false,
  });
for (const id of Object.keys(KEY_RECIPES)) templates.push(createDungeonKey(id));
for (const slot of [
  ...SET_SLOTS,
  "Familier",
  ...Array.from({ length: 6 }, (_, i) => `Trophée ${i + 1}`),
])
  templates.push({ name: `${slot} d’essai`, slot, quantity: 1 });
const unique = new Map();
for (const item of templates) if (item) unique.set(stackKey(item), item);
const keyFor = (i) =>
  JSON.stringify([
    i.kind || "equipment",
    i.name,
    i.slot || "",
    i.chromatic || false,
    i.band?.min || "",
    i.setId || "",
    i.petId || "",
    i.element || "",
  ]);
export const DEV_ITEMS = Object.freeze(
  [...unique.values()].map((item) =>
    Object.freeze({ key: keyFor(item), item: Object.freeze(item) }),
  ),
);
if (new Set(DEV_ITEMS.map((e) => e.key)).size !== DEV_ITEMS.length)
  throw Error("Catalogue du coffre : doublon de clé");
export function devItemCategory(item) {
  return item.kind === "pet"
    ? "pets"
    : item.slot
      ? "equipment"
      : ["core", "core-fragment"].includes(item.kind)
        ? "cores"
        : ["dungeon-key", "royal-key-part", "certificate"].includes(item.kind)
          ? "keys"
          : "resources";
}
