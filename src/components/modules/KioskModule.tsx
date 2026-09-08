import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smartphone,
  Award,
  Users,
  ShoppingBag,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
  QrCode,
  Printer,
  ShieldAlert,
  ArrowRight,
  Info,
  Heart,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Store,
  Compass,
} from 'lucide-react';
// Celebration loads on demand — keeps canvas-confetti out of the module chunk.
function burstConfetti(opts: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number }; colors?: string[] }): void {
  import('canvas-confetti')
    .then(({ default: fire }) => fire(opts))
    .catch(() => {});
}
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore, INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../../stores/usePosStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { MenuItem, OrderType } from '../../types';
import { db } from '../../db';
import { eventBus } from '../../services/eventBus';
import { printerService } from '../../services/printerService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

// Extended item structure for Kiosk with allergens, badges & upsell pairs
export interface KioskDishItem extends MenuItem {
  allergens?: string[];
  descriptionAr?: string;
  descriptionEn?: string;
  rating?: number;
  isChefSpecial?: boolean;
  upsellIds?: string[];
}

export const KIOSK_DISHES: KioskDishItem[] = [
  {
    id: 'k-1',
    name: 'برجر ترافل أنجوس الفاخر',
    nameEn: 'Truffle Angus Burger',
    category: 'burgers',
    price: 68,
    cost: 22,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    color: '#f59e0b',
    prepTimeMinutes: 12,
    calories: 780,
    available: true,
    station: 'grill',
    rating: 4.9,
    isChefSpecial: true,
    descriptionAr: 'شريحة لحم أنجوس أسود مع صلصة الكمأة السوداء والجبن السويسري المعتق والجرجير البري في خبز البريوش الطازج.',
    descriptionEn: 'Black Angus beef patty with black truffle aioli, aged Swiss cheese, and wild arugula in a brioche bun.',
    allergens: ['gluten', 'dairy', 'eggs'],
    upsellIds: ['k-6', 'k-7', 'k-9'],
    modifiers: [
      {
        id: 'doneness',
        name: 'درجة الاستواء',
        nameEn: 'Doneness',
        options: [
          { name: 'متوسط الاستواء (Medium)', nameEn: 'Medium', price: 0 },
          { name: 'كامل الاستواء (Well Done)', nameEn: 'Well Done', price: 0 },
          { name: 'نصف استواء وردي (Medium Rare)', nameEn: 'Medium Rare', price: 0 },
        ],
      },
      {
        id: 'extra_cheese',
        name: 'إضافات الجبن والصلصات',
        nameEn: 'Cheese & Sauce Add-ons',
        options: [
          { name: 'جبن شيدر مدخن مضاعف', nameEn: 'Double Smoked Cheddar', price: 6 },
          { name: 'صلصة ترافل إضافية', nameEn: 'Extra Truffle Aioli', price: 8 },
          { name: 'شريحة لحم إضافية (Double Patty)', nameEn: 'Extra Angus Patty', price: 24 },
          { name: 'بصل مكرمل بالبلسميك', nameEn: 'Balsamic Caramelized Onions', price: 5 },
        ],
      },
    ],
  },
  {
    id: 'k-2',
    name: 'ستيك ريب آي واغيو A5',
    nameEn: 'Wagyu Ribeye Steak A5',
    category: 'steaks',
    price: 210,
    cost: 85,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    color: '#ef4444',
    prepTimeMinutes: 18,
    calories: 920,
    available: true,
    station: 'grill',
    rating: 5.0,
    isChefSpecial: true,
    descriptionAr: 'قطعة لحم واغيو يابانية بدرجة رخامية A5 مشوية على الحطب مع زبدة الأعشاب العطرية ورقائق ملح مالدون البحري.',
    descriptionEn: 'Japanese A5 Wagyu ribeye grilled over wood embers with fragrant herb butter and Maldon sea salt flakes.',
    allergens: ['dairy'],
    upsellIds: ['k-6', 'k-7', 'k-9'],
    modifiers: [
      {
        id: 'doneness',
        name: 'درجة نضج الستيك',
        nameEn: 'Steak Doneness',
        options: [
          { name: 'متوسط الاستواء (Medium)', nameEn: 'Medium', price: 0 },
          { name: 'نصف استواء وردي غض (Medium Rare)', nameEn: 'Medium Rare', price: 0 },
          { name: 'كامل الاستواء (Well Done)', nameEn: 'Well Done', price: 0 },
        ],
      },
      {
        id: 'steak_sauce',
        name: 'اختيار الصوص الملكي',
        nameEn: 'Sauce Selection',
        options: [
          { name: 'صوص الفلفل الأسود والكمأة', nameEn: 'Truffle Peppercorn Sauce', price: 0 },
          { name: 'صوص المشروم البورتوبيلو البري', nameEn: 'Wild Portobello Mushroom Sauce', price: 0 },
          { name: 'زبدة الثوم والأعشاب الإيطالية', nameEn: 'Garlic Herb Butter', price: 0 },
        ],
      },
    ],
  },
  {
    id: 'k-3',
    name: 'سلايدرز دجاج كرسبي كوري',
    nameEn: 'Korean Crispy Chicken Sliders',
    category: 'burgers',
    price: 52,
    cost: 16,
    image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600&auto=format&fit=crop&q=80',
    color: '#f97316',
    prepTimeMinutes: 10,
    calories: 640,
    available: true,
    station: 'fryer',
    rating: 4.8,
    descriptionAr: 'ثلاث قطع سلايدرز مقرمشة مغطاة بصلصة الغوتشوجانغ الكورية الحلوة والحارة مع سلطة الكولسلو بالسمسم.',
    descriptionEn: 'Trio of crispy fried chicken sliders coated in sweet spicy gochujang glaze with sesame slaw.',
    allergens: ['gluten', 'sesame', 'eggs', 'spicy'],
    upsellIds: ['k-6', 'k-7'],
  },
  {
    id: 'k-4',
    name: 'بيتزا نابولي بالكمأة والمشروم',
    nameEn: 'Truffle Mushroom Pizza',
    category: 'pizza',
    price: 78,
    cost: 20,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    color: '#eab308',
    prepTimeMinutes: 14,
    calories: 820,
    available: true,
    station: 'bakery',
    rating: 4.9,
    isChefSpecial: true,
    descriptionAr: 'عجينة مخمرة 48 ساعة ومخبوزة في فرن الحطب، مع جبنة الموزاريلا الطازجة، مشروم بري وزيت الكمأة البيضاء.',
    descriptionEn: '48-hour fermented wood-fired dough topped with fior di latte mozzarella, wild mushrooms and white truffle oil.',
    allergens: ['gluten', 'dairy'],
    upsellIds: ['k-5', 'k-7', 'k-9'],
  },
  {
    id: 'k-5',
    name: 'ديناميت شريمب مقرمش ملكي',
    nameEn: 'Signature Dynamite Shrimp',
    category: 'appetizers',
    price: 49,
    cost: 18,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    color: '#ec4899',
    prepTimeMinutes: 8,
    calories: 450,
    available: true,
    station: 'fryer',
    rating: 4.9,
    descriptionAr: 'روبيان جامبو مقرمش مغطى بصلصة الديناميت الكريمية الحارة مع رشة بصل أخضر وبذور السمسم المحمصة.',
    descriptionEn: 'Crispy jumbo shrimp tossed in rich spicy dynamite dressing, spring onion and toasted sesame.',
    allergens: ['seafood', 'eggs', 'sesame', 'spicy'],
    upsellIds: ['k-7'],
  },
  {
    id: 'k-6',
    name: 'بطاطس بالبارميزان وزيت الكمأة',
    nameEn: 'Parmesan Truffle Fries',
    category: 'appetizers',
    price: 34,
    cost: 8,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    color: '#eab308',
    prepTimeMinutes: 6,
    calories: 390,
    available: true,
    station: 'fryer',
    rating: 4.8,
    descriptionAr: 'أصابع البطاطس المقرمشة المتبلة بجبن البارميزان الإيطالي المعتق، زيت الكمأة البيضاء والأعشاب الطازجة.',
    descriptionEn: 'Golden crispy fries tossed with aged Parmigiano-Reggiano, white truffle oil and fresh parsley.',
    allergens: ['dairy'],
    upsellIds: ['k-7'],
  },
  {
    id: 'k-7',
    name: 'موهيتو باشن فروت وريحان منعش',
    nameEn: 'Passion Fruit Basil Mojito',
    category: 'beverages',
    price: 28,
    cost: 5,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    color: '#06b6d4',
    prepTimeMinutes: 4,
    calories: 140,
    available: true,
    station: 'beverage',
    rating: 4.9,
    descriptionAr: 'مزيج منعش من ثمار الباشن فروت الطبيعية، أوراق النعناع والريحان الطازجة وعصير الليمون الأخضر مع الصودا الفوارة.',
    descriptionEn: 'Hand-muddled fresh passion fruit, aromatic basil, garden mint, lime and sparkling soda.',
    allergens: [],
    upsellIds: ['k-9'],
  },
  {
    id: 'k-8',
    name: 'كورتادو حبوب إثيوبية مختصة',
    nameEn: 'Single Origin Cortado',
    category: 'beverages',
    price: 22,
    cost: 4,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
    prepTimeMinutes: 3,
    calories: 80,
    available: true,
    station: 'beverage',
    rating: 4.8,
    descriptionAr: 'إسبريسو مزدوج من بن إثيوبي مجفف طبيعياً مع كمية متساوية من الحليب المبخر بقوام حريري ناعم.',
    descriptionEn: 'Double shot of single origin Ethiopian espresso with silky textured steamed milk.',
    allergens: ['dairy'],
    upsellIds: ['k-9'],
  },
  {
    id: 'k-9',
    name: 'كيكة التمر بالكراميل المملح والآيسكريم',
    nameEn: 'Salted Caramel Date Pudding',
    category: 'desserts',
    price: 44,
    cost: 11,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    color: '#10b981',
    prepTimeMinutes: 7,
    calories: 510,
    available: true,
    station: 'bakery',
    rating: 5.0,
    isChefSpecial: true,
    descriptionAr: 'كيكة تمر خلاص ساخنة غارقة في صوص الكراميل والزبدة المملحة تقدم مع كرة آيسكريم فانيليا مدغشقرية.',
    descriptionEn: 'Warm Khalas date sponge drenched in rich salted butterscotch sauce with Madagascar vanilla bean ice cream.',
    allergens: ['gluten', 'dairy', 'eggs'],
  },
];

