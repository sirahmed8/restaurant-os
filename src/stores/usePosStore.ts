import { create } from 'zustand';
import { CartItem, MenuItem, Order, OrderType } from '../types';
import { useAppStore } from './useAppStore';
import { firebaseService } from '../services/firebaseService';
import { newId, cartLineKey } from '../lib/ids';
import { calcTotals } from '../lib/money';
import { fireAndForget } from '../lib/logger';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  badgeCount?: number;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل', nameEn: 'All', icon: 'Sparkles' },
  { id: 'burgers', name: 'البرجر والسلايدرز', nameEn: 'Burgers & Sliders', icon: 'Utensils' },
  { id: 'steaks', name: 'اللحوم والشواء', nameEn: 'Steaks & Grill', icon: 'Flame' },
  { id: 'pizza', name: 'البيتزا الإيطالية', nameEn: 'Artisan Pizza', icon: 'Pizza' },
  { id: 'appetizers', name: 'المقبلات والأطباق الجانبية', nameEn: 'Appetizers & Sides', icon: 'Soup' },
  { id: 'beverages', name: 'المشروبات والقهوة المختصة', nameEn: 'Beverages & Coffee', icon: 'Coffee' },
  { id: 'desserts', name: 'الحلويات الفاخرة', nameEn: 'Gourmet Desserts', icon: 'Cake' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'برجر ترافل أنجوس الفاخر',
    nameEn: 'Truffle Angus Burger',
    category: 'burgers',
    price: 68,
    cost: 22,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    color: '#f59e0b',
    prepTimeMinutes: 12,
    calories: 780,
    available: true,
    station: 'grill',
    modifiers: [
      {
        id: 'doneness',
        name: 'درجة الاستواء',
        nameEn: 'Doneness',
        options: [
          { name: 'متوسط الاستواء (Medium)', nameEn: 'Medium', price: 0 },
          { name: 'كامل الاستواء (Well Done)', nameEn: 'Well Done', price: 0 },
        ],
      },
      {
        id: 'extra_cheese',
        name: 'إضافات الجبن',
        nameEn: 'Extra Cheese',
        options: [
          { name: 'جبن شيدر مدخن مضاعف', nameEn: 'Double Smoked Cheddar', price: 6 },
          { name: 'صلصة ترافل إضافية', nameEn: 'Extra Truffle Aioli', price: 8 },
        ],
      },
    ],
  },
  {
    id: 'm2',
    name: 'ستيك ريب آي واغيو A5',
    nameEn: 'Wagyu Ribeye Steak A5',
    category: 'steaks',
    price: 210,
    cost: 85,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    color: '#ef4444',
    prepTimeMinutes: 18,
    calories: 920,
    available: true,
    station: 'grill',
  },
  {
    id: 'm3',
    name: 'سلايدرز دجاج كرسبي كوري',
    nameEn: 'Korean Crispy Chicken Sliders',
    category: 'burgers',
    price: 52,
    cost: 16,
    image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=400&auto=format&fit=crop&q=80',
    color: '#f97316',
    prepTimeMinutes: 10,
    calories: 640,
    available: true,
    station: 'fryer',
  },
  {
    id: 'm4',
    name: 'بيتزا نابولي بالكمأة والمشروم',
    nameEn: 'Truffle Mushroom Pizza',
    category: 'pizza',
    price: 78,
    cost: 20,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
    color: '#eab308',
    prepTimeMinutes: 14,
    calories: 820,
    available: true,
    station: 'bakery',
  },
  {
    id: 'm5',
    name: 'ديناميت شريمب مقرمش',
    nameEn: 'Signature Dynamite Shrimp',
    category: 'appetizers',
    price: 49,
    cost: 18,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80',
    color: '#ec4899',
    prepTimeMinutes: 8,
    calories: 450,
    available: true,
    station: 'fryer',
  },
  {
    id: 'm6',
    name: 'بطاطس بالبارميزان وزيت الكمأة',
    nameEn: 'Parmesan Truffle Fries',
    category: 'appetizers',
    price: 34,
    cost: 8,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
    color: '#eab308',
    prepTimeMinutes: 6,
    calories: 390,
    available: true,
    station: 'fryer',
  },
  {
    id: 'm7',
    name: 'موهيتو باشن فروت وريحان',
    nameEn: 'Passion Fruit Basil Mojito',
    category: 'beverages',
    price: 28,
    cost: 5,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
    color: '#06b6d4',
    prepTimeMinutes: 4,
    calories: 140,
    available: true,
    station: 'beverage',
  },
  {
    id: 'm8',
    name: 'كورتادو حبوب إثيوبية مختصة',
    nameEn: 'Single Origin Cortado',
    category: 'beverages',
    price: 22,
    cost: 4,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
    prepTimeMinutes: 3,
    calories: 80,
    available: true,
    station: 'beverage',
  },
  {
    id: 'm9',
    name: 'كيكة التمر بالكراميل المملح والآيسكريم',
    nameEn: 'Salted Caramel Date Pudding',
    category: 'desserts',
    price: 44,
    cost: 11,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&auto=format&fit=crop&q=80',
    color: '#10b981',
    prepTimeMinutes: 7,
    calories: 510,
    available: true,
    station: 'bakery',
  },
];

