export const BPM = 104;
export const STEP_SECONDS = 60 / BPM / 4;
export const MUSIC_STEPS = 16 * 16;
export const midi = (note) => 440 * 2 ** ((note - 69) / 12);
const chords = [
  [48, 60, 64, 67, 71],
  [43, 59, 62, 67, 69],
  [45, 60, 64, 69, 72],
  [41, 60, 65, 69, 72],
  [48, 60, 64, 67, 72],
  [43, 59, 62, 67, 71],
  [41, 60, 65, 69, 72],
  [43, 59, 62, 67, 71],
];
const melodies = [
  [72, 0, 0, 76, 0, 0, 79, 0, 0, 0, 76, 0, 74, 0, 0, 0],
  [71, 0, 0, 74, 0, 0, 79, 0, 0, 0, 77, 0, 74, 0, 0, 0],
  [72, 0, 0, 76, 0, 0, 81, 0, 0, 79, 0, 0, 76, 0, 0, 0],
  [77, 0, 0, 76, 0, 0, 72, 0, 0, 0, 69, 0, 72, 0, 0, 0],
  [76, 0, 0, 79, 0, 0, 84, 0, 0, 0, 83, 0, 79, 0, 0, 0],
  [79, 0, 0, 74, 0, 0, 71, 0, 0, 0, 74, 0, 76, 0, 0, 0],
  [77, 0, 0, 81, 0, 0, 79, 0, 0, 0, 76, 0, 72, 0, 0, 0],
  [74, 0, 0, 71, 0, 0, 67, 0, 0, 0, 71, 0, 74, 0, 0, 0],
];
export function musicStep(index) {
  const bar = Math.floor((index % MUSIC_STEPS) / 16),
    step = index % 16,
    chord = chords[bar % 8];
  let lead = melodies[bar % 8][step];
  // The second phrase leaves more breathing space and adds a tiny answering bell.
  if (bar >= 8 && [1, 3, 5].includes(bar % 8) && step === 12) lead = 0;
  return {
    lead,
    bass: step === 0 || step === 8 ? chord[0] + (step === 8 ? 7 : 0) : null,
    arp: step % 4 === 2 ? chord[1 + ((Math.floor(step / 4) + bar) % 4)] : null,
    kick: step === 0 || step === 8,
    snare: step === 4 || step === 12,
    hat: step % 4 === 2,
    bell: bar >= 8 && step === 14 ? chord[3] + 12 : null,
  };
}
export function makeNoise(context, seconds = 10) {
  const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * seconds),
      context.sampleRate,
    ),
    data = buffer.getChannelData(0);
  let seed = 0x12345678;
  for (let i = 0; i < data.length; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const edge = Math.min(
      1,
      i / (context.sampleRate * 0.1),
      (data.length - 1 - i) / (context.sampleRate * 0.1),
    );
    data[i] = ((seed >>> 0) / 2147483648 - 1) * Math.max(0, edge);
  }
  return buffer;
}
export function tone(
  context,
  bus,
  time,
  frequency,
  duration,
  volume,
  type = "triangle",
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator(),
    gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  if (endFrequency !== frequency)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      time + duration,
    );
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain);
  gain.connect(bus);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.015);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
