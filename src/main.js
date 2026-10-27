import { createAudioUI } from './ui/audio.js';
import { renderProfessions } from './ui/professions.js';
import { requestCut, craftPlanks, woodQuantity, nearSawmill, cancelWoodcutting, grantWoodcuttingXp, addWoodItem } from './game/woodcutting.js';
import { woodById } from './data/woodcutting.js';
import { renderCharacteristics } from './ui/characteristics.js';
import { nearFountain, allocateCharacteristic, resetCharacteristics, learnUltimate } from './data/progression.js';
import { renderSpellbook, updateSpellBar } from './ui/spells.js';
import { equipSpell } from './data/spells.js';
import { renderForge } from './ui/forge.js';
import { nearForge, upgradeChromatic } from './game/forge.js';
import { renderPetShop } from "./ui/petshop.js";
import { acceptAdoption, claimPet, feedPet, nearPetShop } from "./game/pet-quests.js";
import { MONSTERS } from "./data/monsters.js";
import { ELEMENTS } from './data/equipment.js';
import { renderBestiary, bestiaryValues, coreDropMarkup } from './ui/bestiary.js';
import { renderInventory } from './ui/inventory.js';
import './style.css';
import { createGame } from './game/create-game.js';
import { ROLES, COLORS, SLOTS, teleport, chooseMain, grantXp, heal, grantLoot, grantCore, openCore, openCores, giveEquipment, equip, unequip, attack, note, activateUltimate, castEquipped, canStand } from './dev/sandbox.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="game-screen">
  <canvas width="640" height="400" tabindex="0" aria-label="Jardin des essais. Flèches ou ZQSD pour bouger, molette pour changer de personnage, clic gauche sur les cibles bonus, clic droit, R et C pour les sorts, T pour l’ultime personnel, E pour déployer la troupe, K pour le grimoire, P pour les caractéristiques, I pour l’inventaire."></canvas>
  <div class="hud-top"><div class="zone-card"><span class="eyebrow">AURORIA · ZONE DEV</span><h1>Jardin des essais</h1><span class="session-label"><i></i> Session locale · 3 bots</span></div><div class="hud-menu"><button data-action="inventory" aria-controls="inventory" aria-expanded="false">▣ Inventaire <kbd>I</kbd></button><button data-action="bestiary" aria-label="Bestiaire B">☷ <span>Bestiaire</span> <kbd>B</kbd></button><button data-action="characteristics">◈ <span>Carac.</span> <kbd>P</kbd></button><button data-action="spells">✦ <span>Grimoire</span> <kbd>K</kbd></button><button data-action="professions">🪓 <span>Métiers</span> <kbd>L</kbd></button><button data-action="tools">⚙ Outils dev</button><button data-action="audio" aria-label="Réglages audio">🔊</button><button data-action="fullscreen" aria-label="Basculer le plein écran">⛶</button></div></div>
  <div class="hud-team"><p class="hud-hint">VOTRE TROUPE <span>↕ Molette pour changer</span></p><div id="team" class="team-grid"></div></div>
  <div class="hud-notification" id="notification" role="status"></div>
  <div class="hud-bottom"><div class="controls-hint"><kbd>ZQSD</kbd> Bouger <span>·</span> <kbd>Clic droit</kbd> Attaquer <span>·</span> <kbd>Clic gauche</kbd> Cible bonus <span>·</span> <kbd>↕</kbd> Changer</div><div class="action-bar"><div id="spellbar" class="spellbar"></div><div class="ultimate-box"><button data-action="deploy" id="deploy">Ultime prêt · E</button><div class="ultimate-track"><span id="ultimate-progress"></span></div><span id="ultimate-status">Ultime prêt · Troupe réunie 30 s</span></div></div></div>
  <div id="harvest-status" class="harvest-status" hidden><span></span><progress max="1" value="0"></progress><button data-action="cancel-harvest">Annuler</button></div><button id="sawmill-interaction" data-action="sawmill" class="world-interaction" hidden>Scierie · F</button><button id="fountain-interaction" data-action="fountain" class="world-interaction" hidden>Fontaine du renouveau · F</button><button id="forge-interaction" data-action="forge" class="world-interaction" hidden>Parler à Borin · F</button><button id="petshop-interaction" data-action="petshop" class="world-interaction" hidden>Parler à Nola · F</button><nav class="touch-controls" aria-label="Déplacement tactile"><button data-direction="up" aria-label="Haut">↑</button><div><button data-direction="left" aria-label="Gauche">←</button><button data-direction="down" aria-label="Bas">↓</button><button data-direction="right" aria-label="Droite">→</button></div></nav>
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
let forgeItem = null;
let devLootMonster = 'slime';
const panel = app.querySelector('#panel');
function refresh(s) {
  app.querySelector('#team').innerHTML = s.team.map((m,i)=>`<button class="member ${i===s.main?'selected':''} ${m.hp===0?'fallen':''}" data-main="${i}" style="--role:${COLORS[m.role]}" aria-pressed="${i===s.main}"><span class="portrait">${m.role==='melee'?'⚔':m.role==='support'?'✧':'➶'}</span><span class="member-text"><strong>${m.name}<small>Niv. ${m.level}</small></strong><span>${ROLES[m.role]}</span><span class="hp-track"><span style="width:${m.hp/m.maxHp*100}%"></span></span><small>${m.hp} / ${m.maxHp} PV</small></span></button>`).join('');
  app.querySelector('#bag-count').textContent = s.bag.reduce((sum,item)=>sum+item.quantity,0);
  refreshUltimate(s);
  app.querySelector('#notification').textContent = s.log[0];
  if (!inventoryOpen) return;
  const previousPlankQuantity=panel.querySelector('#plank-quantity')?.value;
  const previousStatQuantity = panel.querySelector('#stat-quantity')?.value;
  const previousCore = panel.querySelector('[data-open-core]')?.dataset.openCore;
  const previousQuantity = panel.querySelector('#core-quantity')?.value;
  const previousSlot = panel.querySelector('#equipment-slot')?.value;
  const focus = panel.contains(document.activeElement) ? document.activeElement : null;
  const focusAttribute = focus && ['data-craft-planks','data-job-harvest','data-allocate-stat','data-reset-characteristics','data-learn-ultimate','data-spell-slot','data-equip-spell','data-forge-select','data-forge-upgrade','data-action','data-adopt','data-claim-pet','data-feed-pet','data-core','data-open-cores','data-open-core','data-monster','data-inspect-slot','data-inspect-bag','data-slot','data-equip'].find(name=>focus.hasAttribute(name));
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
  if(currentTab==='professions')panel.innerHTML=renderProfessions(s,previousPlankQuantity||1);
  app.querySelector('#inventory').classList.toggle('professions-open',currentTab==='professions');
  if(currentTab==='characteristics')panel.innerHTML=renderCharacteristics(s);
  app.querySelector('#inventory').classList.toggle('characteristics-open',currentTab==='characteristics');
  if(currentTab==='spells') panel.innerHTML=renderSpellbook(s,spellSlot,spellFilter);
  app.querySelector('#inventory').classList.toggle('spells-open',currentTab==='spells');
  if(currentTab==='forge') panel.innerHTML = renderForge(s,forgeItem);
  app.querySelector('#inventory').classList.toggle('forge-open',currentTab==='forge');
  if(currentTab==='petshop') panel.innerHTML = renderPetShop(s);
  app.querySelector('#inventory').classList.toggle('petshop-open',currentTab==='petshop');
  if(currentTab==='equipment') panel.innerHTML = renderInventory(s, selectedItem, bagFilter);
  if(currentTab==='tools') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">BAC À SABLE</p><h2>Outils de développement</h2><p>Essayez sans attendre ni farmer.</p></div><section class="tool-group"><h3>Progression & combat</h3><div class="tool-buttons"><button data-action="xp">+50 XP à l’équipe</button><button data-action="heal">Soigner / réanimer</button><button data-action="spell-charge">Charger les ultimes personnels</button><button data-action="auto" aria-pressed="${s.autoAttack}">Attaque auto : ${s.autoAttack?'oui':'non'}</button></div></section><section class="tool-group"><h3>Bûcheron · Essais</h3><div class="tool-buttons"><button data-action="job-xp">+30 XP bûcheron</button><button data-action="job-wood">10 Bois de frêne (test)</button><button data-action="sawmill-teleport">Scierie</button><button data-action="woodcutting-teleport">Bosquet</button></div></section><section class="tool-group"><h3>Noyaux débutants · 1–10</h3><div class="tool-buttons">${Object.entries(ELEMENTS).map(([element,e])=>`<button data-core="${element}">Noyau de ${e.name}</button>`).join('')}</div><p class="panel-hint">Ouvrez-les au village près de la maison pour obtenir une pièce aléatoire.</p></section><section class="tool-group"><h3>Générer du loot</h3><label for="loot-monster">Monstre source</label><select id="loot-monster">${MONSTERS.map(monster=>`<option value="${monster.id}" ${devLootMonster===monster.id?'selected':''}>${monster.name}</option>`).join('')}</select><div class="loot-buttons"><button data-loot="normal">Normal</button><button data-loot="rare">Rare</button><button data-loot="normal" data-chromatic="true">✦ Normal chromatique</button><button data-loot="rare" data-chromatic="true">✦ Rare chromatique</button></div><p class="panel-hint">Combat de test : 20 % rare et 10 % chromatique. Ces taux ne fixent pas l’équilibrage final.</p></section><section class="tool-group"><h3>Générer un équipement</h3><label for="equipment-slot">Emplacement</label><select id="equipment-slot">${SLOTS.map(slot=>`<option>${slot}</option>`).join('')}</select><button data-action="equipment">Ajouter au sac</button></section><section class="tool-group"><h3>Déplacements rapides</h3><div class="tool-buttons"><button data-action="home">Maison</button><button data-action="forge-teleport">Forge</button><button data-action="animalerie">Animalerie</button><button data-action="fountain-teleport">Fontaine</button><button data-action="combat">Combat</button></div></section><section class="journal"><h3>Journal de test</h3><ul>${s.log.map(line=>`<li>${line}</li>`).join('')}</ul></section>`;
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
  app.querySelector('#sawmill-interaction').hidden=inventoryOpen||!nearSawmill(s);
  const harvest=app.querySelector('#harvest-status'),action=s.woodcutting.action;harvest.hidden=!action;
  if(action){const tree=s.trees.find(t=>t.id===action.tree);harvest.querySelector('span').textContent=`${action.phase==='walk'?'En route':'Coupe'} · ${woodById(tree.wood).name}`;harvest.querySelector('progress').value=action.phase==='cut'?action.progress/action.duration:0;}

  app.querySelector('#fountain-interaction').hidden=inventoryOpen||!nearFountain(s);
  const characteristicButton=app.querySelector('[data-action="characteristics"]');
  characteristicButton.classList.toggle('has-points',s.team[s.main].characteristicPoints>0);
  characteristicButton.title=`Caractéristiques · ${s.team[s.main].characteristicPoints} points à répartir (P)`;
  updateSpellBar(s,app.querySelector('#spellbar'));
  app.querySelector('#forge-interaction').hidden = inventoryOpen || !nearForge(s);
  app.querySelector('#petshop-interaction').hidden = inventoryOpen || !nearPetShop(s);
  const active = s.ultimate.remaining > 0;
  const seconds = Math.ceil(active ? s.ultimate.remaining : s.ultimate.cooldown);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
  const button = app.querySelector('#deploy');
  const label = active ? `Ultime actif · ${clock}` : s.ultimate.cooldown > 0 ? `Ultime · ${clock}` : 'Ultime prêt · E';
  if (button.textContent !== label) button.textContent = label;
  button.disabled = active || s.ultimate.cooldown > 0 || s.team[s.main].hp <= 0;
  const status = active ? `Troupe déployée · ${seconds} s restantes` : s.ultimate.cooldown > 0 ? `Ultime en recharge · ${clock}` : 'Ultime prêt · Troupe réunie 30 s';
  const indicator = app.querySelector('#ultimate-status');
  if (indicator.textContent !== status) indicator.textContent = status;
  app.querySelector('#ultimate-progress').style.width = `${active ? s.ultimate.remaining / 30 * 100 : (1 - s.ultimate.cooldown / 300) * 100}%`;
}
function setInventory(open, tab = currentTab) {
  if(open)sound.close();
  if(currentTab!==tab)panel.scrollTop=0;
  inventoryOpen = open;
  currentTab = tab;
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
const game = createGame(app.querySelector('canvas'),app.querySelector('.touch-controls'),refresh,refreshUltimate,tab=>setInventory(true,tab));
refresh(game.state);
app.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button)return;
  const s=game.state;
  if(button.dataset.action==='audio'||button.closest('#audio-settings'))return;
  if (button.dataset.action === 'inventory') { setInventory(!(inventoryOpen && currentTab==='equipment'), 'equipment'); return; }
  if (button.dataset.action === 'bestiary') { setInventory(!(inventoryOpen && currentTab==='bestiary'), 'bestiary'); return; }
  if (button.dataset.action === 'professions') {setInventory(true,'professions');return;}
  if (button.dataset.action === 'sawmill') {if(nearSawmill(s))setInventory(true,'professions');return;}
  if(button.dataset.jobHarvest){const tree=s.trees.filter(t=>t.wood===button.dataset.jobHarvest&&t.respawn===0).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];if(tree){setInventory(false);requestCut(s,tree.id,canStand);game.refresh();}return;}
  if(button.dataset.craftPlanks){const input=panel.querySelector('#plank-quantity');if(input.reportValidity())craftPlanks(s,button.dataset.craftPlanks,Number(input.value));}
  if (button.dataset.action === 'characteristics') {setInventory(true,'characteristics');return;}
  if (button.dataset.action === 'fountain') {if(nearFountain(s))setInventory(true,'characteristics');return;}
  if (button.dataset.action === 'spells') {setInventory(true,'spells');return;}
  if(button.dataset.castSpell!==undefined&&!inventoryOpen){castEquipped(s,Number(button.dataset.castSpell));game.refresh();app.querySelector('canvas').focus({preventScroll:true});return;}
  if (button.dataset.action === 'forge') { if(nearForge(s))setInventory(true,'forge'); return; }
  if (button.dataset.action === 'petshop') { if(nearPetShop(s))setInventory(true,'petshop'); return; }
  if (button.dataset.action === 'tools') { setInventory(true, 'tools'); return; }
  if (button.dataset.action === 'close-inventory') { setInventory(false); return; }
  if (button.dataset.action === 'fullscreen') {
    const request = document.fullscreenElement ? document.exitFullscreen() : app.querySelector('.game-screen').requestFullscreen?.();
    request?.catch(() => note(s, 'Le plein écran est indisponible dans ce navigateur.'));
    return;
  }
  if(button.dataset.tab){if(currentTab!==button.dataset.tab)panel.scrollTop=0;currentTab=button.dataset.tab;app.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
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
  if(button.dataset.equipSpell)equipSpell(s,s.main,spellSlot,button.dataset.equipSpell);
  if(button.dataset.forgeSelect)forgeItem=Number(button.dataset.forgeSelect);
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
  const actions={ 'cancel-harvest':()=>cancelWoodcutting(s),'job-xp':()=>grantWoodcuttingXp(s,30),'job-wood':()=>addWoodItem(s,'ash','wood',10),'sawmill-teleport':()=>teleport(s,'scierie'),'woodcutting-teleport':()=>teleport(s,'bucheron'),'spell-charge':()=>{s.team.forEach(member=>member.ultimateCharge=100);note(s,'Ultimes personnels chargés (outil dev).');},attack:()=>attack(s),heal:()=>heal(s),home:()=>teleport(s,'maison'),combat:()=>teleport(s,'combat'),atelier:()=>teleport(s,'atelier'),'forge-teleport':()=>teleport(s,'forge'),'fountain-teleport':()=>teleport(s,'fontaine'),animalerie:()=>teleport(s,'animalerie'),xp:()=>grantXp(s,50),equipment:()=>giveEquipment(s,app.querySelector('#equipment-slot').value),auto:()=>{s.autoAttack=!s.autoAttack;note(s,`Attaque automatique ${s.autoAttack?'activée':'désactivée'}.`);},deploy:()=>activateUltimate(s)};
  if(actions[button.dataset.action])actions[button.dataset.action]();
  game.refresh();refresh(s);
  if(!inventoryOpen && (button.dataset.main!==undefined || ['attack','home','combat','atelier','animalerie','deploy'].includes(button.dataset.action)))app.querySelector('canvas').focus({preventScroll:true});
});
app.addEventListener('change', event => { if(event.target.id==='spell-element'){spellFilter=event.target.value;refresh(game.state);} if(event.target.id==='loot-monster')devLootMonster=event.target.value; if(event.target.id==='bag-filter') { bagFilter=event.target.value; refresh(game.state); panel.querySelector('#bag-filter')?.focus(); } });
app.addEventListener('input', event => {
  if(event.target.id==='plank-quantity'){const count=Number(event.target.value),s=game.state;panel.querySelectorAll('[data-craft-planks]').forEach(button=>{const wood=woodById(button.dataset.craftPlanks);button.disabled=!Number.isSafeInteger(count)||count<1||!nearSawmill(s)||s.woodcutting.level<wood.level||woodQuantity(s,wood.id)<count*2;});return;}

  if(event.target.id!=='monster-level') return;
  bestiaryLevel = Number(event.target.value);
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
if(import.meta.hot)import.meta.hot.dispose(()=>{uiController.abort();sound.destroy();game.destroy();delete window.auroria;});
