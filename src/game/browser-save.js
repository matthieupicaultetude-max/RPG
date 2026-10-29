import { beginTutorial, startTutorialFight } from './tutorial.js';
import { movePartyToZone } from '../world/zones.js';
import { syncEquipmentHealth } from '../data/equipment.js';

// Stable keys: releases change the schema version, never the storage key.
export const SAVE_KEY = 'auroria-progress';
export const BACKUP_KEY = 'auroria-progress-backup';
export const SAVE_VERSION = 1;
const MEMBER_FIELDS = ['level', 'xp', 'equipment', 'loadout', 'emptySpellSlots', 'characteristicPoints', 'allocatedStats', 'learnedUltimates'];
const TUTORIAL_FIELDS = ['step', 'visited', 'distance', 'defeated', 'member', 'manualSpell', 'spellRead', 'bestiaryRead', 'professionsRead', 'coreId', 'armorId', 'harvested', 'crafted'];
const STEPS = ['classes', 'move', 'ready', 'combat', 'stats', 'spells', 'bestiary', 'loot', 'armor', 'professions', 'gather', 'craft', 'complete', 'done', 'skipped'];
const pick = (value, keys) => Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const integer = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function progressSnapshot(state) {
  return {
    version: SAVE_VERSION, savedAt: new Date().toISOString(),
    progress: {
      team: state.team.map(member => pick(member, MEMBER_FIELDS)),
      main: state.main, deployed: state.deployed, bag: state.bag,
      gold: state.gold, nextItem: state.nextItem,
      collections: state.collections, petQuests: state.petQuests,
      woodcutting: pick(state.woodcutting, ['level', 'xp']),
      handyman: pick(state.handyman, ['level', 'xp']),
      ...(state.devChest?{devChest:state.devChest}:{}),
      tutorial: state.tutorial ? pick(state.tutorial, TUTORIAL_FIELDS) : null,
    },
  };
}

export function decodeSave(raw) {
  const save = JSON.parse(raw);
  if (save?.version > SAVE_VERSION) throw new Error('future-version');
  if (save?.version !== SAVE_VERSION) throw new Error('invalid-version');
  const p = save.progress;
  if (!object(p) || !Array.isArray(p.team) || p.team.length !== 3 ||
      !integer(p.main) || p.main > 2 || typeof p.deployed !== 'boolean' ||
      !Array.isArray(p.bag) || !integer(p.gold) || !integer(p.nextItem, 1) ||
      !object(p.collections) || !object(p.petQuests)) throw new Error('invalid-progress');
  const items = [...p.bag];
  for (const m of p.team) {
    if (!object(m) || !integer(m.level, 1) || !integer(m.xp) ||
        !integer(m.characteristicPoints) || !object(m.allocatedStats) ||
        !Object.values(m.allocatedStats).every(n => integer(n)) ||
        !object(m.equipment) || !Array.isArray(m.loadout) || m.loadout.length !== 4 ||
        !m.loadout.every(id => id === null || typeof id === 'string') ||
        !Array.isArray(m.learnedUltimates) || !m.learnedUltimates.every(id => typeof id === 'string') ||
        (m.emptySpellSlots !== undefined && (!Array.isArray(m.emptySpellSlots) || !m.emptySpellSlots.every(n => integer(n) && n < 4)))) throw new Error('invalid-member');
    items.push(...Object.values(m.equipment));
  }
  if(p.devChest!==undefined&&(!object(p.devChest)||!Object.values(p.devChest).every(n=>integer(n)&&n<=99)))throw new Error("invalid-chest");
  const ids = new Set();
  for (const item of items) {
    if (!object(item) || !integer(item.id, 1) || ids.has(item.id) || typeof item.name !== 'string' ||
        (item.quantity !== undefined && !integer(item.quantity, 1)) ||
        (item.stats !== undefined && (!object(item.stats) || !Object.values(item.stats).every(Number.isFinite)))) throw new Error('invalid-item');
    ids.add(item.id);
  }
  for (const job of [p.woodcutting, p.handyman]) {
    if (!object(job) || !integer(job.level, 1) || !integer(job.xp)) throw new Error('invalid-job');
  }
  if (!Object.values(p.collections).every(slots => Array.isArray(slots) && slots.every(slot => typeof slot === 'string')) ||
      !Object.values(p.petQuests).every(q => object(q) && ['active', 'completed'].includes(q.status))) throw new Error('invalid-quests');
  if (p.tutorial !== null && (!object(p.tutorial) || !STEPS.includes(p.tutorial.step) ||
      !Array.isArray(p.tutorial.visited) || !p.tutorial.visited.every(n => integer(n) && n < 3) ||
      (p.tutorial.member !== undefined && (!integer(p.tutorial.member) || p.tutorial.member > 2)))) throw new Error('invalid-tutorial');
  return save;
}

