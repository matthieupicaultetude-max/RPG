import { HYBRID_SLIMES } from "./hybrid-slimes.js";
export const ELEMENTS = Object.freeze({
  earth: { name: "Terre", stat: "Force", color: "#7b8d4a", set: "Ronce" },
  fire: { name: "Feu", stat: "Intelligence", color: "#bc6846", set: "Braise" },
  air: { name: "Air", stat: "Agilité", color: "#8eaf94", set: "Brise" },
  water: { name: "Eau", stat: "Chance", color: "#568eaa", set: "Rosée" },
});
export const SET_SLOTS = [
  "Coiffe",
  "Cape",
  "Ceinture",
  "Bottes",
  "Amulette",
  "Anneau 1",
  "Anneau 2",
  "Arme",
  "Bouclier",
];
export const CORE_CHANCE = 0.25;
export function levelBand(level) {
  const min =
    Math.floor((Math.max(1, Math.floor(Number(level) || 1)) - 1) / 10) * 10 + 1;
  return { min, max: min + 9 };
}
// Low-level warrior profile shared by the four classic elemental slime sets.
const PIECE_PROFILE = Object.freeze({
  Coiffe: {
    vitality: 8,
    element: 3,
    wisdom: 1,
    resistances: ["earth", "fire"],
  },
  Cape: { vitality: 7, element: 3, wisdom: 1, resistances: ["air", "water"] },
  Ceinture: { vitality: 6, element: 3, wisdom: 1, ownResistance: 1 },
  Bottes: { vitality: 6, element: 3, resistances: ["earth", "air"] },
  Amulette: {
    vitality: 5,
    element: 4,
    wisdom: 1,
    resistances: ["fire", "water"],
  },
  "Anneau 1": { vitality: 4, element: 3, wisdom: 1, ownResistance: 1 },
  "Anneau 2": { vitality: 4, element: 3, wisdom: 1, ownResistance: 1 },
  Arme: { vitality: 4, element: 6 },
  Bouclier: {
    vitality: 10,
    element: 2,
    resistances: ["earth", "fire", "air", "water"],
  },
});
// Each row is the TOTAL bonus at that piece count, not another cumulative layer.
const BONUS_PROFILE = Object.freeze([
  { pieces: 2, vitality: 4, element: 1 },
  { pieces: 3, vitality: 6, element: 2, ownResistance: 1 },
  { pieces: 4, vitality: 8, element: 3, wisdom: 1, ownResistance: 1 },
  {
    pieces: 5,
    vitality: 10,
    element: 4,
    wisdom: 1,
    resistance: 1,
    ownResistance: 1,
  },
  {
    pieces: 6,
    vitality: 12,
    element: 5,
    wisdom: 2,
    resistance: 1,
    ownResistance: 2,
  },
  {
    pieces: 7,
    vitality: 15,
    element: 6,
    wisdom: 2,
    resistance: 2,
    ownResistance: 2,
  },
  {
    pieces: 8,
    vitality: 18,
    element: 8,
    wisdom: 3,
    resistance: 2,
    ownResistance: 2,
  },
  {
    pieces: 9,
    vitality: 22,
    element: 10,
    wisdom: 4,
    resistance: 3,
    ownResistance: 3,
  },
]);
function warriorStats(element, profile) {
  const e = ELEMENTS[element],
    stats = { Vitalité: profile.vitality, [e.stat]: profile.element };
  if (profile.wisdom) stats.Sagesse = profile.wisdom;
  for (const key of Object.keys(ELEMENTS)) {
    const resistance =
      (profile.resistance || 0) +
      (profile.resistances?.includes(key) ? 1 : 0) +
      (key === element ? profile.ownResistance || 0 : 0);
    if (resistance) stats[`Résistance ${ELEMENTS[key].name}`] = resistance;
  }
  return Object.freeze(stats);
}
export const STARTER_SETS = Object.freeze(
  Object.entries(ELEMENTS).map(([element, e]) =>
    Object.freeze({
      id: element,
      name: `Panoplie ${e.set}`,
      element,
      archetype: "guerrier",
      source: "slime",
      minLevel: 1,
      band: Object.freeze({ min: 1, max: 10 }),
      description: `Panoplie débutante des slimes ${e.name} : vitalité, résistances, ${e.stat} et un peu de sagesse.`,
      bonuses: Object.freeze(
        BONUS_PROFILE.map((profile) =>
          Object.freeze({
            pieces: profile.pieces,
            stats: warriorStats(element, profile),
          }),
        ),
      ),
      pieces: Object.freeze(
        SET_SLOTS.map((slot) =>
          Object.freeze({
            name: `${slot} de ${e.set}`,
            slot,
            requiredLevel: 1,
            element,
            setId: element,
            setName: `Panoplie ${e.set}`,
            color: e.color,
            stats: warriorStats(element, PIECE_PROFILE[slot]),
          }),
        ),
      ),
    }),
  ),
);
export const BOSS_SETS = Object.freeze(
  Object.values(HYBRID_SLIMES).map((h) => {
    const statBlock = (vitality, characteristic, power, wisdom, resistance) =>
      Object.freeze({
        Vitalité: vitality,
        ...Object.fromEntries(
          h.elements.map((e) => [ELEMENTS[e].stat, characteristic]),
        ),
        Puissance: power,
        Sagesse: wisdom,
        ...Object.fromEntries(
          h.elements.map((e) => [`Résistance ${ELEMENTS[e].name}`, resistance]),
        ),
      });
    return Object.freeze({
      id: h.id,
      name: `Panoplie ${h.name}`,
      element: h.elements[0],
      elements: h.elements,
      minLevel: 10,
      band: Object.freeze({ min: 10, max: 19 }),
      source: h.boss,
      archetype: "biélément",
      description: `Panoplie de niveau 10 · ${h.elements.map((e) => ELEMENTS[e].name).join(" / ")}.`,
      pieces: Object.freeze(
        SET_SLOTS.map((slot, i) =>
          Object.freeze({
            name: `${slot} de ${h.name}`,
            slot,
            requiredLevel: 10,
            element: h.elements[0],
            elements: [...h.elements],
            setId: h.id,
            setName: `Panoplie ${h.name}`,
            color: h.color,
            stats: statBlock(
              [18, 16, 14, 14, 12, 10, 10, 12, 22][i],
              [5, 5, 5, 5, 7, 5, 5, 9, 4][i],
              i === 7 ? 3 : 1,
              i === 3 || i === 7 ? 1 : 2,
              i === 8 ? 2 : 1,
            ),
          }),
        ),
      ),
      bonuses: Object.freeze(
        Array.from({ length: 8 }, (_, i) =>
          Object.freeze({
            pieces: i + 2,
            stats: statBlock(
              6 + i * 4,
              2 + i * 2,
              1 + Math.floor(i / 2),
              Math.floor((i + 1) / 2),
              Math.floor((i + 1) / 3),
            ),
          }),
        ),
      ),
    });
  }),
);
export const ALL_SETS = Object.freeze([...STARTER_SETS, ...BOSS_SETS]);
export function createHybridCore(id) {
  const h = HYBRID_SLIMES[id];
  if (!h) throw Error("Noyau biélément inconnu");
  return {
    kind: "core",
    setId: id,
    name: `Noyau de ${h.name}`,
    element: h.elements[0],
    elements: [...h.elements],
    band: { min: 10, max: 19 },
    chromatic: false,
    quantity: 1,
    color: h.color,
  };
}
export function equippedSetCount(member, set) {
  return set.pieces.filter((piece) => {
    const item = member.equipment?.[piece.slot];
    return (
      item?.setId === set.id &&
      item.element === set.element &&
      item.slot === piece.slot &&
      item.name === piece.name
    );
  }).length;
}
export function setProgress(member, setId) {
  const set = ALL_SETS.find((s) => s.id === setId);
  if (!set) return null;
  const count = equippedSetCount(member, set),
    active =
      [...set.bonuses].reverse().find((tier) => tier.pieces <= count) || null,
    next = set.bonuses.find((tier) => tier.pieces > count) || null;
  return { set, count, active, next };
}
export const wornSets = (member) =>
  ALL_SETS.map((set) => setProgress(member, set.id)).filter(
    (progress) => progress.count > 0,
  );
