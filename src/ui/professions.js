import {
  WOODS,
  cuttingDuration,
  woodcuttingLevelXp,
} from "../data/woodcutting.js";
import { woodQuantity, nearSawmill } from "../game/woodcutting.js";
import { renderItemIcon } from "./item-art.js";
import { woodItem } from "../data/woodcutting.js";
export function renderProfessions(s, quantity = 1) {
  const count = Math.max(1, Math.floor(Number(quantity) || 1));
  const job = s.woodcutting;
  return `<div class="petshop-heading"><p class="eyebrow">MÉTIERS DE LA TROUPE</p><h2>Bûcheron · Niveau ${job.level}</h2><p>${job.xp} / ${woodcuttingLevelXp(job.level)} XP · Coupe : ${cuttingDuration(job.level).toFixed(1)} s · Récoltes et fabrication de planches donnent de l’XP.</p><div class="xp-track"><span style="width:${(job.xp / woodcuttingLevelXp(job.level)) * 100}%"></span></div><p>Cliquez sur un arbre : le personnage rejoint son tronc et coupe pendant quelques secondes. Déplacement manuel, sort, dégât, changement de personnage ou menu interrompent la récolte.</p></div><div class="wood-catalog">${WOODS.map(
    (wood) => {
      const unlocked = job.level >= wood.level,
        ready = s.trees.filter(
          (t) => t.wood === wood.id && t.respawn === 0,
        ).length;
      return `<article class="wood-card"><div>${renderItemIcon(woodItem(wood.id))}<h3>${wood.name}<small>Bûcheron niveau ${wood.level}</small></h3></div><p>${woodQuantity(s, wood.id)} bois en sac · ${ready} arbres disponibles</p><p>+${wood.xp} XP par coupe · Repousse ${wood.respawn} s</p><button data-job-harvest="${wood.id}" ${!unlocked || !ready ? "disabled" : ""}>${unlocked ? "Rejoindre et couper" : "Verrouillé · Niveau " + wood.level}</button></article>`;
    },
  ).join(
    "",
  )}</div><section class="sawmill-crafts"><h3>Scierie · Fabriquer des planches</h3><span class="shop-location">${nearSawmill(s) ? "Vous êtes à la scierie" : "Rejoignez la scierie du village · F à proximité"}</span><label for="plank-quantity">Nombre de planches <input id="plank-quantity" type="number" min="1" max="9999" step="1" value="${count}"/></label><div class="wood-catalog">${WOODS.map((wood) => `<article class="wood-card"><div>${renderItemIcon(woodItem(wood.id, "plank"))}<h3>${wood.plank}<small>Recette niveau ${wood.level}</small></h3></div><p>2 ${wood.log} → 1 planche · +10 XP bûcheron</p><p>${woodQuantity(s, wood.id)} bois · ${woodQuantity(s, wood.id, "plank")} planches en sac</p><button data-craft-planks="${wood.id}" ${!nearSawmill(s) || job.level < wood.level || woodQuantity(s, wood.id) < count * 2 ? "disabled" : ""}>Fabriquer les planches</button></article>`).join("")}</div></section><p class="panel-hint">Chaque amélioration chromatique d’une pièce d’armure demande désormais 5 Planches de frêne (niveau 1). Aucun bois ou planche chromatique. Les souches restent solides pendant la repousse.</p>`;
}
