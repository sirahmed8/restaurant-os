/**
 * =====================================================================
 * RESTAURANT OS — ACTIVE ORDER & POS CART STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import {
  Order,
  OrderItem,
  MenuItem,
  SelectedModifier,
  OrderType,
  PaymentMethod,
  Coupon,
} from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';
import { printerService } from '../services/printerService';
import { firebaseService } from '../services/firebaseService';

export interface CartItem extends OrderItem {
  cartUniqueId: string; // To differentiate identical items with different modifiers
}

interface OrderState {
  // Active POS state
  activeTableId: string | null;
  activeCustomerId: string | null;
  orderType: OrderType;
  guestCount: number;
  customerNotes: string;
  kitchenNotes: string;
  cartItems: CartItem[];
  appliedCoupon: Coupon | null;
  customDiscount: { type: 'percentage' | 'fixed'; value: number; reason?: string } | null;

  // Active orders in memory / recent orders
  activeOrders: Order[];
  selectedActiveOrder: Order | null;
  isLoading: boolean;

  // Actions
  setOrderType: (type: OrderType) => void;
  setActiveTable: (tableId: string | null) => void;
  setActiveCustomer: (customerId: string | null) => void;
  setGuestCount: (count: number) => void;
  setCustomerNotes: (notes: string) => void;
  setKitchenNotes: (notes: string) => void;

  addItemToCart: (item: MenuItem, selectedModifiers?: SelectedModifier[], notes?: string, quantity?: number) => void;
  updateCartItemQuantity: (cartUniqueId: string, delta: number) => void;
  removeCartItem: (cartUniqueId: string) => void;
  clearCart: () => void;

  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  setCustomDiscount: (discount: { type: 'percentage' | 'fixed'; value: number; reason?: string } | null) => void;

  // Calculations
  getTotals: () => {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    serviceCharge: number;
    deliveryFee: number;
    totalAmount: number;
  };

  // Business Transactions
  sendOrderToKitchen: (waiterId?: string, cashierId?: string) => Promise<Order | null>;
  settlePayment: (
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    cashierId: string
  ) => Promise<boolean>;
  loadActiveOrders: () => Promise<void>;
  selectOrderForEdit: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeTableId: null,
  activeCustomerId: null,
  orderType: 'dine_in',
  guestCount: 2,
  customerNotes: '',
  kitchenNotes: '',
  cartItems: [],
  appliedCoupon: null,
  customDiscount: null,
  activeOrders: [],
  selectedActiveOrder: null,
  isLoading: false,

  setOrderType: (orderType) => set({ orderType }),
  setActiveTable: (activeTableId) => set({ activeTableId }),
  setActiveCustomer: (activeCustomerId) => set({ activeCustomerId }),
  setGuestCount: (guestCount) => set({ guestCount: Math.max(1, guestCount) }),
  setCustomerNotes: (customerNotes) => set({ customerNotes }),
  setKitchenNotes: (kitchenNotes) => set({ kitchenNotes }),

  addItemToCart: (menuItem, selectedModifiers = [], notes = '', quantity = 1) => {
    const state = get();
    const modifierKey = selectedModifiers.map((m) => m.optionId).sort().join('_');
    const cartUniqueId = `${menuItem.id}_${modifierKey}_${notes}`;

    const existingIndex = state.cartItems.findIndex((i) => i.cartUniqueId === cartUniqueId);

    const modifierPriceSum = selectedModifiers.reduce((sum, m) => sum + (m.price * (m.quantity || 1)), 0);
    const unitPrice = menuItem.price + modifierPriceSum;

    if (existingIndex > -1) {
      const updated = [...state.cartItems];
      const item = updated[existingIndex];
      const newQty = item.quantity + quantity;
      const totalAmount = newQty * unitPrice;
      const taxAmount = totalAmount * (menuItem.taxRate / (1 + menuItem.taxRate));
      const subtotal = totalAmount - taxAmount;

      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        unitPrice,
        subtotal,
        taxAmount,
        totalAmount,
      };

      set({ cartItems: updated });
    } else {
      const totalAmount = quantity * unitPrice;
      const taxAmount = totalAmount * (menuItem.taxRate / (1 + menuItem.taxRate));
      const subtotal = totalAmount - taxAmount;

      const newCartItem: CartItem = {
        id: db.generateUUID(),
        cartUniqueId,
        orderId: '',
        menuItemId: menuItem.id,
        nameAr: menuItem.nameAr,
        nameEn: menuItem.nameEn,
        quantity,
        unitPrice,
        costPrice: menuItem.costPrice,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        selectedModifiers,
        notes,
        kitchenStation: menuItem.kitchenStation,
        status: 'pending',
        printedToKitchen: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ cartItems: [...state.cartItems, newCartItem] });
    }
  },

  updateCartItemQuantity: (cartUniqueId, delta) => {
    const state = get();
    const updated = state.cartItems
      .map((item) => {
        if (item.cartUniqueId !== cartUniqueId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;

        const totalAmount = newQty * item.unitPrice;
        const taxAmount = totalAmount * 0.13043478; // Approx for 15% inclusive
        const subtotal = totalAmount - taxAmount;

        return {
          ...item,
          quantity: newQty,
          subtotal,
          taxAmount,
          totalAmount,
        };
      })
      .filter(Boolean) as CartItem[];

    set({ cartItems: updated });
  },

  removeCartItem: (cartUniqueId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.cartUniqueId !== cartUniqueId),
    }));
  },

  clearCart: () => {
    set({
      activeTableId: null,
      activeCustomerId: null,
      customerNotes: '',
      kitchenNotes: '',
      cartItems: [],
      appliedCoupon: null,
      customDiscount: null,
      selectedActiveOrder: null,
    });
  },

  applyCoupon: (coupon) => set({ appliedCoupon: coupon, customDiscount: null }),
  removeCoupon: () => set({ appliedCoupon: null }),
  setCustomDiscount: (discount) => set({ customDiscount: discount, appliedCoupon: null }),

  getTotals: () => {
    const { cartItems, appliedCoupon, customDiscount } = get();

    const grossTotal = cartItems.reduce((sum, i) => sum + i.totalAmount, 0);

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discountAmount = (grossTotal * appliedCoupon.discountValue) / 100;
        if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
          discountAmount = appliedCoupon.maxDiscount;
        }
      } else {
        discountAmount = Math.min(grossTotal, appliedCoupon.discountValue);
      }
    } else if (customDiscount) {
      if (customDiscount.type === 'percentage') {
        discountAmount = (grossTotal * customDiscount.value) / 100;
      } else {
        discountAmount = Math.min(grossTotal, customDiscount.value);
      }
    }

    const netAfterDiscount = Math.max(0, grossTotal - discountAmount);
    // Standard Saudi 15% VAT (VAT is calculated on net total: Net / 1.15 = Subtotal, Net - Subtotal = VAT)
    const subtotal = Number((netAfterDiscount / 1.15).toFixed(2));
    const taxAmount = Number((netAfterDiscount - subtotal).toFixed(2));
    const totalAmount = Number(netAfterDiscount.toFixed(2));

    return {
      subtotal,
      taxAmount,
      discountAmount: Number(discountAmount.toFixed(2)),
      serviceCharge: 0,
      deliveryFee: 0,
      totalAmount,
    };
  },

  sendOrderToKitchen: async (waiterId = 'emp-waiter-1', cashierId = 'emp-cashier-1') => {
    const state = get();
    if (state.cartItems.length === 0) return null;

    const totals = state.getTotals();
    const orderId = db.generateUUID();
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      dailySequence: state.activeOrders.length + 1,
      orderType: state.orderType,
      tableId: state.activeTableId || undefined,
      customerId: state.activeCustomerId || undefined,
      waiterId,
      cashierId,
      status: 'sent_to_kitchen',
      paymentStatus: 'unpaid',
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      discountType: state.appliedCoupon ? 'coupon' : state.customDiscount ? state.customDiscount.type : undefined,
      serviceCharge: totals.serviceCharge,
      tipAmount: 0,
      deliveryFee: totals.deliveryFee,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      changeAmount: 0,
      guestCount: state.guestCount,
      customerNotes: state.customerNotes,
      kitchenNotes: state.kitchenNotes,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderItems: OrderItem[] = state.cartItems.map((cartItem) => ({
      ...cartItem,
      id: db.generateUUID(),
      orderId,
      printedToKitchen: true,
      firedAt: new Date().toISOString(),
      status: 'cooking',
    }));

    // 1. Insert into local DB
    await db.insert('orders', newOrder);
    await db.bulkInsert('orderItems', orderItems);

    // 2. Update Table status if tableId attached
    if (state.activeTableId) {
      await db.update('tables', state.activeTableId, {
        status: 'occupied',
        currentOrderId: orderId,
        lastOccupiedAt: new Date().toISOString(),
      });
    }

    // 3. Dispatch Neural Events
    eventBus.publish('ORDER_CREATED', { order: newOrder, items: orderItems }, 'pos');
    eventBus.publish('KDS_NEW_TICKET', {
      orderId,
      tableNumber: state.activeTableId || 'Takeaway',
      items: orderItems,
    }, 'pos');

    // 4. Print Kitchen Ticket
    printerService.printKitchenTicket(newOrder, orderItems, 'all').catch(console.error);

    // 5. Sync to Firebase Cloud
    firebaseService.syncRecord(`branches/main/activeOrders/${orderId}`, newOrder);

    // Clear draft cart
    state.clearCart();
    await state.loadActiveOrders();

    return newOrder;
  },

  settlePayment: async (orderId, paymentMethod, amount, cashierId) => {
    const order = await db.getById('orders', orderId);
    if (!order) return false;

    const items = await db.query('orderItems', {
      where: (i) => i.orderId === orderId,
    });

    const updatedOrder: Order = {
      ...order,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod,
      paidAmount: amount,
      changeAmount: Math.max(0, amount - order.totalAmount),
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.update('orders', orderId, updatedOrder);

    // Update table status to cleaning / available
    if (order.tableId) {
      await db.update('tables', order.tableId, {
        status: 'cleaning',
        currentOrderId: undefined,
      });
    }

    // Update customer loyalty points (1 point per 10 SAR)
    if (order.customerId) {
      const customer = await db.getById('customers', order.customerId);
      if (customer) {
        const earnedPoints = Math.floor(order.totalAmount / 10);
        const newTotalPoints = customer.loyaltyPoints + earnedPoints;
        const newSpent = customer.totalSpent + order.totalAmount;
        const newOrders = customer.totalOrders + 1;

        await db.update('customers', customer.id, {
          loyaltyPoints: newTotalPoints,
          totalSpent: newSpent,
          totalOrders: newOrders,
          lastOrderAt: new Date().toISOString(),
        });

        eventBus.publish('LOYALTY_POINTS_EARNED', {
          customerId: customer.id,
          points: earnedPoints,
          newTotal: newTotalPoints,
        }, 'pos');
      }
    }

    // Publish event
    eventBus.publish('ORDER_PAID', {
      order: updatedOrder,
      paymentMethod,
      amount,
    }, 'pos');

    // Print Receipt
    printerService.printReceipt(updatedOrder, items, {
      nameAr: 'مطعم السلطان الفاخر للمأكولات الملكية',
      nameEn: 'Sultan Royal Fine Dining Restaurant',
      vatNumber: '300987654300003',
      addressAr: 'الرياض - طريق الملك فهد - برج المملكة',
      phone: '+966 11 400 9988',
      footerNote: 'نشكركم على زيارتكم الكريمة - أهلاً بكم دائماً',
    }).catch(console.error);

    // Open cash drawer if cash
    if (paymentMethod === 'cash') {
      printerService.kickCashDrawer();
    }

    await get().loadActiveOrders();
    return true;
  },

  loadActiveOrders: async () => {
    set({ isLoading: true });
    try {
      const orders = await db.query('orders', {
        where: (o) => o.status !== 'completed' && o.status !== 'cancelled',
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      set({ activeOrders: orders, isLoading: false });
    } catch (err) {
      console.error('[useOrderStore] Load active orders error:', err);
      set({ isLoading: false });
    }
  },

  selectOrderForEdit: async (orderId) => {
    const order = await db.getById('orders', orderId);
    if (!order) return;

    const items = await db.query('orderItems', {
      where: (i) => i.orderId === orderId,
    });

    const cartItems: CartItem[] = items.map((i) => ({
      ...i,
      cartUniqueId: i.id,
    }));

    set({
      selectedActiveOrder: order,
      activeTableId: order.tableId || null,
      activeCustomerId: order.customerId || null,
      orderType: order.orderType,
      guestCount: order.guestCount || 2,
      customerNotes: order.customerNotes || '',
      kitchenNotes: order.kitchenNotes || '',
      cartItems,
    });
  },
}));

// Reactive sync with db subscribers
db.subscribe('orders', () => {
  useOrderStore.getState().loadActiveOrders();
});
