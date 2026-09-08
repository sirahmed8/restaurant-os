/**
 * =====================================================================
 * RESTAURANT OS — 360° CUSTOMER DOSSIER & ALLERGY AUTO-SHIELD SERVICE
 * =====================================================================
 * Manages comprehensive customer profiles, health/allergen safety shields,
 * lifetime value (LTV), 1-click reordering, and automated loyalty vouchers.
 */

import { eventBus } from './eventBus';

export type CustomerTierType = 'VIP_BLACK' | 'GOLD' | 'SILVER' | 'BRONZE';

export type AllergenType = 
  | 'gluten' 
  | 'lactose' 
  | 'nuts' 
  | 'peanuts' 
  | 'seafood' 
  | 'eggs' 
  | 'soy' 
  | 'sesame';

export interface CustomerOrderSnippet {
  orderId: string;
  orderNumber: string;
  date: string;
  total: number;
  channel: 'dine_in' | 'takeaway' | 'delivery' | 'qr_table';
  tableNumber?: string;
  items: {
    nameAr: string;
    nameEn: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface LoyaltyVoucher {
  id: string;
  code: string;
  discountPercent: number;
  minSpend: number;
  expiresAt: string;
  isUsed: boolean;
  issuedAt: string;
}

export interface CustomerDossier {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  email?: string;
  tier: CustomerTierType;
  points: number;
  totalSpent: number;
  visitsCount: number;
  lastVisit: string;
  avatar?: string;
  allergens: AllergenType[];
  dietaryPreferences: string[];
  notes: string[];
  favoriteDishes: {
    nameAr: string;
    nameEn: string;
    orderCount: number;
    lastOrdered: string;
  }[];
  orderHistory: CustomerOrderSnippet[];
  vouchers: LoyaltyVoucher[];
  birthday?: string;
}

const STORAGE_KEY_CUSTOMERS = 'restaurant_os_customer_dossiers_v2';

const INITIAL_CUSTOMERS: CustomerDossier[] = [
  {
    id: 'cust_01',
    name: 'سلطان المقرن',
    nameEn: 'Sultan Al-Muqrin',
    phone: '+966 55 491 2233',
    email: 'sultan.m@royal.sa',
    tier: 'VIP_BLACK',
    points: 4850,
    totalSpent: 12400,
    visitsCount: 38,
    lastVisit: '2026-08-16 13:30',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    allergens: ['gluten', 'nuts'],
    dietaryPreferences: ['halal', 'keto'],
    notes: ['يفضل طاولة التراس رقم T-04 دائماً', 'الستيك يفضله Medium-Well حصراً'],
    favoriteDishes: [
      { nameAr: 'ستيك ريب آي واغيو A5 فاخر', nameEn: 'Wagyu Ribeye Steak A5', orderCount: 24, lastOrdered: '2026-08-16' },
      { nameAr: 'عصير رمان طبيعي مثلج', nameEn: 'Fresh Pomegranate Juice', orderCount: 32, lastOrdered: '2026-08-16' },
    ],
    orderHistory: [
      {
        orderId: 'ord_101',
        orderNumber: 'ORD-9821',
        date: '2026-08-16 13:30',
        total: 345.0,
        channel: 'dine_in',
        tableNumber: 'T-04',
        items: [
          { nameAr: 'ستيك ريب آي واغيو A5 فاخر', nameEn: 'Wagyu Ribeye Steak A5', quantity: 1, unitPrice: 280.0 },
          { nameAr: 'عصير رمان طبيعي مثلج', nameEn: 'Fresh Pomegranate Juice', quantity: 1, unitPrice: 20.0 },
          { nameAr: 'مياه إيفيان معدنية', nameEn: 'Evian Water 750ml', quantity: 1, unitPrice: 15.0 },
        ],
      },
      {
        orderId: 'ord_102',
        orderNumber: 'ORD-9740',
        date: '2026-08-12 20:15',
        total: 420.0,
        channel: 'dine_in',
        tableNumber: 'T-04',
        items: [
          { nameAr: 'ستيك تندرلوين واغيو فاخر A5', nameEn: 'Wagyu Tenderloin Steak A5', quantity: 1, unitPrice: 320.0 },
          { nameAr: 'سلطة سيزر بصدور الدجاج المشوية', nameEn: 'Grilled Chicken Caesar Salad', quantity: 1, unitPrice: 55.0 },
        ],
      },
    ],
    vouchers: [
      {
        id: 'vouch_1',
        code: 'VIP-BLACK-20',
        discountPercent: 20,
        minSpend: 200,
        expiresAt: '2026-12-31',
        isUsed: false,
        issuedAt: '2026-08-01',
      },
    ],
    birthday: '1988-11-20',
  },
  {
    id: 'cust_02',
    name: 'الدكتورة نورة الشمري',
    nameEn: 'Dr. Noura Al-Shammari',
    phone: '+966 50 882 1199',
    email: 'noura.dr@kfshrc.edu.sa',
    tier: 'GOLD',
    points: 2300,
    totalSpent: 6800,
    visitsCount: 19,
    lastVisit: '2026-08-15 21:00',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    allergens: ['lactose'],
    dietaryPreferences: ['low_sodium', 'halal'],
    notes: ['تطلب حليب اللوز أو الشوفان في جميع المشروبات'],
    favoriteDishes: [
      { nameAr: 'برجر ترافل أنجوس الفاخر', nameEn: 'Prime Angus Truffle Burger', orderCount: 14, lastOrdered: '2026-08-15' },
      { nameAr: 'قهوة كيمكس مختصة V60', nameEn: 'Specialty Chemex V60 Coffee', orderCount: 19, lastOrdered: '2026-08-15' },
    ],
    orderHistory: [
      {
        orderId: 'ord_103',
        orderNumber: 'ORD-9610',
        date: '2026-08-15 21:00',
        total: 185.0,
        channel: 'qr_table',
        tableNumber: 'T-02',
        items: [
          { nameAr: 'برجر ترافل أنجوس الفاخر', nameEn: 'Prime Angus Truffle Burger', quantity: 2, unitPrice: 65.0 },
          { nameAr: 'قهوة كيمكس مختصة V60', nameEn: 'Specialty Chemex V60 Coffee', quantity: 2, unitPrice: 25.0 },
        ],
      },
    ],
    vouchers: [],
    birthday: '1992-04-15',
  },
  {
    id: 'cust_03',
    name: 'المهندس ريان الخالدي',
    nameEn: 'Eng. Rayan Al-Khaldi',
    phone: '+966 54 123 9988',
    tier: 'SILVER',
    points: 850,
    totalSpent: 2900,
    visitsCount: 9,
    lastVisit: '2026-08-14 14:00',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    allergens: ['seafood'],
    dietaryPreferences: [],
    notes: ['حساسية شديدة من الروبيان وثمار البحر'],
    favoriteDishes: [
      { nameAr: 'بيتزا نابولي بالكمأة والمشروم', nameEn: 'Woodfired Truffle Mushroom Pizza', orderCount: 7, lastOrdered: '2026-08-14' },
    ],
    orderHistory: [],
    vouchers: [],
  },
  {
    id: 'cust_04',
    name: 'ياسمين الفهد',
    nameEn: 'Yasmeen Al-Fahad',
    phone: '+966 56 777 4411',
    tier: 'GOLD',
    points: 1950,
    totalSpent: 5100,
    visitsCount: 14,
    lastVisit: '2026-08-12 18:30',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
    allergens: [],
    dietaryPreferences: ['sugar_free'],
    notes: [],
    favoriteDishes: [
      { nameAr: 'كيكة التمر بالكراميل المملح', nameEn: 'Warm Date Cake with Salted Caramel', orderCount: 11, lastOrdered: '2026-08-12' },
    ],
    orderHistory: [],
    vouchers: [],
  },
];

export class Customer360Service {
  private customers: CustomerDossier[] = [];

  constructor() {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) {
        try {
          this.customers = JSON.parse(saved);
          return;
        } catch {
          // fallback
        }
      }
    }
    this.customers = [...INITIAL_CUSTOMERS];
    this.persist();
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(this.customers));
    }
  }

  public getAllCustomers(searchTerm?: string): CustomerDossier[] {
    if (!searchTerm || !searchTerm.trim()) {
      return [...this.customers];
    }
    const q = searchTerm.toLowerCase().trim();
    return this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  public getCustomerById(id: string): CustomerDossier | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public getCustomerByPhone(phone: string): CustomerDossier | undefined {
    const clean = phone.replace(/\s+/g, '');
    return this.customers.find((c) => c.phone.replace(/\s+/g, '').includes(clean));
  }

  public addCustomer(data: Omit<CustomerDossier, 'id' | 'points' | 'totalSpent' | 'visitsCount' | 'orderHistory' | 'vouchers' | 'favoriteDishes'>): CustomerDossier {
    const newCustomer: CustomerDossier = {
      ...data,
      id: `cust_${Date.now()}`,
      points: 100, // 100 welcome bonus points
      totalSpent: 0,
      visitsCount: 0,
      lastVisit: new Date().toISOString().replace('T', ' ').slice(0, 16),
      orderHistory: [],
      vouchers: [],
      favoriteDishes: [],
    };

    this.customers.unshift(newCustomer);
    this.persist();
    return newCustomer;
  }

  public updateCustomer(id: string, data: Partial<CustomerDossier>): CustomerDossier | undefined {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    this.customers[idx] = { ...this.customers[idx], ...data };
    this.persist();
    return this.customers[idx];
  }

  public toggleAllergen(customerId: string, allergen: AllergenType): CustomerDossier | undefined {
    const cust = this.getCustomerById(customerId);
    if (!cust) return undefined;

    const exists = cust.allergens.includes(allergen);
    const updatedAllergens = exists
      ? cust.allergens.filter((a) => a !== allergen)
      : [...cust.allergens, allergen];

    return this.updateCustomer(customerId, { allergens: updatedAllergens });
  }

  public addCustomerNote(customerId: string, note: string): CustomerDossier | undefined {
    if (!note.trim()) return undefined;
    const cust = this.getCustomerById(customerId);
    if (!cust) return undefined;

    const updatedNotes = [...cust.notes, note.trim()];
    return this.updateCustomer(customerId, { notes: updatedNotes });
  }

  /**
   * Records a completed order in customer's 360 dossier and awards loyalty points.
   */
  public recordOrder(customerId: string, order: CustomerOrderSnippet): CustomerDossier | undefined {
    const cust = this.getCustomerById(customerId);
    if (!cust) return undefined;

    const earnedPoints = Math.floor(order.total / 10); // 1 point per 10 SAR spent
    const newPoints = cust.points + earnedPoints;
    const newTotalSpent = cust.totalSpent + order.total;
    const newVisits = cust.visitsCount + 1;

    // Automatic Tier Upgrades
    let newTier: CustomerTierType = cust.tier;
    if (newTotalSpent >= 10000 || newPoints >= 4000) {
      newTier = 'VIP_BLACK';
    } else if (newTotalSpent >= 5000 || newPoints >= 1800) {
      newTier = 'GOLD';
    } else if (newTotalSpent >= 2000 || newPoints >= 700) {
      newTier = 'SILVER';
    }

    // Update favorite dishes frequency
    const favorites = [...cust.favoriteDishes];
    order.items.forEach((item) => {
      const existing = favorites.find((f) => f.nameAr === item.nameAr);
      if (existing) {
        existing.orderCount += item.quantity;
        existing.lastOrdered = order.date.split(' ')[0];
      } else {
        favorites.push({
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          orderCount: item.quantity,
          lastOrdered: order.date.split(' ')[0],
        });
      }
    });

    favorites.sort((a, b) => b.orderCount - a.orderCount);

    const updated = this.updateCustomer(customerId, {
      points: newPoints,
      totalSpent: newTotalSpent,
      visitsCount: newVisits,
      lastVisit: order.date,
      tier: newTier,
      favoriteDishes: favorites.slice(0, 5),
      orderHistory: [order, ...cust.orderHistory],
    });

    eventBus.emit('LOYALTY_POINTS_EARNED', {
      customerId,
      pointsEarned: earnedPoints,
      newTotalPoints: newPoints,
    } as any);

    return updated;
  }

  /**
   * Redeem loyalty points for a digital voucher code.
   */
  public redeemPointsForVoucher(
    customerId: string,
    pointsToRedeem: number,
    discountPercent: number
  ): { success: boolean; voucher?: LoyaltyVoucher; error?: string } {
    const cust = this.getCustomerById(customerId);
    if (!cust) return { success: false, error: 'العميل غير موجود' };
    if (cust.points < pointsToRedeem) {
      return { success: false, error: `نقاط العميل (${cust.points}) غير كافية لخصم ${pointsToRedeem} نقطة` };
    }

    const voucherCode = `LOYALTY-${discountPercent}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 30); // 30 days validity

    const voucher: LoyaltyVoucher = {
      id: `vouch_${Date.now()}`,
      code: voucherCode,
      discountPercent,
      minSpend: discountPercent * 10,
      expiresAt: expiry.toISOString().split('T')[0],
      isUsed: false,
      issuedAt: now.toISOString().split('T')[0],
    };

    const newPoints = cust.points - pointsToRedeem;
    this.updateCustomer(customerId, {
      points: newPoints,
      vouchers: [voucher, ...cust.vouchers],
    });

    return { success: true, voucher };
  }

  /**
   * Reset all mock data for testing.
   */
  public resetForTesting(): void {
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.persist();
  }
}

export const customer360Service = new Customer360Service();