export function restoreProgress(state, save) {
  const p = structuredClone(save.progress);
  state.team.forEach((m, i) => {
    Object.assign(m, pick(p.team[i], MEMBER_FIELDS));
    m.maxHp = 100 + (m.level - 1) * 10;
    m.equipmentHp = 0;
    syncEquipmentHealth(m);
    m.hp = m.maxHp;
  });
  for (const key of ['main', 'deployed', 'bag', 'gold', 'collections', 'petQuests']) state[key] = p[key];
  if(p.devChest)state.devChest=p.devChest;
  state.nextItem = Math.max(p.nextItem, 1 + Math.max(0, ...state.bag.concat(state.team.flatMap(m => Object.values(m.equipment))).map(i => i.id)));
  Object.assign(state.woodcutting, p.woodcutting, { action: null });
  Object.assign(state.handyman, p.handyman);
  const t = p.tutorial;
  if (!t || !['done', 'skipped'].includes(t.step)) {
    beginTutorial(state);
    if (t) {
      Object.assign(state.tutorial, t);
      if (t.step === 'combat' && !t.defeated) {
        state.tutorial.step = 'ready';
        startTutorialFight(state);
      }
      state.tutorial.previous = { ...state.player };
    }
  } else {
    state.tutorial = t;
    movePartyToZone(state, 'garden', { x: 110, y: 155 });
  }
  state.revision++;
}

export function createBrowserSave(state, storage) {
  let writable = true, lastContent = null, lastGood = null;
  const status = (text, error = false) => {
    if (state.saveStatus?.text !== text || state.saveStatus?.error !== error) state.revision++;
    state.saveStatus = { text, error };
  };
  let primary, backup;
  try {
    storage ??= globalThis.localStorage;
    primary = storage.getItem(SAVE_KEY);
    backup = storage.getItem(BACKUP_KEY);
  } catch {
    writable = false;
    status('Sauvegarde indisponible : autorisez le stockage du navigateur.', true);
  }
  if (writable) {
    for (const raw of [primary, backup]) {
      if (!raw) continue;
      try {
        const save = decodeSave(raw);
        restoreProgress(state, save);
        lastGood = raw;
        status(raw === primary ? 'Progression restaurée' : 'Progression restaurée depuis la copie de secours');
        break;
      } catch (error) {
        if (error.message === 'future-version') {
          writable = false;
          status('Sauvegarde plus récente : rechargez la dernière version du jeu. Données conservées.', true);
          break;
        }
      }
    }
    if (!lastGood && (primary || backup) && writable) {
      writable = false;
      status('Sauvegarde illisible : données conservées, sauvegarde automatique suspendue.', true);
    }
  }
  return {
    save() {
      if (!writable) return false;
      try {
        const snapshot = progressSnapshot(state);
        const content = JSON.stringify(snapshot.progress);
        if (content === lastContent) return true;
        const raw = JSON.stringify(snapshot);
        decodeSave(raw); // Never replace a valid save with an invalid runtime state.
        if (lastGood) storage.setItem(BACKUP_KEY, lastGood);
        storage.setItem(SAVE_KEY, raw);
        lastGood = raw;
        lastContent = content;
        status('Progression sauvegardée automatiquement');
        return true;
      } catch {
        status('Échec de sauvegarde : vérifiez l’espace et les autorisations du navigateur.', true);
        return false;
      }
    },
  };
}
