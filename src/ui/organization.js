export const PANEL_GROUPS = [
  {
    id: "hero",
    label: "Héros",
    tabs: [
      ["equipment", "Sac & équipement"],
      ["characteristics", "Caractéristiques"],
      ["spells", "Sorts"],
      ["petshop", "Familiers"],
    ],
  },
  {
    id: "world",
    label: "Monde",
    tabs: [
      ["bestiary", "Bestiaire"],
      ["guides", "Guides des zones"],
    ],
  },
  {
    id: "craft",
    label: "Artisanat",
    tabs: [
      ["forge", "Forge"],
      ["professions", "Métiers"],
    ],
  },
  {
    id: "dev",
    label: "Développement",
    tabs: [
      ["tools", "Outils dev"],
      ["chest", "Coffre"],
    ],
  },
];
export const panelGroup = (tab) =>
  PANEL_GROUPS.find((g) => g.tabs.some(([id]) => id === tab)) ||
  PANEL_GROUPS[0];
export function panelNavigation() {
  return `<div class="panel-navigation"><nav class="panel-groups" aria-label="Catégories">${PANEL_GROUPS.map((g, i) => `<button data-panel-group="${g.id}" aria-pressed="${i === 0}">${g.id === "dev" ? '<span class="group-label-full">Développement</span><span class="group-label-short">Dev</span>' : g.label}</button>`).join("")}</nav>${PANEL_GROUPS.map((g, i) => `<nav class="panel-subnav tabs" data-panel-subnav="${g.id}" aria-label="${g.label}" ${i ? "hidden" : ""}>${g.tabs.map(([id, label]) => `<button data-tab="${id}" aria-pressed="${id === "equipment"}">${label}${id === "equipment" ? ' <span id="bag-count">0</span>' : ""}</button>`).join("")}</nav>`).join("")}</div>`;
}
export function syncPanelNavigation(app, tab) {
  const group = panelGroup(tab);
  app
    .querySelectorAll("[data-panel-group]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.panelGroup === group.id)),
    );
  app
    .querySelectorAll("[data-panel-subnav]")
    .forEach((n) => (n.hidden = n.dataset.panelSubnav !== group.id));
  app
    .querySelectorAll("[data-tab]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.tab === tab)),
    );
}
export function sections(scope, items) {
  return `<nav class="section-tabs" role="tablist" aria-label="Rubriques">${items.map((s, i) => `<button id="section-${scope}-${s.id}" data-section-scope="${scope}" data-section-id="${s.id}" role="tab" aria-controls="pane-${scope}-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? "0" : "-1"}">${s.label}</button>`).join("")}</nav>${items.map((s, i) => `<section id="pane-${scope}-${s.id}" data-section-panel="${scope}" data-section-id="${s.id}" role="tabpanel" aria-labelledby="section-${scope}-${s.id}" ${i ? "hidden" : ""}>${s.content}</section>`).join("")}`;
}
export function applySectionChoices(root, choices) {
  for (const scope of new Set(
    [...root.querySelectorAll("[data-section-scope]")].map(
      (b) => b.dataset.sectionScope,
    ),
  )) {
    const buttons = [...root.querySelectorAll("[data-section-scope]")].filter(
      (b) => b.dataset.sectionScope === scope,
    );
    const active =
      buttons.find((b) => b.dataset.sectionId === choices[scope]) || buttons[0];
    for (const b of buttons) {
      const selected = b === active;
      b.setAttribute("aria-selected", String(selected));
      b.tabIndex = selected ? 0 : -1;
    }
    for (const pane of root.querySelectorAll("[data-section-panel]"))
      if (pane.dataset.sectionPanel === scope)
        pane.hidden = pane.dataset.sectionId !== active.dataset.sectionId;
  }
}
export const disclosure = (id, label, body) =>
  `<details class="ui-disclosure" data-disclosure="${id}"><summary>${label}</summary>${body}</details>`;
