import {monsterDefinition} from '../data/monsters.js';
import {sections,disclosure} from './organization.js';
import { ELEMENTS } from "../data/equipment.js";
import { PETS, BOSS_PETS } from "../data/pets.js";
import { adoptionProgress, nearPetShop } from "../game/pet-quests.js";
import { renderItemIcon } from "./item-art.js";

export function renderPetShop(state) {
  const nearby = nearPetShop(state);
  const header=`<div class="petshop-heading"><p class="eyebrow">ANIMALERIE DU VILLAGE</p><h2>Les compagnons de Nola</h2><p>Adoptez un compagnon ou découvrez les familiers de boss.</p><span class="shop-location">${nearby ? "Vous êtes près de Nola · Échanges disponibles" : "Rejoignez Nola à l’animalerie · Touche F à proximité"}</span></div>`;
  const adoptions=`<div class="adoption-grid">${PETS.map(
    (pet) => {
      const element = ELEMENTS[pet.element],
        quest = state.petQuests[pet.element],
        progress = adoptionProgress(state, pet.element),
        count = progress.filter((p) => p.obtained).length;
      const certificate = state.bag.some(
        (i) => i.kind === "certificate" && i.questId === pet.element,
      );
      const status = quest?.status;
      return `<article class="adoption-card"><div class="adoption-title">${renderItemIcon({ ...pet, kind: "pet", petSpecies: pet.monster })}<div><p class="eyebrow">${element.name} · ${element.stat}</p><h3>${pet.name}</h3><small>Panoplie ${element.set}</small></div><strong>${count}/9</strong></div><div class="xp-track"><span style="width:${(count / 9) * 100}%"></span></div><details class="ui-disclosure" data-disclosure="pet-${pet.element}"><summary>Pièces obtenues · ${count}/9</summary><ul class="adoption-checklist">${progress.map((p) => `<li class="${p.obtained ? "obtained" : ""}"><span>${p.obtained ? "✓" : "○"}</span> ${p.slot}</li>`).join("")}</ul></details><p class="pet-diet">Nourriture : <strong>${pet.food} chromatique</strong> · rare.</p>${status === "completed" ? '<p class="adoption-done">✓ Familier adopté · Quête terminée</p>' : status === "active" ? `<p class="certificate-state">${certificate ? "Certificat dans votre sac" : "Certificat manquant"} · ${count === 9 ? "Panoplie entièrement obtenue" : "Complétez la panoplie"}</p><button data-claim-pet="${pet.element}" ${!nearby || count < 9 || !certificate ? "disabled" : ""}>Adopter ${pet.name}</button>` : `<p class="certificate-state">Recevez un certificat, puis obtenez les 9 pièces.</p><button data-adopt="${pet.element}" ${!nearby ? "disabled" : ""}>Recevoir le certificat</button>`}</article>`;
    },
  ).join(
    "",
   )}</div>`;
  const bosses=`<h3>Familiers de boss · Niveau 10</h3><div class="adoption-grid">${BOSS_PETS.map(p=>`<article class="adoption-card"><div class="adoption-title">${renderItemIcon({...p,kind:'pet',petSpecies:p.monster,hybridId:p.hybridId})}<div><h3>${p.name}</h3><small>Panoplie biélément · ${p.elements.map(e=>ELEMENTS[e].name).join(' / ')}</small></div></div><p>5 % sur ${monsterDefinition(p.boss).name.split(",")[0]} · Sans quête.</p><p>Nourriture : ${p.food} chromatique (rare). Vitalité + deux caractéristiques.</p></article>`).join('')}</div>`;
  return header+sections('petshop',[{id:'adopt',label:'Adoptions',content:adoptions+disclosure('adoption-rules','Conditions d’adoption','<p>9 pièces distinctes obtenues dans les noyaux, sans obligation de les porter. Un certificat est remis au début de la quête. Une adoption par panoplie, sauvegardée.</p>')},{id:'boss',label:'Familiers de boss',content:bosses}]);
}
