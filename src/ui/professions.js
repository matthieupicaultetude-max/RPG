import { renderHandyman } from "./handyman.js";
import { sections, disclosure } from "./organization.js";
import {
  WOODS,
  cuttingDuration,
  woodcuttingLevelXp,
  woodItem,
} from "../data/woodcutting.js";
import { woodQuantity, nearSawmill } from "../game/woodcutting.js";
import { renderItemIcon } from "./item-art.js";
export function renderProfessions(
  s,
  quantity = 1,
  activeJob = "woodcutting",
  keyQuantity = 1,
) {
  const tabs = `<nav class="profession-tabs" aria-label="Choisir un métier"><button data-profession="woodcutting" aria-pressed="${activeJob === "woodcutting"}">Bûcheron · ${s.woodcutting.level}</button><button data-profession="handyman" aria-pressed="${activeJob === "handyman"}">Bricoleur · ${s.handyman?.level || 1}</button></nav>`;
  if (activeJob === "handyman") return tabs + renderHandyman(s, keyQuantity);
  const count = Math.max(1, Math.floor(Number(quantity) || 1)),
    job = s.woodcutting;
  const harvest = `<div class="wood-catalog">${WOODS.map((wood) => {
    const unlocked = job.level >= wood.level,
      ready = s.trees.filter(
        (t) => t.wood === wood.id && t.respawn === 0,
      ).length;
    return `<article class="wood-card"><div>${renderItemIcon(woodItem(wood.id))}<h3>${wood.name}<small>Niveau ${wood.level}</small></h3></div><p>${woodQuantity(s, wood.id)} en sac · ${ready} arbres</p><p>+${wood.xp} XP · Repousse ${wood.respawn} s</p><button data-job-harvest="${wood.id}" ${!unlocked || !ready ? "disabled" : ""}>${unlocked ? "Rejoindre et couper" : "Niveau " + wood.level + " requis"}</button></article>`;
  }).join(
    "",
  )}</div>${disclosure("woodcutting-help", "Comment récolter ?", "<p>Cliquez sur un arbre. Bouger, subir un dégât ou ouvrir un panneau interrompt la coupe. Une cible dorée reste 1 seconde : la toucher accélère la coupe de 25 %.</p>")}`;
  const craft = `<section class="sawmill-crafts"><span class="shop-location">${nearSawmill(s) ? "Scierie à portée" : "Rejoignez la scierie · F"}</span><label for="plank-quantity">Quantité <input id="plank-quantity" type="number" min="1" max="9999" step="1" value="${count}"/></label><div class="wood-catalog">${WOODS.map((wood) => `<article class="wood-card"><div>${renderItemIcon(woodItem(wood.id, "plank"))}<h3>${wood.plank}<small>Niveau ${wood.level}</small></h3></div><p>2 bois → 1 planche · +10 XP</p><p>${woodQuantity(s, wood.id)} bois · ${woodQuantity(s, wood.id, "plank")} planches</p><button data-craft-planks="${wood.id}" ${!nearSawmill(s) || job.level < wood.level || woodQuantity(s, wood.id) < count * 2 ? "disabled" : ""}>Fabriquer</button></article>`).join("")}</div></section><p class="panel-hint">Frêne : armures débutantes. Châtaignier : clés. Bois de noyer brut : armures biélément.</p>`;
  return (
    tabs +
    `<div class="petshop-heading"><p class="eyebrow">ARTISANAT · NIVEAU ${job.level}</p><h2>Bûcheron</h2><p>${job.xp} / ${woodcuttingLevelXp(job.level)} XP · Coupe ${cuttingDuration(job.level).toFixed(1)} s</p><div class="xp-track"><span style="width:${(job.xp / woodcuttingLevelXp(job.level)) * 100}%"></span></div></div>` +
    sections("woodcutting", [
      { id: "harvest", label: "Récolter", content: harvest },
      { id: "craft", label: "Fabriquer des planches", content: craft },
    ])
  );
}
