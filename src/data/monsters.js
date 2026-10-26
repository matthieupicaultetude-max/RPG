export const MONSTER_LEVEL_MAX = 100;
export const MONSTERS = Object.freeze([
  { id:'slime', element:'water', name:'Slime', family:'Créature gélatineuse', habitat:'Clairières du jardin', description:'Une petite créature souple qui rôde près des sentiers. Elle se rapproche de sa cible pour frapper au contact.', hp:45, damage:8, attackDelay:1.2, speed:32, patrolSpeed:14, detection:105, respawn:7, xp:10, gold:5, normal:'Gelée', rare:'Cœur de gelée', rareChance:.2, chromaticChance:.1 },
  { id:'boar', element:'earth', name:'Sanglier', family:'Bête sauvage', habitat:'Aire de combat du jardin', description:'Une bête robuste et territoriale. Plus résistante que le slime, elle poursuit les intrus qui passent près de son territoire.', hp:70, damage:8, attackDelay:1.2, speed:32, patrolSpeed:14, detection:105, respawn:7, xp:10, gold:5, normal:'Soie de sanglier', rare:'Défense ancienne', rareChance:.2, chromaticChance:.1 },
  { id:'firefly',element:'fire',name:'Luciole ardente',family:'Insecte de feu',habitat:'Lisière du jardin',description:'Une luciole incandescente, liée à l’Intelligence et à l’élément Feu.',hp:35,damage:6,attackDelay:1.2,speed:38,patrolSpeed:16,detection:105,respawn:7,xp:10,gold:5,normal:'Poussière de braise',rare:'Étincelle vive',rareChance:.2,chromaticChance:.1 },
  { id:'moth',element:'air',name:'Phalène',family:'Insecte des vents',habitat:'Lisière du jardin',description:'Une phalène légère, liée à l’Agilité et à l’élément Air.',hp:40,damage:6,attackDelay:1.2,speed:40,patrolSpeed:16,detection:105,respawn:7,xp:10,gold:5,normal:'Écaille légère',rare:'Aile de zéphyr',rareChance:.2,chromaticChance:.1 },
].map(monster=>Object.freeze(monster)));
export function monsterDefinition(id) { return MONSTERS.find(m=>m.id===id || m.name===id); }
export function monsterStats(id, requestedLevel=1) {
  const definition=monsterDefinition(id);
  if(!definition) throw new Error(`Monstre inconnu : ${id}`);
  const level=Math.max(1,Math.min(MONSTER_LEVEL_MAX,Math.floor(Number(requestedLevel)||1)));
  const growth=level-1;
  return { level, maxHp:Math.round(definition.hp*(1+growth*.12)), damage:Math.round(definition.damage*(1+growth*.08)), attackDelay:definition.attackDelay, speed:definition.speed, patrolSpeed:definition.patrolSpeed, detection:definition.detection, respawnDelay:definition.respawn, xp:Math.round(definition.xp*(1+growth*.1)), gold:Math.round(definition.gold*(1+growth*.05)) };
}
export function createMonster(id,x,y,level=1) {
  const definition=monsterDefinition(id), stats=monsterStats(id,level);
  return { element:definition.element,species:definition.id,name:definition.name,...stats,x,y,homeX:x,homeY:y,hp:stats.maxHp,cooldown:0,respawn:0 };
}
export function monsterLoot(id) {
  const m=monsterDefinition(id);
  if(!m) throw new Error(`Monstre inconnu : ${id}`);
  return [
    {name:m.normal,type:'normal',chromatic:false,chance:(1-m.rareChance)*(1-m.chromaticChance)},
    {name:m.normal,type:'normal',chromatic:true,chance:(1-m.rareChance)*m.chromaticChance},
    {name:m.rare,type:'rare',chromatic:false,chance:m.rareChance*(1-m.chromaticChance)},
    {name:m.rare,type:'rare',chromatic:true,chance:m.rareChance*m.chromaticChance},
  ];
}
