import { create } from 'zustand';
import {
  TenantRestaurant,
  LicenseToken,
  KillSwitchEvent,
  GlobalPlatformStats,
  SubscriptionPlanDef,
  SubscriptionTier,
  BillingCycle,
  TenantStatus,
  PlatformMetricHistory,
} from '../types/superAdmin';
import { createRsa2048LicenseCertificate, generateHardwareUUID } from '../services/licenseEngine';

export const SUBSCRIPTION_PLANS: SubscriptionPlanDef[] = [
  {
    id: 'trial',
    nameAr: 'النسخة التجريبية (Trial)',
    nameEn: 'Free Trial (14 Days)',
    badgeAr: 'مجاني للاختبار',
    badgeEn: '14 Days Free',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    currency: '$',
    descriptionAr: 'تجربة كافة الميزات الأساسية لاختبار الكفاءة والسرعة بالمطعم',
    descriptionEn: 'Full access to core POS and KDS engine for 14 evaluation days',
    maxBranches: 1,
    maxPosTerminals: 1,
    maxKdsScreens: 1,
    features: [
      { nameAr: 'نقطة بيع POS واحدة', nameEn: '1 POS Terminal', included: true },
      { nameAr: 'شاشة مطبخ KDS واحدة', nameEn: '1 KDS Kitchen Screen', included: true },
      { nameAr: 'إدارة الطاولات والقوائم', nameEn: 'Table & Menu Management', included: true },
      { nameAr: 'المساعد الذكي AI Copilot', nameEn: 'AI Copilot Assistant', included: false },
      { nameAr: 'المزامنة متعددة الفروع', nameEn: 'Multi-Branch Cloud Sync', included: false },
      { nameAr: 'نفق Cloudflare مخصص', nameEn: 'Dedicated Cloudflare Tunnel', included: false },
      { nameAr: 'ترخيص RSA-2048 للأوفلاين', nameEn: 'RSA-2048 Offline Licensing', included: false },
    ],
  },
  {
    id: 'starter',
    nameAr: 'خطة البداية (Starter)',
    nameEn: 'Starter Tier',
    badgeAr: 'للمقاهي والفود ترك',
    badgeEn: 'Best for Cafes & Trucks',
    monthlyPrice: 15,
    annualPricePerMonth: 12,
    currency: '$',
    descriptionAr: 'مثالية للمطاعم الفردية، المقاهي، وعربات الطعام بفرع واحد',
    descriptionEn: 'Essential POS powerhouse for single-branch cafes & bistros',
    maxBranches: 1,
    maxPosTerminals: 2,
    maxKdsScreens: 1,
    features: [
      { nameAr: 'فرع واحد مع كاشيرين 2 POS', nameEn: '1 Branch with 2 POS Terminals', included: true },
      { nameAr: 'شاشة مطبخ KDS تفاعلية', nameEn: '1 Interactive KDS Screen', included: true },
      { nameAr: 'المخزون الأساسي ورادار النواقص', nameEn: 'Basic Inventory & Low Stock Radar', included: true },
      { nameAr: 'المزامنة السحابية اللحظية', nameEn: 'Real-time Cloud Sync', included: true },
      { nameAr: 'المساعد الذكي AI Copilot', nameEn: 'AI Copilot Assistant', included: false },
      { nameAr: 'تطبيق الويتر المحمول', nameEn: 'Mobile Waiter POS', included: false },
      { nameAr: 'ترخيص RSA-2048 أوفلاين كامل', nameEn: 'Full RSA-2048 Offline License', included: false },
    ],
  },
  {
    id: 'pro',
    nameAr: 'الخطة الاحترافية (Pro)',
    nameEn: 'Professional Tier',
    badgeAr: 'الأكثر شعبية ونمواً',
    badgeEn: 'Most Popular Choice',
    popular: true,
    monthlyPrice: 39,
    annualPricePerMonth: 31,
    currency: '$',
    descriptionAr: 'الحل الشامل للمطاعم المزدحمة، السلاسل النامية وصالات الضيافة الراقية',
    descriptionEn: 'Complete ecosystem with AI, multi-station KDS, and mobile waiters',
    maxBranches: 3,
    maxPosTerminals: 6,
    maxKdsScreens: 3,
    features: [
      { nameAr: 'حتى 3 فروع و 6 محطات POS', nameEn: 'Up to 3 Branches & 6 POS Terminals', included: true },
      { nameAr: '3 شاشات مطبخ KDS متعددة المحطات', nameEn: '3 Multi-Station KDS Screens', included: true },
      { nameAr: 'المساعد الذكي الفائق AI Copilot 3.5', nameEn: 'AI Copilot 3.5 Assistant', included: true },
      { nameAr: 'تطبيق الويتر المتنقل وإنتركوم الصوت', nameEn: 'Mobile Waiter & Audio Intercom', included: true },
      { nameAr: 'رادار المخزون الذكي والذكاء المالي', nameEn: 'Smart Stock Radar & Financial Intel', included: true },
      { nameAr: 'ترخيص RSA-2048 أوفلاين مشفر', nameEn: 'RSA-2048 Signed Offline License', included: true },
      { nameAr: 'دعم فني ذو أولوية 24/7', nameEn: 'Priority 24/7 VIP Support', included: true },
    ],
  },
  {
    id: 'enterprise',
    nameAr: 'خطة المؤسسات (Enterprise)',
    nameEn: 'Enterprise Tier',
    badgeAr: 'للسلاسل والفرانشايز',
    badgeEn: 'Enterprise & Franchises',
    monthlyPrice: 85,
    annualPricePerMonth: 68,
    currency: '$',
    descriptionAr: 'قوة غير محدودة للسلاسل الكبرى، التخصيص الكامل، ومفاتيح التشفير العسكرية',
    descriptionEn: 'Unlimited scale, custom domains, White-label & Dedicated Cloudflare Cluster',
    maxBranches: 'unlimited',
    maxPosTerminals: 'unlimited',
    maxKdsScreens: 'unlimited',
    features: [
      { nameAr: 'فروع وكاشيرات وشاشات KDS غير محدودة', nameEn: 'Unlimited Branches, POS & KDS', included: true },
      { nameAr: 'مولد تراخيص RSA-2048 مخصص للأجهزة', nameEn: 'Custom RSA-2048 Hardware-Bound Lic', included: true },
      { nameAr: 'مفتاح الإيقاف الفوري عن بعد Remote Kill Switch', nameEn: 'Remote Instant Kill Switch Defense', included: true },
      { nameAr: 'نفق Cloudflare Zero-Trust ونطاق مخصص', nameEn: 'Dedicated Cloudflare Zero-Trust Tunnel', included: true },
      { nameAr: 'تطبيق كشك الطلب الذاتي Kiosk والمتجر', nameEn: 'Self-Ordering Kiosk & Online Store', included: true },
      { nameAr: 'هندسة الفوترة ZATCA والضرائب الدولية', nameEn: 'ZATCA Phase 2 & Tax Compliance', included: true },
      { nameAr: 'مدير حساب تقني مخصص وSLA 99.99%', nameEn: 'Dedicated Technical TAM & 99.99% SLA', included: true },
    ],
  },
];

