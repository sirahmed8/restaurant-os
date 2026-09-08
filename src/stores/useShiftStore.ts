/**
 * =====================================================================
 * RESTAURANT OS — SHIFT & DIGITAL CASH DRAWER STORE (ZUSTAND)
 * =====================================================================
 * Manages active shift life cycle, cash movements, interactive SAR
 * denomination counters, payment breakdowns, X/Z-Reports, and drawer kicks.
 */

import { create } from 'zustand';
import {
  ShiftSession,
  CashMovement,
  CashDenominationMap,
  ZReportRecord,
  OpenShiftParams,
  AddCashMovementParams,
  CloseShiftParams,
  PaymentMethodBreakdown,
} from '../types/shift';
import { shiftService, SAR_DENOMINATIONS } from '../services/shiftService';
import { eventBus } from '../services/eventBus';
import { firebaseService } from '../services/firebaseService';

export type ShiftActiveTab =
  | 'active_shift'
  | 'blind_count'
  | 'cash_ledger'
  | 'payment_analytics'
  | 'history';

interface ShiftState {
  currentShift: ShiftSession | null;
  shiftHistory: ShiftSession[];
  zReports: ZReportRecord[];
  activeReportModal: ZReportRecord | null;
  blindCountMap: CashDenominationMap;
  activeTab: ShiftActiveTab;
  isLoading: boolean;

  // Actions
  loadInitialData: () => void;
  openShift: (params: OpenShiftParams) => ShiftSession;
  closeShift: (params: CloseShiftParams) => { report: ZReportRecord; closedShift: ShiftSession } | null;
  addCashMovement: (params: AddCashMovementParams) => CashMovement | null;
  updateDenominationCount: (denomination: number, count: number) => void;
  incrementDenominationCount: (denomination: number, delta: number) => void;
  resetBlindCount: () => void;
  recordOrderPayment: (paymentMethod: string, amount: number, guestCount?: number, orderNumber?: string) => void;
  recordOrderRefund: (paymentMethod: string, amount: number) => void;
  generateXReport: () => ZReportRecord | null;
  kickCashDrawer: () => Promise<void>;
  setActiveTab: (tab: ShiftActiveTab) => void;
  setActiveReportModal: (report: ZReportRecord | null) => void;
  getExpectedCash: () => number;
  getCountedCash: () => number;
  getVariance: () => ReturnType<typeof shiftService.calculateVariance>;
  resetToSampleData: () => void;
}

const STORAGE_ACTIVE_KEY = 'restaurant_os_active_shift_v2';
const STORAGE_HISTORY_KEY = 'restaurant_os_shift_history_v2';
const STORAGE_REPORTS_KEY = 'restaurant_os_zreports_v2';

