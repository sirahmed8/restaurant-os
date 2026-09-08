import { describe, it, expect, beforeEach } from 'vitest';
import { customer360Service } from '../services/customer360Service';
import { staffPayrollService } from '../services/staffPayrollService';

describe('360° Customer & Staff Dossier Engine Suite', () => {
  beforeEach(() => {
    customer360Service.resetForTesting();
    staffPayrollService.resetForTesting();
  });

  describe('1. 360° Customer Dossier & Allergy Auto-Shield', () => {
    it('should retrieve customer by phone and ID', () => {
      const cust = customer360Service.getCustomerById('cust_01');
      expect(cust).toBeDefined();
      expect(cust?.name).toBe('سلطان المقرن');
      expect(cust?.tier).toBe('VIP_BLACK');

      const byPhone = customer360Service.getCustomerByPhone('+966 55 491 2233');
      expect(byPhone?.id).toBe('cust_01');
    });

    it('should toggle and enforce allergen health shields', () => {
      const updated = customer360Service.toggleAllergen('cust_01', 'peanuts');
      expect(updated?.allergens).toContain('peanuts');

      const removed = customer360Service.toggleAllergen('cust_01', 'peanuts');
      expect(removed?.allergens).not.toContain('peanuts');
    });

    it('should record orders, increment LTV, calculate points and upgrade tier', () => {
      const order = {
        orderId: 'ord_999',
        orderNumber: 'ORD-9999',
        date: '2026-08-16 15:00',
        total: 1000,
        channel: 'dine_in' as const,
        tableNumber: 'T-01',
        items: [
          { nameAr: 'ستيك ريب آي واغيو A5 فاخر', nameEn: 'Wagyu Ribeye Steak A5', quantity: 2, unitPrice: 280 },
          { nameAr: 'عصير رمان طبيعي مثلج', nameEn: 'Fresh Pomegranate Juice', quantity: 2, unitPrice: 20 },
        ],
      };

      const cust = customer360Service.recordOrder('cust_03', order);
      expect(cust?.visitsCount).toBe(10);
      expect(cust?.totalSpent).toBe(3900); // 2900 + 1000
      expect(cust?.points).toBe(950); // 850 + 100
      expect(cust?.tier).toBe('SILVER');
    });

    it('should redeem loyalty points for discount voucher codes', () => {
      const res = customer360Service.redeemPointsForVoucher('cust_01', 500, 25);
      expect(res.success).toBe(true);
      expect(res.voucher?.code).toContain('LOYALTY-25');
      expect(res.voucher?.discountPercent).toBe(25);

      const cust = customer360Service.getCustomerById('cust_01');
      expect(cust?.points).toBe(4350); // 4850 - 500
    });
  });

  describe('2. 360° Staff Dossier, Tip Pool & Automated Payroll', () => {
    it('should toggle staff shift status', () => {
      const member = staffPayrollService.toggleShiftStatus('st_1');
      expect(member?.status).toBe('break');

      const offShift = staffPayrollService.toggleShiftStatus('st_1');
      expect(offShift?.status).toBe('off_shift');
    });

    it('should process staff advance loan requests and manager approval', () => {
      const adv = staffPayrollService.requestAdvance('st_3', 300, 'سلفة بنزين');
      expect(adv.status).toBe('pending');

      const approved = staffPayrollService.approveAdvance('st_3', adv.id, 'مدير المطعم');
      expect(approved).toBe(true);

      const staff = staffPayrollService.getStaffById('st_3');
      expect(staff?.advances.find((a) => a.id === adv.id)?.status).toBe('approved');
    });

    it('should distribute tip pool evenly among on-shift staff', () => {
      const distribution = staffPayrollService.distributeTipPool(600, ['st_1', 'st_2', 'st_3']);
      expect(distribution).toHaveLength(3);
      expect(distribution[0].tipShare).toBe(200);

      const st1 = staffPayrollService.getStaffById('st_1');
      expect(st1?.accumulatedTips).toBe(520); // 320 + 200
    });

    it('should generate accurate digital payslip with deductions and overtime', () => {
      const payslip = staffPayrollService.generatePayslip('st_2', '2026-08');
      expect(payslip).toBeDefined();
      expect(payslip?.baseSalary).toBe(8200);
      expect(payslip?.advancesDeducted).toBe(500);
      expect(payslip?.overtimePay).toBe(12 * 40 * 1.5); // 720
      expect(payslip?.netSalary).toBe(8200 + 720 + 280 + 500 - 500); // 9200
    });

    it('should toggle digital station checklist tasks', () => {
      const ok = staffPayrollService.toggleChecklistItem('chk_opening', '4', 'سارة المنصور');
      expect(ok).toBe(true);

      const checklists = staffPayrollService.getChecklists();
      const item = checklists[0].items.find((i) => i.id === '4');
      expect(item?.isCompleted).toBe(true);
      expect(item?.completedBy).toBe('سارة المنصور');
    });
  });
});
