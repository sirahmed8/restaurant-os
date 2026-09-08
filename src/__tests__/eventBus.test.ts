import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus, NeuralEvent } from '../services/eventBus';
import { Order, OrderItem, InventoryItem } from '../db/schema';

describe('Unified Neural Reactive Event Bus', () => {
  beforeEach(() => {
    eventBus.clearHistory();
  });

  describe('1. Subscription & Publish Lifecycle', () => {
    it('should subscribe and receive strongly typed events with metadata', async () => {
      const receivedEvents: NeuralEvent<'ORDER_CREATED'>[] = [];
      const unsub = eventBus.on('ORDER_CREATED', (evt) => {
        receivedEvents.push(evt);
      });

      const mockOrder: Order = {
        id: 'ord-test-01',
        orderNumber: 'ORD-20260814-001',
        dailySequence: 1,
        orderType: 'dine_in',
        tableId: 'tbl-m1',
        status: 'sent_to_kitchen',
        paymentStatus: 'unpaid',
        subtotal: 100,
        taxAmount: 15,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 115,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 2,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockItems: OrderItem[] = [
        {
          id: 'item-test-01',
          orderId: 'ord-test-01',
          menuItemId: 'item-wagyu-ribeye',
          nameAr: 'ستيك واغيو ريب آي',
          nameEn: 'Wagyu Ribeye',
          quantity: 1,
          unitPrice: 115,
          costPrice: 45,
          subtotal: 100,
          taxAmount: 15,
          discountAmount: 0,
          totalAmount: 115,
          selectedModifiers: [],
          kitchenStation: 'grill',
          status: 'cooking',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const publishedEvent = await eventBus.publish('ORDER_CREATED', {
        order: mockOrder,
        items: mockItems,
      }, 'pos');

      expect(publishedEvent).not.toBeNull();
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('ORDER_CREATED');
      expect(receivedEvents[0].source).toBe('pos');
      expect(receivedEvents[0].payload.order.orderNumber).toBe('ORD-20260814-001');
      expect(receivedEvents[0].payload.items[0].nameAr).toBe('ستيك واغيو ريب آي');
      expect(receivedEvents[0].id).toMatch(/^evt_/);
      expect(receivedEvents[0].timestamp).toBeDefined();

      unsub();
    });

    it('should allow multiple handlers for the same event type', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const unsub1 = eventBus.on('SYSTEM_ONLINE', fn1);
      const unsub2 = eventBus.on('SYSTEM_ONLINE', fn2);

      await eventBus.publish('SYSTEM_ONLINE', { timestamp: new Date().toISOString() }, 'system');

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
    });

    it('should unsubscribe cleanly and not receive further events', async () => {
      const handler = vi.fn();
      const unsub = eventBus.on('SYSTEM_OFFLINE', handler);

      await eventBus.publish('SYSTEM_OFFLINE', { timestamp: new Date().toISOString() }, 'system');
      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsub();

      await eventBus.publish('SYSTEM_OFFLINE', { timestamp: new Date().toISOString() }, 'system');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should trigger once() listener only for the first occurrence', async () => {
      const onceHandler = vi.fn();
      eventBus.once('CASH_DRAWER_KICKED', onceHandler);

      await eventBus.publish('CASH_DRAWER_KICKED', { reason: 'Sale #1' }, 'pos');
      await eventBus.publish('CASH_DRAWER_KICKED', { reason: 'Sale #2' }, 'pos');
      await eventBus.publish('CASH_DRAWER_KICKED', { reason: 'Sale #3' }, 'pos');

      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(onceHandler.mock.calls[0][0].payload.reason).toBe('Sale #1');
    });
  });

  describe('2. Wildcard & Cross-Module Subscriptions', () => {
    it('should intercept all events using subscribeAll wildcard handler', async () => {
      const allEvents: string[] = [];
      const unsub = eventBus.subscribeAll((evt) => {
        allEvents.push(evt.type);
      });

      await eventBus.publish('SYSTEM_ONLINE', { timestamp: new Date().toISOString() }, 'system');
      await eventBus.publish('CASH_DRAWER_KICKED', { reason: 'manual' }, 'pos');
      await eventBus.publish('SYNC_QUEUE_PROCESSED', { syncedCount: 5, pendingCount: 0 }, 'cloud');

      expect(allEvents).toEqual(['SYSTEM_ONLINE', 'CASH_DRAWER_KICKED', 'SYNC_QUEUE_PROCESSED']);

      unsub();
    });
  });

  describe('3. Middleware Pipeline & Cancellation', () => {
    it('should block event propagation and return null when middleware returns false', async () => {
      const handler = vi.fn();
      const unsub = eventBus.on('ORDER_CANCELLED', handler);

      // Register middleware that cancels cancellation of orders with reason 'blocked'
      eventBus.use((event) => {
        if (event.type === 'ORDER_CANCELLED' && (event.payload as any)?.reason === 'blocked') {
          return false;
        }
        return true;
      });

      // Attempt blocked event
      const blockedResult = await eventBus.publish('ORDER_CANCELLED', {
        orderId: 'ord-999',
        reason: 'blocked',
      }, 'pos');

      expect(blockedResult).toBeNull();
      expect(handler).not.toHaveBeenCalled();

      // Allowed event
      const allowedResult = await eventBus.publish('ORDER_CANCELLED', {
        orderId: 'ord-888',
        reason: 'valid_cancellation',
      }, 'pos');

      expect(allowedResult).not.toBeNull();
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
    });
  });

  describe('4. Event History & Ring Buffer', () => {
    it('should maintain recent event history and respect ring buffer', async () => {
      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);

      await eventBus.publish('SYSTEM_ONLINE', { timestamp: 't1' }, 'system');
      await eventBus.publish('SYSTEM_OFFLINE', { timestamp: 't2' }, 'system');

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('SYSTEM_OFFLINE'); // Newest first
      expect(history[1].type).toBe('SYSTEM_ONLINE');

      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('5. Complex Business Flows', () => {
    it('should handle POS Settle Payment -> Loyalty & Cash Drawer flow', async () => {
      const auditTrail: string[] = [];

      eventBus.on('ORDER_PAID', (evt) => {
        const ordNum = evt.payload.order?.orderNumber || (evt.payload as any).orderNumber || 'ORD-99';
        auditTrail.push(`PAID:${ordNum}:${evt.payload.amount}`);
      });

      eventBus.on('LOYALTY_POINTS_EARNED', (evt) => {
        auditTrail.push(`POINTS:+${evt.payload.points} for ${evt.payload.customerId}`);
      });

      eventBus.on('CASH_DRAWER_KICKED', (evt) => {
        auditTrail.push(`DRAWER_KICK:${evt.payload.reason}`);
      });

      const mockOrder: any = { orderNumber: 'ORD-2026-99', totalAmount: 250 };

      await eventBus.publish('ORDER_PAID', { order: mockOrder, paymentMethod: 'cash', amount: 250 }, 'pos');
      await eventBus.publish('LOYALTY_POINTS_EARNED', { customerId: 'cust-1', points: 25, newTotal: 125 }, 'pos');
      await eventBus.publish('CASH_DRAWER_KICKED', { reason: 'cash_sale' }, 'pos');

      expect(auditTrail).toEqual([
        'PAID:ORD-2026-99:250',
        'POINTS:+25 for cust-1',
        'DRAWER_KICK:cash_sale',
      ]);
    });

    it('should handle Inventory Stock Alert flow', async () => {
      const alerts: string[] = [];

      eventBus.on('INVENTORY_LOW_STOCK_ALERT', (evt) => {
        alerts.push(`LOW_STOCK:${evt.payload.item.nameAr}:${evt.payload.currentStock}`);
      });

      const mockItem: InventoryItem = {
        id: 'raw-wagyu',
        code: 'RAW-01',
        nameAr: 'لحم واغيو',
        nameEn: 'Wagyu Beef',
        category: 'Meat',
        unit: 'kg',
        currentStock: 3.2,
        minStockAlert: 5.0,
        maxStock: 20.0,
        reorderQuantity: 10.0,
        averageCost: 380,
        lastPurchasePrice: 380,
        expiryTracking: true,
        yieldRatio: 0.95,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await eventBus.publish('INVENTORY_LOW_STOCK_ALERT', {
        item: mockItem,
        currentStock: 3.2,
        minStockAlert: 5.0,
      }, 'inventory');

      expect(alerts).toEqual(['LOW_STOCK:لحم واغيو:3.2']);
    });
  });
});
