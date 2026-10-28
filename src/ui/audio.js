import { createAudioEngine } from "../audio/engine.js";
export function createAudioUI(app) {
  const engine = createAudioEngine(),
    controller = new AbortController(),
    options = { signal: controller.signal };
  const button = app.querySelector('[data-action="audio"]');
  const panel = document.createElement("section");
  panel.id = "audio-settings";
  panel.className = "audio-settings";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "audio-title");
  panel.innerHTML = `<header><h2 id="audio-title">Ambiance sonore</h2><button aria-label="Fermer les réglages audio">✕</button></header><p class="audio-status" role="status"></p><label class="audio-mute"><input type="checkbox" id="audio-muted"/> Couper tous les sons</label>${[
    ["master", "Général"],
    ["music", "Musique"],
    ["effects", "Bruitages"],
  ]
    .map(
      ([key, label]) =>
        `<label class="audio-level" for="audio-${key}"><span>${label}</span><output for="audio-${key}"></output><input id="audio-${key}" data-audio-level="${key}" type="range" min="0" max="100" step="1"/></label>`,
    )
    .join("")}<small>Musique rétro douce · Pluie des marais réglable avec les bruitages.</small>`;
  app.querySelector(".game-screen").append(panel);
  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");
  function close() {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }
  function sync() {
    const settings = engine.preferences;
    button.innerHTML = `${settings.muted ? "🔇" : "🔊"}<span class="mobile-menu-label">Audio</span>`;
    button.setAttribute(
      "aria-label",
      settings.muted ? "Réglages audio · son coupé" : "Réglages audio",
    );
    panel.querySelector("#audio-muted").checked = settings.muted;
    for (const input of panel.querySelectorAll("[data-audio-level]")) {
      const value = Math.round(settings[input.dataset.audioLevel] * 100);
      if (document.activeElement !== input) input.value = value;
      input.previousElementSibling.value = `${value} %`;
    }
    panel.querySelector(".audio-status").textContent = {
      waiting: "Le son démarre à votre première interaction.",
      running: "Ambiance active",
      muted: "Tous les sons sont coupés",
      paused: "Ambiance en pause",
      unsupported: "Audio indisponible sur ce navigateur",
    }[engine.status];
  }
  button.addEventListener(
    "click",
    () => {
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) {
        sync();
        panel.querySelector("#audio-muted").focus();
      }
    },
    { ...options },
  );
  panel.querySelector("header button").addEventListener(
    "click",
    () => {
      close();
      app.querySelector("canvas").focus({ preventScroll: true });
    },
    options,
  );
  panel.addEventListener(
    "input",
    (event) => {
      if (event.target.dataset.audioLevel)
        engine.configure({
          [event.target.dataset.audioLevel]: Number(event.target.value) / 100,
        });
      if (event.target.id === "audio-muted")
        engine.configure({ muted: event.target.checked });
      sync();
    },
    options,
  );
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.code === "Escape" && !panel.hidden) {
        close();
        app.querySelector("canvas").focus({ preventScroll: true });
      }
    },
    options,
  );
  const unlock = () => {
    if (["running", "muted", "unsupported"].includes(engine.status)) return;
    void engine.unlock().then(sync);
  };
  document.addEventListener("pointerdown", unlock, {
    ...options,
    capture: true,
  });
  document.addEventListener("keydown", unlock, { ...options, capture: true });
  document.addEventListener(
    "visibilitychange",
    () => {
      engine.setHidden(document.hidden);
      sync();
    },
    options,
  );
  sync();
  return {
    close,
    update(state) {
      engine.process(state);
      if (!panel.hidden) sync();
    },
    destroy() {
      controller.abort();
      engine.destroy();
      panel.remove();
    },
  };
}
