import test from "node:test";
import assert from "node:assert/strict";
import {
  createSandbox,
  spellContext,
  stepSandbox,
} from "../src/dev/sandbox.js";
import { travelToZone } from "../src/game/zone-travel.js";
import { createMonster } from "../src/data/monsters.js";
import {
  awakenVolcanoBoss,
  volcanoBoss,
  stepVolcanoBoss,
  stepMagmaHazards,
  recordMagmaDamage,
  breakVolcanoShield,
  isVolcanoInvulnerable,
  resetVolcanoBoss,
  MAGMA_RULES,
} from "../src/game/volcano.js";
import { canWalkVolcano } from "../src/world/volcano-map.js";
import { findPath, stepCompanions } from "../src/ai/companions.js";
import { renderBestiary } from "../src/ui/bestiary.js";
function setup() {
  const s = createSandbox();
  travelToZone(s, "slime-volcano");
  s.volcanoGuideOpen = false;
  const b = volcanoBoss(s);
  s.monsters = [b];
  s.deployed = false;
  Object.assign(s.player, { x: 430, y: 155 });
  Object.assign(s.team[0], s.player);
  awakenVolcanoBoss(s);
  const ctx = { canStand: canWalkVolcano, damage: () => {} };
  return { s, b, ctx };
}
function wave(f) {
  const { s, b, ctx } = f;
  b.cooldown = 0;
  stepVolcanoBoss(s, b, 0.01);
  const zones = structuredClone(b.intent.zones);
  stepVolcanoBoss(s, b, 1.6);
  stepMagmaHazards(s, 0.81, ctx);
  return zones;
}
function nearSummon(s, b) {
  const m = createMonster("magma-slime", b.x + 10, b.y + 10, 9);
  m.volcanoSummon = true;
  m.volcanoEncounter = b.encounterId;
  s.monsters.push(m);
  return m;
}
function actualBlast(f, m) {
  spellContext.hitMonster(
    f.s,
    m,
    Math.ceil(m.maxHp * 0.25) / 0.6 + 1,
    f.s.team[0],
  );
  assert.ok(f.s.magmaBlasts?.length);
  stepMagmaHazards(f.s, 1.11, f.ctx);
}