const INITIAL_TENANTS: TenantRestaurant[] = [
  {
    id: 'tnt_001',
    nameAr: 'لورا لاونج آند ستيك هاوس',
    nameEn: "L'Aura Gourmet Lounge & Steakhouse",
    slug: 'laura-gourmet',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80',
    ownerName: 'المهندس ريان الشناوي',
    ownerEmail: 'rayan@lauragourmet.eg',
    ownerPhone: '+20 10 1234 5678',
    city: 'القاهرة (المعادي)',
    country: 'مصر',
    currency: 'EGP',
    plan: 'enterprise',
    billingCycle: 'annually',
    monthlyFee: 85,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 3,
    maxBranches: 999,
    posTerminalsCount: 8,
    maxPosTerminals: 999,
    kdsScreensCount: 4,
    maxKdsScreens: 999,
    joinedDate: '2025-06-15',
    renewalDate: '2027-06-15',
    totalGrossSales: 1845200,
    totalOrdersCount: 24390,
    avgTicket: 145.2,
    licenseKey: 'RESTOS-V2-ENTERPRISE-8B4F-29E1-AA04',
    hardwareFingerprint: 'A49F-22C1-8890-E03B',
    dbCluster: 'cluster-cairo-01.aws',
    cloudflareTunnelId: 'cf-tun-laura-9481',
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: true,
      onlineStore: true,
      intercomAudio: true,
      customBranding: true,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: true,
    },
    notes: 'عميل مؤسسي VIP - تم تفعيل كامل مزايا التشفير والسحابة الخاصة',
  },
  {
    id: 'tnt_002',
    nameAr: 'سلطان برجر آند سموكد ميتس',
    nameEn: 'Sultan Smoked Meats & Burgers',
    slug: 'sultan-burger',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80',
    ownerName: 'أحمد سلطان الحجازي',
    ownerEmail: 'ahmed@sultanburger.eg',
    ownerPhone: '+20 12 9876 5432',
    city: 'الإسكندرية',
    country: 'مصر',
    currency: 'EGP',
    plan: 'pro',
    billingCycle: 'monthly',
    monthlyFee: 39,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 2,
    maxBranches: 3,
    posTerminalsCount: 4,
    maxPosTerminals: 6,
    kdsScreensCount: 2,
    maxKdsScreens: 3,
    joinedDate: '2025-10-01',
    renewalDate: '2026-09-01',
    totalGrossSales: 792400,
    totalOrdersCount: 16800,
    avgTicket: 68.5,
    licenseKey: 'RESTOS-V2-PRO-3D19-FF82-66C0',
    hardwareFingerprint: '7721-BC44-90AE-12FE',
    dbCluster: 'cluster-alex-01.aws',
    cloudflareTunnelId: 'cf-tun-sultan-1029',
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: false,
      onlineStore: true,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: false,
    },
    notes: 'أداء مبيعات ممتاز في فرع سان ستيفانو مع نمو شهري +18%',
  },
  {
    id: 'tnt_003',
    nameAr: 'مقهى ومخبوزات الأوبرا الفاخرة',
    nameEn: "Café de l'Opéra & Artisan Bakery",
    slug: 'opera-bakery',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
    ownerName: 'نورة بنت عبدالله',
    ownerEmail: 'noura@operacafe.eg',
    ownerPhone: '+20 11 3321 1100',
    city: 'القاهرة الجديدة (التجمع الخامس)',
    country: 'مصر',
    currency: 'EGP',
    plan: 'pro',
    billingCycle: 'annually',
    monthlyFee: 39,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 1,
    maxBranches: 3,
    posTerminalsCount: 3,
    maxPosTerminals: 6,
    kdsScreensCount: 2,
    maxKdsScreens: 3,
    joinedDate: '2026-01-10',
    renewalDate: '2027-01-10',
    totalGrossSales: 489300,
    totalOrdersCount: 9400,
    avgTicket: 52.0,
    licenseKey: 'RESTOS-V2-PRO-998A-E3C1-4B71',
    hardwareFingerprint: '3B10-EE89-2241-A891',
    dbCluster: 'cluster-cairo-02.aws',
    cloudflareTunnelId: 'cf-tun-opera-8831',
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: false,
      onlineStore: true,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: false,
    },
    notes: 'متخصص في القهوة المختصة والمخبوزات الفرنسية الفاخرة',
  },
  {
    id: 'tnt_004',
    nameAr: 'فاير آند وود نابوليتان بيتزا',
    nameEn: 'Fire & Wood Neapolitan Pizza',
    slug: 'fire-wood-pizza',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=80',
    ownerName: 'كريم المنصوري',
    ownerEmail: 'karim@firewoodpizza.eg',
    ownerPhone: '+20 15 8894 4433',
    city: 'الشيخ زايد (6 أكتوبر)',
    country: 'مصر',
    currency: 'EGP',
    plan: 'starter',
    billingCycle: 'monthly',
    monthlyFee: 15,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 1,
    maxBranches: 1,
    posTerminalsCount: 2,
    maxPosTerminals: 2,
    kdsScreensCount: 1,
    maxKdsScreens: 1,
    joinedDate: '2026-03-01',
    renewalDate: '2026-09-01',
    totalGrossSales: 215000,
    totalOrdersCount: 4200,
    avgTicket: 85.0,
    licenseKey: 'RESTOS-V2-STARTER-1A2B-3C4D-5E6F',
    hardwareFingerprint: '99CC-11AA-44BB-88DD',
    dbCluster: 'cluster-zayed-01.aws',
    cloudflareTunnelId: 'cf-tun-firewood-4401',
    features: {
      aiCopilot: false,
      multiBranchSync: false,
      kioskMode: false,
      onlineStore: false,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: false,
      customDomain: false,
    },
    notes: 'فرع الشيخ زايد — يفكر في الترقية إلى باقة Pro لإضافة فرع الزمالك',
  },
  {
    id: 'tnt_005',
    nameAr: 'سلسلة مطابخ الباشا الشامية',
    nameEn: 'Al-Basha Levant Kitchen & Grills',
    slug: 'albasha-levant',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
    ownerName: 'فراس كمال الشامي',
    ownerEmail: 'firas@albasharest.eg',
    ownerPhone: '+20 10 7778 8899',
    city: 'مصر الجديدة (الكوربة)',
    country: 'مصر',
    currency: 'EGP',
    plan: 'enterprise',
    billingCycle: 'annually',
    monthlyFee: 85,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 4,
    maxBranches: 999,
    posTerminalsCount: 14,
    maxPosTerminals: 999,
    kdsScreensCount: 6,
    maxKdsScreens: 999,
    joinedDate: '2025-04-12',
    renewalDate: '2027-04-12',
    totalGrossSales: 2340000,
    totalOrdersCount: 38900,
    avgTicket: 110.0,
    licenseKey: 'RESTOS-V2-ENTERPRISE-F7A1-884C-99E2',
    hardwareFingerprint: 'EE41-88FA-1109-77BC',
    dbCluster: 'cluster-heliopolis-01.aws',
    cloudflareTunnelId: 'cf-tun-albasha-5521',
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: true,
      onlineStore: true,
      intercomAudio: true,
      customBranding: true,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: true,
    },
    notes: 'سلسلة مشاوي كبرى مع 4 فروع بالقاهرة والإسكندرية',
  },
  {
    id: 'tnt_006',
    nameAr: 'ماتشا بار آند كوفي سبيشالتي',
    nameEn: 'Matcha & Co Specialty Bar',
    slug: 'matcha-co',
    logo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=120&auto=format&fit=crop&q=80',
    ownerName: 'جاسم الكواري',
    ownerEmail: 'jassim@matchaco.qa',
    ownerPhone: '+974 55 112 233',
    city: 'الدوحة',
    country: 'دولة قطر',
    currency: 'QAR',
    plan: 'starter',
    billingCycle: 'monthly',
    monthlyFee: 15,
    paymentStatus: 'paid',
    status: 'active',
    branchesCount: 1,
    maxBranches: 1,
    posTerminalsCount: 2,
    maxPosTerminals: 2,
    kdsScreensCount: 1,
    maxKdsScreens: 1,
    joinedDate: '2026-05-01',
    renewalDate: '2026-09-01',
    totalGrossSales: 142000,
    totalOrdersCount: 3800,
    avgTicket: 42.0,
    licenseKey: 'RESTOS-V2-STARTER-44AA-9988-BB11',
    hardwareFingerprint: '11AA-55FF-99EE-33CC',
    dbCluster: 'cluster-doha-01.aws',
    cloudflareTunnelId: 'cf-tun-matcha-9912',
    features: {
      aiCopilot: false,
      multiBranchSync: false,
      kioskMode: false,
      onlineStore: false,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: false,
      customDomain: false,
    },
    notes: 'مقهى لؤلؤة قطر — مشروبات الماتشا والمخبوزات العضوية',
  },
  {
    id: 'tnt_007',
    nameAr: 'ووك آند رول إيست فيوجن',
    nameEn: 'Wok & Roll Asian Fusion',
    slug: 'wok-and-roll',
    logo: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=120&auto=format&fit=crop&q=80',
    ownerName: 'فهد العتيقي',
    ownerEmail: 'fahad@wokroll.kw',
    ownerPhone: '+965 99 881 122',
    city: 'مدينة الكويت',
    country: 'دولة الكويت',
    currency: 'KWD',
    plan: 'trial',
    billingCycle: 'monthly',
    monthlyFee: 0,
    paymentStatus: 'pending',
    status: 'trial',
    branchesCount: 1,
    maxBranches: 1,
    posTerminalsCount: 1,
    maxPosTerminals: 1,
    kdsScreensCount: 1,
    maxKdsScreens: 1,
    joinedDate: '2026-08-05',
    renewalDate: '2026-08-19',
    totalGrossSales: 48000,
    totalOrdersCount: 950,
    avgTicket: 9.5,
    licenseKey: 'RESTOS-V2-TRIAL-88E1-22C4-AA99',
    hardwareFingerprint: '77FF-22AA-88BB-99CC',
    dbCluster: 'cluster-kuwait-01.aws',
    cloudflareTunnelId: 'cf-tun-wokroll-3301',
    features: {
      aiCopilot: false,
      multiBranchSync: false,
      kioskMode: false,
      onlineStore: false,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: false,
      customDomain: false,
    },
    notes: 'تجربة مجانية متبقي عليها 5 أيام — مهتم بالترقية إلى Pro',
  },
  {
    id: 'tnt_008',
    nameAr: 'ذا روست هاوس جريل آند برجر',
    nameEn: 'The Roast House Grill',
    slug: 'roast-house',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80',
    ownerName: 'عبدالعزيز القحطاني',
    ownerEmail: 'aziz@roasthouse.sa',
    ownerPhone: '+966 56 441 9922',
    city: 'الرياض',
    country: 'المملكة العربية السعودية',
    currency: 'SAR',
    plan: 'pro',
    billingCycle: 'monthly',
    monthlyFee: 39,
    paymentStatus: 'overdue',
    status: 'suspended',
    branchesCount: 2,
    maxBranches: 3,
    posTerminalsCount: 4,
    maxPosTerminals: 6,
    kdsScreensCount: 2,
    maxKdsScreens: 3,
    joinedDate: '2025-11-20',
    renewalDate: '2026-08-01',
    totalGrossSales: 540000,
    totalOrdersCount: 11200,
    avgTicket: 62.0,
    licenseKey: 'RESTOS-V2-PRO-77CC-9900-1122',
    hardwareFingerprint: '44AA-88FF-00EE-22DD',
    dbCluster: 'cluster-riyadh-03.aws',
    cloudflareTunnelId: 'cf-tun-roast-1192',
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: false,
      onlineStore: true,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: false,
    },
    notes: 'تم تعليق الخدمة مؤقتاً لتأخر سداد الفاتورة الشهرية لمدة 14 يوماً',
  },
];

