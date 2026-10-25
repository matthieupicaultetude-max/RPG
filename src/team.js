import {face,steer} from './motion.js';
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
 return Object.entries(composition).filter(([role])=>role!==mainRole).map(([role,id],i)=>({role,id,x:player.x+(i?28:-28),y:player.y+32,hp:classes[id].maxHp,cooldown:0,moving:false,facing:player.facing||'down',dir:1,walk:0,hit:0,kx:0,ky:0,decisionTime:0}));
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
  c.decisionTime=(c.decisionTime||0)-dt;
  if(c.decisionTime<=0){c.offsetAngle=Math.random()*Math.PI*2;c.offsetRadius=8+Math.random()*15;c.decisionTime=.9+Math.random()*1.8;}
  const ox=Math.cos(c.offsetAngle)*c.offsetRadius,oy=Math.sin(c.offsetAngle)*c.offsetRadius;
  let goal={x:player.x+(i?40:-40)+ox,y:player.y+40+oy},speed=125;
  if(target){
   const dx=target.x-c.x,dy=target.y-c.y,d=Math.hypot(dx,dy)||1;face(c,dx,dy);
   if(d<=stats.range&&c.cooldown<=0){hit(target,stats.damage,c);c.cooldown=(stats.role==='fighter'?.85:1.15)*(.92+Math.random()*.16)}
   if(stats.role==='ranged'){
    const ideal=stats.range*.66;
    if(d<ideal-18)goal={x:target.x-dx/d*ideal+ox*.3,y:target.y-dy/d*ideal+oy*.3};
    else if(d>stats.range*.87)goal={x:target.x-dx/d*ideal,y:target.y-dy/d*ideal};
    else goal={x:c.x+ox*.12,y:c.y+oy*.12};
   }else goal={x:target.x-dx/d*32+ox*.35,y:target.y-dy/d*32+oy*.35};
   speed=100;
  }
  const distance=Math.hypot(c.x-player.x,c.y-player.y);if(distance>250){goal=player;speed=175}
  steer(c,goal,speed,dt,canWalk,[...companions,player]);
  if(target&&!c.moving)face(c,target.x-c.x,target.y-c.y);
  if(distance>320){c.x=player.x;c.y=player.y+12;c.vx=0;c.vy=0}

 });
}
