import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  stepSandbox,
  spellContext,
  teleport,
  grantLoot,
  rewardMonster,
} from "../src/dev/sandbox.js";
import {
  createMonster,
  monsterStats,
  monsterLoot,
} from "../src/data/monsters.js";
import { monsterAttack } from "../src/data/monster-attacks.js";
import {
  travelToZone,
  useZoneGate,
  nearZoneGate,
} from "../src/game/zone-travel.js";
import { movePartyToZone, canWalkZone } from "../src/world/zones.js";
import { findPath } from "../src/ai/companions.js";
import * as map from "../src/world/volcano-map.js";
import { LAVA_POOLS, canWalkFire } from "../src/world/slime-fire-map.js";
import { polygonDistance } from "../src/world/map.js";
import {
  addMagmaPatch,
  recordMagmaDamage,
  magmaDamage,
  stepMagmaHazards,
  volcanoBoss,
  awakenVolcanoBoss,
  stepVolcanoBoss,
  resetVolcanoBoss,
  MAGMA_RULES,
} from "../src/game/volcano.js";
import { stepFireEmergence } from "../src/game/fire-slimes.js";
import {
  createDungeonKey,
  dungeonKeyCount,
  KEY_RECIPES,
} from "../src/data/handyman.js";
import { craftDungeonKeys, keyRecipeStatus } from "../src/game/handyman.js";
import { addWoodItem } from "../src/game/woodcutting.js";
import { renderHandyman } from "../src/ui/handyman.js";
import { renderBestiary, bestiaryValues } from "../src/ui/bestiary.js";
import { renderItemIcon } from "../src/ui/item-art.js";
function setup() {
  const s = createSandbox();
  travelToZone(s, "slime-volcano");
  s.volcanoGuideOpen = false;
  return s;
}
function fixture() {
  const s = setup(),
    m = s.monsters[0];
  s.monsters = [m];
  s.deployed = false;
  Object.assign(s.player, { x: 200, y: 275 });
  Object.assign(s.team[0], s.player);
  const hits = [],
    ctx = {
      canStand: map.canWalkVolcano,
      damage: (p, n, source, element, kind) =>
        hits.push({ id: p.id, n, element, kind }),
    };
  const tick = (n) => {
    for (let t = 0; t < n - 1e-8; t += 0.05) {
      s.time += 0.05;
      stepMagmaHazards(s, 0.05, ctx);
    }
  };
  return { s, m, hits, ctx, tick };
}
function giveSupplies(s, n = 1) {
  addWoodItem(s, "chestnut", "plank", 5 * n);
  for (let i = 0; i < n; i++) {
    grantLoot(s, "rare", false, "fire-slime");
    grantLoot(s, "rare", false, "mountain-slime");
  }
}
function entrance(s) {
  if (s.zone !== "slime-fire") travelToZone(s, "slime-fire");
  movePartyToZone(s, "slime-fire", map.FIRE_VOLCANO_GATE);
}

