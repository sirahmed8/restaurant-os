/**
 * =====================================================================
 * RESTAURANT OS — UNIFIED NEURAL REACTIVE EVENT BUS
 * =====================================================================
 * Connects Orders, KDS, Inventory deduction, Loyalty, AI triggers, 
 * Shift management, and Hardware printing seamlessly in real-time.
 */

import type { Order, OrderItem, InventoryItem, Customer, Shift, ZReport, KitchenStation } from '../db/schema';
import type { AggregatedDeliveryOrder, DeliveryPlatform, DeliveryDriver, DeliveryOrderStatus } from '../types/delivery';
import type { ShiftSession, ZReportRecord } from '../types/shift';
import { newId } from '../lib/ids';
import { logger } from '../lib/logger';

export type EventType =
  // Order Events
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_ITEM_STATUS_CHANGED'
  | 'ORDER_PAID'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'
  
  // Delivery Hub & Third-Party Aggregator
  | 'DELIVERY_ORDER_RECEIVED'
  | 'DELIVERY_ORDER_ACCEPTED'
  | 'DELIVERY_ORDER_STATUS_CHANGED'
  | 'DELIVERY_DRIVER_ASSIGNED'
  | 'DELIVERY_DRIVER_LOCATION_UPDATED'
  | 'DELIVERY_CHANNEL_STATUS_CHANGED'
  
  // Kitchen & KDS
  | 'KDS_NEW_TICKET'
  | 'KDS_ITEM_COOKING'
  | 'KDS_ITEM_READY'
  | 'KDS_ORDER_COMPLETED'
  | 'KDS_AUDIO_ALERT'
  
  // Inventory & Stock
  | 'INVENTORY_STOCK_DEDUCTED'
  | 'INVENTORY_LOW_STOCK_ALERT'
  | 'INVENTORY_RESTOCKED'
  | 'INVENTORY_WASTE_LOGGED'
  
  // Customers & Loyalty
  | 'CUSTOMER_TIER_UPGRADED'
  | 'LOYALTY_POINTS_EARNED'
  | 'LOYALTY_POINTS_REDEEMED'
  
  // Shift & Cash
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'CASH_DRAWER_KICKED'
  | 'Z_REPORT_GENERATED'
  
  // AI Neural Triggers
  | 'AI_VOICE_ORDER_PARSED'
  | 'AI_INVOICE_PROCESSED'
  | 'AI_RECOMMENDATION_READY'
  | 'AI_BCG_ANALYSIS_COMPLETED'
  | 'AI_ANOMALY_DETECTED'
  | 'AI_VISION_PLATE_WASTE_ANALYZED'
  | 'AI_VISION_INVENTORY_SCANNED'
  
  // Hardware & Printing
  | 'PRINT_CUSTOMER_RECEIPT'
  | 'PRINT_KITCHEN_ORDER'
  | 'PRINT_JOB_FINISHED'
  | 'PRINT_ERROR'
  
  // Sync & System
  | 'SYSTEM_ONLINE'
  | 'SYSTEM_OFFLINE'
  | 'SYNC_QUEUE_PROCESSED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_ERROR'
  | 'SYNC_INBOUND_APPLIED'
  | 'SYNC_CONFLICT_RESOLVED'
  | 'SYNC_STATUS_CHANGED'
  | 'DATABASE_RESET'

  // Security & License
  | 'SECURITY_CLOCK_RESTORED'
  | 'SECURITY_CLOCK_TAMPERED'
  | 'KILL_SWITCH_TRIGGERED'
  | 'KILL_SWITCH_DISARMED'
  | 'LICENSE_TAMPERED'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_ACTIVATED'

  // Table, Floor Plan & Voice Announcer
  | 'TABLE_STATUS_CHANGED'
  | 'TABLE_RESERVED'
  | 'TABLE_TRANSFERRED'
  | 'TABLE_MERGED'
  | 'KDS_TICKET_DELAYED'
  | 'VOICE_ANNOUNCEMENT_TRIGGERED'
  | 'VOICE_ANNOUNCEMENT_COMPLETED'

  // Tableside Guest Portal & Live Order Tracker
  | 'TABLE_GUEST_ORDER_PLACED'
  | 'TABLE_WAITER_CALLED'
  | 'TABLE_BILL_REQUESTED'
  | 'TABLE_ORDER_STAGE_CHANGED'
  | 'TABLE_GUEST_FEEDBACK_SUBMITTED'
  | 'TABLE_ASSISTANCE_RESOLVED'

  // Smart Routing, Course Pacing & Vision Plating
  | 'COURSE_PACING_ITEM_FIRED'
  | 'COURSE_PACING_BATCH_CALCULATED'
  | 'STATION_BOTTLENECK_DETECTED'
  | 'STATION_BOTTLENECK_RESOLVED'
  | 'VISION_PLATING_VERIFIED'
  | 'VISION_PLATING_DEFECT_DETECTED'

  // ZATCA Phase 2 E-Invoicing
  | 'ZATCA_INVOICE_ISSUED'
  | 'ZATCA_TAMPER_DETECTED'
  | 'ZATCA_CSID_ONBOARDED';

