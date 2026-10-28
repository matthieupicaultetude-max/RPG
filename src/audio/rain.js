// Continuous stereo rainfall shares the effects/master volume and audio lifecycle.
export function createRainAmbience(context, destination, noise) {
  const high = context.createBiquadFilter(),
    low = context.createBiquadFilter(),
    volume = context.createGain();
  high.type = "highpass";
  high.frequency.value = 700;
  low.type = "lowpass";
  low.frequency.value = 6200;
  volume.gain.value = 0;
  high.connect(low);
  low.connect(volume);
  volume.connect(destination);
  const sources = [],
    panners = [];
  for (let i = 0; i < 2; i++) {
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    if (context.createStereoPanner) {
      const pan = context.createStereoPanner();
      pan.pan.value = i ? 0.45 : -0.45;
      source.connect(pan);
      pan.connect(high);
      panners.push(pan);
    } else source.connect(high);
    source.start(0, i ? noise.duration * 0.37 : 0);
    sources.push(source);
  }
  let active = false,
    destroyed = false;
  return {
    setActive(value) {
      if (destroyed || active === value) return;
      active = value;
      volume.gain.setTargetAtTime(
        value ? 0.08 : 0,
        context.currentTime,
        value ? 0.35 : 0.18,
      );
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const source of sources) {
        source.stop();
        source.disconnect();
      }
      for (const p of panners) p.disconnect();
      high.disconnect();
      low.disconnect();
      volume.disconnect();
    },
  };
}
