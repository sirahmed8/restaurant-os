import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SyncGatewayService,
  MockCloudTransportAdapter,
  ConflictResolutionResult,
} from '../services/syncGateway';
import { db } from '../db';
import { eventBus } from '../services/eventBus';
import { MenuItem, MenuCategory, Order, SyncQueueItem } from '../db/schema';

describe('SyncGateway — Cloud Synchronization & Multi-Branch Engine', () => {
  let syncService: SyncGatewayService;
  let mockAdapter: MockCloudTransportAdapter;

  beforeEach(async () => {
    // Reset database and clear event history
    await db.init();
    await db.clearAll();
    eventBus.clearHistory();

    // Create fresh mock adapter & service instance
    mockAdapter = new MockCloudTransportAdapter();
    syncService = new SyncGatewayService({
      branchId: 'branch_riyadh_central',
      terminalId: 'pos_term_001',
      batchSize: 3,
      maxRetries: 3,
      initialBackoffMs: 100,
      maxBackoffMs: 2000,
      backoffMultiplier: 2,
      jitter: false, // deterministic delays in unit tests
      autoSyncIntervalMs: 0, // disable timer in tests
      enableRealtime: true,
      isOnline: true,
      cloudAdapter: mockAdapter,
      logLevel: 'silent',
    });

    await syncService.init();
  });

  afterEach(() => {
    syncService.stop();
    mockAdapter.reset();
  });

  // ===================================================================
  // 1. OUTBOUND QUEUE FLUSHING & BATCHING
  // ===================================================================
  describe('1. Outbound Queue Flushing & Batching', () => {
    it('should flush pending syncQueue items in batches to the cloud', async () => {
      // Insert 5 menu items locally with automatic sync tracking (generates 5 syncQueue items)
      for (let i = 1; i <= 5; i++) {
        const item: MenuItem = {
          id: `item-burger-0${i}`,
          categoryId: 'cat-main',
          nameAr: `برجر رقم ${i}`,
          nameEn: `Burger #${i}`,
          descriptionAr: 'لذيذ وطازج',
          descriptionEn: 'Fresh & delicious',
          price: 45 + i,
          costPrice: 15,
          taxRate: 0.15,
          preparationTimeMinutes: 10,
          isAvailable: true,
          isFeatured: false,
          isRecommended: false,
          allergens: [],
          kitchenStation: 'grill',
          sortOrder: i,
          soldCount: 0,
          createdAt: new Date(Date.now() - (6 - i) * 1000).toISOString(),
          updatedAt: new Date(Date.now() - (6 - i) * 1000).toISOString(),
        };
        await db.insert('menuItems', item, true);
      }

      const initialQueue = await db.getAll('syncQueue');
      expect(initialQueue).toHaveLength(5);
      expect(initialQueue.every((q) => q.status === 'pending')).toBe(true);

      // Flush queue (batchSize is 3, so 5 items should be sent across 2 batches)
      const flushResult = await syncService.flushQueue('manual');

      expect(flushResult.success).toBe(true);
      expect(flushResult.syncedCount).toBe(5);
      expect(flushResult.failedCount).toBe(0);
      expect(flushResult.pendingRemaining).toBe(0);

      // Verify batches received by Cloud adapter
      expect(mockAdapter.pushedBatches).toHaveLength(2);
      expect(mockAdapter.pushedBatches[0].items).toHaveLength(3);
      expect(mockAdapter.pushedBatches[1].items).toHaveLength(2);
      expect(mockAdapter.pushedBatches[0].branchId).toBe('branch_riyadh_central');

      // Verify all items in syncQueue are marked as 'synced'
      const updatedQueue = await db.getAll('syncQueue');
      expect(updatedQueue.every((q) => q.status === 'synced')).toBe(true);
      expect(updatedQueue.every((q) => q.lastAttemptAt !== undefined)).toBe(true);

      // Verify stats
      const stats = syncService.getStats();
      expect(stats.totalSyncedCount).toBe(5);
      expect(stats.pendingQueueCount).toBe(0);
      expect(stats.failedQueueCount).toBe(0);
    });

    it('should maintain chronological order when flushing (FIFO by createdAt)', async () => {
      const time1 = '2026-08-14T10:00:00.000Z';
      const time2 = '2026-08-14T10:05:00.000Z';
      const time3 = '2026-08-14T10:10:00.000Z';

      const q1: SyncQueueItem = {
        id: 'q-01',
        entityName: 'orders',
        entityId: 'ord-01',
        operation: 'insert',
        payload: { orderNumber: 'ORD-01' },
        retryCount: 0,
        status: 'pending',
        createdAt: time1,
        updatedAt: time1,
      };

      const q2: SyncQueueItem = {
        id: 'q-02',
        entityName: 'orders',
        entityId: 'ord-02',
        operation: 'insert',
        payload: { orderNumber: 'ORD-02' },
        retryCount: 0,
        status: 'pending',
        createdAt: time2,
        updatedAt: time2,
      };

      const q3: SyncQueueItem = {
        id: 'q-03',
        entityName: 'orders',
        entityId: 'ord-03',
        operation: 'insert',
        payload: { orderNumber: 'ORD-03' },
        retryCount: 0,
        status: 'pending',
        createdAt: time3,
        updatedAt: time3,
      };

      // Insert in reverse order
      await db.insert('syncQueue', q3, false);
      await db.insert('syncQueue', q1, false);
      await db.insert('syncQueue', q2, false);

      await syncService.flushQueue('manual');

      expect(mockAdapter.pushedBatches).toHaveLength(1);
      const pushedIds = mockAdapter.pushedBatches[0].items.map((i) => i.id);
      expect(pushedIds).toEqual(['q-01', 'q-02', 'q-03']);
    });

    it('should handle empty sync queue gracefully', async () => {
      const result = await syncService.flushQueue('manual');
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
      expect(result.pendingRemaining).toBe(0);
      expect(mockAdapter.pushedBatches).toHaveLength(0);
    });
  });

  // ===================================================================
  // 2. NETWORK INTERRUPTION & EXPONENTIAL BACKOFF
  // ===================================================================
  describe('2. Network Interruption & Exponential Backoff', () => {
    it('should immediately abort flush when offline without attempting cloud calls', async () => {
      // Put service in offline mode
      syncService.setOnline(false);

      const item: SyncQueueItem = {
        id: 'q-offline-01',
        entityName: 'categories',
        entityId: 'cat-01',
        operation: 'insert',
        payload: { nameAr: 'مشويات' },
        retryCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('syncQueue', item, false);

      const result = await syncService.flushQueue('manual');
      expect(result.success).toBe(false);
      expect(result.syncedCount).toBe(0);
      expect(mockAdapter.pushedBatches).toHaveLength(0);

      const stats = syncService.getStats();
      expect(stats.isOnline).toBe(false);
      expect(stats.state).toBe('offline');
    });

    it('should calculate exponential backoff delays accurately', () => {
      // initialBackoffMs = 100, multiplier = 2, maxBackoffMs = 2000, jitter = false
      expect(syncService.calculateBackoffDelay(0)).toBe(100);
      expect(syncService.calculateBackoffDelay(1)).toBe(100); // 100 * 2^0
      expect(syncService.calculateBackoffDelay(2)).toBe(200); // 100 * 2^1
      expect(syncService.calculateBackoffDelay(3)).toBe(400); // 100 * 2^2
      expect(syncService.calculateBackoffDelay(4)).toBe(800); // 100 * 2^3
      expect(syncService.calculateBackoffDelay(5)).toBe(1600); // 100 * 2^4
      expect(syncService.calculateBackoffDelay(6)).toBe(2000); // capped at maxBackoffMs
    });

    it('should handle cloud failure, increment retryCount, and mark status failed when maxRetries exceeded', async () => {
      mockAdapter.simulateFailure = true;
      mockAdapter.failureErrorMessage = 'Cloud server connection timed out';

      const item: SyncQueueItem = {
        id: 'q-fail-01',
        entityName: 'categories',
        entityId: 'cat-fail',
        operation: 'insert',
        payload: { nameAr: 'حلويات' },
        retryCount: 2, // 1 retry away from maxRetries (3)
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('syncQueue', item, false);

      const result = await syncService.flushQueue('manual');
      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);

      const updated = await db.getById('syncQueue', 'q-fail-01');
      expect(updated?.status).toBe('failed');
      expect(updated?.retryCount).toBe(3);
      expect(updated?.errorMessage).toContain('timed out');

      const stats = syncService.getStats();
      expect(stats.consecutiveFailures).toBe(1);
      expect(stats.lastError).toContain('timed out');
    });

    it('should auto-flush when setOnline(true) is called after being offline', async () => {
      syncService.setOnline(false);

      const item: SyncQueueItem = {
        id: 'q-reconnect-01',
        entityName: 'categories',
        entityId: 'cat-reconnect',
        operation: 'insert',
        payload: { nameAr: 'سلطات' },
        retryCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('syncQueue', item, false);

      // Reconnect online
      syncService.setOnline(true);

      // Allow async flush to execute
      await new Promise((r) => setTimeout(r, 50));

      const updated = await db.getById('syncQueue', 'q-reconnect-01');
      expect(updated?.status).toBe('synced');
      expect(mockAdapter.pushedBatches).toHaveLength(1);
    });

    it('should reset failed items back to pending using retryFailedItems()', async () => {
      const item: SyncQueueItem = {
        id: 'q-dead-01',
        entityName: 'categories',
        entityId: 'cat-dead',
        operation: 'insert',
        payload: { nameAr: 'عصائر' },
        retryCount: 5,
        status: 'failed',
        errorMessage: 'Fatal network drop',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('syncQueue', item, false);

      const resetCount = await syncService.retryFailedItems();
      expect(resetCount).toBe(1);

      // Check item was reset and immediately synced
      const updated = await db.getById('syncQueue', 'q-dead-01');
      expect(updated?.status).toBe('synced');
      expect(updated?.retryCount).toBe(0);
    });
  });

  // ===================================================================
  // 3. INBOUND REALTIME & MULTI-BRANCH SYNCHRONIZATION
  // ===================================================================
  describe('3. Inbound Realtime & Multi-Branch Synchronization', () => {
    it('should apply inbound catalog inserts and update IndexedDB locally without infinite sync loops', async () => {
      const remoteCategory: MenuCategory = {
        id: 'cat-inbound-01',
        nameAr: 'أطباق رئيسية فاخرة',
        nameEn: 'Luxury Mains',
        sortOrder: 1,
        isActive: true,
        createdAt: '2026-08-14T12:00:00.000Z',
        updatedAt: '2026-08-14T12:00:00.000Z',
      };

      // Trigger realtime update from HQ
      await mockAdapter.triggerServerUpdate({
        entityName: 'categories',
        entityId: 'cat-inbound-01',
        operation: 'insert',
        data: remoteCategory,
        branchId: 'branch_riyadh_central',
        updatedAt: '2026-08-14T12:00:00.000Z',
      });

      // Verify category was inserted in local IndexedDB
      const localCat = await db.getById('categories', 'cat-inbound-01');
      expect(localCat).not.toBeNull();
      expect(localCat?.nameAr).toBe('أطباق رئيسية فاخرة');

      // CRITICAL: Ensure no loopback sync item was placed into syncQueue
      const syncQueue = await db.getAll('syncQueue');
      expect(syncQueue).toHaveLength(0);
    });

    it('should suppress inbound echoes from the same terminalId', async () => {
      const item: MenuItem = {
        id: 'item-echo-01',
        categoryId: 'cat-01',
        nameAr: 'بيتزا مارغريتا',
        nameEn: 'Pizza Margherita',
        descriptionAr: 'جبن وصلصة طماطم',
        descriptionEn: 'Cheese & tomato',
        price: 50,
        costPrice: 15,
        taxRate: 0.15,
        preparationTimeMinutes: 12,
        isAvailable: true,
        isFeatured: false,
        isRecommended: false,
        allergens: [],
        kitchenStation: 'main_kitchen',
        sortOrder: 1,
        soldCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Inbound record with same terminalId as this gateway
      await syncService.applyInboundRecord({
        entityName: 'menuItems',
        entityId: 'item-echo-01',
        operation: 'insert',
        data: item,
        sourceTerminalId: 'pos_term_001', // Match gateway's terminalId
      });

      const found = await db.getById('menuItems', 'item-echo-01');
      expect(found).toBeNull(); // Skipped due to echo suppression
    });

    it('should pull and apply remote updates across multiple entities via pullUpdates()', async () => {
      // Populate mock cloud store with remote entities
      mockAdapter.cloudStore.set('categories:cat-pulled', {
        entityName: 'categories',
        entityId: 'cat-pulled',
        operation: 'insert',
        data: {
          id: 'cat-pulled',
          nameAr: 'مشروبات ساخنة',
          nameEn: 'Hot Drinks',
          sortOrder: 5,
          isActive: true,
          createdAt: '2026-08-14T11:00:00.000Z',
          updatedAt: '2026-08-14T11:00:00.000Z',
        },
        branchId: 'branch_riyadh_central',
        updatedAt: '2026-08-14T11:00:00.000Z',
      });

      const pulledCount = await syncService.pullUpdates(['categories']);
      expect(pulledCount).toBe(1);

      const localCat = await db.getById('categories', 'cat-pulled');
      expect(localCat).not.toBeNull();
      expect(localCat?.nameEn).toBe('Hot Drinks');
    });

    it('should handle inbound delete operations cleanly', async () => {
      const initialCat: MenuCategory = {
        id: 'cat-to-delete',
        nameAr: 'قسم مؤقت',
        nameEn: 'Temp Section',
        sortOrder: 99,
        isActive: true,
        createdAt: '2026-08-14T10:00:00.000Z',
        updatedAt: '2026-08-14T10:00:00.000Z',
      };
      await db.insert('categories', initialCat, false);

      // Inbound delete
      await syncService.applyInboundRecord({
        entityName: 'categories',
        entityId: 'cat-to-delete',
        operation: 'delete',
        data: { id: 'cat-to-delete' },
      });

      const deleted = await db.getById('categories', 'cat-to-delete');
      expect(deleted).toBeNull();
    });
  });

  // ===================================================================
  // 4. CONFLICT RESOLUTION ENGINE
  // ===================================================================
  describe('4. Conflict Resolution Engine', () => {
    it('should resolve conflicts using Last-Write-Wins (LWW) when remote timestamp is newer', () => {
      const localItem = {
        id: 'item-01',
        price: 50,
        updatedAt: '2026-08-14T10:00:00.000Z',
      };
      const remoteItem = {
        id: 'item-01',
        price: 65,
        updatedAt: '2026-08-14T10:30:00.000Z', // Newer
      };

      const result = syncService.resolveConflict('menuItems', localItem, remoteItem, 'last_write_wins');
      expect(result.winner).toBe('remote');
      expect(result.resolvedData.price).toBe(65);
      expect(result.fieldDifferences).toContain('price');
    });

    it('should resolve conflicts using Last-Write-Wins (LWW) when local timestamp is newer', () => {
      const localItem = {
        id: 'item-02',
        price: 80,
        updatedAt: '2026-08-14T11:00:00.000Z', // Newer
      };
      const remoteItem = {
        id: 'item-02',
        price: 70,
        updatedAt: '2026-08-14T10:00:00.000Z',
      };

      const result = syncService.resolveConflict('menuItems', localItem, remoteItem, 'last_write_wins');
      expect(result.winner).toBe('local');
      expect(result.resolvedData.price).toBe(80);
    });

    it('should enforce Server-Wins strategy for Catalog entities', () => {
      const localItem = {
        id: 'item-03',
        price: 40,
        updatedAt: '2026-08-14T12:00:00.000Z', // Local is newer, but server wins
      };
      const remoteItem = {
        id: 'item-03',
        price: 55,
        updatedAt: '2026-08-14T10:00:00.000Z',
      };

      const result = syncService.resolveConflict('menuItems', localItem, remoteItem, 'server_wins');
      expect(result.winner).toBe('remote');
      expect(result.resolvedData.price).toBe(55);
    });

    it('should enforce Client-Wins strategy when specified', () => {
      const localItem = {
        id: 'drawer-01',
        currentCash: 1500,
        updatedAt: '2026-08-14T10:00:00.000Z',
      };
      const remoteItem = {
        id: 'drawer-01',
        currentCash: 1200,
        updatedAt: '2026-08-14T11:00:00.000Z',
      };

      const result = syncService.resolveConflict('cashDrawers', localItem, remoteItem, 'client_wins');
      expect(result.winner).toBe('local');
      expect(result.resolvedData.currentCash).toBe(1500);
    });

    it('should merge non-conflicting fields with Merge strategy', () => {
      const localItem: Record<string, any> = {
        id: 'table-01',
        tableNumber: 'T-10',
        status: 'occupied',
        capacity: 4,
      };
      const remoteItem: Record<string, any> = {
        id: 'table-01',
        assignedWaiterId: 'waiter-07',
        minSpend: 200,
      };

      const result = syncService.resolveConflict<Record<string, any>>('tables', localItem, remoteItem, 'merge');
      expect(result.winner).toBe('merged');
      expect(result.resolvedData.tableNumber).toBe('T-10');
      expect(result.resolvedData.status).toBe('occupied');
      expect(result.resolvedData.assignedWaiterId).toBe('waiter-07');
      expect(result.resolvedData.minSpend).toBe(200);
    });

    it('should handle entity-priority strategy automatically based on table type', () => {
      // Menu items are configured as 'server_wins' in DEFAULT_ENTITY_STRATEGIES
      const localMenu = { id: 'm-1', price: 50, updatedAt: '2026-08-14T12:00:00.000Z' };
      const remoteMenu = { id: 'm-1', price: 60, updatedAt: '2026-08-14T10:00:00.000Z' };
      const menuRes = syncService.resolveConflict('menuItems', localMenu, remoteMenu, 'entity_priority');
      expect(menuRes.winner).toBe('remote');

      // Orders are configured as 'last_write_wins' in DEFAULT_ENTITY_STRATEGIES
      const localOrder = { id: 'ord-1', totalAmount: 100, updatedAt: '2026-08-14T12:00:00.000Z' };
      const remoteOrder = { id: 'ord-1', totalAmount: 90, updatedAt: '2026-08-14T10:00:00.000Z' };
      const orderRes = syncService.resolveConflict('orders', localOrder, remoteOrder, 'entity_priority');
      expect(orderRes.winner).toBe('local');
    });
  });

  // ===================================================================
  // 5. EVENT BUS NOTIFICATIONS & INDICATORS
  // ===================================================================
  describe('5. Event Bus Notifications & Indicators', () => {
    it('should emit SYNC_QUEUE_PROCESSED and SYNC_COMPLETED events upon successful flush', async () => {
      const events: string[] = [];
      const unsub = eventBus.subscribeAll((evt) => {
        if (evt.type.startsWith('SYNC_')) {
          events.push(evt.type);
        }
      });

      const item: SyncQueueItem = {
        id: 'q-evt-01',
        entityName: 'categories',
        entityId: 'cat-evt',
        operation: 'insert',
        payload: { nameAr: 'شاورما' },
        retryCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('syncQueue', item, false);

      await syncService.flushQueue('manual');

      expect(events).toContain('SYNC_STARTED');
      expect(events).toContain('SYNC_QUEUE_PROCESSED');
      expect(events).toContain('SYNC_COMPLETED');

      unsub();
    });

    it('should notify live status subscribers when stats change', () => {
      const statsHistory: any[] = [];
      const unsub = syncService.subscribe((stats) => {
        statsHistory.push({ isOnline: stats.isOnline, branchId: stats.branchId });
      });

      syncService.setBranchId('branch_jeddah_02');
      syncService.setOnline(false);
      syncService.setOnline(true);

      expect(statsHistory.length).toBeGreaterThanOrEqual(2);
      expect(statsHistory.some((s) => s.branchId === 'branch_jeddah_02')).toBe(true);

      unsub();
    });
  });

  // ===================================================================
  // 6. MAINTENANCE & PRUNING UTILITIES
  // ===================================================================
  describe('6. Maintenance & Pruning Utilities', () => {
    it('should prune old synced items older than retention threshold', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const oldSyncedItem: SyncQueueItem = {
        id: 'q-old-synced',
        entityName: 'orders',
        entityId: 'ord-old',
        operation: 'insert',
        payload: {},
        retryCount: 0,
        status: 'synced',
        createdAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
      };

      const freshSyncedItem: SyncQueueItem = {
        id: 'q-fresh-synced',
        entityName: 'orders',
        entityId: 'ord-fresh',
        operation: 'insert',
        payload: {},
        retryCount: 0,
        status: 'synced',
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo,
      };

      await db.insert('syncQueue', oldSyncedItem, false);
      await db.insert('syncQueue', freshSyncedItem, false);

      // Prune items older than 7 days
      const prunedCount = await syncService.pruneSyncedQueue(7);
      expect(prunedCount).toBe(1);

      const oldRecord = await db.getById('syncQueue', 'q-old-synced');
      const freshRecord = await db.getById('syncQueue', 'q-fresh-synced');

      expect(oldRecord).toBeNull();
      expect(freshRecord).not.toBeNull();
    });

    it('should clear queue by status filter', async () => {
      const qPending: SyncQueueItem = {
        id: 'q-p',
        entityName: 'orders',
        entityId: 'o-1',
        operation: 'insert',
        payload: {},
        retryCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const qSynced: SyncQueueItem = {
        id: 'q-s',
        entityName: 'orders',
        entityId: 'o-2',
        operation: 'insert',
        payload: {},
        retryCount: 0,
        status: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert('syncQueue', qPending, false);
      await db.insert('syncQueue', qSynced, false);

      await syncService.clearQueue('synced');

      const remaining = await db.getAll('syncQueue');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('q-p');
    });
  });
});