export interface EventPayloadMap {
  ORDER_CREATED: { order: Order; items: OrderItem[] };
  ORDER_UPDATED: { order: Order };
  ORDER_STATUS_CHANGED: { orderId: string; previousStatus: string; newStatus: string };
  ORDER_ITEM_STATUS_CHANGED: { itemId: string; orderId: string; newStatus: string };
  ORDER_PAID: { order?: Order; paymentMethod: string; amount: number; total?: number; guestCount?: number; orderNumber?: string; orderId?: string };
  ORDER_CANCELLED: { orderId: string; reason?: string };
  ORDER_REFUNDED: { orderId: string; amount: number };

  DELIVERY_ORDER_RECEIVED: { deliveryOrder: AggregatedDeliveryOrder; order: Order; items: OrderItem[] };
  DELIVERY_ORDER_ACCEPTED: { deliveryOrderId: string; orderId: string; platform: DeliveryPlatform };
  DELIVERY_ORDER_STATUS_CHANGED: { deliveryOrderId: string; orderId: string; previousStatus: DeliveryOrderStatus; newStatus: DeliveryOrderStatus; platform: DeliveryPlatform };
  DELIVERY_DRIVER_ASSIGNED: { deliveryOrderId: string; driver: DeliveryDriver };
  DELIVERY_DRIVER_LOCATION_UPDATED: { deliveryOrderId: string; driverId: string; lat: number; lng: number; etaMinutes?: number };
  DELIVERY_CHANNEL_STATUS_CHANGED: { platform: DeliveryPlatform; isConnected: boolean; autoAccept: boolean };

  KDS_NEW_TICKET: { orderId: string; tableNumber?: string; items: OrderItem[] };
  KDS_ITEM_COOKING: { itemId: string; station: string };
  KDS_ITEM_READY: { itemId: string; orderId: string; itemName: string };
  KDS_ORDER_COMPLETED: { orderId: string };
  KDS_AUDIO_ALERT: { soundType: 'new_order' | 'item_ready' | 'urgent_alert' };

  INVENTORY_STOCK_DEDUCTED: { inventoryItemId: string; quantity: number; newStock: number; reason: string };
  INVENTORY_LOW_STOCK_ALERT: { item: InventoryItem; currentStock: number; minStockAlert: number };
  INVENTORY_RESTOCKED: { inventoryItemId: string; addedQuantity: number; totalStock: number };
  INVENTORY_WASTE_LOGGED: { inventoryItemId?: string; costAmount: number; reason: string };

  CUSTOMER_TIER_UPGRADED: { customer: Customer; previousTier: string; newTier: string };
  LOYALTY_POINTS_EARNED: { customerId: string; points: number; newTotal: number };
  LOYALTY_POINTS_REDEEMED: { customerId: string; points: number; newTotal: number };

  SHIFT_OPENED: { shift: Shift | ShiftSession };
  SHIFT_CLOSED: { shift: Shift | ShiftSession };
  CASH_DRAWER_KICKED: { reason?: string; cashierId?: string; shiftId?: string };
  Z_REPORT_GENERATED: { zReport: ZReport | ZReportRecord };

  AI_VOICE_ORDER_PARSED: { rawAudioPrompt?: string; parsedOrder: Partial<Order>; detectedItems: Partial<OrderItem>[] };
  AI_INVOICE_PROCESSED: { invoiceData: any; success: boolean };
  AI_RECOMMENDATION_READY: { type: string; title: string; payload: any };
  AI_BCG_ANALYSIS_COMPLETED: { stars: string[]; cashCows: string[]; questionMarks: string[]; dogs: string[] };
  AI_ANOMALY_DETECTED: { type: string; severity: 'low' | 'medium' | 'high'; details: string };
  AI_VISION_PLATE_WASTE_ANALYZED: { wasteData: any; success: boolean };
  AI_VISION_INVENTORY_SCANNED: { scanData: any; success: boolean };

  PRINT_CUSTOMER_RECEIPT: { order: Order; items: OrderItem[]; autoCut?: boolean };
  PRINT_KITCHEN_ORDER: { order: Order; items: OrderItem[]; station?: string };
  PRINT_JOB_FINISHED: { jobId: string; status: 'ok' | 'failed' };
  PRINT_ERROR: { error: string; printerName?: string };

