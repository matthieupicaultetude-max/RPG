import test from "node:test";
import assert from "node:assert/strict";
import {
  PANEL_GROUPS,
  panelGroup,
  panelNavigation,
  sections,
} from "../src/ui/organization.js";
import { DEV_ITEMS } from "../src/data/dev-items.js";
import { matchesItemFilter, filterOptions } from "../src/ui/item-filters.js";
import { createSandbox } from "../src/dev/sandbox.js";
import { renderCharacteristics } from "../src/ui/characteristics.js";
import { renderForge } from "../src/ui/forge.js";
import { renderProfessions } from "../src/ui/professions.js";
import { renderPetShop } from "../src/ui/petshop.js";
import { renderBestiary } from "../src/ui/bestiary.js";
import { renderDevTools } from "../src/ui/dev-tools.js";
import {
  renderZoneGuides,
  renderZoneOverlays,
  ZONE_GUIDES,
} from "../src/ui/zone-guides.js";

test("navigation: every panel has exactly one category; the footer shows only its first subgroup", () => {
  const tabs = PANEL_GROUPS.flatMap((g) => g.tabs.map(([id]) => id));
  assert.equal(new Set(tabs).size, tabs.length);
  for (const group of PANEL_GROUPS)
    for (const [tab] of group.tabs) assert.equal(panelGroup(tab).id, group.id);
  for (const id of [
    "equipment",
    "characteristics",
    "spells",
    "petshop",
    "bestiary",
    "guides",
    "forge",
    "professions",
    "tools",
    "chest",
  ])
    assert.ok(tabs.includes(id));
  const markup = panelNavigation();
  assert.equal((markup.match(/data-panel-group=/g) || []).length, 4);
  assert.equal((markup.match(/data-panel-subnav=/g) || []).length, 4);
  assert.equal((markup.match(/id="bag-count"/g) || []).length, 1);
});

test("sections: accessible tab/panel association, only the first panel visible, no duplicate IDs", () => {
  const html = sections("example", [
    { id: "one", label: "Un", content: "Premier" },
    { id: "two", label: "Deux", content: "Second" },
  ]);
  assert.ok(html.includes('role="tablist"'));
  assert.ok(html.includes('aria-controls="pane-example-one"'));
  assert.ok(html.includes('aria-labelledby="section-example-two"'));
  assert.ok(html.includes('aria-selected="true" tabindex="0"'));
  assert.ok(html.includes('aria-selected="false" tabindex="-1"'));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});

test("item subcategories: armour/weapons/jewels/pets, elemental vs hybrid cores and rare resources stay distinct", () => {
  const list = (id) =>
    DEV_ITEMS.filter((e) => matchesItemFilter(e.item, id)).map((e) => e.item);
  assert.equal(list("all").length, 247);
  assert.equal(list("gear-weapons").length, 17);
  assert.equal(list("gear-armor").length, 68);
  assert.equal(list("pets").length, 8);
  assert.equal(list("cores-classic").length, 4);
  assert.equal(list("cores-hybrid").length, 4);
  assert.equal(list("cores-fragments").length, 8);
  assert.equal(list("key-parts").length, 4);
  assert.equal(list("key-certificates").length, 4);
  assert.ok(list("loot-wood").every((i) => ["wood", "plank"].includes(i.kind)));
  assert.ok(list("loot-rare").every((i) => i.type === "rare"));
  assert.ok(list("loot-chromatic").every((i) => i.chromatic && !i.slot));
  assert.equal(matchesItemFilter(DEV_ITEMS[0].item, "missing"), false);
  assert.ok(
    filterOptions("cores-hybrid").includes('<optgroup label="Objets">'),
  );
  assert.ok(
    filterOptions("cores-hybrid").includes('value="cores-hybrid" selected'),
  );
});

test("panels separate primary actions without removing any crafting, allocation, adoption or loot controls", () => {
  const s = createSandbox();
  const cases = [
    [renderCharacteristics(s), ["allocate", "combat", "sets", "reset"]],
    [renderForge(s), ["upgrade", "recycle"]],
    [renderProfessions(s), ["harvest", "craft"]],
    [renderPetShop(s), ["adopt", "boss"]],
    [renderBestiary("volcano-slime", 9), ["overview", "combat", "stats"]],
    [renderDevTools(s), ["progress", "objects", "travel", "journal"]],
  ];
  for (const [html, ids] of cases) {
    for (const id of ids) assert.ok(html.includes(`data-section-id="${id}"`));
    assert.equal(/undefined|NaN/.test(html), false);
  }
  assert.ok(renderCharacteristics(s).includes('data-allocate-stat="Force"'));
  assert.ok(renderForge(s).includes("data-exchange-core"));
  assert.ok(renderProfessions(s).includes("data-craft-planks"));
  assert.ok(renderPetShop(s).includes("data-adopt"));
  assert.ok(
    renderBestiary("volcano-slime", 9).includes('data-monster-stat="maxHp"'),
  );
});

test("zone guides: eight distinct guides with short primary steps, detailed rules on demand and stable contextual IDs", () => {
  assert.equal(ZONE_GUIDES.length, 8);
  assert.equal(new Set(ZONE_GUIDES.map((g) => g.zone)).size, 8);
  for (const guide of ZONE_GUIDES) {
    assert.equal(guide.tips.length, 3);
    const html = renderZoneGuides(guide.zone);
    assert.ok(html.includes(guide.rule));
    assert.ok(html.includes("Règles détaillées"));
    assert.ok(html.includes('id="guide-zone"'));
    assert.ok(html.includes(`value="${guide.zone}" selected`));
    assert.equal(/undefined|NaN/.test(html), false);
  }
  const overlays = renderZoneOverlays();
  for (const g of ZONE_GUIDES) {
    assert.ok(overlays.includes(`id="${g.id}-guide"`));
    assert.ok(overlays.includes(`data-action="close-${g.id}-guide"`));
  }
});
