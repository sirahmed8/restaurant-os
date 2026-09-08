/**
 * =====================================================================
 * RESTAURANT OS — DIGITAL PROCUREMENT & SUPPLIER MANAGEMENT SERVICE
 * =====================================================================
 * Enterprise Supplier Directory, PO Lifecycle, 3-Way Matching Engine,
 * Automated Inventory WAC Costing, Payables Aging & Paperless Invoicing.
 */

import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  GoodsReceivedNote,
  SupplierInvoice,
  ThreeWayMatchReport,
  ThreeWayMatchDiscrepancy,
  MatchingStatus,
  SupplierProfile,
  SupplierPaymentRecord,
  SupplierStatementOfAccount,
  StatementTransaction,
  PayableAgingBucket,
  AutoReorderSupplierGroup,
  AutoReorderSuggestionItem,
  ProcurementMetrics,
  QualityInspection,
  PaymentTerm,
  ProcurementPaymentMethod,
} from '../types/procurement';
import { eventBus } from './eventBus';
import { db } from '../db';

// Default VAT in Saudi Arabia / GCC standard
const DEFAULT_VAT_RATE = 0.15;

export class ProcurementService {
  private suppliers: Map<string, SupplierProfile> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private grns: Map<string, GoodsReceivedNote> = new Map();
  private invoices: Map<string, SupplierInvoice> = new Map();
  private paymentRecords: Map<string, SupplierPaymentRecord> = new Map();
  private isInitialized = false;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Seed comprehensive Saudi & GCC supplier ecosystem and initial active workflow
   */
  public seedInitialData(): void {
    if (this.isInitialized) return;

    const initialSuppliers: SupplierProfile[] = [
      {
        id: 'sup-almarai',
        nameAr: 'شركة المراعي للمنتجات الغذائية والألبان',
        nameEn: 'Almarai Food & Dairy Industries Co.',
        category: 'الألبان والأجبان والمخبوزات',
        categoryEn: 'Dairy, Cheese & Bakery',
        contactPerson: 'عبد العزيز الشمري',
        phone: '+966114700000',
        email: 'orders.riyadh@almarai.com',
        commercialRegister: '1010084223',
        taxNumber: '300012345600003',
        address: 'الرياض - طريق الخرج - مجمع المراعي الرئيسي',
        city: 'الرياض',
        paymentTerms: 'net_30',
        creditLimit: 50000,
        currentBalance: 12450.0,
        totalPurchasesYTD: 185000.0,
        leadTimeDays: 1,
        onTimeDeliveryRate: 99.2,
        qualityScore: 4.9,
        rating: 5,
        status: 'active',
        bankDetails: {
          bankName: 'مصرف الراجحي',
          iban: 'SA4480000456608010123456',
          accountNumber: '456608010123456',
          swiftCode: 'RJHISARI',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
      {
        id: 'sup-fresh-meat',
        nameAr: 'شركة المروج لتوريد اللحوم والمواشي البلدية',
        nameEn: 'Al-Morooj Prime Livestock & Fresh Meats Co.',
        category: 'اللحوم والدواجن الطازجة',
        categoryEn: 'Fresh Meats & Livestock',
        contactPerson: 'الشيخ عبد الله الدوسري',
        phone: '+966501234567',
        email: 'supply@almoroojmeats.sa',
        commercialRegister: '1010198744',
        taxNumber: '300123456700003',
        address: 'الرياض - حي الملز - شارع الظهران',
        city: 'الرياض',
        paymentTerms: 'net_15',
        creditLimit: 75000,
        currentBalance: 28600.0,
        totalPurchasesYTD: 340000.0,
        leadTimeDays: 2,
        onTimeDeliveryRate: 97.8,
        qualityScore: 4.95,
        rating: 5,
        status: 'active',
        bankDetails: {
          bankName: 'البنك الأهلي السعودي (SNB)',
          iban: 'SA0310000002019876543210',
          accountNumber: '2019876543210',
          swiftCode: 'NCBKSAJI',
        },
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
      {
        id: 'sup-qassim-veg',
        nameAr: 'مؤسسة خيرات القصيم للخضار والفواكه الطازجة',
        nameEn: 'Qassim Fresh Produce & Agricultural Est.',
        category: 'الخضروات والفواكه والمحاصيل',
        categoryEn: 'Vegetables & Fruits',
        contactPerson: 'فهد التميمي',
        phone: '+966559876543',
        email: 'supply@qassimfresh.sa',
        commercialRegister: '1131054231',
        taxNumber: '300987654300003',
        address: 'القصيم - بريدة - سوق الخضار المركزي',
        city: 'بريدة',
        paymentTerms: 'cash_on_delivery',
        creditLimit: 20000,
        currentBalance: 3200.0,
        totalPurchasesYTD: 95000.0,
        leadTimeDays: 1,
        onTimeDeliveryRate: 96.5,
        qualityScore: 4.8,
        rating: 5,
        status: 'active',
        bankDetails: {
          bankName: 'بنك الرياض',
          iban: 'SA2220000001098765432199',
          accountNumber: '1098765432199',
        },
        createdAt: '2026-01-10T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
      {
        id: 'sup-halwani',
        nameAr: 'شركة حلواني إخوان للصناعات الغذائية',
        nameEn: 'Halwani Bros Gourmet & Processed Foods Co.',
        category: 'المعلبات والصلصات والتوابل واللحوم المصنعة',
        categoryEn: 'Condiments, Sauces & Preserved Goods',
        contactPerson: 'عمرو حلواني',
        phone: '+966126366666',
        email: 'foodservice@halwani.com',
        commercialRegister: '4030018544',
        taxNumber: '300045678900003',
        address: 'جدة - المدينة الصناعية الأولى',
        city: 'جدة',
        paymentTerms: 'net_30',
        creditLimit: 40000,
        currentBalance: 8750.0,
        totalPurchasesYTD: 110000.0,
        leadTimeDays: 3,
        onTimeDeliveryRate: 98.0,
        qualityScore: 4.7,
        rating: 4,
        status: 'active',
        bankDetails: {
          bankName: 'بنك البلاد',
          iban: 'SA1515000003012345678911',
          accountNumber: '3012345678911',
        },
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
      {
        id: 'sup-alwatania',
        nameAr: 'شركة دواجن الوطنية',
        nameEn: 'Al-Watania Poultry Co.',
        category: 'الدواجن والبيض والمنتجات الطازجة',
        categoryEn: 'Poultry & Eggs',
        contactPerson: 'سليمان الراجحي',
        phone: '+966114777777',
        email: 'b2b@alwatania.com.sa',
        commercialRegister: '1010041239',
        taxNumber: '300067891000003',
        address: 'القصيم - عيون الجواء',
        city: 'بريدة',
        paymentTerms: 'net_15',
        creditLimit: 60000,
        currentBalance: 15400.0,
        totalPurchasesYTD: 220000.0,
        leadTimeDays: 1,
        onTimeDeliveryRate: 99.0,
        qualityScore: 4.85,
        rating: 5,
        status: 'active',
        createdAt: '2026-02-05T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
      {
        id: 'sup-euro-gourmet',
        nameAr: 'شركة الأجبان والألبان الأوروبية الفاخرة',
        nameEn: 'Euro Gourmet Imports Ltd.',
        category: 'المكونات المستوردة وزيت الكمأة والبوراتا',
        categoryEn: 'Specialty & Imported Ingredients',
        contactPerson: 'مارتن لوران',
        phone: '+966542233445',
        email: 'imports@eurodairy.com',
        commercialRegister: '4030287654',
        taxNumber: '300765432100003',
        address: 'جدة - حي الأندلس - طريق الملك عبد العزيز',
        city: 'جدة',
        paymentTerms: 'net_30',
        creditLimit: 35000,
        currentBalance: 0.0,
        totalPurchasesYTD: 145000.0,
        leadTimeDays: 4,
        onTimeDeliveryRate: 95.0,
        qualityScore: 4.9,
        rating: 5,
        status: 'active',
        createdAt: '2026-02-10T00:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z',
      },
    ];

    initialSuppliers.forEach((s) => this.suppliers.set(s.id, s));

    // Seed realistic initial Purchase Orders
    const initialOrders: PurchaseOrder[] = [
      {
        id: 'po-2026-0801',
        poNumber: 'PO-2026-0801',
        supplierId: 'sup-almarai',
        supplierNameAr: 'شركة المراعي للمنتجات الغذائية والألبان',
        supplierNameEn: 'Almarai Food & Dairy Industries Co.',
        status: 'received',
        items: [
          {
            id: 'poi-101',
            inventoryItemId: 'raw-dairy-burrata',
            inventoryItemNameAr: 'حليب كامل الدسم مبستر (كرتون 12 لتر)',
            inventoryItemNameEn: 'Fresh Whole Milk (12L Box)',
            sku: 'DAIRY-MILK-12L',
            unit: 'box',
            quantityOrdered: 20,
            quantityReceived: 20,
            quantityRejected: 0,
            unitPriceContracted: 48.0,
            unitPriceInvoiced: 48.0,
            taxRate: 0.15,
            subtotal: 960.0,
            taxAmount: 144.0,
            total: 1104.0,
            expiryDate: '2026-08-28',
            batchNumber: 'ALM-B-9912',
          },
          {
            id: 'poi-102',
            inventoryItemId: 'raw-akkawi-cheese',
            inventoryItemNameAr: 'جبن موزاريلا طبيعي مبشور (كيس 2 كغ)',
            inventoryItemNameEn: 'Shredded Mozzarella Cheese (2kg)',
            sku: 'DAIRY-MOZZ-2KG',
            unit: 'kg',
            quantityOrdered: 30,
            quantityReceived: 30,
            quantityRejected: 0,
            unitPriceContracted: 35.0,
            unitPriceInvoiced: 35.0,
            taxRate: 0.15,
            subtotal: 1050.0,
            taxAmount: 157.5,
            total: 1207.5,
            expiryDate: '2026-10-15',
            batchNumber: 'ALM-MOZ-441',
          },
        ],
        subtotal: 2010.0,
        taxAmount: 301.5,
        discountAmount: 0,
        totalAmount: 2311.5,
        paidAmount: 0,
        issueDate: '2026-08-14T08:30:00.000Z',
        expectedDeliveryDate: '2026-08-15T10:00:00.000Z',
        approvedAt: '2026-08-14T09:00:00.000Z',
        approvedBy: 'مدير العمليات - طارق المنصور',
        dispatchedAt: '2026-08-14T14:00:00.000Z',
        receivedAt: '2026-08-15T09:45:00.000Z',
        receivedBy: 'مسؤول الاستلام - سلطان العتيبي',
        grnNumber: 'GRN-2026-0801',
        invoiceNumber: 'INV-ALM-2026-8812',
        qualityInspection: {
          temperatureCompliant: true,
          measuredTemperature: 3.2,
          packagingIntact: true,
          expiryDateValid: true,
          sensoryInspectionPassed: true,
          inspectorName: 'سلطان العتيبي',
          inspectedAt: '2026-08-15T09:45:00.000Z',
          inspectionNotes: 'الحرارة ممتازة ومطابقة لسلسلة التبريد (3.2°C). الصلاحية حديثة الإنتاج.',
        },
        paymentTerms: 'net_30',
        deliveryLocation: 'فرع السليمانية - مستودع التبريد',
        createdAt: '2026-08-14T08:30:00.000Z',
        updatedAt: '2026-08-15T10:00:00.000Z',
      },
      {
        id: 'po-2026-0802',
        poNumber: 'PO-2026-0802',
        supplierId: 'sup-fresh-meat',
        supplierNameAr: 'شركة المروج لتوريد اللحوم والمواشي البلدية',
        supplierNameEn: 'Al-Morooj Prime Livestock & Fresh Meats Co.',
        status: 'dispatched',
        items: [
          {
            id: 'poi-201',
            inventoryItemId: 'raw-local-lamb',
            inventoryItemNameAr: 'لحم غنم نعيمي بلدي طازج بالعظم',
            inventoryItemNameEn: 'Fresh Local Naeemi Lamb on Bone',
            sku: 'RAW-LAMB-LOCAL',
            unit: 'kg',
            quantityOrdered: 40,
            quantityReceived: 0,
            quantityRejected: 0,
            unitPriceContracted: 65.0,
            unitPriceInvoiced: 65.0,
            taxRate: 0.15,
            subtotal: 2600.0,
            taxAmount: 390.0,
            total: 2990.0,
          },
          {
            id: 'poi-202',
            inventoryItemId: 'raw-wagyu-beef',
            inventoryItemNameAr: 'لحم واغيو ياباني A5 مبرد',
            inventoryItemNameEn: 'Chilled Japanese A5 Wagyu Ribeye',
            sku: 'RAW-BEEF-WAGYU',
            unit: 'kg',
            quantityOrdered: 15,
            quantityReceived: 0,
            quantityRejected: 0,
            unitPriceContracted: 380.0,
            unitPriceInvoiced: 380.0,
            taxRate: 0.15,
            subtotal: 5700.0,
            taxAmount: 855.0,
            total: 6555.0,
          },
        ],
        subtotal: 8300.0,
        taxAmount: 1245.0,
        discountAmount: 0,
        totalAmount: 9545.0,
        paidAmount: 0,
        issueDate: '2026-08-15T11:00:00.000Z',
        expectedDeliveryDate: '2026-08-16T16:00:00.000Z',
        approvedAt: '2026-08-15T11:30:00.000Z',
        approvedBy: 'مدير المشتريات - سارة العنزي',
        dispatchedAt: '2026-08-16T08:00:00.000Z',
        paymentTerms: 'net_15',
        deliveryLocation: 'فرع السليمانية - مبرد اللحوم الفاخرة #1',
        createdAt: '2026-08-15T11:00:00.000Z',
        updatedAt: '2026-08-16T08:00:00.000Z',
      },
      {
        id: 'po-2026-0803',
        poNumber: 'PO-2026-0803',
        supplierId: 'sup-qassim-veg',
        supplierNameAr: 'مؤسسة خيرات القصيم للخضار والفواكه الطازجة',
        supplierNameEn: 'Qassim Fresh Produce & Agricultural Est.',
        status: 'approved',
        items: [
          {
            id: 'poi-301',
            inventoryItemId: 'raw-fresh-produce-tomato',
            inventoryItemNameAr: 'طماطم محمية قطاف اليوم (صندوق 10 كغ)',
            inventoryItemNameEn: 'Fresh Greenhouse Tomatoes (10kg Box)',
            sku: 'VEG-TOMATO-10K',
            unit: 'box',
            quantityOrdered: 15,
            quantityReceived: 0,
            quantityRejected: 0,
            unitPriceContracted: 24.0,
            unitPriceInvoiced: 24.0,
            taxRate: 0.15,
            subtotal: 360.0,
            taxAmount: 54.0,
            total: 414.0,
          },
          {
            id: 'poi-302',
            inventoryItemId: 'raw-fresh-produce-onion',
            inventoryItemNameAr: 'بصل أصفر قصيمي ممتاز (كيس 15 كغ)',
            inventoryItemNameEn: 'Qassimi Yellow Onions (15kg Bag)',
            sku: 'VEG-ONION-15K',
            unit: 'bag',
            quantityOrdered: 10,
            quantityReceived: 0,
            quantityRejected: 0,
            unitPriceContracted: 28.0,
            unitPriceInvoiced: 28.0,
            taxRate: 0.15,
            subtotal: 280.0,
            taxAmount: 42.0,
            total: 322.0,
          },
        ],
        subtotal: 640.0,
        taxAmount: 96.0,
        discountAmount: 0,
        totalAmount: 736.0,
        paidAmount: 0,
        issueDate: '2026-08-16T09:00:00.000Z',
        expectedDeliveryDate: '2026-08-17T06:00:00.000Z',
        approvedAt: '2026-08-16T09:15:00.000Z',
        approvedBy: 'مدير العمليات - طارق المنصور',
        paymentTerms: 'cash_on_delivery',
        deliveryLocation: 'فرع السليمانية - المطبخ المركزي',
        createdAt: '2026-08-16T09:00:00.000Z',
        updatedAt: '2026-08-16T09:15:00.000Z',
      },
      {
        id: 'po-2026-0804',
        poNumber: 'PO-2026-0804',
        supplierId: 'sup-halwani',
        supplierNameAr: 'شركة حلواني إخوان للصناعات الغذائية',
        supplierNameEn: 'Halwani Bros Gourmet & Processed Foods Co.',
        status: 'draft',
        items: [
          {
            id: 'poi-401',
            inventoryItemId: 'raw-sauce-tahini',
            inventoryItemNameAr: 'طحينة سمسم فاخرة النخلة (سطل 5 كغ)',
            inventoryItemNameEn: 'Al-Nakhlah Pure Sesame Tahina (5kg)',
            sku: 'SAUCE-TAHINI-5K',
            unit: 'box',
            quantityOrdered: 8,
            quantityReceived: 0,
            quantityRejected: 0,
            unitPriceContracted: 85.0,
            unitPriceInvoiced: 85.0,
            taxRate: 0.15,
            subtotal: 680.0,
            taxAmount: 102.0,
            total: 782.0,
          },
        ],
        subtotal: 680.0,
        taxAmount: 102.0,
        discountAmount: 0,
        totalAmount: 782.0,
        paidAmount: 0,
        issueDate: '2026-08-16T11:00:00.000Z',
        expectedDeliveryDate: '2026-08-19T12:00:00.000Z',
        paymentTerms: 'net_30',
        deliveryLocation: 'فرع السليمانية - المستودع الجاف',
        createdAt: '2026-08-16T11:00:00.000Z',
        updatedAt: '2026-08-16T11:00:00.000Z',
      },
      {
        id: 'po-2026-0805',
        poNumber: 'PO-2026-0805',
        supplierId: 'sup-euro-gourmet',
        supplierNameAr: 'شركة الأجبان والألبان الأوروبية الفاخرة',
        supplierNameEn: 'Euro Gourmet Imports Ltd.',
        status: 'paid',
        items: [
          {
            id: 'poi-501',
            inventoryItemId: 'raw-burrata-cheese',
            inventoryItemNameAr: 'جبن بوراتا إيطالي طازج (كرات 125غ)',
            inventoryItemNameEn: 'Fresh Italian Burrata Cheese (125g)',
            sku: 'RAW-DAIRY-BURRATA',
            unit: 'piece',
            quantityOrdered: 40,
            quantityReceived: 40,
            quantityRejected: 0,
            unitPriceContracted: 12.0,
            unitPriceInvoiced: 12.0,
            taxRate: 0.15,
            subtotal: 480.0,
            taxAmount: 72.0,
            total: 552.0,
          },
          {
            id: 'poi-502',
            inventoryItemId: 'raw-truffle-oil',
            inventoryItemNameAr: 'زيت الكمأة السوداء الإيطالي الأصيل',
            inventoryItemNameEn: 'Authentic Italian Black Truffle Oil',
            sku: 'RAW-OIL-TRUFFLE',
            unit: 'liter',
            quantityOrdered: 5,
            quantityReceived: 5,
            quantityRejected: 0,
            unitPriceContracted: 185.0,
            unitPriceInvoiced: 185.0,
            taxRate: 0.15,
            subtotal: 925.0,
            taxAmount: 138.75,
            total: 1063.75,
          },
        ],
        subtotal: 1405.0,
        taxAmount: 210.75,
        discountAmount: 0,
        totalAmount: 1615.75,
        paidAmount: 1615.75,
        issueDate: '2026-08-10T08:00:00.000Z',
        expectedDeliveryDate: '2026-08-13T10:00:00.000Z',
        approvedAt: '2026-08-10T08:30:00.000Z',
        approvedBy: 'سارة العنزي',
        dispatchedAt: '2026-08-11T09:00:00.000Z',
        receivedAt: '2026-08-13T10:30:00.000Z',
        receivedBy: 'سلطان العتيبي',
        grnNumber: 'GRN-2026-0805',
        invoiceNumber: 'INV-EURO-7762',
        paymentTerms: 'net_30',
        deliveryLocation: 'فرع السليمانية - مستودع المكونات الخاصة',
        createdAt: '2026-08-10T08:00:00.000Z',
        updatedAt: '2026-08-14T12:00:00.000Z',
      },
    ];

    initialOrders.forEach((po) => this.purchaseOrders.set(po.id, po));

    // Seed sample GRN for the received order PO-2026-0801
    const initialGrn: GoodsReceivedNote = {
      id: 'grn-2026-0801',
      grnNumber: 'GRN-2026-0801',
      poId: 'po-2026-0801',
      poNumber: 'PO-2026-0801',
      supplierId: 'sup-almarai',
      supplierName: 'شركة المراعي للمنتجات الغذائية والألبان',
      receivedDate: '2026-08-15T09:45:00.000Z',
      receivedBy: 'سلطان العتيبي',
      items: [
        {
          inventoryItemId: 'raw-dairy-burrata',
          itemNameAr: 'حليب كامل الدسم مبستر (كرتون 12 لتر)',
          quantityOrdered: 20,
          quantityReceived: 20,
          quantityAccepted: 20,
          quantityRejected: 0,
          unitPrice: 48.0,
          batchNumber: 'ALM-B-9912',
          expiryDate: '2026-08-28',
        },
        {
          inventoryItemId: 'raw-akkawi-cheese',
          itemNameAr: 'جبن موزاريلا طبيعي مبشور (كيس 2 كغ)',
          quantityOrdered: 30,
          quantityReceived: 30,
          quantityAccepted: 30,
          quantityRejected: 0,
          unitPrice: 35.0,
          batchNumber: 'ALM-MOZ-441',
          expiryDate: '2026-10-15',
        },
      ],
      qualityInspection: {
        temperatureCompliant: true,
        measuredTemperature: 3.2,
        packagingIntact: true,
        expiryDateValid: true,
        sensoryInspectionPassed: true,
        inspectorName: 'سلطان العتيبي',
        inspectedAt: '2026-08-15T09:45:00.000Z',
        inspectionNotes: 'تم فحص الشحنة وتوثيق درجات الحرارة بدقة.',
      },
      createdAt: '2026-08-15T09:45:00.000Z',
    };
    this.grns.set(initialGrn.id, initialGrn);

    // Seed sample Supplier Invoice
    const initialInvoice: SupplierInvoice = {
      id: 'inv-alm-8812',
      invoiceNumber: 'INV-ALM-2026-8812',
      supplierId: 'sup-almarai',
      supplierName: 'شركة المراعي للمنتجات الغذائية والألبان',
      poId: 'po-2026-0801',
      poNumber: 'PO-2026-0801',
      grnId: 'grn-2026-0801',
      grnNumber: 'GRN-2026-0801',
      invoiceDate: '2026-08-15T09:00:00.000Z',
      dueDate: '2026-09-14T23:59:59.000Z',
      subtotal: 2010.0,
      taxAmount: 301.5,
      totalAmount: 2311.5,
      paidAmount: 0,
      status: 'matched',
      items: [
        {
          inventoryItemId: 'raw-dairy-burrata',
          itemName: 'حليب كامل الدسم مبستر (كرتون 12 لتر)',
          quantity: 20,
          unitPrice: 48.0,
          taxRate: 0.15,
          total: 1104.0,
        },
        {
          inventoryItemId: 'raw-akkawi-cheese',
          itemName: 'جبن موزاريلا طبيعي مبشور (كيس 2 كغ)',
          quantity: 30,
          unitPrice: 35.0,
          taxRate: 0.15,
          total: 1207.5,
        },
      ],
      zatcaQrPayload: 'AQZBbG1hcmFpAg8zMDAwMTIzNDU2MDAwMDMDFDIwMjYtMDgtMTVUMDk6MDA6MDAZBAcyMzExLjUwBQMzMDEuNTA=',
      isPaperlessVerified: true,
      createdAt: '2026-08-15T09:10:00.000Z',
    };
    this.invoices.set(initialInvoice.id, initialInvoice);

    // Run 3-way match on PO-2026-0801 initially
    this.performThreeWayMatch('po-2026-0801', initialInvoice, 2.0);

    this.isInitialized = true;
  }

  // ==========================================
  // 1. SUPPLIER DIRECTORY METHODS
  // ==========================================

  public getSuppliers(): SupplierProfile[] {
    return Array.from(this.suppliers.values());
  }

  public getSupplierById(id: string): SupplierProfile | undefined {
    return this.suppliers.get(id);
  }

  public addSupplier(supplierData: Omit<SupplierProfile, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance' | 'totalPurchasesYTD'>): SupplierProfile {
    const id = `sup-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const supplier: SupplierProfile = {
      ...supplierData,
      id,
      currentBalance: 0,
      totalPurchasesYTD: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.suppliers.set(id, supplier);
    eventBus.emit('procurement:supplier_created', supplier);
    return supplier;
  }

  public updateSupplier(id: string, updates: Partial<SupplierProfile>): SupplierProfile {
    const existing = this.suppliers.get(id);
    if (!existing) {
      throw new Error(`Supplier with id ${id} not found.`);
    }

    const updated: SupplierProfile = {
      ...existing,
      ...updates,
      id: existing.id, // prevent id mutation
      updatedAt: new Date().toISOString(),
    };

    this.suppliers.set(id, updated);
    eventBus.emit('procurement:supplier_updated', updated);
    return updated;
  }

  public deleteSupplier(id: string): boolean {
    const existing = this.suppliers.get(id);
    if (!existing) return false;
    this.suppliers.delete(id);
    eventBus.emit('procurement:supplier_deleted', { id });
    return true;
  }

  // ==========================================
  // 2. PURCHASE ORDER LIFECYCLE STATE MACHINE
  // ==========================================

  public getPurchaseOrders(filters?: {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    search?: string;
  }): PurchaseOrder[] {
    let list = Array.from(this.purchaseOrders.values());

    if (filters) {
      if (filters.status) {
        list = list.filter((po) => po.status === filters.status);
      }
      if (filters.supplierId) {
        list = list.filter((po) => po.supplierId === filters.supplierId);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(
          (po) =>
            po.poNumber.toLowerCase().includes(query) ||
            po.supplierNameAr.toLowerCase().includes(query) ||
            po.supplierNameEn.toLowerCase().includes(query)
        );
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  public createPurchaseOrder(params: {
    supplierId: string;
    items: Omit<PurchaseOrderItem, 'id' | 'subtotal' | 'taxAmount' | 'total' | 'quantityReceived' | 'quantityRejected'>[];
    expectedDeliveryDate?: string;
    paymentTerms?: PaymentTerm;
    deliveryLocation?: string;
    notes?: string;
  }): PurchaseOrder {
    const supplier = this.suppliers.get(params.supplierId);
    if (!supplier) {
      throw new Error(`Supplier with id ${params.supplierId} not found.`);
    }

    const now = new Date();
    const poNumber = `PO-${now.getFullYear()}-${(this.purchaseOrders.size + 1001).toString()}`;
    const id = `po-${now.getTime().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let subtotal = 0;
    let taxAmount = 0;

    const formattedItems: PurchaseOrderItem[] = params.items.map((item, idx) => {
      const itemSubtotal = Math.round(item.quantityOrdered * item.unitPriceContracted * 100) / 100;
      const itemTax = Math.round(itemSubtotal * (item.taxRate ?? DEFAULT_VAT_RATE) * 100) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        ...item,
        id: `poi-${now.getTime()}-${idx}`,
        quantityReceived: 0,
        quantityRejected: 0,
        unitPriceInvoiced: item.unitPriceContracted,
        taxRate: item.taxRate ?? DEFAULT_VAT_RATE,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemTotal,
      };
    });

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const po: PurchaseOrder = {
      id,
      poNumber,
      supplierId: supplier.id,
      supplierNameAr: supplier.nameAr,
      supplierNameEn: supplier.nameEn,
      status: 'draft',
      items: formattedItems,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paidAmount: 0,
      issueDate: now.toISOString(),
      expectedDeliveryDate: params.expectedDeliveryDate || new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
      paymentTerms: params.paymentTerms || supplier.paymentTerms,
      deliveryLocation: params.deliveryLocation || 'المستودع الرئيسي - فرع السليمانية',
      notes: params.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.purchaseOrders.set(id, po);
    eventBus.emit('procurement:po_created', po);
    return po;
  }

  /**
   * Stage 1: Approve Purchase Order (Draft -> Approved)
   */
  public approvePurchaseOrder(poId: string, approverName: string = 'المدير التنفيذي'): PurchaseOrder {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`PO ${poId} not found.`);
    if (po.status !== 'draft') {
      throw new Error(`Cannot approve PO in '${po.status}' status. Must be 'draft'.`);
    }

    po.status = 'approved';
    po.approvedAt = new Date().toISOString();
    po.approvedBy = approverName;
    po.updatedAt = new Date().toISOString();

    this.purchaseOrders.set(po.id, po);
    eventBus.emit('procurement:po_approved', po);
    return po;
  }

  /**
   * Stage 2: Dispatch Purchase Order to Supplier (Approved -> Dispatched)
   */
  public dispatchPurchaseOrder(poId: string, trackingNotes?: string): PurchaseOrder {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`PO ${poId} not found.`);
    if (po.status !== 'approved') {
      throw new Error(`Cannot dispatch PO in '${po.status}' status. Must be 'approved'.`);
    }

    po.status = 'dispatched';
    po.dispatchedAt = new Date().toISOString();
    if (trackingNotes) {
      po.notes = po.notes ? `${po.notes} | ${trackingNotes}` : trackingNotes;
    }
    po.updatedAt = new Date().toISOString();

    this.purchaseOrders.set(po.id, po);
    eventBus.emit('procurement:po_dispatched', po);
    return po;
  }

  /**
   * Stage 3: Goods Received Note (GRN) & Auto Inventory Stock + WAC Recalculation
   * (Dispatched / Approved -> Received)
   */
  public async receiveGoods(
    poId: string,
    params: {
      receivedBy: string;
      itemsReceived: {
        inventoryItemId: string;
        quantityReceived: number;
        quantityAccepted: number;
        quantityRejected: number;
        actualUnitPrice?: number;
        batchNumber?: string;
        expiryDate?: string;
        rejectionReason?: string;
      }[];
      qualityInspection: QualityInspection;
      notes?: string;
    }
  ): Promise<{ po: PurchaseOrder; grn: GoodsReceivedNote }> {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`PO ${poId} not found.`);
    if (po.status !== 'dispatched' && po.status !== 'approved') {
      throw new Error(`Cannot receive goods for PO in '${po.status}' status. Must be 'dispatched' or 'approved'.`);
    }

    const now = new Date().toISOString();
    const grnNumber = `GRN-${new Date().getFullYear()}-${(this.grns.size + 1001).toString()}`;
    const grnId = `grn-${Date.now().toString(36)}`;

    // 1. Update PO Items received quantities
    po.items = po.items.map((item) => {
      const match = params.itemsReceived.find((ir) => ir.inventoryItemId === item.inventoryItemId);
      if (match) {
        return {
          ...item,
          quantityReceived: match.quantityReceived,
          quantityRejected: match.quantityRejected,
          expiryDate: match.expiryDate || item.expiryDate,
          batchNumber: match.batchNumber || item.batchNumber,
          unitPriceInvoiced: match.actualUnitPrice ?? item.unitPriceContracted,
        };
      }
      return item;
    });

    po.status = 'received';
    po.receivedAt = now;
    po.receivedBy = params.receivedBy;
    po.grnNumber = grnNumber;
    po.qualityInspection = params.qualityInspection;
    po.updatedAt = now;

    // 2. Create GRN Record
    const grn: GoodsReceivedNote = {
      id: grnId,
      grnNumber,
      poId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierNameAr,
      receivedDate: now,
      receivedBy: params.receivedBy,
      items: params.itemsReceived.map((ir) => {
        const itemObj = po.items.find((i) => i.inventoryItemId === ir.inventoryItemId);
        return {
          inventoryItemId: ir.inventoryItemId,
          itemNameAr: itemObj?.inventoryItemNameAr || ir.inventoryItemId,
          quantityOrdered: itemObj?.quantityOrdered || ir.quantityReceived,
          quantityReceived: ir.quantityReceived,
          quantityAccepted: ir.quantityAccepted,
          quantityRejected: ir.quantityRejected,
          unitPrice: ir.actualUnitPrice ?? itemObj?.unitPriceContracted ?? 0,
          batchNumber: ir.batchNumber,
          expiryDate: ir.expiryDate,
          rejectionReason: ir.rejectionReason,
        };
      }),
      qualityInspection: params.qualityInspection,
      notes: params.notes,
      createdAt: now,
    };

    this.grns.set(grn.id, grn);
    this.purchaseOrders.set(po.id, po);

    // 3. Update Supplier Balance (add invoice/debt to balance)
    const supplier = this.suppliers.get(po.supplierId);
    if (supplier) {
      supplier.currentBalance = Math.round((supplier.currentBalance + po.totalAmount) * 100) / 100;
      supplier.totalPurchasesYTD = Math.round((supplier.totalPurchasesYTD + po.totalAmount) * 100) / 100;
      supplier.updatedAt = now;
      this.suppliers.set(supplier.id, supplier);
    }

    // 4. Automated Inventory Stock Increment & Weighted Average Cost (WAC) recalculation
    await this.applyInventoryStockIncrement(grn);

    eventBus.emit('procurement:goods_received', { po, grn });
    return { po, grn };
  }

  /**
   * Recalculates stock and Weighted Average Cost (WAC):
   * WAC = ((OldStock * OldAvgCost) + (ReceivedQty * NewCost)) / (OldStock + ReceivedQty)
   */
  private async applyInventoryStockIncrement(grn: GoodsReceivedNote): Promise<void> {
    for (const item of grn.items) {
      if (item.quantityAccepted <= 0) continue;

      try {
        const existingItem = await db.getById('inventoryItems', item.inventoryItemId);
        if (existingItem) {
          const oldStock = existingItem.currentStock || 0;
          const oldAvgCost = existingItem.averageCost || item.unitPrice;
          const newQty = item.quantityAccepted;
          const newUnitPrice = item.unitPrice;

          const totalStock = oldStock + newQty;
          const weightedAverageCost =
            totalStock > 0
              ? Math.round(((oldStock * oldAvgCost + newQty * newUnitPrice) / totalStock) * 100) / 100
              : newUnitPrice;

          await db.update('inventoryItems', existingItem.id, {
            currentStock: totalStock,
            averageCost: weightedAverageCost,
            lastPurchasePrice: newUnitPrice,
            updatedAt: new Date().toISOString(),
          });

          // Record stock movement
          await db.insert('stockMovements', {
            id: db.generateUUID(),
            inventoryItemId: existingItem.id,
            type: 'purchase',
            quantity: newQty,
            unitPrice: newUnitPrice,
            previousStock: oldStock,
            newStock: totalStock,
            referenceId: grn.grnNumber,
            referenceType: 'purchase',
            reason: `استلام بضاعة - أمر شراء ${grn.poNumber}`,
            employeeId: grn.receivedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`[ProcurementService] Could not update db stock for item ${item.inventoryItemId}:`, err);
      }
    }
  }

  /**
   * Cancel a Purchase Order with reason
   */
  public cancelPurchaseOrder(poId: string, reason: string): PurchaseOrder {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`PO ${poId} not found.`);
    if (po.status === 'paid') {
      throw new Error(`Cannot cancel a paid PO.`);
    }

    po.status = 'cancelled';
    po.notes = po.notes ? `${po.notes} | سبب الإلغاء: ${reason}` : `سبب الإلغاء: ${reason}`;
    po.updatedAt = new Date().toISOString();

    this.purchaseOrders.set(po.id, po);
    eventBus.emit('procurement:po_cancelled', po);
    return po;
  }

  // ==========================================
  // 3. THREE-WAY MATCHING ENGINE (PO vs GRN vs Invoice)
  // ==========================================

  /**
   * Performs 3-Way Matching by cross-examining:
   * 1. Purchase Order (contracted quantities & unit prices)
   * 2. Goods Received Note (actual verified accepted quantities)
   * 3. Supplier Invoice (billed quantities, billed unit prices & taxes)
   */
  public performThreeWayMatch(
    poId: string,
    invoiceData: {
      id?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate?: string;
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
      items: {
        inventoryItemId: string;
        itemName: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        total: number;
      }[];
      zatcaQrPayload?: string;
      isPaperlessVerified?: boolean;
    },
    tolerancePercentage: number = 2.0
  ): ThreeWayMatchReport {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`Purchase Order ${poId} not found.`);

    const grn = Array.from(this.grns.values()).find((g) => g.poId === po.id);

    const discrepancies: ThreeWayMatchDiscrepancy[] = [];
    let grnEstimatedTotal = 0;

    // 1. Line-by-line comparison
    po.items.forEach((poItem) => {
      const grnItem = grn?.items.find((gi) => gi.inventoryItemId === poItem.inventoryItemId);
      const invItem = invoiceData.items.find((ii) => ii.inventoryItemId === poItem.inventoryItemId);

      const acceptedQty = grnItem ? grnItem.quantityAccepted : poItem.quantityOrdered;
      const grnLineTotal = acceptedQty * poItem.unitPriceContracted * (1 + poItem.taxRate);
      grnEstimatedTotal += grnLineTotal;

      if (!invItem) {
        discrepancies.push({
          type: 'missing_item',
          inventoryItemId: poItem.inventoryItemId,
          itemName: poItem.inventoryItemNameAr,
          poValue: `${poItem.quantityOrdered} ${poItem.unit}`,
          grnValue: grnItem ? `${grnItem.quantityAccepted} ${poItem.unit}` : '0',
          invoiceValue: 'غير موجود بالفاتورة',
          varianceAmount: poItem.total,
          variancePercentage: 100,
          description: `الصنف المطلوب موجود بأمر الشراء ولكن غير مدرج في فاتورة المورد.`,
          isAcceptable: false,
        });
        return;
      }

      // Check Quantity Discrepancy (Invoice billed qty vs GRN accepted qty)
      if (invItem.quantity !== acceptedQty) {
        const qtyDiff = invItem.quantity - acceptedQty;
        const diffPercent = acceptedQty > 0 ? Math.abs((qtyDiff / acceptedQty) * 100) : 100;
        const isAcceptable = diffPercent <= tolerancePercentage;

        discrepancies.push({
          type: 'quantity_variance',
          inventoryItemId: poItem.inventoryItemId,
          itemName: poItem.inventoryItemNameAr,
          poValue: `${poItem.quantityOrdered} ${poItem.unit}`,
          grnValue: `${acceptedQty} ${poItem.unit}`,
          invoiceValue: `${invItem.quantity} ${poItem.unit}`,
          varianceAmount: Math.round(qtyDiff * invItem.unitPrice * 100) / 100,
          variancePercentage: Math.round(diffPercent * 100) / 100,
          description:
            qtyDiff > 0
              ? `المورد قام بفوترة كمية زائدة (${invItem.quantity}) عن الكمية المستلمة فعلياً في المستودع (${acceptedQty}).`
              : `المورد فوتر كمية أقل (${invItem.quantity}) من الكمية المستلمة (${acceptedQty}).`,
          isAcceptable,
        });
      }

      // Check Price Discrepancy (Invoice unit price vs PO contracted price)
      if (invItem.unitPrice !== poItem.unitPriceContracted) {
        const priceDiff = invItem.unitPrice - poItem.unitPriceContracted;
        const priceDiffPercent = (Math.abs(priceDiff) / poItem.unitPriceContracted) * 100;
        const isAcceptable = priceDiff <= 0 || priceDiffPercent <= tolerancePercentage;

        discrepancies.push({
          type: 'price_variance',
          inventoryItemId: poItem.inventoryItemId,
          itemName: poItem.inventoryItemNameAr,
          poValue: `${poItem.unitPriceContracted.toFixed(2)} ر.س`,
          grnValue: grnItem ? `${grnItem.unitPrice.toFixed(2)} ر.س` : '-',
          invoiceValue: `${invItem.unitPrice.toFixed(2)} ر.س`,
          varianceAmount: Math.round(priceDiff * invItem.quantity * 100) / 100,
          variancePercentage: Math.round(priceDiffPercent * 100) / 100,
          description:
            priceDiff > 0
              ? `سعر الوحدة في الفاتورة أعلى من السعر المتفق عليه بالعقد بمقدار (${priceDiff.toFixed(2)} ر.س).`
              : `سعر الوحدة في الفاتورة أقل من السعر التعاقدي بمقدار (${Math.abs(priceDiff).toFixed(2)} ر.س - خصم إضافي).`,
          isAcceptable,
        });
      }
    });

    // Check for unexpected extra items in Invoice not in PO
    invoiceData.items.forEach((invItem) => {
      const poItem = po.items.find((pi) => pi.inventoryItemId === invItem.inventoryItemId);
      if (!poItem) {
        discrepancies.push({
          type: 'unexpected_item',
          inventoryItemId: invItem.inventoryItemId,
          itemName: invItem.itemName,
          poValue: 'غير مدرج بأمر الشراء',
          grnValue: 'غير مستلم',
          invoiceValue: `${invItem.quantity} بسعر ${invItem.unitPrice} ر.س`,
          varianceAmount: invItem.total,
          variancePercentage: 100,
          description: `الصنف مدرج في فاتورة المورد ولكنه لم يكن مطلوباً في أمر الشراء الأساسي.`,
          isAcceptable: false,
        });
      }
    });

    // Total Variance calculation
    const totalVariance = Math.round((invoiceData.totalAmount - po.totalAmount) * 100) / 100;
    const totalVariancePercent =
      po.totalAmount > 0 ? Math.round((Math.abs(totalVariance) / po.totalAmount) * 10000) / 100 : 0;

    // Match Verdict
    let status: MatchingStatus = 'exact_match';
    let verdictSummary = 'مطابقة تامة 100%: تطابق كامل بين أمر الشراء ومذكرة الاستلام والفاتورة.';
    let isReadyForPayment = true;

    if (discrepancies.length > 0) {
      const hasCritical = discrepancies.some((d) => !d.isAcceptable);
      if (hasCritical || totalVariancePercent > tolerancePercentage) {
        status = totalVariancePercent > 50.0 ? 'critical_mismatch' : 'discrepancy';
        verdictSummary = `تم رصد ${discrepancies.length} فروقات سعرية أو كمية تتطلب المراجعة قبل السداد.`;
        isReadyForPayment = false;
      } else {
        status = 'within_tolerance';
        verdictSummary = `الفروقات طفيفة وضمن نسبة السماحية المقبولة (${tolerancePercentage}%). مؤهل للصرف.`;
        isReadyForPayment = true;
      }
    }

    const reportId = `rep-match-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const report: ThreeWayMatchReport = {
      id: reportId,
      poId: po.id,
      poNumber: po.poNumber,
      grnId: grn?.id || 'grn-none',
      grnNumber: grn?.grnNumber || 'GRN-PENDING',
      invoiceId: invoiceData.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceData.invoiceNumber,
      status,
      matchedAt: now,
      performedBy: 'محرك التدقيق الآلي - RestaurantOS Core',
      poTotal: po.totalAmount,
      grnEstimatedTotal: Math.round(grnEstimatedTotal * 100) / 100,
      invoiceTotal: invoiceData.totalAmount,
      totalVariance,
      tolerancePercentage,
      discrepancies,
      verdictSummary,
      isReadyForPayment,
    };

    // Save or update invoice record
    const invoiceRecord: SupplierInvoice = {
      id: invoiceData.id || `inv-${Date.now().toString(36)}`,
      invoiceNumber: invoiceData.invoiceNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierNameAr,
      poId: po.id,
      poNumber: po.poNumber,
      grnId: grn?.id,
      grnNumber: grn?.grnNumber,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      subtotal: invoiceData.subtotal,
      taxAmount: invoiceData.taxAmount,
      totalAmount: invoiceData.totalAmount,
      paidAmount: 0,
      status: status === 'exact_match' || status === 'within_tolerance' ? 'matched' : 'disputed',
      items: invoiceData.items,
      zatcaQrPayload: invoiceData.zatcaQrPayload,
      isPaperlessVerified: invoiceData.isPaperlessVerified ?? true,
      createdAt: now,
    };

    this.invoices.set(invoiceRecord.id, invoiceRecord);
    po.invoiceNumber = invoiceData.invoiceNumber;
    po.matchingReport = report;
    this.purchaseOrders.set(po.id, po);

    return report;
  }

  // ==========================================
  // 4. PAYABLES, AGING ANALYSIS & PAYMENTS
  // ==========================================

  /**
   * Calculates Payables Aging Buckets (Current 0-30, 31-60, 61-90, 90+)
   */
  public getPayablesAgingSummary(): PayableAgingBucket {
    const now = new Date().getTime();
    let current = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let over90 = 0;
    let totalOutstanding = 0;

    const suppliersMap = new Map<string, { current: number; days31to60: number; days61to90: number; over90: number; total: number }>();

    // Process unpaid purchase orders
    this.purchaseOrders.forEach((po) => {
      if (po.status === 'received') {
        const remaining = po.totalAmount - po.paidAmount;
        if (remaining > 0) {
          const poDate = new Date(po.receivedAt || po.createdAt).getTime();
          const ageDays = Math.floor((now - poDate) / (1000 * 60 * 60 * 24));

          totalOutstanding += remaining;

          if (!suppliersMap.has(po.supplierId)) {
            suppliersMap.set(po.supplierId, { current: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 });
          }
          const sBucket = suppliersMap.get(po.supplierId)!;
          sBucket.total += remaining;

          if (ageDays <= 30) {
            current += remaining;
            sBucket.current += remaining;
          } else if (ageDays <= 60) {
            days31to60 += remaining;
            sBucket.days31to60 += remaining;
          } else if (ageDays <= 90) {
            days61to90 += remaining;
            sBucket.days61to90 += remaining;
          } else {
            over90 += remaining;
            sBucket.over90 += remaining;
          }
        }
      }
    });

    const suppliersBreakdown = Array.from(suppliersMap.entries()).map(([supplierId, bucket]) => {
      const sup = this.suppliers.get(supplierId);
      return {
        supplierId,
        supplierName: sup?.nameAr || supplierId,
        current: Math.round(bucket.current * 100) / 100,
        days31to60: Math.round(bucket.days31to60 * 100) / 100,
        days61to90: Math.round(bucket.days61to90 * 100) / 100,
        over90: Math.round(bucket.over90 * 100) / 100,
        total: Math.round(bucket.total * 100) / 100,
      };
    });

    return {
      current: Math.round(current * 100) / 100,
      days31to60: Math.round(days31to60 * 100) / 100,
      days61to90: Math.round(days61to90 * 100) / 100,
      over90: Math.round(over90 * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      suppliersBreakdown,
    };
  }

  /**
   * Records a payment to supplier (Full or Partial) & deducts balance
   */
  public recordSupplierPayment(params: {
    supplierId: string;
    amount: number;
    paymentMethod: ProcurementPaymentMethod;
    referenceNumber: string;
    appliedPoIds?: string[];
    notes?: string;
    recordedBy?: string;
  }): SupplierPaymentRecord {
    const supplier = this.suppliers.get(params.supplierId);
    if (!supplier) throw new Error(`Supplier with id ${params.supplierId} not found.`);
    if (params.amount <= 0) throw new Error(`Payment amount must be greater than zero.`);

    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now().toString(36)}`;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${(this.paymentRecords.size + 1001).toString()}`;

    let remainingPaymentToAllocate = params.amount;
    const appliedInvoices: { invoiceId: string; invoiceNumber: string; amountApplied: number }[] = [];

    // Apply to selected POs or oldest received POs
    const targetPOs = params.appliedPoIds
      ? params.appliedPoIds.map((id) => this.purchaseOrders.get(id)).filter(Boolean) as PurchaseOrder[]
      : this.getPurchaseOrders({ supplierId: supplier.id, status: 'received' });

    for (const po of targetPOs) {
      if (remainingPaymentToAllocate <= 0) break;
      const unpaidAmount = po.totalAmount - po.paidAmount;
      if (unpaidAmount > 0) {
        const allocation = Math.min(unpaidAmount, remainingPaymentToAllocate);
        po.paidAmount += allocation;
        remainingPaymentToAllocate -= allocation;

        if (po.paidAmount >= po.totalAmount) {
          po.status = 'paid';
        }
        po.updatedAt = now;
        this.purchaseOrders.set(po.id, po);

        appliedInvoices.push({
          invoiceId: po.id,
          invoiceNumber: po.invoiceNumber || po.poNumber,
          amountApplied: allocation,
        });
      }
    }

    // Deduct supplier balance
    supplier.currentBalance = Math.max(0, Math.round((supplier.currentBalance - params.amount) * 100) / 100);
    supplier.updatedAt = now;
    this.suppliers.set(supplier.id, supplier);

    const record: SupplierPaymentRecord = {
      id: paymentId,
      paymentNumber,
      supplierId: supplier.id,
      supplierName: supplier.nameAr,
      amount: params.amount,
      paymentDate: now,
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
      appliedInvoices,
      notes: params.notes,
      recordedBy: params.recordedBy || 'المحاسب المالي',
      createdAt: now,
    };

    this.paymentRecords.set(record.id, record);
    eventBus.emit('procurement:payment_recorded', record);
    return record;
  }

  /**
   * Generates a complete chronological Statement of Account for a supplier
   */
  public getSupplierStatementOfAccount(supplierId: string): SupplierStatementOfAccount {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) throw new Error(`Supplier with id ${supplierId} not found.`);

    const transactions: StatementTransaction[] = [];
    let runningBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    // Gather POs / Invoices
    const pos = this.getPurchaseOrders({ supplierId });
    pos.forEach((po) => {
      if (po.status === 'received' || po.status === 'paid') {
        runningBalance += po.totalAmount;
        totalDebits += po.totalAmount;
        transactions.push({
          id: `tx-po-${po.id}`,
          date: po.receivedAt || po.createdAt,
          type: 'invoice',
          referenceNumber: po.invoiceNumber || po.poNumber,
          description: `فاتورة توريد بضاعة - أمر شراء ${po.poNumber}`,
          debit: po.totalAmount,
          credit: 0,
          runningBalance,
        });
      }
    });

    // Gather Payments
    const payments = Array.from(this.paymentRecords.values()).filter((p) => p.supplierId === supplierId);
    payments.forEach((p) => {
      runningBalance -= p.amount;
      totalCredits += p.amount;
      transactions.push({
        id: `tx-pay-${p.id}`,
        date: p.paymentDate,
        type: 'payment',
        referenceNumber: p.referenceNumber || p.paymentNumber,
        description: `سند صرف حوالة بنكية / سداد (${p.paymentMethod})`,
        debit: 0,
        credit: p.amount,
        runningBalance,
      });
    });

    // Sort transactions by date ascending
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      supplierId: supplier.id,
      supplierNameAr: supplier.nameAr,
      supplierNameEn: supplier.nameEn,
      statementDate: new Date().toISOString(),
      openingBalance: 0,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      closingBalance: Math.round(supplier.currentBalance * 100) / 100,
      creditLimit: supplier.creditLimit,
      availableCredit: Math.max(0, supplier.creditLimit - supplier.currentBalance),
      transactions,
    };
  }

  // ==========================================
  // 5. SMART AUTO-REORDER SUGGESTIONS ENGINE
  // ==========================================

  /**
   * Scans inventory stock levels and auto-groups items that breached min threshold
   */
  public async generateAutoReorderSuggestions(): Promise<AutoReorderSupplierGroup[]> {
    let inventoryItems: any[] = [];
    try {
      inventoryItems = await db.getAll('inventoryItems');
    } catch {
      inventoryItems = [];
    }

    // Fallback if empty
    if (!inventoryItems || inventoryItems.length === 0) {
      inventoryItems = [
        {
          id: 'raw-wagyu-beef',
          code: 'RAW-BEEF-WAGYU',
          nameAr: 'لحم واغيو ياباني A5 مبرد',
          nameEn: 'Chilled Japanese A5 Wagyu Ribeye',
          category: 'اللحوم والدواجن',
          unit: 'kg',
          currentStock: 4.5,
          minStockAlert: 8.0,
          maxStock: 25.0,
          reorderQuantity: 15.0,
          averageCost: 380.0,
          defaultSupplierId: 'sup-fresh-meat',
        },
        {
          id: 'raw-fresh-salmon',
          code: 'RAW-FISH-SALMON',
          nameAr: 'سمك سلمون نرويجي طازج كامل',
          nameEn: 'Fresh Norwegian Whole Salmon',
          category: 'الأسماك والمأكولات البحرية',
          unit: 'kg',
          currentStock: 3.0,
          minStockAlert: 6.0,
          maxStock: 20.0,
          reorderQuantity: 12.0,
          averageCost: 75.0,
          defaultSupplierId: 'sup-fresh-meat',
        },
        {
          id: 'raw-dairy-burrata',
          code: 'RAW-DAIRY-BURRATA',
          nameAr: 'جبن بوراتا إيطالي طازج (كرات 125غ)',
          nameEn: 'Fresh Italian Burrata Cheese (125g)',
          category: 'الألبان والأجبان',
          unit: 'piece',
          currentStock: 8,
          minStockAlert: 15,
          maxStock: 60,
          reorderQuantity: 30,
          averageCost: 12.0,
          defaultSupplierId: 'sup-almarai',
        },
        {
          id: 'raw-fresh-produce-tomato',
          code: 'RAW-VEG-TOMATO',
          nameAr: 'طماطم محمية قطاف اليوم (صندوق 10 كغ)',
          nameEn: 'Fresh Greenhouse Tomatoes (10kg Box)',
          category: 'الخضروات والفواكه',
          unit: 'box',
          currentStock: 2,
          minStockAlert: 5,
          maxStock: 20,
          reorderQuantity: 15,
          averageCost: 24.0,
          defaultSupplierId: 'sup-qassim-veg',
        },
      ];
    }

    let lowStockItems = inventoryItems.filter((i) => {
      const min = i.minStockAlert ?? i.minThreshold ?? 5;
      return (i.currentStock ?? 0) <= min;
    });

    if (lowStockItems.length === 0) {
      lowStockItems = [
        {
          id: 'raw-wagyu-beef',
          code: 'RAW-BEEF-WAGYU',
          nameAr: 'لحم واغيو ياباني A5 مبرد',
          nameEn: 'Chilled Japanese A5 Wagyu Ribeye',
          category: 'اللحوم والدواجن',
          unit: 'kg',
          currentStock: 4.5,
          minStockAlert: 8.0,
          maxStock: 25.0,
          reorderQuantity: 15.0,
          averageCost: 380.0,
          defaultSupplierId: 'sup-fresh-meat',
        },
        {
          id: 'raw-fresh-salmon',
          code: 'RAW-FISH-SALMON',
          nameAr: 'سمك سلمون نرويجي طازج كامل',
          nameEn: 'Fresh Norwegian Whole Salmon',
          category: 'الأسماك والمأكولات البحرية',
          unit: 'kg',
          currentStock: 3.0,
          minStockAlert: 6.0,
          maxStock: 20.0,
          reorderQuantity: 12.0,
          averageCost: 75.0,
          defaultSupplierId: 'sup-fresh-meat',
        },
        {
          id: 'raw-dairy-burrata',
          code: 'RAW-DAIRY-BURRATA',
          nameAr: 'جبن بوراتا إيطالي طازج (كرات 125غ)',
          nameEn: 'Fresh Italian Burrata Cheese (125g)',
          category: 'الألبان والأجبان',
          unit: 'piece',
          currentStock: 8,
          minStockAlert: 15,
          maxStock: 60,
          reorderQuantity: 30,
          averageCost: 12.0,
          defaultSupplierId: 'sup-almarai',
        },
        {
          id: 'raw-fresh-produce-tomato',
          code: 'RAW-VEG-TOMATO',
          nameAr: 'طماطم محمية قطاف اليوم (صندوق 10 كغ)',
          nameEn: 'Fresh Greenhouse Tomatoes (10kg Box)',
          category: 'الخضروات والفواكه',
          unit: 'box',
          currentStock: 2,
          minStockAlert: 5,
          maxStock: 20,
          reorderQuantity: 15,
          averageCost: 24.0,
          defaultSupplierId: 'sup-qassim-veg',
        },
      ];
    }

    const supplierGroupsMap = new Map<string, AutoReorderSupplierGroup>();

    lowStockItems.forEach((item) => {
      const supplierId = item.defaultSupplierId || item.supplierId || 'sup-fresh-meat';
      const supplier = this.suppliers.get(supplierId) || this.suppliers.get('sup-fresh-meat') || Array.from(this.suppliers.values())[0] || {
        id: supplierId,
        nameAr: 'شركة المورد المعتمد',
        nameEn: 'Certified Supplier',
        leadTimeDays: 2,
        paymentTerms: 'credit_30' as const,
      };

      if (!supplierGroupsMap.has(supplier.id)) {
        supplierGroupsMap.set(supplier.id, {
          supplierId: supplier.id,
          supplierNameAr: supplier.nameAr,
          supplierNameEn: supplier.nameEn,
          leadTimeDays: supplier.leadTimeDays,
          paymentTerms: supplier.paymentTerms,
          items: [],
          totalEstimatedCost: 0,
          itemCount: 0,
        });
      }

      const group = supplierGroupsMap.get(supplier.id)!;
      const minStock = item.minStockAlert ?? item.minThreshold ?? 5;
      const maxStock = item.maxStock ?? minStock * 3;
      const current = item.currentStock ?? 0;
      const reorderQty = item.reorderQuantity || Math.max(1, maxStock - current);
      const unitCost = item.lastPurchasePrice || item.averageCost || item.costPrice || 25.0;
      const estimatedTotal = Math.round(reorderQty * unitCost * 100) / 100;

      const urgency: 'critical' | 'warning' | 'normal' =
        current <= minStock * 0.4 ? 'critical' : current <= minStock ? 'warning' : 'normal';

      const suggestionItem: AutoReorderSuggestionItem = {
        inventoryItemId: item.id,
        code: item.code || item.sku || 'SKU-GEN',
        nameAr: item.nameAr || item.name || 'مكون غذائي',
        nameEn: item.nameEn || item.name || 'Raw Ingredient',
        category: item.category || 'عام',
        currentStock: current,
        minStockAlert: minStock,
        maxStock,
        suggestedReorderQuantity: reorderQty,
        unit: item.unit || 'kg',
        unitCost,
        estimatedTotal,
        urgency,
      };

      group.items.push(suggestionItem);
      group.totalEstimatedCost = Math.round((group.totalEstimatedCost + estimatedTotal) * 100) / 100;
      group.itemCount += 1;
    });

    return Array.from(supplierGroupsMap.values());
  }

  /**
   * 1-Click batch creation of draft POs from auto-reorder suggestions
   */
  public async createDraftOrdersFromSuggestions(supplierIds?: string[]): Promise<PurchaseOrder[]> {
    const suggestions = await this.generateAutoReorderSuggestions();
    const createdOrders: PurchaseOrder[] = [];

    for (const group of suggestions) {
      if (supplierIds && !supplierIds.includes(group.supplierId)) continue;

      const po = this.createPurchaseOrder({
        supplierId: group.supplierId,
        paymentTerms: group.paymentTerms,
        notes: `تم إنشاء أمر الشراء آلياً عبر رادار إعادة التوريد الذكي (Smart Replenishment Engine).`,
        items: group.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          inventoryItemNameAr: item.nameAr,
          inventoryItemNameEn: item.nameEn,
          sku: item.code,
          unit: item.unit,
          quantityOrdered: item.suggestedReorderQuantity,
          unitPriceContracted: item.unitCost,
          taxRate: DEFAULT_VAT_RATE,
        })),
      });

      createdOrders.push(po);
    }

    return createdOrders;
  }

  // ==========================================
  // 6. PAPERLESS OCR INVOICE SCANNING SIMULATION
  // ==========================================

  /**
   * Simulates AI-Powered OCR scanning of paper/digital supplier invoices with ZATCA Phase-2 QR extraction
   */
  public simulateOcrInvoiceScan(params?: {
    supplierId?: string;
    invoiceNumber?: string;
    subtotal?: number;
  }): {
    success: boolean;
    extractedInvoice: {
      invoiceNumber: string;
      supplierId: string;
      supplierName: string;
      taxNumber: string;
      invoiceDate: string;
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
      confidenceScore: number;
      zatcaQrValid: boolean;
      items: {
        inventoryItemId: string;
        itemName: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        total: number;
      }[];
    };
  } {
    const supplier = params?.supplierId ? this.suppliers.get(params.supplierId) : this.suppliers.get('sup-almarai');
    const sup = supplier || Array.from(this.suppliers.values())[0];

    const subtotal = params?.subtotal ?? 3250.0;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalAmount = subtotal + taxAmount;
    const invoiceNumber = params?.invoiceNumber || `INV-${sup.nameEn.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return {
      success: true,
      extractedInvoice: {
        invoiceNumber,
        supplierId: sup.id,
        supplierName: sup.nameAr,
        taxNumber: sup.taxNumber,
        invoiceDate: new Date().toISOString(),
        subtotal,
        taxAmount,
        totalAmount,
        confidenceScore: 0.985,
        zatcaQrValid: true,
        items: [
          {
            inventoryItemId: 'raw-local-lamb',
            itemName: 'لحم غنم نعيمي بلدي طازج بالعظم',
            quantity: 30,
            unitPrice: 65.0,
            taxRate: 0.15,
            total: 2242.5,
          },
          {
            inventoryItemId: 'raw-dairy-burrata',
            itemName: 'حليب كامل الدسم مبستر',
            quantity: 21,
            unitPrice: 48.0,
            taxRate: 0.15,
            total: 1159.2,
          },
        ],
      },
    };
  }

  // ==========================================
  // 7. OVERALL METRICS & REPORTING
  // ==========================================

  public getProcurementMetrics(): ProcurementMetrics {
    const pos = Array.from(this.purchaseOrders.values());
    const suppliers = Array.from(this.suppliers.values());

    const totalMonthlySpend = pos
      .filter((p) => p.status === 'received' || p.status === 'paid')
      .reduce((acc, p) => acc + p.totalAmount, 0);

    const totalOutstandingDebt = suppliers.reduce((acc, s) => acc + s.currentBalance, 0);

    const activePOs = pos.filter((p) => p.status === 'approved' || p.status === 'dispatched');

    const matchReports = pos.map((p) => p.matchingReport).filter(Boolean) as ThreeWayMatchReport[];
    const successfulMatches = matchReports.filter((r) => r.status === 'exact_match' || r.status === 'within_tolerance').length;
    const threeWayMatchSuccessRate = matchReports.length > 0 ? Math.round((successfulMatches / matchReports.length) * 100) : 100;

    const pendingGoodsReceiptCount = pos.filter((p) => p.status === 'dispatched' || p.status === 'approved').length;

    const avgLeadTime = suppliers.length > 0
      ? Math.round((suppliers.reduce((acc, s) => acc + s.leadTimeDays, 0) / suppliers.length) * 10) / 10
      : 2;

    return {
      totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
      totalOutstandingDebt: Math.round(totalOutstandingDebt * 100) / 100,
      activePurchaseOrdersCount: activePOs.length,
      threeWayMatchSuccessRate,
      lowStockItemsCount: 4, // updated dynamically in UI
      pendingGoodsReceiptCount,
      averageDeliveryLeadTimeDays: avgLeadTime,
      supplierCount: suppliers.length,
    };
  }

  public exportProcurementReport(format: 'json' | 'csv' = 'json'): string {
    const data = {
      generatedAt: new Date().toISOString(),
      metrics: this.getProcurementMetrics(),
      suppliers: this.getSuppliers(),
      purchaseOrders: this.getPurchaseOrders(),
      agingSummary: this.getPayablesAgingSummary(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format for purchase orders
    const headers = ['PO Number', 'Supplier', 'Status', 'Date', 'Subtotal', 'Tax', 'Total', 'Paid'];
    const rows = data.purchaseOrders.map((po) => [
      po.poNumber,
      `"${po.supplierNameAr}"`,
      po.status,
      po.issueDate.substring(0, 10),
      po.subtotal,
      po.taxAmount,
      po.totalAmount,
      po.paidAmount,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const procurementService = new ProcurementService();
