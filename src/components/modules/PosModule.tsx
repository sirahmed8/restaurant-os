import React, { useMemo, useState } from 'react';
import {
  Utensils,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  Award,
  Users,
  Car,
  ShoppingBag,
  X,
  Monitor,
  Wrench,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { getTranslation } from '../../i18n/translations';
import { MenuItem, OrderType } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { SmartImage } from '../ui/SmartImage';
import { EmptyState } from '../ui/Feedback';
import { calcTotals } from '../../lib/money';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { CustomerDisplayModal } from '../ui/CustomerDisplayModal';
import { HardwareDiagnosticsModal } from '../ui/HardwareDiagnosticsModal';

export const PosModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    items,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    completeOrder,
  } = usePosStore();

  const loadKdsTickets = useKdsStore((s) => s.loadKdsTickets);
  const t = getTranslation(language);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 180);
  const [selectedDishForModal, setSelectedDishForModal] = useState<MenuItem | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState('Medium');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [customerDisplayOpen, setCustomerDisplayOpen] = useState(false);
  const [hardwareDiagnosticsOpen, setHardwareDiagnosticsOpen] = useState(false);

  // Calculations (single source of truth — Egypt VAT 14%)
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.itemTotal, 0), [cart]);
  const { tax, total } = useMemo(() => calcTotals(subtotal), [subtotal]);

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((dish) => {
      const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
      if (!q) return matchesCategory;
      return (
        matchesCategory &&
        (dish.name.toLowerCase().includes(q) || dish.nameEn.toLowerCase().includes(q))
      );
    });
  }, [items, selectedCategory, debouncedQuery]);

  const handleOpenDishCustomizer = (dish: MenuItem) => {
    if (dish.modifiers && dish.modifiers.length > 0) {
      setSelectedDishForModal(dish);
      setSelectedDoneness('Medium');
      setSelectedExtras([]);
      setItemNotes('');
      playSound('pop');
    } else {
      addToCart(dish);
    }
  };

  const handleConfirmCustomizedDish = () => {
    if (!selectedDishForModal) return;
    const mods: Record<string, string> = {
      doneness: selectedDoneness,
      extras: selectedExtras.join(', '),
    };
    addToCart(selectedDishForModal, 1, mods, itemNotes);
    setSelectedDishForModal(null);
  };

  const handleProcessCheckout = (method: 'cash' | 'card' | 'apple-pay' | 'loyalty-points') => {
    const order = completeOrder(method);
    if (!order) return;
    loadKdsTickets();

    setIsCheckoutOpen(false);
    setOrderSuccessModal(true);

    // Celebration loads on demand — keeps canvas-confetti out of the POS chunk.
    import('canvas-confetti')
      .then(({ default: confetti }) =>
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        })
      )
      .catch(() => {});

    setTimeout(() => {
      setOrderSuccessModal(false);
    }, 2500);
  };

  const orderTypes: { type: OrderType; label: string; icon: React.ElementType }[] = [
    { type: 'dine-in', label: t.orderType_dineIn, icon: Users },
    { type: 'takeaway', label: t.orderType_takeaway, icon: ShoppingBag },
    { type: 'delivery', label: t.orderType_delivery, icon: Sparkles },
    { type: 'drive-thru', label: t.orderType_driveThru, icon: Car },
  ];

  const availableTables = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'VIP-01', 'VIP-02'];

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden select-none">
      {/* Left / Center Section: Categories & Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Controls: Order Type Selector & Tables & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Order Type Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 dark:bg-slate-900/60 light:bg-stone-200/70 border border-white/10 light:border-stone-300">
            {orderTypes.map((ot) => {
              const Icon = ot.icon;
              const isSelected = orderType === ot.type;
              return (
                <button
                  key={ot.type}
                  onClick={() => setOrderType(ot.type)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ot.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table Selector (Visible on Dine-in) */}
          {orderType === 'dine-in' && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 dark:bg-slate-900/60 light:bg-stone-200/70 border border-white/10 light:border-stone-300 overflow-x-auto max-w-sm custom-scrollbar">
              {availableTables.map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => setSelectedTable(tbl)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedTable === tbl
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchMenu}
              className="w-full rounded-2xl ps-9 pe-4 py-2 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Quick Hardware & Customer Display Launchers */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playSound('click');
                setCustomerDisplayOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
              title={language === 'ar' ? 'فتح شاشة العميل المزدوجة' : 'Dual-Screen Customer Display'}
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{language === 'ar' ? 'شاشة العميل' : 'Display'}</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setHardwareDiagnosticsOpen(true);
              }}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer shadow-xs"
              title={language === 'ar' ? 'معايرة الميزان وفحص الطابعات' : 'Scale & Printer Diagnostics'}
            >
              <Wrench className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 custom-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-400/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <span>{language === 'ar' ? cat.name : cat.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Dishes Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pe-1 custom-scrollbar content-start">
          {filteredItems.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title={language === 'ar' ? 'لا توجد أصناف مطابقة' : 'No matching dishes'}
                hint={language === 'ar' ? 'جرّب فئة أخرى أو امسح البحث' : 'Try another category or clear search'}
              />
            </div>
          )}
          {filteredItems.map((dish) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => handleOpenDishCustomizer(dish)}
              aria-label={language === 'ar' ? dish.name : dish.nameEn}
              className="group relative flex flex-col justify-between rounded-3xl p-3 glass-panel border border-white/10 hover:border-amber-500/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-amber-500/5 overflow-hidden text-start hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500/50"
            >
              {/* Dish Image */}
              <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3">
                <SmartImage
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Station & Prep Time Badge */}
                <div className="absolute top-2 start-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-white/10">
                  <Clock className="w-3 h-3" />
                  <span>{dish.prepTimeMinutes}m</span>
                </div>

                {/* Price Pill */}
                <div className="absolute bottom-2 start-2 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs font-mono-numbers shadow-md">
                  {dish.price} {t.currency}
                </div>
              </div>

              {/* Dish Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {language === 'ar' ? dish.name : dish.nameEn}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-amber-400/80">
                      <Flame className="w-3 h-3" />
                      {dish.calories} cal
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {dish.station}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-white/10 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Section: Active Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col h-full rounded-3xl glass-panel-elevated p-4 border border-white/10 shadow-2xl overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{t.currentCart}</h3>
              {orderType === 'dine-in' && (
                <Badge variant="amber" size="sm">
                  {t.table} {selectedTable}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {cart.length} {language === 'ar' ? 'أصناف مضافة' : 'items added'}
            </div>
          </div>

          {cart.length > 0 && (
            <Button
              size="sm"
              variant="danger"
              onClick={clearCart}
              className="text-xs px-2.5 py-1 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar pe-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-3">
                <Utensils className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-xs font-semibold text-slate-400">{t.cartEmpty}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t.cartEmptyHint}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <SmartImage
                      src={item.dish.image}
                      alt={item.dish.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {language === 'ar' ? item.dish.name : item.dish.nameEn}
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold font-mono-numbers">
                        {item.dish.price} {t.currency}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-black text-white font-mono-numbers">
                    {item.itemTotal} {t.currency}
                  </div>
                </div>

                {/* Modifiers & Notes */}
                {item.notes && (
                  <div className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                    {item.notes}
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-400">
                    {item.dish.prepTimeMinutes} mins prep
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white font-mono-numbers w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 flex items-center justify-center text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total Breakdown & Actions */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{t.subtotal}</span>
            <span className="font-mono-numbers text-slate-200">{subtotal.toFixed(2)} {t.currency}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{t.tax}</span>
            <span className="font-mono-numbers text-slate-200">{tax.toFixed(2)} {t.currency}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-amber-400 pt-1 border-t border-white/10">
            <span>{t.totalAmount}</span>
            <span className="font-mono-numbers text-base">{total.toFixed(2)} {t.currency}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full mt-2 rounded-2xl shadow-xl shadow-amber-500/20"
          >
            <Banknote className="w-5 h-5" />
            <span>{t.payNow}</span>
          </Button>
        </div>
      </div>

      {/* Dish Customizer Modal */}
      {selectedDishForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedDishForModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />
          <div
            className="relative w-full max-w-md rounded-3xl bg-[#0c0f14] dark:bg-[#0c0f14] light:bg-[#ffffff] text-foreground p-6 shadow-2xl z-10 border border-white/10 dark:border-white/10 light:border-slate-200 animate-scale-up"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SmartImage
                  src={selectedDishForModal.image}
                  alt={selectedDishForModal.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {language === 'ar' ? selectedDishForModal.name : selectedDishForModal.nameEn}
                  </h3>
                  <p className="text-xs text-amber-500 font-bold font-mono-numbers">
                    {selectedDishForModal.price} {t.currency}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDishForModal(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-slate-100 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customizer options */}
            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  {language === 'ar' ? 'درجة الاستواء' : 'Doneness'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'Medium', labelAr: 'متوسط الاستواء (Medium)', labelEn: 'Medium' },
                    { key: 'Well Done', labelAr: 'كامل الاستواء (Well Done)', labelEn: 'Well Done' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedDoneness(opt.key)}
                      className={`p-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDoneness === opt.key
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-white/5 dark:bg-white/5 light:bg-slate-50 text-muted-foreground border-white/10 dark:border-white/10 light:border-slate-200'
                      }`}
                    >
                      {language === 'ar' ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  {language === 'ar' ? 'ملاحظات خاصة للمطبخ' : 'Kitchen Notes'}
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: بدون بصل، صوص خارجي...' : 'e.g. No onion, sauce on side...'}
                  className="w-full rounded-2xl px-4 py-2.5 bg-white/5 dark:bg-white/5 light:bg-slate-50 border border-white/10 dark:border-white/10 light:border-slate-200 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmCustomizedDish}
              className="w-full rounded-2xl"
            >
              {t.addToCart}
            </Button>
          </div>
        </div>
      )}

      {/* Checkout Payment Drawer Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCheckoutOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          />
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#0c0f14] dark:bg-[#0c0f14] light:bg-[#ffffff] text-foreground p-6 shadow-2xl z-10 border border-white/10 dark:border-white/10 light:border-slate-200 animate-scale-up"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 light:border-slate-200">
              <div>
                <h3 className="text-base font-bold text-foreground">{t.payNow}</h3>
                <p className="text-xs text-muted-foreground">
                  {orderType === 'dine-in' ? `${t.table} ${selectedTable}` : t.orderType_takeaway}
                </p>
              </div>
              <div className="text-end">
                <span className="text-xs text-muted-foreground">{t.totalAmount}</span>
                <div className="text-xl font-black text-amber-500 font-mono-numbers">
                  {total.toFixed(2)} {t.currency}
                </div>
              </div>
            </div>

            {/* Payment Method Grid */}
            <div className="grid grid-cols-2 gap-3 my-6">
              <button
                onClick={() => handleProcessCheckout('card')}
                className="p-4 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-50 hover:bg-amber-500/10 border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-amber-500/40 flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-foreground">{t.cardPay}</span>
                <span className="text-[10px] text-muted-foreground">Visa, Mada, Mastercard</span>
              </button>

              <button
                onClick={() => handleProcessCheckout('cash')}
                className="p-4 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-50 hover:bg-amber-500/10 border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-amber-500/40 flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Banknote className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-foreground">{t.quickCash}</span>
                <span className="text-[10px] text-muted-foreground">
                  {language === 'ar' ? 'فتح درج النقدية تلقائياً' : 'Cash Drawer Auto-Open'}
                </span>
              </button>

              <button
                onClick={() => handleProcessCheckout('apple-pay')}
                className="p-4 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-50 hover:bg-amber-500/10 border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-amber-500/40 flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100/10 text-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-foreground">{t.applePay}</span>
                <span className="text-[10px] text-muted-foreground">NFC Contactless Terminal</span>
              </button>

              <button
                onClick={() => handleProcessCheckout('loyalty-points')}
                className="p-4 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-50 hover:bg-amber-500/10 border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-amber-500/40 flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  {language === 'ar' ? 'محفظة نقاط الولاء VIP' : 'VIP Loyalty Wallet'}
                </span>
                <span className="text-[10px] text-amber-500">
                  {language === 'ar' ? '1,250 نقطة متاحة' : '1,250 Points Available'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="p-6 rounded-3xl bg-[#0c0f14] dark:bg-[#0c0f14] light:bg-[#ffffff] border border-emerald-500/40 text-center shadow-2xl flex flex-col items-center gap-3 animate-scale-up"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-base font-black text-foreground">{t.orderSuccess}</h3>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'تم إرسال تذكرة الطلب لطابعات المطبخ' : 'Thermal ticket sent to station printers.'}
            </p>
          </div>
        </div>
      )}

      {/* Dual-Screen Customer Facing Display Modal */}
      <CustomerDisplayModal
        isOpen={customerDisplayOpen}
        onClose={() => setCustomerDisplayOpen(false)}
      />

      {/* Hardware & Scale Calibration Diagnostics Hub */}
      <HardwareDiagnosticsModal
        isOpen={hardwareDiagnosticsOpen}
        onClose={() => setHardwareDiagnosticsOpen(false)}
      />
    </div>
  );
};

