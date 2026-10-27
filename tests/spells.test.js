import test from "node:test";
import assert from "node:assert/strict";
import {
  SPELLS,
  spellById,
  spellAmount,
  equipSpell,
} from "../src/data/spells.js";
import {
  castSpell,
  stepSpells,
  receiveSpellDamage,
  gainCharge,
} from "../src/combat/spells.js";
import {
  createSandbox,
  setCombatMode,
  chooseMain,
  canStand,
} from "../src/dev/sandbox.js";
import { castCompanionSpell } from "../src/ai/spell-tactics.js";
const ctx = {
  canStand,
  hitMonster: (_s, m, amount) => {
    m.hp = Math.max(0, m.hp - amount);
  },
};
function setup(role = 0) {
  const s = createSandbox();
  setCombatMode(s,false);
  s.team.forEach(member=>{member.level=20;member.learnedUltimates=["earth","fire","air","water"].map(element=>`${member.role}-${element}-3`);});
  chooseMain(s, role);
  Object.assign(s.player, { x: 420, y: 240 });
  Object.assign(s.team[role], s.player);
  s.monsters = [{ x: 445, y: 240, hp: 1000, maxHp: 1000, cooldown: 0 }];
  return s;
}
function select(s, id, slot = 0) {
  const m = s.team[s.main];
  m.loadout[slot] = id;
  m.cooldown = 0;
  m.spellCooldowns[id] = 0;
  return m;
}
function use(s, id, point = { x: 445, y: 240 }, slot = 0) {
  const m = select(s, id, slot);
  return castSpell(s, m, slot, point, ctx);
}
function tick(s, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) {
    s.team.forEach((m) => (m.cooldown = Math.max(0, m.cooldown - 1 / 60)));
    stepSpells(s, 1 / 60, ctx);
  }
}

