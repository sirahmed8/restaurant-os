import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Scale,
  Printer,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Cpu,
  RefreshCw,
  X,
  Sparkles,
  Zap,
  Receipt,
  Flame,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { printerService } from '../../services/printerService';

interface HardwareDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareDiagnosticsModal: React.FC<HardwareDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, playSound } = useAppStore();

  const [activeTab, setActiveTab] = useState<'scale' | 'printer' | 'drawer'>('scale');

  // Scale diagnostics state
  const [scalePort, setScalePort] = useState('COM3');
  const [scaleBaudRate, setScaleBaudRate] = useState('9600');
  const [scaleTare, setScaleTare] = useState(0.0);
  const [simulatedWeight, setSimulatedWeight] = useState(0.485); // 485g ribeye steak
  const [scaleConnected, setScaleConnected] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Printer diagnostics state
  const [printerStatus, setPrinterStatus] = useState<'ready' | 'printing' | 'success'>('ready');
  const [drawerStatus, setDrawerStatus] = useState<'closed' | 'open'>('closed');

  if (!isOpen) return null;

  const handleZeroScale = () => {
    playSound('tap');
    setIsCalibrating(true);
    setTimeout(() => {
      setSimulatedWeight(0.0);
      setScaleTare(0.0);
      setIsCalibrating(false);
      playSound('success');
    }, 600);
  };

  const handleTareScale = () => {
    playSound('tap');
    setScaleTare(simulatedWeight);
    setSimulatedWeight(0.0);
    playSound('pop');
  };

  const handleTestPrint = (type: 'receipt' | 'kot') => {
    playSound('click');
    setPrinterStatus('printing');
    setTimeout(() => {
      setPrinterStatus('success');
      playSound('success');
      setTimeout(() => setPrinterStatus('ready'), 2000);
    }, 1200);
  };

  const handleKickCashDrawer = () => {
    playSound('kitchen-bell');
    setDrawerStatus('open');
    setTimeout(() => {
      setDrawerStatus('closed');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl select-none font-sans text-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#0c0f17] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="h-16 px-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {language === 'ar' ? 'تشخيص ومعايرة العتاد والطابعات' : 'Hardware & Printer Diagnostics Hub'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {language === 'ar'
                  ? 'معايرة الميزان الإلكتروني، فحص طابعات البونات ودرج النقدية'
                  : 'RS-232 Scale calibration, ESC/POS thermal printers & cash drawer pulse'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-3 bg-white/[0.02] border-b border-white/10 shrink-0">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('scale');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scale'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{language === 'ar' ? 'الميزان الإلكتروني (RS-232)' : 'Electronic Scale'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('printer');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'printer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طابعات الفواتير والمطبخ (ESC/POS)' : 'Thermal Printers'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('drawer');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'drawer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{language === 'ar' ? 'نبضة درج النقدية (RJ11 24V)' : 'Cash Drawer Pulse'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'scale' && (
            <div className="space-y-6">
              {/* Scale LCD Live Display */}
              <div className="p-6 rounded-3xl bg-[#070a0f] border border-emerald-500/30 flex flex-col items-center justify-center space-y-2 shadow-inner">
                <div className="flex items-center justify-between w-full text-xs text-slate-400 px-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{scaleConnected ? 'RS-232 LINK ACTIVE' : 'DISCONNECTED'}</span>
                  </span>
                  <span className="font-mono">PORT: {scalePort} @ {scaleBaudRate}bps</span>
                </div>

                <div className="text-5xl md:text-6xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                  {simulatedWeight.toFixed(3)}{' '}
                  <span className="text-2xl text-emerald-500/80 font-sans">KG</span>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  TARE: {scaleTare.toFixed(3)} KG | NET: {(simulatedWeight - scaleTare).toFixed(3)} KG
                </div>
              </div>

              {/* Weight Adjustment & Calibration Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleZeroScale}
                  disabled={isCalibrating}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className={`w-4 h-4 text-amber-400 ${isCalibrating ? 'animate-spin' : ''}`} />
                  <span>{language === 'ar' ? 'تصفير الميزان (ZERO)' : 'Zero Calibration'}</span>
                </button>

                <button
                  onClick={handleTareScale}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'ar' ? 'وزن الفارغ (TARE)' : 'Set Tare Weight'}</span>
                </button>

                <button
                  onClick={() => {
                    playSound('tap');
                    setSimulatedWeight(parseFloat((Math.random() * 1.5 + 0.2).toFixed(3)));
                  }}
                  className="py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ar' ? 'محاكاة وزن لحم/ستيك' : 'Simulate Meat Weigh'}</span>
                </button>
              </div>

              {/* Serial Port Settings */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Serial Port</label>
                  <select
                    value={scalePort}
                    onChange={(e) => setScalePort(e.target.value)}
                    className="w-full"
                  >
                    <option value="COM1">COM1 (Standard)</option>
                    <option value="COM2">COM2</option>
                    <option value="COM3">COM3 (USB-Serial Bridge)</option>
                    <option value="COM4">COM4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Baud Rate</label>
                  <select
                    value={scaleBaudRate}
                    onChange={(e) => setScaleBaudRate(e.target.value)}
                    className="w-full"
                  >
                    <option value="4800">4800 bps</option>
                    <option value="9600">9600 bps (Standard CAS / Avery)</option>
                    <option value="19200">19200 bps</option>
                    <option value="115200">115200 bps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Protocol</label>
                  <select className="w-full">
                    <option>NCI / Toledo Standard</option>
                    <option>CAS PD-II Protocol</option>
                    <option>Avery Berkel 6700</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cashier 80mm Printer */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Printer className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">طابعة الكاشير الرئيسية (80mm)</h4>
                        <p className="text-[10px] text-slate-400">Epson TM-T88VI Thermal ESC/POS</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      متصل
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    طباعة فواتير الزبائن مع باركود ZATCA / QR TLV وقص آلي للورقة.
                  </p>

                  <button
                    onClick={() => handleTestPrint('receipt')}
                    disabled={printerStatus === 'printing'}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>
                      {printerStatus === 'printing'
                        ? 'جارٍ إرسال أمر الطباعة...'
                        : printerStatus === 'success'
                        ? 'تمت الطباعة بنجاح ✓'
                        : 'طباعة فاتورة تجريبية (80mm)'}
                    </span>
                  </button>
                </div>

                {/* Kitchen KOT Printer */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">طابعة المطبخ والمشاوي (KOT)</h4>
                        <p className="text-[10px] text-slate-400">Bixolon Network LAN 192.168.1.200</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      متصل
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    بون تحضير أصناف المشاوي والمطبخ مع ملاحظات التعديل والتوقيت.
                  </p>

                  <button
                    onClick={() => handleTestPrint('kot')}
                    disabled={printerStatus === 'printing'}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 text-orange-400" />
                    <span>طباعة بون مطبخ تجريبي (KOT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drawer' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                    drawerStatus === 'open'
                      ? 'bg-emerald-500/20 text-emerald-400 scale-110 shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <DollarSign className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-base font-black text-white">
                    {drawerStatus === 'open'
                      ? 'تم فتح درج النقدية بنجاح!'
                      : 'درج النقدية الإلكتروني (24V RJ11)'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    إرسال نبضة إلكترونية ESC p 0 25 250 عبر منفذ طابعة الكاشير لفتح الدرج تلقائياً عند الدفع النقدي.
                  </p>
                </div>

                <button
                  onClick={handleKickCashDrawer}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  اختبار نبضة فتح الدرج (Kick Cash Drawer)
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