const INITIAL_METRIC_HISTORY: PlatformMetricHistory[] = [
  { date: '08/08', grossSales: 82400, ordersCount: 1420, mrr: 1980, activeTenants: 8 },
  { date: '08/09', grossSales: 89600, ordersCount: 1530, mrr: 1980, activeTenants: 8 },
  { date: '08/10', grossSales: 74200, ordersCount: 1290, mrr: 2020, activeTenants: 8 },
  { date: '08/11', grossSales: 96500, ordersCount: 1680, mrr: 2020, activeTenants: 8 },
  { date: '08/12', grossSales: 112000, ordersCount: 1940, mrr: 2150, activeTenants: 8 },
  { date: '08/13', grossSales: 135400, ordersCount: 2310, mrr: 2150, activeTenants: 8 },
  { date: '08/14', grossSales: 148900, ordersCount: 2540, mrr: 2240, activeTenants: 8 },
];

const INITIAL_KILL_LOGS: KillSwitchEvent[] = [
  {
    id: 'klog_001',
    tenantId: 'tnt_008',
    tenantName: 'The Roast House Grill (ذا روست هاوس)',
    triggeredAt: '2026-08-10T14:30:00Z',
    triggeredBy: 'SuperAdmin Root (Chief SecOps)',
    reason: 'Payment delinquency grace period expired (14 days past due date). Terminals put into read-only checkout lock.',
    action: 'kill',
    status: 'executed',
    impactedTerminals: 6,
  },
];

