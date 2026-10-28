import { createJoystick } from "./joystick.js";
const bindings = {
  ArrowUp: "up",
  KeyW: "up",
  KeyZ: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export function createControls(canvas, touchControls) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const keys = new Set();
  const joystick = createJoystick(
    touchControls.querySelector("[data-joystick]"),
  );
  const clear = () => {
    keys.clear();
    joystick.clear();
  };
  canvas.addEventListener(
    "keydown",
    (event) => {
      if (!bindings[event.code]) return;
      event.preventDefault();
      keys.add(event.code);
    },
    options,
  );
  window.addEventListener("keyup", (event) => keys.delete(event.code), options);
  window.addEventListener("blur", clear, options);
  // Tapping a spell with the other thumb must not cancel the captured joystick.
  canvas.addEventListener("blur", () => keys.clear(), options);
  document.addEventListener("visibilitychange", clear, options);
  return {
    clear,
    direction() {
      const active = new Set([...keys].map((key) => bindings[key]));
      const x = Number(active.has("right")) - Number(active.has("left")),
        y = Number(active.has("down")) - Number(active.has("up"));
      return x || y ? { x, y } : joystick.direction();
    },
    destroy() {
      clear();
      joystick.destroy();
      controller.abort();
    },
  };
}
