import { ATTACK_RANGE, guidedTarget, launchAttack, stepAttacks, lineClear } from '../combat/attacks.js';
import { stepCompanions, placeAllies, clearRoute } from '../ai/companions.js';
import { createState, update as movePlayer } from '../game/state.js';

export const ROLES = { melee: 'Corps à corps', support: 'Soutien', ranged: 'Distance' };
export const COLORS = { melee: '#dbac66', support: '#78c4a6', ranged: '#9caff0' };
export const SLOTS = ['Coiffe', 'Cape', 'Ceinture', 'Bottes', 'Anneau 1', 'Anneau 2', 'Amulette', 'Arme', 'Bouclier', ...Array.from({ length: 6 }, (_, i) => `Trophée ${i + 1}`)];
export const STATIONS = { maison: { x: 110, y: 135 }, combat: { x: 480, y: 255 }, atelier: { x: 190, y: 295 } };
export const ULTIMATE_DURATION = 30;
export const ULTIMATE_COOLDOWN = 300;
const names = ['Aëlan', 'Liora', 'Sylas'];
export function makeMember(role, i) {
  return { id: i, name: names[i], role, level: 1, xp: 0, hp: 100, maxHp: 100, equipment: {}, x: 280 - i * 20, y: 210 + i * 13, facing: 'down', moving: false, cooldown: 0 };
}
export function createSandbox() {
  const state = createState();
  Object.assign(state, {
    team: ['melee', 'support', 'ranged'].map(makeMember), main: 0, deployed: false,
    ultimate: { remaining: 0, cooldown: 0 },
    bag: [], nextItem: 1, gold: 0, log: ['Bienvenue dans le jardin des essais.'], revision: 0,
    monsters: [{ name: 'Slime', x: 455, y: 220, homeX: 455, homeY: 220, hp: 45, maxHp: 45, cooldown: 0, respawn: 0 }, { name: 'Sanglier', x: 535, y: 285, homeX: 535, homeY: 285, hp: 70, maxHp: 70, cooldown: 0, respawn: 0 }],
    bots: Array.from({ length: 3 }, (_, i) => ({ name: ['Milo', 'Éline', 'Orin'][i], x: 290 + i * 70, y: 110, role: ['melee', 'support', 'ranged'][i], facing: 'down', moving: true, phase: i * 2, target: { x: 270 + i * 70, y: 110 } })),
    effects: [], attacks: [], aim: { x: 0, y: 0, active: false }, autoAttack: false,
  });
  state.team[0].x = state.player.x;
  state.team[0].y = state.player.y;
  return state;
}
export function note(s, message) {
  s.log.unshift(message);
  s.log.length = Math.min(s.log.length, 6);
  s.revision++;
}
export function atHome(s) { return Math.hypot(s.player.x - STATIONS.maison.x, s.player.y - STATIONS.maison.y) < 65; }
export function teleport(s, station) {
  const point = STATIONS[station];
  if (!point) return;
  Object.assign(s.player, point, { moving: false });
  Object.assign(s.team[s.main], s.player);
  placeAllies(s, canStand);
  note(s, `Téléportation de test : ${station}.`);
}
export function chooseMain(s, i) {
  if (i === s.main || !s.team[i] || s.team[i].hp <= 0) return false;
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
export function activateUltimate(s) {
  if (s.ultimate.remaining > 0 || s.ultimate.cooldown > 0 || s.team[s.main].hp <= 0) return false;
  s.ultimate.remaining = ULTIMATE_DURATION;
  s.ultimate.cooldown = ULTIMATE_COOLDOWN;
  s.deployed = true;
  placeAllies(s, canStand);
  note(s, 'Ultime : la troupe est réunie pendant 30 secondes !');
  return true;
}
export function endUltimate(s) {
  s.ultimate.remaining = 0;
  s.deployed = false;
  s.team.forEach(clearRoute);
}
export function advanceUltimate(s, elapsed) {
  const countdown = value => value - elapsed < 1e-8 ? 0 : value - elapsed;
  const wasActive = s.ultimate.remaining > 0;
  const wasCooling = s.ultimate.cooldown > 0;
  s.ultimate.remaining = countdown(s.ultimate.remaining);
  s.ultimate.cooldown = countdown(s.ultimate.cooldown);
  if (wasActive && s.ultimate.remaining === 0) {
    endUltimate(s);
    note(s, 'Ultime terminé : les compagnons se retirent.');
  }
  if (wasCooling && s.ultimate.cooldown === 0) note(s, 'Ultime prêt !');
}
export function grantXp(s, amount) {
  s.team.forEach(m => {
    m.xp += amount;
    while (m.xp >= m.level * 50) {
      m.xp -= m.level * 50;
      m.level++;
      m.maxHp += 10;
      m.hp = m.maxHp;
    }
  });
  note(s, `+${amount} XP pour chaque membre (règle de test).`);
}
export function heal(s) {
  s.team.forEach(m => { m.hp = m.maxHp; });
  note(s, 'Équipe soignée et réanimée.');
}
export function grantLoot(s, type = 'normal', chromatic = false, monster = 'Slime') {
  const name = monster === 'Slime' ? (type === 'rare' ? 'Cœur de gelée' : 'Gelée') : (type === 'rare' ? 'Défense ancienne' : 'Soie de sanglier');
  const existing = s.bag.find(item => item.name === name && item.chromatic === chromatic);
  if (existing) existing.quantity++;
  else s.bag.push({ id: s.nextItem++, name, type, chromatic, quantity: 1 });
  note(s, `Butin : ${name}${chromatic ? ' chromatique' : ''}.`);
}
export function giveEquipment(s, slot) {
  if (!SLOTS.includes(slot)) return;
  s.bag.push({ id: s.nextItem++, name: `${slot} d’essai`, slot, quantity: 1 });
  note(s, `${slot} d’essai ajouté au sac.`);
}
export function equip(s, id) {
  const index = s.bag.findIndex(item => item.id === id);
  if (index < 0 || !s.bag[index].slot) return;
  const item = s.bag.splice(index, 1)[0];
  const member = s.team[s.main];
  if (member.equipment[item.slot]) s.bag.push(member.equipment[item.slot]);
  member.equipment[item.slot] = item;
  note(s, `${member.name} équipe : ${item.name}.`);
}
export function unequip(s, slot) {
  const member = s.team[s.main];
  if (!member.equipment[slot]) return;
  s.bag.push(member.equipment[slot]);
  delete member.equipment[slot];
  note(s, `${slot} retiré.`);
}
export function canStand(x, y) {
  return x >= 14 && x <= 626 && y >= 65 && y <= 386 && !(x > 52 && x < 164 && y < 108);
}
function walk(entity, x, y, speed, dt) {
  const dx = x - entity.x, dy = y - entity.y, d = Math.hypot(dx, dy);
  entity.moving = d > 5;
  if (!entity.moving) return;
  entity.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  const step = Math.min(speed * dt, d);
  if (canStand(entity.x + dx / d * step, entity.y)) entity.x += dx / d * step;
  if (canStand(entity.x, entity.y + dy / d * step)) entity.y += dy / d * step;
}
function hitMonster(s, monster, damage, member) {
  monster.hp = Math.max(0, monster.hp - damage);
  s.effects.push({ x: monster.x, y: monster.y - 15, text: `−${damage}`, color: '#ffe7a2', life: .8 });
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    s.effects.push({ x: monster.x, y: monster.y - 8, vx: Math.cos(angle)*28, vy: Math.sin(angle)*22, particle: true, color: '#fce2a4', life: .32 });
  }
  const d = Math.hypot(monster.x - member.x, monster.y - member.y) || 1;
  const nx = monster.x + (monster.x - member.x) / d * 5;
  const ny = monster.y + (monster.y - member.y) / d * 5;
  if (canStand(nx, ny)) { monster.x = nx; monster.y = ny; }
  s.revision++;
  if (monster.hp === 0) {
    monster.respawn = 7;
    s.gold += 5;
    grantXp(s, 10);
    grantLoot(s, Math.random() < .2 ? 'rare' : 'normal', Math.random() < .1, monster.name);
  }
}
export function attack(s, point = s.aim.active ? s.aim : null) {
  const member = s.team[s.main];
  Object.assign(member, s.player);
  if (member.hp <= 0 || member.cooldown > 0) return false;
  let target;
  if (point) {
    const guided = guidedTarget(s, point, canStand);
    if (guided.inRange && guided.clear) target = guided.target;
  } else {
    target = s.monsters.filter(m => m.hp > 0 && Math.hypot(m.x-s.player.x,m.y-s.player.y)<=ATTACK_RANGE[member.role] && lineClear(s.player,m,canStand))
      .sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
  }
  const facing = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }[member.facing];
  const destination = target || (point ? { x:point.x,y:point.y+8 } : {x:s.player.x+facing[0]*ATTACK_RANGE[member.role],y:s.player.y+facing[1]*ATTACK_RANGE[member.role]});
  member.cooldown = .6;
  launchAttack(s, member, destination, target, 12 + (member.equipment.Arme ? 5 : 0));
  s.player.facing = member.facing;
  return true;
}
export function stepSandbox(s, direction, dt, elapsed = dt) {
  advanceUltimate(s, Math.max(0, elapsed));
  const old = { x: s.player.x, y: s.player.y };
  if (s.team[s.main].hp > 0) movePlayer(s, direction, dt);
  else { s.time += dt; s.player.moving = false; }
  if (!canStand(s.player.x, old.y)) s.player.x = old.x;
  if (!canStand(s.player.x, s.player.y)) s.player.y = old.y;
  Object.assign(s.team[s.main], s.player);
  stepAttacks(s, dt, canStand, hitMonster);
  s.effects = s.effects.filter(e => { e.life -= dt; e.x += (e.vx || 0)*dt; e.y += (e.vy ?? -12)*dt; return e.life > 0; });
  s.team.forEach(m => { m.cooldown = Math.max(0, m.cooldown - dt); });
  if (s.autoAttack) attack(s);
  stepCompanions(s, dt, canStand, hitMonster);
  s.monsters.forEach(monster => {
    monster.cooldown = Math.max(0, monster.cooldown - dt);
    if (monster.hp <= 0) {
      monster.respawn -= dt;
      if (monster.respawn <= 0) { monster.hp = monster.maxHp; monster.x = monster.homeX; monster.y = monster.homeY; s.revision++; }
      return;
    }
    const target = s.team.filter((m, i) => m.hp > 0 && (i === s.main || s.deployed)).sort((a, b) => Math.hypot(a.x - monster.x, a.y - monster.y) - Math.hypot(b.x - monster.x, b.y - monster.y))[0];
    if (target && Math.hypot(target.x - monster.homeX, target.y - monster.homeY) < 105) {
      if (Math.hypot(monster.x - target.x, monster.y - target.y) > 22) walk(monster, target.x, target.y, 32, dt);
      else if (monster.cooldown === 0) {
        target.hp = Math.max(0, target.hp - 8); monster.cooldown = 1.2;
        s.effects.push({ x: monster.x, y: monster.y-8, toX: target.x, toY: target.y-8, text: '', color: '#f0a28e', life: .22 });
        s.effects.push({ x: target.x, y: target.y - 25, text: '−8', color: '#ffa3a3', life: .8 }); s.revision++;
        if (s.team.every(m => m.hp <= 0)) { endUltimate(s); teleport(s, 'maison'); heal(s); note(s, 'Défaite : retour à la maison (règle de test).'); }
      }
    } else walk(monster, monster.homeX + Math.sin(s.time * .5 + monster.homeX) * 20, monster.homeY + Math.cos(s.time * .4) * 15, 14, dt);
  });
  s.bots.forEach(bot => {
    if (Math.hypot(bot.x - bot.target.x, bot.y - bot.target.y) < 8) {
      bot.phase += 1.8;
      bot.target = { x: 300 + Math.sin(bot.phase) * 80, y: 125 + Math.cos(bot.phase * .7) * 45 };
    }
    walk(bot, bot.target.x, bot.target.y, 24, dt);
  });
}
