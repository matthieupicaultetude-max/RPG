import {
  MAP_SIZE,
  BUILDINGS,
  ROADS,
  LAND,
  DOCKS,
  FOUNTAIN,
  exileDistrict,
} from "../world/exile-map.js";
import {
  EXILE_GOODS,
  canSellExile,
  exileSellPrice,
  nearTownVendor,
} from "../game/exile-commerce.js";
import { renderItemIcon } from "./item-art.js";
import { sections } from "./organization.js";
const countryMap = new URL(
  "../../docs/world/pays-des-slimes.png",
  import.meta.url,
).href;
const INFO = {
  ambassadeur: [
    "Une promesse d’accueil",
    "Le Roi a souhaité que ce port reste ouvert aux aventuriers. Respectez les habitants du Comptoir : ici, personne n’est une cible.",
  ],
  jardinier: [
    "Les jardins du Premier Accueil",
    "J’entretiens les jardins depuis que les quatre héritiers ont quitté le refuge. Les fleurs continuent de pousser, même quand les souverains se disputent.",
  ],
  capitaine: [
    "Bienvenue au Comptoir",
    "Le Roi Slime a fondé ce port pour accueillir les voyageurs. Remontez l’avenue : la place du Refuge rassemble les chemins de la ville. Le navire au bout du ponton retourne au Jardin des essais.",
  ],
  archiviste: [
    "Le Premier Accueil",
    "Avant la guerre des quatre héritiers, le Roi voulait un pays où les siens vivraient libres. Ce comptoir était sa main tendue aux aventuriers. Les quatre couleurs de la place rappellent cette promesse.",
  ],
  aubergiste: [
    "Les Quatre Vents",
    "Une chambre au calme et un repas chaud : votre troupe repartira en pleine forme.",
  ],
  maela: [
    "La Maille du Refuge",
    "Un équipement de voyage simple pour vos premiers pas. Les panoplies élémentaires se trouvent toujours dans les noyaux des monstres.",
  ],
  oriel: [
    "Le Bâton étoilé",
    "Capes, bâtons et talismans pour prendre la route.",
  ],
  silo: [
    "L’Échoppe des voyageurs",
    "Je rachète les ressources ordinaires et rares. Vos ressources chromatiques, bois, clés et équipements restent dans votre sac.",
  ],
};
export function townPlan(s) {
  return `<svg class="exile-plan" viewBox="0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}" role="img" aria-label="Plan du Comptoir de l’Exil, port au sud et place du Refuge au centre"><rect width="${MAP_SIZE.width}" height="${MAP_SIZE.height}" fill="#376e7b"/><polygon points="${LAND.map((p) => p.join(",")).join(" ")}" fill="#8f9f68" stroke="#d7cc9c" stroke-width="12"/>${ROADS.map((r) => `<polyline points="${r.points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#c7c5a2" stroke-width="${r.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}${DOCKS.map((d) => `<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}" fill="#b79664"/>`).join("")}${BUILDINGS.map((p) => `<g><title>${p.name}</title><rect x="${p.x - p.w / 2}" y="${p.y + p.footprint.top}" width="${p.w}" height="${-p.footprint.top}" fill="${{ teal: "#477479", wine: "#985d65", slate: "#6a7c82", clay: "#b86748", ochre: "#bf8a59" }[p.roof]}" stroke="#e2c89c" stroke-width="4"/>${p.service ? `<circle cx="${p.x}" cy="${p.y + 20}" r="11" fill="#f5d78a"/>` : ""}</g>`).join("")}<circle cx="${FOUNTAIN.x}" cy="${FOUNTAIN.y}" r="26" fill="#7ab7c4" stroke="#e3d7ab" stroke-width="9"/><g fill="#253f39" font-family="sans-serif" font-size="25" text-anchor="middle"><text x="720" y="720">Place du Refuge</text><text x="720" y="1220" fill="#f1e1b6">Port de l’Exil · Retour au Jardin</text><text x="720" y="115">Premier Accueil</text><text x="370" y="860">Artisans</text><text x="1070" y="550">Le Levant</text></g>${s.zone === "exile" ? `<circle cx="${s.player.x}" cy="${s.player.y}" r="16" fill="#ffe497" stroke="#324a40" stroke-width="6"/><text x="${s.player.x}" y="${s.player.y - 30}" text-anchor="middle" fill="#1f3632" font-size="30">Vous</text>` : ""}</svg>`;
}
export function renderExile(s) {
  const local = s.zone === "exile",
    selected = local ? s.npcs.find((p) => p.id === s.townResident) : null,
    info = INFO[selected?.id],
    offers = EXILE_GOODS.filter((g) => g.vendor === selected?.id),
    near = selected && nearTownVendor(s, selected.id);
  const overview = `<div class="exile-plan-layout"><div>${townPlan(s)}<p class="panel-hint">● Or : commerces et ateliers · ● Bleu : fontaine · Point clair : votre position.</p></div><div><h3>${local ? exileDistrict(s.player.x, s.player.y) : "Un refuge pour les voyageurs"}</h3><p>Port au sud, place au centre, jardins au nord. Les ruelles pavées traversent les îlots de bâtiments mitoyens et rejoignent les quais.</p>${!local ? `<button data-action="exile-travel" ${s.zone === "tutorial" ? "disabled" : ""}>Embarquer pour le Comptoir · Gratuit</button>` : '<p class="guide-rule">Approchez un habitant : F ou touchez-le pour parler.</p>'}<h3>Les bonnes adresses</h3><ul class="exile-addresses"><li><strong>Place du Refuge</strong> Fontaine, armurière et enchanteur.</li><li><strong>Quartier des artisans</strong> Forge, bricolage et scierie.</li><li><strong>Promenade des quais</strong> Auberge, animalerie et marché.</li><li><strong>Premier Accueil</strong> Jardins et mémoire du Roi Slime.</li></ul><p class="panel-hint">Les routes vers les quatre régions seront aménagées lors de leur construction.</p></div></div>`;
  const conversation = info
    ? `<h3>${info[0]}</h3><p>${info[1]}</p>${!near ? '<p class="shop-location">Rejoignez cet habitant pour échanger.</p>' : ""}${
        offers.length
          ? `<p class="shop-location">${s.gold} or en bourse</p><div class="exile-shop-grid">${offers
              .map(
                (g) =>
                  `<article>${renderItemIcon(g)}<div><strong>${g.name}</strong><small>${Object.entries(
                    g.stats,
                  )
                    .map(([k, v]) => `+${v} ${k}`)
                    .join(
                      " · ",
                    )}</small></div><button data-town-buy="${g.id}" ${!near || s.gold < g.price ? "disabled" : ""}>${g.price} or</button></article>`,
              )
              .join("")}</div>`
          : ""
      }${
        selected?.id === "silo"
          ? `<div class="exile-shop-grid">${
              s.bag
                .filter(canSellExile)
                .map(
                  (i) =>
                    `<article>${renderItemIcon(i)}<div><strong>${i.name}</strong><small>${i.quantity} en sac · ${exileSellPrice(i)} or / unité</small></div><button data-town-sell="${i.id}" ${!near ? "disabled" : ""}>Vendre 1</button></article>`,
                )
                .join("") || "<p>Aucune ressource à vendre.</p>"
            }</div>`
          : ""
      }${selected?.id === "aubergiste" ? `<button data-action="town-rest" ${!near || s.gold < 5 || s.team.every((m) => m.hp === m.maxHp) ? "disabled" : ""}>Reposer toute la troupe · 5 or</button>` : ""}`
    : "<h3>Les habitants du Comptoir</h3><p>Parlez aux commerçants devant leurs échoppes. Les artisans proposent les mêmes services qu’au village de développement.</p>";
  return `<section class="exile-panel"><p class="eyebrow">PAYS DES SLIMES · LIEU D’ACCUEIL</p><h2>Comptoir de l’Exil</h2>${sections(
    "exile",
    [
      { id: "plan", label: "Plan & adresses", content: overview },
      {
        id: "residents",
        label: selected?.name || "Habitants",
        content: conversation,
      },
      {
        id: "country",
        label: "Pays des Slimes",
        content: `<img class="exile-country-map" src="${countryMap}" alt="Carte du Pays des Slimes : quatre régions élémentaires entourent le sanctuaire du Roi endormi."/><p class="panel-hint">Carte de référence du pays. Le Comptoir est sa première zone en construction.</p>`,
      },
    ],
  )}</section>`;
}
