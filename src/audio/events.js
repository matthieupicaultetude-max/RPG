export function emitSound(state, kind, position, options = {}) {
  state.soundEvents ??= [];
  state.soundEvents.push({
    kind,
    x: position?.x ?? state.player.x,
    y: position?.y ?? state.player.y,
    ...options,
  });
  if (state.soundEvents.length > 64)
    state.soundEvents.splice(0, state.soundEvents.length - 64);
}
export function impactKind(member, spell) {
  if (spell) {
    if (
      spell.role === "melee" &&
      !["quake", "furnace", "maelstrom", "rupture"].includes(spell.effect)
    )
      return "sword";
    if (
      spell.role === "ranged" &&
      [
        "pierce",
        "shatter",
        "mountain",
        "boomerang",
        "backstep",
        "skyHunt",
      ].includes(spell.effect)
    )
      return "bow";
    return "magic";
  }
  return member.role === "melee"
    ? "sword"
    : member.role === "ranged"
      ? "bow"
      : "magic";
}
export const AUDIO_DEFAULTS = Object.freeze({
  master: 0.65,
  music: 0.28,
  effects: 0.7,
  wind: 0.3,
  muted: false,
});
export function audioPreferences(value = {}) {
  const result = { ...AUDIO_DEFAULTS };
  for (const key of ["master", "music", "effects", "wind"])
    if (typeof value?.[key] === "number" && Number.isFinite(value[key]))
      result[key] = Math.max(0, Math.min(1, value[key]));
  if (typeof value?.muted === "boolean") result.muted = value.muted;
  return result;
}
