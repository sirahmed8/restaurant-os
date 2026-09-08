/**
 * =====================================================================
 * RESTAURANT OS — LUXURY SHIFT MANAGEMENT & DIGITAL CASH DRAWER MODULE
 * =====================================================================
 * Features:
 * 1. Live shift status, duration timer, cashier profile, and quick drawer controls
 * 2. Interactive SAR Cash Denominations Counter (500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.25)
 * 3. Blind Cash Count reconciliation with real-time variance calculation
 * 4. Petty Cash, Safe Drops, Cash In & Cash Out ledger with receipts and categories
 * 5. Payment method comparative analytics (Cash, Mada, Visa, Apple Pay, Jahez, Hungerstation)
 * 6. ZATCA Phase 2 compliant Z-Report & X-Report with QR code, SHA-256 hash, and 80mm thermal printing
 * 7. Searchable shift history and Z-Report reprinting
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Receipt,
  Calculator,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CreditCard,
  Smartphone,
  Truck,
  FileText,
  Search,
  Plus,
  X,
  Building2,
  User,
  Hash,
  Share2,
  ChevronRight,
  Info,
  DollarSign,
  ReceiptText,
} from 'lucide-react';

import { useShiftStore, ShiftActiveTab } from '../../stores/useShiftStore';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import {
  SAR_DENOMINATIONS,
  PETTY_CASH_CATEGORIES,
  shiftService,
} from '../../services/shiftService';
import {
  CashMovementType,
  PettyCashCategory,
  ZReportRecord,
  ShiftSession,
} from '../../types/shift';

export const ShiftModule: React.FC = () => {
  const { language, playSound, activeUser } = useAppStore();
  const t = getTranslation(language);

  const {
    currentShift,
    shiftHistory,
    zReports,
    activeReportModal,
    blindCountMap,
    activeTab,
    openShift,
    closeShift,
    addCashMovement,
    updateDenominationCount,
    incrementDenominationCount,
    resetBlindCount,
    generateXReport,
    kickCashDrawer,
    setActiveTab,
    setActiveReportModal,
    getExpectedCash,
    getCountedCash,
    getVariance,
    loadInitialData,
    resetToSampleData,
  } = useShiftStore();

  // Modal states
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCashMovementModal, setIsCashMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<CashMovementType>('petty_cash');
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [thermalViewMode, setThermalViewMode] = useState<'thermal' | 'a4'>('thermal');

  // Form states
  const [openingFloatInput, setOpeningFloatInput] = useState('500');
  const [openingNotesInput, setOpeningNotesInput] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementCategory, setMovementCategory] = useState<PettyCashCategory>('emergency_purchase');
  const [movementReceipt, setMovementReceipt] = useState('');
  const [movementVendor, setMovementVendor] = useState('');
  const [movementAuthorizedBy, setMovementAuthorizedBy] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorName, setSupervisorName] = useState('مدير الصالة (فهد)');
  const [supervisorReason, setSupervisorReason] = useState('تم التحقق من العجز والموافقة عليه');

  // Elapsed timer state
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!currentShift || !currentShift.openedAt) return;
    const updateTimer = () => {
      const start = new Date(currentShift.openedAt).getTime();
      const now = new Date().getTime();
      setElapsedMinutes(Math.max(1, Math.floor((now - start) / 60000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [currentShift]);

  const expectedCash = getExpectedCash();
  const countedCash = getCountedCash();
  const variance = getVariance();

  // Handlers
  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(openingFloatInput) || 0;
    playSound('cash-register');
    openShift({
      cashierId: activeUser.id || 'emp_01',
      cashierName: language === 'ar' ? activeUser.name : (activeUser.nameEn || activeUser.name),
      drawerId: 'DRW-01',
      branchId: 'RUH-01',
      branchName: language === 'ar' ? 'فرع السليمانية — الرياض' : 'Sulaimaniyah Branch',
      openingFloat: floatAmount,
      notes: openingNotesInput,
    });
    setIsOpenShiftModal(false);
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount) || 0;
    if (amount <= 0 || !movementReason.trim()) return;

    playSound(movementType === 'cash_in' ? 'success' : 'click');
    addCashMovement({
      type: movementType,
      amount,
      reason: movementReason.trim(),
      category: movementType === 'petty_cash' ? movementCategory : undefined,
      receiptNumber: movementReceipt.trim() || undefined,
      vendorName: movementVendor.trim() || undefined,
      performedBy: activeUser.id,
      performedByName: language === 'ar' ? activeUser.name : activeUser.nameEn,
      authorizedBy: movementAuthorizedBy.trim() || undefined,
    });

    // Reset form
    setMovementAmount('');
    setMovementReason('');
    setMovementReceipt('');
    setMovementVendor('');
    setMovementAuthorizedBy('');
    setIsCashMovementModal(false);
  };

  const handleCloseShiftSubmit = () => {
    if (!currentShift) return;

    if (variance.needsSupervisorApproval && (!supervisorPin || supervisorPin.length < 4)) {
      playSound('alert');
      alert(language === 'ar' ? 'يتطلب إغلاق المناوبة بوجود عجز إدخال رمز PIN للمشرف المسؤول' : 'Supervisor PIN is required to close a shift with cash shortage');
      return;
    }

    playSound('success');
    closeShift({
      denominations: { ...blindCountMap },
      countedBy: activeUser.id,
      countedByName: language === 'ar' ? activeUser.name : activeUser.nameEn,
      notes: closingNotes,
      supervisorApproval: variance.needsSupervisorApproval
        ? {
            approvedBy: supervisorName,
            reason: supervisorReason,
          }
        : undefined,
    });

    setIsCloseShiftModal(false);
  };

  const handleGenerateXReport = () => {
    playSound('pop');
    generateXReport();
  };

  const handleKickDrawer = () => {
    playSound('kitchen-bell');
    kickCashDrawer();
  };

  const handlePrintReceipt = (report: ZReportRecord) => {
    playSound('click');
    const html = shiftService.formatThermalReceiptHtml(report);
    const win = window.open('', '_blank', 'width=450,height=700');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        try {
          win.print();
        } catch (e) {
          console.error(e);
        }
      }, 300);
    }
  };

  const handleExportCsv = (report: ZReportRecord) => {
    playSound('success');
    const csv = shiftService.exportReportToCsv(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.reportNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter history
  const filteredHistory = shiftHistory.filter((s) => {
    const q = historySearchQuery.toLowerCase();
    return (
      s.shiftNumber.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      s.branchName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Banner & Active Shift Header */}
      <header className="p-4 sm:p-5 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border-b border-white/5 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Title & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ReceiptText className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {language === 'ar' ? 'إدارة المناوبات وإغلاق الصندوق' : 'Shift & Cash Drawer'}
                </h1>
                {currentShift ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {language === 'ar' ? 'مناوبة نشطة' : 'Active Shift'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    <Lock className="w-3 h-3" />
                    {language === 'ar' ? 'الصندوق مغلق' : 'Drawer Closed'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'جرد أعمى للفئات النقدية (SAR)، تسجيل المصروفات النثرية، وتوليد تقارير Z-Report المعتمدة'
                  : 'SAR blind cash count, petty cash ledger & ZATCA-sealed Z-Reports'}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {currentShift ? (
              <>
                {/* Active Cashier & Time */}
                <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentShift.cashierName}</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1 text-amber-300 font-bold font-mono">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{currentShift.shiftNumber.slice(-7)}</span>
                  </div>
                </div>

                {/* Drawer Kick Button */}
                <button
                  onClick={handleKickDrawer}
                  title={language === 'ar' ? 'فتح الدرج الإلكتروني' : 'Open Cash Drawer'}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{language === 'ar' ? 'فتح الدرج' : 'Kick Drawer'}</span>
                </button>

                {/* Mid-Shift X-Report */}
                <button
                  onClick={handleGenerateXReport}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === 'ar' ? 'تقرير X السريع' : 'X-Report'}</span>
                </button>

                {/* Cash Movement Action */}
                <button
                  onClick={() => {
                    playSound('tap');
                    setMovementType('petty_cash');
                    setIsCashMovementModal(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'حركة نقدية / نثرية' : 'Cash Movement'}</span>
                </button>

                {/* End Shift & Z-Report */}
                <button
                  onClick={() => {
                    playSound('pop');
                    setIsCloseShiftModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إغلاق المناوبة (Z-Report)' : 'Close Shift (Z-Report)'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  playSound('pop');
                  setIsOpenShiftModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'فتح مناوبة جديدة الآن' : 'Open New Shift Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'active_shift', labelAr: 'المناوبة الحالية', labelEn: 'Active Dashboard', icon: Wallet },
            { id: 'blind_count', labelAr: 'عداد الفئات النقدية (SAR)', labelEn: 'SAR Blind Count', icon: Calculator, badge: countedCash > 0 ? `${countedCash.toFixed(2)} ر.س` : undefined },
            { id: 'cash_ledger', labelAr: 'سجل حركات النقدية', labelEn: 'Cash Movements', icon: Receipt, badge: currentShift?.cashMovements.length || 0 },
            { id: 'payment_analytics', labelAr: 'تحليلات طرق الدفع', labelEn: 'Payment Channels', icon: CreditCard },
            { id: 'history', labelAr: 'أرشيف المناوبات وتقارير Z', labelEn: 'Shift History & Z-Reports', icon: FileSpreadsheet, badge: zReports.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('tap');
                  setActiveTab(tab.id as ShiftActiveTab);
                }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/10 shadow-sm border border-white/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
        {/* TAB 1: ACTIVE SHIFT DASHBOARD */}
        {activeTab === 'active_shift' && currentShift && (
          <div className="space-y-6">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Sales */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-white">
                  {currentShift.salesSummary.grossSales.toFixed(2)}{' '}
                  <span className="text-sm font-bold text-amber-400">{t.currency}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{currentShift.salesSummary.ordersCount} {language === 'ar' ? 'طلب مسجل' : 'orders'}</span>
                  <span>{language === 'ar' ? 'متوسط الفاتورة:' : 'AOV:'} {currentShift.salesSummary.averageTicket.toFixed(2)} {t.currency}</span>
                </div>
              </div>

              {/* Net Sales & VAT */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'الصافي والضريبة 15%' : 'Net Sales & VAT'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-white">
                  {currentShift.salesSummary.netSales.toFixed(2)}{' '}
                  <span className="text-sm font-bold text-emerald-400">{t.currency}</span>
                </div>
                <div className="mt-2 text-xs text-emerald-300/80 flex items-center justify-between">
                  <span>{language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT (15%):'}</span>
                  <span className="font-bold font-mono">+{currentShift.salesSummary.vatAmount.toFixed(2)} {t.currency}</span>
                </div>
              </div>

              {/* Expected Cash in Drawer */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'النقد المتوقع في الدرج' : 'Expected Drawer Cash'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                  {expectedCash.toFixed(2)}{' '}
                  <span className="text-sm font-bold text-cyan-400">{t.currency}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{language === 'ar' ? 'الافتتاحي:' : 'Opening Float:'} {currentShift.openingFloat.toFixed(2)}</span>
                  <span>{language === 'ar' ? 'مبيعات كاش:' : 'Cash Sales:'} {currentShift.paymentBreakdown.cash.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Cash Variance Indicator */}
              <div className={`p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden transition-all ${
                countedCash === 0
                  ? 'bg-slate-900/60 border-white/5'
                  : variance.status === 'balanced'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : variance.status === 'overage'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'حالة الجرد والمطابقة' : 'Reconciliation Status'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    {countedCash === 0 ? (
                      <Calculator className="w-4 h-4 text-slate-400" />
                    ) : variance.status === 'balanced' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black font-mono">
                  {countedCash === 0 ? (
                    <span className="text-slate-400 text-lg font-bold">
                      {language === 'ar' ? 'بانتظار عد النقد' : 'Awaiting Count'}
                    </span>
                  ) : (
                    <>
                      {variance.difference > 0 ? `+${variance.difference.toFixed(2)}` : variance.difference.toFixed(2)}{' '}
                      <span className="text-sm font-bold">{t.currency}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs flex items-center justify-between">
                  <span>
                    {countedCash === 0
                      ? language === 'ar' ? 'انتقل لتبويب العداد' : 'Open Counter Tab'
                      : variance.status === 'balanced'
                      ? language === 'ar' ? 'متطابق 100%' : '100% Balanced'
                      : variance.status === 'overage'
                      ? language === 'ar' ? 'فائض نقدي' : 'Cash Surplus'
                      : language === 'ar' ? 'عجز نقدي مطلوب تدقيق' : 'Shortage Detected'}
                  </span>
                  {countedCash > 0 && (
                    <span className="font-mono font-bold">
                      {language === 'ar' ? 'المعدود:' : 'Counted:'} {countedCash.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Section: Cash Breakdown & Payment Breakdown Quick Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Cash Flow Equations & Movements */}
              <div className="lg:col-span-2 space-y-6">
                {/* Cash Drawer Flow Breakdown Card */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        {language === 'ar' ? 'معادلة حركة النقد في الدرج' : 'Cash Drawer Equation'}
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      {language === 'ar' ? 'تحديث لحظي مع كل عملية' : 'Real-time sync'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-slate-400">{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Float'}</div>
                      <div className="mt-1 text-base font-bold font-mono text-white">
                        {currentShift.openingFloat.toFixed(2)} {t.currency}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-emerald-300">{language === 'ar' ? '(+) مبيعات كاش' : '(+) Cash Sales'}</div>
                      <div className="mt-1 text-base font-bold font-mono text-emerald-300">
                        +{currentShift.paymentBreakdown.cash.total.toFixed(2)} {t.currency}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                      <div className="text-cyan-300">{language === 'ar' ? '(+) إيداعات الدرج' : '(+) Cash In'}</div>
                      <div className="mt-1 text-base font-bold font-mono text-cyan-300">
                        +{currentShift.cashMovements.filter(m => m.type === 'cash_in').reduce((s, m) => s + m.amount, 0).toFixed(2)} {t.currency}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-rose-300">{language === 'ar' ? '(-) المصروفات والتوريد' : '(-) Out & Drops'}</div>
                      <div className="mt-1 text-base font-bold font-mono text-rose-300">
                        -{currentShift.cashMovements.filter(m => m.type !== 'cash_in').reduce((s, m) => s + m.amount, 0).toFixed(2)} {t.currency}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Cash Movements Mini Ledger */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        {language === 'ar' ? 'آخر حركات النقدية والمصروفات' : 'Recent Cash Movements'}
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('cash_ledger')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      {language === 'ar' ? 'عرض السجل كاملاً' : 'View Full Ledger'} →
                    </button>
                  </div>

                  {currentShift.cashMovements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      {language === 'ar' ? 'لا توجد حركات نقدية مسجلة بعد' : 'No cash movements recorded yet'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentShift.cashMovements.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                              m.type === 'cash_in'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : m.type === 'safe_drop'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {m.type === 'cash_in' ? '↓' : m.type === 'safe_drop' ? '🏦' : '↑'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{m.reason}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{new Date(m.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                {m.vendorName && <span>• {m.vendorName}</span>}
                                {m.receiptNumber && <span>• #{m.receiptNumber}</span>}
                              </div>
                            </div>
                          </div>
                          <div className={`font-mono font-bold text-sm ${
                            m.type === 'cash_in' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {m.type === 'cash_in' ? `+${m.amount.toFixed(2)}` : `-${m.amount.toFixed(2)}`} {t.currency}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Payment Methods Mini Summary */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('payment_analytics')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    {language === 'ar' ? 'تحليل' : 'Analytics'} →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { label: language === 'ar' ? 'نقدي (Cash)' : 'Cash', amount: currentShift.paymentBreakdown.cash.total, count: currentShift.paymentBreakdown.cash.count, color: 'bg-emerald-500' },
                    { label: language === 'ar' ? 'مدى (Mada)' : 'Mada Cards', amount: currentShift.paymentBreakdown.mada.total, count: currentShift.paymentBreakdown.mada.count, color: 'bg-amber-500' },
                    { label: language === 'ar' ? 'فيزا / ماستر' : 'Visa / Master', amount: currentShift.paymentBreakdown.visa_master.total, count: currentShift.paymentBreakdown.visa_master.count, color: 'bg-indigo-500' },
                    { label: language === 'ar' ? 'أبل باي (Apple Pay)' : 'Apple Pay', amount: currentShift.paymentBreakdown.apple_pay.total, count: currentShift.paymentBreakdown.apple_pay.count, color: 'bg-slate-300' },
                    { label: language === 'ar' ? 'تطبيقات التوصيل' : 'Delivery Apps', amount: (currentShift.paymentBreakdown.delivery_jahez.total + currentShift.paymentBreakdown.delivery_hungerstation.total + currentShift.paymentBreakdown.delivery_keeta.total), count: (currentShift.paymentBreakdown.delivery_jahez.count + currentShift.paymentBreakdown.delivery_hungerstation.count), color: 'bg-orange-500' },
                  ].map((p, idx) => {
                    const totalSales = currentShift.salesSummary.grossSales || 1;
                    const pct = Math.min(100, Math.round((p.amount / totalSales) * 100));
                    return (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold">{p.label}</span>
                          <span className="font-bold font-mono text-white">
                            {p.amount.toFixed(2)} {t.currency}{' '}
                            <span className="text-[10px] text-slate-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full ${p.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE SAR DENOMINATION COUNTER (BLIND CASH COUNT) */}
        {activeTab === 'blind_count' && (
          <div className="space-y-6">
            {/* Header & Quick Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>{language === 'ar' ? 'شاشة عد النقدية التفاعلية (SAR Blind Count)' : 'SAR Interactive Denomination Counter'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'أدخل تكرار كل فئة ورقية أو معدنية لحساب إجمالي الصندوق بدقة رياضية وفحص الفروقات'
                    : 'Count banknotes and coins to calculate total physical drawer cash and check discrepancies'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    playSound('delete');
                    resetBlindCount();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تصفير العداد' : 'Reset Counts'}</span>
                </button>

                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">{language === 'ar' ? 'الإجمالي المعدود' : 'Total Counted'}</div>
                  <div className="text-xl font-black font-mono text-white">
                    {countedCash.toFixed(2)} <span className="text-xs font-bold text-amber-400">{t.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Denomination Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SAR_DENOMINATIONS.map((denom) => {
                const count = blindCountMap[denom.value] || 0;
                const subtotal = denom.value * count;

                return (
                  <div
                    key={denom.value}
                    className={`p-4 rounded-3xl bg-gradient-to-b ${denom.color} border ${denom.borderColor} backdrop-blur-md space-y-3 relative overflow-hidden transition-all shadow-lg hover:scale-[1.01]`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center font-black font-mono text-sm text-white">
                          {denom.badge}
                        </span>
                        <div>
                          <div className={`font-bold text-xs ${denom.textColor}`}>
                            {language === 'ar' ? denom.labelAr : denom.labelEn}
                          </div>
                          <div className="text-[10px] text-slate-300/80">
                            {denom.type === 'banknote' ? (language === 'ar' ? 'ورقة نقدية' : 'Banknote') : (language === 'ar' ? 'عملة معدنية' : 'Coin')}
                          </div>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <div className="text-xs font-mono font-black text-white">
                          {subtotal.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-300">{t.currency}</div>
                      </div>
                    </div>

                    {/* Numeric Count & Quick Increment Controls */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            playSound('click');
                            incrementDenominationCount(denom.value, -1);
                          }}
                          className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-white font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count === 0 ? '' : count}
                          placeholder="0"
                          onChange={(e) => updateDenominationCount(denom.value, parseInt(e.target.value) || 0)}
                          className="w-14 h-8 text-center bg-black/50 border border-white/20 rounded-lg text-white font-mono font-bold text-sm outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => {
                            playSound('pop');
                            incrementDenominationCount(denom.value, 1);
                          }}
                          className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-white font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick +5 / +10 chips */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            playSound('pop');
                            incrementDenominationCount(denom.value, 5);
                          }}
                          className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-white cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => {
                            playSound('pop');
                            incrementDenominationCount(denom.value, 10);
                          }}
                          className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-white cursor-pointer"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reconciliation Comparison Bar */}
            {currentShift && (
              <div className={`p-5 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
                variance.status === 'balanced'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : variance.status === 'overage'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    {variance.status === 'balanced' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">
                      {language === 'ar' ? 'نتيجة الجرد المالي والمطابقة' : 'Reconciliation Result'}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {language === 'ar' ? 'المتوقع في الدرج:' : 'Expected in Drawer:'}{' '}
                      <span className="font-bold font-mono text-white">{expectedCash.toFixed(2)} {t.currency}</span> |{' '}
                      {language === 'ar' ? 'الفعلي المعدود:' : 'Actual Counted:'}{' '}
                      <span className="font-bold font-mono text-white">{countedCash.toFixed(2)} {t.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-xl font-black text-white">
                      {variance.difference > 0 ? `+${variance.difference.toFixed(2)}` : variance.difference.toFixed(2)} {t.currency}
                    </div>
                    <div className="text-[10px] font-bold uppercase">
                      {variance.status === 'balanced'
                        ? language === 'ar' ? 'مطابقة تامة' : 'Exact Match'
                        : variance.status === 'overage'
                        ? language === 'ar' ? 'فائض نقدي' : 'Surplus'
                        : language === 'ar' ? 'عجز نقدي' : 'Shortage'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playSound('pop');
                      setIsCloseShiftModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition-all cursor-pointer shadow-lg"
                  >
                    {language === 'ar' ? 'اعتماد وإغلاق الصندوق' : 'Confirm & Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CASH MOVEMENTS & PETTY CASH LEDGER */}
        {activeTab === 'cash_ledger' && currentShift && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>{language === 'ar' ? 'سجل حركات النقدية والمصروفات النثرية' : 'Cash Movements & Petty Cash Ledger'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'تسجيل دقيق للإيداعات، السحوبات، فواتير المشتريات الطارئة، وترحيل الخزينة مع المرفقات'
                    : 'Track all Cash In, Cash Out, Petty Cash expenses, and Safe Drops with vouchers'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    playSound('tap');
                    setMovementType('cash_in');
                    setIsCashMovementModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? '+ إيداع نقدي' : '+ Cash In'}</span>
                </button>

                <button
                  onClick={() => {
                    playSound('tap');
                    setMovementType('petty_cash');
                    setIsCashMovementModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? '- مصروف نثري' : '- Petty Cash'}</span>
                </button>

                <button
                  onClick={() => {
                    playSound('tap');
                    setMovementType('safe_drop');
                    setIsCashMovementModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? '- ترحيل للخزينة' : '- Safe Drop'}</span>
                </button>
              </div>
            </div>

            {/* Movements Table */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md overflow-hidden">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">{language === 'ar' ? 'النوع والحركة' : 'Type & Movement'}</th>
                    <th className="p-4">{language === 'ar' ? 'الوصف والسبب' : 'Reason / Description'}</th>
                    <th className="p-4">{language === 'ar' ? 'التصنيف / المورد' : 'Category / Vendor'}</th>
                    <th className="p-4">{language === 'ar' ? 'المسؤول والمصرح' : 'Staff / Authorized'}</th>
                    <th className="p-4">{language === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                    <th className="p-4 text-right rtl:text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentShift.cashMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        {language === 'ar' ? 'لم يتم تسجيل أي حركات نقدية بعد في هذه المناوبة' : 'No cash movements recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    currentShift.cashMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            m.type === 'cash_in'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : m.type === 'safe_drop'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {m.type === 'cash_in'
                              ? language === 'ar' ? 'إيداع نقدي' : 'Cash In'
                              : m.type === 'safe_drop'
                              ? language === 'ar' ? 'ترحيل خزينة' : 'Safe Drop'
                              : language === 'ar' ? 'مصروفات نثرية' : 'Petty Cash'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{m.reason}</div>
                          {m.receiptNumber && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {language === 'ar' ? 'رقم الإيصال:' : 'Voucher:'} #{m.receiptNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300 font-semibold">{m.category ? PETTY_CASH_CATEGORIES.find(c => c.id === m.category)?.nameAr || m.category : '—'}</div>
                          {m.vendorName && <div className="text-[10px] text-slate-400 mt-0.5">{m.vendorName}</div>}
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium">{m.performedByName || m.performedBy}</div>
                          {m.authorizedBy && <div className="text-[10px] text-amber-400 mt-0.5">اعتماد: {m.authorizedBy}</div>}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={`p-4 text-right rtl:text-left font-mono font-bold text-sm ${
                          m.type === 'cash_in' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {m.type === 'cash_in' ? `+${m.amount.toFixed(2)}` : `-${m.amount.toFixed(2)}`} {t.currency}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT CHANNEL ANALYTICS */}
        {activeTab === 'payment_analytics' && currentShift && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>{language === 'ar' ? 'التحليل المالي الشامل لقنوات الدفع' : 'Comprehensive Payment Channel Analytics'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar'
                  ? 'مقارنة دقيقة ومطابقة بين النقد، بطاقات مدى، فيزا، أبل باي، وتطبيقات التوصيل (جاهز، هنقرستيشن، كيتا)'
                  : 'Breakdown and comparison between Cash, Mada, Credit Cards, Apple Pay, and Delivery Platforms'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'cash', titleAr: 'نقداً (Cash)', titleEn: 'Cash', icon: Wallet, color: 'text-emerald-400', bg: 'from-emerald-950/40 to-slate-900/80', border: 'border-emerald-500/30' },
                { key: 'mada', titleAr: 'بطاقات مدى (Mada)', titleEn: 'Mada Debit Cards', icon: CreditCard, color: 'text-amber-400', bg: 'from-amber-950/40 to-slate-900/80', border: 'border-amber-500/30' },
                { key: 'visa_master', titleAr: 'فيزا وماستركارد', titleEn: 'Visa / Mastercard', icon: CreditCard, color: 'text-indigo-400', bg: 'from-indigo-950/40 to-slate-900/80', border: 'border-indigo-500/30' },
                { key: 'apple_pay', titleAr: 'أبل باي (Apple Pay)', titleEn: 'Apple Pay Contactless', icon: Smartphone, color: 'text-slate-200', bg: 'from-slate-800/40 to-slate-900/80', border: 'border-slate-500/30' },
                { key: 'delivery_jahez', titleAr: 'تطبيق جاهز (Jahez)', titleEn: 'Jahez Platform', icon: Truck, color: 'text-yellow-400', bg: 'from-yellow-950/40 to-slate-900/80', border: 'border-yellow-500/30' },
                { key: 'delivery_hungerstation', titleAr: 'هنقرستيشن (Hungerstation)', titleEn: 'Hungerstation Platform', icon: Truck, color: 'text-amber-500', bg: 'from-amber-950/40 to-slate-900/80', border: 'border-amber-600/30' },
                { key: 'delivery_keeta', titleAr: 'كيتا (Keeta)', titleEn: 'Keeta Delivery', icon: Truck, color: 'text-orange-400', bg: 'from-orange-950/40 to-slate-900/80', border: 'border-orange-500/30' },
                { key: 'delivery_chefz', titleAr: 'ذا شفز (The Chefz)', titleEn: 'The Chefz Delivery', icon: Truck, color: 'text-rose-400', bg: 'from-rose-950/40 to-slate-900/80', border: 'border-rose-500/30' },
                { key: 'gift_card', titleAr: 'بطاقات الهدايا ونقاط الولاء', titleEn: 'Gift Cards & Loyalty', icon: Sparkles, color: 'text-purple-400', bg: 'from-purple-950/40 to-slate-900/80', border: 'border-purple-500/30' },
              ].map((channel) => {
                const data = (currentShift.paymentBreakdown as any)[channel.key] || { count: 0, total: 0 };
                const Icon = channel.icon;
                const totalGross = currentShift.salesSummary.grossSales || 1;
                const pct = Math.min(100, Math.round((data.total / totalGross) * 100));

                return (
                  <div
                    key={channel.key}
                    className={`p-5 rounded-3xl bg-gradient-to-b ${channel.bg} border ${channel.border} backdrop-blur-md space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${channel.color}`} />
                        <span className="font-bold text-xs text-white">
                          {language === 'ar' ? channel.titleAr : channel.titleEn}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white">
                        {data.count} {language === 'ar' ? 'عملية' : 'txns'}
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono text-white">
                      {data.total.toFixed(2)}{' '}
                      <span className="text-xs font-bold text-amber-400">{t.currency}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>{language === 'ar' ? 'الحصة من الإجمالي' : 'Share of Total'}</span>
                        <span className="font-bold text-white font-mono">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: SHIFT HISTORY & Z-REPORTS ARCHIVE */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span>{language === 'ar' ? 'أرشيف المناوبات المغلقة وتقارير Z-Report' : 'Closed Shifts & Z-Reports Archive'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'سجل معتمد وموثق لجميع المناوبات السابقة مع إمكانية إعادة طباعة Z-Report وتصدير Excel/CSV'
                    : 'Historical audit trail of certified shifts with instant Z-Report reprinting and CSV exports'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث برقم المناوبة أو الكاشير...' : 'Search shift number or cashier...'}
                  className="w-full ps-9 pe-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Reports List */}
            {zReports.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
                <ReceiptText className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-base font-bold text-slate-300">
                  {language === 'ar' ? 'لا توجد تقارير Z-Report مؤرشفة بعد' : 'No archived Z-Reports found'}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'ar'
                    ? 'عند إغلاق أي مناوبة نشطة، سيتم حفظ تقرير الإغلاق النهائي تلقائياً هنا مع التوقيع الرقمي وبصمة ZATCA'
                    : 'Whenever an active shift is closed, its final certified Z-Report will appear here'}
                </p>
                <button
                  onClick={resetToSampleData}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'توليد بيانات تجريبية للمناوبة' : 'Load Demo Shift Data'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-500/40 backdrop-blur-md space-y-4 transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs">
                          {rep.reportNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(rep.generatedAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>{language === 'ar' ? 'الكاشير المسؤول:' : 'Cashier:'}</span>
                        <span className="font-bold text-white">{rep.cashier.name}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>{language === 'ar' ? 'المبيعات الإجمالية:' : 'Gross Sales:'}</span>
                        <span className="font-bold font-mono text-amber-400">{rep.sales.grossSales.toFixed(2)} {t.currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>{language === 'ar' ? 'عدد العمليات:' : 'Transactions:'}</span>
                        <span className="font-mono text-white">{rep.statistics.totalOrders} {language === 'ar' ? 'طلب' : 'orders'}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>{language === 'ar' ? 'الفارق النقدي:' : 'Difference:'}</span>
                        <span className={`font-mono font-bold ${
                          rep.cashReconciliation.difference === 0 ? 'text-emerald-400' : rep.cashReconciliation.difference > 0 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {rep.cashReconciliation.difference > 0 ? `+${rep.cashReconciliation.difference.toFixed(2)}` : rep.cashReconciliation.difference.toFixed(2)} {t.currency}
                        </span>
                      </div>
                    </div>

                    {/* ZATCA Hash Stamp */}
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-mono text-slate-400 text-center truncate">
                      SHA: {rep.zatca.cryptographicHash.slice(0, 24)}...
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          playSound('pop');
                          setActiveReportModal(rep);
                        }}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer text-center"
                      >
                        {language === 'ar' ? 'معاينة التقرير' : 'View Report'}
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(rep)}
                        title={language === 'ar' ? 'طباعة حرارية 80mm' : 'Print Thermal Receipt'}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportCsv(rep)}
                        title={language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: OPEN SHIFT MODAL */}
      <AnimatePresence>
        {isOpenShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'فتح مناوبة وصندوق جديد' : 'Open New Shift & Drawer'}
                    </h3>
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'تسجيل الرصيد الافتتاحي وبدء المبيعات' : 'Set opening float balance'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpenShiftModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    {language === 'ar' ? 'الرصيد الافتتاحي في الدرج (Opening Float SAR)' : 'Opening Cash Float (SAR)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={openingFloatInput}
                      onChange={(e) => setOpeningFloatInput(e.target.value)}
                      placeholder="500.00"
                      className="w-full px-4 py-3 bg-black/50 border border-white/15 rounded-2xl text-white font-mono text-base font-bold outline-none focus:border-amber-400"
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {t.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    {language === 'ar' ? 'ملاحظات وتوجيهات افتتاح المناوبة' : 'Opening Notes (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={openingNotesInput}
                    onChange={(e) => setOpeningNotesInput(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: مناوبة عشاء مع جاهزية كاملة للصالة...' : 'Shift notes...'}
                    className="w-full p-3 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'الكاشير المسؤول:' : 'Active Cashier:'}</span>
                    <span className="font-bold text-white">{activeUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'الفرع:' : 'Branch:'}</span>
                    <span className="text-amber-400 font-bold">فرع السليمانية — الرياض</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpenShiftModal(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'تأكيد وفتح الصندوق' : 'Open Drawer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CASH MOVEMENT MODAL (CASH IN / OUT / PETTY CASH / SAFE DROP) */}
      <AnimatePresence>
        {isCashMovementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'تسجيل حركة نقدية جديدة' : 'Record Cash Movement'}
                    </h3>
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'إيداع، سحب، مصروفات نثرية أو ترحيل للخزينة' : 'Petty cash, in/out or safe drop'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCashMovementModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Movement Type Selectors */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'petty_cash', labelAr: 'مصروف نثري', labelEn: 'Petty Cash', icon: '📝' },
                  { id: 'cash_in', labelAr: 'إيداع نقدي', labelEn: 'Cash In', icon: '↓' },
                  { id: 'safe_drop', labelAr: 'ترحيل خزينة', labelEn: 'Safe Drop', icon: '🏦' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setMovementType(type.id as CashMovementType)}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      movementType === type.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{type.icon}</span>
                    <span>{language === 'ar' ? type.labelAr : type.labelEn}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddMovementSubmit} className="space-y-4 text-xs">
                {/* Amount */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    {language === 'ar' ? 'المبلغ النقدي (SAR)' : 'Amount (SAR)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-black/50 border border-white/15 rounded-2xl text-white font-mono text-base font-bold outline-none focus:border-amber-400"
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {t.currency}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    {language === 'ar' ? 'البيان والسبب بالتفصيل' : 'Reason / Description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شراء ليمون ونعناع طازج من سوق الخضار...' : 'Reason...'}
                    className="w-full p-3 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Petty Cash Category */}
                {movementType === 'petty_cash' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {language === 'ar' ? 'تصنيف المصروف' : 'Petty Cash Category'}
                    </label>
                    <select
                      value={movementCategory}
                      onChange={(e) => setMovementCategory(e.target.value as PettyCashCategory)}
                      className="w-full p-3 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 text-xs"
                    >
                      {PETTY_CASH_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                          {cat.icon} {language === 'ar' ? cat.nameAr : cat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Vendor & Receipt */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {language === 'ar' ? 'اسم المورد / المحل (اختياري)' : 'Vendor / Store'}
                    </label>
                    <input
                      type="text"
                      value={movementVendor}
                      onChange={(e) => setMovementVendor(e.target.value)}
                      placeholder="أسواق المزرعة"
                      className="w-full p-2.5 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {language === 'ar' ? 'رقم الفاتورة / الإيصال' : 'Receipt / Voucher #'}
                    </label>
                    <input
                      type="text"
                      value={movementReceipt}
                      onChange={(e) => setMovementReceipt(e.target.value)}
                      placeholder="INV-9921"
                      className="w-full p-2.5 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCashMovementModal(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'حفظ وتسجيل الحركة' : 'Save Movement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CLOSE SHIFT & ISSUE Z-REPORT MODAL */}
      <AnimatePresence>
        {isCloseShiftModal && currentShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'إغلاق الصندوق وإصدار تقرير Z-Report' : 'Close Shift & Generate Z-Report'}
                    </h3>
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'الاعتماد النهائي والمطابقة المالية الرسمية' : 'Certified end-of-day closing'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCloseShiftModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Balance Summary Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'ar' ? 'المبيعات الإجمالية:' : 'Gross Sales:'}</span>
                  <span className="font-bold font-mono text-white">{currentShift.salesSummary.grossSales.toFixed(2)} {t.currency}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'ar' ? 'النقد المتوقع في الدرج:' : 'Expected Drawer Cash:'}</span>
                  <span className="font-bold font-mono text-cyan-300">{expectedCash.toFixed(2)} {t.currency}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'ar' ? 'النقد الفعلي المعدود:' : 'Actual Counted Cash:'}</span>
                  <span className="font-bold font-mono text-white">{countedCash.toFixed(2)} {t.currency}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span>{language === 'ar' ? 'الفارق المالي (Difference):' : 'Variance:'}</span>
                  <span className={`font-mono ${
                    variance.status === 'balanced' ? 'text-emerald-400' : variance.status === 'overage' ? 'text-amber-400' : 'text-rose-400 font-black'
                  }`}>
                    {variance.difference > 0 ? `+${variance.difference.toFixed(2)}` : variance.difference.toFixed(2)} {t.currency} ({variance.status})
                  </span>
                </div>
              </div>

              {/* Supervisor PIN for Shortage */}
              {variance.needsSupervisorApproval && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{language === 'ar' ? 'يوجد عجز نقدي يتجاوز الحد المسموح — يتطلب اعتماد المشرف' : 'Discrepancy exceeds threshold — Supervisor PIN required'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">{language === 'ar' ? 'اسم المشرف' : 'Supervisor Name'}</label>
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        className="w-full p-2 bg-black/50 border border-white/15 rounded-xl text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">{language === 'ar' ? 'رمز PIN السري للمشرف' : 'Supervisor PIN'}</label>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="••••"
                        value={supervisorPin}
                        onChange={(e) => setSupervisorPin(e.target.value)}
                        className="w-full p-2 bg-black/50 border border-white/15 rounded-xl text-white text-center font-mono font-bold tracking-widest text-sm outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  {language === 'ar' ? 'ملاحظات الإغلاق النهائي' : 'Closing Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'تم جرد الفئات وتوريد العهدة...' : 'Closing notes...'}
                  className="w-full p-3 bg-black/50 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'رجوع لتعديل الجرد' : 'Back to Counter'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseShiftSubmit}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'تأكيد وإصدار Z-Report' : 'Confirm & Issue Z-Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Z-REPORT / X-REPORT HIGH-DEFINITION PREVIEW & PRINT MODAL */}
      <AnimatePresence>
        {activeReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-950 border border-white/20 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>{activeReportModal.reportType === 'Z_REPORT' ? 'تقرير الإغلاق النهائي (Z-Report)' : 'تقرير منتصف المناوبة (X-Report)'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                        {activeReportModal.reportNumber}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(activeReportModal.generatedAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintReceipt(activeReportModal)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{language === 'ar' ? 'طباعة حرارية 80mm' : 'Print Receipt'}</span>
                  </button>

                  <button
                    onClick={() => handleExportCsv(activeReportModal)}
                    className="p-2 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 cursor-pointer"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveReportModal(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Receipt Body (Styled 80mm Thermal Simulation) */}
              <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-white text-slate-900 font-mono text-xs custom-scrollbar shadow-inner">
                <div className="max-w-sm mx-auto space-y-3 text-center">
                  <div className="font-black text-base">{activeReportModal.branch.nameAr}</div>
                  <div className="text-[11px] text-slate-600">{activeReportModal.branch.nameEn}</div>
                  <div className="text-[10px] text-slate-600">{activeReportModal.branch.address}</div>
                  <div className="text-[10px] text-slate-600">الرقم الضريبي: {activeReportModal.branch.vatNumber}</div>
                  <div className="px-3 py-1 bg-black text-white font-bold text-xs inline-block rounded">
                    {activeReportModal.reportType === 'Z_REPORT' ? 'Z-REPORT (إغلاق وتصفير)' : 'X-REPORT (قراءة)'}
                  </div>

                  <div className="border-t border-dashed border-black my-2" />

                  <div className="space-y-1 text-right text-[11px]">
                    <div className="flex justify-between"><span>رقم التقرير:</span><span className="font-bold">{activeReportModal.reportNumber}</span></div>
                    <div className="flex justify-between"><span>الكاشير:</span><span>{activeReportModal.cashier.name}</span></div>
                    <div className="flex justify-between"><span>وقت الفتح:</span><span>{new Date(activeReportModal.period.openedAt).toLocaleTimeString('ar-SA')}</span></div>
                    <div className="flex justify-between"><span>وقت الإغلاق:</span><span>{new Date(activeReportModal.period.closedAt).toLocaleTimeString('ar-SA')}</span></div>
                  </div>

                  <div className="border-t border-dashed border-black my-2" />

                  {/* Sales */}
                  <div className="space-y-1 text-right text-[11px]">
                    <div className="font-bold text-center bg-slate-100 p-1">ملخص المبيعات (SALES)</div>
                    <div className="flex justify-between"><span>المبيعات الإجمالية:</span><span className="font-bold">{activeReportModal.sales.grossSales.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between"><span>الخصومات:</span><span>-{activeReportModal.sales.discounts.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between"><span>الصافي بدون ضريبة:</span><span>{activeReportModal.sales.netSales.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between font-bold"><span>الضريبة (15% VAT):</span><span>{activeReportModal.sales.vatAmount.toFixed(2)} ر.س</span></div>
                  </div>

                  <div className="border-t border-dashed border-black my-2" />

                  {/* Cash Reconciliation */}
                  <div className="space-y-1 text-right text-[11px]">
                    <div className="font-bold text-center bg-slate-100 p-1">مطابقة الصندوق (CASH DRAWER)</div>
                    <div className="flex justify-between"><span>الرصيد الافتتاحي:</span><span>{activeReportModal.cashReconciliation.openingFloat.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between"><span>مبيعات نقدي:</span><span>+{activeReportModal.cashReconciliation.cashSales.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between"><span>إيداعات (+) :</span><span>+{activeReportModal.cashReconciliation.cashIn.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between"><span>مصروفات وسحب (-) :</span><span>-{(activeReportModal.cashReconciliation.cashOut + activeReportModal.cashReconciliation.pettyCashTotal + activeReportModal.cashReconciliation.safeDrops).toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between font-bold"><span>النقد المتوقع:</span><span>{activeReportModal.cashReconciliation.expectedCash.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between font-bold"><span>النقد المعدود:</span><span>{activeReportModal.cashReconciliation.actualCash.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                      <span>الفارق المالي:</span>
                      <span>{activeReportModal.cashReconciliation.difference > 0 ? `+${activeReportModal.cashReconciliation.difference.toFixed(2)}` : activeReportModal.cashReconciliation.difference.toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="py-2">
                    <img
                      src={activeReportModal.zatca.qrCodeUrl}
                      alt="ZATCA QR"
                      className="w-28 h-28 mx-auto border border-black/10 p-1 rounded"
                    />
                    <div className="text-[8px] text-slate-500 mt-1">رمز التحقق الرقمي المعتمد لدى هيئة الزكاة والضريبة والجمارك</div>
                  </div>

                  <div className="text-[8px] text-slate-400 break-all">
                    SHA-256: {activeReportModal.zatca.cryptographicHash}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
