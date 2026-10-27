import { audioPreferences } from "./events.js";
import {
  makeNoise,
  playMusicStep,
  playEffect,
  STEP_SECONDS,
  MUSIC_STEPS,
} from "./instruments.js";
export const AUDIO_STORAGE_KEY = "auroria-audio-v1";
export function createAudioEngine({
  Context = globalThis.AudioContext || globalThis.webkitAudioContext,
  storage,
} = {}) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  let preferences;
  try {
    preferences = audioPreferences(
      JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY) || "{}"),
    );
  } catch {
    preferences = audioPreferences();
  }
  let context,
    master,
    music,
    effects,
    buffer,
    interval,
    suspendTimer,
    nextTime = 0,
    step = 0,
    variation = 0,
    hidden = false,
    destroyed = false,
    unlocked = false;
  const last = new Map();
  function volumes() {
    if (!context) return;
    const now = context.currentTime;
    for (const [node, value] of [
      [master, preferences.muted || hidden ? 0 : preferences.master],
      [music, preferences.music],
      [effects, preferences.effects],
    ])
      node.gain.setTargetAtTime(value, now, 0.04);
  }
  function create() {
    context = new Context();
    master = context.createGain();
    music = context.createGain();
    effects = context.createGain();
    const limiter = context.createDynamicsCompressor(),
      filter = context.createBiquadFilter();
    limiter.threshold.value = -14;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    filter.type = "lowpass";
    filter.frequency.value = 3300;
    music.connect(filter);
    filter.connect(master);
    effects.connect(master);
    master.connect(limiter);
    limiter.connect(context.destination);
    buffer = makeNoise(context);
    master.gain.value = 0;
    music.gain.value = preferences.music;
    effects.gain.value = preferences.effects;
    volumes();
    nextTime = context.currentTime + 0.1;
    interval = setInterval(() => {
      if (context.state !== "running" || hidden || preferences.muted) return;
      if (nextTime < context.currentTime - 0.05)
        nextTime = context.currentTime + 0.02;
      let count = 0;
      while (nextTime < context.currentTime + 0.18 && count++ < 16) {
        if (preferences.music > 0 && preferences.master > 0)
          playMusicStep(context, music, buffer, step, nextTime);
        nextTime += STEP_SECONDS;
        step = (step + 1) % MUSIC_STEPS;
      }
    }, 40);
  }
  function pause() {
    if (!context) return;
    clearTimeout(suspendTimer);
    master.gain.setTargetAtTime(0, context.currentTime, 0.012);
    suspendTimer = setTimeout(() => {
      if ((hidden || preferences.muted) && !destroyed)
        void context.suspend().catch(() => {});
    }, 75);
  }
  async function unlock() {
    if (destroyed || !Context || preferences.muted || hidden) return false;
    try {
      clearTimeout(suspendTimer);
      if (!context) create();
      await context.resume();
      volumes();
      unlocked = context.state === "running";
      return unlocked;
    } catch {
      return false;
    }
  }
  function configure(patch) {
    preferences = audioPreferences({ ...preferences, ...patch });
    try {
      storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
    volumes();
    if (context && (preferences.muted || hidden)) pause();
    else if (unlocked || !preferences.muted) void unlock();
  }
  function process(state) {
    const events = state.soundEvents?.splice(0) || [];
    if (
      !context ||
      context.state !== "running" ||
      preferences.muted ||
      hidden ||
      !preferences.effects ||
      !preferences.master
    )
      return;
    const now = context.currentTime;
    events.sort(
      (a, b) => Number(b.owner === state.main) - Number(a.owner === state.main),
    );
    let count = 0;
    for (const event of events) {
      if (count >= 8) break;
      const delay =
        {
          heal: 0.18,
          chop: 0.22,
          step: 0.24,
          cast: 0.07,
          magic: 0.07,
          sword: 0.055,
          bow: 0.07,
        }[event.kind] || 0.09;
      if (now - (last.get(event.kind) ?? -Infinity) < delay) continue;
      last.set(event.kind, now);
      count++;
      const route = context.createGain(),
        distance = Math.hypot(
          event.x - state.player.x,
          event.y - state.player.y,
        );
      route.gain.value =
        (event.owner !== undefined && event.owner !== state.main ? 0.65 : 1) /
        (1 + distance / 180);
      let end = route;
      if (context.createStereoPanner) {
        const pan = context.createStereoPanner();
        pan.pan.value = Math.max(
          -0.75,
          Math.min(0.75, (event.x - state.player.x) / 180),
        );
        route.connect(pan);
        pan.connect(effects);
        end = pan;
      } else route.connect(effects);
      playEffect(context, route, buffer, event, now + 0.005, variation++);
      setTimeout(() => {
        route.disconnect();
        if (end !== route) end.disconnect();
      }, 1200);
    }
  }
  function setHidden(value) {
    hidden = value;
    if (context) {
      if (hidden) pause();
      else if (unlocked && !preferences.muted) void unlock();
    }
  }
  return {
    unlock,
    configure,
    process,
    setHidden,
    get preferences() {
      return { ...preferences };
    },
    get status() {
      return !Context
        ? "unsupported"
        : preferences.muted
          ? "muted"
          : hidden
            ? "paused"
            : context?.state === "running"
              ? "running"
              : unlocked
                ? "paused"
                : "waiting";
    },
    destroy() {
      destroyed = true;
      clearInterval(interval);
      clearTimeout(suspendTimer);
      if (context) void context.close().catch(() => {});
    },
  };
}
