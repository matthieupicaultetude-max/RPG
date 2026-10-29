import { DEV_ITEMS, devItemCategory } from "../data/dev-items.js";
import { devChestStock, nearDevChest } from "../game/dev-chest.js";
import { renderItemIcon } from "./item-art.js";
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function filterDevChest(panel, query) {
  const q = query.trim().toLocaleLowerCase("fr");
  for (const card of panel.querySelectorAll("[data-chest-name]"))
    card.hidden = !card.dataset.chestName.includes(q);
}
export function renderDevChest(s, category = "all", query = "", quantity = 99) {
  const stock = devChestStock(s),
    near = nearDevChest(s),
    q = query.trim().toLocaleLowerCase("fr");
  const categories = {
    all: "Tous les objets",
    equipment: "Équipements",
    cores: "Noyaux et fragments",
    resources: "Ressources",
    pets: "Familiers",
    keys: "Clés et certificats",
  };
  return `<section class="dev-chest-panel"><div class="panel-heading"><p class="eyebrow">JARDIN DES ESSAIS · COFFRE DEV</p><h2>Tous les objets du jeu</h2><p>${DEV_ITEMS.length} objets et variantes · Une pile de 99 par objet. Normales et chromatiques sont séparées.</p><p class="shop-location">${near ? "Coffre à portée · Retraits disponibles" : "Rejoignez le coffre dans le village pour retirer des objets."}</p></div><div class="chest-controls"><label>Rechercher<input id="chest-search" type="search" value="${escape(query)}" placeholder="Panoplie, noyau, bois…"/></label><label>Catégorie<select id="chest-category">${Object.entries(
    categories,
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${id === category ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Quantité par retrait<input id="chest-quantity" type="number" min="1" max="99" step="1" value="${quantity}"/></label></div><div class="tool-buttons chest-actions"><button data-action="chest-take-all" ${near ? "" : "disabled"}>Tout prendre</button><button data-action="chest-refill" ${near ? "" : "disabled"}>Réapprovisionner à 99</button><button data-tab="equipment">Voir mon sac</button></div><div class="chest-catalog">${DEV_ITEMS.map(
    ({ key, item }, index) => {
      if (category !== "all" && devItemCategory(item) !== category) return "";
      const name = `${item.name}${item.chromatic ? " chromatique" : ""}`;
      return `<article class="chest-item" data-chest-name="${escape(name.toLocaleLowerCase("fr"))}" ${name.toLocaleLowerCase("fr").includes(q) ? "" : "hidden"}>${renderItemIcon(item)}<div><strong>${escape(name)}</strong><small>${item.slot || { core: "Noyau", "core-fragment": "Fragment", certificate: "Certificat", "royal-key-part": "Morceau de clé", "dungeon-key": "Clé de donjon", wood: "Bois", plank: "Planche" }[item.kind] || (item.type === "rare" ? "Ressource rare" : "Ressource normale")}${item.requiredLevel ? " · Niveau " + item.requiredLevel : ""}</small><span data-chest-stock="${index}">${stock[key]} / 99 en réserve</span></div><button data-dev-chest-item="${index}" ${near && stock[key] > 0 ? "" : "disabled"} aria-label="Retirer ${escape(name)}">Prendre</button></article>`;
    },
  ).join("")}</div></section>`;
}
