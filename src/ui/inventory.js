import { completeChromaticSet } from '../data/chromatic.js';
import { petDefinition, foodQuantity, PET_MAX_LEVEL, petLevelXp } from "../data/pets.js";
import { adoptionProgress } from "../game/pet-quests.js";
import { renderItemIcon, elementSigil } from "./item-art.js";
import { ELEMENTS, setForCore, equipmentStats } from "../data/equipment.js";
import { ROLES, COLORS, SLOTS, atHome } from "../dev/sandbox.js";

const LEFT = ["Amulette", "Anneau 1", "Anneau 2", "Arme"];
const RIGHT = ["Coiffe", "Cape", "Ceinture", "Bottes"];
export function itemIcon(
  slot = "",
  chromatic = false,
  tint = null,
  item = null,
) {
  return renderItemIcon({
    ...item,
    slot: slot || item?.slot,
    chromatic,
    color: tint,
  });
}
function headArt(item) {
  if (!item) return "";
  const color = item.color || "#c6b58b";
  const shapes = {
    earth: `<path d="m40 32 2-16 7 6 5-13 8 12 12-9 1 15 5-4v12H40z" fill="${color}" stroke="#596040" stroke-width="2"/><path d="m48 23 8-8 5 12 9-9" fill="none" stroke="#c7d394" stroke-width="2"/>`,
    fire: `<path d="m40 34 2-16 8 6 10-18 9 18 9-6 2 16z" fill="${color}" stroke="#6f4d3a" stroke-width="2"/><path d="m60 9 4 16-4 8-4-8z" fill="#f3d38c"/>`,
    air: `<path d="m39 34 7-17 23-6 12 23z" fill="${color}" stroke="#617e73" stroke-width="2"/><path d="m62 22 12-20 7 3-8 19" fill="#e4e8c4" stroke="#8caa91" stroke-width="2"/>`,
    water: `<path d="M39 43V28c0-30 42-30 42 0v15l-6-7V27c-2-19-28-19-30 0v9z" fill="${color}" stroke="#3b6c85" stroke-width="2"/><path d="M44 22c5-17 28-17 32 0" fill="none" stroke="#b6dfdf" stroke-width="3"/>`,
  };
  return (
    shapes[item.element] ||
    `<path d="M44 18h31v10H44zM53 12h13v8H53z" fill="${color}"/>`
  );
}
function weaponArt(item) {
  if (!item) return "";
  const shapes = {
    earth:
      '<path d="m96 133 8-55" stroke="#695333" stroke-width="5"/><path d="m100 99-8-6 10-1-3-12 7 5 4-12 2 16-6 9" fill="#8fa458" stroke="#566138" stroke-width="2"/>',
    fire: '<path d="M96 128V86" stroke="#b39b74" stroke-width="5"/><path d="M96 104c-11-6 4-16 0-26 13 8 14 20 3 26z" fill="#d37c4c" stroke="#70493c" stroke-width="2"/><path d="m97 86 3 12-4 3" fill="#f9daa0"/><path d="M89 111h16" stroke="#dbb876" stroke-width="4"/>',
    air: '<path d="m93 132 5-22" stroke="#647869" stroke-width="4"/><path d="M97 112c-11-16 5-22 12-37 6 22-5 35-12 37z" fill="#d3ddc3" stroke="#739788" stroke-width="2"/>',
    water:
      '<path d="M96 134V87" stroke="#597380" stroke-width="4"/><path d="M97 95c-24-10-7-36 12-26-17-3-21 16-4 14l-8 12z" fill="#7db8c8" stroke="#3b627e" stroke-width="2"/><path d="M99 71c-11 6-9 15-1 17" fill="none" stroke="#c6e8dc" stroke-width="2"/>',
  };
  return (
    shapes[item.element] ||
    '<path d="M94 70h5v49h-5z" fill="#e1e5d4"/><path d="M88 112h16v5H88z" fill="#d4af65"/><path d="M94 116h5v16h-5z" fill="#785b40"/>'
  );
}
function avatar(member) {
  const e = member.equipment,
    color = COLORS[member.role];
  return `<svg class="paper-avatar" viewBox="0 0 120 170" role="img" aria-label="Apparence de ${member.name}" shape-rendering="crispEdges">
    <ellipse cx="60" cy="151" rx="29" ry="7" fill="#0b161a" opacity=".45"/>
    ${e.Cape ? `<path d="M37 62H82L94 140 68 131 33 139z" fill="${e.Cape?.color || "#8370ab"}"/><path d="M37 62H47L40 132 33 139z" fill="#26352d66"/>` : ""}
    <path d="M43 114H58V145H36v-10h7zm19 0h15v21h7v10H62z" fill="#36434b"/>
    <path d="M36 143h22v8H33v-7zm26 0h24v8H62z" fill="${e.Bottes?.color || (e.Bottes ? "#b8a276" : "#594737")}"/>
    <path d="M38 63h44v53H38z" fill="${color}"/><path d="M38 100h44v16H38z" fill="#365950"/>
    <path d="M45 65h29v35H45z" fill="#526e69"/><path d="M48 68h7v23h-7z" fill="#ffffff16"/>
    <path d="M27 67h11v35H27zm55 0h11v35H82z" fill="${color}"/><path d="M27 96h11v11H27zm55 0h11v11H82z" fill="#dbb58f"/>
    <path d="M44 31h31v31H44z" fill="#deb891"/><path d="M41 25h37v15H41zm0 13h7v14h-7z" fill="${e.Coiffe?.color || (e.Coiffe ? "#acbac0" : "#554438")}"/>
    ${headArt(e.Coiffe)}
    <path d="M50 45h4v5h-4zm17 0h4v5h-4z" fill="#29343c"/><path d="M55 57h10v3H55z" fill="#a9745b"/>
    ${e.Ceinture ? '<path d="M38 104h44v9H38z" fill="#735339"/><path d="M55 103h12v11H55z" fill="#dfbd6f"/>' : ""}
    ${e.Amulette ? `<path d="m51 64 9 13 10-13" fill="none" stroke="#d8bd79" stroke-width="2"/><path d="m60 73 5 6-5 6-5-6z" fill="${e.Amulette.color || "#8bcebc"}"/>` : ""}
    ${weaponArt(e.Arme)}
    ${e.Familier?.kind==='pet'?renderItemIcon(e.Familier).replace('<svg ', '<svg x="77" y="126" width="28" height="28" '):e.Familier?'<path d="M82 142h17v10H82zm0-6 6 4h5l6-4v9H82z" fill="#cfa56c"/>':''}
    ${e.Bouclier ? `<path d="m27 84 17 6v22l-17 12-17-12V90z" fill="${e.Bouclier?.color || "#879d9d"}"/><path d="m27 89 11 4v16l-11 8-11-8V93z" fill="#475e6a"/><path d="M25 93h4v18h-4z" fill="#d5b974"/>` : ""}
    ${e.Bouclier?.element ? elementSigil(e.Bouclier.element, 17, 93, 0.62) : ""}
    ${e.Cape?.element ? elementSigil(e.Cape.element, 31, 117, 0.5) : ""}
    ${e["Anneau 1"] ? `<rect x="27" y="100" width="4" height="4" fill="${e["Anneau 1"].color || "#d4bb77"}"/>` : ""}
    ${e["Anneau 2"] ? `<rect x="87" y="100" width="4" height="4" fill="${e["Anneau 2"].color || "#d4bb77"}"/>` : ""}
  </svg>`;
}
export function selectedObject(state, selection) {
  if (!selection) return null;
  return selection.source === "bag"
    ? state.bag.find((item) => item.id === selection.id)
    : state.team[state.main].equipment[selection.slot] || null;
}
function objectDetails(state, selection) {
  const item = selectedObject(state, selection);
  if (!item)
    return `<div class="item-details empty-details"><span class="detail-icon">${itemIcon(selection?.slot)}</span><div><p class="eyebrow">INFORMATIONS SUR L’OBJET</p><h3>${selection?.slot || "Sélectionnez un objet"}</h3><p>${selection?.slot ? "Cet emplacement est vide. Choisissez un équipement dans le sac pour le remplir." : "Cliquez sur un objet du sac ou un emplacement équipé pour consulter sa description et ses effets."}</p></div></div>`;
  const equipped = selection.source === "equipment";
  if (item.kind === "core") {
    const set = setForCore(item),
      element = ELEMENTS[item.element];
    return `<div class="item-details core-details"><span class="detail-icon">${itemIcon("Noyau", false, item.color, item)}</span><div><p class="eyebrow">NOYAU · ${element.name} / ${element.stat} · NIVEAUX ${item.band.min}–${item.band.max}</p><h3>${item.name}</h3><p>${set ? `${set.name} : une pièce aléatoire parmi ${set.pieces.length}, équipable niveau ${set.minLevel}. Doublons possibles.` : "Panoplie de cette tranche non disponible pour le moment."}</p><small>Quantité : ${item.quantity} · ${atHome(state) ? "Au village : ouverture possible." : "Ouverture uniquement au village, près de la maison."}</small></div><div class="core-actions"><button data-open-core="${item.id}" ${!atHome(state) || !set ? "disabled" : ""}>Ouvrir le noyau</button><div class="core-batch"><label for="core-quantity">Quantité</label><input id="core-quantity" type="number" min="1" max="${item.quantity}" step="1" value="${Math.min(20,item.quantity)}"/><button data-open-cores="${item.id}" ${!atHome(state) || !set ? "disabled" : ""}>Ouvrir la quantité</button></div></div></div>`;
  }
  if (item.kind === "certificate") {
    const count=adoptionProgress(state,item.questId).filter(p=>p.obtained).length;
    return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">CERTIFICAT D’ADOPTION</p><h3>${item.name}</h3><p>${count}/9 pièces obtenues. À remettre à Nola à l’animalerie contre le familier, une fois la panoplie complète. Vos équipements seront conservés.</p></div><button data-tab="petshop">Voir la quête</button></div>`;
  }
  if (item.kind === "pet") {
    const def=petDefinition(item.petId),quantity=foodQuantity(state,item),maximum=item.level>=PET_MAX_LEVEL;
    return `<div class="item-details pet-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">FAMILIER · ${ELEMENTS[item.element].name} · ${equipped?'ÉQUIPÉ':'DANS LE SAC'}</p><h3>${item.name} · Niveau ${item.level}/${PET_MAX_LEVEL}</h3><p>${Object.entries(item.stats).map(([stat,value])=>`+${value} ${stat}`).join(' · ')} · ${maximum?'Niveau maximum':`${item.xp}/${petLevelXp(item.level)} XP`}</p><small>Nourriture : ${def.food} chromatique (rare) · ${quantity} en sac.</small><div class="xp-track"><span style="width:${maximum?100:item.xp/petLevelXp(item.level)*100}%"></span></div></div><div class="pet-detail-actions"><button ${equipped?`data-slot="Familier"`:`data-equip="${item.id}"`}>${equipped?'Retirer':'Équiper'}</button><button data-feed-pet="${item.id}" ${quantity===0||maximum?'disabled':''}>Nourrir · 1 ressource</button></div></div>`;
  }
  const effect = item.stats
    ? Object.entries(item.stats)
        .map(([stat, value]) => `+${value} ${stat}`)
        .join(" · ")
    : item.slot === "Familier"
      ? "Familier de test, visible dans l’aperçu. Aucun bonus ni comportement de combat pour le moment."
      : item.slot === "Arme"
        ? "+5 dégâts sur les attaques du personnage principal."
        : item.slot === "Bouclier"
          ? "Bouclier de test visible sur le personnage. Les bonus défensifs restent à définir."
          : item.slot === "Coiffe" || item.slot === "Cape"
            ? "Modifie l’apparence du personnage. Aucun bonus chiffré pour le moment."
            : item.slot
              ? "Équipement de test. Les caractéristiques et bonus seront définis plus tard."
              : "Ressource obtenue sur un monstre.";
  const usage = !item.slot && item.chromatic ? (item.type==='rare' ? `Nourriture du familier associé : ${petDefinition(Object.keys(ELEMENTS).find(element=>petDefinition(element)?.food===item.name))?.name || 'voir l’animalerie'}.` : 'Matériau de forge : améliore une pièce de sa panoplie en chromatique.') : '';
  return `<div class="item-details ${item.chromatic ? "chromatic" : ""}"><span class="detail-icon">${itemIcon(item.kind === "core" ? "Noyau" : item.slot, item.chromatic, item.color, item)}</span><div><p class="eyebrow">${item.slot || (item.type === "rare" ? "BUTIN RARE" : "BUTIN NORMAL")}${item.chromatic ? " · CHROMATIQUE" : ""} · ${equipped ? "ÉQUIPÉ" : "DANS LE SAC"}</p><h3>${item.name}${item.chromatic ? " chromatique" : ""}</h3><p>${effect}</p>${usage?`<p class="resource-purpose">${usage}</p>`:""}${item.setId ? `<p class="set-info">${item.setName}${item.chromatic ? " · Aura chromatique" : ""} · Niveau requis ${item.requiredLevel} · ${Object.values(state.team[state.main].equipment).filter((piece) => piece.setId === item.setId).length}/9 pièces équipées</p>` : ""}<small>Quantité : ${item.quantity} ${equipped ? "· " + state.team[state.main].name : ""}</small></div>${item.slot ? `<button ${equipped ? `data-slot="${item.slot}"` : `data-equip="${item.id}"`}>${equipped ? "Retirer" : "Équiper"}</button>` : ""}</div>`;
}
export function renderInventory(state, selection, filter = "all") {
  const m = state.team[state.main];
  const slot = (name) => {
    const item = m.equipment[name];
    const selected =
      selection?.source === "equipment" && selection.slot === name;
    return `<button class="paper-slot ${item ? "filled" : ""} ${selected ? "inspected" : ""}" data-inspect-slot="${name}" aria-pressed="${selected}" aria-label="${name}${item ? " : " + item.name : " : vide"}" title="${name}${item ? " : " + item.name : ""}">${itemIcon(name, item?.chromatic, item?.color, item)}<small>${name}</small></button>`;
  };
  const items = state.bag.filter(
    (item) =>
      filter === "all" ||
      (filter === "equipment"
        ? !!item.slot
        : filter === "cores"
          ? item.kind === "core"
          : !item.slot),
  );
  const emptyCount = Math.max(0, 24 - items.length);
  return `<div class="inventory-character-bar"><div><p class="eyebrow">${ROLES[m.role]}</p><h3>${m.name} <small>Niveau ${m.level}</small></h3></div><div class="inventory-party">${state.team.map((member, i) => `<button data-main="${i}" aria-pressed="${state.main === i}">${member.name}</button>`).join("")}</div></div>
  <div class="paper-layout">
    <section class="character-equipment"><section class="character-loadout" aria-label="Équipement du personnage"><div class="gear-column">${LEFT.map(slot).join("")}</div><div class="character-stage"><div class="character-halo"></div>${avatar(m)}<div class="avatar-caption"><strong>${m.name}</strong><span>${m.hp} / ${m.maxHp} PV</span><div class="xp-track"><span style="width:${(m.xp / (m.level * 50)) * 100}%"></span></div><small>${m.xp} / ${m.level * 50} XP</small><small class="gear-bonuses">${
      Object.entries(equipmentStats(m))
        .filter(([, v]) => v > 0)
        .map(([stat, v]) => `+${v} ${stat}`)
        .join(" · ") || "Aucun bonus d’équipement"
    }</small><small class="set-aura-status">${completeChromaticSet(m) ? "✦ Panoplie chromatique complète · Aura de déplacement" : ""}</small></div></div><div class="gear-column">${RIGHT.map((name) => (name ? slot(name) : '<div class="gear-spacer" aria-hidden="true"></div>')).join("")}</div></section><div class="loadout-extras">${slot("Bouclier")}${slot("Familier")}</div><section class="trophy-row" aria-label="Six trophées en bas">${SLOTS.filter(
      (name) => name.startsWith("Trophée"),
    )
      .map(slot)
      .join("")}</section></section>
    <section class="inventory-bag" aria-label="Objets du sac"><div class="bag-heading"><h3>Sac de voyage <small>${state.bag.length} piles</small></h3><label class="sr-only" for="bag-filter">Filtrer les objets</label><select id="bag-filter"><option value="all" ${filter === "all" ? "selected" : ""}>Tous les objets</option><option value="equipment" ${filter === "equipment" ? "selected" : ""}>Équipements</option><option value="cores" ${filter === "cores" ? "selected" : ""}>Noyaux</option><option value="loot" ${filter === "loot" ? "selected" : ""}>Ressources</option></select></div><div class="inventory-items">${items.map((item) => `<button class="bag-cell ${item.chromatic ? "chromatic" : ""} ${item.type === "rare" ? "rare" : ""} ${selection?.source === "bag" && selection.id === item.id ? "inspected" : ""}" data-inspect-bag="${item.id}" aria-label="${item.name}${item.chromatic ? " chromatique" : ""}, quantité ${item.quantity}" aria-pressed="${selection?.source === "bag" && selection.id === item.id}" title="${item.name}${item.chromatic ? " chromatique" : ""}${item.slot ? " · Maj + clic pour équiper" : ""}">${itemIcon(item.kind === "core" ? "Noyau" : item.slot, item.chromatic, item.color, item)}<small>${item.quantity}</small></button>`).join("")}${Array.from({ length: emptyCount }, () => '<div class="bag-cell empty" aria-hidden="true"></div>').join("")}</div>${!items.length ? '<p class="bag-empty-hint">Aucun objet. Générez du matériel dans les outils dev ou récupérez du butin.</p>' : ""}<div class="bag-currency"><span>◈ ${state.gold} pièces</span><small>Sac partagé · Maj + clic : équiper</small></div></section>
  </div>${objectDetails(state, selection)}`;
}
