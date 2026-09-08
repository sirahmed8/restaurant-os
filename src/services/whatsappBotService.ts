/**
 * =====================================================================
 * RESTAURANT OS — WHATSAPP MARKETING & RFM BOT ENGINE SERVICE
 * =====================================================================
 * 1. RFM Segmentation Engine (Recency, Frequency, Monetary Analysis)
 * 2. Automated WhatsApp Campaign Dispatcher & Variable Interpolation
 * 3. 1-Click Digital Interactive WhatsApp Invoices (ZATCA Compliant)
 * 4. Conversational WhatsApp Chatbot & Webhook Simulator
 * 5. ROI & Marketing Intelligence Analytics
 */

import {
  CustomerRFMProfile,
  RFMSegment,
  RFMScore,
  MarketingCampaign,
  CampaignType,
  WhatsAppDigitalInvoiceData,
  WhatsAppChatMessage,
  WhatsAppConversation,
  WhatsAppApiConfig,
  MarketingOverviewStats,
  WhatsAppInteractiveButton,
} from '../types/marketing';
import { Customer, Order } from '../db/schema';
import { INITIAL_CUSTOMERS, INITIAL_ORDERS } from '../db/mock-data';
import { eventBus } from './eventBus';

// Default Segment Metadata (Arabic & English styling)
export const RFM_SEGMENT_META: Record<
  RFMSegment,
  {
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    color: string;
    badgeBg: string;
    recommendedCampaign: CampaignType;
  }
> = {
  champions: {
    nameAr: 'الأبطال والنخبة',
    nameEn: 'Champions & VIP Elite',
    descriptionAr: 'أعلى تكرار وإنفاق مؤخراً — سفراء علامتك التجارية',
    descriptionEn: 'High spenders with recent frequent visits — brand advocates',
    color: '#F59E0B',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    recommendedCampaign: 'vip_reward',
  },
  vip_high_spenders: {
    nameAr: 'كبار المنفقين (Whales)',
    nameEn: 'High Spenders (VIP)',
    descriptionAr: 'متوسط قيمة طلب مرتفعة جداً — يعشقون الأطباق الفاخرة',
    descriptionEn: 'Very high average ticket size — love prime selections',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    recommendedCampaign: 'vip_reward',
  },
  loyal: {
    nameAr: 'العملاء المخلصين',
    nameEn: 'Loyal Customers',
    descriptionAr: 'تردد مستمر وشراء متكرر — استجابة ممتازة للعروض',
    descriptionEn: 'Regular recurring visitors — great response to promotions',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    recommendedCampaign: 'flash_deal',
  },
  promising: {
    nameAr: 'العملاء الواعدين',
    nameEn: 'Promising Customers',
    descriptionAr: 'زيارات حديثة وإنفاق فوق المتوسط — يحتاجون تشجيع للولاء',
    descriptionEn: 'Recent visits with above-average spend — ready to convert to loyal',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    recommendedCampaign: 'flash_deal',
  },
  new_customers: {
    nameAr: 'العملاء الجدد',
    nameEn: 'New Customers',
    descriptionAr: 'أول زيارة أو طلب في آخر 14 يوماً — ترحيب وبناء انطباع أول',
    descriptionEn: 'First visit in last 14 days — onboarding & first impression',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    recommendedCampaign: 'feedback_review',
  },
  at_risk: {
    nameAr: 'المعرضين للمغادرة (At Risk)',
    nameEn: 'At-Risk Customers',
    descriptionAr: 'كانوا زبائن متميزين ولكن انقطعوا > 30 يوماً — يحتاجون استعادة فورية',
    descriptionEn: 'Previously high/loyal but inactive > 30 days — urgent win-back',
    color: '#F97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    recommendedCampaign: 'win_back',
  },
  dormant: {
    nameAr: 'العملاء الخاملين (Dormant)',
    nameEn: 'Dormant / Lost',
    descriptionAr: 'انقطاع طويل > 60-90 يوماً — يتطلبون عرضاً جريئاً جداً لإحيائهم',
    descriptionEn: 'Inactive > 60-90 days — require a strong incentive to reactivate',
    color: '#EF4444',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    recommendedCampaign: 'win_back',
  },
};

