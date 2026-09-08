/**
 * =====================================================================
 * RESTAURANT OS — MARKETING & WHATSAPP CAMPAIGN ENGINE
 * =====================================================================
 * Handles:
 * - RFM Customer Segmentation (VIP, Loyal, At-Risk, Inactive, New)
 * - WhatsApp Automated Campaign Builder & Dynamic Tag Renderer
 * - Recipe-Linked VIP Promotions & Signature Dish Upsells
 * - Campaign Conversion, Delivery, Read Rates & ROI Simulation
 */

import {
  CustomerSegmentType,
  CustomerTarget,
  WhatsAppTemplate,
  WhatsAppCampaign,
  SegmentStats,
  MarketingCampaignPerformance,
} from '../types/marketing';

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-vip-exclusive',
    nameAr: 'دعوة VIP حصرية لتجربة صنف الشيف الجديد',
    nameEn: 'VIP Exclusive Invitation for Chef Signature Dish',
    category: 'vip_invite',
    contentAr: 'مساء الخير يا {name} 🌟، تقديراً لكونك من عملائنا الـ {tier} في {restaurant_name}، يسر شيف المطعم دعوتك لتجربة طبقك المفضل {favorite_dish} مع ضيافة مجانية وكود خصم خاص {discount_code} بقيمة 20%! نتشرف بزيارتك 🥂.',
    contentEn: 'Good evening {name} 🌟, as one of our esteemed {tier} guests at {restaurant_name}, our Executive Chef invites you to enjoy your favorite {favorite_dish} with complimentary dessert and VIP code {discount_code} for 20% off! 🥂',
    variables: ['name', 'tier', 'restaurant_name', 'favorite_dish', 'discount_code'],
    samplePreviewAr: 'مساء الخير يا سلطان المقرن 🌟، تقديراً لكونك من عملائنا الـ Black VIP في نظام المطاعم الفاخر، يسر شيف المطعم دعوتك لتجربة طبقك المفضل ستيك ريب آي واغيو A5 مع ضيافة مجانية وكود خصم خاص VIP20 بقيمة 20%! نتشرف بزيارتك 🥂.',
  },
  {
    id: 'tpl-re-engage-miss-you',
    nameAr: 'حملة استعادة العملاء المنقطعين (اشتقنا لك)',
    nameEn: 'We Miss You — Win-Back Campaign',
    category: 're_engagement',
    contentAr: 'أهلاً {name} ✨، اشتقنا لزيارتك في {restaurant_name}! لديك رصيد نقاط {points_balance} نقطة ينتظرك، واستخدم الرمز {discount_code} للحصول على خصم 15% على طلبك القادم local أو delivery 🍽️.',
    contentEn: 'Hello {name} ✨, we miss you at {restaurant_name}! You have {points_balance} loyalty points waiting. Use promo code {discount_code} for 15% off your next dining or delivery order 🍽️.',
    variables: ['name', 'restaurant_name', 'points_balance', 'discount_code'],
    samplePreviewAr: 'أهلاً ياسمين الفهد ✨، اشتقنا لزيارتك في نظام المطاعم الفاخر! لديك رصيد نقاط 1950 نقطة ينتظرك، واستخدم الرمز MISSYOU15 للحصول على خصم 15% على طلبك القادم local أو delivery 🍽️.',
  },
  {
    id: 'tpl-loyalty-booster',
    nameAr: 'مضاعفة نقاط الولاء ونهاية الأسبوع',
    nameEn: 'Double Loyalty Points Weekend Booster',
    category: 'loyalty',
    contentAr: 'مرحباً {name} 🎁! عطلة نهاية أسبوع استثنائية في {restaurant_name}. اطلب {favorite_dish} واحصل على نقاط مضاعفة 2X لتحويلها لمكافآت فورية! كود: {discount_code}.',
    contentEn: 'Hi {name} 🎁! Extraordinary weekend at {restaurant_name}. Order {favorite_dish} and earn 2X double points instantly! Code: {discount_code}.',
    variables: ['name', 'restaurant_name', 'favorite_dish', 'discount_code'],
    samplePreviewAr: 'مرحباً د. نورة الشمري 🎁! عطلة نهاية أسبوع استثنائية في نظام المطاعم الفاخر. اطلبي برجر ترافل أنجوس الفاخر واحصلي على نقاط مضاعفة 2X لتحويلها لمكافآت فورية! كود: 2XPOINTS.',
  },
];

