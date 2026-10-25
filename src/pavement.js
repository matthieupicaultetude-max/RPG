// Periodic pixel textures; every surface uses the same world-space origin.
export const PAVING_TILE={width:96,height:64};
const mod=(n,d)=>((n%d)+d)%d;
export function pavingPixel(x,y,curb=false){
 x=mod(Math.floor(x),96);y=mod(Math.floor(y),64);
 const row=Math.floor(y/8),sx=mod(x+(row%2)*6,96),col=Math.floor(sx/12),px=sx%12,py=y%8;
 const seed=(col*31+row*17+col*row*7)%13;
 const mortar=curb?[102,106,89]:[100,111,98];
 if(px===0||py===0||(px===11&&py===7))return [...mortar,255];
 const tone=curb?178+seed:145+seed*2;
 const light=py===1?14:py===7?-16:px===1?5:0;
 const grain=(x*17+y*13)%19===0?-7:0;
 return [tone+light+grain,tone+light+grain+(curb?-3:4),tone+light+grain-(curb?20:11),255];
}
export function pavingTile(curb=false){const tile=document.createElement('canvas');tile.width=96;tile.height=64;const ctx=tile.getContext('2d'),pixels=ctx.createImageData(96,64);for(let y=0;y<64;y++)for(let x=0;x<96;x++)pixels.data.set(pavingPixel(x,y,curb),(y*96+x)*4);ctx.putImageData(pixels,0,0);return tile}
export function paintConnectedPavement(ctx,bounds,paths,courts=[]){
 const {x,y,w,h}=bounds;
 // One union mask per layer prevents borders crossing at road junctions.
 for(const curb of [true,false]){
  const layer=document.createElement('canvas');layer.width=w;layer.height=h;const c=layer.getContext('2d');c.translate(-x,-y);c.strokeStyle='#fff';c.fillStyle='#fff';c.lineCap='round';c.lineJoin='round';
  for(const path of paths){if(path.points.length<2)continue;c.lineWidth=path.width+(curb?10:0);c.beginPath();path.points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke()}
  for(const court of courts){c.beginPath();if(court.points){court.points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath()}else if(court.rx){c.ellipse(court.x,court.y,court.rx+(curb?5:0),court.ry+(curb?5:0),0,0,Math.PI*2)}else c.rect(court.x-(curb?5:0),court.y-(curb?5:0),court.w+(curb?10:0),court.h+(curb?10:0));c.fill()}
  c.globalCompositeOperation='source-in';c.fillStyle=c.createPattern(pavingTile(curb),'repeat');c.fillRect(x,y,w,h);ctx.drawImage(layer,x,y);
 }
}
