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
 if(monster.depthsSlime||monster.species?.startsWith('depths-')) {
   const size=Math.max(1,Math.min(3,monster.growth||1));
   const element=monster.dualElement?((monster.attackSerial||0)%2?'earth':'water'):(monster.element||(monster.species==='depths-earth-slime'?'earth':'water'));
   return {...MONSTER_ATTACKS.slime,name:element==='earth'?'Impact de limon':'Bond abyssal',element,windup:.85+.12*(size-1),radius:22+5*(size-1),range:210,flight:.45,multiplier:1.3+.25*(size-1),recovery:1.1};
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
