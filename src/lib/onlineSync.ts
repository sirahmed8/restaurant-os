/**
 * Browser connectivity → store + cloud sync bridge.
 * Uses dynamic imports so the heavy sync gateway (and Firebase) never
 * joins the initial bundle — it loads on first online event / visibility
 * return instead. Safe to call once from App; returns an unbind function.
 */
export function bindOnlineSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  let disposed = false;

  const setFlags = async (online: boolean) => {
    try {
      const { useAppStore } = await import('../stores/useAppStore');
      if (disposed) return;
      useAppStore.getState().setIsOnline(online);
      if (online) {
        const { syncGateway } = await import('../services/syncGateway');
        if (disposed) return;
        syncGateway.flushQueue('online').catch(() => {});
      }
    } catch {
      /* offline-first: sync is best-effort */
    }
  };

  const onOnline = () => void setFlags(true);
  const onOffline = () => void setFlags(false);
  const onVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) void setFlags(true);
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisible);

  // Reconcile initial state (navigator.onLine lies on some Electron builds,
  // so this only corrects an optimistic `true` default, never forces offline).
  if (navigator.onLine === false) void setFlags(false);

  return () => {
    disposed = true;
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
