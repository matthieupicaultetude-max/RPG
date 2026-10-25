// Steering shared by creatures and heroes; randomness is chosen per decision, not per frame.
export function face(entity,dx,dy){if(Math.hypot(dx,dy)<.01)return;entity.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');if(Math.abs(dx)>.01)entity.dir=dx<0?-1:1;}
export function move(entity,dx,dy,canWalk){const x=entity.x,y=entity.y;if(canWalk(x+dx,y+dy)){entity.x+=dx;entity.y+=dy}else{if(canWalk(x+dx,entity.y))entity.x+=dx;if(canWalk(entity.x,y+dy))entity.y+=dy}return Math.hypot(entity.x-x,entity.y-y);}
export function steer(entity,goal,speed,dt,canWalk,neighbors=[]){
 let dx=goal.x-entity.x,dy=goal.y-entity.y,d=Math.hypot(dx,dy),vx=d>3?dx/d*speed:0,vy=d>3?dy/d*speed:0;
 for(const n of neighbors){if(n===entity||n.hp<=0)continue;const sx=entity.x-n.x,sy=entity.y-n.y,sd=Math.hypot(sx,sy);if(sd>0&&sd<28){vx+=sx/sd*(28-sd)*3;vy+=sy/sd*(28-sd)*3}}
 const factor=1-Math.exp(-9*dt);entity.vx=(entity.vx||0)+(vx-(entity.vx||0))*factor;entity.vy=(entity.vy||0)+(vy-(entity.vy||0))*factor;
 const moved=move(entity,entity.vx*dt,entity.vy*dt,canWalk);entity.moving=moved>dt*5;if(entity.moving)face(entity,entity.vx,entity.vy);entity.walk=(entity.walk||0)+moved*.13;
}
export function recoil(entity,source,strength=105){let dx=entity.x-source.x,dy=entity.y-source.y,d=Math.hypot(dx,dy);if(d<.01){dx=1;dy=0;d=1}entity.kx=(entity.kx||0)+dx/d*strength;entity.ky=(entity.ky||0)+dy/d*strength;const n=Math.hypot(entity.kx,entity.ky);if(n>180){entity.kx*=180/n;entity.ky*=180/n}entity.hit=.2;}
export function stepRecoil(entity,dt,canWalk){entity.hit=Math.max(0,(entity.hit||0)-dt);move(entity,(entity.kx||0)*dt,(entity.ky||0)*dt,canWalk);const decay=Math.exp(-15*dt);entity.kx=(entity.kx||0)*decay;entity.ky=(entity.ky||0)*decay;}
export function wander(entity,dt,canWalk,random=Math.random){
 entity.wanderTime=(entity.wanderTime??0)-dt;
 if(entity.wanderTime<=0){const angle=random()*Math.PI*2,radius=15+random()*65;entity.wanderGoal={x:entity.homeX+Math.cos(angle)*radius,y:entity.homeY+Math.sin(angle)*radius};entity.wanderTime=1.2+random()*2.5;entity.rest=random()<.3?.5+random()*.8:0;if(!canWalk(entity.wanderGoal.x,entity.wanderGoal.y))entity.wanderGoal={x:entity.homeX,y:entity.homeY}}
 entity.rest=Math.max(0,(entity.rest||0)-dt);steer(entity,entity.rest>0?entity:entity.wanderGoal,20+(entity.phase||0)*1.4,dt,canWalk);
}
export function burst(x,y,color,random=Math.random,count=11){return Array.from({length:count},()=>{const a=random()*Math.PI*2,s=30+random()*85;return {particle:true,x,y:y-13,vx:Math.cos(a)*s,vy:Math.sin(a)*s-35,life:.28+random()*.3,color,size:random()>.65?3:2}})}
export function stepParticle(p,dt){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=170*dt;p.vx*=Math.exp(-3*dt);}
