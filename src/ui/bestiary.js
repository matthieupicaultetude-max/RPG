import { monsterElements } from "../data/slime-loot.js";
import { AMBER_SLIME } from "../data/rock-shell.js";
import { monsterAttack, monsterAttackDamage } from "../data/monster-attacks.js";
import { petDefinition } from "../data/pets.js";
import {
  ELEMENTS,
  CORE_CHANCE,
  createCore,
  setForCore,
} from "../data/equipment.js";
import {
  MONSTERS,
  MONSTER_LEVEL_MAX,
  monsterDefinition,
  monsterStats,
  monsterLoot,
} from "../data/monsters.js";
import { itemIcon } from "./inventory.js";
const number = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
function creature(id) {
  return `<svg viewBox="0 0 120 90" role="img" aria-label="${monsterDefinition(id).name}" shape-rendering="crispEdges"><ellipse cx="60" cy="76" rx="38" ry="7" fill="#0d2019" opacity=".5"/>${['cinder-slime','siroccolimon'].includes(id) ? `<path d="M20 70V47h10V30h16V20h30v10h14v17h10v23z" fill="#bd5142"/><path d="M33 38h15V26h20v8H49v10H33z" fill="#f29455"/><path d="M48 48c20-18 40 17 12 22-21 4-24-15-9-18" fill="none" stroke="#ffde94" stroke-width="4"/><path d="M35 50h8v5h-8m37-5h8v5h-8" fill="#e6efe1"/>${id==='siroccolimon'?'<path d="M36 22V9h9v9h30V9h9v13z" fill="#b29c84"/>':''}` : ["foam-slime","nimbulimon"].includes(id) ? `<path d="M20 70V47h10V30h16V20h30v10h14v17h10v23z" fill="#68c7d7"/><path d="M33 38h15V26h20v8H49v10H33z" fill="#a9ebd7"/><path d="M48 48c20-18 40 17 12 22-21 4-24-15-9-18" fill="none" stroke="#e1fff1" stroke-width="4"/><path d="M35 50h5v8h-5m40-8h5v8h-5" fill="#234c72"/>${id==='nimbulimon'?'<path d="M40 19V8l9 7 10-12 12 12 10-7v13z" fill="#f4e5a5"/>':''}` : id === "wind-slime" ? '<path d="M23 45h10V29h12V20h31v9h12v16h10v28H23z" fill="#8ed8d0"/><path d="M35 39h12V28h27v8H47v10H35z" fill="#d8f5d8"/><path d="M49 45c20-16 38 17 12 22-20 4-23-15-9-18" fill="none" stroke="#d9f8d6" stroke-width="4"/><path d="M39 53h6v8h-6m35-8h6v8h-6z" fill="#326674"/>' : id === "magma-slime" ? '<path d="M23 70 20 51 35 27 55 20 84 30 99 54 94 73z" fill="#c59a4d"/><path d="m21 70 1-29 18-21 15 7-10 24-5 22m31-44 13-10 16 27 2 28-19-4z" fill="#57464c"/><path d="m36 28 4 14-5 14m47-22 5 15" stroke="#ffb957" stroke-width="4"/><path d="m57 38 9 16-7 17-9-13z" fill="#ffcd76"/><path d="M40 54h6v5h-6m29-5h6v5h-6" fill="#fff0a9"/>' : id === "volcano-slime" ? '<path d="m11 73 10-27 20-18 7-21h24l8 25 22 22 8 20-27 9H31z" fill="#56434c"/><path d="m46 13 26-3 7 19-21 8-20-8z" fill="#e57e39"/><path d="m55 25 9 12-5 16 13 22H60L47 52l8-17z" fill="#ffce74"/><path d="M28 55h14v4H28m50-4h14v4H78" fill="#ffe3a0"/><path d="m38 5-9-4m58 14 8-8" stroke="#ffbd68" stroke-width="3"/>' : id === "fire-slime" ? '<path d="M23 45h10V29h12V20h31v9h12v16h10v28H23z" fill="#ef803d"/><path d="M35 39h12V28h27v8H47v10H35z" fill="#ffc966"/><path d="m54 73-8-13 8-17 7 11 6-21 10 27-6 13z" fill="#ffe09a"/><path d="M40 52h5v8h-5m35-8h5v8h-5" fill="#6c322c"/><path d="m30 19 4-10m53 7 3-8m-31 4 3-7" stroke="#ffc966" stroke-width="3"/>' : id === "mountain-slime" ? '<path d="m22 70-4-15 14-23 18-9h26l15 11 12 25-5 12z" fill="#c59a4d"/><path d="m21 62 1-22 16-24 23-1 8 21-15 17-8 18z" fill="#697a7d"/><path d="m28 40 14-20h15l-3 14-15 14z" fill="#b2bbb0"/><path d="m67 35 9-21 17 10 14 31-7 18-24-8z" fill="#7b8d8c"/><path d="m77 19 12 9 8 21-18-7z" fill="#bcc2ac"/><path d="m39 28-4 15m49-8 2 18" stroke="#d8bb7c" stroke-width="3"/><path d="M39 55h5v8h-5m34-8h5v8h-5z" fill="#463c2e"/>' : id === "gorgelimon" ? '<path d="M14 70 10 52l10-20 13-5 9-13h37l9 13 12 8 11 20-6 16z" fill="#367c91"/><path d="m19 58 15-15 17 12 10 18H20z" fill="#978057"/><path d="m29 30 5-19 9 22m14-13 5-18 9 22m17 8 5-19 9 24" fill="#8da4a6"/><path d="m58 38 12 13-2 18-13 7-10-17 2-15z" fill="#a8e7e4"/><path d="m60 42 2 11-5 9 5 9" stroke="#f1d28e" fill="none"/><path d="M27 46h10v5H27m54-5h10v5H81" fill="#e5d8a4"/>' : id === "firefly" || id === "moth" ? `<path d="M53 35 28 20 15 33l10 23 28-3M67 35l25-15 13 13-10 23-28-3" fill="${id === "firefly" ? "#e5a96a" : "#accb9f"}"/><path d="M51 30h18v40H51z" fill="${id === "firefly" ? "#bd704b" : "#6b9795"}"/><path d="M55 61h10v11H55z" fill="#f0da8f"/><path d="M54 27v-9m12 9v-9" stroke="#e9ddae" stroke-width="3"/><path d="M54 38h3v4h-3m9-4h3v4h-3" fill="#243a36"/>` : ["slime", "marsh-slime", "depths-water-slime", "depths-earth-slime"].includes(id) ? `<path d="M23 45h10V29h12V20h31v9h12v16h10v28H23z" fill="${id === "depths-earth-slime" ? AMBER_SLIME.base : id === "depths-water-slime" ? "#4d9dbc" : "#82ad82"}"/><path d="M35 39h12V28h27v8H47v10H35z" fill="${id === "depths-earth-slime" ? AMBER_SLIME.light : id === "depths-water-slime" ? "#a1e5ec" : "#b1cd94"}"/>${id === "depths-earth-slime" ? '<path d="M22 65 24 41 38 22l15 4-6 22-11 24zM77 26l15 9 10 28-11 11-15-8z" fill="#7b8d8c"/><path d="m28 40 12-13 7 2-8 14zm53-7 7 6 7 19-14-8z" fill="#bcc2ac"/>' : ""}<path d="M44 53h6v9h-6zm27 0h6v9h-6z" fill="#425847"/><path d="M55 65h11v3H55z" fill="#2f6557"/>` : '<path d="M23 35h12V23h11v9h30v-9h11v14h9v33H23z" fill="#8b6754"/><path d="M37 32h40v12H37z" fill="#b18a68"/><path d="M23 65h12v12H23zm54 0h12v12H77z" fill="#594638"/><path d="M35 48h6v7h-6zm33 0h6v7h-6z" fill="#253e38"/><path d="M46 54h18v15H46z" fill="#bc8f77"/><path d="M33 58v10h9v-6zm43 0v10h-9v-6z" fill="#e4d6ae"/>'}</svg>`;
}
export function bestiaryValues(id, level) {
  const s = monsterStats(id, level);
  return {
    maxHp: number(s.maxHp),
    damage: number(monsterAttackDamage({ ...s, species: id })),
    attackDelay: `${number(monsterAttack({ species: id }).recovery)} s`,
    speed: `${s.speed} px/s`,
    detection: `${s.detection} px`,
    respawnDelay:
      id.startsWith("depths-") ||
      id === "gorgelimon" ||
      id === "magma-slime" ||
      id === "volcano-slime" || id === "foam-slime" || id === "nimbulimon" || id === "cinder-slime" || id === "siroccolimon"
        ? "Nouvelle expédition"
        : `${s.respawnDelay} s`,
    xp: `${number(s.xp)} XP`,
    gold: `${number(s.gold)} pièces`,
  };
}
export function coreDropMarkup(id, level) {
  const monster = monsterDefinition(id);
  if (monster.boss)
    return "<h3>Butin du boss</h3><p>Aucun butin pour le moment : ni ressource, ni équipement, ni noyau.</p>";
  const elements = monsterElements(monster),
    core = createCore(elements[0], level),
    set = setForCore(core);
  return `<h3>${elements.length === 1 ? `Noyau de ${ELEMENTS[elements[0]].name}` : "Noyaux des éléments du slime"}</h3><p>Bonus indépendant : ${number(CORE_CHANCE * 100)} % au total. ${elements.length > 1 ? "L’élément est celui de la ressource tirée pour cette victoire." : ""} Tranche ${core.band.min}–${core.band.max} · ${set ? set.name + " et équipements de cette tranche" : "Équipements de cette tranche à venir"}.</p>${elements
    .map((element) => {
      const e = ELEMENTS[element],
        c = createCore(element, level);
      return `<div class="monster-loot">${itemIcon("Noyau", false, e.color, c)}<div><strong>Noyau de ${e.name}</strong><small>${e.stat} · Standard uniquement</small></div><b>${number((CORE_CHANCE * 100) / elements.length)} %</b></div>`;
    })
    .join(
      "",
    )}<p>Ouverture possible partout depuis le sac. Un équipement standard aléatoire de l’élément et de la tranche ; doublons possibles. Les ressources ont une variante chromatique, les noyaux restent standards.</p>`;
}
const combatNote = (id) =>
  id === "wind-slime"
    ? "Aspiration 78 px, explosion Air 43 px, deux bonds de rayon 23 px. Récupération de 3,2 s après le second. Immobilisation pendant gonflement ou pause : cycle interrompu."
    : id === "magma-slime"
      ? "Carapace −40 % : après 25 % des PV maximaux en dégâts reçus, explosion annoncée puis projections de magma persistant."
      : id === "volcano-slime" || id === "foam-slime" || id === "nimbulimon" || id === "cinder-slime" || id === "siroccolimon"
        ? "Invocations Terre/Feu à 120–180 px et invulnérabilité. Une explosion de carapace de sa propre invocation au contact du boss ouvre 8 s de vulnérabilité. Si toutes meurent sans le débloquer, une nouvelle vague arrive. Sous 40 % de PV : trois invocations au lieu de deux. Aucune XP ni loot sur les invocations."
        : id === "fire-slime"
          ? "Braises : 0,35 s d’annonce, 4 s actives, une touche au maximum toutes les 0,6 s. Explosion à la mort : 0,9 s d’annonce, rayon de 36 px. Tous les dégâts sont de type Feu."
          : id === "mountain-slime"
            ? "Carapace intacte : dégâts reçus −40 %. Collision contre rocher ou paroi : cœur exposé 3 s (+50 % de dégâts), puis protection perdue jusqu’à la réapparition."
            : id === "gorgelimon"
              ? "Boss de niveau 8 en jeu. Deux scissions à 70 % et 35 % de PV. Son cœur est protégé jusqu’à 12 secondes pendant la scission ; détruire tous les aspects l’expose pendant 5 secondes."
              : id.startsWith("depths-")
                ? "Statistiques pour la taille 1. Fusions jusqu’à la taille 3 ; une fusion mixte alterne bond Eau et roulade Terre. Les formes avec de la Terre portent une carapace −40 %, brisable contre la roche. Les slimes vaincus restent morts pendant cette expédition."
                : id === "marsh-slime"
                  ? "Statistiques affichées pour la taille 1. Absorption : jusqu’à trois tailles ; un saut raté expose les gros slimes pendant 2,5 s."
                  : "";
