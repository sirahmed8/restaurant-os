/**
 * =====================================================================
 * RESTAURANT OS — INTERACTIVE 16-MODULE GUIDED TOUR MODAL
 * =====================================================================
 * 1-Click visual interactive walkthrough covering all 16 enterprise modules:
 * 1. POS (نقاط البيع السريعة)
 * 2. Floor Plan (مخطط الصالة ورادار الطاولات 2D)
 * 3. KDS & Smart Course Pacing (شاشة المطبخ ومزامنة الطهي)
 * 4. Delivery Hub (مجمع تطبيقات التوصيل)
 * 5. Waiter POS (تطبيق النادل المحمول)
 * 6. Kiosk (كشك الخدمة الذاتية)
 * 7. Online Store (متجر الطلب المباشر)
 * 8. Intercom (الإنتركوم وتواصل الطاقم اللاسلكي)
 * 9. Inventory & Costing (المخزون والوصفات وهدر الطعام)
 * 10. Staff & Shifts (الموظفون والحضور والورديات)
 * 11. Customers & Loyalty (العملاء ونادي الولاء VIP)
 * 12. Reports & ZATCA (التقارير المالية والضريبية)
 * 13. AI Copilot (المساعد الذكي ومصفوفة BCG)
 * 14. Settings & Printers (الإعدادات وطابعات ESC/POS)
 * 15. Super Admin (الإدارة المركزية للفروع)
 * 16. Security Shield (درع الحماية وبصمة العتاد DNA)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Celebration loads on demand — keeps canvas-confetti out of the modal chunk.
function burstConfetti(opts: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number }; colors?: string[] }): void {
  import('canvas-confetti')
    .then(({ default: fire }) => fire(opts))
    .catch(() => {});
}
import {
  LayoutGrid,
  Map,
  ChefHat,
  Truck,
  Smartphone,
  Laptop,
  Globe,
  Radio,
  Boxes,
  Users,
  Sparkles,
  TrendingUp,
  Bot,
  Settings,
  ShieldCheck,
  Shield,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Flame,
  Award,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { AppModule } from '../../types';
import { Button } from './Button';
import { Badge } from './Badge';

export interface TourStep {
  id: AppModule;
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: React.ElementType;
  gradient: string;
  badge: string;
  badgeColor: string;
  roleAr: string;
  roleEn: string;
  hotkey?: string;
  featuresAr: string[];
  featuresEn: string[];
  highlightMetricAr?: string;
  highlightMetricEn?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'pos',
    stepNumber: 1,
    titleAr: 'نقاط البيع والكاشير السريع',
    titleEn: 'Point of Sale (POS)',
    subtitleAr: 'سلة طلبات ذكية، ضريبة 15%، فواتير إلكترونية فورية وطرق دفع متعددة',
    subtitleEn: 'High-speed cashier cart, 15% VAT, instant ZATCA QR receipts & split bills',
    descriptionAr: 'واجهة بيع فائقة السرعة مصممة لخدمة مئات العملاء في ساعات الذروة بدون أي تأخير، تدعم الباركود والوجبات التجميعية والخصومات الفورية.',
    descriptionEn: 'Ultra-fast checkout interface designed for high-volume peak hours with instant modifier popups, barcode scanning, and multi-currency payment.',
    icon: LayoutGrid,
    gradient: 'from-amber-500 to-yellow-500',
    badge: 'Core POS',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    roleAr: 'الكاشير والمحاسبين',
    roleEn: 'Cashiers & Baristas',
    hotkey: 'Ctrl + 1',
    featuresAr: [
      'فواتير ضريبية مبسطة معتمدة من هيئة الزكاة والضريبة (ZATCA Phase 2)',
      'تعديل المكونات والخيارات الإضافية بلمسة واحدة (Modifiers Engine)',
      'تقسيم الفاتورة على عدة ضيوف أو طرق دفع مختلفة (Split Payment)',
      'وضع غير متصل بالإنترنت (Offline First) مع مزامنة خلفية تلقائية'
    ],
    featuresEn: [
      'Compliant ZATCA e-invoicing with instant Phase 2 QR codes',
      'One-tap meal modifiers, extra toppings, and custom notes',
      'Split bill across multiple guests or payment methods (Cash, Card, Points)',
      'Resilient Offline-First architecture with background auto-sync'
    ],
    highlightMetricAr: '0.4 ثانية زمن إنشاء الطلب',
    highlightMetricEn: '0.4s Checkout Speed',
  },
  {
    id: 'floorplan',
    stepNumber: 2,
    titleAr: 'مخطط الصالة ورادار الطاولات',
    titleEn: '2D Visual Floor Plan & Radar',
    subtitleAr: 'مصمم صالة تفاعلي، تتبع حالة الطاولات في الزمن الحقيقي ونظام حجوزات',
    subtitleEn: 'Interactive 2D floor designer, real-time table radar & guest reservations',
    descriptionAr: 'تحكم كامل في أقسام الصالة (VIP، العائلات، التراس، الصالة الرئيسية)، مع إمكانية دمج ونقل الطاولات وتنبيهات طلب الحساب والتنظيف.',
    descriptionEn: 'Interactive table management across multiple sections (VIP, Terrace, Family) with live status tracking, table merging, and waitlist management.',
    icon: Map,
    gradient: 'from-emerald-500 to-teal-500',
    badge: '2D Live Radar',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    roleAr: 'مدراء الصالة والمضيفين (Host)',
    roleEn: 'Floor Managers & Hosts',
    hotkey: 'Ctrl + 2',
    featuresAr: [
      'مصمم طاولات 2D بالسحب والإفلات وتخصيص الأشكال والأبعاد',
      'رادار مرئي لحالات الطاولات (شاغرة، مشغولة، تطلب الحساب، قيد التنظيف)',
      'نقل الطلبات بين الطاولات أو دمج طاولتين بحركة واحدة',
      'حجوزات مسبقة مرتبطة برقم هاتف العميل وعدد الضيوف'
    ],
    featuresEn: [
      'Drag & drop 2D floor designer with custom shapes and capacities',
      'Live visual status radar (Available, Occupied, Billing, Cleaning)',
      'One-tap table transfer, split orders, and table merging',
      'Integrated guest reservation engine with SMS reminders'
    ],
    highlightMetricAr: 'تحديث فوري كل 100 ملي ثانية',
    highlightMetricEn: '100ms Live Refresh',
  },
  {
    id: 'kds',
    stepNumber: 3,
    titleAr: 'شاشة المطبخ ومزامنة الطهي (KDS)',
    titleEn: 'Kitchen Display & Smart Pacing (KDS)',
    subtitleAr: 'خوارزمية Course Pacing لخروج الأطباق ساخنة معاً وكاشف اختناق المحطات',
    subtitleEn: 'Course Pacing synchronization engine & automated station bottleneck alerts',
    descriptionAr: 'شاشة مطبخ رقمية تنظم المحطات (الشواء، القلي، المخبوزات، السلطات)، وتضمن خروج الستيك الطويل والبطاطس السريعة ساخنة في نفس اللحظة.',
    descriptionEn: 'Multi-station kitchen management that coordinates cooking times so multi-item tickets finish hot together, with automated bottleneck alarms.',
    icon: ChefHat,
    gradient: 'from-rose-500 to-orange-500',
    badge: 'Smart Pacing',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    roleAr: 'رئيس الطهاة والشيفات',
    roleEn: 'Executive Chefs & Line Cooks',
    hotkey: 'Ctrl + 3',
    featuresAr: [
      'خوارزمية مزامنة الطهي (Course Pacing) لحساب أوقات التأخير بدقة',
      'كاشف اختناق المحطات وتنبيهات إنتركوم فورية عند تجاوز 20 دقيقة',
      'تصفية حسب المحطة (شواء، قلاية، مخبوزات، مشروبات، مطبخ رئيسي)',
      'مذيع صوتي ذكي (TTS) ينطق رقم الطلب والطاولة عند الجاهزية'
    ],
    featuresEn: [
      'Course Pacing algorithm synchronizing steaks and fast sides to exit together',
      'Automated station bottleneck detection with instant >20m intercom alerts',
      'Station-specific filtering (Grill, Fryer, Bakery, Cold prep, Assembly)',
      'Bilingual Voice Announcer (TTS) calling order numbers upon completion'
    ],
    highlightMetricAr: 'مزامنة 100% لخروج الأطباق',
    highlightMetricEn: 'Zero Plating Time Gap',
  },
  {
    id: 'delivery',
    stepNumber: 4,
    titleAr: 'مجمع تطبيقات التوصيل (Delivery Hub)',
    titleEn: 'Delivery Aggregator Hub',
    subtitleAr: 'ربط موحد لطلبات هنقرستيشن، جاهز، تويو، طلبات، ديليفرو، وكيتا',
    subtitleEn: 'Unified hub for Jahez, Hungerstation, ToYou, Talabat, Deliveroo & Keeta',
    descriptionAr: 'لوحة موحدة تستقبل كافة طلبات تطبيقات التوصيل في شاشة واحدة مع القبول التلقائي، وتعيين السائقين، ومزامنة قوائم الطعام.',
    descriptionEn: 'Centralized delivery command center aggregating all 3rd-party aggregator channels with automated accept, driver dispatching, and status webhooks.',
    icon: Truck,
    gradient: 'from-orange-500 to-amber-500',
    badge: 'Omni-Channel',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    roleAr: 'منسقي التوصيل ومدراء العمليات',
    roleEn: 'Delivery Dispatchers & Managers',
    hotkey: 'Ctrl + 4',
    featuresAr: [
      'قبول آلي للطلبات الواردة وطباعة بونات التوصيل فورياً',
      'تتبع مباشر لموقع السائقين ووقت الوصول المتوقع (ETA)',
      'التحكم في تشغيل وإيقاف قنوات التوصيل بنقرة واحدة عند الضغط',
      'مزامنة المخزون والأسعار عبر كافة التطبيقات في ثوانٍ'
    ],
    featuresEn: [
      'Auto-accept rules and automatic kitchen ticket dispatch',
      'Live driver geolocation tracking and dynamic ETA calculation',
      'One-click channel toggle to pause platforms during kitchen rushes',
      'Universal menu & stock availability sync across all platforms'
    ],
    highlightMetricAr: '6+ تطبيقات توصيل مدمجة',
    highlightMetricEn: '6+ Integrated Delivery Channels',
  },
  {
    id: 'waiter',
    stepNumber: 5,
    titleAr: 'تطبيق النادل المحمول (Waiter POS)',
    titleEn: 'Mobile Waiter POS',
    subtitleAr: 'واجهة خفيفة للأجهزة اللوحية والهواتف لطلب الوجبات بجانب الطاولة',
    subtitleEn: 'Handheld mobile ordering directly at the guest table with instant kitchen sync',
    descriptionAr: 'تطبيق سريع يتيح للويتر أخذ الطلبات وتعديلها بجانب الضيوف وإرسالها فوراً للمطبخ أو طلب الفاتورة وإغلاق الحساب.',
    descriptionEn: 'Lightweight handheld interface empowering table-side order taking, modifier customization, course firing, and instant card payments.',
    icon: Smartphone,
    gradient: 'from-blue-500 to-cyan-500',
    badge: 'Handheld',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    roleAr: 'الويترز وطاقم الخدمة',
    roleEn: 'Waiters & Floor Staff',
    hotkey: 'Ctrl + 5',
    featuresAr: [
      'تصميم مريح للأجهزة الذكية (الهواتف والتابلت) بيد واحدة',
      'إرسال فوري للتذاكر لشاشات المطبخ المناسبة بدون ذهاب للمطبخ',
      'طلب الحساب وطباعة الفاتورة أو الدفع بجانب الطاولة',
      'إشعارات فورية عند جاهزية أطباق طاولاته في نافذة المطبخ'
    ],
    featuresEn: [
      'Optimized one-handed UI for mobile phones and mini-tablets',
      'Instant kitchen dispatch eliminating unnecessary server walking',
      'Table-side payment settlement and receipt printing',
      'Live push notification when dishes are ready at the kitchen pass'
    ],
    highlightMetricAr: 'توفير 40% من وقت خدمة الطاولة',
    highlightMetricEn: '40% Table Turnaround Boost',
  },
  {
    id: 'kiosk',
    stepNumber: 6,
    titleAr: 'كشك الخدمة الذاتية (Self-Kiosk)',
    titleEn: 'Self-Service Smart Kiosk',
    subtitleAr: 'شاشة لمسية تفاعلية تتيح للعملاء الطلب والتخصيص والدفع ذاتياً',
    subtitleEn: 'Interactive touch kiosk for visual self-ordering, upselling & instant payments',
    descriptionAr: 'واجهة بصرية مبهرة تعرض صور الأطباق عالية الدقة، مع اقتراحات البيع التراكمي (Upselling) والدفع الإلكتروني السريع.',
    descriptionEn: 'Engaging customer-facing kiosk experience with visual menus, automated upselling, multilingual voice guidance, and card payment.',
    icon: Laptop,
    gradient: 'from-indigo-500 to-purple-500',
    badge: 'Self-Service',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    roleAr: 'العملاء وخدمة الزبائن الذاتية',
    roleEn: 'Customers & Front Desk',
    hotkey: 'Ctrl + 6',
    featuresAr: [
      'عرض تفاعلي رائع للوجبات مع السعرات الحرارية ومسببات الحساسية',
      'محرك اقتراحات تلقائية ذكي لزيادة متوسط قيمة الفاتورة (Upselling)',
      'دعم الدفع عبر بطاقات مدى وفيزا وماستركارد وأبل باي',
      'إصدار رقم تسلسلي للطلب ونداء الشاشة عند الجاهزية'
    ],
    featuresEn: [
      'Vibrant visual dish cards with allergen tags and nutritional info',
      'Intelligent AI upselling engine boosting average order value',
      'Seamless Mada, Credit Card, and Apple Pay terminal integration',
      'Automated order queue token generation and pickup chime'
    ],
    highlightMetricAr: '+22% زيادة في متوسط الفاتورة',
    highlightMetricEn: '+22% Average Ticket Uplift',
  },
  {
    id: 'online_store',
    stepNumber: 7,
    titleAr: 'متجر الطلب المباشر والموقع الإلكتروني',
    titleEn: 'Direct Online Ordering Store',
    subtitleAr: 'متجر رقمي خاص بمطعمك لطلب الاستلام والتوصيل بدون عمولات',
    subtitleEn: 'Zero-commission branded direct ordering webstore with QR digital menu',
    descriptionAr: 'قناة بيع مباشرة توفر لعملائك تجربة طلب سهلة عبر الجوال مع برنامج نقاط الولاء وتوفير عمولات التطبيقات الخارجية.',
    descriptionEn: 'Your own branded digital ordering storefront for pickup and direct delivery, saving high aggregator commissions and building direct loyalty.',
    icon: Globe,
    gradient: 'from-teal-500 to-emerald-500',
    badge: '0% Commission',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    roleAr: 'مدراء التسويق والمبيعات الرقمية',
    roleEn: 'Marketing & Digital Sales',
    hotkey: 'Ctrl + 7',
    featuresAr: [
      'متجر إلكتروني متجاوب وسريع جداً على كافة الهواتف والحواسيب',
      'قائمة طعام رقمية بالـ QR Code للتصفح داخل الصالة أو خارجها',
      'تتبع مباشر لحالة الطلب عبر الرسائل والواتساب',
      'كوبونات خصم وعروض ترويجية مخصصة لعملاء المتجر'
    ],
    featuresEn: [
      'Ultra-responsive mobile-first digital storefront',
      'QR Code contactless dining menu for table and takeaway',
      'Real-time order tracking status with SMS & WhatsApp updates',
      'Promotional coupon codes and targeted customer campaigns'
    ],
    highlightMetricAr: 'توفير 100% من عمولات المنصات',
    highlightMetricEn: 'Zero Commission Fees',
  },
  {
    id: 'intercom',
    stepNumber: 8,
    titleAr: 'الإنتركوم وتواصل الطاقم (Staff Intercom)',
    titleEn: 'Staff Intercom & Walkie-Talkie',
    subtitleAr: 'قنوات لاسلكية فورية ورسائل صوتية وتنبيهات طوارئ بين الأقسام',
    subtitleEn: 'Live multi-channel walkie-talkie, audio notes, and instant emergency alerts',
    descriptionAr: 'جهاز اتصال لاسلكي رقمي مدمج يربط الكاشير، الشيف في المطبخ، الويتر في الصالة، والإدارة لتنسيق العمليات بسرعة فائقة.',
    descriptionEn: 'High-speed team communications hub with dedicated channels (Kitchen, Floor, Cashier, Management), voice notes, and 1-tap preset dispatch.',
    icon: Radio,
    gradient: 'from-cyan-500 to-blue-500',
    badge: 'Live Audio',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    roleAr: 'كافة أفراد طاقم المطعم',
    roleEn: 'All On-Duty Staff',
    hotkey: 'Ctrl + 8',
    featuresAr: [
      'قنوات مخصصة: المطبخ والشيف، الصالة والويتر، الإدارة، والبث العام',
      'تسجيل وإرسال رسائل صوتية فورية مع تشغيل المؤثرات الصوتية',
      'أزرار نداء سريعة بنقرة واحدة (طلب ماء، تنظيف طاولة، ضغط شواية)',
      'تأكيد استلام الرسائل والتنبيهات بالاسم والوقت'
    ],
    featuresEn: [
      'Dedicated channels for Kitchen, Floor Waiters, Cashier, and Management',
      'One-tap voice recording notes with animated audio waveform player',
      'Instant 1-tap quick action presets (Water needed, Table cleaning, Grill rush)',
      'Read receipts and execution acknowledgment audit trail'
    ],
    highlightMetricAr: 'استجابة فورية خلال ثانية واحدة',
    highlightMetricEn: '<1s Instant Broadcast',
  },
  {
    id: 'inventory',
    stepNumber: 9,
    titleAr: 'المخزون وتكاليف الوصفات (Inventory)',
    titleEn: 'Smart Inventory & Recipe Costing',
    subtitleAr: 'خصم آلي للمكونات، تحليل تكلفة الطعام Food Cost، وكاميرا جرد ذكية',
    subtitleEn: 'Auto-deduction per recipe, live Food Cost % breakdown & AI vision inventory scan',
    descriptionAr: 'محرك مخزون متقدم يخصم الجرامات والمليلترات مع كل طبق يُباع، ويحسب نسبة الهدر وتكلفة الوجبة، مع تنبيهات عند اقتراب النفاد.',
    descriptionEn: 'Enterprise recipe inventory deduction system tracking ingredient yields, batch preparation, purchase invoices, and AI camera stock taking.',
    icon: Boxes,
    gradient: 'from-amber-500 to-orange-600',
    badge: 'Sub-Gram Precision',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    roleAr: 'مدراء المشتريات والمخازن ورئيس الطهاة',
    roleEn: 'Purchasing Managers & Executive Chefs',
    hotkey: 'Ctrl + 9',
    featuresAr: [
      'خصم تلقائي دقيق للمخزون لكل وجبة حسب وصفة المطبخ المعتمدة',
      'حساب دقيق لتكلفة الطعام (Food Cost %) وهامش الربح لكل صنف',
      'مسح الفواتير والمخزون بكاميرا الذكاء الاصطناعي (AI OCR & Vision)',
      'تنبيهات استباقية بالمواد القريبة من النفاد مع حساب كمية إعادة الطلب'
    ],
    featuresEn: [
      'Sub-gram automatic stock deduction on every ordered menu item',
      'Real-time Food Cost % and gross margin breakdown per portion',
      'AI Vision camera inventory scanner with expiry date & barcode OCR',
      'Automated low-stock threshold triggers and purchase order generation'
    ],
    highlightMetricAr: 'دقة جرد تفوق 99.8%',
    highlightMetricEn: '99.8% Stock Accuracy',
  },
  {
    id: 'staff',
    stepNumber: 10,
    titleAr: 'شؤون الموظفين والورديات (Staff HR)',
    titleEn: 'Staff HR, Shifts & Attendance',
    subtitleAr: 'تسجيل حضور بالوجه وPIN، إدارة الورديات، ومتابعة أداء المبيعات',
    subtitleEn: 'Face AI & PIN attendance, shift management, live sales roster & scorecards',
    descriptionAr: 'نظام متكامل لإدارة الورديات، وتسجيل الحضور والانصراف، ومتابعة مبيعات كل كاشير ونادل ومعدل كفاءة الطهاة في المطبخ.',
    descriptionEn: 'Comprehensive workforce management module managing daily shifts, biometric/PIN time attendance, staff scorecards, and tips pooling.',
    icon: Users,
    gradient: 'from-violet-500 to-indigo-500',
    badge: 'Shift Management',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    roleAr: 'مدراء الموارد البشرية والتشغيل',
    roleEn: 'HR & Operations Managers',
    featuresAr: [
      'تسجيل حضور وانصراف بالرقم السري (PIN) وبصمة الوجه الذكية',
      'مراقبة الطاقم المناوب حالياً ومتابعة مبيعات كل فرد وساعات العمل',
      'توزيع الإكراميات (Tips) والعمولات تلقائياً حسب ساعات الوردية',
      'قوائم تدقيق افتتاح وإغلاق الفرن والمطبخ (Opening/Closing Checklists)'
    ],
    featuresEn: [
      'Multi-method clock-in (Quick PIN, NFC card, and Face AI verification)',
      'Live on-duty staff roster with individual sales and productivity scores',
      'Automated shift tipping distribution and performance bonuses',
      'Digital operational opening and closing hygiene checklists'
    ],
    highlightMetricAr: 'متابعة أداء 100% في الوقت الفعلي',
    highlightMetricEn: 'Live Productivity Scoring',
  },
  {
    id: 'customers',
    stepNumber: 11,
    titleAr: 'العملاء ونادي الولاء (CRM & VIP)',
    titleEn: 'Customer CRM & VIP Loyalty Club',
    subtitleAr: 'سجل العملاء، مستويات VIP، نقاط المكافآت، والعروض المخصصة',
    subtitleEn: 'Customer profiles, tiered VIP loyalty club, points redemption & personalized perks',
    descriptionAr: 'قاعدة بيانات عملاء ذكية تحفظ تفضيلات كل ضيف، أطباقه المفضلة، وسجل زياراته لتقديم تجربة ضيافة ملكية استثنائية.',
    descriptionEn: 'Intelligent CRM tracking guest preferences, dietary restrictions, visit history, and automated tiered points rewards (Bronze, Silver, Gold, VIP).',
    icon: Sparkles,
    gradient: 'from-pink-500 to-rose-500',
    badge: 'VIP Club',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    roleAr: 'فريق التسويق والضيافة والعلاقات العامة',
    roleEn: 'Marketing & Guest Relations',
    featuresAr: [
      'برنامج ولاء متعدد المستويات (برونزي، فضي، ذهبي، وVIP الملكي)',
      'اكتساب واستبدال نقاط الولاء مباشرة عند الكاشير أو في المتجر',
      'تحديد الأطباق المفضلة ومسببات الحساسية لكل عميل بمجرد إدخال رقمه',
      'إرسال عروض وكوبونات مخصصة في أعياد الميلاد والمناسبات'
    ],
    featuresEn: [
      'Tiered VIP membership rewards (Bronze, Silver, Gold, Platinum VIP)',
      'Seamless points earning and redemption directly at POS and online store',
      'Instant recall of favorite dishes and allergy alerts upon customer phone lookup',
      'Targeted birthday treats and customized re-engagement offers'
    ],
    highlightMetricAr: '+35% زيادة في معدل تكرار الزيارات',
    highlightMetricEn: '+35% Repeat Guest Frequency',
  },
  {
    id: 'reports',
    stepNumber: 12,
    titleAr: 'التقارير والتحليلات المالية (Reports)',
    titleEn: 'Financial Reports & ZATCA Audit',
    subtitleAr: 'تقارير الإغلاق اليومي Z-Report، إقرارات ضريبة القيمة المضافة، وهوامش الربح',
    subtitleEn: 'Daily Z-Reports, ZATCA tax filing summaries, hourly revenue & margin audits',
    descriptionAr: 'مركز تحليلي شامل يمنح الإدارة رؤية لحظية للمبيعات، الأرباح الصافية، مبيعات الأصناف، والإغلاقات المحاسبية الرسمية.',
    descriptionEn: 'Comprehensive financial intelligence hub with real-time gross/net sales, hourly footfall heatmaps, product profit margins, and end-of-day Z-Reports.',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-green-500',
    badge: 'ZATCA Audit',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    roleAr: 'المحاسبون والمدير المالي (CFO)',
    roleEn: 'Accountants & CFOs',
    featuresAr: [
      'إصدار تقارير الإغلاق المالي اليومي والورديات (Z-Report & X-Report)',
      'سجل ضريبي معتمد وجاهز للإقرار الضريبي لهيئة الزكاة والضريبة 15%',
      'تحليل مبيعات الأصناف الأكثر ربحية وتحديد هوامش الربح الدقيقة',
      'تصدير فوري للبيانات بصيغ PDF و Excel و CSV المحاسبية'
    ],
    featuresEn: [
      'Automated End-of-Day Z-Reports and per-shift cash drawer reconciliations',
      'Certified 15% VAT tax audit logs ready for official tax filing',
      'Product profitability analysis identifying top grossing dishes',
      'One-click export to PDF, Excel, and accounting software CSV'
    ],
    highlightMetricAr: 'مطابقة محاسبية بنسبة 100%',
    highlightMetricEn: '100% Audit Reconciled',
  },
  {
    id: 'ai',
    stepNumber: 13,
    titleAr: 'المساعد الذكي وتحليل المنتجات (AI Copilot)',
    titleEn: 'AI Copilot & BCG Matrix Engine',
    subtitleAr: 'تحويل الصوت لطلبات، مصفوفة BCG للأطباق، وتسعير ديناميكي حسب الطقس',
    subtitleEn: 'Voice-to-Order AI, BCG Menu Matrix analytics & weather-aware dynamic pricing',
    descriptionAr: 'عقل اصطناعي مدعوم بنماذج Gemini 2.5 Flash و OpenRouter يحلل أداء المنيو، ويقترح أسعار ديناميكية، ويتيح أخذ الطلبات بالأوامر الصوتية.',
    descriptionEn: 'Next-generation AI co-pilot powered by multi-LLM orchestration, offering acoustic voice ordering, BCG matrix menu engineering, and dynamic weather pricing.',
    icon: Bot,
    gradient: 'from-violet-600 to-indigo-600',
    badge: 'Gemini 2.5',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    roleAr: 'الإدارة التنفيذية ومطوري القوائم',
    roleEn: 'Executive Management & Menu Engineers',
    featuresAr: [
      'أخذ الطلبات بالصوت واللهجات العربية المختلفة وتحويلها لسلة جاهزة',
      'تحليل مصفوفة BCG (النجوم، الأبقار الحلوب، علامات الاستفهام، والكلاب)',
      'تسعير ديناميكي ذكي يراعي درجات الحرارة والطقس وساعات الذروة',
      'اقتراحات ذكية للحد من هدر المطبخ وتعديل أحجام الحصص'
    ],
    featuresEn: [
      'Multilingual acoustic Voice-to-Order parsing across Saudi & Arab dialects',
      'BCG Matrix menu categorization (Stars, Cash Cows, Question Marks, Dogs)',
      'Weather-aware dynamic pricing adjusting cold/hot dishes automatically',
      'Actionable food waste reduction insights and portion optimization'
    ],
    highlightMetricAr: 'دقة استيعاب لغوي 98.5%',
    highlightMetricEn: '98.5% Voice Parsing Accuracy',
  },
  {
    id: 'settings',
    stepNumber: 14,
    titleAr: 'إعدادات النظام والطابعات (Settings)',
    titleEn: 'System, Hardware & Printers',
    subtitleAr: 'تعريف الفروع، ربط طابعات المطبخ ESC/POS، وتخصيص الضرائب والعملة',
    subtitleEn: 'Branch setup, ESC/POS thermal printer routing, tax rates & localization',
    descriptionAr: 'لوحة تحكم إعدادات شاملة لتهيئة طابعات المطبخ حسب المحطات، وتخصيص الفواتير، ونسب الضرائب، والمؤثرات الصوتية.',
    descriptionEn: 'Hardware and system configuration hub for managing thermal receipt printers, kitchen station IP printing, tax percentages, and audio sound studio.',
    icon: Settings,
    gradient: 'from-slate-500 to-stone-600',
    badge: 'Hardware Config',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    roleAr: 'مهندسو الدعم الفني ومدراء النظام',
    roleEn: 'IT Administrators & System Engineers',
    featuresAr: [
      'توجيه طباعة البونات آلياً للمحطة المناسبة (شبكي، USB، بلوتوث)',
      'تخصيص ترويسة وتذييل الفاتورة الضريبية وشعار المنشأة',
      'استوديو التحكم الصوتي بالنغمات والمذيع الآلي للطلبات',
      'إدارة النسخ الاحتياطي المحلي والسحابي الآمن'
    ],
    featuresEn: [
      'Multi-protocol ESC/POS thermal printer routing (LAN IP, USB, Bluetooth)',
      'Customized receipt header, footer, tax number, and high-res logo',
      'Audio Sound Studio with customizable chimes and TTS announcer presets',
      'Local encrypted backups and automated cloud synchronization'
    ],
    highlightMetricAr: 'دعم كافة طابعات ESC/POS',
    highlightMetricEn: 'Universal ESC/POS Support',
  },
  {
    id: 'superadmin',
    stepNumber: 15,
    titleAr: 'الإدارة المركزية للفروع (Super Admin)',
    titleEn: 'Super Admin Multi-Branch Control',
    subtitleAr: 'لوحة قيادة مركزية لإدارة سلاسل المطاعم، النسخ السحابي، والصلاحيات',
    subtitleEn: 'Enterprise multi-branch command deck, cloud replication & encrypted root vault',
    descriptionAr: 'بوابة الإدارة العليا المقفلة للتحكم في مئات الفروع، ونشر القوائم الموحدة، ومراقبة الإيرادات الكلية عبر مفتاح الاختصار السري (Ctrl+Shift+A).',
    descriptionEn: 'Master multi-unit enterprise control room providing centralized menu publishing, franchise oversight, and global sales aggregation.',
    icon: ShieldCheck,
    gradient: 'from-purple-600 via-amber-500 to-indigo-600',
    badge: 'Root Access',
    badgeColor: 'bg-purple-500/20 text-amber-300 border-amber-500/30',
    roleAr: 'أصحاب سلاسل المطاعم والمدير العام',
    roleEn: 'Franchise Owners & Chief Executives',
    hotkey: 'Ctrl + Shift + A',
    featuresAr: [
      'مراقبة إيرادات وأداء كافة الفروع والمطابخ السحابية في شاشة موحدة',
      'نشر تعديلات الأسعار والمنيو على جميع الفروع بضغطة زر واحدة',
      'صلاحيات وصول دقيقة مشفرة مع سجل تدقيق أمني لكافة العمليات',
      'إدارة قواعد بيانات الفروع وعزل البيانات لحماية الخصوصية'
    ],
    featuresEn: [
      'Global multi-branch revenue and KPI radar for restaurant chains',
      'One-click centralized menu and pricing rollout across all branches',
      'Granular cryptographic role-based access control and audit trails',
      'Multi-tenant database orchestration with zero cross-branch leakage'
    ],
    highlightMetricAr: 'تحكم في ما يصل إلى 500 فرع',
    highlightMetricEn: '500+ Multi-Branch Scale',
  },
  {
    id: 'security',
    stepNumber: 16,
    titleAr: 'درع الحماية وبصمة العتاد (Security Shield)',
    titleEn: 'Cyber Defense & Hardware DNA Shield',
    subtitleAr: 'بصمة العتاد DNA، تراخيص RSA-2048، حامي التوقيت، وزر الإيقاف الدفاعي',
    subtitleEn: 'Hardware DNA fingerprinting, RSA-2048 licenses, clock tamper guard & kill switch',
    descriptionAr: 'أقوى درع حماية سيبراني مدمج يحمي النظام من محاولات التلاعب بالوقت، تزييف التراخيص، أو سرقة قواعد البيانات مع زر إيقاف فوري دفاعي.',
    descriptionEn: 'Military-grade security fortress featuring immutable hardware DNA binding, anti-clock manipulation guards, canary tokens, and tamper defense.',
    icon: Shield,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    badge: '6-Layer Fortress',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    roleAr: 'ضباط الأمن السيبراني والمستشارين التقنيين',
    roleEn: 'Chief Information Security Officers (CISO)',
    featuresAr: [
      'بصمة العتاد المشفرة (Hardware DNA) لمنع تشغيل النظام خارج أجهزتك المصرحة',
      'تراخيص تشفير غير قابلة للكسر بمفاتيح RSA-2048 والتوقيع الرقمي',
      'حامي التوقيت (Clock Guard) لكشف أي تلاعب في تواريخ الفواتير أو ساعات التشغيل',
      'زر الإيقاف الدفاعي (Kill Switch) لحماية بياناتك فورياً في حالات الطوارئ'
    ],
    featuresEn: [
      'Hardware DNA binding preventing unauthorized cloning to foreign machines',
      'Unbreakable RSA-2048 cryptographically signed enterprise license tokens',
      'Monotonic Clock Guard actively detecting system time manipulation attempts',
      'Emergency Defensive Kill Switch protecting company data during security threats'
    ],
    highlightMetricAr: 'حماية سيبرانية من 6 طبقات',
    highlightMetricEn: '6-Layer Defense Grid',
  },
];

export const InteractiveTourModal: React.FC = () => {
  const { language, activeModule, setActiveModule, playSound, tourOpen, setTourOpen } = useAppStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const autoPlayTimerRef = useRef<any>(null);

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Sync step if user is already on a specific module when opening tour
  useEffect(() => {
    if (tourOpen) {
      const matchedIdx = TOUR_STEPS.findIndex((s) => s.id === activeModule);
      if (matchedIdx !== -1) {
        setCurrentStepIndex(matchedIdx);
      }
    }
  }, [tourOpen, activeModule]);

  // Auto-play timer (advances step every 6 seconds)
  useEffect(() => {
    if (isAutoPlaying && tourOpen) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= TOUR_STEPS.length - 1) {
            setIsAutoPlaying(false);
            triggerCelebrationConfetti();
            return prev;
          }
          return prev + 1;
        });
      }, 5500);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, tourOpen]);

  const triggerCelebrationConfetti = () => {
    try {
      playSound('success');
      burstConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'],
      });
      setHasCompletedTour(true);
    } catch (e) {
      // Confetti fallback
    }
  };

  const handleNext = () => {
    playSound('slide');
    if (isLastStep) {
      triggerCelebrationConfetti();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    playSound('slide');
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    playSound('tap');
    setCurrentStepIndex(index);
    setIsAutoPlaying(false);
  };

  const handleSwitchToModule = (modId: AppModule) => {
    playSound('kitchen-bell');
    setActiveModule(modId);
    setTourOpen(false);
  };

  const handleClose = () => {
    playSound('pop');
    setIsAutoPlaying(false);
    setTourOpen(false);
  };

  if (!tourOpen) return null;

  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-all"
      />

      {/* Main Tour Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl max-h-[92vh] rounded-[32px] bg-[#0d1117]/95 border border-white/15 shadow-2xl shadow-amber-500/10 flex flex-col overflow-hidden text-start z-10"
      >
        {/* Top Header Glow Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          {/* Brand & Progress Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  {language === 'ar' ? 'الجولة الإرشادية لنظام المطاعم المتكامل' : 'Interactive Enterprise Tour'}
                </h2>
                <Badge variant="amber" size="sm" className="font-mono font-bold">
                  {currentStepIndex + 1} / {TOUR_STEPS.length}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar'
                  ? 'استعراض شامل لكافة وحدات النظام الـ 16 للمدراء والموظفين الجدد'
                  : 'Explore all 16 enterprise modules designed for modern F&B operations'}
              </p>
            </div>
          </div>

          {/* Action buttons: Auto Play & Close */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isAutoPlaying ? 'amber' : 'ghost'}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="rounded-xl gap-1.5 text-xs font-bold"
              title={isAutoPlaying ? 'إيقاف التشغيل التلقائي' : 'تشغيل تلقائي للجولة'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isAutoPlaying ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (language === 'ar' ? 'تشغيل تلقائي' : 'Auto Play')}
              </span>
            </Button>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Module Hero Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent border border-white/10 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentStep.gradient} opacity-15 blur-3xl pointer-events-none`} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Side: Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentStep.gradient} p-0.5 shadow-xl flex items-center justify-center shrink-0`}>
                      <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-white">
                        <Icon className="w-7 h-7" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-white">
                          {language === 'ar' ? currentStep.titleAr : currentStep.titleEn}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentStep.badgeColor}`}>
                          {currentStep.badge}
                        </span>
                        {currentStep.hotkey && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-white/5 border border-white/10 text-slate-300">
                            {currentStep.hotkey}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-amber-400/90 font-medium">
                        {language === 'ar' ? currentStep.subtitleAr : currentStep.subtitleEn}
                      </p>
                    </div>
                  </div>

                  {/* Direct Module Switcher Button */}
                  <div className="shrink-0">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleSwitchToModule(currentStep.id)}
                      className="w-full sm:w-auto rounded-2xl gap-2 font-black text-xs shadow-lg shadow-amber-500/20"
                    >
                      <span>{language === 'ar' ? 'فتح هذه الوحدة والبدء الآن' : 'Open This Module Now'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Description & Target Role */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-slate-300 leading-relaxed font-normal flex-1">
                    {language === 'ar' ? currentStep.descriptionAr : currentStep.descriptionEn}
                  </p>
                  <div className="shrink-0 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">{language === 'ar' ? 'مخصص لـ:' : 'Role:'}</span>
                    <span className="text-amber-400 font-bold">{language === 'ar' ? currentStep.roleAr : currentStep.roleEn}</span>
                  </div>
                </div>
              </div>

              {/* Core Features Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'ar' ? 'أبرز الإمكانيات والميزات الرئيسية:' : 'Key Super-Powers & Capabilities:'}</span>
                  </h4>
                  {currentStep.highlightMetricAr && (
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? currentStep.highlightMetricAr : currentStep.highlightMetricEn}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(language === 'ar' ? currentStep.featuresAr : currentStep.featuresEn).map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all flex items-start gap-3 text-xs text-slate-200 font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation & Step Dots Carousel */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Step Dots Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 custom-scrollbar">
            {TOUR_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => handleJumpToStep(idx)}
                  className={`relative group h-8 min-w-8 px-2 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                      : isPast
                      ? 'bg-white/15 text-slate-200 hover:bg-white/25'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                  title={`${step.stepNumber}. ${language === 'ar' ? step.titleAr : step.titleEn}`}
                >
                  <span>{step.stepNumber}</span>
                </button>
              );
            })}
          </div>

          {/* Next / Previous Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="rounded-2xl gap-1.5 text-xs font-bold"
            >
              {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
            </Button>

            <Button
              variant={isLastStep ? 'amber' : 'primary'}
              size="md"
              onClick={handleNext}
              className="rounded-2xl gap-1.5 text-xs font-black shadow-lg shadow-amber-500/20"
            >
              <span>{isLastStep ? (language === 'ar' ? 'إتمام الجولة بنجاح 🎉' : 'Finish Tour 🎉') : (language === 'ar' ? 'التالي' : 'Next')}</span>
              {!isLastStep && (language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
