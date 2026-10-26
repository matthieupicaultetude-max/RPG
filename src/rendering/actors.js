const ROLE_COLOR={melee:'#c0a16d',support:'#9db780',ranged:'#8bacae'};
export function drawAdventurer(ctx,p,time,animation){
 const step=p.moving?Math.round(Math.sin(time*12+(p.id??p.phase??0)*.9)*1.3):0;
 const thrust=animation?Math.round(Math.sin(Math.min(1,animation.age/.3)*Math.PI)*2):0;
 const x=Math.round(p.x+(animation?Math.cos(animation.angle)*thrust:0)),y=Math.round(p.y+(animation?Math.sin(animation.angle)*thrust:0));
 ctx.save();ctx.translate(x,y);if(p.facing==='left')ctx.scale(-1,1);
 ctx.fillStyle='#4c573943';ctx.beginPath();ctx.ellipse(2,3,8,3,0,0,Math.PI*2);ctx.fill();
 // Boots and trousers have independent walking frames.
 ctx.fillStyle='#4c4738';ctx.fillRect(-5,-2+step,5,7);ctx.fillRect(1,-2-step,5,7);
 ctx.fillStyle=p.equipment?.Bottes?.color||'#6e6350';ctx.fillRect(-4,-3+step,3,5);ctx.fillRect(2,-3-step,3,5);
 ctx.fillStyle='#a6926a';ctx.fillRect(-5,3+step,5,1);ctx.fillRect(1,3-step,5,1);
 const coat=p.equipment?.Cape?.color||ROLE_COLOR[p.role];
 ctx.fillStyle='#5b5b3e';ctx.fillRect(-7,-16,14,16);ctx.fillStyle=coat;ctx.fillRect(-6,-15,12,14);
 ctx.fillStyle='#ffffff26';ctx.fillRect(-5,-14,3,11);ctx.fillStyle='#4d61525c';ctx.fillRect(3,-13,3,13);
 ctx.fillStyle='#657769';ctx.fillRect(-3,-13,7,10);ctx.fillStyle='#a8af87';ctx.fillRect(-2,-12,2,8);
 ctx.fillStyle='#715238';ctx.fillRect(-6,-4,12,3);ctx.fillStyle='#d8bc7e';ctx.fillRect(-1,-4,3,2);
 ctx.fillStyle='#947550';ctx.fillRect(-8,-13-step,3,9);ctx.fillRect(6,-13+step,3,9);
 ctx.fillStyle='#dfbd8d';ctx.fillRect(-8,-7-step,3,4);ctx.fillRect(6,-7+step,3,4);ctx.fillStyle='#edd1a1';ctx.fillRect(-8,-7-step,1,2);ctx.fillRect(6,-7+step,1,2);
 ctx.fillStyle='#70543a';ctx.fillRect(-5,-24,10,11);ctx.fillStyle='#d4aa7d';ctx.fillRect(-4,-23,8,9);ctx.fillStyle='#ebc89a';ctx.fillRect(-4,-22,6,6);
 const hair=p.equipment?.Coiffe?.color||'#786043';ctx.fillStyle='#534932';ctx.fillRect(-5,-26,10,5);ctx.fillRect(-6,-24,2,6);
 ctx.fillStyle=hair;ctx.fillRect(-4,-26,8,4);ctx.fillRect(-5,-23,2,4);ctx.fillStyle='#ac9262';ctx.fillRect(-3,-26,5,1);
 if(p.equipment?.Coiffe){ctx.fillStyle='#d3c8a0';ctx.fillRect(-6,-23,12,2);ctx.fillStyle='#b3a37a';ctx.fillRect(-5,-27,10,4);ctx.fillStyle=p.equipment.Coiffe.color||'#b3bba5';ctx.fillRect(-3,-29,6,3);}
 const theme=p.equipment?.Coiffe?.element;
 if(theme==='earth'){ctx.fillStyle='#70834a';ctx.fillRect(-6,-29,3,3);ctx.fillRect(3,-30,3,3);ctx.fillStyle='#c2cd8e';ctx.fillRect(-2,-32,2,4);}
 if(theme==='fire'){ctx.fillStyle='#bc6846';ctx.fillRect(-6,-30,3,5);ctx.fillRect(4,-30,3,5);ctx.fillStyle='#efcc82';ctx.fillRect(0,-33,2,6);}
 if(theme==='air'){ctx.fillStyle='#e1e5c4';ctx.fillRect(4,-34,2,7);ctx.fillRect(6,-36,2,5);}
 if(theme==='water'){ctx.fillStyle='#4c829c';ctx.fillRect(-6,-27,2,11);ctx.fillRect(5,-27,2,11);ctx.fillStyle='#b0d9d6';ctx.fillRect(-3,-28,7,1);}
 if(p.facing==='up'){ctx.fillStyle=hair;ctx.fillRect(-4,-23,8,7);ctx.fillStyle='#a38a60';ctx.fillRect(-3,-23,6,1);}else{ctx.fillStyle='#4a4938';ctx.fillRect(-2,-19,1,2);ctx.fillRect(3,-19,1,2);ctx.fillStyle='#b48b65';ctx.fillRect(0,-15,3,1);}
 if(!animation||p.role!=='melee'){
   if(p.role==='ranged'){ctx.strokeStyle='#72563a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(9,-17);ctx.lineTo(12,-11);ctx.lineTo(11,-4);ctx.stroke();ctx.strokeStyle='#e1d7b3';ctx.beginPath();ctx.moveTo(9,-17);ctx.lineTo(9,-4);ctx.lineTo(11,-4);ctx.stroke();}
   else if(p.role==='support'){ctx.fillStyle='#725336';ctx.fillRect(9,-17,2,22);ctx.fillStyle='#526c58';ctx.fillRect(7,-21,6,6);ctx.fillStyle='#afcdb0';ctx.fillRect(8,-20,3,3);ctx.fillStyle='#e0d9a5';ctx.fillRect(9,-20,1,1);}
   else{ctx.fillStyle='#7b674b';ctx.fillRect(9,-6,2,8);ctx.fillStyle='#c5ae73';ctx.fillRect(6,-7,7,2);ctx.fillStyle='#c6cebb';ctx.fillRect(9,-20,2,13);ctx.fillStyle='#eef0d4';ctx.fillRect(9,-19,1,11);}
 }
 if(p.equipment?.Bouclier){ctx.fillStyle='#655e45';ctx.fillRect(-11,-14,7,12);ctx.fillRect(-10,-2,5,2);ctx.fillStyle=p.equipment.Bouclier.color||'#90a49c';ctx.fillRect(-10,-13,5,10);ctx.fillStyle='#dfc890';ctx.fillRect(-8,-12,1,9);}
 if(p.equipment?.Familier){
  const pet=p.equipment.Familier,kind=pet.petSpecies;
  ctx.save();ctx.translate(17,1);
  if(kind==='slime'){ctx.fillStyle='#5c9c9c';ctx.fillRect(-4,-4,9,6);ctx.fillRect(-2,-7,5,5);ctx.fillStyle='#b5daba';ctx.fillRect(-2,-6,3,2);}
  else if(kind==='boar'){ctx.fillStyle='#a4895b';ctx.fillRect(-5,-5,11,7);ctx.fillRect(-4,-8,3,4);ctx.fillRect(3,-8,3,4);ctx.fillStyle='#e0c99c';ctx.fillRect(-2,-1,5,3);}
  else if(kind==='firefly'||kind==='moth'){const bob=Math.round(Math.sin(time*10));ctx.fillStyle=kind==='firefly'?'#e5bf80':'#c5d6b5';ctx.fillRect(-7,-8+bob,5,4);ctx.fillRect(3,-8-bob,5,4);ctx.fillStyle=pet.color;ctx.fillRect(-2,-9,5,10);ctx.fillStyle='#eddbac';ctx.fillRect(-1,-1,3,2);}
  else{ctx.fillStyle='#8a704b';ctx.fillRect(-4,-1,8,5);ctx.fillRect(-3,-5,6,5);ctx.fillRect(-4,-6,2,3);ctx.fillRect(2,-6,2,3);}
  ctx.fillStyle='#334b3b';ctx.fillRect(-1,-4,1,1);ctx.fillRect(2,-4,1,1);ctx.restore();
 }
 ctx.restore();
}
export function drawCreature(ctx,m,time){
 if(m.hp<=0)return;
 const x=Math.round(m.x),y=Math.round(m.y),bob=Math.round(Math.sin(time*4+m.homeX)*1);
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='#55633b45';ctx.beginPath();ctx.ellipse(2,4,13,4,0,0,Math.PI*2);ctx.fill();
 if(m.species==='slime'||m.name==='Slime'){
   ctx.translate(0,bob);ctx.fillStyle='#54765a';ctx.fillRect(-12,-7,24,10);ctx.fillRect(-9,-13,18,14);ctx.fillRect(-5,-16,10,9);
   ctx.fillStyle='#82ad82';ctx.fillRect(-11,-7,22,9);ctx.fillRect(-8,-12,16,12);ctx.fillRect(-4,-15,8,9);
   ctx.fillStyle='#b1cd94';ctx.fillRect(-7,-11,12,4);ctx.fillRect(-3,-14,6,3);ctx.fillStyle='#dbdeaa';ctx.fillRect(-6,-10,3,2);
   ctx.fillStyle='#47705b';ctx.fillRect(-9,0,18,3);ctx.fillStyle='#425847';ctx.fillRect(-5,-5,2,3);ctx.fillRect(4,-5,2,3);ctx.fillRect(-1,0,3,1);ctx.fillStyle='#e0dca5';ctx.fillRect(-4,-5,1,1);ctx.fillRect(5,-5,1,1);
 }else if(m.species==='boar'||m.name==='Sanglier'){
   ctx.fillStyle='#60533c';ctx.fillRect(-14,-10,28,12);ctx.fillRect(-10,-17,20,18);ctx.fillRect(-12,0,5,6);ctx.fillRect(6,0,5,6);
   ctx.fillStyle='#92734f';ctx.fillRect(-13,-10,26,11);ctx.fillRect(-9,-16,18,15);ctx.fillStyle='#b39765';ctx.fillRect(-8,-15,14,5);ctx.fillRect(-11,-9,9,3);
   ctx.fillStyle='#79603e';ctx.fillRect(-10,-20,6,8);ctx.fillRect(5,-20,6,8);ctx.fillStyle='#ba9f6c';ctx.fillRect(-9,-19,3,5);ctx.fillRect(6,-19,3,5);
   ctx.fillStyle='#c4a37b';ctx.fillRect(-5,-6,11,7);ctx.fillStyle='#765e43';ctx.fillRect(-2,-4,2,2);ctx.fillRect(3,-4,2,2);ctx.fillStyle='#3f4939';ctx.fillRect(-8,-9,2,2);ctx.fillRect(7,-9,2,2);
   ctx.fillStyle='#e6d5a4';ctx.fillRect(-9,-2,3,4);ctx.fillRect(-10,-4,2,3);ctx.fillRect(8,-2,3,4);ctx.fillRect(10,-4,2,3);
 }else{
   const wing=Math.round(Math.sin(time*17)*2),fire=m.species==='firefly';
   for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(3,-13);ctx.lineTo(12,-23+wing);ctx.lineTo(19,-18+wing);ctx.lineTo(18,-9);ctx.lineTo(8,-4);ctx.lineTo(3,-6);ctx.closePath();ctx.fillStyle=fire?'#e5c087':'#c1d0b0';ctx.fill();ctx.strokeStyle='#8c885c';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=fire?'#f3deb0':'#e3e3c4';ctx.fillRect(11,-18+wing,4,5);ctx.fillStyle=fire?'#c49356':'#8ba989';ctx.fillRect(9,-9,3,2);ctx.restore();}

   ctx.fillStyle='#716443';ctx.fillRect(-4,-17,8,20);ctx.fillStyle=fire?'#bb8952':'#7f9e80';ctx.fillRect(-3,-16,6,17);ctx.fillStyle=fire?'#edd385':'#bac99b';ctx.fillRect(-3,-2,6,5);ctx.fillStyle='#d8d2a0';ctx.fillRect(-2,-19,1,3);ctx.fillRect(2,-19,1,3);ctx.fillStyle='#3b5241';ctx.fillRect(-2,-12,1,2);ctx.fillRect(2,-12,1,2);
 }
 ctx.restore();
}
