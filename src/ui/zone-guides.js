import { disclosure } from "./organization.js";
export const ZONE_GUIDES = [
  {
    zone: "slime-marsh",
    id: "marsh",
    title: "Marais de Gelée",
    element: "Eau",
    rule: "Les fleurs font grossir les slimes.",
    tips: [
      "Évitez les bassins et fleurs éponges : les slimes y grandissent, jusqu’à 3 tailles.",
      "Faites rater le saut d’un gros slime : il perd une taille et libère un petit.",
      "Profitez de ses 2,5 s de vulnérabilité : dégâts +50 %.",
    ],
    access: "Sortie sud-est du village. Cascade vers la Crevasse avec sa clé.",
    details:
      "Les sauts laissent une flaque pendant 18 s. Les fleurs se rechargent en 10 s. La pluie est une ambiance visuelle.",
  },
  {
    zone: "slime-mountains",
    id: "mountain",
    title: "Cimes de Schiste",
    element: "Terre",
    rule: "Brisez la carapace contre un rocher.",
    tips: [
      "La carapace réduit les dégâts de 40 %.",
      "Placez un obstacle derrière vous, puis esquivez la charge annoncée.",
      "Le choc expose le cœur 3 s : dégâts +50 %.",
    ],
    access: "Depuis le village. Passages vers les Braises et les Alizés.",
    details:
      "La carapace reste brisée jusqu’à la réapparition. Le bord d’un précipice ne la brise pas.",
  },
  {
    zone: "slime-fire",
    id: "fire",
    title: "Champs de Braise",
    element: "Feu",
    rule: "Continuez à esquiver après le coup fatal.",
    tips: [
      "Les déplacements laissent des braises pendant 4 s.",
      "À sa mort, un slime explose après 0,9 s.",
      "La lave est infranchissable ; suivez les zones d’impact.",
    ],
    access:
      "Depuis les montagnes. Clés requises pour le Volcan et les Vents Rouges.",
    details:
      "Les traînées s’allument après 0,35 s. Les brûlures superposées ne se cumulent pas : une touche maximum toutes les 0,6 s.",
  },
  {
    zone: "slime-wind",
    id: "wind",
    title: "Hauts des Alizés",
    element: "Air",
    rule: "Sortez de l’aspiration, puis évitez les deux ricochets.",
    tips: [
      "Le slime se gonfle pendant 1,8 s avant son souffle.",
      "Les deux points d’atterrissage sont annoncés et restent fixes.",
      "Immobilisez-le avant son envol pour interrompre le cycle.",
    ],
    access:
      "Depuis les montagnes. Passage est vers les Tempêtes, avec leur clé.",
    details:
      "L’aspiration ne traverse pas les obstacles. Les ponts relient les trois plateaux.",
  },
  {
    zone: "slime-depths",
    id: "depths",
    title: "Donjon de la Crevasse",
    element: "Eau / Terre",
    rule: "Séparez les slimes avant leur fusion.",
    tips: [
      "Deux petits slimes proches fusionnent, jusqu’à la taille 3.",
      "Attirez les charges Terre contre une paroi pour briser la carapace.",
      "Gorgelimon : éliminez ses aspects avant leur réabsorption.",
    ],
    access: "Cascade des marais · 1 Clé de la Crevasse pour la troupe.",
    details:
      "Gorgelimon se divise à 70 % et 35 % de PV. Éliminez les aspects en 12 s pour exposer son cœur 5 s (+50 % dégâts). Sinon, les survivants le soignent. Les fusions Eau/Terre peuvent donner le noyau de Gouffre.",
  },
  {
    zone: "slime-volcano",
    id: "volcano",
    title: "Donjon du Volcan",
    element: "Terre / Feu",
    rule: "Faites exploser une invocation sur Pyroclaste.",
    tips: [
      "Les carapaces de magma explosent après assez de dégâts.",
      "Pyroclaste invoque loin de lui et devient invulnérable.",
      "Attirez une invocation près du boss, puis brisez sa carapace : ouverture de 8 s.",
    ],
    access: "Cratère des Braises · 1 Clé du Volcan pour la troupe.",
    details:
      "Seule une explosion de sa propre invocation brise le bouclier. Si toutes meurent sans le débloquer, il en réinvoque. Sous 40 % de PV : 3 invocations au lieu de 2. Le magma reste jusqu’à la sortie ou la défaite.",
  },
  {
    zone: "slime-storm",
    id: "storm",
    title: "Œil des Tempêtes",
    element: "Air / Eau",
    rule: "Guidez le dernier ricochet sur une dalle sèche.",
    tips: [
      "Bassins et fleurs font grandir les slimes d’écume.",
      "Après le bond Eau : aspiration, souffle Air, puis deux ricochets.",
      "Nimbulimon : esquivez le dernier impact sur sol sec pour exposer son cœur 6 s.",
    ],
    access: "Plateau est des Alizés · 1 Clé des Tempêtes pour la troupe.",
    details:
      "Les bassins restaurent la masse du boss. Une seule aspiration à la fois. Les courants sont annoncés 1 s avant de pousser 2 s. Sous 40 % de PV, ceux de l’arène changent plus souvent.",
  },
  {
    zone: "slime-furnace",
    id: "furnace",
    title: "Fournaise des Vents Rouges",
    element: "Feu / Air",
    rule: "Orientez le souffle sur les trois braseros.",
    tips: [
      "Les charges laissent des braises ; le vent les déplace sans les multiplier.",
      "Placez un brasero entre Siroccolimon et vous. Esquivez après le verrouillage du cône.",
      "Les 3 braseros éteints exposent son cœur 8 s : dégâts +50 %.",
    ],
    access: "Sud-est des Braises · 1 Clé des Vents Rouges pour la troupe.",
    details:
      "Vous avez 1 s pour esquiver le souffle verrouillé. Les braseros restent éteints entre les cycles. Sous 40 % de PV, les charges accélèrent. Une explosion déportée reste annoncée 1 s.",
  },
];
function content(g, compact = false) {
  return `<p class="eyebrow">${g.element}</p><h2>${g.title}</h2><p class="guide-rule">${g.rule}</p><ol class="guide-steps">${g.tips.map((t) => `<li>${t}</li>`).join("")}</ol><div class="guide-access"><strong>Accès</strong><p>${g.access}</p></div>${disclosure(`guide-${compact ? "map" : "book"}-${g.id}`, "Règles détaillées", `<p>${g.details}</p>${g.title.includes("Donjon") || ["storm", "furnace"].includes(g.id) ? "<p>Sortie gratuite. Une défaite ramène à l’entrée sans nouvelle clé. Boss : morceau royal garanti, familier à 5 %.</p>" : ""}`)}`;
}
export function renderZoneOverlays() {
  return ZONE_GUIDES.map(
    (g) =>
      `<aside id="${g.id}-guide" class="marsh-guide" aria-label="Guide · ${g.title}" hidden>${content(g, true)}<button data-action="close-${g.id}-guide">Compris</button></aside>`,
  ).join("");
}
export function renderZoneGuides(zone = "slime-marsh") {
  const selected = ZONE_GUIDES.find((g) => g.zone === zone) || ZONE_GUIDES[0];
  return `<div class="panel-heading"><p class="eyebrow">MONDE</p><h2>Guides des zones</h2></div><label class="guide-picker">Zone<select id="guide-zone">${ZONE_GUIDES.map((g) => `<option value="${g.zone}" ${g.zone === selected.zone ? "selected" : ""}>${g.title}</option>`).join("")}</select></label><div class="guide-browser"><nav class="guide-nav" aria-label="Choisir une zone"><h3>Zones élémentaires</h3>${ZONE_GUIDES.filter(
    (g) => !["depths", "volcano", "storm", "furnace"].includes(g.id),
  )
    .map(
      (g) =>
        `<button data-guide-zone="${g.zone}" aria-pressed="${g.zone === selected.zone}">${g.title}<small>${g.element}</small></button>`,
    )
    .join("")}<h3>Donjons</h3>${ZONE_GUIDES.filter((g) =>
    ["depths", "volcano", "storm", "furnace"].includes(g.id),
  )
    .map(
      (g) =>
        `<button data-guide-zone="${g.zone}" aria-pressed="${g.zone === selected.zone}">${g.title}<small>${g.element}</small></button>`,
    )
    .join(
      "",
    )}</nav><article class="guide-content">${content(selected)}</article></div>`;
}
