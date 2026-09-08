import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  Tablet,
  Bell,
  Receipt,
  Clock,
  Flame,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Utensils,
  Share2,
  Droplet,
  Coffee,
  Heart,
  Star,
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  Send,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  ArrowRightLeft,
  Check,
  Info,
  Layers,
  ChefHat
} from 'lucide-react';
// Celebration loads on demand — keeps canvas-confetti out of the module chunk.
function burstConfetti(opts: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number }; colors?: string[] }): void {
  import('canvas-confetti')
    .then(({ default: fire }) => fire(opts))
    .catch(() => {});
}
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore, INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../../stores/usePosStore';
import { useTableStore } from '../../stores/useTableStore';
import { getTranslation } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { tableOrderService } from '../../services/tableOrderService';
import { eventBus } from '../../services/eventBus';
import {
  TableCookingStage,
  WaiterCallType,
  TablePaymentMethod,
  GuestCartItem,
  TableOrderProgress,
  TableGuestSession,
  BillRequestPayload,
  GuestFeedbackPayload,
} from '../../types/tablePortal';
import { MenuItem } from '../../types';

export const TableGuestPortalModule: React.FC = () => {
  const { language, playSound, activeUser } = useAppStore();
  const t = getTranslation(language);
  const tablesFromStore = useTableStore((s) => s.tables);

  // View & Mode State
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [activeTab, setActiveTab] = useState<'menu' | 'tracker' | 'waiter' | 'bill' | 'qr_simulator'>('menu');
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('T-04');
  const [guestSession, setGuestSession] = useState<TableGuestSession | null>(null);

  // Menu Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [maxCalories, setMaxCalories] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'fastest_prep' | 'calories_low'>('recommended');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Cart & Orders State
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingDish, setCustomizingDish] = useState<MenuItem | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState('Medium');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [dishNotes, setDishNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Active Order & Live Tracker
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderProgress, setOrderProgress] = useState<TableOrderProgress | null>(null);
  const [isSimulatingWorkflow, setIsSimulatingWorkflow] = useState(false);

  // Waiter Call State
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [waiterCallType, setWaiterCallType] = useState<WaiterCallType>('general_waiter');
  const [waiterCallNotes, setWaiterCallNotes] = useState('');
  const [waiterCallSent, setWaiterCallSent] = useState(false);

  // Electronic Bill State
  const [billData, setBillData] = useState<BillRequestPayload | null>(null);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [selectedTipPercent, setSelectedTipPercent] = useState<number>(10);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<TablePaymentMethod>('apple_pay');
  const [isBillSettled, setIsBillSettled] = useState(false);

  // Guest Feedback State
  const [guestRating, setGuestRating] = useState<number>(5);
  const [feedbackTags, setFeedbackTags] = useState<string[]>(['طهي استثنائي', 'تقديم فاخر']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize or switch Table Session
  useEffect(() => {
    const initSession = async () => {
      const session = await tableOrderService.createOrGetGuestSession(
        selectedTableNumber,
        2,
        'عبدالعزيز السبيعي',
        '0501234567'
      );
      setGuestSession(session);

      if (session.activeOrderId) {
        setActiveOrderId(session.activeOrderId);
        const prog = tableOrderService.getOrderProgress(session.activeOrderId);
        if (prog) setOrderProgress(prog);
      }
    };
    initSession();
  }, [selectedTableNumber]);

  // 2. Real-time Live Order Progress Poller & Event Listener
  useEffect(() => {
    if (!activeOrderId) return;

    const syncProgress = () => {
      const prog = tableOrderService.getOrderProgress(activeOrderId);
      if (prog) setOrderProgress({ ...prog });
    };

    syncProgress();
    const interval = setInterval(syncProgress, 3000);

    const unsubStage = eventBus.on('TABLE_ORDER_STAGE_CHANGED', (event) => {
      if (event.payload.orderId === activeOrderId) {
        syncProgress();
      }
    });

    const unsubReady = eventBus.on('KDS_ITEM_READY', (event) => {
      if (event.payload.orderId === activeOrderId) {
        syncProgress();
      }
    });

    return () => {
      clearInterval(interval);
      unsubStage();
      unsubReady();
    };
  }, [activeOrderId]);

  // 3. Filtered & Sorted Menu Items
  const filteredDishes = useMemo(() => {
    return tableOrderService.filterMenu(INITIAL_MENU_ITEMS as any, {
      category: selectedCategory,
      searchQuery,
      allergensToExclude: selectedAllergens,
      maxCalories,
      sortBy,
      onlyAvailable: true,
    });
  }, [selectedCategory, searchQuery, selectedAllergens, maxCalories, sortBy]);

  // 4. Cart Financial Calculations
  const cartSubtotal = guestCart.reduce((sum, item) => sum + item.itemTotal, 0);
  const cartVat = cartSubtotal * 0.15;
  const cartGrandTotal = cartSubtotal + cartVat;
  const cartTotalItemsCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);

  const getDishNameAr = (d: any) => d?.name || d?.nameAr || '';
  const getDishNameEn = (d: any) => d?.nameEn || d?.name || '';
  const getDishPrepTime = (d: any) => d?.prepTimeMinutes || d?.preparationTimeMinutes || 12;

  // Cart Operations
  const handleOpenDishCustomizer = (dish: any) => {
    playSound('pop');
    setCustomizingDish(dish);
    setSelectedDoneness('Medium');
    setSelectedExtras([]);
    setDishNotes('');
  };

  const handleConfirmCustomizedDish = () => {
    if (!customizingDish) return;
    playSound('click');

    const extrasTotal = selectedExtras.length * 6;
    const unitPrice = customizingDish.price + extrasTotal;
    const modifierRecord: Record<string, string> = {
      doneness: selectedDoneness,
      extras: selectedExtras.join('، '),
    };

    const cartUniqueId = `${customizingDish.id}_${selectedDoneness}_${selectedExtras.sort().join('_')}_${dishNotes}`;
    const existingIndex = guestCart.findIndex((i) => i.cartUniqueId === cartUniqueId);

    if (existingIndex > -1) {
      const updated = [...guestCart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].itemTotal = updated[existingIndex].quantity * unitPrice;
      setGuestCart(updated);
    } else {
      setGuestCart([
        ...guestCart,
        {
          cartUniqueId,
          dish: customizingDish,
          quantity: 1,
          selectedModifiers: modifierRecord,
          selectedExtras,
          specialInstructions: dishNotes,
          unitPrice,
          itemTotal: unitPrice,
        },
      ]);
    }

    setCustomizingDish(null);
    showToast(`تمت إضافة ${language === 'ar' ? getDishNameAr(customizingDish) : getDishNameEn(customizingDish)} إلى سلتك ✨`);
  };

  const handleUpdateCartQty = (uniqueId: string, delta: number) => {
    playSound('click');
    const updated = guestCart
      .map((item) => {
        if (item.cartUniqueId === uniqueId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty, itemTotal: newQty * item.unitPrice } : null;
        }
        return item;
      })
      .filter(Boolean) as GuestCartItem[];

    setGuestCart(updated);
  };

  // 5. Submit Order Directly to Kitchen
  const handleSendOrderToKitchen = async () => {
    if (!guestSession || guestCart.length === 0) return;
    playSound('kitchen-bell');

    try {
      const { order, progress } = await tableOrderService.placeGuestOrder(
        guestSession,
        guestCart,
        orderNotes
      );

      setActiveOrderId(order.id);
      setOrderProgress(progress);
      setGuestCart([]);
      setIsCartOpen(false);
      setActiveTab('tracker');

      // Celebration Confetti
      burstConfetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
      });

      showToast(`🎉 تم إرسال طلبك رقم ${order.orderNumber} مباشرة إلى المطبخ!`);
    } catch (err: any) {
      showToast(`خطأ: ${err.message}`);
    }
  };

  // 6. Simulate Kitchen Progress Bumps (Demo Tool)
  const handleSimulateKitchenBump = async (targetStage: TableCookingStage) => {
    if (!activeOrderId) return;
    playSound('tap');
    const updated = await tableOrderService.advanceOrderStage(activeOrderId, targetStage);
    if (updated) {
      setOrderProgress(updated);
      showToast(`تحديث المطبخ: تم التحويل إلى مرحلة [${targetStage}]`);
    }
  };

  const handleStartAutoSimulation = async () => {
    if (!activeOrderId) return;
    setIsSimulatingWorkflow(true);
    showToast('🚀 بدء محاكاة المطبخ التلقائية (مراحل الطهي كل 3 ثوانٍ)...');
    await tableOrderService.simulateKitchenWorkflow(activeOrderId, 3000);
    setTimeout(() => setIsSimulatingWorkflow(false), 9500);
  };

  // 7. Waiter Calling Bell
  const handleTriggerWaiterCall = async (type: WaiterCallType) => {
    playSound('kitchen-bell');
    setWaiterCallType(type);
    setIsCallingWaiter(true);

    await tableOrderService.callWaiter(selectedTableNumber, type, waiterCallNotes);
    setWaiterCallSent(true);

    showToast(`🛎️ تم إرسال نداء الويتر لطاولة ${selectedTableNumber} بنجاح!`);
    setTimeout(() => setIsCallingWaiter(false), 2000);
  };

  const handleResolveWaiterCall = async () => {
    playSound('pop');
    await tableOrderService.resolveWaiterCall(selectedTableNumber);
    setWaiterCallSent(false);
    showToast('تم إلغاء أو تأكيد وصول الويتر ✅');
  };

  // 8. Electronic Bill Request & Split Calculator
  const handleRequestElectronicBill = async () => {
    if (!activeOrderId) return;
    playSound('click');

    try {
      const bill = await tableOrderService.requestElectronicBill(
        activeOrderId,
        selectedPaymentMethod,
        selectedTipPercent,
        splitCount
      );
      setBillData(bill);
      setActiveTab('bill');
      showToast('🧾 تم تجهيز الفاتورة الإلكترونية وحساب الضريبة والتقسيم!');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleSettlePayment = async () => {
    if (!activeOrderId) return;
    playSound('cash-register');

    const res = await tableOrderService.settleTableBill(
      activeOrderId,
      selectedPaymentMethod,
      billData?.tipAmount || 0
    );

    if (res.success) {
      setIsBillSettled(true);
      burstConfetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      showToast('✅ تم سداد الفاتورة بنجاح. شكراً لزيارتكم ونتمنى لكم يوماً سعيداً!');
    }
  };

  // 9. Submit Guest Feedback
  const handleSubmitFeedback = async () => {
    if (!activeOrderId) return;
    playSound('success');

    const feedbackPayload: GuestFeedbackPayload = {
      tableNumber: selectedTableNumber,
      orderId: activeOrderId,
      rating: guestRating,
      tags: feedbackTags,
      comment: feedbackComment,
      submittedAt: new Date().toISOString(),
      customerName: guestSession?.guestName,
    };

    await tableOrderService.submitGuestFeedback(feedbackPayload);
    setFeedbackSubmitted(true);
    showToast('🌟 شكراً جزيلاً لتقييمك الكريم!');
  };

  // QR Code payload for current table
  const currentTableQr = tableOrderService.generateTableQr(selectedTableNumber);

  // Available allergen pills
  const allergenList = [
    { id: 'gluten', nameAr: 'الغلوتين', nameEn: 'Gluten' },
    { id: 'dairy', nameAr: 'مشتقات الحليب', nameEn: 'Dairy' },
    { id: 'nuts', nameAr: 'المكسرات', nameEn: 'Nuts' },
    { id: 'shellfish', nameAr: 'المأكولات البحرية', nameEn: 'Shellfish' },
    { id: 'eggs', nameAr: 'البيض', nameEn: 'Eggs' },
    { id: 'soy', nameAr: 'الصويا', nameEn: 'Soy' },
  ];

  const tableList = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10', 'VIP-01', 'VIP-02'];

  return (
    <div className="h-full flex flex-col overflow-hidden select-none bg-gradient-to-br from-[#0c0e14] via-[#090b10] to-[#06070a] text-slate-100">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-amber-500/30 flex items-center gap-2.5 border border-amber-200"
          >
            <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar: Table ID, QR Scanner simulator, View Switcher & Guest Profile */}
      <header className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-surface/70 backdrop-blur-2xl">
        {/* Left: Table Identifier & QR Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">
                {language === 'ar' ? 'بوابة طلب الطاولة الذكية' : 'Tableside Guest Portal'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-black">
                {selectedTableNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{guestSession?.guestName || 'ضيف مميز'}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{guestSession?.loyaltyTier?.toUpperCase()} VIP (350 نقطة)</span>
            </div>
          </div>
        </div>

        {/* Center: Module Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'menu', label: language === 'ar' ? 'المنيو الرقمي' : 'Digital Menu', icon: Utensils },
            { id: 'tracker', label: language === 'ar' ? 'متتبع الطلب' : 'Live Tracker', icon: Clock, badge: orderProgress?.stage },
            { id: 'waiter', label: language === 'ar' ? 'جرس الويتر' : 'Call Waiter', icon: Bell, alert: waiterCallSent },
            { id: 'bill', label: language === 'ar' ? 'الفاتورة والحساب' : 'Bill & Pay', icon: Receipt },
            { id: 'qr_simulator', label: language === 'ar' ? 'رمز QR' : 'Table QR', icon: QrCode },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('tap');
                  setActiveTab(tab.id as any);
                }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -end-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Table Switcher & Viewport Preview Switcher */}
        <div className="flex items-center gap-2">
          {/* Table Selector Dropdown */}
          <select
            value={selectedTableNumber}
            onChange={(e) => {
              playSound('click');
              setSelectedTableNumber(e.target.value);
            }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 font-mono font-bold text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {tableList.map((tNum) => (
              <option key={tNum} value={tNum} className="bg-slate-900 text-white">
                {tNum}
              </option>
            ))}
          </select>

          {/* Viewport Device Switcher */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                deviceMode === 'mobile' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Smartphone View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                deviceMode === 'tablet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Optional Smartphone / Tablet Centered Frame */}
      <main className="flex-1 overflow-hidden flex justify-center p-2 sm:p-4">
        <div
          className={`h-full w-full flex flex-col overflow-hidden transition-all duration-300 ${
            deviceMode === 'mobile'
              ? 'max-w-md bg-slate-950/80 rounded-3xl border border-white/10 shadow-2xl relative'
              : deviceMode === 'tablet'
              ? 'max-w-3xl bg-slate-950/70 rounded-3xl border border-white/10 shadow-2xl relative'
              : 'w-full'
          }`}
        >
          {/* Active Order Live Floating Banner (if order exists & on menu tab) */}
          {activeOrderId && orderProgress && activeTab === 'menu' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setActiveTab('tracker')}
              className="m-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>{language === 'ar' ? 'طلبك قيد التحضير' : 'Order Cooking'}</span>
                    <span className="text-[10px] text-amber-400 font-mono">({orderProgress.orderNumber})</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {orderProgress.remainingMinutes > 0
                      ? `${orderProgress.remainingMinutes} دقيقة متبقية للتقديم`
                      : 'جاهز الآن للتقديم على طاولتك!'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </motion.div>
          )}

          {/* =========================================================================
              TAB 1: DIGITAL MENU
             ========================================================================= */}
          {activeTab === 'menu' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar & Allergen Filter Toggle */}
              <div className="p-3 border-b border-white/5 space-y-2.5 bg-surface/30">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'ar' ? 'ابحث في المنيو (ستيك، برجر، موهيتو)...' : 'Search dishes, drinks...'}
                      className="w-full rounded-2xl ps-10 pe-4 py-2 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <button
                    onClick={() => setShowFiltersModal(!showFiltersModal)}
                    className={`p-2 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedAllergens.length > 0 || maxCalories > 0
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {selectedAllergens.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                        {selectedAllergens.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Categories Horizontal Carousel */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {INITIAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        playSound('tap');
                        setSelectedCategory(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {language === 'ar' ? cat.name : cat.nameEn}
                    </button>
                  ))}
                </div>

                {/* Active Filter Chips */}
                {selectedAllergens.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400">استبعاد الحساسية:</span>
                    {selectedAllergens.map((alg) => (
                      <span
                        key={alg}
                        onClick={() => setSelectedAllergens(selectedAllergens.filter((a) => a !== alg))}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {alg} <X className="w-3 h-3" />
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectedAllergens([])}
                      className="text-[10px] text-amber-400 underline font-bold"
                    >
                      مسح الكل
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Dishes Grid */}
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                {filteredDishes.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                    <Utensils className="w-10 h-10 mx-auto text-slate-500 opacity-50" />
                    <p className="text-xs font-bold">لا توجد أصناف تطابق خيارات الفلترة المحددة</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                        setSelectedAllergens([]);
                        setMaxCalories(0);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                ) : (
                  filteredDishes.map((dish) => (
                    <motion.div
                      key={dish.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-3 rounded-2xl bg-surface/60 hover:bg-surface border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between group shadow-lg"
                    >
                      {/* Image & Price pill */}
                      <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2.5 bg-black/40">
                        <img
                          src={dish.image}
                          alt={getDishNameAr(dish)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 end-2 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-xs font-mono font-black text-amber-400 border border-amber-400/20">
                          {dish.price} {t.currency}
                        </span>

                        {dish.calories && (
                          <span className="absolute top-2 start-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-300">
                            🔥 {dish.calories} سعرة
                          </span>
                        )}
                      </div>

                      {/* Content & Modifiers trigger */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {language === 'ar' ? getDishNameAr(dish) : getDishNameEn(dish)}
                          </h3>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {getDishPrepTime(dish)} دقيقة
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">✨ مميز</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenDishCustomizer(dish as any)}
                          className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تخصيص وإضافة' : 'Customize & Add'}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Bottom Sticky Cart Trigger Bar */}
              <div className="p-3 border-t border-white/10 bg-surface/80 backdrop-blur-2xl flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{language === 'ar' ? 'سلة الطلب' : 'Cart'}</span>
                  {cartTotalItemsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                      {cartTotalItemsCount}
                    </span>
                  )}
                </button>

                <div className="text-end">
                  <div className="text-[10px] text-slate-400">{language === 'ar' ? 'الإجمالي مع الضريبة:' : 'Total with VAT:'}</div>
                  <div className="text-sm font-black text-amber-400 font-mono">
                    {cartGrandTotal.toFixed(2)} {t.currency}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  disabled={guestCart.length === 0}
                  onClick={() => setIsCartOpen(true)}
                  className="rounded-2xl font-black text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'مراجعة وتأكيد' : 'Review'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: LIVE COOKING ORDER TRACKER
             ========================================================================= */}
          {activeTab === 'tracker' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {!activeOrderId || !orderProgress ? (
                <div className="text-center py-16 text-slate-400 space-y-3">
                  <Clock className="w-12 h-12 mx-auto text-amber-500/40 animate-spin" />
                  <h3 className="text-sm font-black text-white">لا يوجد طلب نشط لهذه الطاولة حالياً</h3>
                  <p className="text-xs text-slate-400">تفضل باستعراض القائمة وإرسال طلبك للبدء في تتبعه لحظياً!</p>
                  <Button variant="primary" size="md" onClick={() => setActiveTab('menu')} className="rounded-2xl text-xs font-black">
                    تصفح المنيو الآن
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Order Status Card with Radial Minutes Countdown */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 text-center space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold">
                        {orderProgress.orderNumber}
                      </span>
                      <span className="text-slate-400">
                        طاولة <strong className="text-white font-mono">{orderProgress.tableNumber}</strong>
                      </span>
                    </div>

                    {/* Progress Circle & Remaining Minutes */}
                    <div className="py-2 flex flex-col items-center">
                      <div className="w-28 h-28 rounded-full border-4 border-amber-500/20 border-t-amber-400 flex flex-col items-center justify-center animate-spin-slow shadow-2xl shadow-amber-500/20">
                        <span className="text-2xl font-black font-mono text-amber-400">
                          {orderProgress.remainingMinutes}
                        </span>
                        <span className="text-[10px] text-slate-400">دقيقة متبقية</span>
                      </div>
                      <div className="mt-3 text-xs font-black text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>
                          {orderProgress.stage === 'received' && 'تم استلام وتأكيد طلبك بنجاح'}
                          {orderProgress.stage === 'preparing' && 'طلبك قيد الطهي والتحضير الساخن بالمطبخ'}
                          {orderProgress.stage === 'plating' && 'اللمسات الأخيرة والتزيين الفاخر للصحن'}
                          {orderProgress.stage === 'served' && 'تم تقديم طلبك على طاولتك! بالعافية'}
                          {orderProgress.stage === 'billing' && 'طلب الحساب قيد المعالجة'}
                          {orderProgress.stage === 'paid' && 'تم سداد الفاتورة بنجاح'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Step Milestone Stepper */}
                  <div className="p-4 rounded-3xl bg-surface/50 border border-white/5 space-y-3">
                    <h4 className="text-xs font-black text-slate-300">مراحل إعداد الطلب الحية</h4>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { id: 'received', label: 'مستلم ومؤكد', num: '1' },
                        { id: 'preparing', label: 'في المطبخ', num: '2' },
                        { id: 'plating', label: 'تجهيز أخير', num: '3' },
                        { id: 'served', label: 'تم التقديم', num: '4' },
                      ].map((step, idx) => {
                        const isPastOrCurrent = orderProgress.stageIndex >= idx;
                        const isCurrent = orderProgress.stageIndex === idx;

                        return (
                          <div key={step.id} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                                isCurrent
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-110'
                                  : isPastOrCurrent
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : 'bg-white/5 text-slate-500 border border-white/10'
                              }`}
                            >
                              {isPastOrCurrent && !isCurrent ? <Check className="w-4 h-4" /> : step.num}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                isCurrent ? 'text-amber-400' : isPastOrCurrent ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Itemized Cooking Breakdown */}
                  <div className="p-4 rounded-3xl bg-surface/50 border border-white/5 space-y-2.5">
                    <h4 className="text-xs font-black text-slate-300">الأصناف قيد التحضير ({orderProgress.items.length})</h4>
                    <div className="space-y-1.5">
                      {orderProgress.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-white">{item.nameAr}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              item.status === 'ready' || item.status === 'served'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : item.status === 'cooking'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {item.status === 'ready'
                              ? 'جاهز'
                              : item.status === 'cooking'
                              ? 'يُطهى الآن'
                              : 'في الانتظار'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kitchen Stage Simulation Sandbox for Demo/Testing */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-center">
                    <div className="text-[10px] font-bold text-slate-400">⚡ تجربة ومحاكاة مراحل المطبخ الفورية:</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleSimulateKitchenBump('received')}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300"
                      >
                        1. مستلم
                      </button>
                      <button
                        onClick={() => handleSimulateKitchenBump('preparing')}
                        className="py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-bold text-amber-300"
                      >
                        2. بالمطبخ
                      </button>
                      <button
                        onClick={() => handleSimulateKitchenBump('plating')}
                        className="py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-[10px] font-bold text-orange-300"
                      >
                        3. تجهيز أخير
                      </button>
                      <button
                        onClick={() => handleSimulateKitchenBump('served')}
                        className="py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-300"
                      >
                        4. تم التقديم
                      </button>
                    </div>

                    <button
                      onClick={handleStartAutoSimulation}
                      disabled={isSimulatingWorkflow}
                      className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSimulatingWorkflow ? 'المحاكاة التلقائية جارية...' : 'تشغيل المحاكاة التلقائية الكاملة'}</span>
                    </button>
                  </div>

                  {/* Guest Rating Card (if served) */}
                  {orderProgress.stage === 'served' && (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent border border-emerald-500/30 space-y-3">
                      <div className="text-center space-y-1">
                        <h4 className="text-xs font-black text-white">كيف كانت تجربتك مع الوجبة والخدمة؟</h4>
                        <p className="text-[10px] text-slate-400">تقييمك يساعدنا على تقديم أعلى مستويات الفخامة</p>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              playSound('pop');
                              setGuestRating(star);
                            }}
                            className={`p-1 text-xl transition-transform hover:scale-125 ${
                              guestRating >= star ? 'text-amber-400' : 'text-slate-600'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      {/* Compliment Tags */}
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['طهي احترافي 🥩', 'تقديم فاخر ✨', 'سرعة استثنائية ⚡', 'طاقم مرحب 👨‍🍳'].map((tag) => {
                          const isSelected = feedbackTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                playSound('tap');
                                setFeedbackTags(
                                  isSelected ? feedbackTags.filter((t) => t !== tag) : [...feedbackTags, tag]
                                );
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-white/5 text-slate-400 border-white/10'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSubmitFeedback}
                        disabled={feedbackSubmitted}
                        className="w-full rounded-2xl text-xs font-black"
                      >
                        {feedbackSubmitted ? '✅ تم إرسال تقييمك' : 'إرسال التقييم'}
                      </Button>
                    </div>
                  )}

                  {/* Fast Action to Request Bill */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleRequestElectronicBill}
                      className="w-full rounded-2xl font-black text-xs gap-2 shadow-xl shadow-amber-500/20"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>طلب الفاتورة الإلكترونية والحساب</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: WAITER CALL BELL
             ========================================================================= */}
          {activeTab === 'waiter' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="text-center space-y-1.5 py-2">
                <div className="w-14 h-14 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
                  <Bell className="w-7 h-7 animate-bounce" />
                </div>
                <h3 className="text-sm font-black text-white">خدمة النداء اللحظي للويتر</h3>
                <p className="text-xs text-slate-400">
                  طاولة <strong className="text-amber-400 font-mono">{selectedTableNumber}</strong> — اضغط على الخدمة المطلوبة وسيتوجه الويتر فوراً إليك
                </p>
              </div>

              {/* 5 Waiter Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'water_refill', label: 'طلب ماء وضيافة فورية', desc: 'إعادة تعبئة ماء بارد وضيافة', icon: Droplet, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                  { id: 'cutlery_napkins', label: 'أدوات طعام ومناديل', desc: 'شوك، سكاكين، أو مناديل إضافية', icon: Utensils, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { id: 'clean_table', label: 'تنظيف وترتيب الصحن', desc: 'رفع الأطباق الفارغة وترتيب الطاولة', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                  { id: 'general_waiter', label: 'استدعاء الويتر العام', desc: 'استفسار أو مساعدة عامة على الطاولة', icon: Bell, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { id: 'custom_request', label: 'طلب أو استفسار خاص', desc: 'كتابة ملاحظة محددة للويتر', icon: HelpCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTriggerWaiterCall(item.id as WaiterCallType)}
                    className={`p-3.5 rounded-2xl border text-start flex items-start gap-3 transition-all hover:scale-[1.02] cursor-pointer ${item.color}`}
                  >
                    <item.icon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Call Status Pill */}
              {waiterCallSent && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">جرس النداء نشط — الويتر في طريقه إليك الآن</span>
                  </div>
                  <button
                    onClick={handleResolveWaiterCall}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-[10px]"
                  >
                    تأكيد الوصول
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: ELECTRONIC BILL & CHECKOUT
             ========================================================================= */}
          {activeTab === 'bill' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="text-center space-y-1 py-1">
                <h3 className="text-sm font-black text-white">الفاتورة الإلكترونية والسداد السريع</h3>
                <p className="text-xs text-slate-400">
                  متوافق مع هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2 FATOORA)
                </p>
              </div>

              {/* Bill Details Summary Card */}
              <div className="p-4 rounded-3xl bg-surface/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-400">رقم الفاتورة المعتمد:</span>
                  <span className="font-mono font-black text-amber-400">
                    {orderProgress?.orderNumber || 'ORD-20260816-4821'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{(billData?.subtotal || 136).toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono">{(billData?.taxAmount || 20.4).toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>إكرامية الخدمة ({selectedTipPercent}%):</span>
                    <span className="font-mono">
                      {((billData ? billData.subtotal + billData.taxAmount : 156.4) * (selectedTipPercent / 100)).toFixed(2)} {t.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono text-amber-400">
                      {(
                        (billData ? billData.subtotal + billData.taxAmount : 156.4) *
                        (1 + selectedTipPercent / 100)
                      ).toFixed(2)}{' '}
                      {t.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip Selection Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">إكرامية لطاقم الخدمة (اختياري):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        playSound('tap');
                        setSelectedTipPercent(pct);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedTipPercent === pct
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {pct === 0 ? 'بدون' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Bill Calculator */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    تقسيم الفاتورة بالتساوي:
                  </span>
                  <span className="font-mono font-black text-amber-400">{splitCount} أشخاص</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={splitCount}
                    onChange={(e) => setSplitCount(+e.target.value)}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="text-center text-xs font-black text-white">
                  حصة كل شخص:{' '}
                  <span className="text-amber-400 font-mono">
                    {(
                      ((billData ? billData.subtotal + billData.taxAmount : 156.4) *
                        (1 + selectedTipPercent / 100)) /
                      splitCount
                    ).toFixed(2)}{' '}
                    {t.currency}
                  </span>
                </div>
              </div>

              {/* Payment Methods Simulator */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">طريقة الدفع المفضلة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'apple_pay', label: 'Apple Pay', icon: '' },
                    { id: 'mada_card', label: 'بطاقة مدى / فيزا', icon: '💳' },
                    { id: 'cash_waiter', label: 'كاش مع الويتر', icon: '💵' },
                    { id: 'loyalty_points', label: 'نقاط الولاء VIP', icon: '⭐' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => {
                        playSound('tap');
                        setSelectedPaymentMethod(pm.id as TablePaymentMethod);
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedPaymentMethod === pm.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{pm.icon}</span>
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay Now Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSettlePayment}
                disabled={isBillSettled}
                className="w-full rounded-2xl font-black text-sm gap-2 shadow-2xl shadow-amber-500/30"
              >
                <CreditCard className="w-5 h-5" />
                <span>
                  {isBillSettled ? '✅ تم السداد بنجاح' : `سداد الفاتورة الآن (${selectedPaymentMethod.toUpperCase()})`}
                </span>
              </Button>
            </div>
          )}

          {/* =========================================================================
              TAB 5: QR SIMULATOR & STANDING MOCKUP
             ========================================================================= */}
          {activeTab === 'qr_simulator' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-center">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">محاكي ستاند QR Code الخاص بالطاولة</h3>
                <p className="text-xs text-slate-400">
                  يمكن للعملاء توجيه كاميرا هواتفهم لفتح المنيو والطلب فوراً بدون تطبيق
                </p>
              </div>

              {/* Luxury Acrylic Table QR Stand Mockup */}
              <div className="w-64 mx-auto p-5 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400/40 shadow-2xl shadow-amber-500/20 flex flex-col items-center space-y-3">
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                  Restaurant OS Luxury Dining
                </div>

                <div className="w-40 h-40 rounded-2xl bg-white p-3 flex flex-col items-center justify-center shadow-lg">
                  {/* Stylized QR grid */}
                  <div className="w-full h-full border-4 border-slate-950 rounded-xl p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-7 h-7 bg-slate-950 rounded-md" />
                      <div className="w-7 h-7 bg-slate-950 rounded-md" />
                    </div>
                    <div className="text-[9px] font-black font-mono text-slate-950 text-center">
                      SCAN FOR MENU
                    </div>
                    <div className="flex justify-between">
                      <div className="w-7 h-7 bg-slate-950 rounded-md" />
                      <div className="w-4 h-4 bg-amber-500 rounded-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-black font-mono text-white">
                    {currentTableQr.tableNumber}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold">
                    {currentTableQr.sectionName}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Token: {currentTableQr.qrCodeToken}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(currentTableQr.url);
                    showToast('📋 تم نسخ رابط المنيو المباشر للطاولة!');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>نسخ الرابط المباشر</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dish Customizer Modal */}
      {customizingDish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setCustomizingDish(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="relative z-10 w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-sm font-black text-white">
                  {language === 'ar' ? customizingDish.name : customizingDish.nameEn}
                </h3>
                <span className="text-xs font-bold font-mono text-amber-400">
                  {customizingDish.price} {t.currency}
                </span>
              </div>
              <button
                onClick={() => setCustomizingDish(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Doneness Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">درجة استواء اللحم والشواء:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Medium Rare', 'Medium', 'Well Done'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDoneness(d)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedDoneness === d
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">إضافات ومكونات إضافية (+6 ر.س):</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['جبن شيدر مدخن', 'صلصة ترافل', 'بصل مكرمل مقرمش', 'هالبينو حار'].map((extra) => {
                  const isChecked = selectedExtras.includes(extra);
                  return (
                    <button
                      key={extra}
                      onClick={() =>
                        setSelectedExtras(
                          isChecked ? selectedExtras.filter((e) => e !== extra) : [...selectedExtras, extra]
                        )
                      }
                      className={`p-2 rounded-xl text-xs font-bold border text-start flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      <span>{extra}</span>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">ملاحظات خاصة للشيف والمطبخ:</label>
              <textarea
                value={dishNotes}
                onChange={(e) => setDishNotes(e.target.value)}
                placeholder="مثال: بدون بصل، الصوص خارجي..."
                rows={2}
                className="w-full rounded-xl p-2.5 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmCustomizedDish}
              className="w-full rounded-2xl font-black text-xs shadow-lg shadow-amber-500/20"
            >
              تأكيد وإضافة للسلة
            </Button>
          </motion.div>
        </div>
      )}

      {/* Guest Cart Slide-over Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative z-10 w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl p-5 border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {selectedTableNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">سلة طلب الطاولة</h3>
                    <p className="text-[10px] text-slate-400">{guestCart.length} أصناف مختارة</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
                {guestCart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    السلة فارغة. اختر أصنافك من المنيو لتظهر هنا!
                  </div>
                ) : (
                  guestCart.map((item) => (
                    <div
                      key={item.cartUniqueId}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-start"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {language === 'ar' ? getDishNameAr(item.dish) : getDishNameEn(item.dish)}
                        </div>
                        {item.selectedModifiers.doneness && (
                          <div className="text-[10px] text-amber-400">
                            {item.selectedModifiers.doneness} {item.selectedModifiers.extras ? `• ${item.selectedModifiers.extras}` : ''}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div className="text-[10px] text-rose-400 italic">
                            * {item.specialInstructions}
                          </div>
                        )}
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                          {item.itemTotal.toFixed(2)} {t.currency}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => handleUpdateCartQty(item.cartUniqueId, -1)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(item.cartUniqueId, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Notes & Grand Total */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="ملاحظات عامة للطلب بالكامل..."
                  className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none"
                />

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{cartSubtotal.toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono">{cartVat.toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-white/10">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-amber-400 font-mono">{cartGrandTotal.toFixed(2)} {t.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      playSound('delete');
                      setGuestCart([]);
                    }}
                    disabled={guestCart.length === 0}
                    className="rounded-2xl font-bold text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>إلغاء الطلب</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendOrderToKitchen}
                    disabled={guestCart.length === 0}
                    className="rounded-2xl font-black text-xs gap-1.5 shadow-lg shadow-amber-500/25"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال للمطبخ فوراً</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
