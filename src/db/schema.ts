/**
 * =====================================================================
 * RESTAURANT OS — UNIFIED HIGH-PERFORMANCE DATABASE SCHEMA
 * =====================================================================
 * Covers 35 Core Business Entities:
 * 1. MenuCategories, MenuItems, ModifierGroups, ModifierOptions, ItemModifierLinks
 * 2. DiningTables, TableSections
 * 3. Orders, OrderItems, PaymentTransactions
 * 4. InventoryItems, Recipes, RecipeIngredients, Suppliers, PurchaseInvoices, PurchaseInvoiceItems
 * 5. StockMovements, StockCounts, StockCountItems, WasteLogs
 * 6. Employees, Shifts, Attendance, Payroll, EmployeeLoans, Checklists
 * 7. Customers, LoyaltyTransactions, Coupons
 * 8. CashDrawers, ZReports, TaxLogs, AuditLogs, Settings, SyncQueue
 */

// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'drive_thru';
export type OrderStatus = 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'loyalty_points' | 'split' | 'online' | 'gift_card';
export type KitchenStation = 'grill' | 'fryer' | 'salad_cold' | 'beverages' | 'bakery' | 'main_kitchen' | 'dessert';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning' | 'out_of_service';
export type TableShape = 'round' | 'square' | 'rectangle';
export type InventoryUnit = 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'can' | 'box' | 'bag';
export type MovementType = 
  | 'purchase' 
  | 'sale_consumption' 
  | 'waste' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'manual_adjustment' 
  | 'count_reconciliation';
export type EmployeeRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'chef' | 'bartender' | 'driver' | 'cleaner';
export type ShiftStatus = 'open' | 'closed' | 'suspended';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'half_day';
export type AttendanceMethod = 'pin' | 'nfc' | 'face_ai' | 'manual' | 'qr';
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'vip' | 'platinum';
export type LoyaltyTxType = 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
export type CouponDiscountType = 'percentage' | 'fixed';
export type WasteReason = 'expired' | 'prep_mistake' | 'dropped' | 'spoilage' | 'overcooking' | 'customer_return';
export type SyncOperation = 'insert' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'in_flight' | 'synced' | 'failed' | 'conflict';
export type ZatcaStatus = 'compliant' | 'pending' | 'error' | 'not_applicable';
export type BCGMatrixCategory = 'star' | 'cash_cow' | 'question_mark' | 'dog';

// ==========================================
// 2. CORE INTERFACES & SCHEMAS
// ==========================================

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

// 1. Menu Category
export interface MenuCategory extends BaseEntity {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
  printerTarget?: KitchenStation | 'all';
}

// 2. Menu Item
export interface MenuItem extends BaseEntity {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  costPrice: number;
  taxRate: number; // e.g. 0.15 for 15% VAT
  barcode?: string;
  sku?: string;
  image?: string;
  calories?: number;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  allergens: string[];
  kitchenStation: KitchenStation;
  sortOrder: number;
  soldCount: number;
  bcgCategory?: BCGMatrixCategory;
  minimumAge?: number;
}

// 3. Modifier Group
export interface ModifierGroup extends BaseEntity {
  nameAr: string;
  nameEn: string;
  minSelection: number; // 0 for optional, 1+ for required
  maxSelection: number; // 1 for single choice, 2+ for multi
  isRequired: boolean;
  allowMultipleQuantity: boolean;
}

// 4. Modifier Option
export interface ModifierOption extends BaseEntity {
  groupId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  costPrice: number;
  isDefault: boolean;
  isAvailable: boolean;
  calorieDelta?: number;
  sortOrder: number;
}

// 5. Item Modifier Link (Many-to-Many linking MenuItems to ModifierGroups)
export interface ItemModifierLink extends BaseEntity {
  menuItemId: string;
  modifierGroupId: string;
  sortOrder: number;
}