test("invocations seulement Terre/Feu : cercles verrouillés, loin du boss, sol praticable et trajet de retour", () => {
  for (const rage of [false, true]) {
    const f = setup(),
      { s, b } = f;
    if (rage) b.hp = Math.floor(b.maxHp * 0.3);
    const points = wave(f),
      summons = s.monsters.filter((m) => m.volcanoSummon);
    assert.equal(points.length, rage ? 3 : 2);
    assert.equal(summons.length, points.length);
    for (const m of summons) {
      assert.equal(m.species, "magma-slime");
      assert.deepEqual(m.elements, ["earth", "fire"]);
      assert.equal(m.volcanoEncounter, b.encounterId);
      const d = Math.hypot(m.x - b.x, m.y - b.y);
      assert.ok(
        d >= MAGMA_RULES.summonMinDistance &&
          d <= MAGMA_RULES.summonMaxDistance,
      );
      assert.ok(canWalkVolcano(m.x, m.y));
      assert.ok(findPath(m, b, canWalkVolcano).length);
      assert.ok(m.detection > d);
    }
  }
});
test("invulnérabilité bloque coups, sorts et copies bonus, sans cible bonus ni baisse de PV", () => {
  const { s, b } = setup();
  const hp = b.hp;
  assert.equal(isVolcanoInvulnerable(b), true);
  for (const options of [
    {},
    { bonus: true },
    { element: "fire", sound: "magic" },
  ])
    spellContext.hitMonster(s, b, 99999, s.team[0], options);
  assert.equal(b.hp, hp);
  assert.equal(b.bonusTarget, undefined);
  assert.equal(b.lastReceivedDamage, undefined);
  assert.equal(s.bag.length, 0);
  assert.ok(s.effects.some((e) => e.text === "Invulnérable"));
  assert.equal(s.effects.filter((e) => e.text === "Invulnérable").length, 1);
});
test("seule la carapace d’une invocation de cette rencontre peut déverrouiller le boss", () => {
  const f = setup(),
    { s, b, ctx } = f;
  const regular = createMonster("magma-slime", b.x + 10, b.y + 10, 6);
  s.monsters.push(regular);
  actualBlast(f, regular);
  assert.equal(b.invulnerable, true);
  const old = nearSummon(s, b);
  old.volcanoEncounter = b.encounterId - 1;
  actualBlast(f, old);
  assert.equal(b.invulnerable, true);
  const far = createMonster("magma-slime", 350, 185, 6);
  far.volcanoSummon = true;
  far.volcanoEncounter = b.encounterId;
  s.monsters.push(far);
  actualBlast(f, far);
  assert.equal(b.invulnerable, true);
  const valid = nearSummon(s, b);
  actualBlast(f, valid);
  assert.equal(b.invulnerable, false);
  assert.equal(b.cooldown, MAGMA_RULES.exposedDuration);
  const hp = b.hp;
  spellContext.hitMonster(s, b, 50, s.team[0]);
  assert.equal(b.hp, hp - 50);
  assert.ok(s.effects.some((e) => e.text?.includes("Protection brisée")));
});
test("coup fatal : explosion maintenue après la mort et avant la décision de réinvoquer", () => {
  const f = setup(),
    { s, b, ctx } = f;
  b.waitingForSummons = true;
  const m = nearSummon(s, b);
  spellContext.hitMonster(s, m, 99999, s.team[0]);
  assert.equal(m.hp, 0);
  stepVolcanoBoss(s, b, 2);
  assert.equal(b.intent, undefined);
  assert.equal(b.invulnerable, true);
  stepMagmaHazards(s, 1.11, ctx);
  assert.equal(b.invulnerable, false);
  assert.equal(b.cooldown, 8);
  stepVolcanoBoss(s, b, 0.1);
  assert.equal(b.intent, undefined);
});
test("échec de la vague : nouvelle invocation après morts et explosions ratées, sans perdre le bouclier", () => {
  const f = setup(),
    { s, b, ctx } = f;
  wave(f);
  for (const m of s.monsters.filter((m) => m.volcanoSummon))
    spellContext.hitMonster(s, m, 99999, s.team[0]);
  assert.ok(s.magmaBlasts.length);
  stepVolcanoBoss(s, b, 5);
  assert.equal(b.intent, undefined);
  assert.equal(b.invulnerable, true);
  stepMagmaHazards(s, 1.11, ctx);
  assert.equal(b.invulnerable, true);
  stepVolcanoBoss(s, b, 1);
  assert.equal(b.intent, undefined);
  stepVolcanoBoss(s, b, 0.3);
  assert.equal(b.intent.kind, "volcano-eruption");
  stepVolcanoBoss(s, b, 1.6);
  stepMagmaHazards(s, 0.81, ctx);
  const living = s.monsters.filter((m) => m.volcanoSummon && m.hp > 0);
  assert.equal(living.length, 2);
  assert.ok(living.every((m) => m.species === "magma-slime"));
  assert.ok(s.monsters.length <= 3);
});
test("vague en cours : pas de réinvocation anticipée pendant le vol ou tant qu’une invocation vit", () => {
  const f = setup(),
    { s, b, ctx } = f;
  b.cooldown = 0;
  stepVolcanoBoss(s, b, 0.01);
  stepVolcanoBoss(s, b, 1.6);
  stepVolcanoBoss(s, b, 10);
  assert.equal(b.intent, undefined);
  stepMagmaHazards(s, 0.81, ctx);
  for (let i = 0; i < 20; i++) stepVolcanoBoss(s, b, 0.5);
  assert.equal(b.intent, undefined);
  assert.equal(s.monsters.filter((m) => m.volcanoSummon && m.hp > 0).length, 2);
});
test("fenêtre de vulnérabilité dure huit secondes dans la simulation puis nouvelle protection", () => {
  const f = setup(),
    { s, b } = f;
  const m = nearSummon(s, b);
  actualBlast(f, m);
  m.spellState = { root: 100, embers: [], fractures: {} };
  s.team[0].maxHp = s.team[0].hp = 10000;
  for (let i = 0; i < 154; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(b.invulnerable, false);
  assert.equal(b.intent, undefined);
  for (let i = 0; i < 8; i++) stepSandbox(s, { x: 0, y: 0 }, 0.05);
  assert.equal(b.invulnerable, true);
  assert.equal(b.intent.kind, "volcano-eruption");
});
test("alliés : ciblent les invocations au lieu de gaspiller leurs attaques sur le boss protégé", () => {
  const f = setup(),
    { s, b } = f;
  wave(f);
  s.deployed = true;
  s.team.forEach((m, i) =>
    Object.assign(m, { x: 430 - i * 3, y: 155 + i * 4 }),
  );
  const targets = [];
  stepCompanions(
    s,
    0.05,
    canWalkVolcano,
    () => {},
    (member, target) => {
      if (target) targets.push(target);
    },
  );
  assert.ok(targets.length);
  assert.ok(targets.every((m) => m.volcanoSummon));
  assert.ok(!targets.includes(b));
});
test("réinitialisation efface bouclier, invocations et dangers ; une explosion d’une ancienne rencontre est refusée", () => {
  const f = setup(),
    { s, b } = f;
  const m = nearSummon(s, b);
  recordMagmaDamage(s, m, m.maxHp);
  const stale = { ...s.magmaBlasts[0] };
  resetVolcanoBoss(s);
  assert.equal(b.invulnerable, false);
  assert.equal(b.bossPhase, "dormant");
  assert.equal(s.magmaBlasts.length, 0);
  assert.ok(!s.monsters.some((m) => m.volcanoSummon));
  assert.ok(awakenVolcanoBoss(s));
  assert.notEqual(b.encounterId, stale.encounterId);
  assert.equal(breakVolcanoShield(s, stale), false);
  assert.equal(b.invulnerable, true);
});
test("télégraphes et bestiaire expliquent la mécanique sans rétablir le butin du boss", () => {
  const html = renderBestiary("volcano-slime", 9);
  assert.ok(html.includes("invulnérable"));
  assert.ok(html.includes("8 secondes"));
  assert.ok(html.includes("120–180 px"));
  assert.ok(html.includes("Aucun butin"));
  assert.ok(!html.includes("garantis"));
});
