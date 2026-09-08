import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Bike,
  Flame,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  X,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  User,
  Heart,
  BadgePercent,
  CheckCircle2,
  ChefHat,
  Compass,
  Building2,
  LogIn,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { GlobalAIChatbot } from '../ui/GlobalAIChatbot';
import { OwnerControlBar } from '../ui/OwnerControlBar';

export interface CustomerMenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  descriptionAr: string;
  image: string;
  category: string;
  isPopular?: boolean;
}

export interface RestaurantCardData {
  id: string;
  nameAr: string;
  nameEn: string;
  cuisineAr: string;
  cuisineEn: string;
  image: string;
  rating: number;
  reviewsCount: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  minOrder: number;
  isFreeDelivery: boolean;
  hasOffer: boolean;
  offerTextAr?: string;
  hasPaidAi: boolean; // Restaurant has paid subscription for AI Food Copilot
  category: 'grill' | 'burgers' | 'pizza' | 'cafe' | 'shawarma' | 'all';
  menuItems: CustomerMenuItem[];
}

const SAMPLE_RESTAURANTS: RestaurantCardData[] = [
  {
    id: 'rest_01',
    nameAr: 'مطعم السرايا للمشاوي الفاخرة',
    nameEn: 'Al Saraya Luxury Grills',
    cuisineAr: 'مشويات وفاخر • مصري',
    cuisineEn: 'Fine Grills & Egyptian',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 1420,
    deliveryTimeMin: 25,
    deliveryFee: 0,
    minOrder: 80,
    isFreeDelivery: true,
    hasOffer: true,
    offerTextAr: 'خصم 20% على طلبات العائلات 🔥',
    hasPaidAi: true, // Paid AI Active
    category: 'grill',
    menuItems: [
      {
        id: 'menu_sr_01',
        nameAr: 'كيلو مشكل كباب وكفتة على الفحم',
        nameEn: '1KG Mixed Kebab & Kofta',
        price: 420,
        descriptionAr: 'كباب ضاني بلدي وكفتة متبلة بخلطة السرايا السرية مع أرز بسمتي وسلطات',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
        category: 'مشاوي',
        isPopular: true,
      },
      {
        id: 'menu_sr_02',
        nameAr: 'شيش طاووق متبل مع صوص الثومية',
        nameEn: 'Charcoal Shish Tawook',
        price: 185,
        descriptionAr: 'صدور دجاج متبلة بالزبادي والزعتر مشوية على الحطب مع خبز بلدي ساخن',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
        category: 'مشاوي',
        isPopular: true,
      },
      {
        id: 'menu_sr_03',
        nameAr: 'طاجن بامية بلدي باللحم الضاني',
        nameEn: 'Lamb Okra Tajin',
        price: 240,
        descriptionAr: 'طاجن فخار مسكوب عليه قطع لحم ضاني مسبكة في الفرن الحجري',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
        category: 'طواجن',
      },
    ],
  },
  {
    id: 'rest_02',
    nameAr: 'سلطان برجر آند سموكد ميتس',
    nameEn: 'Sultan Smoked Burgers',
    cuisineAr: 'برجر أنجوس • مقليات',
    cuisineEn: 'Angus Burgers & Fries',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 890,
    deliveryTimeMin: 20,
    deliveryFee: 15,
    minOrder: 60,
    isFreeDelivery: false,
    hasOffer: true,
    offerTextAr: 'عرض 1+1 على البرجر الدبل 🍔',
    hasPaidAi: true, // Paid AI Active
    category: 'burgers',
    menuItems: [
      {
        id: 'menu_sb_01',
        nameAr: 'دبل بلاك أنجوس برجر مع بيكن مدخن',
        nameEn: 'Double Angus Smoked Bacon Burger',
        price: 210,
        descriptionAr: 'شريحتان من لحم الأنجوس مع شيدر ذائب وصوص سموكي باربيكيو',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
        category: 'برجر',
        isPopular: true,
      },
      {
        id: 'menu_sb_02',
        nameAr: 'بطاطس مقلية بالجبنة المذابة والرانش',
        nameEn: 'Loaded Cheese Fries',
        price: 75,
        descriptionAr: 'بطاطس ذهبية كرسبي مغطاة بجبنة شيدر وهالبينو حار',
        image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
        category: 'مقبلات',
      },
    ],
  },
  {
    id: 'rest_03',
    nameAr: 'لا فيتا نابولي بيتزا إيطالية',
    nameEn: 'La Vita Napoli Pizza',
    cuisineAr: 'بيتزا حطب • باستا إيطالي',
    cuisineEn: 'Wood-Fired Pizza & Pasta',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 650,
    deliveryTimeMin: 30,
    deliveryFee: 20,
    minOrder: 90,
    isFreeDelivery: false,
    hasOffer: false,
    hasPaidAi: false, // Standard Restaurant without AI
    category: 'pizza',
    menuItems: [
      {
        id: 'menu_lv_01',
        nameAr: 'بيتزا ترافل آند مشروم إيطالي',
        nameEn: 'Italian Truffle Mushroom Pizza',
        price: 195,
        descriptionAr: 'عجينة مخمرة 48 ساعة مع جبنة موتزاريلا بافلو وزيت الترافل',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
        category: 'بيتزا',
        isPopular: true,
      },
    ],
  },
  {
    id: 'rest_04',
    nameAr: 'شاورما على الحطب الأصيل',
    nameEn: 'Authentic Shawarma Hub',
    cuisineAr: 'شاورما لحم ودجاج • مقبلات',
    cuisineEn: 'Shawarma & Mezza',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 1250,
    deliveryTimeMin: 22,
    deliveryFee: 0,
    minOrder: 50,
    isFreeDelivery: true,
    hasOffer: true,
    offerTextAr: 'توصيل مجاني لطلبات فوق 150 ج.م 🛵',
    hasPaidAi: true, // Paid AI Active
    category: 'shawarma',
    menuItems: [
      {
        id: 'menu_sh_01',
        nameAr: 'صاروخ شاورما لحم بلدي بخبز الصاج',
        nameEn: 'Beef Shawarma Saj Rocket',
        price: 120,
        descriptionAr: 'شرائح لحم بقري متبلة مع صوص طحينة ودبس رمان وخيار مخلل',
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
        category: 'شاورما',
        isPopular: true,
      },
    ],
  },
  {
    id: 'rest_05',
    nameAr: 'كافيه روستريا آند بيكري',
    nameEn: 'Roasteria Specialty Cafe',
    cuisineAr: 'قهوة مختصة • حلويات ووافل',
    cuisineEn: 'Specialty Coffee & Desserts',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 430,
    deliveryTimeMin: 15,
    deliveryFee: 10,
    minOrder: 40,
    isFreeDelivery: false,
    hasOffer: false,
    hasPaidAi: false, // Standard Cafe without AI
    category: 'cafe',
    menuItems: [
      {
        id: 'menu_rc_01',
        nameAr: 'سبانش لاتيه بارد بحليب الشوفان',
        nameEn: 'Iced Spanish Latte',
        price: 85,
        descriptionAr: 'إسبريسو دبل شوت مع حليب مكثف محلى وحليب شوفان بارد',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
        category: 'مشروبات',
        isPopular: true,
      },
    ],
  },
];

