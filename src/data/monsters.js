import {
  SLIME_RESOURCES,
  monsterElements,
  slimeResource,
} from "./slime-loot.js";
export const MONSTER_LEVEL_MAX = 100;
export const MONSTERS = Object.freeze(
  [
    {
      id: "slime",
      category: "slime",
      element: "water",
      name: "Slime",
      family: "Créature gélatineuse",
      habitat: "Clairières du jardin",
      description:
        "Ce slime se comprime avant de bondir sur le personnage le plus isolé de la troupe. Un cercle Eau annonce sa zone d’atterrissage.",
      hp: 45,
      damage: 8,
      attackDelay: 1.2,
      speed: 32,
      patrolSpeed: 14,
      detection: 105,
      respawn: 7,
      xp: 10,
      gold: 5,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "boar",
      element: "earth",
      name: "Sanglier",
      family: "Bête sauvage",
      habitat: "Aire de combat du jardin",
      description:
        "Le sanglier fixe une cible, annonce un couloir Terre puis charge en ligne droite. Écartez-vous avant son départ.",
      hp: 70,
      damage: 8,
      attackDelay: 1.2,
      speed: 32,
      patrolSpeed: 14,
      detection: 105,
      respawn: 7,
      xp: 10,
      gold: 5,
      normal: "Soie de sanglier",
      rare: "Défense ancienne",
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "firefly",
      element: "fire",
      name: "Luciole ardente",
      family: "Insecte de feu",
      habitat: "Lisière du jardin",
      description:
        "La luciole prépare une tornade de Feu. Un couloir annonce sa trajectoire avant son lancement.",
      hp: 35,
      damage: 6,
      attackDelay: 1.2,
      speed: 38,
      patrolSpeed: 16,
      detection: 105,
      respawn: 7,
      xp: 10,
      gold: 5,
      normal: "Poussière de braise",
      rare: "Étincelle vive",
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "moth",
      element: "air",
      name: "Phalène",
      family: "Insecte des vents",
      habitat: "Lisière du jardin",
      description:
        "La phalène canalise une tornade d’Air vers les personnages. Esquivez la trajectoire annoncée au sol.",
      hp: 40,
      damage: 6,
      attackDelay: 1.2,
      speed: 40,
      patrolSpeed: 16,
      detection: 105,
      respawn: 7,
      xp: 10,
      gold: 5,
      normal: "Écaille légère",
      rare: "Aile de zéphyr",
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "marsh-slime",
      category: "slime",
      element: "water",
      name: "Slime des marais",
      family: "Gelée absorbante",
      habitat: "Marais de Gelée",
      description:
        "Ses sauts laissent des flaques qu’il absorbe pour grandir, jusqu’à trois tailles. Plus gros, il frappe plus fort et plus large, mais prépare plus lentement ses bonds. Un gros slime qui manque son saut perd une taille, libère un slime de taille 1 et devient vulnérable. Les fleurs éponges lui donnent du nectar qui le fait grandir, jusqu’à trois tailles.",
      marshSlime: true,
      hp: 100,
      damage: 8,
      attackDelay: 1.2,
      speed: 32,
      patrolSpeed: 14,
      detection: 88,
      respawn: 18,
      xp: 20,
      gold: 8,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "depths-water-slime",
      category: "slime",
      element: "water",
      name: "Slime abyssal",
      family: "Gelée des profondeurs",
      habitat: "Crevasse des profondeurs",
      description:
        "Un slime d’eau très agressif. Ses bonds rapides sont annoncés au sol. Un saut raté le divise s’il dépasse la taille 1. Deux petits slimes proches fusionnent après un avertissement ; une fusion Eau et Terre alterne les deux éléments à chaque bond.",
      depthsSlime: true,
      hp: 105,
      damage: 10,
      attackDelay: 1.2,
      speed: 47,
      patrolSpeed: 19,
      detection: 240,
      respawn: 18,
      xp: 24,
      gold: 10,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "depths-earth-slime",
      category: "slime",
      element: "earth",
      name: "Slime de limon",
      family: "Gelée des profondeurs",
      habitat: "Crevasse des profondeurs",
      description:
        "Cette gelée ambrée porte une carapace qui réduit tous les dégâts de 40 %. Attirez sa roulade Terre contre une stalagmite ou une paroi : la protection se brise et son cœur est exposé 3 secondes (+50 % de dégâts). Elle fusionne avec ses voisins ; les formes mixtes alternent bond Eau et roulade Terre et conservent leur état de carapace lors des scissions.",
      depthsSlime: true,
      hp: 115,
      damage: 10,
      attackDelay: 1.2,
      speed: 44,
      patrolSpeed: 18,
      detection: 240,
      respawn: 18,
      xp: 24,
      gold: 10,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "gorgelimon",
      category: "slime",
      element: "water",
      name: "Gorgelimon, Cœur du gouffre",
      family: "Boss · Eau / Terre",
      habitat: "Crevasse des profondeurs",
      description:
        "Un colosse de gelée et de limon au cœur cristallin. Réveillez-le avec F. Il alterne bond Eau, charge Terre et éboulement annoncé. À 70 % et 35 % de PV, sa carapace se divise en aspects Eau et Terre : éliminez-les en 12 secondes pour exposer son cœur pendant 5 secondes (+50 % de dégâts), sinon il réabsorbe les survivants et se soigne. Un bond raté fissure aussi son cœur pendant 2 secondes. Sa dernière phase accélère ses attaques.",
      boss: true,
      hp: 420,
      damage: 11,
      attackDelay: 1.2,
      speed: 22,
      patrolSpeed: 0,
      detection: 220,
      respawn: 18,
      xp: 120,
      gold: 75,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "mountain-slime",
      category: "slime",
      element: "earth",
      name: "Slime de schiste",
      family: "Gelée cuirassée",
      habitat: "Cimes de Schiste",
      description:
        "Sa carapace réduit tous les dégâts de 40 %. Attirez sa charge roulante vers une paroi ou un gros rocher, puis esquivez le couloir annoncé : la collision brise sa protection et expose son cœur pendant 3 secondes (+50 % de dégâts reçus). La carapace reste brisée jusqu’à sa prochaine réapparition. Un arrêt au bord du vide ne brise pas sa carapace.",
      mountainSlime: true,
      hp: 90,
      damage: 9,
      attackDelay: 1.2,
      speed: 29,
      patrolSpeed: 13,
      detection: 105,
      respawn: 18,
      xp: 22,
      gold: 9,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "fire-slime",
      category: "slime",
      element: "fire",
      name: "Slime de braise",
      family: "Gelée volcanique",
      habitat: "Champs de Braise",
      description:
        "Il sautille et laisse une traînée de feu sur son passage : les braises s’allument après 0,35 seconde et brûlent pendant 4 secondes. Ses bonds Feu annoncent leur zone d’impact. À sa mort, un cercle signale une explosion après 0,9 seconde : écartez-vous même après le coup fatal. Les traînées superposées ne multiplient pas les brûlures.",
      fireSlime: true,
      hp: 95,
      damage: 9,
      attackDelay: 1.2,
      speed: 38,
      patrolSpeed: 18,
      detection: 140,
      respawn: 18,
      xp: 24,
      gold: 10,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "magma-slime",
      category: "slime",
      element: "fire",
      elements: ["earth", "fire"],
      magmaSlime: true,
      name: "Slime de magma",
      family: "Gelée · Terre / Feu",
      habitat: "Donjon du Volcan",
      description:
        "Sa carapace réduit les dégâts de 40 %. Après avoir reçu 25 % de ses PV maximaux en dégâts, elle éclate : un cercle Terre annonce le souffle, puis six projections de magma Feu marquent le sol. Les flaques brûlent sans disparaître au contact et restent jusqu’à la fin de l’expédition. Il bondit, sans roulade.",
      hp: 120,
      damage: 11,
      attackDelay: 1.2,
      speed: 31,
      patrolSpeed: 14,
      detection: 180,
      respawn: 18,
      xp: 30,
      gold: 12,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "volcano-slime",
      category: "slime",
      element: "fire",
      elements: ["earth", "fire"],
      volcanoBoss: true,
      boss: true,
      name: "Pyroclaste, le Slime-Volcan",
      family: "Boss · Terre / Feu",
      habitat: "Donjon du Volcan",
      description:
        "Un volcan vivant au cratère incandescent. Réveillez-le avec F. Il invoque seulement des slimes de magma Terre/Feu à distance et devient invulnérable. Attirez une de ses invocations près de lui, puis faites exploser sa carapace sur le boss : sa protection tombe pendant 8 secondes. Les slimes ordinaires ne comptent pas. Si toutes les invocations meurent sans le débloquer, il en réinvoque. Sous 40 % de PV, il projette trois slimes au lieu de deux. Les invocations ne donnent ni XP ni butin. Le butin du boss sera défini plus tard.",
      hp: 520,
      damage: 13,
      attackDelay: 1.2,
      speed: 0,
      patrolSpeed: 0,
      detection: 250,
      respawn: 18,
      xp: 160,
      gold: 100,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
    {
      id: "wind-slime",
      category: "slime",
      element: "air",
      windSlime: true,
      name: "Slime des alizés",
      family: "Gelée des vents",
      habitat: "Hauts des Alizés",
      description:
        "Il se gonfle pendant 1,8 seconde et attire doucement la troupe dans un rayon annoncé. À pleine taille, il libère une explosion d’Air puis se propulse pour deux bonds en ricochet. Les deux atterrissages sont annoncés dès le début et restent verrouillés : sortez du cercle proche, puis évitez les points 1 et 2. L’immobiliser pendant le gonflement ou la pause entre les bonds interrompt son cycle. Les bords et obstacles bloquent l’aspiration.",
      hp: 100,
      damage: 9,
      attackDelay: 1.2,
      speed: 35,
      patrolSpeed: 16,
      detection: 100,
      respawn: 18,
      xp: 24,
      gold: 10,
      rareChance: 0.2,
      chromaticChance: 0.1,
    },
  ].map((monster) =>
    Object.freeze({
      ...monster,
      ...(monster.category === "slime"
        ? monster.boss
          ? { normal: null, rare: null, rareChance: 0, chromaticChance: 0 }
          : {
              normal: SLIME_RESOURCES[monster.element].normal,
              rare: SLIME_RESOURCES[monster.element].rare,
            }
        : { category: monster.id === "boar" ? "beast" : "insect" }),
    }),
  ),
);
export function monsterDefinition(id) {
  return MONSTERS.find((m) => m.id === id || m.name === id);
}
export function monsterStats(id, requestedLevel = 1) {
  const definition = monsterDefinition(id);
  if (!definition) throw new Error(`Monstre inconnu : ${id}`);
  const level = Math.max(
    1,
    Math.min(MONSTER_LEVEL_MAX, Math.floor(Number(requestedLevel) || 1)),
  );
  const growth = level - 1;
  return {
    level,
    maxHp: Math.round(definition.hp * (1 + growth * 0.12)),
    damage: Math.round(definition.damage * (1 + growth * 0.08)),
    attackDelay: definition.attackDelay,
    speed: definition.speed,
    patrolSpeed: definition.patrolSpeed,
    detection: definition.detection,
    respawnDelay: definition.respawn,
    xp: Math.round(definition.xp * (1 + growth * 0.1)),
    gold: Math.round(definition.gold * (1 + growth * 0.05)),
  };
}
export function createMonster(id, x, y, level = 1) {
  const definition = monsterDefinition(id),
    stats = monsterStats(id, level);
  return {
    category: definition.category,
    element: definition.element,
    species: definition.id,
    name: definition.name,
    ...stats,
    ...(definition.windSlime ? { windSlime: true } : {}),
    ...(definition.elements ? { elements: [...definition.elements] } : {}),
    ...(definition.magmaSlime
      ? { magmaSlime: true, shellBroken: false, shellDamage: 0 }
      : {}),
    ...(definition.volcanoBoss ? { volcanoBoss: true } : {}),
    ...(definition.fireSlime ? { fireSlime: true } : {}),
    ...(definition.mountainSlime
      ? { mountainSlime: true, shellBroken: false }
      : {}),
    ...(definition.boss
      ? { boss: true, bossPhase: "dormant", bossStage: 0 }
      : {}),
    ...(definition.depthsSlime
      ? {
          depthsSlime: true,
          growth: 1,
          shellBroken: false,
          baseMaxHp: stats.maxHp,
        }
      : {}),
    ...(definition.marshSlime
      ? { marshSlime: true, growth: 1, spawnGrowth: 1, baseMaxHp: stats.maxHp }
      : {}),
    x,
    y,
    homeX: x,
    homeY: y,
    hp: stats.maxHp,
    cooldown: 0,
    respawn: 0,
  };
}
export function monsterLoot(id) {
  const m = monsterDefinition(id);
  if (!m) throw new Error(`Monstre inconnu : ${id}`);
  if (m.boss) return [];
  const elements = m.category === "slime" ? monsterElements(m) : [m.element];
  return elements.flatMap((element) =>
    [
      {
        type: "normal",
        chromatic: false,
        chance: (1 - m.rareChance) * (1 - m.chromaticChance),
      },
      {
        type: "normal",
        chromatic: true,
        chance: (1 - m.rareChance) * m.chromaticChance,
      },
      {
        type: "rare",
        chromatic: false,
        chance: m.rareChance * (1 - m.chromaticChance),
      },
      {
        type: "rare",
        chromatic: true,
        chance: m.rareChance * m.chromaticChance,
      },
    ].map((drop) => ({
      ...drop,
      ...(m.category === "slime"
        ? slimeResource(element, drop.type, drop.chromatic)
        : { name: drop.type === "rare" ? m.rare : m.normal }),
      chance: drop.chance / elements.length,
    })),
  );
}
