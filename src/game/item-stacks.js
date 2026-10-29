// Mutable equipment/pets must be split before equipping, upgrading or feeding.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((k) => value[k] !== undefined)
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export function stackKey(item) {
  const { id, quantity, ...data } = item;
  return JSON.stringify(
    canonical({ ...data, chromatic: item.chromatic === true }),
  );
}
export function putInBag(s, item, quantity = item.quantity || 1) {
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw Error("Quantité invalide");
  const key = stackKey(item),
    existing = s.bag.find((i) => stackKey(i) === key);
  if (existing) {
    existing.quantity += quantity;
    return existing;
  }
  const entry =
    item.id !== undefined
      ? item
      : structuredClone({ ...item, id: s.nextItem++ });
  entry.quantity = quantity;
  s.bag.push(entry);
  return entry;
}
export function takeOne(s, id) {
  const index = s.bag.findIndex((i) => i.id === id);
  if (index < 0) return null;
  const item = s.bag[index];
  if (item.quantity > 1) {
    item.quantity--;
    return structuredClone({ ...item, id: s.nextItem++, quantity: 1 });
  }
  s.bag.splice(index, 1);
  item.quantity = 1;
  return item;
}