test("surgissement des slimes Feu depuis les trois bassins, à la création et à la repousse", () => {
  const s = createSandbox();
  travelToZone(s, "slime-fire");
  const pools = new Set();
  for (const m of s.monsters) {
    assert.ok(m.emergence);
    const birth = m.emergence;
    const index = LAVA_POOLS.findIndex(
      (p) => polygonDistance(birth.from.x, birth.from.y, p) > 0,
    );
    assert.ok(index >= 0);
    pools.add(index);
    assert.ok(canWalkFire(birth.to.x, birth.to.y));
    const hp = m.hp;
    spellContext.hitMonster(s, m, 9999, s.team[0]);
    assert.equal(m.hp, hp);
    assert.equal(m.intent, undefined);
    stepFireEmergence(m, 0.6);
    assert.ok(m.emergence);
    stepFireEmergence(m, 0.7);
    assert.equal(m.emergence, undefined);
    assert.ok(canWalkFire(m.x, m.y));
  }
  assert.equal(pools.size, 3);
  const m = s.monsters[0];
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  s.monsters = [m];
  m.respawn = 0.01;
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.ok(m.emergence);
  assert.equal(m.hp, m.maxHp);
});
test("volcan : lave solide, routes et navigation accessibles vers chaque monstre et le boss", () => {
  assert.deepEqual(map.validateMap(), []);
  for (const p of [
    map.VOLCANO_ENTRY,
    map.VOLCANO_BOSS_HOME,
    ...map.MAGMA_SLIMES,
  ]) {
    assert.ok(canWalkZone(p.x, p.y, "slime-volcano"));
    assert.ok(
      findPath(map.VOLCANO_SPAWN, p, map.canWalkVolcano).length,
      JSON.stringify(p),
    );
  }
  assert.ok(canWalkFire(map.FIRE_VOLCANO_GATE.x, map.FIRE_VOLCANO_GATE.y));
  for (const pool of map.LAVA_POOLS) {
    const x = pool.reduce((n, p) => n + p[0], 0) / pool.length,
      y = pool.reduce((n, p) => n + p[1], 0) / pool.length;
    assert.equal(map.canWalkVolcano(x, y), false);
  }
  for (const [x, y] of [
    [-9, -1],
    [0, 0],
    [63, 63],
  ])
    assert.deepEqual(
      map.texturePixel("basalt", x, y),
      map.texturePixel("basalt", x + 64, y + 64),
    );
});
test("clé du Volcan : recette distincte, fabrication en lot, pas de mélange avec la Crevasse", () => {
  const s = createSandbox();
  teleport(s, "bricoleur");
  assert.deepEqual(
    KEY_RECIPES["slime-volcano"].ingredients.map((i) => [i.name, i.quantity]),
    [
      ["Planche de châtaignier", 5],
      ["Cœur de feu", 1],
      ["Cœur de terre", 1],
    ],
  );
  giveSupplies(s, 2);
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++, quantity: 3 });
  assert.ok(craftDungeonKeys(s, 2, "slime-volcano"));
  assert.equal(dungeonKeyCount(s, "slime-volcano"), 2);
  assert.equal(dungeonKeyCount(s), 3);
  assert.equal(s.handyman.level, 2);
  assert.equal(s.handyman.xp, 20);
  s.handymanDungeon = "slime-volcano";
  assert.ok(renderHandyman(s).includes("Clé du Volcan"));
  assert.ok(renderHandyman(s).includes('value="slime-volcano" selected'));
  assert.ok(
    keyRecipeStatus(s, 1, "slime-volcano").every((c) => c.available === 0),
  );
});
test("clé : refus sans bonne clé, entrée unique pour la troupe, retour gratuit et nouveau donjon", () => {
  const s = createSandbox();
  s.bag.push({ ...createDungeonKey(), id: s.nextItem++ });
  entrance(s);
  assert.equal(nearZoneGate(s).destination, "slime-volcano");
  assert.equal(useZoneGate(s), false);
  assert.equal(dungeonKeyCount(s), 1);
  s.bag.push({
    ...createDungeonKey("slime-volcano"),
    id: s.nextItem++,
    quantity: 2,
  });
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-volcano");
  assert.equal(dungeonKeyCount(s, "slime-volcano"), 1);
  assert.equal(s.dungeonRun.dungeonId, "slime-volcano");
  const old = s.monsters;
  old[0].hp = 0;
  addMagmaPatch(s, { x: 200, y: 275 }, 5, { x: 200, y: 275 });
  movePartyToZone(s, "slime-volcano", map.VOLCANO_ENTRY);
  assert.ok(useZoneGate(s));
  assert.equal(s.zone, "slime-fire");
  assert.equal(s.dungeonRun.active, false);
  assert.equal(dungeonKeyCount(s, "slime-volcano"), 1);
  movePartyToZone(s, "slime-fire", map.FIRE_VOLCANO_GATE);
  assert.ok(useZoneGate(s));
  assert.notEqual(s.monsters, old);
  assert.ok(s.monsters.every((m) => m.hp === m.maxHp));
  assert.equal(dungeonKeyCount(s, "slime-volcano"), 0);
  assert.equal(s.magmaPatches.length, 0);
});
test("carapace : dégâts réellement reçus, seuil de 25 %, rupture unique, aucun roulement", () => {
  const { s, m } = fixture();
  assert.deepEqual(m.elements, ["earth", "fire"]);
  assert.equal(monsterAttack(m).kind, "leap");
  assert.equal(magmaDamage(m, 20), 12);
  const threshold = Math.ceil(m.maxHp * 0.25);
  recordMagmaDamage(s, m, threshold - 1);
  assert.equal(m.shellBroken, false);
  recordMagmaDamage(s, m, 1);
  assert.equal(m.shellBroken, true);
  assert.equal(s.magmaBlasts.length, 1);
  assert.equal(magmaDamage(m, 20), 20);
  recordMagmaDamage(s, m, 999);
  assert.equal(s.magmaBlasts.length, 1);
  const f = fixture();
  const hp = f.m.hp;
  spellContext.hitMonster(f.s, f.m, 20, f.s.team[0]);
  assert.equal(f.m.hp, hp - 12);
  assert.equal(f.m.shellDamage, 12);
});
test("coup fatal et cible bonus comptent sans double réduction ni double explosion", () => {
  const { s, m, tick } = fixture();
  spellContext.hitMonster(s, m, 50, s.team[0], { bonus: true });
  assert.equal(m.hp, m.maxHp - 50);
  assert.equal(m.shellBroken, true);
  assert.equal(s.magmaBlasts.length, 1);
  spellContext.hitMonster(s, m, 9999, s.team[0]);
  assert.equal(m.hp, 0);
  assert.equal(s.magmaBlasts.length, 1);
  tick(2.2);
  assert.ok(s.magmaPatches.length > 0);
  assert.equal(s.magmaBlasts.length, 0);
});
test("carapace : avertissement, souffle Terre puis projections Feu annoncées et sol persistant", () => {
  const { s, m, hits, tick } = fixture();
  Object.assign(s.team[0], { x: m.x + 10, y: m.y });
  recordMagmaDamage(s, m, Math.ceil(m.maxHp * 0.25));
  tick(1);
  assert.equal(hits.length, 0);
  tick(0.15);
  assert.equal(hits[0].element, "earth");
  assert.equal(s.volcanoFlights.length, 6);
  assert.equal(s.magmaPatches.length, 0);
  tick(0.9);
  assert.equal(s.volcanoFlights.length, 0);
  assert.ok(s.magmaPatches.length >= 4);
  assert.ok(s.magmaPatches.every((h) => map.canWalkVolcano(h.x, h.y)));
  const n = s.magmaPatches.length;
  tick(60);
  assert.equal(s.magmaPatches.length, n);
});
test("magma : plusieurs personnages touchés sans consommer la flaque, brûlures répétées sans recul", () => {
  const { s, ctx, hits, tick } = fixture();
  s.deployed = true;
  s.team.forEach((p) => Object.assign(p, { x: 200, y: 275 }));
  addMagmaPatch(s, { x: 200, y: 275 }, 5, { x: 200, y: 275 });
  tick(0.1);
  assert.deepEqual(
    hits.map((h) => h.id),
    [0, 1, 2],
  );
  assert.equal(s.magmaPatches.length, 1);
  tick(0.7);
  assert.equal(hits.length, 6);
  assert.ok(hits.every((h) => h.element === "fire" && h.kind === "burn"));
  assert.equal(s.magmaPatches.length, 1);
  const f = fixture();
  f.s.monsters = [];
  f.s.team[0].resistances = { fire: 50 };
  addMagmaPatch(f.s, { x: 200, y: 275 }, 10, { x: 200, y: 275 });
  const hp = f.s.team[0].hp;
  for (let i = 0; i < 18; i++) stepSandbox(f.s, { x: 0, y: 0 }, 0.05);
  assert.equal(f.s.team[0].hp, hp - 10);
  assert.equal(f.s.player.x, 200);
  assert.equal(f.s.player.y, 275);
  assert.equal(f.s.magmaPatches.length, 1);
});
test("magma : obstacles et membres non déployés protégés, fusion et borne de mémoire", () => {
  const { s, hits, ctx, tick } = fixture();
  s.team.forEach((p) => Object.assign(p, { x: 200, y: 275 }));
  addMagmaPatch(s, { x: 190, y: 275 }, 5, { x: 190, y: 275 });
  addMagmaPatch(s, { x: 192, y: 275 }, 7, { x: 192, y: 275 });
  assert.equal(s.magmaPatches.length, 1);
  ctx.canStand = (x, y) => map.canWalkVolcano(x, y) && !(x > 194 && x < 197);
  tick(0.1);
  assert.equal(hits.length, 0);
  ctx.canStand = map.canWalkVolcano;
  tick(0.7);
  assert.ok(hits.length >= 1 && hits.every((h) => h.id === 0));
  assert.equal(addMagmaPatch(s, { x: 0, y: 0 }, 4, {}), false);
  for (let y = 80; y < 370; y += 15)
    for (let x = 40; x < 610; x += 15) addMagmaPatch(s, { x, y }, 3, {});
  assert.equal(s.magmaPatches.length, MAGMA_RULES.maxPatches);
});
test("boss : réveil manuel, annonce verrouillée, éruption balistique puis invocations et magma", () => {
  const s = setup(),
    b = volcanoBoss(s);
  s.monsters = [b];
  s.deployed = true;
  Object.assign(s.player, { x: 430, y: 210 });
  s.team.forEach((p, i) =>
    Object.assign(p, { x: 430 + i * 20, y: 210 + i * 14 }),
  );
  assert.ok(awakenVolcanoBoss(s));
  b.cooldown = 0;
  stepVolcanoBoss(s, b, 0.05);
  assert.equal(b.intent.kind, "volcano-eruption");
  assert.equal(b.intent.zones.length, 2);
  const zones = structuredClone(b.intent.zones);
  s.team.forEach((p) => (p.y += 60));
  stepVolcanoBoss(s, b, 1);
  assert.deepEqual(b.intent.zones, zones);
  stepVolcanoBoss(s, b, 0.6);
  assert.equal(s.volcanoFlights.length, 2);
  const hits = [],
    ctx = {
      canStand: map.canWalkVolcano,
      damage: (p, n, m, e) => hits.push(e),
    };
  stepMagmaHazards(s, 0.4, ctx);
  assert.equal(s.monsters.length, 1);
  stepMagmaHazards(s, 0.41, ctx);
  assert.equal(s.monsters.filter((m) => m.volcanoSummon).length, 2);
  assert.ok(
    s.monsters
      .filter((m) => m.volcanoSummon)
      .every((m) => map.canWalkVolcano(m.x, m.y)),
  );
  assert.equal(hits.length, 0);
  assert.equal(s.magmaPatches.length, 2);
});
test("boss : rage, plafond d’invocations, pas d’XP/loot et population bornée après les morts", () => {
  const s = setup(),
    b = volcanoBoss(s);
  s.monsters = [b];
  s.deployed = false;
  Object.assign(s.player, { x: 430, y: 210 });
  Object.assign(s.team[0], s.player);
  awakenVolcanoBoss(s);
  b.hp = Math.floor(b.maxHp * 0.3);
  const ctx = { canStand: map.canWalkVolcano, damage: () => {} };
  b.cooldown = 0;
  stepVolcanoBoss(s, b, 0.01);
  assert.equal(b.intent.zones.length, 3);
  stepVolcanoBoss(s, b, 1.6);
  stepMagmaHazards(s, 0.9, ctx);
  assert.equal(s.monsters.filter((m) => m.volcanoSummon).length, 3);
  for (let i = 0; i < 8; i++) {
    b.cooldown = 0;
    stepVolcanoBoss(s, b, 0.5);
    assert.equal(b.intent, undefined);
  }
  const gold = s.gold,
    bag = structuredClone(s.bag),
    xp = s.team[0].xp;
  for (const m of s.monsters.filter((m) => m.volcanoSummon)) {
    rewardMonster(s, m, () => 0);
    m.hp = 0;
  }
  assert.equal(s.gold, gold);
  assert.equal(s.team[0].xp, xp);
  assert.deepEqual(s.bag, bag);
  b.cooldown = 0;
  stepVolcanoBoss(s, b, 1.3);
  assert.equal(b.intent.zones.length, 3);
  stepVolcanoBoss(s, b, 1.6);
  stepMagmaHazards(s, 0.9, ctx);
  assert.ok(s.monsters.length <= 4);
});
test("victoire : morceau royal et familier possible, fin de run et invocations supprimées", () => {
  const s = setup(),
    b = volcanoBoss(s);
  s.monsters = [b];
  Object.assign(s.player, { x: b.x - 40, y: b.y + 30 });
  Object.assign(s.team[0], s.player);
  s.dungeonRun = { active: true, dungeonId: "slime-volcano" };
  awakenVolcanoBoss(s);
  const summon = createMonster("magma-slime", b.x + 10, b.y + 10, 6);
  summon.volcanoSummon = true;
  summon.volcanoEncounter = b.encounterId;
  s.monsters.push(summon);
  spellContext.hitMonster(s, summon, 80, s.team[0]);
  stepMagmaHazards(s, 1.2, { canStand: map.canWalkVolcano, damage: () => {} });
  assert.equal(b.invulnerable, false);
  spellContext.hitMonster(s, b, 99999, s.team[0]);
  assert.equal(b.hp, 0);
  assert.equal(b.bossPhase, "dead");
  assert.equal(s.dungeonRun.completed, true);
  assert.ok(s.monsters.every((m) => !m.volcanoSummon));
  assert.equal(s.bag.filter(i=>i.kind==='royal-key-part').length, 1);
  const n = s.bag.length;
  spellContext.hitMonster(s, b, 99999, s.team[0]);
  assert.equal(s.bag.length, n);
});
test("défaite et changement de zone nettoient tous les dangers, réinitialisent le boss, sans clé supplémentaire", () => {
  const s = setup(),
    b = volcanoBoss(s);
  s.monsters = [b];
  Object.assign(s.player, { x: 430, y: 210 });
  s.team.forEach((p) => Object.assign(p, { x: 430, y: 210, hp: 1 }));
  s.deployed = true;
  awakenVolcanoBoss(s);
  b.hp -= 100;
  s.dungeonRun = { active: true, dungeonId: "slime-volcano", id: 7 };
  addMagmaPatch(s, { x: 430, y: 210 }, 999, {});
  stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(s.zone, "slime-volcano");
  assert.equal(s.dungeonRun.id, 7);
  assert.ok(s.team.every((p) => p.hp > 0));
  assert.equal(b.bossPhase, "dormant");
  assert.equal(b.hp, b.maxHp);
  assert.equal(s.magmaPatches.length, 0);
  assert.deepEqual({ x: s.player.x, y: s.player.y }, map.VOLCANO_SPAWN);
  addMagmaPatch(s, { x: 430, y: 210 }, 5, {});
  travelToZone(s, "slime-fire");
  assert.equal(s.magmaPatches.length, 0);
  assert.equal(s.volcanoFlights.length, 0);
  assert.equal(s.dungeonRun.active, false);
});
test("bestiaire et silhouettes propres, statistiques Terre/Feu et évolution des niveaux", () => {
  for (const id of ["magma-slime", "volcano-slime"]) {
    const html = renderBestiary(id, 6);
    assert.match(html, /Terre \/ Feu/);
    assert.equal(/NaN|undefined/.test(html), false);
    assert.ok(html.includes("Nouvelle expédition"));
    assert.notEqual(bestiaryValues(id, 1).maxHp, bestiaryValues(id, 10).maxHp);
    for (const drop of monsterLoot(id))
      assert.match(renderItemIcon(drop), /<svg/);
  }
  assert.notEqual(
    renderItemIcon(createDungeonKey()),
    renderItemIcon(createDungeonKey("slime-volcano")),
  );
  assert.ok(monsterStats("volcano-slime", 9).maxHp > 1000);
});

