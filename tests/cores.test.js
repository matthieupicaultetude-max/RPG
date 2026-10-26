import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_SETS, ELEMENTS, createCore, levelBand, rollCoreEquipment, equipmentStats, weaponDamage } from '../src/data/equipment.js';
import { createMonster } from '../src/data/monsters.js';
import { createSandbox, grantCore, openCore, teleport, equip, unequip, rewardMonster } from '../src/dev/sandbox.js';

test('quatre panoplies, neuf pièces chacune équipables niveau 1, sans caractéristique secondaire',()=>{
 assert.equal(STARTER_SETS.length,4);
 for(const set of STARTER_SETS){assert.equal(set.pieces.length,9);assert.equal(new Set(set.pieces.map(p=>p.slot)).size,9);for(const piece of set.pieces){assert.equal(piece.requiredLevel,1);assert.deepEqual(Object.keys(piece.stats).sort(),[ELEMENTS[set.element].stat,'Vitalité'].sort());}}
});
test('noyaux : bornes de tranche, pile par élément/tranche/variation et aucune consommation hors village',()=>{
 assert.deepEqual(levelBand(1),{min:1,max:10});assert.deepEqual(levelBand(10),{min:1,max:10});assert.deepEqual(levelBand(11),{min:11,max:20});
 const s=createSandbox();grantCore(s,'earth');grantCore(s,'earth',10);grantCore(s,'earth',1,true);grantCore(s,'water');assert.equal(s.bag.length,3);assert.equal(s.bag[0].quantity,2);
 assert.equal(openCore(s,s.bag[0].id),null);assert.equal(s.bag[0].quantity,2);
});
test('ouverture : une seule consommation, bonne panoplie, choix de toutes les pièces et doublons possibles',()=>{
 const s=createSandbox();teleport(s,'maison');grantCore(s,'fire');grantCore(s,'fire');const id=s.bag[0].id;
 const first=openCore(s,id,()=>0),second=openCore(s,id,()=>0);assert.equal(first.setId,'fire');assert.equal(first.slot,'Coiffe');assert.equal(second.slot,'Coiffe');assert.notEqual(first.id,second.id);assert.equal(s.bag.some(i=>i.kind==='core'),false);
 for(const set of STARTER_SETS){const results=Array.from({length:9},(_,i)=>rollCoreEquipment(createCore(set.element),()=>i/9).slot);assert.equal(new Set(results).size,9);}
});
test('tranche non disponible non consommée et variation chromatique conservée',()=>{
 const s=createSandbox();teleport(s,'maison');grantCore(s,'air',11);const id=s.bag[0].id;assert.equal(openCore(s,id),null);assert.equal(s.bag[0].quantity,1);
 grantCore(s,'air',1,true);const item=openCore(s,s.bag[1].id,()=>.99);assert.equal(item.chromatic,true);assert.equal(item.slot,'Bouclier');
});
test('équipement : bonus effectifs et PV sans duplication ni soin gratuit au remplacement',()=>{
 const s=createSandbox();teleport(s,'maison');grantCore(s,'earth');const item=openCore(s,s.bag[0].id,()=>0);const hp=s.team[0].hp;equip(s,item.id);assert.equal(s.team[0].maxHp,103);assert.equal(s.team[0].hp,hp);assert.equal(equipmentStats(s.team[0]).Force,3);
 const weapon={...STARTER_SETS[0].pieces.find(i=>i.slot==='Arme'),id:s.nextItem++,quantity:1};s.bag.push(weapon);equip(s,weapon.id);assert.equal(weaponDamage(s.team[0],100),108);unequip(s,'Coiffe');assert.equal(s.team[0].maxHp,101);assert.equal(weaponDamage(s.team[0],100),105);
});
test('récompenses : noyau de la caractéristique principale en plus du loot, tirage indépendant',()=>{
 for(const [species,element]of[['slime','water'],['boar','earth'],['firefly','fire'],['moth','air']]){const s=createSandbox();rewardMonster(s,createMonster(species,400,240),()=>0);assert.equal(s.bag.find(i=>i.kind==='core').element,element);assert.equal(s.bag.filter(i=>i.kind!=='core').length,1);}
 const s=createSandbox();rewardMonster(s,createMonster('slime',400,240),()=>.99);assert.equal(s.bag.some(i=>i.kind==='core'),false);
});
