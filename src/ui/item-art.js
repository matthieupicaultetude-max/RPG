import { CHROMATIC_COLORS } from '../data/chromatic.js';
// Original, name-driven inventory art. Geometry is shared by bag, slots and bestiary.
const PALETTES = {
  earth: {
    base: "#7b8d4a",
    light: "#c2c88a",
    dark: "#4e5d35",
    metal: "#c1a875",
    gem: "#a4bd65",
  },
  fire: {
    base: "#bc6846",
    light: "#f1bc72",
    dark: "#733e36",
    metal: "#d8ad6b",
    gem: "#ffda83",
  },
  air: {
    base: "#8eaf94",
    light: "#e0e4be",
    dark: "#4e7775",
    metal: "#bdc9aa",
    gem: "#c6ebcf",
  },
  water: {
    base: "#568eaa",
    light: "#b2d8de",
    dark: "#345e7b",
    metal: "#b7c6be",
    gem: "#9ce0df",
  },
  neutral: {
    base: "#8e805c",
    light: "#e2cca0",
    dark: "#574c3d",
    metal: "#c6bd9c",
    gem: "#cfb37a",
  },
};
const path = (d, fill, stroke = "#493f35", width = 1) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
export function elementSigil(
  element,
  x = 0,
  y = 0,
  scale = 1,
  color = "#f0deb0",
) {
  const shapes = {
    earth: "M16 8c-8 0-10 7-8 13 7 2 15-4 14-11l-6-2zM9 22l11-11m-8 7v-5m3 2h5",
    fire: "M17 6c3 7-2 6 3 10l2-4c7 10-2 16-8 13-8-4-5-10 0-13l-1 7c6-4 1-8 4-13z",
    air: "M23 7C10 5 6 16 8 23c8 3 17-6 15-16zM7 26l14-16M11 20l7 1m-3-5 6 1",
    water:
      "M16 6c-2 5-9 10-9 15 0 9 18 9 18 0 0-5-7-10-9-15zM11 20c-2 4 2 5 4 5",
  };
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" stroke="#3e4d4266" stroke-width="1">${path(shapes[element] || shapes.earth, color, "#3e4d4277")}</g>`;
}
function equipmentArt(item, p) {
  const slot = item.slot || "",
    element = item.element;
  const emblem = elementSigil(element, 8, 8, 0.5, p.gem);
  if (slot === "Coiffe") {
    if (element === "earth")
      return (
        path("M4 23 6 13l4 3 2-11 5 9 6-8 1 11 5-2-1 9z", p.base) +
        path("M5 23h23v4H5z", p.metal) +
        elementSigil(element, 8, 8, 0.5, p.gem)
      );
    if (element === "fire")
      return (
        path("m4 24 3-14 5 4 4-11 5 11 5-4 2 14z", p.dark) +
        path("M7 18h18v9H7z", p.base) +
        path("m16 7 3 12-3 6-3-6z", p.light)
      );
    if (element === "air")
      return (
        path("M4 25 8 13l12-4 7 16z", p.base) +
        path("M17 13 24 3l5 2-7 15z", p.light) +
        path("M3 24h26v4H3z", p.metal)
      );
    if (element === "water")
      return (
        path("M5 27V15c0-16 22-16 22 0v12l-6-4H11z", p.base) +
        path("M9 24v-9c0-10 14-10 14 0v9l-7-4z", p.dark) +
        elementSigil(element, 10, 1, 0.35, p.gem)
      );
    return path("M4 25 7 12h18l3 13z", p.metal) + path("M7 11h18v7H7z", p.base);
  }
  if (slot === "Cape")
    return (
      path(
        element === "air"
          ? "M11 5 4 29l7-4 4 3 4-5 9 4-7-22z"
          : "M10 4 3 28l8-3 5 4 5-4 8 3-7-24z",
        p.base,
      ) +
      path("m10 4 6 8 6-8M16 12v13", p.dark) +
      emblem +
      path("m6 25 5-2 5 3 5-3 5 2", "none", p.light)
    );
  if (slot === "Ceinture")
    return (
      path("M2 12h28v12H2z", p.dark) +
      path("M3 13h26v3H3z", p.base) +
      path("M10 9h12v18H10z", p.metal) +
      emblem
    );
  if (slot === "Bottes")
    return (
      path("M6 4h8v17l4 3v5H2v-7l4-3zm13 0h8v17l4 3v5H19z", p.dark) +
      path("M6 6h8v7H6zm13 0h8v7h-8z", p.base) +
      path(
        element === "air"
          ? "M4 10 0 5l7 2M24 12l7-6-4 10"
          : "M6 5h8v3H6zm13 0h8v3h-8z",
        p.light,
      ) +
      path("M3 26h13m5 0h9", "none", p.metal)
    );
  if (slot.startsWith("Anneau"))
    return (
      `<ellipse cx="16" cy="21" rx="9" ry="8" fill="none" stroke="${p.dark}" stroke-width="5"/><ellipse cx="16" cy="20" rx="9" ry="8" fill="none" stroke="${p.metal}" stroke-width="3"/>` +
      (slot.endsWith("2")
        ? path("m9 7 4-4 4 5-4 6zm9 2 4-4 4 5-4 6z", p.gem)
        : path("m16 3 7 7-7 8-7-8z", p.gem)) +
      path("m13 8 3-3 2 3", "none", p.light)
    );
  if (slot === "Amulette")
    return (
      path("M5 3v9l11 11 11-11V3", "none", p.metal, 2) +
      path("m16 13 10 9-10 9-10-9z", p.dark) +
      elementSigil(element, 7, 13, 0.55, p.gem)
    );
  if (slot === "Bouclier")
    return (
      path(
        element === "earth"
          ? "M16 3 29 7l-3 15-10 9L6 22 3 7z"
          : "M16 2 28 7v13l-12 11L4 20V7z",
        p.metal,
      ) +
      path("m16 6 9 4v9l-9 8-9-8v-9z", p.base) +
      elementSigil(element, 6, 6, 0.63, p.gem)
    );
  if (slot === "Arme") {
    if (element === "earth")
      return (
        path("m5 29 16-22 5 4L9 31z", p.dark) +
        path("m15 16-6-2 8-2-1-6 6 3 4-5 3 9-6 3z", p.base) +
        path("m21 9 4 3-5 7", "none", p.light)
      );
    if (element === "fire")
      return (
        path("M3 29 22 10l-1-5 8-3-2 9-5 2L7 32z", p.metal) +
        path("m11 25-5-5 3-3 8 8z", p.dark) +
        path("M20 13c-7-2 2-8 0-11 8 4 8 9 3 13z", p.base) +
        path("m23 6 2 4-4 2z", p.gem)
      );
    if (element === "air")
      return (
        path("m5 30 6-10-3-5C15 14 21 6 29 3c0 12-12 20-16 20L9 32z", p.metal) +
        path("M12 21 26 7", "none", p.light, 2) +
        path("m8 20 7 6", "none", p.dark, 3)
      );
    if (element === "water")
      return (
        path("M8 31 20 9l3 1-12 22z", p.dark) +
        path("M20 16C7 8 25-3 29 4c-10-2-14 6-3 6-1 5-4 7-6 6z", p.base) +
        path("M23 4c-8 3-8 8-1 9", "none", p.light, 2)
      );
    return (
      path("M24 3h5v5L11 26l-5-5z", p.metal) +
      path("m4 18 11 11M3 30l7-7", "none", p.dark, 3)
    );
  }
  if (slot === "Familier")
    return (
      path("m5 14-1-9 9 5h6l9-5-1 9v10l-11 7L5 24z", p.base) +
      path("M10 17v3m12-3v3m-9 5h6", "none", p.light, 2)
    );
  if (slot.startsWith("Trophée"))
    return (
      path(
        "M10 3h12v11l-6 6-6-6zM7 6H3v6l8 5m14-11h4v6l-8 5M16 20v7M9 29h14",
        "none",
        p.metal,
        2,
      ) + path("m16 6 3 5-3 4-3-4z", p.gem)
    );
  return path("m16 3 11 10-4 14H9L5 13z", p.base) + emblem;
}
function resourceArt(item) {
  const c = item.chromatic;
  switch (item.name) {
    case "Éclat de schiste":
      return path('m3 25 4-15 13-7 9 11-6 15-13 1z',c?'#a28bc5':'#7b8d8c')+path('m7 10 12 6 10-2m-10 2-9 14','none',c?'#d9b9ed':'#c3c7ac',2)+path('m10 14 2 8m7-13 2 4','none','#d8bb7c',2);
    case "Cœur d’ambre":
      return path('m16 2 11 8 2 13-13 8-12-8 2-13z',c?'#b68dd1':'#9c6e32')+path('m16 6 7 7-2 10-5 4-7-6 1-9z',c?'#efc8f4':'#ebc37a')+path('m12 12 4-3 3 5-4 6-3-2z',c?'#bb7ebc':'#ac8745')+path('m10 11 1 7','none','#fff0c2',2);

    case "Éclat de carapace abyssale":
      return path('m3 24 5-14 8-7 11 11-3 14-12 2z',c?'#9e84bf':'#667c80')+path('m8 11 8 6 10-3m-10 3-4 13','none',c?'#d9b5ef':'#b5c9ba',2)+path('m8 23 6 3 8-3','none','#958461',2);
    case "Cœur de Gorgelimon":
      return path('m16 1 11 11-2 14-10 5L5 21 4 11z',c?'#a17dc2':'#315e78')+path('m16 5 7 9-2 10-6 3-6-9 1-8z',c?'#edc9f4':'#a8e7e4')+path('m16 6 2 8-4 5 2 6','none','#f1d28e',2);

    case "Gelée abyssale":
      return path('M3 24 7 13l6-6h8l4 7 4 10-5 5H8z',c?'#b89bd9':'#4d9dbc')+path('m8 20 4-7h7l3 6','none',c?'#e5c6f2':'#a1e5ec',2);
    case "Limon humide":
      return path('M3 25 6 17l6-5 8 1 6 6 4 7-7 4H9z',c?'#9c88c4':'#a38b60')+path('m10 20 3-3 5 1m3 5 3 2','none',c?'#d7b7e8':'#e0c994',2);
    case "Perle des profondeurs":
    case "Géode suintante": {
      const earth=item.name==='Géode suintante';
      return path('m16 3 11 7 2 13-13 7-12-8 2-12z',c?'#9a74bf':earth?'#7f7059':'#356e94')+path('m16 8 7 6-2 9-6 3-7-7 3-8z',c?'#e3bbf4':earth?'#d7c48e':'#b3e6ed')+path('m10 12 4-2','none','#f2efd7',2);
    }

    case "Gelée":
      return (
        path(
          "M3 23c0-5 5-7 6-12 0-7 14-8 15 1 0 5 5 5 5 11 0 8-26 8-26 0z",
          c ? "#b48bc5" : "#75b693",
        ) +
        path("M9 12c0-5 10-7 12-1", "none", c ? "#e1bbef" : "#c4e4b6", 3) +
        path("M8 24c5 3 13 3 18 0", "none", "#527d78")
      );
    case "Cœur de gelée":
      return (
        path(
          "M16 29C-4 16 2 2 11 5l5 5 5-5c12-4 16 11-5 24z",
          c ? "#bd89cc" : "#66aa8c",
        ) +
        path("m16 10 6 7-6 9-6-9z", c ? "#f1ccf4" : "#c6e5aa") +
        path("M6 10v5", "none", "#f4edce", 2)
      );
    case "Soie de sanglier":
      return (
        path(
          "M8 28 3 10l4 1L6 3l7 15L12 2l5 16L20 1l1 18 6-15-1 20z",
          c ? "#9d8bca" : "#ad8c65",
        ) +
        path("M7 23h19v5H7z", c ? "#d5b6e7" : "#6a5540") +
        path("M10 25h12", "none", "#dfc291", 2)
      );
    case "Défense ancienne":
      return (
        path(
          "M26 3C29 24 15 34 4 27c12-3 17-9 16-20z",
          c ? "#c8b7e7" : "#dbcfaa",
        ) +
        path("M23 8C23 24 13 28 7 28", "none", c ? "#9e86be" : "#aa9571", 2) +
        path("m20 8 8-4-1 5-6 3z", "#927a58")
      );
    case "Poussière de braise":
      return (
        path(
          "M12 9 8 3h16l-4 7 7 10c9 15-30 15-22 0z",
          c ? "#897cc2" : "#986340",
        ) +
        path("M11 10h10", "none", "#d9bb83", 3) +
        path("m11 21 2-5 3 6 5-4 2 8H9z", c ? "#c8b2eb" : "#ecab61") +
        path("m6 8-3-3m24 9 3-3", "none", c ? "#d7baf3" : "#f3d27d", 2)
      );
    case "Étincelle vive":
      return (
        path(
          "M17 2c-3 8 6 8 3 14l5-6c8 13 1 22-10 20C-1 27 4 15 10 10l1 8c6-4 0-9 6-16z",
          c ? "#9c78c4" : "#db854c",
        ) +
        path("M16 15c2 6 7 7 3 12-8 4-10-6-3-12z", c ? "#e2c6fa" : "#ffe2a1")
      );
    case "Écaille légère":
      return (
        path(
          "M16 2C5 6 1 17 8 24l8 6 9-8c6-8 1-16-9-20z",
          c ? "#b4a0dc" : "#9fbea4",
        ) +
        path("M8 13h17M6 18h20M9 23h13", "none", c ? "#dfc7f2" : "#dce4bc") +
        path("M16 5v22", "none", "#6b8c88")
      );
    case "Aile de zéphyr":
      return (
        path(
          "M5 29C-2 14 7-3 25 3l4 4c-3 9-11 24-24 22z",
          c ? "#b7a6de" : "#bed5bf",
        ) +
        path(
          "M5 28 25 6M11 21l11 1M15 16l11 1M18 12l-2-7",
          "none",
          c ? "#7c6aab" : "#719d97",
        ) +
        path("M7 15v6", "none", "#ece8c5", 2)
      );
    default:
      return null;
  }
}
function petArt(item,p) {
  const species=item.petSpecies;
  if(species==='slime')return path('M3 24c0-7 5-9 7-13 3-7 14-5 15 3l4 9c2 8-27 10-26 1z',p.base)+path('M9 18c0-6 10-8 12-3','none',p.light,2)+path('M10 23v2m11-2v2M15 27h3','none','#344f49',2);
  if(species==='boar')return path('m5 13 1-9 7 5h7l6-5 1 9v12l-10 5-12-5z','#9d8056')+path('M10 20h13v7H10z','#cfb18a')+path('M8 15v3m16-3v3m-10 5h2m4 0h2','none','#514b38',2)+path('M7 23v4h4m14-4v4h-4','none','#eee1bb',2)+elementSigil('earth',10,-3,.4,p.gem);
  return path('M12 14 3 4 1 15l10 10m9-11L29 4l2 11-10 10z',p.light)+path('M12 7h8v22h-8z',p.base)+path('M14 4V1m4 3V1M14 13v2m4-2v2','none',p.dark,2)+path('M13 22h6v6h-6z',p.gem);
}
export function renderItemIcon(item = {}) {
  const original = PALETTES[item.element] || PALETTES.neutral;
  const p = item.chromatic && item.setId ? {...original,base:CHROMATIC_COLORS[item.element],light:'#f1e1ff',gem:'#fff5ce'} : original;
  let art = item.kind==='pet' ? petArt(item,p) : resourceArt(item);
  if(item.kind==='certificate')art=path('M7 3h21v24H6V8H3V3z','#dfd0a4')+path('M7 3v5H3m4 19h21v-4H9','none','#a08b62')+path('M11 10h12m-12 4h8','none','#9d8a61')+path('m20 17 5 3-1 7-4-2-4 2-1-7z',p.base)+elementSigil(item.element,14,15,.38,p.gem);
  if (item.kind === "core" || item.slot === "Noyau")
    art =
      path("m16 2 12 9-4 15-8 5-8-5-4-15z", p.dark) +
      path("m16 5 8 8-3 11-5 3-5-3-3-11z", p.base) +
      elementSigil(item.element, 6, 7, 0.64, p.gem) +
      path("m10 10 4-4", "none", p.light, 2);
  if(item.kind==='core-fragment')art=path('M9 3 23 6l-3 10 6 7-15 7-6-13 6-5z',p.base,p.dark,1)+path('m9 3 4 11-8 3m8-3 7 2m-7-2-2 16','none',p.light,1)+elementSigil(item.element,9,9,.45,p.gem);
  if(item.kind==='wood')art=path('M5 12 23 4l7 14-18 10z',item.color||'#ac8a56')+path('M3 14c1-8 12-9 14 0 3 13-11 18-14 0z','#dcc18c','#80653e')+path('M7 16c0-6 7-6 7 0s-7 10-7 0z','none','#987345',1);
  if(item.kind==='plank')art=path('m2 12 20-9 8 16-20 10z',item.color||'#bd995b')+path('m5 15 20-9M8 21l20-9M11 27l17-8','none','#e2c78f',1)+path('M10 10l7 16','none','#8e7044',1);
  if (!art) art = equipmentArt(item, p);
  const sparkle =
    item.chromatic && item.kind !== "core" && item.slot !== "Noyau"
      ? '<path d="m26 1 1 3 4 1-4 1-1 4-1-4-4-1 4-1z" fill="#efcaff" stroke="#8f6da8" stroke-width=".5"/>'
      : "";
  return `<svg viewBox="0 0 32 32" aria-hidden="true" class="item-art${item.chromatic && item.setId ? " chromatic-art" : ""}" data-art="${item.kind === "core" ? "core" : item.setId || item.slot || "resource"}" stroke-linecap="round">${item.chromatic && item.setId ? `<ellipse cx="16" cy="17" rx="14" ry="13" fill="${CHROMATIC_COLORS[item.element]}" opacity=".22"/>` : ""}${art}${sparkle}</svg>`;
}
