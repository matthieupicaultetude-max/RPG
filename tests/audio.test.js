import test from "node:test";
import assert from "node:assert/strict";
import {
  emitSound,
  impactKind,
  audioPreferences,
  AUDIO_DEFAULTS,
} from "../src/audio/events.js";
import { createAudioEngine } from "../src/audio/engine.js";
import { musicStep, MUSIC_STEPS, makeNoise } from "../src/audio/instruments.js";
import { spellById } from "../src/data/spells.js";
import {
  createSandbox,
  chooseMain,
  castEquipped,
  spellContext,
} from "../src/dev/sandbox.js";
import { stepSpells } from "../src/combat/spells.js";
function setup(role = 0) {
  const s = createSandbox();
  chooseMain(s, role);
  const m = s.team[role];
  m.level = 20;
  Object.assign(s.player, { x: 420, y: 240 });
  Object.assign(m, s.player);
  s.monsters = [{ ...s.monsters[0], x: 445, y: 240, hp: 1000, maxHp: 1000 }];
  return s;
}
const advance = (s, t) => {
  for (let i = 0; i < Math.ceil(t * 60); i++)
    stepSpells(s, 1 / 60, spellContext);
};
test("impacts : lame, arc et sorts magiques ont des familles sonores distinctes", () => {
  const cases = [
    ["melee-earth-0", "sword"],
    ["melee-fire-0", "sword"],
    ["melee-earth-3", "magic"],
    ["ranged-earth-0", "bow"],
    ["ranged-air-0", "bow"],
    ["ranged-fire-0", "magic"],
    ["ranged-water-0", "magic"],
    ["support-fire-1", "magic"],
  ];
  for (const [id, kind] of cases)
    assert.equal(impactKind({ role: spellById(id).role }, spellById(id)), kind);
});
test("un coup raté ne produit pas de bruitage d’impact, un coup réussi en produit un", () => {
  const s = setup();
  castEquipped(s, 0, { x: 390, y: 232 });
  advance(s, 0.15);
  assert.equal(
    s.soundEvents.some((e) => e.kind === "sword"),
    false,
  );
  assert.equal(s.monsters[0].hp, 1000);
  s.team[0].cooldown = 0;
  s.team[0].spellCooldowns = {};
  castEquipped(s, 0, { x: 445, y: 232 });
  advance(s, 0.15);
  assert.ok(s.soundEvents.some((e) => e.kind === "sword" && e.damage === 12));
});
test("le son d’un projectile retardé conserve sa famille après un nouveau sort", () => {
  const s = setup(2),
    m = s.team[2];
  castEquipped(s, 0, { x: 445, y: 232 });
  m.cooldown = 0;
  m.loadout[0] = "ranged-fire-0";
  castEquipped(s, 0, { x: 420, y: 140 });
  advance(s, 0.5);
  assert.ok(s.soundEvents.some((e) => e.kind === "bow"));
  assert.equal(
    s.soundEvents.some((e) => e.kind === "sword"),
    false,
  );
});
test("un projectile magique produit un impact magique à l’arrivée", () => {
  const s = setup(2);
  s.team[2].loadout[0] = "ranged-water-0";
  castEquipped(s, 0, { x: 445, y: 232 });
  assert.equal(
    s.soundEvents.some((e) => e.kind === "magic"),
    false,
  );
  advance(s, 0.3);
  assert.ok(
    s.soundEvents.some((e) => e.kind === "magic" && e.element === "water"),
  );
});
test("file audio bornée et indépendante des informations de combat", () => {
  const s = createSandbox();
  for (let i = 0; i < 200; i++) emitSound(s, "sword", s.player, { damage: i });
  assert.equal(s.soundEvents.length, 64);
  assert.equal(s.soundEvents[0].damage, 136);
  assert.equal(s.team[0].hp, 100);
});
test("préférences : bornes, données corrompues et stockage indisponible", () => {
  assert.deepEqual(audioPreferences(null), AUDIO_DEFAULTS);
  assert.deepEqual(
    audioPreferences({ master: 2, music: -1, effects: NaN, muted: "oui" }),
    { ...AUDIO_DEFAULTS, master: 1, music: 0 },
  );
  const engine = createAudioEngine({
    Context: null,
    storage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    },
  });
  assert.equal(engine.status, "unsupported");
  engine.configure({ effects: 0.25 });
  assert.equal(engine.preferences.effects, 0.25);
  const s = createSandbox();
  emitSound(s, "bow", s.player);
  engine.process(s);
  assert.equal(s.soundEvents.length, 0);
  engine.destroy();
});
test("partition : boucle complète, mélodie et basse valides, respirations et variations", () => {
  const first = Array.from({ length: MUSIC_STEPS }, (_, i) => musicStep(i));
  assert.deepEqual(
    first,
    Array.from({ length: MUSIC_STEPS }, (_, i) => musicStep(i + MUSIC_STEPS)),
  );
  assert.ok(first.some((n) => n.lead === 0));
  assert.ok(first.some((n) => n.bass));
  assert.ok(first.some((n) => n.bell));
  for (const step of first)
    for (const key of ["lead", "bass", "arp", "bell"])
      if (step[key]) assert.ok(step[key] >= 30 && step[key] <= 96);
});
test("bruit synthétique déterministe : raccords doux, aucune utilisation du hasard du gameplay", () => {
  const context = {
    sampleRate: 1000,
    createBuffer: (_channels, n, rate) => {
      const data = new Float32Array(n);
      return { duration: n / rate, getChannelData: () => data };
    },
  };
  const a = makeNoise(context, 1).getChannelData(0),
    b = makeNoise(context, 1).getChannelData(0);
  assert.deepEqual(a, b);
  assert.equal(a[0], 0);
  assert.equal(a.at(-1), 0);
  assert.ok(a.some((v) => Math.abs(v) > 0.5));
});
