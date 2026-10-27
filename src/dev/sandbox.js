import {travelToZone} from '../game/zone-travel.js';
import {MARSH_ENTRY} from '../world/slime-marsh-map.js';
import {movePartyToZone} from '../world/zones.js';
import {stepSlimeMarsh,resetMarshSlime,slimeVulnerable} from '../game/slime-marsh.js';
import { monsterAttack } from '../data/monster-attacks.js';
import { activeParty, stepMonsterAbility, stepMonsterHazards, clearMonsterAttacks } from '../combat/monster-attacks.js';
import { CLASS_STYLES } from '../data/appearance.js';
import { canWalkZone } from '../world/zones.js';
import { emitSound, impactKind } from '../audio/events.js';
import { createTrees, stepWoodcutting, cancelWoodcutting } from '../game/woodcutting.js';
import { recordBonusOpportunity, stepBonusTargets, clickBonusTarget } from '../combat/bonus-targets.js';
import { emptyAllocation, fillUnlockedSlots } from '../data/progression.js';
import { defaultLoadout } from '../data/spells.js';
import { castSpell, stepSpells, receiveSpellDamage } from '../combat/spells.js';
import { castCompanionSpell } from '../ai/spell-tactics.js';
import { nearForge } from '../game/forge.js';
import { recordSetLoot, nearPetShop } from '../game/pet-quests.js';
import { PET_SHOP, FORGE } from '../world/map.js';
import { ELEMENTS, CORE_CHANCE, createCore, rollCoreEquipment, characterStats, syncEquipmentHealth } from '../data/equipment.js';
import { createMonster, monsterDefinition } from '../data/monsters.js';
import { stepAttacks } from '../combat/attacks.js';
import { stepCompanions, placeAllies, clearRoute } from '../ai/companions.js';
import { createState, update as movePlayer } from '../game/state.js';