const createEmptyDenominationMap = (): CashDenominationMap => {
  const map: CashDenominationMap = {};
  SAR_DENOMINATIONS.forEach((d) => {
    map[d.value] = 0;
  });
  return map;
};

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  shiftHistory: [],
  zReports: [],
  activeReportModal: null,
  blindCountMap: createEmptyDenominationMap(),
  activeTab: 'active_shift',
  isLoading: false,

  loadInitialData: () => {
    try {
      let activeShift: ShiftSession | null = null;
      let shiftHistory: ShiftSession[] = [];
      let zReports: ZReportRecord[] = [];

      if (typeof window !== 'undefined') {
        const savedActive = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (savedActive) {
          try {
            activeShift = JSON.parse(savedActive);
          } catch (e) {
            console.error('Error parsing saved active shift', e);
          }
        }

        const savedHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
        if (savedHistory) {
          try {
            shiftHistory = JSON.parse(savedHistory);
          } catch (e) {
            console.error('Error parsing saved history', e);
          }
        }

        const savedReports = localStorage.getItem(STORAGE_REPORTS_KEY);
        if (savedReports) {
          try {
            zReports = JSON.parse(savedReports);
          } catch (e) {
            console.error('Error parsing saved reports', e);
          }
        }
      }

      set({
        currentShift: activeShift,
        shiftHistory,
        zReports,
      });
    } catch (err) {
      console.error('[useShiftStore] loadInitialData failed:', err);
    }
  },

  openShift: (params) => {
    const newShift = shiftService.createNewShift(params);
    const emptyCount = createEmptyDenominationMap();

    set({
      currentShift: newShift,
      blindCountMap: emptyCount,
      activeTab: 'active_shift',
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(newShift));
    }

    // Realtime Cloud Sync
    firebaseService.syncShift('cairo-main', newShift);
    firebaseService.trackEvent('shift_opened', { shift_id: newShift.id, cashier: newShift.cashierName });

    return newShift;
  },

  closeShift: (params) => {
    const { currentShift, shiftHistory, zReports } = get();
    if (!currentShift) return null;

    const { report, closedShift } = shiftService.generateZReport(currentShift, params);

    const updatedHistory = [closedShift, ...shiftHistory];
    const updatedReports = [report, ...zReports];

    set({
      currentShift: null,
      shiftHistory: updatedHistory,
      zReports: updatedReports,
      activeReportModal: report,
      blindCountMap: createEmptyDenominationMap(),
      activeTab: 'history',
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_KEY);
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(updatedReports));
    }

    // Realtime Cloud Sync of Z-Report & Closed Shift to Owner Central Portal
    firebaseService.syncShift('cairo-main', closedShift);
    firebaseService.syncRecord(`z_reports/cairo-main/${report.id}`, report);
    firebaseService.trackEvent('shift_closed_z_report', {
      shift_id: closedShift.id,
      net_sales: report.sales?.netSales || 0,
      variance: report.cashReconciliation?.difference || 0,
    });

    return { report, closedShift };
  },

  addCashMovement: (params) => {
    const { currentShift } = get();
    if (!currentShift) return null;

    const movement = shiftService.createCashMovement(
      currentShift.id,
      currentShift.drawerId,
      params
    );

    const updatedMovements = [movement, ...currentShift.cashMovements];
    const updatedShift: ShiftSession = {
      ...currentShift,
      cashMovements: updatedMovements,
      drawerKicksCount: currentShift.drawerKicksCount + 1,
      updatedAt: new Date().toISOString(),
    };

    set({ currentShift: updatedShift });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(updatedShift));
    }

    return movement;
  },

  updateDenominationCount: (denomination, count) => {
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    set((state) => ({
      blindCountMap: {
        ...state.blindCountMap,
        [denomination]: safeCount,
      },
    }));
  },

  incrementDenominationCount: (denomination, delta) => {
    set((state) => {
      const current = state.blindCountMap[denomination] || 0;
      const next = Math.max(0, current + delta);
      return {
        blindCountMap: {
          ...state.blindCountMap,
          [denomination]: next,
        },
      };
    });
  },

  resetBlindCount: () => {
    set({ blindCountMap: createEmptyDenominationMap() });
  },

  recordOrderPayment: (paymentMethod, amount, guestCount = 1, orderNumber) => {
    const { currentShift } = get();
    if (!currentShift || currentShift.status !== 'open') return;

    const methodKey = paymentMethod.toLowerCase();
    const payments = { ...currentShift.paymentBreakdown };
    const sales = { ...currentShift.salesSummary };

    // Update sales totals
    sales.grossSales = Number((sales.grossSales + amount).toFixed(2));
    sales.netSales = Number((sales.grossSales / 1.15).toFixed(2));
    sales.vatAmount = Number((sales.grossSales - sales.netSales).toFixed(2));
    sales.ordersCount += 1;
    sales.guestCount += guestCount;
    sales.averageTicket = Number((sales.grossSales / sales.ordersCount).toFixed(2));

    // Update payment method mapping
    let targetMethod: keyof PaymentMethodBreakdown = 'other';
    if (methodKey.includes('cash') || methodKey === 'نقدي') {
      targetMethod = 'cash';
    } else if (methodKey.includes('mada') || methodKey === 'مدى') {
      targetMethod = 'mada';
    } else if (methodKey.includes('visa') || methodKey.includes('master') || methodKey.includes('card')) {
      targetMethod = 'visa_master';
    } else if (methodKey.includes('apple') || methodKey.includes('apple_pay')) {
      targetMethod = 'apple_pay';
    } else if (methodKey.includes('jahez') || methodKey.includes('جاهز')) {
      targetMethod = 'delivery_jahez';
    } else if (methodKey.includes('hunger') || methodKey.includes('هنقرستيشن')) {
      targetMethod = 'delivery_hungerstation';
    } else if (methodKey.includes('keeta') || methodKey.includes('كيتا')) {
      targetMethod = 'delivery_keeta';
    } else if (methodKey.includes('chefz') || methodKey.includes('شفز')) {
      targetMethod = 'delivery_chefz';
    } else if (methodKey.includes('gift') || methodKey.includes('هدية')) {
      targetMethod = 'gift_card';
    } else if (methodKey.includes('point') || methodKey.includes('نقاط')) {
      targetMethod = 'loyalty_points';
    } else if (methodKey.includes('credit') || methodKey.includes('آجل')) {
      targetMethod = 'store_credit';
    }

    const currentChannel = payments[targetMethod] || { count: 0, total: 0 };
    payments[targetMethod] = {
      count: currentChannel.count + 1,
      total: Number((currentChannel.total + amount).toFixed(2)),
    };

    const updatedShift: ShiftSession = {
      ...currentShift,
      salesSummary: sales,
      paymentBreakdown: payments,
      drawerKicksCount: targetMethod === 'cash' ? currentShift.drawerKicksCount + 1 : currentShift.drawerKicksCount,
      lastInvoiceNumber: orderNumber || currentShift.lastInvoiceNumber,
      firstInvoiceNumber: currentShift.firstInvoiceNumber || orderNumber,
      updatedAt: new Date().toISOString(),
    };

    set({ currentShift: updatedShift });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(updatedShift));
    }
  },

  recordOrderRefund: (paymentMethod, amount) => {
    const { currentShift } = get();
    if (!currentShift || currentShift.status !== 'open') return;

    const sales = { ...currentShift.salesSummary };
    sales.refundAmount = Number((sales.refundAmount + amount).toFixed(2));
    sales.grossSales = Number(Math.max(0, sales.grossSales - amount).toFixed(2));
    sales.netSales = Number((sales.grossSales / 1.15).toFixed(2));
    sales.vatAmount = Number((sales.grossSales - sales.netSales).toFixed(2));

    const updatedShift: ShiftSession = {
      ...currentShift,
      salesSummary: sales,
      updatedAt: new Date().toISOString(),
    };

    set({ currentShift: updatedShift });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(updatedShift));
    }
  },

  generateXReport: () => {
    const { currentShift } = get();
    if (!currentShift) return null;

    const report = shiftService.generateXReport(currentShift);
    const updatedShift: ShiftSession = {
      ...currentShift,
      xReportCount: currentShift.xReportCount + 1,
      updatedAt: new Date().toISOString(),
    };

    set({
      currentShift: updatedShift,
      activeReportModal: report,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(updatedShift));
    }

    return report;
  },

  kickCashDrawer: async () => {
    const { currentShift } = get();
    if (!currentShift) return;

    const updatedShift: ShiftSession = {
      ...currentShift,
      drawerKicksCount: currentShift.drawerKicksCount + 1,
      updatedAt: new Date().toISOString(),
    };

    set({ currentShift: updatedShift });
    eventBus.publish('CASH_DRAWER_KICKED', { shiftId: currentShift.id }, 'pos');

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(updatedShift));
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveReportModal: (report) => set({ activeReportModal: report }),

  getExpectedCash: () => {
    const { currentShift } = get();
    if (!currentShift) return 0;
    return shiftService.calculateExpectedCash(
      currentShift.openingFloat,
      currentShift.paymentBreakdown.cash.total,
      currentShift.cashMovements,
      currentShift.salesSummary.refundAmount
    );
  },

  getCountedCash: () => {
    const { blindCountMap } = get();
    return shiftService.calculateDenominationTotal(blindCountMap);
  },

  getVariance: () => {
    const expected = get().getExpectedCash();
    const counted = get().getCountedCash();
    return shiftService.calculateVariance(expected, counted);
  },

  resetToSampleData: () => {
    const sampleShift = shiftService.createSampleActiveShift();
    set({
      currentShift: sampleShift,
      blindCountMap: createEmptyDenominationMap(),
      activeTab: 'active_shift',
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(sampleShift));
    }
  },
}));

// Automatically hook into the event bus for real-time POS order syncing
eventBus.on('ORDER_PAID', (evt) => {
  const payload = evt.payload;
  if (!payload) return;
  const store = useShiftStore.getState();
  const paymentMethod = payload.paymentMethod || 'cash';
  const amount = Number(payload.amount || payload.order?.totalAmount || (payload as any).total || 0);
  const guestCount = Number(payload.order?.guestCount || (payload as any).guestCount || 1);
  const orderNumber = payload.order?.orderNumber || (payload as any).orderNumber || payload.order?.id;

  if (amount > 0) {
    store.recordOrderPayment(paymentMethod, amount, guestCount, orderNumber);
  }
});
