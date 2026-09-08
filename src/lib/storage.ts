/**
 * Crash-safe localStorage access. Corrupt or quota-blocked storage must
 * never break terminal boot — fall back to defaults instead.
 */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privacy mode — non-fatal */
  }
}

export function loadString(key: string, fallback = ''): string {
  try {
    if (typeof window === 'undefined') return fallback;
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* non-fatal */
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* non-fatal */
  }
}
