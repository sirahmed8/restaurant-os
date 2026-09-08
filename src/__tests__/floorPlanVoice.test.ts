import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VoiceAnnouncerService,
  voiceAnnouncerService,
  VOICE_STUDIO_PRESETS,
  DEFAULT_VOICE_CONFIG,
} from '../services/voiceAnnouncerService';
import { eventBus } from '../services/eventBus';
import { db } from '../db';
import {
  DiningTable,
  TableSection,
  Order,
  KitchenStation,
  TableStatus,
} from '../db/schema';
import { AggregatedDeliveryOrder } from '../types/delivery';

// ===================================================================
// MOCK SPEECH SYNTHESIS & AUDIO CONTEXT FOR HEADLESS TESTS
// ===================================================================

class MockSpeechSynthesisUtterance {
  public text: string;
  public lang: string = 'ar-SA';
  public volume: number = 1;
  public rate: number = 1;
  public pitch: number = 1;
  public voice: any = null;
  public onend: (() => void) | null = null;
  public onerror: ((e: any) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

class MockSpeechSynthesis {
  public speaking = false;
  public paused = false;
  public pending = false;
  public spokenUtterances: MockSpeechSynthesisUtterance[] = [];
  public cancelled = false;

  public speak(utterance: MockSpeechSynthesisUtterance) {
    this.spokenUtterances.push(utterance);
    this.speaking = true;
    setTimeout(() => {
      this.speaking = false;
      if (utterance.onend) utterance.onend();
    }, 10);
  }

  public cancel() {
    this.cancelled = true;
    this.speaking = false;
    this.spokenUtterances = [];
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    this.paused = false;
  }

  public getVoices() {
    return [
      { name: 'Maged (Arabic)', lang: 'ar-SA', voiceURI: 'ar_maged_voice', default: true },
      { name: 'Tarik (Arabic)', lang: 'ar-XA', voiceURI: 'ar_tarik_voice', default: false },
      { name: 'Samantha (English)', lang: 'en-US', voiceURI: 'en_samantha_voice', default: true },
      { name: 'Daniel (English UK)', lang: 'en-GB', voiceURI: 'en_daniel_voice', default: false },
    ];
  }
}

class MockAudioContext {
  public currentTime = 0;
  public state = 'running';
  public destination = {};

  public createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  public createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  public resume() {
    return Promise.resolve();
  }
}

describe('Voice Announcer & Floor Plan Engine Test Suite', () => {
  let announcer: VoiceAnnouncerService;
  let mockSynth: MockSpeechSynthesis;

  beforeEach(async () => {
    await db.init();
    await db.clearAll();
    eventBus.clearHistory();

    mockSynth = new MockSpeechSynthesis();
    (global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    (global as any).window = {
      speechSynthesis: mockSynth,
      AudioContext: MockAudioContext,
    };

    announcer = new VoiceAnnouncerService({
      enabled: true,
      volume: 0.9,
      rate: 1.0,
      pitch: 1.0,
      languageMode: 'ar',
      enableChime: true,
      chimeType: 'kitchen-bell',
      deduplicationWindowMs: 5000,
    });
  });

  afterEach(() => {
    announcer.stopAutoListening();
    announcer.cancel();
  });

  // ===================================================================
  // 1. VOICE ANNOUNCER — CORE QUEUE & PRIORITY ORCHESTRATION
  // ===================================================================
  describe('1. Voice Announcer — Queue, Priority & Deduplication', () => {
    it('should initialize with default configuration and presets correctly', () => {
      const config = announcer.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.languageMode).toBe('ar');
      expect(config.chimeType).toBe('kitchen-bell');
      expect(config.preset).toBe('professional');
    });

    it('should update configuration and apply studio presets cleanly', () => {
      announcer.applyPreset('energetic');
      let config = announcer.getConfig();
      expect(config.preset).toBe('energetic');
      expect(config.rate).toBe(1.15);
      expect(config.chimeType).toBe('ding-dong');

      announcer.applyPreset('calm');
      config = announcer.getConfig();
      expect(config.preset).toBe('calm');
      expect(config.rate).toBe(0.9);
      expect(config.chimeType).toBe('soft-chime');

      announcer.applyPreset('express');
      config = announcer.getConfig();
      expect(config.preset).toBe('express');
      expect(config.rate).toBe(1.25);
      expect(config.chimeType).toBe('double-high');
    });

    it('should prioritize urgent announcements to jump ahead of normal queue items', () => {
      // Pause queue processing to inspect internal ordering
      announcer.pause();

      announcer.enqueue({
        id: 'ann_normal_1',
        textAr: 'طلب عادي رقم 101',
        textEn: 'Normal order #101',
        priority: 'normal',
        category: 'order_ready',
        createdAt: Date.now(),
      });

      announcer.enqueue({
        id: 'ann_normal_2',
        textAr: 'طلب عادي رقم 102',
        textEn: 'Normal order #102',
        priority: 'normal',
        category: 'order_ready',
        createdAt: Date.now(),
      });

      announcer.enqueue({
        id: 'ann_high_1',
        textAr: 'طلب مهم رقم 201',
        textEn: 'High priority order #201',
        priority: 'high',
        category: 'order_ready',
        createdAt: Date.now(),
      });

      announcer.enqueue({
        id: 'ann_urgent_1',
        textAr: 'طلب عاجل جداً تأخر 25 دقيقة',
        textEn: 'Urgent delayed ticket',
        priority: 'urgent',
        category: 'delayed',
        createdAt: Date.now(),
      });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(4);
      // Urgent item should be at the very front (index 0)
      expect(queue[0].id).toBe('ann_urgent_1');
      // High priority should be placed before normal items
      expect(queue[1].id).toBe('ann_high_1');
      // Normal items should follow in FIFO order
      expect(queue[2].id).toBe('ann_normal_1');
      expect(queue[3].id).toBe('ann_normal_2');
    });

    it('should deduplicate and prevent duplicate announcements within the cooldown window', () => {
      announcer.pause();

      const itemParams = {
        orderNumber: 'ORD-99',
        tableNumber: '4',
      };

      const firstQueued = announcer.announceOrderReady(itemParams);
      expect(firstQueued).toBe(true);

      // Attempting to enqueue the exact same alert immediately
      const duplicateQueued = announcer.announceOrderReady(itemParams);
      expect(duplicateQueued).toBe(false);

      expect(announcer.getQueue()).toHaveLength(1);

      // Clear cache and test that it accepts again
      announcer.clearDeduplicationCache();
      const retryQueued = announcer.announceOrderReady(itemParams);
      expect(retryQueued).toBe(true);
      expect(announcer.getQueue()).toHaveLength(2);
    });

    it('should respect station filtering and only enqueue alerts for subscribed stations', () => {
      announcer.pause();
      announcer.setSubscribedStations(['grill']);

      // Grill station alert -> should be enqueued
      const grillResult = announcer.announceItemReady({
        itemName: 'برجر أنجوس دبل',
        itemNameEn: 'Double Angus Burger',
        orderNumber: '501',
        station: 'grill',
      });
      expect(grillResult).toBe(true);

      // Beverages station alert -> should be ignored
      const beverageResult = announcer.announceItemReady({
        itemName: 'عصير برتقال طازج',
        itemNameEn: 'Fresh Orange Juice',
        orderNumber: '502',
        station: 'beverages',
      });
      expect(beverageResult).toBe(false);

      // All station alert (or unspecified) -> should be enqueued
      const deliveryResult = announcer.announceDeliveryOrder({
        platform: 'hungerstation',
        orderNumber: 'HG-1234',
      });
      expect(deliveryResult).toBe(true);

      expect(announcer.getQueue()).toHaveLength(2);
    });

    it('should properly resolve text according to language modes (Arabic, English, Bilingual)', () => {
      const item = {
        id: 'test_1',
        textAr: 'طاولة 5 جاهزة للتسليم',
        textEn: 'Table 5 ready for delivery',
        priority: 'normal' as const,
        category: 'order_ready' as const,
        createdAt: Date.now(),
      };

      expect(announcer.resolveText(item, 'ar')).toBe('طاولة 5 جاهزة للتسليم');
      expect(announcer.resolveText(item, 'en')).toBe('Table 5 ready for delivery');
      expect(announcer.resolveText(item, 'bilingual')).toBe(
        'طاولة 5 جاهزة للتسليم. Table 5 ready for delivery.'
      );
    });
  });

  // ===================================================================
  // 2. VOICE ANNOUNCER — DOMAIN SPOKEN ALERTS & TEMPLATES
  // ===================================================================
  describe('2. Voice Announcer — Domain Spoken Alerts & Message Formatting', () => {
    it('should format order ready alerts correctly for dine-in, takeaway, and customer pickup', () => {
      announcer.pause();

      // Dine-in with table
      announcer.announceOrderReady({
        orderNumber: '101',
        tableNumber: '7',
      });

      // Takeaway
      announcer.announceOrderReady({
        orderNumber: '102',
        orderType: 'takeaway',
      });

      // Customer name
      announcer.announceOrderReady({
        orderNumber: '103',
        customerName: 'سلطان القحطاني',
      });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(3);

      expect(queue[0].textAr).toContain('طاولة 7');
      expect(queue[0].textAr).toContain('الطلب رقم 101 جاهز للتسليم');
      expect(queue[0].textEn).toContain('Table 7, Order #101 is ready for delivery');

      expect(queue[1].textAr).toContain('طلب سفري رقم 102 جاهز للاستلام');
      expect(queue[1].textEn).toContain('Takeaway Order #102 is ready for pickup');

      expect(queue[2].textAr).toContain('سلطان القحطاني');
      expect(queue[2].textEn).toContain('for سلطان القحطاني is ready');
    });

    it('should format station item ready alerts with Arabic & English station names', () => {
      announcer.pause();

      announcer.announceItemReady({
        itemName: 'ستيك ريب آي مع صوص المشروم',
        itemNameEn: 'Ribeye Steak with Mushroom Sauce',
        tableNumber: '12',
        orderNumber: '304',
        station: 'grill',
        quantity: 2,
      });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].textAr).toContain('محطة الشواء');
      expect(queue[0].textAr).toContain('2 ستيك ريب آي');
      expect(queue[0].textAr).toContain('لطاولة 12 جاهز');
      expect(queue[0].textEn).toContain('Grill Station');
      expect(queue[0].textEn).toContain('2 Ribeye Steak with Mushroom Sauce');
    });

    it('should format third-party delivery orders with localized platform names and ding-dong chime', () => {
      announcer.pause();

      announcer.announceDeliveryOrder({
        platform: 'hungerstation',
        orderNumber: 'ORD-HUNGER-881',
        shortCode: 'HG-881',
      });

      announcer.announceDeliveryOrder({
        platform: 'jahez',
        orderNumber: 'ORD-JAH-220',
        shortCode: 'JH-220',
      });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(2);

      expect(queue[0].textAr).toContain('طلب جديد من هنقرستيشن رقم HG-881');
      expect(queue[0].textEn).toContain('New order received from Hungerstation, Order #HG-881');
      expect(queue[0].chimeOverride).toBe('ding-dong');

      expect(queue[1].textAr).toContain('طلب جديد من جاهز رقم JH-220');
      expect(queue[1].textEn).toContain('New order received from Jahez, Order #JH-220');
    });

    it('should format delayed kitchen tickets with elapsed minutes and urgent alert chime', () => {
      announcer.pause();

      announcer.announceUrgentTicket({
        orderNumber: '994',
        tableNumber: '3',
        elapsedMinutes: 22,
        station: 'grill',
      });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].priority).toBe('urgent');
      expect(queue[0].chimeOverride).toBe('alert');
      expect(queue[0].textAr).toContain('تنبيه عاجل: طاولة 3 تأخرت 22 دقيقة');
      expect(queue[0].textEn).toContain('Urgent Alert: Table 3 is delayed by 22 minutes');
    });

    it('should format table reservations and table status changes accurately', () => {
      announcer.pause();

      // Reservation
      announcer.announceTableReserved({
        tableNumber: '9',
        customerName: 'د. خالد الحربي',
        guestCount: 6,
      });

      // Status updates
      announcer.announceTableStatus({ tableNumber: '9', status: 'billing' });
      announcer.announceTableStatus({ tableNumber: '4', status: 'cleaning' });
      announcer.announceTableStatus({ tableNumber: '4', status: 'available' });

      const queue = announcer.getQueue();
      expect(queue).toHaveLength(4);

      expect(queue[0].textAr).toContain('حجز جديد: طاولة 9 باسم د. خالد الحربي لعدد 6 ضيوف');
      expect(queue[1].textAr).toContain('طاولة 9 تطلب الحساب');
      expect(queue[2].textAr).toContain('طاولة 4 بحاجة إلى تنظيف وتجهيز');
      expect(queue[3].textAr).toContain('طاولة 4 شاغرة وجاهزة للاستقبال');
    });
  });

  // ===================================================================
  // 3. VOICE ANNOUNCER — AUDIO CHIMES & WEB SPEECH SYNTHESIS EXECUTION
  // ===================================================================
  describe('3. Voice Announcer — Audio Chimes & Web Speech Synthesis Execution', () => {
    it('should trigger speech synthesis and emit voice events upon execution', async () => {
      let triggeredEvent: any = null;
      let completedEvent: any = null;

      eventBus.on('VOICE_ANNOUNCEMENT_TRIGGERED', (e) => {
        triggeredEvent = e.payload;
      });

      eventBus.on('VOICE_ANNOUNCEMENT_COMPLETED', (e) => {
        completedEvent = e.payload;
      });

      announcer.announceCustom({
        textAr: 'الطلب جاهز للاستلام الفوري',
        textEn: 'Order is ready for immediate pickup',
        priority: 'high',
      });

      // Wait briefly for execution in mock environment
      await new Promise((res) => setTimeout(res, 300));

      expect(triggeredEvent).not.toBeNull();
      expect(triggeredEvent.text).toContain('الطلب جاهز للاستلام الفوري');
      expect(mockSynth.spokenUtterances.length).toBeGreaterThan(0);
      expect(completedEvent).not.toBeNull();
    });

    it('should support pausing, resuming, and cancelling speech queue cleanly', () => {
      announcer.pause();
      announcer.announceCustom({ textAr: 'رسالة تجريبية 1' });
      announcer.announceCustom({ textAr: 'رسالة تجريبية 2' });

      expect(announcer.getQueueStatus().length).toBe(2);
      expect(announcer.getQueueStatus().isPaused).toBe(true);

      announcer.cancel();
      expect(announcer.getQueueStatus().length).toBe(0);
      expect(mockSynth.cancelled).toBe(true);
    });

    it('should list available synthesized voices filtered by language', () => {
      const voices = announcer.getAvailableVoices();
      expect(voices.all.length).toBe(4);
      expect(voices.arabic.length).toBe(2);
      expect(voices.english.length).toBe(2);
      expect(voices.arabic[0].lang).toBe('ar-SA');
      expect(voices.english[0].lang).toBe('en-US');
    });
  });

  // ===================================================================
  // 4. REACTIVE EVENTBUS INTEGRATION
  // ===================================================================
  describe('4. Reactive EventBus Auto-Listening', () => {
    it('should automatically announce when KDS and Floor Plan events are published', async () => {
      announcer.pause(); // Pause to inspect queued items without draining
      announcer.startAutoListening();

      // 1. KDS Item Ready event
      await eventBus.publish(
        'KDS_ITEM_READY',
        {
          itemId: 'item_101',
          orderId: 'ORD-771',
          itemName: 'شاورما لحم عربي',
        },
        'kds'
      );

      // 2. Third-party Delivery event
      const mockDeliveryOrder: AggregatedDeliveryOrder = {
        id: 'del_9901',
        orderId: 'ORD-TAL-881',
        dailySequence: 1,
        platform: 'talabat',
        platformOrderCode: 'TAL-881',
        status: 'incoming',
        customer: {
          name: 'عبدالله السبيعي',
          phone: '+966551234567',
          address: 'الرياض — حي النخيل',
        },
        items: [],
        subtotal: 120,
        taxAmount: 18,
        deliveryFee: 15,
        discountAmount: 0,
        totalAmount: 153,
        paymentMethod: 'prepaid_online',
        isPaid: true,
        receivedAt: new Date().toISOString(),
        estimatedPrepMinutes: 15,
        estimatedDeliveryMinutes: 25,
        autoAccepted: true,
        timeline: [],
      };

      await eventBus.publish(
        'DELIVERY_ORDER_RECEIVED',
        {
          deliveryOrder: mockDeliveryOrder,
          order: {} as any,
          items: [],
        },
        'delivery'
      );

      // 3. Table Reserved event
      await eventBus.publish(
        'TABLE_RESERVED',
        {
          tableId: 'tbl_8',
          tableNumber: '8',
          customerName: 'فهد العتيبي',
          guestCount: 5,
          reservationTime: '2026-08-14T20:00:00Z',
        },
        'pos'
      );

      // 4. Delayed ticket alert event
      await eventBus.publish(
        'KDS_TICKET_DELAYED',
        {
          orderId: 'ord_delayed_1',
          orderNumber: 'ORD-440',
          tableNumber: '2',
          elapsedMinutes: 24,
          station: 'grill',
        },
        'kds'
      );

      const queue = announcer.getQueue();
      expect(queue.length).toBeGreaterThanOrEqual(4);

      // Verify delivery order was received and parsed
      const deliveryAnnouncement = queue.find((q) => q.category === 'delivery');
      expect(deliveryAnnouncement).toBeDefined();
      expect(deliveryAnnouncement?.textAr).toContain('طلبات');
      expect(deliveryAnnouncement?.textAr).toContain('TAL-881');

      // Verify table reservation was received
      const resAnnouncement = queue.find((q) => q.category === 'reservation');
      expect(resAnnouncement).toBeDefined();
      expect(resAnnouncement?.textAr).toContain('فهد العتيبي');

      // Verify delayed ticket was received
      const delayAnnouncement = queue.find((q) => q.category === 'delayed');
      expect(delayAnnouncement).toBeDefined();
      expect(delayAnnouncement?.textAr).toContain('24 دقيقة');
    });
  });

  // ===================================================================
  // 5. FLOOR PLAN & TABLE MANAGEMENT ENGINE
  // ===================================================================
  describe('5. Floor Plan & Table Management Engine', () => {
    beforeEach(async () => {
      // Seed Sections
      const mainHall: TableSection = {
        id: 'sec_main',
        nameAr: 'الصالة الرئيسية',
        nameEn: 'Main Dining Hall',
        floor: 1,
        isActive: true,
        sortOrder: 1,
        color: '#f59e0b',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const terrace: TableSection = {
        id: 'sec_terrace',
        nameAr: 'التراس الخارجي',
        nameEn: 'Outdoor Terrace',
        floor: 1,
        isActive: true,
        sortOrder: 2,
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vipSection: TableSection = {
        id: 'sec_vip',
        nameAr: 'جناح كبار الشخصيات VIP',
        nameEn: 'VIP Royal Suite',
        floor: 2,
        isActive: true,
        sortOrder: 3,
        color: '#8b5cf6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert('sections', mainHall);
      await db.insert('sections', terrace);
      await db.insert('sections', vipSection);

      // Seed Dining Tables
      const tables: DiningTable[] = [
        {
          id: 'tbl_1',
          tableNumber: '1',
          sectionId: 'sec_main',
          capacity: 4,
          shape: 'square',
          status: 'available',
          posX: 100,
          posY: 150,
          width: 80,
          height: 80,
          qrCodeToken: 'qr_tbl_1_token',
          minSpend: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'tbl_2',
          tableNumber: '2',
          sectionId: 'sec_main',
          capacity: 6,
          shape: 'rectangle',
          status: 'available',
          posX: 220,
          posY: 150,
          width: 120,
          height: 80,
          qrCodeToken: 'qr_tbl_2_token',
          minSpend: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'tbl_vip_1',
          tableNumber: 'VIP-1',
          sectionId: 'sec_vip',
          capacity: 10,
          shape: 'round',
          status: 'available',
          posX: 150,
          posY: 100,
          width: 140,
          height: 140,
          qrCodeToken: 'qr_tbl_vip1_token',
          minSpend: 500, // VIP Minimum Spend rule
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const t of tables) {
        await db.insert('tables', t);
      }
    });

    it('should manage table sections with floor levels and sort orders', async () => {
      const sections = await db.getAll('sections');
      expect(sections).toHaveLength(3);

      const firstFloorSections = sections.filter((s) => s.floor === 1);
      const secondFloorSections = sections.filter((s) => s.floor === 2);

      expect(firstFloorSections).toHaveLength(2);
      expect(secondFloorSections).toHaveLength(1);
      expect(secondFloorSections[0].nameAr).toBe('جناح كبار الشخصيات VIP');
    });

    it('should track 2D floor plan table coordinates, dimensions and shapes', async () => {
      const table1 = await db.getById('tables', 'tbl_1');
      expect(table1).not.toBeNull();
      expect(table1?.shape).toBe('square');
      expect(table1?.posX).toBe(100);
      expect(table1?.posY).toBe(150);

      // Update position on floor plan editor drag & drop
      const updated = await db.update('tables', 'tbl_1', {
        posX: 180,
        posY: 240,
      });

      expect(updated?.posX).toBe(180);
      expect(updated?.posY).toBe(240);
    });

    it('should handle full table status lifecycle (available -> occupied -> billing -> cleaning -> available)', async () => {
      // 1. Initial State: Available
      let table = await db.getById('tables', 'tbl_1');
      expect(table?.status).toBe('available');

      // 2. Seated & Occupied with an active order
      const mockOrder: Order = {
        id: 'ord_dine_101',
        orderNumber: 'ORD-20260814-101',
        dailySequence: 1,
        orderType: 'dine_in',
        tableId: '1',
        status: 'preparing',
        paymentStatus: 'unpaid',
        subtotal: 180,
        taxAmount: 27,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 207,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 3,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('orders', mockOrder);

      await db.update('tables', 'tbl_1', {
        status: 'occupied',
        currentOrderId: 'ord_dine_101',
        lastOccupiedAt: new Date().toISOString(),
      });

      table = await db.getById('tables', 'tbl_1');
      expect(table?.status).toBe('occupied');
      expect(table?.currentOrderId).toBe('ord_dine_101');

      // 3. Guest requests bill -> billing
      await db.update('tables', 'tbl_1', { status: 'billing' });
      table = await db.getById('tables', 'tbl_1');
      expect(table?.status).toBe('billing');

      // 4. Payment settled -> cleaning
      await db.update('tables', 'tbl_1', {
        status: 'cleaning',
        currentOrderId: undefined,
      });
      table = await db.getById('tables', 'tbl_1');
      expect(table?.status).toBe('cleaning');
      expect(table?.currentOrderId).toBeUndefined();

      // 5. Table sanitized -> available
      await db.update('tables', 'tbl_1', { status: 'available' });
      table = await db.getById('tables', 'tbl_1');
      expect(table?.status).toBe('available');
    });

    it('should transfer an active table order seamlessly to a destination table', async () => {
      // Seed an order on Table 1
      const order: Order = {
        id: 'ord_transfer_test',
        orderNumber: 'ORD-TR-01',
        dailySequence: 5,
        orderType: 'dine_in',
        tableId: '1',
        status: 'preparing',
        paymentStatus: 'unpaid',
        subtotal: 250,
        taxAmount: 37.5,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 287.5,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 4,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('orders', order);

      await db.update('tables', 'tbl_1', {
        status: 'occupied',
        currentOrderId: order.id,
      });

      // Transfer from Table 1 to Table 2
      const fromTable = await db.getById('tables', 'tbl_1');
      const toTable = await db.getById('tables', 'tbl_2');

      expect(fromTable?.currentOrderId).toBe(order.id);
      expect(toTable?.status).toBe('available');

      // Execute transfer logic
      await db.update('orders', order.id, { tableId: toTable!.tableNumber });
      await db.update('tables', toTable!.id, {
        status: 'occupied',
        currentOrderId: order.id,
        lastOccupiedAt: new Date().toISOString(),
      });
      await db.update('tables', fromTable!.id, {
        status: 'cleaning',
        currentOrderId: undefined,
      });

      // Verify Table 2 now has the order
      const updatedToTable = await db.getById('tables', 'tbl_2');
      expect(updatedToTable?.status).toBe('occupied');
      expect(updatedToTable?.currentOrderId).toBe(order.id);

      // Verify Table 1 is marked for cleaning
      const updatedFromTable = await db.getById('tables', 'tbl_1');
      expect(updatedFromTable?.status).toBe('cleaning');
      expect(updatedFromTable?.currentOrderId).toBeUndefined();

      // Verify Order record table reference was updated
      const updatedOrder = await db.getById('orders', order.id);
      expect(updatedOrder?.tableId).toBe('2');
    });

    it('should merge two tables together for large gathering parties', async () => {
      // Table 1 has an active order
      const order: Order = {
        id: 'ord_large_party',
        orderNumber: 'ORD-PARTY-99',
        dailySequence: 10,
        orderType: 'dine_in',
        tableId: '1',
        status: 'preparing',
        paymentStatus: 'unpaid',
        subtotal: 900,
        taxAmount: 135,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 1035,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 9,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('orders', order);

      await db.update('tables', 'tbl_1', {
        status: 'occupied',
        currentOrderId: order.id,
      });

      // Merge Table 2 into Table 1
      await db.update('tables', 'tbl_2', {
        status: 'occupied',
        currentOrderId: order.id,
      });

      const tbl1 = await db.getById('tables', 'tbl_1');
      const tbl2 = await db.getById('tables', 'tbl_2');

      expect(tbl1?.status).toBe('occupied');
      expect(tbl2?.status).toBe('occupied');
      expect(tbl1?.currentOrderId).toBe('ord_large_party');
      expect(tbl2?.currentOrderId).toBe('ord_large_party');

      const combinedCapacity = (tbl1?.capacity || 0) + (tbl2?.capacity || 0);
      expect(combinedCapacity).toBe(10); // 4 + 6 = 10 capacity
      expect(combinedCapacity).toBeGreaterThanOrEqual(order.guestCount);
    });

    it('should validate VIP table minimum spend and guest requirements', async () => {
      const vipTable = await db.getById('tables', 'tbl_vip_1');
      expect(vipTable).not.toBeNull();
      expect(vipTable?.minSpend).toBe(500);
      expect(vipTable?.capacity).toBe(10);

      const isValidReservation = (guests: number, estimatedSpend: number) => {
        if (guests > (vipTable?.capacity || 0)) return { valid: false, reason: 'capacity_exceeded' };
        if (estimatedSpend < (vipTable?.minSpend || 0)) return { valid: false, reason: 'min_spend_not_met' };
        return { valid: true };
      };

      // Under minimum spend
      const test1 = isValidReservation(4, 350);
      expect(test1.valid).toBe(false);
      expect(test1.reason).toBe('min_spend_not_met');

      // Exceeds table capacity
      const test2 = isValidReservation(14, 1200);
      expect(test2.valid).toBe(false);
      expect(test2.reason).toBe('capacity_exceeded');

      // Valid VIP reservation
      const test3 = isValidReservation(8, 750);
      expect(test3.valid).toBe(true);
    });
  });
});
