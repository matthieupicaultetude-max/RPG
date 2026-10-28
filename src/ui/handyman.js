import {
  KEY_RECIPES,
  CREVASSE_DUNGEON,
  createDungeonKey,
  dungeonKeyCount,
  handymanLevelXp,
} from "../data/handyman.js";
import { keyRecipeStatus, nearHandyman } from "../game/handyman.js";
import { renderItemIcon } from "./item-art.js";
export function renderHandyman(s, quantity = 1) {
  const dungeonId = KEY_RECIPES[s.handymanDungeon]
      ? s.handymanDungeon
      : CREVASSE_DUNGEON,
    recipe = KEY_RECIPES[dungeonId];
  const count = Math.max(1, Math.min(9999, Math.floor(Number(quantity) || 1))),
    job = s.handyman,
    costs = keyRecipeStatus(s, count, dungeonId),
    ready =
      nearHandyman(s) &&
      job.level >= recipe.level &&
      costs.every((c) => c.available >= c.required);
  return `<div class="petshop-heading"><p class="eyebrow">MÉTIER D’ARTISANAT</p><h2>Bricoleur · Niveau ${job.level}</h2><p>${job.xp} / ${handymanLevelXp(job.level)} XP · Fabriquez les clés des donjons et progressez en bricolage.</p><div class="xp-track"><span style="width:${(job.xp / handymanLevelXp(job.level)) * 100}%"></span></div></div><label for="key-dungeon">Clé à fabriquer <select id="key-dungeon">${Object.entries(
    KEY_RECIPES,
  )
    .map(
      ([id, r]) =>
        `<option value="${id}" ${id === dungeonId ? "selected" : ""}>${r.name}</option>`,
    )
    .join(
      "",
    )}</select></label><section class="handyman-craft"><div class="handyman-recipe-heading">${renderItemIcon(createDungeonKey(dungeonId))}<div><h3>${recipe.name}</h3><p>Bricoleur niveau ${recipe.level} · +${recipe.xp} XP par clé</p></div></div><p>${dungeonId === "slime-storm" ? "Le passage des Hauts des Alizés ouvre l’Œil des Tempêtes avec Nimbulimon." : dungeonId === CREVASSE_DUNGEON ? "La cascade des marais ouvre le Donjon de la Crevasse avec Gorgelimon." : "Le cratère des Champs de Braise ouvre le Donjon du Volcan avec Pyroclaste."} Une clé est consommée pour toute la troupe. Chaque entrée commence une nouvelle expédition. La sortie est gratuite.</p><span class="shop-location">${nearHandyman(s) ? "Atelier de Tessa · Fabrication disponible" : "Rejoignez Tessa à l’atelier de bricolage du village · F"}</span><label for="key-quantity">Nombre de clés <input id="key-quantity" type="number" min="1" max="9999" step="1" value="${count}"/></label><div class="key-ingredients">${costs.map((c, index) => `<article data-key-cost="${index}" class="key-ingredient ${c.available >= c.required ? "enough" : "missing"}">${renderItemIcon(c)}<div><strong>${c.name}</strong><small>${c.available} / ${c.required} · ${c.kind === "plank" ? "Bois récoltable au niveau 5 bûcheron" : "Ressource rare non chromatique"}</small></div></article>`).join("")}</div><button data-craft-keys ${ready ? "" : "disabled"}>Fabriquer ${count > 1 ? count + " clés" : "la clé"} · +${count * recipe.xp} XP</button><p class="panel-hint">${dungeonKeyCount(s, dungeonId)} clé(s) dans le sac. Les planches de frêne et les ressources chromatiques ne remplacent pas ces ingrédients. Le niveau 5 bûcheron sert à récolter votre châtaignier ; le bricolage utilise son propre niveau et sa propre XP.</p></section>`;
}

export function updateHandymanQuantity(s, panel) {
  const dungeonId = KEY_RECIPES[s.handymanDungeon]
      ? s.handymanDungeon
      : CREVASSE_DUNGEON,
    recipe = KEY_RECIPES[dungeonId];
  const input = panel.querySelector("#key-quantity"),
    button = panel.querySelector("[data-craft-keys]");
  if (!input || !button) return;
  const count = Number(input.value),
    valid = Number.isSafeInteger(count) && count >= 1 && count <= 9999,
    costs = keyRecipeStatus(s, valid ? count : 1, dungeonId);
  button.disabled =
    !valid ||
    !nearHandyman(s) ||
    s.handyman.level < recipe.level ||
    costs.some((c) => c.available < c.required);
  button.textContent = valid
    ? `Fabriquer ${count > 1 ? count + " clés" : "la clé"} · +${count * recipe.xp} XP`
    : "Choisissez une quantité valide";
  for (const [index, cost] of costs.entries()) {
    const row = panel.querySelector(`[data-key-cost="${index}"]`);
    if (!row) continue;
    row.classList.toggle("missing", !valid || cost.available < cost.required);
    row.classList.toggle("enough", valid && cost.available >= cost.required);
    row.querySelector("small").textContent =
      `${cost.available} / ${valid ? cost.required : "—"} · ${cost.kind === "plank" ? "Bois récoltable au niveau 5 bûcheron" : "Ressource rare non chromatique"}`;
  }
}
