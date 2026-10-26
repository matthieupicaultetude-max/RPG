import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, SLOTS, teleport, grantLoot, giveEquipment, equip, unequip, grantXp, stepSandbox, chooseMain, attack } from '../src/dev/sandbox.js';

test('composition : exactement trois personnages, un par rôle',()=>{
 const s=createSandbox();assert.equal(s.team.length,3);assert.equal(SLOTS.length,15);
 assert.deepEqual(s.team.map(m=>m.role),['melee','support','ranged']);
});
test('les quatre variations de butin restent distinctes et les piles se cumulent',()=>{
 const s=createSandbox();for(const type of ['normal','rare'])for(const chromatic of [false,true])grantLoot(s,type,chromatic);
 grantLoot(s,'normal',true);assert.equal(s.bag.length,4);assert.equal(s.bag.find(i=>i.type==='normal'&&i.chromatic).quantity,2);
});
test('équipement et échange ne perdent ni ne dupliquent les objets, chaque personnage a sa grille',()=>{
 const s=createSandbox();giveEquipment(s,'Arme');giveEquipment(s,'Arme');const ids=s.bag.map(i=>i.id);
 equip(s,ids[0]);equip(s,ids[1]);assert.equal(s.bag.length,1);assert.equal(s.team[0].equipment.Arme.id,ids[1]);
 chooseMain(s,1);assert.equal(s.team[1].equipment.Arme,undefined);chooseMain(s,0);unequip(s,'Arme');assert.equal(s.bag.length,2);
 assert.equal(new Set(s.bag.map(i=>i.id)).size,2);
});
test('XP multi-niveau conserve le reste et augmente les PV',()=>{
 const s=createSandbox();grantXp(s,175);assert.equal(s.team[0].level,3);assert.equal(s.team[0].xp,25);assert.equal(s.team[0].maxHp,120);
});
test('combat de test : portée, délai, mort, récompenses puis respawn',()=>{
 const s=createSandbox();s.deployed=false;attack(s);assert.equal(s.monsters[0].hp,45);
 Object.assign(s.player,{x:455,y:245});attack(s);assert.equal(s.monsters[0].hp,45);
 for(let i=0;i<4;i++){s.team[0].cooldown=0;attack(s);stepSandbox(s,{x:0,y:0},.13);}
 assert.equal(s.monsters[0].hp,0);assert.equal(s.gold,5);assert.equal(s.bag.length,1);
 teleport(s,'maison');for(let i=0;i<150;i++)stepSandbox(s,{x:0,y:0},.05);
 assert.equal(s.monsters[0].hp,s.monsters[0].maxHp);
});
test('déplacement bloqué par la maison et bots locaux actifs',()=>{
 const s=createSandbox();teleport(s,'maison');const before=s.bots.map(b=>b.x);
 for(let i=0;i<120;i++)stepSandbox(s,{x:0,y:-1},1/60);
 assert.ok(s.player.y>=108);assert.ok(s.bots.some((b,i)=>Math.abs(b.x-before[i])>1));
});
test('compagnons : le soutien soigne et le rappel suspend leurs déplacements',()=>{
 const s=createSandbox();s.deployed=true;s.team[0].hp=50;s.team[1].x=s.player.x;s.team[1].y=s.player.y;
 stepSandbox(s,{x:0,y:0},.05);assert.equal(s.team[0].hp,58);
 s.deployed=false;const position={x:s.team[2].x,y:s.team[2].y};
 stepSandbox(s,{x:1,y:0},.05);assert.equal(s.team[2].x,position.x);assert.equal(s.team[2].y,position.y);
});
test('défaite complète : retour maison sans supprimer le sac ni la progression',()=>{
 const s=createSandbox();grantLoot(s);grantXp(s,50);teleport(s,'combat');s.team.forEach(m=>{m.hp=0;});
 stepSandbox(s,{x:0,y:0},.05);
 assert.ok(s.team.every(m=>m.hp===0));
 // Simulate the final enemy hit while the last member is still alive.
 s.team[0].hp=1;Object.assign(s.player,{x:s.monsters[0].x,y:s.monsters[0].y});
 stepSandbox(s,{x:0,y:0},.05);
 assert.ok(s.team.every(m=>m.hp===m.maxHp));assert.equal(s.player.x,110);assert.equal(s.bag.length,1);assert.equal(s.team[0].level,2);
});
test('bouclier indépendant de l’arme, transfert et conservation par personnage',()=>{
 const s=createSandbox();giveEquipment(s,'Arme');giveEquipment(s,'Bouclier');
 equip(s,1);equip(s,2);assert.equal(s.team[0].equipment.Arme.id,1);assert.equal(s.team[0].equipment.Bouclier.id,2);
 unequip(s,'Bouclier');assert.equal(s.team[0].equipment.Arme.id,1);assert.equal(s.bag[0].id,2);
 chooseMain(s,1);equip(s,2);assert.equal(s.team[1].equipment.Bouclier.id,2);assert.equal(s.team[0].equipment.Bouclier,undefined);
});
