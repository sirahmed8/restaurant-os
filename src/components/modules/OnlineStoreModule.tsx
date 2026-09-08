import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  CreditCard,
  Smartphone,
  MapPin,
  Truck,
  Store,
  Tag,
  Star,
  Check,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  Phone,
  MessageSquare,
  Navigation,
  ArrowRight,
  ChevronLeft,
  X,
  Compass,
  Laptop,
  Maximize2,
  Minimize2,
  Share2,
} from 'lucide-react';
// Celebration loads on demand — keeps canvas-confetti out of the module chunk.
function burstConfetti(opts: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number }; colors?: string[] }): void {
  import('canvas-confetti')
    .then(({ default: fire }) => fire(opts))
    .catch(() => {});
}
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore, INITIAL_CATEGORIES } from '../../stores/usePosStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { MenuItem, OrderType } from '../../types';
import { db } from '../../db';
import { eventBus } from '../../services/eventBus';
import { printerService } from '../../services/printerService';
import { KIOSK_DISHES, KioskDishItem } from './KioskModule';

// Mock Customer Profile for Google Sign-In
interface CustomerUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Black VIP';
  points: number;
  savedAddresses: { id: string; title: string; fullAddress: string; isDefault: boolean }[];
}

const MOCK_GOOGLE_USER: CustomerUser = {
  id: 'cust_google_902',
  name: 'أحمد محمود الشناوي',
  email: 'ahmed.elshenawy@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+20 10 1234 5678',
  vipTier: 'Black VIP',
  points: 620,
  savedAddresses: [
    {
      id: 'addr_1',
      title: 'المنزل (القاهرة - المعادي)',
      fullAddress: 'شارع 9، فيلا 24، دجلة المعادي، القاهرة',
      isDefault: true,
    },
    {
      id: 'addr_2',
      title: 'مقر العمل (التجمع الخامس - القاهرة الجديدة)',
      fullAddress: 'مبنى الأعمال، شارع التسعين الشمالي، القاهرة الجديدة',
      isDefault: false,
    },
  ],
};

// Promotional Banners
const PROMO_BANNERS = [
  {
    id: 'b1',
    badge: '👑 عرض ملكي حصري',
    title: 'خصم 20% على المشاوي والستيك',
    subtitle: 'استخدم كود الخصم SULTAN20 عند إتمام الطلب',
    bgGradient: 'from-amber-600 to-amber-950',
    code: 'SULTAN20',
  },
  {
    id: 'b2',
    badge: '🚚 توصيل مجاني',
    title: 'توصيل مجاني لكافة طلبات العشاء',
    subtitle: 'للطلبات التي تتجاوز قيمتها 150 ج.م',
    bgGradient: 'from-emerald-600 to-emerald-950',
    code: 'FREESHIP',
  },
];

interface OnlineCartItem {
  cartId: string;
  dish: KioskDishItem;
  quantity: number;
  selectedDoneness?: string;
  selectedAddons: { name: string; price: number }[];
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

export const OnlineStoreModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  // View Simulator Mode: 'mobile' (Phone Frame) vs 'desktop' (Full Storefront)
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');

