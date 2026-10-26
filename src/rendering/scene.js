import { createEnvironment } from "./environment.js";
import { drawAdventurer, drawCreature } from "./actors.js";
import { viewport } from "./viewport.js";
import { guidedTarget, ATTACK_RANGE } from "../combat/attacks.js";
import { canStand } from "../dev/sandbox.js";

export function createRenderer(canvas) {
  const frame = document.createElement("canvas");
  frame.width = 640;
  frame.height = 400;
  const ctx = frame.getContext("2d");
  const screen = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const environment = createEnvironment();
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
  return (s) => {
    ctx.drawImage(environment.ground, 0, 0);
    const layers = [
      ...environment.props.map((prop) => ({
        y: prop.y,
        draw: () => {
          ctx.save();
          if (
            prop.kind === "tree" &&
            s.player.y < prop.y &&
            s.player.x + 8 > prop.bounds.left &&
            s.player.x - 8 < prop.bounds.right &&
            s.player.y + 4 > prop.bounds.top &&
            s.player.y - 29 < prop.bounds.bottom
          )
            ctx.globalAlpha = 0.55;
          prop.draw(ctx);
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
          draw: () =>
            person(
              p,
              s.time,
              p.id === s.main,
              false,
              s.attacks.find((a) => a.owner === p.id && a.age < 0.3),
            ),
        })),
      ...s.monsters.map((m) => ({
        y: m.y,
        draw: () => {
          if (m.hp <= 0) {
            label(`Retour ${Math.ceil(m.respawn)}s`, m.homeX, m.homeY);
            return;
          }
          drawCreature(ctx, m, s.time);
          const x = Math.round(m.x),
            y = Math.round(m.y);
          ctx.fillStyle = "#625d3e";
          ctx.fillRect(x - 14, y - 24, 28, 3);
          ctx.fillStyle = "#cfb17c";
          ctx.fillRect(x - 14, y - 24, (28 * m.hp) / m.maxHp, 2);
          label(m.name, x, y + 17);
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
    if (s.aim.active) {
      const guide = guidedTarget(s, s.aim, canStand);
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
        ATTACK_RANGE[s.team[s.main].role],
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
    const width = Math.round(canvas.clientWidth),
      height = Math.round(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    screen.imageSmoothingEnabled = false;
    // Fill every viewport without stretching sprites. Follow the player when cropped.
    const view = viewport(width, height, s.player);
    screen.drawImage(
      frame,
      -view.x * view.scale,
      -view.y * view.scale,
      frame.width * view.scale,
      frame.height * view.scale,
    );
  };
}
