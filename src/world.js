import {paintConnectedPavement} from './pavement.js';
import {createCitizens} from './citizens.js';
import {fromPlan,polygon,contains,townOutline,bay,castleOutline,castleGate,castleTowers,docks,boats,streetPlans,makeTownBuildings,makeCastleWalls,distanceToSegment} from './city-plan.js';
export {castleOutline,castleGate,castleTowers,docks,bay,townOutline} from './city-plan.js';
export const WORLD={width:3600,height:2800,spawn:{x:1970,y:1340},fire:{x:1970,y:1270},fountain:{x:1896,y:1158},town:{x:750,y:570,w:2100,h:1630}};
export const shore=[[435,255],[1050,142],[1680,210],[2220,128],[2940,232],[3300,600],[3435,1200],[3330,1860],[3060,2310],[2400,2490],[1800,2588],[1110,2475],[495,2205],[188,1695],[150,1035],[255,555]];
export function smoothStreet(points){let result=points;for(let pass=0;pass<2;pass++){const next=[result[0]];for(let i=1;i<result.length;i++){const a=result[i-1],b=result[i];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}next.push(result.at(-1));result=next}return result}
export const streets=streetPlans.map(street=>({...street,points:smoothStreet(polygon(street.points))}));
export const buildings=makeTownBuildings(streets);
export const walls=makeCastleWalls();
export const gates={north:{x:1900,y:710},south:fromPlan(174,333),west:fromPlan(83,151),east:fromPlan(337,157),castle:castleGate};
export const districts=[{name:'Port des Marées',x:2070,y:730},{name:'Quartier des Tisserands',x:1510,y:1040},{name:'Bourg des Jardins',x:2220,y:1750},{name:'Château d’Aurore',x:1090,y:1660}];
const treeSpots=polygon([[58,145],[38,276],[86,292],[139,315],[196,324],[294,312],[324,288],[345,183],[316,123],[83,107],[305,93],[260,295],[224,288],[104,257]]);
export const townTrees=treeSpots.map(([x,y],i)=>({x,y,s:.75+(i%3)*.12,leaf:i%2})).filter(t=>!buildings.some(b=>t.x>b.x-35&&t.x<b.x+b.w+35&&t.y>b.y-20&&t.y<b.y+b.h+25)&&!streets.some(s=>s.points.some((p,i)=>i&&distanceToSegment(t.x,t.y,s.points[i-1],p)<s.width/2+12)));
export const townObjects=[
 ...buildings.filter(b=>b.kind!=='castle'&&b.kind!=='mill').flatMap((b,i)=>[{kind:'planter',x:b.x+8,y:b.y+b.h+14,variant:i%3},...(i%3===0?[{kind:'barrel',x:b.x+b.w-8,y:b.y+b.h+14,variant:i}]:[])]),
 {kind:'market',x:1760,y:1310,variant:0},{kind:'market',x:2070,y:1370,variant:1},{kind:'well',x:2200,y:1435},
 {kind:'bench',x:2000,y:1110},{kind:'bench',x:1010,y:1640},{kind:'cart',x:2350,y:1830},
 ...[[1740,710],[1880,708],[2080,718],[2240,728],[2410,725],[2460,748]].map(([x,y],i)=>({kind:i%2?'barrel':'crate',x,y,variant:i})),
 ...[[1680,1100],[2010,1365],[2390,1510],[1300,1690],[1080,1300]].map(([x,y],i)=>({kind:'lamp',x,y,variant:i}))
];
function shopNPC(id,name,job,shop,color,dialog){const b=buildings.find(b=>b.id===id),p=houseEntrance(b);return {id:id==='armor'?'brune':id==='magic'?'iris':id,name,job,shop,color,dialog,x:p.x,y:p.y+12}}
export const npcs=[
 {id:'marius',name:'Marius',job:'Marchand',shop:'general',color:'#bd9165',x:1760,y:1330,dialog:'Le marché relie les quais et les quartiers. Je rachète tous vos trésors !'},
 shopNPC('armor','Brune','Armurière','armor','#b98772','Ma forge est installée dans le quartier des artisans, près du château.'),
 shopNPC('magic','Iris','Enchanteresse','magic','#bd9fdf','Bienvenue dans l’échoppe des Lucioles. Capes et bâtons pour vos voyages !'),
 {id:'elio',name:'Élio',job:'Garde',x:1310,y:1515,color:'#8aaec0',dialog:'Passez la porte pour visiter la cour du château. Les tours surveillent toute la ville.'},
 {id:'rose',name:'Rose',job:'Fermière',x:1060,y:1040,color:'#d8ae79',dialog:'Le chemin à l’ouest mène au moulin et aux champs de Blévent.'},
 {id:'lina',name:'Lina',job:'Herboriste',x:2500,y:1610,color:'#91ba88',dialog:'En suivant la route vers l’est, vous rejoindrez la forêt de Sylve.'},
 {id:'noe',name:'Noé',job:'Docker',x:2010,y:732,color:'#d5b093',dialog:'Quatre pontons accueillent les bateaux dans la baie. Les quais sont ouverts à tous.'},
 {id:'tessa',name:'Tessa',job:'Tisserande',x:1550,y:1090,color:'#bba0c1',dialog:'Nos maisons suivent les rues anciennes, entre le port et le château.'},
 {id:'hugo',name:'Hugo',job:'Jardinier',x:2180,y:1820,color:'#98b18a',dialog:'La route du sud serpente entre les maisons avant de rejoindre la plaine.'},
 {id:'simon',name:'Simon',job:'Charpentier',x:2280,y:1250,color:'#c4a17f',dialog:'Le bourg est construit autour d’une rue en boucle. Le port est au nord.'},
 {id:'alma',name:'Alma',job:'Villageoise',x:1940,y:1310,color:'#d5a5b7',dialog:'La place du Marché est le cœur de la ville. Le feu soigne votre compagnie.'}
];
export const enemyTypes={slime:{name:'Gelée des prés',hp:60,damage:8,loot:'jelly',color:'#87d58d'},scarecrow:{name:'Épouvantail éveillé',hp:90,damage:11,loot:'straw',color:'#d9b976'},turnip:{name:'Navet farouche',hp:65,damage:9,loot:'root',color:'#e3bbd4'},mushroom:{name:'Champignon sylvestre',hp:75,damage:10,loot:'spore',color:'#e69679'},boar:{name:'Sanglier des bois',hp:105,damage:13,loot:'fur',color:'#a18b77'}};
export function inTown(x,y){return contains(townOutline,x,y)||contains(castleOutline,x,y)||docks.some(d=>x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h)}
export function onLand(x,y){return contains(shore,x,y)&&(!contains(bay,x,y)||docks.some(d=>x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h))}
function inRect(x,y,r,pad=9){return x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad}
export function objectBlocks(x,y,o){const dx=x-o.x,dy=y-o.y;if(['barrel','planter','crate','well'].includes(o.kind))return Math.hypot(dx,dy+3)<(o.kind==='well'?17:o.kind==='crate'?11:8);if(o.kind==='cart')return Math.abs(dx)<26&&dy>-19&&dy<7;if(o.kind==='bench')return Math.abs(dx)<23&&dy>-10&&dy<5;if(o.kind==='market')return Math.abs(dx)<(o.variant?33:51)&&dy>-17&&dy<5;return false}
export function canWalkWorld(x,y){return onLand(x,y)&&!walls.some(r=>inRect(x,y,r))&&!castleTowers.some(t=>Math.hypot(x-t.x,y-t.y)<28)&&!buildings.some(r=>inRect(x,y,r,7))&&!townTrees.some(t=>Math.hypot(x-t.x,y-t.y)<9*t.s)&&!townObjects.some(o=>objectBlocks(x,y,o))&&Math.hypot(x-WORLD.fountain.x,y-WORLD.fountain.y)>44}
export function canMonsterWalk(x,y){return canWalkWorld(x,y)&&!inTown(x,y)}
export function zoneAt(x,y){if(inTown(x,y))return {id:'town',name:'Bourg-Aurore',subtitle:(contains(castleOutline,x,y)?'Château d’Aurore':y<900?'Port des Marées':x<1800?'Quartier des Tisserands':y>1500?'Bourg des Jardins':'Place du Marché')+' · Zone protégée'};if(x<1050&&y<2200)return {id:'fields',name:'Les champs de Blévent',subtitle:'Moulin & cultures · Niveau 1–3'};if(x>2800&&y<2200||y<570)return {id:'forest',name:'La forêt de Sylve',subtitle:'Sous-bois & clairières · Niveau 2–4'};return {id:'plains',name:'La plaine des rosées',subtitle:'Prairies des slimes · Niveau 1–2'}}
export const citizens=createCitizens(streets,canWalkWorld,inTown);
export function createEnemies(){const spawns=[["slime",1575,2300],["slime",1900,2300],["slime",2190,2280],["slime",2350,2400],["slime",1250,2320],["slime",1800,2490],["scarecrow",765,1140],["scarecrow",570,1545],["scarecrow",780,960],["turnip",680,1600],["turnip",570,1230],["turnip",730,1280],["mushroom",2880,1140],["mushroom",3080,1575],["mushroom",2960,1800],["boar",3000,1185],["boar",2950,800],["boar",3100,800]];return spawns.map(([type,x,y],i)=>({type,x,y,homeX:x,homeY:y,hp:enemyTypes[type].hp,maxHp:enemyTypes[type].hp,phase:i%7,respawn:0,hit:0,attackCooldown:0,facing:'down',dir:1,walk:0,vx:0,vy:0,kx:0,ky:0}))}
let seed=37;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
export const trees=Array.from({length:370},()=>({x:270+random()*3000,y:270+random()*2100,s:.85+random()*.45})).filter(t=>onLand(t.x,t.y)&&!inTown(t.x,t.y)&&canWalkWorld(t.x,t.y)&&((t.x>2750&&Math.abs(t.y-1400)>100)||(t.y<550&&Math.abs(t.x-1800)>110)||(t.x<390)||(t.y>2250&&t.x>2400)));
export const fieldPlots=[
 {"x":420,"y":1065,"w":270,"h":170},
 {"x":740,"y":870,"w":220,"h":260},
 {"x":435,"y":1500,"w":270,"h":200},
 {"x":570,"y":1740,"w":210,"h":190}
];
export const waypoints=[
 {"x":1880,"y":1280,"name":"BOURG-AURORE","color":"#e4d8b3"},
 {"x":700,"y":1400,"name":"CHAMPS DE BLÉVENT","color":"#e7ca84"},
 {"x":2950,"y":1400,"name":"FORÊT DE SYLVE","color":"#a6cfaa"},
 {"x":1800,"y":2470,"name":"PLAINE DES ROSÉES","color":"#bedb9d"}
];
export class WorldRenderer{
 constructor(ctx){this.ctx=ctx;this.base=document.createElement('canvas');this.base.width=WORLD.width;this.base.height=WORLD.height;this.paintBase()}
 r(x,y,w,h,c){this.ctx.fillStyle=c;this.ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 e(x,y,rx,ry,c){this.ctx.fillStyle=c;this.ctx.beginPath();this.ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);this.ctx.fill()}
 text(t,x,y,c='#eee0b9',size=12){this.ctx.font=`${size}px monospace`;this.ctx.textAlign='center';this.ctx.fillStyle='#30443e';this.ctx.fillText(t,x+1,y+1);this.ctx.fillStyle=c;this.ctx.fillText(t,x,y)}
 island(offset=0){const c=this.ctx;c.beginPath();shore.forEach(([x,y],i)=>i?c.lineTo(x,y+offset):c.moveTo(x,y+offset));c.closePath()}
 paintBase(){const original=this.ctx;this.ctx=this.base.getContext('2d');const c=this.ctx;this.r(0,0,WORLD.width,WORLD.height,'#56a7b1');for(let i=0;i<600;i++)this.r(random()*WORLD.width,random()*WORLD.height,10+random()*22,2,'#72b9bf');this.island(17);c.fillStyle='#3d7b7b';c.fill();this.island(6);c.fillStyle='#d3c08d';c.fill();this.island();c.fillStyle='#88ad70';c.fill();c.save();this.island();c.clip();this.e(2920,1200,480,740,'#729b68');this.e(1800,2350,950,310,'#97b878');this.e(720,1350,460,700,'#b3bb7a');
 for(let i=0;i<6500;i++){const x=random()*WORLD.width,y=random()*WORLD.height;this.r(x,y,random()>.6?4:2,2,random()>.5?'#a2be7d':'#789e65')}
 const road=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#a7ad77';c.lineWidth=66;c.lineCap='round';c.lineJoin='round';c.stroke();c.strokeStyle='#d3ca99';c.lineWidth=48;c.stroke()};road([[650,1400],[1044,1400]]);road([[2684,1400],[3000,1400]]);road([[1800,400],[1800,628]]);road([[1800,2132],[1800,2480]]);road([[625,1400],[625,940]]);
 this.paintTownGround();
 for(const f of fieldPlots){this.r(f.x-5,f.y-5,f.w+10,f.h+10,'#9b8554');this.r(f.x,f.y,f.w,f.h,'#886e47');for(let y=f.y+8;y<f.y+f.h;y+=18){this.r(f.x+5,y+7,f.w-10,3,'#a38a55');for(let x=f.x+9;x<f.x+f.w;x+=12){this.r(x,y,2,12,'#bca75d');this.r(x-3,y-3,7,8,'#e4c776');this.r(x-1,y-5,3,10,'#f0d688')}}}
 for(let i=0;i<170;i++){const x=200+random()*1950,y=200+random()*1350;if(!inTown(x,y)){this.r(x,y,2,5,'#5d935b');this.r(x-2,y-2,6,3,i%3?'#f2db92':'#d2a3d3')}}this.poly(bay,'#619ca3');for(let i=0;i<120;i++){const x=950+this.hash(i,3)*2300,y=this.hash(i,5)*620;if(contains(bay,x,y))this.r(x,y,12+i%16,2,'#83b3b4')}this.paintDocks();c.restore();this.ctx=original;
 }
 paintTownGround(){
 const c=this.ctx,t=WORLD.town,left=t.x,top=t.y,right=t.x+t.w,bottom=t.y+t.h;
 c.save();c.beginPath();townOutline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();this.r(left,top,right-left,bottom-top,'#859566');
 for(let i=0;i<9000;i++){const x=left+this.hash(i,7)*(right-left),y=top+this.hash(i,11)*(bottom-top);this.r(x,y,i%3?2:4,2,i%2?'#9daa73':'#778d61')}
 // Small planted borders soften the street-facing courtyards and block corners.
 for(const b of buildings.filter(b=>b.kind!=='castle'&&b.kind!=='mill')){const x=b.x-21,y=b.y+b.h-20;this.r(x,y,16,47,'#6e8057');for(let i=0;i<17;i++){const px=x+this.hash(i,b.x)*13,py=y+this.hash(i,b.y)*42;this.r(px,py,5,4,i%2?'#83995a':'#9aa66c');if(i%4===0)this.r(px+1,py-2,2,3,i%3?'#d5b68c':'#b5a8bd')}}
 const paths=[...streets,...entrancePaths.map(p=>({...p,width:18}))];
 const courts=[{x:WORLD.fountain.x,y:WORLD.fountain.y,rx:145,ry:118},{points:castleOutline},...buildings.filter(b=>b.kind!=='mill').map(b=>({x:b.x-8,y:b.y+b.h-5,w:b.w+16,h:29}))];
 paintConnectedPavement(c,{x:left,y:top,w:t.w,h:t.h},paths,courts);
 // Doorsteps share the paving phase; only the raised step gets an individual shadow.
 for(const b of buildings){this.r(b.x+b.w/2-19,b.y+b.h+8,38,7,'#70796555');this.r(b.x+b.w/2-17,b.y+b.h+8,34,3,'#c7bea0')}
 for(const t of townTrees){this.e(t.x,t.y-1,34*t.s,21*t.s,'#657d53');for(let i=0;i<30;i++){const a=i*2.4,r=14+this.hash(i,t.x)*20;this.r(t.x+Math.cos(a)*r,t.y+Math.sin(a)*r*.6,3,2,i%4?'#9ea96b':'#c2b580')}}
 c.restore();
 }
 paintDocks(){
 for(const d of docks){this.r(d.x+5,d.y+7,d.w,d.h,'#365f5c40');this.r(d.x,d.y,d.w,d.h,'#755e43');if(d.h>d.w){for(let y=d.y+2;y<d.y+d.h;y+=9){this.r(d.x+2,y,d.w-4,7,'#b49a69');this.r(d.x+4,y+1,d.w-9,1,'#d3bc87')}for(let y=d.y+10;y<d.y+d.h;y+=45){this.r(d.x-3,y,5,7,'#5e5640');this.r(d.x+d.w-2,y,5,7,'#5e5640')}}else{for(let x=d.x+2;x<d.x+d.w;x+=10){this.r(x,d.y+2,8,d.h-4,'#b49a69');this.r(x+1,d.y+4,1,d.h-9,'#d3bc87')}}}
 for(const b of boats){const c=this.ctx;c.save();c.translate(b.x,b.y);c.rotate(b.angle);this.poly([[-15,-30],[13,-30],[20,14],[0,34],[-20,14]],'#674f3c');this.poly([[-11,-25],[9,-25],[14,12],[0,27],[-14,12]],'#c0a16b');this.r(-3,-25,5,49,'#745e43');this.poly([[1,-21],[1,17],[22,12]],'#e0d6b3');this.r(-13,-5,27,4,'#8c7653');c.restore()}
 }
 castle(b){const {x,y,w,h}=b;this.poly([[x+w,y+10],[x+w+25,y+30],[x+w+25,y+h+18],[x+10,y+h+18]],'#263b3438');this.r(x,y,w,h,'#7e8c80');for(let row=0;row<h;row+=12)for(let col=0;col<w;col+=24){this.r(x+col+1,y+row+1,22,10,(row+col)%36?'#a3ac96':'#b7baa0');this.r(x+col+1,y+row+1,22,2,'#cfccb0')}
 this.r(x+14,y+22,w-28,8,'#738477');this.r(x+18,y+h-43,w-36,9,'#6d7d70');this.poly([[x-13,y+5],[x+30,y-65],[x+w-30,y-65],[x+w+13,y+5]],'#596d7a');for(let ry=y-60;ry<y;ry+=8)this.r(x+25,ry,w-50,2,'#8b9a99');this.r(x-10,y+2,w+20,7,'#c1bea0');
 for(const dx of [35,w-56]){this.r(x+dx,y+50,20,46,'#4c625c');this.e(x+dx+10,y+50,10,10,'#4c625c');this.r(x+dx+8,y+48,3,43,'#a0b9ac')}
 const door=x+w/2;this.r(door-24,y+h-65,48,65,'#54685d');this.e(door,y+h-65,24,23,'#54685d');this.r(door-18,y+h-64,36,64,'#7e6648');for(let i=0;i<5;i++)this.r(door-16+i*7,y+h-62,2,59,'#b69b64');this.r(door-18,y+h-30,36,4,'#505b46');this.r(door-8,y-124,5,60,'#6a7056');this.poly([[door-3,y-121],[door+39,y-112],[door-3,y-96]],'#8a6673');this.text('Château d’Aurore',door,y+h+33,'#e8d8ad',13);
 }
 tower(t){const{x,y}=t;this.e(x+7,y+7,31,18,'#243d353d');this.r(x-27,y-61,54,64,'#829080');for(let row=0;row<6;row++){this.r(x-25,y-58+row*10,50,2,'#b4bba1');for(let col=0;col<3;col++)this.r(x-23+col*18+(row%2?7:0),y-56+row*10,2,7,'#667e6f')}this.e(x,y-63,29,16,'#b9bea2');this.e(x,y-64,21,10,'#768777');for(const dx of [-25,-9,9])this.r(x+dx,y-78,13,15,'#a8b39a');this.r(x-4,y-41,8,19,'#496257')
 }
 hash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v)}
 poly(points,color){const c=this.ctx;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
 building(b,time){
 if(b.kind==='castle'){this.castle(b);return}
 const {x,y,w,h}=b,c=this.ctx,roofHeight=b.gable?64:46,eave=y+20,roofTop=eave-roofHeight,wood='#665140',dark='#443e34',plaster=b.plaster||'#d9c6a0';
 // Cast shadows fall consistently to the south-east.
 this.poly([[x+w,y+15],[x+w+26,y+28],[x+w+26,y+h+14],[x+10,y+h+14],[x,y+h]],'#283d3138');
 this.r(x,y,w,h,wood);this.r(x+6,y+6,w-12,h-9,plaster);this.r(x+w-13,y+6,9,h-9,'#00000018');
 // Stone foundation with offset joints and weathering.
 for(let row=0;row<3;row++)for(let bx=x+(row%2)*-7;bx<x+w;bx+=18){const left=Math.max(x,bx),width=Math.min(x+w,bx+16)-left;if(width>0){this.r(left,y+h-22+row*7,width,6,row%2?'#8e8c76':'#a09a81');this.r(left,y+h-22+row*7,width,1,'#c3b697')}}
 for(const bx of [x+5,x+w*.47,x+w-11]){this.r(bx,y+8,6,h-23,wood);this.r(bx+1,y+8,2,h-23,'#9b805b')}
 this.r(x+5,y+39,w-10,6,wood);this.r(x+5,y+43,w-10,2,'#9e8560');
 // Diagonal half-timber braces.
 c.strokeStyle=wood;c.lineWidth=5;for(const side of [0,1]){const left=x+9+side*w*.5;c.beginPath();c.moveTo(left,y+44);c.lineTo(left+w*.32,y+72);c.stroke()}
 const doorX=x+w*(b.kind==='inn'?.62:w<90?.67:.5)-13,doorY=y+h-46;
 this.r(doorX-4,doorY-4,34,49,'#b4a17b');this.r(doorX-1,doorY-3,28,49,dark);this.e(doorX+13,doorY,13,9,dark);this.r(doorX+2,doorY,22,44,'#765a3d');for(let i=0;i<4;i++)this.r(doorX+3+i*5,doorY+3,1,38,'#9d7b4d');this.r(doorX+3,doorY+12,20,3,'#4e4939');this.r(doorX+3,doorY+32,20,3,'#4e4939');this.r(doorX+18,doorY+23,3,3,'#e2bb68');
 const winY=y+Math.max(24,Math.min(50,h-38));for(const wx of w>110?[x+15,x+w-41]:[x+7])this.window(wx,winY,b.kind==='magic',b.id.length,w>110?22:16,Math.min(25,h-25));
 if(h>120){this.window(x+22,y+91,true,2);this.window(x+w-46,y+91,true,3)}
 // Deep eaves and a tiled roof with individual shaded terracotta/slate shingles.
 this.r(x-10,eave+1,w+20,9,dark);this.r(x-11,eave,w+22,4,'#9c835b');
 const peak=b.gable?x+w*.52:x+w*.78;
 const outline=[[x-13,eave],[x-5,roofTop+9],[peak,roofTop-12],[x+w+8,roofTop+9],[x+w+13,eave]];
 c.save();c.beginPath();outline.forEach(([a,z],i)=>i?c.lineTo(a,z):c.moveTo(a,z));c.closePath();c.clip();this.r(x-15,roofTop-12,w+30,roofHeight+36,b.roof);
 for(let row=0,ry=roofTop-12;ry<eave;row++,ry+=7)for(let rx=x-16-(row%2)*7;rx<x+w+20;rx+=14){const v=this.hash(rx,ry);this.r(rx+1,ry+1,12,5,v>.6?'#ffffff16':v<.25?'#00000020':'#ffffff05');this.r(rx+1,ry+1,12,1,'#ffffff25');this.r(rx+2,ry+6,12,1,'#302f2f44');if(v>.93)this.r(rx+3,ry+2,6,3,'#7f8d5266')}
 c.restore();c.strokeStyle='#514b3d';c.lineWidth=3;c.beginPath();outline.forEach(([a,z],i)=>i?c.lineTo(a,z):c.moveTo(a,z));c.closePath();c.stroke();
 if(b.gable){const gx=x+w*.52;this.poly([[gx-30,eave+3],[gx,roofTop+1],[gx+31,eave+3]],'#cabc95');c.strokeStyle=wood;c.lineWidth=5;c.beginPath();c.moveTo(gx-32,eave+3);c.lineTo(gx,roofTop-2);c.lineTo(gx+33,eave+3);c.stroke();this.r(gx-3,roofTop+7,6,eave-roofTop-4,wood);this.r(gx-26,eave-6,52,5,wood);this.window(gx-10,eave-28,b.kind==='magic',1,18,23)}
 else{this.r(x+w*.3,roofTop+13,30,28,'#5b5849');this.poly([[x+w*.3-5,roofTop+14],[x+w*.3+15,roofTop-1],[x+w*.3+35,roofTop+14]],'#656c5a');this.window(x+w*.3+6,roofTop+18,false,1,17,18)}
 // Chimneys, hanging shop signs, flower boxes and awnings make each frontage different.
 if(b.kind!=='magic'){const cx=x+w-25;this.r(cx,roofTop-25,16,34,'#857e6b');for(let row=0;row<5;row++){this.r(cx+1,roofTop-24+row*6,14,1,'#c2b49b');this.r(cx+(row%2?8:4),roofTop-23+row*6,1,4,'#655f54')}this.r(cx-3,roofTop-29,22,6,'#c2b49b');this.r(cx+2,roofTop-28,12,2,'#4c4e43')}
 if(b.kind==='forge'||b.kind==='inn'||b.kind==='bakery'){const aw=x+10,ay=y+h-56,awidth=w-20;for(let i=0;i<Math.ceil(awidth/12);i++){const color=i%2?'#e0cd9f':b.kind==='forge'?'#ac7756':'#87966c';this.r(aw+i*12,ay,Math.min(12,awidth-i*12),14,color);this.r(aw+i*12,ay+14,Math.min(12,awidth-i*12),5,i%2?'#c9b990':'#697d57')}this.r(aw-1,ay-2,awidth+2,3,wood)}
 if(b.kind==='magic'){const tx=x+w-25;this.r(tx,roofTop-47,23,64,'#8e8e91');for(let i=0;i<8;i++)this.r(tx,roofTop-45+i*8,23,1,'#c2bfa6');this.poly([[tx-8,roofTop-45],[tx+11,roofTop-82],[tx+32,roofTop-45]],'#5b6485');this.r(tx+8,roofTop-27,7,15,'#b2d5cc');this.r(tx+4,roofTop-1,16,4,'#687178');this.e(x+19,eave+18,9,9,'#95c7b8');this.text('✦',x+19,eave+22,'#f2dda4',15);for(let i=0;i<3;i++)this.r(tx+8+Math.sin(time+i)*9,roofTop-86-((time*8+i*12)%25),2,2,'#d7cced')}
 if(b.kind==='forge'){const cx=x+w-17;for(let i=0;i<4;i++)this.e(cx+Math.sin(time+i)*9,roofTop-42-((time*11+i*13)%50),5+i,3+i,'#c0c2aa3b')}
 if(b.kind==='mill'){const cx=x+w/2,cy=y-16;c.save();c.translate(cx,cy);c.rotate(time*.36);for(let i=0;i<4;i++){c.rotate(Math.PI/2);this.r(-4,0,8,95,'#695845');this.r(4,18,22,70,'#d7cfac');for(let k=25;k<88;k+=14)this.r(4,k,22,3,'#ad9a76')}c.restore();this.e(cx,cy,9,9,'#8e7654')}
 if(b.name)this.text(b.name,x+w/2,y+h+31,'#ead8aa',10);
 }
 window(x,y,magic=false,variant=0,w=24,h=27){this.r(x-3,y-3,w+6,h+6,'#6a5840');this.r(x,y,w,h,'#3d5f5c');this.r(x+2,y+2,w-4,h-5,magic?'#9bbfaf':'#a9b8a0');this.r(x+3,y+3,Math.max(3,w/2-4),h-8,magic?'#c1c9cb':'#d7cca1');this.r(x+w/2-1,y,3,h,'#786b4f');this.r(x,y+h/2, w,2,'#786b4f');this.r(x-6,y+1,4,h-1,'#7a8460');this.r(x+w+2,y+1,4,h-1,'#7a8460');this.r(x-4,y+h+2,w+8,5,'#a28759');for(let i=0;i<6;i++){this.r(x-2+i*5,y+h-1,5,4,i%2?'#527451':'#6f8c56');this.r(x+i*5,y+h-3,2,3,['#d7ae99','#e4ca86','#abacc9'][(i+variant)%3])}}
 wall(w){const c=this.ctx;this.r(w.x+8,w.y+8,w.w+12,w.h+8,'#253b3038');this.r(w.x,w.y-20,w.w,w.h+20,'#6e7b67');for(let row=0,y=w.y-18;y<w.y+w.h;y+=9,row++)for(let x=w.x-(row%2)*12;x<w.x+w.w;x+=25){const bx=Math.max(w.x,x),width=Math.min(w.x+w.w,x+23)-bx;if(width>0){const v=this.hash(x,y);this.r(bx,y,width,7,v>.6?'#a2a58a':'#8e967c');this.r(bx,y,width,1,'#bdbaa0');if(v>.83)this.r(bx+2,y+4,Math.max(2,width/2),2,'#6e825b')}}this.r(w.x,w.y-24,w.w,6,'#c2bda0');for(let x=w.x;x<w.x+w.w;x+=26){this.r(x,w.y-33,15,11,'#9ea68a');this.r(x,w.y-33,15,2,'#d0c7a5')}
 }
 fountain(time){const {x,y}=WORLD.fountain;this.e(x+8,y+14,55,30,'#34453538');this.e(x,y+5,49,29,'#737f73');this.e(x,y,49,27,'#bbb89b');this.e(x,y-3,40,20,'#4e8c92');this.e(x,y-5,36,16,'#79b4b4');for(let i=0;i<12;i++){const a=i*Math.PI/6;this.r(x+Math.cos(a)*43-5,y+Math.sin(a)*23-4,10,7,i%3?'#c5bfa1':'#a49f83');this.r(x+Math.cos(a)*43-5,y+Math.sin(a)*23-4,10,1,'#e0d0ad')}this.r(x-7,y-37,14,36,'#9aab9d');this.r(x-4,y-37,4,36,'#d8d8b8');this.e(x,y-38,20,9,'#a5b7aa');this.e(x,y-41,18,6,'#d0d4b3');this.e(x,y-43,11,4,'#89bdb8');this.r(x-3,y-59,6,17,'#aebda6');this.e(x,y-60,6,5,'#d1d4b1');for(let i=0;i<10;i++){const a=i*Math.PI/5,phase=(time*26+i*7)%30;this.r(x+Math.cos(a)*(6+phase*.8),y-42+phase,2,4,'#bfe0ce')}this.e(x+Math.sin(time*2)*7,y+5,13,2,'#c0dcd055')}
 townDetails(time){this.ctx.save();this.ctx.translate(WORLD.fire.x-1200,WORLD.fire.y-965);this.e(1200,966,19,11,'#828c76');this.r(1189,962,23,6,'#79563c');this.r(1194,948+Math.sin(time*10)*2,13,17,'#efac58');this.r(1199,943,5,22,'#ffe092');this.text('Feu de la place',1200,995,'#e9d9a7',9);this.ctx.restore();for(const d of districts)this.text(d.name,d.x,d.y-5,'#e2d3ac',10)}
 object(o,time){const {x,y,kind,variant=0}=o;this.e(x+4,y+3,kind==='cart'?28:13,5,'#30463225');
 if(kind==='barrel'){this.r(x-9,y-23,18,24,'#765c3e');this.r(x-11,y-19,22,17,'#9d7a4e');for(let i=0;i<5;i++)this.r(x-9+i*4,y-19,1,16,'#c19a60');this.r(x-11,y-16,22,3,'#53655b');this.r(x-11,y-5,22,3,'#53655b');this.e(x,y-22,9,4,'#b08b56');this.e(x,y-23,6,2,'#6b5c40')}
 if(kind==='crate'){this.r(x-12,y-22,24,23,'#715b3f');this.r(x-10,y-20,20,18,'#b18b55');for(let k=0;k<4;k++)this.r(x-9+k*5,y-19,1,16,'#806a46');this.r(x-11,y-22,22,3,'#d1ad71');this.r(x-11,y-3,22,3,'#d1ad71');for(let k=0;k<18;k++)this.r(x-9+k,y-19+k,3,2,'#d1ad71')}
 if(kind==='planter'){this.r(x-11,y-12,22,12,'#9f7051');this.r(x-13,y-14,26,4,'#c38e68');this.r(x-9,y-8,3,7,'#d49c6c');for(let i=0;i<13;i++){const a=this.hash(i,x),b=this.hash(i,y);this.r(x-12+a*23,y-25+b*16,6,5,i%3?'#658750':'#8f9b56');if(i%2)this.r(x-10+a*21,y-24+b*12,3,3,['#dfb5a5','#d5c478','#ada6cd'][variant%3])}}
 if(kind==='bench'){this.r(x-22,y-17,45,5,'#a68b57');this.r(x-22,y-10,45,4,'#bd9f65');this.r(x-22,y-5,45,5,'#ae8e56');for(const dx of [-18,16]){this.r(x+dx,y-15,3,22,'#586552');this.r(x+dx-2,y+5,7,3,'#65735d')}}
 if(kind==='lamp'){this.r(x-3,y-39,6,40,'#5a6250');this.r(x-7,y-2,14,4,'#92957a');this.r(x-8,y-55,16,19,'#494f40');this.r(x-5,y-52,10,13,'#d7c580');this.r(x-2,y-51,2,12,'#f0df9d');this.poly([[x-11,y-55],[x,y-65],[x+11,y-55]],'#66715c');this.e(x,y-47,18,21,'#e6d7890b')}
 if(kind==='cart'){this.r(x-27,y-23,48,17,'#8e6c43');this.r(x-27,y-23,48,3,'#c6a46c');for(let i=0;i<5;i++)this.r(x-25+i*10,y-20,2,13,'#b4935b');for(const dx of [-17,16]){this.e(x+dx,y-3,8,8,'#564d38');this.e(x+dx,y-3,5,5,'#b08d58');this.r(x+dx-1,y-10,2,14,'#6c5b40')}this.r(x+21,y-17,22,3,'#8b6c47');for(let i=0;i<8;i++)this.e(x-20+i*5,y-23-(i%2)*4,4,5,i%2?'#c2b278':'#b29d64')}
 if(kind==='well'){this.e(x,y,19,10,'#8b9079');this.e(x,y-8,21,12,'#b1ad8e');this.e(x,y-11,14,7,'#3e6260');this.r(x-23,y-43,4,41,'#846a47');this.r(x+19,y-43,4,41,'#846a47');this.r(x-21,y-40,42,4,'#aa8c56');this.poly([[x-29,y-41],[x,y-62],[x+29,y-41]],'#7d8c6d');this.r(x-1,y-39,2,22,'#c8b88a');this.r(x-5,y-20,10,8,'#9e875b')}
 if(kind==='woodpile'){for(let row=0;row<3;row++)for(let i=0;i<3-row;i++){this.r(x+i*10+row*5-10,y-row*7-5,19,6,'#796046');this.e(x+i*10+row*5+7,y-row*7-2,4,3,'#c0a36c');this.e(x+i*10+row*5+7,y-row*7-2,2,1,'#8e784f')}}
 if(kind==='sign'){this.r(x-13,y-39,3,40,'#715e43');this.r(x-13,y-38,35,3,'#715e43');this.r(x+8,y-36,2,7,'#b1a070');this.r(x-2,y-29,25,20,'#695c43');this.r(x,y-27,21,16,'#b49c68');this.text(['⚒','✦','☀'][variant%3],x+10,y-14,'#f0d49b',14)}
 if(kind==='garden'){this.r(x-7,y-12,14,35,'#796c48');for(let i=0;i<12;i++)this.r(x-4+(i%2)*6,y-10+i*3,5,5,i%3?'#7a9a5c':'#b4b878');for(const yy of [y-16,y+24])this.r(x-10,yy,20,4,'#b2a078')}
 if(kind==='laundry'){this.r(x-28,y-39,3,38,'#88714c');this.r(x+40,y-43,3,42,'#88714c');this.r(x-27,y-37,69,1,'#c4b892');for(let i=0;i<4;i++){this.r(x-19+i*15,y-35,12,17,['#d9c9ab','#98aca1','#b9a5b5','#d9c9ab'][i]);this.r(x-16+i*15,y-35,2,17,'#ffffff18')}}
 if(kind==='market'){const width=variant?65:100,aw=x-width/2;this.r(aw,y-14,width,15,'#71583d');this.r(aw+3,y-12,width-6,4,'#c1a172');for(let i=0;i<width;i+=12){this.r(aw+i,y-57,Math.min(12,width-i),24,i%24?'#dfcca0':variant?'#6f927f':'#b78061');this.r(aw+i,y-34,Math.min(12,width-i),5,i%24?'#bcac87':'#6a7d60')}this.r(aw-1,y-57,width+2,3,'#6a5941');this.r(aw+2,y-31,3,26,'#7f6945');this.r(aw+width-5,y-31,3,26,'#7f6945');for(let i=0;i<Math.floor(width/14);i++){const xx=aw+9+i*14;this.r(xx-6,y-22,12,9,'#99764b');for(let j=0;j<3;j++)this.e(xx-3+j*3,y-23-j%2*3,3,3,['#aab16e','#cf9166','#8f9e68'][i%3])}}
 if(kind==='anvil'){this.r(x-13,y-21,27,7,'#657a75');this.poly([[x-18,y-22],[x+18,y-22],[x+9,y-15],[x-9,y-15]],'#9ba89b');this.r(x-5,y-16,10,13,'#52675f');this.r(x-12,y-3,24,5,'#706e55');this.r(x+12,y-29,3,14,'#8d724c');this.r(x+7,y-31,13,6,'#5d736d')}
 if(kind==='armor'){this.r(x-2,y-35,4,35,'#806b47');this.r(x-10,y-27,20,16,'#a6b5af');this.r(x-6,y-25,3,12,'#d2d5b9');this.r(x-13,y-26,5,8,'#738b82');this.r(x+8,y-26,5,8,'#738b82');this.r(x-7,y-40,14,12,'#b2bca8');this.r(x-5,y-35,10,3,'#425c54');this.r(x-9,y-1,18,3,'#766a4a')}
 if(kind==='crystal'){this.r(x-8,y-9,16,10,'#8d8768');this.poly([[x-6,y-11],[x-9,y-29],[x,y-43],[x+9,y-29],[x+6,y-11]],'#9abfb2');this.poly([[x,y-43],[x+2,y-13],[x+9,y-29]],'#d0ddc7');for(let i=0;i<3;i++)this.r(x+Math.sin(time+i*2)*14,y-24+Math.cos(time+i)*17,2,2,'#e0dbad')}
 if(kind==='banner'){this.r(x,y-58,3,56,'#76694c');this.r(x-4,y-61,12,4,'#c3b58c');this.r(x+3,y-53,15,30,variant%2?'#7c889b':'#a87662');this.poly([[x+3,y-24],[x+18,y-24],[x+10,y-17]],variant%2?'#7c889b':'#a87662');this.r(x+9,y-45,3,13,'#dfca8a');this.r(x+6,y-40,9,3,'#dfca8a')}
 }
 draw(camera,time,actors,drawActor){
 const c=this.ctx;c.save();c.translate(-Math.round(camera.x),-Math.round(camera.y));c.drawImage(this.base,0,0);this.townDetails(time);
 const props=[
 ...castleTowers.map(t=>({x:t.x-35,y:t.y+15,minY:t.y-110,maxY:t.y+20,w:70,draw:()=>this.tower(t)})),
 {x:WORLD.fountain.x-60,y:WORLD.fountain.y+5,minY:WORLD.fountain.y-65,maxY:WORLD.fountain.y+35,w:120,draw:()=>this.fountain(time)},
 ...buildings.map(b=>({x:b.x-25,y:b.y+b.h,minY:b.y-150,maxY:b.y+b.h+35,w:b.w+60,draw:()=>this.building(b,time)})),
 ...walls.map(w=>({x:w.x,y:w.y+w.h,minY:w.y-40,maxY:w.y+w.h+15,w:w.w+25,draw:()=>this.wall(w)})),
 ...[...trees,...townTrees].map(t=>({x:t.x-65,y:t.y,minY:t.y-160,maxY:t.y+15,w:130,draw:()=>this.tree(t)})),
 ...townObjects.map(o=>({x:o.x-65,y:o.y,minY:o.y-85,maxY:o.y+15,w:130,draw:()=>this.object(o,time)})),
 ...actors.map(a=>({x:a.x-40,y:a.y,minY:a.y-80,maxY:a.y+15,w:80,draw:()=>drawActor(a)}))];
 props.sort((a,b)=>a.y-b.y);for(const p of props)if(p.maxY>=camera.y&&p.minY<=camera.y+620&&p.x+p.w>=camera.x&&p.x<=camera.x+960)p.draw();c.restore()
 }
 tree(t){if(t.leaf===undefined){const {x,y,s}=t,c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);this.e(0,4,26,9,'#294e3825');this.r(-5,-32,10,40,'#80664b');for(let i=0;i<4;i++){const w=66-i*12;this.r(-w/2,-40-i*15,w,26,i%2?'#3c7656':'#356c51');this.r(-w/2+3,-40-i*15,w-12,5,'#65965e')}c.restore();return}
 const {x,y,s}=t,c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);this.e(13,4,43,17,'#2b443437');this.r(-6,-52,13,59,'#65563c');this.r(-3,-50,4,55,'#a68c57');this.r(-13,-32,11,8,'#796848');this.r(7,-42,11,7,'#796848');
 const clusters=[[-27,-54,35,27],[-5,-50,35,25],[-38,-73,35,28],[-18,-83,38,35],[10,-73,31,29],[-15,-101,30,29]];
 for(let i=0;i<clusters.length;i++){const [a,b,w,h]=clusters[i];this.poly([[a+7,b],[a+w-7,b],[a+w-7,b+4],[a+w,b+4],[a+w,b+h-6],[a+w-5,b+h-6],[a+w-5,b+h],[a+6,b+h],[a+6,b+h-4],[a,b+h-4],[a,b+5],[a+7,b+5]],['#3d6847','#517b4c','#62874e','#789655'][i%4]);this.r(a+5,b-4,w-10,5,'#698b4d');this.r(a+4,b+4,w-8,5,'#8ba75d');for(let j=0;j<50;j++){const u=this.hash(i*57+j,x),v=this.hash(j*31,y+i);this.r(a+u*(w-4),b+v*(h-4),j%4?3:5,2,['#9fb56a','#779955','#4f7a48','#b4bd76'][j%4])}}c.restore()}
 map(canvas,player,mode='city'){
 const c=canvas.getContext('2d'),view=mode==='city'?{x:730,y:430,w:2120,h:1770}:{x:0,y:0,w:WORLD.width,h:WORLD.height},scale=Math.min(canvas.width/view.w,canvas.height/view.h),ox=(canvas.width-view.w*scale)/2,oy=(canvas.height-view.h*scale)/2;
 c.fillStyle='#243b3c';c.fillRect(0,0,canvas.width,canvas.height);c.save();c.translate(ox,oy);c.scale(scale,scale);c.translate(-view.x,-view.y);c.drawImage(this.base,0,0);
 c.strokeStyle='#626e61';c.lineWidth=15;c.beginPath();castleOutline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();for(const t of castleTowers){c.fillStyle='#6f7b6b';c.beginPath();c.arc(t.x,t.y,23,0,Math.PI*2);c.fill()}
 for(const b of buildings){c.fillStyle=b.roof;c.fillRect(b.x,b.y,b.w,b.h);c.strokeStyle='#5d624d';c.lineWidth=2;c.strokeRect(b.x,b.y,b.w,b.h)}
 const labels=mode==='city'?[{x:2020,y:590,name:'PORT DES MARÉES'},{x:1090,y:1830,name:'CHÂTEAU D’AURORE'},{x:1900,y:1115,name:'PLACE DU MARCHÉ'},{x:1510,y:960,name:'TISSERANDS'},{x:2260,y:1510,name:'BOURG EST'}]:waypoints;
 for(const p of labels){c.font=`bold ${mode==='city'?32:48}px sans-serif`;c.textAlign='center';c.fillStyle='#f2e5bf';c.strokeStyle='#40584c';c.lineWidth=6;c.strokeText(p.name,p.x,p.y-30);c.fillText(p.name,p.x,p.y-30)}
 c.fillStyle='#fff0b6';c.beginPath();c.arc(player.x,player.y,12/scale*.25,0,Math.PI*2);c.fill();c.strokeStyle='#344f47';c.lineWidth=4;c.stroke();c.restore()
 }

}