  // Customer Auth
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(MOCK_GOOGLE_USER);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fulfillment Type: 'delivery' | 'pickup'
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAddress, setSelectedAddress] = useState(MOCK_GOOGLE_USER.savedAddresses[0]);
  const [selectedBranch, setSelectedBranch] = useState('فرع السليمانية الرئيسي — الرياض');

  // Browsing & Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'special' | 'protein' | 'gluten_free'>('all');

  // Cart & Discounts
  const [cart, setCart] = useState<OnlineCartItem[]>([
    {
      cartId: 'init_online_1',
      dish: KIOSK_DISHES[0], // Truffle Burger
      quantity: 1,
      selectedDoneness: 'Medium',
      selectedAddons: [{ name: 'جبن شيدر مدخن مضاعف', price: 6 }],
      unitPrice: 74,
      totalPrice: 74,
    },
    {
      cartId: 'init_online_2',
      dish: KIOSK_DISHES[6], // Mojito
      quantity: 1,
      selectedAddons: [],
      unitPrice: 28,
      totalPrice: 28,
    },
  ]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Customizer Modal
  const [customizingDish, setCustomizingDish] = useState<KioskDishItem | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState('Medium');
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const [dishNotes, setDishNotes] = useState('');

  // Promo Code Engine
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent?: number; discountFixed?: number; freeShipping?: boolean } | null>({
    code: 'SULTAN20',
    discountPercent: 20,
  });
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>({
    text: 'تم تطبيق كود SULTAN20 (خصم 20%) بنجاح!',
    type: 'success',
  });

  // Checkout & Live Tracking
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'cod'>('apple-pay');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any>(null);
  const [trackerStep, setTrackerStep] = useState<number>(2); // 1: Placed, 2: Cooking, 3: On The Way, 4: Delivered

  // Calculations
  const rawSubtotal = useMemo(() => cart.reduce((sum, i) => sum + i.totalPrice, 0), [cart]);

  // Delivery Fee Calculation (15 SAR or Free if subtotal >= 150 or promo freeShipping)
  const deliveryFee = useMemo(() => {
    if (fulfillmentType === 'pickup') return 0;
    if (appliedPromo?.freeShipping) return 0;
    if (rawSubtotal >= 150) return 0;
    return 15;
  }, [fulfillmentType, rawSubtotal, appliedPromo]);

  // Discount Calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountPercent) {
      return Number(((rawSubtotal * appliedPromo.discountPercent) / 100).toFixed(2));
    }
    if (appliedPromo.discountFixed) {
      return Math.min(rawSubtotal, appliedPromo.discountFixed);
    }
    return 0;
  }, [appliedPromo, rawSubtotal]);

  const netSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = Number((netSubtotal * 0.15).toFixed(2));
  const finalGrandTotal = Number((netSubtotal + taxAmount + deliveryFee).toFixed(2));
  const totalItemsCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // Dishes filtered by category, search and dietary
  const filteredDishes = useMemo(() => {
    return KIOSK_DISHES.filter((dish) => {
      const matchCat = selectedCategory === 'all' || dish.category === selectedCategory;
      const matchQuery =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.descriptionAr && dish.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchDiet = true;
      if (dietaryFilter === 'special') matchDiet = !!dish.isChefSpecial;
      if (dietaryFilter === 'protein') matchDiet = dish.category === 'steaks' || dish.category === 'burgers';
      if (dietaryFilter === 'gluten_free') matchDiet = !dish.allergens?.includes('gluten');

      return matchCat && matchQuery && matchDiet;
    });
  }, [selectedCategory, searchQuery, dietaryFilter]);

  // Apply Promo Code
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SULTAN20') {
      setAppliedPromo({ code: 'SULTAN20', discountPercent: 20 });
      setPromoMessage({ text: 'تم تطبيق كود SULTAN20 (خصم 20%) بنجاح! 👑', type: 'success' });
      playSound('pop');
    } else if (code === 'WELCOME50') {
      setAppliedPromo({ code: 'WELCOME50', discountFixed: 50 });
      setPromoMessage({ text: 'تم تطبيق كود WELCOME50 (خصم 50 ر.س) بنجاح! 🎁', type: 'success' });
      playSound('pop');
    } else if (code === 'FREESHIP') {
      setAppliedPromo({ code: 'FREESHIP', freeShipping: true });
      setPromoMessage({ text: 'تم تطبيق كود الشحن المجاني FREESHIP! 🚚', type: 'success' });
      playSound('pop');
    } else {
      setPromoMessage({ text: 'عذراً، كود الخصم غير صالح أو منتهي الصلاحية', type: 'error' });
      playSound('delete');
    }
  };

  // Add Item to Cart
  const handleAddToCart = (dish: KioskDishItem) => {
    const cartId = `online_${dish.id}_default`;
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.cartId === cartId);
      if (existing > -1) {
        const copy = [...prev];
        copy[existing].quantity += 1;
        copy[existing].totalPrice = copy[existing].quantity * copy[existing].unitPrice;
        return copy;
      }
      return [
        ...prev,
        {
          cartId,
          dish,
          quantity: 1,
          selectedAddons: [],
          unitPrice: dish.price,
          totalPrice: dish.price,
        },
      ];
    });
    playSound('pop');
  };

  // Quantity updates
  const handleUpdateQty = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              totalPrice: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as OnlineCartItem[];
    });
    playSound('tap');
  };

  // Submit Online Order
  const handleExecuteOnlineCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    playSound('click');

    await new Promise((r) => setTimeout(r, 1200));

    const orderNumber = `ONL-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = db.generateUUID();

    const orderItems = cart.map((ci) => ({
      id: db.generateUUID(),
      orderId,
      menuItemId: ci.dish.id,
      nameAr: ci.dish.name,
      nameEn: ci.dish.nameEn,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      costPrice: ci.dish.cost,
      subtotal: ci.unitPrice * ci.quantity,
      taxAmount: (ci.unitPrice * ci.quantity) * 0.1304,
      discountAmount: 0,
      totalAmount: ci.totalPrice,
      selectedModifiers: ci.selectedAddons.map((a) => ({
        optionId: a.name,
        groupId: 'addons',
        nameAr: a.name,
        nameEn: a.name,
        price: a.price,
        quantity: 1,
      })),
      notes: ci.notes,
      kitchenStation: ci.dish.station,
      status: 'cooking' as const,
      printedToKitchen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newOrder = {
      id: orderId,
      orderNumber,
      orderType: fulfillmentType === 'delivery' ? 'delivery' as const : 'takeaway' as const,
      customerName: currentUser?.name || 'عميل المتجر الإلكتروني',
      customerPhone: currentUser?.phone || '0501234567',
      status: 'sent_to_kitchen' as const,
      paymentStatus: 'paid' as const,
      paymentMethod: selectedPaymentMethod === 'cod' ? 'cash' as const : 'card' as const,
      subtotal: netSubtotal,
      taxAmount,
      discountAmount,
      discountType: appliedPromo?.code,
      deliveryFee,
      totalAmount: finalGrandTotal,
      paidAmount: finalGrandTotal,
      changeAmount: 0,
      guestCount: 1,
      customerNotes: fulfillmentType === 'delivery' ? selectedAddress.fullAddress : selectedBranch,
      kitchenNotes: `طلب إلكتروني ${fulfillmentType === 'delivery' ? 'توصيل' : 'استلام'} #${orderNumber}`,
      syncStatus: 'synced' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.insert('orders', newOrder as any);
      await db.bulkInsert('orderItems', orderItems as any);
    } catch (e) {
      console.warn('DB error:', e);
    }

    // Publish neural events for live Kitchen KDS & POS
    eventBus.publish('ORDER_CREATED', { order: newOrder as any, items: orderItems as any }, 'pos');
    eventBus.publish('KDS_NEW_TICKET', {
      orderId,
      tableNumber: fulfillmentType === 'delivery' ? 'Online Delivery' : 'Online Pickup',
      items: orderItems as any,
    }, 'pos');

    useKdsStore.getState().loadKdsTickets();

    // Deduct stock simulation
    try {
      const invStore = useInventoryStore.getState();
      if (invStore.items.length > 0) {
        await invStore.adjustStock(
          invStore.items[0].id,
          -1,
          'sale_consumption',
          `طلب متجر إلكتروني ${orderNumber}`,
          'online_portal'
        );
      }
    } catch (err) {
      console.error(err);
    }

    // Print ticket
    printerService.printKitchenTicket(newOrder as any, orderItems as any, 'all').catch(console.warn);

    // Save tracking state
    setActiveTrackingOrder({
      ...newOrder,
      items: orderItems,
      driverName: 'الكابتن أحمد الحربي',
      driverPhone: '+966 55 987 6543',
      driverVehicle: 'تويوتا يارس (لوحة: أ ب د ٤٠٩)',
      driverRating: 4.96,
      estimatedDeliveryMinutes: 28,
    });

    setIsSubmittingOrder(false);
    setIsCheckoutModalOpen(false);
    setIsCartDrawerOpen(false);
    setCart([]);

    burstConfetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#3b82f6'],
    });

    playSound('success');
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 rounded-3xl relative select-none">
      {/* Top Navigation & Simulator Toolbar */}
      <div className="p-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Restaurant Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">متجر السلطان الإلكتروني</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                متاح الآن للطلب 🟢
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Sultan Royal Online Store & Delivery Portal</p>
          </div>
        </div>

        {/* Simulator View Switcher (Mobile App vs Desktop Web) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>عرض المتصفح</span>
          </button>

          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>محاكي تطبيق الجوال</span>
          </button>
        </div>

        {/* Customer Profile & Cart Button */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs cursor-pointer transition-all"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-amber-400/50"
              />
              <span className="font-bold text-white max-w-[120px] truncate">{currentUser.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black">
                {currentUser.vipTier}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15 cursor-pointer"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>دخول بـ Google</span>
            </button>
          )}

          {/* Cart Floating / Header Button */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>السلة</span>
            {totalItemsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
            <span className="font-extrabold">{finalGrandTotal} ر.س</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Body (Desktop Layout or Framed Mobile Simulator) */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-0 md:p-4 bg-slate-950/60">
        <div
          className={`h-full w-full transition-all duration-300 overflow-hidden flex flex-col ${
            viewMode === 'mobile'
              ? 'max-w-md max-h-[860px] border-4 border-slate-800 rounded-[44px] shadow-2xl bg-slate-900 overflow-hidden ring-8 ring-slate-950/50'
              : 'rounded-3xl border border-white/5 bg-slate-900/40'
          }`}
        >
          {/* Mobile Top Status Bar if in mobile view */}
          {viewMode === 'mobile' && (
            <div className="px-6 py-2 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 select-none border-b border-white/5">
              <span>9:41 AM</span>
              <div className="w-24 h-4 bg-black rounded-full" />
              <div className="flex items-center gap-1.5 font-semibold">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Storefront Content Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
            {/* Live Order Tracker Banner (If an order was recently placed) */}
            {activeTrackingOrder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/40 shadow-xl"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">تتبع طلبك المباشر #{activeTrackingOrder.orderNumber}</h4>
                      <p className="text-[11px] text-emerald-400">الوقت المتوقع للتسليم: 25 - 30 دقيقة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTrackingOrder(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress Stepper */}
                <div className="grid grid-cols-4 gap-2 text-center mt-3 text-[10px] font-bold">
                  <div className="flex flex-col items-center gap-1 text-emerald-400">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>تم التأكيد</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-amber-400">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <span>في المطبخ</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span>مع السائق</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>تم التسليم</span>
                  </div>
                </div>

                {/* Driver Info Preview */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                      🚗
                    </div>
                    <div>
                      <span className="font-bold text-white block text-[11px]">{activeTrackingOrder.driverName}</span>
                      <span className="text-[10px] text-slate-400">{activeTrackingOrder.driverVehicle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`الاتصال بالكابتن: ${activeTrackingOrder.driverPhone}`)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Delivery / Pickup Fulfillment Switcher & Address */}
            <div className="p-3.5 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-3">
              {/* Type Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-white/5">
                <button
                  onClick={() => {
                    setFulfillmentType('delivery');
                    playSound('tap');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    fulfillmentType === 'delivery'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>توصيل للمنزل</span>
                </button>

                <button
                  onClick={() => {
                    setFulfillmentType('pickup');
                    playSound('tap');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    fulfillmentType === 'pickup'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>استلام من الفرع</span>
                </button>
              </div>

              {/* Address / Branch Details */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {fulfillmentType === 'delivery' ? selectedAddress.title : selectedBranch}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {fulfillmentType === 'delivery'
                        ? `${selectedAddress.fullAddress} • وقت التوصيل: 30-40 دقيقة`
                        : 'جاهز للاستلام خلال 15 دقيقة'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[11px] text-amber-400 font-bold hover:underline shrink-0"
                >
                  تغيير
                </button>
              </div>
            </div>

            {/* Promotional Banners Carousel */}
            <div className="space-y-2">
              {PROMO_BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  className={`p-4 rounded-3xl bg-gradient-to-r ${banner.bgGradient} border border-white/15 text-white relative overflow-hidden shadow-lg`}
                >
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950/60 text-amber-300 border border-white/10">
                    {banner.badge}
                  </span>
                  <h3 className="text-base font-black mt-2">{banner.title}</h3>
                  <p className="text-xs text-slate-200 mt-0.5">{banner.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Categories & Dietary Filters */}
            <div className="space-y-2.5">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {INITIAL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        playSound('tap');
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Dietary Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] custom-scrollbar">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    dietaryFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  جميع الأصناف
                </button>
                <button
                  onClick={() => setDietaryFilter('special')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    dietaryFilter === 'special'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <span>👑 أطباق الشيف</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('protein')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    dietaryFilter === 'protein'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <span>🥩 بروتين عالي</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('gluten_free')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    dietaryFilter === 'gluten_free'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <span>🌾 خالي من الجلوتين</span>
                </button>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/40 p-3.5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="relative h-36 rounded-2xl overflow-hidden mb-3 bg-slate-950">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 start-2 flex gap-1">
                        {dish.calories && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-400 font-bold">
                            {dish.calories} سعرة
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 end-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{dish.rating || 4.9}</span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-white line-clamp-1">{dish.name}</h4>
                      <span className="font-black text-xs text-amber-400 whitespace-nowrap">
                        {dish.price} ر.س
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {dish.descriptionAr || dish.nameEn}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(dish)}
                    className="w-full mt-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة للسلة</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CART DRAWER & PROMO ENGINE OVERLAY                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCartDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-full max-w-md h-full bg-slate-900 border-s border-white/10 shadow-2xl p-5 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">سلة الطلب الإلكتروني</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {totalItemsCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="font-bold text-sm">سلتك فارغة</p>
                    <p className="text-xs text-slate-500 mt-1">أضف بعض الأطباق الشهية للبدء</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartId}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.dish.image}
                          alt={item.dish.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{item.dish.name}</h4>
                          <span className="text-xs font-black text-amber-400 block mt-0.5">
                            {item.totalPrice} ر.س
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-white/10">
                        <button
                          onClick={() => handleUpdateQty(item.cartId, -1)}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.cartId, 1)}
                          className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Code & Bill Summary Footer */}
              {cart.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  {/* Promo Input */}
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="كود الخصم (SULTAN20 / FREESHIP)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none uppercase font-mono"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                    {promoMessage && (
                      <p
                        className={`text-[11px] mt-1.5 font-medium ${
                          promoMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {promoMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{rawSubtotal} ر.س</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>خصم الكوبون ({appliedPromo?.code}):</span>
                        <span>-{discountAmount} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>رسوم التوصيل:</span>
                      <span>{deliveryFee === 0 ? 'مجاناً 🚚' : `${deliveryFee} ر.س`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span>{taxAmount} ر.س</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-amber-400">{finalGrandTotal} ر.س</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>متابعة إتمام الدفع ({finalGrandTotal} ر.س)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* GOOGLE SIGN-IN & PROFILE MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-black text-white text-base">حساب العميل وتجربة الدخول</h3>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentUser ? (
                <div className="my-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          {currentUser.vipTier} 👑
                        </span>
                        <span className="text-[11px] text-amber-400 font-bold">
                          {currentUser.points} نقطة ولاء
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">العناوين المحفوظة:</label>
                    <div className="space-y-2">
                      {currentUser.savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            setIsAuthModalOpen(false);
                            playSound('tap');
                          }}
                          className={`w-full p-2.5 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                            selectedAddress.id === addr.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <span className="font-bold block">{addr.title}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{addr.fullAddress}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      playSound('pop');
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="my-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">تسجيل الدخول السريع</h4>
                    <p className="text-xs text-slate-400 mt-1">احصل على نقاط ولاء فورية وتتبع طلباتك لحظة بلحظة</p>
                  </div>

                  {/* Google Simulated Button */}
                  <button
                    onClick={() => {
                      setCurrentUser(MOCK_GOOGLE_USER);
                      setIsAuthModalOpen(false);
                      playSound('success');
                    }}
                    className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>المتابعة باستخدام Google (فيصل العتيبي)</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* FINAL CHECKOUT & PAYMENT MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">تأكيد الطلب واختيار طريقة الدفع</h3>
                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs">
                {/* Fulfillment Destination Review */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="font-bold text-amber-400 block mb-1">
                    {fulfillmentType === 'delivery' ? 'عنوان التوصيل للمنزل:' : 'فرع الاستلام:'}
                  </span>
                  <p className="text-slate-300">
                    {fulfillmentType === 'delivery' ? selectedAddress.fullAddress : selectedBranch}
                  </p>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">طريقة الدفع:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedPaymentMethod('apple-pay')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'apple-pay'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-[11px]">Apple Pay</span>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'card'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-[11px]">بطاقة / مدى</span>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'cod'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Truck className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-[11px]">عند الاستلام</span>
                    </button>
                  </div>
                </div>

                {/* Final Bill */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex justify-between items-center text-sm font-black">
                  <span>المبلغ الإجمالي المستحق:</span>
                  <span className="text-amber-400 text-base">{finalGrandTotal} ر.س</span>
                </div>
              </div>

              <button
                onClick={handleExecuteOnlineCheckout}
                disabled={isSubmittingOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingOrder ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد وإرسال الطلب للمطبخ</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
