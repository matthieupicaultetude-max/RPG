// A notch or a short trackpad gesture changes once, never a whole team at once.
export function createCharacterWheel(onStep, clock = () => performance.now()) {
  let accumulated = 0;
  let lastEvent = -Infinity;
  let lastSwitch = -Infinity;
  return event => {
    if (event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    const now = clock();
    if (now - lastSwitch < 180) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    if (now - lastEvent > 220 || Math.sign(accumulated) !== Math.sign(delta)) accumulated = 0;
    accumulated += delta;
    lastEvent = now;
    if (Math.abs(accumulated) < 40) return;
    onStep(Math.sign(accumulated));
    accumulated = 0;
    lastSwitch = now;
  };
}
