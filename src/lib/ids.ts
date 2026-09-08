/**
 * Collision-safe ID generator. Prefers crypto.randomUUID, falls back to
 * crypto.getRandomValues, then Math.random (last resort for old WebViews).
 */
export function newId(prefix = 'id'): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(2);
      crypto.getRandomValues(buf);
      return `${prefix}_${buf[0].toString(36)}${buf[1].toString(36)}`;
    }
  } catch {
    /* fall through */
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Stable cart-line key: avoids JSON.stringify on every render. */
export function cartLineKey(
  dishId: string,
  selectedModifiers?: Record<string, string>,
  notes?: string,
): string {
  if (!selectedModifiers || Object.keys(selectedModifiers).length === 0) {
    return `${dishId}|${notes ?? ''}`;
  }
  const modPart = Object.keys(selectedModifiers)
    .sort()
    .map((k) => `${k}=${selectedModifiers[k]}`)
    .join('&');
  return `${dishId}|${modPart}|${notes ?? ''}`;
}
