/**
 * =====================================================================
 * RESTAURANT OS — TABLESIDE GUEST PORTAL & ORDER TRACKER TYPES
 * =====================================================================
 */

import type { MenuItem, KitchenStation, OrderItemStatus } from '../db/schema';
export type { MenuItem, KitchenStation, OrderItemStatus };

export type TableCookingStage = 
  | 'received'    // طلب مستلم ومؤكد
  | 'preparing'   // قيد التحضير في المطبخ
  | 'plating'     // التجهيز الأخير والسكب الفاخر
  | 'served'      // تم التقديم على الطاولة
  | 'billing'     // طلب الحساب
  | 'paid';       // تم السداد بنجاح

export type WaiterCallType = 
  | 'general_waiter'    // استدعاء الويتر
  | 'water_refill'      // طلب ماء وضيافة
  | 'cutlery_napkins'   // أدوات طعام ومناديل
  | 'clean_table'       // تنظيف وترتيب الطاولة
  | 'custom_request';   // طلب أو استفسار خاص

export type TablePaymentMethod = 
  | 'apple_pay' 
  | 'mada_card' 
  | 'cash_waiter' 
  | 'loyalty_points' 
  | 'split_bill';

export interface TableQrPayload {
  tableId: string;
  tableNumber: string;
  sectionName: string;
  branchName: string;
  qrCodeToken: string;
  url: string;
  generatedAt: string;
  expiresAt: string;
  signature: string;
}

export interface TableGuestSession {
  sessionId: string;
  tableId: string;
  tableNumber: string;
  guestCount: number;
  guestName?: string;
  guestPhone?: string;
  startedAt: string;
  activeOrderId?: string;
  status: 'browsing' | 'ordered' | 'eating' | 'billing' | 'completed';
  waiterCallActive: boolean;
  lastWaiterCallType?: WaiterCallType;
  lastWaiterCallTime?: string;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'vip';
  loyaltyPoints?: number;
}

export interface GuestCartItem {
  cartUniqueId: string;
  dish: any;
  quantity: number;
  selectedModifiers: Record<string, string>;
  selectedExtras?: string[];
  specialInstructions: string;
  unitPrice: number;
  itemTotal: number;
}

export interface TableOrderItemProgress {
  id: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  station: KitchenStation | string;
  status: OrderItemStatus;
  prepTimeMinutes: number;
}

export interface TableOrderProgress {
  orderId: string;
  orderNumber: string;
  tableId: string;
  tableNumber: string;
  stage: TableCookingStage;
  stageIndex: number; // 0..5
  progressPercentage: number; // 0..100
  estimatedTotalMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  startedAt: string;
  targetCompletionAt: string;
  stageTimestamps: Partial<Record<TableCookingStage, string>>;
  items: TableOrderItemProgress[];
}

export interface WaiterCallRequest {
  id: string;
  tableNumber: string;
  tableId: string;
  callType: WaiterCallType;
  notes?: string;
  requestedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface BillRequestPayload {
  orderId: string;
  tableNumber: string;
  tableId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  tipPercentage: number;
  tipAmount: number;
  grandTotal: number;
  paymentMethod: TablePaymentMethod;
  splitCount: number;
  amountPerPerson: number;
  zatcaQrCode: string;
  isSettled: boolean;
  requestedAt: string;
  settledAt?: string;
}

export interface GuestFeedbackPayload {
  tableNumber: string;
  orderId: string;
  rating: number; // 1 to 5
  tags: string[];
  comment?: string;
  submittedAt: string;
  customerName?: string;
}

export interface GuestPortalFilterState {
  category: string;
  searchQuery: string;
  allergensToExclude: string[];
  maxCalories: number;
  sortBy: 'recommended' | 'price_low' | 'price_high' | 'fastest_prep' | 'calories_low';
  onlyAvailable: boolean;
}
