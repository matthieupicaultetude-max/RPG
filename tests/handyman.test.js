import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  teleport,
  grantLoot,
  stepSandbox,
  spellContext,
} from "../src/dev/sandbox.js";
import { addWoodItem } from "../src/game/woodcutting.js";
import {
  craftDungeonKeys,
  nearHandyman,
  keyRecipeStatus,
} from "../src/game/handyman.js";
import {
  KEY_RECIPE,
  createDungeonKey,
  dungeonKeyCount,
} from "../src/data/handyman.js";
import { WOODS } from "../src/data/woodcutting.js";
import {
  travelToZone,
  useZoneGate,
  stepZoneDive,
} from "../src/game/zone-travel.js";
import { movePartyToZone } from "../src/world/zones.js";
import { MARSH_DEPTHS_GATE } from "../src/world/slime-marsh-map.js";
import { DEPTHS_ENTRY, DEPTHS_SPAWN } from "../src/world/slime-depths-map.js";
import {
  HANDYMAN_WORKSHOP,
  canWalkMap,
  validateMap,
} from "../src/world/map.js";
import { awakenDepthsBoss } from "../src/game/depths-boss.js";
import { renderProfessions } from "../src/ui/professions.js";
import { renderInventory } from "../src/ui/inventory.js";
import { renderItemIcon } from "../src/ui/item-art.js";
const setup = () => {
  const s = createSandbox();
  teleport(s, "bricoleur");
  return s;
};
function supplies(s, n = 1) {
  addWoodItem(s, "chestnut", "plank", 5 * n);
  for (let i = 0; i < n; i++) {
    grantLoot(s, "rare", false, "slime");
    grantLoot(s, "rare", false, "mountain-slime");
  }
}
function gate(s) {
  if (s.zone !== "slime-marsh") travelToZone(s, "slime-marsh");
  movePartyToZone(s, "slime-marsh", MARSH_DEPTHS_GATE);
}
function enter(s) {
  gate(s);
  assert.ok(useZoneGate(s));
  stepZoneDive(s, 1.2);
  assert.equal(s.zone, "slime-depths");
}

