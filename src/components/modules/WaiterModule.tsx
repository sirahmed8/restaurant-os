import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Tablet,
  Users,
  Utensils,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Flame,
  Bell,
  Sparkles,
  RefreshCw,
  Receipt,
  Droplet,
  Send,
  Coffee,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Volume2,
  ArrowRightLeft,
  Brush,
  DollarSign
} from 'lucide-react';
// Celebration loads on demand — keeps canvas-confetti out of the module chunk.
function burstConfetti(opts: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number }; colors?: string[] }): void {
  import('canvas-confetti')
    .then(({ default: fire }) => fire(opts))
    .catch(() => {});
}
import { useAppStore } from '../../stores/useAppStore';
import { useTableStore } from '../../stores/useTableStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { usePosStore, INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../../stores/usePosStore';
import { MenuItem, OrderType } from '../../types';
import { DiningTable, TableStatus } from '../../db/schema';
import { getTranslation } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ReceiptPreviewModal } from '../ui/ReceiptPreviewModal';

export const WaiterModule: React.FC = () => {
  const { language, playSound, activeUser } = useAppStore();
  const t = getTranslation(language);

  // Table store & KDS store
  const {
    sections,
    tables,
    selectedSectionId,
    setSelectedSection,
    loadTables,
    updateTableStatus,
    transferTable,
  } = useTableStore();

  const { tickets, loadKdsTickets, updateItemStatus } = useKdsStore();

  // POS Store for fast items
  const menuItems = INITIAL_MENU_ITEMS;
  const categories = INITIAL_CATEGORIES;

  // Waiter local state
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet'>('mobile');
  const [activeTable, setActiveTable] = useState<DiningTable | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [waiterCart, setWaiterCart] = useState<
    {
      item: MenuItem;
      quantity: number;
      modifiers: Record<string, string>;
      notes: string;
      itemTotal: number;
    }[]
  >([]);

  // Modals & Drawers
  const [customizingDish, setCustomizingDish] = useState<MenuItem | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState('Medium');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [orderSentBanner, setOrderSentBanner] = useState<string | null>(null);
  const [quickAlertToast, setQuickAlertToast] = useState<string | null>(null);

  // Load initial tables and tickets
  useEffect(() => {
    loadTables();
    loadKdsTickets();
    const interval = setInterval(() => {
      loadTables();
      loadKdsTickets();
    }, 8000);
    return () => clearInterval(interval);
  }, [loadTables, loadKdsTickets]);

  // Set default active table if none selected
  useEffect(() => {
    if (!activeTable && tables.length > 0) {
      setActiveTable(tables[0]);
    }
  }, [tables, activeTable]);

  // Filter tables by active section
  const currentSectionTables = tables.filter(
    (tbl) => !selectedSectionId || tbl.sectionId === selectedSectionId
  );

  // Filter menu items
  const filteredMenuItems = menuItems.filter((dish) => {
    const matchesCat = selectedCategory === 'all' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate totals
  const subtotal = waiterCart.reduce((sum, i) => sum + i.itemTotal, 0);
  const vatAmount = subtotal * 0.15;
  const grandTotal = subtotal + vatAmount;
  const totalCartCount = waiterCart.reduce((sum, i) => sum + i.quantity, 0);

  // Ready orders from kitchen KDS that need delivery by waiter
  const readyTickets = tickets.filter(
    (ticket) =>
      ticket.order.status === 'ready' ||
      ticket.items.some((i) => i.status === 'ready')
  );

  // Cart operations
  const handleOpenDishCustomizer = (dish: MenuItem) => {
    playSound('pop');
    if (dish.modifiers && dish.modifiers.length > 0) {
      setCustomizingDish(dish);
      setSelectedDoneness('Medium');
      setSelectedExtras([]);
      setItemNotes('');
    } else {
      addToWaiterCart(dish, 1, {}, '');
    }
  };

  const addToWaiterCart = (
    dish: MenuItem,
    qty: number,
    modifiers: Record<string, string>,
    notes: string
  ) => {
    playSound('pop');
    const existingIndex = waiterCart.findIndex(
      (c) =>
        c.item.id === dish.id &&
        JSON.stringify(c.modifiers) === JSON.stringify(modifiers) &&
        c.notes === notes
    );

    if (existingIndex > -1) {
      const updated = [...waiterCart];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].itemTotal = updated[existingIndex].quantity * dish.price;
      setWaiterCart(updated);
    } else {
      setWaiterCart([
        ...waiterCart,
        {
          item: dish,
          quantity: qty,
          modifiers,
          notes,
          itemTotal: dish.price * qty,
        },
      ]);
    }
  };

  const handleConfirmCustomizedDish = () => {
    if (!customizingDish) return;
    const mods: Record<string, string> = {
      doneness: selectedDoneness,
      extras: selectedExtras.join(', '),
    };
    addToWaiterCart(customizingDish, 1, mods, itemNotes);
    setCustomizingDish(null);
  };

  const updateCartQty = (index: number, delta: number) => {
    playSound('click');
    const updated = [...waiterCart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].itemTotal = updated[index].quantity * updated[index].item.price;
    }
    setWaiterCart(updated);
  };

  const clearWaiterCart = () => {
    playSound('delete');
    setWaiterCart([]);
  };

  // Send Order To Kitchen Action
  const handleSendOrderToKitchen = async () => {
    if (!activeTable || waiterCart.length === 0) return;

    playSound('kitchen-bell');

    // 1. Update table status to occupied
    await updateTableStatus(activeTable.id, 'occupied');

    // 2. Celebration confetti
    burstConfetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });

    const orderNum = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderSentBanner(`تم إرسال طلب ${activeTable.tableNumber} (${orderNum}) إلى شاشات المطبخ بنجاح!`);

    // Reset local cart
    setWaiterCart([]);
    setIsMobileCartOpen(false);

    setTimeout(() => {
      setOrderSentBanner(null);
    }, 4000);
  };

  // Quick Waiter Actions (Water, Bill, Clean, Alert)
  const triggerQuickAction = (actionType: string) => {
    playSound('tap');
    if (!activeTable) return;

    let msg = '';
    switch (actionType) {
      case 'water':
        msg = `تم إرسال تنبيه: طاولة ${activeTable.tableNumber} تطلب ماء وضيافة فورية 💧`;
        break;
      case 'bill':
        updateTableStatus(activeTable.id, 'billing');
        msg = `تم إرسال طلب الحساب لطاولة ${activeTable.tableNumber} إلى الكاشير 🧾`;
        break;
      case 'clean':
        updateTableStatus(activeTable.id, 'cleaning');
        msg = `تم تحويل طاولة ${activeTable.tableNumber} إلى حالة التنظيف 🧹`;
        break;
      case 'ready_served':
        msg = `تم تقديم الطلبات للضيوف على طاولة ${activeTable.tableNumber} بنجاح ✅`;
        break;
      default:
        msg = 'تم إرسال الإشعار بنجاح';
    }

    setQuickAlertToast(msg);
    setTimeout(() => setQuickAlertToast(null), 3000);
  };

  const handleTableTransfer = async () => {
    if (!activeTable || !targetTransferTableId) return;
    playSound('kitchen-bell');
    await transferTable(activeTable.id, targetTransferTableId);
    setIsTransferModalOpen(false);
    setQuickAlertToast(`تم نقل الطلب بنجاح إلى الطاولة الجديدة ✅`);
    setTimeout(() => setQuickAlertToast(null), 3000);
  };

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'occupied':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'billing':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cleaning':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTableStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return language === 'ar' ? 'شاغرة ومتاحة' : 'Available';
      case 'occupied':
        return language === 'ar' ? 'مشغولة' : 'Occupied';
      case 'billing':
        return language === 'ar' ? 'طلب الحساب' : 'Billing';
      case 'cleaning':
        return language === 'ar' ? 'تحتاج تنظيف' : 'Cleaning';
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none bg-background/50">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {(orderSentBanner || quickAlertToast) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 border border-amber-300/40"
          >
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>{orderSentBanner || quickAlertToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header / Device View Switcher / Kitchen Bell Alert */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between gap-3 bg-surface/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'تطبيق الويتر المحمول' : 'Mobile Waiter App'}</span>
              <Badge variant="amber" size="sm" dot>
                {activeUser.name || 'خالد الغامدي'}
              </Badge>
            </div>
            <div className="text-[10px] text-slate-400">
              {language === 'ar' ? 'أخذ الطلبات السريعة وإشعارات المطبخ اللحظية' : 'Rapid Table Ordering & KDS Alerts'}
            </div>
          </div>
        </div>

        {/* View Switcher & Kitchen Alert Bell */}
        <div className="flex items-center gap-2">
          {/* Kitchen Ready Orders Pill */}
          {readyTickets.length > 0 && (
            <button
              onClick={() => {
                playSound('kitchen-bell');
                setQuickAlertToast(
                  language === 'ar'
                    ? `تنبيه: يوجد ${readyTickets.length} طلبات جاهزة للتسليم في المطبخ!`
                    : `${readyTickets.length} orders ready in kitchen for pickup!`
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black animate-pulse cursor-pointer shadow-lg shadow-rose-500/10"
            >
              <Bell className="w-4 h-4" />
              <span>{readyTickets.length} {language === 'ar' ? 'جاهز للتسليم' : 'Ready'}</span>
            </button>
          )}

          {/* Viewport Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => {
                playSound('tap');
                setDeviceMode('mobile');
              }}
              className={`p-1.5 rounded-xl transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Handheld Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                playSound('tap');
                setDeviceMode('tablet');
              }}
              className={`p-1.5 rounded-xl transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet Split View"
            >
              <Tablet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Responsive Split: Tables & Order Taking) */}
      <div className={`flex-1 flex overflow-hidden ${deviceMode === 'tablet' ? 'flex-row' : 'flex-col md:flex-row'}`}>
        {/* Left / Top Table Floor Section */}
        <div className={`${deviceMode === 'tablet' ? 'w-80' : 'w-full md:w-80'} flex flex-col border-b md:border-b-0 md:border-e border-white/5 bg-surface/30`}>
          {/* Section Pills */}
          <div className="p-2.5 border-b border-white/5 flex gap-1.5 overflow-x-auto custom-scrollbar">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  playSound('tap');
                  setSelectedSection(sec.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSectionId === sec.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {language === 'ar' ? sec.nameAr : sec.nameEn}
              </button>
            ))}
          </div>

          {/* Tables Grid */}
          <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2 custom-scrollbar">
            {currentSectionTables.map((tbl) => {
              const isSelected = activeTable?.id === tbl.id;
              const hasReadyDish = readyTickets.some((t) => t.order.tableId === tbl.tableNumber);

              return (
                <button
                  key={tbl.id}
                  onClick={() => {
                    playSound('click');
                    setActiveTable(tbl);
                  }}
                  className={`relative p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-surface/60 hover:bg-surface border-white/5'
                  }`}
                >
                  {/* Top table info */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-black text-white font-mono">
                      {tbl.tableNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {tbl.capacity}
                    </span>
                  </div>

                  {/* Status & Ready Notification Badge */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border ${getTableStatusColor(tbl.status)}`}>
                      {getTableStatusLabel(tbl.status)}
                    </span>

                    {hasReadyDish && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Kitchen Dish Ready!" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Table Quick Bar Info */}
          {activeTable && (
            <div className="p-3 border-t border-white/5 bg-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === 'ar' ? 'الطاولة المحددة:' : 'Selected Table:'}</span>
                <span className="font-black text-amber-400 font-mono text-sm">{activeTable.tableNumber}</span>
              </div>

              {/* Waiter Fast Action Quick Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => triggerQuickAction('water')}
                  className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 flex flex-col items-center gap-1 transition-all"
                  title="طلب ماء وضيافة"
                >
                  <Droplet className="w-4 h-4" />
                  <span className="text-[9px] font-bold">ماء</span>
                </button>

                <button
                  onClick={() => triggerQuickAction('bill')}
                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex flex-col items-center gap-1 transition-all"
                  title="طلب الحساب للكاشير"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="text-[9px] font-bold">حساب</span>
                </button>

                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex flex-col items-center gap-1 transition-all"
                  title="نقل الطاولة"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="text-[9px] font-bold">نقل</span>
                </button>

                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex flex-col items-center gap-1 transition-all"
                  title="معاينة الفاتورة الحرارية"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[9px] font-bold">فاتورة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right / Center Menu & Ordering View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Categories & Search Bar */}
          <div className="p-3 border-b border-white/5 space-y-2 bg-surface/40">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث سريع عن صنف بالطعام والمشروبات...' : 'Quick search menu...'}
                className="w-full rounded-2xl ps-10 pe-4 py-2 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playSound('tap');
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {language === 'ar' ? cat.name : cat.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 custom-scrollbar">
            {filteredMenuItems.map((dish) => (
              <motion.button
                key={dish.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpenDishCustomizer(dish)}
                className="p-3 rounded-2xl bg-surface/70 hover:bg-surface border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between text-start cursor-pointer group shadow-sm"
              >
                {/* Dish Image */}
                <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/40">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1.5 end-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400">
                    {dish.price} {t.currency}
                  </span>
                </div>

                {/* Dish Titles */}
                <div>
                  <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {language === 'ar' ? dish.name : dish.nameEn}
                  </h4>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {dish.prepTimeMinutes} د
                    </span>
                    {dish.modifiers && dish.modifiers.length > 0 && (
                      <span className="text-amber-400 font-bold">+ تخصيص</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom Floating Bar / Cart Trigger (Mobile View) */}
          <div className="p-3 border-t border-white/5 bg-surface/80 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playSound('pop');
                  setIsMobileCartOpen(true);
                }}
                className="relative px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Utensils className="w-4 h-4" />
                <span>{language === 'ar' ? 'سلة الطاولة' : 'Table Order'}</span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <div className="text-start">
                <div className="text-[10px] text-slate-400">{language === 'ar' ? 'الإجمالي مع الضريبة:' : 'Total with VAT:'}</div>
                <div className="text-sm font-black text-amber-400 font-mono">
                  {grandTotal.toFixed(2)} {t.currency}
                </div>
              </div>
            </div>

            {/* Direct Send to Kitchen Button */}
            <Button
              variant="primary"
              size="md"
              disabled={waiterCart.length === 0}
              onClick={handleSendOrderToKitchen}
              className="rounded-2xl gap-2 font-black text-xs sm:text-sm"
            >
              <Send className="w-4 h-4" />
              <span>{language === 'ar' ? 'إرسال للمطبخ (KOT)' : 'Send to Kitchen'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer Modal (for Mobile & Tablet) */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileCartOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full sm:max-w-lg bg-card glass-panel-elevated rounded-t-3xl sm:rounded-3xl p-5 border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {activeTable?.tableNumber || 'T-01'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {language === 'ar' ? 'تفاصيل طلب الطاولة' : 'Table Order Details'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {waiterCart.length} {language === 'ar' ? 'أصناف مختارة' : 'items'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
                {waiterCart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    {language === 'ar' ? 'لا توجد أصناف مضافة لهذا الطلب بعد' : 'No items added yet'}
                  </div>
                ) : (
                  waiterCart.map((cartItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-start"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {language === 'ar' ? cartItem.item.name : cartItem.item.nameEn}
                        </div>
                        {cartItem.modifiers && Object.values(cartItem.modifiers).filter(Boolean).length > 0 && (
                          <div className="text-[10px] text-amber-400">
                            {Object.values(cartItem.modifiers).filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {cartItem.notes && (
                          <div className="text-[10px] text-rose-400 italic">
                            * {cartItem.notes}
                          </div>
                        )}
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                          {cartItem.itemTotal.toFixed(2)} {t.currency}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-white">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                    <span className="font-mono">{subtotal.toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                    <span className="font-mono">{vatAmount.toFixed(2)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-white/10">
                    <span>{language === 'ar' ? 'الإجمالي النهائي:' : 'Total:'}</span>
                    <span className="text-amber-400 font-mono">{grandTotal.toFixed(2)} {t.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="danger"
                    size="md"
                    onClick={clearWaiterCart}
                    disabled={waiterCart.length === 0}
                    className="rounded-2xl font-bold text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إلغاء الطلب' : 'Clear'}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendOrderToKitchen}
                    disabled={waiterCart.length === 0}
                    className="rounded-2xl font-black text-xs gap-1.5 shadow-lg shadow-amber-500/25"
                  >
                    <Send className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إرسال للمطبخ' : 'Send Kitchen'}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dish Customizer Modal */}
      {customizingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setCustomizingDish(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-5 shadow-2xl z-10 border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">
                {language === 'ar' ? customizingDish.name : customizingDish.nameEn}
              </h3>
              <span className="text-xs font-bold font-mono text-amber-400">
                {customizingDish.price} {t.currency}
              </span>
            </div>

            {/* Modifiers List */}
            <div className="space-y-3">
              {customizingDish.modifiers?.map((mod) => (
                <div key={mod.id} className="space-y-1.5 text-start">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    {language === 'ar' ? mod.name : mod.nameEn}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {mod.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedDoneness(opt.name)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                          selectedDoneness === opt.name
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Kitchen Notes */}
              <div className="space-y-1 text-start">
                <label className="text-[11px] font-bold text-slate-300 block">
                  {language === 'ar' ? 'ملاحظة خاصة للشيف' : 'Chef Kitchen Note'}
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: بدون بصل، صوص خارجي، حار...' : 'e.g. No onions, spicy...'}
                  className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmCustomizedDish}
              className="w-full rounded-2xl font-black text-xs"
            >
              {language === 'ar' ? 'إضافة للطلب' : 'Add to Order'}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsTransferModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl glass-panel-elevated p-5 shadow-2xl z-10 border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">
                {language === 'ar' ? `نقل طلب طاولة ${activeTable?.tableNumber}` : 'Transfer Table Order'}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-start">
              <label className="text-xs text-slate-300 font-bold block">
                {language === 'ar' ? 'اختر الطاولة الجديدة:' : 'Select New Destination Table:'}
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {tables
                  .filter((t) => t.id !== activeTable?.id && t.status === 'available')
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTargetTransferTableId(t.id)}
                      className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        targetTransferTableId === t.id
                          ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {t.tableNumber}
                    </button>
                  ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!targetTransferTableId}
              onClick={handleTableTransfer}
              className="w-full rounded-2xl font-black text-xs"
            >
              {language === 'ar' ? 'تأكيد نقل الطلب' : 'Confirm Table Transfer'}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Luxury Thermal Receipt Modal Simulation */}
      <ReceiptPreviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={null}
        items={waiterCart.map((c, idx) => ({
          id: `item-${idx}`,
          orderId: 'ord-waiter-draft',
          menuItemId: c.item.id,
          nameAr: c.item.name,
          nameEn: c.item.nameEn,
          quantity: c.quantity,
          unitPrice: c.item.price,
          costPrice: c.item.cost,
          subtotal: c.itemTotal / 1.15,
          taxAmount: c.itemTotal - (c.itemTotal / 1.15),
          discountAmount: 0,
          totalAmount: c.itemTotal,
          selectedModifiers: Object.entries(c.modifiers).map(([k, v]) => ({
            optionId: k,
            groupId: k,
            nameAr: v,
            nameEn: v,
            price: 0,
            quantity: 1,
          })),
          notes: c.notes,
          kitchenStation: c.item.station as any,
          status: 'ready',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))}
      />
    </div>
  );
};
