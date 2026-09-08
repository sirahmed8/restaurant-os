import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tableOrderService, TableOrderService } from '../services/tableOrderService';
import { eventBus } from '../services/eventBus';
import { db } from '../db';
import {
  MenuItem,
  GuestCartItem,
  TableCookingStage,
  WaiterCallType,
  TablePaymentMethod,
} from '../types/tablePortal';

describe('Tableside Guest Portal & Live Order Tracker Suite', () => {
  const sampleDishes: any[] = [
    {
      id: 'dish_1',
      categoryId: 'steaks',
      nameAr: 'ستيك ريب آي أنجوس فاخر',
      nameEn: 'Prime Angus Ribeye Steak',
      descriptionAr: 'قطعة لحم أنجوس معتقة مشوية على الفحم مع صوص الفلفل',
      descriptionEn: 'Dry aged angus beef grilled over charcoal with peppercorn sauce',
      price: 180,
      costPrice: 65,
      taxRate: 0.15,
      calories: 850,
      preparationTimeMinutes: 18,
      isAvailable: true,
      isFeatured: true,
      isRecommended: true,
      allergens: ['dairy'],
      kitchenStation: 'grill',
      sortOrder: 1,
      soldCount: 120,
    },
    {
      id: 'dish_2',
      categoryId: 'burgers',
      nameAr: 'برجر ترافل كلاسيك',
      nameEn: 'Classic Truffle Burger',
      descriptionAr: 'لحم أنجوس مع جبن الشيدر وزيت الكمأة',
      descriptionEn: 'Angus beef patty with melted cheddar and black truffle oil',
      price: 65,
      costPrice: 20,
      taxRate: 0.15,
      calories: 720,
      preparationTimeMinutes: 12,
      isAvailable: true,
      isFeatured: false,
      isRecommended: true,
      allergens: ['gluten', 'dairy'],
      kitchenStation: 'grill',
      sortOrder: 2,
      soldCount: 95,
    },
    {
      id: 'dish_3',
      categoryId: 'appetizers',
      nameAr: 'ديناميت شريمب مقرمش',
      nameEn: 'Crispy Dynamite Shrimp',
      descriptionAr: 'روبيان مقرمش مغطى بصلصة الديناميت الخاصة',
      descriptionEn: 'Crispy battered shrimp tossed in zesty dynamite sauce',
      price: 54,
      costPrice: 18,
      taxRate: 0.15,
      calories: 420,
      preparationTimeMinutes: 8,
      isAvailable: true,
      isFeatured: true,
      isRecommended: false,
      allergens: ['shellfish', 'eggs'],
      kitchenStation: 'fryer',
      sortOrder: 3,
      soldCount: 210,
    },
    {
      id: 'dish_4',
      categoryId: 'beverages',
      nameAr: 'موهيتو باشن فروت وريحان',
      nameEn: 'Passion Fruit Basil Mojito',
      descriptionAr: 'عصير منعش مع الليمون والنعناع والباشن فروت الطبيعي',
      descriptionEn: 'Refreshing passion fruit puree with lime, mint and club soda',
      price: 28,
      costPrice: 5,
      taxRate: 0.15,
      calories: 130,
      preparationTimeMinutes: 4,
      isAvailable: true,
      isFeatured: false,
      isRecommended: true,
      allergens: [],
      kitchenStation: 'beverages',
      sortOrder: 4,
      soldCount: 300,
    },
    {
      id: 'dish_5',
      categoryId: 'desserts',
      nameAr: 'كيكة التمر بالكراميل المملح',
      nameEn: 'Salted Caramel Date Cake',
      descriptionAr: 'كيكة تمر دافئة مع صوص كراميل وآيسكريم فانيلا',
      descriptionEn: 'Warm date cake with salted caramel sauce and vanilla gelato',
      price: 45,
      costPrice: 12,
      taxRate: 0.15,
      calories: 510,
      preparationTimeMinutes: 6,
      isAvailable: false, // Out of stock
      isFeatured: false,
      isRecommended: false,
      allergens: ['gluten', 'dairy', 'nuts'],
      kitchenStation: 'bakery',
      sortOrder: 5,
      soldCount: 80,
    },
  ];

  beforeEach(async () => {
    // Seed initial table if needed
    const existing = await db.getAll('tables');
    if (!existing.some((t) => t.tableNumber === 'T-04')) {
      await db.insert('tables', {
        id: 'tbl_t_04',
        tableNumber: 'T-04',
        sectionId: 'sec_vip',
        capacity: 4,
        shape: 'square',
        status: 'available',
        posX: 100,
        posY: 100,
        qrCodeToken: 'QR-T-04-A1B2C3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // 1. QR CODE SIMULATION & PARSING
  // =========================================================================
  describe('1. Table QR Code Generation & Validation Engine', () => {
    it('should generate valid QR code payload with signed token and direct table URL', () => {
      const qrPayload = tableOrderService.generateTableQr('T-04', 'tbl_t_04', 'الصالة الملكية VIP');

      expect(qrPayload).toBeDefined();
      expect(qrPayload.tableNumber).toBe('T-04');
      expect(qrPayload.sectionName).toBe('الصالة الملكية VIP');
      expect(qrPayload.qrCodeToken).toMatch(/^QR-T-04-/);
      expect(qrPayload.url).toContain('order.restaurant-os.cloud/table/T-04');
      expect(qrPayload.signature).toMatch(/^qr_sig_/);
      expect(qrPayload.branchName).toBe('فرع السليمانية — الرياض');
    });

    it('should accurately parse and validate URL strings containing table parameter and token', () => {
      const targetUrl = 'https://order.restaurant-os.cloud/table/T-08?token=QR-T-08-9F8E7D&sec=VIP';
      const parsed = tableOrderService.parseAndValidateQr(targetUrl);

      expect(parsed.valid).toBe(true);
      expect(parsed.tableNumber).toBe('T-08');
      expect(parsed.tableId).toBe('tbl_t_08');
      expect(parsed.token).toBe('QR-T-08-9F8E7D');
    });

    it('should parse direct token strings and plain table names gracefully', () => {
      const directToken = 'QR-T-03-FA12B3';
      const parsedToken = tableOrderService.parseAndValidateQr(directToken);

      expect(parsedToken.valid).toBe(true);
      expect(parsedToken.tableNumber).toBe('T-03');

      const plainName = 'Table 5';
      const parsedPlain = tableOrderService.parseAndValidateQr(plainName);

      expect(parsedPlain.valid).toBe(true);
      expect(parsedPlain.tableNumber).toBe('T-5');
    });

    it('should reject invalid or empty QR inputs with appropriate error message', () => {
      const emptyRes = tableOrderService.parseAndValidateQr('');
      expect(emptyRes.valid).toBe(false);
      expect(emptyRes.error).toBeDefined();
    });
  });

  // =========================================================================
  // 2. GUEST TABLE SESSIONS
  // =========================================================================
  describe('2. Guest Table Session Management', () => {
    it('should create a new guest session for an unoccupied table', async () => {
      const session = await tableOrderService.createOrGetGuestSession(
        'T-04',
        3,
        'فيصل القحطاني',
        '0559876543'
      );

      expect(session).toBeDefined();
      expect(session.tableNumber).toBe('T-04');
      expect(session.guestCount).toBe(3);
      expect(session.guestName).toBe('فيصل القحطاني');
      expect(session.status).toBe('browsing');
      expect(session.loyaltyTier).toBe('gold');
      expect(session.loyaltyPoints).toBeGreaterThan(0);
    });

    it('should return existing session when queried again for the same active table', async () => {
      const s1 = await tableOrderService.createOrGetGuestSession('T-04', 2, 'سارة العتيبي');
      const s2 = await tableOrderService.createOrGetGuestSession('T-04', 4);

      expect(s2.sessionId).toBe(s1.sessionId);
      expect(s2.guestName).toBe('سارة العتيبي');
      expect(s2.guestCount).toBe(4);
    });

    it('should end guest session cleanly upon completion', () => {
      const ended = tableOrderService.endSession('T-04');
      expect(ended).toBe(true);
      const sessionAfter = tableOrderService.getSession('T-04');
      expect(sessionAfter).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. ORDER PLACEMENT & DIRECT KDS ROUTING
  // =========================================================================
  describe('3. Order Placement & KDS Dispatch Pipeline', () => {
    it('should throw an error if placing an order with an empty cart', async () => {
      const session = await tableOrderService.createOrGetGuestSession('T-04');
      await expect(tableOrderService.placeGuestOrder(session, [])).rejects.toThrow();
    });

    it('should successfully place a multi-item guest order, save to DB, and emit Neural EventBus triggers', async () => {
      const orderPlacedSpy = vi.fn();
      const kdsTicketSpy = vi.fn();
      const tableStatusSpy = vi.fn();

      eventBus.on('TABLE_GUEST_ORDER_PLACED', orderPlacedSpy);
      eventBus.on('KDS_NEW_TICKET', kdsTicketSpy);
      eventBus.on('TABLE_STATUS_CHANGED', tableStatusSpy);

      const session = await tableOrderService.createOrGetGuestSession('T-04', 2, 'خالد المطيري');

      const cartItems: GuestCartItem[] = [
        {
          cartUniqueId: 'cart_1',
          dish: sampleDishes[0], // Ribeye 180 SAR
          quantity: 1,
          selectedModifiers: { doneness: 'Medium' },
          specialInstructions: 'بدون ملح زائد',
          unitPrice: 180,
          itemTotal: 180,
        },
        {
          cartUniqueId: 'cart_2',
          dish: sampleDishes[3], // Mojito 28 SAR
          quantity: 2,
          selectedModifiers: {},
          specialInstructions: 'زيادة ثلج',
          unitPrice: 28,
          itemTotal: 56,
        },
      ];

      const { order, progress } = await tableOrderService.placeGuestOrder(
        session,
        cartItems,
        'طاولة بجانب النافذة'
      );

      // Verify Order Calculations
      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^ORD-/);
      expect(order.tableId).toBe('T-04');
      expect(order.totalAmount).toBe(236); // 180 + 56 = 236
      expect(order.status).toBe('sent_to_kitchen');

      // Verify Database Persistence
      const dbOrder = await db.getById('orders', order.id);
      expect(dbOrder).toBeDefined();
      expect(dbOrder?.totalAmount).toBe(236);

      const dbItems = await db.query('orderItems', {
        where: (i) => i.orderId === order.id,
      });
      expect(dbItems.length).toBe(2);

      // Verify Initial Progress Tracker
      expect(progress.stage).toBe('received');
      expect(progress.stageIndex).toBe(0);
      expect(progress.estimatedTotalMinutes).toBeGreaterThanOrEqual(18); // ribeye prep time (18m) + margin
      expect(progress.items.length).toBe(2);

      // Verify EventBus Events
      expect(orderPlacedSpy).toHaveBeenCalled();
      expect(kdsTicketSpy).toHaveBeenCalled();
      expect(tableStatusSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. LIVE COOKING STAGE TRACKER
  // =========================================================================
  describe('4. Live Cooking Stage Tracker & Workflow Simulation', () => {
    it('should advance cooking stages in real-time and compute accurate progress percentages', async () => {
      const stageSpy = vi.fn();
      eventBus.on('TABLE_ORDER_STAGE_CHANGED', stageSpy);

      const session = await tableOrderService.createOrGetGuestSession('T-04');
      const { order } = await tableOrderService.placeGuestOrder(session, [
        {
          cartUniqueId: 'c1',
          dish: sampleDishes[1],
          quantity: 1,
          selectedModifiers: {},
          specialInstructions: '',
          unitPrice: 65,
          itemTotal: 65,
        },
      ]);

      // 1. Advance to 'preparing' (cooking)
      const p1 = await tableOrderService.advanceOrderStage(order.id, 'preparing');
      expect(p1?.stage).toBe('preparing');
      expect(p1?.stageIndex).toBe(1);
      expect(p1?.progressPercentage).toBe(45);
      expect(p1?.items[0].status).toBe('cooking');

      // 2. Advance to 'plating'
      const p2 = await tableOrderService.advanceOrderStage(order.id, 'plating');
      expect(p2?.stage).toBe('plating');
      expect(p2?.stageIndex).toBe(2);
      expect(p2?.progressPercentage).toBe(80);

      // 3. Advance to 'served'
      const p3 = await tableOrderService.advanceOrderStage(order.id, 'served');
      expect(p3?.stage).toBe('served');
      expect(p3?.stageIndex).toBe(3);
      expect(p3?.progressPercentage).toBe(100);
      expect(p3?.remainingMinutes).toBe(0);

      expect(stageSpy).toHaveBeenCalledTimes(4); // 1 initial on place + 3 advances
    });

    it('should simulate full automated kitchen workflow through timer progression', async () => {
      vi.useFakeTimers();

      const session = await tableOrderService.createOrGetGuestSession('T-04');
      const { order } = await tableOrderService.placeGuestOrder(session, [
        {
          cartUniqueId: 'c1',
          dish: sampleDishes[2],
          quantity: 1,
          selectedModifiers: {},
          specialInstructions: '',
          unitPrice: 54,
          itemTotal: 54,
        },
      ]);

      tableOrderService.simulateKitchenWorkflow(order.id, 1000);

      // Fast-forward 1s -> preparing
      await vi.advanceTimersByTimeAsync(1000);
      let prog = tableOrderService.getOrderProgress(order.id);
      expect(prog?.stage).toBe('preparing');

      // Fast-forward 1s -> plating
      await vi.advanceTimersByTimeAsync(1000);
      prog = tableOrderService.getOrderProgress(order.id);
      expect(prog?.stage).toBe('plating');

      // Fast-forward 1s -> served
      await vi.advanceTimersByTimeAsync(1000);
      prog = tableOrderService.getOrderProgress(order.id);
      expect(prog?.stage).toBe('served');

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // 5. WAITER CALLING & SERVICE BELL
  // =========================================================================
  describe('5. Tableside Waiter Calling Bell System', () => {
    it('should trigger waiter call bell notification and broadcast voice announcement', async () => {
      const callSpy = vi.fn();
      const voiceSpy = vi.fn();

      eventBus.on('TABLE_WAITER_CALLED', callSpy);
      eventBus.on('VOICE_ANNOUNCEMENT_TRIGGERED', voiceSpy);

      const req = await tableOrderService.callWaiter('T-04', 'water_refill', 'ماء بارد مع ليمون');

      expect(req).toBeDefined();
      expect(req.tableNumber).toBe('T-04');
      expect(req.callType).toBe('water_refill');
      expect(req.isResolved).toBe(false);

      expect(callSpy).toHaveBeenCalled();
      expect(voiceSpy).toHaveBeenCalled();

      const activeCall = tableOrderService.getActiveWaiterCall('T-04');
      expect(activeCall).toBeDefined();
      expect(activeCall?.callType).toBe('water_refill');
    });

    it('should resolve and dismiss an active waiter call bell', async () => {
      const resolveSpy = vi.fn();
      eventBus.on('TABLE_ASSISTANCE_RESOLVED', resolveSpy);

      await tableOrderService.callWaiter('T-04', 'clean_table');
      const resolved = await tableOrderService.resolveWaiterCall('T-04', 'محمد النادل');

      expect(resolved).toBe(true);
      expect(tableOrderService.getActiveWaiterCall('T-04')).toBeUndefined();
      expect(resolveSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. ELECTRONIC BILL, SPLIT-BILL & ZATCA QR
  // =========================================================================
  describe('6. Electronic Bill, Split Bill & ZATCA Phase 2 Settlement', () => {
    it('should compute electronic bill with tip and split-bill calculation', async () => {
      const session = await tableOrderService.createOrGetGuestSession('T-04');
      const { order } = await tableOrderService.placeGuestOrder(session, [
        {
          cartUniqueId: 'c1',
          dish: sampleDishes[0], // 180 SAR
          quantity: 1,
          selectedModifiers: {},
          specialInstructions: '',
          unitPrice: 180,
          itemTotal: 180,
        },
      ]);

      const bill = await tableOrderService.requestElectronicBill(
        order.id,
        'apple_pay',
        10, // 10% tip
        2   // 2 persons split
      );

      expect(bill).toBeDefined();
      expect(bill.orderId).toBe(order.id);
      expect(bill.tableNumber).toBe('T-04');
      expect(bill.grandTotal).toBe(198); // 180 + 18 (10% tip) = 198
      expect(bill.tipAmount).toBe(18);
      expect(bill.splitCount).toBe(2);
      expect(bill.amountPerPerson).toBe(99); // 198 / 2 = 99
      expect(bill.zatcaQrCode).toBeDefined();
      expect(bill.zatcaQrCode.length).toBeGreaterThan(20);
    });

    it('should settle table bill, mark order as paid, and update table to cleaning', async () => {
      const paidSpy = vi.fn();
      eventBus.on('ORDER_PAID', paidSpy);

      const session = await tableOrderService.createOrGetGuestSession('T-04');
      const { order } = await tableOrderService.placeGuestOrder(session, [
        {
          cartUniqueId: 'c1',
          dish: sampleDishes[1], // 65 SAR
          quantity: 1,
          selectedModifiers: {},
          specialInstructions: '',
          unitPrice: 65,
          itemTotal: 65,
        },
      ]);

      const settleRes = await tableOrderService.settleTableBill(order.id, 'mada_card', 5);

      expect(settleRes.success).toBe(true);
      expect(settleRes.zatcaInvoice.paidAmount).toBe(70); // 65 + 5

      // Check DB order update
      const dbOrder = await db.getById('orders', order.id);
      expect(dbOrder?.paymentStatus).toBe('paid');
      expect(dbOrder?.status).toBe('completed');

      // Check Table status updated to cleaning
      const tables = await db.getAll('tables');
      const tbl = tables.find((t) => t.tableNumber === 'T-04');
      expect(tbl?.status).toBe('cleaning');

      expect(paidSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 7. GUEST FEEDBACK & RATINGS
  // =========================================================================
  describe('7. Tableside Guest Rating & Review Submission', () => {
    it('should submit guest feedback and emit TABLE_GUEST_FEEDBACK_SUBMITTED', async () => {
      const feedbackSpy = vi.fn();
      eventBus.on('TABLE_GUEST_FEEDBACK_SUBMITTED', feedbackSpy);

      const success = await tableOrderService.submitGuestFeedback({
        tableNumber: 'T-04',
        orderId: 'ord_sample_99',
        rating: 5,
        tags: ['طهي استثنائي 🥩', 'سرعة خدمة ⚡'],
        comment: 'أفضل تجربة ستيك في الرياض!',
        submittedAt: new Date().toISOString(),
        customerName: 'سلطان الدوسري',
      });

      expect(success).toBe(true);
      expect(feedbackSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 8. MENU FILTERING & ALLERGEN SAFETY RADAR
  // =========================================================================
  describe('8. Digital Menu Allergen Radar & Calorie Filtering', () => {
    it('should exclude dishes containing specified allergens (e.g. dairy, shellfish)', () => {
      // Exclude dairy
      const noDairy = tableOrderService.filterMenu(sampleDishes, {
        allergensToExclude: ['dairy'],
        onlyAvailable: false,
      });

      expect(noDairy.some((d) => d.nameEn.includes('Ribeye'))).toBe(false); // contains dairy
      expect(noDairy.some((d) => d.nameEn.includes('Truffle Burger'))).toBe(false); // contains dairy
      expect(noDairy.some((d) => d.nameEn.includes('Dynamite Shrimp'))).toBe(true); // dairy-free
      expect(noDairy.some((d) => d.nameEn.includes('Mojito'))).toBe(true); // allergen-free

      // Exclude shellfish
      const noShellfish = tableOrderService.filterMenu(sampleDishes, {
        allergensToExclude: ['shellfish'],
        onlyAvailable: false,
      });
      expect(noShellfish.some((d) => d.nameEn.includes('Dynamite Shrimp'))).toBe(false);
    });

    it('should filter items within calorie threshold', () => {
      const lowCal = tableOrderService.filterMenu(sampleDishes, {
        maxCalories: 500,
        onlyAvailable: false,
      });

      expect(lowCal.every((d) => (d.calories || 0) <= 500)).toBe(true);
      expect(lowCal.some((d) => d.nameEn.includes('Mojito'))).toBe(true); // 130 cal
      expect(lowCal.some((d) => d.nameEn.includes('Dynamite Shrimp'))).toBe(true); // 420 cal
      expect(lowCal.some((d) => d.nameEn.includes('Ribeye'))).toBe(false); // 850 cal
    });

    it('should filter dishes by category and bilingual search query', () => {
      const burgersOnly = tableOrderService.filterMenu(sampleDishes, {
        category: 'burgers',
        onlyAvailable: false,
      });
      expect(burgersOnly.length).toBe(1);
      expect(burgersOnly[0].nameEn).toBe('Classic Truffle Burger');

      const arabicSearch = tableOrderService.filterMenu(sampleDishes, {
        searchQuery: 'موهيتو',
        onlyAvailable: false,
      });
      expect(arabicSearch.length).toBe(1);
      expect(arabicSearch[0].nameEn).toBe('Passion Fruit Basil Mojito');

      const englishSearch = tableOrderService.filterMenu(sampleDishes, {
        searchQuery: 'Ribeye',
        onlyAvailable: false,
      });
      expect(englishSearch.length).toBe(1);
      expect(englishSearch[0].nameAr).toBe('ستيك ريب آي أنجوس فاخر');
    });

    it('should sort dishes by price and prep time correctly', () => {
      const priceLowToHigh = tableOrderService.filterMenu(sampleDishes, {
        sortBy: 'price_low',
        onlyAvailable: false,
      });
      expect(priceLowToHigh[0].price).toBe(28); // Mojito
      expect(priceLowToHigh[priceLowToHigh.length - 1].price).toBe(180); // Ribeye

      const fastestPrep = tableOrderService.filterMenu(sampleDishes, {
        sortBy: 'fastest_prep',
        onlyAvailable: false,
      });
      expect(fastestPrep[0].preparationTimeMinutes).toBe(4); // Mojito
    });

    it('should filter out unavailable/out-of-stock dishes when onlyAvailable is true', () => {
      const availableOnly = tableOrderService.filterMenu(sampleDishes, {
        onlyAvailable: true,
      });
      expect(availableOnly.some((d) => d.nameEn.includes('Date Cake'))).toBe(false); // isAvailable = false
    });
  });
});
