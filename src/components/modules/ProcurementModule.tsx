/**
 * =====================================================================
 * RESTAURANT OS — DIGITAL PROCUREMENT & SUPPLIER MANAGEMENT MODULE
 * =====================================================================
 * 3-Way Matching (PO vs GRN vs Invoice), Complete Lifecycle State Machine,
 * Debt & Aging Analysis, Paperless Scanning, and Auto-Replenishment.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Building2,
  FileCheck2,
  Receipt,
  RotateCcw,
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Boxes,
  ShieldCheck,
  Download,
  Eye,
  Check,
  X,
  CreditCard,
  QrCode,
  ThermometerSnowflake,
  ShieldAlert,
  Percent,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { procurementService } from '../../services/procurementService';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  SupplierProfile,
  ThreeWayMatchReport,
  GoodsReceivedNote,
  SupplierInvoice,
  AutoReorderSupplierGroup,
  PayableAgingBucket,
  ProcurementPaymentMethod,
  QualityInspection,
  PaymentTerm,
} from '../../types/procurement';

type ProcurementTab = 'overview' | 'orders' | 'matching' | 'suppliers' | 'reorder';

export const ProcurementModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<ProcurementTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | 'all'>('all');

  // Service State
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [agingSummary, setAgingSummary] = useState<PayableAgingBucket | null>(null);
  const [autoReorders, setAutoReorders] = useState<AutoReorderSupplierGroup[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<SupplierProfile | null>(null);

  // Modals
  const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isScanInvoiceModalOpen, setIsScanInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  // Modal temporary forms
  const [selectedMatchPO, setSelectedMatchPO] = useState<PurchaseOrder | null>(null);
  const [paymentSupplierId, setPaymentSupplierId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<ProcurementPaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [ocrScanningState, setOcrScanningState] = useState<'idle' | 'scanning' | 'scanned'>('idle');
  const [ocrResult, setOcrResult] = useState<any>(null);

  // New PO form state
  const [newPoSupplierId, setNewPoSupplierId] = useState<string>('');
  const [newPoDeliveryLocation, setNewPoDeliveryLocation] = useState<string>('المستودع الرئيسي - فرع السليمانية');
  const [newPoNotes, setNewPoNotes] = useState<string>('');
  const [newPoItems, setNewPoItems] = useState<
    {
      inventoryItemId: string;
      inventoryItemNameAr: string;
      inventoryItemNameEn: string;
      sku: string;
      unit: string;
      quantityOrdered: number;
      unitPriceContracted: number;
      taxRate: number;
    }[]
  >([
    {
      inventoryItemId: 'raw-wagyu-beef',
      inventoryItemNameAr: 'لحم واغيو ياباني A5 مبرد',
      inventoryItemNameEn: 'Chilled Japanese A5 Wagyu Ribeye',
      sku: 'RAW-BEEF-WAGYU',
      unit: 'kg',
      quantityOrdered: 10,
      unitPriceContracted: 380,
      taxRate: 0.15,
    },
  ]);

  // Goods receipt form state
  const [grnInspectorName, setGrnInspectorName] = useState('سلطان العتيبي');
  const [grnTemp, setGrnTemp] = useState<number>(3.5);
  const [grnPackagingIntact, setGrnPackagingIntact] = useState(true);
  const [grnExpiryValid, setGrnExpiryValid] = useState(true);
  const [grnSensoryPassed, setGrnSensoryPassed] = useState(true);
  const [grnNotes, setGrnNotes] = useState('تم فحص الشحنة ومطابقة درجات حرارة التبريد.');

  // Reload data helper
  const reloadData = async () => {
    const sups = procurementService.getSuppliers();
    const pos = procurementService.getPurchaseOrders();
    const aging = procurementService.getPayablesAgingSummary();
    const reorders = await procurementService.generateAutoReorderSuggestions();

    setSuppliers(sups);
    setPurchaseOrders(pos);
    setAgingSummary(aging);
    setAutoReorders(reorders);

    if (sups.length > 0 && !newPoSupplierId) {
      setNewPoSupplierId(sups[0].id);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    return procurementService.getProcurementMetrics();
  }, [purchaseOrders, suppliers]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchStatus = statusFilter === 'all' || po.status === statusFilter;
      const matchSupplier = selectedSupplierId === 'all' || po.supplierId === selectedSupplierId;
      const matchSearch =
        !searchQuery ||
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierNameEn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSupplier && matchSearch;
    });
  }, [purchaseOrders, statusFilter, selectedSupplierId, searchQuery]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        !searchQuery ||
        s.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [suppliers, searchQuery]);

  // Status Badge Helper
  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {t.procurement_status_draft || 'مسودة'}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            {t.procurement_status_approved || 'معتمد'}
          </span>
        );
      case 'dispatched':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Truck className="w-3 h-3" />
            {t.procurement_status_dispatched || 'تم الشحن'}
          </span>
        );
      case 'received':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <Boxes className="w-3 h-3" />
            {t.procurement_status_received || 'تم الاستلام'}
          </span>
        );
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <Check className="w-3 h-3" />
            {t.procurement_status_paid || 'مدفوع'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <X className="w-3 h-3" />
            {t.procurement_status_cancelled || 'ملغي'}
          </span>
        );
    }
  };

  // Match Verdict Badge Helper
  const renderMatchBadge = (report?: ThreeWayMatchReport) => {
    if (!report) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-500/10 text-slate-400 border border-slate-500/20">
          بانتظار الفاتورة
        </span>
      );
    }
    switch (report.status) {
      case 'exact_match':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {t.procurement_match_exact || 'مطابقة 100%'}
          </span>
        );
      case 'within_tolerance':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-teal-400" />
            {t.procurement_match_tolerance || 'ضمن السماحية'}
          </span>
        );
      case 'discrepancy':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {t.procurement_match_discrepancy || 'يوجد فروقات'}
          </span>
        );
      case 'critical_mismatch':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            {t.procurement_match_critical || 'اختلاف حرج'}
          </span>
        );
    }
  };

  // Handlers for PO Lifecycle State Machine
  const handleApprovePO = (poId: string) => {
    playSound('success');
    procurementService.approvePurchaseOrder(poId, 'طارق المنصور - المدير التنفيذي');
    reloadData();
    if (selectedPO?.id === poId) {
      setSelectedPO(procurementService.getPurchaseOrderById(poId) || null);
    }
  };

  const handleDispatchPO = (poId: string) => {
    playSound('whoosh');
    procurementService.dispatchPurchaseOrder(poId, 'تم إرسال أمر الشراء للمورد وبدء التجهيز والنقل.');
    reloadData();
    if (selectedPO?.id === poId) {
      setSelectedPO(procurementService.getPurchaseOrderById(poId) || null);
    }
  };

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmGoodsReceipt = async () => {
    if (!selectedPO) return;
    playSound('cash-register');

    const qualityInspection: QualityInspection = {
      temperatureCompliant: grnPackagingIntact,
      measuredTemperature: grnTemp,
      packagingIntact: grnPackagingIntact,
      expiryDateValid: grnExpiryValid,
      sensoryInspectionPassed: grnSensoryPassed,
      inspectorName: grnInspectorName,
      inspectedAt: new Date().toISOString(),
      inspectionNotes: grnNotes,
    };

    const itemsReceived = selectedPO.items.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      quantityReceived: item.quantityOrdered,
      quantityAccepted: item.quantityOrdered,
      quantityRejected: 0,
      actualUnitPrice: item.unitPriceContracted,
      expiryDate: item.expiryDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
    }));

    await procurementService.receiveGoods(selectedPO.id, {
      receivedBy: grnInspectorName,
      itemsReceived,
      qualityInspection,
      notes: grnNotes,
    });

    setIsReceiveModalOpen(false);
    reloadData();
    setSelectedPO(procurementService.getPurchaseOrderById(selectedPO.id) || null);
  };

  const handleCreatePO = () => {
    if (!newPoSupplierId || newPoItems.length === 0) return;
    playSound('pop');

    procurementService.createPurchaseOrder({
      supplierId: newPoSupplierId,
      deliveryLocation: newPoDeliveryLocation,
      notes: newPoNotes,
      items: newPoItems,
    });

    setIsCreatePoModalOpen(false);
    reloadData();
    setActiveTab('orders');
  };

  const handleAutoReorderAll = async () => {
    playSound('success');
    await procurementService.createDraftOrdersFromSuggestions();
    reloadData();
    setActiveTab('orders');
  };

  const handleSimulateOcrScan = () => {
    setOcrScanningState('scanning');
    playSound('tap');

    setTimeout(() => {
      const scan = procurementService.simulateOcrInvoiceScan();
      setOcrResult(scan.extractedInvoice);
      setOcrScanningState('scanned');
      playSound('success');
    }, 1200);
  };

  const handleApplyOcrToThreeWayMatch = () => {
    if (!ocrResult) return;
    playSound('cash-register');

    // Find the first dispatched or received PO
    const targetPO = purchaseOrders.find((p) => p.status === 'received' || p.status === 'dispatched') || purchaseOrders[0];
    if (targetPO) {
      procurementService.performThreeWayMatch(targetPO.id, ocrResult, 2.0);
      reloadData();
      setIsScanInvoiceModalOpen(false);
      setSelectedMatchPO(procurementService.getPurchaseOrderById(targetPO.id) || null);
      setActiveTab('matching');
    }
  };

  const handleOpenPaymentModal = (supplierId?: string, po?: PurchaseOrder) => {
    if (supplierId) {
      setPaymentSupplierId(supplierId);
      const sup = suppliers.find((s) => s.id === supplierId);
      setPaymentAmount(po ? po.totalAmount - po.paidAmount : sup?.currentBalance || 5000);
    } else if (suppliers.length > 0) {
      setPaymentSupplierId(suppliers[0].id);
      setPaymentAmount(suppliers[0].currentBalance);
    }
    setPaymentRef(`SNB-TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = () => {
    if (!paymentSupplierId || paymentAmount <= 0) return;
    playSound('cash-register');

    procurementService.recordSupplierPayment({
      supplierId: paymentSupplierId,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef,
      notes: 'سداد دفعة للمورد معتمد من الإدارة المالية',
    });

    setIsPaymentModalOpen(false);
    reloadData();
  };

  const handleViewStatement = (sup: SupplierProfile) => {
    setSelectedSupplierForStatement(sup);
    setIsStatementModalOpen(true);
  };

  const handleExportJson = () => {
    playSound('pop');
    const jsonStr = procurementService.exportProcurementReport('json');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Procurement_Report_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] text-slate-100 overflow-hidden relative font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#0e1117]/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                {t.procurement_title || 'منظومة المشتريات وإدارة الموردين الرقمية'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                3-WAY MATCH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t.procurement_subtitle || 'دورة حياة أمر الشراء (Draft -> Received -> Paid)، التدقيق الثلاثي ومطابقة المخزون والتكلفة'}
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('click');
              setIsScanInvoiceModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>{t.procurement_quick_action_scan || 'فحص فاتورة (OCR)'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setIsCreatePoModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.procurement_quick_action_create || 'أمر شراء جديد'}</span>
          </button>

          <button
            onClick={handleExportJson}
            title="تصدير التقرير المالي JSON"
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* KPI Stats Strip */}
      <section className="px-6 py-3 border-b border-white/5 bg-[#0e1117]/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 z-10">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_total_spend || 'مشتريات الشهر'}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-black text-amber-400 font-mono">{metrics.totalMonthlySpend.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">{t.currency}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_outstanding_payables || 'الديون الآجلة للموردين'}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-black text-rose-400 font-mono">{metrics.totalOutstandingDebt.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">{t.currency}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_active_pos || 'أوامر شراء نشطة'}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-black text-blue-400 font-mono">{metrics.activePurchaseOrdersCount}</span>
            <span className="text-[10px] text-slate-400">قيد التنفيذ</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_matching_rate || 'دقة المطابقة الثلاثية'}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-black text-emerald-400 font-mono">{metrics.threeWayMatchSuccessRate}%</span>
            <span className="text-[10px] text-emerald-500/80">3-Way OK</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_pending_receipt || 'شحنات بانتظار الاستلام'}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-black text-purple-400 font-mono">{metrics.pendingGoodsReceiptCount}</span>
            <span className="text-[10px] text-slate-400">GRN جاهز</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">{t.procurement_low_stock_urgent || 'نواقص حرجة'}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-black text-amber-400 font-mono">{autoReorders.reduce((acc, g) => acc + g.itemCount, 0)}</span>
            <span className="text-[10px] text-amber-400/80">مطلوب توريد</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="px-6 py-2.5 border-b border-white/5 bg-[#0e1117]/60 flex items-center justify-between gap-4 z-10 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'overview', label: t.procurement_tab_overview || 'الرادار والذكاء المالي', icon: TrendingUp },
            { id: 'orders', label: t.procurement_tab_orders || 'أوامر الشراء والتوريد', icon: Truck, badge: purchaseOrders.length },
            { id: 'matching', label: t.procurement_tab_matching || 'التدقيق والمطابقة الثلاثية', icon: FileCheck2 },
            { id: 'suppliers', label: t.procurement_tab_suppliers || 'دليل الموردين والديون', icon: Building2, badge: suppliers.length },
            { id: 'reorder', label: t.procurement_tab_reorder || 'إعادة التوريد الذكي', icon: Boxes, badge: autoReorders.reduce((a, b) => a + b.itemCount, 0), badgeColor: 'bg-amber-500/20 text-amber-300' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('tap');
                  setActiveTab(tab.id as ProcurementTab);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      tab.badgeColor || (isActive ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-slate-400')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and filters in bar */}
        <div className="flex items-center gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الأمر أو المورد..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 z-0">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & FINANCIAL RADAR */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row: Quick Reorder Banner + Aging Buckets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Auto Replenishment Card */}
              <div className="lg:col-span-1 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      رادار النواقص التلقائي
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {autoReorders.length} موردين جاهزين
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    نواقص المستودع والمطبخ الحرجة
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    تم رصد مكونات غذائية وصلت للحد الأدنى. اضغط لتوليد مسودات أوامر الشراء مجمعة للموردين بضغطة زر واحدة.
                  </p>

                  <div className="mt-4 space-y-2">
                    {autoReorders.slice(0, 3).map((grp) => (
                      <div
                        key={grp.supplierId}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{grp.supplierNameAr}</div>
                          <div className="text-[11px] text-slate-400">{grp.itemCount} أصناف نواقص</div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">
                          {grp.totalEstimatedCost.toLocaleString()} {t.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAutoReorderAll}
                  className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Boxes className="w-4 h-4" />
                  <span>توليد أوامر شراء لجميع النواقص فوراً</span>
                </button>
              </div>

              {/* Payables Aging Analysis Card */}
              <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {t.procurement_aging_title || 'تحليل أعمار الديون والمدفوعات للموردين'}
                        </h3>
                        <p className="text-[11px] text-slate-400">متابعة الفواتير المستحقة والمتأخرة وجدولة السداد</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenPaymentModal()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{t.procurement_record_payment || 'سداد دفعة'}</span>
                    </button>
                  </div>

                  {/* Aging 4-Buckets Visual Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">0 - 30 يوم (حديث)</span>
                      <div className="text-lg font-black text-white font-mono mt-1">
                        {agingSummary?.current.toLocaleString()} <span className="text-[10px] text-slate-500">{t.currency}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[65%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">31 - 60 يوم</span>
                      <div className="text-lg font-black text-white font-mono mt-1">
                        {agingSummary?.days31to60.toLocaleString()} <span className="text-[10px] text-slate-500">{t.currency}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-full w-[35%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">61 - 90 يوم</span>
                      <div className="text-lg font-black text-white font-mono mt-1">
                        {agingSummary?.days61to90.toLocaleString()} <span className="text-[10px] text-slate-500">{t.currency}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[15%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] font-bold text-rose-400 uppercase">+90 يوم (متأخر)</span>
                      <div className="text-lg font-black text-white font-mono mt-1">
                        {agingSummary?.over90.toLocaleString()} <span className="text-[10px] text-slate-500">{t.currency}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-rose-500 h-full w-[5%]" />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Balances Table */}
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
                    <table className="w-full text-xs text-start">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 text-[11px] font-semibold bg-white/[0.02]">
                          <th className="py-2.5 px-3 text-start">المورد</th>
                          <th className="py-2.5 px-3 text-start">شروط الدفع</th>
                          <th className="py-2.5 px-3 text-start">الحد الائتماني</th>
                          <th className="py-2.5 px-3 text-start">الرصيد المستحق</th>
                          <th className="py-2.5 px-3 text-start">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {suppliers.slice(0, 4).map((sup) => (
                          <tr key={sup.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-200">{sup.nameAr}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{sup.paymentTerms}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{sup.creditLimit.toLocaleString()} {t.currency}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{sup.currentBalance.toLocaleString()} {t.currency}</td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleOpenPaymentModal(sup.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-white/10 cursor-pointer"
                              >
                                سداد
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Purchase Orders Feed */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">آخر أوامر الشراء وسلسلة التوريد</h3>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل ({purchaseOrders.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchaseOrders.slice(0, 3).map((po) => (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-amber-400 text-xs">{po.poNumber}</span>
                        {renderStatusBadge(po.status)}
                      </div>
                      <div className="font-bold text-slate-200 text-sm">{po.supplierNameAr}</div>
                      <div className="text-xs text-slate-400 mt-1">{po.items.length} أصناف توريد</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{po.issueDate.substring(0, 10)}</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {po.totalAmount.toLocaleString()} {t.currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PURCHASE ORDERS & LIFECYCLE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs text-slate-400 font-bold me-1">الحالة:</span>
                {(['all', 'draft', 'approved', 'dispatched', 'received', 'paid', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'الكل' : renderStatusBadge(st as PurchaseOrderStatus)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="all">جميع الموردين</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* POs Table */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-[11px] font-semibold bg-white/[0.02]">
                    <th className="py-3.5 px-4 text-start">رقم أمر الشراء</th>
                    <th className="py-3.5 px-4 text-start">المورد</th>
                    <th className="py-3.5 px-4 text-start">التاريخ</th>
                    <th className="py-3.5 px-4 text-start">الأصناف</th>
                    <th className="py-3.5 px-4 text-start">الإجمالي (شامل الضريبة)</th>
                    <th className="py-3.5 px-4 text-start">الحالة الحالية</th>
                    <th className="py-3.5 px-4 text-start">التدقيق الثلاثي</th>
                    <th className="py-3.5 px-4 text-start">إجراءات دورة العمل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPOs.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedPO(po)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                        {po.poNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{po.supplierNameAr}</div>
                        <div className="text-[11px] text-slate-400">{po.deliveryLocation}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {po.issueDate.substring(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {po.items.length} صنف ({po.items.reduce((acc, i) => acc + i.quantityOrdered, 0)} وحدة)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                        {po.totalAmount.toLocaleString()} {t.currency}
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(po.status)}</td>
                      <td className="py-3.5 px-4">{renderMatchBadge(po.matchingReport)}</td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>اعتماد</span>
                            </button>
                          )}
                          {po.status === 'approved' && (
                            <button
                              onClick={() => handleDispatchPO(po.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Truck className="w-3 h-3" />
                              <span>شحن</span>
                            </button>
                          )}
                          {po.status === 'dispatched' && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Boxes className="w-3 h-3" />
                              <span>استلام GRN</span>
                            </button>
                          )}
                          {po.status === 'received' && (
                            <button
                              onClick={() => {
                                setSelectedMatchPO(po);
                                setIsMatchModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>مطابقة 3-Way</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPO(po)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: THREE-WAY MATCHING ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'matching' && (
          <div className="space-y-6">
            {/* Header Radar */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {t.procurement_tab_matching || 'محرك التدقيق والفحص ثلاثي الأطراف (3-Way Matching Engine)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      مقارنة آلية فورية بين أمر الشراء التعاقدي (PO) ومذكرة الاستلام الفعلية (GRN) وفاتورة المورد الضريبية (Invoice)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanInvoiceModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>مسح فاتورة رقمية (OCR)</span>
                </button>
              </div>
            </div>

            {/* Three-Way Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: PO Pillar */}
              <div className="rounded-3xl bg-slate-900/80 border border-blue-500/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="font-bold text-sm text-blue-300">أمر الشراء (PO)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">الكميات والأسعار المعتمدة</span>
                </div>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>رقم العقد / الأمر:</span>
                    <span className="font-bold text-white font-mono">PO-2026-0801</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المورد:</span>
                    <span className="font-bold text-white">شركة المراعي</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الإجمالي التعاقدي:</span>
                    <span className="font-bold font-mono text-blue-400 text-sm">2,311.50 ر.س</span>
                  </div>
                </div>
              </div>

              {/* Step 2: GRN Pillar */}
              <div className="rounded-3xl bg-slate-900/80 border border-purple-500/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="font-bold text-sm text-purple-300">مذكرة الاستلام (GRN)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">الكميات المستلمة وفحص الجودة</span>
                </div>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>رقم سند الاستلام:</span>
                    <span className="font-bold text-white font-mono">GRN-2026-0801</span>
                  </div>
                  <div className="flex justify-between">
                    <span>فحص الجودة والتبريد:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <ThermometerSnowflake className="w-3.5 h-3.5" />
                      3.2°C (مطابق)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الكميات المقبولة:</span>
                    <span className="font-bold font-mono text-purple-400 text-sm">50 وحدة (100%)</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Invoice Pillar */}
              <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span className="font-bold text-sm text-emerald-300">فاتورة المورد (Invoice)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">الفاتورة الضريبية ZATCA</span>
                </div>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold text-white font-mono">INV-ALM-2026-8812</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة الختم الإلكتروني:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      موثقة رقمياً ZATCA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الفاتورة المفوتر:</span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">2,311.50 ر.س</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line-by-Line Match Verification Table */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">جدول التحقق والتدقيق السطري للصنف</h4>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  نتيجة الفحص: مطابقة تامة (Zero Discrepancy)
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-[11px] bg-white/[0.02]">
                      <th className="py-3 px-3 text-start">الصنف</th>
                      <th className="py-3 px-3 text-start">كمية أمر الشراء (PO)</th>
                      <th className="py-3 px-3 text-start">المستلم بالمستودع (GRN)</th>
                      <th className="py-3 px-3 text-start">المفوتر بالفاتورة (INV)</th>
                      <th className="py-3 px-3 text-start">سعر الوحدة التعاقدي</th>
                      <th className="py-3 px-3 text-start">سعر الوحدة بالفاتورة</th>
                      <th className="py-3 px-3 text-start">الفرق</th>
                      <th className="py-3 px-3 text-start">قرار المطابقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-bold text-slate-200">حليب كامل الدسم مبستر (12 لتر)</td>
                      <td className="py-3 px-3 font-mono">20 كرتون</td>
                      <td className="py-3 px-3 font-mono text-purple-300">20 كرتون</td>
                      <td className="py-3 px-3 font-mono text-emerald-300">20 كرتون</td>
                      <td className="py-3 px-3 font-mono">48.00 ر.س</td>
                      <td className="py-3 px-3 font-mono">48.00 ر.س</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">0.00 ر.س</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          مطابق 100%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-bold text-slate-200">جبن موزاريلا طبيعي مبشور (2 كغ)</td>
                      <td className="py-3 px-3 font-mono">30 كغ</td>
                      <td className="py-3 px-3 font-mono text-purple-300">30 كغ</td>
                      <td className="py-3 px-3 font-mono text-emerald-300">30 كغ</td>
                      <td className="py-3 px-3 font-mono">35.00 ر.س</td>
                      <td className="py-3 px-3 font-mono">35.00 ر.س</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">0.00 ر.س</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          مطابق 100%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SUPPLIERS DIRECTORY & LEDGER */}
        {/* ========================================================================= */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="rounded-3xl bg-slate-900/70 border border-white/10 p-5 shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-amber-400">★ {sup.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500">({sup.onTimeDeliveryRate}% دقة مواعيد)</span>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      {sup.nameAr}
                    </h4>
                    <p className="text-xs text-slate-400">{sup.nameEn}</p>
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[11px]">{sup.category}</span>
                      <span className="text-slate-500 font-mono">📍 {sup.city}</span>
                    </div>

                    {/* Credit Limit & Balance Bar */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">الرصيد المستحق (الدين):</span>
                        <span className="font-mono font-bold text-rose-400">{sup.currentBalance.toLocaleString()} {t.currency}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (sup.currentBalance / sup.creditLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>الحد: {sup.creditLimit.toLocaleString()} {t.currency}</span>
                        <span>متاح: {(sup.creditLimit - sup.currentBalance).toLocaleString()} {t.currency}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>المسؤول:</span>
                        <span className="text-slate-200">{sup.contactPerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الهاتف:</span>
                        <span className="text-slate-200 font-mono">{sup.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الرقم الضريبي:</span>
                        <span className="text-slate-200 font-mono">{sup.taxNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-2">
                    <button
                      onClick={() => handleViewStatement(sup)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                      <span>كشف حساب</span>
                    </button>

                    <button
                      onClick={() => handleOpenPaymentModal(sup.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>سداد دفعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SMART AUTO-REORDER SUGGESTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'reorder' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">رادار النواقص وحساب كميات إعادة الطلب الاقتصادية (EOQ)</h3>
                <p className="text-xs text-slate-400">
                  تحليل استهلاك المخزون اللحظي وتوليد أوامر الشراء مجمعة حسب الموردين المعتمدين مع حساب التكلفة التقديرية
                </p>
              </div>

              <button
                onClick={handleAutoReorderAll}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Boxes className="w-4 h-4" />
                <span>إنشاء كافة أوامر الشراء المقترحة</span>
              </button>
            </div>

            <div className="space-y-4">
              {autoReorders.map((grp) => (
                <div key={grp.supplierId} className="rounded-3xl bg-slate-900/70 border border-white/10 p-5 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{grp.supplierNameAr}</h4>
                        <div className="text-[11px] text-slate-400">
                          سرعة التوريد: {grp.leadTimeDays} أيام | شروط الدفع: {grp.paymentTerms}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <div className="text-[11px] text-slate-400">إجمالي الطلب التقديري:</div>
                        <div className="font-mono font-black text-amber-400 text-base">
                          {grp.totalEstimatedCost.toLocaleString()} {t.currency}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          playSound('cash-register');
                          await procurementService.createDraftOrdersFromSuggestions([grp.supplierId]);
                          reloadData();
                          setActiveTab('orders');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إنشاء أمر شراء لهذا المورد</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List in Suggestion */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {grp.items.map((item) => (
                      <div
                        key={item.inventoryItemId}
                        className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{item.nameAr}</span>
                            {item.urgency === 'critical' ? (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                حرج جداً
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                منخفض
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            المتبقي: <span className="font-mono text-rose-400 font-bold">{item.currentStock} {item.unit}</span> (الحد الأدنى: {item.minStockAlert} {item.unit})
                          </div>
                        </div>

                        <div className="text-end font-mono">
                          <div className="text-amber-300 font-bold">
                            + {item.suggestedReorderQuantity} {item.unit}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.estimatedTotal.toLocaleString()} {t.currency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: CREATE PURCHASE ORDER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreatePoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">إنشاء أمر شراء وتوريد جديد</h3>
                </div>
                <button
                  onClick={() => setIsCreatePoModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">المورد المعتمد:</label>
                  <select
                    value={newPoSupplierId}
                    onChange={(e) => setNewPoSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500/50"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">موقع التسليم والاستلام:</label>
                  <input
                    type="text"
                    value={newPoDeliveryLocation}
                    onChange={(e) => setNewPoDeliveryLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-bold">الأصناف المطلوبة:</label>
                    <button
                      onClick={() => {
                        setNewPoItems([
                          ...newPoItems,
                          {
                            inventoryItemId: `custom-item-${Date.now()}`,
                            inventoryItemNameAr: 'صنف إضافي جديد',
                            inventoryItemNameEn: 'Additional Item',
                            sku: 'SKU-EXTRA',
                            unit: 'kg',
                            quantityOrdered: 5,
                            unitPriceContracted: 50,
                            taxRate: 0.15,
                          },
                        ]);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة صنف</span>
                    </button>
                  </div>

                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-white/5 grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={item.inventoryItemNameAr}
                        onChange={(e) => {
                          const copy = [...newPoItems];
                          copy[idx].inventoryItemNameAr = e.target.value;
                          setNewPoItems(copy);
                        }}
                        className="col-span-4 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        placeholder="اسم المكون"
                      />
                      <input
                        type="number"
                        value={item.quantityOrdered}
                        onChange={(e) => {
                          const copy = [...newPoItems];
                          copy[idx].quantityOrdered = Number(e.target.value);
                          setNewPoItems(copy);
                        }}
                        className="col-span-2 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        placeholder="الكمية"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => {
                          const copy = [...newPoItems];
                          copy[idx].unit = e.target.value;
                          setNewPoItems(copy);
                        }}
                        className="col-span-2 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        placeholder="الوحدة"
                      />
                      <input
                        type="number"
                        value={item.unitPriceContracted}
                        onChange={(e) => {
                          const copy = [...newPoItems];
                          copy[idx].unitPriceContracted = Number(e.target.value);
                          setNewPoItems(copy);
                        }}
                        className="col-span-3 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        placeholder="السعر"
                      />
                      <button
                        onClick={() => {
                          if (newPoItems.length > 1) {
                            setNewPoItems(newPoItems.filter((_, i) => i !== idx));
                          }
                        }}
                        className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">ملاحظات وشروط خاصة:</label>
                  <textarea
                    rows={2}
                    value={newPoNotes}
                    onChange={(e) => setNewPoNotes(e.target.value)}
                    placeholder="تعليمات التوصيل، درجات الحرارة المطلوبة للشاحنة..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Total Summary */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="font-bold text-amber-300">الإجمالي التقديري مع الضريبة (15%):</span>
                  <span className="font-mono font-black text-amber-400 text-base">
                    {(
                      newPoItems.reduce((acc, i) => acc + i.quantityOrdered * i.unitPriceContracted, 0) * 1.15
                    ).toLocaleString()}{' '}
                    {t.currency}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsCreatePoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreatePO}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وإنشاء مسودة الأمر</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: GOODS RECEIPT (GRN) & QUALITY INSPECTION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isReceiveModalOpen && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">استلام البضاعة وفحص الجودة (GRN)</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedPO.poNumber}</p>
                  </div>
                </div>
                <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">اسم مسؤول الفحص والاستلام:</label>
                  <input
                    type="text"
                    value={grnInspectorName}
                    onChange={(e) => setGrnInspectorName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>

                {/* HACCP Checklist */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-purple-300">
                    <ThermometerSnowflake className="w-4 h-4 text-purple-400" />
                    <span>فحص معايير الجودة والتخزين (HACCP):</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">درجة حرارة شاحنة التبريد (°C):</span>
                    <input
                      type="number"
                      step="0.1"
                      value={grnTemp}
                      onChange={(e) => setGrnTemp(Number(e.target.value))}
                      className="w-24 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-cyan-300"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={grnPackagingIntact}
                      onChange={(e) => setGrnPackagingIntact(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span>سلامة التغليف وخلوه من التلف أو التسريب</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={grnExpiryValid}
                      onChange={(e) => setGrnExpiryValid(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span>تاريخ الصلاحية مطابق للمواصفات ومتبقي 80%+ من العمر</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={grnSensoryPassed}
                      onChange={(e) => setGrnSensoryPassed(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span>الفحص الحسي (اللون، الرائحة، القوام) سليم 100%</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">ملاحظات الاستلام:</label>
                  <textarea
                    rows={2}
                    value={grnNotes}
                    onChange={(e) => setGrnNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmGoodsReceipt}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد الاستلام وتحديث المخزون (WAC)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: PAPERLESS OCR INVOICE SCANNER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isScanInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">فحص وقراءة فواتير الموردين بالذكاء الاصطناعي (OCR)</h3>
                </div>
                <button onClick={() => setIsScanInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {ocrScanningState === 'idle' && (
                <div className="p-8 border-2 border-dashed border-cyan-500/30 rounded-3xl text-center space-y-4 bg-cyan-500/[0.02]">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                    <QrCode className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">اسحب وأفلت فاتورة المورد الضريبية هنا</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      يدعم صور الفواتير، ملفات PDF، واستخراج الختم الرقمي ZATCA Phase-2
                    </p>
                  </div>

                  <button
                    onClick={handleSimulateOcrScan}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    بدء المسح واستخراج البيانات الآن
                  </button>
                </div>
              )}

              {ocrScanningState === 'scanning' && (
                <div className="p-12 text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                  <div className="font-bold text-white text-sm">جاري معالجة الفاتورة واستخراج البنود بالـ Vision AI...</div>
                  <p className="text-xs text-slate-400">فحص الرقم الضريبي، تطابق الأصناف، ومعادلات حساب الضريبة</p>
                </div>
              )}

              {ocrScanningState === 'scanned' && ocrResult && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>تم استخراج وتوثيق الفاتورة بنجاح (دقة 98.5%)</span>
                    </div>
                    <span className="font-mono text-slate-400">{ocrResult.invoiceNumber}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المورد المفوتر:</span>
                      <span className="font-bold text-white">{ocrResult.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الرقم الضريبي:</span>
                      <span className="font-mono">{ocrResult.taxNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الإجمالي المستحق:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {ocrResult.totalAmount.toLocaleString()} {t.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setOcrScanningState('idle')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      إعادة المسح
                    </button>
                    <button
                      onClick={handleApplyOcrToThreeWayMatch}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>تحويل للتدقيق والمطابقة الثلاثية</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: RECORD SUPPLIER PAYMENT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">تسجيل وسداد دفعة للمورد</h3>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">المورد المستفيد:</label>
                <select
                  value={paymentSupplierId}
                  onChange={(e) => setPaymentSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr} (مستحق: {s.currentBalance.toLocaleString()} {t.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">مبلغ الدفعة ({t.currency}):</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">طريقة السداد:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as ProcurementPaymentMethod)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none"
                >
                  <option value="bank_transfer">حوالة بنكية سريعة (SARIE / IBAN)</option>
                  <option value="sadad">نظام سداد المالي (SADAD)</option>
                  <option value="check">شيك مصرفي معتمد</option>
                  <option value="cash">نقداً (عهدة الفرع)</option>
                  <option value="pos_card">بطاقة مدى / ائتمان</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">الرقم المرجعي / إيصال التحويل:</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRecordPaymentSubmit}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد السداد وخصم المديونية</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: SUPPLIER STATEMENT OF ACCOUNT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isStatementModalOpen && selectedSupplierForStatement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">كشف حساب ومطابقة المورد</h3>
                  <p className="text-xs text-slate-400">{selectedSupplierForStatement.nameAr}</p>
                </div>
                <button onClick={() => setIsStatementModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Statement Summary Card */}
              {(() => {
                const stmt = procurementService.getSupplierStatementOfAccount(selectedSupplierForStatement.id);
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-slate-400">إجمالي الفواتير:</span>
                        <div className="font-mono font-bold text-white text-sm mt-1">{stmt.totalDebits.toLocaleString()} {t.currency}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-slate-400">إجمالي المسدد:</span>
                        <div className="font-mono font-bold text-emerald-400 text-sm mt-1">{stmt.totalCredits.toLocaleString()} {t.currency}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-slate-400">الرصيد الختامي:</span>
                        <div className="font-mono font-bold text-rose-400 text-sm mt-1">{stmt.closingBalance.toLocaleString()} {t.currency}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/5">
                      <table className="w-full text-xs text-start">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 text-[11px] bg-white/[0.02]">
                            <th className="py-2.5 px-3 text-start">التاريخ</th>
                            <th className="py-2.5 px-3 text-start">البيان</th>
                            <th className="py-2.5 px-3 text-start">مدين (+)</th>
                            <th className="py-2.5 px-3 text-start">دائن (-)</th>
                            <th className="py-2.5 px-3 text-start">الرصيد المتحرك</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {stmt.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/[0.02]">
                              <td className="py-2 px-3 text-slate-400 font-mono">{tx.date.substring(0, 10)}</td>
                              <td className="py-2 px-3 font-medium text-slate-200">{tx.description}</td>
                              <td className="py-2 px-3 font-mono font-bold text-rose-400">
                                {tx.debit > 0 ? `${tx.debit.toLocaleString()} ${t.currency}` : '-'}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                {tx.credit > 0 ? `${tx.credit.toLocaleString()} ${t.currency}` : '-'}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-white">
                                {tx.runningBalance.toLocaleString()} {t.currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: PO DETAILS & LIFECYCLE STEPPER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="font-mono font-black text-amber-400 text-lg">{selectedPO.poNumber}</div>
                  {renderStatusBadge(selectedPO.status)}
                </div>
                <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lifecycle Progress Stepper */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  مراحل دورة حياة التوريد
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { id: 'draft', label: '1. مسودة' },
                    { id: 'approved', label: '2. معتمد' },
                    { id: 'dispatched', label: '3. مشحون' },
                    { id: 'received', label: '4. مستلم' },
                  ].map((step, idx) => {
                    const isPassed =
                      selectedPO.status === step.id ||
                      (step.id === 'draft' && selectedPO.status !== 'cancelled') ||
                      (step.id === 'approved' && (selectedPO.status === 'dispatched' || selectedPO.status === 'received' || selectedPO.status === 'paid')) ||
                      (step.id === 'dispatched' && (selectedPO.status === 'received' || selectedPO.status === 'paid')) ||
                      (step.id === 'received' && selectedPO.status === 'paid');

                    return (
                      <div
                        key={step.id}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          isPassed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-white/[0.02] text-slate-500 border-white/5'
                        }`}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">أصناف أمر الشراء:</span>
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-[11px] bg-white/[0.02]">
                        <th className="py-2 px-3 text-start">الصنف</th>
                        <th className="py-2 px-3 text-start">الكمية</th>
                        <th className="py-2 px-3 text-start">سعر الوحدة</th>
                        <th className="py-2 px-3 text-start">الضريبة (15%)</th>
                        <th className="py-2 px-3 text-start">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedPO.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-bold text-slate-200">{item.inventoryItemNameAr}</td>
                          <td className="py-2 px-3 font-mono">{item.quantityOrdered} {item.unit}</td>
                          <td className="py-2 px-3 font-mono">{item.unitPriceContracted.toFixed(2)} {t.currency}</td>
                          <td className="py-2 px-3 font-mono text-slate-400">{item.taxAmount.toFixed(2)} {t.currency}</td>
                          <td className="py-2 px-3 font-mono font-bold text-white">{item.total.toFixed(2)} {t.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons in Stepper */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="font-mono font-black text-amber-400 text-lg">
                  {selectedPO.totalAmount.toLocaleString()} {t.currency}
                </div>

                <div className="flex items-center gap-2">
                  {selectedPO.status === 'draft' && (
                    <button
                      onClick={() => handleApprovePO(selectedPO.id)}
                      className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد أمر الشراء</span>
                    </button>
                  )}
                  {selectedPO.status === 'approved' && (
                    <button
                      onClick={() => handleDispatchPO(selectedPO.id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>تأكيد شحن المورد</span>
                    </button>
                  )}
                  {selectedPO.status === 'dispatched' && (
                    <button
                      onClick={() => handleOpenReceiveModal(selectedPO)}
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Boxes className="w-4 h-4" />
                      <span>فحص واستلام البضاعة (GRN)</span>
                    </button>
                  )}
                  {selectedPO.status === 'received' && (
                    <button
                      onClick={() => handleOpenPaymentModal(selectedPO.supplierId, selectedPO)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>سداد الفاتورة</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
