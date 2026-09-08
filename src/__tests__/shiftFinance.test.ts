import { describe, it, expect, beforeEach } from 'vitest';
import {
  shiftService,
  SAR_DENOMINATIONS,
  PETTY_CASH_CATEGORIES,
  DEFAULT_BRANCH_INFO,
} from '../services/shiftService';
import { useShiftStore } from '../stores/useShiftStore';
import { eventBus } from '../services/eventBus';
import { CashDenominationMap, ShiftSession } from '../types/shift';

// Polyfill localStorage in test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0,
  } as Storage;
}

/**
 * Utility helper to decode ZATCA TLV Base64 payload into parsed tags.
 */
function parseZatcaTlv(base64Str: string): Map<number, string> {
  const bytes = Buffer.from(base64Str, 'base64');
  const utf8Decoder = new TextDecoder('utf-8');
  const tagsMap = new Map<number, string>();

  let offset = 0;
  while (offset < bytes.length) {
    const tag = bytes[offset];
    const length = bytes[offset + 1];
    const valueBytes = bytes.subarray(offset + 2, offset + 2 + length);
    const valueStr = utf8Decoder.decode(valueBytes);

    tagsMap.set(tag, valueStr);
    offset += 2 + length;
  }

  return tagsMap;
}

describe('Shift Management & Digital Cash Drawer System', () => {
  beforeEach(() => {
    localStorage.clear();
    useShiftStore.setState({
      currentShift: null,
      shiftHistory: [],
      zReports: [],
      activeReportModal: null,
      activeTab: 'active_shift',
    });
  });

  describe('1. Egyptian Pound (EGP) Denominations & Blind Cash Count', () => {
    it('should support all standard central bank banknotes and coins', () => {
      const values = SAR_DENOMINATIONS.map((d) => d.value);
      expect(values).toContain(200);
      expect(values).toContain(100);
      expect(values).toContain(50);
      expect(values).toContain(20);
      expect(values).toContain(10);
      expect(values).toContain(5);
      expect(values).toContain(1);
      expect(values).toContain(0.5);
      expect(values).toContain(0.25);
      expect(SAR_DENOMINATIONS.length).toBe(9);
    });

    it('should calculate exact denomination total from mixed banknote counts', () => {
      const countMap: CashDenominationMap = {
        200: 10, // 2000
        100: 10, // 1000
        50: 8,   // 400
        20: 10,  // 200
        10: 15,  // 150
        5: 20,   // 100
      };

      const total = shiftService.calculateDenominationTotal(countMap);
      expect(total).toBe(3850.0);
    });

    it('should calculate exact denomination total from mixed coin counts (halalas & riyals)', () => {
      const countMap: CashDenominationMap = {
        2: 25,    // 50
        1: 40,    // 40
        0.5: 30,  // 15
        0.25: 12, // 3
      };

      const total = shiftService.calculateDenominationTotal(countMap);
      expect(total).toBe(108.0);
    });

    it('should return 0 when denomination counts are empty or zeroes', () => {
      const emptyMap: CashDenominationMap = { 500: 0, 100: 0, 50: 0 };
      expect(shiftService.calculateDenominationTotal(emptyMap)).toBe(0);
      expect(shiftService.calculateDenominationTotal({})).toBe(0);
    });
  });

  describe('2. Cash Drawer Flow & Expected Balance Mathematics', () => {
    it('should compute expected cash correctly: Float + Cash Sales + In - Out - Petty Cash - Safe Drops - Refunds', () => {
      const openingFloat = 500.0;
      const cashSales = 1200.0;

      const movements = [
        shiftService.createCashMovement('sh_1', 'drw_1', {
          type: 'cash_in',
          amount: 300.0,
          reason: 'تغذية نقدية من الخزينة',
          performedBy: 'emp_01',
        }),
        shiftService.createCashMovement('sh_1', 'drw_1', {
          type: 'petty_cash',
          amount: 85.5,
          reason: 'مشتريات طارئة ونعناع طازج',
          category: 'emergency_purchase',
          performedBy: 'emp_01',
        }),
        shiftService.createCashMovement('sh_1', 'drw_1', {
          type: 'safe_drop',
          amount: 700.0,
          reason: 'ترحيل فائض السيولة للخزينة',
          performedBy: 'emp_01',
        }),
        shiftService.createCashMovement('sh_1', 'drw_1', {
          type: 'cash_out',
          amount: 50.0,
          reason: 'سحب مالي مصرح',
          performedBy: 'emp_01',
        }),
      ];

      const cashRefunds = 40.0;

      // Expected = 500 + 1200 + 300 - 50 - 85.5 - 700 - 40 = 1124.50
      const expected = shiftService.calculateExpectedCash(
        openingFloat,
        cashSales,
        movements,
        cashRefunds
      );

      expect(expected).toBe(1124.5);
    });

    it('should never return negative expected cash under extreme payouts', () => {
      const openingFloat = 100.0;
      const cashSales = 0;
      const movements = [
        shiftService.createCashMovement('sh_1', 'drw_1', {
          type: 'cash_out',
          amount: 500.0,
          reason: 'سحب كبير',
          performedBy: 'emp_01',
        }),
      ];

      const expected = shiftService.calculateExpectedCash(openingFloat, cashSales, movements, 0);
      expect(expected).toBe(0);
    });
  });

  describe('3. Variance & Discrepancy Detection (Shortage vs Overage)', () => {
    it('should evaluate exact match as balanced with zero difference', () => {
      const result = shiftService.calculateVariance(1500.0, 1500.0);
      expect(result.status).toBe('balanced');
      expect(result.difference).toBe(0);
      expect(result.needsSupervisorApproval).toBe(false);
    });

    it('should evaluate cash surplus correctly', () => {
      const result = shiftService.calculateVariance(1000.0, 1025.5);
      expect(result.status).toBe('overage');
      expect(result.difference).toBe(25.5);
      expect(result.percentage).toBe(2.55);
      expect(result.needsSupervisorApproval).toBe(true); // > 20 threshold
    });

    it('should evaluate cash shortage and flag supervisor approval requirement', () => {
      const result = shiftService.calculateVariance(1000.0, 970.0);
      expect(result.status).toBe('shortage');
      expect(result.difference).toBe(-30.0);
      expect(result.needsSupervisorApproval).toBe(true);
    });

    it('should flag supervisor approval for shortage >= 5.0 SAR even if threshold is 20 SAR', () => {
      const result = shiftService.calculateVariance(500.0, 492.0, 20.0);
      expect(result.status).toBe('shortage');
      expect(result.difference).toBe(-8.0);
      expect(result.needsSupervisorApproval).toBe(true);
    });
  });

  describe('4. ZATCA Phase 2 TLV QR Code & Cryptographic Hashing', () => {
    it('should encode ZATCA Phase 2 TLV QR payload with Arabic seller name and VAT info', () => {
      const base64 = shiftService.generateZatcaTlvBase64(
        'مطعم السلطان الفاخر للمأكولات الملكية',
        '310123456700003',
        '2026-08-16T12:00:00Z',
        4600.0,
        600.0
      );

      expect(base64).toBeDefined();
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(30);

      const parsed = parseZatcaTlv(base64);
      expect(parsed.get(1)).toBe('مطعم السلطان الفاخر للمأكولات الملكية');
      expect(parsed.get(2)).toBe('310123456700003');
      expect(parsed.get(3)).toBe('2026-08-16T12:00:00Z');
      expect(parsed.get(4)).toBe('4600.00');
      expect(parsed.get(5)).toBe('600.00');
    });

    it('should generate deterministic 32-character SHA-256 cryptographic hash', () => {
      const payload = 'Z-20260816-0001|shift_123|5000.00|652.17|2026-08-16T13:00:00Z';
      const hash1 = shiftService.generateCryptographicHash(payload);
      const hash2 = shiftService.generateCryptographicHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32);
      expect(hash1).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('5. X-Report (Mid-Shift Inspection Reading)', () => {
    it('should generate valid X-Report preserving active open shift state', () => {
      const shift = shiftService.createNewShift({
        cashierId: 'emp_01',
        cashierName: 'سلطان الشمري',
        openingFloat: 500.0,
      });

      shift.salesSummary = {
        grossSales: 2300.0,
        netSales: 2000.0,
        vatAmount: 300.0,
        discountAmount: 50.0,
        refundAmount: 0,
        voidAmount: 0,
        ordersCount: 15,
        guestCount: 30,
        averageTicket: 153.33,
      };

      shift.paymentBreakdown.cash = { count: 6, total: 800.0 };
      shift.paymentBreakdown.mada = { count: 9, total: 1500.0 };

      const xReport = shiftService.generateXReport(shift);

      expect(xReport.reportType).toBe('X_REPORT');
      expect(xReport.reportNumber).toMatch(/^X-\d{8}-\d{4}$/);
      expect(xReport.sales.grossSales).toBe(2300.0);
      expect(xReport.sales.vatAmount).toBe(300.0);
      expect(xReport.payments.cash.total).toBe(800.0);
      expect(xReport.payments.mada.total).toBe(1500.0);
      expect(xReport.cashReconciliation.openingFloat).toBe(500.0);
      expect(xReport.cashReconciliation.expectedCash).toBe(1300.0); // 500 + 800
      expect(xReport.zatca.qrCodePayload).toBeDefined();
      expect(xReport.zatca.cryptographicHash).toHaveLength(32);
    });
  });

  describe('6. Z-Report & Final Shift Closing with Audit Trail', () => {
    let capturedEvents: { event: string; payload: any }[] = [];

    beforeEach(() => {
      capturedEvents = [];
      eventBus.on('SHIFT_CLOSED', (evt) => { capturedEvents.push({ event: 'SHIFT_CLOSED', payload: evt.payload }); });
      eventBus.on('Z_REPORT_GENERATED', (evt) => { capturedEvents.push({ event: 'Z_REPORT_GENERATED', payload: evt.payload }); });
    });

    it('should generate official Z-Report, close the shift, and emit reactive events', () => {
      const shift = shiftService.createNewShift({
        cashierId: 'emp_02',
        cashierName: 'أحمد الغامدي',
        openingFloat: 600.0,
      });

      shift.salesSummary = {
        grossSales: 3450.0,
        netSales: 3000.0,
        vatAmount: 450.0,
        discountAmount: 100.0,
        refundAmount: 0,
        voidAmount: 0,
        ordersCount: 22,
        guestCount: 50,
        averageTicket: 156.82,
      };

      shift.paymentBreakdown.cash = { count: 8, total: 1000.0 };
      shift.paymentBreakdown.mada = { count: 14, total: 2450.0 };

      // Denominations counted: 3x 500 + 1x 100 = 1600.0 (Matches 600 float + 1000 cash sales)
      const denominations: CashDenominationMap = {
        500: 3,
        100: 1,
      };

      const { report, closedShift } = shiftService.generateZReport(shift, {
        denominations,
        countedBy: 'emp_02',
        countedByName: 'أحمد الغامدي',
        notes: 'إغلاق وردية العشاء بدون أي فروقات',
      });

      expect(report.reportType).toBe('Z_REPORT');
      expect(report.reportNumber).toMatch(/^Z-\d{8}-\d{4}$/);
      expect(report.sales.grossSales).toBe(3450.0);
      expect(report.cashReconciliation.actualCash).toBe(1600.0);
      expect(report.cashReconciliation.expectedCash).toBe(1600.0);
      expect(report.cashReconciliation.difference).toBe(0);
      expect(report.cashReconciliation.status).toBe('balanced');

      expect(closedShift.status).toBe('closed');
      expect(closedShift.blindCount?.totalCounted).toBe(1600.0);
      expect(closedShift.zReportId).toBe(report.id);

      // Verify event bus broadcast
      expect(capturedEvents.some((e) => e.event === 'SHIFT_CLOSED')).toBe(true);
      expect(capturedEvents.some((e) => e.event === 'Z_REPORT_GENERATED')).toBe(true);
    });

    it('should record supervisor approval in Z-Report when cash shortage occurs', () => {
      const shift = shiftService.createNewShift({
        cashierId: 'emp_01',
        cashierName: 'سلطان الشمري',
        openingFloat: 500.0,
      });

      shift.paymentBreakdown.cash = { count: 5, total: 500.0 }; // Expected = 1000.0

      // Counted = 950.0 (-50 shortage)
      const denominations: CashDenominationMap = {
        500: 1,
        200: 2,
        50: 1,
      };

      const { report, closedShift } = shiftService.generateZReport(shift, {
        denominations,
        countedBy: 'emp_01',
        notes: 'عجز في فكة الطاولات',
        supervisorApproval: {
          approvedBy: 'مدير الصالة فهد',
          reason: 'تم التحقق من العجز والموافقة عليه بعد مراجعة كاميرات الصندوق',
        },
      });

      expect(report.cashReconciliation.difference).toBe(-50.0);
      expect(report.cashReconciliation.status).toBe('shortage');
      expect(report.supervisorApproval).toBeDefined();
      expect(report.supervisorApproval?.approvedBy).toBe('مدير الصالة فهد');
      expect(closedShift.variance?.isApproved).toBe(true);
    });
  });

  describe('7. Thermal Receipt Layout & CSV Export Engine', () => {
    it('should format 80mm ESC/POS HTML string containing all ZATCA and financial sections', () => {
      const sample = shiftService.createSampleActiveShift();
      const report = shiftService.generateXReport(sample);
      const receiptHtml = shiftService.formatThermalReceiptHtml(report);

      expect(receiptHtml).toContain(report.branch.nameAr);
      expect(receiptHtml).toContain(DEFAULT_BRANCH_INFO.vatNumber);
      expect(receiptHtml).toContain(report.reportNumber);
      expect(receiptHtml.toUpperCase()).toContain('X-REPORT');
      expect(receiptHtml).toContain('ملخص المبيعات والضرائب');
      expect(receiptHtml).toContain('مطابقة الصندوق والجرد');
      expect(receiptHtml).toContain(report.zatca.qrCodeUrl);
      expect(receiptHtml).toContain(report.zatca.cryptographicHash);
    });

    it('should export well-structured CSV spreadsheet with all ledger metrics', () => {
      const sample = shiftService.createSampleActiveShift();
      const report = shiftService.generateXReport(sample);
      const csv = shiftService.exportReportToCsv(report);

      expect(csv).toContain('RESTAURANT OS - SHIFT CLOSING REPORT');
      expect(csv).toContain(`Report Number,${report.reportNumber}`);
      expect(csv).toContain(`Gross Sales,${report.sales.grossSales}`);
      expect(csv).toContain(`VAT 15%,${report.sales.vatAmount}`);
      expect(csv).toContain(`Cash Amount,${report.payments.cash.total}`);
      expect(csv).toContain(`Mada Amount,${report.payments.mada.total}`);
      expect(csv).toContain(`Cryptographic Hash,${report.zatca.cryptographicHash}`);
    });
  });

  describe('8. Zustand `useShiftStore` Reactive Lifecycle', () => {
    it('should open a shift and initialize active state', () => {
      const store = useShiftStore.getState();
      const newShift = store.openShift({
        cashierId: 'cashier_99',
        cashierName: 'فاطمة العلي',
        openingFloat: 750.0,
      });

      expect(newShift).toBeDefined();
      expect(useShiftStore.getState().currentShift?.openingFloat).toBe(750.0);
      expect(useShiftStore.getState().currentShift?.status).toBe('open');
      expect(useShiftStore.getState().getExpectedCash()).toBe(750.0);
    });

    it('should record cash movements and update drawer kick counts', () => {
      const store = useShiftStore.getState();
      store.openShift({
        cashierId: 'c1',
        cashierName: 'خالد',
        openingFloat: 500.0,
      });

      const movement = store.addCashMovement({
        type: 'petty_cash',
        amount: 60.0,
        reason: 'شراء قوالب ثلج طارئة',
        category: 'ice_delivery',
        performedBy: 'c1',
      });

      expect(movement).toBeDefined();
      expect(useShiftStore.getState().currentShift?.cashMovements).toHaveLength(1);
      expect(useShiftStore.getState().currentShift?.cashMovements[0].amount).toBe(60.0);
      expect(useShiftStore.getState().getExpectedCash()).toBe(440.0); // 500 - 60
    });

    it('should update active shift totals automatically when ORDER_PAID event is published', () => {
      const store = useShiftStore.getState();
      store.openShift({
        cashierId: 'c1',
        cashierName: 'فيصل',
        openingFloat: 500.0,
      });

      // Emit POS order paid event
      eventBus.publish(
        'ORDER_PAID',
        {
          order: {
            id: 'ord_123',
            orderNumber: '#4021',
            totalAmount: 230.0,
            guestCount: 3,
          } as any,
          paymentMethod: 'cash',
          amount: 230.0,
        },
        'pos'
      );

      const shift = useShiftStore.getState().currentShift;
      expect(shift?.salesSummary.grossSales).toBe(230.0);
      expect(shift?.salesSummary.ordersCount).toBe(1);
      expect(shift?.salesSummary.guestCount).toBe(3);
      expect(shift?.paymentBreakdown.cash.total).toBe(230.0);
      expect(shift?.paymentBreakdown.cash.count).toBe(1);
      expect(useShiftStore.getState().getExpectedCash()).toBe(730.0); // 500 float + 230 cash
    });

    it('should close shift and archive to shift history & zReports list', () => {
      const store = useShiftStore.getState();
      store.openShift({
        cashierId: 'c1',
        cashierName: 'محمد',
        openingFloat: 500.0,
      });

      store.updateDenominationCount(500, 1); // 500 counted

      const result = store.closeShift({
        denominations: { 500: 1 },
        countedBy: 'c1',
        notes: 'إغلاق نهائي',
      });

      expect(result).not.toBeNull();
      expect(useShiftStore.getState().currentShift).toBeNull();
      expect(useShiftStore.getState().shiftHistory).toHaveLength(1);
      expect(useShiftStore.getState().zReports).toHaveLength(1);
      expect(useShiftStore.getState().zReports[0].reportNumber).toMatch(/^Z-/);
    });
  });
});