test("recette : 5 planches du bois niveau 5, un rare Eau de surface et un rare de montagne", () => {
  const [wood, water, earth] = KEY_RECIPE.ingredients;
  assert.equal(wood.wood, WOODS.find((w) => w.level === 5).id);
  assert.equal(wood.kind, "plank");
  assert.equal(wood.quantity, 5);
  assert.equal(water.name, "Cœur de gelée");
  assert.equal(earth.name, "Cœur d’ambre");
  assert.equal(water.quantity, 1);
  assert.equal(earth.quantity, 1);
  assert.ok(KEY_RECIPE.ingredients.every((i) => i.chromatic === false));
});
test("atelier : bâtiment valide, Tessa présente, proximité et zone du village obligatoires", () => {
  const s = setup();
  assert.deepEqual(validateMap(), []);
  assert.ok(nearHandyman(s));
  assert.ok(s.npcs.some((n) => n.id === "tessa"));
  assert.ok(canWalkMap(s.player.x, s.player.y));
  assert.equal(
    canWalkMap(HANDYMAN_WORKSHOP.x, HANDYMAN_WORKSHOP.y - 10),
    false,
  );
  supplies(s);
  const before = structuredClone(s.bag);
  for (const zone of [
    "tutorial",
    "slime-marsh",
    "slime-depths",
    "slime-mountains",
  ]) {
    s.zone = zone;
    assert.equal(nearHandyman(s), false);
    assert.equal(craftDungeonKeys(s), false);
    assert.deepEqual(s.bag, before);
  }
});
test("fabrication : lots, empilement, coûts exacts et XP séparée des autres progressions", () => {
  const s = setup();
  supplies(s, 3);
  const woodXp = s.woodcutting.xp,
    teamXp = s.team.map((m) => m.xp),
    gold = s.gold;
  assert.ok(craftDungeonKeys(s, 2));
  assert.equal(dungeonKeyCount(s), 2);
  assert.equal(s.handyman.level, 2);
  assert.equal(s.handyman.xp, 20);
  assert.equal(s.woodcutting.level, 1);
  assert.equal(s.woodcutting.xp, woodXp);
  assert.deepEqual(
    s.team.map((m) => m.xp),
    teamXp,
  );
  assert.equal(s.gold, gold);
  assert.ok(keyRecipeStatus(s).every((c) => c.available === c.quantity));
  const id = s.bag.find((i) => i.kind === "dungeon-key").id;
  assert.ok(craftDungeonKeys(s));
  assert.equal(dungeonKeyCount(s), 3);
  assert.equal(s.bag.filter((i) => i.kind === "dungeon-key").length, 1);
  assert.equal(s.bag.find((i) => i.kind === "dungeon-key").id, id);
  assert.equal(s.handyman.xp, 45);
});
test("ingrédients : pas de frêne, bois brut, rare chromatique ou rare de l’intérieur du donjon en remplacement", () => {
  for (const wrong of ["ash", "logs", "chromatic", "abyss"]) {
    const s = setup();
    supplies(s);
    if (wrong === "ash") {
      s.bag = s.bag.filter((i) => i.kind !== "plank");
      addWoodItem(s, "ash", "plank", 5);
    }
    if (wrong === "logs") {
      s.bag = s.bag.filter((i) => i.kind !== "plank");
      addWoodItem(s, "chestnut", "wood", 10);
    }
    if (wrong === "chromatic")
      s.bag.find((i) => i.name === "Cœur de gelée").chromatic = true;
    if (wrong === "abyss") {
      s.bag = s.bag.filter((i) => i.name !== "Cœur de gelée");
      grantLoot(s, "rare", false, "depths-water-slime");
    }
    const before = structuredClone(s.bag),
      job = { ...s.handyman };
    assert.equal(craftDungeonKeys(s), false);
    assert.deepEqual(s.bag, before);
    assert.deepEqual(s.handyman, job);
  }
});
test("craft atomique : quantité invalide, matériaux insuffisants, personnage mort et piles multiples", () => {
  const s = setup();
  supplies(s);
  const before = structuredClone(s.bag);
  for (const n of [0, -1, 0.5, NaN, Infinity, 10000, 2]) {
    assert.equal(craftDungeonKeys(s, n), false);
    assert.deepEqual(s.bag, before);
  }
  s.team[s.main].hp = 0;
  assert.equal(craftDungeonKeys(s), false);
  assert.deepEqual(s.bag, before);
  s.team[s.main].hp = 100;
  const plank = s.bag.find((i) => i.kind === "plank");
  plank.quantity = 2;
  s.bag.push({ ...plank, id: s.nextItem++, quantity: 3 });
  assert.ok(craftDungeonKeys(s));
  assert.equal(dungeonKeyCount(s), 1);
  assert.equal(
    s.bag.some((i) => i.kind === "plank"),
    false,
  );
});
test("cascade sans clé : entrée refusée sans mouvement, animation ou consommation d’un autre objet", () => {
  const s = createSandbox();
  gate(s);
  const position = { ...s.player },
    monsters = s.monsters;
  s.bag.push(
    { ...createDungeonKey(), dungeonId: "other", id: s.nextItem++ },
    { ...createDungeonKey(), chromatic: true, id: s.nextItem++ },
  );
  const before = structuredClone(s.bag);
  assert.equal(useZoneGate(s), false);
  assert.equal(s.zoneDive, undefined);
  assert.equal(s.zone, "slime-marsh");
  assert.deepEqual(s.player, position);
  assert.equal(s.monsters, monsters);
  assert.deepEqual(s.bag, before);
  assert.ok(s.log[0].includes("Clé de la Crevasse requise"));
});
test("donjon : une clé par troupe et par entrée, pas de double dépense, nouveau monde à chaque nouvelle clé", () => {
  const s = createSandbox();
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++, quantity: 2 });
  gate(s);
  assert.ok(useZoneGate(s));
  assert.equal(dungeonKeyCount(s), 1);
  assert.equal(useZoneGate(s), false);
  assert.equal(dungeonKeyCount(s), 1);
  stepZoneDive(s, 1.2);
  assert.ok(s.dungeonRun.active);
  assert.equal(s.dungeonRun.id, 1);
  const old = s.monsters;
  old[0].hp = 10;
  old[0].shellBroken = true;
  movePartyToZone(s, "slime-depths", DEPTHS_ENTRY);
  assert.ok(useZoneGate(s));
  assert.equal(s.dungeonRun.active, false);
  assert.equal(dungeonKeyCount(s), 1);
  assert.ok(useZoneGate(s));
  assert.equal(dungeonKeyCount(s), 0);
  stepZoneDive(s, 1.2);
  assert.notEqual(s.monsters, old);
  assert.ok(s.monsters.every((m) => m.hp === m.maxHp));
  assert.equal(s.monsters.find((m) => m.boss).bossPhase, "dormant");
  assert.equal(s.dungeonRun.id, 2);
  assert.ok(s.dungeonRun.active);
});
test("réanimation dans le donjon : même expédition, aucune seconde clé demandée", () => {
  const s = createSandbox();
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++ });
  enter(s);
  const id = s.dungeonRun.id,
    m = s.monsters[0];
  s.monsters = [m];
  s.deployed = false;
  s.team.forEach((p) => (p.hp = 0));
  Object.assign(s.player, { x: m.x + 30, y: m.y });
  Object.assign(s.team[0], s.player, { hp: 1 });
  m.damage = 10000;
  for (let i = 0; i < 100 && s.team[0].hp === 1; i++)
    stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.player.x, DEPTHS_SPAWN.x);
  assert.equal(s.player.y, DEPTHS_SPAWN.y);
  assert.ok(s.team.every((m) => m.hp === m.maxHp));
  assert.equal(dungeonKeyCount(s), 0);
  assert.equal(s.dungeonRun.id, id);
  assert.ok(s.dungeonRun.active);
});
test("victoire de donjon : Gorgelimon marque l’expédition terminée sans rendre de clé", () => {
  const s = createSandbox();
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++ });
  enter(s);
  const b = s.monsters.find((m) => m.boss);
  movePartyToZone(s, "slime-depths", { x: b.x - 40, y: b.y });
  assert.ok(awakenDepthsBoss(s));
  spellContext.hitMonster(s, b, b.hp + 1, s.team[s.main]);
  assert.ok(s.dungeonRun.completed);
  assert.equal(dungeonKeyCount(s), 0);
});
test("accès dev explicite : la visite directe reste disponible pour les essais sans dépenser une clé", () => {
  const s = createSandbox();
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++ });
  assert.ok(travelToZone(s, "slime-depths"));
  assert.equal(dungeonKeyCount(s), 1);
  assert.equal(s.dungeonRun, undefined);
});
test("interface : deux métiers, recette et icône de clé, filtre de sac et description de consommation", () => {
  const s = setup();
  supplies(s);
  assert.ok(craftDungeonKeys(s));
  const key = s.bag.find((i) => i.kind === "dungeon-key"),
    jobs = renderProfessions(s, 1, "handyman", 1),
    bag = renderInventory(s, { source: "bag", id: key.id }, "keys");
  assert.ok(jobs.includes("Bricoleur"));
  assert.ok(jobs.includes("Bûcheron"));
  assert.ok(jobs.includes("Planche de châtaignier"));
  assert.ok(bag.includes("Une clé est consommée"));
  assert.equal(/undefined|NaN/.test(jobs + bag), false);
  assert.notEqual(
    renderItemIcon(key),
    renderItemIcon({ kind: "core", element: "water" }),
  );
});
