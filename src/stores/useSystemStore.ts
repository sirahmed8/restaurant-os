/**
 * =====================================================================
 * RESTAURANT OS — SYSTEM, AUTH & OFFLINE SYNC STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import { Employee, SyncQueueItem } from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';

interface SystemState {
  currentEmployee: Employee | null;
  employees: Employee[];
  isOnline: boolean;
  theme: 'dark' | 'light' | 'luxury';
  language: 'ar' | 'en';
  syncQueueCount: number;
  isSyncing: boolean;

  // Actions
  initSystem: () => Promise<void>;
  loginWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  switchEmployee: (employeeId: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'luxury') => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  syncOfflineQueue: () => Promise<void>;
  resetDatabaseToInitialSeed: () => Promise<void>;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  currentEmployee: null,
  employees: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  theme: 'dark',
  language: 'ar',
  syncQueueCount: 0,
  isSyncing: false,

  initSystem: async () => {
    try {
      await db.init();
      const employees = await db.getAll('employees');
      const queue = await db.getAll('syncQueue');

      // Auto login as default admin for instant interactive preview
      const defaultAdmin = employees.find((e) => e.role === 'admin') || employees[0] || null;

      set({
        employees,
        currentEmployee: defaultAdmin,
        syncQueueCount: queue.filter((q) => q.status === 'pending').length,
      });

      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          set({ isOnline: true });
          eventBus.publish('SYSTEM_ONLINE', { timestamp: new Date().toISOString() });
          get().syncOfflineQueue();
        });

        window.addEventListener('offline', () => {
          set({ isOnline: false });
          eventBus.publish('SYSTEM_OFFLINE', { timestamp: new Date().toISOString() });
        });
      }
    } catch (e) {
      console.error('[useSystemStore] Init error:', e);
    }
  },

  loginWithPin: async (pin: string) => {
    const { employees } = get();
    // Compare plain pin or hash
    const found = employees.find((e) => e.pinCodeHash === pin && e.isActive);
    if (found) {
      set({ currentEmployee: found });
      return true;
    }
    return false;
  },

  logout: () => set({ currentEmployee: null }),

  switchEmployee: (employeeId) => {
    const found = get().employees.find((e) => e.id === employeeId);
    if (found) {
      set({ currentEmployee: found });
    }
  },

  setTheme: (theme) => set({ theme }),

  setLanguage: (language) => {
    set({ language });
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  },

  syncOfflineQueue: async () => {
    set({ isSyncing: true });
    try {
      const pendingItems = await db.query('syncQueue', {
        where: (q) => q.status === 'pending',
      });

      // Simulate sending each batch to cloud
      for (const item of pendingItems) {
        await db.update('syncQueue', item.id, {
          status: 'synced',
          lastAttemptAt: new Date().toISOString(),
        });
      }

      set({ syncQueueCount: 0, isSyncing: false });
      eventBus.publish('SYNC_QUEUE_PROCESSED', {
        syncedCount: pendingItems.length,
        pendingCount: 0,
      });
    } catch (e) {
      console.error('[useSystemStore] Sync failed:', e);
      set({ isSyncing: false });
    }
  },

  resetDatabaseToInitialSeed: async () => {
    await db.seedMockData();
    eventBus.publish('DATABASE_RESET', { timestamp: new Date().toISOString() });
    await get().initSystem();
  },
}));

db.subscribe('syncQueue', (queue) => {
  useSystemStore.setState({
    syncQueueCount: queue.filter((q) => q.status === 'pending').length,
  });
});
