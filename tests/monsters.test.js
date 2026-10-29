import {hybridForMonster} from '../src/data/hybrid-slimes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { monsterAttackDamage } from '../src/data/monster-attacks.js';
import { MONSTERS, monsterStats, monsterLoot, createMonster } from '../src/data/monsters.js';
import { createSandbox, stepSandbox } from '../src/dev/sandbox.js';

test('les fiches de niveau 1 correspondent aux monstres du jardin',()=>{
 const s=createSandbox();
 for(const monster of s.monsters){const stats=monsterStats(monster.species,1);for(const key of ['maxHp','damage','attackDelay','speed','xp','gold','respawnDelay','detection'])assert.equal(monster[key],stats[key]);}
 assert.equal(s.monsters[0].hp,45);assert.equal(s.monsters[1].hp,70);
});
test('statistiques progressives de 1 à 100, bornes et entrées invalides',()=>{
 for(const monster of MONSTERS){let previous=monsterStats(monster.id,1);for(let level=2;level<=100;level++){const next=monsterStats(monster.id,level);for(const key of ['maxHp','damage','xp','gold'])assert.ok(next[key]>=previous[key]);assert.equal(next.speed,previous.speed);previous=next;}}
 assert.equal(monsterStats('slime',-1).level,1);assert.equal(monsterStats('slime',1000).level,100);assert.equal(monsterStats('slime','bad').level,1);assert.equal(monsterStats('slime',3.9).level,3);assert.throws(()=>monsterStats('unknown'));
});
test('quatre issues de butin distinctes, probabilités totales de 100 %',()=>{
 for(const monster of MONSTERS){const drops=monsterLoot(monster.id);if(monster.boss){assert.deepEqual(drops.map(d=>d.chance),[1,.05]);continue;}const count=hybridForMonster(monster)?4:4*(monster.elements?.length||1);assert.equal(drops.length,count);assert.ok(Math.abs(drops.reduce((sum,d)=>sum+d.chance,0)-1)<1e-10);assert.equal(new Set(drops.map(d=>`${d.name}:${d.chromatic}`)).size,count);assert.ok(Math.abs(drops.filter(d=>d.chromatic).reduce((sum,d)=>sum+d.chance,0)-.1)<1e-10);}
});
test('attaque de niveau supérieur : avertissement avant les dégâts élémentaires calculés',()=>{
 const s=createSandbox();s.deployed=false;s.monsters=[createMonster('slime',s.player.x,s.player.y,10)];const before=s.team[0].hp;
 stepSandbox(s,{x:0,y:0},.01);assert.equal(s.team[0].hp,before);assert.equal(s.monsters[0].intent.phase,'windup');
 for(let i=0;i<40;i++)stepSandbox(s,{x:0,y:0},.05);
 assert.equal(s.team[0].hp,before-monsterAttackDamage(s.monsters[0]));assert.equal(s.team[0].lastDamageElement,'water');
});
