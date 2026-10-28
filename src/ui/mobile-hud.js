export function createMobileHud(
  app,
  { onOpen = () => {}, onLayoutChange = () => {} } = {},
) {
  const screen = app.querySelector(".game-screen"),
    menu = app.querySelector("#hud-menu-panel"),
    toggle = app.querySelector("#mobile-menu-toggle"),
    scrim = app.querySelector("#mobile-menu-scrim");
  const media = matchMedia("(max-width: 900px), (pointer: coarse)"),
    controller = new AbortController(),
    options = { signal: controller.signal };
  let open = false;
  function setOpen(value, focus = false) {
    open = media.matches && value;
    menu.hidden = media.matches && !open;
    scrim.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Fermer le menu" : "Ouvrir le menu",
    );
    toggle.firstElementChild.textContent = open ? "✕" : "☰";
    screen.classList.toggle("menu-open", open);
    if (open) onOpen();
    if (focus) toggle.focus({ preventScroll: true });
  }
  function layout() {
    screen.classList.toggle("mobile-layout", media.matches);
    toggle.hidden = !media.matches;
    setOpen(false);
    onLayoutChange();
  }
  toggle.addEventListener("click", () => setOpen(!open), options);
  scrim.addEventListener("click", () => setOpen(false, true), options);
  menu.addEventListener(
    "click",
    (event) => {
      const button = event
        .composedPath()
        .find((node) => node.tagName === "BUTTON");
      if (button && !button.disabled) setOpen(false);
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.code === "Escape" && open) {
        event.preventDefault();
        setOpen(false, true);
      }
    },
    options,
  );
  media.addEventListener("change", layout, options);
  layout();
  return {
    get isMobile() {
      return media.matches;
    },
    close: () => setOpen(false),
    destroy() {
      controller.abort();
      menu.hidden = false;
      scrim.hidden = true;
      toggle.hidden = true;
      screen.classList.remove("mobile-layout", "menu-open");
    },
  };
}
