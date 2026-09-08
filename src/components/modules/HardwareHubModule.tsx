import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Printer,
  Barcode,
  Cpu,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  QrCode,
  Zap,
  Radio,
  Power,
  Layers,
  Settings,
  Flame,
  Utensils,
  Receipt,
  FileText,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const HardwareHubModule: React.FC = () => {
  const { language, playSound } = useAppStore();

  // Active Hardware Tab: 'scale' | 'printers' | 'scanner' | 'drawer' | 'cfd'
  const [activeTab, setActiveTab] = useState<'scale' | 'printers' | 'scanner' | 'drawer' | 'cfd'>('scale');

  // Electronic Scale State
  const [scaleWeight, setScaleWeight] = useState<number>(0.450); // kg
  const [scaleTare, setScaleTare] = useState<number>(0);
  const [isScaleConnected, setIsScaleConnected] = useState<boolean>(true);
  const [baudRate, setBaudRate] = useState<string>('9600');
  const [selectedPort, setSelectedPort] = useState<string>('COM3 (RS-232 USB Scale)');

  // Thermal Printers State
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [isPrintingTest, setIsPrintingTest] = useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = useState<boolean>(false);
  const [stationPrinters, setStationPrinters] = useState({
    cashier: 'POS-80C Thermal Printer (USB001)',
    grill: 'Kitchen-Grill NetPrinter (192.168.1.200)',
    bar: 'Bar-Beverage Wi-Fi Printer (192.168.1.205)',
  });

  // Barcode / QR Scanner Simulator
  const [scannedBarcode, setScannedBarcode] = useState<string>('6221155001234');
  const [scannerLogs, setScannerLogs] = useState<string[]>([
    'تم قراءة باركود وجبة ستيك واغيو (6221155001234)',
    'تم قراءة كود كاشير الوردية #01',
  ]);

  // Cash Drawer State
  const [drawerPulse, setDrawerPulse] = useState<boolean>(false);

  // Customer Facing Display (CFD) State
  const [cfdPromo, setCfdPromo] = useState<string>('عرض اليوم: وجبة مشاوي السلطان العائلية بخصم 20% 🔥');

  // Scale Simulation
  useEffect(() => {
    if (!isScaleConnected) return;
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.004;
      setScaleWeight((prev) => Math.max(0, Number((prev + noise).toFixed(3))));
    }, 1500);
    return () => clearInterval(interval);
  }, [isScaleConnected]);

  // Handle Scale Tare
  const handleTare = () => {
    playSound('pop');
    setScaleTare(scaleWeight);
  };

  // Handle Scale Zero
  const handleZero = () => {
    playSound('tap');
    setScaleTare(0);
    setScaleWeight(0);
  };

  // Handle Test Print
  const handleTestPrint = () => {
    playSound('kitchen-bell');
    setIsPrintingTest(true);
    setPrintSuccess(false);
    setTimeout(() => {
      setIsPrintingTest(false);
      setPrintSuccess(true);
      playSound('success');
    }, 900);
  };

  // Handle Cash Drawer Pulse
  const handleTriggerDrawer = () => {
    playSound('pop');
    setDrawerPulse(true);
    setTimeout(() => setDrawerPulse(false), 1200);
  };

  const netWeight = Math.max(0, Number((scaleWeight - scaleTare).toFixed(3)));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans select-none text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'ar' ? 'مركز العتاد والموازين والأجهزة' : 'Hardware & Peripherals Hub'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar'
                ? 'معايرة الميزان الإلكتروني، الطابعات الحرارية، قارئ الباركود، نبضة درج النقدية وشاشة العميل CFD'
                : 'Scale calibration, ESC/POS thermal printers, barcode scanner, and CFD'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto custom-scrollbar text-xs font-bold">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('scale');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scale'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>الميزان الإلكتروني</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('printers');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'printers'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>الطابعات الحرارية</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('scanner');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scanner'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>الباركود والماسح</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('drawer');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'drawer'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>درج النقدية 24V</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('cfd');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cfd'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>شاشة العميل (CFD)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ELECTRONIC SCALE */}
      {activeTab === 'scale' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scale Display Meter */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isScaleConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isScaleConnected ? 'الميزان متصل وجاهز للوزن اللحظي' : 'الميزان غير متصل'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                Precision: ±1g
              </span>
            </div>

            {/* Big LED Digital Screen */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-amber-500/30 text-center space-y-2 shadow-inner">
              <div className="text-[11px] font-mono text-amber-500/70 uppercase tracking-widest">
                NET WEIGHT (الوزن الصافي)
              </div>
              <div className="text-6xl sm:text-7xl font-black font-mono text-amber-400 tracking-wider">
                {netWeight.toFixed(3)}
                <span className="text-2xl text-amber-500/80 ms-2">KG</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-4 pt-2">
                <span>الإجمالي: {scaleWeight.toFixed(3)} kg</span>
                <span>•</span>
                <span>التصفير (Tare): {scaleTare.toFixed(3)} kg</span>
              </div>
            </div>

            {/* Tactile Scale Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleTare}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 font-black text-xs cursor-pointer transition-all active:scale-95"
              >
                تصفير الإناء (TARE)
              </button>
              <button
                onClick={handleZero}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 font-black text-xs cursor-pointer transition-all active:scale-95"
              >
                تصفير الميزان (ZERO)
              </button>
              <button
                onClick={() => {
                  playSound('pop');
                  setScaleWeight(Number((Math.random() * 1.5 + 0.2).toFixed(3)));
                }}
                className="py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-500/20"
              >
                محاكاة وزن عينة 🥩
              </button>
            </div>
          </div>

          {/* Scale Serial Port Config */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>إعدادات منفذ السيريال (Serial / USB COM)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">المنفذ النشط (COM Port)</label>
                <select
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0c0f17] border border-slate-300 dark:border-white/10 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="COM3 (RS-232 USB Scale)">COM3 (RS-232 USB Digital Scale)</option>
                  <option value="COM1 (Standard Serial)">COM1 (Standard Serial Port)</option>
                  <option value="COM4 (CAS / Dibal Scale)">COM4 (CAS / Dibal Digital Scale)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">معدل نقل البيانات (Baud Rate)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['9600', '19200', '38400', '115200'].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        playSound('click');
                        setBaudRate(rate);
                      }}
                      className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        baudRate === rate
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    playSound('pop');
                    setIsScaleConnected(!isScaleConnected);
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isScaleConnected
                      ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{isScaleConnected ? 'فصل اتصال الميزان' : 'إعادة الاتصال بالميزان'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: THERMAL PRINTERS */}
      {activeTab === 'printers' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Printers List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-500" />
                <span>طابعات الإيصالات والمطبخ (Station KOT Printers)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-black text-slate-900 dark:text-white">طابعة الكاشير والفواتير (Receipt)</div>
                    <div className="text-[11px] font-mono text-slate-500">{stationPrinters.cashier}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">نشطة 80mm</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-black text-slate-900 dark:text-white">طابعة محطة الشواية والمطبخ (Grill KOT)</div>
                    <div className="text-[11px] font-mono text-slate-500">{stationPrinters.grill}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-bold">Network LAN</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-black text-slate-900 dark:text-white">طابعة البار والمشروبات (Bar Station)</div>
                    <div className="text-[11px] font-mono text-slate-500">{stationPrinters.bar}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-bold">Wi-Fi Wireless</span>
                </div>
              </div>

              {/* Paper Format Choice */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مقاس ورق الإيصال:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaperWidth('80mm')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paperWidth === '80mm'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    80mm القياسي
                  </button>
                  <button
                    onClick={() => setPaperWidth('58mm')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paperWidth === '58mm'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    58mm الصغير
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Printing Visualizer */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xl text-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">اختبار محاكي الفاتورة الحرارية</h3>

            {/* Thermal Receipt Preview Card */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/[0.03] border border-amber-500/30 font-mono text-[11px] text-slate-900 dark:text-slate-200 space-y-2 text-start max-w-xs mx-auto shadow-sm">
              <div className="text-center font-bold border-b border-dashed border-slate-400 dark:border-slate-600 pb-2">
                <div>مطعم السرايا للمأكولات الفاخرة</div>
                <div className="text-[9px] text-slate-500">فاتورة إلكترونية ضريبية 14%</div>
              </div>
              <div className="flex justify-between">
                <span>1x ستيك واغيو مشوي</span>
                <span>380.00 ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>2x بيبسي دايت</span>
                <span>60.00 ج.م</span>
              </div>
              <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-2 flex justify-between font-black">
                <span>الإجمالي الصافي:</span>
                <span>440.00 ج.م</span>
              </div>
            </div>

            <button
              onClick={handleTestPrint}
              disabled={isPrintingTest}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrintingTest ? 'جاري إرسال أمر الطباعة...' : 'طباعة إيصال اختباري (Test Print)'}</span>
            </button>

            {printSuccess && (
              <div className="text-xs text-emerald-500 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تمت معالجة أمر الطباعة بنجاح!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 3: BARCODE SCANNER */}
      {activeTab === 'scanner' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Barcode className="w-4 h-4 text-amber-500" />
              <span>محاكي قارئ الباركود (Barcode / QR Scanner)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">أدخل أو امسح الباركود</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder="6221155001234"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      playSound('pop');
                      setScannerLogs((prev) => [`تمت قراءة كود (${scannedBarcode}) في ${new Date().toLocaleTimeString()}`, ...prev]);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    محاكاة المسح ↵
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">أكواد سريعة للتجربة:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setScannedBarcode('622100010012')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-[11px] font-mono cursor-pointer"
                  >
                    برجر أنجوس (622100010012)
                  </button>
                  <button
                    onClick={() => setScannedBarcode('622200020023')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-[11px] font-mono cursor-pointer"
                  >
                    بيتزا مارجريتا (622200020023)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scanner Logs */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">سجل قراءات الماسح اللحظي</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar font-mono text-xs">
              {scannerLogs.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: CASH DRAWER */}
      {activeTab === 'drawer' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all ${
            drawerPulse ? 'bg-emerald-500 text-slate-950 scale-110 shadow-xl shadow-emerald-500/30' : 'bg-amber-500/20 text-amber-500'
          }`}>
            <DollarSign className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">نبضة فتح درج النقدية الإلكتروني (24V RJ11)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إرسال إشارة فتح الدرج التلقائية عند تأكيد الفاتورة أو الضغط اليدوي للمدير
            </p>
          </div>

          <button
            onClick={handleTriggerDrawer}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer active:scale-98"
          >
            ⚡ إرسال نبضة فتح الدرج الآن (Kick Drawer)
          </button>
        </motion.div>
      )}

      {/* TAB 5: CUSTOMER FACING DISPLAY (CFD) */}
      {activeTab === 'cfd' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-amber-500" />
              <span>إعدادات شاشة العميل التفاعلية (CFD Dual-Screen)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">رسالة العرض الترويجي للعميل</label>
                <textarea
                  rows={3}
                  value={cfdPromo}
                  onChange={(e) => setCfdPromo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">رمز الدفع الفوري (InstaPay QR)</div>
                  <div className="text-[10px] text-slate-500">إظهار كود إنستاباي والمحافظ الإلكترونية للعميل</div>
                </div>
                <QrCode className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>

          {/* CFD Live Screen Simulator */}
          <div className="lg:col-span-6 bg-slate-950 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Flame className="w-4 h-4" />
                <span>شاشة العميل — Sultan Palace</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                LIVE MIRROR
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
              <div className="text-amber-400 font-bold">{cfdPromo}</div>
              <div className="text-slate-400 text-[10px]">شكراً لزيارتكم! جاري إعداد طلبك بعناية فائقة 👨‍🍳</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">المبلغ المطلوب للدفع:</div>
                <div className="text-2xl font-black text-amber-400 font-mono">440.00 ج.م</div>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
                <QrCode className="w-10 h-10 text-slate-950" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