export const CustomerPortalView: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    playSound,
    setAppMode,
    activeUser,
    setActiveUser,
    setAiAssistantPaid,
  } = useAppStore();

  const { items, addToCart, cart, removeFromCart, updateQuantity, clearCart } = usePosStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'speed' | 'free_delivery' | 'offers'>('rating');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCardData | null>(null);

  // Address Selector
  const [deliveryAddress, setDeliveryAddress] = useState('شارع النصر، المعادي، القاهرة');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Cart & Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'apple_pay'>('cash');

  // Role Switch Modal
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);

  // Handle entering a restaurant
  const handleSelectRestaurant = (rest: RestaurantCardData) => {
    playSound('pop');
    setSelectedRestaurant(rest);

    // Sync items into pos store for cart & voice integration
    const posItems = rest.menuItems.map((m) => ({
      id: m.id,
      name: m.nameAr,
      nameEn: m.nameEn,
      price: m.price,
      cost: m.price * 0.45,
      category: m.category,
      color: '#f59e0b',
      image: m.image,
      prepTimeMinutes: 15,
      available: true,
      station: 'grill' as const,
    }));

    usePosStore.setState({ items: posItems });

    // Enable or disable AI Copilot depending on whether this restaurant has paid for it!
    setAiAssistantPaid(rest.hasPaidAi);
  };

  // Filtered and Sorted Restaurants
  const filteredRestaurants = useMemo(() => {
    return SAMPLE_RESTAURANTS.filter((r) => {
      const matchesSearch =
        r.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisineAr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCuisine = selectedCuisine === 'all' || r.category === selectedCuisine;

      return matchesSearch && matchesCuisine;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'speed') return a.deliveryTimeMin - b.deliveryTimeMin;
      if (sortBy === 'free_delivery') return (b.isFreeDelivery ? 1 : 0) - (a.isFreeDelivery ? 1 : 0);
      if (sortBy === 'offers') return (b.hasOffer ? 1 : 0) - (a.hasOffer ? 1 : 0);
      return 0;
    });
  }, [searchQuery, selectedCuisine, sortBy]);

  // Cart Computations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.dish.price * item.quantity, 0);
  const vatAmount = Number((cartSubtotal * 0.14).toFixed(2));
  const deliveryFee = selectedRestaurant?.deliveryFee || 0;
  const grandTotal = Number((cartSubtotal + vatAmount + deliveryFee).toFixed(2));
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Place Order Simulation
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    playSound('cash-register');
    setIsCheckingOut(true);

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newTracking = {
      id: orderId,
      restaurantName: selectedRestaurant?.nameAr || 'مطعم السرايا',
      itemsCount: totalCartCount,
      grandTotal,
      address: deliveryAddress,
      status: 'confirmed', // 'confirmed' -> 'preparing' -> 'on_way' -> 'delivered'
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedMin: selectedRestaurant?.deliveryTimeMin || 25,
    };

    setActiveTrackingOrder(newTracking);
    clearCart();
    setIsCartOpen(false);
    setIsCheckingOut(false);

    // Live Order Tracker step progression simulation
    setTimeout(() => {
      setActiveTrackingOrder((prev: any) => prev ? { ...prev, status: 'preparing' } : null);
      playSound('kitchen-bell');
    }, 4000);

    setTimeout(() => {
      setActiveTrackingOrder((prev: any) => prev ? { ...prev, status: 'on_way' } : null);
      playSound('whoosh');
    }, 9000);

    setTimeout(() => {
      setActiveTrackingOrder((prev: any) => prev ? { ...prev, status: 'delivered' } : null);
      playSound('success');
    }, 15000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090f] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 pb-20 select-none">
      {/* Top Floating App Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0c0f17]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white">Restaurant OS Food</h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                1000x Express
              </span>
            </div>
            {/* Delivery Address Pill */}
            <button
              onClick={() => setIsEditingAddress(true)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{deliveryAddress}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Switch Role Button */}
          <button
            onClick={() => {
              playSound('pop');
              setShowRoleSwitchModal(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
            <span>بوابة الإدارة والكاشير</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-600" />}
          </button>

          {/* Floating Cart Trigger */}
          <button
            onClick={() => {
              playSound('click');
              setIsCartOpen(true);
            }}
            className="relative px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>سلة الطلبات</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] font-bold flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner with Search Bar */}
      <section className="px-4 sm:px-8 pt-6 pb-4 max-w-7xl mx-auto space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-[#10141f] to-amber-950 text-white p-6 sm:p-10 border border-slate-800 shadow-xl">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أشهى المأكولات بأعلى سرعة وأقل تكلفة توصيل</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              اطلب طعامك المفضل الآن من أرقى المطابخ والفنادق
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تصفح القوائم الحية، العروض الحصرية، واطلب عبر الصوت أو بنقرة واحدة مع تتبع مسار المندوب لحظياً.
            </p>

            {/* Main Search Input */}
            <div className="pt-2">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم المطعم، مشويات، برجر، بيتزا، كافيه..."
                  className="w-full ps-11 pe-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-all backdrop-blur-md"
                />
              </div>
            </div>
          </div>

          <div className="absolute top-0 end-0 w-1/2 h-full opacity-30 pointer-events-none hidden sm:block">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80"
              alt="Food"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Live Active Order Tracking Banner */}
        <AnimatePresence>
          {activeTrackingOrder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0e161a] to-slate-900 border border-emerald-500/30 text-white shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Bike className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black">طلبك رقم {activeTrackingOrder.id} قيد التوصيل الآن!</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {activeTrackingOrder.restaurantName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      الوقت المتوقع للوصول: {activeTrackingOrder.estimatedMin} دقيقة • الإجمالي: {activeTrackingOrder.grandTotal} ج.م
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTrackingOrder(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Progress Line */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] text-center">
                <div className={`p-2 rounded-xl border ${['confirmed', 'preparing', 'on_way', 'delivered'].includes(activeTrackingOrder.status) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                  1. تم تأكيد الطلب ✓
                </div>
                <div className={`p-2 rounded-xl border ${['preparing', 'on_way', 'delivered'].includes(activeTrackingOrder.status) ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                  2. في المطبخ 👨‍🍳
                </div>
                <div className={`p-2 rounded-xl border ${['on_way', 'delivered'].includes(activeTrackingOrder.status) ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                  3. المندوب في الطريق 🛵
                </div>
                <div className={`p-2 rounded-xl border ${activeTrackingOrder.status === 'delivered' ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                  4. تم الاستلام 🎉
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'all', label: 'الكل (All)', icon: '✨' },
            { id: 'grill', label: 'مشويات وفاخر', icon: '🥩' },
            { id: 'burgers', label: 'برجر ووجبات', icon: '🍔' },
            { id: 'pizza', label: 'بيتزا وإيطالي', icon: '🍕' },
            { id: 'shawarma', label: 'شاورما وساندوتشات', icon: '🍗' },
            { id: 'cafe', label: 'كافيه وقهوة وحلى', icon: '☕' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                playSound('tap');
                setSelectedCuisine(c.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                selectedCuisine === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-white dark:bg-[#10141f] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Sorting Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            تم العثور على {filteredRestaurants.length} مطعم نشط
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#10141f] p-1 rounded-2xl border border-slate-200 dark:border-white/10">
            {[
              { id: 'rating', label: '⭐ الأعلى تقييماً' },
              { id: 'speed', label: '⚡ الأسرع توصيلاً' },
              { id: 'free_delivery', label: '🛵 توصيل مجاني' },
              { id: 'offers', label: '🔥 عروض وخصومات' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  playSound('tap');
                  setSortBy(s.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  sortBy === s.id
                    ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants Discovery Grid */}
      <main className="px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((rest) => (
            <motion.div
              key={rest.id}
              whileHover={{ y: -4 }}
              onClick={() => handleSelectRestaurant(rest)}
              className="bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Image & Badges */}
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={rest.image}
                  alt={rest.nameAr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Offer Badge */}
                {rest.hasOffer && rest.offerTextAr && (
                  <div className="absolute top-3 start-3 px-3 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5" />
                    <span>{rest.offerTextAr}</span>
                  </div>
                )}

                {/* AI Assistant Badge if Restaurant has Paid AI */}
                {rest.hasPaidAi && (
                  <div className="absolute top-3 end-3 px-2.5 py-1 rounded-xl bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-black shadow-md flex items-center gap-1 border border-purple-400/40">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                    <span>طلب بالذكاء الاصطناعي 🤖</span>
                  </div>
                )}

                {/* Rating Badge */}
                <div className="absolute bottom-3 start-3 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-xs font-black flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{rest.rating}</span>
                  <span className="text-[10px] text-slate-500">({rest.reviewsCount})</span>
                </div>

                {/* Delivery Time */}
                <div className="absolute bottom-3 end-3 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{rest.deliveryTimeMin} دقيقة</span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {rest.nameAr}
                  </h3>
                  {rest.isFreeDelivery && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      توصيل مجاني
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">{rest.cuisineAr}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>الحد الأدنى: {rest.minOrder} ج.م</span>
                  <span>رسوم التوصيل: {rest.deliveryFee > 0 ? `${rest.deliveryFee} ج.م` : 'مجاناً'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Selected Restaurant Menu Modal */}
      <AnimatePresence>
        {selectedRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-3xl bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-5 end-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <img
                  src={selectedRestaurant.image}
                  alt={selectedRestaurant.nameAr}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedRestaurant.nameAr}
                    </h3>
                    {selectedRestaurant.hasPaidAi && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                        مساعد صوتي نشط 🤖
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{selectedRestaurant.cuisineAr}</p>
                  <div className="flex items-center gap-3 text-xs text-amber-500 font-bold pt-1">
                    <span>⭐ {selectedRestaurant.rating}</span>
                    <span>🛵 {selectedRestaurant.deliveryTimeMin} دقيقة</span>
                    <span>💰 الحد الأدنى {selectedRestaurant.minOrder} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">قائمة الأطباق المتوفرة للطلب:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedRestaurant.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex gap-3 justify-between items-center"
                    >
                      <img src={item.image} alt={item.nameAr} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.nameAr}</div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{item.descriptionAr}</p>
                        <div className="text-amber-600 dark:text-amber-400 font-black font-mono">{item.price} ج.م</div>
                      </div>
                      <button
                        onClick={() => {
                          playSound('pop');
                          addToCart({
                            id: item.id,
                            name: item.nameAr,
                            nameEn: item.nameEn,
                            price: item.price,
                            cost: item.price * 0.45,
                            category: item.category,
                            color: '#f59e0b',
                            image: item.image,
                            prepTimeMinutes: 15,
                            available: true,
                            station: 'grill' as const,
                          }, 1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        + أضف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-white dark:bg-[#0c0f17] h-full shadow-2xl flex flex-col justify-between border-s border-slate-200 dark:border-white/10"
            >
              {/* Cart Header */}
              <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">سلة المشتريات</h3>
                    <p className="text-[10px] text-slate-500">{totalCartCount} أصناف مختارة</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-12 h-12 opacity-30" />
                    <p className="text-xs">سلتك فارغة حالياً</p>
                    <p className="text-[10px]">استكشف الأطباق اللذيذة وأضف وجباتك المفضلة!</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartItemId || item.dish.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.dish.name}</div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                          {(item.dish.price * item.quantity).toFixed(2)} ج.م
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.dish.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.dish.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Breakdown & Checkout Button */}
              {cart.length > 0 && (
                <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>إجمالي الوجبات:</span>
                      <span className="font-mono">{cartSubtotal.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ضريبة القيمة المضافة (14% VAT):</span>
                      <span className="font-mono">{vatAmount.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رسوم التوصيل:</span>
                      <span className="font-mono">{deliveryFee > 0 ? `${deliveryFee} ج.م` : 'مجاناً'}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                      <span>المبلغ الإجمالي للدفع:</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">{grandTotal.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الطلب وبدء التحضير والتوصيل 🚀</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Switch Modal */}
      <AnimatePresence>
        {showRoleSwitchModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#10141e] border border-slate-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setShowRoleSwitchModal(false)}
                className="absolute top-5 end-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center mx-auto mb-1">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black">التبديل إلى بيئة الأعمال أو الكاشير</h3>
                <p className="text-xs text-slate-500">اختر المنظومة التي ترغب في الانتقال إليها</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <button
                  onClick={() => {
                    playSound('click');
                    setAppMode('restaurant');
                    setShowRoleSwitchModal(false);
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-purple-500 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-purple-500" />
                    <div className="text-start">
                      <div className="text-xs font-black">لوحة إدارة وتشغيل المطعم (Admin OS)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">إدارة المنيو، المخازن، الرواتب، وإعدادات الفروع</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    playSound('click');
                    setAppMode('cashier');
                    setShowRoleSwitchModal(false);
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <div className="text-start">
                      <div className="text-xs font-black">محطة الكاشير السريعة (POS Terminal)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">تسجيل الطلبات، الطاولات، وتقفيل الوردية</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Omniscient AI Food Assistant */}
      <GlobalAIChatbot />

      {/* Super Owner Switcher Bar */}
      <OwnerControlBar />
    </div>
  );
};
