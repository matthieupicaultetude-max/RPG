import { CUSTOM_QUESTS } from "../world/custom-quests.js";
import { DEV_ITEMS, keyFor } from "../data/dev-items.js";
import { questFingerprint } from "../data/quest-schema.js";
import { putInBag } from "./item-stacks.js";
export function questRecord(s, q) {
  s.customQuests ??= {};
  let r = Object.hasOwn(s.customQuests, q.id) ? s.customQuests[q.id] : null;
  if (r?.status === "active" && r.fingerprint !== questFingerprint(q)) {
    r = { ...r, stage: 0, counts: {}, fingerprint: questFingerprint(q) };
    s.customQuests[q.id] = r;
  }
  return r;
}
export function questAvailable(s, q, now = Date.now()) {
  const r = questRecord(s, q);
  return (
    q.enabled &&
    r?.status !== "active" &&
    (!r?.completedAt ||
      (q.repeatable && now - r.completedAt >= q.cooldown * 1000)) &&
    s.team[s.main].level >= q.minLevel &&
    q.prerequisites.every(
      (id) =>
        Object.hasOwn(s.customQuests, id) && s.customQuests[id].completedAt,
    )
  );
}
export function nearQuestNpc(s, id) {
  return (
    s.zone === "exile" &&
    s.team[s.main].hp > 0 &&
    s.npcs?.some(
      (n) => n.id === id && Math.hypot(n.x - s.player.x, n.y - s.player.y) < 43,
    )
  );
}
export function acceptQuest(s, id, now = Date.now()) {
  const q = CUSTOM_QUESTS.find((q) => q.id === id);
  if (!q || !questAvailable(s, q, now) || !nearQuestNpc(s, q.giver))
    return false;
  const old = questRecord(s, q);
  s.customQuests[id] = {
    status: "active",
    stage: 0,
    counts: {},
    completedAt: old?.completedAt || 0,
    runs: old?.runs || 0,
    fingerprint: questFingerprint(q),
  };
  questEvent(s, "talk", q.giver);
  s.revision++;
  return true;
}
export function questEvent(s, type, target, amount = 1) {
  for (const q of CUSTOM_QUESTS) {
    const r = questRecord(s, q);
    if (!q.enabled || r?.status !== "active") continue;
    const stage = q.stages[r.stage];
    if (!stage) continue;
    for (const o of stage.objectives)
      if (o.type === type && o.target === target) {
        r.counts[o.id] = Math.min(o.amount, (r.counts[o.id] || 0) + amount);
        s.revision++;
      }
  }
}
export function objectiveCount(s, r, o) {
  if (o.type === "collect")
    return s.bag
      .filter((i) => keyFor(i) === o.target)
      .reduce((n, i) => n + (i.quantity || 1), 0);
  return r.counts[o.id] || 0;
}
export function stageReady(s, q) {
  const r = questRecord(s, q);
  if (r?.status !== "active") return false;
  const stage = q.stages[r.stage];
  if (!stage) return false;
  const required = new Map();
  for (const o of stage.objectives) {
    if (objectiveCount(s, r, o) < o.amount) return false;
    if (o.type === "collect" && o.consume)
      required.set(o.target, (required.get(o.target) || 0) + o.amount);
  }
  return [...required].every(
    ([key, count]) =>
      s.bag
        .filter((i) => keyFor(i) === key)
        .reduce((n, i) => n + (i.quantity || 1), 0) >= count,
  );
}
export function advanceQuest(s, id, grantXp = () => {}, now = Date.now()) {
  const q = CUSTOM_QUESTS.find((q) => q.id === id),
    r = q && questRecord(s, q);
  if (!q?.enabled || r?.status !== "active") return false;
  const stage = q.stages[r.stage];
  if (!stage || !nearQuestNpc(s, stage.npc)) return false;
  questEvent(s, "talk", stage.npc);
  if (!stageReady(s, q)) return false;
  for (const o of stage.objectives)
    if (o.type === "collect" && o.consume) {
      let left = o.amount;
      for (const item of [...s.bag])
        if (left && keyFor(item) === o.target) {
          const take = Math.min(left, item.quantity || 1);
          left -= take;
          item.quantity = (item.quantity || 1) - take;
          if (!item.quantity) s.bag.splice(s.bag.indexOf(item), 1);
        }
    }
  if (r.stage + 1 < q.stages.length) {
    r.stage++;
    r.counts = {};
  } else {
    r.status = "completed";
    r.completedAt = now;
    r.runs++;
    s.gold += q.rewards.gold;
    for (const reward of q.rewards.items) {
      const item = structuredClone(
        DEV_ITEMS.find((i) => i.key === reward.key).item,
      );
      delete item.id;
      putInBag(s, item, reward.quantity);
    }
    grantXp(s, q.rewards.xp);
  }
  s.revision++;
  return true;
}
export function abandonQuest(s, id) {
  const q = CUSTOM_QUESTS.find((q) => q.id === id),
    r = q && questRecord(s, q);
  if (r?.status !== "active") return false;
  if (r.completedAt)
    s.customQuests[id] = { ...r, status: "completed", counts: {} };
  else delete s.customQuests[id];
  s.revision++;
  return true;
}
export function updateQuestVisits(s) {
  for (const q of CUSTOM_QUESTS) {
    const r = questRecord(s, q);
    if (!q.enabled || r?.status !== "active") continue;
    for (const o of q.stages[r.stage]?.objectives || [])
      if (
        o.type === "visit" &&
        o.zone === s.zone &&
        Math.hypot(s.player.x - o.x, s.player.y - o.y) <= o.radius &&
        r.counts[o.id] !== o.amount
      ) {
        r.counts[o.id] = o.amount;
        s.revision++;
      }
  }
}

export function npcHasQuests(s, id) {
  return CUSTOM_QUESTS.some(
    (q) =>
      q.enabled &&
      (q.giver === id ||
        q.stages[questRecord(s, q)?.stage]?.npc === id ||
        q.stages[questRecord(s, q)?.stage]?.objectives.some(
          (o) => o.type === "talk" && o.target === id,
        )),
  );
}
