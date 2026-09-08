import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Store,
  MapPin,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  Coffee,
  Utensils,
  Layers,
  ChevronRight,
  BarChart3,
  Monitor,
  Zap,
  TrendingUp,
  Cpu,
  ChefHat,
  Receipt,
  Printer,
  TableProperties,
  Sliders,
  DollarSign,
  Info,
  Sun,
  Moon,
  ShieldAlert,
  UserCheck,
  Check,
  X,
  LogIn,
  Download,
  Laptop,
  Smartphone,
  Copy,
  ExternalLink,
  ShoppingBag,
  CreditCard,
  Compass,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { signInWithGoogleReal } from '../../services/firebaseService';
import { db } from '../../db';

interface WelcomeLandingScreenProps {
  onSuccess?: () => void;
}

export const WelcomeLandingScreen: React.FC<WelcomeLandingScreenProps> = ({ onSuccess }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    playSound,
    setAppMode,
    setActiveUser,
  } = useAppStore();

  const { addStaffMember } = useStaffStore();

  // Screen View: 'welcome' | 'onboarding-wizard'
  const [currentView, setCurrentView] = useState<'welcome' | 'onboarding-wizard'>('welcome');

  // Google Login & Download Dialog States
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // First-time Role Selection: 'customer' | 'admin' | 'cashier' | null
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin' | 'cashier' | null>(null);

  // Personalized Onboarding Wizard State (Clean empty states by default, no fake data!)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantNameEn, setRestaurantNameEn] = useState('');
  const [cuisineType, setCuisineType] = useState<'grill' | 'burgers' | 'pizza' | 'cafe' | 'shawarma'>('grill');
  const [branchName, setBranchName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [tablesCount, setTablesCount] = useState<number>(12);
  const [selectedStations, setSelectedStations] = useState<string[]>(['grill', 'fryer', 'salad', 'bar']);
  const [printerPaper, setPrinterPaper] = useState<'80mm' | '58mm'>('80mm');
  const [enableCustomerDisplay, setEnableCustomerDisplay] = useState(true);
  const [dataMode, setDataMode] = useState<'clean' | 'starter'>('clean');

  // Admin User Creation State
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPin, setAdminPin] = useState('1234');

  // Cashier Quick Setup State
  const [cashierName, setCashierName] = useState('');
  const [cashierPin, setCashierPin] = useState('1234');
  const [cashierBranch, setCashierBranch] = useState('فرع المعادي');

  // Real Google SSO Authentication Handler via Firebase
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    playSound('click');

    try {
      const fbUser = await signInWithGoogleReal();
      const enteredEmail = (fbUser.email || '').trim().toLowerCase();
      const displayName = fbUser.displayName || enteredEmail.split('@')[0] || 'User';
      const photoURL = fbUser.photoURL || undefined;

      const configuredOwnerEmail = (import.meta.env.VITE_OWNER_EMAIL || 'a7medorabe7@gmail.com').trim().toLowerCase();

      // CASE 1: Platform & Franchise Super Owner (from .env VITE_OWNER_EMAIL)
      if (enteredEmail === configuredOwnerEmail) {
        const ownerUser = {
          id: 'usr_owner_super',
          name: displayName,
          nameEn: displayName + ' (Owner HQ)',
          role: 'admin' as const,
          avatar: photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          pin: '1234',
          branch: 'الإدارة المركزية وسلاسل الفروع (HQ)',
          email: enteredEmail,
        };

        localStorage.setItem('restaurant_os_registered', 'true');
        localStorage.setItem('restaurant_os_current_user', JSON.stringify(ownerUser));
        localStorage.setItem('restaurant_os_app_mode', 'owner');

        useAppStore.setState({
          activeUser: ownerUser,
          isRegistered: true,
          isLocked: false,
          appMode: 'owner',
        });

        playSound('kitchen-bell');
        if (onSuccess) onSuccess();
        return;
      }

      // CASE 2: Returning Restaurant / Customer User if previously configured
      const savedAccountStr = localStorage.getItem('restaurant_os_account');
      const savedUserStr = localStorage.getItem('restaurant_os_current_user');
      if (savedAccountStr && savedUserStr) {
        const savedAccount = JSON.parse(savedAccountStr);
        const savedUser = JSON.parse(savedUserStr);

        useAppStore.setState({
          activeUser: savedUser,
          branchNameAr: savedAccount.branchAr || savedAccount.nameAr || 'الفرع الرئيسي',
          branchNameEn: savedAccount.branchEn || savedAccount.nameEn || 'Main Branch',
          isRegistered: true,
          isLocked: false,
          appMode: (savedUser.role === 'customer' ? 'customer' : 'restaurant') as any,
        });

        playSound('success');
        if (onSuccess) onSuccess();
        return;
      }

      // CASE 3: New User -> Direct to Onboarding Role Selection & Restaurant Setup
      setAdminFullName(displayName);
      setCashierName(displayName);
      setAdminUsername(enteredEmail.split('@')[0]);
      setGoogleEmail(enteredEmail);
      setGoogleName(displayName);
      setCurrentView('onboarding-wizard');
      setSelectedRole(null);
      playSound('pop');
    } catch (err: any) {
      console.warn('[Firebase Google Auth Error]:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert(language === 'ar' ? `حدث خطأ أثناء تسجيل الدخول بـ Google: ${err.message || err.code}` : `Google Sign-in Error: ${err.message || err.code}`);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Launch Customer Flow
  const handleLaunchCustomer = () => {
    playSound('kitchen-bell');
    const customerUser = {
      id: 'usr_cust_' + Math.random().toString(36).substring(2, 7),
      name: adminFullName || googleName || 'عميل محترم',
      nameEn: adminUsername || 'Valued Customer',
      role: 'customer' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      pin: '0000',
      branch: 'المنزل / دليفري',
      email: googleEmail,
      phone: ownerPhone || '01012345678',
    };

    localStorage.setItem('restaurant_os_registered', 'true');
    localStorage.setItem('restaurant_os_current_user', JSON.stringify(customerUser));
    localStorage.setItem('restaurant_os_app_mode', 'customer');

    useAppStore.setState({
      activeUser: customerUser,
      isRegistered: true,
      isLocked: false,
      appMode: 'customer',
    });

    if (onSuccess) onSuccess();
  };

  // Launch Cashier Flow
  const handleLaunchCashier = () => {
    playSound('click');
    const cashierUser = {
      id: 'usr_cashier_' + Math.random().toString(36).substring(2, 7),
      name: cashierName || adminFullName || 'كاشير المحطة',
      nameEn: adminUsername || 'POS Cashier',
      role: 'cashier' as const,
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      pin: cashierPin,
      branch: cashierBranch || 'الفرع الرئيسي',
      email: googleEmail,
    };

    addStaffMember({
      id: 'st_cash_' + Math.random().toString(36).substring(2, 6),
      name: cashierUser.name,
      nameEn: cashierUser.nameEn,
      role: 'senior_cashier',
      roleTitleAr: 'كاشير نقطة البيع',
      roleTitleEn: 'POS Cashier',
      avatar: cashierUser.avatar,
      status: 'on_shift',
      shiftStart: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ordersHandled: 0,
      performanceScore: 98,
    });

    localStorage.setItem('restaurant_os_registered', 'true');
    localStorage.setItem('restaurant_os_current_user', JSON.stringify(cashierUser));
    localStorage.setItem('restaurant_os_master_pin', cashierPin);
    localStorage.setItem('restaurant_os_app_mode', 'restaurant');

    useAppStore.setState({
      activeUser: cashierUser,
      branchNameAr: cashierUser.branch,
      branchNameEn: cashierUser.branch,
      isRegistered: true,
      isLocked: false,
      appMode: 'restaurant',
      activeModule: 'pos',
    });

    if (onSuccess) onSuccess();
  };

  // Toggle Kitchen Station in Wizard
  const toggleStation = (stationId: string) => {
    playSound('tap');
    if (selectedStations.includes(stationId)) {
      if (selectedStations.length > 1) {
        setSelectedStations(selectedStations.filter((s) => s !== stationId));
      }
    } else {
      setSelectedStations([...selectedStations, stationId]);
    }
  };

  // Finalize Business Onboarding & Create Admin User
  const handleFinalizeSetup = async () => {
    if (!restaurantName.trim()) {
      playSound('alert');
      setWizardStep(1);
      alert(language === 'ar' ? 'يرجى إدخال اسم المطعم' : 'Please enter restaurant name');
      return;
    }

    if (!adminFullName.trim() || adminPin.length !== 4) {
      playSound('alert');
      setWizardStep(4);
      alert(language === 'ar' ? 'يرجى إدخال اسم المدير ورمز PIN المكون من 4 أرقام' : 'Please enter admin name and 4-digit PIN');
      return;
    }

    setIsAuthenticating(true);
    playSound('click');

    try {
      const finalBranch = branchName || (language === 'ar' ? 'الفرع الرئيسي' : 'Main Branch');

      // Create Admin User Profile
      const adminUserProfile = {
        id: 'usr_admin_' + Math.random().toString(36).substring(2, 8),
        name: adminFullName,
        nameEn: adminUsername || adminFullName,
        role: 'admin' as const,
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
        pin: adminPin,
        branch: finalBranch,
        email: googleEmail,
      };

      // Add Admin to Staff List
      addStaffMember({
        id: 'st_admin_' + Math.random().toString(36).substring(2, 6),
        name: adminFullName,
        nameEn: adminUsername || adminFullName,
        role: 'floor_manager',
        roleTitleAr: 'المدير العام للمطعم (Admin)',
        roleTitleEn: 'General Manager (Admin)',
        avatar: adminUserProfile.avatar,
        status: 'on_shift',
        shiftStart: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ordersHandled: 0,
        performanceScore: 100,
      });

      const restaurantAccount = {
        nameAr: restaurantName,
        nameEn: restaurantNameEn || restaurantName,
        cuisine: cuisineType,
        branchAr: finalBranch,
        branchEn: finalBranch,
        ownerEmail: googleEmail || 'admin@' + restaurantName.replace(/\s+/g, '').toLowerCase() + '.com',
        ownerName: adminFullName,
        ownerPhone: ownerPhone || '',
        currency: 'EGP',
        vatRate: 0.14,
        tablesCount,
        stations: selectedStations,
        printerPaper,
        enableCustomerDisplay,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem('restaurant_os_account', JSON.stringify(restaurantAccount));
      localStorage.setItem('restaurant_os_registered', 'true');
      localStorage.setItem('restaurant_os_current_user', JSON.stringify(adminUserProfile));
      localStorage.setItem('restaurant_os_master_pin', adminPin);
      localStorage.setItem('restaurant_os_app_mode', 'restaurant');

      // Clean Slate database
      usePosStore.setState({
        items: [],
        cart: [],
        selectedTable: '',
        customerName: '',
        customerPhone: '',
        recentOrders: [],
        categories: [
          { id: 'all', name: 'الكل', nameEn: 'All', icon: 'Sparkles' },
          { id: 'main', name: 'الأطباق الرئيسية', nameEn: 'Main Dishes', icon: 'Utensils' },
          { id: 'sides', name: 'المقبلات والأطباق الجانبية', nameEn: 'Sides & Appetizers', icon: 'Layers' },
          { id: 'drinks', name: 'المشروبات والقهوة', nameEn: 'Beverages & Coffee', icon: 'Coffee' },
        ],
      });

      useAppStore.setState({
        activeUser: adminUserProfile,
        branchNameAr: restaurantAccount.branchAr,
        branchNameEn: restaurantAccount.branchEn,
        isRegistered: true,
        isLocked: false,
        appMode: 'restaurant',
      });

      playSound('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      playSound('alert');
      alert('Setup Error: ' + err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-100 dark:bg-[#07090f] text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar font-sans select-none transition-colors duration-300">
      {/* Ambient Glows */}
      <div className="absolute top-10 start-1/4 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 end-1/4 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-4xl bg-white/95 dark:bg-[#0c0f17]/95 border border-slate-200 dark:border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 my-auto backdrop-blur-2xl transition-colors duration-300"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-purple-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Restaurant OS 2026</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Enterprise Cloud
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {language === 'ar' ? 'المنظومة السحابية الموحدة لإدارة المطاعم، الفروع والذكاء المالي' : 'Unified Restaurant Management Platform'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {language === 'ar' ? 'English' : 'عربي'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title="تبديل المظهر / Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-600" />
              )}
            </button>
          </div>
        </div>

        {/* View 1: Main Welcome Screen */}
        {currentView === 'welcome' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {language === 'ar'
                  ? 'منظومة واحدة متكاملة لإدارة كل تفاصيل مطعمك وتوصيل المأكولات'
                  : 'All-in-One Intelligent Restaurant Management & Food Ordering Platform'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'نقطة بيع فائقة السرعة، شاشات مطبخ ذكية KDS، تحليلات مالية، بوابة عملاء لطلب الطعام، ومساعد ذكاء اصطناعي شامل.'
                  : 'High-speed POS, KDS station routing, financial analytics, customer food ordering, and omniscient AI copilot.'}
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-amber-500/20 shadow-sm dark:shadow-none space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">نقطة بيع وشاشة العميل</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">شاشة كاشير سريعة &lt;5ms مع شاشة مزدوجة للعميل ودفع بـ QR.</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-orange-500/20 shadow-sm dark:shadow-none space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">بوابة طلب الطعام (للزبائن)</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">استكشاف أرقى المطاعم وتتبع الطلبات والتوصيل أسرع 1000x من التطبيقات.</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-purple-500/20 shadow-sm dark:shadow-none space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">بوابة المالك والتحليلات</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">مراقبة الفروع المركزية بالجنيه المصري ومصفوفة BCG لربحية المنيو.</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">درع الأمان والتشفير</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">تراخيص RSA-2048 وبصمة العتاد مع دعم العمل الكامل أوفلاين.</p>
              </div>
            </div>

            {/* Action Buttons: Single Google Button + Download App for Devices */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black text-sm shadow-xl hover:shadow-2xl border border-slate-300 dark:border-white/20 flex items-center justify-center gap-3.5 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {/* Official Google SVG Icon */}
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                )}
                <span>
                  {isAuthenticating
                    ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...')
                    : (language === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google')}
                </span>
              </button>

              <button
                onClick={() => {
                  playSound('pop');
                  setShowDownloadModal(true);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>{language === 'ar' ? 'تحميل التطبيق لكافة الأجهزة 📥' : 'Download App for Devices 📥'}</span>
              </button>
            </div>
          </div>
        )}

        {/* View 2: Multi-Role Onboarding & Selection Flow */}
        {currentView === 'onboarding-wizard' && (
          <div className="space-y-6">
            {/* Step 0: Choose User Role */}
            {selectedRole === null && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    من أنت؟ اختر نوع حسابك للمتابعة
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    يمكنك دائماً التبديل بين الحسابات لاحقاً من الإعدادات
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* 1. Customer Card */}
                  <button
                    onClick={() => {
                      playSound('pop');
                      handleLaunchCustomer();
                    }}
                    className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-start cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">عميل وزبون طعام (Customer)</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        أريد تصفح قوائم المطاعم الفاخرة، طلب وجبات لذيذة وتتبع التوصيل.
                      </p>
                    </div>

                    <div className="pt-2 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                      <span>دخول واستكشاف المطاعم</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* 2. Restaurant Owner / Admin Card */}
                  <button
                    onClick={() => {
                      playSound('pop');
                      setSelectedRole('admin');
                      setWizardStep(1);
                    }}
                    className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all text-start cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Store className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">صاحب مطعم / مدير (Owner & Admin)</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        أريد تهيئة مطعم جديد، نقاط البيع الكاشير، شاشات المطبخ والموظفين.
                      </p>
                    </div>

                    <div className="pt-2 text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                      <span>تهيئة وتشغيل مطعمي ↵</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* 3. Cashier Staff Card */}
                  <button
                    onClick={() => {
                      playSound('pop');
                      setSelectedRole('cashier');
                    }}
                    className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-start cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">كاشير وموظف تشغيل (Cashier)</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        أعمل ككاشير في مطعم وأريد الدخول المباشر لنقطة البيع وتسجيل الطلبات.
                      </p>
                    </div>

                    <div className="pt-2 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <span>دخول محطة الكاشير</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Quick Cashier Login Flow */}
            {selectedRole === 'cashier' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 text-xs max-w-lg mx-auto">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">تسجيل دخول كاشير نقطة البيع</h3>
                  <p className="text-xs text-slate-500">أدخل اسمك ورمز PIN السري لبدء تسجيل الطلبات والوردية</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1">اسم الكاشير *</label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="اسم الكاشير"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">رمز PIN السري للكاشير (4 أرقام) *</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-center font-mono font-bold text-xs tracking-widest focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      تغيير الدور
                    </button>
                    <button
                      onClick={handleLaunchCashier}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                    >
                      دخول نقطة البيع ↵
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Admin Restaurant Onboarding Flow (4 Steps) */}
            {selectedRole === 'admin' && (
              <div className="space-y-5">
                {/* Step Indicators */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedRole(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white">معالج تهيئة وتخصيص المطعم</h2>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">خصص هوية المنشأة، الصالة، ونقاط البيع وحساب المدير المسؤول</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {[
                      { num: 1, label: 'بيانات المطعم' },
                      { num: 2, label: 'الصالة والمطبخ' },
                      { num: 3, label: 'الكاشير والبيانات' },
                      { num: 4, label: 'حساب المدير' },
                    ].map((s) => (
                      <button
                        key={s.num}
                        onClick={() => {
                          playSound('click');
                          setWizardStep(s.num as any);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          wizardStep === s.num
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : wizardStep > s.num
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{s.num}. {s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 1: Restaurant Identity & Cuisine */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-amber-500" />
                          <span>اسم المطعم / المنشأة (بالعربية) *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="مثال: مطعم السرايا للمأكولات الفاخرة"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-amber-500" />
                          <span>اسم المطعم (بالإنجليزية)</span>
                        </label>
                        <input
                          type="text"
                          value={restaurantNameEn}
                          onChange={(e) => setRestaurantNameEn(e.target.value)}
                          placeholder="e.g. Al Saraya Fine Dining"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>الفرع والمدينة الرئيسية *</span>
                        </label>
                        <input
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="مثال: فرع المعادي — القاهرة"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-amber-500" />
                          <span>رقم الهاتف / الواتساب</span>
                        </label>
                        <input
                          type="tel"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          placeholder="01012345678"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Cuisine Type Cards */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">نوع النشاط والتخصص الغذائي:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { id: 'grill', name: 'مشويات وفاخر', icon: '🥩' },
                          { id: 'burgers', name: 'برجر وفاست فود', icon: '🍔' },
                          { id: 'pizza', name: 'بيتزا وإيطالي', icon: '🍕' },
                          { id: 'cafe', name: 'كافيه ومخبوزات', icon: '☕' },
                          { id: 'shawarma', name: 'شاورما ودجاج', icon: '🍗' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              playSound('tap');
                              setCuisineType(c.id as any);
                            }}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                              cuisineType === c.id
                                ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 shadow-md font-bold'
                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="text-xl">{c.icon}</span>
                            <span className="text-[11px] font-bold">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={() => {
                          if (!restaurantName.trim()) {
                            alert(language === 'ar' ? 'يرجى إدخال اسم المطعم' : 'Please enter restaurant name');
                            return;
                          }
                          playSound('click');
                          setWizardStep(2);
                        }}
                        className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>التالي: الصالة والمطبخ ↵</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Dine-in & Kitchen Stations */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">عدد طاولات صالة الطعام المقترحة:</label>
                      <div className="flex gap-2">
                        {[6, 12, 18, 24, 36].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              playSound('tap');
                              setTablesCount(num);
                            }}
                            className={`flex-1 py-2.5 rounded-2xl font-bold font-mono transition-all cursor-pointer ${
                              tablesCount === num
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {num} طاولة
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">شاشات المطبخ والمحطات المستهدفة (KDS):</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'grill', name: 'محطة الشواية واللحوم (Grill Station)', desc: 'استقبال بونات المشاوي واللحوم' },
                          { id: 'fryer', name: 'محطة المقليات والبرجر (Fryer Station)', desc: 'استقبال بونات الدجاج والمقليات' },
                          { id: 'salad', name: 'محطة المقبلات والسلطات (Cold / Salad)', desc: 'استقبال السلطات والمقبلات الباردة' },
                          { id: 'bar', name: 'محطة المشروبات والبار (Beverages & Bar)', desc: 'استقبال القهوة والعصائر الفريش' },
                        ].map((station) => {
                          const isSelected = selectedStations.includes(station.id);
                          return (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => toggleStation(station.id)}
                              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-200 shadow-sm'
                                  : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{station.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{station.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                                {isSelected && '✓'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between">
                      <button
                        onClick={() => {
                          playSound('click');
                          setWizardStep(1);
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/10 cursor-pointer"
                      >
                        السابق
                      </button>
                      <button
                        onClick={() => {
                          playSound('click');
                          setWizardStep(3);
                        }}
                        className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        التالي: الكاشير والبيانات ↵
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: POS Defaults & Clean Slate Choice */}
                {wizardStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-amber-500" />
                        <span>مقاس طابعة الفواتير الحرارية:</span>
                      </label>
                      <div className="flex gap-2">
                        {['80mm', '58mm'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              playSound('tap');
                              setPrinterPaper(size as any);
                            }}
                            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                              printerPaper === size
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {size} {size === '80mm' ? '(قياسي للمطاعم)' : '(فود ترك)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">طريقة بدء قاعدة البيانات:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            setDataMode('clean');
                          }}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                            dataMode === 'clean'
                              ? 'bg-amber-500/15 border-amber-500 shadow-md'
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>قاعدة بيانات نظيفة 100% (Clean Slate)</span>
                            </span>
                            {dataMode === 'clean' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400">
                            بدون أي بيانات وهمية، جاهزة لإدخال منيو ومخزن وطاولات مطعمك الحقيقي.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            setDataMode('starter');
                          }}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                            dataMode === 'starter'
                              ? 'bg-amber-500/15 border-amber-500 shadow-md'
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Utensils className="w-4 h-4 text-orange-500" />
                              <span>أصناف استرشادية بالجنيه المصري</span>
                            </span>
                            {dataMode === 'starter' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400">
                            تحميل أصناف نموذجية مصرية لتسهيل الاستكشاف الأولي.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <button
                        onClick={() => {
                          playSound('click');
                          setWizardStep(2);
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/10 cursor-pointer"
                      >
                        السابق
                      </button>

                      <button
                        onClick={() => {
                          playSound('click');
                          setWizardStep(4);
                        }}
                        className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        التالي: إنشاء حساب المدير المسؤول (Admin) ↵
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Admin User Creation */}
                {wizardStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-xs">إنشاء حساب المدير المسؤول (Admin Manager)</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                          حساب المدير يمتلك صلاحيات أعلى من باقي طاقم العمل لإدارة الموظفين، تقفيل المناوبات، تقارير الأرباح وتعديل المنيو.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span>اسم المدير المسؤول الكامل *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adminFullName}
                          onChange={(e) => setAdminFullName(e.target.value)}
                          placeholder="مثال: أحمد محمود"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          <span>رمز PIN السري الرئيسي للكاشير (4 أرقام) *</span>
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="1234"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-center font-mono font-bold text-slate-900 dark:text-white tracking-widest focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <button
                        onClick={() => {
                          playSound('click');
                          setWizardStep(3);
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/10 cursor-pointer"
                      >
                        السابق
                      </button>

                      <button
                        onClick={handleFinalizeSetup}
                        disabled={isAuthenticating}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد البيانات وتشغيل منظومة المطعم 🚀</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Download App for Devices Modal (Matching User Reference Image 3 Exactly) */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0c101c] border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-6 start-6 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="text-center space-y-1.5 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2 border border-teal-500/30">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">
                  {language === 'ar' ? 'تحميل تطبيق المطعم المكتبي' : 'Download Restaurant Desktop App'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'حزم تثبيت رسمية للويندوز وشاشات اللمس والتابلت' : 'Official setup packages for Windows, touchscreens and tablets'}
                </p>
              </div>

              {/* Download Items List (Matching Image 3) */}
              <div className="space-y-3.5 pt-2">
                {/* 1. Windows Setup Installer */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#131929] border border-slate-700/60 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Download Green Button on Left */}
                  <a
                    href="/release/Restaurant OS-Setup-1.0.0.exe"
                    download="Restaurant OS-Setup-1.0.0.exe"
                    onClick={() => {
                      playSound('success');
                    }}
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                  >
                    <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
                  </a>

                  {/* Text on Right */}
                  <div className="text-center sm:text-end space-y-1 order-1 sm:order-2 flex-1">
                    <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-teal-950/90 border border-teal-500/40 text-teal-400 text-[10px] font-bold">
                        {language === 'ar' ? 'موصى به' : 'Recommended'}
                      </span>
                      <span className="text-sm font-bold text-white">
                        💾 مثبت الويندوز الرسمي (Windows Setup Installer)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'حزمة كاملة تنشئ اختصارات وتدعم التحديثات التلقائية (86 MB)' : 'Full installer with desktop shortcuts & auto updates (86 MB)'}
                    </p>
                  </div>
                </div>

                {/* 2. Windows Portable Edition */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#131929] border border-slate-700/60 hover:border-slate-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Download Slate Button on Left */}
                  <a
                    href="/release/win-unpacked/Restaurant OS.exe"
                    download="Restaurant OS.exe"
                    onClick={() => {
                      playSound('success');
                    }}
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                  >
                    <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
                  </a>

                  {/* Text on Right */}
                  <div className="text-center sm:text-end space-y-1 order-1 sm:order-2 flex-1">
                    <span className="text-sm font-bold text-white">
                      💼 النسخة المحمولة (Windows Portable Edition)
                    </span>
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'تشغيل فوري مباشر بدون أي تثبيت — مثالية للفلاشة USB (86 MB)' : 'Direct portable execution without installation — ideal for USB (86 MB)'}
                    </p>
                  </div>
                </div>

                {/* 3. PWA / Tablet Edition */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#131929] border border-slate-700/60 hover:border-slate-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Install PWA Button on Left */}
                  <button
                    onClick={() => {
                      playSound('pop');
                      if ('serviceWorker' in navigator && (window as any).deferredPrompt) {
                        (window as any).deferredPrompt.prompt();
                      } else {
                        alert(language === 'ar' ? 'لتثبيت التطبيق على جهازك أو التابلت، افتح القائمة في المتصفح واضغط "تثبيت التطبيق على الشاشة الرئيسية (Install App / Add to Home Screen)"' : 'To install PWA, open browser menu and click "Install App" or "Add to Home Screen".');
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                  >
                    <span>{language === 'ar' ? 'تثبيت PWA' : 'Install PWA'}</span>
                  </button>

                  {/* Text on Right */}
                  <div className="text-center sm:text-end space-y-1 order-1 sm:order-2 flex-1">
                    <span className="text-sm font-bold text-white">
                      📱 التابلت وشاشات اللمس (PWA / Android Tablet)
                    </span>
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'تثبيت فوري كتطبيق ويب متقدم PWA يدعم العمل بدون إنترنت' : 'Instant offline-first Progressive Web App for touch devices'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