export const MOCK_CUSTOMERS_CRM: CustomerTarget[] = [
  {
    id: 'cust-1',
    name: 'سلطان المقرن',
    phone: '+966554912233',
    tier: 'Black VIP',
    totalSpent: 12400,
    totalOrders: 38,
    loyaltyPoints: 4850,
    favoriteDish: 'ستيك ريب آي واغيو A5 بالكمأة',
    lastVisitDaysAgo: 1,
    segment: 'vip',
  },
  {
    id: 'cust-2',
    name: 'الدكتورة نورة الشمري',
    phone: '+966508821199',
    tier: 'Gold',
    totalSpent: 6800,
    totalOrders: 19,
    loyaltyPoints: 2300,
    favoriteDish: 'ريزوتو الفطر البري بالزعفران',
    lastVisitDaysAgo: 2,
    segment: 'vip',
  },
  {
    id: 'cust-3',
    name: 'المهندس ريان الخالدي',
    phone: '+966541239988',
    tier: 'Silver',
    totalSpent: 2900,
    totalOrders: 9,
    loyaltyPoints: 850,
    favoriteDish: 'تشكيلة المزة الشامية الملكية',
    lastVisitDaysAgo: 14,
    segment: 'loyal',
  },
  {
    id: 'cust-4',
    name: 'ياسمين الفهد',
    phone: '+966567774411',
    tier: 'Gold',
    totalSpent: 5100,
    totalOrders: 14,
    loyaltyPoints: 1950,
    favoriteDish: 'سوفليه الكنافة النابلسية بالقشطة',
    lastVisitDaysAgo: 50,
    segment: 'at_risk',
  },
  {
    id: 'cust-5',
    name: 'خالد بن فيصل',
    phone: '+966501112233',
    tier: 'Bronze',
    totalSpent: 450,
    totalOrders: 2,
    loyaltyPoints: 120,
    favoriteDish: 'ستيك ريب آي واغيو A5 بالكمأة',
    lastVisitDaysAgo: 110,
    segment: 'inactive',
  },
  {
    id: 'cust-6',
    name: 'سارة العبدالله',
    phone: '+966539998877',
    tier: 'Bronze',
    totalSpent: 280,
    totalOrders: 1,
    loyaltyPoints: 50,
    favoriteDish: 'ريزوتو الفطر البري بالزعفران',
    lastVisitDaysAgo: 5,
    segment: 'new',
  },
];

