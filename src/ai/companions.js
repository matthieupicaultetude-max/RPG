// Local steering prototype. Companions receive intentions, never player inputs.
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function clearRoute(member) {
  member.motion = { vx: 0, vy: 0, goal: null, path: [], repath: 0, nextDecision: 0, target: null };
  member.moving = false;
}

function visible(a, b, canStand) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!canStand(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return true;
}

function safeGoal(goal, canStand) {
  const point = { x: clamp(goal.x, 18, 622), y: clamp(goal.y, 69, 382) };
  if (canStand(point.x, point.y)) return point;
  for (let radius = 8; radius <= 96; radius += 8) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const candidate = { x: point.x + Math.cos(angle) * radius, y: point.y + Math.sin(angle) * radius };
      if (canStand(candidate.x, candidate.y)) return candidate;
    }
  }
  return null;
}

// Small navigation grid only used when the direct route is obstructed.
function findPath(start, goal, canStand) {
  const cols = 62, rows = 33;
  const cell = p => ({ x: clamp(Math.round((p.x - 14) / 10), 0, cols - 1), y: clamp(Math.round((p.y - 66) / 10), 0, rows - 1) });
  const point = c => ({ x: 14 + c.x * 10, y: 66 + c.y * 10 });
  const key = c => c.y * cols + c.x;
  let from = cell(start);
  if (!canStand(point(from).x, point(from).y) || !visible(start, point(from), canStand)) {
    const candidates = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const candidate = { x: from.x + dx, y: from.y + dy };
      if (candidate.x < 0 || candidate.x >= cols || candidate.y < 0 || candidate.y >= rows) continue;
      if (visible(start, point(candidate), canStand)) candidates.push(candidate);
    }
    candidates.sort((a,b) => distance(start,point(a))-distance(start,point(b)));
    if (!candidates.length) return [];
    from = candidates[0];
  }
  const queue = [from], previous = new Map([[key(from), null]]);
  let reached;
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (distance(point(current), goal) < 16 && visible(point(current), goal, canStand)) { reached = current; break; }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows || previous.has(key(next))) continue;
      if (!visible(point(current), point(next), canStand)) continue;
      previous.set(key(next), current); queue.push(next);
    }
  }
  if (!reached) return [];
  const route = [goal];
  for (let current = reached; previous.get(key(current)); current = previous.get(key(current))) route.unshift(point(current));
  return route;
}

export function placeAllies(state, canStand) {
  const occupied = [state.player];
  state.team.forEach((member, index) => {
    clearRoute(member);
    if (index === state.main) return;
    for (let radius = 25; radius <= 85; radius += 12) {
      let placed = false;
      for (let step = 0; step < 16; step++) {
        const angle = index * 2.1 + step * Math.PI / 8;
        const p = { x: state.player.x + Math.cos(angle) * radius, y: state.player.y + Math.sin(angle) * radius };
        if (canStand(p.x, p.y) && occupied.every(other => distance(p, other) > 18) && visible(state.player, p, canStand)) {
          Object.assign(member, p); occupied.push(p); placed = true; break;
        }
      }
      if (placed) break;
    }
  });
}

function steer(state, member, goal, dt, canStand) {
  const motion = member.motion;
  motion.repath -= dt;
  let waypoint = goal;
  if (!visible(member, goal, canStand)) {
    if (motion.repath <= 0 || !motion.path.length) {
      motion.path = findPath(member, goal, canStand); motion.repath = .8 + member.id * .07;
    }
    while (motion.path.length && distance(member, motion.path[0]) < 9) motion.path.shift();
    // Skip already unnecessary corners, keeping each character's own route.
    while (motion.path.length > 1 && visible(member, motion.path[1], canStand)) motion.path.shift();
    waypoint = motion.path[0] || member;
  } else motion.path = [];
  const dx = waypoint.x - member.x, dy = waypoint.y - member.y, d = Math.hypot(dx, dy);
  const leaderDistance = distance(member, state.player);
  const maxSpeed = (leaderDistance > 105 ? 112 : 88) + member.id * 2;
  const arrival = motion.path.length ? 1 : clamp((d - 5) / 26, 0, 1);
  let vx = d > 1 ? dx / d * maxSpeed * arrival : 0;
  let vy = d > 1 ? dy / d * maxSpeed * arrival : 0;
  // Soft separation prevents the fixed, overlapping parade formation.
  for (const other of state.team) {
    if (other === member || other.hp <= 0) continue;
    const gap = distance(member, other);
    if (gap < 24 && gap > .01) {
      const force = (24 - gap) / 24 * 90;
      vx += (member.x - other.x) / gap * force;
      vy += (member.y - other.y) / gap * force;
    }
  }
  const desiredSpeed = Math.hypot(vx, vy);
  if (desiredSpeed > maxSpeed) { vx *= maxSpeed / desiredSpeed; vy *= maxSpeed / desiredSpeed; }
  const blend = 1 - Math.exp(-dt * 8);
  motion.vx += (vx - motion.vx) * blend;
  motion.vy += (vy - motion.vy) * blend;
  const old = { x: member.x, y: member.y };
  const nx = member.x + motion.vx * dt, ny = member.y + motion.vy * dt;
  if (canStand(nx, member.y)) member.x = nx; else { motion.vx = 0; motion.repath = 0; }
  if (canStand(member.x, ny)) member.y = ny; else { motion.vy = 0; motion.repath = 0; }
  const ax = member.x - old.x, ay = member.y - old.y;
  member.moving = Math.hypot(ax, ay) > dt * 5;
  if (member.moving) member.facing = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'down' : 'up');
}

