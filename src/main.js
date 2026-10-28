import {volcanoBoss,nearVolcanoBoss,awakenVolcanoBoss} from './game/volcano.js';
import {updateHandymanQuantity} from './ui/handyman.js';
import {nearHandyman,craftDungeonKeys,grantHandymanXp} from './game/handyman.js';
import {createMobileHud} from './ui/mobile-hud.js';
import {depthsBoss,nearDepthsBoss,awakenDepthsBoss} from './game/depths-boss.js';
import {nearZoneGate,useZoneGate,travelToZone} from './game/zone-travel.js';
import { characterArt, paintCharacterArt } from './ui/character-art.js';
import { nearTutorialExit, canWalkZone, movePartyToZone } from './world/zones.js';
import { finishTutorial, canLeaveTutorial, visitTutorialPanel, inspectTutorialMonster } from './game/tutorial.js';
import { createTutorialUI } from './ui/tutorial.js';
import { createAudioUI } from './ui/audio.js';
import { renderProfessions } from './ui/professions.js';
import { requestCut, craftPlanks, woodQuantity, nearSawmill, cancelWoodcutting, grantWoodcuttingXp, addWoodItem } from './game/woodcutting.js';
import { woodById } from './data/woodcutting.js';
import { renderCharacteristics } from './ui/characteristics.js';
import { nearFountain, allocateCharacteristic, resetCharacteristics, learnUltimate } from './data/progression.js';
import { renderSpellbook, updateSpellBar } from './ui/spells.js';
import { equipSpell, unequipSpell } from './data/spells.js';
import { renderForge } from './ui/forge.js';
import { nearForge, upgradeChromatic, recycleEquipment, exchangeCoreFragments } from './game/forge.js';
import { renderPetShop } from "./ui/petshop.js";
import { acceptAdoption, claimPet, feedPet, nearPetShop } from "./game/pet-quests.js";
import { MONSTERS } from "./data/monsters.js";
import { ELEMENTS } from './data/equipment.js';
import { renderBestiary, bestiaryValues, coreDropMarkup } from './ui/bestiary.js';
import { renderInventory } from './ui/inventory.js';
import './style.css';
import { createGame } from './game/create-game.js';
import { ROLES, COLORS, SLOTS, teleport, chooseMain, grantXp, heal, grantLoot, grantCore, openCore, openCores, giveEquipment, giveMaximizedSets, equip, unequip, attack, note, toggleCombatMode, castEquipped } from './dev/sandbox.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="game-screen">
  <canvas width="640" height="400" tabindex="0" aria-label="Jardin des essais. Flèches ou ZQSD pour bouger, molette pour changer de personnage, clic gauche sur les cibles bonus, clic droit, R et C pour les sorts, T pour l’ultime personnel, E pour basculer combat ou exploration, K pour le grimoire, P pour les caractéristiques, I pour l’inventaire."></canvas>
  <div class="hud-top"><div class="zone-card"><span class="eyebrow">AURORIA · ZONE DEV</span><h1>Jardin des essais</h1><span class="session-label"><i></i> Session locale · 3 bots</span></div><div class="menu-dock"><button id="mobile-menu-toggle" aria-label="Ouvrir le menu" aria-controls="hud-menu-panel" aria-expanded="false" hidden><span aria-hidden="true">☰</span></button><nav class="hud-menu" id="hud-menu-panel" aria-label="Menu du jeu"><button data-action="inventory" aria-controls="inventory" aria-expanded="false">▣ Inventaire <kbd>I</kbd></button><button data-action="bestiary" aria-label="Bestiaire B">☷ <span>Bestiaire</span> <kbd>B</kbd></button><button data-action="characteristics">◈ <span>Carac.</span> <kbd>P</kbd></button><button data-action="spells">✦ <span>Grimoire</span> <kbd>K</kbd></button><button data-action="professions">🪓 <span>Métiers</span> <kbd>L</kbd></button><button data-action="tools">⚙ Outils dev</button><button data-action="audio" aria-label="Réglages audio">🔊</button><button data-action="marsh-help" id="marsh-help" aria-label="Guide de la zone" hidden>✿<span class="mobile-menu-label">Guide</span></button><button data-action="lighting" aria-label="Lumière dorée" aria-pressed="true" title="Désactiver la lumière dorée">☀<span class="mobile-menu-label">Lumière</span></button><button data-action="fullscreen" aria-label="Basculer le plein écran">⛶<span class="mobile-menu-label">Écran</span></button></nav></div></div><button id="mobile-menu-scrim" aria-label="Fermer le menu" tabindex="-1" hidden></button>
  <div class="hud-team"><p class="hud-hint">VOTRE TROUPE <span>↕ Molette pour changer</span></p><div id="team" class="team-grid"></div></div>
  <div class="hud-notification" id="notification" role="status"></div>
  <div class="hud-bottom"><div class="controls-hint"><kbd>ZQSD</kbd> Bouger <span>·</span> <kbd>Clic droit</kbd> Attaquer <span>·</span> <kbd>Clic gauche</kbd> Cible bonus <span>·</span> <kbd>↕</kbd> Changer</div><div class="action-bar"><div id="spellbar" class="spellbar"></div><div class="ultimate-box"><button data-action="deploy" id="deploy">Exploration · E</button><span id="combat-status">Combat · 3 personnages · Vitesse normale</span></div></div></div>
  <aside id="marsh-guide" class="marsh-guide" aria-label="Guide des Marais de Gelée" hidden><p class="eyebrow">MARAIS DE GELÉE</p><h2>Absorption & fleurs éponges</h2><p>La cascade au sud-est mène au Donjon de la Crevasse : une Clé de la Crevasse est consommée pour toute la troupe. Fabriquez-la à l’atelier de bricolage de Tessa au village. Chaque saut de slime laisse une flaque pendant 18 s. Un slime qui y atterrit l’absorbe et grossit, jusqu’à trois tailles : plus de PV, de dégâts et une zone plus large, avec une préparation plus lente.</p><p>Faites rater le saut d’un gros slime : il perd une taille et libère un slime de taille 1, puis devient vulnérable pendant 2,5 s et reçoit +50 % de dégâts.</p><p>Un slime qui atterrit sur une fleur éponge violette boit son nectar et gagne une taille, jusqu’à trois. La fleur se recharge en 10 s et ne nettoie pas les flaques. Évitez les fleurs pour limiter la croissance, ou attirez-y un slime pour exploiter sa vulnérabilité après un saut raté !</p><button data-action="close-marsh-guide">Compris · Explorer le marais</button></aside>
  <aside id="depths-guide" class="marsh-guide" aria-label="Guide des profondeurs" hidden><p class="eyebrow">DONJON · SOUS LA CASCADE</p><h2>Le Donjon de la Crevasse</h2><p>Les slimes abyssaux (Eau) et de limon (Terre), niveau 5, sont plus agressifs : attaques rapides, poursuite plus longue et peu de répit. Les slimes Eau bondissent ; les formes Terre chargent en roulade. Les zones d’impact annoncent toujours leurs attaques.</p><p>Esquivez le bond Eau d’un gros slime : il perd une taille et libère un petit. Deux slimes proches peuvent fusionner jusqu’à la taille 3 ; des anneaux dorés annoncent la fusion pendant 1 seconde. Repoussez-les ou éliminez-en un pour l’interrompre. Après une scission ou une fusion, ils attendent 5 secondes avant de refusionner.</p><p>Les slimes de limon et les fusions mixtes portent une carapace qui réduit les dégâts de 40 %. Attirez leur roulade Terre contre une stalagmite ou une paroi : le cœur est exposé 3 secondes (+50 % de dégâts). Les rives des mares ne brisent pas la protection. Les formes mixtes alternent bond Eau et roulade Terre. Séparez la horde ! Gorgelimon, boss de niveau 8, sommeille au sud-est : approchez puis appuyez sur F. À 70 % et 35 % de vie, éliminez ses aspects avant leur réabsorption. La remontée lumineuse à l’ouest vous ramène aux marais. Votre clé ouvre une nouvelle expédition. Les ennemis vaincus restent morts pendant ce parcours ; une défaite vous soigne à l’entrée sans nouvelle clé. La remontée est gratuite, puis il faudra une autre clé pour recommencer.</p><button data-action="close-depths-guide">Compris · Explorer la crevasse</button></aside>
  <aside id="wind-guide" class="marsh-guide" aria-label="Guide des Hauts des Alizés" hidden><p class="eyebrow">HAUTS DES ALIZÉS · AIR</p><h2>Aspiration et ricochets</h2><p>Les slimes des alizés se gonflent pendant 1,8 seconde. Le grand cercle indique l’aspiration, le petit l’explosion à venir : éloignez-vous pendant qu’ils inspirent ! L’aspiration est moins rapide que votre marche et ne traverse pas les obstacles ou les précipices.</p><p>À pleine taille, ils libèrent une explosion d’Air puis se propulsent pour deux bonds en ricochet. Les cercles 1 et 2 sont annoncés dès le début et restent fixes : évitez les deux atterrissages, même après avoir esquivé le souffle.</p><p>Un sort d’immobilisation pendant le gonflement ou la pause entre les bonds peut interrompre le cycle. Après les deux bonds, le slime doit récupérer avant de recommencer.</p><p>Les ponts suspendus relient les trois plateaux. Le passage à l’ouest ramène aux montagnes. La zone est accessible sans clé.</p><button data-action="close-wind-guide">Compris · Explorer les alizés</button></aside>
  <aside id="volcano-guide" class="marsh-guide" aria-label="Guide du Donjon du Volcan" hidden><p class="eyebrow">DONJON · TERRE / FEU</p><h2>La Fournaise de Pyroclaste</h2><p>Les slimes de magma portent une carapace qui réduit les dégâts de 40 %. Après avoir reçu 25 % de leurs PV maximaux en dégâts, elle éclate après un cercle d’avertissement de 1,1 seconde. Pas de roulade : ils bondissent.</p><p>L’explosion projette six éclaboussures de magma, annoncées au sol avant leur arrivée. Elles restent jusqu’à la sortie ou la défaite : le contact d’un personnage ne les consomme pas, et rester dedans inflige des brûlures répétées.</p><p>Pyroclaste, boss de niveau 9, sommeille au nord-est. Approchez puis F pour le réveiller. Ses éruptions projettent des slimes aux positions annoncées : esquivez les atterrissages ! Sous 40 % de vie, le rythme s’accélère. Six invocations vivantes maximum, sans XP ni loot.</p><p>Une Clé du Volcan ouvre une expédition pour toute la troupe. La sortie à l’ouest est gratuite ; une défaite soigne à l’entrée sans autre clé.</p><button data-action="close-volcano-guide">Compris · Entrer dans la fournaise</button></aside>
  <aside id="fire-guide" class="marsh-guide" aria-label="Guide des Champs de Braise" hidden><p class="eyebrow">CHAMPS DE BRAISE</p><h2>Ne restez pas dans les flammes</h2><p>Les slimes de braise, d’élément Feu et de niveau 5, surgissent des bassins de lave avant de sautiller sur le basalte. Leurs déplacements et leurs bonds laissent des braises : après 0,35 seconde, elles brûlent pendant 4 secondes. Les cercles de bond annoncent les impacts.</p><p>À sa mort, chaque slime explose après 0,9 seconde dans le cercle annoncé. Éloignez toute la troupe, même après le coup fatal ! Les brûlures de traînées superposées ne se cumulent pas : au maximum une touche toutes les 0,6 seconde par personnage.</p><p>La lave est infranchissable. Le passage à l’ouest ramène aux Cimes de Schiste. Le cratère central mène au Donjon du Volcan avec une Clé du Volcan, fabriquée chez Tessa.</p><button data-action="close-fire-guide">Compris · Explorer les braises</button></aside>
  <aside id="mountain-guide" class="marsh-guide" aria-label="Guide des Cimes de Schiste" hidden><p class="eyebrow">CIMES DE SCHISTE</p><h2>Brisez la carapace</h2><p>Les slimes de schiste sont d’élément Terre. Leur carapace réduit tous les dégâts de 40 %.</p><p>Placez un gros rocher ou une paroi derrière vous. Attendez le couloir doré de leur charge, puis esquivez sur le côté : le slime roule tout droit et percute l’obstacle.</p><p>La collision brise sa carapace et expose son cœur pendant 3 secondes : il est étourdi et reçoit +50 % de dégâts. Sa protection reste brisée jusqu’à sa réapparition. Les bords des précipices arrêtent la charge sans briser la carapace.</p><p>Les ponts relient les trois plateaux. Le passage au sud-ouest redescend au village ; celui au sud-est rejoint les Champs de Braise, et le passage du plateau central mène aux Hauts des Alizés.</p><button data-action="close-mountain-guide">Compris · Explorer les cimes</button></aside>
  <section id="boss-hud" class="boss-hud" aria-label="Gorgelimon, barre de vie du boss" hidden><div><strong>Gorgelimon</strong><span>Niveau 8 · Eau / Terre</span></div><div class="boss-life"><progress max="1" value="1" aria-label="Vie de Gorgelimon"></progress><i style="left:35%"></i><i style="left:70%"></i></div><p></p></section><button id="boss-interaction" data-action="awaken-boss" class="world-interaction" hidden>Réveiller Gorgelimon · F</button>
  <button id="zone-gate" data-action="zone-gate" class="world-interaction" hidden></button><button id="tutorial-exit" data-action="tutorial-exit" class="world-interaction" hidden>Rejoindre le village · F</button><div id="harvest-status" class="harvest-status" hidden><span></span><progress max="1" value="0"></progress><button data-action="cancel-harvest">Annuler</button></div><button id="handyman-interaction" data-action="handyman" class="world-interaction" hidden>Atelier de bricolage · F</button><button id="sawmill-interaction" data-action="sawmill" class="world-interaction" hidden>Scierie · F</button><button id="fountain-interaction" data-action="fountain" class="world-interaction" hidden>Fontaine du renouveau · F</button><button id="forge-interaction" data-action="forge" class="world-interaction" hidden>Parler à Borin · F</button><button id="petshop-interaction" data-action="petshop" class="world-interaction" hidden>Parler à Nola · F</button><div class="touch-controls"><div class="joystick" data-joystick role="group" aria-label="Joystick de déplacement"><div class="joystick-base" aria-hidden="true"></div><div class="joystick-knob" aria-hidden="true"></div></div><span class="joystick-caption" aria-hidden="true">DÉPLACER</span></div>
  <div id="inventory-backdrop" class="inventory-backdrop" hidden></div>
  <section id="inventory" class="inventory-window" role="dialog" aria-modal="true" aria-labelledby="inventory-title" hidden>
    <h2 id="inventory-title" class="sr-only">Inventaire</h2>
    <div id="panel"></div>
    <div class="inventory-footer"><nav class="tabs" aria-label="Panneaux de l’inventaire"><button data-tab="equipment" aria-pressed="true">Équipement & sac <span id="bag-count">0</span></button><button data-tab="bestiary" aria-pressed="false">Bestiaire</button><button data-tab="petshop" aria-pressed="false">Animalerie</button><button data-tab="forge" aria-pressed="false">Forge</button><button data-tab="characteristics" aria-pressed="false">Caractéristiques</button><button data-tab="spells" aria-pressed="false">Grimoire</button><button data-tab="professions" aria-pressed="false">Métiers</button><button data-tab="tools" aria-pressed="false">Outils dev</button></nav><button data-action="close-inventory" aria-label="Fermer l’inventaire">✕ <kbd>Échap</kbd></button></div>
  </section>
