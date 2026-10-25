// Hand-authored from the supplied town plan. Coordinates refer to its 439 × 443 drawing.
export const PLAN_SCALE=6;
export const fromPlan=(x,y)=>({x:600+x*PLAN_SCALE,y:150+y*PLAN_SCALE});
export const polygon=points=>points.map(([x,y])=>{const p=fromPlan(x,y);return [p.x,p.y]});
export function contains(points,x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside}return inside}
export const townOutline=polygon([[96,74],[188,70],[243,80],[293,83],[309,128],[347,146],[327,191],[312,245],[329,291],[288,311],[226,314],[183,332],[129,313],[83,280],[29,266],[25,173],[72,146],[88,111]]);
export const bay=[[840,0],[3400,0],[3400,140],[3150,370],[2820,550],[2400,660],[2040,620],[1740,582],[1440,650],[1140,630],[1020,450],[900,210]];
export const castleOutline=polygon([[43,178],[77,158],[112,193],[130,237],[88,267],[46,256]]);
export const castleGate=fromPlan(123,220);
export const castleTowers=castleOutline.map(([x,y])=>({x,y}));
export const docks=[{x:1970,y:475,w:24,h:225},{x:2135,y:495,w:24,h:205},{x:2290,y:510,w:24,h:190},{x:2445,y:535,w:24,h:165},{x:1700,y:674,w:850,h:28}];
export const boats=[{x:2040,y:470,angle:.1},{x:2370,y:505,angle:-.2},{x:2650,y:540,angle:.4}];
export const streetPlans=[
 {name:'Quai des Marées',width:38,points:[[98,95],[137,90],[187,89],[225,98],[263,104],[290,108]]},
 {name:'Rue Haute',width:36,points:[[90,146],[113,134],[140,118],[168,112],[192,117],[205,141],[204,180]]},
 {name:'Rue des Tisserands',width:34,points:[[120,84],[126,108],[139,139],[158,168],[177,196],[192,226],[211,253]]},
 {name:'Rue du Marché',width:42,points:[[102,170],[120,167],[148,151],[178,142],[199,143],[204,180]]},
 {name:'Rue des Artisans',width:36,points:[[136,246],[151,231],[180,214],[209,195],[230,182],[257,174],[286,179],[310,169],[337,157]]},
 {name:'Montée du Château',width:42,points:[[124,220],[146,205],[174,188],[198,176],[204,180]]},
 {name:'Couronne du Bourg',width:38,points:[[204,180],[245,175],[264,188],[279,207],[280,231],[264,246],[240,247],[225,232],[222,209],[232,194],[252,188]]},
 {name:'Route du Sud',width:42,points:[[204,180],[206,184],[208,210],[218,237],[225,259],[216,279],[194,291],[180,310],[174,333]]},
 {name:'Route de Sylve',width:44,points:[[280,231],[310,250],[350,256],[394,257]]},
 {name:'Chemin du Moulin',width:38,points:[[83,151],[86,142],[94,122],[90,103],[83,88],[69,67],[56,35]]},
 {name:'Rue des Remparts',width:30,points:[[136,246],[126,264],[132,281],[151,292],[176,292],[194,291]]},
 {name:'Cour du Donjon',width:30,points:[[123,220],[113,240],[95,250],[78,245]]}
];
export function distanceToSegment(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/n)):0;return Math.hypot(px-a[0]-dx*t,py-a[1]-dy*t)}
export function rectGap(a,b){return Math.hypot(Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h))}
function intersectsLane(rect,street){for(let i=1;i<street.points.length;i++){const a=street.points[i-1],b=street.points[i];const samples=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/10));for(let j=0;j<=samples;j++){const x=a[0]+(b[0]-a[0])*j/samples,y=a[1]+(b[1]-a[1])*j/samples;const dx=Math.max(0,rect.x-x,x-rect.x-rect.w),dy=Math.max(0,rect.y-y,y-rect.y-rect.h);if(Math.hypot(dx,dy)<street.width/2+10)return true}}return false}
export function makeTownBuildings(streets){
 const structures=[{id:'castle',x:930,y:1400,w:250,h:180,name:'Château d’Aurore',kind:'castle',roof:'#6b8293',plaster:'#a8ab94'}];
 const palette=['#aa7755','#8c8e70','#a26d53','#758b88','#9d8560','#8d7e8c'];
 const lots=[
 ['armor',144,198,112,90,'forge','La Forge du Rempart'],['magic',265,136,105,105,'magic','La Tour des Lucioles'],['inn',287,269,112,85,'inn','Auberge du Soleil'],['weaver',157,130,86,78],['bakery',301,133,80,72,'bakery'],['scribe',226,104,80,78],
 ...[[118,99],[137,99],[156,99],[175,97],[130,122],[149,121],[171,124],[184,142],[140,143],[160,147],[111,145],[103,130],[96,111],[207,97],[246,101],[256,120],[204,123],[231,125],[252,149],[281,157],[303,155],[323,151],[337,149],
 [110,177],[129,173],[151,166],[172,163],[126,195],[147,190],[170,183],[191,179],[137,216],[158,210],[180,204],[201,196],[152,237],[174,229],[194,222],[174,250],[195,245],[113,270],[122,287],[140,278],[154,299],[185,279],[204,266],
 [244,184],[268,181],[289,187],[312,175],[240,208],[292,207],[232,231],[295,232],[246,253],[269,254],[249,274],[280,281],[310,270],[299,291],[324,223],[322,197]].map(([x,y],i)=>['home-'+i,x,y,60+(i%3)*6,58+(i%4)*5])
 ];
 for(let i=0;i<lots.length;i++){const [id,cx,cy,w,h,kind='',name='']=lots[i];let best;
  const offsets=[[0,0],[0,5],[0,-5],[5,0],[-5,0],[7,5],[-7,5],[7,-5],[-7,-5],[0,10],[10,0],[-10,0],[0,-10],[12,8],[-12,8],[12,-8],[-12,-8],[0,16],[16,0],[-16,0]];
  for(const [dx,dy]of offsets){const p=fromPlan(cx+dx,cy+dy),rect={x:Math.round(p.x-w/2),y:p.y-h,w,h};const corners=[[rect.x,rect.y],[rect.x+w,rect.y],[rect.x,rect.y+h],[rect.x+w,rect.y+h]];
   if(!corners.every(([x,y])=>contains(townOutline,x,y)&&!contains(bay,x,y)&&!contains(castleOutline,x,y)))continue;
   if(structures.some(b=>rectGap(rect,b)<18)||streets.some(s=>intersectsLane(rect,s)))continue;const entrance=r=>({x:r.x+r.w*(r.kind==='inn'?.62:r.w<90?.67:.5),y:r.y+r.h+16}),blocks=(r,p)=>p.x>r.x-7&&p.x<r.x+r.w+7&&p.y>r.y-7&&p.y<r.y+r.h+7;const door=entrance({...rect,kind});if(structures.some(b=>blocks(b,door)||blocks(rect,entrance(b))))continue;
   best={id,...rect,name,kind,roof:palette[i%palette.length],plaster:i%2?'#d5c39f':'#ccbd9d',gable:i%3===0};break;
  }
  if(best)structures.push(best);else if(kind)throw new Error('No accessible plot for '+id);
 }
 // Infill parcels front the existing streets; doors and prior entrances stay clear.
 const publicSpots=[[1970,1340,46],[1970,1270,45],[1896,1158,135],[1760,1330,50],[1310,1515,40],[1060,1040,40],[2500,1610,40],[2010,732,40],[1550,1090,40],[2180,1820,40],[2280,1250,40],[1940,1310,40],[2200,1435,30],[2070,1370,45],[2000,1110,35],[2350,1830,35]];
 let infill=0;
 for(const street of streets){if(['Route de Sylve','Chemin du Moulin','Cour du Donjon'].includes(street.name))continue;let next=45;
  for(let segment=1;segment<street.points.length;segment++){const a=street.points[segment-1],b=street.points[segment],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!length)continue;
   while(next<length){const t=next/length,px=a[0]+(b[0]-a[0])*t,py=a[1]+(b[1]-a[1])*t,nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length;
    for(const side of [-1,1]){if(infill>=45)break;const w=54+(infill%3)*6,h=62+(infill%3)*6,offset=street.width/2+12+Math.abs(nx)*w/2+Math.abs(ny)*h/2,rect={x:Math.round(px+side*nx*offset-w/2),y:Math.round(py+side*ny*offset-h/2),w,h};
     const corners=[[rect.x,rect.y],[rect.x+w,rect.y],[rect.x,rect.y+h],[rect.x+w,rect.y+h]];
     if(!corners.every(([x,y])=>contains(townOutline,x,y)&&!contains(bay,x,y)&&!contains(castleOutline,x,y)))continue;
     if(structures.some(b=>rectGap(rect,b)<18)||streets.some(s=>intersectsLane(rect,s)))continue;
     if(publicSpots.some(([x,y,r])=>Math.hypot(Math.max(0,rect.x-x,x-rect.x-w),Math.max(0,rect.y-y,y-rect.y-h))<r))continue;
     const entrance=r=>({x:r.x+r.w*(r.kind==='inn'?.62:r.w<90?.67:.5),y:r.y+r.h+16}),blocks=(r,p)=>p.x>r.x-7&&p.x<r.x+r.w+7&&p.y>r.y-7&&p.y<r.y+r.h+7;
     if(structures.some(b=>blocks(b,entrance(rect))||blocks(rect,entrance(b))))continue;
     structures.push({id:'street-home-'+infill,...rect,name:'',kind:'',street:street.name,roof:palette[infill%palette.length],plaster:infill%2?'#d5c39f':'#c7b992',gable:infill%3===0});infill++;
    }next+=48;
   }next-=length;
  }
 }
 structures.push({id:'mill',x:570,y:735,w:110,h:135,name:'Moulin de Blévent',roof:'#b28762',kind:'mill'});return structures;
}
export function makeCastleWalls(){const walls=[];for(let i=0;i<castleOutline.length;i++){const a=castleOutline[i],b=castleOutline[(i+1)%castleOutline.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/18);for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;if(i===2&&Math.hypot(x-castleGate.x,y-castleGate.y)<65)continue;walls.push({x:Math.round(x-11),y:Math.round(y-11),w:22,h:22})}}return walls}
