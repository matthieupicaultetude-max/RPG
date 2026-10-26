import './style.css';
import { createGame } from './game/create-game.js';
import { ROLES, COLORS, SLOTS, atHome, teleport, chooseMain, changeFlex, grantXp, heal, grantLoot, giveEquipment, equip, unequip, attack, note } from './dev/sandbox.js';

const app = document.querySelector('#app');
app.innerHTML = `
<header><a href="./" class="brand"><span class="brand-icon">✦</span> AURORIA <small>LES JARDINS D’ESSAI</small></a><div class="status"><i></i> Sandbox locale <span>DEV 0.1</span></div></header>
<main>
  <section class="page-heading"><div><p class="eyebrow">ZONE DE DÉVELOPPEMENT</p><h1>Le jardin des possibles<span>.</span></h1><p>Une petite zone pour donner vie aux prochaines aventures.</p></div><div class="world-info"><strong>01</strong><span>ZONE D’ESSAI<br>Équipe de 4 · 3 bots locaux</span></div></section>
  <div class="workspace"><section class="play-column">
    <div class="scene"><div class="scene-top"><span><i></i> Jardin des essais</span><span>Vue top-down · Temps réel</span></div><canvas width="640" height="400" tabindex="0" aria-label="Zone de développement. Cliquez pour jouer, flèches ou ZQSD pour bouger, Espace pour attaquer."></canvas><div class="scene-bottom"><span><kbd>↑↓←→</kbd> / <kbd>ZQSD</kbd> Bouger <kbd>Espace</kbd> Attaquer</span><button data-action="deploy" id="deploy">Rappeler les alliés</button></div></div>
    <div class="team-heading"><h2>Votre équipe</h2><span>Cliquez sur un portrait pour prendre le contrôle</span></div><div id="team" class="team-grid"></div>
    <div class="quick-actions"><button data-action="attack">⚔ Attaquer</button><button data-action="heal">✧ Soigner l’équipe</button><button data-action="home">⌂ Retour maison</button><button data-action="combat">Aller au combat →</button></div>
    <nav class="touch-controls" aria-label="Déplacement tactile"><button data-direction="up" aria-label="Haut">↑</button><div><button data-direction="left" aria-label="Gauche">←</button><button data-direction="down" aria-label="Bas">↓</button><button data-direction="right" aria-label="Droite">→</button></div></nav>
    <section class="journal"><div><h2>Journal de test</h2><span>Événements de la session</span></div><ul id="log" aria-live="polite"></ul></section>
  </section><aside>
    <nav class="tabs" aria-label="Panneaux de test"><button data-tab="equipment" aria-pressed="true">Personnage</button><button data-tab="bag" aria-pressed="false">Sac <span id="bag-count">0</span></button><button data-tab="tools" aria-pressed="false">Outils dev</button></nav>
    <div id="panel"></div>
    <div class="local-notice"><span>◈</span><p><strong>Terrain d’expérimentation</strong>La population est simulée sur cet appareil. Aucune connexion multijoueur ni sauvegarde. Les statistiques et les règles de combat sont provisoires.</p></div>
  </aside></div>
</main><footer>AURORIA <span>Construisons le monde, une fonctionnalité à la fois.</span><span>SESSION LOCALE</span></footer>`;
let currentTab = 'equipment';
const panel = app.querySelector('#panel');
function refresh(s) {
  app.querySelector('#team').innerHTML = s.team.map((m,i)=>`<button class="member ${i===s.main?'selected':''} ${m.hp===0?'fallen':''}" data-main="${i}" style="--role:${COLORS[m.role]}" aria-pressed="${i===s.main}"><span class="portrait">${m.role==='melee'?'⚔':m.role==='support'?'✧':'➶'}</span><span class="member-text"><strong>${m.name}<small>Niv. ${m.level}</small></strong><span>${i===3?'Flex · ':''}${ROLES[m.role]}</span><span class="hp-track"><span style="width:${m.hp/m.maxHp*100}%"></span></span><small>${m.hp} / ${m.maxHp} PV</small></span></button>`).join('');
  app.querySelector('#bag-count').textContent = s.bag.reduce((sum,item)=>sum+item.quantity,0);
  app.querySelector('#deploy').textContent = s.deployed ? 'Rappeler les alliés' : 'Déployer les alliés';
  app.querySelector('#log').innerHTML = s.log.map(line=>`<li>${line}</li>`).join('');
  const m = s.team[s.main];
  if(currentTab==='equipment') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">PERSONNAGE PRINCIPAL</p><h2>${m.name} <span>Niv. ${m.level}</span></h2><p>${ROLES[m.role]} · ${s.gold} pièces</p><div class="xp-track"><span style="width:${m.xp/(m.level*50)*100}%"></span></div><small>${m.xp} / ${m.level*50} XP · Courbe de test</small></div><div class="equipment-grid">${SLOTS.map((slot,i)=>`<button class="slot ${m.equipment[slot]?'filled':''}" data-slot="${slot}" title="${m.equipment[slot]?'Retirer '+m.equipment[slot].name:'Emplacement vide : '+slot}" ${!m.equipment[slot]?'disabled':''}><span>${i>=8?'◇':i===7?'⚔':i===0?'♜':i===1?'◩':i===3?'♟':'◈'}</span><small>${slot}</small>${m.equipment[slot]?'<b>Équipé</b>':''}</button>`).join('')}</div><p class="panel-hint">14 emplacements · Sélectionnez un objet du sac pour l’équiper. Cliquez sur un objet équipé pour le retirer. Coiffe et cape modifient le sprite ; l’arme ajoute 5 dégâts de test.</p><div class="composition"><h3>Composition à la maison</h3><p>${atHome(s)?'Vous êtes à la maison. Modifiez le quatrième poste.':'Revenez à la maison pour modifier le poste flexible.'}</p><div class="role-buttons">${Object.entries(ROLES).map(([role,label])=>`<button data-flex="${role}" ${!atHome(s)?'disabled':''} aria-pressed="${s.team[3].role===role}">${label}</button>`).join('')}</div><small>Postes 1 à 3 fixes pour ce banc d’essai.</small></div>`;
  if(currentTab==='bag') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">INVENTAIRE D’ÉQUIPE · TEST</p><h2>Le sac de voyage</h2><p>${s.bag.length} piles · ${s.gold} pièces</p></div><div class="bag-list">${s.bag.length?s.bag.map(item=>`<div class="bag-item ${item.chromatic?'chromatic':''}"><span class="item-icon">${item.slot?'◈':item.chromatic?'✦':item.type==='rare'?'◆':'●'}</span><div><strong>${item.name}</strong><small>${item.slot?'Équipement':item.type==='rare'?'Rare':'Normal'}${item.chromatic?' · Chromatique':''} · ×${item.quantity}</small></div>${item.slot?`<button data-equip="${item.id}">Équiper</button>`:''}</div>`).join(''):'<div class="empty-bag">◇<h3>Tout reste à découvrir</h3><p>Affrontez les monstres ou générez des objets dans les outils dev.</p></div>'}</div><p class="panel-hint">Sac partagé et sans limite pour les essais. Les variantes chromatiques restent dans des piles distinctes.</p>`;
  if(currentTab==='tools') panel.innerHTML = `<div class="panel-heading"><p class="eyebrow">BAC À SABLE</p><h2>Outils de développement</h2><p>Essayez sans attendre ni farmer.</p></div><section class="tool-group"><h3>Progression & combat</h3><div class="tool-buttons"><button data-action="xp">+50 XP à l’équipe</button><button data-action="heal">Soigner / réanimer</button><button data-action="auto" aria-pressed="${s.autoAttack}">Attaque auto : ${s.autoAttack?'oui':'non'}</button></div></section><section class="tool-group"><h3>Générer du loot · Slime</h3><div class="loot-buttons"><button data-loot="normal">Normal</button><button data-loot="rare">Rare</button><button data-loot="normal" data-chromatic="true">✦ Normal chromatique</button><button data-loot="rare" data-chromatic="true">✦ Rare chromatique</button></div><p class="panel-hint">Combat de test : 20 % rare et 10 % chromatique. Ces taux ne fixent pas l’équilibrage final.</p></section><section class="tool-group"><h3>Générer un équipement</h3><label for="equipment-slot">Emplacement</label><select id="equipment-slot">${SLOTS.map(slot=>`<option>${slot}</option>`).join('')}</select><button data-action="equipment">Ajouter au sac</button></section><section class="tool-group"><h3>Déplacements rapides</h3><div class="tool-buttons"><button data-action="home">Maison</button><button data-action="atelier">Atelier</button><button data-action="combat">Combat</button></div></section>`;
}
const game = createGame(app.querySelector('canvas'),app.querySelector('.touch-controls'),refresh);
refresh(game.state);
app.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button)return;
  const s=game.state;
  if(button.dataset.tab){currentTab=button.dataset.tab;app.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  if(button.dataset.main!==undefined)chooseMain(s,Number(button.dataset.main));
  if(button.dataset.flex)changeFlex(s,button.dataset.flex);
  if(button.dataset.slot)unequip(s,button.dataset.slot);
  if(button.dataset.equip)equip(s,Number(button.dataset.equip));
  if(button.dataset.loot)grantLoot(s,button.dataset.loot,button.dataset.chromatic==='true');
  const actions={ attack:()=>attack(s),heal:()=>heal(s),home:()=>teleport(s,'maison'),combat:()=>teleport(s,'combat'),atelier:()=>teleport(s,'atelier'),xp:()=>grantXp(s,50),equipment:()=>giveEquipment(s,app.querySelector('#equipment-slot').value),auto:()=>{s.autoAttack=!s.autoAttack;note(s,`Attaque automatique ${s.autoAttack?'activée':'désactivée'}.`);},deploy:()=>{s.deployed=!s.deployed;note(s,s.deployed?'Alliés déployés.':'Alliés rappelés.');}};
  if(actions[button.dataset.action])actions[button.dataset.action]();
  game.refresh();refresh(s);
  if(['attack','home','combat','atelier','deploy'].includes(button.dataset.action))app.querySelector('canvas').focus({preventScroll:true});
});
// Read-only inspection for browser checks; mutations go through the visible tools.
window.auroria={snapshot:()=>JSON.parse(JSON.stringify(game.state))};
if(import.meta.hot)import.meta.hot.dispose(()=>{game.destroy();delete window.auroria;});
