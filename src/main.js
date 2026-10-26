import { renderInventory } from './ui/inventory.js';
import './style.css';
import { createGame } from './game/create-game.js';
import { ROLES, COLORS, SLOTS, teleport, chooseMain, grantXp, heal, grantLoot, giveEquipment, equip, unequip, attack, note, activateUltimate } from './dev/sandbox.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="game-screen">
  <canvas width="640" height="400" tabindex="0" aria-label="Jardin des essais. Flèches ou ZQSD pour bouger, molette pour changer de personnage, clic droit pour viser et attaquer, E pour l’ultime, I pour l’inventaire."></canvas>
  <div class="hud-top"><div class="zone-card"><span class="eyebrow">AURORIA · ZONE DEV</span><h1>Jardin des essais</h1><span class="session-label"><i></i> Session locale · 3 bots</span></div><div class="hud-menu"><button data-action="inventory" aria-controls="inventory" aria-expanded="false">▣ Inventaire <kbd>I</kbd></button><button data-action="tools">⚙ Outils dev</button><button data-action="fullscreen" aria-label="Basculer le plein écran">⛶</button></div></div>
  <div class="hud-team"><p class="hud-hint">VOTRE TROUPE <span>↕ Molette pour changer</span></p><div id="team" class="team-grid"></div></div>
  <div class="hud-notification" id="notification" role="status"></div>
  <div class="hud-bottom"><div class="controls-hint"><kbd>ZQSD</kbd> Bouger <span>·</span> <kbd>Clic droit</kbd> Attaquer <span>·</span> <kbd>↕</kbd> Changer</div><div class="action-bar"><button data-action="attack">⚔<small>Attaquer</small><kbd>Clic droit</kbd></button><div class="ultimate-box"><button data-action="deploy" id="deploy">Ultime prêt · E</button><div class="ultimate-track"><span id="ultimate-progress"></span></div><span id="ultimate-status">Ultime prêt · Troupe réunie 30 s</span></div></div></div>
  <nav class="touch-controls" aria-label="Déplacement tactile"><button data-direction="up" aria-label="Haut">↑</button><div><button data-direction="left" aria-label="Gauche">←</button><button data-direction="down" aria-label="Bas">↓</button><button data-direction="right" aria-label="Droite">→</button></div></nav>
  <div id="inventory-backdrop" class="inventory-backdrop" hidden></div>
  <section id="inventory" class="inventory-window" role="dialog" aria-modal="true" aria-labelledby="inventory-title" hidden>
    <div class="inventory-title"><div><p class="eyebrow">VOTRE ÉQUIPEMENT & VOTRE BUTIN</p><h2 id="inventory-title">Inventaire</h2></div><button data-action="close-inventory" aria-label="Fermer l’inventaire">✕ <kbd>Échap</kbd></button></div>
    <nav class="tabs" aria-label="Panneaux de l’inventaire"><button data-tab="equipment" aria-pressed="true">Équipement & sac <span id="bag-count">0</span></button><button data-tab="tools" aria-pressed="false">Outils dev</button></nav>
    <div id="panel"></div><div class="local-notice">Zone de test locale · Sans sauvegarde · Le monde continue pendant l’inventaire.</div>
  </section>