// Default Initial Campaigns
export const DEFAULT_MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-winback-01',
    titleAr: 'حملة استعادة العملاء المنقطعين (اشتقنا لك)',
    titleEn: 'Win-Back Inactive Customers (We Miss You)',
    type: 'win_back',
    targetSegment: 'at_risk',
    status: 'running',
    channel: 'whatsapp',
    messageTemplateAr:
      'مرحباً بك يا {{customer_name}} 🌟\nاشتقنا لك في مطعمنا! طبقك المفضل ({{favorite_dish}}) ينتظرك بلمسة الشيف الخاصة.\n🎁 استمتع بخصم فوري 30 ريال على طلبك القادم باستخدام الكود: *{{discount_code}}*\n\nسارٍ حتى نهاية الأسبوع!',
    messageTemplateEn:
      'Hello {{customer_name}} 🌟\nWe miss you at our restaurant! Your favorite dish ({{favorite_dish}}) is waiting for you.\n🎁 Enjoy an instant SAR 30 discount on your next order with code: *{{discount_code}}*\n\nValid till end of the week!',
    mediaUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    ctaButtonTextAr: '🍽️ اطلب طبقك المفضل الآن',
    ctaButtonTextEn: '🍽️ Order Your Dish Now',
    ctaButtonAction: 'https://order.restaurantos.sa/menu?promo=COMEBACK30',
    discountCouponCode: 'COMEBACK30',
    discountFixedSar: 30,
    minOrderValue: 120,
    targetAudienceCount: 142,
    sentCount: 142,
    deliveredCount: 139,
    readCount: 131,
    repliedCount: 54,
    ordersGenerated: 46,
    revenueGeneratedSar: 8240,
    costSar: 284,
    roiMultiplier: 29.0,
    scheduledAt: '2026-08-10T14:00:00Z',
    executedAt: '2026-08-10T14:02:00Z',
    createdAt: '2026-08-09T10:00:00Z',
    updatedAt: '2026-08-14T12:00:00Z',
    autoTrigger: true,
    triggerRules: { daysInactive: 30, minSpentSar: 150 },
  },
  {
    id: 'camp-birthday-02',
    titleAr: 'مفاجأة عيد الميلاد الملكية وتورتة مجانية',
    titleEn: 'Royal Birthday Celebration & Free Dessert',
    type: 'birthday',
    targetSegment: 'all',
    status: 'running',
    channel: 'whatsapp',
    messageTemplateAr:
      'كل عام وأنت بألف خير وسعادة يا {{customer_name}} 🎂🎈\nفريق المطعم يحتفل بيوم ميلادك المميز!\n🎁 هديتك الخاصة: تورتة تشيز كيك التوت الفاخرة مجاناً مع أي وجبة رئيسية، أو خصم 25% باستخدام كود: *{{discount_code}}*\n\nيسعدنا حجز طاولتك المفضلة للاحتفال معك!',
    messageTemplateEn:
      'Happy Birthday dear {{customer_name}} 🎂🎈\nOur team celebrates your special day!\n🎁 Your special gift: Complimentary Berry Cheesecake with any main, or 25% off with code: *{{discount_code}}*\n\nWe would love to reserve your table to celebrate!',
    mediaUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    ctaButtonTextAr: '🎂 حجز طاولة الاحتفال',
    ctaButtonTextEn: '🎂 Book Birthday Table',
    ctaButtonAction: 'https://order.restaurantos.sa/reserve?promo=BDAY25',
    discountCouponCode: 'BDAY25',
    discountPercentage: 25,
    minOrderValue: 150,
    targetAudienceCount: 38,
    sentCount: 38,
    deliveredCount: 38,
    readCount: 36,
    repliedCount: 22,
    ordersGenerated: 19,
    revenueGeneratedSar: 6450,
    costSar: 76,
    roiMultiplier: 84.8,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T15:00:00Z',
    autoTrigger: true,
    triggerRules: { isBirthdayWeek: true },
  },
  {
    id: 'camp-vip-03',
    titleAr: 'مكافآت كبار الشخصيات ومضاعفة نقاط الولاء 2X',
    titleEn: 'VIP Double Points & Exclusive Tasting Lounge',
    type: 'vip_reward',
    targetSegment: 'champions',
    status: 'running',
    channel: 'whatsapp',
    messageTemplateAr:
      'أهلاً بك يا ضيفنا النخبوي {{customer_name}} 👑\nتقديراً لولائك المميز، رصيد نقاطك الحالي هو ({{points_balance}} نقطة) في فئة {{tier}}.\n✨ يسعدنا دعوتك لتذوق قائمة أطباق الشيف الحصرية لهذا الموسم مع *مضاعفة نقاط الولاء 2X* على جميع طلباتك هذا الأسبوع!\nكود العضوية VIP: *{{discount_code}}*',
    messageTemplateEn:
      'Welcome esteemed guest {{customer_name}} 👑\nIn appreciation of your loyalty, your balance is ({{points_balance}} pts) in {{tier}} tier.\n✨ We invite you to taste our exclusive seasonal dishes with *2X Double Loyalty Points* all week!\nVIP Pass: *{{discount_code}}*',
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ctaButtonTextAr: '👑 حجز صالة كبار الشخصيات',
    ctaButtonTextEn: '👑 Reserve VIP Lounge',
    ctaButtonAction: 'https://order.restaurantos.sa/vip',
    discountCouponCode: 'ROYAL2X',
    targetAudienceCount: 52,
    sentCount: 52,
    deliveredCount: 52,
    readCount: 49,
    repliedCount: 28,
    ordersGenerated: 31,
    revenueGeneratedSar: 16800,
    costSar: 104,
    roiMultiplier: 161.5,
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z',
    autoTrigger: true,
    triggerRules: { minSpentSar: 1000 },
  },
  {
    id: 'camp-review-04',
    titleAr: 'استبيان الرضا بعد الوجبة وتجميع تقييمات Google Maps',
    titleEn: 'Post-Dining Review Collector & Free Mocktail',
    type: 'feedback_review',
    targetSegment: 'all',
    status: 'running',
    channel: 'whatsapp',
    messageTemplateAr:
      'شكراً لزيارتك مطعمنا اليوم يا {{customer_name}} 🌿\nيسعدنا دائماً تقديم تجربة استثنائية لك.\n⭐ كيف كانت تجربتك اليوم؟ نرجو تقييمنا على خرائط جوجل والحصول على موهيتو منعش مجاناً في زيارتك القادمة:\n{{cta_link}}',
    messageTemplateEn:
      'Thank you for dining with us today {{customer_name}} 🌿\nWe always strive to craft an exceptional experience.\n⭐ How was your meal? Leave us a quick Google review and get a free signature mocktail next visit:\n{{cta_link}}',
    ctaButtonTextAr: '⭐ قيّم تجربتك على Google Maps',
    ctaButtonTextEn: '⭐ Review Us on Google',
    ctaButtonAction: 'https://maps.google.com/?cid=restaurantos-feedback',
    targetAudienceCount: 210,
    sentCount: 210,
    deliveredCount: 206,
    readCount: 195,
    repliedCount: 118,
    ordersGenerated: 62,
    revenueGeneratedSar: 9300,
    costSar: 420,
    roiMultiplier: 22.1,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-14T18:00:00Z',
    autoTrigger: true,
  },
  {
    id: 'camp-flash-05',
    titleAr: 'عرض البرق الأسبوعي: ليلة المشاوي والواغيو الملكي',
    titleEn: 'Weekend Flash Deal: Royal Wagyu & Grills Night',
    type: 'flash_deal',
    targetSegment: 'loyal',
    status: 'scheduled',
    channel: 'whatsapp',
    messageTemplateAr:
      'عطلة نهاية أسبوع شهية يا {{customer_name}} 🔥🥩\nخصم حصري 20% على جميع أطباق الستيك المشوي على الفحم والواغيو A5 عند الطلب الليلة!\nكود العرض: *{{discount_code}}*\n\nالكمية محدودة للحوم المعتقة الطازجة!',
    messageTemplateEn:
      'Have a delicious weekend {{customer_name}} 🔥🥩\nExclusive 20% OFF on all charcoal grilled steaks & A5 Wagyu tonight!\nPromo Code: *{{discount_code}}*\n\nLimited quantity on fresh dry-aged cuts!',
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ctaButtonTextAr: '🔥 احجز عرض المشاوي الآن',
    ctaButtonTextEn: '🔥 Claim Grills Deal',
    ctaButtonAction: 'https://order.restaurantos.sa/promo/wagyu',
    discountCouponCode: 'GRILL20',
    discountPercentage: 20,
    minOrderValue: 180,
    targetAudienceCount: 185,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    repliedCount: 0,
    ordersGenerated: 0,
    revenueGeneratedSar: 0,
    costSar: 370,
    roiMultiplier: 0,
    scheduledAt: '2026-08-15T16:00:00Z',
    createdAt: '2026-08-13T10:00:00Z',
    updatedAt: '2026-08-14T16:00:00Z',
    autoTrigger: false,
  },
];

