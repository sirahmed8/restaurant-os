/**
 * =====================================================================
 * RESTAURANT OS — KITCHEN DISPLAY SYSTEM (KDS) STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import { Order, OrderItem, KitchenStation, OrderItemStatus } from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';
import { firebaseService } from '../services/firebaseService';

export interface KdsTicket {
  order: Order;
  items: OrderItem[];
  elapsedMinutes: number;
  urgency: 'normal' | 'warning' | 'critical'; // <10m, 10-20m, >20m
}

interface KdsState {
  activeStation: KitchenStation | 'all';
  tickets: KdsTicket[];
  isLoading: boolean;

  // Actions
  setActiveStation: (station: KitchenStation | 'all') => void;
  loadKdsTickets: () => Promise<void>;
  updateItemStatus: (itemId: string, newStatus: OrderItemStatus) => Promise<void>;
  bumpEntireOrder: (orderId: string) => Promise<void>;
}

export const useKdsStore = create<KdsState>((set, get) => ({
  activeStation: 'all',
  tickets: [],
  isLoading: false,

  setActiveStation: (station) => {
    set({ activeStation: station });
    get().loadKdsTickets();
  },

  loadKdsTickets: async () => {
    set({ isLoading: true });
    try {
      const activeOrders = await db.query('orders', {
        where: (o) => o.status === 'sent_to_kitchen' || o.status === 'preparing' || o.status === 'ready',
        orderBy: 'createdAt',
        orderDirection: 'asc',
      });

      const allItems = await db.query('orderItems', {
        where: (i) => i.status !== 'served' && i.status !== 'cancelled',
      });

      const now = Date.now();
      const station = get().activeStation;

      const tickets: KdsTicket[] = activeOrders
        .map((order) => {
          let orderItems = allItems.filter((i) => i.orderId === order.id);

          if (station !== 'all') {
            orderItems = orderItems.filter((i) => i.kitchenStation === station);
          }

          if (orderItems.length === 0) return null;

          const createdMs = new Date(order.createdAt).getTime();
          const elapsedMinutes = Math.floor((now - createdMs) / 60000);

          let urgency: KdsTicket['urgency'] = 'normal';
          if (elapsedMinutes >= 20) {
            urgency = 'critical';
          } else if (elapsedMinutes >= 10) {
            urgency = 'warning';
          }

          return {
            order,
            items: orderItems,
            elapsedMinutes,
            urgency,
          };
        })
        .filter(Boolean) as KdsTicket[];

      set({ tickets, isLoading: false });
    } catch (err) {
      console.error('[useKdsStore] Error loading KDS tickets:', err);
      set({ isLoading: false });
    }
  },

  updateItemStatus: async (itemId, newStatus) => {
    const updated = await db.update('orderItems', itemId, {
      status: newStatus,
      cookingStartedAt: newStatus === 'cooking' ? new Date().toISOString() : undefined,
      readyAt: newStatus === 'ready' ? new Date().toISOString() : undefined,
      servedAt: newStatus === 'served' ? new Date().toISOString() : undefined,
    });

    if (updated) {
      eventBus.publish('ORDER_ITEM_STATUS_CHANGED', {
        itemId,
        orderId: updated.orderId,
        newStatus,
      }, 'kds');

      if (newStatus === 'ready') {
        eventBus.publish('KDS_ITEM_READY', {
          itemId,
          orderId: updated.orderId,
          itemName: updated.nameAr,
        }, 'kds');
      }

      await get().loadKdsTickets();
    }
  },

  bumpEntireOrder: async (orderId) => {
    const items = await db.query('orderItems', {
      where: (i) => i.orderId === orderId,
    });

    for (const item of items) {
      await db.update('orderItems', item.id, {
        status: 'ready',
        readyAt: new Date().toISOString(),
      });
    }

    await db.update('orders', orderId, { status: 'ready' });

    // Sync KDS Ready State to Firebase Realtime Database
    firebaseService.syncRecord(`kds/cairo-main/${orderId}`, {
      orderId,
      status: 'ready',
      readyAt: new Date().toISOString(),
    });
    firebaseService.trackEvent('kds_order_ready', { orderId });

    eventBus.publish('KDS_ORDER_COMPLETED', { orderId }, 'kds');
    await get().loadKdsTickets();
  },
}));

// Reactive listeners
eventBus.on('ORDER_CREATED', () => {
  useKdsStore.getState().loadKdsTickets();
});

eventBus.on('KDS_NEW_TICKET', () => {
  useKdsStore.getState().loadKdsTickets();
});