export const BESTIARY_CATEGORIES = Object.freeze([
  { id: "slime", name: "Slime" },
  { id: "beast", name: "Bêtes" },
  { id: "insect", name: "Insectes" },
]);
export function renderBestiaryNavigation(selectedId) {
  const selected = monsterDefinition(selectedId);
  return `<nav class="monster-list" aria-label="Catégories du bestiaire">${BESTIARY_CATEGORIES.map(
    (category) => {
      const members = MONSTERS.filter((m) => m.category === category.id);
      return `<details class="bestiary-category" data-category="${category.id}" ${selected.category === category.id ? "open" : ""}><summary>${category.name}<span>${members.length}</span></summary><div class="bestiary-category-content">${[
        { id: "normal", name: "Monstres normaux", boss: false },
        { id: "boss", name: "Boss", boss: true },
      ]
        .map((group) => {
          const list = members.filter((m) => !!m.boss === group.boss);
          return list.length
            ? `<section class="bestiary-monster-group" data-monster-group="${group.id}"><h3>${group.name}</h3><div class="bestiary-group-buttons">${list.map((m) => `<button data-monster="${m.id}" aria-pressed="${m.id === selectedId}">${creature(m.id)}<span><strong>${m.name}</strong><small>${m.boss ? "Boss" : m.elements ? m.elements.map((e) => ELEMENTS[e].name).join(" / ") : ELEMENTS[m.element].name}</small></span></button>`).join("")}</div></section>`
            : "";
        })
        .join("")}</div></details>`;
    },
  ).join("")}</nav>`;
}
function resourcePurpose(monster, item) {
  if (!item.chromatic) return "";
  const pet = petDefinition(item.element || monster.element);
  if (item.type === "rare" && pet?.food === item.name)
    return `<small class="resource-purpose">Nourrit ${pet.name}</small>`;
  if (
    item.type === "normal" &&
    (monster.id === "slime" ||
      ["boar", "firefly", "moth"].includes(monster.id) ||
      item.element === "water")
  )
    return '<small class="resource-purpose">Craft des armures chromatiques</small>';
  return "";
}
function lootMarkup(monster, level) {
  if (monster.boss)
    return `<section class="monster-drops no-boss-loot">${coreDropMarkup(monster.id, level)}</section>`;
  const multiple =
    monster.category === "slime" && monsterElements(monster).length > 1;
  return `<section class="monster-drops"><h3>Butins possibles</h3><p>Un objet par victoire. ${multiple ? "Un des deux éléments est choisi à parts égales, puis la rareté et la variation chromatique sont tirées." : "La variation chromatique est tirée indépendamment de la rareté."} ${monster.category === "slime" ? "Les slimes du même élément partagent leur gelée et leur cœur." : ""}</p><div class="monster-loot-grid">${monsterLoot(
    monster.id,
  )
    .map(
      (item) =>
        `<div class="monster-loot ${item.chromatic ? "chromatic" : ""}">${itemIcon("", item.chromatic, null, item)}<div><strong>${item.name}${item.chromatic ? " chromatique" : ""}</strong><small>${item.type === "rare" ? "Rare" : "Normal"}${item.chromatic ? " · Chromatique" : " · Standard"}${item.element ? " · " + ELEMENTS[item.element].name : ""}</small>${resourcePurpose(monster, item)}</div><b>${number(item.chance * 100)} %</b></div>`,
    )
    .join(
      "",
    )}</div></section><section class="monster-drops bestiary-core">${coreDropMarkup(monster.id, level)}</section>`;
}
export function renderBestiary(id, level) {
  const monster = monsterDefinition(id),
    stats = monsterStats(id, level),
    values = bestiaryValues(id, level);
  const names = {
    maxHp: "Points de vie",
    damage: "Dégâts de l’attaque",
    attackDelay: "Repos après l’attaque",
    speed: "Vitesse en poursuite",
    detection: "Rayon d’engagement",
    respawnDelay: "Réapparition",
    xp: "Expérience gagnée",
    gold: "Or obtenu",
  };
  const attack = monsterAttack({ species: id }),
    kindText =
      attack.kind === "furnace-cycle"
        ? "Charge Feu en couloir, puis souffle Air en cône : visée brève suivie d’une seconde verrouillée pour esquiver. Les braises déplacées et explosions sont annoncées au sol."
        : attack.kind === "storm-cycle"
        ? "Bond Eau sur le héros isolé, aspiration, explosion Air puis ricochets Air et Eau. Dernier impact sur dalle sèche : esquivez pour exposer le cœur."
        : attack.kind === "wind-cycle"
        ? "Gonflement et aspiration, explosion proche puis deux atterrissages annoncés et verrouillés"
        : attack.kind === "leap"
          ? "Cercle d’atterrissage sur le membre le plus éloigné du centre du groupe"
          : attack.kind === "eruption"
            ? "Éruptions de slimes sur des cercles fixes, puis vols balistiques"
            : attack.kind === "charge"
              ? "Couloir de charge, cible et direction figées"
              : "Tornade mobile, trajectoire figée";
  return `<div class="bestiary-heading"><div><p class="eyebrow">LES CRÉATURES D’AURORIA</p><h2>Bestiaire</h2></div><span>${MONSTERS.length} espèces</span></div><div class="bestiary-layout">${renderBestiaryNavigation(id)}<article class="monster-sheet"><div class="monster-identity">${creature(id)}<div><p class="eyebrow">${monster.category === "slime" ? "Slime · " : ""}${monster.boss ? "Boss" : monster.family}</p><h3>${monster.name}</h3><span>${monster.habitat} · ${monster.elements ? monster.elements.map((e) => ELEMENTS[e].name).join(" / ") : ELEMENTS[monster.element].name + " / " + ELEMENTS[monster.element].stat}</span><p>${monster.description}</p></div></div><div class="monster-level"><label for="monster-level">Niveau de consultation <output id="monster-level-value" for="monster-level">${stats.level}</output></label><input id="monster-level" type="range" min="1" max="${MONSTER_LEVEL_MAX}" step="1" value="${stats.level}"><div><span>1</span><span>${MONSTER_LEVEL_MAX}</span></div><small>Aperçu uniquement : le niveau réel dépend de la zone (jardin 1, marais 3, montagnes, alizés, braises et profondeurs 5, magma et écume 6, Pyroclaste 9, Nimbulimon et Siroccolimon 10).</small></div><section class="monster-ability"><h3>${attack.name} · ${ELEMENTS[attack.element].name}</h3><p>Prévisualisation : ${number(attack.windup)} s · ${kindText}. Une même attaque ne touche chaque personnage qu’une fois.</p>${combatNote(id) ? `<p>${combatNote(id)}</p>` : ""}</section><dl class="monster-stats">${Object.entries(
    names,
  )
    .map(
      ([key, label]) =>
        `<div><dt>${label}</dt><dd data-monster-stat="${key}">${values[key]}</dd></div>`,
    )
    .join(
      "",
    )}</dl>${lootMarkup(monster, stats.level)}<p class="panel-hint">Statistiques et probabilités de test. Par niveau supplémentaire : PV +12 %, dégâts +8 %, XP +10 %, or +5 % des valeurs du niveau 1, arrondis à l’entier. Vitesse et délais restent fixes.</p></article></div>`;
}
