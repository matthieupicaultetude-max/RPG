import {disclosure} from './organization.js';
import { SPELLS, spellById, spellAmount } from "../data/spells.js";
import { ELEMENTS } from "../data/equipment.js";
import {
  isSpellUnlocked,
  normalSpellLevel,
  ultimateChoices,
} from "../data/progression.js";
export function spellIcon(spell) {
  return spell
    ? `<span class="spell-icon" style="--spell-color:${ELEMENTS[spell.element].color}" aria-hidden="true">${{ earth: "◆", fire: "♨", air: "≋", water: "◉" }[spell.element]}${spell.ultimate ? "<b>✦</b>" : ""}</span>`
    : '<span class="spell-icon empty-spell" aria-hidden="true">?</span>';
}
export function renderSpellbook(state, slot = 0, filter = "all") {
  const member = state.team[state.main],
    choices = ultimateChoices(member),
    known = SPELLS.filter(
      (spell) =>
        spell.role === member.role &&
        !spell.ultimate &&
        isSpellUnlocked(member, spell),
    ).length;
  return `<div class="petshop-heading"><p class="eyebrow">GRIMOIRE · ${member.role === "melee" ? "COMBATTANT" : member.role === "support" ? "SOUTIEN" : "DISTANCE"}</p><h2>Les sorts de ${member.name}</h2><p>Niveau ${member.level} · ${known}/12 sorts normaux · ${member.learnedUltimates.length}/4 ultimes · <strong>${choices} choix d’ultime disponible${choices > 1 ? "s" : ""}</strong></p>${disclosure("spell-unlocks","Déblocage des sorts","<p>Un sort par niveau : Terre → Feu → Air → Eau. Un ultime au choix tous les 5 niveaux. Les éléments peuvent être mélangés.</p>")}</div><div class="spellbook-party">${state.team.map((m) => `<button data-main="${m.id}" aria-pressed="${m.id === state.main}">${m.name}</button>`).join("")}</div><div class="spell-loadout">${member.loadout
    .map((id, index) => {
      const spell = spellById(id);
      return `<button data-spell-slot="${index}" aria-pressed="${slot === index}">${spellIcon(spell)}<small>${["Base · Clic droit", "Sort 2 · R", "Sort 3 · C", "Ultime · T"][index]}</small><strong>${spell?.name || "Emplacement libre"}</strong><span>${spell ? ELEMENTS[spell.element].name : index === 3 ? "Choix aux niveaux 5, 10, 15, 20" : "Équipez un sort débloqué"}</span></button>`;
    })
    .join(
      "",
    )}</div><div class="spellbook-filter"><button data-unequip-spell="${slot}" ${member.loadout[slot] ? "" : "disabled"}>Déséquiper</button><h3>${slot === 3 ? "Choisir un ultime" : "Emplacement " + (slot + 1)}</h3><label>Élément <select id="spell-element">${["all", ...Object.keys(ELEMENTS)].map((element) => `<option value="${element}" ${element === filter ? "selected" : ""}>${element === "all" ? "Tous" : ELEMENTS[element].name}</option>`).join("")}</select></label></div><div class="spell-catalog">${SPELLS.filter(
    (spell) =>
      spell.role === member.role &&
      spell.ultimate === (slot === 3) &&
      (filter === "all" || filter === spell.element),
  )
    .map((spell) => {
      const equipped = member.loadout.includes(spell.id),
        unlocked = isSpellUnlocked(member, spell);
      const action =
        !unlocked && spell.ultimate
          ? `<button data-learn-ultimate="${spell.id}" ${choices < 1 ? "disabled" : ""}>${choices ? "Débloquer cet ultime · 1 choix" : `Prochain choix au niveau ${(Math.floor(member.level / 5) + 1) * 5}`}</button>`
          : `<button data-equip-spell="${spell.id}" ${equipped || !unlocked ? "disabled" : ""}>${!unlocked ? "Verrouillé · Niveau " + normalSpellLevel(spell) : member.loadout[slot] === spell.id ? "Équipé ici" : equipped ? "Déjà équipé" : `Équiper ${slot === 3 ? "en ultime" : "dans le slot " + (slot + 1)}`}</button>`;
      return `<article class="spell-card ${unlocked ? "" : "locked-spell"}" style="--spell-color:${ELEMENTS[spell.element].color}"><div>${spellIcon(spell)}<h4>${spell.name}<small>${ELEMENTS[spell.element].name} · ${unlocked ? "Débloqué" : spell.ultimate ? "À choisir dès le niveau 5" : "Niveau " + normalSpellLevel(spell)}</small></h4></div>${disclosure(`spell-${spell.id}`,"Effets",`<p>${spell.description}</p>`)}<small><strong>${spellAmount(member, spell)}</strong> · Portée ${spell.range || "Soi"}${spell.ultimate ? " · Jauge 100 · Recharge 20 s" : ` · Recharge ${spell.cooldown} s`}</small>${action}</article>`;
    })
    .join(
      "",
    )}</div>${disclosure("spell-formula","Calcul des dégâts et soins",`<p>Dégâts et soins : base × [1 + (caractéristique de l’élément du sort + Puissance) / 100]. Les choix d’ultime non dépensés sont conservés. La fontaine réinitialise uniquement les caractéristiques ; les sorts appris restent acquis.</p>`)}`;
}
export function updateSpellBar(state, container) {
  const member = state.team[state.main],
    key = `${member.id}:${member.level}:${member.loadout.join(",")}`;
  if (container.dataset.loadout !== key) {
    container.dataset.loadout = key;
    container.innerHTML = member.loadout
      .map((id, index) => {
        const spell = spellById(id);
        return `<button data-cast-spell="${index}" aria-label="${spell?.name || "Emplacement libre"}${index===0?" · Sort de base":index===3?" · Ultime":""}" title="${spell ? `${spell.name} · ${ELEMENTS[spell.element].name} — ${spell.description}` : "Choisissez un sort débloqué dans le grimoire (K)"}" style="--spell-color:${spell ? ELEMENTS[spell.element].color : "#65715d"}">${spellIcon(spell)}<span class="touch-spell-label">${index===0?"Base":index===3?"Ultime":`Sort ${index+1}`}</span><strong>${spell?.name || "Emplacement libre"}</strong><kbd>${["Clic droit", "R", "C", "T"][index]}</kbd><small class="spell-timer"></small><span class="spell-charge-track"><span></span></span></button>`;
      })
      .join("");
  }
  container.querySelectorAll("[data-cast-spell]").forEach((button, index) => {
    const spell = spellById(member.loadout[index]);
    if (!spell) {
      button.disabled = true;
      button.querySelector(".spell-timer").textContent =
        index === 3 && member.level < 5 ? "Niveau 5" : "À équiper";
      button.querySelector(".spell-charge-track > span").style.width = "0%";
      return;
    }
    const cooldown = member.spellCooldowns[spell.id] || 0,
      danceExit = index === 3 && member.buffs.dance?.time > 0;
    button.setAttribute("aria-label",`${danceExit?"Choisir la sortie":spell.name}${index===0?" · Sort de base":index===3?" · Ultime":""}`);
    button.disabled =
      member.hp <= 0 ||
      !isSpellUnlocked(member, spell) ||
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
