export const MONSTER_ATTACKS = Object.freeze({
  boar: {
    kind: "charge",
    name: "Charge tellurique",
    element: "earth",
    windup: 1.1,
    radius: 12,
    range: 145,
    speed: 260,
    multiplier: 1.5,
    recovery: 2.4,
  },
  slime: {
    kind: "leap",
    name: "Bond de marée",
    element: "water",
    windup: 1.2,
    radius: 24,
    range: 155,
    flight: 0.65,
    multiplier: 1.25,
    recovery: 2.8,
  },
  firefly: {
    kind: "tornado",
    name: "Tornade de braise",
    element: "fire",
    windup: 1.2,
    radius: 14,
    range: 155,
    speed: 95,
    multiplier: 1,
    recovery: 3,
  },
  moth: {
    kind: "tornado",
    name: "Tornade de zéphyr",
    element: "air",
    windup: 1.2,
    radius: 14,
    range: 155,
    speed: 105,
    multiplier: 1,
    recovery: 3,
  },
});
export const monsterAttack = (monster) => {
 if(monster.mountainSlime||monster.species==='mountain-slime')return {kind:'charge',name:'Roulade de schiste',element:'earth',windup:1.3,radius:12,range:170,speed:170,multiplier:1.4,recovery:2.1};

 if(monster.boss||monster.species==='gorgelimon'){
   const rage=(monster.bossStage||0)>=2,serial=(monster.attackSerial||0)%3;
   const common={range:230,recovery:rage?1.25:1.8};
   if(serial===0)return {...common,kind:'leap',name:'Marée d’impact',element:'water',windup:rage?1.05:1.4,radius:40,flight:.7,multiplier:1.5};
   if(serial===1)return {...common,kind:'charge',name:'Ruée de limon',element:'earth',windup:rage?1:1.35,radius:21,speed:180,multiplier:1.4};
   return {...common,kind:'quake',name:'Éboulement du gouffre',element:'earth',windup:rage?1.2:1.6,radius:27,multiplier:1.25};
 }

 if(monster.depthsSlime||monster.species?.startsWith('depths-')) {
   const size=Math.max(1,Math.min(3,monster.growth||1));
   const element=monster.dualElement?((monster.attackSerial||0)%2?'earth':'water'):(monster.element||(monster.species==='depths-earth-slime'?'earth':'water'));
   return {...MONSTER_ATTACKS.slime,kind:element==='earth'?'charge':'leap',name:element==='earth'?'Roulade de limon':'Bond abyssal',element,windup:.85+.12*(size-1),radius:element==='earth'?12+3*(size-1):22+5*(size-1),range:210,speed:170,flight:.45,multiplier:1.3+.25*(size-1),recovery:1.1};
 }
 const base=MONSTER_ATTACKS[monster.species==='marsh-slime'?'slime':monster.species];
 if(!monster.marshSlime||!base)return base;
 const growth=Math.max(1,Math.min(3,monster.growth||1));
 return {...base,radius:base.radius*(1+.25*(growth-1)),windup:base.windup+.3*(growth-1),multiplier:base.multiplier*(1+.25*(growth-1))};
};
export const monsterAttackDamage = (monster) =>
  Math.max(
    1,
    Math.round(
      monster.damage *
        (monster.tutorial ? 1 : monsterAttack(monster)?.multiplier || 1),
    ),
  );