</main>`;
const sound=createAudioUI(app);
let inventoryOpen = false;
let currentTab = 'equipment';
let selectedItem = null;
let bagFilter = 'all';
let bestiaryMonster = 'slime';
let bestiaryLevel = 1;
let spellSlot=0;
let spellFilter='all';
let professionTab='woodcutting';
let forgeItem = null;
let devLootMonster = 'slime';
const panel = app.querySelector('#panel');
function refresh(s) {
  app.querySelector('#team').innerHTML = s.team.map((m,i)=>`<button class="member ${i===s.main?'selected':''} ${m.hp===0?'fallen':''}" data-main="${i}" aria-label="${m.name} · ${ROLES[m.role]} · Niveau ${m.level}" style="--role:${COLORS[m.role]}" aria-pressed="${i===s.main}"><span class="portrait">${characterArt(m,true)}</span><span class="member-text"><strong>${m.name}<small>Niv. ${m.level}</small></strong><span>${ROLES[m.role]}</span><span class="hp-track"><span style="width:${m.hp/m.maxHp*100}%"></span></span><small>${m.hp} / ${m.maxHp} PV</small></span></button>`).join('');
  paintCharacterArt(app.querySelector('#team'),s.team);
  app.querySelector('#bag-count').textContent = s.bag.reduce((sum,item)=>sum+item.quantity,0);
  refreshUltimate(s);
  app.querySelector('#notification').textContent = s.log[0];
  if (!inventoryOpen) return;
  const previousKeyQuantity=panel.querySelector('#key-quantity')?.value;
  const previousPlankQuantity=panel.querySelector('#plank-quantity')?.value;
  const previousStatQuantity = panel.querySelector('#stat-quantity')?.value;
  const previousCore = panel.querySelector('[data-open-core]')?.dataset.openCore;
  const previousQuantity = panel.querySelector('#core-quantity')?.value;
  const previousSlot = panel.querySelector('#equipment-slot')?.value;
  const focus = panel.contains(document.activeElement) ? document.activeElement : null;
  const focusAttribute = focus && ['data-craft-keys','data-profession','data-craft-planks','data-job-harvest','data-allocate-stat','data-reset-characteristics','data-learn-ultimate','data-spell-slot','data-equip-spell','data-unequip-spell','data-forge-select','data-forge-recycle','data-exchange-core','data-forge-upgrade','data-action','data-adopt','data-claim-pet','data-feed-pet','data-core','data-open-cores','data-open-core','data-monster','data-inspect-slot','data-inspect-bag','data-slot','data-equip'].find(name=>focus.hasAttribute(name));
  const focusKey = focus?.id ? `#${CSS.escape(focus.id)}` : focusAttribute ? `[${focusAttribute}="${CSS.escape(focus.getAttribute(focusAttribute))}"]` : null;
  const scrollTop = panel.scrollTop;
  const bagScrollTop = panel.querySelector('.inventory-items')?.scrollTop || 0;
  const m = s.team[s.main];
  if(currentTab==='bestiary' && panel.querySelector('.monster-sheet')?.dataset.species!==bestiaryMonster) {
    panel.innerHTML = renderBestiary(bestiaryMonster,bestiaryLevel);
    panel.querySelector('.monster-sheet').dataset.species = bestiaryMonster;
  }
  app.querySelector('#inventory-title').textContent = currentTab==='professions'?'Métiers':currentTab==='characteristics' ? 'Caractéristiques' : currentTab==='spells' ? 'Grimoire' : currentTab==='bestiary' ? 'Bestiaire' : currentTab==='petshop' ? 'Animalerie' : currentTab==='forge' ? 'Forge' : 'Inventaire';
  app.querySelector('#inventory').classList.toggle('bestiary-open',currentTab==='bestiary');
  if(currentTab==='professions')panel.innerHTML=renderProfessions(s,previousPlankQuantity||1,professionTab,previousKeyQuantity||1);
  app.querySelector('#inventory').classList.toggle('professions-open',currentTab==='professions');
  if(currentTab==='characteristics')panel.innerHTML=renderCharacteristics(s);
  app.querySelector('#inventory').classList.toggle('characteristics-open',currentTab==='characteristics');
  if(currentTab==='spells') panel.innerHTML=renderSpellbook(s,spellSlot,spellFilter);
  app.querySelector('#inventory').classList.toggle('spells-open',currentTab==='spells');
  if(currentTab==='forge') panel.innerHTML = renderForge(s,forgeItem);
  app.querySelector('#inventory').classList.toggle('forge-open',currentTab==='forge');
  if(currentTab==='petshop') panel.innerHTML = renderPetShop(s);
  app.querySelector('#inventory').classList.toggle('petshop-open',currentTab==='petshop');
  if(currentTab==='equipment') {panel.innerHTML = renderInventory(s, selectedItem, bagFilter);paintCharacterArt(panel,s.team);}
  if(currentTab==='tools') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">BAC À SABLE</p><h2>Outils de développement</h2><p>Essayez sans attendre ni farmer.</p></div><section class="tool-group"><h3>Progression & combat</h3><div class="tool-buttons"><button data-action="xp">+50 XP à l’équipe</button><button data-action="heal">Soigner / réanimer</button><button data-action="spell-charge">Charger les ultimes personnels</button><button data-action="auto" aria-pressed="${s.autoAttack}">Attaque auto : ${s.autoAttack?'oui':'non'}</button></div></section><section class="tool-group"><h3>Bûcheron · Essais</h3><div class="tool-buttons"><button data-action="job-xp">+30 XP bûcheron</button><button data-action="job-wood">10 Bois de frêne (test)</button><button data-action="sawmill-teleport">Scierie</button><button data-action="woodcutting-teleport">Bosquet</button></div></section><section class="tool-group"><h3>Bricoleur · Essais</h3><div class="tool-buttons"><button data-action="handyman-teleport">Atelier de bricolage</button><button data-action="key-supplies">Ingrédients pour 1 clé</button><button data-action="volcano-key-supplies">Ingrédients pour 1 clé du Volcan</button><button data-action="handyman-xp">+30 XP bricoleur</button></div><p class="panel-hint">Les accès directs au donjon dans les outils dev ne consomment pas de clé. La cascade et le cratère consomment chacun la clé de leur donjon.</p></section><section class="tool-group"><h3>Noyaux débutants · 1–10</h3><div class="tool-buttons">${Object.entries(ELEMENTS).map(([element,e])=>`<button data-core="${element}">Noyau de ${e.name}</button>`).join('')}</div><p class="panel-hint">Ouvrez-les où vous voulez pour obtenir une pièce aléatoire.</p></section><section class="tool-group"><h3>Générer du loot</h3><label for="loot-monster">Monstre source</label><select id="loot-monster">${MONSTERS.map(monster=>`<option value="${monster.id}" ${devLootMonster===monster.id?'selected':''}>${monster.name}</option>`).join('')}</select><div class="loot-buttons"><button data-loot="normal">Normal</button><button data-loot="rare">Rare</button><button data-loot="normal" data-chromatic="true">✦ Normal chromatique</button><button data-loot="rare" data-chromatic="true">✦ Rare chromatique</button></div><p class="panel-hint">Combat de test : 20 % rare et 10 % chromatique. Ces taux ne fixent pas l’équilibrage final.</p></section><section class="tool-group"><h3>Générer un équipement</h3><button data-action="maximized-sets">Obtenir les 4 panoplies maximisées</button><p class="panel-hint">36 pièces chromatiques : Terre, Feu, Air et Eau, armes et boucliers inclus. Statistiques maximales actuelles et bonus de Puissance ; équipables dès le niveau 1, à retrouver dans le sac.</p><label for="equipment-slot">Emplacement</label><select id="equipment-slot">${SLOTS.map(slot=>`<option>${slot}</option>`).join('')}</select><button data-action="equipment">Ajouter au sac</button></section><section class="tool-group"><h3>Déplacements rapides</h3><div class="tool-buttons"><button data-action="home">Maison</button><button data-action="volcano-teleport" ${s.zone==='tutorial'?'disabled':''}>Volcan · accès dev</button><button data-action="volcano-boss-teleport" ${s.zone==='tutorial'?'disabled':''}>Approcher Pyroclaste</button><button data-action="wind-teleport" ${s.zone==='tutorial'?'disabled':''}>Hauts des Alizés</button><button data-action="fire-teleport" ${s.zone==='tutorial'?'disabled':''}>Champs de Braise</button><button data-action="mountains-teleport" ${s.zone==='tutorial'?'disabled':''}>Cimes de Schiste</button><button data-action="marsh-teleport" ${s.zone==='tutorial'?'disabled':''}>Marais de Gelée</button><button data-action="depths-teleport" ${s.zone==='tutorial'?'disabled':''}>Donjon · accès dev</button><button data-action="boss-teleport" ${s.zone==='tutorial'?'disabled':''}>Approcher Gorgelimon</button><button data-action="forge-teleport">Forge</button><button data-action="animalerie">Animalerie</button><button data-action="fountain-teleport">Fontaine</button><button data-action="combat">Combat</button></div></section><section class="journal"><h3>Journal de test</h3><ul>${s.log.map(line=>`<li>${line}</li>`).join('')}</ul></section>`;
  app.querySelector('#inventory').classList.toggle('tools-open', currentTab==='tools');
  const slotSelect = panel.querySelector('#equipment-slot');
  if (slotSelect && previousSlot) slotSelect.value = previousSlot;
  const plankInput=panel.querySelector('#plank-quantity');if(plankInput&&previousPlankQuantity)plankInput.value=previousPlankQuantity;
  const statInput=panel.querySelector('#stat-quantity');
  if(statInput&&previousStatQuantity)statInput.value=Math.max(1,Math.min(Number(previousStatQuantity),Number(statInput.max)));
  const quantityInput = panel.querySelector('#core-quantity');
  if (quantityInput && previousCore === panel.querySelector('[data-open-core]')?.dataset.openCore && previousQuantity) {
    quantityInput.value = Math.min(Number(previousQuantity), Number(quantityInput.max));
  }
  panel.scrollTop = scrollTop;
  if (panel.querySelector('.inventory-items')) panel.querySelector('.inventory-items').scrollTop = bagScrollTop;
  if (focusKey) (panel.querySelector(focusKey) || panel.querySelector('.item-details button') || app.querySelector('[data-action="close-inventory"]')).focus({ preventScroll: true });
}
function refreshUltimate(s) {
  sound.update(s);
  const sunButton=app.querySelector('[data-action="lighting"]');
  sunButton.disabled=["slime-depths","slime-marsh"].includes(s.zone);
  sunButton.setAttribute("aria-pressed",String(s.lighting!==false));
  sunButton.title=s.zone==="slime-depths"?"Éclairage souterrain":s.zone==="slime-marsh"?"Ciel couvert · Pluie battante":s.lighting!==false?"Désactiver la lumière dorée":"Activer la lumière dorée";
  tutorial?.update();
  const isWind=s.zone === "slime-wind",isVolcano=s.zone === "slime-volcano",isFire=s.zone === "slime-fire",isTutorial=s.zone === "tutorial",isMarsh=s.zone === "slime-marsh",isDepths=s.zone === "slime-depths",isMountains=s.zone === "slime-mountains";
  const boss=volcanoBoss(s)||depthsBoss(s),bossHud=app.querySelector('#boss-hud');
  bossHud.hidden=inventoryOpen||!boss||boss.hp<=0||(boss.bossPhase==='dormant'&&Math.hypot(s.player.x-boss.x,s.player.y-boss.y)>100);
  app.querySelector('#boss-interaction').hidden=inventoryOpen||!(nearVolcanoBoss(s)||nearDepthsBoss(s));app.querySelector("#boss-interaction").textContent=isVolcano?"Réveiller Pyroclaste · F":"Réveiller Gorgelimon · F";
  if(boss&&!bossHud.hidden){
    bossHud.querySelector('strong').textContent=isVolcano?'Pyroclaste':'Gorgelimon';bossHud.querySelector('span').textContent=isVolcano?'Niveau 9 · Terre / Feu':'Niveau 8 · Eau / Terre';bossHud.setAttribute('aria-label',boss.name);bossHud.querySelectorAll('i').forEach(i=>i.hidden=isVolcano);bossHud.querySelector('progress').setAttribute('aria-label',`Vie de ${boss.name}`);
    const hp=bossHud.querySelector('progress');hp.max=boss.maxHp;hp.value=boss.hp;
    bossHud.querySelector('p').textContent=isVolcano?(boss.bossPhase==='dormant'?'Le volcan sommeille · F pour l’éveiller':boss.intent?'Éruption annoncée · Écartez-vous !':`${Math.ceil(boss.hp)} / ${boss.maxHp} PV · ${boss.hp<boss.maxHp*.4?'Éruptions accélérées':'Éruptions de slimes'}`):boss.bossPhase==='dormant'?'Le gardien sommeille · F pour le réveiller':boss.bossPhase==='split'?`Détruisez les aspects · Réabsorption dans ${Math.ceil(Math.max(0,boss.splitUntil-s.time))} s`:(boss.vulnerableUntil||0)>s.time?`Cœur exposé · Dégâts +50 % · ${Math.ceil(boss.vulnerableUntil-s.time)} s`:`${Math.ceil(boss.hp)} / ${boss.maxHp} PV · ${boss.bossStage>=2?'Rage du gouffre':boss.bossStage?'Carapace fissurée':'Gardien du gouffre'}`;
  }
  const gate=nearZoneGate(s);app.querySelector("#zone-gate").hidden=inventoryOpen||!gate;if(gate)app.querySelector("#zone-gate").textContent=`${gate.label} · F`;
  app.querySelector("#marsh-guide").hidden=inventoryOpen||!isMarsh||!s.marshGuideOpen;app.querySelector("#marsh-help").hidden=!isMarsh&&!isDepths&&!isMountains&&!isFire&&!isVolcano&&!isWind;app.querySelector("#wind-guide").hidden=inventoryOpen||!isWind||!s.windGuideOpen;app.querySelector("#volcano-guide").hidden=inventoryOpen||!isVolcano||!s.volcanoGuideOpen;app.querySelector("#fire-guide").hidden=inventoryOpen||!isFire||!s.fireGuideOpen;app.querySelector("#mountain-guide").hidden=inventoryOpen||!isMountains||!s.mountainGuideOpen;app.querySelector("#depths-guide").hidden=inventoryOpen||!isDepths||!s.depthsGuideOpen;
  app.querySelector(".zone-card h1").textContent=isTutorial?"Île des premiers pas":isWind?"Hauts des Alizés":isVolcano?"Donjon du Volcan":isFire?"Champs de Braise":isMountains?"Cimes de Schiste":isDepths?"Donjon de la Crevasse":isMarsh?"Marais de Gelée":"Jardin des essais";
  app.querySelector(".zone-card .eyebrow").textContent=isTutorial?"AURORIA · TUTORIEL":isWind?"AURORIA · ALIZÉS":isVolcano?"AURORIA · DONJON":isFire?"AURORIA · VOLCAN":isMountains?"AURORIA · MONTAGNES":isDepths?"AURORIA · DONJON":isMarsh?"AURORIA · ZONE SLIME":"AURORIA · ZONE DEV";
  app.querySelector(".session-label").textContent=isTutorial?"Initiation · Iris vous accompagne":isWind?"Air · Aspiration & ricochets":isVolcano?"Terre / Feu · Magma persistant":isFire?"Feu · Traînées & explosions":isMountains?"Terre · Carapaces rocheuses":isDepths?(s.dungeonRun?.active?"Expédition · Eau & Terre":"Accès dev · Eau & Terre"):isMarsh?"Pluie battante · Cascade au sud-est":"Marais de Gelée · Sortie sud-est";
  app.querySelector("#tutorial-exit").hidden=inventoryOpen||!nearTutorialExit(s)||!canLeaveTutorial(s);
  app.querySelector('#sawmill-interaction').hidden=inventoryOpen||!nearSawmill(s);
  app.querySelector('#handyman-interaction').hidden=inventoryOpen||!nearHandyman(s);
  const harvest=app.querySelector('#harvest-status'),action=s.woodcutting.action;harvest.hidden=!action;
  if(action){const tree=s.trees.find(t=>t.id===action.tree);harvest.querySelector('span').textContent=`${action.phase==='walk'?'En route':'Coupe'} · ${woodById(tree.wood).name}`;harvest.querySelector('progress').value=action.phase==='cut'?action.progress/action.duration:0;}

  app.querySelector('#fountain-interaction').hidden=inventoryOpen||!nearFountain(s);
  const characteristicButton=app.querySelector('[data-action="characteristics"]');
  characteristicButton.classList.toggle('has-points',s.team[s.main].characteristicPoints>0);
  characteristicButton.title=`Caractéristiques · ${s.team[s.main].characteristicPoints} points à répartir (P)`;
  updateSpellBar(s,app.querySelector('#spellbar'));
  app.querySelector('#forge-interaction').hidden = inventoryOpen || !nearForge(s);
  app.querySelector('#petshop-interaction').hidden = inventoryOpen || !nearPetShop(s);
  const button = app.querySelector('#deploy');
  button.textContent = mobileHud?.isMobile ? (s.deployed?'Explorer':'Combat') : (s.deployed?'Exploration · E':'Mode combat · E');
  button.setAttribute('aria-pressed', String(s.deployed));
  button.title = s.deployed ? 'Passer en exploration : un personnage et vitesse +50 %' : 'Déployer la troupe : trois personnages et vitesse normale';
  app.querySelector('#combat-status').textContent = mobileHud?.isMobile ? (s.deployed?'Troupe déployée':'Vitesse +50 %') : (s.deployed?'Combat · 3 personnages · Vitesse normale':'Exploration · 1 personnage · Vitesse +50 %');
}
function setInventory(open, tab = currentTab) {
  mobileHud?.close();
  if(open)sound.close();
  if(currentTab!==tab)panel.scrollTop=0;
  inventoryOpen = open;
  currentTab = tab;
  if(open)visitTutorialPanel(game.state,tab);
  app.querySelector('#inventory').hidden = !open;
  app.querySelector('#inventory-backdrop').hidden = !open;
  app.querySelector('[data-action="inventory"]').setAttribute('aria-expanded', String(open));
  app.querySelector('#inventory').classList.toggle('tools-open', tab==='tools');
  app.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === currentTab)));
  game.setInterfaceOpen(open);
  if (open) {
    refresh(game.state);
    app.querySelector('[data-action="close-inventory"]').focus();
  } else app.querySelector('canvas').focus({ preventScroll: true });
}
let tutorial,mobileHud;
const game = createGame(app.querySelector('canvas'),app.querySelector('.touch-controls'),refresh,refreshUltimate,tab=>{if(tab==='handyman'){professionTab='handyman';setInventory(true,'professions');}else setInventory(true,tab);});
mobileHud=createMobileHud(app,{onOpen:()=>game.clearInput(),onLayoutChange:()=>{game.clearInput();game.refresh();}});
tutorial = createTutorialUI(app, game, setInventory);
refresh(game.state);
const touchSpellCasts=new WeakMap(),touchUIController=new AbortController();
function castHudSpell(button){
  castEquipped(game.state,Number(button.dataset.castSpell),mobileHud.isMobile?null:undefined);
  game.refresh();app.querySelector('canvas').focus({preventScroll:true});
}
app.addEventListener('pointerdown',event=>{
  const button=event.target.closest('button[data-cast-spell]');
  if(event.pointerType!=='touch'||!button||button.disabled||inventoryOpen)return;
  event.preventDefault();touchSpellCasts.set(button,performance.now());castHudSpell(button);
},{signal:touchUIController.signal});
app.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button)return;
  const s=game.state;
  if(['mobile-menu-toggle','mobile-menu-scrim'].includes(button.id))return;
  if(button.dataset.action==='audio'||button.closest('#audio-settings')||button.closest('.tutorial'))return;
  if(button.dataset.action === 'tutorial-exit'){if(nearTutorialExit(s)&&canLeaveTutorial(s)){finishTutorial(s);game.refresh();refresh(s);}return;}
  if(button.dataset.action==='awaken-boss'){if(nearVolcanoBoss(s))awakenVolcanoBoss(s);else if(nearDepthsBoss(s))awakenDepthsBoss(s);game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(button.dataset.action==='zone-gate'){useZoneGate(s);game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(['marsh-help','close-marsh-guide','close-depths-guide','close-mountain-guide','close-fire-guide','close-volcano-guide','close-wind-guide'].includes(button.dataset.action)){if(s.zone==='slime-wind')s.windGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-volcano')s.volcanoGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-fire')s.fireGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-mountains')s.mountainGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-depths')s.depthsGuideOpen=button.dataset.action==='marsh-help';else s.marshGuideOpen=button.dataset.action==='marsh-help';game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(button.dataset.action === 'lighting'){s.lighting=!s.lighting;try{localStorage.setItem('auroria-lighting-v1',s.lighting?'on':'off');}catch{}note(s,s.lighting?'Lumière dorée activée.':'Éclairage neutre activé.');game.refresh();refresh(s);return;}
  if (button.dataset.action === 'inventory') { setInventory(!(inventoryOpen && currentTab==='equipment'), 'equipment'); return; }
  if (button.dataset.action === 'bestiary') { setInventory(!(inventoryOpen && currentTab==='bestiary'), 'bestiary'); return; }
  if(button.dataset.profession){professionTab=button.dataset.profession;refresh(s);return;}
  if(button.hasAttribute('data-craft-keys')){const input=panel.querySelector('#key-quantity');if(input.reportValidity())craftDungeonKeys(s,Number(input.value),s.handymanDungeon);game.refresh();refresh(s);return;}
  if(button.dataset.action==='key-recipe'){s.handymanDungeon=button.dataset.dungeon;professionTab='handyman';setInventory(true,'professions');return;}
  if(button.dataset.action==='handyman'){if(nearHandyman(s)){professionTab='handyman';setInventory(true,'professions');}return;}
  if (button.dataset.action === 'professions') {setInventory(true,'professions');return;}
  if (button.dataset.action === 'sawmill') {if(nearSawmill(s))setInventory(true,'professions');return;}
  if(button.dataset.jobHarvest){const tree=s.trees.filter(t=>t.wood===button.dataset.jobHarvest&&t.respawn===0).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];if(tree){setInventory(false);requestCut(s,tree.id,(x,y)=>canWalkZone(x,y,s.zone));game.refresh();}return;}
  if(button.dataset.craftPlanks){const input=panel.querySelector('#plank-quantity');if(input.reportValidity())craftPlanks(s,button.dataset.craftPlanks,Number(input.value));}
  if (button.dataset.action === 'characteristics') {setInventory(true,'characteristics');return;}
  if (button.dataset.action === 'fountain') {if(nearFountain(s))setInventory(true,'characteristics');return;}
  if (button.dataset.action === 'spells') {setInventory(true,'spells');return;}
  if(button.dataset.castSpell!==undefined&&!inventoryOpen){const touchTime=touchSpellCasts.get(button);touchSpellCasts.delete(button);if(touchTime!==undefined&&performance.now()-touchTime<1000&&event.detail!==0)return;castHudSpell(button);return;}
  if (button.dataset.action === 'forge') { if(nearForge(s))setInventory(true,'forge'); return; }
  if (button.dataset.action === 'petshop') { if(nearPetShop(s))setInventory(true,'petshop'); return; }
  if (button.dataset.action === 'tools') { setInventory(true, 'tools'); return; }
  if (button.dataset.action === 'close-inventory') { setInventory(false); return; }
  if (button.dataset.action === 'fullscreen') {
    const request = document.fullscreenElement ? document.exitFullscreen() : app.querySelector('.game-screen').requestFullscreen?.();
    request?.catch(() => note(s, 'Le plein écran est indisponible dans ce navigateur.'));
    return;
  }
  if(button.dataset.tab){visitTutorialPanel(s,button.dataset.tab);if(currentTab!==button.dataset.tab)panel.scrollTop=0;currentTab=button.dataset.tab;app.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  if(button.dataset.monster) bestiaryMonster = button.dataset.monster;
  if(button.dataset.main!==undefined)chooseMain(s,Number(button.dataset.main));
  if(button.dataset.inspectSlot) selectedItem = { source:'equipment', slot:button.dataset.inspectSlot };
  if(button.dataset.inspectBag) {
    const id = Number(button.dataset.inspectBag);
    const item = s.bag.find(item => item.id === id);
    if (event.shiftKey && item?.slot) {
      equip(s, id);
      selectedItem = s.team[s.main].equipment[item.slot]?.id === id
        ? { source:'equipment', slot:item.slot } : { source:'bag', id };
    } else selectedItem = { source:'bag', id };
  }
  if(button.dataset.slot) { unequip(s,button.dataset.slot); selectedItem = null; }
  if(button.dataset.equip) {
    const item = s.bag.find(item=>item.id===Number(button.dataset.equip));
    equip(s,Number(button.dataset.equip));
    selectedItem = item ? { source:'equipment', slot:item.slot } : null;
  }
  if(button.dataset.allocateStat){const input=panel.querySelector('#stat-quantity');if(input.reportValidity())allocateCharacteristic(s,button.dataset.allocateStat,Number(input.value));}
  if(button.hasAttribute('data-reset-characteristics'))resetCharacteristics(s);
  if(button.dataset.learnUltimate)learnUltimate(s,button.dataset.learnUltimate);
  if(button.dataset.spellSlot!==undefined)spellSlot=Number(button.dataset.spellSlot);
  if(button.dataset.unequipSpell!==undefined)unequipSpell(s,s.main,Number(button.dataset.unequipSpell));
  if(button.dataset.equipSpell)equipSpell(s,s.main,spellSlot,button.dataset.equipSpell);
  if(button.dataset.forgeSelect)forgeItem=Number(button.dataset.forgeSelect);
  if(button.dataset.forgeRecycle)recycleEquipment(s,Number(button.dataset.forgeRecycle));
  if(button.dataset.exchangeCore)exchangeCoreFragments(s,button.dataset.exchangeCore,Number(button.dataset.fragmentLevel));
  if(button.dataset.forgeUpgrade)upgradeChromatic(s,Number(button.dataset.forgeUpgrade));
  if(button.dataset.adopt)acceptAdoption(s,button.dataset.adopt);
  if(button.dataset.claimPet){const pet=claimPet(s,button.dataset.claimPet);if(pet)selectedItem={source:'bag',id:pet.id};}
  if(button.dataset.feedPet)feedPet(s,Number(button.dataset.feedPet));
  if(button.dataset.core)grantCore(s,button.dataset.core);
  if(button.dataset.openCore) openCore(s,Number(button.dataset.openCore));
  if(button.dataset.openCores) {
    const input = panel.querySelector('#core-quantity');
    if (input.reportValidity()) openCores(s,Number(button.dataset.openCores),Number(input.value));
  }
  if(button.dataset.loot)grantLoot(s,button.dataset.loot,button.dataset.chromatic==='true',devLootMonster);
  const actions={ 'wind-teleport':()=>travelToZone(s,'slime-wind'), 'volcano-teleport':()=>travelToZone(s,'slime-volcano'),'volcano-boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-volcano');const b=volcanoBoss(s);if(b)movePartyToZone(s,'slime-volcano',{x:b.homeX-50,y:b.homeY+35});},'volcano-key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'fire-slime');grantLoot(s,'rare',false,'mountain-slime');note(s,'Ingrédients pour une Clé du Volcan ajoutés.');}, 'fire-teleport':()=>travelToZone(s,'slime-fire'), 'handyman-teleport':()=>teleport(s,'bricoleur'),'handyman-xp':()=>grantHandymanXp(s,30),'key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'slime');grantLoot(s,'rare',false,'mountain-slime');note(s,'Ingrédients de test pour une Clé de la Crevasse ajoutés.');}, 'mountains-teleport':()=>travelToZone(s,'slime-mountains'), 'maximized-sets':()=>giveMaximizedSets(s), 'boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-depths');const b=depthsBoss(s);if(b)movePartyToZone(s,'slime-depths',{x:b.homeX-50,y:b.homeY-12});}, 'depths-teleport':()=>travelToZone(s,'slime-depths'), 'marsh-teleport':()=>travelToZone(s,'slime-marsh'), 'cancel-harvest':()=>cancelWoodcutting(s),'job-xp':()=>grantWoodcuttingXp(s,30),'job-wood':()=>addWoodItem(s,'ash','wood',10),'sawmill-teleport':()=>teleport(s,'scierie'),'woodcutting-teleport':()=>teleport(s,'bucheron'),'spell-charge':()=>{s.team.forEach(member=>member.ultimateCharge=100);note(s,'Ultimes personnels chargés (outil dev).');},attack:()=>attack(s),heal:()=>heal(s),home:()=>teleport(s,'maison'),combat:()=>teleport(s,'combat'),atelier:()=>teleport(s,'atelier'),'forge-teleport':()=>teleport(s,'forge'),'fountain-teleport':()=>teleport(s,'fontaine'),animalerie:()=>teleport(s,'animalerie'),xp:()=>grantXp(s,50),equipment:()=>giveEquipment(s,app.querySelector('#equipment-slot').value),auto:()=>{s.autoAttack=!s.autoAttack;note(s,`Attaque automatique ${s.autoAttack?'activée':'désactivée'}.`);},deploy:()=>toggleCombatMode(s)};
  if(actions[button.dataset.action])actions[button.dataset.action]();
  game.refresh();refresh(s);
  if(!inventoryOpen && (button.dataset.main!==undefined || ['attack','home','combat','atelier','animalerie','deploy'].includes(button.dataset.action)))app.querySelector('canvas').focus({preventScroll:true});
});
app.addEventListener('change', event => { if(event.target.id==='key-dungeon'){game.state.handymanDungeon=event.target.value;game.refresh();refresh(game.state);return;}  if(event.target.id==='spell-element'){spellFilter=event.target.value;refresh(game.state);} if(event.target.id==='loot-monster')devLootMonster=event.target.value; if(event.target.id==='bag-filter') { bagFilter=event.target.value; refresh(game.state); panel.querySelector('#bag-filter')?.focus(); } });
app.addEventListener('input', event => {
  if(event.target.id==='key-quantity'){updateHandymanQuantity(game.state,panel);return;}
  if(event.target.id==='plank-quantity'){const count=Number(event.target.value),s=game.state;panel.querySelectorAll('[data-craft-planks]').forEach(button=>{const wood=woodById(button.dataset.craftPlanks);button.disabled=!Number.isSafeInteger(count)||count<1||!nearSawmill(s)||s.woodcutting.level<wood.level||woodQuantity(s,wood.id)<count*2;});return;}

  if(event.target.id!=='monster-level') return;
  bestiaryLevel = Number(event.target.value);
  inspectTutorialMonster(game.state,bestiaryMonster,bestiaryLevel);
  panel.querySelector('.bestiary-core').innerHTML=coreDropMarkup(bestiaryMonster,bestiaryLevel);
  panel.querySelector('#monster-level-value').textContent = bestiaryLevel;
  for(const [stat,value] of Object.entries(bestiaryValues(bestiaryMonster,bestiaryLevel))) panel.querySelector(`[data-monster-stat="${stat}"]`).textContent=value;
});
const uiController = new AbortController();
const uiOptions = { signal: uiController.signal };
app.querySelector('#inventory-backdrop').addEventListener('click', () => setInventory(false), uiOptions);
window.addEventListener('keydown', event => {
  const editable = event.target.matches('input:not([type="range"]), select, textarea, [contenteditable="true"]');
  if(event.code==='KeyL'&&!editable){event.preventDefault();if(!event.repeat)setInventory(!(inventoryOpen&&currentTab==='professions'),'professions');return;}
  if(event.code==='KeyP'&&!editable){event.preventDefault();if(!event.repeat)setInventory(!(inventoryOpen&&currentTab==='characteristics'),'characteristics');return;}
  if(event.code==='KeyK'&&!editable){event.preventDefault();if(!event.repeat)setInventory(!(inventoryOpen&&currentTab==='spells'),'spells');return;}
  if (event.code === 'KeyB' && !editable) {
    event.preventDefault();
    if (!event.repeat) setInventory(!(inventoryOpen && currentTab==='bestiary'), 'bestiary');
    return;
  }
  if (event.code === 'KeyI' && !editable) {
    event.preventDefault();
    if (!event.repeat) setInventory(!(inventoryOpen && currentTab==='equipment'), 'equipment');
    return;
  }
  if (!inventoryOpen) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) setInventory(false);
  }
  if (event.code === 'Tab') {
    const elements = [...app.querySelector('#inventory').querySelectorAll('button:not(:disabled), select, input')];
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}, uiOptions);
// Read-only inspection for browser checks; mutations go through the visible tools.
window.auroria={snapshot:()=>JSON.parse(JSON.stringify(game.state))};
if(import.meta.hot)import.meta.hot.dispose(()=>{uiController.abort();touchUIController.abort();mobileHud.destroy();sound.destroy();tutorial.destroy();game.destroy();delete window.auroria;});
