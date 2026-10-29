import {filterOptions,matchesItemFilter} from './item-filters.js';
import {renderSetDetails,formatSetStats} from './set-bonuses.js';
import {KEY_RECIPES} from '../data/handyman.js';
import { characterArt } from './character-art.js';
import { completeChromaticSet } from '../data/chromatic.js';
import { ALL_PETS, petDefinition, foodQuantity, PET_MAX_LEVEL, petLevelXp } from "../data/pets.js";
import { adoptionProgress } from "../game/pet-quests.js";
import { renderItemIcon } from "./item-art.js";
import { ELEMENTS, setForCore, equipmentStats } from "../data/equipment.js";
import { ROLES, SLOTS } from "../dev/sandbox.js";

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
const avatar = member => characterArt(member);
export function selectedObject(state, selection) {
  if (!selection) return null;
  return selection.source === "bag"
    ? state.bag.find((item) => item.id === selection.id)
    : state.team[state.main].equipment[selection.slot] || null;
}
function objectDetails(state, selection) {
  const item = selectedObject(state, selection);
  if (!item)
    return `<div class="item-details empty-details"><span class="detail-icon">${itemIcon(selection?.slot)}</span><div><p class="eyebrow">INFORMATIONS SUR L’OBJET</p><h3>${selection?.slot || "Sélectionnez un objet"}</h3><p>${selection?.slot ? "Cet emplacement est vide. Choisissez un équipement dans le sac pour le remplir." : "Choisissez un objet pour voir ses effets."}</p></div></div>`;
  const equipped = selection.source === "equipment";
  if (item.kind === "core") {
    const set = setForCore(item),
      element = ELEMENTS[item.element];
    return `<div class="item-details core-details"><span class="detail-icon">${itemIcon("Noyau", false, item.color, item)}</span><div><p class="eyebrow">NOYAU · ${(item.elements||[item.element]).map(e=>ELEMENTS[e].name).join(" / ")} · NIVEAUX ${item.band.min}–${item.band.max}</p><h3>${item.name}</h3><p>${set ? `${set.name} · ${set.pieces.length} pièces possibles · Niveau ${set.minLevel}. Bonus dès 2 pièces. Doublons possibles.` : "Panoplie de cette tranche non disponible pour le moment."}</p><small>Quantité : ${item.quantity} · Ouverture possible partout.</small></div><div class="core-actions"><button data-open-core="${item.id}" ${!set ? "disabled" : ""}>Ouvrir le noyau</button><div class="core-batch"><label for="core-quantity">Quantité</label><input id="core-quantity" type="number" min="1" max="${item.quantity}" step="1" value="${Math.min(20,item.quantity)}"/><button data-open-cores="${item.id}" ${!set ? "disabled" : ""}>Ouvrir la quantité</button></div></div></div>`;
  }
  if(item.kind==='core-fragment')return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">FRAGMENT DE NOYAU · ${ELEMENTS[item.element].name}</p><h3>${item.name}</h3><p>10 fragments identiques → 1 noyau chez Borin. Tranche ${item.band.min}–${item.band.max}.</p><small>Quantité : ${item.quantity}</small></div><button data-tab="forge">Voir la forge</button></div>`;
  if(item.kind==='royal-key-part')return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">CLÉ ROYALE · MORCEAU ${['depths','magma','storm','furnace'].indexOf(item.hybridId)+1} / 4</p><h3>${item.name}</h3><p>4 morceaux différents → Clé du Roi des slimes chez Tessa. Donjon royal à venir.</p><small>Quantité : ${item.quantity}</small></div><button data-action="key-recipe" data-dungeon="slime-king">Voir la recette royale</button></div>`;
  if(item.kind==='dungeon-key')return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">CLÉ DE DONJON · BRICOLEUR</p><h3>${item.name}</h3><p>${item.dungeonId==='slime-king'?"Clé destinée au futur donjon du Roi des slimes. Aucun accès royal n’est encore ouvert.":"Une clé ouvre une expédition pour la troupe au passage du donjon correspondant."} La sortie et une réanimation à l’entrée du donjon ne consomment pas de clé.</p><small>Quantité : ${item.quantity} · ${KEY_RECIPES[item.dungeonId]?.ingredients.map(i=>`${i.quantity} ${i.name}`).join(", ")||""}</small></div><button data-action="key-recipe" data-dungeon="${item.dungeonId}">Voir la recette</button></div>`;
  if(["wood","plank"].includes(item.kind))return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">BÛCHERON · NIVEAU ${item.requiredLevel}</p><h3>${item.name}</h3><p>${item.kind==="wood"?"Récolté sur un arbre. 2 bois donnent 1 planche à la scierie.":"Matériau d’artisanat : le frêne sert aux armures ; 5 planches de châtaignier servent à une clé de donjon."}</p><small>Quantité : ${item.quantity} · Aucune variante chromatique</small></div><button data-tab="professions">Métiers</button></div>`;
  if (item.kind === "certificate") {
    const count=adoptionProgress(state,item.questId).filter(p=>p.obtained).length;
    return `<div class="item-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">CERTIFICAT D’ADOPTION</p><h3>${item.name}</h3><p>${count}/9 pièces obtenues. Panoplie complète : échangez le certificat chez Nola contre le familier.</p></div><button data-tab="petshop">Voir la quête</button></div>`;
  }
  if (item.kind === "pet") {
    const def=petDefinition(item.petId),quantity=foodQuantity(state,item),maximum=item.level>=PET_MAX_LEVEL;
    return `<div class="item-details pet-details"><span class="detail-icon">${renderItemIcon(item)}</span><div><p class="eyebrow">FAMILIER · ${(item.elements||[item.element]).map(e=>ELEMENTS[e].name).join(" / ")} · ${equipped?'ÉQUIPÉ':'DANS LE SAC'}</p><h3>${item.name} · Niveau ${item.level}/${PET_MAX_LEVEL}</h3><p>${Object.entries(item.stats).map(([stat,value])=>`+${value} ${stat}`).join(' · ')} · ${maximum?'Niveau maximum':`${item.xp}/${petLevelXp(item.level)} XP`}</p><small>Nourriture : ${def.food} chromatique (rare) · ${quantity} en sac.</small><div class="xp-track"><span style="width:${maximum?100:item.xp/petLevelXp(item.level)*100}%"></span></div></div><div class="pet-detail-actions"><button ${equipped?`data-slot="Familier"`:`data-equip="${item.id}"`}>${equipped?'Retirer':'Équiper'}</button><button data-feed-pet="${item.id}" ${quantity===0||maximum?'disabled':''}>Nourrir · 1 ressource</button></div></div>`;
  }
  const effect = item.stats
    ? formatSetStats(item.stats)
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
  const usage = !item.slot && item.chromatic ? (item.type==='rare' ? `Nourriture du familier associé : ${ALL_PETS.find(p=>p.food===item.name)?.name || 'voir l’animalerie'}.` : 'Matériau de forge : améliore une pièce de sa panoplie en chromatique.') : '';
  return `<div class="item-details ${item.chromatic ? "chromatic" : ""}"><span class="detail-icon">${itemIcon(item.kind === "core" ? "Noyau" : item.slot, item.chromatic, item.color, item)}</span><div><p class="eyebrow">${item.slot || (item.type === "rare" ? "BUTIN RARE" : "BUTIN NORMAL")}${item.chromatic ? " · CHROMATIQUE" : ""} · ${equipped ? "ÉQUIPÉ" : "DANS LE SAC"}</p><h3>${item.name}${item.chromatic ? " chromatique" : ""}</h3><p>${effect}</p>${usage?`<p class="resource-purpose">${usage}</p>`:""}${item.setId?renderSetDetails(state.team[state.main],item.setId):''}<small>Quantité : ${item.quantity} ${equipped ? "· " + state.team[state.main].name : ""}</small></div>${item.slot ? `<button ${equipped ? `data-slot="${item.slot}"` : `data-equip="${item.id}"`}>${equipped ? "Retirer" : "Équiper"}</button>` : ""}</div>`;
}
export function renderInventory(state, selection, filter = "all") {
  const m = state.team[state.main];
  const slot = (name) => {
    const item = m.equipment[name];
    const selected =
      selection?.source === "equipment" && selection.slot === name;
    return `<button class="paper-slot ${item ? "filled" : ""} ${selected ? "inspected" : ""}" data-inspect-slot="${name}" aria-pressed="${selected}" aria-label="${name}${item ? " : " + item.name : " : vide"}" title="${name}${item ? " : " + item.name : ""}">${itemIcon(name, item?.chromatic, item?.color, item)}<small>${name}</small></button>`;
  };
  const items = state.bag.filter(item=>matchesItemFilter(item,filter));
  const emptyCount = Math.max(0, 24 - items.length);
  return `<div class="inventory-character-bar"><div><p class="eyebrow">${ROLES[m.role]}</p><h3>${m.name} <small>Niveau ${m.level}</small></h3></div><div class="inventory-party">${state.team.map((member, i) => `<button data-main="${i}" aria-pressed="${state.main === i}">${member.name}</button>`).join("")}</div></div>
  <div class="paper-layout">
    <section class="character-equipment"><section class="character-loadout" aria-label="Équipement du personnage"><div class="gear-column">${LEFT.map(slot).join("")}</div><div class="character-stage"><div class="character-halo"></div>${avatar(m)}<div class="avatar-caption"><strong>${m.name}</strong><span>${m.hp} / ${m.maxHp} PV</span><div class="xp-track"><span style="width:${(m.xp / (m.level * 50)) * 100}%"></span></div><small>${m.xp} / ${m.level * 50} XP</small><small class="gear-bonuses">${
      formatSetStats(Object.fromEntries(Object.entries(equipmentStats(m)).filter(([,v])=>v>0))) || "Aucun bonus d’équipement"
    }</small><small class="set-aura-status">${completeChromaticSet(m) ? "✦ Panoplie chromatique complète · Aura de déplacement" : ""}</small></div></div><div class="gear-column">${RIGHT.map((name) => (name ? slot(name) : '<div class="gear-spacer" aria-hidden="true"></div>')).join("")}</div></section><div class="loadout-extras">${slot("Bouclier")}${slot("Familier")}</div><section class="trophy-row" aria-label="Six trophées en bas">${SLOTS.filter(
      (name) => name.startsWith("Trophée"),
    )
      .map(slot)
      .join("")}</section></section>
    <section class="inventory-bag" aria-label="Objets du sac"><div class="bag-heading"><h3>Sac de voyage <small>${state.bag.length} piles</small></h3><label class="sr-only" for="bag-filter">Filtrer les objets</label><select id="bag-filter">${filterOptions(filter)}</select></div><div class="inventory-items">${items.map((item) => `<button class="bag-cell ${item.chromatic ? "chromatic" : ""} ${item.type === "rare" ? "rare" : ""} ${selection?.source === "bag" && selection.id === item.id ? "inspected" : ""}" data-inspect-bag="${item.id}" aria-label="${item.name}${item.chromatic ? " chromatique" : ""}, quantité ${item.quantity}" aria-pressed="${selection?.source === "bag" && selection.id === item.id}" title="${item.name}${item.chromatic ? " chromatique" : ""}${item.slot ? " · Maj + clic pour équiper" : ""}">${itemIcon(item.kind === "core" ? "Noyau" : item.slot, item.chromatic, item.color, item)}<small>${item.quantity}</small></button>`).join("")}${Array.from({ length: emptyCount }, () => '<div class="bag-cell empty" aria-hidden="true"></div>').join("")}</div>${!items.length ? '<p class="bag-empty-hint">Aucun objet. Générez du matériel dans les outils dev ou récupérez du butin.</p>' : ""}<div class="bag-currency"><span>◈ ${state.gold} pièces</span><small>Sac partagé · Maj + clic : équiper</small></div></section>
  </div>${objectDetails(state, selection)}`;
}
