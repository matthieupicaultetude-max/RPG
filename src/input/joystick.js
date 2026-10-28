export function joystickVector(dx, dy, radius, deadZone = 0.12) {
  const distance = Math.hypot(dx, dy),
    magnitude = Math.min(1, distance / radius);
  if (!distance || magnitude <= deadZone) return { x: 0, y: 0 };
  const strength = (magnitude - deadZone) / (1 - deadZone);
  return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}
export function createJoystick(element) {
  const controller = new AbortController(),
    options = { signal: controller.signal };
  let pointer = null,
    vector = { x: 0, y: 0 };
  const reset = () => {
    const captured = pointer;
    pointer = null;
    vector = { x: 0, y: 0 };
    element.style.setProperty("--stick-x", "0px");
    element.style.setProperty("--stick-y", "0px");
    element.classList.remove("active");
    if (captured !== null && element.hasPointerCapture(captured))
      element.releasePointerCapture(captured);
  };
  function update(event) {
    const box = element.getBoundingClientRect(),
      radius = box.width * 0.32,
      dx = event.clientX - box.left - box.width / 2,
      dy = event.clientY - box.top - box.height / 2;
    vector = joystickVector(dx, dy, radius);
    const distance = Math.hypot(dx, dy),
      scale = distance ? Math.min(1, radius / distance) : 0;
    element.style.setProperty("--stick-x", `${dx * scale}px`);
    element.style.setProperty("--stick-y", `${dy * scale}px`);
  }
  element.addEventListener(
    "pointerdown",
    (event) => {
      if (pointer !== null || event.button !== 0) return;
      event.preventDefault();
      pointer = event.pointerId;
      element.setPointerCapture(pointer);
      element.classList.add("active");
      update(event);
    },
    options,
  );
  element.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId === pointer) {
        event.preventDefault();
        update(event);
      }
    },
    options,
  );
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    element.addEventListener(
      type,
      (event) => {
        if (event.pointerId === pointer) reset();
      },
      options,
    );
  for (const type of ["blur", "resize"])
    window.addEventListener(type, reset, options);
  document.addEventListener("visibilitychange", reset, options);
  return {
    direction: () => ({ ...vector }),
    clear: reset,
    destroy() {
      reset();
      controller.abort();
    },
  };
}
