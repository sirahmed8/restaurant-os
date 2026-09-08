/**
 * Dev-only logger. Keeps production consoles clean (perf + log-spam),
 * while preserving warn/error for real diagnostics.
 */
const isDev = (() => {
  try {
    return (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true;
  } catch {
    return false;
  }
})();

export const logger = {
  log(...args: unknown[]): void {
    if (isDev) console.log(...args);
  },
  info(...args: unknown[]): void {
    if (isDev) console.info(...args);
  },
  warn(...args: unknown[]): void {
    console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};

/** Fire-and-forget with error capture — never unhandled rejection. */
export function fireAndForget(promise: Promise<unknown>, label = 'task'): void {
  promise.catch((err) => console.error(`[${label}]`, err));
}
