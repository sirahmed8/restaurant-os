/**
 * =====================================================================
 * RESTAURANT OS — SMART ROUTING, COURSE PACING, STATION BOTTLENECK,
 * VISION PLATING & INTERACTIVE TOUR TEST SUITE
 * =====================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { smartRoutingService } from '../services/smartRoutingService';
import { eventBus } from '../services/eventBus';
import { voiceAnnouncerService } from '../services/voiceAnnouncerService';
import { TOUR_STEPS } from '../components/ui/InteractiveTourModal';
import { Order, OrderItem, MenuItem, KitchenStation } from '../db/schema';

describe('Smart Routing, Course Pacing, Vision AI & Interactive Tour Engine', () => {
  beforeEach(() => {
    eventBus.clearHistory();
    smartRoutingService.clearPlans();
  });

  // =========================================================================
  // 1. COURSE PACING & SYNCHRONIZED EXIT COOKING ALGORITHM
  // =========================================================================
  describe('1. Course Pacing & Cooking Synchronization (Course Pacing)', () => {
    const mockOrder: Order = {
      id: 'ord-steak-fries-101',
      orderNumber: 'ORD-20260814-101',
      dailySequence: 101,
      orderType: 'dine_in',
      status: 'sent_to_kitchen',
      paymentStatus: 'unpaid',
      subtotal: 420,
      taxAmount: 63,
      discountAmount: 0,
      serviceCharge: 0,
      tipAmount: 0,
      deliveryFee: 0,
      totalAmount: 483,
      paidAmount: 0,
      changeAmount: 0,
      guestCount: 2,
      syncStatus: 'synced',
      createdAt: '2026-08-14T19:00:00.000Z',
      updatedAt: '2026-08-14T19:00:00.000Z',
    };

    const mockItems: OrderItem[] = [
      {
        id: 'item-ribeye-steak',
        orderId: 'ord-steak-fries-101',
        menuItemId: 'menu-wagyu-ribeye',
        nameAr: 'ستيك واغيو ريب آي',
        nameEn: 'Wagyu Ribeye Steak (18 mins)',
        quantity: 1,
        unitPrice: 320,
        costPrice: 120,
        subtotal: 320,
        taxAmount: 48,
        discountAmount: 0,
        totalAmount: 368,
        selectedModifiers: [],
        kitchenStation: 'grill',
        status: 'pending',
        printedToKitchen: true,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
      {
        id: 'item-truffle-fries',
        orderId: 'ord-steak-fries-101',
        menuItemId: 'menu-truffle-fries',
        nameAr: 'بطاطس مقلية بالكمأة',
        nameEn: 'Crispy Truffle Fries (4 mins)',
        quantity: 1,
        unitPrice: 45,
        costPrice: 8,
        subtotal: 45,
        taxAmount: 6.75,
        discountAmount: 0,
        totalAmount: 51.75,
        selectedModifiers: [],
        kitchenStation: 'fryer',
        status: 'pending',
        printedToKitchen: true,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
      {
        id: 'item-burrata-salad',
        orderId: 'ord-steak-fries-101',
        menuItemId: 'menu-burrata-salad',
        nameAr: 'سلطة البوراتا والريحان',
        nameEn: 'Fresh Burrata Salad (4 mins)',
        quantity: 1,
        unitPrice: 55,
        costPrice: 16,
        subtotal: 55,
        taxAmount: 8.25,
        discountAmount: 0,
        totalAmount: 63.25,
        selectedModifiers: [],
        kitchenStation: 'salad_cold',
        status: 'pending',
        printedToKitchen: true,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
    ];

    const menuMap: Record<string, MenuItem> = {
      'menu-wagyu-ribeye': {
        id: 'menu-wagyu-ribeye',
        categoryId: 'cat-mains',
        nameAr: 'ستيك واغيو ريب آي',
        nameEn: 'Wagyu Ribeye Steak',
        descriptionAr: 'ستيك مشوي 18 دقيقة',
        descriptionEn: 'Grilled Wagyu 18m',
        price: 320,
        costPrice: 120,
        taxRate: 0.15,
        preparationTimeMinutes: 18,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'grill',
        sortOrder: 1,
        soldCount: 150,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
      'menu-truffle-fries': {
        id: 'menu-truffle-fries',
        categoryId: 'cat-sides',
        nameAr: 'بطاطس مقلية بالكمأة',
        nameEn: 'Truffle Fries',
        descriptionAr: 'بطاطس مقلية 4 دقائق',
        descriptionEn: 'Crispy Fries 4m',
        price: 45,
        costPrice: 8,
        taxRate: 0.15,
        preparationTimeMinutes: 4,
        isAvailable: true,
        isFeatured: false,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'fryer',
        sortOrder: 2,
        soldCount: 300,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
      'menu-burrata-salad': {
        id: 'menu-burrata-salad',
        categoryId: 'cat-starters',
        nameAr: 'سلطة البوراتا',
        nameEn: 'Burrata Salad',
        descriptionAr: 'سلطة طازجة 4 دقائق',
        descriptionEn: 'Fresh salad 4m',
        price: 55,
        costPrice: 16,
        taxRate: 0.15,
        preparationTimeMinutes: 4,
        isAvailable: true,
        isFeatured: false,
        isRecommended: true,
        allergens: ['dairy'],
        kitchenStation: 'salad_cold',
        sortOrder: 3,
        soldCount: 80,
        createdAt: '2026-08-14T19:00:00.000Z',
        updatedAt: '2026-08-14T19:00:00.000Z',
      },
    };

    it('should calculate accurate delayed fire time so steak (18m) and fries (4m) finish hot at the exact same moment', () => {
      const plan = smartRoutingService.calculateOrderPacingPlan(
        mockOrder,
        mockItems,
        menuMap,
        {
          startTime: new Date('2026-08-14T19:00:00.000Z'),
          syncAllCoursesTogether: true,
        }
      );

      expect(plan.orderId).toBe('ord-steak-fries-101');
      expect(plan.totalPrepMinutes).toBe(18);
      expect(plan.synchronizedExit).toBe(true);

      // Steak: 18m prep -> fired immediately at T=0 (19:00), ready at 19:18
      const steak = plan.items.find((i) => i.itemId === 'item-ribeye-steak')!;
      expect(steak).toBeDefined();
      expect(steak.prepTimeMinutes).toBe(18);
      expect(steak.delayMinutes).toBe(0);
      expect(steak.delaySeconds).toBe(0);
      expect(steak.scheduledFireAt).toBe('2026-08-14T19:00:00.000Z');
      expect(steak.targetReadyAt).toBe('2026-08-14T19:18:00.000Z');
      expect(steak.status).toBe('fired');

      // Truffle Fries: 4m prep -> delayed by 14m -> scheduled to fire at 19:14, ready at 19:18
      const fries = plan.items.find((i) => i.itemId === 'item-truffle-fries')!;
      expect(fries).toBeDefined();
      expect(fries.prepTimeMinutes).toBe(4);
      expect(fries.delayMinutes).toBe(14);
      expect(fries.delaySeconds).toBe(14 * 60);
      expect(fries.scheduledFireAt).toBe('2026-08-14T19:14:00.000Z');
      expect(fries.targetReadyAt).toBe('2026-08-14T19:18:00.000Z');
      expect(fries.status).toBe('held');

      // Both targetReadyAt must match identically down to the millisecond
      expect(steak.targetReadyAt).toBe(fries.targetReadyAt);
    });

    it('should fire scheduled items when current time matches scheduled fire time', () => {
      const plan = smartRoutingService.calculateOrderPacingPlan(
        mockOrder,
        mockItems,
        menuMap,
        {
          startTime: new Date('2026-08-14T19:00:00.000Z'),
          syncAllCoursesTogether: true,
        }
      );

      // At 19:05 (5 mins in), fries (scheduled for 19:14) should still be held
      const dueAt5m = smartRoutingService.getDueItemsToFire(plan, new Date('2026-08-14T19:05:00.000Z'));
      expect(dueAt5m).toHaveLength(0);

      // At 19:14 (14 mins in), fries should be due to fire
      const dueAt14m = smartRoutingService.getDueItemsToFire(plan, new Date('2026-08-14T19:14:00.000Z'));
      expect(dueAt14m.map((i) => i.itemId)).toContain('item-truffle-fries');
    });

    it('should emit COURSE_PACING_ITEM_FIRED event when firing item', async () => {
      const eventSpy = vi.fn();
      eventBus.on('COURSE_PACING_ITEM_FIRED', eventSpy);

      smartRoutingService.calculateOrderPacingPlan(
        mockOrder,
        mockItems,
        menuMap,
        {
          startTime: new Date('2026-08-14T19:00:00.000Z'),
          syncAllCoursesTogether: true,
        }
      );

      const fired = smartRoutingService.firePacedItem('ord-steak-fries-101', 'item-truffle-fries');
      expect(fired).toBeDefined();
      expect(fired?.status).toBe('fired');
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].payload.itemId).toBe('item-truffle-fries');
      expect(eventSpy.mock.calls[0][0].payload.orderId).toBe('ord-steak-fries-101');
    });

    it('should handle multi-course pacing with starter -> main sequencing', () => {
      const multiCoursePlan = smartRoutingService.calculateOrderPacingPlan(
        mockOrder,
        mockItems,
        menuMap,
        {
          startTime: new Date('2026-08-14T19:00:00.000Z'),
          courseGapMinutes: 10,
          syncAllCoursesTogether: false,
        }
      );

      expect(multiCoursePlan.courses.appetizer.length).toBeGreaterThan(0);
      expect(multiCoursePlan.courses.main.length).toBeGreaterThan(0);

      const starter = multiCoursePlan.courses.appetizer[0];
      const mainSteak = multiCoursePlan.courses.main.find((m) => m.itemId === 'item-ribeye-steak')!;

      // Starter ready at 19:04 (4 mins)
      expect(starter.targetReadyAt).toBe('2026-08-14T19:04:00.000Z');

      // Main course starts after starter (19:04 + 10m gap = 19:14), steak takes 18m -> ready at 19:32
      expect(mainSteak.targetReadyAt).toBe('2026-08-14T19:32:00.000Z');
    });
  });

  // =========================================================================
  // 2. STATION BOTTLENECK DETECTOR & INTERCOM / AUDIO ALERTS
  // =========================================================================
  describe('2. Station Bottleneck Detector & Automated Intercom Alerter', () => {
    it('should detect station bottleneck when wait time exceeds 20 minutes and emit urgent events', () => {
      const bottleneckOrder: Order = {
        id: 'ord-overdue-25m',
        orderNumber: 'ORD-OVERDUE-01',
        dailySequence: 1,
        orderType: 'dine_in',
        status: 'sent_to_kitchen',
        paymentStatus: 'unpaid',
        subtotal: 500,
        taxAmount: 75,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 575,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 4,
        syncStatus: 'synced',
        // Created 25 minutes ago
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      };

      const bottleneckItems: OrderItem[] = [
        {
          id: 'item-delayed-grill-1',
          orderId: 'ord-overdue-25m',
          menuItemId: 'menu-steak-1',
          nameAr: 'لحم تندرلوين فاخر',
          nameEn: 'Prime Tenderloin',
          quantity: 2,
          unitPrice: 250,
          costPrice: 90,
          subtotal: 500,
          taxAmount: 75,
          discountAmount: 0,
          totalAmount: 575,
          selectedModifiers: [],
          kitchenStation: 'grill',
          status: 'cooking',
          printedToKitchen: true,
          createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        },
      ];

      const bottleneckSpy = vi.fn();
      const audioSpy = vi.fn();
      eventBus.on('STATION_BOTTLENECK_DETECTED', bottleneckSpy);
      eventBus.on('KDS_AUDIO_ALERT', audioSpy);

      const report = smartRoutingService.analyzeStationLoads([bottleneckOrder], bottleneckItems);

      expect(report.bottleneckStations).toContain('grill');
      expect(report.stations.grill.isBottleneck).toBe(true);
      expect(report.stations.grill.status).toBe('critical');
      expect(report.stations.grill.maxItemWaitMinutes).toBeGreaterThanOrEqual(24);
      expect(report.alertsDispatched).toBeGreaterThanOrEqual(1);

      // Verify event emissions
      expect(bottleneckSpy).toHaveBeenCalledTimes(1);
      expect(bottleneckSpy.mock.calls[0][0].payload.station).toBe('grill');
      expect(bottleneckSpy.mock.calls[0][0].payload.severity).toBe('critical');
      expect(audioSpy).toHaveBeenCalledWith(expect.objectContaining({ payload: { soundType: 'urgent_alert' } }));
    });

    it('should suggest rerouting baked side dishes when fryer is bottlenecked', () => {
      const mockStationMetrics: any = {
        fryer: {
          station: 'fryer',
          isBottleneck: true,
          status: 'critical',
        },
        bakery: {
          station: 'bakery',
          isBottleneck: false,
          status: 'optimal',
        },
        main_kitchen: {
          station: 'main_kitchen',
          isBottleneck: false,
          status: 'optimal',
        },
      };

      const item: any = {
        id: 'item-fried-potato',
        nameAr: 'بطاطس ودجز بالفرن',
        nameEn: 'Baked Potato Wedges',
        kitchenStation: 'fryer',
      };

      const suggestion = smartRoutingService.suggestRerouting(item, 'fryer', mockStationMetrics);
      expect(suggestion.canReroute).toBe(true);
      expect(suggestion.suggestedStation).toBe('bakery');
      expect(suggestion.reasonAr).toContain('المخبوزات');
    });
  });

  // =========================================================================
  // 3. VISION AI PLATING & QUALITY VERIFICATION
  // =========================================================================
  describe('3. Vision AI Plating & Quality Verification', () => {
    it('should verify plating completeness and approve high quality dish', async () => {
      const verifiedSpy = vi.fn();
      eventBus.on('VISION_PLATING_VERIFIED', verifiedSpy);

      const result = await smartRoutingService.inspectPlatingViaVision({
        orderId: 'ord-vision-ok',
        orderNumber: 'ORD-VIS-01',
        expectedItems: [
          { name: 'ستيك واغيو مشوي', quantity: 1, station: 'grill', doneness: 'medium_rare' },
          { name: 'بطاطس مقلية بالكمأة', quantity: 1, station: 'fryer' },
        ],
      });

      expect(result.isApproved).toBe(true);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.9);
      expect(result.overallPresentationScore).toBeGreaterThanOrEqual(90);
      expect(result.missingItems).toHaveLength(0);
      expect(result.temperatureStatus).toBe('optimal');
      expect(result.donenessMatch).toBe(true);
      expect(verifiedSpy).toHaveBeenCalledTimes(1);
    });

    it('should detect missing dishes and emit defect alert', async () => {
      const defectSpy = vi.fn();
      eventBus.on('VISION_PLATING_DEFECT_DETECTED', defectSpy);

      const result = await smartRoutingService.inspectPlatingViaVision({
        orderId: 'ord-vision-missing',
        orderNumber: 'ORD-VIS-02',
        expectedItems: [
          { name: 'ستيك واغيو مشوي', quantity: 1, doneness: 'medium_rare' },
          { name: 'شوربة فطر بري', quantity: 1 },
        ],
        simulatedDefects: ['missing_dish'],
      });

      expect(result.isApproved).toBe(false);
      expect(result.missingItems).toContain('شوربة فطر بري');
      expect(result.recommendationAr).toContain('عناصر ناقصة');
      expect(defectSpy).toHaveBeenCalledTimes(1);
    });

    it('should detect cold temperature defect (<55°C)', async () => {
      const result = await smartRoutingService.inspectPlatingViaVision({
        orderId: 'ord-vision-cold',
        orderNumber: 'ORD-VIS-03',
        expectedItems: [
          { name: 'ستيك واغيو مشوي', quantity: 1 },
        ],
        simulatedDefects: ['cold_temperature'],
      });

      expect(result.isApproved).toBe(false);
      expect(result.temperatureStatus).toBe('cold_warning');
      expect(result.detectedItems[0].isDefective).toBe(true);
      expect(result.detectedItems[0].defectReason).toContain('درجة الحرارة منخفضة');
    });

    it('should detect incorrect steak doneness defect', async () => {
      const result = await smartRoutingService.inspectPlatingViaVision({
        orderId: 'ord-vision-doneness',
        orderNumber: 'ORD-VIS-04',
        expectedItems: [
          { name: 'ستيك واغيو مشوي', quantity: 1, doneness: 'medium_rare' },
        ],
        simulatedDefects: ['wrong_doneness'],
      });

      expect(result.isApproved).toBe(false);
      expect(result.donenessMatch).toBe(false);
      expect(result.detectedItems[0].isDefective).toBe(true);
    });
  });

  // =========================================================================
  // 4. INTERACTIVE TOUR MODAL & 16 MODULE CATALOG
  // =========================================================================
  describe('4. Interactive Tour Modal & 16 Enterprise Modules', () => {
    it('should define all 16 enterprise modules in the interactive tour catalog', () => {
      expect(TOUR_STEPS).toHaveLength(16);

      const moduleIds = TOUR_STEPS.map((s) => s.id);
      const expectedModules = [
        'pos',
        'floorplan',
        'kds',
        'delivery',
        'waiter',
        'kiosk',
        'online_store',
        'intercom',
        'inventory',
        'staff',
        'customers',
        'reports',
        'ai',
        'settings',
        'superadmin',
        'security',
      ];

      expectedModules.forEach((expectedId) => {
        expect(moduleIds).toContain(expectedId);
      });
    });

    it('should provide complete bilingual content, features, and role descriptions for every module', () => {
      TOUR_STEPS.forEach((step) => {
        expect(step.titleAr).toBeTruthy();
        expect(step.titleEn).toBeTruthy();
        expect(step.subtitleAr).toBeTruthy();
        expect(step.subtitleEn).toBeTruthy();
        expect(step.descriptionAr).toBeTruthy();
        expect(step.descriptionEn).toBeTruthy();
        expect(step.roleAr).toBeTruthy();
        expect(step.roleEn).toBeTruthy();
        expect(step.featuresAr.length).toBeGreaterThanOrEqual(3);
        expect(step.featuresEn.length).toBeGreaterThanOrEqual(3);
        expect(step.icon).toBeDefined();
        expect(step.gradient).toBeDefined();
        expect(step.badge).toBeDefined();
      });
    });
  });
});
