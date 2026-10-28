import * as mountainMap from '../world/slime-mountains-map.js';
import {drawMountainGround,drawMountainStatus} from './slime-mountains.js';
import {createMarshRain} from './marsh-rain.js';
import {drawBossGround} from './depths-boss.js';
import * as depthsMap from '../world/slime-depths-map.js';
import {drawSeaSinkhole,drawDepthsGround,drawDepthsAtmosphere} from './slime-depths.js';
import * as marshMap from '../world/slime-marsh-map.js';
import {drawZonePassage,drawMarshGround,drawMarshSlimeStatus} from './slime-marsh.js';
import {slimeScale} from '../game/slime-marsh.js';
import { drawMonsterTelegraphs, drawMonsterAttackEffects } from './monster-attacks.js';
import { createGoldenHour } from './golden-hour.js';
import { drawSunShadows } from './sun-shadows.js';
import * as tutorialMap from '../world/tutorial-map.js';
import { canWalkZone } from '../world/zones.js';
import { drawWoodcutting } from './woodcutting.js';
import { bonusTargetPosition, BONUS_TARGET_RADIUS } from '../combat/bonus-targets.js';
import { drawBonusTargets } from './bonus-targets.js';
import { drawSpellGround, drawSpellOverlays } from './spells.js';
import { spellById } from '../data/spells.js';
import { createEnvironment } from "./environment.js";
import { drawAdventurer, drawCreature } from "./actors.js";
import { viewport } from "./viewport.js";
import { guidedTarget } from "../combat/attacks.js";