// 6. Dining Table
export interface DiningTable extends BaseEntity {
  tableNumber: string;
  sectionId: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  currentOrderId?: string;
  posX: number; // 2D floorplan coordinate X
  posY: number; // 2D floorplan coordinate Y
  width?: number;
  height?: number;
  qrCodeToken: string;
  assignedWaiterId?: string;
  minSpend?: number;
  lastOccupiedAt?: string;
}

// 7. Table Section
export interface TableSection extends BaseEntity {
  nameAr: string;
  nameEn: string;
  floor: number;
  isActive: boolean;
  color?: string;
  sortOrder: number;
}

// 8. Order
export interface Order extends BaseEntity {
  orderNumber: string; // e.g. ORD-20260814-001
  dailySequence: number;
  orderType: OrderType;
  tableId?: string;
  customerId?: string;
  waiterId?: string;
  cashierId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType?: 'percentage' | 'fixed' | 'coupon' | 'manual';
  discountReason?: string;
  serviceCharge: number;
  tipAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  
  paymentMethod?: PaymentMethod;
  guestCount: number;
  customerNotes?: string;
  kitchenNotes?: string;
  cancellationReason?: string;
  
  zatcaQrCode?: string;
  zatcaInvoiceHash?: string;
  syncStatus: SyncStatus;
  closedAt?: string;
}

// 9. Order Item
export interface SelectedModifier {
  optionId: string;
  groupId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  menuItemId: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  selectedModifiers: SelectedModifier[];
  notes?: string;
  kitchenStation: KitchenStation;
  status: OrderItemStatus;
  voidReason?: string;
  voidByEmployeeId?: string;
  
