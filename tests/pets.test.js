import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  teleport,
  grantCore,
  openCore,
  equip,
  unequip,
  grantLoot,
} from "../src/dev/sandbox.js";
import {
  acceptAdoption,
  claimPet,
  recordSetLoot,
  feedPet,
} from "../src/game/pet-quests.js";
import { STARTER_SETS } from "../src/data/equipment.js";
import { createPet, PET_MAX_LEVEL } from "../src/data/pets.js";
const complete = (s, element) =>
  STARTER_SETS.find((set) => set.id === element).pieces.forEach((piece) =>
    recordSetLoot(s, piece),
  );

test("adoption uniquement près du PNJ, un certificat par quête", () => {
  const s = createSandbox();
  assert.equal(acceptAdoption(s, "earth"), false);
  teleport(s, "animalerie");
  assert.equal(acceptAdoption(s, "earth"), true);
  assert.equal(acceptAdoption(s, "earth"), false);
  assert.equal(s.bag.filter((i) => i.kind === "certificate").length, 1);
  assert.equal(s.bag[0].questId, "earth");
});
test("neuf pièces distinctes : doublons exclus, acquisitions avant acceptation prises en compte", () => {
  const s = createSandbox();
  teleport(s, "animalerie");
  grantCore(s, "earth");
  grantCore(s, "earth");
  openCore(s, s.bag[0].id, () => 0);
  openCore(s, s.bag[0].id, () => 0);
  assert.deepEqual(s.collections.earth, ["Coiffe"]);
  complete(s, "earth");
  assert.equal(s.collections.earth.length, 9);
  acceptAdoption(s, "earth");
  assert.ok(claimPet(s, "earth"));
});
test("échange nécessite panoplie et certificat ; seul le certificat est consommé, récompense unique", () => {
  const s = createSandbox();
  teleport(s, "animalerie");
  acceptAdoption(s, "water");
  assert.equal(claimPet(s, "water"), null);
  complete(s, "water");
  const certificate = s.bag.pop();
  assert.equal(claimPet(s, "water"), null);
  s.bag.push(certificate);
  const gear = { ...STARTER_SETS[3].pieces[0], id: s.nextItem++, quantity: 1 };
  s.bag.push(gear);
  equip(s, gear.id);
  const pet = claimPet(s, "water");
  assert.equal(pet.name, "Gélutin");
  assert.ok(s.team[0].equipment.Coiffe);
  assert.equal(
    s.bag.some((i) => i.kind === "certificate"),
    false,
  );
  assert.equal(claimPet(s, "water"), null);
  assert.equal(acceptAdoption(s, "water"), false);
});
test("le rare chromatique exact nourrit le familier ; les autres ressources restent intactes", () => {
  const s = createSandbox(),
    pet = { ...createPet("earth"), id: s.nextItem++ };
  s.bag.push(pet);
  grantLoot(s, "normal", true, "boar");
  grantLoot(s, "rare", false, "boar");
  grantLoot(s, "rare", true, "slime");
  const before = s.bag.length;
  assert.equal(feedPet(s, pet.id), false);
  assert.equal(s.bag.length, before);
  grantLoot(s, "rare", true, "boar");
  assert.equal(feedPet(s, pet.id), true);
  assert.equal(pet.level, 2);
  assert.equal(pet.stats.Force, 3);
  assert.ok(s.bag.some((i) => i.name === "Soie de sanglier" && i.chromatic));
  assert.equal(
    s.bag.some((i) => i.name === "Défense ancienne" && i.chromatic),
    false,
  );
});
test("niveau et XP conservés équipé/dans le sac ; cap sans consommation", () => {
  const s = createSandbox(),
    pet = { ...createPet("fire"), id: s.nextItem++ };
  s.bag.push(pet);
  equip(s, pet.id);
  grantLoot(s, "rare", true, "firefly");
  feedPet(s, pet.id);
  unequip(s, "Familier");
  assert.equal(s.bag.find((i) => i.id === pet.id).level, 2);
  equip(s, pet.id);
  assert.equal(s.team[0].equipment.Familier.level, 2);
  pet.level = PET_MAX_LEVEL;
  grantLoot(s, "rare", true, "firefly");
  const before = s.bag.find((i) => i.name === "Étincelle vive").quantity;
  assert.equal(feedPet(s, pet.id), false);
  assert.equal(s.bag.find((i) => i.name === "Étincelle vive").quantity, before);
});
test("quitter l’animalerie interdit la remise même si la quête est prête", () => {
  const s = createSandbox();
  teleport(s, "animalerie");
  acceptAdoption(s, "air");
  complete(s, "air");
  teleport(s, "combat");
  assert.equal(claimPet(s, "air"), null);
  assert.ok(s.bag.some((i) => i.kind === "certificate"));
});