interface SuperAdminState {
  tenants: TenantRestaurant[];
  licenses: LicenseToken[];
  killSwitchLogs: KillSwitchEvent[];
  metricHistory: PlatformMetricHistory[];
  globalEmergencyLock: boolean;
  emergencyLockReason: string;
  selectedTenantId: string | null;
  searchQuery: string;
  planFilter: SubscriptionTier | 'all';
  statusFilter: TenantStatus | 'all';
  activeTab: 'overview' | 'tenants' | 'plans' | 'licenses' | 'killswitch';

  // Actions
  setActiveTab: (tab: 'overview' | 'tenants' | 'plans' | 'licenses' | 'killswitch') => void;
  setSelectedTenantId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setPlanFilter: (plan: SubscriptionTier | 'all') => void;
  setStatusFilter: (status: TenantStatus | 'all') => void;

  // Tenant Management
  addTenant: (tenant: Omit<TenantRestaurant, 'id' | 'totalGrossSales' | 'totalOrdersCount' | 'avgTicket'>) => TenantRestaurant;
  updateTenant: (id: string, updates: Partial<TenantRestaurant>) => void;
  setTenantStatus: (id: string, status: TenantStatus, reason?: string) => void;
  deleteTenant: (id: string) => void;

  // Subscription Engine
  changeSubscriptionPlan: (tenantId: string, plan: SubscriptionTier, billingCycle: BillingCycle) => void;
  updatePaymentStatus: (tenantId: string, status: TenantRestaurant['paymentStatus']) => void;

