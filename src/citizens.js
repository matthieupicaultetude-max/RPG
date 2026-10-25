import {face,move} from './motion.js';
const names=['Maëlle','Oscar','Léonie','Basile','Nina','Gaspard','Jade','Arthur','Louise','Milo','Élise','Robin','Céleste','Victor','Aline','Félix','Lucie','Paul','Anaïs','Léon','Zoé','Marin'];
const jobs=['Habitante','Boulanger','Apprentie','Livreur','Promeneuse','Pêcheur','Artisane','Voyageur'];
const colors=['#b492a7','#ad976e','#88a59b','#a98167','#8298b4','#a1aa74'];
const lines=['Le marché est animé aujourd’hui.','Du pain tout chaud à la boulangerie !','Le bateau vient d’arriver.','Quelle belle journée !','Je passe voir les artisans.','On se retrouve à la fontaine ?'];
export function createCitizens(streets,canWalk,isSafe){const people=[];
 for(const street of streets){let groups=[],group=[];for(const p of street.points){if(canWalk(...p)&&isSafe(...p))group.push(p);else{if(group.length>3)groups.push(group);group=[]}}if(group.length>3)groups.push(group);const route=groups.sort((a,b)=>b.length-a.length)[0];if(!route)continue;
  const length=route.reduce((n,p,i)=>n+(i?Math.hypot(p[0]-route[i-1][0],p[1]-route[i-1][1]):0),0);if(length<100)continue;
  for(let k=0;k<2;k++){const i=people.length,index=Math.min(route.length-1,Math.floor(route.length*(k?.7:.3))),[x,y]=route[index];people.push({id:'citizen-'+i,name:names[i%names.length],job:jobs[i%jobs.length],color:colors[i%colors.length],hair:['#654e39','#ad8b52','#493c36','#b6a387'][i%4],hat:i%4===0?'cap':i%4===1?'hood':'none',x,y,hp:1,homeX:x,homeY:y,facing:'down',moving:false,walk:i,route:route.map(p=>[...p]),routeIndex:index,direction:k?-1:1,speed:29+i%5*4,wait:k*.7,bubble:0,speech:lines[i%lines.length],speechTimer:5+i*.9})}
 }return people}
export function stepCitizens(people,dt,canWalk,player){for(const n of people){n.moving=false;n.bubble=Math.max(0,n.bubble-dt);n.speechTimer-=dt;if(n.speechTimer<=0){n.bubble=2.8;n.speechTimer=15+n.speed*.3}
 if(player&&Math.hypot(n.x-player.x,n.y-player.y)<36){face(n,player.x-n.x,player.y-n.y);continue}
 if(n.wait>0){n.wait=Math.max(0,n.wait-dt);continue}
 let target=n.route[n.routeIndex],dx=target[0]-n.x,dy=target[1]-n.y,d=Math.hypot(dx,dy);
 if(d<2){if(n.routeIndex+n.direction<0||n.routeIndex+n.direction>=n.route.length){n.direction*=-1;n.wait=1.5+(n.speed%4)*.6;n.bubble=2.5}n.routeIndex+=n.direction;continue}
 const distance=Math.min(d,n.speed*dt),traveled=move(n,dx/d*distance,dy/d*distance,canWalk);n.moving=traveled>.02;n.walk+=traveled*.15;if(n.moving)face(n,dx,dy);else n.wait=.3;
}}
