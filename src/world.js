export const WORLD={width:2400,height:1800,spawn:{x:1200,y:1010},fire:{x:1200,y:965},town:{x:830,y:590,w:740,h:640}};
export const shore=[[290,170],[700,95],[1120,140],[1480,85],[1960,155],[2200,400],[2290,800],[2220,1240],[2040,1540],[1600,1660],[1200,1725],[740,1650],[330,1470],[125,1130],[100,690],[170,370]];
export const buildings=[
 {id:'armor',x:920,y:690,w:150,h:110,name:'La Forge du Rempart',roof:'#b36d53',kind:'forge'},
 {id:'magic',x:1340,y:690,w:140,h:110,name:'La Tour des Lucioles',roof:'#8c77b3',kind:'magic'},
 {id:'inn',x:920,y:1050,w:145,h:100,name:'Auberge du Soleil',roof:'#ba8065',kind:'inn'},
 {id:'home1',x:1340,y:1050,w:125,h:100,name:'',roof:'#78968e'},
 {id:'home2',x:1100,y:650,w:120,h:90,name:'',roof:'#9a7959'},
 {id:'home3',x:1380,y:970,w:110,h:60,name:'',roof:'#758fa0'},
 {id:'mill',x:380,y:490,w:110,h:135,name:'Moulin de Blévent',roof:'#b28762',kind:'mill'}
];
export const walls=[{x:825,y:585,w:315,h:24},{x:1260,y:585,w:315,h:24},{x:825,y:1210,w:315,h:24},{x:1260,y:1210,w:315,h:24},{x:825,y:585,w:24,h:255},{x:825,y:960,w:24,h:274},{x:1551,y:585,w:24,h:255},{x:1551,y:960,w:24,h:274}];
export const npcs=[
 {id:'marius',name:'Marius',job:'Marchand',x:1030,y:940,shop:'general',color:'#bd9165',dialog:'Toutes les récoltes de vos aventures trouvent preneur ici !'},
 {id:'brune',name:'Brune',job:'Armurière',x:995,y:830,shop:'armor',color:'#b98772',dialog:'Une bonne armure, et vous reviendrez de vos aventures en un seul morceau.'},
 {id:'iris',name:'Iris',job:'Enchanteresse',x:1410,y:830,shop:'magic',color:'#bd9fdf',dialog:'Des capes tissées de lumière et des bâtons pour vos mages.'},
 {id:'elio',name:'Élio',job:'Garde',x:1195,y:1170,color:'#8aaec0',dialog:'Au sud, les slimes occupent la plaine. Les remparts protègent la ville : aucun monstre ne peut entrer.'},
 {id:'rose',name:'Rose',job:'Fermière',x:890,y:900,color:'#d8ae79',dialog:'À l’ouest, les épouvantails ont pris vie ! Méfiez-vous aussi des navets près du moulin.'},
 {id:'lina',name:'Lina',job:'Herboriste',x:1510,y:900,color:'#91ba88',dialog:'À l’est s’étend la forêt de Sylve. Les sangliers et les champignons y défendent leur territoire.'},
 {id:'noe',name:'Noé',job:'Villageois',x:1280,y:1025,color:'#d5b093',dialog:'La fontaine est notre point de rendez-vous. Le feu de la place soigne toute votre compagnie.',roam:35},
 {id:'alma',name:'Alma',job:'Villageoise',x:1120,y:1090,color:'#d5a5b7',dialog:'Bienvenue à Bourg-Aurore ! Les échoppes sont au nord, l’auberge au sud.',roam:28}
];
export const enemyTypes={slime:{name:'Gelée des prés',hp:60,damage:8,loot:'jelly',color:'#87d58d'},scarecrow:{name:'Épouvantail éveillé',hp:90,damage:11,loot:'straw',color:'#d9b976'},turnip:{name:'Navet farouche',hp:65,damage:9,loot:'root',color:'#e3bbd4'},mushroom:{name:'Champignon sylvestre',hp:75,damage:10,loot:'spore',color:'#e69679'},boar:{name:'Sanglier des bois',hp:105,damage:13,loot:'fur',color:'#a18b77'}};
export function inTown(x,y){return x>849&&x<1551&&y>609&&y<1210}
export function onLand(x,y){let inside=false;for(let i=0,j=shore.length-1;i<shore.length;j=i++){const [xi,yi]=shore[i],[xj,yj]=shore[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside}return inside}
function inRect(x,y,r,pad=9){return x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad}
export function canWalkWorld(x,y){return onLand(x,y)&&!walls.some(r=>inRect(x,y,r))&&!buildings.some(r=>inRect(x,y,r,7))&&Math.hypot(x-1200,y-850)>31}
export function canMonsterWalk(x,y){return canWalkWorld(x,y)&&!inTown(x,y)}
export function zoneAt(x,y){if(x>=825&&x<=1575&&y>=585&&y<=1234)return {id:'town',name:'Bourg-Aurore',subtitle:'Ville fortifiée · Zone protégée'};if(x<825&&y<1250)return {id:'fields',name:'Les champs de Blévent',subtitle:'Moulin & cultures · Niveau 1–3'};if(x>1575&&y<1260||y<585)return {id:'forest',name:'La forêt de Sylve',subtitle:'Sous-bois & clairières · Niveau 2–4'};return {id:'plains',name:'La plaine des rosées',subtitle:'Prairies des slimes · Niveau 1–2'}}
export function createEnemies(){const spawns=[['slime',1050,1410],['slime',1250,1430],['slime',1450,1380],['slime',1520,1510],['slime',830,1430],['slime',1170,1580],['scarecrow',510,760],['scarecrow',380,1030],['scarecrow',670,630],['turnip',620,1040],['turnip',380,820],['turnip',640,800],['mushroom',1790,760],['mushroom',1920,1050],['mushroom',1740,1120],['boar',2000,790],['boar',1780,500],['boar',1450,390]];return spawns.map(([type,x,y],i)=>({type,x,y,homeX:x,homeY:y,hp:enemyTypes[type].hp,maxHp:enemyTypes[type].hp,phase:i%7,respawn:0,hit:0,attackCooldown:0,facing:'down',dir:1,walk:0,vx:0,vy:0,kx:0,ky:0}))}
let seed=37;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
export const trees=Array.from({length:200},()=>({x:180+random()*2000,y:180+random()*1400,s:.85+random()*.45})).filter(t=>onLand(t.x,t.y)&&!inTown(t.x,t.y)&&canWalkWorld(t.x,t.y)&&((t.x>1650&&Math.abs(t.y-900)>85)||(t.y<510&&Math.abs(t.x-1200)>95)||(t.x<260)||(t.y>1480&&t.x>1600)));
export const fieldPlots=[{x:280,y:710,w:210,h:130},{x:540,y:580,w:170,h:200},{x:290,y:1000,w:210,h:150},{x:550,y:1000,w:170,h:150}];
export const waypoints=[{x:1200,y:900,name:'BOURG-AURORE',color:'#e4d8b3'},{x:490,y:900,name:'CHAMPS DE BLÉVENT',color:'#e7ca84'},{x:1850,y:900,name:'FORÊT DE SYLVE',color:'#a6cfaa'},{x:1200,y:1450,name:'PLAINE DES ROSÉES',color:'#bedb9d'}];
export class WorldRenderer{
 constructor(ctx){this.ctx=ctx;this.base=document.createElement('canvas');this.base.width=WORLD.width;this.base.height=WORLD.height;this.paintBase()}
 r(x,y,w,h,c){this.ctx.fillStyle=c;this.ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 e(x,y,rx,ry,c){this.ctx.fillStyle=c;this.ctx.beginPath();this.ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);this.ctx.fill()}
 text(t,x,y,c='#eee0b9',size=12){this.ctx.font=`${size}px monospace`;this.ctx.textAlign='center';this.ctx.fillStyle='#30443e';this.ctx.fillText(t,x+1,y+1);this.ctx.fillStyle=c;this.ctx.fillText(t,x,y)}
 island(offset=0){const c=this.ctx;c.beginPath();shore.forEach(([x,y],i)=>i?c.lineTo(x,y+offset):c.moveTo(x,y+offset));c.closePath()}
 paintBase(){const original=this.ctx;this.ctx=this.base.getContext('2d');const c=this.ctx;this.r(0,0,2400,1800,'#56a7b1');for(let i=0;i<600;i++)this.r(random()*2400,random()*1800,10+random()*22,2,'#72b9bf');this.island(17);c.fillStyle='#3d7b7b';c.fill();this.island(6);c.fillStyle='#d3c08d';c.fill();this.island();c.fillStyle='#88ad70';c.fill();c.save();this.island();c.clip();this.e(1890,720,420,550,'#729b68');this.e(1200,1450,620,230,'#97b878');this.e(480,850,320,480,'#b3bb7a');
 for(let i=0;i<6500;i++){const x=random()*2400,y=random()*1800;this.r(x,y,random()>.6?4:2,2,random()>.5?'#a2be7d':'#789e65')}
 const road=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#a7ad77';c.lineWidth=66;c.lineCap='round';c.lineJoin='round';c.stroke();c.strokeStyle='#d3ca99';c.lineWidth=48;c.stroke()};road([[350,900],[1200,900],[1980,900]]);road([[1200,370],[1200,900],[1200,1580]]);road([[440,900],[440,650]]);
 this.r(850,610,700,600,'#a8b18d');for(let y=615;y<1210;y+=16)for(let x=850+(y%32?8:0);x<1540;x+=22){this.r(x,y,20,14,'#b0b89a');this.r(x,y,20,2,'#bcc2a7')}
 this.r(1158,610,84,600,'#d4c79f');this.r(850,865,700,72,'#d4c79f');this.e(1200,880,104,82,'#c9c5a2');
 for(const f of fieldPlots){this.r(f.x-5,f.y-5,f.w+10,f.h+10,'#9b8554');this.r(f.x,f.y,f.w,f.h,'#886e47');for(let y=f.y+8;y<f.y+f.h;y+=18){this.r(f.x+5,y+7,f.w-10,3,'#a38a55');for(let x=f.x+9;x<f.x+f.w;x+=12){this.r(x,y,2,12,'#bca75d');this.r(x-3,y-3,7,8,'#e4c776');this.r(x-1,y-5,3,10,'#f0d688')}}}
 for(let i=0;i<170;i++){const x=200+random()*1950,y=200+random()*1350;if(!inTown(x,y)){this.r(x,y,2,5,'#5d935b');this.r(x-2,y-2,6,3,i%3?'#f2db92':'#d2a3d3')}}c.restore();this.ctx=original;
 }
 building(b,time){const {x,y,w,h}=b;this.e(x+w/2,y+h+7,w*.6,15,'#294e3828');this.r(x,y,w,h,'#d2c09a');this.r(x+8,y+5,w-16,h-5,'#e2d2ac');this.r(x,y,w,7,'#735c48');this.r(x+7,y,7,h,'#8b7357');this.r(x+w-14,y,7,h,'#8b7357');this.r(x,y+h-12,w,12,'#a48b69');this.r(x+w/2-13,y+h-42,26,42,'#725b48');this.r(x+w/2+5,y+h-22,3,3,'#deca87');for(const wx of [x+24,x+w-44]){this.r(wx,y+35,22,24,'#607f82');this.r(wx+3,y+38,16,15,b.kind==='magic'?'#b3b0de':'#a0c5ba');this.r(wx+10,y+36,3,20,'#8b7357')}
 for(let row=0;row<5;row++){const width=w+24-row*12;this.r(x-12+row*6,y-8-row*8,width,10,b.roof);this.r(x-12+row*6,y-8-row*8,width,2,'#ffffff20');for(let tx=x-6+row*6;tx<x+w-row*6;tx+=20)this.r(tx,y-7-row*8,2,8,'#00000012')}
 if(b.kind==='magic'){this.r(x+w-28,y-70,19,65,'#a8a2bd');this.r(x+w-34,y-78,31,11,'#716196');this.e(x+w/2,y-25,13,13,'#bda4e2');this.text('✦',x+w/2,y-20,'#f4ddae',19)}
 if(b.kind==='forge'){this.r(x+15,y-60,20,62,'#8b8173');this.r(x+11,y-62,28,8,'#afa18a');for(let i=0;i<3;i++)this.e(x+24+Math.sin(time+i)*6,y-98-((time*10+i*15)%42),7,5,'#c4c4ae55');this.r(x+w+8,y+h-18,28,8,'#64797b');this.r(x+w+14,y+h-11,14,15,'#4f6265')}
 if(b.kind==='mill'){const cx=x+w/2,cy=y-16;this.ctx.save();this.ctx.translate(cx,cy);this.ctx.rotate(time*.36);for(let i=0;i<4;i++){this.ctx.rotate(Math.PI/2);this.r(-4,0,8,95,'#695845');this.r(4,18,22,70,'#d7cfac');for(let k=25;k<88;k+=14)this.r(4,k,22,3,'#ad9a76')}this.ctx.restore();this.e(cx,cy,9,9,'#8e7654')}
 if(b.name)this.text(b.name,x+w/2,y+h+23,'#efe3b9',11);
 }
 wall(w){this.r(w.x,w.y+5,w.w,w.h,'#6d8076');this.r(w.x,w.y-19,w.w,w.h,'#a3ad93');this.r(w.x,w.y-22,w.w,5,'#c0c5a8');for(let x=w.x;x<w.x+w.w;x+=23)for(let y=w.y-17;y<w.y+w.h-4;y+=12)this.r(x,y,20,2,'#859681');for(let x=w.x;x<w.x+w.w;x+=29)this.r(x,w.y-31,16,12,'#b6bea2')}
 townDetails(time){this.e(1200,858,46,26,'#859a91');this.e(1200,850,40,23,'#bcc4ab');this.e(1200,847,32,17,'#7dbac1');this.r(1194,818,12,31,'#cbd1b7');this.e(1200,818,15,7,'#dde1c7');for(let i=0;i<8;i++){const a=i*Math.PI/4;this.r(1200+Math.cos(a)*22,827+Math.sin(a)*10+Math.sin(time*4+i)*3,2,6,'#b2e1db')}
 this.e(1200,966,19,11,'#828c76');this.r(1189,962,23,6,'#79563c');this.r(1194,948+Math.sin(time*10)*2,13,17,'#efac58');this.r(1199,943,5,22,'#ffe092');this.text('Feu de la place',1200,998,'#e9d9a7',10);
 this.r(980,922,95,19,'#98704e');for(let i=0;i<6;i++){this.r(976+i*17,880,17,30,i%2?'#e9d5a8':'#b97e6d');this.r(976+i*17,907,17,6,i%2?'#d0bd93':'#a86559')}this.r(981,908,4,26,'#74553e');this.r(1070,908,4,26,'#74553e');
 for(const [x,y] of [[1090,750],[1300,750],[1090,1100],[1300,1100]]){this.r(x,y-22,4,28,'#7e7151');this.e(x+2,y-27,7,9,'#f1d78a');this.e(x+2,y-27,15,16,'#f3dc8a15')}
 }
 draw(camera,time,actors,drawActor){const c=this.ctx;c.save();c.translate(-Math.round(camera.x),-Math.round(camera.y));c.drawImage(this.base,0,0);this.townDetails(time);const props=[...buildings.map(b=>({y:b.y+b.h,draw:()=>this.building(b,time)})),...walls.map(w=>({y:w.y+w.h,draw:()=>this.wall(w)})),...trees.map(t=>({y:t.y,draw:()=>this.tree(t)})),...actors.map(a=>({y:a.y,draw:()=>drawActor(a)}))];props.sort((a,b)=>a.y-b.y);for(const p of props)if(p.y>camera.y-150&&p.y<camera.y+820)p.draw();c.restore()}
 tree(t){const {x,y,s}=t,c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);this.e(0,4,26,9,'#294e3825');this.r(-5,-32,10,40,'#80664b');for(let i=0;i<4;i++){const w=66-i*12;this.r(-w/2,-40-i*15,w,26,i%2?'#3c7656':'#356c51');this.r(-w/2+3,-40-i*15,w-12,5,'#65965e')}c.restore()}
 map(canvas,player){const c=canvas.getContext('2d'),s=canvas.width/WORLD.width;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(this.base,0,0,canvas.width,canvas.height);c.save();c.scale(s,s);c.fillStyle='#bfc6a4';for(const w of walls)c.fillRect(w.x,w.y,w.w,w.h);for(const b of buildings){c.fillStyle=b.roof;c.fillRect(b.x,b.y,b.w,b.h)}c.fillStyle='#4f805b';for(const t of trees)c.fillRect(t.x-9,t.y-20,18,24);for(const p of waypoints){c.font='bold 48px sans-serif';c.textAlign='center';c.fillStyle='#203e3a';c.fillText(p.name,p.x,p.y-100)}c.fillStyle='#fff6cd';c.beginPath();c.arc(player.x,player.y,18,0,Math.PI*2);c.fill();c.strokeStyle='#4e5340';c.lineWidth=5;c.stroke();c.restore()}
}

export function lineOfSight(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(d/8);for(let i=1;i<steps;i++)if(!canWalkWorld(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true}
