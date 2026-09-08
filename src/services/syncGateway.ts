/**
 * =====================================================================
 * RESTAURANT OS — CLOUD SYNCHRONIZATION GATEWAY (MULTI-BRANCH)
 * =====================================================================
 * Architecture & Capabilities:
 * 1. Offline-First Queue Processing (SyncQueue Outbound Pipeline) with Batching.
 * 2. Resilient Network Handling with Exponential Backoff & Jitter.
 * 3. Inbound Realtime Synchronizer for Multi-Branch Catalog, Pricing & Stock.
 * 4. Pluggable Conflict Resolution Engine (LWW, Server-Wins, Client-Wins, Entity-Priority, Merge).
 * 5. Echo Suppression & Infinite Sync Loop Prevention.
 * 6. Pluggable Cloud Transport Adapters (Firebase Realtime, REST API, Mock).
 * 7. Realtime EventBus Integration & Health State Monitoring.
 */

import { db } from '../db';
import {
  TableName,
  SyncQueueItem,
  SyncOperation,
  SyncStatus,
  BaseEntity,
} from '../db/schema';
import { eventBus } from './eventBus';
import { firebaseService } from './firebaseService';

// =====================================================================
// 1. TYPES & INTERFACES
// =====================================================================

export type ConflictStrategy =
  | 'last_write_wins'
  | 'server_wins'
  | 'client_wins'
  | 'entity_priority'
  | 'merge';

export type SyncTrigger = 'auto' | 'manual' | 'online' | 'timer' | 'startup';

export type SyncGatewayState = 'idle' | 'syncing' | 'offline' | 'backoff' | 'error';

export interface ConflictResolutionResult<T = any> {
  winner: 'local' | 'remote' | 'merged';
  strategy: ConflictStrategy;
  resolvedData: T;
  localData: T;
  remoteData: T;
  fieldDifferences?: string[];
}

export interface SyncBatchItem {
  id: string; // syncQueue item ID
  entityName: TableName;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, any>;
  timestamp: string;
  branchId: string;
  terminalId: string;
  retryCount: number;
  clientVersion?: number;
}

export interface CloudPushBatchResponse {
  success: boolean;
  syncedIds: string[];
  failedIds?: { id: string; error: string; retryable?: boolean; code?: string }[];
  conflicts?: { id: string; remoteRecord: any }[];
  serverTimestamp?: string;
  message?: string;
}

export interface InboundRecord {
  entityName: TableName;
  entityId: string;
  operation: SyncOperation;
  data: any;
  branchId?: string;
  sourceTerminalId?: string;
  updatedAt?: string;
  version?: number;
  serverTimestamp?: string;
}

export interface CloudTransportAdapter {
  name: string;
  pushBatch(branchId: string, items: SyncBatchItem[]): Promise<CloudPushBatchResponse>;
  pullUpdates(branchId: string, entityNames: TableName[], sinceTimestamp?: string): Promise<InboundRecord[]>;
  subscribeToBranchUpdates?(branchId: string, onUpdate: (update: InboundRecord) => void): () => void;
  ping?(): Promise<boolean>;
}

export interface SyncGatewayConfig {
  branchId: string;
  terminalId: string;
  batchSize: number;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  autoSyncIntervalMs: number;
  conflictStrategy: ConflictStrategy;
  entityStrategies: Partial<Record<TableName, ConflictStrategy>>;
  enableRealtime: boolean;
  cloudAdapter?: CloudTransportAdapter;
  apiEndpoint?: string;
  apiKey?: string;
  databaseURL?: string;
  pruneRetentionDays: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  isOnline?: boolean;
}

export interface SyncStats {
  isOnline: boolean;
  isSyncing: boolean;
  state: SyncGatewayState;
  lastSyncTime: string | null;
  lastSyncDurationMs: number;
  consecutiveFailures: number;
  currentBackoffDelayMs: number;
  pendingQueueCount: number;
  failedQueueCount: number;
  inFlightCount: number;
  totalSyncedCount: number;
  totalConflictsCount: number;
  lastError: string | null;
  branchId: string;
  terminalId: string;
  activeAdapter: string;
}

// Default Entity-Priority Rules:
// Master / Catalog entities -> Server Wins (Headquarters is authority)
// Operational / POS / Cash entities -> Last-Write-Wins (Local operations are preserved)
export const DEFAULT_ENTITY_STRATEGIES: Partial<Record<TableName, ConflictStrategy>> = {
  categories: 'server_wins',
  menuItems: 'server_wins',
  modifierGroups: 'server_wins',
  modifierOptions: 'server_wins',
  itemModifierLinks: 'server_wins',
  recipes: 'server_wins',
  recipeIngredients: 'server_wins',
  suppliers: 'server_wins',
  settings: 'server_wins',
  coupons: 'server_wins',
  employees: 'server_wins',
  
  // Transactional & POS Tables -> Last Write Wins
  orders: 'last_write_wins',
  orderItems: 'last_write_wins',
  paymentTransactions: 'last_write_wins',
  tables: 'last_write_wins',
  sections: 'last_write_wins',
  shifts: 'last_write_wins',
  cashDrawers: 'last_write_wins',
  attendance: 'last_write_wins',
  stockMovements: 'last_write_wins',
  stockCounts: 'last_write_wins',
  stockCountItems: 'last_write_wins',
  wasteLogs: 'last_write_wins',
  customers: 'last_write_wins',
  loyaltyTransactions: 'last_write_wins',
  zReports: 'last_write_wins',
  taxLogs: 'last_write_wins',
  auditLogs: 'last_write_wins',
  syncQueue: 'client_wins',
};