  // RSA-2048 Licensing Engine
  generateLicenseForTenant: (
    tenantId: string,
    options: {
      durationDays: number;
      hardwareUUID?: string;
      maxBranches?: number;
      maxTerminals?: number;
      tier?: SubscriptionTier;
    }
  ) => { licenseToken: LicenseToken; pemCertificate: string };
  revokeLicense: (licenseKey: string, reason: string) => void;

  // Remote Kill Switch Engine
  triggerRemoteKillSwitch: (tenantId: string, reason: string, adminName?: string) => void;
  reactivateTenant: (tenantId: string) => void;
  triggerGlobalEmergencyLock: (reason: string, passcode: string) => boolean;
  releaseGlobalEmergencyLock: (passcode: string) => boolean;

  // Platform Analytics
  getPlatformStats: () => GlobalPlatformStats;
}

const STORAGE_KEY = 'restaurant_os_superadmin_state_v2';

function loadSavedState(): Partial<SuperAdminState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse saved SuperAdmin state:', e);
  }
  return null;
}

function persistState(state: {
  tenants: TenantRestaurant[];
  licenses: LicenseToken[];
  killSwitchLogs: KillSwitchEvent[];
  globalEmergencyLock: boolean;
  emergencyLockReason: string;
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist SuperAdmin state:', e);
  }
}

