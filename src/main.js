import {monsterDefinition} from './data/monsters.js';
import {panelNavigation,syncPanelNavigation,panelGroup,PANEL_GROUPS,applySectionChoices} from './ui/organization.js';
import {renderDevTools} from './ui/dev-tools.js';
import {renderZoneGuides,renderZoneOverlays,ZONE_GUIDES} from './ui/zone-guides.js';
import {DEV_ITEMS} from './data/dev-items.js';
import {renderDevChest,filterDevChest} from './ui/dev-chest.js';
import {nearDevChest,withdrawDevItem,withdrawAllDevItems,refillDevChest} from './game/dev-chest.js';
import {DEV_CHEST_APPROACH} from './world/dev-chest.js';
import {HYBRID_SLIMES,hybridResource} from './data/hybrid-slimes.js';
import {grantBossLoot} from './game/boss-loot.js';
import {furnaceBoss,nearFurnaceBoss,awakenFurnaceBoss} from './game/furnace.js';
import {stormBoss,nearStormBoss,awakenStormBoss} from './game/storm.js';
import {volcanoBoss,nearVolcanoBoss,awakenVolcanoBoss,isVolcanoInvulnerable} from './game/volcano.js';
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
import { renderBestiaryBrowser, bestiaryDefaultLevel, bestiaryValues, coreDropMarkup } from './ui/bestiary.js';
import { renderInventory } from './ui/inventory.js';
import './style.css';
import { createGame } from './game/create-game.js';
import { ROLES, COLORS, teleport, chooseMain, grantXp, heal, grantLoot, grantCore, openCore, openCores, giveEquipment, giveMaximizedSets, giveBossSets, equip, unequip, attack, note, toggleCombatMode, castEquipped } from './dev/sandbox.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="game-screen">
  <canvas width="640" height="400" tabindex="0" aria-label="Jardin des essais. Flèches ou ZQSD pour bouger, molette pour changer de personnage, clic gauche sur les cibles bonus, clic droit, R et C pour les sorts, T pour l’ultime personnel, E pour basculer combat ou exploration, K pour le grimoire, P pour les caractéristiques, I pour l’inventaire."></canvas>
  <div class="hud-top"><div class="zone-card"><span class="eyebrow">AURORIA · ZONE DEV</span><h1>Jardin des essais</h1><span class="session-label"><i></i> Session locale · 3 bots</span><span id="save-status" role="status"></span></div><div class="menu-dock"><button id="mobile-menu-toggle" aria-label="Ouvrir le menu" aria-controls="hud-menu-panel" aria-expanded="false" hidden><span aria-hidden="true">☰</span></button><nav class="hud-menu" id="hud-menu-panel" aria-label="Menu du jeu"><details class="hud-category"><summary>Héros</summary><div class="hud-category-items"><button data-action="inventory" aria-controls="inventory" aria-expanded="false">▣ Inventaire <kbd>I</kbd></button><button data-action="characteristics">◈ <span>Carac.</span> <kbd>P</kbd></button><button data-action="spells">✦ <span>Grimoire</span> <kbd>K</kbd></button><button data-open-panel="petshop">Familiers</button></div></details><details class="hud-category"><summary>Monde</summary><div class="hud-category-items"><button data-action="bestiary" aria-label="Bestiaire B">☷ <span>Bestiaire</span> <kbd>B</kbd></button><button data-open-panel="guides">Guides des zones</button><button data-action="marsh-help" id="marsh-help" aria-label="Guide de la zone" hidden>✿<span class="mobile-menu-label">Guide</span></button></div></details><details class="hud-category"><summary>Artisanat</summary><div class="hud-category-items"><button data-open-panel="forge">Forge</button><button data-action="professions">🪓 <span>Métiers</span> <kbd>L</kbd></button></div></details><details class="hud-category"><summary><span class="group-label-full">Développement</span><span class="group-label-short">Dev</span></summary><div class="hud-category-items"><button data-action="tools">⚙ Outils dev</button><button data-open-panel="chest">Coffre</button></div></details><details class="hud-category"><summary>Réglages</summary><div class="hud-category-items"><button data-action="audio" aria-label="Réglages audio">🔊</button><button data-action="lighting" aria-label="Lumière dorée" aria-pressed="true" title="Désactiver la lumière dorée">☀<span class="mobile-menu-label">Lumière</span></button><button data-action="fullscreen" aria-label="Basculer le plein écran">⛶<span class="mobile-menu-label">Écran</span></button></div></details></nav></div></div><button id="mobile-menu-scrim" aria-label="Fermer le menu" tabindex="-1" hidden></button>
  <div class="hud-team"><p class="hud-hint">VOTRE TROUPE <span>↕ Molette pour changer</span></p><div id="team" class="team-grid"></div></div>
  <div class="hud-notification" id="notification" role="status"></div>
  <div class="hud-bottom"><div class="controls-hint"><kbd>ZQSD</kbd> Bouger <span>·</span> <kbd>Clic droit</kbd> Attaquer <span>·</span> <kbd>Clic gauche</kbd> Cible bonus <span>·</span> <kbd>↕</kbd> Changer</div><div class="action-bar"><div id="spellbar" class="spellbar"></div><div class="ultimate-box"><button data-action="deploy" id="deploy">Exploration · E</button><span id="combat-status">Combat · 3 personnages · Vitesse normale</span></div></div></div>
  ${renderZoneOverlays()}
  <section id="boss-hud" class="boss-hud" aria-label="Gorgelimon, barre de vie du boss" hidden><div><strong>Gorgelimon</strong><span>Niveau 8 · Eau / Terre</span></div><div class="boss-life"><progress max="1" value="1" aria-label="Vie de Gorgelimon"></progress><i style="left:35%"></i><i style="left:70%"></i></div><p></p></section><button id="boss-interaction" data-action="awaken-boss" class="world-interaction" hidden>Réveiller Gorgelimon · F</button>
  <button id="chest-interaction" data-action="dev-chest" class="world-interaction" hidden>Ouvrir le coffre dev · F</button>
  <button id="zone-gate" data-action="zone-gate" class="world-interaction" hidden></button><button id="tutorial-exit" data-action="tutorial-exit" class="world-interaction" hidden>Rejoindre le village · F</button><div id="harvest-status" class="harvest-status" hidden><span></span><progress max="1" value="0"></progress><button data-action="cancel-harvest">Annuler</button></div><button id="handyman-interaction" data-action="handyman" class="world-interaction" hidden>Atelier de bricolage · F</button><button id="sawmill-interaction" data-action="sawmill" class="world-interaction" hidden>Scierie · F</button><button id="fountain-interaction" data-action="fountain" class="world-interaction" hidden>Fontaine du renouveau · F</button><button id="forge-interaction" data-action="forge" class="world-interaction" hidden>Parler à Borin · F</button><button id="petshop-interaction" data-action="petshop" class="world-interaction" hidden>Parler à Nola · F</button><div class="touch-controls"><div class="joystick" data-joystick role="group" aria-label="Joystick de déplacement"><div class="joystick-base" aria-hidden="true"></div><div class="joystick-knob" aria-hidden="true"></div></div><span class="joystick-caption" aria-hidden="true">DÉPLACER</span></div>
  <div id="inventory-backdrop" class="inventory-backdrop" hidden></div>
  <section id="inventory" class="inventory-window" role="dialog" aria-modal="true" aria-labelledby="inventory-title" hidden>
    <h2 id="inventory-title" class="sr-only">Inventaire</h2>
    <div id="panel"></div>
    <div class="inventory-footer">${panelNavigation()}<button data-action="close-inventory" aria-label="Fermer l’inventaire">✕ <kbd>Échap</kbd></button></div>
  </section>