</main>`;
let inventoryOpen = false;
let currentTab = 'equipment';
let selectedItem = null;
let bagFilter = 'all';
const panel = app.querySelector('#panel');
function refresh(s) {
  app.querySelector('#team').innerHTML = s.team.map((m,i)=>`<button class="member ${i===s.main?'selected':''} ${m.hp===0?'fallen':''}" data-main="${i}" style="--role:${COLORS[m.role]}" aria-pressed="${i===s.main}"><span class="portrait">${m.role==='melee'?'⚔':m.role==='support'?'✧':'➶'}</span><span class="member-text"><strong>${m.name}<small>Niv. ${m.level}</small></strong><span>${ROLES[m.role]}</span><span class="hp-track"><span style="width:${m.hp/m.maxHp*100}%"></span></span><small>${m.hp} / ${m.maxHp} PV</small></span></button>`).join('');
  app.querySelector('#bag-count').textContent = s.bag.reduce((sum,item)=>sum+item.quantity,0);
  refreshUltimate(s);
  app.querySelector('#notification').textContent = s.log[0];
  if (!inventoryOpen) return;
  const previousSlot = panel.querySelector('#equipment-slot')?.value;
  const focus = panel.contains(document.activeElement) ? document.activeElement : null;
  const focusAttribute = focus && ['data-action','data-inspect-slot','data-inspect-bag','data-slot','data-equip'].find(name=>focus.hasAttribute(name));
  const focusKey = focus?.id ? `#${CSS.escape(focus.id)}` : focusAttribute ? `[${focusAttribute}="${CSS.escape(focus.getAttribute(focusAttribute))}"]` : null;
  const scrollTop = panel.scrollTop;
  const m = s.team[s.main];
  if(currentTab==='equipment') panel.innerHTML = renderInventory(s, selectedItem, bagFilter);
  if(currentTab==='tools') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">BAC À SABLE</p><h2>Outils de développement</h2><p>Essayez sans attendre ni farmer.</p></div><section class="tool-group"><h3>Progression & combat</h3><div class="tool-buttons"><button data-action="xp">+50 XP à l’équipe</button><button data-action="heal">Soigner / réanimer</button><button data-action="auto" aria-pressed="${s.autoAttack}">Attaque auto : ${s.autoAttack?'oui':'non'}</button></div></section><section class="tool-group"><h3>Générer du loot · Slime</h3><div class="loot-buttons"><button data-loot="normal">Normal</button><button data-loot="rare">Rare</button><button data-loot="normal" data-chromatic="true">✦ Normal chromatique</button><button data-loot="rare" data-chromatic="true">✦ Rare chromatique</button></div><p class="panel-hint">Combat de test : 20 % rare et 10 % chromatique. Ces taux ne fixent pas l’équilibrage final.</p></section><section class="tool-group"><h3>Générer un équipement</h3><label for="equipment-slot">Emplacement</label><select id="equipment-slot">${SLOTS.map(slot=>`<option>${slot}</option>`).join('')}</select><button data-action="equipment">Ajouter au sac</button></section><section class="tool-group"><h3>Déplacements rapides</h3><div class="tool-buttons"><button data-action="home">Maison</button><button data-action="atelier">Atelier</button><button data-action="combat">Combat</button></div></section><section class="journal"><h3>Journal de test</h3><ul>${s.log.map(line=>`<li>${line}</li>`).join('')}</ul></section>`;
  app.querySelector('#inventory').classList.toggle('tools-open', currentTab==='tools');
  const slotSelect = panel.querySelector('#equipment-slot');
  if (slotSelect && previousSlot) slotSelect.value = previousSlot;
  panel.scrollTop = scrollTop;
  if (focusKey) (panel.querySelector(focusKey) || panel.querySelector('.item-details button') || app.querySelector('[data-action="close-inventory"]')).focus({ preventScroll: true });
}
function refreshUltimate(s) {
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
const game = createGame(app.querySelector('canvas'),app.querySelector('.touch-controls'),refresh,refreshUltimate);
refresh(game.state);
app.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button)return;
  const s=game.state;
  if (button.dataset.action === 'inventory') { setInventory(!inventoryOpen); return; }
  if (button.dataset.action === 'tools') { setInventory(true, 'tools'); return; }
  if (button.dataset.action === 'close-inventory') { setInventory(false); return; }
  if (button.dataset.action === 'fullscreen') {
    const request = document.fullscreenElement ? document.exitFullscreen() : app.querySelector('.game-screen').requestFullscreen?.();
    request?.catch(() => note(s, 'Le plein écran est indisponible dans ce navigateur.'));
    return;
  }
  if(button.dataset.tab){currentTab=button.dataset.tab;app.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  if(button.dataset.main!==undefined)chooseMain(s,Number(button.dataset.main));
  if(button.dataset.inspectSlot) selectedItem = { source:'equipment', slot:button.dataset.inspectSlot };
  if(button.dataset.inspectBag) selectedItem = { source:'bag', id:Number(button.dataset.inspectBag) };
  if(button.dataset.slot) { unequip(s,button.dataset.slot); selectedItem = null; }
  if(button.dataset.equip) {
    const item = s.bag.find(item=>item.id===Number(button.dataset.equip));
    equip(s,Number(button.dataset.equip));
    selectedItem = item ? { source:'equipment', slot:item.slot } : null;
  }
  if(button.dataset.loot)grantLoot(s,button.dataset.loot,button.dataset.chromatic==='true');
  const actions={ attack:()=>attack(s),heal:()=>heal(s),home:()=>teleport(s,'maison'),combat:()=>teleport(s,'combat'),atelier:()=>teleport(s,'atelier'),xp:()=>grantXp(s,50),equipment:()=>giveEquipment(s,app.querySelector('#equipment-slot').value),auto:()=>{s.autoAttack=!s.autoAttack;note(s,`Attaque automatique ${s.autoAttack?'activée':'désactivée'}.`);},deploy:()=>activateUltimate(s)};
  if(actions[button.dataset.action])actions[button.dataset.action]();
  game.refresh();refresh(s);
  if(!inventoryOpen && (button.dataset.main!==undefined || ['attack','home','combat','atelier','deploy'].includes(button.dataset.action)))app.querySelector('canvas').focus({preventScroll:true});
});
app.addEventListener('change', event => { if(event.target.id==='bag-filter') { bagFilter=event.target.value; refresh(game.state); panel.querySelector('#bag-filter')?.focus(); } });
const uiController = new AbortController();
const uiOptions = { signal: uiController.signal };
app.querySelector('#inventory-backdrop').addEventListener('click', () => setInventory(false), uiOptions);
window.addEventListener('keydown', event => {
  const editable = event.target.matches('input, select, textarea, [contenteditable="true"]');
  if (event.code === 'KeyI' && !editable) {
    event.preventDefault();
    if (!event.repeat) setInventory(!inventoryOpen);
    return;
  }
  if (!inventoryOpen) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) setInventory(false);
  }
  if (event.code === 'Tab') {
    const elements = [...app.querySelector('#inventory').querySelectorAll('button:not(:disabled), select')];
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}, uiOptions);
// Read-only inspection for browser checks; mutations go through the visible tools.
window.auroria={snapshot:()=>JSON.parse(JSON.stringify(game.state))};
if(import.meta.hot)import.meta.hot.dispose(()=>{uiController.abort();game.destroy();delete window.auroria;});
