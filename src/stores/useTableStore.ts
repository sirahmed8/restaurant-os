/**
 * =====================================================================
 * RESTAURANT OS — FLOORPLAN & TABLE MANAGEMENT STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import { DiningTable, TableSection, TableStatus } from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';
import { firebaseService } from '../services/firebaseService';

interface TableState {
  sections: TableSection[];
  tables: DiningTable[];
  selectedSectionId: string | null;
  selectedTable: DiningTable | null;
  isLoading: boolean;

  // Actions
  loadTables: () => Promise<void>;
  setSelectedSection: (sectionId: string | null) => void;
  selectTable: (table: DiningTable | null) => void;
  updateTableStatus: (tableId: string, status: TableStatus, orderId?: string) => Promise<void>;
  updateTablePosition: (tableId: string, posX: number, posY: number) => Promise<void>;
  transferTable: (fromTableId: string, toTableId: string) => Promise<boolean>;
  mergeTables: (primaryTableId: string, secondaryTableId: string) => Promise<boolean>;
}

export const useTableStore = create<TableState>((set, get) => ({
  sections: [],
  tables: [],
  selectedSectionId: null,
  selectedTable: null,
  isLoading: false,

  loadTables: async () => {
    set({ isLoading: true });
    try {
      const [sections, tables] = await Promise.all([
        db.getAll('sections'),
        db.getAll('tables'),
      ]);

      sections.sort((a, b) => a.sortOrder - b.sortOrder);
      const firstSection = sections.length > 0 ? sections[0].id : null;

      set({
        sections,
        tables,
        selectedSectionId: get().selectedSectionId || firstSection,
        isLoading: false,
      });
    } catch (err) {
      console.error('[useTableStore] Error loading tables:', err);
      set({ isLoading: false });
    }
  },

  setSelectedSection: (selectedSectionId) => set({ selectedSectionId }),
  selectTable: (selectedTable) => set({ selectedTable }),

  updateTableStatus: async (tableId, status, orderId) => {
    const updated = await db.update('tables', tableId, {
      status,
      currentOrderId: orderId,
      lastOccupiedAt: status === 'occupied' ? new Date().toISOString() : undefined,
    });

    if (updated) {
      set((state) => ({
        tables: state.tables.map((t) => (t.id === tableId ? updated : t)),
        selectedTable: state.selectedTable?.id === tableId ? updated : state.selectedTable,
      }));

      // Realtime Firebase Table Sync (Floor Plan <-> POS <-> Waiter Tablets)
      firebaseService.syncRecord(`tables/cairo-main/${tableId}`, updated);
      firebaseService.trackEvent('table_status_changed', { tableId, status });
    }
  },

  updateTablePosition: async (tableId, posX, posY) => {
    const updated = await db.update('tables', tableId, { posX, posY });
    if (updated) {
      set((state) => ({
        tables: state.tables.map((t) => (t.id === tableId ? updated : t)),
      }));
    }
  },

  transferTable: async (fromTableId, toTableId) => {
    const from = await db.getById('tables', fromTableId);
    const to = await db.getById('tables', toTableId);

    if (!from || !to || !from.currentOrderId) return false;

    // Update order record
    await db.update('orders', from.currentOrderId, { tableId: to.tableNumber });

    // Update table statuses
    await db.update('tables', toTableId, {
      status: 'occupied',
      currentOrderId: from.currentOrderId,
      lastOccupiedAt: new Date().toISOString(),
    });

    await db.update('tables', fromTableId, {
      status: 'cleaning',
      currentOrderId: undefined,
    });

    await get().loadTables();
    return true;
  },

  mergeTables: async (primaryTableId, secondaryTableId) => {
    const primary = await db.getById('tables', primaryTableId);
    const secondary = await db.getById('tables', secondaryTableId);

    if (!primary || !secondary) return false;

    await db.update('tables', secondaryTableId, {
      status: 'occupied',
      currentOrderId: primary.currentOrderId,
    });

    await get().loadTables();
    return true;
  },
}));

db.subscribe('tables', (tables) => {
  useTableStore.setState({ tables });
});

db.subscribe('sections', (sections) => {
  useTableStore.setState({ sections: sections.sort((a, b) => a.sortOrder - b.sortOrder) });
});