// =====================================================================
// 2. CLOUD TRANSPORT ADAPTERS
// =====================================================================

/**
 * Firebase Realtime Database Transport Adapter
 */
export class FirebaseCloudTransportAdapter implements CloudTransportAdapter {
  public readonly name = 'FirebaseRealtime';
  private databaseURL: string;
  private terminalId: string;

  constructor(databaseURL?: string, terminalId?: string) {
    const env: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
    const procEnv: Record<string, any> = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};

    this.databaseURL = databaseURL ||
      env.VITE_FIREBASE_DATABASE_URL ||
      procEnv.VITE_FIREBASE_DATABASE_URL ||
      'https://restaurantai1-default-rtdb.europe-west1.firebasedatabase.app';
    this.terminalId = terminalId || firebaseService.getTerminalId();
  }

  public async pushBatch(branchId: string, items: SyncBatchItem[]): Promise<CloudPushBatchResponse> {
    if (!this.databaseURL) {
      throw new Error('Firebase databaseURL is not configured');
    }

    const batchId = 'batch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const url = `${this.databaseURL}/branches/${branchId}/sync_inbox/${batchId}.json`;

    const payload = {
      batchId,
      branchId,
      terminalId: this.terminalId,
      itemCount: items.length,
      createdAt: new Date().toISOString(),
      items: items.map((item) => ({
        id: item.id,
        entityName: item.entityName,
        entityId: item.entityId,
        operation: item.operation,
        payload: item.payload,
        timestamp: item.timestamp,
        clientVersion: item.clientVersion || 1,
      })),
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Firebase HTTP error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      syncedIds: items.map((i) => i.id),
      serverTimestamp: new Date().toISOString(),
    };
  }

  public async pullUpdates(branchId: string, entityNames: TableName[], sinceTimestamp?: string): Promise<InboundRecord[]> {
    if (!this.databaseURL) return [];

    try {
      const url = `${this.databaseURL}/branches/${branchId}/broadcasts.json`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const raw = await response.json();
      if (!raw || typeof raw !== 'object') return [];

      const records: InboundRecord[] = [];
      Object.values(raw).forEach((entry: any) => {
        if (entry && entry.entityName && (!sinceTimestamp || entry.updatedAt > sinceTimestamp)) {
          if (entityNames.length === 0 || entityNames.includes(entry.entityName)) {
            records.push({
              entityName: entry.entityName,
              entityId: entry.entityId,
              operation: entry.operation || 'update',
              data: entry.data || entry.payload,
              branchId: entry.branchId || branchId,
              sourceTerminalId: entry.sourceTerminalId,
              updatedAt: entry.updatedAt || new Date().toISOString(),
              version: entry.version,
            });
          }
        }
      });

      return records;
    } catch (e) {
      console.warn('[FirebaseCloudAdapter] Failed to pull updates:', e);
      return [];
    }
  }

  public subscribeToBranchUpdates(branchId: string, onUpdate: (update: InboundRecord) => void): () => void {
    if (typeof window === 'undefined' || !('EventSource' in window) || !this.databaseURL) {
      return () => {};
    }

    try {
      const url = `${this.databaseURL}/branches/${branchId}/live_feed.json`;
      const source = new EventSource(url);

      source.addEventListener('put', (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.data && parsed.data.entityName) {
            onUpdate({
              entityName: parsed.data.entityName,
              entityId: parsed.data.entityId,
              operation: parsed.data.operation || 'update',
              data: parsed.data.data || parsed.data.payload,
              branchId: parsed.data.branchId || branchId,
              sourceTerminalId: parsed.data.sourceTerminalId,
              updatedAt: parsed.data.updatedAt || new Date().toISOString(),
              version: parsed.data.version,
            });
          }
        } catch (err) {
          console.error('[FirebaseCloudAdapter] Error parsing live feed SSE event:', err);
        }
      });

      source.onerror = () => {
        // SSE auto-reconnects
      };

      return () => {
        source.close();
      };
    } catch (e) {
      console.warn('[FirebaseCloudAdapter] Realtime subscription error:', e);
      return () => {};
    }
  }

  public async ping(): Promise<boolean> {
    if (!this.databaseURL) return false;
    try {
      const res = await fetch(`${this.databaseURL}/.json?shallow=true`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Standard REST API Transport Adapter
 */
export class RestApiCloudTransportAdapter implements CloudTransportAdapter {
  public readonly name = 'RestApi';
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint = '/api/v1/sync', apiKey?: string) {
    this.endpoint = endpoint.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  public async pushBatch(branchId: string, items: SyncBatchItem[]): Promise<CloudPushBatchResponse> {
    const url = `${this.endpoint}/push`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        branchId,
        items,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`REST Sync push failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      syncedIds: data.syncedIds ?? items.map((i) => i.id),
      failedIds: data.failedIds,
      conflicts: data.conflicts,
      serverTimestamp: data.serverTimestamp || new Date().toISOString(),
    };
  }

  public async pullUpdates(branchId: string, entityNames: TableName[], sinceTimestamp?: string): Promise<InboundRecord[]> {
    const params = new URLSearchParams({
      branchId,
      entities: entityNames.join(','),
    });
    if (sinceTimestamp) {
      params.set('since', sinceTimestamp);
    }

    const url = `${this.endpoint}/pull?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`REST Sync pull failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  public async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * High-Fidelity Mock Cloud Transport Adapter for Testing & Offline Simulation
 */
export class MockCloudTransportAdapter implements CloudTransportAdapter {
  public readonly name = 'MockCloud';
  public pushedBatches: { branchId: string; items: SyncBatchItem[] }[] = [];
  public cloudStore: Map<string, InboundRecord> = new Map();
  public simulateFailure = false;
  public failureErrorMessage = 'Simulated network connection timeout';
  public simulatedLatencyMs = 0;
  public simulatedConflicts: { id: string; remoteRecord: any }[] = [];
  private listeners: Set<(update: InboundRecord) => void> = new Set();

  public async pushBatch(branchId: string, items: SyncBatchItem[]): Promise<CloudPushBatchResponse> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.simulatedLatencyMs));
    }

    if (this.simulateFailure) {
      throw new Error(this.failureErrorMessage);
    }

    this.pushedBatches.push({ branchId, items });

    // Store in cloud mock database
    items.forEach((item) => {
      const key = `${item.entityName}:${item.entityId}`;
      this.cloudStore.set(key, {
        entityName: item.entityName,
        entityId: item.entityId,
        operation: item.operation,
        data: item.payload,
        branchId,
        sourceTerminalId: item.terminalId,
        updatedAt: item.timestamp,
      });
    });

    return {
      success: true,
      syncedIds: items.map((i) => i.id),
      conflicts: this.simulatedConflicts.length > 0 ? [...this.simulatedConflicts] : undefined,
      serverTimestamp: new Date().toISOString(),
    };
  }

  public async pullUpdates(branchId: string, entityNames: TableName[], sinceTimestamp?: string): Promise<InboundRecord[]> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.simulatedLatencyMs));
    }

    if (this.simulateFailure) {
      throw new Error(this.failureErrorMessage);
    }

    const records: InboundRecord[] = [];
    this.cloudStore.forEach((record) => {
      if (
        (entityNames.length === 0 || entityNames.includes(record.entityName)) &&
        (!sinceTimestamp || (record.updatedAt && record.updatedAt > sinceTimestamp))
      ) {
        records.push(record);
      }
    });

    return records;
  }

  public subscribeToBranchUpdates(branchId: string, onUpdate: (update: InboundRecord) => void): () => void {
    this.listeners.add(onUpdate);
    return () => {
      this.listeners.delete(onUpdate);
    };
  }

  /**
   * Helper to broadcast a simulated update from server / headquarters to all subscribed branches
   */
  public async triggerServerUpdate(record: InboundRecord): Promise<void> {
    const key = `${record.entityName}:${record.entityId}`;
    this.cloudStore.set(key, record);
    for (const listener of Array.from(this.listeners)) {
      await listener(record);
    }
  }

  public async ping(): Promise<boolean> {
    return !this.simulateFailure;
  }

  public reset(): void {
    this.pushedBatches = [];
    this.cloudStore.clear();
    this.simulateFailure = false;
    this.simulatedLatencyMs = 0;
    this.simulatedConflicts = [];
    this.listeners.clear();
  }
}

// =====================================================================
// 3. CORE SYNCHRONIZATION GATEWAY ENGINE
// =====================================================================

export class SyncGatewayService {
  private config: SyncGatewayConfig;
  private isOnline: boolean;
  private isSyncing = false;
  private isFlushing = false;
  private state: SyncGatewayState = 'idle';
  private consecutiveFailures = 0;
  private currentBackoffDelayMs: number;
  private lastSyncTime: string | null = null;
  private lastSyncDurationMs = 0;
  private totalSyncedCount = 0;
  private totalConflictsCount = 0;
  private lastError: string | null = null;
  
  private backoffTimeout: any = null;
  private autoSyncInterval: any = null;
  private realtimeUnsubscriber: (() => void) | null = null;
  private statusSubscribers: Set<(stats: SyncStats) => void> = new Set();
  
  private isInitialized = false;
  private isRunning = false;
  private cloudAdapter: CloudTransportAdapter;

  constructor(customConfig: Partial<SyncGatewayConfig> = {}) {
    const defaultBranchId = 'branch_riyadh_01';
    const defaultTerminalId = 'pos_term_' + Math.random().toString(36).substring(2, 7);

    this.config = {
      branchId: customConfig.branchId || defaultBranchId,
      terminalId: customConfig.terminalId || defaultTerminalId,
      batchSize: customConfig.batchSize || 25,
      maxRetries: customConfig.maxRetries || 5,
      initialBackoffMs: customConfig.initialBackoffMs || 1000,
      maxBackoffMs: customConfig.maxBackoffMs || 30000,
      backoffMultiplier: customConfig.backoffMultiplier || 2,
      jitter: customConfig.jitter ?? true,
      autoSyncIntervalMs: customConfig.autoSyncIntervalMs || 30000,
      conflictStrategy: customConfig.conflictStrategy || 'last_write_wins',
      entityStrategies: {
        ...DEFAULT_ENTITY_STRATEGIES,
        ...(customConfig.entityStrategies || {}),
      },
      enableRealtime: customConfig.enableRealtime ?? true,
      pruneRetentionDays: customConfig.pruneRetentionDays || 7,
      logLevel: customConfig.logLevel || 'info',
      ...customConfig,
    };

    this.currentBackoffDelayMs = this.config.initialBackoffMs;
    
    // In browser/node, default to true unless explicitly offline or navigator.onLine is false
    this.isOnline =
      customConfig.isOnline !== undefined
        ? customConfig.isOnline
        : typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

    this.cloudAdapter = customConfig.cloudAdapter || new FirebaseCloudTransportAdapter(this.config.databaseURL, this.config.terminalId);

    this.setupNetworkListeners();
  }

  // -------------------------------------------------------------------
  // LIFECYCLE & INITIALIZATION
  // -------------------------------------------------------------------

  public async init(customConfig?: Partial<SyncGatewayConfig>): Promise<void> {
    if (customConfig) {
      this.updateConfig(customConfig);
    }

    if (this.isInitialized) return;

    try {
      await db.init();
      this.isInitialized = true;
      this.log('info', `SyncGateway initialized for branch [${this.config.branchId}], terminal [${this.config.terminalId}], adapter [${this.cloudAdapter.name}]`);
      
      // Auto-start sync loops
      await this.start();
    } catch (e) {
      this.log('error', 'SyncGateway init error:', e);
      throw e;
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Hook Realtime Inbound Subscriptions
    if (this.config.enableRealtime && this.cloudAdapter.subscribeToBranchUpdates) {
      this.realtimeUnsubscriber = this.cloudAdapter.subscribeToBranchUpdates(
        this.config.branchId,
        (update) => {
          this.applyInboundRecord(update).catch((err) => {
            this.log('error', 'Error applying inbound realtime update:', err);
          });
        }
      );
    }

    // 2. Setup periodic auto-sync timer
    if (this.config.autoSyncIntervalMs > 0 && typeof setInterval !== 'undefined') {
      this.autoSyncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.flushQueue('timer').catch((err) => {
            this.log('warn', 'Auto-sync timer flush error:', err);
          });
        }
      }, this.config.autoSyncIntervalMs);
    }

    // 3. Initial flush on start if online
    if (this.isOnline) {
      this.flushQueue('startup').catch(() => {});
    }

    this.updateState(this.isOnline ? 'idle' : 'offline');
    this.notifySubscribers();
  }

  public stop(): void {
    this.isRunning = false;

    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
      this.backoffTimeout = null;
    }

    if (this.realtimeUnsubscriber) {
      this.realtimeUnsubscriber();
      this.realtimeUnsubscriber = null;
    }

    this.updateState('idle');
    this.notifySubscribers();
    this.log('info', 'SyncGateway stopped.');
  }

  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setOnline(true);
      });

      window.addEventListener('offline', () => {
        this.setOnline(false);
      });
    }
  }

  // -------------------------------------------------------------------
  // OUTBOUND QUEUE FLUSHING & BATCHING
  // -------------------------------------------------------------------

  /**
   * Flush pending items in syncQueue to Cloud.
   */
  public async flushQueue(trigger: SyncTrigger = 'manual'): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
    pendingRemaining: number;
  }> {
    if (!this.isOnline) {
      this.updateState('offline');
      this.notifySubscribers();
      return { success: false, syncedCount: 0, failedCount: 0, pendingRemaining: this.getPendingCount() };
    }

    if (this.isFlushing) {
      return { success: true, syncedCount: 0, failedCount: 0, pendingRemaining: this.getPendingCount() };
    }

    this.isFlushing = true;
    this.isSyncing = true;
    this.updateState('syncing');
    this.notifySubscribers();

    const startTime = Date.now();
    let totalSyncedInRun = 0;
    let totalFailedInRun = 0;

    await eventBus.publish('SYNC_STARTED', {
      trigger,
      timestamp: new Date().toISOString(),
    }, 'cloud');

    try {
      while (this.isOnline) {
        // 1. Fetch pending items
        const pendingItems = await db.query('syncQueue', {
          where: (q) =>
            q.status === 'pending' ||
            (q.status === 'failed' && q.retryCount < this.config.maxRetries),
          orderBy: 'createdAt',
          orderDirection: 'asc',
          limit: this.config.batchSize,
        });

        if (pendingItems.length === 0) {
          break; // Queue is empty!
        }

        // 2. Mark batch as in_flight
        const batchIds = pendingItems.map((item) => item.id);
        for (const item of pendingItems) {
          await db.update('syncQueue', item.id, {
            status: 'in_flight',
            lastAttemptAt: new Date().toISOString(),
          }, false);
        }

        const batchPayload: SyncBatchItem[] = pendingItems.map((item) => ({
          id: item.id,
          entityName: item.entityName as TableName,
          entityId: item.entityId,
          operation: item.operation,
          payload: item.payload,
          timestamp: item.createdAt,
          branchId: this.config.branchId,
          terminalId: this.config.terminalId,
          retryCount: item.retryCount,
        }));

        try {
          // 3. Push batch to cloud adapter
          const result = await this.cloudAdapter.pushBatch(this.config.branchId, batchPayload);

          if (result.success) {
            // Handle Synced items
            const syncedSet = new Set(result.syncedIds || batchIds);
            for (const id of batchIds) {
              if (syncedSet.has(id)) {
                await db.update('syncQueue', id, {
                  status: 'synced',
                  lastAttemptAt: new Date().toISOString(),
                  errorMessage: undefined,
                }, false);
                totalSyncedInRun++;
                this.totalSyncedCount++;
              }
            }

            // Handle per-item failures if returned by server
            if (result.failedIds && result.failedIds.length > 0) {
              for (const fail of result.failedIds) {
                const existing = pendingItems.find((p) => p.id === fail.id);
                const newRetry = (existing?.retryCount || 0) + 1;
                await db.update('syncQueue', fail.id, {
                  status: newRetry >= this.config.maxRetries ? 'failed' : 'pending',
                  retryCount: newRetry,
                  errorMessage: fail.error,
                  lastAttemptAt: new Date().toISOString(),
                }, false);
                totalFailedInRun++;
              }
            }

            // Handle Conflicts if flagged by server
            if (result.conflicts && result.conflicts.length > 0) {
              for (const conflict of result.conflicts) {
                const item = pendingItems.find((p) => p.id === conflict.id);
                if (item) {
                  await this.handleServerReportedConflict(item, conflict.remoteRecord);
                }
              }
            }

            // Reset backoff upon successful push
            this.consecutiveFailures = 0;
            this.currentBackoffDelayMs = this.config.initialBackoffMs;
            this.lastError = null;
          }
        } catch (batchErr: any) {
          // 4. Batch transmission error (network drop or server error)
          this.consecutiveFailures++;
          const errMsg = batchErr?.message || 'Batch sync push failed';
          this.lastError = errMsg;
          this.log('warn', `Batch sync failed (attempt ${this.consecutiveFailures}):`, errMsg);

          for (const item of pendingItems) {
            const nextRetry = item.retryCount + 1;
            const newStatus: SyncStatus = nextRetry >= this.config.maxRetries ? 'failed' : 'pending';
            await db.update('syncQueue', item.id, {
              status: newStatus,
              retryCount: nextRetry,
              errorMessage: errMsg,
              lastAttemptAt: new Date().toISOString(),
            }, false);
            totalFailedInRun++;
          }

          // Calculate backoff and schedule next retry
          this.scheduleBackoffRetry();
          break; // Stop current flush loop and wait for backoff
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.lastSyncDurationMs = Date.now() - startTime;

      const remainingPending = this.getPendingCount();

      // Emit events
      await eventBus.publish('SYNC_QUEUE_PROCESSED', {
        syncedCount: totalSyncedInRun,
        pendingCount: remainingPending,
        failedCount: totalFailedInRun,
      }, 'cloud');

      await eventBus.publish('SYNC_COMPLETED', {
        syncedCount: totalSyncedInRun,
        failedCount: totalFailedInRun,
        durationMs: this.lastSyncDurationMs,
        timestamp: this.lastSyncTime,
      }, 'cloud');

      this.updateState(this.consecutiveFailures > 0 ? 'backoff' : 'idle');
      this.notifySubscribers();

      return {
        success: totalFailedInRun === 0,
        syncedCount: totalSyncedInRun,
        failedCount: totalFailedInRun,
        pendingRemaining: remainingPending,
      };
    } catch (globalErr: any) {
      this.lastError = globalErr?.message || 'Global sync flush error';
      this.log('error', 'Global sync flush error:', globalErr);
      
      await eventBus.publish('SYNC_ERROR', {
        error: this.lastError!,
        timestamp: new Date().toISOString(),
        consecutiveFailures: this.consecutiveFailures,
      }, 'cloud');

      this.updateState('error');
      this.notifySubscribers();

      return {
        success: false,
        syncedCount: totalSyncedInRun,
        failedCount: totalFailedInRun,
        pendingRemaining: this.getPendingCount(),
      };
    } finally {
      this.isFlushing = false;
      this.isSyncing = false;
      this.notifySubscribers();
    }
  }

  // -------------------------------------------------------------------
  // EXPONENTIAL BACKOFF & JITTER
  // -------------------------------------------------------------------

  /**
   * Pure calculation of Exponential Backoff with optional Jitter.
   */
  public calculateBackoffDelay(consecutiveFailures: number): number {
    if (consecutiveFailures <= 0) return this.config.initialBackoffMs;

    const rawDelay = Math.min(
      this.config.initialBackoffMs * Math.pow(this.config.backoffMultiplier, consecutiveFailures - 1),
      this.config.maxBackoffMs
    );

    if (!this.config.jitter) {
      return Math.round(rawDelay);
    }

    // Full Jitter: 80% to 120% variation to prevent thundering herd problem
    const jitterFactor = 0.8 + Math.random() * 0.4;
    return Math.round(rawDelay * jitterFactor);
  }

  private scheduleBackoffRetry(): void {
    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
    }

    this.currentBackoffDelayMs = this.calculateBackoffDelay(this.consecutiveFailures);
    this.updateState('backoff');
    this.notifySubscribers();

    this.log('info', `Backoff retry scheduled in ${this.currentBackoffDelayMs}ms (Failure #${this.consecutiveFailures})`);

    this.backoffTimeout = setTimeout(() => {
      if (this.isOnline && this.isRunning) {
        this.flushQueue('auto').catch(() => {});
      }
    }, this.currentBackoffDelayMs);
  }

  // -------------------------------------------------------------------
  // INBOUND SYNCHRONIZATION & CONFLICT RESOLUTION
  // -------------------------------------------------------------------

  /**
   * Pull recent updates from cloud for specified entities.
   */
  public async pullUpdates(entityNames: TableName[] = [], sinceTimestamp?: string): Promise<number> {
    if (!this.isOnline) return 0;

    try {
      const records = await this.cloudAdapter.pullUpdates(
        this.config.branchId,
        entityNames,
        sinceTimestamp
      );

      if (records.length === 0) return 0;

      await this.applyInboundBatch(records);
      return records.length;
    } catch (e) {
      this.log('error', 'Pull updates error:', e);
      return 0;
    }
  }

  /**
   * Apply an inbound batch of updates from Central HQ / Cloud.
   */
  public async applyInboundBatch(records: InboundRecord[]): Promise<void> {
    for (const record of records) {
      await this.applyInboundRecord(record);
    }
  }

  /**
   * Apply a single inbound record received from Cloud / Central Branch.
   */
  public async applyInboundRecord(record: InboundRecord): Promise<void> {
    if (!record || !record.entityName || !record.entityId) return;

    // 1. Echo Suppression: Ignore updates originated from this same terminal
    if (record.sourceTerminalId && record.sourceTerminalId === this.config.terminalId) {
      return;
    }

    const tableName = record.entityName;
    const entityId = record.entityId;

    try {
      const localItem = await db.getById(tableName, entityId);

      // Handle Delete Operation
      if (record.operation === 'delete') {
        if (localItem) {
          await db.delete(tableName, entityId, false); // trackSync: false to prevent loops
          await eventBus.publish('SYNC_INBOUND_APPLIED', {
            entityName: tableName,
            count: 1,
            branchId: record.branchId,
            timestamp: new Date().toISOString(),
          }, 'cloud');
        }
        return;
      }

      const remoteData = record.data || {};

      // If local item does not exist, insert directly
      if (!localItem) {
        const itemToInsert = {
          ...remoteData,
          id: entityId,
          createdAt: remoteData.createdAt || record.updatedAt || new Date().toISOString(),
          updatedAt: remoteData.updatedAt || record.updatedAt || new Date().toISOString(),
        };
        await db.insert(tableName, itemToInsert, false); // trackSync: false
        
        await eventBus.publish('SYNC_INBOUND_APPLIED', {
          entityName: tableName,
          count: 1,
          branchId: record.branchId,
          timestamp: new Date().toISOString(),
        }, 'cloud');
        return;
      }

      // 2. Conflict Resolution
      const conflictResult = this.resolveConflict(tableName, localItem, remoteData);

      if (conflictResult.winner === 'remote' || conflictResult.winner === 'merged') {
        await db.update(tableName, entityId, conflictResult.resolvedData, false);
      } else {
        // Winner is local, keep local data unchanged
        this.log('debug', `Local version won conflict resolution for ${tableName}:${entityId}`);
      }

      if (conflictResult.fieldDifferences && conflictResult.fieldDifferences.length > 0) {
        this.totalConflictsCount++;
        await eventBus.publish('SYNC_CONFLICT_RESOLVED', {
          entityName: tableName,
          entityId,
          strategy: conflictResult.strategy,
          winner: conflictResult.winner,
          timestamp: new Date().toISOString(),
        }, 'cloud');
      }

      await eventBus.publish('SYNC_INBOUND_APPLIED', {
        entityName: tableName,
        count: 1,
        branchId: record.branchId,
        timestamp: new Date().toISOString(),
      }, 'cloud');
    } catch (err) {
      this.log('error', `Failed to apply inbound record ${tableName}:${entityId}:`, err);
    }
  }

  /**
   * Conflict Resolution Strategy Engine
   */
  public resolveConflict<T extends Record<string, any>>(
    entityName: TableName,
    localItem: T,
    remoteItem: T,
    strategyOverride?: ConflictStrategy
  ): ConflictResolutionResult<T> {
    const strategy =
      strategyOverride ||
      this.config.entityStrategies[entityName] ||
      this.config.conflictStrategy;

    // Detect field differences
    const fieldDifferences: string[] = [];
    const allKeys = new Set([...Object.keys(localItem), ...Object.keys(remoteItem)]);
    allKeys.forEach((k) => {
      if (k !== 'updatedAt' && k !== 'createdAt' && JSON.stringify(localItem[k]) !== JSON.stringify(remoteItem[k])) {
        fieldDifferences.push(k);
      }
    });

    switch (strategy) {
      case 'server_wins':
        return {
          winner: 'remote',
          strategy,
          resolvedData: { ...localItem, ...remoteItem },
          localData: localItem,
          remoteData: remoteItem,
          fieldDifferences,
        };

      case 'client_wins':
        return {
          winner: 'local',
          strategy,
          resolvedData: localItem,
          localData: localItem,
          remoteData: remoteItem,
          fieldDifferences,
        };

      case 'merge': {
        const merged: any = { ...localItem };
        Object.keys(remoteItem).forEach((key) => {
          if (remoteItem[key] !== undefined && remoteItem[key] !== null) {
            merged[key] = remoteItem[key];
          }
        });
        merged.updatedAt = new Date().toISOString();
        return {
          winner: 'merged',
          strategy,
          resolvedData: merged,
          localData: localItem,
          remoteData: remoteItem,
          fieldDifferences,
        };
      }

      case 'entity_priority': {
        const entityRule = DEFAULT_ENTITY_STRATEGIES[entityName] || 'last_write_wins';
        return this.resolveConflict(entityName, localItem, remoteItem, entityRule);
      }

      case 'last_write_wins':
      default: {
        const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
        const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();

        if (remoteTime >= localTime) {
          return {
            winner: 'remote',
            strategy: 'last_write_wins',
            resolvedData: { ...localItem, ...remoteItem },
            localData: localItem,
            remoteData: remoteItem,
            fieldDifferences,
          };
        } else {
          return {
            winner: 'local',
            strategy: 'last_write_wins',
            resolvedData: localItem,
            localData: localItem,
            remoteData: remoteItem,
            fieldDifferences,
          };
        }
      }
    }
  }

  private async handleServerReportedConflict(queueItem: SyncQueueItem, remoteRecord: any): Promise<void> {
    const tableName = queueItem.entityName as TableName;
    const entityId = queueItem.entityId;

    const localItem = await db.getById(tableName, entityId);
    if (!localItem) return;

    const resolution = this.resolveConflict(tableName, localItem, remoteRecord);

    if (resolution.winner === 'remote' || resolution.winner === 'merged') {
      await db.update(tableName, entityId, resolution.resolvedData, false);
      await db.update('syncQueue', queueItem.id, {
        status: 'synced',
        lastAttemptAt: new Date().toISOString(),
      }, false);
    } else {
      // Local won: re-queue with updated timestamp so server accepts local changes
      await db.update('syncQueue', queueItem.id, {
        status: 'pending',
        retryCount: 0,
        payload: localItem,
        lastAttemptAt: new Date().toISOString(),
      }, false);
    }

    this.totalConflictsCount++;
    await eventBus.publish('SYNC_CONFLICT_RESOLVED', {
      entityName: tableName,
      entityId,
      strategy: resolution.strategy,
      winner: resolution.winner,
      timestamp: new Date().toISOString(),
    }, 'cloud');
  }

  // -------------------------------------------------------------------
  // MAINTENANCE & UTILITIES
  // -------------------------------------------------------------------

  /**
   * Prune synced items older than retention threshold to keep IndexedDB lean and blazing fast.
   */
  public async pruneSyncedQueue(retentionDays = this.config.pruneRetentionDays): Promise<number> {
    const thresholdDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const syncedItems = await db.query('syncQueue', {
      where: (q) => q.status === 'synced' && (q.updatedAt < thresholdDate || q.createdAt < thresholdDate),
    });

    for (const item of syncedItems) {
      await db.delete('syncQueue', item.id, false);
    }

    this.log('info', `Pruned ${syncedItems.length} old synced items from syncQueue`);
    return syncedItems.length;
  }

  /**
   * Reset failed items in syncQueue back to pending for manual retry.
   */
  public async retryFailedItems(): Promise<number> {
    const failedItems = await db.query('syncQueue', {
      where: (q) => q.status === 'failed',
    });

    for (const item of failedItems) {
      await db.update('syncQueue', item.id, {
        status: 'pending',
        retryCount: 0,
        errorMessage: undefined,
      }, false);
    }

    this.consecutiveFailures = 0;
    this.currentBackoffDelayMs = this.config.initialBackoffMs;
    this.lastError = null;

    if (this.isOnline) {
      await this.flushQueue('manual');
    }

    this.notifySubscribers();
    return failedItems.length;
  }

  /**
   * Clear sync queue records with optional status filter.
   */
  public async clearQueue(statusFilter?: SyncStatus): Promise<void> {
    if (!statusFilter) {
      await db.clear('syncQueue');
    } else {
      const items = await db.query('syncQueue', {
        where: (q) => q.status === statusFilter,
      });
      for (const item of items) {
        await db.delete('syncQueue', item.id, false);
      }
    }
    this.notifySubscribers();
  }

  // -------------------------------------------------------------------
  // STATE, GETTERS & SETTERS
  // -------------------------------------------------------------------

  public setOnline(online: boolean): void {
    const previous = this.isOnline;
    this.isOnline = online;

    if (online && !previous) {
      this.log('info', 'Network connection restored. Resuming sync pipeline.');
      this.consecutiveFailures = 0;
      this.currentBackoffDelayMs = this.config.initialBackoffMs;
      this.updateState('idle');
      eventBus.publish('SYSTEM_ONLINE', { timestamp: new Date().toISOString() }, 'system');
      
      // Immediately trigger flush upon regaining connectivity
      this.flushQueue('online').catch(() => {});
    } else if (!online && previous) {
      this.log('warn', 'Network connection lost. Sync pipeline paused.');
      this.updateState('offline');
      if (this.backoffTimeout) {
        clearTimeout(this.backoffTimeout);
        this.backoffTimeout = null;
      }
      eventBus.publish('SYSTEM_OFFLINE', { timestamp: new Date().toISOString() }, 'system');
    }

    this.notifySubscribers();
  }

  public setBranchId(branchId: string): void {
    if (this.config.branchId === branchId) return;

    this.config.branchId = branchId;
    this.log('info', `Branch switched to [${branchId}]. Rebinding realtime listeners.`);

    // Rebind realtime listener if active
    if (this.realtimeUnsubscriber) {
      this.realtimeUnsubscriber();
      this.realtimeUnsubscriber = null;
    }

    if (this.config.enableRealtime && this.isRunning && this.cloudAdapter.subscribeToBranchUpdates) {
      this.realtimeUnsubscriber = this.cloudAdapter.subscribeToBranchUpdates(
        branchId,
        (update) => {
          this.applyInboundRecord(update).catch((err) => {
            this.log('error', 'Error in branch realtime update:', err);
          });
        }
      );
    }

    this.notifySubscribers();
  }

  public setTerminalId(terminalId: string): void {
    this.config.terminalId = terminalId;
    this.notifySubscribers();
  }

  public setCloudAdapter(adapter: CloudTransportAdapter): void {
    this.cloudAdapter = adapter;
    this.log('info', `Cloud transport adapter changed to [${adapter.name}]`);
    this.notifySubscribers();
  }

  public updateConfig(newConfig: Partial<SyncGatewayConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      entityStrategies: {
        ...this.config.entityStrategies,
        ...(newConfig.entityStrategies || {}),
      },
    };
    if (newConfig.cloudAdapter) {
      this.cloudAdapter = newConfig.cloudAdapter;
    }
    if (newConfig.isOnline !== undefined) {
      this.isOnline = newConfig.isOnline;
    }
    this.notifySubscribers();
  }

  public getConfig(): Readonly<SyncGatewayConfig> {
    return { ...this.config };
  }

  public getPendingCount(): number {
    const queue = db.getAllSync('syncQueue');
    return queue.filter((q) => q.status === 'pending' || q.status === 'in_flight').length;
  }

  public getStats(): SyncStats {
    const queue = db.getAllSync('syncQueue');
    const pending = queue.filter((q) => q.status === 'pending').length;
    const inFlight = queue.filter((q) => q.status === 'in_flight').length;
    const failed = queue.filter((q) => q.status === 'failed').length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      state: this.state,
      lastSyncTime: this.lastSyncTime,
      lastSyncDurationMs: this.lastSyncDurationMs,
      consecutiveFailures: this.consecutiveFailures,
      currentBackoffDelayMs: this.currentBackoffDelayMs,
      pendingQueueCount: pending,
      failedQueueCount: failed,
      inFlightCount: inFlight,
      totalSyncedCount: this.totalSyncedCount,
      totalConflictsCount: this.totalConflictsCount,
      lastError: this.lastError,
      branchId: this.config.branchId,
      terminalId: this.config.terminalId,
      activeAdapter: this.cloudAdapter.name,
    };
  }

  public subscribe(listener: (stats: SyncStats) => void): () => void {
    this.statusSubscribers.add(listener);
    listener(this.getStats());
    return () => {
      this.statusSubscribers.delete(listener);
    };
  }

  private updateState(newState: SyncGatewayState): void {
    this.state = newState;
  }

  private notifySubscribers(): void {
    const stats = this.getStats();
    this.statusSubscribers.forEach((fn) => {
      try {
        fn(stats);
      } catch (e) {
        console.error('[SyncGateway] Subscriber error:', e);
      }
    });

    eventBus.publish('SYNC_STATUS_CHANGED', {
      isOnline: stats.isOnline,
      isSyncing: stats.isSyncing,
      pendingCount: stats.pendingQueueCount,
      lastSyncTime: stats.lastSyncTime,
    }, 'cloud').catch(() => {});
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (this.config.logLevel === 'silent') return;
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentIdx = levels.indexOf(this.config.logLevel);
    const targetIdx = levels.indexOf(level);

    if (targetIdx >= currentIdx) {
      const prefix = `[SyncGateway:${this.config.branchId}]`;
      if (level === 'error') console.error(prefix, message, ...args);
      else if (level === 'warn') console.warn(prefix, message, ...args);
      else if (level === 'info') console.info(prefix, message, ...args);
      else console.log(prefix, message, ...args);
    }
  }
}

// Global Singleton Instance of SyncGateway
export const syncGateway = new SyncGatewayService();

// Auto-initialize when running in browser environments
if (typeof window !== 'undefined') {
  syncGateway.init().catch(console.error);
}
