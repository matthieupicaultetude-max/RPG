const groups = [
  ["Vue générale", [["all", "Tous les objets"]]],
  [
    "Équipements",
    [
      ["equipment", "Tous les équipements"],
      ["gear-armor", "Armures"],
      ["gear-weapons", "Armes"],
      ["gear-jewels", "Bijoux"],
      ["gear-shields", "Boucliers"],
      ["pets", "Familiers"],
      ["gear-trophies", "Trophées"],
    ],
  ],
  [
    "Objets",
    [
      ["cores", "Noyaux & fragments"],
      ["cores-classic", "Noyaux élémentaires"],
      ["cores-hybrid", "Noyaux biélément"],
      ["cores-fragments", "Fragments de noyau"],
      ["keys", "Clés & morceaux"],
      ["key-parts", "Morceaux royaux"],
      ["key-certificates", "Certificats"],
    ],
  ],
  [
    "Ressources",
    [
      ["loot", "Toutes les ressources"],
      ["loot-wood", "Bois & planches"],
      ["loot-normal", "Ressources normales"],
      ["loot-rare", "Ressources rares"],
      ["loot-chromatic", "Ressources chromatiques"],
    ],
  ],
];
export function filterOptions(selected) {
  return groups
    .map(
      ([label, options]) =>
        `<optgroup label="${label}">${options.map(([id, name]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${name}</option>`).join("")}</optgroup>`,
    )
    .join("");
}
export function matchesItemFilter(item, filter) {
  if (filter === "all") return true;
  if (filter === "equipment") return !!item.slot;
  if (filter === "gear-armor")
    return ["Coiffe", "Cape", "Ceinture", "Bottes"].includes(item.slot);
  if (filter === "gear-weapons") return item.slot === "Arme";
  if (filter === "gear-jewels")
    return ["Amulette", "Anneau 1", "Anneau 2"].includes(item.slot);
  if (filter === "gear-shields") return item.slot === "Bouclier";
  if (filter === "pets") return item.kind === "pet";
  if (filter === "gear-trophies")
    return item.slot?.startsWith("Trophée") || false;
  if (filter === "cores") return ["core", "core-fragment"].includes(item.kind);
  if (filter === "cores-classic") return item.kind === "core" && !item.elements;
  if (filter === "cores-hybrid") return item.kind === "core" && !!item.elements;
  if (filter === "cores-fragments") return item.kind === "core-fragment";
  if (filter === "keys")
    return ["dungeon-key", "royal-key-part"].includes(item.kind);
  if (filter === "key-parts") return item.kind === "royal-key-part";
  if (filter === "key-certificates") return item.kind === "certificate";
  if (filter === "loot-wood") return ["wood", "plank"].includes(item.kind);
  if (filter === "loot-normal") return item.type === "normal";
  if (filter === "loot-rare") return item.type === "rare";
  if (filter === "loot-chromatic") return !item.slot && item.chromatic === true;
  if (filter === "loot" || filter === "resources")
    return (
      !item.slot &&
      ![
        "core",
        "core-fragment",
        "dungeon-key",
        "royal-key-part",
        "certificate",
      ].includes(item.kind)
    );
  return false;
}
