// Original pixel art, drawn once for the terrain and sorted by depth for the trees.
const seed = (x,y,n=0) => { const v=Math.sin(x*127.1+y*311.7+n*74.7)*43758.5453;return v-Math.floor(v); };
const poly=(ctx,points,fill,stroke)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
function oval(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function barrel(g,x,y){oval(g,x+2,y+2,9,3,'#75683f44');g.fillStyle='#6c5138';g.fillRect(x-6,y-12,12,13);g.fillStyle='#ab8151';g.fillRect(x-5,y-12,9,12);for(let dx=-3;dx<5;dx+=3){g.fillStyle='#775836';g.fillRect(x+dx,y-10,1,10);}g.fillStyle='#cab185';g.fillRect(x-6,y-9,12,2);g.fillRect(x-6,y-2,12,2);oval(g,x,y-12,6,3,'#d2b58a');oval(g,x,y-12,4,1,'#9a784d');}
function crate(g,x,y){g.fillStyle='#604a34';g.fillRect(x-9,y-18,19,19);g.fillStyle='#ad8757';g.fillRect(x-8,y-17,17,17);for(let dx=-5;dx<=6;dx+=4){g.fillStyle='#89663f';g.fillRect(x+dx,y-15,1,14);}g.strokeStyle='#d0ae75';g.strokeRect(x-7.5,y-16.5,15,15);g.beginPath();g.moveTo(x-7,y-16);g.lineTo(x+7,y-2);g.stroke();}
function flowers(g,x,y){g.fillStyle='#667839';g.fillRect(x-5,y,11,3);for(let i=0;i<4;i++){const xx=x-4+i*3;g.fillStyle='#798b40';g.fillRect(xx,y-5-(i%2)*2,1,6);g.fillStyle=i%2?'#efe7b4':'#d6ad78';g.fillRect(xx-1,y-7-(i%2)*2,3,2);g.fillStyle='#d3bd6e';g.fillRect(xx,y-6-(i%2)*2,1,1);}}
function bush(g,x,y,s=1){oval(g,x+3,y+2,11*s,4*s,'#65703755');for(let i=0;i<25;i++){const a=seed(x,y,i)*6.28,r=seed(y,x,i)*10*s;g.fillStyle=['#6c813b','#839344','#9ca74c','#b7b960'][Math.floor(seed(x,i,y)*4)];g.fillRect(Math.round(x+Math.cos(a)*r)-3,Math.round(y-7+Math.sin(a)*r*.6)-3,6,5);}}
function fence(g,x1,x2,y){g.fillStyle='#6f5238';g.fillRect(x1,y-13,x2-x1,3);g.fillRect(x1,y-5,x2-x1,3);g.fillStyle='#c2a376';g.fillRect(x1,y-14,x2-x1,1);g.fillRect(x1,y-6,x2-x1,1);for(let x=x1;x<=x2;x+=21){g.fillStyle='#725239';g.fillRect(x-2,y-20,5,24);g.fillStyle='#be9a67';g.fillRect(x-1,y-19,3,22);g.fillStyle='#e0c18e';g.fillRect(x-2,y-20,5,2);}}
function tree(g,x,y,size=1){
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(size,size);
  oval(g,9,3,22,6,'#5a653142');
  poly(g,[[-5,2],[-3,-38],[4,-38],[5,2],[9,5],[1,4],[-7,6]],'#d3c7a0','#807b53');
  g.fillStyle='#e8dcba';g.fillRect(-2,-33,3,35);for(const yy of [-29,-19,-9]){g.fillStyle='#8b8766';g.fillRect(-4,yy,3,2);g.fillRect(1,yy+4,3,1);}
  for(let i=0;i<95;i++){
    const angle=seed(x,y,i)*6.28,r=Math.sqrt(seed(y,x,i))*24;
    const xx=Math.round(Math.cos(angle)*r),yy=Math.round(-43+Math.sin(angle)*r*.79);
    const light=yy< -44?1:0;
    g.fillStyle=['#647234','#7d8939','#99a044','#b2b254','#c9c36a'][Math.min(4,Math.floor(seed(i,x,y)*4)+light)];
    g.fillRect(xx-4,yy-3,8,6);g.fillRect(xx-2,yy-5,4,9);
    if(i%7===0){g.fillStyle='#d8cf83';g.fillRect(xx-3,yy-3,3,2);}
  }
  g.restore();
}
function roofPlane(g,corners,rows,columns,dark){
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const t0=row/rows,t1=(row+1)/rows,u0=col/columns,u1=(col+1)/columns;
    const l0=lerp(corners[0],corners[3],t0),r0=lerp(corners[1],corners[2],t0),l1=lerp(corners[0],corners[3],t1),r1=lerp(corners[1],corners[2],t1);
    const points=[lerp(l0,r0,u0),lerp(l0,r0,u1),lerp(l1,r1,u1),lerp(l1,r1,u0)].map(([x,y])=>[Math.round(x),Math.round(y)]);
    const palette=dark?['#747267','#828174','#908d7e']:['#929388','#a3a294','#b2ad99'];
    poly(g,points,palette[(row*7+col*3)%3],'#665d4b');
    g.strokeStyle=dark?'#a49c83':'#c5bba2';g.beginPath();g.moveTo(points[0][0]+1,points[0][1]+1);g.lineTo(points[1][0]-1,points[1][1]+1);g.stroke();
  }
}
function house(g){
  oval(g,115,111,64,10,'#5f633841');
  g.fillStyle='#66503a';g.fillRect(57,62,105,47);
  for(let y=65;y<108;y+=7)for(let x=59;x<160;x+=13){const offset=((y-65)/7)%2?6:0;g.fillStyle=['#b4a98b','#c3b695','#a69e82'][(x+y)%3];g.fillRect(x+offset,y,12,6);}
  g.fillStyle='#b99a69';g.fillRect(67,62,86,23);for(let x=70;x<151;x+=8){g.fillStyle='#d1b082';g.fillRect(x,65,1,18);}
  for(const x of [62,99,153]){g.fillStyle='#705135';g.fillRect(x,61,5,46);g.fillStyle='#bc9765';g.fillRect(x,61,1,46);}g.fillStyle='#745339';g.fillRect(62,83,96,4);
  for(const x of [74,129]){g.fillStyle='#684d35';g.fillRect(x-2,69,19,16);g.fillStyle='#55716d';g.fillRect(x,71,14,11);g.strokeStyle='#d8b97f';g.beginPath();g.moveTo(x,71);g.lineTo(x+14,82);g.moveTo(x+14,71);g.lineTo(x,82);g.moveTo(x+7,71);g.lineTo(x+7,82);g.stroke();}
  g.fillStyle='#62462f';g.fillRect(103,82,18,27);g.fillStyle='#af8555';g.fillRect(105,83,14,25);for(let x=108;x<120;x+=4){g.fillStyle='#88623d';g.fillRect(x,84,1,24);}g.fillStyle='#e1bc72';g.fillRect(115,97,2,2);
  poly(g,[[48,63],[78,17],[111,5],[111,34],[72,72]],'#79776a','#65503a');
  roofPlane(g,[[78,17],[111,5],[111,34],[48,63]],6,4,false);
  roofPlane(g,[[111,5],[149,24],[173,65],[111,34]],6,4,true);
  poly(g,[[72,65],[111,32],[151,65]],'#bda477','#715136');
  g.strokeStyle='#765138';g.lineWidth=3;g.beginPath();g.moveTo(73,65);g.lineTo(111,32);g.lineTo(151,65);g.moveTo(111,35);g.lineTo(111,63);g.stroke();g.lineWidth=1;
  g.fillStyle='#735338';g.fillRect(103,48,17,16);g.fillStyle='#536c67';g.fillRect(106,51,11,10);g.fillStyle='#d9b77e';g.fillRect(111,51,1,10);
  g.fillStyle='#68513c';g.fillRect(80,12,12,16);g.fillStyle='#b1aa8d';g.fillRect(81,11,10,15);g.fillStyle='#d0c5a3';g.fillRect(78,9,16,4);g.fillStyle='#6c6352';g.fillRect(81,9,10,1);
  g.fillStyle='#8a8063';g.fillRect(98,109,30,4);g.fillStyle='#c6b48b';g.fillRect(97,108,30,3);g.fillRect(94,112,36,3);
  barrel(g,55,108);crate(g,160,109);g.fillStyle='#927043';g.fillRect(74,100,20,6);flowers(g,83,100);
}
export function createEnvironment(){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;const g=canvas.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;
  const water=g.createLinearGradient(0,0,640,400);water.addColorStop(0,'#397e87');water.addColorStop(.5,'#4d9293');water.addColorStop(1,'#34757f');g.fillStyle=water;g.fillRect(0,0,640,400);
  for(let i=0;i<900;i++){const x=Math.floor(seed(i,31)*640),y=Math.floor(seed(i,32)*400);g.fillStyle=i%3===0?'#97c0b155':'#75a9a32b';g.fillRect(x,y,3+Math.floor(seed(i,33)*6),1);}
  const land=[[13,42],[42,38],[63,42],[88,36],[144,40],[180,37],[220,43],[263,38],[310,40],[365,36],[420,41],[480,37],[540,41],[594,36],[626,44],[633,100],[628,180],[634,250],[628,320],[633,389],[580,394],[510,391],[440,396],[370,391],[300,394],[230,390],[160,394],[90,390],[10,391],[6,330],[12,260],[6,180],[10,110]];
  poly(g,land,'#8b8963','#c4c5a0');g.save();g.clip();
  g.fillStyle='#a9af50';g.fillRect(0,0,640,400);
  for(let i=0;i<18000;i++){const x=Math.floor(seed(i,2)*640),y=Math.floor(seed(i,3)*400),v=seed(i,4);g.fillStyle=v<.3?'#9ba347':v<.65?'#b3b65b':'#a2a94b';g.fillRect(x,y,v>.9?3:2,1);}
  // One continuous dirt surface with worn, irregular grass borders.
  const paths=[[[110,116],[110,160],[160,177],[270,183],[328,169],[435,179],[580,179]],[[321,176],[316,240],[324,300],[300,324],[192,320],[190,298]],[[324,249],[397,247],[475,257],[562,281]]];
  const drawPath=(points,width,color)=>{g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){g.quadraticCurveTo(...points[i],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);}g.lineTo(...points.at(-1));g.stroke();};
  paths.forEach(path=>{drawPath(path,28,'#919648');drawPath(path,25,'#d1be87');drawPath(path,20,'#d9c791');});
  const clearing=Array.from({length:38},(_,i)=>{const angle=i/38*Math.PI*2,r=.94+seed(i,35)*.1;return[502+Math.cos(angle)*100*r,259+Math.sin(angle)*65*r];});
  poly(g,clearing,'#b4ac67');poly(g,clearing.map(([x,y])=>[502+(x-502)*.98,259+(y-259)*.97]),'#d5c28b');
  for(let i=0;i<2400;i++){const x=Math.floor(seed(i,18)*640),y=Math.floor(seed(i,19)*400);const pixel=g.getImageData(x,y,1,1).data;if(pixel[0]>185&&pixel[1]>155&&pixel[2]<160){g.fillStyle=seed(i,20)>.5?'#bfae7a':'#e1cf9e';g.fillRect(x,y,2,1);}}
  for(let i=0;i<2000;i++){const x=Math.floor(seed(i,38)*620+10),y=Math.floor(seed(i,39)*330+60);const p=g.getImageData(x,y,1,1).data,n=g.getImageData(x+3,y+2,1,1).data;if(p[0]>185&&p[2]<160&&n[0]<183&&n[1]>130){g.fillStyle='#a2a84c';g.fillRect(x,y,2,2);g.fillRect(x+1,y-2,1,3);}}
  // Tufts, tiny daisies and stones, with plenty of clear ground around the fighters.
  for(let i=0;i<240;i++){const x=Math.round(seed(i,22)*620+10),y=Math.round(seed(i,23)*350+42);if((x>390&&y>150&&y<338)||(x<170&&y<130))continue;const pixel=g.getImageData(x,y,1,1).data;if(pixel[0]>185)continue;g.fillStyle='#8c9840';g.fillRect(x,y,1,3);g.fillRect(x-2,y-1,1,3);g.fillRect(x+2,y,1,2);if(i%4===0){g.fillStyle='#f0e8bc';g.fillRect(x-1,y-3,3,2);g.fillStyle='#cfb26a';g.fillRect(x,y-2,1,1);}}
  for(const[x,y]of[[24,100],[621,130],[22,351],[610,371]]){poly(g,[[x-6,y],[x-5,y-8],[x+2,y-11],[x+7,y-4],[x+6,y+1]],'#aaa58b','#7c7b59');g.fillStyle='#d2c7a1';g.fillRect(x-3,y-7,5,2);}
  g.restore();
  // Cliff chips are outside the walkable ground.
  for(let x=16;x<628;x+=12){g.fillStyle='#6f7d72';g.fillRect(x,392,10,6);g.fillStyle='#b2b69a';g.fillRect(x,391,10,2);g.fillStyle='#cee0be';g.fillRect(x+2,398,8,1);}
  fence(g,15,47,57);fence(g,177,620,55);fence(g,16,107,386);fence(g,375,622,386);
  house(g);
  // Market workbench and fabric awning.
  oval(g,194,294,35,8,'#68673e33');g.fillStyle='#705035';g.fillRect(159,257,4,39);g.fillRect(219,257,4,39);
  poly(g,[[151,262],[162,243],[219,243],[230,262]],'#d7c799','#795d3d');
  for(let i=0;i<8;i++){g.fillStyle=i%2?'#ded1a6':'#7e9b8b';g.fillRect(153+i*9,254,9,9);g.fillRect(160+i*7,245,7,9);}
  g.fillStyle='#6c4d31';g.fillRect(157,280,66,7);g.fillRect(160,287,4,11);g.fillRect(216,287,4,11);g.fillStyle='#be9864';g.fillRect(157,279,66,3);for(let x=160;x<222;x+=9){g.fillStyle='#8d6940';g.fillRect(x,280,1,4);}
  g.fillStyle='#b7bba0';g.fillRect(175,274,24,3);g.fillStyle='#79593b';g.fillRect(182,270,3,11);g.fillStyle='#d7bd77';g.fillRect(179,273,10,2);
  barrel(g,237,294);crate(g,147,296);crate(g,142,281);barrel(g,187,67);crate(g,207,68);
  // Seating, firewood and signposts around the village.
  for(const[x,y]of[[203,122],[246,320]]){g.fillStyle='#6f5135';g.fillRect(x-13,y,4,10);g.fillRect(x+10,y,4,10);g.fillStyle='#c3a374';g.fillRect(x-17,y-1,34,4);g.fillRect(x-17,y-10,34,5);g.fillStyle='#947244';g.fillRect(x-17,y-6,34,1);}
  for(let i=0;i<4;i++){g.fillStyle='#795738';g.fillRect(40,130+i*4,18,4);oval(g,58,132+i*4,2,2,'#c4a16c');}
  for(const[x,y,text]of[[139,138,'VILLAGE'],[218,312,'ATELIER'],[406,325,'PRAIRIE']]){g.fillStyle='#705238';g.fillRect(x-1,y-4,3,18);g.fillStyle='#a78451';g.fillRect(x-17,y-8,37,10);g.fillStyle='#d0b47d';g.fillRect(x-16,y-8,34,1);g.fillStyle='#4d4932';g.font='5px monospace';g.textAlign='center';g.fillText(text,x+1,y-1);}
  for(const[x,y]of[[69,132],[151,132],[244,278],[357,215],[357,348],[270,91],[575,99],[74,342]])flowers(g,x,y);
  for(const[x,y]of[[23,88],[198,64],[260,61],[414,58],[473,62],[605,90],[15,260],[34,390],[247,394],[595,392],[625,290]])bush(g,x,y,1);
  const props=[[5,118,1.05],[207,63,.9],[258,56,.9],[410,58,.95],[473,60,1],[625,112,1.05],[4,290,1],[18,397,1.1],[252,399,1],[590,398,1.1],[637,324,1.05]].map(([x,y,size])=>({x,y,draw(ctx){tree(ctx,x,y,size);}}));
  return {ground:canvas,props};
}
