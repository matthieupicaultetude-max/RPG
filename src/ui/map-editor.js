import {
  captureMap,
  finishMapTraces,
  defaultMap,
  previewMap,
  applyMap,
  palette,
  editableProp,
  MAP_STORAGE_KEY,
} from "../dev/map-editor-model.js";
import { createExileEnvironment } from "../rendering/exile.js";
import {
  loadPortAssets,
  portAssetVersion,
} from "../rendering/exile-port-assets.js";
import { createExileWorld } from "../game/exile.js";
import { EXILE_SPAWN, canWalkExile } from "../world/exile-map.js";
const copy = (v) => structuredClone(v);
export function openMapEditor(game, onClose = () => {}) {
  game.setInterfaceOpen(true);
  game.setEditorOpen(true);
  game.clearInput();
  const dialog = document.createElement("dialog");
  dialog.className = "map-editor";
  dialog.innerHTML = `<header><strong>Éditeur · Comptoir de l’Exil</strong><button data-edit="close">Fermer</button></header>
  <div class="map-editor-tools"><button data-mode="select">Sélection</button><button data-mode="place">Placer</button><button data-mode="road">Route</button><button data-mode="sidewalk">Trottoir</button><button data-mode="pan">Déplacer la vue</button><button data-edit="undo">Annuler</button><button data-edit="redo">Rétablir</button><label><input type="checkbox" data-grid checked> Grille 4 px</label><label><input type="checkbox" data-collision> Collisions</label><button data-edit="fit">Vue entière</button></div>
  <div class="map-editor-body"><aside><label>Palette<select data-palette></select></label><label>Éléments<select data-elements size="9"></select></label><div class="map-editor-fields"><label>X <input data-x type="number" step="1"></label><label>Y <input data-y type="number" step="1"></label><label>Largeur <input data-width type="number" min="4" max="80"></label></div><button data-edit="duplicate">Dupliquer</button><button data-edit="delete">Supprimer</button><button data-edit="point-add">Ajouter un point</button><button data-edit="point-delete">Retirer le point</button><button data-edit="finish">Terminer le tracé</button><p>Glissez un objet ou un point. Molette : zoom. Outil Vue : panoramique. Les portes, tours et la fontaine sont verrouillées.</p><p>En mode Route ou Trottoir, cliquez pour tracer puis « Terminer ». Sélectionnez un tracé dans la liste pour le modifier.</p></aside><canvas class="map-editor-map" tabindex="0" aria-label="Carte éditable du Comptoir"></canvas><aside class="map-editor-palette" aria-label="Palette de décors"><strong>Décors à placer</strong><p>Glissez pour placer une fois. Cliquez pour placer plusieurs fois ; recliquez pour désélectionner.</p><label>Catégorie<select data-palette-category><option value="all">Tout</option><option value="houses">Bâtiments</option><option value="nature">Végétation</option><option value="props">Objets</option></select></label><div class="map-editor-tiles"></div></aside></div>
  <footer><button data-edit="save">Appliquer et sauvegarder</button><button data-edit="export">Exporter JSON</button><label class="map-editor-import">Importer JSON<input data-import type="file" accept=".json,application/json"></label><button data-edit="reset">Carte d’origine</button><span role="status">Modifications locales, indépendantes de la sauvegarde du personnage.</span></footer>`;
  document.body.append(dialog);
  dialog.showModal();
  const $ = (s) => dialog.querySelector(s),
    canvas = $("canvas"),
    g = canvas.getContext("2d");
  let doc = captureMap(),
    env,
    selected = null,
    mode = "select",
    pointIndex = 0,
    drag = null,
    zoom = 1,
    ox = 0,
    oy = 0,
    undo = [],
    redo = [],
    alive = true,
    version = -1,
    timer;
  let paletteVersion = -1,
    paletteDrag = null;
  const status = (t) => ($('[role="status"]').textContent = t);
  const paletteSelect = $("[data-palette]");
  for (const p of palette) {
    const option = new Option(
      `${p.name || p.kind} · ${p.asset || p.district || p.variant || p.kind}`,
      p.id,
    );
    paletteSelect.add(option);
  }
  const tiles = $(".map-editor-tiles");
  function chooseTemplate(id, toggle = false) {
    const deselect = toggle && mode === "place" && paletteSelect.value === id;
    finishTraces();
    paletteSelect.value = id;
    mode = deselect ? "select" : "place";
    sync();
    draw();
  }
  function renderPalette() {
    const bank = createExileEnvironment(previewMap(defaultMap));
    paletteVersion = portAssetVersion();
    tiles.replaceChildren();
    for (const template of palette) {
      const prop = bank.props.find((p) => p.id === template.id);
      if (!prop) continue;
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.template = template.id;
      card.dataset.category =
        template.kind === "exile-house"
          ? "houses"
          : ["tree", "flowers"].includes(template.kind)
            ? "nature"
            : "props";
      card.setAttribute(
        "aria-pressed",
        String(mode === "place" && paletteSelect.value === template.id),
      );
      const label =
        template.name ||
        {
          tree: "Arbre",
          flowers: "Fleurs",
          bench: "Banc",
          crate: "Caisse",
          barrel: "Tonneau",
          "exile-lamp": "Lampadaire",
          "exile-stall": "Étal",
        }[template.kind] ||
        template.kind;
      card.setAttribute("aria-label", `Placer : ${label}`);
      const thumb = document.createElement("canvas");
      thumb.width = 128;
      thumb.height = 112;
      thumb.setAttribute("aria-hidden", "true");
      const ctx = thumb.getContext("2d"),
        b = prop.bounds;
      const scale = Math.min(
        116 / (b.right - b.left),
        104 / (b.bottom - b.top),
        2,
      );
      ctx.imageSmoothingEnabled = false;
      ctx.translate(
        (128 - (b.right - b.left) * scale) / 2,
        (112 - (b.bottom - b.top) * scale) / 2,
      );
      ctx.scale(scale, scale);
      ctx.translate(-b.left, -b.top);
      prop.draw(ctx);
      const caption = document.createElement("span");
      caption.textContent = label;
      card.append(thumb, caption);
      tiles.append(card);
      card.addEventListener("click", (e) => {
        if (e.detail === 0) chooseTemplate(template.id, true);
      });
      card.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        card.setPointerCapture(e.pointerId);
        const ghost = document.createElement("img");
        ghost.src = thumb.toDataURL();
        ghost.className = "map-editor-drag-ghost";
        dialog.append(ghost);
        ghost.hidden = true;
        paletteDrag = {
          id: template.id,
          ghost,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        };
        moveGhost(e);
      });
      card.addEventListener("pointermove", (e) => {
        if (paletteDrag) {
          if (
            Math.hypot(e.clientX - paletteDrag.x, e.clientY - paletteDrag.y) > 6
          )
            paletteDrag.moved = true;
          paletteDrag.ghost.hidden = !paletteDrag.moved;
          moveGhost(e);
        }
      });
      card.addEventListener("pointerup", (e) => {
        if (!paletteDrag) return;
        const rect = canvas.getBoundingClientRect();
        if (
          paletteDrag.moved &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        )
          placeTemplate(paletteDrag.id, position(e));
        const wasDragged = paletteDrag.moved;
        paletteDrag.ghost.remove();
        paletteDrag = null;
        if (wasDragged) {
          mode = "select";
          sync();
          draw();
        } else chooseTemplate(template.id, true);
      });
      card.addEventListener("pointercancel", () => {
        paletteDrag?.ghost.remove();
        paletteDrag = null;
      });
    }
    filterPalette();
  }
  function moveGhost(e) {
    paletteDrag.ghost.style.left = `${e.clientX - 64}px`;
    paletteDrag.ghost.style.top = `${e.clientY - 90}px`;
  }
  function filterPalette() {
    const category = $("[data-palette-category]").value;
    for (const card of tiles.children)
      card.hidden = category !== "all" && card.dataset.category !== category;
  }
  $("[data-palette-category]").addEventListener("change", filterPalette);
  paletteSelect.addEventListener("change", () =>
    chooseTemplate(paletteSelect.value),
  );
  function placeTemplate(template, point) {
    change(() => {
      const id = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      doc.objects.push({ id, template, ...clamp(point) });
      selected = { type: "object", id };
    });
  }
  const selectedValue = () =>
    selected?.type === "object"
      ? doc.objects.find((p) => p.id === selected.id)
      : selected
        ? doc[selected.type].find((p) => p.id === selected.id)
        : null;
  const snapshot = () => JSON.stringify(doc);
  function remember(before) {
    if (before !== snapshot()) {
      undo.push(before);
      if (undo.length > 60) undo.shift();
      redo = [];
    }
  }
  function change(fn) {
    const before = snapshot();
    fn();
    remember(before);
    rebuild();
  }
  function finishTraces() {
    const before = snapshot();
    doc = finishMapTraces(doc);
    if (before === snapshot()) return;
    if (!selectedValue()) selected = null;
    remember(before);
    rebuild();
  }
  const viewMap = () =>
    previewMap({
      ...doc,
      roads: doc.roads.filter((r) => r.points.length >= 2),
      sidewalks: doc.sidewalks.filter((r) => r.points.length >= 2),
    });
  function rebuild() {
    try {
      env = createExileEnvironment(viewMap());
      version = portAssetVersion();
      status("Brouillon · appliquez pour tester en jeu.");
    } catch (e) {
      status(e.message);
    }
    if (paletteVersion !== portAssetVersion()) renderPalette();
    sync();
    draw();
  }
  function sync() {
    for (const b of tiles.querySelectorAll("button"))
      b.setAttribute(
        "aria-pressed",
        String(mode === "place" && b.dataset.template === paletteSelect.value),
      );
    const list = $("[data-elements]");
    list.replaceChildren();
    for (const [type, items] of [
      ["object", doc.objects],
      ["roads", doc.roads],
      ["sidewalks", doc.sidewalks],
    ])
      for (const p of items) {
        const option = new Option(
          `${type === "object" ? "▣" : type === "roads" ? "↝" : "▤"} ${p.id}`,
          `${type}:${p.id}`,
        );
        list.add(option);
      }
    list.value = selected ? `${selected.type}:${selected.id}` : "";
    const p = selectedValue(),
      pt = p
        ? selected.type === "object"
          ? [p.x, p.y]
          : p.points[Math.min(pointIndex, p.points.length - 1)]
        : null;
    $("[data-x]").value = pt?.[0] ?? "";
    $("[data-y]").value = pt?.[1] ?? "";
    $("[data-width]").value = p?.width ?? "";
    $("[data-width]").disabled = !p || selected.type === "object";
    for (const axis of ["x", "y"])
      $(`[data-${axis}]`).disabled =
        !p ||
        (selected.type === "object" &&
          !editableProp(viewMap().PROPS.find((q) => q.id === p.id)));
    dialog
      .querySelectorAll("[data-mode]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
      );
    $('[data-edit="undo"]').disabled = !undo.length;
    $('[data-edit="redo"]').disabled = !redo.length;
  }
  function draw() {
    if (!env) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#172b2e";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.setTransform(zoom, 0, 0, zoom, ox, oy);
    g.imageSmoothingEnabled = false;
    g.drawImage(env.ground, 0, 0);
    for (const p of [...env.props].sort((a, b) => a.y - b.y)) {
      g.save();
      if (drag?.kind === "object" && selected?.id === p.id) {
        const item = selectedValue();
        g.translate(item.x - drag.original.x, item.y - drag.original.y);
      }
      p.draw(g);
      g.restore();
    }
    if ($("[data-collision]").checked)
      for (const p of viewMap().PROPS) {
        const f = p.footprint;
        if (!f) continue;
        g.strokeStyle = "#ff7272";
        g.lineWidth = 1 / zoom;
        g.beginPath();
        if (f.type === "box")
          g.rect(p.x + f.left, p.y + f.top, f.right - f.left, f.bottom - f.top);
        else g.arc(p.x, p.y, f.radius, 0, Math.PI * 2);
        g.stroke();
      }
    const item = selectedValue();
    if (item) {
      g.strokeStyle = "#66efff";
      g.fillStyle = "#66efff";
      g.lineWidth = 2 / zoom;
      if (selected.type === "object") {
        const p = env.props.find((p) => p.id === item.id);
        if (p) {
          const dx = item.x - p.x,
            dy = item.y - p.y;
          g.strokeRect(
            p.bounds.left + dx,
            p.bounds.top + dy,
            p.bounds.right - p.bounds.left,
            p.bounds.bottom - p.bounds.top,
          );
        }
        g.beginPath();
        g.arc(item.x, item.y, 4 / zoom, 0, Math.PI * 2);
        g.fill();
      } else {
        g.beginPath();
        item.points.forEach(([x, y], i) =>
          i ? g.lineTo(x, y) : g.moveTo(x, y),
        );
        g.stroke();
        item.points.forEach(([x, y], i) => {
          g.fillStyle = i === pointIndex ? "#ffe18a" : "#66efff";
          g.fillRect(x - 4 / zoom, y - 4 / zoom, 8 / zoom, 8 / zoom);
        });
      }
    }
  }
  function fit() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    zoom = Math.min(canvas.width / 1480, canvas.height / 1280);
    ox = (canvas.width - 1440 * zoom) / 2;
    oy = (canvas.height - 1240 * zoom) / 2;
    draw();
  }
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);
  function position(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - ox) / zoom,
      y: (e.clientY - r.top - oy) / zoom,
    };
  }
  const snap = (n) =>
    Math.max(
      0,
      Math.round(n / ($("[data-grid]").checked ? 4 : 1)) *
        ($("[data-grid]").checked ? 4 : 1),
    );
  const clamp = (p) => ({
    x: Math.min(1440, snap(p.x)),
    y: Math.min(1240, snap(p.y)),
  });
  function select(type, id) {
    selected = { type, id };
    pointIndex = 0;
    sync();
    draw();
  }
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const p = position(e),
        r = canvas.getBoundingClientRect();
      zoom = Math.max(0.2, Math.min(4, zoom * Math.exp(-e.deltaY * 0.001)));
      ox = e.clientX - r.left - p.x * zoom;
      oy = e.clientY - r.top - p.y * zoom;
      draw();
    },
    { passive: false },
  );
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    canvas.focus();
    canvas.setPointerCapture(e.pointerId);
    const p = position(e),
      before = snapshot();
    if (mode === "pan" || e.button === 1) {
      drag = { kind: "pan", x: e.clientX, y: e.clientY, ox, oy };
      return;
    }
    if (mode === "place") {
      placeTemplate(paletteSelect.value, p);
      return;
    }
    if (mode === "road" || mode === "sidewalk") {
      const type = mode === "road" ? "roads" : "sidewalks";
      let line = selected?.type === type ? selectedValue() : null;
      if (!line) {
        line = {
          id: `trace-${Date.now()}`,
          width: mode === "road" ? 22 : 12,
          points: [],
        };
        doc[type].push(line);
        selected = { type, id: line.id };
      }
      const q = clamp(p);
      line.points.push([q.x, q.y]);
      pointIndex = line.points.length - 1;
      remember(before);
      if (line.points.length >= 2) rebuild();
      else {
        sync();
        draw();
        status("Cliquez pour placer le deuxième point.");
      }
      return;
    }
    const item = selectedValue();
    if (item && selected.type !== "object") {
      const idx = item.points.findIndex(
        ([x, y]) => Math.hypot(p.x - x, p.y - y) < 12 / zoom,
      );
      if (idx >= 0) {
        pointIndex = idx;
        drag = { kind: "point", before };
        sync();
        draw();
        return;
      }
    }
    const hit = [...env.props]
      .sort((a, b) => b.y - a.y)
      .find(
        (q) =>
          doc.objects.some((o) => o.id === q.id) &&
          p.x >= q.bounds.left + 2 &&
          p.x <= q.bounds.right - 2 &&
          p.y >= q.bounds.top + 2 &&
          p.y <= q.bounds.bottom &&
          q.hitTest(p.x, p.y),
      );
    if (hit) {
      select("object", hit.id);
      if (editableProp(hit))
        drag = {
          kind: "object",
          before,
          original: { ...selectedValue() },
          start: p,
        };
      else status("Monument verrouillé.");
    } else {
      selected = null;
      sync();
      draw();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (drag.kind === "pan") {
      ox = drag.ox + e.clientX - drag.x;
      oy = drag.oy + e.clientY - drag.y;
      draw();
      return;
    }
    const p = position(e),
      item = selectedValue();
    if (!item) return;
    if (drag.kind === "object")
      Object.assign(
        item,
        clamp({
          x: drag.original.x + p.x - drag.start.x,
          y: drag.original.y + p.y - drag.start.y,
        }),
      );
    else {
      const q = clamp(p);
      item.points[pointIndex] = [q.x, q.y];
    }
    draw();
  });
  function endDrag() {
    if (drag && drag.kind !== "pan") {
      remember(drag.before);
      drag = null;
      rebuild();
    }
    drag = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  $("[data-elements]").addEventListener("change", (e) => {
    const [type, ...id] = e.target.value.split(":");
    finishTraces();
    mode = "select";
    select(type, id.join(":"));
  });
  for (const key of ["x", "y", "width"])
    $(`[data-${key}]`).addEventListener("change", (e) => {
      const item = selectedValue(),
        n = Number(e.target.value);
      if (!item || !Number.isFinite(n)) return;
      change(() => {
        if (key === "width") item.width = Math.max(4, Math.min(80, n));
        else if (selected.type === "object")
          Object.assign(item, clamp({ ...item, [key]: n }));
        else
          item.points[pointIndex][key === "x" ? 0 : 1] = Math.max(
            0,
            Math.min(key === "x" ? 1440 : 1240, n),
          );
      });
    });
  $("[data-collision]").addEventListener("change", draw);
  function close() {
    alive = false;
    clearInterval(timer);
    paletteDrag?.ghost.remove();
    observer.disconnect();
    dialog.close();
    dialog.remove();
    game.setEditorOpen(false);
    game.setInterfaceOpen(false);
    onClose();
  }
  dialog.addEventListener("keydown", (e) => e.stopPropagation());
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.mode) {
      finishTraces();
      mode = b.dataset.mode;
      if (mode === "road" || mode === "sidewalk") selected = null;
      sync();
      draw();
      return;
    }
    const action = b.dataset.edit,
      item = selectedValue();
    try {
      if (action === "close") return close();
      if (action === "fit") return fit();
      if (action === "finish") {
        finishTraces();
        mode = "select";
        sync();
        draw();
        return;
      }
      if (action === "undo" || action === "redo") {
        const from = action === "undo" ? undo : redo,
          to = action === "undo" ? redo : undo;
        if (from.length) {
          to.push(snapshot());
          doc = JSON.parse(from.pop());
          selected = null;
          rebuild();
        }
        return;
      }
      if (action === "duplicate" && selected?.type === "object" && item) {
        const base = viewMap().PROPS.find((p) => p.id === item.id);
        if (!editableProp(base)) throw Error("Monument verrouillé.");
        change(() => {
          const p = {
            ...item,
            id: `placed-${Date.now()}`,
            x: Math.min(1440, item.x + 24),
            y: Math.min(1240, item.y + 24),
          };
          doc.objects.push(p);
          selected = { type: "object", id: p.id };
        });
      }
      if (action === "delete" && item) {
        if (selected.type === "object") {
          const base = viewMap().PROPS.find((p) => p.id === item.id);
          if (base.service || !editableProp(base))
            throw Error("Commerce ou monument protégé.");
        }
        change(() => {
          const type = selected.type === "object" ? "objects" : selected.type;
          doc[type] = doc[type].filter((p) => p !== item);
          selected = null;
        });
      }
      if (action === "point-add" && item?.points)
        change(() => {
          const p = item.points[pointIndex];
          item.points.splice(pointIndex + 1, 0, [
            Math.min(1440, p[0] + 16),
            p[1],
          ]);
          pointIndex++;
        });
      if (action === "point-delete" && item?.points) {
        if (item.points.length <= 2)
          throw Error("Un tracé doit conserver deux points.");
        change(() => {
          item.points.splice(pointIndex, 1);
          pointIndex = Math.max(0, pointIndex - 1);
        });
      }
      if (action === "reset")
        change(() => {
          doc = copy(defaultMap);
          selected = null;
        });
      if (action === "save") {
        finishTraces();
        const previous = captureMap();
        applyMap(doc);
        try {
          localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(doc));
        } catch (e) {
          applyMap(previous);
          throw Error(
            "Sauvegarde impossible : stockage du navigateur plein ou indisponible.",
          );
        }
        const world = createExileWorld();
        if (game.state.zone === "exile") {
          Object.assign(game.state, world);
          for (const p of game.state.team)
            if (!canWalkExile(p.x, p.y)) Object.assign(p, EXILE_SPAWN);
        } else if (game.state.zoneWorlds) delete game.state.zoneWorlds.exile;
        game.refresh();
        status(
          "Carte appliquée et sauvegardée dans ce navigateur. Exportez le JSON pour la partager.",
        );
      }
      if (action === "export") {
        finishTraces();
        previewMap(doc);
        const blob = new Blob([JSON.stringify(doc, null, 2)], {
            type: "application/json",
          }),
          url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "comptoir-exil.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status("JSON exporté.");
      }
    } catch (error) {
      status(error.message);
    }
  });
  $("[data-import]").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("Fichier trop volumineux.");
      const next = JSON.parse(await file.text());
      previewMap(next);
      change(() => {
        doc = next;
        selected = null;
      });
      status("Carte importée en brouillon. Appliquez pour sauvegarder.");
    } catch (error) {
      status(error.message);
    }
    e.target.value = "";
  });
  loadPortAssets();
  rebuild();
  fit();
  timer = setInterval(() => {
    if (alive && version !== portAssetVersion()) rebuild();
  }, 400);
  return close;
}
