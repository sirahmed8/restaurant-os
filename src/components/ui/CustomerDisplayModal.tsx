import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  Utensils,
  Sun,
  X,
  Maximize2,
  Minimize2,
  Heart,
  Tag,
  ChefHat,
  Coffee,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';

interface CustomerDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerDisplayModal: React.FC<CustomerDisplayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, weather, branchNameAr, branchNameEn, playSound } = useAppStore();
  const { cart } = usePosStore();

  const [timeStr, setTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const tax = subtotal * 0.14; // 14% Egypt VAT
  const total = subtotal + tax + tipAmount;
  const loyaltyPointsEarned = Math.floor(total);

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl select-none font-sans text-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full h-full max-w-7xl max-h-[92vh] bg-[#0a0d14] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
      >
        {/* Top Customer Display Header */}
        <header className="h-16 px-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {language === 'ar' ? 'قصر السلطان للمأكولات الفاخرة' : 'Sultan Palace Fine Dining'}
              </h2>
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                <span>{language === 'ar' ? branchNameAr : branchNameEn}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  <span>{language === 'ar' ? 'شاشة العميل التفاعلية' : 'Customer Display'}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Center Weather Tip */}
          {weather && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-300">
                {weather.temperature ?? weather.temp}°C {language === 'ar' ? weather.conditionAr : weather.conditionEn}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-300 font-medium">
                {language === 'ar'
                  ? `اقتراح اليوم: ${weather.recommendedDishKeywordsAr?.[0] || 'المشويات الفاخرة'}`
                  : `Today's pick: ${weather.recommendedDishKeywordsEn?.[0] || 'Gourmet Grill'}`}
              </span>
            </div>
          )}

          {/* Right Clock & Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{timeStr}</span>
            </div>

            <button
              onClick={toggleFullscreenMode}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Body: Two Columns (Cart View vs Payment & Promos) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
          {/* Left Column: Live Cart Items (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white/[0.02] border border-white/10 rounded-3xl p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {language === 'ar' ? 'تفاصيل طلبك الحالي' : 'Your Current Order'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {cart.length} {language === 'ar' ? 'أصناف' : 'items'}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {language === 'ar' ? 'أهلاً بك في قصر السلطان' : 'Welcome to Sultan Palace'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {language === 'ar'
                        ? 'سيظهر طلبك هنا مباشرة فور إضافته من قِبل الكاشير'
                        : 'Your ordered dishes will appear here in real-time'}
                    </p>
                  </div>
                </div>
              ) : (
                cart.map((cartItem, idx) => (
                  <motion.div
                    key={`${cartItem.cartItemId || idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cartItem.dish.image}
                        alt={cartItem.dish.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {language === 'ar' ? cartItem.dish.name : cartItem.dish.nameEn}
                        </h4>
                        <div className="text-[10px] text-amber-400 font-mono font-semibold">
                          {cartItem.quantity} × {cartItem.dish.price.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-sm font-black font-mono text-white">
                        {cartItem.itemTotal.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Loyalty Points Banner */}
            <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
                <span className="text-slate-300">
                  {language === 'ar' ? 'ستحصل مع هذا الطلب على:' : 'You will earn with this order:'}
                </span>
              </div>
              <span className="text-xs font-black text-amber-400 font-mono">
                +{loyaltyPointsEarned} {language === 'ar' ? 'نقطة ولاء' : 'Loyalty Points'}
              </span>
            </div>
          </div>

          {/* Right Column: Invoice Summary & Payment Options (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black text-white">
                    {language === 'ar' ? 'إجمالي الحساب والدفع' : 'Payment & Summary'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">14% VAT Incl.</span>
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="font-mono font-bold text-white">
                    {subtotal.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ar' ? 'ضريبة القيمة المضافة (14%)' : 'VAT (14%)'}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {tax.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'ar' ? 'الإكرامية (Tip)' : 'Gratuity / Tip'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{tipAmount.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                )}
                <div className="my-2 border-t border-white/10" />
                <div className="flex justify-between items-baseline text-base font-black text-white">
                  <span>{language === 'ar' ? 'المبلغ الإجمالي' : 'Grand Total'}</span>
                  <span className="text-2xl font-mono text-amber-400">
                    {total.toFixed(2)}{' '}
                    <span className="text-xs font-sans text-slate-300">
                      {language === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Tip Selection Pills */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] text-slate-400 font-semibold">
                  {language === 'ar' ? 'إكرامية طاقم الخدمة (اختياري):' : 'Add Service Gratuity:'}
                </div>
                <div className="flex gap-2">
                  {[0, 10, 20, 50].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => {
                        playSound('tap');
                        setTipAmount(tip);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tipAmount === tip
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {tip === 0 ? (language === 'ar' ? 'بدون' : 'None') : `+${tip} ج.م`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Mobile QR Payment Box */}
            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-1 rounded-xl shrink-0 shadow-md">
                {/* Simulated ZATCA / Fawry QR */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SULTAN_POS_BILL_${total}`}
                  alt="Payment QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'امسح للدفع السريع' : 'Scan to Pay'}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {language === 'ar'
                    ? 'يدعم إنستاباي، فودافون كاش، وفيزا / ماستركارد'
                    : 'Supports InstaPay, Mobile Wallets & Visa/Mastercard'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'ar' ? 'دفع إلكتروني آمن 100%' : '100% Secure Checkout'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Ambient Promo Marquee */}
        <footer className="h-12 px-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200 font-bold shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              {language === 'ar'
                ? 'عرض خاص: اطلب وجبة ستيك عائلية واحصل على طبق حلى شرقي مجاناً!'
                : 'Special Offer: Order a Family Steak Feast and get a complimentary dessert!'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Restaurant OS Customer Facing Terminal</span>
        </footer>
      </motion.div>
    </div>
  );
};
