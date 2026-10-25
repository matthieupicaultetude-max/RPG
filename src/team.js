export const roles = {tank:'Tank', fighter:'Combattant', ranged:'Distance'};
export const classes = {
 guardian:{name:'Gardien',role:'tank',icon:'⛨',color:'#8fbcd2',weapon:'Bouclier du rempart',desc:'Protège et attire les ennemis.',range:62,damage:16,skill:'Onde du rempart',maxHp:180,armor:.5},
 paladin:{name:'Paladin',role:'tank',icon:'✚',color:'#e3ca84',weapon:'Marteau solaire',desc:'Un rempart de lumière.',range:68,damage:19,skill:'Jugement solaire',maxHp:160,armor:.6},
 warrior:{name:'Guerrier',role:'fighter',icon:'⚔',color:'#eea56a',weapon:'Épée de voyage',desc:'Au cœur de la mêlée.',range:66,damage:26,skill:'Tourbillon',maxHp:120,armor:.85},
 rogue:{name:'Duelliste',role:'fighter',icon:'⚔',color:'#dd94a9',weapon:'Lames jumelles',desc:'Des frappes vives et précises.',range:58,damage:30,skill:'Danse des lames',maxHp:100,armor:1},
 mage:{name:'Mage',role:'ranged',icon:'✦',color:'#bc9afa',weapon:'Bâton des lucioles',desc:'La magie à portée de main.',range:185,damage:21,skill:'Nova arcanique',maxHp:85,armor:1},
 ranger:{name:'Rôdeur',role:'ranged',icon:'➶',color:'#98cba0',weapon:'Arc de frêne',desc:'Précision et liberté.',range:230,damage:18,skill:'Volée de flèches',maxHp:100,armor:1}
};
export function normalizeTeam(saved={}) {
 const composition={tank:'guardian',fighter:'warrior',ranged:'mage'};
 for(const role of Object.keys(roles))if(classes[saved.composition?.[role]]?.role===role)composition[role]=saved.composition[role];
 return {composition,mainRole:Object.hasOwn(roles,saved.mainRole)?saved.mainRole:'fighter'};
}
export function createCompanions(composition,mainRole,player) {
 return Object.entries(composition).filter(([role])=>role!==mainRole).map(([role,id],i)=>({role,id,x:player.x+(i?28:-28),y:player.y+32,hp:classes[id].maxHp,cooldown:0,moving:false}));
}
export function selectMonsterTarget(monster,player,mainId,companions,deployed) {
 const candidates=[{...player,id:mainId,isPlayer:true},...(deployed?companions.filter(c=>c.hp>0):[])];
 const tanks=candidates.filter(c=>classes[c.id].role==='tank'&&Math.hypot(c.x-monster.x,c.y-monster.y)<165);
 return (tanks.length?tanks:candidates).sort((a,b)=>Math.hypot(a.x-monster.x,a.y-monster.y)-Math.hypot(b.x-monster.x,b.y-monster.y))[0];
}
export function stepCompanions(companions,player,monsters,dt,canWalk,hit) {
 companions.forEach((c,i)=>{
  c.moving=false;if(c.hp<=0)return;c.cooldown=Math.max(0,c.cooldown-dt);
  const stats=classes[c.id];
  const target=monsters.filter(m=>m.hp>0&&Math.hypot(m.x-player.x,m.y-player.y)<225).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
  let goal={x:player.x+(i?36:-36),y:player.y+38};
  if(target){const d=Math.hypot(target.x-c.x,target.y-c.y);if(d<=stats.range&&c.cooldown<=0){hit(target,stats.damage,c);c.cooldown=stats.role==='fighter'?.85:1.15}if(d>stats.range*.78)goal=target;else if(stats.role==='ranged'&&d<65){const n=d||1;goal={x:c.x+(c.x-target.x)/n*60,y:c.y+(c.y-target.y)/n*60}}else return;}
  const dx=goal.x-c.x,dy=goal.y-c.y,d=Math.hypot(dx,dy);if(d<10)return;
  const step=Math.min(d,155*dt),nx=c.x+dx/d*step,ny=c.y+dy/d*step;
  if(canWalk(nx,ny)){c.x=nx;c.y=ny;c.moving=true}else if(canWalk(nx,c.y)){c.x=nx;c.moving=true}else if(canWalk(c.x,ny)){c.y=ny;c.moving=true}
  if(Math.hypot(c.x-player.x,c.y-player.y)>320){c.x=player.x;c.y=player.y+12}
 });
}