export function createRenderer(canvas) {
  const frame = document.createElement("canvas");
  frame.width = 640;
  frame.height = 400;
  const ctx = frame.getContext("2d");
  const screen = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const village = createEnvironment();
  const lighting = createGoldenHour(frame.width,frame.height);
  const rain=createMarshRain();
  let tutorial, marsh, depths, mountains;
  function label(text, x, y) {
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    const width = ctx.measureText(text).width + 12;
    ctx.fillStyle = "#343b24b8";
    ctx.fillRect(x - width / 2, y - 9, width, 14);
    ctx.fillStyle = "#f0e5bc";
    ctx.fillText(text, x, y + 1);
  }
  function person(p, time, main = false, bot = false, animation = null) {
    const x = Math.round(p.x),
      y = Math.round(p.y);
    drawAdventurer(ctx, p, time, animation);
    if (main) {
      ctx.strokeStyle = "#f0d49b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#eed796";
      ctx.fillRect(x - 2, y - 40, 5, 3);
    }
    if (p.hp !== undefined) {
      ctx.fillStyle = "#24372f";
      ctx.fillRect(x - 10, y - 34, 20, 2);
      ctx.fillStyle = p.hp > 0 ? "#91c897" : "#cf7970";
      ctx.fillRect(x - 10, y - 34, (20 * p.hp) / p.maxHp, 2);
    }
    label(bot ? `${p.name} · BOT` : p.name, x, y + 16);
  }
  const render = (s) => {
    const environment = s.zone === "slime-mountains" ? (mountains ||= createEnvironment(mountainMap)) : s.zone === "slime-depths" ? (depths ||= createEnvironment(depthsMap)) : s.zone === "tutorial" ? (tutorial ||= createEnvironment(tutorialMap)) : s.zone==='slime-marsh'?(marsh ||= createEnvironment(marshMap)):village;
    const canStand = (x,y)=>canWalkZone(x,y,s.zone);
    ctx.drawImage(environment.ground, 0, 0);
    if(s.lighting!==false && !["slime-depths","slime-marsh"].includes(s.zone))drawSunShadows(ctx,environment,s);
    drawZonePassage(ctx,s);
    drawMarshGround(ctx,s);
    drawSeaSinkhole(ctx,s);
    drawDepthsGround(ctx,s);
    drawMountainGround(ctx,s);
    rain.ground(ctx,s);
    for(const marker of environment.markers)label(marker.text,marker.x,marker.y);
    if(s.zone === "tutorial")drawTutorialGate(ctx,s);
    drawSpellGround(ctx,s);
    drawBossGround(ctx,s);
    drawMonsterTelegraphs(ctx,s,environment.land);
    const layers = [
      ...environment.props.map((prop) => ({
        y: prop.y,
        draw: () => {
          ctx.save();
          const felled=prop.kind==="tree"&&s.trees.find(tree=>tree.id===prop.id)?.respawn>0;
          if (
            ["tree","house","petshop","market","sawmill","mushroom","stalagmite","mountain-ridge","mountain-boulder"].includes(prop.kind) && !felled &&
            s.player.y < prop.y &&
            s.player.x + 8 > prop.bounds.left &&
            s.player.x - 8 < prop.bounds.right &&
            s.player.y + 4 > prop.bounds.top &&
            s.player.y - 29 < prop.bounds.bottom
          )
            ctx.globalAlpha = 0.55;
          prop.draw(ctx,felled);
          ctx.restore();
        },
      })),
      ...(s.npcs || []).map(npc=>({y:npc.y,draw:()=>person(npc,s.time,false,false)})),
      ...s.bots.map((p) => ({
        y: p.y,
        draw: () => person(p, s.time, false, true),
      })),
      ...s.team
        .filter((p, i) => p.hp > 0 && (i === s.main || s.deployed))
        .map((p) => ({
          y: p.y,
          draw: () => {
            ctx.save();if(s.zoneDive)ctx.translate(0,-Math.sin(Math.min(1,s.zoneDive.age/s.zoneDive.duration)*Math.PI)*22);
            person(
              p,
              s.time,
              p.id === s.main,
              false,
              (s.woodcutting.action?.owner===p.id&&s.woodcutting.action.phase==="cut"?{harvesting:true,age:0,angle:0}:null)||s.attacks.find((a) => a.owner === p.id && a.age < 0.3) || (()=>{const v=s.spellVisuals.find(v=>v.owner===p.id&&v.age<.3);return v?{age:v.age,angle:Math.atan2(v.y-p.y,v.x-p.x)}:null;})(),
            );ctx.restore();
          },
        })),
      ...s.monsters.map((m) => ({
        y: m.y,
        draw: () => {
          if (m.hp <= 0) {
            if(!m.tutorial&&!m.splitSpawn&&!m.depthsSlime&&!m.boss)label(`Retour ${Math.ceil(m.respawn)}s`, m.homeX, m.homeY);
            return;
          }
          drawCreature(ctx, m, s.time);
          const x = Math.round(m.x),
            y = Math.round(m.y-(m.lift||0)-24*(slimeScale(m)-1)-(m.boss?38:m.mountainSlime?10:0));
          ctx.fillStyle = "#625d3e";
          ctx.fillRect(x - 14, y - 24, 28, 3);
          ctx.fillStyle = "#cfb17c";
          ctx.fillRect(x - 14, y - 24, (28 * m.hp) / m.maxHp, 2);
          label(m.boss?"Gorgelimon":m.depthsSlime?`${m.dualElement?"Mixte":m.element==="earth"?"Limon":"Abyssal"} · ${m.growth}/3`:m.marshSlime?`Slime · ${m.growth}/3`:m.name, x, Math.round(m.y-(m.lift||0)+17));
          drawMarshSlimeStatus(ctx,m,s);
          drawMountainStatus(ctx,m,s);
        },
      })),
    ];
    layers.sort((a, b) => a.y - b.y).forEach((layer) => layer.draw());
    for (const a of s.attacks) {
      const member = s.team[a.owner];
      const progress = Math.min(1, a.age / 0.3);
      ctx.save();
      if (a.role === "melee") {
        ctx.translate(member.x, member.y - 10);
        ctx.rotate(a.angle);
        const swing = -1.1 + progress * 2.2;
        ctx.globalAlpha = 1 - progress * 0.7;
        ctx.strokeStyle = "#ffe6a1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 29, swing - 0.6, swing);
        ctx.stroke();
        ctx.rotate(swing);
        ctx.fillStyle = "#ddbd6e";
        ctx.fillRect(7, -4, 3, 8);
        ctx.fillStyle = "#f0f4e4";
        ctx.fillRect(9, -2, 25, 3);
      } else {
        ctx.translate(a.x, a.y - 10);
        ctx.rotate(a.angle);
        if (a.role === "ranged") {
          ctx.strokeStyle = "#b5cce3";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-17, 0);
          ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.fillStyle = "#eedab4";
          ctx.fillRect(-8, -1, 13, 2);
          ctx.fillStyle = "#e6f3ff";
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(0, -3);
          ctx.lineTo(0, 3);
          ctx.fill();
        } else {
          ctx.shadowColor = "#89efc1";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#68bdad";
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ddffd9";
          ctx.fillRect(-2, -2, 4, 4);
          for (let i = 1; i < 4; i++) {
            ctx.globalAlpha = 1 - i * 0.23;
            ctx.fillRect(-i * 6, Math.sin(a.age * 20 + i) * 3, 3, 3);
          }
        }
      }
      ctx.restore();
    }
    rain.foreground(ctx,s);
    drawMonsterAttackEffects(ctx,s);
    drawSpellOverlays(ctx,s);
    if (s.aim.active && !s.woodcutting.action && !s.monsters.some(monster=>monster.hp>0&&monster.bonusTarget?.time>0&&Math.hypot(s.aim.x-bonusTargetPosition(monster).x,s.aim.y-bonusTargetPosition(monster).y)<=BONUS_TARGET_RADIUS)) {
      const primary=spellById(s.team[s.main].loadout[0]);
      const guide = primary?.role==='support'?{target:null}:guidedTarget(s, s.aim, canStand);
      const target = guide.target;
      const x = target ? target.x : s.aim.x;
      const y = target ? target.y - 8 : s.aim.y;
      const color = target
        ? guide.inRange && guide.clear
          ? "#ffdf91"
          : "#e69b83"
        : "#e4e8ce";
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(s.player.x, s.player.y - 10);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      const radius = target ? 17 : 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (const sign of [-1, 1]) {
        ctx.fillStyle = color;
        ctx.fillRect(x + sign * (radius + 2) - 1, y - 1, 3, 2);
        ctx.fillRect(x - 1, y + sign * (radius + 2) - 1, 2, 3);
      }
      if (target)
        label(
          !guide.clear ? "OBSTACLE" : guide.inRange ? "CIBLE" : "HORS PORTÉE",
          x,
          y + 35,
        );
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(
        s.player.x,
        s.player.y - 5,
        primary?.range||20,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    for (const e of s.effects) {
      ctx.globalAlpha = Math.min(1, e.life * 2);
      if (e.toX !== undefined) {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.toX, e.toY);
        ctx.stroke();
      }
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = e.color;
      if (e.particle) ctx.fillRect(Math.round(e.x), Math.round(e.y), 2, 2);
      else ctx.fillText(e.text, e.x, e.y);
      ctx.globalAlpha = 1;
    }
    drawBonusTargets(ctx,s);
    drawWoodcutting(ctx,s);
    drawDepthsAtmosphere(ctx,s);
    const width = Math.round(canvas.clientWidth),
      height = Math.round(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    screen.imageSmoothingEnabled = false;
    // Fill every viewport without stretching sprites. Follow the player when cropped.
    const view = viewport(width, height, s.player);
    const litFrame = lighting.draw(frame,s.time,s.lighting!==false&&!["slime-depths","slime-marsh"].includes(s.zone));
    canvas.dataset.zone=s.zone;
    canvas.dataset.weather=s.zone==="slime-marsh"?"heavy-rain":"clear";
    canvas.dataset.lighting=s.zone==="slime-depths"?"cave":s.zone==="slime-marsh"?"overcast":s.lighting===false?"off":lighting.mode;
    screen.drawImage(
      litFrame,
      -view.x * view.scale,
      -view.y * view.scale,
      frame.width * view.scale,
      frame.height * view.scale,
    );
  };
  render.destroy=()=>lighting.destroy();
  return render;
}

function drawTutorialGate(ctx,state) {
 const {x,y}=tutorialMap.TUTORIAL_EXIT;
 ctx.fillStyle='#55614466';ctx.beginPath();ctx.ellipse(x,y+3,20,7,0,0,Math.PI*2);ctx.fill();
 for(const side of [-1,1]){
  ctx.fillStyle='#706e53';ctx.fillRect(x+side*18-4,y-43,8,45);
  ctx.fillStyle='#beb88d';ctx.fillRect(x+side*18-3,y-42,6,43);
  ctx.fillStyle='#e0d5ac';ctx.fillRect(x+side*18-5,y-44,10,4);
  for(let row=0;row<4;row++){ctx.fillStyle='#8f9271';ctx.fillRect(x+side*18-3,y-10-row*9,6,1);}
 }
 ctx.fillStyle='#b9b88e';ctx.fillRect(x-22,y-49,44,6);ctx.fillStyle='#ded3a7';ctx.fillRect(x-24,y-51,48,3);
 ctx.fillStyle=state.tutorial?.step==='complete'?'#8dcbb282':'#779b9255';ctx.fillRect(x-13,y-42,26,40);
 ctx.strokeStyle='#bfe5bf';ctx.lineWidth=1;ctx.strokeRect(x-13,y-42,26,40);
 for(let i=0;i<5;i++){const yy=y-5-((state.time*12+i*8)%35);ctx.fillStyle='#e5ecc0';ctx.fillRect(x-9+(i*7)%20,Math.round(yy),1,2);}
}