test("élaguer les invocations conserve les cibles des ricochets et des sceaux de partage", () => {
  const s = setup(),
    b = volcanoBoss(s);
  s.monsters = [b];
  Object.assign(s.player, { x: 430, y: 210 });
  Object.assign(s.team[0], s.player);
  awakenVolcanoBoss(s);
  const dead = createMonster("magma-slime", 440, 220, 6),
    alive = createMonster("magma-slime", 450, 230, 6);
  dead.volcanoSummon = alive.volcanoSummon = true;
  dead.volcanoEncounter = alive.volcanoEncounter = b.encounterId;
  dead.hp = 0;
  s.monsters.push(dead, alive);
  s.spellMissiles = [{ hits: [0, 1, 2], bounce: 2 }];
  s.team[0].buffs = { share: { enemy: 2, owner: 0, time: 3 } };
  s.volcanoFlights = [
    {
      age: 0,
      duration: 0.1,
      from: { x: b.x, y: b.y },
      to: { x: 338, y: 185 },
      radius: 21,
      damage: 10,
      source: b,
      summon: true,
      encounterId: b.encounterId,
      species: "fire-slime",
      element: "fire",
      level: 9,
    },
  ];
  stepMagmaHazards(s, 0.2, { canStand: map.canWalkVolcano, damage: () => {} });
  assert.equal(s.monsters[1], alive);
  assert.deepEqual(s.spellMissiles[0].hits, [0, 1]);
  assert.equal(s.spellMissiles[0].bounce, 1);
  assert.equal(s.team[0].buffs.share.enemy, 1);
});
