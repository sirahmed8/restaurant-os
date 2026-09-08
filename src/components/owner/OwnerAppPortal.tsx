import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  Shield,
  Layers,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  KeyRound,
  Server,
  Globe,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  Sun,
  Moon,
  Store,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Award,
  Sparkles,
  Utensils,
  MapPin,
  Coffee,
  X,
  Sliders,
  LogOut,
  Monitor,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSuperAdminStore } from '../../stores/useSuperAdminStore';
import { TenantRestaurant, SubscriptionTier, TenantStatus } from '../../types/superAdmin';
import { SecurityShieldModule } from '../modules/SecurityShieldModule';
import { ZatcaComplianceModule } from '../modules/ZatcaComplianceModule';
import { OwnerControlBar } from '../ui/OwnerControlBar';
import { SuperAdminModule } from '../modules/SuperAdminModule';

export const OwnerAppPortal: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    setAppMode,
    playSound,
    activeUser,
    resetAccount,
  } = useAppStore();

  const {
    tenants,
    addTenant,
    setTenantStatus,
  } = useSuperAdminStore();

  const [activeOwnerTab, setActiveOwnerTab] = useState<'analytics' | 'restaurants' | 'security' | 'zatca'>('analytics');
  const [selectedBranchForAction, setSelectedBranchForAction] = useState<TenantRestaurant | null>(null);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Branch Form State
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('القاهرة - التجمع الخامس');
  const [newBranchPhone, setNewBranchPhone] = useState('010' + Math.floor(10000000 + Math.random() * 90000000));
  const [newBranchPlan, setNewBranchPlan] = useState<SubscriptionTier>('enterprise');

  // Handle Switch to Specific Branch Live POS
  const handleLaunchBranchPos = (branch: TenantRestaurant) => {
    playSound('kitchen-bell');
    useAppStore.setState({
      branchNameAr: branch.nameAr,
      branchNameEn: branch.nameEn || branch.nameAr,
      appMode: 'restaurant',
    });
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    addTenant({
      nameAr: newBranchName,
      nameEn: newBranchName,
      slug: newBranchName.toLowerCase().replace(/\s+/g, '-'),
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
      ownerName: 'المدير العام للمطعم',
      ownerEmail: 'branch@restaurantos.com',
      ownerPhone: newBranchPhone,
      city: newBranchCity,
      country: 'مصر',
      currency: 'EGP',
      plan: newBranchPlan,
      billingCycle: 'monthly',
      monthlyFee: newBranchPlan === 'enterprise' ? 4500 : 2500,
      paymentStatus: 'paid',
      status: 'active',
      branchesCount: 1,
      maxBranches: 10,
      posTerminalsCount: 3,
      maxPosTerminals: 10,
      kdsScreensCount: 2,
      maxKdsScreens: 5,
      joinedDate: new Date().toISOString().split('T')[0],
      renewalDate: '2027-12-31',
      licenseKey: 'RESTOS-V2-AUTO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      hardwareFingerprint: 'AUTO-DNA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      dbCluster: 'cluster-cairo-01.aws',
      cloudflareTunnelId: 'cf-tun-auto-' + Math.random().toString(36).substring(2, 6),
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
        customDomain: false,
      },
      notes: 'فرع تم إنشاؤه عبر لوحة المالك',
    });

    playSound('success');
    setIsAddBranchOpen(false);
    setNewBranchName('');
  };

  const filteredBranches = tenants.filter(
    (b) =>
      b.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#07090d] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-300">
      {/* Top Owner Executive Header Bar */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-purple-500/20 bg-white/90 dark:bg-[#0c0f17]/90 backdrop-blur-2xl flex items-center justify-between z-30 shrink-0">
        {/* Left: Owner Brand & Portal Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {language === 'ar' ? 'لوحة تحكم مالك المطاعم والفروع' : 'Franchise Owner HQ Portal'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                {activeUser?.name || 'Ahmed Orabi (المالك)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'المراقبة المركزية، التحليلات المالية وهوامش الربح' : 'Central Multi-Branch Telemetry & Financial Intelligence'}
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs for Owner */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => {
              playSound('click');
              setActiveOwnerTab('analytics');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeOwnerTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'ar' ? 'التحليلات والذكاء المالي' : 'Financial Analytics'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveOwnerTab('restaurants');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeOwnerTab === 'restaurants'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{language === 'ar' ? 'إدارة والتحكم في المطاعم والفروع' : 'Restaurants & Branches'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveOwnerTab('security');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeOwnerTab === 'security'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{language === 'ar' ? 'درع الأمان والتراخيص' : 'Security & License'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveOwnerTab('zatca');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeOwnerTab === 'zatca'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'الامتثال الضريبي ZATCA' : 'ZATCA Compliance'}</span>
          </button>
        </div>

        {/* Right: Return to Restaurant POS & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSound('click');
              setLanguage(language === 'ar' ? 'en' : 'ar');
            }}
            className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-black text-slate-700 dark:text-white transition-all cursor-pointer"
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>

          <button
            onClick={() => {
              playSound('click');
              toggleTheme();
            }}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>

          {/* Return to Restaurant Operations POS */}
          <button
            onClick={() => {
              playSound('kitchen-bell');
              setAppMode('restaurant');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Store className="w-4 h-4" />
            <span>{language === 'ar' ? 'فتح نقطة البيع للمطعم (POS)' : 'Open Restaurant POS'}</span>
          </button>

          {/* Logout / Switch User */}
          <button
            onClick={() => {
              if (confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Log out of Owner HQ?')) {
                resetAccount();
              }
            }}
            className="p-2 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Owner Main Workspace */}
      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* TAB 1: FINANCIAL ANALYTICS & INTELLIGENCE */}
        {activeOwnerTab === 'analytics' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-purple-500/20 shadow-sm dark:shadow-none space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{language === 'ar' ? 'إجمالي المبيعات المجمعة' : 'Consolidated Group Revenue'}</span>
                  <span className="p-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  348,520 <span className="text-xs font-sans text-purple-600 dark:text-purple-400 font-bold">ج.م</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% نمو عن الشهر الماضي</span>
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{language === 'ar' ? 'إجمالي الطلبات المنفذة' : 'Total Orders Processed'}</span>
                  <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Utensils className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  1,842 <span className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-bold">طلب</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  متوسط الفاتورة: 189.20 ج.م
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-amber-500/20 shadow-sm dark:shadow-none space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{language === 'ar' ? 'هامش الربح الإجمالي (Gross Margin)' : 'Gross Profit Margin'}</span>
                  <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <PieChart className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  68.4%
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  تكلفة الأغذية (Food Cost): 31.6%
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/20 shadow-sm dark:shadow-none space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{language === 'ar' ? 'الفروع النشطة على السحابة' : 'Active Online Branches'}</span>
                  <span className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {tenants.length} <span className="text-xs font-sans text-blue-600 dark:text-blue-400 font-bold">فروع</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  100% متزامنة في الوقت الفعلي
                </p>
              </div>
            </div>

            {/* BCG Menu Matrix & Waste Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* BCG Matrix Widget */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'مصفوفة هندسة المنيو والربحية (BCG Matrix)' : 'BCG Menu Engineering Matrix'}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {language === 'ar' ? 'تصنيف الأصناف حسب الشعبية وهامش الربحية لتعظيم العائد' : 'Stars, Plowhorses, Puzzles & Dogs profitability breakdown'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span>🌟 النجوم (Stars)</span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">ربح عالي + طلب عالي</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-bold">ستيك ريب آي واغيو، كباب مشوي عالفحم</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">توصية AI: الحفاظ على الجودة وثبات السعر</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                    <div className="text-xs font-black text-blue-800 dark:text-blue-300 flex items-center justify-between">
                      <span>🐎 أحصنة الجر (Plowhorses)</span>
                      <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">ربح متوسط + طلب عالي</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-bold">برجر ترافل أنجوس، بيتزا مارغريتا</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">توصية AI: رفع السعر 5% أو تقليل تكلفة الخامات</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>❓ الألغاز (Puzzles)</span>
                      <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">ربح عالي + طلب منخفض</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-bold">ريش ضاني متبلة، سلمون مشوي بالأعشاب</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">توصية AI: ترويج الصنف في مقدمة المنيو وعروض اليوم</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <div className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center justify-between">
                      <span>🐕 الكلاب (Dogs)</span>
                      <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full">ربح منخفض + طلب منخفض</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-bold">شوربة خضار كلاسيكية، سلطة مخللات</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">توصية AI: استبدال الصنف أو حذفه من القائمة</p>
                  </div>
                </div>
              </div>

              {/* AI Plate Waste & Loss Reduction */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'تتبع الهالك والتوالف (AI Plate Waste)' : 'Plate Waste AI Tracker'}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {language === 'ar' ? 'كاميرات فحص الصحون وتقليل الهدر' : 'Computer vision plate residue estimation'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">متوسط الهالك لكل طبق:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">42 جرام (4.8%)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">التوفير الشهري المحقق:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+14,200 ج.م</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">أكثر الأصناف هدراً في الصحون:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">الأرز بالخلطة والبطاطس المقلية</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-900 dark:text-purple-200">
                    💡 توصية المساعد الذكي: تقليل وزن حصة الأرز الجانبي بمقدار 50 جرام لتوفير 8,400 ج.م شهرياً دون التأثير على تجربة العميل.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESTAURANTS & FRANCHISE CONTROL */}
        {activeOwnerTab === 'restaurants' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-500" />
                  <span>{language === 'ar' ? 'فروع وسلاسل المطاعم التابعة' : 'Franchise Restaurants & Branches'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar'
                    ? 'التحكم المباشر في كل فرع، فتح الكاشير المباشر، وتعديل الصلاحيات'
                    : 'Direct branch control, launch POS, and monitor real-time shift performance'}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث عن فرع أو مدينة...' : 'Search branch or city...'}
                    className="w-full ps-9 pe-4 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <button
                  onClick={() => {
                    playSound('pop');
                    setIsAddBranchOpen(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة مطعم / فرع جديد' : 'Add New Branch'}</span>
                </button>
              </div>
            </div>

            {/* Branches Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((branch) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition-all space-y-4 shadow-sm dark:shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center text-amber-500 font-black text-base shadow-md">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">{branch.nameAr}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-purple-500" />
                            <span>{branch.city}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setTenantStatus(branch.id, branch.status === 'active' ? 'suspended' : 'active')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                          branch.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {branch.status === 'active' ? '🟢 متصل' : '🔴 مقفل'}
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">مبيعات اليوم:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {(branch.monthlyFee * 1.8).toFixed(0)} ج.م
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">نقاط البيع النشطة:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {branch.posTerminalsCount} أجهزة كاشير
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">الاشتراك السحابي:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300 uppercase text-[11px]">
                          {branch.plan}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">الامتثال الضريبي:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                          ZATCA Phase 2 ✓
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Branch Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => handleLaunchBranchPos(branch)}
                      className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'فتح كاشير الفرع (Live POS)' : 'Launch Branch POS'}</span>
                    </button>

                    <button
                      onClick={() => {
                        playSound('pop');
                        setTenantStatus(branch.id, branch.status === 'active' ? 'suspended' : 'active');
                      }}
                      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      title={branch.status === 'active' ? 'قفل الفرع عن بعد' : 'تفعيل الفرع'}
                    >
                      {branch.status === 'active' ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & LICENSE VAULT */}
        {activeOwnerTab === 'security' && <SecurityShieldModule />}

        {/* TAB 4: ZATCA COMPLIANCE */}
        {activeOwnerTab === 'zatca' && <ZatcaComplianceModule />}
      </main>

      {/* Add New Branch Modal */}
      <AnimatePresence>
        {isAddBranchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0e131d] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black text-white">
                    {language === 'ar' ? 'إضافة فرع / مطعم جديد للمجموعة' : 'Add New Franchise Restaurant'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddBranchOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الفرع / المطعم *</label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="مثال: مطعم قصر السلطان - فرع الشيخ زايد"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">المدينة والمنطقة *</label>
                  <input
                    type="text"
                    required
                    value={newBranchCity}
                    onChange={(e) => setNewBranchCity(e.target.value)}
                    placeholder="الجيزة - الشيخ زايد"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">باقة النظام والتراخيص</label>
                  <select
                    value={newBranchPlan}
                    onChange={(e) => setNewBranchPlan(e.target.value as any)}
                    className="w-full"
                  >
                    <option value="enterprise">باقة السلاسل والمجموعات (Enterprise - 4,500 ج.م/شهر)</option>
                    <option value="pro">باقة المحترفين (Pro - 2,500 ج.م/شهر)</option>
                    <option value="basic">الباقة الأساسية (Basic - 1,500 ج.م/شهر)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddBranchOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    اعتماد وإضافة الفرع ✓
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Super Owner Live Switcher Bar */}
      <OwnerControlBar />
    </div>
  );
};