  printedToKitchen: boolean;
  firedAt?: string;
  cookingStartedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

// 10. Payment Transaction
export interface PaymentTransaction extends BaseEntity {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  cardLastFour?: string;
  cardNetwork?: string;
  authCode?: string;
  cashierId: string;
  status: 'successful' | 'declined' | 'refunded' | 'voided';
  notes?: string;
}

// 11. Inventory Item
export interface InventoryItem extends BaseEntity {
  code: string; // e.g. RAW-BEEF-01
  nameAr: string;
  nameEn: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minStockAlert: number;
  maxStock: number;
  reorderQuantity: number;
  averageCost: number;
  lastPurchasePrice: number;
  defaultSupplierId?: string;
  storageLocation?: string;
  expiryTracking: boolean;
  shelfLifeDays?: number;
  yieldRatio: number; // e.g. 0.90 for 90% usable
  isActive: boolean;
}

// 12. Recipe
export interface Recipe extends BaseEntity {
  menuItemId: string;
  portionYield: number; // How many plates per batch
  preparationMethodAr?: string;
  preparationMethodEn?: string;
  laborCostEstimate: number;
  isActive: boolean;
  notes?: string;
}

// 13. Recipe Ingredient
export interface RecipeIngredient extends BaseEntity {
  recipeId: string;
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnit;
  wastePercentage: number;
  costContribution: number;
}

// 14. Supplier
export interface Supplier extends BaseEntity {
  nameAr: string;
  nameEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxNumber?: string;
  commercialRecord?: string;
  address: string;
  paymentTerms: string; // e.g. 'Cash', 'Net 30'
  rating: number; // 1 to 5
  balance: number; // Outstanding debt to supplier
  isActive: boolean;
}

// 15. Purchase Invoice
export interface PurchaseInvoice extends BaseEntity {
  invoiceNumber: string;
  supplierId: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  ocrExtractedData?: Record<string, any>;
  scannedImageUrl?: string;
  status: 'draft' | 'verified' | 'posted' | 'cancelled';
  createdBy: string;
  notes?: string;
}

// 16. Purchase Invoice Item
export interface PurchaseInvoiceItem extends BaseEntity {
  invoiceId: string;
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnit;
  unitPrice: number;
  taxRate: number;
  total: number;
  expiryDate?: string;
  batchNumber?: string;
}

// 17. Stock Movement
export interface StockMovement extends BaseEntity {
  inventoryItemId: string;
  type: MovementType;
  quantity: number; // Positive or negative
  unitPrice: number;
  previousStock: number;
  newStock: number;
  referenceId?: string; // orderId, invoiceId, stockCountId, wasteLogId
  referenceType?: 'order' | 'purchase' | 'waste' | 'reconciliation' | 'manual';
  reason?: string;
  notes?: string;
  employeeId: string;
}

// 18. Stock Count (Periodic physical inventory)
export interface StockCount extends BaseEntity {
  countNumber: string;
  countDate: string;
  countedBy: string;
  approvedBy?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  totalVarianceCost: number;
  notes?: string;
}

// 19. Stock Count Item
export interface StockCountItem extends BaseEntity {
  stockCountId: string;
  inventoryItemId: string;
  systemStock: number;
  physicalStock: number;
  variance: number;
  unitCost: number;
  varianceCost: number;
  notes?: string;
}

// 20. Waste Log
export interface WasteLog extends BaseEntity {
  inventoryItemId?: string;
  menuItemId?: string;
  quantity: number;
  unit: InventoryUnit;
  costAmount: number;
  reason: WasteReason;
  reportedBy: string;
  photoUrl?: string;
  aiSuggestedAction?: string;
  notes?: string;
}

// 21. Employee
export interface Employee extends BaseEntity {
  employeeCode: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  pinCodeHash: string; // Hash of 4-digit PIN
  phone: string;
  email?: string;
  nationalId?: string;
  hourlyRate: number;
  monthlySalary: number;
  employmentType: 'full_time' | 'part_time' | 'contract';
  isActive: boolean;
  permissions: string[];
  hireDate: string;
  avatar?: string;
}

// 22. Shift
export interface Shift extends BaseEntity {
  shiftNumber: string;
  employeeId: string;
  role: EmployeeRole;
  startedAt: string;
  endedAt?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalCashSales: number;
  totalCardSales: number;
  totalDiscounts: number;
  totalRefunds: number;
  orderCount: number;
  guestCount: number;
  status: ShiftStatus;
  notes?: string;
  zReportId?: string;
}

// 23. Attendance
export interface Attendance extends BaseEntity {
  employeeId: string;
  shiftId?: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO
  checkOut?: string; // ISO
  workDurationMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  status: AttendanceStatus;
  method: AttendanceMethod;
  notes?: string;
}

// 24. Payroll
export interface Payroll extends BaseEntity {
  employeeId: string;
  month: number; // 1-12
  year: number; // e.g. 2026
  baseSalary: number;
  bonus: number;
  deductions: number;
  advances: number;
  overtimePay: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

// 25. Employee Loan / Advance
export interface EmployeeLoan extends BaseEntity {
  employeeId: string;
  requestDate: string;
  amount: number;
  monthlyInstallment: number;
  remainingBalance: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  approvedBy?: string;
  notes?: string;
}

// 26. Checklist
export interface ChecklistItem {
  id: string;
  textAr: string;
  textEn: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface Checklist extends BaseEntity {
  titleAr: string;
  titleEn: string;
  department: 'kitchen' | 'service' | 'bar' | 'cleaning' | 'management';
  frequency: 'shift_start' | 'shift_end' | 'daily' | 'weekly';
  items: ChecklistItem[];
  shiftId?: string;
  date: string;
  isFullyCompleted: boolean;
  assignedRole?: EmployeeRole;
}

// 27. Customer
export interface Customer extends BaseEntity {
  customerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  deliveryZone?: string;
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  tier: CustomerTier;
  birthDate?: string;
  notes?: string;
  favoriteItems?: string[];
  isBlacklisted: boolean;
  lastOrderAt?: string;
}

// 28. Loyalty Transaction
export interface LoyaltyTransaction extends BaseEntity {
  customerId: string;
  type: LoyaltyTxType;
  points: number; // positive for earned, negative for redeemed
  balanceAfter: number;
  orderId?: string;
  reason?: string;
  expiresAt?: string;
}

// 29. Coupon
export interface Coupon extends BaseEntity {
  code: string;
  descriptionAr: string;
  descriptionEn: string;
  discountType: CouponDiscountType;
  discountValue: number; // Percentage or fixed currency
  minOrderValue: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  currentUsageCount: number;
  isActive: boolean;
}

// 30. Cash Drawer
export interface CashDrawer extends BaseEntity {
  shiftId: string;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  currentCash: number;
  expectedCash: number;
  closedCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
}

// 31. Z-Report
export interface ZReport extends BaseEntity {
  reportNumber: string; // e.g. Z-20260814-001
  shiftId: string;
  date: string;
  zCounter: number;
  grossSales: number;
  netSales: number;
  totalTax: number;
  totalDiscounts: number;
  totalVoids: number;
  totalRefunds: number;
  cashTotal: number;
  cardTotal: number;
  otherPayments: number;
  openOrdersCount: number;
  closedOrdersCount: number;
  cashierId: string;
  generatedAt: string;
  zatcaHash?: string;
  summaryData: Record<string, any>;
}

// 32. Tax Log
export interface TaxLog extends BaseEntity {
  orderId: string;
  invoiceNumber: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  zatcaQrCode: string;
  zatcaHash: string;
  zatcaStatus: ZatcaStatus;
  reportedAt: string;
  errorMessage?: string;
}

// 33. Audit Log
export interface AuditLog extends BaseEntity {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// 34. Settings
export interface SettingRecord extends BaseEntity {
  key: string;
  value: any;
  group: 'restaurant' | 'pos' | 'tax' | 'printer' | 'ai' | 'cloud' | 'sync' | 'security';
  description?: string;
}

// 35. Sync Queue (Offline-First Sync Pipeline)
export interface SyncQueueItem extends BaseEntity {
  entityName: string;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, any>;
  retryCount: number;
  lastAttemptAt?: string;
  status: SyncStatus;
  errorMessage?: string;
}

// ==========================================
// 3. COMPLETE DATABASE SCHEMA COLLECTION MAP
// ==========================================

export interface DatabaseSchema {
  categories: MenuCategory;
  menuItems: MenuItem;
  modifierGroups: ModifierGroup;
  modifierOptions: ModifierOption;
  itemModifierLinks: ItemModifierLink;
  tables: DiningTable;
  sections: TableSection;
  orders: Order;
  orderItems: OrderItem;
  paymentTransactions: PaymentTransaction;
  inventoryItems: InventoryItem;
  recipes: Recipe;
  recipeIngredients: RecipeIngredient;
  suppliers: Supplier;
  purchaseInvoices: PurchaseInvoice;
  purchaseInvoiceItems: PurchaseInvoiceItem;
  stockMovements: StockMovement;
  stockCounts: StockCount;
  stockCountItems: StockCountItem;
  wasteLogs: WasteLog;
  employees: Employee;
  shifts: Shift;
  attendance: Attendance;
  payroll: Payroll;
  employeeLoans: EmployeeLoan;
  checklists: Checklist;
  customers: Customer;
  loyaltyTransactions: LoyaltyTransaction;
  coupons: Coupon;
  cashDrawers: CashDrawer;
  zReports: ZReport;
  taxLogs: TaxLog;
  auditLogs: AuditLog;
  settings: SettingRecord;
  syncQueue: SyncQueueItem;
}

export type TableName = keyof DatabaseSchema;

export const ALL_TABLE_NAMES: TableName[] = [
  'categories',
  'menuItems',
  'modifierGroups',
  'modifierOptions',
  'itemModifierLinks',
  'tables',
  'sections',
  'orders',
  'orderItems',
  'paymentTransactions',
  'inventoryItems',
  'recipes',
  'recipeIngredients',
  'suppliers',
  'purchaseInvoices',
  'purchaseInvoiceItems',
  'stockMovements',
  'stockCounts',
  'stockCountItems',
  'wasteLogs',
  'employees',
  'shifts',
  'attendance',
  'payroll',
  'employeeLoans',
  'checklists',
  'customers',
  'loyaltyTransactions',
  'coupons',
  'cashDrawers',
  'zReports',
  'taxLogs',
  'auditLogs',
  'settings',
  'syncQueue',
];
