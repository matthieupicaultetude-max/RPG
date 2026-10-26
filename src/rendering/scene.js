import { viewport } from './viewport.js';
import { guidedTarget, ATTACK_RANGE } from '../combat/attacks.js';
import { COLORS, canStand } from '../dev/sandbox.js';

export function createRenderer(canvas) {
  const frame = document.createElement('canvas');
  frame.width = 640; frame.height = 400;
  const ctx = frame.getContext('2d');
  const screen = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const ground = document.createElement('canvas'); ground.width = 640; ground.height = 400;
  const g = ground.getContext('2d');
  g.fillStyle = '#6d925e'; g.fillRect(0, 0, 640, 400);
  for (let y = 0; y < 400; y += 4) for (let x = 0; x < 640; x += 4) {
    const seed = (x * 13 + y * 37) % 97;
    g.fillStyle = seed < 48 ? '#789d65' : '#5f8655'; g.fillRect(x + seed % 4, y + seed % 3, 2, 1);
  }
  // World-anchored paving: all paths share the same stone grid.
  for (let y = 65; y < 390; y += 6) for (let x = 20; x < 625; x += 10) {
    const xx = x + (y % 12 ? 5 : 0);
    if ((y > 155 && y < 197) || (xx > 90 && xx < 127 && y < 310) || (xx > 300 && xx < 337) || (y > 308 && y < 340 && xx < 335)) {
      g.fillStyle = (x + y) % 3 ? '#b3ae8a' : '#c0b994'; g.fillRect(xx, y, 9, 5);
    }
  }
  g.fillStyle = '#7f8054'; g.fillRect(393, 206, 202, 135);
  g.fillStyle = '#b4a879'; g.fillRect(397, 210, 194, 127);
  for (let y = 214; y < 335; y += 8) for (let x = 401; x < 590; x += 8) {
    g.fillStyle = (x + y) % 3 ? '#bbae80' : '#c5b888'; g.fillRect(x, y, 2, 1);
  }
  function tree(x, y, size = 1) {
    g.fillStyle = '#426746'; g.fillRect(x - 13 * size, y, 29 * size, 7 * size);
    g.fillStyle = '#715238'; g.fillRect(x - 3, y - 15, 6, 22);
    g.fillStyle = '#335e45'; g.fillRect(x - 20 * size, y - 43 * size, 40 * size, 30 * size);
    g.fillRect(x - 13 * size, y - 52 * size, 28 * size, 42 * size);
    g.fillStyle = '#477a50'; g.fillRect(x - 15 * size, y - 45 * size, 26 * size, 25 * size);
    g.fillStyle = '#659252'; g.fillRect(x - 10 * size, y - 44 * size, 18 * size, 8 * size);
  }
  for (const [x,y] of [[23,82],[205,80],[244,64],[415,74],[462,66],[602,88],[30,280],[45,372],[248,376],[591,380],[622,289]]) tree(x,y);
  // Boundary fence.
  g.fillStyle = '#8b7550'; g.fillRect(12, 50, 616, 3); g.fillRect(12, 58, 616, 3);
  for (let x = 12; x < 633; x += 24) { g.fillStyle = '#d2b480'; g.fillRect(x, 45, 4, 20); g.fillStyle = '#92744f'; g.fillRect(x + 3, 47, 2, 18); }
  // Home with layered tiled roof and small entry.
  g.fillStyle = '#466443'; g.fillRect(51, 104, 123, 12);
  g.fillStyle = '#c7b38a'; g.fillRect(59, 62, 100, 46);
  g.fillStyle = '#6b5141'; for (const x of [59,103,153]) g.fillRect(x, 65, 5, 43);
  g.fillRect(59, 84, 100, 4);
  g.fillStyle = '#3d5157'; g.fillRect(72, 71, 20, 18); g.fillRect(124, 71, 20, 18);
  g.fillStyle = '#e5cd8d'; g.fillRect(75, 74, 6, 11); g.fillRect(83, 74, 6, 11); g.fillRect(127, 74, 13, 11);
  g.fillStyle = '#514335'; g.fillRect(101, 86, 17, 22);
  g.fillStyle = '#d1b773'; g.fillRect(113, 97, 2, 2);
  for (let row = 0; row < 6; row++) {
    g.fillStyle = row % 2 ? '#875350' : '#a36658'; g.fillRect(49 + row * 4, 61 - row * 6, 120 - row * 8, 6);
    g.fillStyle = '#bd7d60'; for (let x = 53 + row * 4; x < 166 - row * 4; x += 12) g.fillRect(x, 61 - row * 6, 1, 5);
  }
  g.fillStyle = '#ab9a74'; g.fillRect(96, 108, 28, 7);
  // Workshop awning and worktable.
  g.fillStyle = '#644e39'; g.fillRect(159, 257, 4, 37); g.fillRect(218, 257, 4, 37);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ddd0a0' : '#608e8a'; g.fillRect(153 + i * 9, 248, 9, 15); }
  g.fillStyle = '#5e4836'; g.fillRect(157, 279, 64, 8); g.fillRect(161, 286, 5, 12); g.fillRect(212, 286, 5, 12);
  g.fillStyle = '#c0c5b3'; g.fillRect(177, 274, 22, 3); g.fillStyle = '#d9b465'; g.fillRect(181, 270, 3, 10);
  for (const [x,y] of [[70,135],[149,135],[240,278],[358,220],[355,347]]) {
    g.fillStyle = '#6a7151'; g.fillRect(x-6,y,13,6); g.fillStyle = '#4c7949'; g.fillRect(x-7,y-7,14,9);
    g.fillStyle = '#efc882'; g.fillRect(x-3,y-9,3,3); g.fillStyle = '#e5a3ac'; g.fillRect(x+3,y-5,3,3);
  }
  function label(text, x, y) {
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    const width = ctx.measureText(text).width + 12;
    ctx.fillStyle = '#192b2bcb'; ctx.fillRect(x-width/2,y-9,width,14);
    ctx.fillStyle = '#e7e5cb'; ctx.fillText(text,x,y+1);
  }
  function person(p, time, main = false, bot = false, animation = null) {
    const thrust = animation ? Math.sin(Math.min(1,animation.age/.3)*Math.PI)*3 : 0;
    const x=Math.round(p.x + (animation ? Math.cos(animation.angle)*thrust : 0)), y=Math.round(p.y + (animation ? Math.sin(animation.angle)*thrust : 0)), step=p.moving ? Math.sin(time*12+p.x*.02)*1.5 : 0;
    ctx.fillStyle='#344d4377'; ctx.fillRect(x-7,y+2,14,4);
    ctx.fillStyle='#323d46'; ctx.fillRect(x-5,y-2+step,4,6); ctx.fillRect(x+1,y-2-step,4,6);
    ctx.fillStyle=COLORS[p.role]; ctx.fillRect(x-6,y-14,12,13);
    ctx.fillStyle=p.equipment?.Cape ? '#b99ade' : '#506b67'; ctx.fillRect(x-4,y-12,8,10);
    ctx.fillStyle='#e3b98d'; ctx.fillRect(x-4,y-22,8,9);
    ctx.fillStyle=p.equipment?.Coiffe ? '#b1bdc8' : '#594536'; ctx.fillRect(x-5,y-24,10,p.facing==='up'?10:5);
    if(p.facing!=='up') { ctx.fillStyle='#2e383e'; if(p.facing!=='right')ctx.fillRect(x-3,y-18,1,2); if(p.facing!=='left')ctx.fillRect(x+2,y-18,1,2); }
    ctx.fillStyle=p.role==='support'?'#a7dcb1':'#c6c7b5'; ctx.fillRect(x+7,y-13,2,p.role==='ranged'?12:16);
    if(p.role==='support') {ctx.fillStyle='#8cddb5';ctx.fillRect(x+5,y-17,6,6);}
    if(p.equipment?.Bouclier) {ctx.fillStyle='#bbc5af';ctx.fillRect(x-12,y-13,8,12);ctx.fillStyle='#567380';ctx.fillRect(x-11,y-12,6,9);ctx.fillStyle='#d9bd77';ctx.fillRect(x-9,y-11,2,8);}
    if(main) {ctx.strokeStyle='#ead394';ctx.lineWidth=1;ctx.strokeRect(x-9,y-1,18,8);ctx.fillStyle='#eed796';ctx.fillRect(x-2,y-33,5,3);}
    if(p.hp!==undefined) {ctx.fillStyle='#24372f';ctx.fillRect(x-10,y-29,20,2);ctx.fillStyle=p.hp>0?'#91c897':'#cf7970';ctx.fillRect(x-10,y-29,20*p.hp/p.maxHp,2);}
    label(bot?`${p.name} · BOT`:p.name,x,y+16);
  }
  return s => {
    ctx.drawImage(ground,0,0);
    label('MAISON',110,124); label('ATELIER',190,319);label('AIRE DE COMBAT',495,352);label('PROMENADE DES BOTS',320,65);
    [...s.bots.map(p=>({p,bot:true})),...s.team.filter((p,i)=>p.hp>0&&(i===s.main||s.deployed)).map(p=>({p,main:p.id===s.main}))].sort((a,b)=>a.p.y-b.p.y).forEach(({p,main,bot})=>person(p,s.time,main,bot,s.attacks.find(a=>a.owner===p.id && !bot && a.age<.3)));
    for(const m of s.monsters) {
      if(m.hp<=0){label(`Retour ${Math.ceil(m.respawn)}s`,m.homeX,m.homeY);continue;}
      const x=Math.round(m.x), y=Math.round(m.y), bob=Math.round(Math.sin(s.time*4)*1.5);
      ctx.fillStyle='#3c513c66';ctx.fillRect(x-12,y+3,25,5);
      if(m.name==='Slime') {ctx.fillStyle='#4d9c8f';ctx.fillRect(x-12,y-9+bob,24,13);ctx.fillRect(x-8,y-14+bob,16,10);ctx.fillStyle='#8dd7a2';ctx.fillRect(x-8,y-11+bob,13,5);}
      else {ctx.fillStyle='#8b6754';ctx.fillRect(x-14,y-13,27,17);ctx.fillStyle='#b18a68';ctx.fillRect(x-8,y-16,17,8);ctx.fillStyle='#e1ce9f';ctx.fillRect(x-14,y-3,3,5);ctx.fillRect(x+10,y-3,3,5);}
      ctx.fillStyle='#253e38';ctx.fillRect(x-5,y-5,2,3);ctx.fillRect(x+3,y-5,2,3);
      ctx.fillStyle='#3a4538';ctx.fillRect(x-14,y-23,28,3);ctx.fillStyle='#d18e77';ctx.fillRect(x-14,y-23,28*m.hp/m.maxHp,3);label(m.name,x,y+18);
    }
    for (const a of s.attacks) {
      const member = s.team[a.owner];
      const progress = Math.min(1, a.age / .3);
      ctx.save();
      if (a.role === 'melee') {
        ctx.translate(member.x,member.y-10);
        ctx.rotate(a.angle);
        const swing = -1.1 + progress * 2.2;
        ctx.globalAlpha = 1-progress*.7;
        ctx.strokeStyle = '#ffe6a1'; ctx.lineWidth = 3;
        ctx.beginPath();ctx.arc(0,0,29,swing-.6,swing);ctx.stroke();
        ctx.rotate(swing);ctx.fillStyle='#ddbd6e';ctx.fillRect(7,-4,3,8);
        ctx.fillStyle='#f0f4e4';ctx.fillRect(9,-2,25,3);
      } else {
        ctx.translate(a.x,a.y-10);ctx.rotate(a.angle);
        if (a.role==='ranged') {
          ctx.strokeStyle='#b5cce3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(0,0);ctx.stroke();
          ctx.fillStyle='#eedab4';ctx.fillRect(-8,-1,13,2);
          ctx.fillStyle='#e6f3ff';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(0,-3);ctx.lineTo(0,3);ctx.fill();
        } else {
          ctx.shadowColor='#89efc1';ctx.shadowBlur=8;ctx.fillStyle='#68bdad';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#ddffd9';ctx.fillRect(-2,-2,4,4);
          for(let i=1;i<4;i++){ctx.globalAlpha=1-i*.23;ctx.fillRect(-i*6,Math.sin(a.age*20+i)*3,3,3);}
        }
      }
      ctx.restore();
    }
    if (s.aim.active) {
      const guide = guidedTarget(s,s.aim,canStand);
      const target = guide.target;
      const x = target ? target.x : s.aim.x;
      const y = target ? target.y-8 : s.aim.y;
      const color = target ? guide.inRange && guide.clear ? '#ffdf91' : '#e69b83' : '#e4e8ce';
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1;ctx.globalAlpha=.55;
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(s.player.x,s.player.y-10);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      const radius=target?17:5;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
      for(const sign of [-1,1]) {ctx.fillStyle=color;ctx.fillRect(x+sign*(radius+2)-1,y-1,3,2);ctx.fillRect(x-1,y+sign*(radius+2)-1,2,3);}
      if(target) label(!guide.clear?'OBSTACLE':guide.inRange?'CIBLE':'HORS PORTÉE',x,y+35);
      ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(s.player.x,s.player.y-5,ATTACK_RANGE[s.team[s.main].role],0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    for(const e of s.effects){ctx.globalAlpha=Math.min(1,e.life*2);if(e.toX!==undefined){ctx.strokeStyle=e.color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.toX,e.toY);ctx.stroke();}ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillStyle=e.color;if(e.particle)ctx.fillRect(Math.round(e.x),Math.round(e.y),2,2);else ctx.fillText(e.text,e.x,e.y);ctx.globalAlpha=1;}
    const width = Math.round(canvas.clientWidth), height = Math.round(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    screen.imageSmoothingEnabled = false;
    // Fill every viewport without stretching sprites. Follow the player when cropped.
    const view = viewport(width,height,s.player);
    screen.drawImage(frame, view.x, view.y, view.viewWidth, view.viewHeight, 0, 0, width, height);
  };
}