// Allergen metadata for quick filtering
export const ALLERGEN_TYPES = [
  { id: 'gluten', labelAr: 'خالي من الجلوتين', labelEn: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy', labelAr: 'خالي من الحليب', labelEn: 'Dairy-Free', icon: '🥛' },
  { id: 'nuts', labelAr: 'خالي من المكسرات', labelEn: 'Nut-Free', icon: '🥜' },
  { id: 'seafood', labelAr: 'خالي من المأكولات البحرية', labelEn: 'No Seafood', icon: '🦐' },
  { id: 'spicy', labelAr: 'غير حار', labelEn: 'Mild / Not Spicy', icon: '🌶️' },
];

export interface KioskCartItem {
  cartId: string;
  dish: KioskDishItem;
  quantity: number;
  selectedDoneness?: string;
  selectedAddons: { name: string; price: number }[];
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

export const KioskModule: React.FC = () => {
  const { language, playSound, soundEnabled, setSoundEnabled, weather } = useAppStore();
  const t = getTranslation(language);

  // Top-level Kiosk screen flow
  // attract -> menu -> checkout -> confirmation
  const [screenState, setScreenState] = useState<'attract' | 'menu' | 'checkout' | 'confirmation'>('attract');

  // Kiosk settings & states
  const [kioskOrderType, setKioskOrderType] = useState<OrderType>('dine-in');
  const [selectedTableNumber, setSelectedTableNumber] = useState('T-04');
  const [guestPagerName, setGuestPagerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState<string | null>(null);

  // Cart & Order State
  const [cart, setCart] = useState<KioskCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal Customizer
  const [customizingDish, setCustomizingDish] = useState<KioskDishItem | null>(null);
  const [selectedDoneness, setSelectedDoneness] = useState('Medium');
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const [dishNotes, setDishNotes] = useState('');
  const [dishModalQuantity, setDishModalQuantity] = useState(1);

  // Smart Upsell Modal
  const [upsellSuggestionDish, setUpsellSuggestionDish] = useState<KioskDishItem | null>(null);

  // Checkout & Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'loyalty' | 'cashier'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentTerminalStep, setPaymentTerminalStep] = useState<'prompt' | 'reading' | 'approved'>('prompt');
  const [loyaltyPhone, setLoyaltyPhone] = useState('0501234567');
  const [loyaltyPointsBalance, setLoyaltyPointsBalance] = useState(480);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [autoResetCountdown, setAutoResetCountdown] = useState(20);

  // Auto reset countdown for confirmation screen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (screenState === 'confirmation' && autoResetCountdown > 0) {
      timer = setTimeout(() => {
        setAutoResetCountdown((c) => c - 1);
      }, 1000);
    } else if (screenState === 'confirmation' && autoResetCountdown === 0) {
      handleResetToAttract();
    }
    return () => clearTimeout(timer);
  }, [screenState, autoResetCountdown]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const tax = useMemo(() => Number((subtotal * 0.15).toFixed(2)), [subtotal]);
  const grandTotal = useMemo(() => Number((subtotal + tax).toFixed(2)), [subtotal, tax]);
  const totalCartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // Filtered Dishes
  const filteredDishes = useMemo(() => {
    return KIOSK_DISHES.filter((dish) => {
      const matchCat = selectedCategory === 'all' || dish.category === selectedCategory;
      const matchQuery =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.descriptionAr && dish.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchAllergen = true;
      if (activeAllergenFilter) {
        if (dish.allergens && dish.allergens.includes(activeAllergenFilter)) {
          matchAllergen = false; // Filter out dishes containing the unwanted allergen
        }
      }

      return matchCat && matchQuery && matchAllergen;
    });
  }, [selectedCategory, searchQuery, activeAllergenFilter]);

  // Handle Opening Customizer
  const handleOpenDishModal = (dish: KioskDishItem) => {
    setCustomizingDish(dish);
    setSelectedDoneness(
      dish.modifiers?.find((m) => m.id === 'doneness')?.options[0]?.name || 'Medium'
    );
    setSelectedAddons([]);
    setDishNotes('');
    setDishModalQuantity(1);
    playSound('pop');
  };

  // Add customized dish to cart
  const handleConfirmAddToCart = () => {
    if (!customizingDish) return;

    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = customizingDish.price + addonsPrice;
    const totalPrice = unitPrice * dishModalQuantity;

    const cartId = `kiosk_${customizingDish.id}_${selectedDoneness}_${selectedAddons.map((a) => a.name).join('_')}_${dishNotes}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartId === cartId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += dishModalQuantity;
        updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
        return updated;
      } else {
        const newItem: KioskCartItem = {
          cartId,
          dish: customizingDish,
          quantity: dishModalQuantity,
          selectedDoneness,
          selectedAddons,
          notes: dishNotes,
          unitPrice,
          totalPrice,
        };
        return [...prev, newItem];
      }
    });

    playSound('success');

    // Trigger Smart Upselling suggestion if available
    const upsellId = customizingDish.upsellIds?.[0];
    const candidateUpsell = KIOSK_DISHES.find((d) => d.id === upsellId);

    const dishToRemember = customizingDish;
    setCustomizingDish(null);

    if (candidateUpsell && !cart.some((i) => i.dish.id === candidateUpsell.id)) {
      setTimeout(() => {
        setUpsellSuggestionDish(candidateUpsell);
      }, 400);
    }
  };

  // 1-Click Upsell Add
  const handleAddUpsellDish = (dish: KioskDishItem) => {
    const cartId = `kiosk_upsell_${dish.id}`;
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartId === cartId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
        return updated;
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
    playSound('kitchen-bell');
    setUpsellSuggestionDish(null);
  };

  // Quantity updates in cart
  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as KioskCartItem[];
    });
    playSound('tap');
  };

  const handleRemoveCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
    playSound('delete');
  };

  // Submit Order & Process Payment
  const handleExecuteOrderPayment = async () => {
    if (cart.length === 0) return;

    setIsProcessingPayment(true);
    setPaymentTerminalStep('reading');
    playSound('click');

    // Simulate POS Terminal processing time
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setPaymentTerminalStep('approved');
    playSound('cash-register');

    await new Promise((resolve) => setTimeout(resolve, 600));

    const orderNumber = `K-${Math.floor(100 + Math.random() * 900)}`;
    const orderId = db.generateUUID();

    // Prepare unified order item records
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
      notes: ci.notes || (ci.selectedDoneness ? `درجة الاستواء: ${ci.selectedDoneness}` : undefined),
      kitchenStation: ci.dish.station,
      status: 'cooking' as const,
      printedToKitchen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newOrder = {
      id: orderId,
      orderNumber,
      orderType: kioskOrderType,
      tableId: kioskOrderType === 'dine-in' ? selectedTableNumber : undefined,
      customerName: guestPagerName ? `الضيف: ${guestPagerName}` : `كشك الخدمة الذاتية (${kioskOrderType === 'dine-in' ? selectedTableNumber : 'سفري'})`,
      status: 'sent_to_kitchen' as const,
      paymentStatus: 'paid' as const,
      paymentMethod: selectedPaymentMethod === 'cashier' ? 'cash' as const : 'card' as const,
      subtotal,
      taxAmount: tax,
      discountAmount: 0,
      totalAmount: grandTotal,
      paidAmount: grandTotal,
      changeAmount: 0,
      guestCount: 1,
      customerNotes: guestPagerName ? `الاسم: ${guestPagerName}` : undefined,
      kitchenNotes: `طلب كشك ذاتي #${orderNumber}`,
      syncStatus: 'synced' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Insert into local DB
    try {
      await db.insert('orders', newOrder as any);
      await db.bulkInsert('orderItems', orderItems as any);
    } catch (e) {
      console.warn('DB insert fallback:', e);
    }

    // 2. Publish Events for Kitchen KDS, POS, and Sound
    eventBus.publish('ORDER_CREATED', { order: newOrder as any, items: orderItems as any }, 'pos');
    eventBus.publish('KDS_NEW_TICKET', {
      orderId,
      tableNumber: kioskOrderType === 'dine-in' ? selectedTableNumber : 'Kiosk Takeaway',
      items: orderItems as any,
    }, 'pos');

    // 3. Trigger KDS reload
    useKdsStore.getState().loadKdsTickets();

    // 4. Trigger Inventory Deduction Simulation
    try {
      const inventoryStore = useInventoryStore.getState();
      const currentItems = inventoryStore.items;
      if (currentItems.length > 0) {
        // Deduct first available item as prototype ingredient consumption
        const targetInv = currentItems[0];
        await inventoryStore.adjustStock(
          targetInv.id,
          -1,
          'sale_consumption',
          `استهلاك طلب كشك ${orderNumber}`,
          'kiosk_terminal'
        );
      }
    } catch (err) {
      console.error('Inventory deduct err:', err);
    }

    // 5. Trigger Physical/Simulated Receipt Print
    printerService.printKitchenTicket(newOrder as any, orderItems as any, 'all').catch(console.warn);

    // Save order data for confirmation view
    setLastCreatedOrder({
      ...newOrder,
      items: orderItems,
      orderNumber,
    });

    setIsProcessingPayment(false);
    setScreenState('confirmation');
    setAutoResetCountdown(20);

    // Blast celebratory confetti!
    burstConfetti({
      particleCount: 110,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#fbbf24'],
    });

    playSound('kitchen-bell');
  };

  // Reset entire kiosk to welcome attract screen
  const handleResetToAttract = () => {
    setCart([]);
    setIsCartOpen(false);
    setCustomizingDish(null);
    setUpsellSuggestionDish(null);
    setScreenState('attract');
    setPaymentTerminalStep('prompt');
    setAutoResetCountdown(20);
    playSound('pop');
  };

  // =========================================================================
  // VIEW 1: ATTRACT & WELCOME SCREEN (شاشة الترحيب وبدء الطلب)
  // =========================================================================
  if (screenState === 'attract') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-950 flex flex-col justify-between p-8 select-none">
        {/* Animated Background Food Visuals with Luxury Ambient Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&auto=format&fit=crop&q=80"
            alt="Luxury Food Background"
            className="w-full h-full object-cover opacity-25 scale-105 filter blur-sm transition-transform duration-10000 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        </div>

        {/* Top Header Bar with Language, Weather & Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-8 h-8 text-amber-400 fill-amber-400/40 animate-bounce" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">مطعم السلطان الملكي</h1>
              <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase">
                Sultan Royal Gourmet & Steakhouse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Weather Recommendation */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {weather?.temp ? `${weather.temp}°C ${weather.conditionAr || 'أجواء رائعة'}` : 'أجواء الرياض 28°C — نوصي بالأطباق المشوية'}
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 flex items-center justify-center text-slate-200 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Center Hero: Order Mode Choice & Welcome Message */}
        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center my-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold shadow-lg shadow-amber-500/10">
              <Sparkles className="w-4 h-4" /> كشك الطلب الذاتي التفاعلي الفاخر
            </span>

            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              أهلاً بكم في رحلة المذاق <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">الملكي الأصيل</span>
            </h2>

            <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              اختر نوع طلبك المفضل، واستكشف تشكيلة أطباق الشيف الحصرية مع تخصيص كامل لمكوناتك المفضلة.
            </p>
          </motion.div>

          {/* Dining Type Big Touch Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-10">
            {/* Dine-In Option */}
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setKioskOrderType('dine-in');
                setScreenState('menu');
                playSound('slide');
              }}
              className="p-8 rounded-3xl bg-gradient-to-b from-amber-500/20 to-amber-950/40 border-2 border-amber-500/50 hover:border-amber-400 shadow-2xl shadow-amber-500/20 flex flex-col items-center gap-4 cursor-pointer text-center group transition-all"
            >
              <div className="w-20 h-20 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:rotate-6 transition-transform">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">تناول داخل الصالة</h3>
                <p className="text-xs text-amber-300/90 font-medium mt-1">Dine-In • خدمة الطاولة والضيافة الملكية</p>
              </div>
              <span className="text-xs px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                تحديد رقم الطاولة عند الدفع
              </span>
            </motion.button>

            {/* Takeaway Option */}
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setKioskOrderType('takeaway');
                setScreenState('menu');
                playSound('slide');
              }}
              className="p-8 rounded-3xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-2xl shadow-emerald-500/20 flex flex-col items-center gap-4 cursor-pointer text-center group transition-all"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:-rotate-6 transition-transform">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">طلب سفري وخارجي</h3>
                <p className="text-xs text-emerald-300/90 font-medium mt-1">Takeaway • استلام سريع وتغليف حراري فاخر</p>
              </div>
              <span className="text-xs px-4 py-1.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold">
                استلام برقم الطلب وشاشة النداء
              </span>
            </motion.button>
          </div>
        </div>

        {/* Footer Bar: Touch Screen Prompt */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 text-amber-400 text-sm font-bold bg-amber-500/10 px-6 py-2.5 rounded-full border border-amber-500/30"
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>المس الشاشة في أي مكان للبدء • Touch Anywhere to Order</span>
          </motion.div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN MENU & BROWSING SCREEN (تصفح القائمة والطلب)
  // =========================================================================
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 rounded-3xl relative select-none">
      {/* Top Kiosk Header */}
      <header className="p-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToAttract}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 border border-white/10 transition-all text-xs font-bold cursor-pointer"
            title="إلغاء والعودة للبداية"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">البداية</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">مطعم السلطان</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
                <span>{kioskOrderType === 'dine-in' ? '🍽️ داخل الصالة' : '🛍️ سفري وخارجي'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Allergen Toggle */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن برجر، ستيك، قهوة، أو حلوى..."
              className="w-full bg-white/5 border border-white/10 focus:border-amber-400 rounded-2xl ps-10 pe-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Cart Floating Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-400/50 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>سلة الطلب</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
            <span className="font-extrabold">{grandTotal} ر.س</span>
          </button>
        </div>
      </header>

      {/* Categories & Allergen Filter Bar */}
      <div className="p-3 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex flex-col gap-2.5 z-10">
        {/* Categories Tab Bar */}
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Allergen & Dietary Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs text-slate-400 custom-scrollbar">
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 min-w-max">
            <ShieldAlert className="w-3.5 h-3.5" /> فلاتر الحساسية:
          </span>
          <button
            onClick={() => setActiveAllergenFilter(null)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeAllergenFilter === null
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            عرض الكل
          </button>
          {ALLERGEN_TYPES.map((allergen) => {
            const isSelected = activeAllergenFilter === allergen.id;
            return (
              <button
                key={allergen.id}
                onClick={() => {
                  setActiveAllergenFilter(isSelected ? null : allergen.id);
                  playSound('tap');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>{allergen.icon}</span>
                <span>{allergen.labelAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Menu Grid & Side Cart Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {filteredDishes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <Utensils className="w-12 h-12 text-slate-600 mb-3" />
              <p className="font-bold text-base">لا توجد أطباق مطابقة للبحث أو الفلتر المحدد</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveAllergenFilter(null);
                }}
                className="mt-3 text-xs text-amber-400 underline font-bold cursor-pointer"
              >
                إعادة ضبط جميع الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDishes.map((dish) => {
                return (
                  <motion.div
                    key={dish.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="group relative rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-500/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden flex flex-col justify-between transition-all duration-300"
                  >
                    {/* Dish Image Header */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                      {/* Calorie & Chef Badges */}
                      <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
                        {dish.calories && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[11px] text-amber-400 font-bold">
                            <Flame className="w-3 h-3 text-amber-400" />
                            {dish.calories} سعرة
                          </span>
                        )}
                        {dish.isChefSpecial && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shadow-md">
                            توصية الشيف 👑
                          </span>
                        )}
                      </div>

                      {/* Prep Time */}
                      <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dish.prepTimeMinutes} دقيقة</span>
                      </div>
                    </div>

                    {/* Dish Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {dish.name}
                          </h3>
                          <span className="text-lg font-black text-amber-400 whitespace-nowrap">
                            {dish.price} <span className="text-xs">ر.س</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {dish.descriptionAr || dish.nameEn}
                        </p>

                        {/* Allergen Badges */}
                        {dish.allergens && dish.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {dish.allergens.map((alg) => (
                              <span
                                key={alg}
                                className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400"
                              >
                                {alg === 'gluten' && '🌾 جلوتين'}
                                {alg === 'dairy' && '🥛 حليب'}
                                {alg === 'nuts' && '🥜 مكسرات'}
                                {alg === 'seafood' && '🦐 بحري'}
                                {alg === 'sesame' && '🌱 سمسم'}
                                {alg === 'eggs' && '🥚 بيض'}
                                {alg === 'spicy' && '🌶️ حار'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Touch Action Button */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenDishModal(dish)}
                          className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تخصيص وإضافة للطلب</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Side Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-96 border-s border-white/10 bg-slate-900/95 backdrop-blur-2xl flex flex-col justify-between h-full z-30 shadow-2xl"
            >
              {/* Cart Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">سلة طلبك الحالي</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {totalCartCount} أصناف
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="font-bold text-sm">سلتك فارغة حتى الآن</p>
                    <p className="text-xs text-slate-500 mt-1">المس أي صنف في القائمة لتخصيصه وإضافته</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartId}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2 relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2.5">
                          <img
                            src={item.dish.image}
                            alt={item.dish.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-white">{item.dish.name}</h4>
                            {item.selectedDoneness && (
                              <p className="text-[11px] text-amber-400">درجة الاستواء: {item.selectedDoneness}</p>
                            )}
                            {item.selectedAddons.length > 0 && (
                              <p className="text-[10px] text-slate-400">
                                {item.selectedAddons.map((a) => a.name).join(' + ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-[10px] text-rose-300 italic">ملاحظة: {item.notes}</p>
                            )}
                          </div>
                        </div>

                        <span className="font-bold text-xs text-amber-400 whitespace-nowrap">
                          {item.totalPrice} ر.س
                        </span>
                      </div>

                      {/* Quantity Selector & Remove */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleRemoveCartItem(item.cartId)}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">حذف</span>
                        </button>

                        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.cartId, -1)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.cartId, 1)}
                            className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Drawer Footer & Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-slate-950/80 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>المجموع الفرعي:</span>
                      <span>{subtotal} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span>{tax} ر.س</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-amber-400">{grandTotal} ر.س</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setScreenState('checkout');
                      playSound('pop');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <span>متابعة إتمام الطلب والدفع</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dish Customization Modal */}
      <AnimatePresence>
        {customizingDish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 custom-scrollbar flex flex-col justify-between"
            >
              <div>
                {/* Modal Header with Image & Title */}
                <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                  <img
                    src={customizingDish.image}
                    alt={customizingDish.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <button
                    onClick={() => setCustomizingDish(null)}
                    className="absolute top-3 end-3 w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{customizingDish.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{customizingDish.descriptionAr || customizingDish.nameEn}</p>
                  </div>
                  <span className="text-xl font-black text-amber-400">{customizingDish.price} ر.س</span>
                </div>

                {/* Modifiers: Doneness */}
                {customizingDish.modifiers?.find((m) => m.id === 'doneness') && (
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-amber-400 mb-2">
                      اختر درجة استواء اللحم:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {customizingDish.modifiers
                        .find((m) => m.id === 'doneness')
                        ?.options.map((opt) => {
                          const isSel = selectedDoneness === opt.name;
                          return (
                            <button
                              key={opt.name}
                              onClick={() => setSelectedDoneness(opt.name)}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {opt.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Modifiers: Extra Addons */}
                {customizingDish.modifiers?.find((m) => m.id === 'extra_cheese') && (
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-amber-400 mb-2">
                      إضافات وترقيات مقترحة:
                    </label>
                    <div className="space-y-2">
                      {customizingDish.modifiers
                        .find((m) => m.id === 'extra_cheese')
                        ?.options.map((addon) => {
                          const isAdded = selectedAddons.some((a) => a.name === addon.name);
                          return (
                            <button
                              key={addon.name}
                              onClick={() => {
                                if (isAdded) {
                                  setSelectedAddons((prev) => prev.filter((a) => a.name !== addon.name));
                                } else {
                                  setSelectedAddons((prev) => [...prev, { name: addon.name, price: addon.price }]);
                                }
                                playSound('tap');
                              }}
                              className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                                isAdded
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isAdded ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-500'}`}>
                                  {isAdded && <Check className="w-3 h-3 font-black" />}
                                </div>
                                <span className="font-bold">{addon.name}</span>
                              </div>
                              <span className="font-bold text-amber-400">+{addon.price} ر.س</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Special Instructions Note Input */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ملاحظات خاصة للمطبخ (اختياري):
                  </label>
                  <input
                    type="text"
                    value={dishNotes}
                    onChange={(e) => setDishNotes(e.target.value)}
                    placeholder="مثال: بدون بصل، صوص إضافي على جنب، خبز محمص..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Modal Footer: Quantity & Confirm Add */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setDishModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-white w-6 text-center">{dishModalQuantity}</span>
                  <button
                    onClick={() => setDishModalQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleConfirmAddToCart}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    إضافة للطلب (
                    {(customizingDish.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * dishModalQuantity} ر.س)
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Upselling Suggestion Popup */}
      <AnimatePresence>
        {upsellSuggestionDish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white">اقتراح رائع ليكتمل طبقك! 👑</h3>
              <p className="text-xs text-slate-300 mt-1">يطلب ضيوفنا عادة هذا الصنف المميز مع اختيارك:</p>

              <div className="my-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-start">
                <img
                  src={upsellSuggestionDish.image}
                  alt={upsellSuggestionDish.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-white">{upsellSuggestionDish.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{upsellSuggestionDish.descriptionAr}</p>
                  <span className="text-xs font-black text-amber-400 mt-1 block">
                    +{upsellSuggestionDish.price} ر.س
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setUpsellSuggestionDish(null)}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  لا، شكراً
                </button>
                <button
                  onClick={() => handleAddUpsellDish(upsellSuggestionDish)}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  إضافة للطلب 🍟
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW 3: CHECKOUT & PAYMENT MODAL / OVERLAY                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {screenState === 'checkout' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col justify-between max-h-[95vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-xl font-black text-white">إتمام الطلب والدفع الفوري</h3>
                    <p className="text-xs text-slate-400">حدد بيانات الاستلام وطريقة الدفع المفضلة</p>
                  </div>
                </div>
                <button
                  onClick={() => setScreenState('menu')}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dine-in Table Selection or Pager */}
              <div className="my-5 space-y-4">
                {kioskOrderType === 'dine-in' ? (
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-2">
                      اختر رقم طاولتك داخل الصالة:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'VIP-01', 'VIP-02'].map((table) => {
                        const isSel = selectedTableNumber === table;
                        return (
                          <button
                            key={table}
                            onClick={() => {
                              setSelectedTableNumber(table);
                              playSound('tap');
                            }}
                            className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {table}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-2">
                      اسم المستلم أو رقم الجوال لإشعارك عند الجاهزية:
                    </label>
                    <input
                      type="text"
                      value={guestPagerName}
                      onChange={(e) => setGuestPagerName(e.target.value)}
                      placeholder="مثال: فيصل العتيبي — 0501234567"
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                )}

                {/* Payment Method Choice */}
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-2">
                    اختر وسيلة الدفع:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card / Mada */}
                    <button
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'card'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">بطاقة / مدى</span>
                    </button>

                    {/* Apple Pay */}
                    <button
                      onClick={() => setSelectedPaymentMethod('apple-pay')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'apple-pay'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Smartphone className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">Apple Pay</span>
                    </button>

                    {/* Loyalty Points */}
                    <button
                      onClick={() => setSelectedPaymentMethod('loyalty')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'loyalty'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Award className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">نقاط الولاء</span>
                    </button>

                    {/* Pay at Cashier */}
                    <button
                      onClick={() => setSelectedPaymentMethod('cashier')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        selectedPaymentMethod === 'cashier'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Store className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">عند الكاشير</span>
                    </button>
                  </div>
                </div>

                {/* Loyalty Info if selected */}
                {selectedPaymentMethod === 'loyalty' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">رصيد نقاط الولاء المتاح:</span>
                      <span className="text-amber-400 font-black">{loyaltyPointsBalance} نقطة (= 48 ر.س خصم)</span>
                    </div>
                    <span className="text-[11px] text-slate-300">سيتم خصم النقاط تلقائياً</span>
                  </div>
                )}

                {/* Bill Summary */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>المجموع الفرعي ({totalCartCount} أصناف):</span>
                    <span>{subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span>{tax} ر.س</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-white/10">
                    <span>المبلغ المستحق للدفع:</span>
                    <span className="text-amber-400">{grandTotal} ر.س</span>
                  </div>
                </div>
              </div>

              {/* POS Terminal Simulation / Execution */}
              <div className="pt-3">
                {isProcessingPayment ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <div>
                      <h4 className="font-black text-white text-base">
                        {paymentTerminalStep === 'reading' ? 'جاري الاتصال بجهاز الدفع...' : 'تم قبول الدفع بنجاح!'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">مرر بطاقتك البنكية أو جهازك الآن</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleExecuteOrderPayment}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-90 text-slate-950 font-black text-base shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد الطلب والدفع ({grandTotal} ر.س)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW 4: ORDER CONFIRMATION & THERMAL RECEIPT MODAL                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {screenState === 'confirmation' && lastCreatedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-6 md:p-8 text-center flex flex-col items-center relative overflow-hidden"
            >
              {/* Top Golden Check Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                تم استلام طلبك وإرساله للمطبخ بنجاح! ✨
              </span>

              {/* Big Token Number */}
              <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-white/10 w-full">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block">
                  رقم طلبك في شاشة النداء
                </span>
                <span className="text-5xl font-black text-amber-400 tracking-wider my-1 block">
                  {lastCreatedOrder.orderNumber}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {lastCreatedOrder.orderType === 'dine-in'
                    ? `طاولة رقم: ${lastCreatedOrder.tableId}`
                    : 'استلام سفري عند نافذة التسليم'}
                </span>
              </div>

              {/* Simulated QR Code & Live Tracker Info */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 w-full text-start mb-4">
                <div className="w-16 h-16 bg-white p-1.5 rounded-xl flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">امسح الرمز لتتبع طلبك على جوالك</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    وقت التحضير المقدر: 10 - 15 دقيقة
                  </p>
                  <span className="text-[10px] text-amber-400 font-bold">
                    محطات الطهي: الشواية والمخبوزات
                  </span>
                </div>
              </div>

              {/* Auto Reset Timer & Actions */}
              <div className="w-full space-y-2.5">
                <button
                  onClick={handleResetToAttract}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>إنهاء والعودة للبداية ({autoResetCountdown} ثانية)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