test("catalogue : trois classes, quatre éléments, trois sorts et un ultime pour chaque combinaison", () => {
  assert.equal(SPELLS.length, 48);
  assert.equal(new Set(SPELLS.map((s) => s.id)).size, 48);
  for (const role of ["melee", "support", "ranged"])
    for (const element of ["earth", "fire", "air", "water"]) {
      const kit = SPELLS.filter(
        (s) => s.role === role && s.element === element,
      );
      assert.equal(kit.filter((s) => !s.ultimate).length, 3);
      assert.equal(kit.filter((s) => s.ultimate).length, 1);
    }
});
test("grimoire : mélange élémentaire autorisé ; autre classe, doublon et ultime en slot normal interdits", () => {
  const s = setup();
  assert.equal(equipSpell(s, 0, 1, "melee-fire-0"), true);
  assert.equal(s.team[0].loadout[0], "melee-earth-0");
  assert.equal(equipSpell(s, 0, 2, "melee-fire-0"), false);
  assert.equal(equipSpell(s, 0, 0, "ranged-fire-0"), false);
  assert.equal(equipSpell(s, 0, 0, "melee-fire-3"), false);
  assert.equal(equipSpell(s, 0, 3, "melee-water-3"), true);
});
test("dégâts : caractéristique du sort + Puissance, indépendamment de l’arme", () => {
  const s = setup(),
    m = s.team[0];
  m.equipment.Arme = {
    element: "earth",
    stats: { Force: 200, Intelligence: 50, Puissance: 25 },
  };
  assert.equal(spellAmount(m, spellById("melee-fire-0"), 100), 175);
  assert.equal(spellAmount(m, spellById("melee-earth-0"), 100), 325);
  assert.equal(spellAmount(m, spellById("melee-water-0"), 100), 125);
  use(s, "melee-fire-0");
  tick(s, 0.14);
  assert.equal(s.monsters[0].hp, 1000 - 19);
});
test("recharge par sort conservée au changement d’emplacement et de personnage ; pas de spam", () => {
  const s = setup();
  use(s, "melee-earth-0");
  assert.equal(castSpell(s, s.team[0], 0, null, ctx), false);
  equipSpell(s, 0, 0, "melee-fire-0");
  equipSpell(s, 0, 1, "melee-earth-0");
  s.team[0].cooldown = 0;
  assert.equal(castSpell(s, s.team[0], 1, null, ctx), false);
  chooseMain(s, 1);
  chooseMain(s, 0);
  assert.equal(castSpell(s, s.team[0], 1, null, ctx), false);
  tick(s, 0.7);
  assert.equal(castSpell(s, s.team[0], 1, null, ctx), true);
});
test("Terre : trois Fractures puis Marteau renforcé et interruption", () => {
  const s = setup();
  for (let i = 0; i < 3; i++) {
    use(s, "melee-earth-0");
    tick(s, 0.14);
  }
  const before = s.monsters[0].hp;
  assert.equal(s.monsters[0].spellState.fractures[0], 3);
  use(s, "melee-earth-1");
  tick(s, 0.14);
  assert.equal(before - s.monsters[0].hp, 44);
  assert.equal(s.monsters[0].spellState.fractures[0], 0);
  assert.ok(s.monsters[0].cooldown > 0);
});
test("Feu : Braises plafonnées, dégâts périodiques puis consommation par Déflagration", () => {
  const s = setup();
  for (let i = 0; i < 4; i++) {
    use(s, "melee-fire-0");
    tick(s, 0.14);
  }
  assert.equal(s.monsters[0].spellState.embers.length, 3);
  const before = s.monsters[0].hp;
  tick(s, 1);
  assert.equal(before - s.monsters[0].hp, 9);
  use(s, "melee-fire-1");
  assert.equal(s.monsters[0].spellState.embers.length, 0);
  assert.ok(before - s.monsters[0].hp > 24);
});
test("Air : deux frappes seulement, bonus de contournement consommé sans boucle d’événements", () => {
  const s = setup();
  s.team[0].buffs.flank = { time: 5 };
  use(s, "melee-air-0");
  tick(s, 1);
  assert.equal(s.monsters[0].hp, 974);
  assert.equal(s.spellEvents.length, 0);
  assert.equal(s.team[0].buffs.flank, undefined);
});
test("Eau : bouclier, Écume absorbée, puis rupture renforcée et recul", () => {
  const s = setup(),
    m = s.team[0];
  use(s, "melee-water-1", m);
  receiveSpellDamage(s, m, 20, s.monsters[0]);
  assert.equal(m.hp, 100);
  assert.equal(m.buffs.foam, 20);
  const x = s.monsters[0].x;
  use(s, "melee-water-2");
  assert.equal(s.monsters[0].hp, 964);
  assert.equal(m.buffs.foam, 0);
  assert.ok(s.monsters[0].x > x);
});
test("soins effectifs, surplus en bouclier et lien sans amplification infinie", () => {
  const s = setup(1);
  setCombatMode(s,true);
  const m = s.team[1],
    ally = s.team[0];
  Object.assign(ally, { x: 425, y: 240, hp: 40 });
  m.hp = 50;
  use(s, "support-water-1", ally);
  use(s, "support-earth-0", ally);
  assert.equal(ally.hp, 58);
  assert.equal(m.hp, 57);
  ally.hp = 95;
  use(s, "support-earth-0", ally);
  assert.equal(ally.hp, 100);
  assert.equal(ally.buffs.shield.amount, 13);
  m.ultimateCharge = 0;
  ally.hp = 100;
  use(s, "support-earth-0", ally);
  assert.equal(m.ultimateCharge, 0);
});
test("Sceau et Braise partagée : déclenchements limités et soin du bon allié", () => {
  const s = setup(1);
  setCombatMode(s,true);
  const ally = s.team[0];
  Object.assign(ally, { x: 430, y: 240, hp: 50 });
  use(s, "support-fire-1");
  use(s, "support-fire-2", ally);
  const owner = s.team[0];
  owner.cooldown = 0;
  castSpell(s, owner, 0, s.monsters[0], ctx);
  tick(s, 0.14);
  assert.equal(ally.hp, 56);
  assert.equal(s.monsters[0].spellState.seal.charges, 4);
});
test("Phénix : une seule survie, puis défaite au coup fatal suivant", () => {
  const s = setup(1),
    m = s.team[1];
  m.ultimateCharge = 100;
  use(s, "support-fire-3", m, 3);
  receiveSpellDamage(s, m, 200, s.monsters[0]);
  assert.equal(m.hp, 24);
  assert.equal(m.buffs.phoenix, undefined);
  receiveSpellDamage(s, m, 200, s.monsters[0]);
  assert.equal(m.hp, 0);
});
test("bombes : coût de préparation, détonation en chaîne et maximum trois actives", () => {
  const s = setup(2);
  for (let i = 0; i < 3; i++)
    use(s, "ranged-fire-1", { x: 440 + i * 15, y: 240 });
  assert.equal(s.spellAreas.filter((a) => a.kind === "bomb").length, 3);
  use(s, "ranged-fire-2");
  tick(s, 0.5);
  assert.equal(s.spellAreas.filter((a) => a.kind === "bomb").length, 0);
  assert.equal(s.monsters[0].hp, 921);
});
test("flaques : courant exige deux flaques ; givre consomme une flaque et entrave après avertissement", () => {
  const s = setup(2);
  assert.equal(use(s, "ranged-water-1"), false);
  use(s, "ranged-water-0");
  tick(s, 0.2);
  assert.ok(s.spellAreas.some((a) => a.kind === "pool"));
  use(s, "ranged-water-2");
  assert.equal(s.spellAreas.filter((a) => a.kind === "pool").length, 0);
  assert.equal(s.monsters[0].spellState.root, 0);
  tick(s, 0.7);
  assert.ok(s.monsters[0].spellState.root > 0);
});
test("boomerang : un impact par trajet et retour vers le lanceur", () => {
  const s = setup(2);
  use(s, "ranged-air-0");
  tick(s, 1.5);
  assert.equal(s.monsters[0].hp, 980);
  assert.equal(s.spellMissiles.length, 0);
});
test("ultime personnel séparé du déploiement, jauge consommée et aucun gain pendant son effet", () => {
  const s = setup(),
    m = s.team[0];
  assert.equal(use(s, "melee-earth-3", m, 3), false);
  gainCharge(m, 100);
  assert.equal(use(s, "melee-earth-3", m, 3), true);
  assert.equal(s.deployed, false);
  assert.equal(m.ultimateCharge, 0);
  gainCharge(m, 100);
  assert.equal(m.ultimateCharge, 0);
  setCombatMode(s,true);
  assert.equal(s.deployed, true);
  assert.equal(m.ultimateCharge, 0);
});
test("collision et rappel : déplacements sûrs ; un allié rappelé ne laisse pas de sorts actifs", () => {
  const s = setup();
  use(s, "melee-fire-2", { x: 10, y: 10 });
  assert.ok(canStand(s.player.x, s.player.y));
  const other = setup(2);
  use(other, "ranged-fire-1");
  chooseMain(other, 0);
  tick(other, 0.1);
  assert.equal(other.spellAreas.length, 0);
});
test("IA : utilise les sorts équipés, dont un sort de soin d’un autre élément", () => {
  const s = setup();
  setCombatMode(s,true);
  const m = s.team[1];
  Object.assign(m, { x: 425, y: 240 });
  s.team[0].hp = 40;
  m.loadout[0] = "support-fire-0";
  assert.equal(castCompanionSpell(s, m, s.monsters[0], ctx), true);
  assert.equal(s.team[0].hp, 54);
  assert.equal(s.team[0].buffs.regen.owner, 1);
});

