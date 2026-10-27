export const MONSTER_LEVEL_MAX = 100;
export const MONSTERS = Object.freeze([
  { id:'slime', element:'water', name:'Slime', family:'Créature gélatineuse', habitat:'Clairières du jardin', description:'Ce slime se comprime avant de bondir sur le personnage le plus isolé de la troupe. Un cercle Eau annonce sa zone d’atterrissage.', hp:45, damage:8, attackDelay:1.2, speed:32, patrolSpeed:14, detection:105, respawn:7, xp:10, gold:5, normal:'Gelée', rare:'Cœur de gelée', rareChance:.2, chromaticChance:.1 },
  { id:'boar', element:'earth', name:'Sanglier', family:'Bête sauvage', habitat:'Aire de combat du jardin', description:'Le sanglier fixe une cible, annonce un couloir Terre puis charge en ligne droite. Écartez-vous avant son départ.', hp:70, damage:8, attackDelay:1.2, speed:32, patrolSpeed:14, detection:105, respawn:7, xp:10, gold:5, normal:'Soie de sanglier', rare:'Défense ancienne', rareChance:.2, chromaticChance:.1 },
  { id:'firefly',element:'fire',name:'Luciole ardente',family:'Insecte de feu',habitat:'Lisière du jardin',description:'La luciole prépare une tornade de Feu. Un couloir annonce sa trajectoire avant son lancement.',hp:35,damage:6,attackDelay:1.2,speed:38,patrolSpeed:16,detection:105,respawn:7,xp:10,gold:5,normal:'Poussière de braise',rare:'Étincelle vive',rareChance:.2,chromaticChance:.1 },
  { id:'moth',element:'air',name:'Phalène',family:'Insecte des vents',habitat:'Lisière du jardin',description:'La phalène canalise une tornade d’Air vers les personnages. Esquivez la trajectoire annoncée au sol.',hp:40,damage:6,attackDelay:1.2,speed:40,patrolSpeed:16,detection:105,respawn:7,xp:10,gold:5,normal:'Écaille légère',rare:'Aile de zéphyr',rareChance:.2,chromaticChance:.1 },
  {id:'marsh-slime',element:'water',name:'Slime des marais',family:'Gelée absorbante',habitat:'Marais de Gelée',description:'Ses sauts laissent des flaques qu’il absorbe pour grandir, jusqu’à trois tailles. Plus gros, il frappe plus fort et plus large, mais prépare plus lentement ses bonds. Un gros slime qui manque son saut perd une taille, libère un slime de taille 1 et devient vulnérable. Les fleurs éponges lui donnent du nectar qui le fait grandir, jusqu’à trois tailles.',marshSlime:true,hp:100,damage:8,attackDelay:1.2,speed:32,patrolSpeed:14,detection:88,respawn:18,xp:20,gold:8,normal:'Gelée',rare:'Cœur de gelée',rareChance:.2,chromaticChance:.1},
  {id:'depths-water-slime',element:'water',name:'Slime abyssal',family:'Gelée des profondeurs',habitat:'Crevasse des profondeurs',description:'Un slime d’eau très agressif. Ses bonds rapides sont annoncés au sol. Un saut raté le divise s’il dépasse la taille 1. Deux petits slimes proches fusionnent après un avertissement ; une fusion Eau et Terre alterne les deux éléments à chaque bond.',depthsSlime:true,hp:105,damage:10,attackDelay:1.2,speed:47,patrolSpeed:19,detection:240,respawn:18,xp:24,gold:10,normal:'Gelée abyssale',rare:'Perle des profondeurs',rareChance:.2,chromaticChance:.1},
  {id:'depths-earth-slime',element:'earth',name:'Slime de limon',family:'Gelée des profondeurs',habitat:'Crevasse des profondeurs',description:'Cette gelée chargée de limon attaque avec la Terre. Elle se divise sur un saut raté et fusionne avec ses voisins jusqu’à la taille 3. Repoussez les slimes pendant la préparation de leur fusion pour la briser. Une fusion mixte attaque alternativement Eau et Terre.',depthsSlime:true,hp:115,damage:10,attackDelay:1.2,speed:44,patrolSpeed:18,detection:240,respawn:18,xp:24,gold:10,normal:'Limon humide',rare:'Géode suintante',rareChance:.2,chromaticChance:.1},
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
  return { element:definition.element,species:definition.id,name:definition.name,...stats,...(definition.depthsSlime?{depthsSlime:true,growth:1,baseMaxHp:stats.maxHp}:{}),...(definition.marshSlime?{marshSlime:true,growth:1,spawnGrowth:1,baseMaxHp:stats.maxHp}:{}),x,y,homeX:x,homeY:y,hp:stats.maxHp,cooldown:0,respawn:0 };
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