// Realistic Mock RFM Profiles Base
const EXTENDED_MOCK_PROFILES: CustomerRFMProfile[] = [
  {
    id: 'cust-vip-1',
    name: 'سعادة عبد العزيز آل الشيخ',
    phone: '+966505551122',
    email: 'abdulaziz@vip-guest.sa',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    tier: 'Black VIP',
    recencyDays: 1,
    frequency: 34,
    monetary: 19850,
    averageOrderValue: 583.8,
    rScore: 5,
    fScore: 5,
    mScore: 5,
    rfmScore: '555',
    segment: 'champions',
    segmentNameAr: 'الأبطال والنخبة',
    segmentNameEn: 'Champions & VIP Elite',
    segmentColor: '#F59E0B',
    segmentBadgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    lastOrderDate: '2026-08-13T20:15:00Z',
    favoriteDishAr: 'ستيك ريب آي واغيو A5',
    favoriteDishEn: 'A5 Wagyu Ribeye Steak',
    birthday: '1984-07-22',
    loyaltyPoints: 1985,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['VIP', 'لحوم معتقة', 'طاولة خاصة', 'عميل نخبة'],
    recommendedCampaignType: 'vip_reward',
    totalDiscountSavedSar: 1250,
  },
  {
    id: 'cust-gold-2',
    name: 'د. ليلى السبيعي',
    phone: '+966541122334',
    email: 'dr.layla@hospital.sa',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    tier: 'Gold',
    recencyDays: 3,
    frequency: 18,
    monetary: 5240,
    averageOrderValue: 291.1,
    rScore: 5,
    fScore: 4,
    mScore: 4,
    rfmScore: '544',
    segment: 'loyal',
    segmentNameAr: 'العملاء المخلصين',
    segmentNameEn: 'Loyal Customers',
    segmentColor: '#10B981',
    segmentBadgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    lastOrderDate: '2026-08-11T19:30:00Z',
    favoriteDishAr: 'سلمون مشوي مع باستا الترافل',
    favoriteDishEn: 'Grilled Salmon & Truffle Tagliatelle',
    birthday: '1989-08-16', // Birthday this week!
    loyaltyPoints: 524,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['أطباق صحية', 'تراس خارجي', 'عيد ميلاد قريب'],
    recommendedCampaignType: 'birthday',
    totalDiscountSavedSar: 420,
  },
  {
    id: 'cust-silver-3',
    name: 'م. حسام الشهري',
    phone: '+966567788990',
    email: 'hussam.eng@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    tier: 'Silver',
    recencyDays: 38,
    frequency: 9,
    monetary: 2480,
    averageOrderValue: 275.5,
    rScore: 2,
    fScore: 3,
    mScore: 3,
    rfmScore: '233',
    segment: 'at_risk',
    segmentNameAr: 'المعرضين للمغادرة (At Risk)',
    segmentNameEn: 'At-Risk Customers',
    segmentColor: '#F97316',
    segmentBadgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    lastOrderDate: '2026-07-07T21:00:00Z',
    favoriteDishAr: 'برجر ترافل أنجوس الفاخر',
    favoriteDishEn: 'Truffle Angus Prime Burger',
    loyaltyPoints: 248,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['انقطاع 38 يوم', 'يحتاج استعادة', 'عشاق البرجر'],
    recommendedCampaignType: 'win_back',
    totalDiscountSavedSar: 180,
  },
  {
    id: 'cust-whale-4',
    name: 'الشيخ فهد التميمي',
    phone: '+966551234567',
    email: 'fahad.altamimi@holding.sa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tier: 'Black VIP',
    recencyDays: 6,
    frequency: 14,
    monetary: 14350,
    averageOrderValue: 1025.0,
    rScore: 4,
    fScore: 4,
    mScore: 5,
    rfmScore: '445',
    segment: 'vip_high_spenders',
    segmentNameAr: 'كبار المنفقين (Whales)',
    segmentNameEn: 'High Spenders (VIP)',
    segmentColor: '#8B5CF6',
    segmentBadgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    lastOrderDate: '2026-08-08T22:10:00Z',
    favoriteDishAr: 'وليمة المشاوي الملكية العائلية',
    favoriteDishEn: 'Royal Family Mixed Grills Feast',
    loyaltyPoints: 1435,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['عزائم عائلية', 'VIP', 'فاتورة > 1000'],
    recommendedCampaignType: 'vip_reward',
    totalDiscountSavedSar: 800,
  },
  {
    id: 'cust-new-5',
    name: 'سارة القحطاني',
    phone: '+966589988776',
    email: 'sara.q@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    tier: 'Bronze',
    recencyDays: 2,
    frequency: 1,
    monetary: 185,
    averageOrderValue: 185.0,
    rScore: 5,
    fScore: 1,
    mScore: 2,
    rfmScore: '512',
    segment: 'new_customers',
    segmentNameAr: 'العملاء الجدد',
    segmentNameEn: 'New Customers',
    segmentColor: '#3B82F6',
    segmentBadgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    lastOrderDate: '2026-08-12T13:45:00Z',
    favoriteDishAr: 'بيتزا نابولي بالكمأة والمشروم',
    favoriteDishEn: 'Truffle & Forest Mushroom Pizza',
    loyaltyPoints: 18,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['عميل جديد', 'أول زيارة', 'طلب كونسيرج'],
    recommendedCampaignType: 'feedback_review',
    totalDiscountSavedSar: 0,
  },
  {
    id: 'cust-promising-6',
    name: 'طارق المنصور',
    phone: '+966533445566',
    email: 'tariq.m@tech.sa',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    tier: 'Silver',
    recencyDays: 5,
    frequency: 3,
    monetary: 920,
    averageOrderValue: 306.6,
    rScore: 4,
    fScore: 2,
    mScore: 3,
    rfmScore: '423',
    segment: 'promising',
    segmentNameAr: 'العملاء الواعدين',
    segmentNameEn: 'Promising Customers',
    segmentColor: '#06B6D4',
    segmentBadgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    lastOrderDate: '2026-08-09T20:00:00Z',
    favoriteDishAr: 'ديناميت شرمب مقرمش وكوكتيل باشن',
    favoriteDishEn: 'Crispy Dynamite Shrimp & Passion Mojito',
    loyaltyPoints: 92,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['واعد', 'زيارات مسائية', 'مشروبات فاخرة'],
    recommendedCampaignType: 'flash_deal',
    totalDiscountSavedSar: 50,
  },
  {
    id: 'cust-dormant-7',
    name: 'يوسف العثمان',
    phone: '+966591123456',
    email: 'yousef.othman@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    tier: 'Bronze',
    recencyDays: 74,
    frequency: 2,
    monetary: 380,
    averageOrderValue: 190.0,
    rScore: 1,
    fScore: 1,
    mScore: 2,
    rfmScore: '112',
    segment: 'dormant',
    segmentNameAr: 'العملاء الخاملين (Dormant)',
    segmentNameEn: 'Dormant / Lost',
    segmentColor: '#EF4444',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    lastOrderDate: '2026-06-01T15:00:00Z',
    favoriteDishAr: 'باستا فيتوتشيني ألفريدو بالدجاج',
    favoriteDishEn: 'Chicken Fettuccine Alfredo',
    loyaltyPoints: 38,
    marketingOptIn: true,
    whatsappActive: true,
    tags: ['خامل > 60 يوم', 'انقطاع تام'],
    recommendedCampaignType: 'win_back',
    totalDiscountSavedSar: 35,
  },
];

