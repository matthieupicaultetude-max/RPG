import { ROLES, COLORS, SLOTS } from '../dev/sandbox.js';

const LEFT = ['Coiffe', 'Amulette', 'Arme', 'Anneau 1', 'Ceinture'];
const RIGHT = ['Cape', 'Bouclier', 'Anneau 2', 'Bottes'];
export function itemIcon(slot = '', chromatic = false) {
  const color = chromatic ? '#c5a4e9' : '#d9b76b';
  let shape;
  if (slot.startsWith('Trophée')) shape = '<path d="M10 3h12v10l-6 6-6-6zM7 5H4v5l7 4m14-9h3v5l-7 4M16 19v5m-7 3h14v-3H9z"/>';
  else if (slot.startsWith('Anneau')) shape = '<circle cx="16" cy="19" r="8"/><path d="m16 3 5 6-5 5-5-5z"/>';
  else shape = {
    Coiffe: '<path d="m5 19 4-12h14l4 12H5zm0 4h22M12 7V3h8v4M10 12h12"/>',
    Cape: '<path d="m12 4-8 22 12-3 12 3-8-22zM12 4l4 7 4-7M16 11v12"/>',
    Ceinture: '<path d="M3 12h26v9H3zM12 10h9v13h-9zM16 16h8"/>',
    Bottes: '<path d="M7 4h7v16l4 3v5H3v-7l4-2zm12 0h7v16l4 3v5H19"/>',
    Amulette: '<path d="M7 4v10l9 10 9-10V4M16 18l5 6-5 6-5-6z"/>',
    Arme: '<path d="M24 3h5v5L13 24l-5-5zM5 17l12 12M3 29l7-7"/>',
    Bouclier: '<path d="m16 3 12 5v10l-4 7-8 5-8-5-4-7V8zM16 7v18M8 11h16"/>',
  }[slot] || '<path d="m16 3 10 11-3 12H9L6 14zM16 3v23M6 14h20"/>';
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="${color}22" stroke="${color}" stroke-width="2" stroke-linejoin="round">${shape}</svg>`;
}
function avatar(member) {
  const e = member.equipment, color = COLORS[member.role];
  return `<svg class="paper-avatar" viewBox="0 0 120 170" role="img" aria-label="Apparence de ${member.name}" shape-rendering="crispEdges">
    <ellipse cx="60" cy="151" rx="29" ry="7" fill="#0b161a" opacity=".45"/>
    ${e.Cape?'<path d="M37 62H82L94 140 68 131 33 139z" fill="#8370ab"/><path d="M37 62H47L40 132 33 139z" fill="#62517f"/>':''}
    <path d="M43 114H58V145H36v-10h7zm19 0h15v21h7v10H62z" fill="#36434b"/>
    <path d="M36 143h22v8H33v-7zm26 0h24v8H62z" fill="${e.Bottes?'#b8a276':'#594737'}"/>
    <path d="M38 63h44v53H38z" fill="${color}"/><path d="M38 100h44v16H38z" fill="#365950"/>
    <path d="M45 65h29v35H45z" fill="#526e69"/><path d="M48 68h7v23h-7z" fill="#ffffff16"/>
    <path d="M27 67h11v35H27zm55 0h11v35H82z" fill="${color}"/><path d="M27 96h11v11H27zm55 0h11v11H82z" fill="#dbb58f"/>
    <path d="M44 31h31v31H44z" fill="#deb891"/><path d="M41 25h37v15H41zm0 13h7v14h-7z" fill="${e.Coiffe?'#acbac0':'#554438'}"/>
    ${e.Coiffe?'<path d="M44 18h31v10H44zM53 12h13v8H53z" fill="#d4b66b"/>':''}
    <path d="M50 45h4v5h-4zm17 0h4v5h-4z" fill="#29343c"/><path d="M55 57h10v3H55z" fill="#a9745b"/>
    ${e.Ceinture?'<path d="M38 104h44v9H38z" fill="#735339"/><path d="M55 103h12v11H55z" fill="#dfbd6f"/>':''}
    ${e.Amulette?'<path d="m51 64 9 13 10-13" fill="none" stroke="#d8bd79" stroke-width="2"/><path d="m60 73 5 6-5 6-5-6z" fill="#8bcebc"/>':''}
    ${e.Arme?'<path d="M94 70h5v49h-5z" fill="#e1e5d4"/><path d="M88 112h16v5H88z" fill="#d4af65"/><path d="M94 116h5v16h-5z" fill="#785b40"/>':''}
    ${e.Bouclier?'<path d="m27 84 17 6v22l-17 12-17-12V90z" fill="#879d9d"/><path d="m27 89 11 4v16l-11 8-11-8V93z" fill="#475e6a"/><path d="M25 93h4v18h-4z" fill="#d5b974"/>':''}
  </svg>`;
}
export function selectedObject(state, selection) {
  if (!selection) return null;
  return selection.source === 'bag' ? state.bag.find(item=>item.id===selection.id) : state.team[state.main].equipment[selection.slot] || null;
}
function objectDetails(state, selection) {
  const item = selectedObject(state,selection);
  if (!item) return `<div class="item-details empty-details"><span class="detail-icon">${itemIcon(selection?.slot)}</span><div><p class="eyebrow">INFORMATIONS SUR L’OBJET</p><h3>${selection?.slot || 'Sélectionnez un objet'}</h3><p>${selection?.slot?'Cet emplacement est vide. Choisissez un équipement dans le sac pour le remplir.':'Cliquez sur un objet du sac ou un emplacement équipé pour consulter sa description et ses effets.'}</p></div></div>`;
  const equipped = selection.source==='equipment';
  const effect = item.slot==='Arme'?'+5 dégâts sur les attaques du personnage principal.':item.slot==='Bouclier'?'Bouclier de test visible sur le personnage. Les bonus défensifs restent à définir.':item.slot==='Coiffe'||item.slot==='Cape'?'Modifie l’apparence du personnage. Aucun bonus chiffré pour le moment.':item.slot?'Équipement de test. Les caractéristiques et bonus seront définis plus tard.':'Ressource obtenue sur un monstre. Les usages et la valeur marchande restent à définir.';
  return `<div class="item-details ${item.chromatic?'chromatic':''}"><span class="detail-icon">${itemIcon(item.slot,item.chromatic)}</span><div><p class="eyebrow">${item.slot || (item.type==='rare'?'BUTIN RARE':'BUTIN NORMAL')}${item.chromatic?' · CHROMATIQUE':''} · ${equipped?'ÉQUIPÉ':'DANS LE SAC'}</p><h3>${item.name}${item.chromatic?' chromatique':''}</h3><p>${effect}</p><small>Quantité : ${item.quantity} ${equipped?'· '+state.team[state.main].name:''}</small></div>${item.slot?`<button ${equipped?`data-slot="${item.slot}"`:`data-equip="${item.id}"`}>${equipped?'Retirer':'Équiper'}</button>`:''}</div>`;
}
export function renderInventory(state, selection, filter='all') {
  const m=state.team[state.main];
  const slot = name => {
    const item=m.equipment[name];
    const selected=selection?.source==='equipment'&&selection.slot===name;
    return `<button class="paper-slot ${item?'filled':''} ${selected?'inspected':''}" data-inspect-slot="${name}" aria-pressed="${selected}" aria-label="${name}${item?' : '+item.name:' : vide'}" title="${name}${item?' : '+item.name:''}">${itemIcon(name)}<small>${name}</small></button>`;
  };
  const items=state.bag.filter(item=>filter==='all'||(filter==='equipment'?!!item.slot:!item.slot));
  const emptyCount=Math.max(0,24-items.length);
  return `<div class="inventory-character-bar"><div><p class="eyebrow">${ROLES[m.role]}</p><h3>${m.name} <small>Niveau ${m.level}</small></h3></div><div class="inventory-party">${state.team.map((member,i)=>`<button data-main="${i}" aria-pressed="${state.main===i}">${member.name}</button>`).join('')}</div></div>
  <div class="paper-layout">
    <section class="trophy-column" aria-label="Six trophées"><h3>Trophées</h3>${SLOTS.filter(name=>name.startsWith('Trophée')).map(slot).join('')}</section>
    <section class="character-loadout" aria-label="Équipement du personnage"><div class="gear-column">${LEFT.map(slot).join('')}</div><div class="character-stage"><div class="character-halo"></div>${avatar(m)}<div class="avatar-caption"><strong>${m.name}</strong><span>${m.hp} / ${m.maxHp} PV</span><div class="xp-track"><span style="width:${m.xp/(m.level*50)*100}%"></span></div><small>${m.xp} / ${m.level*50} XP</small></div></div><div class="gear-column">${RIGHT.map(slot).join('')}</div></section>
    <section class="inventory-bag" aria-label="Objets du sac"><div class="bag-heading"><h3>Sac de voyage <small>${state.bag.length} piles</small></h3><label class="sr-only" for="bag-filter">Filtrer les objets</label><select id="bag-filter"><option value="all" ${filter==='all'?'selected':''}>Tous les objets</option><option value="equipment" ${filter==='equipment'?'selected':''}>Équipements</option><option value="loot" ${filter==='loot'?'selected':''}>Ressources</option></select></div><div class="inventory-items">${items.map(item=>`<button class="bag-cell ${item.chromatic?'chromatic':''} ${item.type==='rare'?'rare':''} ${selection?.source==='bag'&&selection.id===item.id?'inspected':''}" data-inspect-bag="${item.id}" aria-label="${item.name}${item.chromatic?' chromatique':''}, quantité ${item.quantity}" aria-pressed="${selection?.source==='bag'&&selection.id===item.id}" title="${item.name}${item.chromatic?' chromatique':''}">${itemIcon(item.slot,item.chromatic)}<small>${item.quantity}</small></button>`).join('')}${Array.from({length:emptyCount},()=>'<div class="bag-cell empty" aria-hidden="true"></div>').join('')}</div>${!items.length?'<p class="bag-empty-hint">Aucun objet. Générez du matériel dans les outils dev ou récupérez du butin.</p>':''}<div class="bag-currency"><span>◈ ${state.gold} pièces</span><small>Sac partagé · Test</small></div></section>
  </div>${objectDetails(state,selection)}`;
}
