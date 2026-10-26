const bindings = { ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right' };

export function createControls(canvas, touchControls) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const keys = new Set();
  const pointers = new Map();
  const clear = () => { keys.clear(); pointers.clear(); };
  canvas.addEventListener('keydown', event => {
    if (!bindings[event.code]) return;
    event.preventDefault();
    keys.add(event.code);
  }, options);
  window.addEventListener('keyup', event => keys.delete(event.code), options);
  window.addEventListener('blur', clear, options);
  canvas.addEventListener('blur', clear, options);
  document.addEventListener('visibilitychange', clear, options);
  touchControls.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, button.dataset.direction);
    }, options);
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, event => pointers.delete(event.pointerId), options);
    }
  });
  return {
    direction() {
      const active = new Set([...keys].map(key => bindings[key]).concat([...pointers.values()]));
      return { x: Number(active.has('right')) - Number(active.has('left')), y: Number(active.has('down')) - Number(active.has('up')) };
    },
    destroy() { clear(); controller.abort(); },
  };
}