export function stepCompanions(state, dt, canStand, hitMonster) {
  const leader = state.player;
  state.heading ??= { x: 0, y: 1 };
  if (leader.moving) {
    const facing = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }[leader.facing];
    const blend = 1 - Math.exp(-dt * 3);
    state.heading.x += (facing[0] - state.heading.x) * blend;
    state.heading.y += (facing[1] - state.heading.y) * blend;
  }
  state.team.forEach((member, index) => {
    if (index === state.main || member.hp <= 0 || !state.deployed) { member.moving = index === state.main && leader.moving; return; }
    if (!member.motion) clearRoute(member);
    const motion = member.motion;
    const enemies = state.monsters.filter(enemy => enemy.hp > 0 && distance(enemy, leader) < 130);
    const nearest = enemies.slice().sort((a,b) => distance(a,member) - distance(b,member))[0];
    const target = enemies.includes(motion.target) ? motion.target : nearest;
    motion.target = target || null;
    motion.nextDecision -= dt;
    const tooFar = distance(member, leader) > 150;
    const retreating = leader.moving && distance(member, leader) > 90;
    if (member.role === 'support' && member.cooldown === 0) {
      const injured = state.team.filter(ally => ally.hp > 0 && ally.hp < ally.maxHp && distance(member,ally) < 120).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
      if (injured) {
        injured.hp = Math.min(injured.maxHp, injured.hp + 8); member.cooldown = 2;
        state.effects.push({ x: injured.x, y: injured.y - 25, text: '+8', color: '#8ce2b0', life: 1 }); state.revision++;
      }
    }
    // Different roles choose their own destination, not the leader's exact footsteps.
    if (target && !tooFar && !retreating) {
      const gap = distance(member, target);
      const angle = Math.atan2(member.y - target.y, member.x - target.x);
      if (member.role === 'melee') {
        const side = index % 2 ? -.55 : .55;
        motion.goal = safeGoal({ x: target.x + Math.cos(angle + side) * 23, y: target.y + Math.sin(angle + side) * 23 }, canStand);
      } else {
        const nearestThreat = enemies.slice().sort((a,b)=>distance(a,member)-distance(b,member))[0];
        const threatGap = distance(member, nearestThreat);
        if (threatGap < 68) {
          const away = Math.atan2(member.y-nearestThreat.y,member.x-nearestThreat.x);
          motion.goal = safeGoal({ x: nearestThreat.x + Math.cos(away) * 98, y: nearestThreat.y + Math.sin(away) * 98 }, canStand);
        } else if (gap > 108 || !motion.goal) {
          motion.goal = safeGoal({ x: target.x + Math.cos(angle) * 88, y: target.y + Math.sin(angle) * 88 }, canStand);
        } else if (gap >= 78) motion.goal = { x: member.x, y: member.y };
      }
      const reach = member.role === 'melee' ? 34 : 118;
      if (member.role !== 'support' && gap < reach && member.cooldown === 0 && visible(member,target,canStand)) {
        hitMonster(state,target,7,member); member.cooldown = member.role === 'ranged' ? 1.15 : .9;
        state.effects.push({ x: member.x, y: member.y - 14, toX: target.x, toY: target.y - 6, text: '', color: member.role === 'ranged' ? '#c4d6ff' : '#f5cf8a', life: .18 });
      }
    } else {
      const moved = !motion.anchor || distance(motion.anchor,leader) > 16;
      if (moved || motion.nextDecision <= 0 || !motion.goal) {
        const angle = Math.atan2(state.heading.y,state.heading.x);
        const side = index % 2 ? 1 : -1;
        const back = member.role === 'melee' ? 13 : member.role === 'support' ? 35 : 49;
        const lateral = 21 + index * 5;
        const drift = Math.sin(state.time*.65 + index*2.4)*5;
        motion.goal = safeGoal({ x: leader.x - Math.cos(angle)*back - Math.sin(angle)*(lateral*side+drift), y: leader.y - Math.sin(angle)*back + Math.cos(angle)*(lateral*side+drift) },canStand);
        motion.anchor = { x:leader.x,y:leader.y };
        motion.nextDecision = 1.7 + index*.23;
      }
    }
    steer(state,member,motion.goal || member,dt,canStand);
  });
}
