import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, canStand, activateUltimate, teleport, stepSandbox } from '../src/dev/sandbox.js';
import { stepCompanions, clearRoute } from '../src/ai/companions.js';
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function simulate(s,seconds,hit=()=>{}) {
 for(let i=0;i<seconds*60;i++) {
  s.time+=1/60;s.team.forEach(m=>m.cooldown=Math.max(0,m.cooldown-1/60));
  stepCompanions(s,1/60,canStand,hit);
  for(const m of s.team)assert.ok(canStand(m.x,m.y),`${m.name} crossed obstacle at ${m.x},${m.y}`);
 }
}
test('E logic: deployment near current leader on valid, separated ground',()=>{
 const s=createSandbox();Object.assign(s.player,{x:50,y:110});activateUltimate(s);
 assert.ok(s.deployed);
 const allies=s.team.filter((_,i)=>i!==s.main);
 for(const m of allies){assert.ok(canStand(m.x,m.y));assert.ok(gap(m,s.player)<90);}
 for(let i=0;i<allies.length;i++)for(let j=i+1;j<allies.length;j++)assert.ok(gap(allies[i],allies[j])>18);
});
test('followers route around the house independently and settle without overlapping',()=>{
 const s=createSandbox();activateUltimate(s);s.monsters=[];Object.assign(s.player,{x:190,y:80});Object.assign(s.team[0],s.player);
 s.team.slice(1).forEach((m,i)=>{Object.assign(m,{x:30,y:80+i*8});clearRoute(m);});
 simulate(s,10);
 for(const m of s.team.slice(1))assert.ok(gap(m,s.player)<100,`${m.name} failed to catch up`);
 const before=s.team.slice(1).map(m=>({...m}));simulate(s,3);
 for(let i=0;i<before.length;i++)assert.ok(gap(before[i],s.team[i+1])<12,'idle character keeps wandering');
 for(let i=1;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(gap(s.team[i],s.team[j])>16);
});
test('ranged retreats and shoots, melee closes in, support stays behind',()=>{
 const s=createSandbox();activateUltimate(s);s.main=1;Object.assign(s.player,{x:400,y:230});Object.assign(s.team[1],s.player);
 const enemy={x:445,y:230,hp:1000};s.monsters=[enemy];
 Object.assign(s.team[2],{x:430,y:230});Object.assign(s.team[0],{x:350,y:260});
 const initialRanged=gap(s.team[2],enemy),initialMelee=gap(s.team[0],enemy);const strikes=[];
 simulate(s,3,(_s,_m,_d,member)=>strikes.push(member.role));
 assert.ok(gap(s.team[2],enemy)>initialRanged+40);assert.ok(gap(s.team[0],enemy)<initialMelee-35);
 assert.ok(strikes.includes('melee'));assert.ok(strikes.includes('ranged'));
});
test('moving away disengages the team and only the main receives direct movement',()=>{
 const s=createSandbox();activateUltimate(s);teleport(s,'combat');s.monsters.forEach(m=>{m.hp=10000;});
 for(let i=0;i<180;i++)stepSandbox(s,{x:-1,y:0},1/60);
 assert.ok(s.player.x<250);
 for(const m of s.team.slice(1))assert.ok(gap(m,s.player)<160,`${m.name} kept fighting too far from the leader`);
});
