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
export const STARTER_SETS = Object.freeze(
  Object.entries(ELEMENTS).map(([element, e]) =>
    Object.freeze({
      id: element,
      name: `Panoplie ${e.set}`,
      element,
      minLevel: 1,
      band: { min: 1, max: 10 },
      pieces: SET_SLOTS.map((slot) =>
        Object.freeze({
          name: `${slot} de ${e.set}`,
          slot,
          requiredLevel: 1,
          element,
          setId: element,
          setName: `Panoplie ${e.set}`,
          color: e.color,
          stats: {
            [e.stat]: slot === "Arme" ? 5 : slot === "Bouclier" ? 2 : 3,
            Vitalité: slot === "Bouclier" ? 5 : slot === "Arme" ? 1 : 3,
          },
        }),
      ),
    }),
  ),
);
export function setForCore(core) {
  return STARTER_SETS.find(
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
export function equipmentStats(member) {
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
export function characterStats(member) {
  const result=equipmentStats(member);
  for(const [stat,value]of Object.entries(member.allocatedStats||{}))result[stat]=(result[stat]||0)+value;
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
  const bonus = weapon?.element
    ? stats[ELEMENTS[weapon.element].stat]
    : 0;
  return Math.round(
    (baseDamage + (weapon && !weapon.setId ? 5 : 0)) * (1 + (bonus + (stats.Puissance || 0)) / 100),
  );
}