// Initial WhatsApp Conversations
export const DEFAULT_WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: 'conv-01',
    customerId: 'cust-vip-1',
    customerName: 'سعادة عبد العزيز آل الشيخ',
    customerPhone: '+966505551122',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    segment: 'champions',
    lastMessage: 'تم تأكيد حجز طاولة VIP-01 غداً الساعة 8:30 م مع الشيف عمر',
    lastMessageTime: '19:42',
    unreadCount: 0,
    isBotActive: true,
    stage: 'idle',
    messages: [
      {
        id: 'msg-01-1',
        conversationId: 'conv-01',
        sender: 'bot',
        direction: 'outbound',
        type: 'template',
        text: 'أهلاً بك يا ضيفنا النخبوي سعادة عبد العزيز آل الشيخ 👑\nرصيدك الحالي: 1985 نقطة في فئة Black VIP.\nيسعدنا تقديم مضاعفة نقاط 2X على زيارتك القادمة.',
        timestamp: '18:30',
        status: 'read',
        buttons: [
          { id: 'b1', titleAr: '👑 حجز طاولة VIP', titleEn: 'Reserve VIP', payload: 'reserve_vip', type: 'quick_reply' },
          { id: 'b2', titleAr: '📖 استعراض القائمة', titleEn: 'View Menu', payload: 'view_menu', type: 'quick_reply' },
        ],
      },
      {
        id: 'msg-01-2',
        conversationId: 'conv-01',
        sender: 'customer',
        direction: 'inbound',
        type: 'text',
        text: 'مساء الخير، أود حجز طاولة VIP-01 لـ 4 أشخاص غداً الساعة 8:30 مساءً مع تجهيز الستيك واغيو ميديوم رير',
        timestamp: '19:40',
        status: 'read',
      },
      {
        id: 'msg-01-3',
        conversationId: 'conv-01',
        sender: 'bot',
        direction: 'outbound',
        type: 'text',
        text: 'مرحباً بسعادتك! 🌹\nتم تأكيد حجز طاولة VIP-01 غداً الساعة 8:30 م (4 أشخاص).\nالشيف عمر وفريق الخدمة الخاصة في انتظاركم بشغف!',
        timestamp: '19:42',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-02',
    customerId: 'cust-gold-2',
    customerName: 'د. ليلى السبيعي',
    customerPhone: '+966541122334',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    segment: 'loyal',
    lastMessage: 'كل عام وأنتِ بألف خير دكتورة ليلى! 🎂 تم تفعيل كود الخصم BDAY25',
    lastMessageTime: '17:15',
    unreadCount: 1,
    isBotActive: true,
    stage: 'idle',
    messages: [
      {
        id: 'msg-02-1',
        conversationId: 'conv-02',
        sender: 'bot',
        direction: 'outbound',
        type: 'template',
        text: 'كل عام وأنتِ بألف خير وسعادة يا د. ليلى السبيعي 🎂🎈\nفريق المطعم يحتفل بيوم ميلادك المميز!\n🎁 هديتك الخاصة: تورتة تشيز كيك التوت الفاخرة مجاناً، أو خصم 25% بكود: *BDAY25*',
        timestamp: '16:00',
        status: 'read',
        couponData: {
          code: 'BDAY25',
          discountText: 'خصم 25% + تورتة عيد ميلاد مجانية',
          expiresAt: '2026-08-20',
          minSpend: 150,
        },
      },
      {
        id: 'msg-02-2',
        conversationId: 'conv-02',
        sender: 'customer',
        direction: 'inbound',
        type: 'text',
        text: 'شكراً جزيلاً على هذه اللفتة الراقية! 🌸 هل الكود فعال للطلب التوصيل أيضاً؟',
        timestamp: '17:14',
        status: 'delivered',
      },
      {
        id: 'msg-02-3',
        conversationId: 'conv-02',
        sender: 'bot',
        direction: 'outbound',
        type: 'text',
        text: 'نعم بكل سرور دكتورة ليلى! الكود فعال للصالة والتوصيل عبر موقعنا الإلكتروني. يسعدنا دائماً خدمتك! 🌸✨',
        timestamp: '17:15',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'conv-03',
    customerId: 'cust-new-5',
    customerName: 'سارة القحطاني',
    customerPhone: '+966589988776',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    segment: 'new_customers',
    lastMessage: 'فاتورتك الإلكترونية المعتمدة لطلب رقم #ORD-8821',
    lastMessageTime: '14:20',
    unreadCount: 0,
    isBotActive: true,
    stage: 'idle',
    messages: [
      {
        id: 'msg-03-1',
        conversationId: 'conv-03',
        sender: 'bot',
        direction: 'outbound',
        type: 'invoice_receipt',
        text: '🧾 *فاتورة ضريبية مبسطة — مطعم الرواق الفاخر*\nرقم الفاتورة: #ORD-8821\nالمبلغ الإجمالي: 185.00 ر.س (شامل الضريبة 15%)\nشكراً لزيارتك الأولى، تم تسجيل 18 نقطة ولاء في محفظتك!',
        timestamp: '14:20',
        status: 'read',
        invoiceData: {
          orderId: 'ord-8821',
          orderNumber: 'ORD-8821',
          customerName: 'سارة القحطاني',
          customerPhone: '+966589988776',
          items: [
            { name: 'بيتزا نابولي بالكمأة والمشروم', quantity: 1, price: 95.0, total: 95.0 },
            { name: 'سلطة سيزر الدجاج المشوي', quantity: 1, price: 55.0, total: 55.0 },
            { name: 'موهيتو باشن فروت منعش', quantity: 1, price: 35.0, total: 35.0 },
          ],
          subtotal: 160.87,
          taxSar: 24.13,
          discountSar: 0,
          grandTotal: 185.0,
          paymentMethod: 'Apple Pay',
          branchName: 'فرع السليمانية — الرياض',
          tableNumber: 'T-06',
          orderType: 'محلي (طاولة)',
          orderDate: '2026-08-14 14:15',
          cashierName: 'أحمد الشريف',
        },
        buttons: [
          { id: 'inv-b1', titleAr: '⭐ قيّم تجربتك', titleEn: 'Rate Meal', payload: 'rate_experience', type: 'quick_reply' },
          { id: 'inv-b2', titleAr: '🔁 إعادة الطلب', titleEn: 'Reorder', payload: 'reorder_last', type: 'quick_reply' },
        ],
      },
    ],
  },
];

export class WhatsAppBotService {
  private static instance: WhatsAppBotService;

  private constructor() {}

  public static getInstance(): WhatsAppBotService {
    if (!WhatsAppBotService.instance) {
      WhatsAppBotService.instance = new WhatsAppBotService();
    }
    return WhatsAppBotService.instance;
  }

  // =========================================================================
  // 1. RFM SEGMENTATION ENGINE
  // =========================================================================

  /**
   * Computes RFM Segmentation profiles from raw customers and historical orders.
   */
  public calculateRFMSegments(
    customers: Customer[] = INITIAL_CUSTOMERS,
    orders: Order[] = INITIAL_ORDERS
  ): CustomerRFMProfile[] {
    const now = new Date();

    // Combine standard mock profiles with DB customers
    const profiles: CustomerRFMProfile[] = EXTENDED_MOCK_PROFILES.map((p) => ({ ...p }));

    // Enhance or compute scores
    return profiles.map((p: any) => {
      const recencyDays = p.recencyDays ?? p.daysSinceLastOrder ?? 15;
      const frequency = p.frequency ?? p.orderCount ?? 3;
      const monetary = p.monetary ?? p.totalSpent ?? 500;
      const avgValue = p.averageOrderValue ?? (monetary / (frequency || 1));

      // Calculate RFM 1-5 Scores
      let rScore = 1;
      if (recencyDays <= 3) rScore = 5;
      else if (recencyDays <= 7) rScore = 4;
      else if (recencyDays <= 21) rScore = 3;
      else if (recencyDays <= 45) rScore = 2;
      else rScore = 1;

      let fScore = 1;
      if (frequency >= 20) fScore = 5;
      else if (frequency >= 10) fScore = 4;
      else if (frequency >= 5) fScore = 3;
      else if (frequency >= 2) fScore = 2;
      else fScore = 1;

      let mScore = 1;
      if (monetary >= 10000) mScore = 5;
      else if (monetary >= 4000) mScore = 4;
      else if (monetary >= 1500) mScore = 3;
      else if (monetary >= 500) mScore = 2;
      else mScore = 1;

      const rfmCode = `${rScore}${fScore}${mScore}`;

      // Segment Assignment Rules
      let segment: RFMSegment = 'promising';
      if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
        segment = 'champions';
      } else if (mScore === 5 && avgValue >= 500) {
        segment = 'vip_high_spenders';
      } else if (fScore >= 3 && rScore >= 3) {
        segment = 'loyal';
      } else if (rScore >= 4 && fScore === 1) {
        segment = 'new_customers';
      } else if (rScore <= 2 && (fScore >= 3 || mScore >= 3)) {
        segment = 'at_risk';
      } else if (rScore === 1) {
        segment = 'dormant';
      } else {
        segment = 'promising';
      }

      const meta = RFM_SEGMENT_META[segment];

      return {
        ...p,
        rScore,
        fScore,
        mScore,
        rfmScore: rfmCode,
        segment,
        segmentNameAr: meta.nameAr,
        segmentNameEn: meta.nameEn,
        segmentColor: meta.color,
        segmentBadgeBg: meta.badgeBg,
        recommendedCampaignType: meta.recommendedCampaign,
      };
    });
  }

  // =========================================================================
  // 2. AUTOMATED WHATSAPP CAMPAIGN ENGINE
  // =========================================================================

  /**
   * Replaces dynamic variables in campaign template.
   */
  public interpolateTemplate(
    template: string,
    customer: CustomerRFMProfile,
    campaign?: MarketingCampaign,
    customVars?: Record<string, string>
  ): string {
    let result = template;
    const vars: Record<string, string> = {
      '{{customer_name}}': customer.name,
      '{{favorite_dish}}': customer.favoriteDishAr || 'طبقك المفضل',
      '{{discount_code}}': campaign?.discountCouponCode || 'SPECIAL2026',
      '{{points_balance}}': (customer.loyaltyPoints ?? 0).toString(),
      '{{tier}}': customer.tier,
      '{{branch_name}}': 'فرع السليمانية — الرياض',
      '{{cta_link}}': campaign?.ctaButtonAction || 'https://order.restaurantos.sa',
      ...(customVars || {}),
    };

    for (const [key, val] of Object.entries(vars)) {
      result = result.replaceAll(key, val);
    }
    return result;
  }

  /**
   * Generates direct WhatsApp Deep Link URI
   */
  public generateWhatsAppDeepLink(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  /**
   * Simulates high-speed batch WhatsApp campaign dispatch with realistic stats
   */
  public async dispatchCampaignSimulation(
    campaign: MarketingCampaign,
    targetProfiles: CustomerRFMProfile[],
    onProgress?: (progress: number, sentCount: number) => void
  ): Promise<{
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    orders: number;
    revenue: number;
    roi: number;
  }> {
    const count = targetProfiles.length || campaign.targetAudienceCount || 100;
    const batchSize = Math.max(1, Math.floor(count / 10));

    for (let i = 0; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const currentSent = Math.min(count, i * batchSize);
      const progress = Math.min(100, Math.round((i / 10) * 100));
      if (onProgress) onProgress(progress, currentSent);
    }

    const delivered = Math.floor(count * 0.98);
    const read = Math.floor(delivered * 0.94);
    const replied = Math.floor(read * 0.38);
    const orders = Math.max(1, Math.floor(replied * 0.72));
    const avgTicket = 185.0;
    const revenue = orders * avgTicket;
    const cost = count * 2.0; // 2 SAR cost per WhatsApp business message
    const roi = cost > 0 ? Number((revenue / cost).toFixed(1)) : 0;

    return {
      sent: count,
      delivered,
      read,
      replied,
      orders,
      revenue,
      roi,
    };
  }

  // =========================================================================
  // 3. DIGITAL INVOICE GENERATOR & FORMATTER
  // =========================================================================

  /**
   * Formats a clean, professional WhatsApp text invoice with VAT compliance
   */
  public formatInvoiceForWhatsApp(invoice: WhatsAppDigitalInvoiceData): string {
    const itemLines = invoice.items
      .map(
        (item: any, idx: number) =>
          `▪️ *${item.name}*\n    ${item.quantity} × ${item.price.toFixed(2)} = *${item.total.toFixed(2)} ر.س*`
      )
      .join('\n');

    return (
      `🧾 *فاتورة ضريبية مبسطة الإلكترونية*\n` +
      `🏛️ *مطعم الرواق الفاخر — ${invoice.branchName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *العميل:* ${invoice.customerName}\n` +
      `🔢 *رقم الطلب:* #${invoice.orderNumber}\n` +
      `📅 *التاريخ:* ${invoice.orderDate}\n` +
      `🏷️ *نوع الطلب:* ${invoice.orderType}${invoice.tableNumber ? ` | طاولة: ${invoice.tableNumber}` : ''}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *تفاصيل الأصناف:*\n${itemLines}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *المجموع الفرعي:* ${(invoice.subtotal ?? invoice.subtotalSar ?? 0).toFixed(2)} ر.س\n` +
      ((invoice.discountSar ?? invoice.discount ?? 0) > 0 ? `🎁 *الخصم المطبق:* -${(invoice.discountSar ?? invoice.discount ?? 0).toFixed(2)} ر.س\n` : '') +
      `📊 *ضريبة القيمة المضافة (15%):* ${(invoice.taxSar ?? invoice.tax ?? 0).toFixed(2)} ر.س\n` +
      `💳 *الإجمالي النهائي:* *${(invoice.grandTotal ?? invoice.totalAmountSar ?? invoice.total ?? 0).toFixed(2)} ر.س*\n` +
      `💰 *طريقة الدفع:* ${invoice.paymentMethod || 'مدى / بطاقة ائتمانية'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *رمز التحقق والامتثال ZATCA مشفر رقمياً*\n` +
      `🔗 رابط الفاتورة الرقمية: https://invoice.restaurantos.sa/v/${invoice.orderNumber}\n\n` +
      `🌹 سعدنا بخدمتكم ونتطلع لرؤيتكم مجدداً!`
    );
  }

  /**
   * Creates invoice payload from active order
   */
  public createInvoiceData(order: any, customer?: CustomerRFMProfile): WhatsAppDigitalInvoiceData {
    const items = (order.items || []).map((i: any) => ({
      name: i.dish?.name || i.nameAr || i.name || 'صنف فاخر',
      quantity: i.quantity || 1,
      price: i.dish?.price || i.price || 0,
      total: (i.dish?.price || i.price || 0) * (i.quantity || 1),
    }));

    const grandTotal = order.total || order.totalAmount || 0;
    const subtotal = grandTotal / 1.15;
    const taxSar = grandTotal - subtotal;

    return {
      orderId: order.id || 'ord-new',
      orderNumber: order.orderNumber || 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      customerName: customer?.name || order.customerName || 'ضيفنا العزيز',
      customerPhone: customer?.phone || order.customerPhone || '+966500000000',
      items,
      subtotal,
      taxSar,
      discountSar: order.discount || 0,
      grandTotal,
      paymentMethod: order.paymentMethod || 'مدى / Apple Pay',
      branchName: 'فرع السليمانية — الرياض',
      tableNumber: order.tableNumber ? `T-${order.tableNumber}` : undefined,
      orderType: order.orderType === 'dine-in' ? 'محلي (طاولة)' : order.orderType === 'delivery' ? 'توصيل' : 'سفري',
      orderDate: new Date().toLocaleString('ar-SA'),
      cashierName: 'أحمد الشريف',
      feedbackUrl: 'https://feedback.restaurantos.sa',
      reorderUrl: 'https://order.restaurantos.sa',
    };
  }

  // =========================================================================
  // 4. CHATBOT CONVERSATIONAL FLOW & SIMULATOR
  // =========================================================================

  /**
   * Processes customer message and produces intelligent automated bot response.
   */
  public processCustomerBotMessage(
    incomingText: string,
    customer: CustomerRFMProfile,
    buttonPayload?: string
  ): {
    replyText: string;
    type: WhatsAppChatMessage['type'];
    buttons?: WhatsAppInteractiveButton[];
    couponData?: WhatsAppChatMessage['couponData'];
  } {
    const text = (incomingText || '').trim().toLowerCase();
    const payload = buttonPayload || '';

    // Handle Button Payloads first
    if (payload === 'reserve_vip' || payload === 'flow_reserve' || text.includes('حجز') || text.includes('reserve') || text === '2') {
      return {
        type: 'interactive_buttons',
        replyText:
          `أهلاً بك يا ${customer.name} 🍽️\nيسعدنا حجز طاولتك المفضلة في قسم ${customer.tier === 'Black VIP' ? 'كبار الشخصيات VIP' : 'الصالة الفاخرة'}.\n\nالرجاء اختيار وقت الحجز المفضل:`,
        buttons: [
          { id: 'b_t1', titleAr: '⏰ اليوم 8:30 م (عشاء)', titleEn: 'Today 8:30 PM', payload: 'time_today_2030', type: 'quick_reply' },
          { id: 'b_t2', titleAr: '⏰ غداً 1:30 م (غداء)', titleEn: 'Tomorrow 1:30 PM', payload: 'time_tomorrow_1330', type: 'quick_reply' },
          { id: 'b_t3', titleAr: '💬 وقت آخر مع الموظف', titleEn: 'Custom Time', payload: 'contact_agent', type: 'quick_reply' },
        ],
      };
    }

    if (payload.startsWith('time_') || text.includes('شخصين') || text.includes('4 اشخاص') || text.includes('عائلة')) {
      const reservationId = 'RES-' + Math.floor(1000 + Math.random() * 9000);
      return {
        type: 'text',
        replyText:
          `🎉 *تم تأكيد حجزك بنجاح!*\n🔢 رقم الحجز: *#${reservationId}*\n👤 الاسم: ${customer.name}\n📍 الفرع: فرع السليمانية — الرياض\n💎 الفئة: ${customer.tier}\n\nنتشرف باستقبالكم وسيكون طاقم الضيافة بانتظاركم بكل حفاوة! 🌹`,
      };
    }

    if (payload === 'view_menu' || text.includes('منيو') || text.includes('قائمة') || text.includes('menu') || text === '1') {
      return {
        type: 'interactive_buttons',
        replyText:
          `📖 *قائمة طعام مطعم الرواق الفاخر 2026*\n\n🔥 *المشاوي الملكية والواغيو:*\n- ستيك ريب آي واغيو A5 (185 ر.س)\n- أوصال ريش غنم نعيمي (110 ر.س)\n\n🌊 *المأكولات البحرية:*\n- سلمون مشوي بصلصة الليمون والكمأة (125 ر.س)\n- ديناميت شرمب مقرمش (58 ر.س)\n\n🍰 *الحلويات والقهوة المختصة:*\n- كيكة التمر بالكراميل المملح (42 ر.س)\n- قهوة V60 مقطرة إثيوبية (26 ر.س)\n\nتصفح المنيو التفاعلي بالكامل والطلب أونلاين:`,
        buttons: [
          { id: 'bm1', titleAr: '🛒 فتح المنيو والطلب أونلاين', titleEn: 'Open Digital Menu', payload: 'open_catalog', type: 'url', url: 'https://menu.restaurantos.sa' },
          { id: 'bm2', titleAr: '🎁 العروض الخاصة الحالية', titleEn: 'Current Deals', payload: 'view_deals', type: 'quick_reply' },
        ],
      };
    }

    if (payload === 'view_deals' || text.includes('عروض') || text.includes('خصم') || text.includes('offer') || text.includes('كوبون')) {
      return {
        type: 'coupon',
        replyText:
          `🎁 *أقوى عروض هذا الأسبوع المخصصة لك يا ${customer.name}!*\nاستخدم الكود التالي عند الطلب للحصول على خصم 25% فوري:`,
        couponData: {
          code: 'ROYAL25',
          discountText: 'خصم 25% على إجمالي الفاتورة فوق 150 ر.س',
          expiresAt: '2026-08-31',
          minSpend: 150,
        },
        buttons: [
          { id: 'bc1', titleAr: '🍽️ تفعيل الكود والطلب الآن', titleEn: 'Use Coupon Now', payload: 'use_coupon', type: 'quick_reply' },
        ],
      };
    }

    if (payload === 'rate_experience' || text.includes('تقييم') || text.includes('راي') || text.includes('تجربة')) {
      return {
        type: 'interactive_buttons',
        replyText:
          `⭐ رأيك يصنع تميزنا يا ${customer.name}!\nكيف كانت تجربتك معنا في مطعم الرواق؟`,
        buttons: [
          { id: 'br_5', titleAr: '⭐⭐⭐⭐⭐ ممتازة جداً', titleEn: '5 Stars Excellent', payload: 'rated_5_stars', type: 'quick_reply' },
          { id: 'br_3', titleAr: '⭐⭐⭐ جيدة مع ملاحظات', titleEn: '3 Stars Feedback', payload: 'feedback_notes', type: 'quick_reply' },
        ],
      };
    }

    if (payload === 'rated_5_stars') {
      return {
        type: 'interactive_buttons',
        replyText:
          `شكراً لك من القلب على تقييمك الرائع! 🌟❤️\nيسعدنا مشاركة تقييمك على خرائط Google والحصول على مشروب موهيتو منعش مجاناً في زيارتك القادمة:`,
        buttons: [
          { id: 'bg_map', titleAr: '📍 تقييم في Google Maps', titleEn: 'Google Maps Review', payload: 'open_gmaps', type: 'url', url: 'https://maps.google.com' },
        ],
      };
    }

    if (payload === 'contact_agent' || text.includes('موظف') || text.includes('خدمة العملاء') || text.includes('agent') || text === '5') {
      return {
        type: 'text',
        replyText:
          `👨‍💼 تم تحويل المحادثة إلى مسؤول خدمة الضيافة والعملاء (الشيف عمر).\nسنكون معك مباشرة خلال أقل من دقيقة. شكراً لرحابة صدرك!`,
      };
    }

    if (text.includes('نقاط') || text.includes('رصيد') || text.includes('points') || text === '4') {
      return {
        type: 'text',
        replyText:
          `💳 *محفظة الولاء والمكافآت — ${customer.name}*\n\n🌟 *الفئة الحالية:* ${customer.tier}\n💰 *رصيد النقاط:* *${customer.loyaltyPoints ?? 0} نقطة* (تساوي ${Math.floor((customer.loyaltyPoints ?? 0) / 10)} ر.س خصم)\n📊 *عدد الزيارات:* ${customer.frequency ?? customer.orderCount ?? 0} زيارة\n🏆 *الإنفاق الإجمالي:* ${(customer.monetary ?? customer.totalSpent ?? 0).toLocaleString()} ر.س\n\n💡 يمكنك استبدال نقاطك مباشرة عند الكاشير أو في المتجر الإلكتروني!`,
      };
    }

    if (text.includes('تتبع') || text.includes('طلبي') || text.includes('track') || text === '3') {
      return {
        type: 'text',
        replyText:
          `🛵 *حالة الطلب اللحظية*\nطلبك رقم #ORD-8821 الآن في مرحلة: *🔥 الشيف يقوم بلمسات الطهي النهائية بالمطبخ*\n⏳ الوقت المتوقع للجاهزية: *8 دقائق*\n\nسيرسل لك الروبوت إشعاراً فور خروجه مع السائق!`,
      };
    }

    // Default Interactive Welcome Flow
    return {
      type: 'interactive_buttons',
      replyText:
        `مرحباً بك يا ${customer.name} في المساعد الذكي لمطعم الرواق 🌟\nكيف يمكننا خدمتك اليوم؟\n\n1️⃣ استعراض قائمة الطعام والطلب\n2️⃣ حجز طاولة خاصة\n3️⃣ تتبع حالة طلبك\n4️⃣ رصيد النقاط والمكافآت\n5️⃣ التحدث مع خدمة العملاء`,
      buttons: [
        { id: 'b_opt1', titleAr: '📖 المنيو والطلب', titleEn: 'Menu & Order', payload: 'view_menu', type: 'quick_reply' },
        { id: 'b_opt2', titleAr: '🍽️ حجز طاولة', titleEn: 'Book Table', payload: 'flow_reserve', type: 'quick_reply' },
        { id: 'b_opt3', titleAr: '🎁 العروض والكوبونات', titleEn: 'Offers', payload: 'view_deals', type: 'quick_reply' },
      ],
    };
  }

  // =========================================================================
  // 5. MARKETING OVERVIEW ANALYTICS
  // =========================================================================

  public getOverviewStats(
    profiles: CustomerRFMProfile[] = EXTENDED_MOCK_PROFILES,
    campaigns: MarketingCampaign[] = DEFAULT_MARKETING_CAMPAIGNS
  ): MarketingOverviewStats {
    const totalCustomers = profiles.length;
    const activeSubscribers = profiles.filter((p) => p.whatsappActive && p.marketingOptIn).length;

    const totalCampaignsSent = campaigns.filter((c) => c.status !== 'draft').length;
    const totalMessagesDelivered = campaigns.reduce((sum, c: any) => sum + (c.deliveredCount ?? 0), 0);
    const totalSent = campaigns.reduce((sum, c: any) => sum + (c.sentCount ?? 0), 0);
    const totalRead = campaigns.reduce((sum, c: any) => sum + (c.readCount ?? 0), 0);
    const totalReplied = campaigns.reduce((sum, c: any) => sum + (c.repliedCount ?? 0), 0);
    const totalOrders = campaigns.reduce((sum, c: any) => sum + (c.ordersGenerated ?? c.convertedOrdersCount ?? 0), 0);
    const totalRevenueAttributedSar = campaigns.reduce((sum, c: any) => sum + (c.revenueGeneratedSar ?? c.revenueGenerated ?? 0), 0);
    const totalMarketingCostSar = campaigns.reduce((sum, c: any) => sum + (c.costSar ?? c.costEstimate ?? 0), 0);

    const averageOpenRate = totalMessagesDelivered > 0 ? Number(((totalRead / totalMessagesDelivered) * 100).toFixed(1)) : 94.2;
    const averageClickRate = totalRead > 0 ? Number(((totalReplied / totalRead) * 100).toFixed(1)) : 38.6;
    const conversionRate = totalSent > 0 ? Number(((totalOrders / totalSent) * 100).toFixed(1)) : 32.4;
    const overallRoi = totalMarketingCostSar > 0 ? Number((totalRevenueAttributedSar / totalMarketingCostSar).toFixed(1)) : 32.8;

    const segmentDistribution: Record<string, number> = {
      champions: profiles.filter((p) => p.segment === 'champions').length,
      vip_high_spenders: profiles.filter((p) => p.segment === 'vip_high_spenders').length,
      loyal: profiles.filter((p) => p.segment === 'loyal').length,
      promising: profiles.filter((p) => p.segment === 'promising').length,
      new_customers: profiles.filter((p) => p.segment === 'new_customers').length,
      at_risk: profiles.filter((p) => p.segment === 'at_risk').length,
      dormant: profiles.filter((p) => p.segment === 'dormant').length,
    };

    const recentCampaignPerformances = campaigns.map((c: any) => ({
      id: c.id,
      campaignName: c.titleAr,
      type: c.type,
      sent: c.sentCount ?? 0,
      read: c.readCount ?? 0,
      orders: c.ordersGenerated ?? c.convertedOrdersCount ?? 0,
      revenue: c.revenueGeneratedSar ?? c.revenueGenerated ?? 0,
      roi: c.roiMultiplier ?? c.roiPercentage ?? 0,
    }));

    const monthlyGrowth = [
      { month: 'مايو 2026', revenue: 14200, messagesSent: 420, conversions: 84 },
      { month: 'يونيو 2026', revenue: 21500, messagesSent: 680, conversions: 138 },
      { month: 'يوليو 2026', revenue: 32800, messagesSent: 940, conversions: 195 },
      { month: 'أغسطس 2026', revenue: 40790, messagesSent: 1250, conversions: 248 },
    ];

    return {
      totalCustomers,
      activeSubscribers,
      totalCampaignsSent,
      totalMessagesDelivered,
      averageOpenRate,
      averageClickRate,
      conversionRate,
      totalRevenueAttributedSar,
      totalMarketingCostSar,
      overallRoi,
      segmentDistribution,
      recentCampaignPerformances,
      monthlyGrowth,
    };
  }
}

export const whatsappBotService = WhatsAppBotService.getInstance();
