/**
 * =====================================================================
 * RESTAURANT OS — SHIFT MANAGEMENT & DIGITAL CASH DRAWER TYPES
 * =====================================================================
 */

export type ShiftStatus = 'open' | 'closed' | 'suspended';

export type CashMovementType =
  | 'cash_in'        // إيداع نقدي / تغذية الدرج
  | 'cash_out'       // سحب نقدي
  | 'petty_cash'      // مصاريف نثرية
  | 'safe_drop'      // ترحيل للخزينة الرئيسية
  | 'refund_payout';  // استرجاع نقدي للعميل

export type PettyCashCategory =
  | 'emergency_purchase'  // مشتريات عاجلة وطازجة
  | 'cleaning_supplies'   // أدوات ومواد نظافة
  | 'hospitality'         // ضيافة واستقبال
  | 'maintenance'         // صيانة طارئة وسباكة وكهرباء
  | 'ice_delivery'        // قوالب ثلج وتبريد
  | 'gas_fuel'            // غاز ووقود توصيل
  | 'tips_payout'         // توزيع إكراميات
  | 'government_fees'     // رسوم وبلدية سريعة
  | 'other';              // أخرى

export interface DenominationConfig {
  value: number;
  labelAr: string;
  labelEn: string;
  type: 'banknote' | 'coin';
  color: string;
  textColor: string;
  borderColor: string;
  badge: string;
}

export type CashDenominationMap = Record<number, number>;

export interface CashMovement {
  id: string;
  shiftId: string;
  drawerId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  category?: PettyCashCategory;
  receiptNumber?: string;
  vendorName?: string;
  performedBy: string;
  performedByName?: string;
  authorizedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentChannelSummary {
  count: number;
  total: number;
}

export interface PaymentMethodBreakdown {
  cash: PaymentChannelSummary;
  mada: PaymentChannelSummary;
  visa_master: PaymentChannelSummary;
  apple_pay: PaymentChannelSummary;
  delivery_jahez: PaymentChannelSummary;
  delivery_hungerstation: PaymentChannelSummary;
  delivery_keeta: PaymentChannelSummary;
  delivery_chefz: PaymentChannelSummary;
  gift_card: PaymentChannelSummary;
  loyalty_points: PaymentChannelSummary;
  store_credit: PaymentChannelSummary;
  other: PaymentChannelSummary;
}

export type VarianceStatus = 'balanced' | 'overage' | 'shortage';

export interface ShiftVariance {
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: VarianceStatus;
  percentage: number;
  needsSupervisorApproval: boolean;
  isApproved?: boolean;
  approvedBy?: string;
  approvalReason?: string;
  approvedAt?: string;
}

export interface ShiftSalesSummary {
  grossSales: number;       // المبيعات الإجمالية قبل الخصم
  netSales: number;         // المبيعات الصافية بدون ضريبة
  vatAmount: number;        // ضريبة القيمة المضافة 15%
  discountAmount: number;   // إجمالي الخصومات
  refundAmount: number;     // إجمالي المرتجعات
  voidAmount: number;       // إجمالي الملغيات
  ordersCount: number;      // عدد الطلبات الكلي
  guestCount: number;       // عدد الضيوف
  averageTicket: number;    // متوسط الفاتورة
}

export interface BlindCountRecord {
  denominations: CashDenominationMap;
  totalCounted: number;
  countedAt: string;
  countedBy: string;
  countedByName?: string;
  notes?: string;
}

export interface ShiftSession {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  drawerId: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  closedAt?: string;
  status: ShiftStatus;
  openingFloat: number;
  cashMovements: CashMovement[];
  salesSummary: ShiftSalesSummary;
  paymentBreakdown: PaymentMethodBreakdown;
  blindCount?: BlindCountRecord;
  variance?: ShiftVariance;
  drawerKicksCount: number;
  firstInvoiceNumber?: string;
  lastInvoiceNumber?: string;
  notes?: string;
  zReportId?: string;
  xReportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZReportBranchInfo {
  nameAr: string;
  nameEn: string;
  vatNumber: string;
  crNumber: string;
  address: string;
  phone: string;
  branchCode: string;
}

export interface ZReportCashReconciliation {
  openingFloat: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  pettyCashTotal: number;
  safeDrops: number;
  cashRefunds: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: VarianceStatus;
}

export interface ZReportStatistics {
  totalOrders: number;
  dineInOrders: number;
  takeawayOrders: number;
  deliveryOrders: number;
  totalGuests: number;
  averageOrderValue: number;
  cashDrawerOpens: number;
  firstInvoiceNo: string;
  lastInvoiceNo: string;
}

export interface ZReportZatcaMeta {
  qrCodePayload: string;
  qrCodeUrl: string;
  cryptographicHash: string;
  digitalSignature: string;
  zatcaComplianceStatus: 'compliant' | 'verified';
  sequenceNumber: number;
}

export interface ZReportRecord {
  id: string;
  reportNumber: string; // Z-20260816-0001
  reportType: 'Z_REPORT' | 'X_REPORT';
  shiftId: string;
  branch: ZReportBranchInfo;
  cashier: {
    id: string;
    name: string;
  };
  period: {
    openedAt: string;
    closedAt: string;
    durationMinutes: number;
  };
  sales: {
    grossSales: number;
    netSales: number;
    vatAmount: number;
    discounts: number;
    refunds: number;
    voids: number;
  };
  payments: PaymentMethodBreakdown;
  cashReconciliation: ZReportCashReconciliation;
  statistics: ZReportStatistics;
  zatca: ZReportZatcaMeta;
  generatedAt: string;
  generatedBy: string;
  supervisorApproval?: {
    approvedBy: string;
    timestamp: string;
    reason: string;
  };
}

export interface OpenShiftParams {
  cashierId: string;
  cashierName: string;
  drawerId?: string;
  branchId?: string;
  branchName?: string;
  openingFloat: number;
  notes?: string;
}

export interface AddCashMovementParams {
  type: CashMovementType;
  amount: number;
  reason: string;
  category?: PettyCashCategory;
  receiptNumber?: string;
  vendorName?: string;
  performedBy: string;
  performedByName?: string;
  authorizedBy?: string;
  notes?: string;
}

export interface CloseShiftParams {
  denominations: CashDenominationMap;
  countedBy: string;
  countedByName?: string;
  notes?: string;
  supervisorApproval?: {
    approvedBy: string;
    reason: string;
  };
}