interface PosState {
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  items: MenuItem[];
  cart: CartItem[];
  orderType: OrderType;
  selectedTable: string;
  customerName: string;
  customerPhone: string;
  recentOrders: Order[];
  isPaymentOpen: boolean;

  // Actions
  setSelectedCategory: (catId: string) => void;
  setSearchQuery: (q: string) => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (table: string) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  addToCart: (item: MenuItem, quantity?: number, selectedModifiers?: Record<string, string>, notes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  setPaymentOpen: (open: boolean) => void;
  completeOrder: (paymentMethod: 'cash' | 'card' | 'apple-pay' | 'loyalty-points') => Order | null;
}

export const usePosStore = create<PosState>((set, get) => ({
  categories: INITIAL_CATEGORIES,
  selectedCategory: 'all',
  searchQuery: '',
  // Never start with an empty catalog: POS must sell on first paint,
  // even before onboarding hydration overwrites this state.
  items: INITIAL_MENU_ITEMS,
  cart: [],
  orderType: 'dine-in',
  selectedTable: '',
  customerName: '',
  customerPhone: '',
  recentOrders: [],
  isPaymentOpen: false,

  setSelectedCategory: (catId) => {
    useAppStore.getState().playSound('tap');
    set({ selectedCategory: catId });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setOrderType: (type) => {
    useAppStore.getState().playSound('tap');
    set({ orderType: type });
  },
  setSelectedTable: (table) => {
    useAppStore.getState().playSound('click');
    set({ selectedTable: table });
  },
  setCustomerInfo: (name, phone) => set({ customerName: name, customerPhone: phone }),

  addToCart: (dish, quantity = 1, selectedModifiers, notes) => {
    useAppStore.getState().playSound('pop');
    const qty = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
    const key = cartLineKey(dish.id, selectedModifiers, notes);
    const cart = get().cart;
    const existingIndex = cart.findIndex(
      (c) => cartLineKey(c.dish.id, c.selectedModifiers, c.notes) === key
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const line = updatedCart[existingIndex];
      const nextQty = Math.min(99, line.quantity + qty);
      updatedCart[existingIndex] = { ...line, quantity: nextQty, itemTotal: nextQty * line.dish.price };
      set({ cart: updatedCart });
    } else {
      const newCartItem: CartItem = {
        cartItemId: newId('item'),
        dish,
        quantity: qty,
        selectedModifiers,
        notes,
        itemTotal: dish.price * qty,
      };
      set({ cart: [...cart, newCartItem] });
    }
  },

  removeFromCart: (cartItemId) => {
    useAppStore.getState().playSound('delete');
    set({ cart: get().cart.filter((i) => i.cartItemId !== cartItemId) });
  },

  updateQuantity: (cartItemId, delta) => {
    const updated = get().cart
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          useAppStore.getState().playSound('click');
          return {
            ...item,
            quantity: newQty,
            itemTotal: newQty * item.dish.price,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({ cart: updated });
  },

  clearCart: () => {
    useAppStore.getState().playSound('delete');
    set({ cart: [] });
  },

  setPaymentOpen: (open) => {
    useAppStore.getState().playSound(open ? 'pop' : 'tap');
    set({ isPaymentOpen: open });
  },

  completeOrder: (paymentMethod) => {
    const state = get();
    if (state.cart.length === 0) return null;
    useAppStore.getState().playSound('cash-register');
    const { subtotal, tax, total } = calcTotals(state.cart.reduce((sum, item) => sum + item.itemTotal, 0));

    const newOrder: Order = {
      id: newId('ord'),
      orderNumber: '#' + Math.floor(1000 + Math.random() * 9000),
      tableNumber: state.orderType === 'dine-in' ? state.selectedTable : undefined,
      customerName: state.customerName || 'ضيف مميز',
      customerPhone: state.customerPhone,
      orderType: state.orderType,
      items: [...state.cart],
      subtotal,
      tax,
      discount: 0,
      total,
      status: 'cooking',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elapsedSeconds: 0,
      paymentMethod,
      cashierId: useAppStore.getState().activeUser.id,
    };

    set({
      recentOrders: [newOrder, ...state.recentOrders].slice(0, 100),
      cart: [],
      isPaymentOpen: false,
    });

    // Cloud Realtime Synchronization via Firebase (never blocks the cashier)
    fireAndForget(firebaseService.syncOrder('cairo-main', newOrder), 'syncOrder');
    fireAndForget(
      firebaseService.trackEvent('purchase', {
        order_id: newOrder.id,
        value: newOrder.total,
        currency: 'EGP',
        payment_method: paymentMethod,
      }),
      'trackEvent'
    );

    return newOrder;
  },
}));
