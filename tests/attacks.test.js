import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, attack, canStand, chooseMain } from '../src/dev/sandbox.js';
import { guidedTarget, stepAttacks } from '../src/combat/attacks.js';
import { viewport, screenToWorld } from '../src/rendering/viewport.js';
const hit=(_s,m,damage)=>{m.hp-=damage;};
function setup(role=0) {
 const s=createSandbox();chooseMain(s,role);Object.assign(s.player,{x:300,y:230});Object.assign(s.team[s.main],s.player);
 s.monsters=[{x:330,y:230,hp:100},{x:310,y:255,hp:100}];return s;
}
test('visée : la cible sous le curseur prime sur le monstre le plus proche',()=>{
 const s=setup();const point={x:330,y:222};
 assert.equal(guidedTarget(s,point,canStand).target,s.monsters[0]);
 attack(s,point);assert.equal(s.monsters[0].hp,100);stepAttacks(s,.13,canStand,hit);
 assert.equal(s.monsters[0].hp,88);assert.equal(s.monsters[1].hp,100);
});
test('coup : délai respecté, pas de spam ni de dégâts si la cible sort de portée',()=>{
 const s=setup();assert.equal(attack(s,{x:330,y:222}),true);assert.equal(attack(s),false);
 stepAttacks(s,.05,canStand,hit);assert.equal(s.monsters[0].hp,100);
 s.monsters[0].x=400;stepAttacks(s,.1,canStand,hit);assert.equal(s.monsters[0].hp,100);
});
test('projectile guidé : suit une cible mobile et ne frappe qu’une seule fois',()=>{
 const s=setup(2);s.monsters=[{x:390,y:230,hp:100}];attack(s,{x:390,y:222});
 assert.equal(s.attacks[0].role,'ranged');s.monsters[0].y+=12;
 for(let i=0;i<60;i++)stepAttacks(s,1/60,canStand,hit);
 assert.equal(s.monsters[0].hp,88);assert.equal(s.attacks.length,0);
});
test('visée : cible hors portée ou derrière la maison ne peut être verrouillée pour infliger des dégâts',()=>{
 const s=setup();s.monsters=[{x:420,y:230,hp:100}];assert.equal(guidedTarget(s,{x:420,y:222},canStand).inRange,false);
 Object.assign(s.player,{x:40,y:85});Object.assign(s.team[0],s.player);s.monsters=[{x:175,y:85,hp:100}];
 assert.equal(guidedTarget(s,{x:175,y:77},canStand).clear,false);
 attack(s,{x:175,y:77});for(let i=0;i<60;i++)stepAttacks(s,1/60,canStand,hit);assert.equal(s.monsters[0].hp,100);
});
test('soutien : animation de sort distincte et dégâts à l’impact',()=>{
 const s=setup(1);attack(s,{x:330,y:222});assert.equal(s.attacks[0].role,'support');assert.equal(s.monsters[0].hp,100);
 for(let i=0;i<30;i++)stepAttacks(s,1/60,canStand,hit);assert.equal(s.monsters[0].hp,88);
});
test('conversion curseur/caméra identique au rendu sur desktop, portrait et fenêtre décalée',()=>{
 for(const [width,height,left,top]of [[1440,900,0,0],[390,844,0,0],[900,500,20,35]]){
  const player={x:480,y:255};const view=viewport(width,height,player);const world={x:475,y:250};
  const point=screenToWorld(left+(world.x-view.x)*view.scale,top+(world.y-view.y)*view.scale,{width,height,left,top},player);
  assert.ok(Math.abs(point.x-world.x)<1e-8);assert.ok(Math.abs(point.y-world.y)<1e-8);
 }
});