  SYSTEM_ONLINE: { timestamp: string };
  SYSTEM_OFFLINE: { timestamp: string };
  SYNC_QUEUE_PROCESSED: { syncedCount: number; pendingCount: number; failedCount?: number };
  SYNC_STARTED: { trigger: 'auto' | 'manual' | 'online' | 'timer' | 'startup'; timestamp: string };
  SYNC_COMPLETED: { syncedCount: number; failedCount: number; durationMs: number; timestamp: string };
  SYNC_ERROR: { error: string; code?: string; timestamp: string; consecutiveFailures?: number };
  SYNC_INBOUND_APPLIED: { entityName: string; count: number; branchId?: string; timestamp: string };
  SYNC_CONFLICT_RESOLVED: { entityName: string; entityId: string; strategy: string; winner: 'local' | 'remote' | 'merged'; timestamp: string };
  SYNC_STATUS_CHANGED: { isOnline: boolean; isSyncing: boolean; pendingCount: number; lastSyncTime: string | null };
  DATABASE_RESET: { timestamp: string };

  SECURITY_CLOCK_RESTORED: any;
  SECURITY_CLOCK_TAMPERED: any;
  KILL_SWITCH_TRIGGERED: any;
  KILL_SWITCH_DISARMED: any;
  LICENSE_TAMPERED: any;
  LICENSE_EXPIRED: any;
  LICENSE_ACTIVATED: any;

  TABLE_STATUS_CHANGED: { tableId: string; tableNumber: string; previousStatus?: string; newStatus: string; orderId?: string };
  TABLE_RESERVED: { tableId: string; tableNumber: string; customerName: string; guestCount: number; reservationTime?: string };
  TABLE_TRANSFERRED: { fromTableId: string; fromTableNumber: string; toTableId: string; toTableNumber: string; orderId: string };
  TABLE_MERGED: { primaryTableId: string; secondaryTableId: string; orderId?: string };
  KDS_TICKET_DELAYED: { orderId: string; orderNumber: string; tableNumber?: string; elapsedMinutes: number; station?: string };
  VOICE_ANNOUNCEMENT_TRIGGERED: { id: string; text: string; language: string; priority: string; station?: string };
  VOICE_ANNOUNCEMENT_COMPLETED: { id: string; durationMs?: number };

  TABLE_GUEST_ORDER_PLACED: { order: Order; items: OrderItem[]; tableNumber: string; guestCount: number; guestName?: string };
  TABLE_WAITER_CALLED: { tableId: string; tableNumber: string; callType: 'general_waiter' | 'water_refill' | 'cutlery_napkins' | 'clean_table' | 'custom_request'; notes?: string; requestedAt: string };
  TABLE_BILL_REQUESTED: { tableId: string; tableNumber: string; orderId: string; totalAmount: number; paymentMethod?: string; splitCount?: number; requestedAt: string };
  TABLE_ORDER_STAGE_CHANGED: { orderId: string; tableNumber: string; stage: 'received' | 'preparing' | 'plating' | 'served' | 'billing' | 'paid'; progressPercentage: number; estimatedMinutesRemaining: number };
  TABLE_GUEST_FEEDBACK_SUBMITTED: { tableNumber: string; orderId: string; rating: number; tags: string[]; comment?: string; submittedAt: string };
  TABLE_ASSISTANCE_RESOLVED: { tableId: string; tableNumber: string; resolvedBy?: string; resolvedAt: string };

  COURSE_PACING_ITEM_FIRED: { orderId: string; itemId: string; itemName: string; station: KitchenStation | string; fireTime: string };
  COURSE_PACING_BATCH_CALCULATED: { orderId: string; maxPrepMinutes: number; itemsCount: number; targetReadyAt: string };
  STATION_BOTTLENECK_DETECTED: { station: KitchenStation; waitTimeMinutes: number; activeItemsCount: number; severity: 'warning' | 'critical'; suggestedAction?: string };
  STATION_BOTTLENECK_RESOLVED: { station: KitchenStation; waitTimeMinutes: number };
  VISION_PLATING_VERIFIED: { orderId: string; isApproved: boolean; confidence: number; detectedItemsCount: number; missingCount: number };
  VISION_PLATING_DEFECT_DETECTED: { orderId: string; reason: string; defectCategory: string; confidence: number };

  ZATCA_INVOICE_ISSUED: { invoiceNumber: string; uuid: string; icv: number; totalWithTax: number; status: string };
  ZATCA_TAMPER_DETECTED: { invoiceNumber: string; alteredAmount: number };
  ZATCA_CSID_ONBOARDED: { serialNum: string; environment: string };
}