export function noise(
  context,
  bus,
  buffer,
  time,
  duration,
  volume,
  frequency = 1600,
  type = "bandpass",
) {
  const source = context.createBufferSource(),
    filter = context.createBiquadFilter(),
    gain = context.createGain();
  source.buffer = buffer;
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  source.start(time, Math.min(1, buffer.duration / 4), duration + 0.01);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}
export function playMusicStep(context, bus, buffer, index, time) {
  const notes = musicStep(index);
  if (notes.lead)
    tone(context, bus, time, midi(notes.lead), 0.23, 0.043, "square");
  if (notes.bass)
    tone(context, bus, time, midi(notes.bass), 0.42, 0.13, "triangle");
  if (notes.arp)
    tone(context, bus, time, midi(notes.arp), 0.19, 0.057, "triangle");
  if (notes.bell)
    tone(context, bus, time, midi(notes.bell), 0.25, 0.033, "sine");
  if (notes.kick) tone(context, bus, time, 105, 0.12, 0.12, "sine", 42);
  if (notes.snare) noise(context, bus, buffer, time, 0.09, 0.042, 1700);
  if (notes.hat)
    noise(context, bus, buffer, time, 0.035, 0.017, 5200, "highpass");
}
export function playEffect(context, bus, buffer, event, time, variation = 0) {
  const pitch = 2 ** (((variation % 3) - 1) / 24),
    power = 0.65 + 0.35 * Math.min(1, (event.damage || 15) / 30);
  switch (event.kind) {
    case "sword":
      noise(context, bus, buffer, time, 0.095, 0.32 * power, 2600);
      tone(context, bus, time, 220 * pitch, 0.12, 0.22 * power, "triangle", 65);
      tone(context, bus, time, 1400 * pitch, 0.045, 0.055, "sine", 650);
      break;
    case "bow":
      noise(context, bus, buffer, time, 0.07, 0.2 * power, 1450);
      tone(
        context,
        bus,
        time,
        390 * pitch,
        0.11,
        0.24 * power,
        "triangle",
        105,
      );
      break;
    case "magic": {
      const base =
        { earth: 220, fire: 520, air: 950, water: 640 }[event.element] || 740;
      tone(
        context,
        bus,
        time,
        base * pitch,
        0.2,
        0.15 * power,
        "sine",
        base * 0.65,
      );
      tone(
        context,
        bus,
        time + 0.025,
        base * 1.5 * pitch,
        0.18,
        0.1 * power,
        "triangle",
      );
      noise(context, bus, buffer, time, 0.12, 0.09 * power, base * 2);
      break;
    }
    case "cast":
      tone(
        context,
        bus,
        time,
        event.style === "bow" ? 240 : 440,
        0.07,
        0.045,
        "triangle",
        event.style === "bow" ? 480 : 660,
      );
      break;
    case "ultimate":
      [60, 67, 72, 76].forEach((note, i) =>
        tone(
          context,
          bus,
          time + i * 0.045,
          midi(note),
          0.36,
          0.075,
          "triangle",
        ),
      );
      break;
    case "bonus":
      [84, 88, 91].forEach((note, i) =>
        tone(context, bus, time + i * 0.035, midi(note), 0.18, 0.09, "sine"),
      );
      break;
    case "heal":
      tone(context, bus, time, midi(76), 0.25, 0.065, "sine");
      tone(context, bus, time + 0.06, midi(79), 0.24, 0.055, "sine");
      break;
    case "hurt":
      noise(context, bus, buffer, time, 0.1, 0.2, 430);
      tone(context, bus, time, 110, 0.11, 0.12, "sine", 55);
      break;
    case "rock-break":
      noise(context,bus,buffer,time,.22,.35,1800);
      tone(context,bus,time,130,.2,.22,"triangle",48);
      noise(context,bus,buffer,time+.07,.13,.16,3200);
      break;
    case "chop":
      noise(context, bus, buffer, time, 0.055, 0.25, 850);
      tone(context, bus, time, 180 * pitch, 0.095, 0.25, "triangle", 85);
      break;
    case "gather":
    case "craft":
      [72, 79].forEach((note, i) =>
        tone(
          context,
          bus,
          time + i * 0.065,
          midi(note),
          0.2,
          0.075,
          "triangle",
        ),
      );
      break;
    case "forge":
      noise(context, bus, buffer, time, 0.12, 0.22, 2100);
      tone(context, bus, time, 720, 0.2, 0.1, "sine");
      tone(context, bus, time + 0.13, 1080, 0.25, 0.075, "triangle");
      break;
    case "step":
      noise(context, bus, buffer, time, 0.045, 0.09, 280);
      break;
  }
}
