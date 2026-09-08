/**
 * =====================================================================
 * RESTAURANT OS — DIGITAL PROCUREMENT & SUPPLIER MANAGEMENT TYPES
 * =====================================================================
 * Enterprise Supply Chain, 3-Way Matching, PO Lifecycle & Inventory Costing.
 */

export type PurchaseOrderStatus = 
  | 'draft' 
  | 'approved' 
  | 'dispatched' 
  | 'received' 
  | 'paid' 
  | 'cancelled';

export type MatchingStatus = 
  | 'exact_match' 
  | 'within_tolerance' 
  | 'discrepancy' 
  | 'critical_mismatch';

export type MatchingDiscrepancyType = 
  | 'price_variance' 
  | 'quantity_variance' 
  | 'tax_mismatch' 
  | 'unexpected_item' 
  | 'missing_item' 
  | 'quality_rejected';

export type PaymentTerm = 
  | 'cash_on_delivery' 
  | 'net_7' 
  | 'net_15' 
  | 'net_30' 
  | 'net_60' 
  | 'net_90';

export type ProcurementPaymentMethod = 
  | 'bank_transfer' 
  | 'sadad' 
  | 'check' 
  | 'cash' 
  | 'pos_card';

export interface QualityInspection {
  temperatureCompliant: boolean;
  packagingIntact: boolean;
  expiryDateValid: boolean;
  sensoryInspectionPassed: boolean;
  inspectorName: string;
  measuredTemperature?: number; // e.g. 3.5 °C
  inspectionNotes?: string;
  inspectedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  inventoryItemId: string;
  inventoryItemNameAr: string;
  inventoryItemNameEn: string;
  sku: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRejected: number;
  unitPriceContracted: number;
  unitPriceInvoiced?: number;
  taxRate: number; // e.g. 0.15
  subtotal: number;
  taxAmount: number;
  total: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO-2026-0814"
  supplierId: string;
  supplierNameAr: string;
  supplierNameEn: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  issueDate: string;
  expectedDeliveryDate: string;
  approvedAt?: string;
  approvedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  qualityInspection?: QualityInspection;
  notes?: string;
  paymentTerms: PaymentTerm;
  deliveryLocation: string;
  grnNumber?: string;
  invoiceNumber?: string;
  matchingReport?: ThreeWayMatchReport;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  receivedBy: string;
  items: {
    inventoryItemId: string;
    itemNameAr: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
    unitPrice: number;
    batchNumber?: string;
    expiryDate?: string;
    rejectionReason?: string;
  }[];
  qualityInspection: QualityInspection;
  notes?: string;
  createdAt: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  poId?: string;
  poNumber?: string;
  grnId?: string;
  grnNumber?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'verified' | 'matched' | 'posted' | 'disputed' | 'paid';
  items: {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }[];
  zatcaQrPayload?: string;
  isPaperlessVerified: boolean;
  pdfUrl?: string;
  createdAt: string;
}

export interface ThreeWayMatchDiscrepancy {
  type: MatchingDiscrepancyType;
  inventoryItemId: string;
  itemName: string;
  poValue: number | string;
  grnValue: number | string;
  invoiceValue: number | string;
  varianceAmount: number;
  variancePercentage: number;
  description: string;
  isAcceptable: boolean;
}

export interface ThreeWayMatchReport {
  id: string;
  poId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  status: MatchingStatus;
  matchedAt: string;
  performedBy: string;
  poTotal: number;
  grnEstimatedTotal: number;
  invoiceTotal: number;
  totalVariance: number;
  tolerancePercentage: number;
  discrepancies: ThreeWayMatchDiscrepancy[];
  verdictSummary: string;
  isReadyForPayment: boolean;
}

export interface SupplierProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  commercialRegister: string;
  taxNumber: string;
  address: string;
  city: string;
  paymentTerms: PaymentTerm;
  creditLimit: number;
  currentBalance: number;
  totalPurchasesYTD: number;
  leadTimeDays: number;
  onTimeDeliveryRate: number; // Percentage, e.g. 98.5
  qualityScore: number; // 1-5
  rating: number; // 1-5
  status: 'active' | 'under_review' | 'blocked';
  bankDetails?: {
    bankName: string;
    iban: string;
    accountNumber: string;
    swiftCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPaymentRecord {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: ProcurementPaymentMethod;
  referenceNumber: string;
  appliedInvoices: {
    invoiceId: string;
    invoiceNumber: string;
    amountApplied: number;
  }[];
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export interface StatementTransaction {
  id: string;
  date: string;
  type: 'purchase_order' | 'invoice' | 'payment' | 'credit_note' | 'debit_adjustment';
  referenceNumber: string;
  description: string;
  debit: number; // Increases debt (invoices)
  credit: number; // Decreases debt (payments)
  runningBalance: number;
}

export interface SupplierStatementOfAccount {
  supplierId: string;
  supplierNameAr: string;
  supplierNameEn: string;
  statementDate: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  creditLimit: number;
  availableCredit: number;
  transactions: StatementTransaction[];
}

export interface PayableAgingBucket {
  current: number; // 0-30 days
  days31to60: number;
  days61to90: number;
  over90: number;
  totalOutstanding: number;
  suppliersBreakdown: {
    supplierId: string;
    supplierName: string;
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
  }[];
}

export interface AutoReorderSuggestionItem {
  inventoryItemId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  maxStock: number;
  suggestedReorderQuantity: number;
  unit: string;
  unitCost: number;
  estimatedTotal: number;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface AutoReorderSupplierGroup {
  supplierId: string;
  supplierNameAr: string;
  supplierNameEn: string;
  leadTimeDays: number;
  paymentTerms: PaymentTerm;
  items: AutoReorderSuggestionItem[];
  totalEstimatedCost: number;
  itemCount: number;
}

export interface ProcurementMetrics {
  totalMonthlySpend: number;
  totalOutstandingDebt: number;
  activePurchaseOrdersCount: number;
  threeWayMatchSuccessRate: number;
  lowStockItemsCount: number;
  pendingGoodsReceiptCount: number;
  averageDeliveryLeadTimeDays: number;
  supplierCount: number;
}