export interface NeuralEvent<T extends EventType = EventType> {
  id: string;
  type: T;
  payload: EventPayloadMap[T];
  timestamp: string;
  source: 'pos' | 'kds' | 'inventory' | 'ai' | 'cloud' | 'system' | 'delivery' | 'table_portal' | 'waiter';
}

type EventHandler<T extends EventType> = (event: NeuralEvent<T>) => void | Promise<void>;
type EventMiddleware = (event: NeuralEvent) => boolean | Promise<boolean>; // return false to cancel

class NeuralEventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map();
  private wildcardHandlers: Set<(event: NeuralEvent) => void> = new Set();
  private middlewares: EventMiddleware[] = [];
  private eventHistory: NeuralEvent[] = [];
  private readonly MAX_HISTORY = 150;

  /**
   * Register a typed event listener.
   */
  public on<T extends EventType>(eventType: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const set = this.handlers.get(eventType)!;
    set.add(handler);

    // Return unregister callback
    return () => {
      set.delete(handler);
    };
  }

  /**
   * Alias for on()
   */
  public subscribe<T extends EventType>(eventType: T, handler: (payload: EventPayloadMap[T]) => void): () => void {
    return this.on(eventType, (evt) => handler(evt.payload));
  }

  /**
   * Register a one-time event listener.
   */
  public once<T extends EventType>(eventType: T, handler: EventHandler<T>): () => void {
    const unsub = this.on(eventType, (event) => {
      unsub();
      handler(event);
    });
    return unsub;
  }

  /**
   * Listen to all events across the entire system.
   */
  public subscribeAll(handler: (event: NeuralEvent) => void): () => void {
    this.wildcardHandlers.add(handler);
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  /**
   * Add middleware to inspect or filter events.
   */
  public use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Publish an event to all subscribers and run automated pipelines.
   */
  public async publish<T extends EventType>(
    type: T,
    payload: EventPayloadMap[T],
    source: NeuralEvent['source'] = 'system'
  ): Promise<NeuralEvent<T> | null> {
    const event: NeuralEvent<T> = {
      id: newId('evt'),
      type,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };

    // 1. Run Middlewares
    for (const mw of this.middlewares) {
      try {
        const res = mw(event);
        const allowed = res instanceof Promise ? await res : res;
        if (!allowed) {
          console.warn(`[EventBus] Event ${type} was cancelled by middleware.`);
          return null;
        }
      } catch (err) {
        console.error('[EventBus] Middleware error:', err);
      }
    }

    // 2. Add to event history ring buffer
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    // 3. Dispatch to specific handlers
    const specificHandlers = this.handlers.get(type);
    if (specificHandlers) {
      specificHandlers.forEach((handler) => {
        try {
          const res = handler(event);
          if (res instanceof Promise) {
            res.catch((err) => console.error(`[EventBus] Error in handler for event ${type}:`, err));
          }
        } catch (err) {
          console.error(`[EventBus] Error in handler for event ${type}:`, err);
        }
      });
    }

    // 4. Dispatch to wildcard handlers
    this.wildcardHandlers.forEach((handler) => {
      try {
        const res: any = handler(event);
        if (res && typeof res.catch === 'function') {
          res.catch((err: any) => console.error('[EventBus] Error in wildcard event handler:', err));
        }
      } catch (err) {
        console.error('[EventBus] Error in wildcard event handler:', err);
      }
    });

    return event;
  }

  /**
   * Alias for publish()
   */
  public emit<T extends EventType | string>(
    type: T,
    payload: any,
    source: NeuralEvent['source'] = 'system'
  ): Promise<any> {
    return this.publish(type as any, payload, source);
  }

  /**
   * Get recent event timeline for debugging or neural monitoring UI.
   */
  public getHistory(): NeuralEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get events filtered by type.
   */
  public getEventHistory<T extends EventType = EventType>(type?: T): NeuralEvent<T>[] {
    if (!type) return [...this.eventHistory] as NeuralEvent<T>[];
    return this.eventHistory.filter((e) => e.type === type) as NeuralEvent<T>[];
  }

  /**
   * Clear event history.
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }
}

// Global Singleton Event Bus Instance
export const eventBus = new NeuralEventBus();

// Built-in intelligent middleware: Auto log events in debug mode
eventBus.use((event) => {
  if (typeof window !== 'undefined' && (window as any).__DEV_EVENT_LOG__) {
    logger.log(`[Neural Event] ${event.type}`, event);
  }
  return true;
});