test("48 sorts : lancement avec prérequis, simulation complète et nettoyage des effets temporaires", () => {
  for (const spell of SPELLS) {
    const s = setup(["melee", "support", "ranged"].indexOf(spell.role));
    setCombatMode(s,true);
    const owner = s.team[s.main];
    owner.hp = 60;
    owner.ultimateCharge = 100;
    s.team
      .filter((m) => m !== owner)
      .forEach((m) => Object.assign(m, { x: 430, y: 250, hp: 50 }));
    const slot = spell.ultimate ? 3 : 0;
    owner.loadout[slot] = spell.id;
    if (["freeze", "crossCurrent"].includes(spell.effect))
      for (let i = 0; i < 2; i++)
        s.spellAreas.push({
          id: i,
          kind: "pool",
          owner: owner.id,
          spell: "ranged-water-0",
          x: 440 + i * 10,
          y: 240,
          radius: 26,
          time: 7,
          tick: 0,
          amount: 8,
        });
    if (spell.effect === "share")
      s.monsters[0].spellState = {
        fractures: {},
        embers: [],
        root: 0,
        seal: { owner: owner.id, time: 6, charges: 5, amount: 6 },
      };
    const point =
      spell.role === "support" &&
      [
        "sap",
        "kindFlame",
        "share",
        "swap",
        "riverLink",
        "cleanse",
        "healingWind",
        "greatTide",
      ].includes(spell.effect)
        ? { x: 430, y: 250 }
        : { x: 445, y: 240 };
    assert.equal(castSpell(s, owner, slot, point, ctx), true, spell.id);
    tick(s, 10);
    assert.equal(s.spellAreas.length, 0, `${spell.id}: persistent area leaked`);
    assert.equal(s.spellEvents.length, 0, `${spell.id}: pending event leaked`);
    assert.equal(s.spellMissiles.length, 0, `${spell.id}: projectile leaked`);
    assert.ok(s.team.every((m) => Number.isFinite(m.hp) && m.hp <= m.maxHp));
  }
});

