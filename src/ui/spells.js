import { SPELLS, spellById, spellAmount } from "../data/spells.js";
import { ELEMENTS } from "../data/equipment.js";
export function spellIcon(spell) {
  return `<span class="spell-icon" style="--spell-color:${ELEMENTS[spell.element].color}" aria-hidden="true">${{ earth: "◆", fire: "♨", air: "≋", water: "◉" }[spell.element]}${spell.ultimate ? "<b>✦</b>" : ""}</span>`;
}
export function renderSpellbook(state, slot = 0, filter = "all") {
  const member = state.team[state.main];
  return `<div class="petshop-heading"><p class="eyebrow">GRIMOIRE · ${member.role === "melee" ? "COMBATTANT" : member.role === "support" ? "SOUTIEN" : "DISTANCE"}</p><h2>Les sorts de ${member.name}</h2><p>Équipez trois sorts et un ultime personnel de votre classe. Mélangez librement Terre, Feu, Air et Eau. Les recharges et la jauge restent attachées au personnage.</p></div><div class="spellbook-party">${state.team.map((m) => `<button data-main="${m.id}" aria-pressed="${m.id === state.main}">${m.name}</button>`).join("")}</div><div class="spell-loadout">${member.loadout
    .map((id, index) => {
      const spell = spellById(id);
      return `<button data-spell-slot="${index}" aria-pressed="${slot === index}">${spellIcon(spell)}<small>${["Clic droit", "R", "C", "T · Ultime"][index]}</small><strong>${spell.name}</strong><span>${ELEMENTS[spell.element].name}</span></button>`;
    })
    .join(
      "",
    )}</div><div class="spellbook-filter"><h3>${slot === 3 ? "Choisir l’ultime personnel" : "Choisir le sort de l’emplacement " + (slot + 1)}</h3><label>Élément <select id="spell-element">${["all", ...Object.keys(ELEMENTS)].map((element) => `<option value="${element}" ${element === filter ? "selected" : ""}>${element === "all" ? "Tous" : ELEMENTS[element].name}</option>`).join("")}</select></label></div><div class="spell-catalog">${SPELLS.filter(
    (spell) =>
      spell.role === member.role &&
      spell.ultimate === (slot === 3) &&
      (filter === "all" || filter === spell.element),
  )
    .map((spell) => {
      const equipped = member.loadout.includes(spell.id);
      return `<article class="spell-card" style="--spell-color:${ELEMENTS[spell.element].color}"><div>${spellIcon(spell)}<h4>${spell.name}<small>${ELEMENTS[spell.element].name}</small></h4></div><p>${spell.description}</p><small>Base ${spell.base} → <strong>${spellAmount(member, spell)}</strong> après caractéristiques · Portée ${spell.range || "Soi"}${spell.ultimate ? " · Jauge 100 · Recharge 20 s" : ` · Recharge ${spell.cooldown} s`}</small><button data-equip-spell="${spell.id}" ${equipped ? "disabled" : ""}>${member.loadout[slot] === spell.id ? "Équipé ici" : equipped ? "Déjà équipé" : `Équiper ${slot === 3 ? "en ultime" : "dans le slot " + (slot + 1)}`}</button></article>`;
    })
    .join(
      "",
    )}</div><p class="panel-hint">Dégâts et soins : base × [1 + (caractéristique de l’élément du sort + Puissance) / 100]. L’arme ne change pas l’élément du sort. L’ultime personnel se charge sur les dégâts, soins effectifs et absorptions en combat ; E reste le déploiement de troupe.</p>`;
}
export function updateSpellBar(state, container) {
  const member = state.team[state.main],
    key = `${member.id}:${member.loadout.join(",")}`;
  if (container.dataset.loadout !== key) {
    container.dataset.loadout = key;
    container.innerHTML = member.loadout
      .map((id, index) => {
        const spell = spellById(id);
        return `<button data-cast-spell="${index}" title="${spell.name} · ${ELEMENTS[spell.element].name} — ${spell.description}" style="--spell-color:${ELEMENTS[spell.element].color}">${spellIcon(spell)}<strong>${spell.name}</strong><kbd>${["Clic droit", "R", "C", "T"][index]}</kbd><small class="spell-timer"></small><span class="spell-charge-track"><span></span></span></button>`;
      })
      .join("");
  }
  container.querySelectorAll("[data-cast-spell]").forEach((button, index) => {
    const spell = spellById(member.loadout[index]),
      cooldown = member.spellCooldowns[spell.id] || 0;
    const danceExit = index === 3 && member.buffs.dance?.time > 0;
    button.disabled =
      member.hp <= 0 ||
      (!danceExit &&
        (member.cooldown > 0 ||
          cooldown > 0 ||
          (index === 3 && member.ultimateCharge < 100)));
    button.querySelector("strong").textContent = danceExit
      ? "Choisir la sortie"
      : spell.name;
    button.querySelector(".spell-timer").textContent = danceExit
      ? "Sortie"
      : cooldown > 0.05
        ? `${cooldown.toFixed(1)} s`
        : index === 3
          ? `${Math.floor(member.ultimateCharge)} / 100`
          : "Prêt";
    button.querySelector(".spell-charge-track > span").style.width =
      `${index === 3 ? member.ultimateCharge : cooldown ? Math.max(0, 100 * (1 - cooldown / (spell.cooldown || 20))) : 100}%`;
  });
}