</main>`;
const sound=createAudioUI(app);
let inventoryOpen = false;
let currentTab = 'equipment';
const sectionChoices={},rememberedPanels={};
let guideZone='slime-marsh';
let selectedItem = null;
let bagFilter = 'all';
let bestiaryMonster = null;
let bestiaryFamily = null;
let bestiaryLevel = 1;
let chestCategory='all',chestQuery='',chestQuantity=99;
let spellSlot=0;
let spellFilter='all';
let professionTab='woodcutting';
let forgeItem = null;
let devLootMonster = 'slime';
const panel = app.querySelector('#panel');
function refresh(s) {
  syncPanelNavigation(app,currentTab);
  s.devChestOpen=inventoryOpen&&currentTab==='chest';
  app.querySelector('#team').innerHTML = s.team.map((m,i)=>`<button class="member ${i===s.main?'selected':''} ${m.hp===0?'fallen':''}" data-main="${i}" aria-label="${m.name} · ${ROLES[m.role]} · Niveau ${m.level}" style="--role:${COLORS[m.role]}" aria-pressed="${i===s.main}"><span class="portrait">${characterArt(m,true)}</span><span class="member-text"><strong>${m.name}<small>Niv. ${m.level}</small></strong><span>${ROLES[m.role]}</span><span class="hp-track"><span style="width:${m.hp/m.maxHp*100}%"></span></span><small>${m.hp} / ${m.maxHp} PV</small></span></button>`).join('');
  paintCharacterArt(app.querySelector('#team'),s.team);
  app.querySelector('#bag-count').textContent = s.bag.reduce((sum,item)=>sum+item.quantity,0);
  refreshUltimate(s);
  app.querySelector('#notification').textContent = s.log[0];
  if (!inventoryOpen) return;
  const openDisclosures=[...panel.querySelectorAll('details[data-disclosure][open]')].map(d=>d.dataset.disclosure);
  const previousSetDetails=panel.querySelector('[data-set-bonus-details][open]')?.dataset.setBonusDetails;
  const previousKeyQuantity=panel.querySelector('#key-quantity')?.value;
  const previousPlankQuantity=panel.querySelector('#plank-quantity')?.value;
  const previousStatQuantity = panel.querySelector('#stat-quantity')?.value;
  const previousCore = panel.querySelector('[data-open-core]')?.dataset.openCore;
  const previousQuantity = panel.querySelector('#core-quantity')?.value;
  const previousSlot = panel.querySelector('#equipment-slot')?.value;
  const focus = panel.contains(document.activeElement) ? document.activeElement : null;
  const focusAttribute = focus && ['data-section-id','data-guide-zone','data-dev-chest-item','data-craft-keys','data-profession','data-craft-planks','data-job-harvest','data-allocate-stat','data-reset-characteristics','data-learn-ultimate','data-spell-slot','data-equip-spell','data-unequip-spell','data-forge-select','data-forge-recycle','data-exchange-core','data-forge-upgrade','data-action','data-adopt','data-claim-pet','data-feed-pet','data-core','data-open-cores','data-open-core','data-monster','data-inspect-slot','data-inspect-bag','data-slot','data-equip'].find(name=>focus.hasAttribute(name));
  const focusKey = focus?.id ? `#${CSS.escape(focus.id)}` : focusAttribute ? `[${focusAttribute}="${CSS.escape(focus.getAttribute(focusAttribute))}"]` : null;
  const scrollTop = panel.scrollTop;
  const bagScrollTop = panel.querySelector('.inventory-items')?.scrollTop || 0;
  const m = s.team[s.main];
  if(currentTab==='bestiary'){
    const view=`${bestiaryFamily||''}:${bestiaryMonster||''}`;
    if(panel.dataset.bestiaryView!==view||!panel.querySelector('[data-bestiary-screen]')){
      panel.innerHTML=renderBestiaryBrowser(bestiaryFamily,bestiaryMonster,bestiaryLevel);
      panel.dataset.bestiaryView=view;
    }
  }
  app.querySelector('#inventory-title').textContent = currentTab==='guides'?'Guides des zones':currentTab==='chest'?'Coffre de développement':currentTab==='professions'?'Métiers':currentTab==='characteristics' ? 'Caractéristiques' : currentTab==='spells' ? 'Grimoire' : currentTab==='bestiary' ? 'Bestiaire' : currentTab==='petshop' ? 'Animalerie' : currentTab==='forge' ? 'Forge' : 'Inventaire';
  app.querySelector('#inventory').classList.toggle('bestiary-open',currentTab==='bestiary');
  if(currentTab==='professions')panel.innerHTML=renderProfessions(s,previousPlankQuantity||1,professionTab,previousKeyQuantity||1);
  app.querySelector('#inventory').classList.toggle('professions-open',currentTab==='professions');
  if(currentTab==='chest')panel.innerHTML=renderDevChest(s,chestCategory,chestQuery,chestQuantity);
  app.querySelector('#inventory').classList.toggle('chest-open',currentTab==='chest');
  if(currentTab==='characteristics')panel.innerHTML=renderCharacteristics(s);
  app.querySelector('#inventory').classList.toggle('characteristics-open',currentTab==='characteristics');
  if(currentTab==='spells') panel.innerHTML=renderSpellbook(s,spellSlot,spellFilter);
  app.querySelector('#inventory').classList.toggle('spells-open',currentTab==='spells');
  if(currentTab==='forge') panel.innerHTML = renderForge(s,forgeItem);
  app.querySelector('#inventory').classList.toggle('forge-open',currentTab==='forge');
  if(currentTab==='petshop') panel.innerHTML = renderPetShop(s);
  app.querySelector('#inventory').classList.toggle('petshop-open',currentTab==='petshop');
  if(currentTab==='equipment') {panel.innerHTML = renderInventory(s, selectedItem, bagFilter);paintCharacterArt(panel,s.team);}
  if(currentTab==='tools')panel.innerHTML=renderDevTools(s,devLootMonster);
  if(currentTab==='guides')panel.innerHTML=renderZoneGuides(guideZone);
  app.querySelector('#inventory').classList.toggle('guides-open',currentTab==='guides');
  app.querySelector('#inventory').classList.toggle('tools-open', currentTab==='tools');
  applySectionChoices(panel,sectionChoices);
  for(const details of panel.querySelectorAll('details[data-disclosure]'))if(openDisclosures.includes(details.dataset.disclosure))details.open=true;
  const slotSelect = panel.querySelector('#equipment-slot');
  if (slotSelect && previousSlot) slotSelect.value = previousSlot;
  const plankInput=panel.querySelector('#plank-quantity');if(plankInput&&previousPlankQuantity)plankInput.value=previousPlankQuantity;
  const statInput=panel.querySelector('#stat-quantity');
  if(statInput&&previousStatQuantity)statInput.value=Math.max(1,Math.min(Number(previousStatQuantity),Number(statInput.max)));
  const quantityInput = panel.querySelector('#core-quantity');
  if (quantityInput && previousCore === panel.querySelector('[data-open-core]')?.dataset.openCore && previousQuantity) {
    quantityInput.value = Math.min(Number(previousQuantity), Number(quantityInput.max));
  }
  if(previousSetDetails){const details=panel.querySelector(`[data-set-bonus-details="${CSS.escape(previousSetDetails)}"]`);if(details)details.open=true;}
  panel.scrollTop = scrollTop;
  if (panel.querySelector('.inventory-items')) panel.querySelector('.inventory-items').scrollTop = bagScrollTop;
  if (focusKey) (panel.querySelector(focusKey) || panel.querySelector('.item-details button') || app.querySelector('[data-action="close-inventory"]')).focus({ preventScroll: true });
}
function refreshUltimate(s) {
  sound.update(s);
  const saveStatus = app.querySelector('#save-status');
  saveStatus.textContent = s.saveStatus?.text || 'Sauvegarde automatique · ce navigateur';
  saveStatus.classList.toggle('save-error', !!s.saveStatus?.error);
  const sunButton=app.querySelector('[data-action="lighting"]');
  sunButton.disabled=["slime-furnace","slime-storm","slime-depths","slime-marsh"].includes(s.zone);
  sunButton.setAttribute("aria-pressed",String(s.lighting!==false));
  sunButton.title=s.zone==="slime-furnace"?"Lumière du Grand Foyer":s.zone==="slime-storm"?"Lumière diffuse · Œil des Tempêtes":s.zone==="slime-depths"?"Éclairage souterrain":s.zone==="slime-marsh"?"Ciel couvert · Pluie battante":s.lighting!==false?"Désactiver la lumière dorée":"Activer la lumière dorée";
  tutorial?.update();
  const isFurnace=s.zone === "slime-furnace",isStorm=s.zone === "slime-storm",isWind=s.zone === "slime-wind",isVolcano=s.zone === "slime-volcano",isFire=s.zone === "slime-fire",isTutorial=s.zone === "tutorial",isMarsh=s.zone === "slime-marsh",isDepths=s.zone === "slime-depths",isMountains=s.zone === "slime-mountains";
  const boss=furnaceBoss(s)||stormBoss(s)||volcanoBoss(s)||depthsBoss(s),bossHud=app.querySelector('#boss-hud');
  bossHud.hidden=inventoryOpen||!boss||boss.hp<=0||(boss.bossPhase==='dormant'&&Math.hypot(s.player.x-boss.x,s.player.y-boss.y)>100);
  app.querySelector('#boss-interaction').hidden=inventoryOpen||!(nearFurnaceBoss(s)||nearStormBoss(s)||nearVolcanoBoss(s)||nearDepthsBoss(s));app.querySelector("#boss-interaction").textContent=isFurnace?"Réveiller Siroccolimon · F":isStorm?"Réveiller Nimbulimon · F":isVolcano?"Réveiller Pyroclaste · F":"Réveiller Gorgelimon · F";
  if(boss&&!bossHud.hidden){
    bossHud.querySelector('strong').textContent=isFurnace?'Siroccolimon':isStorm?'Nimbulimon':isVolcano?'Pyroclaste':'Gorgelimon';bossHud.querySelector('span').textContent=isFurnace?'Niveau 10 · Feu / Air':isStorm?'Niveau 10 · Air / Eau':isVolcano?'Niveau 9 · Terre / Feu':'Niveau 8 · Eau / Terre';bossHud.setAttribute('aria-label',boss.name);bossHud.querySelectorAll('i').forEach(i=>i.hidden=isVolcano||isStorm||isFurnace);bossHud.querySelector('progress').setAttribute('aria-label',`Vie de ${boss.name}`);
    bossHud.dataset.invulnerable=String(isVolcanoInvulnerable(boss));
    const hp=bossHud.querySelector('progress');hp.max=boss.maxHp;hp.value=boss.hp;
    bossHud.querySelector('p').textContent=isFurnace?(boss.bossPhase==='dormant'?'F pour réveiller le Brasier des Tempêtes':boss.vulnerableUntil>s.time?`Cœur refroidi · Dégâts +50 % · ${Math.ceil(boss.vulnerableUntil-s.time)} s`:`Braseros éteints : ${s.furnace?.braziers.filter(b=>b.room===3&&!b.lit).length||0} / 3 · ${boss.intent?.phase==='breath'?(boss.intent.locked?'Souffle verrouillé : esquivez !':'Placez un brasero entre le boss et vous'):'Orientez son souffle pour éteindre les braseros'}`):isStorm?(boss.bossPhase==='dormant'?'F pour réveiller le Cœur de l’Orage':boss.vulnerableUntil>s.time?`Cœur exposé · Dégâts +50 % · ${Math.ceil(boss.vulnerableUntil-s.time)} s`:`${Math.ceil(boss.hp)} / ${boss.maxHp} PV · ${boss.intent?.phase==='inflate'?'Aspiration → souffle Air':boss.intent?.leg===1?'Dernier ricochet : guidez-le sur une dalle sèche':'Marée et ricochets Air / Eau'}`):isVolcano?(boss.bossPhase==='dormant'?'Le volcan sommeille · F pour l’éveiller':isVolcanoInvulnerable(boss)?(boss.intent?'Invulnérable · Invocation de slimes de magma à distance':'Invulnérable · Faites exploser une invocation près du boss'):`Vulnérable · ${Math.ceil(boss.hp)} / ${boss.maxHp} PV${boss.cooldown>0?' · '+Math.ceil(boss.cooldown)+' s pour attaquer':''}`):boss.bossPhase==='dormant'?'Le gardien sommeille · F pour le réveiller':boss.bossPhase==='split'?`Détruisez les aspects · Réabsorption dans ${Math.ceil(Math.max(0,boss.splitUntil-s.time))} s`:(boss.vulnerableUntil||0)>s.time?`Cœur exposé · Dégâts +50 % · ${Math.ceil(boss.vulnerableUntil-s.time)} s`:`${Math.ceil(boss.hp)} / ${boss.maxHp} PV · ${boss.bossStage>=2?'Rage du gouffre':boss.bossStage?'Carapace fissurée':'Gardien du gouffre'}`;
  }
  const gate=nearZoneGate(s);app.querySelector("#zone-gate").hidden=inventoryOpen||!gate;if(gate)app.querySelector("#zone-gate").textContent=`${gate.label} · F`;
  app.querySelector("#marsh-guide").hidden=inventoryOpen||!isMarsh||!s.marshGuideOpen;app.querySelector("#marsh-help").hidden=!isMarsh&&!isDepths&&!isMountains&&!isFire&&!isVolcano&&!isWind&&!isStorm&&!isFurnace;app.querySelector("#furnace-guide").hidden=inventoryOpen||!isFurnace||!s.furnaceGuideOpen;app.querySelector("#storm-guide").hidden=inventoryOpen||!isStorm||!s.stormGuideOpen;app.querySelector("#wind-guide").hidden=inventoryOpen||!isWind||!s.windGuideOpen;app.querySelector("#volcano-guide").hidden=inventoryOpen||!isVolcano||!s.volcanoGuideOpen;app.querySelector("#fire-guide").hidden=inventoryOpen||!isFire||!s.fireGuideOpen;app.querySelector("#mountain-guide").hidden=inventoryOpen||!isMountains||!s.mountainGuideOpen;app.querySelector("#depths-guide").hidden=inventoryOpen||!isDepths||!s.depthsGuideOpen;
  app.querySelector(".zone-card h1").textContent=isTutorial?"Île des premiers pas":isFurnace?"Fournaise des Vents Rouges":isStorm?"Œil des Tempêtes":isWind?"Hauts des Alizés":isVolcano?"Donjon du Volcan":isFire?"Champs de Braise":isMountains?"Cimes de Schiste":isDepths?"Donjon de la Crevasse":isMarsh?"Marais de Gelée":"Jardin des essais";
  app.querySelector(".zone-card .eyebrow").textContent=isTutorial?"AURORIA · TUTORIEL":isFurnace?"AURORIA · DONJON":isStorm?"AURORIA · DONJON":isWind?"AURORIA · ALIZÉS":isVolcano?"AURORIA · DONJON":isFire?"AURORIA · VOLCAN":isMountains?"AURORIA · MONTAGNES":isDepths?"AURORIA · DONJON":isMarsh?"AURORIA · ZONE SLIME":"AURORIA · ZONE DEV";
  app.querySelector(".session-label").textContent=isTutorial?"Initiation · Iris vous accompagne":isFurnace?"Feu / Air · Braises & souffleries":isStorm?"Air / Eau · Croissance & ricochets":isWind?"Air · Aspiration & ricochets":isVolcano?"Terre / Feu · Magma persistant":isFire?"Feu · Traînées & explosions":isMountains?"Terre · Carapaces rocheuses":isDepths?(s.dungeonRun?.active?"Expédition · Eau & Terre":"Accès dev · Eau & Terre"):isMarsh?"Pluie battante · Cascade au sud-est":"Marais de Gelée · Sortie sud-est";
  app.querySelector("#tutorial-exit").hidden=inventoryOpen||!nearTutorialExit(s)||!canLeaveTutorial(s);
  app.querySelector('#sawmill-interaction').hidden=inventoryOpen||!nearSawmill(s);
  app.querySelector('#chest-interaction').hidden=inventoryOpen||!nearDevChest(s);
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
  if(open&&tab==='bestiary'&&(!inventoryOpen||currentTab!=='bestiary')){bestiaryFamily=null;bestiaryMonster=null;sectionChoices.bestiary='overview';sectionChoices['bestiary-family']='normal';}
  inventoryOpen = open;
  currentTab = tab;
  rememberedPanels[panelGroup(tab).id]=tab;
  if(open&&tab==='guides'&&ZONE_GUIDES.some(g=>g.zone===game.state.zone))guideZone=game.state.zone;
  app.querySelectorAll('.hud-category[open]').forEach(d=>d.open=false);
  if(open&&tab==='professions'&&game.state.tutorial?.step==='craft'){professionTab='woodcutting';sectionChoices.woodcutting='craft';}
  if(open)visitTutorialPanel(game.state,tab);
  app.querySelector('#inventory').hidden = !open;
  app.querySelector('#inventory-backdrop').hidden = !open;
  app.querySelector('[data-action="inventory"]').setAttribute('aria-expanded', String(open));
  app.querySelector('#inventory').classList.toggle('tools-open', tab==='tools');
  app.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === currentTab)));
  game.state.devChestOpen=open&&tab==='chest';
  game.setInterfaceOpen(open);
  if (open) {
    refresh(game.state);
    if(tab==='chest')panel.scrollTop=0;
    app.querySelector('[data-action="close-inventory"]').focus();
  } else app.querySelector('canvas').focus({ preventScroll: true });
}
let tutorial,mobileHud;
const game = createGame(app.querySelector('canvas'),app.querySelector('.touch-controls'),refresh,refreshUltimate,tab=>{if(tab==='handyman'){professionTab='handyman';setInventory(true,'professions');}else{if(tab==='characteristics')sectionChoices.characteristics='reset';if(tab==='professions'){professionTab='woodcutting';sectionChoices.woodcutting='craft';}setInventory(true,tab);}});
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
  button.closest('.hud-category')?.removeAttribute('open');
  const s=game.state;
  if(['mobile-menu-toggle','mobile-menu-scrim'].includes(button.id))return;
  if(button.dataset.action==='audio'||button.closest('#audio-settings')||button.closest('.tutorial'))return;
  if(button.dataset.action === 'tutorial-exit'){if(nearTutorialExit(s)&&canLeaveTutorial(s)){finishTutorial(s);game.refresh();refresh(s);}return;}
  if(button.dataset.action==='awaken-boss'){if(nearFurnaceBoss(s))awakenFurnaceBoss(s);else if(nearStormBoss(s))awakenStormBoss(s);else if(nearVolcanoBoss(s))awakenVolcanoBoss(s);else if(nearDepthsBoss(s))awakenDepthsBoss(s);game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(button.dataset.action==='zone-gate'){useZoneGate(s);game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(['marsh-help','close-marsh-guide','close-depths-guide','close-mountain-guide','close-fire-guide','close-volcano-guide','close-wind-guide','close-storm-guide','close-furnace-guide'].includes(button.dataset.action)){if(s.zone==='slime-furnace')s.furnaceGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-storm')s.stormGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-wind')s.windGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-volcano')s.volcanoGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-fire')s.fireGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-mountains')s.mountainGuideOpen=button.dataset.action==='marsh-help';else if(s.zone==='slime-depths')s.depthsGuideOpen=button.dataset.action==='marsh-help';else s.marshGuideOpen=button.dataset.action==='marsh-help';game.refresh();refresh(s);app.querySelector('canvas').focus({preventScroll:true});return;}
  if(button.dataset.action === 'lighting'){s.lighting=!s.lighting;try{localStorage.setItem('auroria-lighting-v1',s.lighting?'on':'off');}catch{}note(s,s.lighting?'Lumière dorée activée.':'Éclairage neutre activé.');game.refresh();refresh(s);return;}
  if (button.dataset.action === 'inventory') { setInventory(!(inventoryOpen && currentTab==='equipment'), 'equipment'); return; }
  if (button.dataset.action === 'bestiary') { setInventory(!(inventoryOpen && currentTab==='bestiary'), 'bestiary'); return; }
  if(button.dataset.profession){professionTab=button.dataset.profession;refresh(s);return;}
  if(button.hasAttribute('data-craft-keys')){const input=panel.querySelector('#key-quantity');if(input.reportValidity())craftDungeonKeys(s,Number(input.value),s.handymanDungeon);game.refresh();refresh(s);return;}
  if(button.dataset.openPanel){setInventory(true,button.dataset.openPanel);return;}
  if(button.dataset.panelGroup){const group=PANEL_GROUPS.find(g=>g.id===button.dataset.panelGroup);setInventory(true,rememberedPanels[group.id]||group.tabs[0][0]);return;}
  if(button.hasAttribute('data-bestiary-home')){bestiaryFamily=null;bestiaryMonster=null;panel.scrollTop=0;refresh(s);return;}
  if(button.dataset.bestiaryFamily){bestiaryFamily=button.dataset.bestiaryFamily;bestiaryMonster=null;sectionChoices['bestiary-family']='normal';panel.scrollTop=0;refresh(s);return;}
  if(button.dataset.sectionScope){sectionChoices[button.dataset.sectionScope]=button.dataset.sectionId;applySectionChoices(panel,sectionChoices);return;}
  if(button.dataset.guideZone){guideZone=button.dataset.guideZone;refresh(s);return;}
  if(button.dataset.action==='dev-chest'){if(nearDevChest(s))setInventory(true,'chest');return;}
  if(button.dataset.devChestItem!==undefined){const input=panel.querySelector('#chest-quantity');if(input.reportValidity()){chestQuantity=Number(input.value);withdrawDevItem(s,DEV_ITEMS[Number(button.dataset.devChestItem)]?.key,chestQuantity);refresh(s);}return;}
  if(button.dataset.action==='chest-take-all'){withdrawAllDevItems(s);refresh(s);return;}
  if(button.dataset.action==='chest-refill'){refillDevChest(s);refresh(s);return;}
  if(button.dataset.action==='key-recipe'){s.handymanDungeon=button.dataset.dungeon;professionTab='handyman';setInventory(true,'professions');return;}
  if(button.dataset.action==='handyman'){if(nearHandyman(s)){professionTab='handyman';setInventory(true,'professions');}return;}
  if (button.dataset.action === 'professions') {setInventory(true,'professions');return;}
  if (button.dataset.action === 'sawmill') {if(nearSawmill(s)){professionTab='woodcutting';sectionChoices.woodcutting='craft';setInventory(true,'professions');}return;}
  if(button.dataset.jobHarvest){const tree=s.trees.filter(t=>t.wood===button.dataset.jobHarvest&&t.respawn===0).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];if(tree){setInventory(false);requestCut(s,tree.id,(x,y)=>canWalkZone(x,y,s.zone));game.refresh();}return;}
  if(button.dataset.craftPlanks){const input=panel.querySelector('#plank-quantity');if(input.reportValidity())craftPlanks(s,button.dataset.craftPlanks,Number(input.value));}
  if (button.dataset.action === 'characteristics') {setInventory(true,'characteristics');return;}
  if (button.dataset.action === 'fountain') {if(nearFountain(s)){sectionChoices.characteristics='reset';setInventory(true,'characteristics');}return;}
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
  if(button.dataset.tab){if(button.dataset.tab==='bestiary'&&currentTab!=='bestiary'){bestiaryFamily=null;bestiaryMonster=null;sectionChoices.bestiary='overview';sectionChoices['bestiary-family']='normal';}rememberedPanels[panelGroup(button.dataset.tab).id]=button.dataset.tab;visitTutorialPanel(s,button.dataset.tab);if(currentTab!==button.dataset.tab)panel.scrollTop=0;currentTab=button.dataset.tab;app.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  if(button.dataset.monster){const monster=monsterDefinition(button.dataset.monster);if(monster){bestiaryMonster=monster.id;bestiaryFamily=monster.category;bestiaryLevel=bestiaryDefaultLevel(monster.id);sectionChoices.bestiary='overview';panel.scrollTop=0;}}
  if(button.dataset.main!==undefined)chooseMain(s,Number(button.dataset.main));
  if(button.dataset.inspectSlot) selectedItem = { source:'equipment', slot:button.dataset.inspectSlot };
  if(button.dataset.inspectBag) {
    const id = Number(button.dataset.inspectBag);
    const item = s.bag.find(item => item.id === id);
    if (event.shiftKey && item?.slot) {
      const equippedItem=equip(s, id);
      selectedItem = !!equippedItem
        ? { source:'equipment', slot:item.slot } : { source:'bag', id };
    } else selectedItem = { source:'bag', id };
  }
  if(button.dataset.slot) { unequip(s,button.dataset.slot); selectedItem = null; }
  if(button.dataset.equip) {
    const item = s.bag.find(item=>item.id===Number(button.dataset.equip));
    const equippedItem=equip(s,Number(button.dataset.equip));
    selectedItem = equippedItem ? { source:'equipment', slot:item.slot } : null;
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
  if(button.dataset.feedPet&&feedPet(s,Number(button.dataset.feedPet)))selectedItem=s.team[s.main].equipment.Familier?.id===s.lastFedPetId?{source:'equipment',slot:'Familier'}:{source:'bag',id:s.lastFedPetId};
  if(button.dataset.core)grantCore(s,button.dataset.core);
  if(button.dataset.openCore) openCore(s,Number(button.dataset.openCore));
  if(button.dataset.openCores) {
    const input = panel.querySelector('#core-quantity');
    if (input.reportValidity()) openCores(s,Number(button.dataset.openCores),Number(input.value));
  }
  if(button.dataset.loot)grantLoot(s,button.dataset.loot,button.dataset.chromatic==='true',devLootMonster);
  const actions={ 'chest-teleport':()=>{if(s.zone==='tutorial')return;teleport(s,'maison');movePartyToZone(s,'garden',DEV_CHEST_APPROACH);setInventory(false);}, 'boss-sets':()=>giveBossSets(s),'boss-materials':()=>{addWoodItem(s,'walnut','wood',36);for(const h of Object.values(HYBRID_SLIMES))for(const type of ['normal','rare'])s.bag.push({...hybridResource(h.id,type,true),id:s.nextItem++,quantity:10});note(s,'Bois de noyer et ressources chromatiques biélément ajoutés.');},'boss-loot':()=>{for(const h of Object.values(HYBRID_SLIMES))grantBossLoot(s,{species:h.boss},()=>0);}, 'furnace-teleport':()=>travelToZone(s,'slime-furnace'),'furnace-boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-furnace');const b=furnaceBoss(s);if(b)movePartyToZone(s,'slime-furnace',{x:b.homeX-35,y:b.homeY+35});},'furnace-key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'fire-slime');grantLoot(s,'rare',false,'wind-slime');note(s,'Ingrédients pour une Clé de la Fournaise ajoutés.');}, 'storm-teleport':()=>travelToZone(s,'slime-storm'),'storm-boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-storm');const b=stormBoss(s);if(b)movePartyToZone(s,'slime-storm',{x:b.homeX-15,y:b.homeY+45});},'storm-key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'wind-slime');grantLoot(s,'rare',false,'slime');note(s,'Ingrédients pour une Clé de l’Œil des Tempêtes ajoutés.');}, 'wind-teleport':()=>travelToZone(s,'slime-wind'), 'volcano-teleport':()=>travelToZone(s,'slime-volcano'),'volcano-boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-volcano');const b=volcanoBoss(s);if(b)movePartyToZone(s,'slime-volcano',{x:b.homeX-50,y:b.homeY+35});},'volcano-key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'fire-slime');grantLoot(s,'rare',false,'mountain-slime');note(s,'Ingrédients pour une Clé du Volcan ajoutés.');}, 'fire-teleport':()=>travelToZone(s,'slime-fire'), 'handyman-teleport':()=>teleport(s,'bricoleur'),'handyman-xp':()=>grantHandymanXp(s,30),'key-supplies':()=>{addWoodItem(s,'chestnut','plank',5);grantLoot(s,'rare',false,'slime');grantLoot(s,'rare',false,'mountain-slime');note(s,'Ingrédients de test pour une Clé de la Crevasse ajoutés.');}, 'mountains-teleport':()=>travelToZone(s,'slime-mountains'), 'maximized-sets':()=>giveMaximizedSets(s), 'boss-teleport':()=>{if(s.zone==='tutorial')return;travelToZone(s,'slime-depths');const b=depthsBoss(s);if(b)movePartyToZone(s,'slime-depths',{x:b.homeX-50,y:b.homeY-12});}, 'depths-teleport':()=>travelToZone(s,'slime-depths'), 'marsh-teleport':()=>travelToZone(s,'slime-marsh'), 'cancel-harvest':()=>cancelWoodcutting(s),'job-xp':()=>grantWoodcuttingXp(s,30),'job-wood':()=>addWoodItem(s,'ash','wood',10),'sawmill-teleport':()=>teleport(s,'scierie'),'woodcutting-teleport':()=>teleport(s,'bucheron'),'spell-charge':()=>{s.team.forEach(member=>member.ultimateCharge=100);note(s,'Ultimes personnels chargés (outil dev).');},attack:()=>attack(s),heal:()=>heal(s),home:()=>teleport(s,'maison'),combat:()=>teleport(s,'combat'),atelier:()=>teleport(s,'atelier'),'forge-teleport':()=>teleport(s,'forge'),'fountain-teleport':()=>teleport(s,'fontaine'),animalerie:()=>teleport(s,'animalerie'),xp:()=>grantXp(s,50),equipment:()=>giveEquipment(s,app.querySelector('#equipment-slot').value),auto:()=>{s.autoAttack=!s.autoAttack;note(s,`Attaque automatique ${s.autoAttack?'activée':'désactivée'}.`);},deploy:()=>toggleCombatMode(s)};
  if(actions[button.dataset.action])actions[button.dataset.action]();
  game.refresh();refresh(s);
  if(!inventoryOpen && (button.dataset.main!==undefined || ['attack','home','combat','atelier','animalerie','deploy'].includes(button.dataset.action)))app.querySelector('canvas').focus({preventScroll:true});
});
app.addEventListener('change', event => {if(event.target.id==='guide-zone'){guideZone=event.target.value;refresh(game.state);return;}if(event.target.id==='chest-category'){chestCategory=event.target.value;refresh(game.state);return;} if(event.target.id==='key-dungeon'){game.state.handymanDungeon=event.target.value;game.refresh();refresh(game.state);return;}  if(event.target.id==='spell-element'){spellFilter=event.target.value;refresh(game.state);} if(event.target.id==='loot-monster')devLootMonster=event.target.value; if(event.target.id==='bag-filter') { bagFilter=event.target.value; refresh(game.state); panel.querySelector('#bag-filter')?.focus(); } });
app.addEventListener('input', event => {
  if(event.target.id==='chest-search'){chestQuery=event.target.value;filterDevChest(panel,chestQuery);return;}
  if(event.target.id==='chest-quantity'){const n=Number(event.target.value);if(Number.isSafeInteger(n)&&n>=1&&n<=99)chestQuantity=n;return;}
  if(event.target.id==='key-quantity'){updateHandymanQuantity(game.state,panel);return;}
  if(event.target.id==='plank-quantity'){const count=Number(event.target.value),s=game.state;panel.querySelectorAll('[data-craft-planks]').forEach(button=>{const wood=woodById(button.dataset.craftPlanks);button.disabled=!Number.isSafeInteger(count)||count<1||!nearSawmill(s)||s.woodcutting.level<wood.level||woodQuantity(s,wood.id)<count*2;});return;}

  if(event.target.id!=='monster-level') return;
  bestiaryLevel = Number(event.target.value);
  inspectTutorialMonster(game.state,bestiaryMonster,bestiaryLevel);
  const corePanel=panel.querySelector('.bestiary-core');
  if(corePanel)corePanel.innerHTML=coreDropMarkup(bestiaryMonster,bestiaryLevel);
  panel.querySelector('#monster-level-value').textContent = bestiaryLevel;
  panel.querySelector('#monster-level-badge').textContent=`Niveau ${bestiaryLevel}`;
  for(const [stat,value] of Object.entries(bestiaryValues(bestiaryMonster,bestiaryLevel))) panel.querySelector(`[data-monster-stat="${stat}"]`).textContent=value;
});
const uiController = new AbortController();
const uiOptions = { signal: uiController.signal };
app.querySelector('#inventory-backdrop').addEventListener('click', () => setInventory(false), uiOptions);
for(const menu of app.querySelectorAll('.hud-category'))menu.addEventListener('toggle',()=>{if(menu.open)for(const sibling of app.querySelectorAll('.hud-category'))if(sibling!==menu)sibling.open=false;},uiOptions);
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.hud-category'))app.querySelectorAll('.hud-category[open]').forEach(d=>d.open=false);},uiOptions);
window.addEventListener('keydown', event => {
  if(event.code==='Escape'&&!inventoryOpen){const menu=app.querySelector('.hud-category[open]');if(menu){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();return;}}
  if(event.target.matches('[data-section-scope]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.code)){const scope=event.target.dataset.sectionScope,buttons=[...panel.querySelectorAll('[data-section-scope]')].filter(b=>b.dataset.sectionScope===scope);let index=buttons.indexOf(event.target);index=event.code==='Home'?0:event.code==='End'?buttons.length-1:(index+(event.code==='ArrowRight'?1:-1)+buttons.length)%buttons.length;event.preventDefault();buttons[index].focus();buttons[index].click();return;}
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
