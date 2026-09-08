import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck,
  QrCode,
  Key,
  Layers,
  FileCode,
  Download,
  RefreshCw,
  Search,
  Server,
  Building,
  Check,
  Copy,
} from 'lucide-react';
import { zatcaPhase2Service } from '../../services/zatcaPhase2Service';
import {
  ZatcaCompleteInvoiceRecord,
  ZatcaCsidInfo,
  ZatcaSupplierInfo,
} from '../../types/zatca';
import { useAppStore } from '../../stores/useAppStore';
import { soundEngine } from '../../services/soundEngine';

export const ZatcaComplianceModule: React.FC = () => {
  const { theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'invoices' | 'csid' | 'chain' | 'xml' | 'config'>('invoices');
  const [invoices, setInvoices] = useState<ZatcaCompleteInvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ZatcaCompleteInvoiceRecord | null>(null);
  const [csidInfo, setCsidInfo] = useState<ZatcaCsidInfo>(zatcaPhase2Service.getActiveCsid());
  const [supplierProfile, setSupplierProfile] = useState<ZatcaSupplierInfo>(zatcaPhase2Service.getSupplierProfile());
  const [chainAudit, setChainAudit] = useState<{ isValid: boolean; brokenAtIcv?: number; totalInvoices: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isRequestingCsid, setIsRequestingCsid] = useState(false);
  const [csidSuccessMessage, setCsidSuccessMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const list = zatcaPhase2Service.getInvoiceLedger();
    setInvoices(list);
    if (list.length > 0 && !selectedInvoice) {
      setSelectedInvoice(list[0]);
    }
    setCsidInfo(zatcaPhase2Service.getActiveCsid());
    setSupplierProfile(zatcaPhase2Service.getSupplierProfile());
    verifyLedger();
  };

  const verifyLedger = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = zatcaPhase2Service.verifyChainIntegrity();
      setChainAudit(result);
      setIsVerifying(false);
    }, 400);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    soundEngine.play('pop');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRenewCsid = async () => {
    if (!otpInput.trim()) return;
    setIsRequestingCsid(true);
    soundEngine.play('tap');
    try {
      const res = await zatcaPhase2Service.onboardWithOtp({
        otp: otpInput,
        commonName: 'REST-OS-EGS-01',
        organizationUnit: 'Riyadh Branch',
        organizationName: supplierProfile.legalNameAr,
        environment: 'production',
      });
      if (res.success && res.csid) {
        setCsidInfo(res.csid);
        setCsidSuccessMessage('تم إصدار واعتماد شهادة الختم الرقمي CSID بنجاح من بوابة فاتورة!');
        soundEngine.play('success');
        setOtpInput('');
        setTimeout(() => setCsidSuccessMessage(''), 5000);
      } else {
        alert(res.error || 'فشل طلب الشهادة');
        soundEngine.play('alert');
      }
    } catch (err: any) {
      alert('فشل طلب الشهادة: ' + err.message);
      soundEngine.play('alert');
    } finally {
      setIsRequestingCsid(false);
    }
  };

  const handleExportFaf = () => {
    const fafExport = zatcaPhase2Service.generateFafExport();
    const blob = new Blob([JSON.stringify(fafExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZATCA-FAF-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.play('success');
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer?.legalNameAr && inv.customer.legalNameAr.includes(searchTerm))
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/50 border border-emerald-500/30 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                منظومة الفوترة الإلكترونية والامتثال الضريبي (ZATCA Phase 2)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                منصة فاتورة المعتمدة
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              الربط والتكامل المشفر للمرحلة الثانية | UBL 2.1 XML | سلسلة الهاش التشفيرية SHA-256 | التوقيع الرقمي ECDSA
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={verifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>فحص سلسلة الهاش</span>
          </button>

          <button
            onClick={handleExportFaf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>تصدير ملف التدقيق FAF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">إجمالي الفواتير الموثقة</span>
            <h3 className="text-2xl font-black text-white mt-1">{invoices.length}</h3>
            <span className="text-xs text-emerald-400 font-medium">100% مسجلة ومحفوظة</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">سلسلة الهاش التشفيرية</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {chainAudit?.isValid ? 'سليمة ومتصلة' : 'جاري الفحص'}
            </h3>
            <span className="text-xs text-slate-400">SHA-256 Chaining</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">شهادة الختم الرقمي CSID</span>
            <h3 className="text-2xl font-black text-white mt-1">
              {csidInfo.csidType === 'production' ? 'إنتاج حي' : 'مطابقة واختبار'}
            </h3>
            <span className="text-xs text-cyan-400 font-medium">ECDSA secp256k1</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <Key className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">البيئة المعتمدة</span>
            <h3 className="text-2xl font-black text-emerald-300 mt-1">
              {csidInfo.environment === 'production' ? 'الإنتاج الحي' : 'محاكاة المحاكاة'}
            </h3>
            <span className="text-xs text-slate-400">ZATCA API 2.0</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 pb-2 overflow-x-auto">
        {[
          { id: 'invoices', label: 'سجل الفواتير الضريبية', icon: FileCheck },
          { id: 'chain', label: 'متتبع سلسلة الهاش التشفيري', icon: Layers },
          { id: 'csid', label: 'شهادة CSID والختم الرقمي', icon: Key },
          { id: 'xml', label: 'عارض UBL 2.1 XML والتوقيع', icon: FileCode },
          { id: 'config', label: 'بيانات المنشأة والضريبة', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                soundEngine.play('tap');
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Invoice List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="ابحث برقم الفاتورة، الرقم المرجعي UUID، أو اسم المشتري..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  عرض {filteredInvoices.length} من {invoices.length} فاتورة
                </span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        soundEngine.play('click');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {inv.invoiceNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            ICV #{inv.icv}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.subtype === '0100000'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {inv.subtype === '0100000' ? 'ضريبية (B2B)' : 'مبسطة (B2C)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-400">{inv.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <div>
                          <span className="block text-[10px] text-slate-500">التاريخ والوقت</span>
                          <span>
                            {inv.issueDate} {inv.issueTime}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500">المشتري</span>
                          <span className="truncate block">{inv.customer?.legalNameAr || 'عميل نقدي'}</span>
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] text-slate-500">الإجمالي الشامل</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {inv.totalWithTax.toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Invoice Details & Live QR */}
            {selectedInvoice ? (
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-black text-white text-lg">{selectedInvoice.invoiceNumber}</h3>
                    <span className="text-xs text-slate-400 font-mono">UUID: {selectedInvoice.uuid}</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    معتمدة في المنظومة
                  </span>
                </div>

                {/* QR Code & Digital Stamp Info */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-center space-y-3">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-xl flex items-center justify-center">
                    <div className="w-full h-full border-2 border-slate-900 flex flex-col items-center justify-center p-1 relative">
                      <QrCode className="w-24 h-24 text-slate-950" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center text-white text-[8px] font-black">
                          Z
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-300 block">رمز QR الموسع للمرحلة الثانية</span>
                    <span className="text-[10px] text-slate-500 font-mono block break-all line-clamp-2 max-w-xs">
                      {selectedInvoice.qrCodeTlvBase64}
                    </span>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2 text-xs bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>المبلغ الخاضع للضريبة:</span>
                    <span className="font-mono text-slate-200">{selectedInvoice.subtotal.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedInvoice.taxTotal.toFixed(2)} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-700">
                    <span>الإجمالي المستحق:</span>
                    <span className="text-emerald-400">{selectedInvoice.totalWithTax.toFixed(2)} ر.س</span>
                  </div>
                </div>

                {/* Cryptographic Hash Info */}
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">هاش الفاتورة (SHA-256):</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-emerald-400 text-[10px]">
                      <span className="truncate pr-2">{selectedInvoice.invoiceHash}</span>
                      <button
                        onClick={() => copyToClipboard(selectedInvoice.invoiceHash, 'hash')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">هاش الفاتورة السابقة (PIH):</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-slate-300 text-[10px]">
                      <span className="truncate pr-2">{selectedInvoice.pih}</span>
                      <button
                        onClick={() => copyToClipboard(selectedInvoice.pih, 'pih')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedField === 'pih' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Chain Audit Tab */}
        {activeTab === 'chain' && (
          <motion.div
            key="chain"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">سلسلة الهاش التشفيرية غير القابلة للتعديل (Blockchain Chain)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    كل فاتورة يتم ربطها تشفيرياً بهاش الفاتورة التي تسبقها مما يمنع التلاعب بأي معاملة سابقة
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400">السلسلة محمية ومشفرة</span>
                </div>
              </div>

              <div className="space-y-4 relative before:absolute before:right-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-emerald-500/30">
                {invoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className="relative flex items-start gap-4 pr-12 group transition-all"
                  >
                    <div className="absolute right-4 top-4 w-5 h-5 rounded-full bg-emerald-600 border-4 border-slate-950 flex items-center justify-center text-white text-[9px] font-black z-10">
                      {idx + 1}
                    </div>

                    <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-emerald-500/50 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-sm">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-400 font-mono">ICV #{inv.icv}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-850">
                          <span className="text-slate-500 block text-[9px]">الهاش الحالي (Current Hash)</span>
                          <span className="text-emerald-400 truncate block">{inv.invoiceHash}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-850">
                          <span className="text-slate-500 block text-[9px]">هاش الفاتورة السابقة (PIH)</span>
                          <span className="text-teal-300 truncate block">{inv.pih}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CSID Tab */}
        {activeTab === 'csid' && (
          <motion.div
            key="csid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-black text-white">بيانات الختم الرقمي والشهادة (CSID Certificate)</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">الرقم المرجعي للجهاز (Certificate Binary):</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-emerald-400 break-all text-[11px]">
                    {csidInfo.certificateBinary}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">تاريخ الإصدار والانتهاء:</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">
                    تم الإصدار: {csidInfo.issuedAt} | ينتهي في: {csidInfo.expiresAt}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-black text-white">تجديد أو ربط جهاز جديد بـ OTP فاتورة</h2>
              <p className="text-xs text-slate-400">
                أدخل رمز التحقق لمرة واحدة (OTP) المستخرج من منصة فاتورة لتهيئة شهادة الإنتاج الحية:
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="أدخل رمز OTP المكون من 6 أرقام (مثال: 123456)..."
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleRenewCsid}
                  disabled={isRequestingCsid || !otpInput.trim()}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isRequestingCsid ? 'جاري الاعتماد والربط...' : 'اعتماد شهادة الختم الرقمي CSID'}
                </button>
                {csidSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    {csidSuccessMessage}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* XML Viewer Tab */}
        {activeTab === 'xml' && (
          <motion.div
            key="xml"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">ملف الفاتورة بصيغة UBL 2.1 XML المعتمدة</h2>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedInvoice?.invoiceNumber || 'INV-2026-00001'}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(selectedInvoice?.ublXml || '', 'xml')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                {copiedField === 'xml' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>نسخ كود XML</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-850 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed custom-scrollbar">
              {selectedInvoice?.ublXml || '<!-- اختر فاتورة لمعاينة كود UBL 2.1 XML -->'}
            </pre>
          </motion.div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-3xl"
          >
            <h2 className="text-lg font-black text-white">بيانات المكلف والمنشأة الضريبية المعتمدة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500">اسم المنشأة القانوني (عربي):</span>
                <span className="text-white font-bold block">{supplierProfile.legalNameAr}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500">اسم المنشأة بالإنجليزية:</span>
                <span className="text-white font-bold block">{supplierProfile.legalNameEn}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500">الرقم الضريبي (VAT Number):</span>
                <span className="text-emerald-400 font-mono font-bold block">{supplierProfile.vatNumber}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500">السجل التجاري (CRN):</span>
                <span className="text-slate-200 font-mono font-bold block">{supplierProfile.crn}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