export class MarketingService {
  private templates: WhatsAppTemplate[] = DEFAULT_WHATSAPP_TEMPLATES;
  private campaigns: WhatsAppCampaign[] = [
    {
      id: 'camp-1',
      titleAr: 'حملة تذوق الواغيو الحصرية لعملاء VIP',
      titleEn: 'VIP Wagyu Masterclass & Tasting Exclusive',
      segment: 'vip',
      templateId: 'tpl-vip-exclusive',
      messageTextAr: 'مساء الخير يا {name} 🌟، يسر شيف المطعم دعوتك لتجربة طبقك المفضل {favorite_dish} مع خصم 20% بكود {discount_code}!',
      messageTextEn: 'Good evening {name} 🌟, our Chef invites you for {favorite_dish} with 20% off code {discount_code}!',
      couponCode: 'WAGYU20',
      discountPercentage: 20,
      status: 'completed',
      targetedCount: 140,
      sentCount: 140,
      deliveredCount: 138,
      readCount: 126,
      convertedOrdersCount: 42,
      revenueGenerated: 14490,
      costEstimate: 42.0, // WhatsApp API cost (0.30 SAR per msg)
      roiPercentage: 34400,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Determine customer segment using RFM (Recency, Frequency, Monetary) logic.
   */
  public classifyCustomerSegment(customer: {
    totalSpent: number;
    totalOrders: number;
    lastVisitDaysAgo: number;
    tier?: string;
  }): CustomerSegmentType {
    // 1. Inactive / Dormant: Haven't visited in >= 90 days
    if (customer.lastVisitDaysAgo >= 90) {
      return 'inactive';
    }

    // 2. At-Risk: Formerly frequent customer who hasn't visited in 40-89 days
    if (customer.lastVisitDaysAgo >= 40 && customer.totalOrders >= 3) {
      return 'at_risk';
    }

    const isVipTier = customer.tier === 'Black VIP' || customer.tier === 'vip' || customer.tier === 'Gold' || customer.tier === 'gold';
    
    // 3. VIP: Active high spend (>= 5000 SAR) or VIP tier with at least 8 orders
    if (customer.totalSpent >= 5000 || (isVipTier && customer.totalOrders >= 8)) {
      return 'vip';
    }

    // 4. Loyal: Active frequent customer (>= 3 orders, recent visit)
    if (customer.totalOrders >= 3 && customer.lastVisitDaysAgo < 40) {
      return 'loyal';
    }

    // 5. New: 1 or 2 orders and visited recently within 30 days
    if (customer.totalOrders <= 2 && customer.lastVisitDaysAgo <= 30) {
      return 'new';
    }

    return 'new';
  }

  /**
   * Calculate summary statistics across customer segments.
   */
  public getSegmentStats(customers: CustomerTarget[] = MOCK_CUSTOMERS_CRM): SegmentStats[] {
    const segments: CustomerSegmentType[] = ['all', 'vip', 'loyal', 'at_risk', 'inactive', 'new'];
    const totalCount = customers.length || 1;

    const segmentDescriptions: Record<
      CustomerSegmentType,
      { nameAr: string; nameEn: string; descAr: string; descEn: string }
    > = {
      all: {
        nameAr: 'جميع العملاء',
        nameEn: 'All Customers',
        descAr: 'القاعدة الكاملة لبيانات الضيوف والعملاء المسجلين',
        descEn: 'Complete customer database registry',
      },
      vip: {
        nameAr: 'كبار الشخصيات (VIP & Gold)',
        nameEn: 'VIP & High Spenders',
        descAr: 'العملاء الأكثر إنفاقاً وزيارة (متوسط إنفاق > 5,000 ر.س)',
        descEn: 'Top revenue drivers with average spend > 5,000 SAR',
      },
      loyal: {
        nameAr: 'العملاء الدائمين (Loyal)',
        nameEn: 'Loyal Regulars',
        descAr: 'ضيوف متكررين بزيارات دورية وولاء مرتفع',
        descEn: 'Frequent diners with high repeat visit rate',
      },
      at_risk: {
        nameAr: 'المعرضون للانقطاع (At-Risk)',
        nameEn: 'At-Risk Churning',
        descAr: 'عملاء سابقين لم يزوروا المطعم منذ 40-89 يوماً',
        descEn: 'Previous regulars who have not visited in 40-89 days',
      },
      inactive: {
        nameAr: 'المنقطعون (Inactive / Lost)',
        nameEn: 'Inactive Customers',
        descAr: 'انقطاع تام عن الزيارة لأكثر من 90 يوماً',
        descEn: 'Dormant customers inactive for over 90 days',
      },
      new: {
        nameAr: 'العملاء الجدد (New Diners)',
        nameEn: 'New Diners',
        descAr: 'ضيوف زاروا المطعم حديثاً للمرة الأولى أو الثانية',
        descEn: 'Recent first- or second-time dining guests',
      },
    };

    return segments.map((seg) => {
      const filtered = seg === 'all' ? customers : customers.filter((c) => c.segment === seg);
      const count = filtered.length;
      const percentage = Number(((count / totalCount) * 100).toFixed(1));
      const totalSpend = filtered.reduce((sum, c) => sum + c.totalSpent, 0);
      const totalVisits = filtered.reduce((sum, c) => sum + c.totalOrders, 0);
      const averageSpend = count > 0 ? Number((totalSpend / count).toFixed(2)) : 0;
      const averageVisits = count > 0 ? Number((totalVisits / count).toFixed(1)) : 0;

      const meta = segmentDescriptions[seg];
      return {
        segment: seg,
        nameAr: meta.nameAr,
        nameEn: meta.nameEn,
        count,
        percentage,
        averageSpend,
        averageVisits,
        descriptionAr: meta.descAr,
        descriptionEn: meta.descEn,
      };
    });
  }

  /**
   * Render dynamic WhatsApp template with customer data and variables.
   */
  public renderTemplate(
    templateText: string,
    customer: CustomerTarget,
    customVariables: Record<string, string | number> = {}
  ): string {
    const variables: Record<string, string | number> = {
      name: customer.name,
      tier: customer.tier,
      favorite_dish: customer.favoriteDish || 'أطباقنا المميزة',
      points_balance: customer.loyaltyPoints,
      phone: customer.phone,
      restaurant_name: 'Restaurant OS Luxury',
      discount_code: 'VIPGUEST',
      ...customVariables,
    };

    let rendered = templateText;
    for (const [key, val] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(pattern, String(val));
    }
    return rendered;
  }

  /**
   * Filter targeted customers for a specific segment.
   */
  public getCustomersForSegment(
    segment: CustomerSegmentType,
    allCustomers: CustomerTarget[] = MOCK_CUSTOMERS_CRM
  ): CustomerTarget[] {
    if (segment === 'all') return allCustomers;
    return allCustomers.filter((c) => c.segment === segment);
  }

  /**
   * Create and register a new WhatsApp campaign.
   */
  public createCampaign(payload: {
    titleAr: string;
    titleEn: string;
    segment: CustomerSegmentType;
    templateId?: string;
    messageTextAr: string;
    messageTextEn: string;
    couponCode?: string;
    discountPercentage?: number;
    scheduledAt?: string;
  }): WhatsAppCampaign {
    const targeted = this.getCustomersForSegment(payload.segment);
    const targetedCount = targeted.length;
    const estimatedCost = Number((targetedCount * 0.3).toFixed(2)); // 0.30 SAR per WhatsApp API msg

    const newCampaign: WhatsAppCampaign = {
      id: `camp-${Date.now()}`,
      titleAr: payload.titleAr,
      titleEn: payload.titleEn,
      segment: payload.segment,
      templateId: payload.templateId,
      messageTextAr: payload.messageTextAr,
      messageTextEn: payload.messageTextEn,
      couponCode: payload.couponCode,
      discountPercentage: payload.discountPercentage || 0,
      scheduledAt: payload.scheduledAt || new Date().toISOString(),
      status: 'scheduled',
      targetedCount,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      convertedOrdersCount: 0,
      revenueGenerated: 0,
      costEstimate: estimatedCost,
      roiPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.campaigns.unshift(newCampaign);
    return newCampaign;
  }

  /**
   * Simulate immediate dispatch and return full analytics.
   */
  public simulateCampaignDispatch(
    campaignId: string,
    customers: CustomerTarget[] = MOCK_CUSTOMERS_CRM
  ): MarketingCampaignPerformance {
    const campaign = this.campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const targeted = this.getCustomersForSegment(campaign.segment, customers);
    const sentCount = targeted.length;
    const deliveredCount = Math.round(sentCount * 0.98); // 98% delivery
    const readCount = Math.round(deliveredCount * 0.88); // 88% read rate

    // VIP segment converts higher (30%) than inactive (10%)
    let conversionMultiplier = 0.2;
    if (campaign.segment === 'vip') conversionMultiplier = 0.32;
    else if (campaign.segment === 'at_risk') conversionMultiplier = 0.18;
    else if (campaign.segment === 'inactive') conversionMultiplier = 0.08;

    const convertedOrdersCount = Math.max(1, Math.round(readCount * conversionMultiplier));
    const avgOrderValue = campaign.segment === 'vip' ? 350 : 180;
    const revenueGenerated = convertedOrdersCount * avgOrderValue;
    const cost = Math.max(1, sentCount * 0.3); // 0.30 SAR per msg
    const roi = Number((((revenueGenerated - cost) / cost) * 100).toFixed(1));

    // Update campaign record
    campaign.status = 'completed';
    campaign.sentCount = sentCount;
    campaign.deliveredCount = deliveredCount;
    campaign.readCount = readCount;
    campaign.convertedOrdersCount = convertedOrdersCount;
    campaign.revenueGenerated = revenueGenerated;
    campaign.costEstimate = Number(cost.toFixed(2));
    campaign.roiPercentage = roi;
    campaign.updatedAt = new Date().toISOString();

    return {
      campaignId,
      conversionRate: Number(((convertedOrdersCount / sentCount) * 100).toFixed(1)),
      deliveryRate: Number(((deliveredCount / sentCount) * 100).toFixed(1)),
      readRate: Number(((readCount / deliveredCount) * 100).toFixed(1)),
      costPerConversion: Number((cost / convertedOrdersCount).toFixed(2)),
      revenuePerMessage: Number((revenueGenerated / sentCount).toFixed(2)),
      roi,
    };
  }

  public getAllCampaigns(): WhatsAppCampaign[] {
    return this.campaigns;
  }

  public getAllTemplates(): WhatsAppTemplate[] {
    return this.templates;
  }
}

export const marketingService = new MarketingService();