export const ROLES = { melee: 'Corps à corps', support: 'Soutien', ranged: 'Distance' };
export const COLORS = Object.fromEntries(Object.entries(CLASS_STYLES).map(([role,style])=>[role,style.accent]));
export const SLOTS = ['Coiffe', 'Cape', 'Ceinture', 'Bottes', 'Anneau 1', 'Anneau 2', 'Amulette', 'Arme', 'Bouclier', 'Familier', ...Array.from({ length: 6 }, (_, i) => `Trophée ${i + 1}`)];
export const STATIONS = { maison: { x: 110, y: 135 }, combat: { x: 480, y: 255 }, atelier: { x: 190, y: 310 }, forge: { x: 212, y: 334 }, animalerie: { x:250,y:157 }, fontaine:{x:365,y:155}, scierie:{x:76,y:222}, bucheron:{x:207,y:108} };
const names = ['Aëlan', 'Liora', 'Sylas'];
export function makeMember(role, i) {
  return { id: i, name: names[i], role, level: 1, xp: 0, hp: 100, maxHp: 100, equipment: {}, x: 280 - i * 20, y: 210 + i * 13, facing: 'down', moving: false, cooldown: 0, loadout:defaultLoadout(role), spellCooldowns:{}, buffs:{}, ultimateCharge:0, ultimateLock:0, characteristicPoints:0, allocatedStats:emptyAllocation(), learnedUltimates:[] };
}
export function createSandbox() {
  const state = createState();
  Object.assign(state, {
    zone: 'garden', lighting:true,
    team: ['melee', 'support', 'ranged'].map(makeMember), main: 0, deployed: true,
    collections: {}, petQuests: {}, npcs:[{...PET_SHOP.npc},{...FORGE.npc}],
    bag: [], nextItem: 1, gold: 0, log: ['Bienvenue dans le jardin des essais.'], revision: 0,
    monsters: [createMonster('slime',455,220), createMonster('boar',535,285),createMonster('firefly',530,165),createMonster('moth',585,240)],
    bots: Array.from({ length: 3 }, (_, i) => ({ name: ['Milo', 'Éline', 'Orin'][i], x: 290 + i * 70, y: 110, role: ['melee', 'support', 'ranged'][i], facing: 'down', moving: true, phase: i * 2, target: { x: 270 + i * 70, y: 110 } })),
    woodcutting:{level:1,xp:0,action:null},trees:createTrees(),
    monsterTornadoes: [], monsterImpacts: [],
    effects: [], attacks: [], spellEvents:[], spellAreas:[], spellMissiles:[], spellVisuals:[], nextSpell:1, aim: { x: 0, y: 0, active: false }, autoAttack: false,
  });
  state.team[0].x = state.player.x;
  state.team[0].y = state.player.y;
  placeAllies(state, (x,y)=>canWalkZone(x,y,state.zone));
  return state;
}
export function note(s, message) {
  s.log.unshift(message);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
}
export function teleport(s, station) {
  if(s.zone === "tutorial") {note(s,"Terminez ou passez le tutoriel pour rejoindre le village.");return;}
  if(s.zone==='slime-marsh')travelToZone(s,'garden');
  const point = STATIONS[station];
  if (!point) return;
  cancelWoodcutting(s);
  clearMonsterAttacks(s);
  Object.assign(s.player, point, { moving: false });
  Object.assign(s.team[s.main], s.player);
  placeAllies(s, (x,y)=>canWalkZone(x,y,s.zone));
  note(s, `Téléportation de test : ${station}.`);
}
export function chooseMain(s, i) {
  if (i === s.main || !s.team[i] || s.team[i].hp <= 0) return false;
  cancelWoodcutting(s);
  Object.assign(s.team[s.main], s.player);
  if (!s.deployed) Object.assign(s.team[i], s.player);
  s.main = i;
  Object.assign(s.player, { x: s.team[i].x, y: s.team[i].y, facing: s.team[i].facing, moving: false });
  s.team.forEach(clearRoute);
  note(s, `${s.team[i].name} est votre personnage principal.`);
  return true;
}
export function cycleMain(s, direction) {
  if (!direction) return false;
  const step = Math.sign(direction);
  for (let offset = 1; offset < s.team.length; offset++) {
    const index = (s.main + step * offset + s.team.length) % s.team.length;
    if (s.team[index].hp > 0) return chooseMain(s, index);
  }
  return false;
}
export function setCombatMode(s, combat) {
  if(typeof combat !== 'boolean')return false;
  Object.assign(s.team[s.main],s.player);
  s.deployed = combat;
  s.team.forEach(clearRoute);
  if(combat)placeAllies(s,(x,y)=>canWalkZone(x,y,s.zone));
  note(s,combat?'Mode combat : les trois personnages sont déployés.':'Mode exploration : compagnons rappelés · vitesse +50 %.');
  return true;
}
export function toggleCombatMode(s) { return setCombatMode(s,!s.deployed); }
export function grantXp(s, amount) {
  const previousLevels=s.team.map(member=>member.level);
  s.team.forEach(m => {
    m.xp += Math.floor(amount * (1 + (characterStats(m).Sagesse || 0)/100));
    while (m.xp >= m.level * 50) {
      m.xp -= m.level * 50;
      m.level++;
      m.characteristicPoints+=5;
      fillUnlockedSlots(m,m.level-1);
      m.maxHp += 10;
      m.hp = m.maxHp;
    }
  });
  note(s, `+${amount} XP de base par personnage (bonus de Sagesse appliqué).`);
  if(s.team.some((member,index)=>member.level>previousLevels[index]))note(s,"Nouveaux points disponibles (P) · Consultez vos sorts (K).");
}
export function heal(s) {
  s.team.forEach(m => { m.hp = m.maxHp; });
  note(s, 'Équipe soignée et réanimée.');
}
export function grantLoot(s, type = 'normal', chromatic = false, monster = 'Slime') {
  const definition = monsterDefinition(monster);
  const name = type === 'rare' ? definition.rare : definition.normal;
  const existing = s.bag.find(item => item.name === name && item.chromatic === chromatic);
  if (existing) existing.quantity++;
  else s.bag.push({ id: s.nextItem++, name, type, chromatic, quantity: 1 });
  note(s, `Butin : ${name}${chromatic ? ' chromatique' : ''}.`);
}
export function grantCore(s,element,level=1) {
  const core=createCore(element,level);
  const existing=s.bag.find(item=>item.kind==='core'&&item.element===element&&item.band.min===core.band.min&&!item.chromatic);
  if(existing)existing.quantity++;
  else {core.id=s.nextItem++;s.bag.push(core);}
  note(s,`Noyau de ${ELEMENTS[element].name} obtenu · niveaux ${core.band.min}–${core.band.max}.`);
  return existing?.id ?? core.id;
}
export function openCore(s,id,random=Math.random) {
  const index=s.bag.findIndex(item=>item.id===id&&item.kind==='core');
  if(index<0)return null;
  const item=rollCoreEquipment(s.bag[index],random);
  if(!item){note(s,'Aucune panoplie disponible pour cette tranche de niveaux.');return null;}
  if(--s.bag[index].quantity===0)s.bag.splice(index,1);
  const reward={...item,id:s.nextItem++};s.bag.push(reward);recordSetLoot(s,reward);
  if(s.zone === "tutorial" && s.tutorial?.coreId === id)s.tutorial.armorId=reward.id;
  note(s,`Noyau ouvert : ${reward.name}${reward.chromatic?' chromatique':''} !`);
  return reward;
}
// Each opening keeps its own independent draw and collection tracking.
export function openCores(s, id, quantity, random = Math.random) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return [];
  const core = s.bag.find(item => item.id === id && item.kind === 'core');
  if (!core) return [];
  const count = Math.min(quantity, core.quantity);
  const rewards = [];
  for (let i = 0; i < count; i++) {
    const reward = openCore(s, id, random);
    if (!reward) break;
    rewards.push(reward);
  }
  if (rewards.length > 1) note(s, `${rewards.length} noyaux ouverts : ${rewards.length} équipements ajoutés au sac.`);
  return rewards;
}
export function giveEquipment(s, slot) {
  if (!SLOTS.includes(slot)) return;
  s.bag.push({ id: s.nextItem++, name: `${slot} d’essai`, slot, quantity: 1 });
  note(s, `${slot} d’essai ajouté au sac.`);
}
export function equip(s, id) {
  const index = s.bag.findIndex(item => item.id === id);
  if (index < 0 || !s.bag[index].slot) return;
  const member = s.team[s.main];
  if ((s.bag[index].requiredLevel || 1)>member.level) { note(s,'Niveau insuffisant pour cet équipement.'); return; }
  const item = s.bag.splice(index, 1)[0];
  if (member.equipment[item.slot]) s.bag.push(member.equipment[item.slot]);
  member.equipment[item.slot] = item;
  syncEquipmentHealth(member);
  note(s, `${member.name} équipe : ${item.name}.`);
}
export function unequip(s, slot) {
  const member = s.team[s.main];
  if (!member.equipment[slot]) return;
  s.bag.push(member.equipment[slot]);
  delete member.equipment[slot];
  syncEquipmentHealth(member);
  note(s, `${slot} retiré.`);
}
export function canStand(x, y) {
  return canWalkZone(x,y);
}
function walk(entity, x, y, speed, dt, canStand) {
  const dx = x - entity.x, dy = y - entity.y, d = Math.hypot(dx, dy);
  entity.moving = d > 5;
  if (!entity.moving) return;
  entity.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  const step = Math.min(speed * dt, d);
  if (canStand(entity.x + dx / d * step, entity.y)) entity.x += dx / d * step;
  if (canStand(entity.x, entity.y + dy / d * step)) entity.y += dy / d * step;
}
function hitMonster(s, monster, damage, member, options={}) {
  const canStand=(x,y)=>canWalkZone(x,y,s.zone);
  if(monster.hp<=0||!Number.isFinite(damage)||damage<=0)return;
  if(!options.bonus&&slimeVulnerable(s,monster))damage=Math.round(damage*1.5);
  monster.hp = Math.max(0, monster.hp - damage);
  emitSound(s,options.bonus?"bonus":options.sound||impactKind(member),monster,{owner:member.id,element:options.element,damage});
  s.effects.push({ x: monster.x, y: monster.y - 15, text: `−${damage}`, color: '#ffe7a2', life: .8 });
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    s.effects.push({ x: monster.x, y: monster.y - 8, vx: Math.cos(angle)*28, vy: Math.sin(angle)*22, particle: true, color: '#fce2a4', life: .32 });
  }
  const d = Math.hypot(monster.x - member.x, monster.y - member.y) || 1;
  const nx = monster.x + (monster.x - member.x) / d * 5;
  const ny = monster.y + (monster.y - member.y) / d * 5;
  if (canStand(nx, ny)) { monster.x = nx; monster.y = ny; }
  if(!options.bonus)recordBonusOpportunity(s,monster,damage,member,canStand);
  else if(monster.hp===0)delete monster.bonusTarget;
  s.revision++;
  if (monster.hp === 0) {
    monster.respawn = monster.respawnDelay;
    rewardMonster(s,monster);
  }
}
export function rewardMonster(s,monster,random=Math.random) {
  if(monster.tutorial) {
    if(!s.tutorial || s.tutorial.defeated)return;
    s.tutorial.defeated=true;
  }
  s.gold += monster.gold;
  grantXp(s, monster.xp);
  const definition=monsterDefinition(monster.species);
  grantLoot(s,random()<definition.rareChance?'rare':'normal',random()<definition.chromaticChance,monster.species);
  if(monster.tutorial)s.tutorial.coreId=grantCore(s,definition.element,monster.level);
  else if(random()<CORE_CHANCE)grantCore(s,definition.element,monster.level);
}
export function clickBonus(s,point) {const canStand=(x,y)=>canWalkZone(x,y,s.zone);Object.assign(s.team[s.main],s.player);const hit=clickBonusTarget(s,point,canStand,hitMonster);if(hit)cancelWoodcutting(s);return hit;}
export const spellContext = {canStand,hitMonster};
const contextFor=s=>({canStand:(x,y)=>canWalkZone(x,y,s.zone),hitMonster});
export function castEquipped(s,slot,point=s.aim.active?s.aim:null,options={}) {
 const member=s.team[s.main];Object.assign(member,s.player);
 const result=castSpell(s,member,slot,point?{x:point.x,y:point.y+8}:null,contextFor(s),options);if(result)cancelWoodcutting(s);return result;
}
export function attack(s,point=s.aim.active?s.aim:null) {return castEquipped(s,0,point);}
export function stepSandbox(s, direction, dt, elapsed = dt) {
  const spellContext=contextFor(s), canStand=spellContext.canStand;
  stepBonusTargets(s,elapsed,canStand);
  const old = { x: s.player.x, y: s.player.y };
  const gathering=stepWoodcutting(s,direction,dt,elapsed,canStand);
  if (s.team[s.main].hp > 0&&!gathering) movePlayer(s, direction, dt);
  else { s.time += dt;if(!gathering)s.player.moving = false; }
  if (!canStand(s.player.x, old.y)) s.player.x = old.x;
  if (!canStand(s.player.x, s.player.y)) s.player.y = old.y;
  Object.assign(s.team[s.main], s.player);
  stepSlimeMarsh(s);
  stepAttacks(s, dt, canStand, hitMonster);
  stepSpells(s,dt,spellContext);
  s.effects = s.effects.filter(e => { e.life -= dt; e.x += (e.vx || 0)*dt; e.y += (e.vy ?? -12)*dt; return e.life > 0; });
  s.team.forEach(m => { m.cooldown = Math.max(0, m.cooldown - dt); });
  if (s.autoAttack&&!s.woodcutting.action) attack(s);
  stepCompanions(s, dt, canStand, hitMonster,(member,target)=>castCompanionSpell(s,member,target,spellContext));
  let defeated=false;
  const enemyContext={canStand,damage:(target,amount,monster,element,kind)=>{
    const taken=receiveSpellDamage(s,target,amount,monster,element);
    if(taken>0){
      if(target.id===s.main)cancelWoodcutting(s);
      emitSound(s,kind==='tornado'?'magic':'hurt',target,{element,damage:taken});
      const origin=monster.intent?.from||monster,dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy)||1;
      const strength=kind==='charge'?7:kind==='leap'?4:2;
      const point={x:target.x+dx/d*strength,y:target.y+dy/d*strength};
      if(canStand(point.x,point.y)){Object.assign(target,point);if(target.id===s.main)Object.assign(s.player,point);}
    }
    target.lastDamageElement=element;
    const color={earth:'#dbb27a',water:'#a0dded',fire:'#ffc17f',air:'#c5efd9'}[element];
    s.effects.push({x:target.x,y:target.y-25,text:taken?`−${taken}`:'Bloqué',color,life:.8});
    for(let i=0;taken>0&&i<5;i++)s.effects.push({x:target.x,y:target.y-8,vx:Math.cos(i*1.26)*26,vy:Math.sin(i*1.26)*22-10,particle:true,color,life:.35});
    s.revision++;
    if(s.team.every(m=>m.hp<=0))defeated=true;
  }};
  s.monsters.forEach((monster,index) => {
    monster.cooldown = Math.max(0, monster.cooldown - dt);
    if (monster.hp <= 0) {
      delete monster.intent;monster.lift=0;
      s.monsterTornadoes=s.monsterTornadoes.filter(a=>a.owner!==index);
      if(monster.splitSpawn)return;
      monster.respawn -= dt;
      if (monster.respawn <= 0) { resetMarshSlime(monster);monster.hp = monster.maxHp; delete monster.bonusTarget;delete monster.lastReceivedDamage;monster.bonusTargetCooldown=0; monster.x = monster.homeX; monster.y = monster.homeY;monster.cooldown=.6;s.revision++; }
      return;
    }
    if(stepMonsterAbility(s,monster,dt,enemyContext))return;
    const target=activeParty(s).sort((a,b)=>Math.hypot(a.x-monster.x,a.y-monster.y)-Math.hypot(b.x-monster.x,b.y-monster.y))[0];
    if(monster.spellState?.root>0){monster.moving=false;return;}
    if(target&&Math.hypot(target.x-monster.homeX,target.y-monster.homeY)<monster.detection){
      const flying=monsterAttack(monster)?.kind==='tornado',gap=Math.hypot(monster.x-target.x,monster.y-target.y);
      if(flying&&gap<60)walk(monster,monster.x+(monster.x-target.x),monster.y+(monster.y-target.y),monster.speed*.65,dt,canStand);
      else if(gap>(flying?90:35))walk(monster,target.x,target.y,monster.speed,dt,canStand);
      else monster.moving=false;
    }else walk(monster,monster.homeX+Math.sin(s.time*.5+monster.homeX)*20,monster.homeY+Math.cos(s.time*.4)*15,monster.patrolSpeed,dt,canStand);
  });
  stepMonsterHazards(s,dt,enemyContext);
  if(defeated&&s.team.every(m=>m.hp<=0)){
    clearMonsterAttacks(s);setCombatMode(s,true);
    if(s.zone==='tutorial'){Object.assign(s.player,{x:230,y:250});s.team.forEach(m=>Object.assign(m,s.player));placeAllies(s,canStand);}else if(s.zone==='slime-marsh')movePartyToZone(s,'slime-marsh',{x:MARSH_ENTRY.x+30,y:MARSH_ENTRY.y});else teleport(s,'maison');
    heal(s);if(s.deployed)placeAllies(s,canStand);note(s,s.zone==='tutorial'?'Iris vous remet sur pied. Réessayez !':s.zone==='slime-marsh'?'Défaite : retour à l’entrée des marais.':'Défaite : retour à la maison (règle de test).');
  }
  if(s.player.moving&&s.time>=(s.nextFootstep||0)){s.nextFootstep=s.time+.32;emitSound(s,"step",s.player,{owner:s.main});}
  s.bots.forEach(bot => {
    if (Math.hypot(bot.x - bot.target.x, bot.y - bot.target.y) < 8) {
      bot.phase += 1.8;
      bot.target = { x: 300 + Math.sin(bot.phase) * 80, y: 125 + Math.cos(bot.phase * .7) * 45 };
    }
    walk(bot, bot.target.x, bot.target.y, 24, dt, canStand);
  });
}