const saved = loadSavedState();

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  tenants: saved?.tenants || INITIAL_TENANTS,
  licenses: saved?.licenses || [],
  killSwitchLogs: saved?.killSwitchLogs || INITIAL_KILL_LOGS,
  metricHistory: INITIAL_METRIC_HISTORY,
  globalEmergencyLock: saved?.globalEmergencyLock || false,
  emergencyLockReason: saved?.emergencyLockReason || '',
  selectedTenantId: null,
  searchQuery: '',
  planFilter: 'all',
  statusFilter: 'all',
  activeTab: 'overview',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedTenantId: (id) => set({ selectedTenantId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPlanFilter: (planFilter) => set({ planFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  addTenant: (tenantData) => {
    const newId = 'tnt_' + Math.random().toString(36).substring(2, 8);
    const hwUUID = generateHardwareUUID();
    const newTenant: TenantRestaurant = {
      ...tenantData,
      id: newId,
      hardwareFingerprint: hwUUID,
      totalGrossSales: 0,
      totalOrdersCount: 0,
      avgTicket: 0,
    };

    // Auto-generate initial RSA-2048 certificate
    const { licenseToken } = createRsa2048LicenseCertificate({
      tenant: newTenant,
      tier: newTenant.plan,
      durationDays: newTenant.plan === 'trial' ? 14 : 365,
      hardwareUUID: hwUUID,
    });

    newTenant.licenseKey = licenseToken.licenseKey;

    const nextTenants = [newTenant, ...get().tenants];
    const nextLicenses = [licenseToken, ...get().licenses];

    set({ tenants: nextTenants, licenses: nextLicenses });
    persistState({
      tenants: nextTenants,
      licenses: nextLicenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });

    return newTenant;
  },

  updateTenant: (id, updates) => {
    const nextTenants = get().tenants.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tenants: nextTenants });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  setTenantStatus: (id, status, reason) => {
    const nextTenants = get().tenants.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status,
          killReason: reason || t.killReason,
          killedAt: status === 'killed' || status === 'suspended' ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    set({ tenants: nextTenants });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  deleteTenant: (id) => {
    const nextTenants = get().tenants.filter((t) => t.id !== id);
    set({ tenants: nextTenants, selectedTenantId: null });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  changeSubscriptionPlan: (tenantId, plan, billingCycle) => {
    const planDef = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
    const fee = billingCycle === 'annually' ? (planDef?.annualPricePerMonth ?? 0) : (planDef?.monthlyPrice ?? 0);

    const nextTenants = get().tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          plan,
          billingCycle,
          monthlyFee: fee,
          maxBranches: planDef?.maxBranches === 'unlimited' ? 999 : (planDef?.maxBranches ?? 1),
          maxPosTerminals: planDef?.maxPosTerminals === 'unlimited' ? 999 : (planDef?.maxPosTerminals ?? 2),
          maxKdsScreens: planDef?.maxKdsScreens === 'unlimited' ? 999 : (planDef?.maxKdsScreens ?? 1),
          features: {
            ...t.features,
            aiCopilot: plan === 'pro' || plan === 'enterprise',
            multiBranchSync: plan === 'pro' || plan === 'enterprise',
            kioskMode: plan === 'enterprise',
            customBranding: plan === 'enterprise',
            customDomain: plan === 'enterprise',
          },
        };
      }
      return t;
    });

    set({ tenants: nextTenants });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  updatePaymentStatus: (tenantId, status) => {
    const nextTenants = get().tenants.map((t) => (t.id === tenantId ? { ...t, paymentStatus: status } : t));
    set({ tenants: nextTenants });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  generateLicenseForTenant: (tenantId, options) => {
    const tenant = get().tenants.find((t) => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const tier = options.tier || tenant.plan;
    const { licenseToken, pemCertificate } = createRsa2048LicenseCertificate({
      tenant,
      tier,
      durationDays: options.durationDays,
      hardwareUUID: options.hardwareUUID || tenant.hardwareFingerprint,
      maxBranches: options.maxBranches,
      maxTerminals: options.maxTerminals,
    });

    const nextLicenses = [licenseToken, ...get().licenses.filter((l) => l.tenantId !== tenantId)];
    const nextTenants = get().tenants.map((t) =>
      t.id === tenantId ? { ...t, licenseKey: licenseToken.licenseKey } : t
    );

    set({ licenses: nextLicenses, tenants: nextTenants });
    persistState({
      tenants: nextTenants,
      licenses: nextLicenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });

    return { licenseToken, pemCertificate };
  },

  revokeLicense: (licenseKey, reason) => {
    const nextLicenses = get().licenses.map((l) =>
      l.licenseKey === licenseKey ? { ...l, isRevoked: true, status: 'revoked' as const, revocationReason: reason } : l
    );
    set({ licenses: nextLicenses });
    persistState({
      tenants: get().tenants,
      licenses: nextLicenses,
      killSwitchLogs: get().killSwitchLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  triggerRemoteKillSwitch: (tenantId, reason, adminName = 'SuperAdmin Root') => {
    const tenant = get().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const killEvent: KillSwitchEvent = {
      id: 'klog_' + Math.random().toString(36).substring(2, 8),
      tenantId,
      tenantName: `${tenant.nameAr} (${tenant.nameEn})`,
      triggeredAt: new Date().toISOString(),
      triggeredBy: adminName,
      reason,
      action: 'kill',
      status: 'executed',
      impactedTerminals: tenant.posTerminalsCount + tenant.kdsScreensCount,
    };

    const nextTenants = get().tenants.map((t) =>
      t.id === tenantId
        ? {
            ...t,
            status: 'killed' as const,
            killReason: reason,
            killedAt: new Date().toISOString(),
          }
        : t
    );

    const nextLicenses = get().licenses.map((l) =>
      l.tenantId === tenantId
        ? {
            ...l,
            isRevoked: true,
            status: 'revoked' as const,
            revocationReason: `REMOTE KILL SWITCH: ${reason}`,
          }
        : l
    );

    const nextLogs = [killEvent, ...get().killSwitchLogs];

    set({ tenants: nextTenants, licenses: nextLicenses, killSwitchLogs: nextLogs });
    persistState({
      tenants: nextTenants,
      licenses: nextLicenses,
      killSwitchLogs: nextLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  reactivateTenant: (tenantId) => {
    const tenant = get().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const reviveEvent: KillSwitchEvent = {
      id: 'klog_' + Math.random().toString(36).substring(2, 8),
      tenantId,
      tenantName: `${tenant.nameAr} (${tenant.nameEn})`,
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'SuperAdmin Root',
      reason: 'Reactivation verified. Terminals reinstated to full operational status.',
      action: 'revive',
      status: 'executed',
      impactedTerminals: tenant.posTerminalsCount + tenant.kdsScreensCount,
    };

    const nextTenants = get().tenants.map((t) =>
      t.id === tenantId
        ? {
            ...t,
            status: 'active' as const,
            killReason: undefined,
            killedAt: undefined,
          }
        : t
    );

    const nextLogs = [reviveEvent, ...get().killSwitchLogs];

    set({ tenants: nextTenants, killSwitchLogs: nextLogs });
    persistState({
      tenants: nextTenants,
      licenses: get().licenses,
      killSwitchLogs: nextLogs,
      globalEmergencyLock: get().globalEmergencyLock,
      emergencyLockReason: get().emergencyLockReason,
    });
  },

  triggerGlobalEmergencyLock: (reason, passcode) => {
    if (passcode !== 'KILL-ALL-ROOT-99' && passcode !== '9999') {
      return false;
    }

    const nextLogs = [
      {
        id: 'klog_global_' + Date.now(),
        tenantId: 'GLOBAL_PLATFORM',
        tenantName: 'ALL TENANTS & BRANCHES (System-Wide)',
        triggeredAt: new Date().toISOString(),
        triggeredBy: 'SuperAdmin Root (EMERGENCY OVERRIDE)',
        reason: `GLOBAL SYSTEM-WIDE EMERGENCY LOCKDOWN: ${reason}`,
        action: 'emergency_purge' as const,
        status: 'executed' as const,
        impactedTerminals: 999,
      },
      ...get().killSwitchLogs,
    ];

    set({
      globalEmergencyLock: true,
      emergencyLockReason: reason,
      killSwitchLogs: nextLogs,
    });

    persistState({
      tenants: get().tenants,
      licenses: get().licenses,
      killSwitchLogs: nextLogs,
      globalEmergencyLock: true,
      emergencyLockReason: reason,
    });

    return true;
  },

  releaseGlobalEmergencyLock: (passcode) => {
    if (passcode !== 'KILL-ALL-ROOT-99' && passcode !== '9999') {
      return false;
    }

    const nextLogs = [
      {
        id: 'klog_global_restore_' + Date.now(),
        tenantId: 'GLOBAL_PLATFORM',
        tenantName: 'ALL TENANTS & BRANCHES (System-Wide)',
        triggeredAt: new Date().toISOString(),
        triggeredBy: 'SuperAdmin Root',
        reason: 'GLOBAL SYSTEM-WIDE EMERGENCY LOCKDOWN RELEASED. Normal operations resumed.',
        action: 'revive' as const,
        status: 'executed' as const,
        impactedTerminals: 999,
      },
      ...get().killSwitchLogs,
    ];

    set({
      globalEmergencyLock: false,
      emergencyLockReason: '',
      killSwitchLogs: nextLogs,
    });

    persistState({
      tenants: get().tenants,
      licenses: get().licenses,
      killSwitchLogs: nextLogs,
      globalEmergencyLock: false,
      emergencyLockReason: '',
    });

    return true;
  },

  getPlatformStats: () => {
    const { tenants, globalEmergencyLock, emergencyLockReason } = get();
    const activeTenants = tenants.filter((t) => t.status === 'active').length;

    const totalMRR = tenants.reduce((acc, t) => {
      if (t.status === 'active' || t.status === 'trial') {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === t.plan);
        return acc + (t.billingCycle === 'annually' ? (plan?.annualPricePerMonth ?? 0) : (plan?.monthlyPrice ?? 0));
      }
      return acc;
    }, 0);

    const totalARR = totalMRR * 12;
    const platformGrossSalesToday = 148900;
    const platformOrdersToday = 2540;

    const totalBranchesActive = tenants.reduce((acc, t) => acc + (t.status === 'active' ? t.branchesCount : 0), 0);
    const totalTerminalsActive = tenants.reduce(
      (acc, t) => acc + (t.status === 'active' ? t.posTerminalsCount + t.kdsScreensCount : 0),
      0
    );

    const licenseRevocations = tenants.filter((t) => t.status === 'killed' || t.status === 'suspended').length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      totalMRR,
      totalARR,
      platformGrossSalesToday,
      platformOrdersToday,
      totalTerminalsActive,
      totalBranchesActive,
      licenseRevocations,
      globalEmergencyLockActive: globalEmergencyLock,
      emergencyLockReason,
      systemHealth: {
        apiLatencyMs: 14,
        dbHealth: 'optimal',
        tunnelStatus: 'active',
        activeSyncNodes: 48,
        serverUptime: '99.99%',
      },
    };
  },
}));
