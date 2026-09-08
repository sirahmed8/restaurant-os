export type AppModule = 
  | 'pos' 
  | 'shift'
  | 'floorplan'
  | 'kds' 
  | 'delivery'
  | 'waiter'
  | 'table_portal'
  | 'kiosk'
  | 'online_store'
  | 'intercom'
  | 'inventory' 
  | 'procurement'
  | 'recipe_studio'
  | 'staff' 
  | 'customers' 
  | 'marketing'
  | 'reports' 
  | 'ai' 
  | 'vision'
  | 'hardware'
  | 'settings'
  | 'superadmin'
  | 'security'
  | 'zatca';

export * from './superAdmin';
export * from './delivery';
export * from './floorplan';
export * from './vision';
export * from './marketing';
export * from './recipeStudio';
export * from './procurement';
export * from './shift';
export * from './tablePortal';
export * from './zatca';


export type Language = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light';

export interface UserProfile {
  id: string;
  name: string;
  nameEn: string;
  role: 'admin' | 'manager' | 'cashier' | 'chef' | 'customer';
  avatar: string;
  pin: string;
  branch: string;
  email?: string;
  phone?: string;
}

export interface WeatherInfo {
  temp: number;
  temperature?: number;
  apparentTemperature?: number;
  condition: string;
  conditionAr: string;
  conditionEn?: string;
  icon: string;
  humidity: number;
  city: string;
  cityAr?: string;
  lastUpdated?: string;
  recommendationCategory?: string;
  recommendedDishKeywordsAr?: string[];
  recommendedDishKeywordsEn?: string[];
}

export type SoundEffectName = 
  | 'tap'
  | 'click'
  | 'success'
  | 'kitchen-bell'
  | 'cash-register'
  | 'alert'
  | 'delete'
  | 'pop'
  | 'slide'
  | 'whoosh';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  cost: number;
  image: string;
  color: string;
  calories?: number;
  prepTimeMinutes: number;
  available: boolean;
  station: 'grill' | 'fryer' | 'beverage' | 'assembly' | 'bakery';
  modifiers?: {
    id: string;
    name: string;
    nameEn: string;
    options: {
      name: string;
      nameEn: string;
      price: number;
    }[];
  }[];
}

export interface CartItem {
  cartItemId: string;
  dish: MenuItem;
  quantity: number;
  selectedModifiers?: Record<string, string>;
  notes?: string;
  itemTotal: number;
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'drive-thru';
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  elapsedSeconds: number;
  paymentMethod?: 'cash' | 'card' | 'apple-pay' | 'loyalty-points';
  cashierId: string;
}

export interface KdsTicket {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: OrderType;
  items: {
    id: string;
    name: string;
    nameEn: string;
    quantity: number;
    station: 'grill' | 'fryer' | 'beverage' | 'assembly' | 'bakery';
    modifiers?: string[];
    notes?: string;
    completed?: boolean;
  }[];
  notes?: string;
  status: 'new' | 'cooking' | 'ready' | 'served';
  startedAt: string;
  elapsedMinutes: number;
  isUrgent?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  unitEn: string;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
  status: 'optimal' | 'low' | 'critical';
}

export interface StaffMember {
  id: string;
  name: string;
  nameEn: string;
  role: 'head_chef' | 'sous_chef' | 'floor_manager' | 'senior_cashier' | 'barista';
  roleTitleAr: string;
  roleTitleEn: string;
  avatar: string;
  status: 'on_shift' | 'break' | 'off_shift';
  shiftStart: string;
  todaySales?: number;
  ordersHandled?: number;
  performanceScore: number;
}

export interface CustomerLoyalty {
  id: string;
  name: string;
  phone: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Black VIP';
  points: number;
  totalSpent: number;
  visitsCount: number;
  favoriteDish: string;
  lastVisit: string;
}

export interface FinancialSummary {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrdersCount: number;
  averageTicket: number;
  grossProfitMargin: number;
  topSellers: { name: string; nameEn: string; quantity: number; revenue: number }[];
  hourlyRevenue: { hour: string; amount: number }[];
}

export interface IntercomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'cashier' | 'chef' | 'waiter' | 'manager' | 'admin';
  senderAvatar: string;
  channel: 'all' | 'kitchen' | 'floor' | 'cashier' | 'management';
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  tableNumber?: string;
  orderNumber?: string;
  timestamp: string;
  isPreset?: boolean;
  audioVoiceUrl?: string;
  voiceDurationSeconds?: number;
  acknowledgedBy?: string[];
}

