import { describe, it, expect, beforeEach } from 'vitest';
import { procurementService, ProcurementService } from '../services/procurementService';
import { eventBus } from '../services/eventBus';
import { db } from '../db';

describe('Digital Procurement & Supplier Management Ecosystem', () => {
  let service: ProcurementService;

  beforeEach(async () => {
    await db.init();
    eventBus.clearHistory();
    // Fresh service instance with initial seeded data
    service = new ProcurementService();
  });

  // =========================================================================
  // 1. SUPPLIER DIRECTORY & PROFILES
  // =========================================================================
  describe('1. Supplier Directory & Profile Management', () => {
    it('should initialize with top Saudi / GCC suppliers', () => {
      const suppliers = service.getSuppliers();
      expect(suppliers.length).toBeGreaterThanOrEqual(5);

      const almarai = service.getSupplierById('sup-almarai');
      expect(almarai).toBeDefined();
      expect(almarai?.nameAr).toContain('المراعي');
      expect(almarai?.taxNumber).toBe('300012345600003');
      expect(almarai?.creditLimit).toBe(50000);
      expect(almarai?.rating).toBe(5);
    });

    it('should create a new supplier with initial zero balance and valid metadata', () => {
      const newSup = service.addSupplier({
        nameAr: 'شركة مطاحن الدقيق الوطنية',
        nameEn: 'National Flour Mills Co.',
        category: 'المخبوزات والحبوب',
        categoryEn: 'Flour & Bakery Supplies',
        contactPerson: 'منصور الغامدي',
        phone: '+966509988776',
        email: 'supply@flourmills.sa',
        commercialRegister: '1010778899',
        taxNumber: '300998877600003',
        address: 'الرياض - المدينة الصناعية الثانية',
        city: 'الرياض',
        paymentTerms: 'net_30',
        creditLimit: 30000,
        leadTimeDays: 2,
        onTimeDeliveryRate: 98.0,
        qualityScore: 4.8,
        rating: 5,
        status: 'active',
      });

      expect(newSup.id).toBeDefined();
      expect(newSup.currentBalance).toBe(0);
      expect(newSup.totalPurchasesYTD).toBe(0);

      const fetched = service.getSupplierById(newSup.id);
      expect(fetched).toBeDefined();
      expect(fetched?.nameAr).toBe('شركة مطاحن الدقيق الوطنية');
    });

    it('should update supplier information and rating', () => {
      const updated = service.updateSupplier('sup-almarai', {
        rating: 4.8,
        creditLimit: 65000,
      });

      expect(updated.rating).toBe(4.8);
      expect(updated.creditLimit).toBe(65000);
      expect(service.getSupplierById('sup-almarai')?.creditLimit).toBe(65000);
    });

    it('should delete a supplier', () => {
      const sup = service.addSupplier({
        nameAr: 'مورد مؤقت',
        nameEn: 'Temp Supplier',
        category: 'عام',
        categoryEn: 'General',
        contactPerson: 'محمد',
        phone: '+966500000099',
        email: 'temp@sup.com',
        commercialRegister: '1010999999',
        taxNumber: '300000000000003',
        address: 'الرياض',
        city: 'الرياض',
        paymentTerms: 'cash_on_delivery',
        creditLimit: 5000,
        leadTimeDays: 1,
        onTimeDeliveryRate: 90,
        qualityScore: 4,
        rating: 4,
        status: 'active',
      });

      const deleted = service.deleteSupplier(sup.id);
      expect(deleted).toBe(true);
      expect(service.getSupplierById(sup.id)).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. PURCHASE ORDER LIFECYCLE STATE MACHINE
  // =========================================================================
  describe('2. Purchase Order (PO) Lifecycle State Machine', () => {
    it('should create a new Draft Purchase Order with calculated 15% VAT and totals', () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-almarai',
        deliveryLocation: 'فرع السليمانية - مستودع التبريد',
        items: [
          {
            inventoryItemId: 'raw-dairy-milk',
            inventoryItemNameAr: 'حليب المراعي طازج (كرتون 12 لتر)',
            inventoryItemNameEn: 'Almarai Fresh Milk (12L)',
            sku: 'DAIRY-MILK-12',
            unit: 'box',
            quantityOrdered: 10,
            unitPriceContracted: 50.0,
            taxRate: 0.15,
          },
        ],
      });

      expect(po.id).toBeDefined();
      expect(po.poNumber).toMatch(/^PO-2026-\d+$/);
      expect(po.status).toBe('draft');
      expect(po.subtotal).toBe(500.0);
      expect(po.taxAmount).toBe(75.0);
      expect(po.totalAmount).toBe(575.0);
      expect(po.paidAmount).toBe(0);
    });

    it('should progress from Draft -> Approved', () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-almarai',
        items: [
          {
            inventoryItemId: 'raw-dairy-butter',
            inventoryItemNameAr: 'زبدة المراعي الطبيعية غير مملحة',
            inventoryItemNameEn: 'Almarai Natural Butter',
            sku: 'DAIRY-BUTTER',
            unit: 'kg',
            quantityOrdered: 5,
            unitPriceContracted: 40.0,
            taxRate: 0.15,
          },
        ],
      });

      const approved = service.approvePurchaseOrder(po.id, 'سارة العنزي - مدير المشتريات');
      expect(approved.status).toBe('approved');
      expect(approved.approvedBy).toBe('سارة العنزي - مدير المشتريات');
      expect(approved.approvedAt).toBeDefined();
    });

    it('should throw error when approving a PO that is not in Draft state', () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-almarai',
        items: [
          {
            inventoryItemId: 'raw-dairy-butter',
            inventoryItemNameAr: 'زبدة',
            inventoryItemNameEn: 'Butter',
            sku: 'BUTTER',
            unit: 'kg',
            quantityOrdered: 2,
            unitPriceContracted: 40,
            taxRate: 0.15,
          },
        ],
      });

      service.approvePurchaseOrder(po.id);
      expect(() => service.approvePurchaseOrder(po.id)).toThrowError(/Cannot approve PO in 'approved' status/);
    });

    it('should progress from Approved -> Dispatched', () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-fresh-meat',
        items: [
          {
            inventoryItemId: 'raw-local-lamb',
            inventoryItemNameAr: 'لحم غنم نعيمي',
            inventoryItemNameEn: 'Fresh Naeemi Lamb',
            sku: 'RAW-LAMB-LOCAL',
            unit: 'kg',
            quantityOrdered: 20,
            unitPriceContracted: 65,
            taxRate: 0.15,
          },
        ],
      });

      service.approvePurchaseOrder(po.id);
      const dispatched = service.dispatchPurchaseOrder(po.id, 'تم استلام تأكيد خروج الشاحنة من المسلخ');

      expect(dispatched.status).toBe('dispatched');
      expect(dispatched.dispatchedAt).toBeDefined();
      expect(dispatched.notes).toContain('تأكيد خروج الشاحنة');
    });

    it('should receive goods, create GRN and transition to Received with Quality Inspection', async () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-fresh-meat',
        items: [
          {
            inventoryItemId: 'raw-local-lamb',
            inventoryItemNameAr: 'لحم غنم نعيمي',
            inventoryItemNameEn: 'Fresh Naeemi Lamb',
            sku: 'RAW-LAMB-LOCAL',
            unit: 'kg',
            quantityOrdered: 20,
            unitPriceContracted: 65,
            taxRate: 0.15,
          },
        ],
      });

      service.approvePurchaseOrder(po.id);
      service.dispatchPurchaseOrder(po.id);

      const initialSupBalance = service.getSupplierById('sup-fresh-meat')?.currentBalance || 0;

      const result = await service.receiveGoods(po.id, {
        receivedBy: 'سلطان العتيبي',
        qualityInspection: {
          temperatureCompliant: true,
          measuredTemperature: 2.8,
          packagingIntact: true,
          expiryDateValid: true,
          sensoryInspectionPassed: true,
          inspectorName: 'سلطان العتيبي',
          inspectedAt: new Date().toISOString(),
          inspectionNotes: 'اللحوم طازجة ودرجة الحرارة مطابقة لسلسلة التبريد (2.8°C)',
        },
        itemsReceived: [
          {
            inventoryItemId: 'raw-local-lamb',
            quantityReceived: 20,
            quantityAccepted: 20,
            quantityRejected: 0,
            actualUnitPrice: 65,
            batchNumber: 'MEAT-LOT-992',
          },
        ],
      });

      expect(result.po.status).toBe('received');
      expect(result.po.receivedBy).toBe('سلطان العتيبي');
      expect(result.po.grnNumber).toMatch(/^GRN-2026-\d+$/);
      expect(result.grn.qualityInspection.temperatureCompliant).toBe(true);

      // Supplier balance should increase with PO totalAmount (debt)
      const updatedSup = service.getSupplierById('sup-fresh-meat');
      expect(updatedSup?.currentBalance).toBe(initialSupBalance + result.po.totalAmount);
    });

    it('should cancel a PO with reason', () => {
      const po = service.createPurchaseOrder({
        supplierId: 'sup-almarai',
        items: [
          {
            inventoryItemId: 'item-x',
            inventoryItemNameAr: 'صنف',
            inventoryItemNameEn: 'Item',
            sku: 'X',
            unit: 'kg',
            quantityOrdered: 1,
            unitPriceContracted: 10,
            taxRate: 0.15,
          },
        ],
      });

      const cancelled = service.cancelPurchaseOrder(po.id, 'تم تغيير خطة الإنتاج اليومية');
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.notes).toContain('سبب الإلغاء');
    });
  });

  // =========================================================================
  // 3. THREE-WAY MATCHING ENGINE (PO vs GRN vs INVOICE)
  // =========================================================================
  describe('3. Automated Three-Way Matching Engine (3-Way Match)', () => {
    it('should verify Exact 100% Match between PO, GRN and Supplier Invoice', () => {
      // PO-2026-0801 is already received and seeded
      const invoiceData = {
        invoiceNumber: 'INV-ALM-2026-8812',
        invoiceDate: '2026-08-15T09:00:00.000Z',
        subtotal: 2010.0,
        taxAmount: 301.5,
        totalAmount: 2311.5,
        items: [
          {
            inventoryItemId: 'raw-dairy-burrata',
            itemName: 'حليب كامل الدسم مبستر',
            quantity: 20,
            unitPrice: 48.0,
            taxRate: 0.15,
            total: 1104.0,
          },
          {
            inventoryItemId: 'raw-akkawi-cheese',
            itemName: 'جبن موزاريلا طبيعي مبشور',
            quantity: 30,
            unitPrice: 35.0,
            taxRate: 0.15,
            total: 1207.5,
          },
        ],
      };

      const matchReport = service.performThreeWayMatch('po-2026-0801', invoiceData, 2.0);

      expect(matchReport.status).toBe('exact_match');
      expect(matchReport.totalVariance).toBe(0);
      expect(matchReport.discrepancies.length).toBe(0);
      expect(matchReport.isReadyForPayment).toBe(true);
      expect(matchReport.verdictSummary).toContain('مطابقة تامة 100%');
    });

    it('should detect Quantity Variance when supplier overbills on Invoice', () => {
      const invoiceDataOverbilling = {
        invoiceNumber: 'INV-ALM-OVERBILL-01',
        invoiceDate: '2026-08-15T09:00:00.000Z',
        subtotal: 2490.0,
        taxAmount: 373.5,
        totalAmount: 2863.5,
        items: [
          {
            inventoryItemId: 'raw-dairy-burrata',
            itemName: 'حليب كامل الدسم مبستر',
            quantity: 30, // Overbilled 30 instead of 20!
            unitPrice: 48.0,
            taxRate: 0.15,
            total: 1656.0,
          },
          {
            inventoryItemId: 'raw-akkawi-cheese',
            itemName: 'جبن موزاريلا طبيعي مبشور',
            quantity: 30,
            unitPrice: 35.0,
            taxRate: 0.15,
            total: 1207.5,
          },
        ],
      };

      const matchReport = service.performThreeWayMatch('po-2026-0801', invoiceDataOverbilling, 2.0);

      expect(['discrepancy', 'critical_mismatch']).toContain(matchReport.status);
      expect(matchReport.isReadyForPayment).toBe(false);
      expect(matchReport.discrepancies.length).toBeGreaterThan(0);

      const qtyDiscrepancy = matchReport.discrepancies.find((d) => d.type === 'quantity_variance');
      expect(qtyDiscrepancy).toBeDefined();
      expect(qtyDiscrepancy?.description).toContain('فوترة كمية زائدة');
    });

    it('should detect Price Variance when supplier inflates unit price without notice', () => {
      const invoiceDataPriceInflation = {
        invoiceNumber: 'INV-ALM-PRICE-INFLATION',
        invoiceDate: '2026-08-15T09:00:00.000Z',
        subtotal: 2250.0,
        taxAmount: 337.5,
        totalAmount: 2587.5,
        items: [
          {
            inventoryItemId: 'raw-dairy-burrata',
            itemName: 'حليب كامل الدسم مبستر',
            quantity: 20,
            unitPrice: 60.0, // Raised unit price from 48 to 60!
            taxRate: 0.15,
            total: 1380.0,
          },
          {
            inventoryItemId: 'raw-akkawi-cheese',
            itemName: 'جبن موزاريلا طبيعي مبشور',
            quantity: 30,
            unitPrice: 35.0,
            taxRate: 0.15,
            total: 1207.5,
          },
        ],
      };

      const matchReport = service.performThreeWayMatch('po-2026-0801', invoiceDataPriceInflation, 2.0);

      expect(matchReport.isReadyForPayment).toBe(false);
      const priceDiscrepancy = matchReport.discrepancies.find((d) => d.type === 'price_variance');
      expect(priceDiscrepancy).toBeDefined();
      expect(priceDiscrepancy?.varianceAmount).toBe(240); // (60 - 48) * 20
    });

    it('should detect Unexpected Extra Items in Invoice', () => {
      const invoiceDataExtraItem = {
        invoiceNumber: 'INV-EXTRA-ITEM',
        invoiceDate: '2026-08-15T09:00:00.000Z',
        subtotal: 2510.0,
        taxAmount: 376.5,
        totalAmount: 2886.5,
        items: [
          {
            inventoryItemId: 'raw-dairy-burrata',
            itemName: 'حليب كامل الدسم مبستر',
            quantity: 20,
            unitPrice: 48.0,
            taxRate: 0.15,
            total: 1104.0,
          },
          {
            inventoryItemId: 'raw-akkawi-cheese',
            itemName: 'جبن موزاريلا طبيعي مبشور',
            quantity: 30,
            unitPrice: 35.0,
            taxRate: 0.15,
            total: 1207.5,
          },
          {
            inventoryItemId: 'unexpected-extra-juice',
            itemName: 'عصير برتقال طازج غير مطلوب',
            quantity: 10,
            unitPrice: 50.0,
            taxRate: 0.15,
            total: 575.0,
          },
        ],
      };

      const matchReport = service.performThreeWayMatch('po-2026-0801', invoiceDataExtraItem, 2.0);
      const unexpected = matchReport.discrepancies.find((d) => d.type === 'unexpected_item');
      expect(unexpected).toBeDefined();
      expect(unexpected?.isAcceptable).toBe(false);
    });
  });

  // =========================================================================
  // 4. PAYABLES, AGING ANALYSIS & PAYMENTS
  // =========================================================================
  describe('4. Supplier Payables & Aging Analysis Engine', () => {
    it('should compute aging summary across all received and unpaid POs', () => {
      const aging = service.getPayablesAgingSummary();

      expect(aging).toBeDefined();
      expect(aging.totalOutstanding).toBeGreaterThanOrEqual(0);
      expect(aging.suppliersBreakdown.length).toBeGreaterThanOrEqual(1);
    });

    it('should record payment to supplier and decrement debt balance', () => {
      const sup = service.getSupplierById('sup-almarai');
      const initialBalance = sup?.currentBalance || 12450.0;

      const payment = service.recordSupplierPayment({
        supplierId: 'sup-almarai',
        amount: 2311.5,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'SNB-TRX-889123',
        notes: 'سداد فاتورة المراعي',
      });

      expect(payment.id).toBeDefined();
      expect(payment.paymentNumber).toMatch(/^PAY-2026-\d+$/);
      expect(payment.amount).toBe(2311.5);

      const updatedSup = service.getSupplierById('sup-almarai');
      expect(updatedSup?.currentBalance).toBe(Math.round((initialBalance - 2311.5) * 100) / 100);

      // PO-2026-0801 should now be marked as paid
      const po = service.getPurchaseOrderById('po-2026-0801');
      expect(po?.status).toBe('paid');
      expect(po?.paidAmount).toBe(2311.5);
    });

    it('should generate a complete chronological Supplier Statement of Account', () => {
      const statement = service.getSupplierStatementOfAccount('sup-almarai');

      expect(statement).toBeDefined();
      expect(statement.supplierNameAr).toContain('المراعي');
      expect(statement.transactions.length).toBeGreaterThanOrEqual(1);
      expect(statement.creditLimit).toBe(50000);
    });
  });

  // =========================================================================
  // 5. SMART AUTO-REORDER & REPLENISHMENT
  // =========================================================================
  describe('5. Smart Auto-Replenishment & Batch PO Creation', () => {
    it('should scan low stock items and group reorders by supplier', async () => {
      const suggestions = await service.generateAutoReorderSuggestions();

      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      const firstGroup = suggestions[0];
      expect(firstGroup.supplierId).toBeDefined();
      expect(firstGroup.items.length).toBeGreaterThanOrEqual(1);
      expect(firstGroup.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('should batch create draft POs for suggested low stock items', async () => {
      const initialCount = service.getPurchaseOrders().length;
      const createdPOs = await service.createDraftOrdersFromSuggestions();

      expect(createdPOs.length).toBeGreaterThanOrEqual(1);
      expect(service.getPurchaseOrders().length).toBe(initialCount + createdPOs.length);
      expect(createdPOs[0].status).toBe('draft');
    });
  });

  // =========================================================================
  // 6. PAPERLESS OCR & REPORTING
  // =========================================================================
  describe('6. Paperless OCR & Reporting', () => {
    it('should simulate AI OCR scan of supplier tax invoice with ZATCA QR validation', () => {
      const scan = service.simulateOcrInvoiceScan();

      expect(scan.success).toBe(true);
      expect(scan.extractedInvoice.invoiceNumber).toBeDefined();
      expect(scan.extractedInvoice.taxNumber).toBeDefined();
      expect(scan.extractedInvoice.zatcaQrValid).toBe(true);
      expect(scan.extractedInvoice.confidenceScore).toBeGreaterThan(0.9);
      expect(scan.extractedInvoice.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should export procurement report in JSON and CSV formats', () => {
      const jsonReport = service.exportProcurementReport('json');
      expect(jsonReport).toBeTypeOf('string');
      const parsed = JSON.parse(jsonReport);
      expect(parsed.metrics).toBeDefined();
      expect(parsed.suppliers).toBeDefined();
      expect(parsed.purchaseOrders).toBeDefined();

      const csvReport = service.exportProcurementReport('csv');
      expect(csvReport).toContain('PO Number,Supplier,Status');
    });

    it('should calculate accurate overall metrics', () => {
      const metrics = service.getProcurementMetrics();
      expect(metrics.totalMonthlySpend).toBeGreaterThan(0);
      expect(metrics.totalOutstandingDebt).toBeGreaterThan(0);
      expect(metrics.supplierCount).toBeGreaterThanOrEqual(5);
      expect(metrics.threeWayMatchSuccessRate).toBeGreaterThanOrEqual(0);
    });
  });
});