export function lineOfSight(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(d/8);for(let i=1;i<steps;i++)if(!canWalkWorld(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true}

export function houseEntrance(b){return {x:b.x+b.w*(b.kind==='inn'?.62:b.w<90?.67:.5),y:b.y+b.h+16}}
function entranceDetour(door,candidates){const step=10,queue=[door],parents=[-1],seen=new Set(['0,0']);for(let i=0;i<queue.length&&i<12000;i++){const p=queue[i],target=candidates.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<15&&canWalkWorld(t.x,t.y)&&lineOfSight(p,t));if(target){const path=[[target.x,target.y]];for(let j=i;j>=0;j=parents[j])path.push([queue[j].x,queue[j].y]);return path.reverse().filter((p,i,a)=>i===0||i===a.length-1||Math.abs((p[0]-a[i-1][0])*(a[i+1][1]-p[1])-(p[1]-a[i-1][1])*(a[i+1][0]-p[0]))>.1)}for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const n={x:p.x+dx,y:p.y+dy},key=Math.round((n.x-door.x)/step)+','+Math.round((n.y-door.y)/step);if(seen.has(key)||Math.hypot(n.x-door.x,n.y-door.y)>420||!canWalkWorld(n.x,n.y)||!lineOfSight(p,n))continue;seen.add(key);queue.push(n);parents.push(i)}}return []}
export const entrancePaths=buildings.filter(b=>b.kind!=='mill').map(b=>{const door=houseEntrance(b);const candidates=streets.flatMap(s=>s.points).map(([x,y])=>({x,y})).sort((a,z)=>Math.hypot(a.x-door.x,a.y-door.y)-Math.hypot(z.x-door.x,z.y-door.y));for(const offset of [[0,0],[65,0],[-65,0],[90,20],[-90,20],[0,35]]){const turn={x:door.x+offset[0],y:door.y+offset[1]};if(!canWalkWorld(turn.x,turn.y)||!lineOfSight(door,turn))continue;const target=candidates.find(p=>Math.hypot(p.x-door.x,p.y-door.y)<400&&canWalkWorld(p.x,p.y)&&lineOfSight(turn,p));if(target)return {id:b.id,points:offset[0]||offset[1]?[[door.x,door.y],[turn.x,turn.y],[target.x,target.y]]:[[door.x,door.y],[target.x,target.y]]}}return {id:b.id,points:entranceDetour(door,candidates)}});

