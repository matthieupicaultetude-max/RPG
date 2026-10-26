import { ELEMENTS, equipmentStats } from "./equipment.js";
const kits = {
  melee: {
    earth: [
      [
        "Frappe de faille",
        "fracture",
        12,
        0.6,
        45,
        "Frappe frontale ; ajoute une Fracture (maximum 3).",
      ],
      [
        "Marteau tellurique",
        "hammer",
        20,
        5,
        45,
        "Consomme les Fractures : +8 dégâts de base par charge. À 3, interrompt la cible.",
      ],
      [
        "Rempart rocheux",
        "guard",
        24,
        10,
        0,
        "Bouclier de 24 pendant 5 s. Les dégâts absorbés renforcent le prochain Marteau.",
      ],
      [
        "Séisme",
        "quake",
        32,
        0,
        75,
        "Frappe autour de soi, applique 3 Fractures et donne un bouclier par ennemi touché.",
      ],
    ],
    fire: [
      [
        "Entaille ardente",
        "ember",
        11,
        0.8,
        45,
        "Arc de Feu ; ajoute une Braise de 4 s, maximum 3.",
      ],
      [
        "Déflagration",
        "detonate",
        15,
        5,
        45,
        "Consomme les Braises, inflige leurs dégâts restants et explose sur les voisins.",
      ],
      [
        "Charge du brasier",
        "fireDash",
        10,
        7,
        70,
        "Charge vers la visée et embrase les ennemis traversés.",
      ],
      [
        "Fournaise",
        "furnace",
        5,
        0,
        65,
        "Pendant 7 s, une fournaise vous suit et applique des Braises aux ennemis.",
      ],
    ],
    air: [
      [
        "Taille croisée",
        "crosscut",
        8,
        0.7,
        45,
        "Deux frappes ; la seconde gagne +10 dégâts de base après un contournement.",
      ],
      [
        "Pas de côté",
        "sidestep",
        0,
        4,
        45,
        "Esquive vers la visée. Passer sur le flanc d’un ennemi prépare Taille croisée.",
      ],
      [
        "Lame tournoyante",
        "spin",
        19,
        5,
        48,
        "Frappe tous les ennemis autour de soi.",
      ],
      [
        "Danse des lames",
        "dance",
        12,
        0,
        85,
        "Quatre frappes autour de la cible ; la seconde activation choisit la sortie.",
      ],
    ],
    water: [
      [
        "Revers de marée",
        "tideSlash",
        12,
        0.8,
        48,
        "Frappe frontale et rapproche les ennemis.",
      ],
      [
        "Garde d’écume",
        "foamGuard",
        25,
        9,
        0,
        "Bouclier de 5 s ; stocke les dégâts absorbés en Écume, maximum 30.",
      ],
      [
        "Vague de rupture",
        "rupture",
        16,
        5,
        65,
        "Repousse ; consomme l’Écume pour renforcer dégâts et boucliers alliés.",
      ],
      [
        "Maelström",
        "maelstrom",
        7,
        0,
        75,
        "Tourbillon de 5 s qui attire les ennemis, puis libère une Vague de rupture.",
      ],
    ],
  },
  support: {
    earth: [
      [
        "Sève réparatrice",
        "sap",
        18,
        2,
        120,
        "Soin ciblé. Le surplus devient un bouclier de 5 s, maximum 15.",
      ],
      [
        "Bastion de pierre",
        "pillar",
        22,
        10,
        110,
        "Pilier de 8 s : intercepte les attaques ennemies proches et protège les alliés à sa création.",
      ],
      [
        "Racines entravantes",
        "roots",
        7,
        7,
        115,
        "Après 0,6 s, immobilise 2 s les ennemis de la zone.",
      ],
      [
        "Sanctuaire ancien",
        "sanctuary",
        24,
        0,
        105,
        "Zone de 7 s : soin initial, boucliers périodiques et renforcement des piliers.",
      ],
    ],
    fire: [
      [
        "Flamme bienveillante",
        "kindFlame",
        14,
        3,
        120,
        "Soin immédiat et régénération de 3 s.",
      ],
      [
        "Sceau incandescent",
        "seal",
        6,
        6,
        125,
        "Marque un ennemi pour 6 s ; les 5 prochains impacts déclenchent du Feu.",
      ],
      [
        "Braise partagée",
        "share",
        0,
        7,
        120,
        "Lie l’allié visé à un ennemi marqué : ses déclenchements soignent cet allié.",
      ],
      [
        "Renaissance du phénix",
        "phoenix",
        24,
        0,
        120,
        "Protège les alliés présents pendant 8 s : chacun survit à un coup fatal et reçoit un soin.",
      ],
    ],
    air: [
      [
        "Souffle réparateur",
        "healingWind",
        16,
        3,
        125,
        "Souffle en ligne qui soigne tous les alliés traversés.",
      ],
      [
        "Permutation",
        "swap",
        16,
        8,
        120,
        "Échange sa position avec l’allié visé et donne un bouclier aux deux.",
      ],
      [
        "Courant ascendant",
        "updraft",
        8,
        7,
        115,
        "Zone de 3 s qui repousse à sa création et bloque les attaques ennemies proches.",
      ],
      [
        "Œil du cyclone",
        "cyclone",
        8,
        0,
        115,
        "Zone de 7 s : soigne au centre et repousse les ennemis sur le bord.",
      ],
    ],
    water: [
      [
        "Source vive",
        "spring",
        6,
        4,
        110,
        "Source de 6 s qui soigne les alliés présents chaque seconde.",
      ],
      [
        "Lien des rivières",
        "riverLink",
        0,
        8,
        120,
        "Lie l’allié visé et le lanceur pendant 8 s : partage 40 % des soins effectifs, sans rebond.",
      ],
      [
        "Onde purificatrice",
        "cleanse",
        16,
        5,
        120,
        "Soigne et dissipe les entraves ; sans entrave, ajoute un soin de 8.",
      ],
      [
        "Grande marée",
        "greatTide",
        28,
        0,
        125,
        "Large vague : soin allié, recul ennemi et prolongation des sources traversées.",
      ],
    ],
  },
  ranged: {
    earth: [
      [
        "Trait perforant",
        "pierce",
        12,
        0.9,
        145,
        "Charge 0,2 s puis tire un projectile traversant les ennemis alignés. Maintenir le clic renforce le tir.",
      ],
      [
        "Éclat de carrière",
        "shatter",
        18,
        4,
        135,
        "Projectile ; à l’impact, éclats en cône derrière la cible.",
      ],
      [
        "Ancrage",
        "anchor",
        0,
        9,
        0,
        "Prépare un tir : rester à moins de 18 du point renforce le prochain Trait de 18 dégâts de base.",
      ],
      [
        "Lance des montagnes",
        "mountain",
        48,
        0,
        180,
        "Ligne annoncée pendant 0,8 s, puis frappe traversante et explosion à son extrémité.",
      ],
    ],
    fire: [
      [
        "Projectile incendiaire",
        "firebolt",
        12,
        0.8,
        140,
        "Projectile de Feu et brûlure de 4 s.",
      ],
      [
        "Bombe de braise",
        "bomb",
        23,
        3,
        120,
        "Bombe après 3 s ; maximum 3 actives. Détonation et explosions voisines la déclenchent.",
      ],
      [
        "Détonation",
        "trigger",
        10,
        1.5,
        145,
        "Tir précis qui déclenche une bombe sur sa trajectoire.",
      ],
      [
        "Pluie de météores",
        "meteors",
        19,
        0,
        145,
        "Cinq impacts annoncés dans la zone ; déclenchent les bombes.",
      ],
    ],
    air: [
      [
        "Lame boomerang",
        "boomerang",
        10,
        0.9,
        135,
        "Projectile qui frappe une fois à l’aller et une fois au retour vers le lanceur.",
      ],
      [
        "Bond arrière",
        "backstep",
        12,
        6,
        125,
        "Recule à l’opposé de la visée et tire un projectile.",
      ],
      [
        "Marque des vents",
        "windMark",
        0,
        5,
        140,
        "Le prochain boomerang sur cette cible rebondit vers un autre ennemi.",
      ],
      [
        "Chasse céleste",
        "skyHunt",
        12,
        0,
        145,
        "Lance trois boomerangs ; leurs retours suivent les déplacements du personnage.",
      ],
    ],
    water: [
      [
        "Orbe de marée",
        "waterOrb",
        12,
        0.9,
        135,
        "Projectile qui laisse une flaque de 7 s à l’impact.",
      ],
      [
        "Courant croisé",
        "crossCurrent",
        10,
        5,
        120,
        "Relie deux flaques par un courant de 4 s qui blesse et entraîne les ennemis.",
      ],
      [
        "Prison de givre",
        "freeze",
        9,
        6,
        125,
        "Consomme la flaque visée : après 0,6 s, dégâts et immobilisation de 2 s.",
      ],
      [
        "Déluge",
        "deluge",
        8,
        0,
        140,
        "Pendant 7 s, agrandit les flaques du lanceur et leur ajoute des pulsations de dégâts.",
      ],
    ],
  },
};
export const SPELLS = Object.freeze(
  Object.entries(kits).flatMap(([role, elements]) =>
    Object.entries(elements).flatMap(([element, rows]) =>
      rows.map(([name, effect, base, cooldown, range, description], index) =>
        Object.freeze({
          id: `${role}-${element}-${index}`,
          role,
          element,
          name,
          effect,
          base,
          cooldown,
          range,
          description,
          ultimate: index === 3,
        }),
      ),
    ),
  ),
);
export const spellById = (id) => SPELLS.find((spell) => spell.id === id);
export const defaultLoadout = (role) =>
  [0, 1, 2, 3].map((index) => `${role}-earth-${index}`);
export function spellAmount(member, spell, base = spell.base) {
  const stats = equipmentStats(member);
  return Math.max(
    0,
    Math.round(
      base *
        (1 +
          ((stats[ELEMENTS[spell.element].stat] || 0) +
            (stats.Puissance || 0)) /
            100),
    ),
  );
}
export function equipSpell(state, memberIndex, slot, id) {
  const member = state.team[memberIndex],
    spell = spellById(id);
  if (
    !member ||
    !spell ||
    spell.role !== member.role ||
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot > 3 ||
    spell.ultimate !== (slot === 3)
  )
    return false;
  if (member.loadout.includes(id) && member.loadout[slot] !== id) return false;
  member.loadout[slot] = id;
  state.revision++;
  return true;
}
