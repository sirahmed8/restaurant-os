/**
 * =====================================================================
 * RESTAURANT OS — INVENTORY & SUPPLY CHAIN STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import {
  InventoryItem,
  Supplier,
  PurchaseInvoice,
  StockMovement,
  WasteLog,
} from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';
import { firebaseService } from '../services/firebaseService';

interface InventoryState {
  items: InventoryItem[];
  suppliers: Supplier[];
  invoices: PurchaseInvoice[];
  movements: StockMovement[];
  wasteLogs: WasteLog[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;

  // Actions
  loadInventory: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;

  adjustStock: (
    itemId: string,
    deltaQuantity: number,
    type: StockMovement['type'],
    reason: string,
    employeeId: string
  ) => Promise<void>;

  addPurchaseInvoice: (invoice: PurchaseInvoice) => Promise<void>;
  recordWaste: (waste: WasteLog) => Promise<void>;
  getLowStockItems: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  suppliers: [],
  invoices: [],
  movements: [],
  wasteLogs: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,

  loadInventory: async () => {
    set({ isLoading: true });
    try {
      const [items, suppliers, invoices, movements, wasteLogs] = await Promise.all([
        db.getAll('inventoryItems'),
        db.getAll('suppliers'),
        db.getAll('purchaseInvoices'),
        db.getAll('stockMovements'),
        db.getAll('wasteLogs'),
      ]);

      set({
        items,
        suppliers,
        invoices,
        movements,
        wasteLogs,
        isLoading: false,
      });
    } catch (err) {
      console.error('[useInventoryStore] Error loading inventory:', err);
      set({ isLoading: false });
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  adjustStock: async (itemId, deltaQuantity, type, reason, employeeId) => {
    const item = await db.getById('inventoryItems', itemId);
    if (!item) return;

    const previousStock = item.currentStock;
    const newStock = Math.max(0, previousStock + deltaQuantity);

    // 1. Update item stock
    await db.update('inventoryItems', itemId, { currentStock: newStock });

    // 2. Record Stock Movement
    const movement: StockMovement = {
      id: db.generateUUID(),
      inventoryItemId: itemId,
      type,
      quantity: deltaQuantity,
      unitPrice: item.averageCost,
      previousStock,
      newStock,
      reason,
      employeeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.insert('stockMovements', movement);

    // 3. Low stock check & alert
    if (newStock <= item.minStockAlert) {
      eventBus.publish('INVENTORY_LOW_STOCK_ALERT', {
        item,
        currentStock: newStock,
        minStockAlert: item.minStockAlert,
      }, 'inventory');
    }

    await get().loadInventory();
    
    // Realtime Cloud Sync of Inventory
    firebaseService.syncRecord(`inventory/cairo-main/${itemId}`, {
      ...item,
      currentStock: newStock,
      updatedAt: new Date().toISOString(),
    });
  },

  addPurchaseInvoice: async (invoice) => {
    await db.insert('purchaseInvoices', invoice);
    await get().loadInventory();
  },

  recordWaste: async (waste) => {
    await db.insert('wasteLogs', waste);
    if (waste.inventoryItemId) {
      await get().adjustStock(
        waste.inventoryItemId,
        -waste.quantity,
        'waste',
        waste.reason,
        waste.reportedBy
      );
    }
    eventBus.publish('INVENTORY_WASTE_LOGGED', {
      inventoryItemId: waste.inventoryItemId,
      costAmount: waste.costAmount,
      reason: waste.reason,
    }, 'inventory');
  },

  getLowStockItems: () => {
    return get().items.filter((i) => i.currentStock <= i.minStockAlert);
  },
}));

db.subscribe('inventoryItems', (items) => {
  useInventoryStore.setState({ items });
});