// Deployment must also work on a one-person-wide pier or castle passage.
export function deploymentPositions(player,count=2){const occupied=[player],positions=[];for(let i=0;i<count;i++){const preferred=[{x:player.x+(i?22:-22),y:player.y+20}];for(let radius=20;radius<=80;radius+=10)for(let a=0;a<16;a++)preferred.push({x:player.x+Math.cos(a*Math.PI/8)*radius,y:player.y+Math.sin(a*Math.PI/8)*radius});const p=preferred.find(p=>canWalkWorld(p.x,p.y)&&lineOfSight(player,p)&&occupied.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>=15))||{x:player.x,y:player.y};positions.push(p);occupied.push(p)}return positions}

// Pocket trees occupy leftover green corners, with pedestrian routes and doors reserved.
const streetTrees=[];
for(let y=860;y<1830;y+=54)for(let x=1220;x<2520;x+=54){if(!inTown(x,y)||contains(castleOutline,x,y)||!canWalkWorld(x,y))continue;if(Math.hypot(x-WORLD.fountain.x,y-WORLD.fountain.y)<82)continue;if(buildings.some(b=>x>b.x-34&&x<b.x+b.w+34&&y>b.y-12&&y<b.y+b.h+32))continue;if(npcs.some(n=>Math.hypot(x-n.x,y-n.y)<35))continue;const nearStreet=streets.some(s=>s.points.some((p,i)=>i&&distanceToSegment(x,y,s.points[i-1],p)<95));if(!nearStreet||streets.some(s=>s.points.some((p,i)=>i&&distanceToSegment(x,y,s.points[i-1],p)<s.width/2+20)))continue;if(entrancePaths.some(s=>s.points.some((p,i)=>i&&distanceToSegment(x,y,s.points[i-1],p)<18)))continue;streetTrees.push({x,y,s:.68,leaf:streetTrees.length%2})}
streetTrees.sort((a,b)=>Math.hypot(a.x-WORLD.spawn.x,a.y-WORLD.spawn.y)-Math.hypot(b.x-WORLD.spawn.x,b.y-WORLD.spawn.y));
let planted=0;for(const t of streetTrees){if(planted>=12)break;if(townTrees.some(n=>Math.hypot(t.x-n.x,t.y-n.y)<90))continue;townTrees.push(t);planted++}
