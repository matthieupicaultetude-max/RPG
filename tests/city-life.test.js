import test from 'node:test';
import assert from 'node:assert/strict';
import {pavingPixel,PAVING_TILE} from '../src/pavement.js';
import {createCitizens,stepCitizens} from '../src/citizens.js';
import {streets,canWalkWorld,inTown,buildings} from '../src/world.js';
test('paving and curb pixels repeat seamlessly across both axes and negative origins',()=>{for(const curb of [false,true])for(let y=-9;y<90;y++)for(let x=-13;x<130;x+=7){assert.deepEqual(pavingPixel(x,y,curb),pavingPixel(x+PAVING_TILE.width,y,curb));assert.deepEqual(pavingPixel(x,y,curb),pavingPixel(x,y+PAVING_TILE.height,curb))}});
test('additional houses have street frontages in the existing town',()=>{const infill=buildings.filter(b=>b.street);assert.ok(infill.length>=20);for(const b of infill)assert.ok(streets.some(s=>s.name===b.street))});
test('residents patrol, face their movement and stay on walkable routes over a minute',()=>{const people=createCitizens(streets,canWalkWorld,inTown),starts=people.map(n=>({x:n.x,y:n.y}));assert.ok(people.length>=20);let moving=new Set();for(let i=0;i<1800;i++){stepCitizens(people,1/30,canWalkWorld);people.forEach((n,j)=>{assert.ok(canWalkWorld(n.x,n.y),n.id);assert.ok(inTown(n.x,n.y),n.id+' left town');assert.ok(['left','right','up','down'].includes(n.facing));if(Math.hypot(n.x-starts[j].x,n.y-starts[j].y)>30)moving.add(j)})}assert.ok(moving.size>=people.length*.8)});
test('a resident stops and faces the player during a nearby conversation',()=>{const [n]=createCitizens(streets,canWalkWorld,inTown),start={x:n.x,y:n.y};stepCitizens([n],.1,canWalkWorld,{x:n.x-20,y:n.y});assert.equal(n.x,start.x);assert.equal(n.y,start.y);assert.equal(n.moving,false);assert.equal(n.facing,'left')});
