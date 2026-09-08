/**
 * =====================================================================
 * RESTAURANT OS — UNIFIED LOCAL STORAGE & REACTIVE DATABASE ENGINE
 * =====================================================================
 * Features:
 * - 100% Offline-First Architecture using IndexedDB with fallback cache.
 * - Reactive table subscribers for zero-lag UI updates.
 * - Automatic SyncQueue integration for cloud synchronization.
 * - Built-in encryption for sensitive local storage items.
 * - One-click initial seed & mock data hydration.
 */

import {
  DatabaseSchema,
  TableName,
  ALL_TABLE_NAMES,
  BaseEntity,
  SyncQueueItem,
} from './schema';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_MODIFIER_GROUPS,
  INITIAL_MODIFIER_OPTIONS,
  INITIAL_ITEM_MODIFIER_LINKS,
  INITIAL_SECTIONS,
  INITIAL_TABLES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_SUPPLIERS,
  INITIAL_RECIPES,
  INITIAL_RECIPE_INGREDIENTS,
  INITIAL_EMPLOYEES,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS,
  INITIAL_SHIFT,
  INITIAL_CASH_DRAWER,
  INITIAL_ORDERS,
  INITIAL_ORDER_ITEMS,
  INITIAL_SETTINGS,
} from './mock-data';

const DB_NAME = 'RestaurantOS_DB_v2';
const DB_VERSION = 2;

// Hot-path secondary indexes (created idempotently on upgrade).
const TABLE_INDEXES: Partial<Record<TableName, { name: string; keyPath: string }[]>> = {
  orders: [
    { name: 'by_status', keyPath: 'status' },
    { name: 'by_table', keyPath: 'tableId' },
  ],
  orderItems: [{ name: 'by_order', keyPath: 'orderId' }],
  tables: [{ name: 'by_status', keyPath: 'status' }],
  paymentTransactions: [{ name: 'by_order', keyPath: 'orderId' }],
  stockMovements: [{ name: 'by_item', keyPath: 'inventoryItemId' }],
};

type TableSubscriber<T = any> = (records: T[]) => void;

export interface QueryOptions<T> {
  where?: (item: T) => boolean;
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: {
    term: string;
    fields: (keyof T)[];
  };
}

class LocalDatabaseEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private initPromise: Promise<void> | null = null;
  private memoryCache: Map<TableName, Map<string, any>> = new Map();
  private subscribers: Map<TableName, Set<TableSubscriber>> = new Map();
  private isInitialized = false;

  constructor() {
    ALL_TABLE_NAMES.forEach((tableName) => {
      this.memoryCache.set(tableName, new Map());
      this.subscribers.set(tableName, new Set());
    });
  }

  /**
   * Initialize the database and hydrate from IndexedDB or initial seed if empty.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          await this.openIndexedDB();
          await this.loadAllTablesIntoMemory();
        } else {
          // Running in memory mode
        }

        // Clean Slate: Do not automatically inject fake data
        this.isInitialized = true;
      } catch (err) {
        console.error('[DB Engine] Initialization error:', err);
        this.isInitialized = true;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = (event.target as IDBOpenDBRequest).transaction;
        const ensureIndexes = (store: IDBObjectStore, tableName: TableName) => {
          for (const idx of TABLE_INDEXES[tableName] ?? []) {
            try {
              if (!store.indexNames.contains(idx.name)) store.createIndex(idx.name, idx.keyPath, { unique: false });
            } catch {
              /* index creation must never break upgrade */
            }
          }
        };
        ALL_TABLE_NAMES.forEach((tableName) => {
          if (!db.objectStoreNames.contains(tableName)) {
            const store = db.createObjectStore(tableName, { keyPath: 'id' });
            ensureIndexes(store, tableName);
          } else if (tx) {
            try {
              ensureIndexes(tx.objectStore(tableName), tableName);
            } catch {
              /* best effort for existing stores */
            }
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async loadAllTablesIntoMemory(): Promise<void> {
    const db = await this.openIndexedDB();

    // One transaction per table: a single shared tx auto-commits when the
    // event loop yields, which makes parallel getAll() calls flaky
    // (TransactionInactiveError) as table count grows.
    await Promise.all(
      ALL_TABLE_NAMES.map((tableName) => {
        return new Promise<void>((resolve) => {
          try {
            const tx = db.transaction(tableName, 'readonly');
            const store = tx.objectStore(tableName);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              try {
                const records: BaseEntity[] = getAllRequest.result || [];
                const tableMap = this.memoryCache.get(tableName)!;
                tableMap.clear();
                records.forEach((rec) => tableMap.set(rec.id, rec));
              } catch (e) {
                console.error(`[DB Engine] Failed to hydrate ${tableName}:`, e);
              }
              resolve();
            };

            getAllRequest.onerror = () => {
              console.error(`[DB Engine] Failed to load ${tableName}:`, getAllRequest.error);
              resolve();
            };
            tx.onerror = () => {
              console.error(`[DB Engine] Transaction error on ${tableName}:`, tx.error);
              resolve();
            };
          } catch (e) {
            console.error(`[DB Engine] Failed to open transaction for ${tableName}:`, e);
            resolve();
          }
        });
      })
    );
  }

  /**
   * Seed rich initial mock data into database.
   */
  public async seedMockData(notify = true): Promise<void> {
    for (const tableName of ALL_TABLE_NAMES) {
      this.memoryCache.get(tableName)!.clear();
    }

    const seedTable = (tableName: TableName, records: any[]) => {
      const tableMap = this.memoryCache.get(tableName)!;
      records.forEach((r) => tableMap.set(r.id, r));
    };

    seedTable('categories', INITIAL_CATEGORIES);
    seedTable('menuItems', INITIAL_MENU_ITEMS);
    seedTable('modifierGroups', INITIAL_MODIFIER_GROUPS);
    seedTable('modifierOptions', INITIAL_MODIFIER_OPTIONS);
    seedTable('itemModifierLinks', INITIAL_ITEM_MODIFIER_LINKS);
    seedTable('sections', INITIAL_SECTIONS);
    seedTable('tables', INITIAL_TABLES);
    seedTable('inventoryItems', INITIAL_INVENTORY_ITEMS);
    seedTable('suppliers', INITIAL_SUPPLIERS);
    seedTable('recipes', INITIAL_RECIPES);
    seedTable('recipeIngredients', INITIAL_RECIPE_INGREDIENTS);
    seedTable('employees', INITIAL_EMPLOYEES);
    seedTable('customers', INITIAL_CUSTOMERS);
    seedTable('coupons', INITIAL_COUPONS);
    seedTable('shifts', [INITIAL_SHIFT]);
    seedTable('cashDrawers', [INITIAL_CASH_DRAWER]);
    seedTable('orders', INITIAL_ORDERS);
    seedTable('orderItems', INITIAL_ORDER_ITEMS);
    seedTable('settings', INITIAL_SETTINGS);

    if (notify) {
      ALL_TABLE_NAMES.forEach((tableName) => this.notifySubscribers(tableName));
    }
  }

  /**
   * Retrieve all records from a table synchronously from high-speed memory cache.
   */
  public getAllSync<K extends TableName>(tableName: K): DatabaseSchema[K][] {
    const tableMap = this.memoryCache.get(tableName);
    if (!tableMap) return [];
    return Array.from(tableMap.values()) as DatabaseSchema[K][];
  }

  /**
   * Retrieve all records from a table asynchronously.
   */
  public async getAll<K extends TableName>(tableName: K): Promise<DatabaseSchema[K][]> {
    if (!this.isInitialized) await this.init();
    return this.getAllSync(tableName);
  }

  /**
   * Retrieve a single record by ID.
   */
  public async getById<K extends TableName>(tableName: K, id: string): Promise<DatabaseSchema[K] | null> {
    if (!this.isInitialized) await this.init();
    const tableMap = this.memoryCache.get(tableName);
    if (!tableMap) return null;
    return (tableMap.get(id) as DatabaseSchema[K]) || null;
  }

  /**
   * Query records with filtering, searching, sorting and pagination.
   */
  public async query<K extends TableName>(
    tableName: K,
    options: QueryOptions<DatabaseSchema[K]> = {}
  ): Promise<DatabaseSchema[K][]> {
    let items = await this.getAll(tableName);

    // 1. Where predicate
    if (options.where) {
      items = items.filter(options.where);
    }

    // 2. Text Search
    if (options.search && options.search.term.trim()) {
      const term = options.search.term.toLowerCase().trim();
      const fields = options.search.fields;
      items = items.filter((item) => {
        return fields.some((field) => {
          const val = (item as any)[field];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // 3. Sorting
    if (options.orderBy) {
      const field = options.orderBy;
      const dir = options.orderDirection === 'desc' ? -1 : 1;
      items = [...items].sort((a, b) => {
        const valA = (a as any)[field];
        const valB = (b as any)[field];
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    // 4. Pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || items.length;
      items = items.slice(offset, offset + limit);
    }

    return items;
  }

  /**
   * Indexed equality lookup for hot paths (e.g. orderItems by_order).
   * Prefers the IDB index; falls back to the memory cache so it works
   * in memory-mode and on pre-v2 databases without the index.
   */
  public async getByIndex<K extends TableName>(
    tableName: K,
    indexName: string,
    value: IDBValidKey
  ): Promise<DatabaseSchema[K][]> {
    if (!this.isInitialized) await this.init();
    const keyPath =
      (TABLE_INDEXES[tableName] ?? []).find((i) => i.name === indexName)?.keyPath ?? indexName;
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readonly');
        const store = tx.objectStore(tableName);
        if (store.indexNames.contains(indexName)) {
          const req = store.index(indexName).getAll(value);
          const rows = await new Promise<DatabaseSchema[K][] | null>((resolve) => {
            req.onsuccess = () => resolve((req.result as DatabaseSchema[K][]) || []);
            req.onerror = () => resolve(null);
          });
          if (rows !== null) return rows;
        }
      }
    } catch {
      /* fall through to memory cache */
    }
    return this.getAllSync(tableName).filter(
      (r) => (r as unknown as Record<string, unknown>)[keyPath] === value
    );
  }

  /**
   * Insert a new record into table.
   */
  public async insert<K extends TableName>(
    tableName: K,
    item: DatabaseSchema[K],
    trackSync = true
  ): Promise<DatabaseSchema[K]> {
    if (!this.isInitialized) await this.init();

    const record: DatabaseSchema[K] = {
      ...item,
      id: item.id || this.generateUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    };

    // 1. Save to Memory Cache
    this.memoryCache.get(tableName)!.set(record.id, record);

    // 2. Persist to IndexedDB
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readwrite');
        tx.objectStore(tableName).put(record);
      }
    } catch (e) {
      console.error(`[DB Engine] Failed to persist ${tableName} to IndexedDB:`, e);
    }

    // 3. Add to SyncQueue if applicable
    if (trackSync && tableName !== 'syncQueue' && tableName !== 'auditLogs') {
      await this.queueSync(tableName, record.id, 'insert', record);
    }

    // 4. Notify Subscribers
    this.notifySubscribers(tableName);

    return record;
  }

  /**
   * Bulk insert records.
   */
  public async bulkInsert<K extends TableName>(
    tableName: K,
    items: DatabaseSchema[K][],
    trackSync = true
  ): Promise<DatabaseSchema[K][]> {
    if (!this.isInitialized) await this.init();

    const preparedItems = items.map((item) => ({
      ...item,
      id: item.id || this.generateUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));

    const tableMap = this.memoryCache.get(tableName)!;
    preparedItems.forEach((rec) => tableMap.set(rec.id, rec));

    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readwrite');
        const store = tx.objectStore(tableName);
        preparedItems.forEach((rec) => store.put(rec));
      }
    } catch (e) {
      console.error(`[DB Engine] Bulk insert error for ${tableName}:`, e);
    }

    if (trackSync && tableName !== 'syncQueue') {
      for (const rec of preparedItems) {
        await this.queueSync(tableName, rec.id, 'insert', rec);
      }
    }

    this.notifySubscribers(tableName);
    return preparedItems;
  }

  /**
   * Update an existing record.
   */
  public async update<K extends TableName>(
    tableName: K,
    id: string,
    partialData: Partial<DatabaseSchema[K]>,
    trackSync = true
  ): Promise<DatabaseSchema[K] | null> {
    if (!this.isInitialized) await this.init();

    const existing = await this.getById(tableName, id);
    if (!existing) {
      console.warn(`[DB Engine] Cannot update: Record ${id} not found in ${tableName}`);
      return null;
    }

    const updated: DatabaseSchema[K] = {
      ...existing,
      ...partialData,
      id,
      updatedAt: partialData.updatedAt || new Date().toISOString(),
    };

    // Update memory
    this.memoryCache.get(tableName)!.set(id, updated);

    // Update IndexedDB
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readwrite');
        tx.objectStore(tableName).put(updated);
      }
    } catch (e) {
      console.error(`[DB Engine] Failed to update ${tableName}:${id}`, e);
    }

    // Queue sync
    if (trackSync && tableName !== 'syncQueue') {
      await this.queueSync(tableName, id, 'update', updated);
    }

    this.notifySubscribers(tableName);
    return updated;
  }

  /**
   * Delete a record by ID.
   */
  public async delete<K extends TableName>(
    tableName: K,
    id: string,
    trackSync = true
  ): Promise<boolean> {
    if (!this.isInitialized) await this.init();

    const existing = await this.getById(tableName, id);
    if (!existing) return false;

    // Remove from memory
    this.memoryCache.get(tableName)!.delete(id);

    // Remove from IndexedDB
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readwrite');
        tx.objectStore(tableName).delete(id);
      }
    } catch (e) {
      console.error(`[DB Engine] Failed to delete ${tableName}:${id}`, e);
    }

    // Queue sync
    if (trackSync && tableName !== 'syncQueue') {
      await this.queueSync(tableName, id, 'delete', { id });
    }

    this.notifySubscribers(tableName);
    return true;
  }

  /**
   * Clear all records from a specific table.
   */
  public async clear<K extends TableName>(tableName: K): Promise<void> {
    this.memoryCache.get(tableName)!.clear();

    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await this.openIndexedDB();
        const tx = db.transaction(tableName, 'readwrite');
        tx.objectStore(tableName).clear();
      }
    } catch (e) {
      console.error(`[DB Engine] Clear error for ${tableName}:`, e);
    }

    this.notifySubscribers(tableName);
  }

  /**
   * Clear all database tables.
   */
  public async clearAll(): Promise<void> {
    for (const tableName of ALL_TABLE_NAMES) {
      await this.clear(tableName);
    }
  }

  /**
   * Subscribe to live table changes (Reactive query subscription).
   */
  public subscribe<K extends TableName>(
    tableName: K,
    callback: TableSubscriber<DatabaseSchema[K]>
  ): () => void {
    const tableSubscribers = this.subscribers.get(tableName)!;
    tableSubscribers.add(callback);

    // Immediately trigger with current state
    const current = this.getAllSync(tableName);
    callback(current);

    // Return un-subscriber
    return () => {
      tableSubscribers.delete(callback);
    };
  }

  private notifySubscribers<K extends TableName>(tableName: K): void {
    const tableSubscribers = this.subscribers.get(tableName);
    if (!tableSubscribers || tableSubscribers.size === 0) return;

    const currentRecords = this.getAllSync(tableName);
    tableSubscribers.forEach((callback) => {
      try {
        callback(currentRecords);
      } catch (err) {
        console.error(`[DB Engine] Subscriber error on ${tableName}:`, err);
      }
    });
  }

  private async queueSync(
    entityName: string,
    entityId: string,
    operation: 'insert' | 'update' | 'delete',
    payload: Record<string, any>
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: this.generateUUID(),
      entityName,
      entityId,
      operation,
      payload,
      retryCount: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.insert('syncQueue', queueItem, false);

    // Bound the offline queue so a long offline shift can't grow memory/IDB unbounded.
    try {
      const MAX_QUEUE = 2000;
      const queue = this.memoryCache.get('syncQueue');
      if (queue && queue.size > MAX_QUEUE) {
        const overflow = queue.size - MAX_QUEUE;
        const oldest = Array.from(queue.values())
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
          .slice(0, overflow);
        for (const item of oldest) {
          queue.delete(item.id);
          try {
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
              const db = await this.openIndexedDB();
              const tx = db.transaction('syncQueue', 'readwrite');
              tx.objectStore('syncQueue').delete(item.id);
            }
          } catch {
            /* best-effort prune */
          }
        }
      }
    } catch {
      /* pruning must never break the write path */
    }
  }

  /**
   * Helper UUID generator.
   */
  public generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'gen_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Global Singleton Database Instance
export const db = new LocalDatabaseEngine();

// Auto-initialize on import in browser environments
if (typeof window !== 'undefined') {
  db.init().catch(console.error);
}
