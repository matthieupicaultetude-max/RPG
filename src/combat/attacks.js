export const ATTACK_RANGE = { melee: 45, support: 85, ranged: 125 };
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function lineClear(a, b, canStand) {
  const steps = Math.max(1, Math.ceil(distance(a,b) / 3));
  for (let i = 1; i <= steps; i++) {
    if (!canStand(a.x + (b.x-a.x)*i/steps, a.y + (b.y-a.y)*i/steps)) return false;
  }
  return true;
}
export function guidedTarget(state, point, canStand) {
  const member = state.team[state.main];
  const candidates = state.monsters.filter(m => m.hp > 0).map(m => {
    const cursorGap = Math.hypot(m.x-point.x,m.y-8-point.y);
    const aimAngle = Math.atan2(point.y-state.player.y+8,point.x-state.player.x);
    const enemyAngle = Math.atan2(m.y-state.player.y,m.x-state.player.x);
    const difference = Math.abs(Math.atan2(Math.sin(enemyAngle-aimAngle),Math.cos(enemyAngle-aimAngle)));
    return { monster:m, score:cursorGap, eligible:cursorGap<28 || (difference<.22 && cursorGap<60) };
  }).filter(c => c.eligible).sort((a,b)=>a.score-b.score);
  const target = candidates[0]?.monster;
  return { target, inRange: !!target && distance(state.player,target)<=ATTACK_RANGE[member.role], clear: !!target && lineClear(state.player,target,canStand) };
}
export function launchAttack(state, member, point, target, damage) {
  const angle = Math.atan2(point.y-member.y, point.x-member.x);
  member.facing = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)) ? (Math.cos(angle)>0?'right':'left') : (Math.sin(angle)>0?'down':'up');
  state.attacks.push({ element: member.equipment.Arme?.element || null, role: member.role, owner: member.id, x: member.x, y: member.y, startX: member.x, startY: member.y, angle, age: 0, duration: member.role==='melee'?.3:.85, target, damage, hit: false });
}
export function stepAttacks(state, dt, canStand, hitMonster) {
  state.attacks = state.attacks.filter(a => {
    const member = state.team[a.owner];
    if (!member || member.hp<=0 || (a.owner!==state.main && !state.deployed)) return false;
    a.age += dt;
    if (a.role==='melee') {
      if (!a.hit && a.age>=.12) {
        a.hit=true;
        const inArc = target => {
          const angle = Math.atan2(target.y-member.y,target.x-member.x)-a.angle;
          return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle))) <= Math.PI / 3;
        };
        const target = a.target || state.monsters.find(m => m.hp>0 && distance(member,m)<=ATTACK_RANGE.melee && inArc(m) && lineClear(member,m,canStand));
        if (target?.hp>0 && distance(member,target)<=ATTACK_RANGE.melee && inArc(target) && lineClear(member,target,canStand)) {
          hitMonster(state,target,a.damage,member);
        }
      }
      return a.age<a.duration;
    }
    if (a.target?.hp>0) a.angle=Math.atan2(a.target.y-a.y,a.target.x-a.x);
    const travel=(a.role==='ranged'?280:190)*dt;
    const next={ x:a.x+Math.cos(a.angle)*travel,y:a.y+Math.sin(a.angle)*travel };
    if (!lineClear(a,next,canStand)) return false;
    const impact = state.monsters.filter(m => m.hp>0).find(m => {
      const dx=next.x-a.x,dy=next.y-a.y;
      const t=Math.max(0,Math.min(1,((m.x-a.x)*dx+(m.y-a.y)*dy)/(dx*dx+dy*dy || 1)));
      return Math.hypot(m.x-a.x-t*dx,m.y-a.y-t*dy)<9;
    });
    if (impact) {
      hitMonster(state,impact,a.damage,member);
      return false;
    }
    a.x=next.x;a.y=next.y;
    return a.age<a.duration && Math.hypot(a.x-a.startX,a.y-a.startY)<ATTACK_RANGE[a.role]+25;
  });
}
