import { ELEMENTS } from "../data/equipment.js";
import { PETS, BOSS_PETS } from "../data/pets.js";
import { adoptionProgress, nearPetShop } from "../game/pet-quests.js";
import { renderItemIcon } from "./item-art.js";

export function renderPetShop(state) {
  const nearby = nearPetShop(state);
  return `<div class="petshop-heading"><p class="eyebrow">ANIMALERIE DU VILLAGE</p><h2>Les compagnons de Nola</h2><p>« Obtiens une panoplie complète et je te confierai le petit compagnon qui lui ressemble. Tes équipements restent à toi. »</p><span class="shop-location">${nearby ? "Vous êtes près de Nola · Échanges disponibles" : "Rejoignez Nola à l’animalerie · Touche F à proximité"}</span></div><div class="adoption-grid">${PETS.map(
    (pet) => {
      const element = ELEMENTS[pet.element],
        quest = state.petQuests[pet.element],
        progress = adoptionProgress(state, pet.element),
        count = progress.filter((p) => p.obtained).length;
      const certificate = state.bag.some(
        (i) => i.kind === "certificate" && i.questId === pet.element,
      );
      const status = quest?.status;
      return `<article class="adoption-card"><div class="adoption-title">${renderItemIcon({ ...pet, kind: "pet", petSpecies: pet.monster })}<div><p class="eyebrow">${element.name} · ${element.stat}</p><h3>${pet.name}</h3><small>Panoplie ${element.set}</small></div><strong>${count}/9</strong></div><div class="xp-track"><span style="width:${(count / 9) * 100}%"></span></div><ul class="adoption-checklist">${progress.map((p) => `<li class="${p.obtained ? "obtained" : ""}"><span>${p.obtained ? "✓" : "○"}</span> ${p.slot}</li>`).join("")}</ul><p class="pet-diet">Nourriture : <strong>${pet.food} chromatique</strong> · rare.</p>${status === "completed" ? '<p class="adoption-done">✓ Familier adopté · Quête terminée</p>' : status === "active" ? `<p class="certificate-state">${certificate ? "Certificat dans votre sac" : "Certificat manquant"} · ${count === 9 ? "Panoplie entièrement obtenue" : "Continuez à ouvrir les noyaux de cet élément"}</p><button data-claim-pet="${pet.element}" ${!nearby || count < 9 || !certificate ? "disabled" : ""}>Échanger le certificat contre ${pet.name}</button>` : `<p class="certificate-state">Un certificat vous sera remis à l’acceptation. Les pièces obtenues auparavant comptent aussi.</p><button data-adopt="${pet.element}" ${!nearby ? "disabled" : ""}>Accepter la quête · Recevoir le certificat</button>`}</article>`;
    },
  ).join(
    "",
  )}</div><h3>Familiers de boss · Niveau 10</h3><div class="adoption-grid">${BOSS_PETS.map(p=>`<article class="adoption-card"><div class="adoption-title">${renderItemIcon({...p,kind:'pet',petSpecies:p.monster,hybridId:p.hybridId})}<div><h3>${p.name}</h3><small>Panoplie biélément · ${p.elements.map(e=>ELEMENTS[e].name).join(' / ')}</small></div></div><p>Butin de son boss à 5 % par victoire. Aucune quête d’adoption.</p><p>Nourriture : ${p.food} chromatique (rare). Deux caractéristiques et vitalité augmentent avec son niveau.</p></article>`).join('')}</div><p class="panel-hint">Neuf pièces distinctes obtenues dans les noyaux, sans obligation de les porter ensemble. Une adoption par panoplie, conservée dans la sauvegarde. Les ressources normales chromatiques sont utilisées à la forge pour améliorer les armures.</p>`;
}