test("Marque des vents : le boomerang voyage réellement vers une seconde cible avant de revenir", () => {
  const s = setup(2);
  s.monsters.push({ x: 465, y: 270, hp: 1000 });
  use(s, "ranged-air-2");
  use(s, "ranged-air-0");
  tick(s, 0.08);
  assert.ok(s.spellMissiles.some((p) => p.bounce === 1));
  assert.equal(s.monsters[1].hp, 1000);
  tick(s, 0.25);
  assert.ok(s.monsters[1].hp < 1000);
  assert.equal(s.monsters[0].spellState.windMark, undefined);
  tick(s, 3);
  assert.equal(s.spellMissiles.length, 0);
});
test("Éclat de carrière : les éclats touchent derrière la cible, sans toucher derrière le tireur", () => {
  const s = setup(2);
  s.monsters.push({ x: 469, y: 246, hp: 1000 }, { x: 428, y: 255, hp: 1000 });
  use(s, "ranged-earth-1");
  tick(s, 0.2);
  assert.equal(s.monsters[0].hp, 982);
  assert.equal(s.monsters[1].hp, 989);
  assert.equal(s.monsters[2].hp, 1000);
});

test('déséquiper libère un emplacement sans remettre les recharges à zéro ni le remplir au niveau suivant', async () => {
  const { unequipSpell } = await import('../src/data/spells.js');
  const { grantXp } = await import('../src/dev/sandbox.js');
  const s = createSandbox(), m = s.team[0];
  m.spellCooldowns['melee-earth-0'] = 3;
  assert.equal(unequipSpell(s,0,0),true);
  assert.equal(unequipSpell(s,0,0),false);
  assert.equal(unequipSpell(s,0,4),false);
  grantXp(s,50);
  assert.equal(m.loadout[0],null);
  assert.equal(m.spellCooldowns['melee-earth-0'],3);
  assert.equal(equipSpell(s,0,0,'melee-earth-0'),true);
  assert.deepEqual(m.emptySpellSlots,[]);
  m.learnedUltimates=['melee-earth-3'];
  equipSpell(s,0,3,'melee-earth-3');
  assert.equal(unequipSpell(s,0,3),true);
  assert.equal(m.loadout[3],null);
  assert.deepEqual(m.learnedUltimates,['melee-earth-3']);
});