export function setBonusStats(member) {
  const result = {};
  for (const progress of wornSets(member))
    for (const [stat, value] of Object.entries(progress.active?.stats || {}))
      result[stat] = (result[stat] || 0) + value;
  return result;
}
export function setForCore(core) {
  return (
    core.setId ? BOSS_SETS.filter((set) => set.id === core.setId) : STARTER_SETS
  ).find(
    (set) =>
      set.element === core.element &&
      set.band.min === core.band.min &&
      set.band.max === core.band.max,
  );
}
export function createCore(element, level = 1) {
  const e = ELEMENTS[element];
  if (!e) throw new Error("Élément inconnu");
  const band = levelBand(level);
  return {
    kind: "core",
    name: `Noyau de ${e.name}`,
    element,
    band,
    chromatic: false,
    quantity: 1,
    color: e.color,
  };
}
export function rollCoreEquipment(core, random = Math.random) {
  const set = setForCore(core);
  if (!set) return null;
  const index = Math.min(
    set.pieces.length - 1,
    Math.max(0, Math.floor(random() * set.pieces.length)),
  );
  return {
    ...set.pieces[index],
    stats: { ...set.pieces[index].stats },
    chromatic: false,
    quantity: 1,
  };
}
export function rawEquipmentStats(member) {
  const result = {
    Vitalité: 0,
    Force: 0,
    Intelligence: 0,
    Agilité: 0,
    Chance: 0,
  };
  for (const item of Object.values(member.equipment))
    for (const [key, value] of Object.entries(item.stats || {}))
      result[key] = (result[key] || 0) + value;
  return result;
}
export function equipmentStats(member) {
  const result = rawEquipmentStats(member);
  for (const [stat, value] of Object.entries(setBonusStats(member)))
    result[stat] = (result[stat] || 0) + value;
  return result;
}
export function characterStats(member) {
  const result = equipmentStats(member);
  for (const [stat, value] of Object.entries(member.allocatedStats || {}))
    result[stat] = (result[stat] || 0) + value;
  return result;
}
export function syncEquipmentHealth(member) {
  const oldBonus = member.equipmentHp || 0;
  const nextBonus = characterStats(member).Vitalité;
  member.maxHp = member.maxHp - oldBonus + nextBonus;
  member.equipmentHp = nextBonus;
  member.hp = Math.min(member.hp, member.maxHp);
}

export function weaponDamage(member, baseDamage = 12) {
  const weapon = member.equipment.Arme;
  const stats = characterStats(member);
  const bonus = weapon?.element ? stats[ELEMENTS[weapon.element].stat] : 0;
  return Math.round(
    (baseDamage + (weapon && !weapon.setId ? 5 : 0)) *
      (1 + (bonus + (stats.Puissance || 0)) / 100),
  );
}
