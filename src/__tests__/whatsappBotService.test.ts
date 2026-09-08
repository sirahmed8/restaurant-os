import { describe, it, expect } from 'vitest';
import {
  whatsappBotService,
  RFM_SEGMENT_META,
  DEFAULT_MARKETING_CAMPAIGNS,
} from '../services/whatsappBotService';
import { CustomerRFMProfile, WhatsAppDigitalInvoiceData } from '../types/marketing';

describe('WhatsApp Marketing & RFM Bot Service', () => {
  describe('1. RFM Segmentation Engine', () => {
    it('should calculate RFM scores and assign valid segments', () => {
      const profiles = whatsappBotService.calculateRFMSegments();
      expect(profiles.length).toBeGreaterThan(0);

      profiles.forEach((profile) => {
        expect(profile.rScore).toBeGreaterThanOrEqual(1);
        expect(profile.rScore).toBeLessThanOrEqual(5);
        expect(profile.fScore).toBeGreaterThanOrEqual(1);
        expect(profile.fScore).toBeLessThanOrEqual(5);
        expect(profile.mScore).toBeGreaterThanOrEqual(1);
        expect(profile.mScore).toBeLessThanOrEqual(5);
        expect(profile.rfmScore).toMatch(/^[1-5]{3}$/);
        expect(RFM_SEGMENT_META[profile.segment]).toBeDefined();
        expect(profile.segmentNameAr).toBeTruthy();
        expect(profile.segmentNameEn).toBeTruthy();
      });
    });

    it('should classify high-spending frequent recent visitors as champions', () => {
      const profiles = whatsappBotService.calculateRFMSegments();
      const vip = profiles.find((p) => p.name.includes('عبد العزيز'));
      expect(vip).toBeDefined();
      expect(vip?.segment).toBe('champions');
      expect(vip?.rScore).toBe(5);
      expect(vip?.fScore).toBe(5);
      expect(vip?.mScore).toBe(5);
    });

    it('should classify long-inactive guests as at_risk or dormant', () => {
      const profiles = whatsappBotService.calculateRFMSegments();
      const dormant = profiles.find((p: any) => (p.recencyDays ?? p.daysSinceLastOrder ?? 0) > 60);
      expect(dormant).toBeDefined();
      expect(dormant?.segment).toBe('dormant');
      expect((dormant as any)?.rScore).toBe(1);
    });
  });

  describe('2. WhatsApp Campaign Template Interpolator', () => {
    const mockProfile: CustomerRFMProfile = {
      id: 'c-test',
      name: 'عبدالله السالم',
      phone: '+966501234567',
      tier: 'Gold',
      recencyDays: 2,
      frequency: 12,
      monetary: 3400,
      averageOrderValue: 283.3,
      rScore: 5,
      fScore: 4,
      mScore: 3,
      rfmScore: '543',
      segment: 'loyal',
      segmentNameAr: 'العملاء المخلصين',
      segmentNameEn: 'Loyal Customers',
      segmentColor: '#10B981',
      segmentBadgeBg: 'bg-emerald-500/20',
      lastOrderDate: new Date().toISOString(),
      favoriteDishAr: 'ستيك ريب آي واغيو',
      favoriteDishEn: 'Wagyu Ribeye Steak',
      loyaltyPoints: 340,
      marketingOptIn: true,
      whatsappActive: true,
      tags: ['VIP'],
      recommendedCampaignType: 'flash_deal',
      totalDiscountSavedSar: 120,
    };

    it('should correctly replace all dynamic template variables', () => {
      const template =
        'مرحباً {{customer_name}}! طبقك المفضل {{favorite_dish}} متاح بخصم مع كود {{discount_code}} ورصيدك {{points_balance}} نقطة في فئة {{tier}}.';
      const interpolated = whatsappBotService.interpolateTemplate(template, mockProfile, {
        discountCouponCode: 'TEST25',
      } as any);

      expect(interpolated).toContain('عبدالله السالم');
      expect(interpolated).toContain('ستيك ريب آي واغيو');
      expect(interpolated).toContain('TEST25');
      expect(interpolated).toContain('340');
      expect(interpolated).toContain('Gold');
      expect(interpolated).not.toContain('{{customer_name}}');
      expect(interpolated).not.toContain('{{favorite_dish}}');
    });

    it('should generate properly encoded WhatsApp deep link', () => {
      const deepLink = whatsappBotService.generateWhatsAppDeepLink(
        '+966 50 123 4567',
        'مرحبا، أود الاستفسار عن العرض'
      );
      expect(deepLink).toContain('https://api.whatsapp.com/send?phone=966501234567');
      expect(deepLink).toContain('text=');
    });
  });

  describe('3. Digital WhatsApp Invoice Formatter', () => {
    const sampleInvoice: WhatsAppDigitalInvoiceData = {
      orderId: 'ord-8899',
      orderNumber: 'ORD-8899',
      customerName: 'فيصل المطيري',
      customerPhone: '+966509988776',
      items: [
        { name: 'مشاوي مشكلة ملكية', quantity: 2, price: 120, total: 240 },
        { name: 'حمص بيروتي بالصنوبر', quantity: 1, price: 35, total: 35 },
      ],
      subtotal: 239.13,
      taxSar: 35.87,
      discountSar: 0,
      grandTotal: 275.0,
      paymentMethod: 'Apple Pay',
      branchName: 'فرع السليمانية — الرياض',
      tableNumber: 'T-05',
      orderType: 'محلي (طاولة)',
      orderDate: '2026-08-14 20:00',
      cashierName: 'أحمد الشريف',
    };

    it('should format a compliant ZATCA e-invoice text with breakdown', () => {
      const formatted = whatsappBotService.formatInvoiceForWhatsApp(sampleInvoice);

      expect(formatted).toContain('فاتورة ضريبية مبسطة');
      expect(formatted).toContain('ORD-8899');
      expect(formatted).toContain('فيصل المطيري');
      expect(formatted).toContain('مشاوي مشكلة ملكية');
      expect(formatted).toContain('275.00 ر.س');
      expect(formatted).toContain('Apple Pay');
      expect(formatted).toContain('ZATCA');
      expect(formatted).toContain('https://invoice.restaurantos.sa/v/ORD-8899');
    });
  });

  describe('4. Conversational Chatbot Engine', () => {
    const mockProfile: CustomerRFMProfile = {
      id: 'c-bot-test',
      name: 'نورة',
      phone: '+966551112233',
      tier: 'Black VIP',
      recencyDays: 1,
      frequency: 25,
      monetary: 8900,
      averageOrderValue: 356,
      rScore: 5,
      fScore: 5,
      mScore: 5,
      rfmScore: '555',
      segment: 'champions',
      segmentNameAr: 'الأبطال',
      segmentNameEn: 'Champions',
      segmentColor: '#F59E0B',
      segmentBadgeBg: 'bg-amber-500/20',
      lastOrderDate: new Date().toISOString(),
      favoriteDishAr: 'سلمون مشوي',
      favoriteDishEn: 'Grilled Salmon',
      loyaltyPoints: 890,
      marketingOptIn: true,
      whatsappActive: true,
      tags: ['VIP'],
      recommendedCampaignType: 'vip_reward',
      totalDiscountSavedSar: 500,
    };

    it('should trigger reservation flow when customer asks to book table', () => {
      const response = whatsappBotService.processCustomerBotMessage('أبي أحجز طاولة اليوم', mockProfile);
      expect(response.type).toBe('interactive_buttons');
      expect(response.replyText).toContain('حجز طاولتك المفضلة');
      expect(response.buttons).toBeDefined();
      expect(response.buttons?.length).toBeGreaterThan(0);
    });

    it('should return menu options when customer asks for menu', () => {
      const response = whatsappBotService.processCustomerBotMessage('ممكن المنيو', mockProfile);
      expect(response.replyText).toContain('قائمة طعام');
      expect(response.replyText).toContain('المشاوي الملكية');
      expect(response.buttons).toBeDefined();
    });

    it('should return points balance when customer queries loyalty wallet', () => {
      const response = whatsappBotService.processCustomerBotMessage('كم رصيد نقاطي؟', mockProfile);
      expect(response.replyText).toContain('محفظة الولاء');
      expect(response.replyText).toContain('890 نقطة');
      expect(response.replyText).toContain('Black VIP');
    });

    it('should return live order tracking status when customer asks where is my order', () => {
      const response = whatsappBotService.processCustomerBotMessage('وين طلبي؟', mockProfile);
      expect(response.replyText).toContain('حالة الطلب اللحظية');
      expect(response.replyText).toContain('الشيف');
    });

    it('should trigger discount coupon when customer requests promos', () => {
      const response = whatsappBotService.processCustomerBotMessage('عروض اليوم', mockProfile);
      expect(response.type).toBe('coupon');
      expect(response.couponData).toBeDefined();
      expect(response.couponData?.code).toBe('ROYAL25');
    });
  });

  describe('5. Campaign Broadcast Simulator & ROI Analytics', () => {
    it('should compute valid broadcast dispatch metrics and positive ROI', async () => {
      const campaign = DEFAULT_MARKETING_CAMPAIGNS[0];
      const profiles = whatsappBotService.calculateRFMSegments();

      const result = await whatsappBotService.dispatchCampaignSimulation(campaign, profiles);

      expect(result.sent).toBeGreaterThan(0);
      expect(result.delivered).toBeLessThanOrEqual(result.sent);
      expect(result.read).toBeLessThanOrEqual(result.delivered);
      expect(result.orders).toBeGreaterThan(0);
      expect(result.revenue).toBeGreaterThan(0);
      expect(result.roi).toBeGreaterThan(0);
    });
  });
});
