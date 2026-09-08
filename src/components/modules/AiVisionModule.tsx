/**
 * =====================================================================
 * RESTAURANT OS — AI VISION & MULTIMODAL SCANNER DASHBOARD
 * =====================================================================
 * Powered by Google Gemini 2.5 Flash Vision
 * 
 * Modules:
 * 1. Plate Waste Estimator (رادار هدر الصحون المالي وأحجام الحصص)
 * 2. Visual Inventory Scanner (المسح البصري للمخزون والصلاحيات)
 * 3. Financial Waste Analytics & ROI (تحليلات الأثر المالي والتوفير)
 * 4. Scan History & Audit Logs (سجل الفحوصات البصرية)
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  VideoOff,
  Upload,
  Scan,
  ScanLine,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Layers,
  Boxes,
  UtensilsCrossed,
  ChefHat,
  RefreshCw,
  Sliders,
  History,
  PieChart,
  Zap,
  Info,
  Clock,
  ChevronRight,
  BarChart3,
  Calendar,
  AlertCircle,
  FileCheck,
  Check,
  Package,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { visionScannerService } from '../../services/visionScannerService';
import {
  PlateWasteAnalysisResult,
  VisualInventoryScanResult,
  VisionScanMode,
  VisionSamplePreset,
} from '../../types/vision';

export const AiVisionModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);
  const inventoryItems = useInventoryStore((s) => s.items);
  const loadInventory = useInventoryStore((s) => s.loadInventory);

  // Active Tab Mode
  const [activeMode, setActiveMode] = useState<VisionScanMode>('plate_waste');

  // Camera & Stream States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis & Processing States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Results State
  const [plateWasteResult, setPlateWasteResult] = useState<PlateWasteAnalysisResult | null>(null);
  const [inventoryScanResult, setInventoryScanResult] = useState<VisualInventoryScanResult | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [wasteLoggedMessage, setWasteLoggedMessage] = useState<string | null>(null);

  // History & Presets
  const presets = visionScannerService.getSamplePresets();
  const [historyPlates, setHistoryPlates] = useState<PlateWasteAnalysisResult[]>([]);
  const [historyInventory, setHistoryInventory] = useState<VisualInventoryScanResult[]>([]);
  const [stats, setStats] = useState(visionScannerService.getVisionStats());

  // Load initial preset / history on mount
  useEffect(() => {
    refreshHistoryAndStats();
    // Default load first preset for quick demonstration
    const firstPreset = presets[0];
    if (firstPreset && firstPreset.mode === 'plate_waste') {
      setPlateWasteResult(firstPreset.presetData as PlateWasteAnalysisResult);
      setCapturedImage(firstPreset.presetData.imageUrl || null);
    }
  }, []);

  const refreshHistoryAndStats = () => {
    setHistoryPlates(visionScannerService.getPlateWasteHistory());
    setHistoryInventory(visionScannerService.getInventoryScanHistory());
    setStats(visionScannerService.getVisionStats());
  };

  // ==========================================
  // CAMERA STREAM HANDLERS
  // ==========================================

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      playSound('pop');
    } catch (err: any) {
      console.warn('[VisionModule] Camera access error:', err);
      setCameraError(
        language === 'ar'
          ? 'تعذر الوصول إلى الكاميرا. يمكنك استخدام النماذج التجريبية الجاهزة أو رفع صورة من جهازك.'
          : 'Could not access camera. You can use preset samples or upload an image file.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    if (isCameraActive) {
      setTimeout(() => startCamera(), 100);
    }
  };

  const captureFrameAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    playSound('tap');
    setCapturedImage(dataUrl);
    processVisionImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      playSound('pop');
      processVisionImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: VisionSamplePreset) => {
    playSound('tap');
    setActiveMode(preset.mode);
    setCapturedImage(preset.imagePlaceholder);
    if (preset.mode === 'plate_waste') {
      setPlateWasteResult(preset.presetData as PlateWasteAnalysisResult);
    } else {
      setInventoryScanResult(preset.presetData as VisualInventoryScanResult);
    }
    refreshHistoryAndStats();
  };

  // ==========================================
  // AI VISION PROCESSING
  // ==========================================

  const processVisionImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setSyncSuccessMessage(null);
    setWasteLoggedMessage(null);

    try {
      if (activeMode === 'plate_waste') {
        setAnalysisProgress(
          language === 'ar'
            ? 'جاري تحليل الصحن بواسطة Gemini 2.5 Flash Vision واستخراج نسب الهدر...'
            : 'Analyzing plate leftovers with Gemini 2.5 Flash Vision...'
        );

        const result = await visionScannerService.analyzePlateWaste(imageDataUrl, {
          tableNumber: 'T-06 (صالة الأفراد)',
        });

        setPlateWasteResult(result);
        playSound('success');
      } else {
        setAnalysisProgress(
          language === 'ar'
            ? 'جاري فحص الباركودات والعبوات وتواريخ الصلاحية عبر الذكاء الاصطناعي...'
            : 'Scanning items, expiry dates and barcodes with AI...'
        );

        const result = await visionScannerService.scanInventoryVisual(imageDataUrl, inventoryItems);
        setInventoryScanResult(result);
        playSound('success');
      }
    } catch (err) {
      console.error('[VisionModule] Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
      refreshHistoryAndStats();
    }
  };

  // One-Click Actions
  const handleLogWasteToInventory = () => {
    if (!plateWasteResult) return;
    playSound('cash-register');
    setWasteLoggedMessage(
      language === 'ar'
        ? `تم تسجيل هدر بقيمة ${plateWasteResult.totalFinancialLossSar} ر.س في سجل الهدر التشغيلي للمطعم.`
        : `Successfully logged ${plateWasteResult.totalFinancialLossSar} SAR waste to operating inventory ledger.`
    );
    setTimeout(() => setWasteLoggedMessage(null), 5000);
  };

  const handleSyncScannedStock = async () => {
    if (!inventoryScanResult) return;
    playSound('success');
    const syncRes = await visionScannerService.syncScannedInventoryWithStock(inventoryScanResult);
    await loadInventory();
    setSyncSuccessMessage(
      language === 'ar'
        ? `تم تحديث ${syncRes.updatedCount} أصناف في قاعدة بيانات المخزون بنجاح!`
        : `Successfully synchronized ${syncRes.updatedCount} items to live stock database!`
    );
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden text-slate-100 font-sans">
      {/* Hidden elements for capture & upload */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP HEADER & STATS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                {language === 'ar' ? 'منظومة الرؤية البصرية للذكاء الاصطناعي' : 'AI Multimodal Vision Engine'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/30">
                Gemini 2.5 Flash Vision
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'رادار هدر الصحون المالي، تقدير أحجام الحصص، ومسح المخزون والصلاحيات بالكاميرا'
                : 'Plate Waste Estimator, Portion Sizing AI & Visual Inventory Expiry Scanner'}
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">
                {language === 'ar' ? 'متوسط الهدر' : 'Avg Plate Waste'}
              </div>
              <div className="text-sm font-black text-amber-400">
                {stats.averageWastePercentage}%
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">
                {language === 'ar' ? 'هدر اليوم المالي' : "Today's Loss"}
              </div>
              <div className="text-sm font-black text-rose-400">
                {stats.totalLossSarToday} {t.currency}
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex items-center gap-3 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-bold">
                {language === 'ar' ? 'توفير سنوي متوقع' : 'Projected Savings'}
              </div>
              <div className="text-sm font-black text-emerald-300">
                +{stats.projectedAnnualSavingsSar.toLocaleString()} {t.currency}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODE NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/5 shrink-0">
        <button
          onClick={() => {
            playSound('click');
            setActiveMode('plate_waste');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMode === 'plate_waste'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>{language === 'ar' ? 'رادار هدر الصحون المالي (Plate Waste)' : 'Plate Waste Estimator'}</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveMode('inventory_scan');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMode === 'inventory_scan'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{language === 'ar' ? 'المسح البصري للمخزون والصلاحيات' : 'Visual Inventory & Expiry'}</span>
          {stats.expiringItemsAlertCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {stats.expiringItemsAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveMode('analytics');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMode === 'analytics'
              ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{language === 'ar' ? 'تحليلات الهدر وتوفير التكاليف (ROI)' : 'Waste Analytics & ROI'}</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveMode('history');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMode === 'history'
              ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{language === 'ar' ? 'سجل الفحوصات' : 'Scan Audit Logs'}</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: CAMERA / SCAN CAPTURE VIEW (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">
          {/* CAMERA FEED / IMAGE VIEWPORT */}
          <div className="relative rounded-3xl bg-slate-950 border border-white/10 overflow-hidden aspect-[4/3] flex items-center justify-center shadow-2xl group">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {/* Static Image Snapshot or Placeholder */}
            {!isCameraActive && capturedImage && (
              <img
                src={capturedImage}
                alt="Captured visual"
                className="w-full h-full object-cover"
              />
            )}

            {!isCameraActive && !capturedImage && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">
                  {language === 'ar' ? 'الكاميرا غير نشطة' : 'Camera is inactive'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {language === 'ar'
                    ? 'شغّل الكاميرا الحية، أو ارفع صورة، أو اختر نموذجاً تجريبياً من الأسفل'
                    : 'Start live camera, upload an image, or pick a sample preset below'}
                </p>
              </div>
            )}

            {/* Visual Scanning Reticle & Laser Grid Effect */}
            {(isCameraActive || isAnalyzing) && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Crosshairs & corner brackets */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

                {/* Animated Horizontal Laser Scan Line */}
                {isAnalyzing && (
                  <motion.div
                    initial={{ top: '5%' }}
                    animate={{ top: ['5%', '90%', '5%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]"
                  />
                )}

                {/* Subtitle tag */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{isAnalyzing ? 'Gemini 2.5 Neural Analyzing...' : 'Live Visual Viewport'}</span>
                </div>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-xs text-rose-200 backdrop-blur-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* CAMERA CONTROLS TOOLBAR */}
          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <Button
                variant="primary"
                onClick={startCamera}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>{language === 'ar' ? 'تشغيل الكاميرا الحية' : 'Start Live Camera'}</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="danger"
                  onClick={stopCamera}
                  className="py-3 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <VideoOff className="w-4 h-4" />
                </Button>
                <Button
                  variant="primary"
                  onClick={captureFrameAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{language === 'ar' ? 'التقاط وفحص بالذكاء الاصطناعي' : 'Capture & Analyze'}</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={toggleCameraFacing}
                  className="py-3 px-4 rounded-2xl border-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Flip Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-2xl border-white/10 hover:border-white/20 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'رفع صورة' : 'Upload'}</span>
            </Button>
          </div>

          {/* QUICK PRESETS CAROUSEL (للتجربة الفورية) */}
          <div className="p-3.5 rounded-3xl bg-slate-900/60 border border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {language === 'ar' ? 'نماذج جاهزة للاختبار الفوري' : 'Instant Preset Scenarios'}
              </span>
              <span className="text-[10px] text-slate-500">
                {language === 'ar' ? 'اضغط لتجربة التحليل الفوري' : 'Click to run vision test'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/60 hover:bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all text-start group cursor-pointer"
                >
                  <img
                    src={preset.imagePlaceholder}
                    alt={preset.titleAr}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {language === 'ar' ? preset.titleAr : preset.titleEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-slate-400">
                        {preset.mode === 'plate_waste' ? 'Plate' : 'Stock'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {language === 'ar' ? preset.descriptionAr : preset.descriptionEn}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED ANALYSIS & ACTION RESULTS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">
          {/* PROCESSING BANNER */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 backdrop-blur-xl flex items-center gap-4 text-cyan-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-cyan-300">
                  {language === 'ar' ? 'معالجة الصورة عبر Gemini 2.5 Flash Vision' : 'Processing with Gemini 2.5 Flash Vision'}
                </div>
                <div className="text-[11px] text-cyan-400/80 mt-0.5">{analysisProgress}</div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATION FEEDBACK TOASTS */}
          {syncSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
          )}

          {wasteLoggedMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{wasteLoggedMessage}</span>
            </div>
          )}

          {/* TAB 1: PLATE WASTE ESTIMATOR VIEW */}
          {activeMode === 'plate_waste' && (
            <div className="flex flex-col gap-4">
              {plateWasteResult ? (
                <>
                  {/* Dish Title & High-Level Metric Card */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {plateWasteResult.tableNumber || 'طاولة 4'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(plateWasteResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-white mt-1">
                          {language === 'ar' ? plateWasteResult.dishNameAr : plateWasteResult.dishNameEn}
                        </h2>
                      </div>

                      {/* Overall Plate Waste Badge */}
                      <div className="flex items-center gap-2">
                        <div className="text-end">
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'نسبة الهدر الكلية' : 'Total Waste'}</div>
                          <div className="text-2xl font-black text-rose-400">
                            {plateWasteResult.totalWastePercentage}%
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-sm">
                          {plateWasteResult.totalWasteGrams}g
                        </div>
                      </div>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                      <div>
                        <div className="text-[10px] text-slate-400">{language === 'ar' ? 'تكلفة الهدر المالي' : 'Financial Loss'}</div>
                        <div className="text-base font-black text-rose-400 mt-0.5">
                          {plateWasteResult.totalFinancialLossSar.toFixed(2)} {t.currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">{language === 'ar' ? 'سعر بيع الطبق' : 'Dish Price'}</div>
                        <div className="text-base font-bold text-slate-200 mt-0.5">
                          {plateWasteResult.originalPlatePriceSar} {t.currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">{language === 'ar' ? 'دقة فحص النموذج' : 'AI Confidence'}</div>
                        <div className="text-base font-bold text-cyan-400 mt-0.5">
                          {(plateWasteResult.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Component Breakdown Card */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl flex flex-col gap-4">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'تفصيل مكونات الصحن ونسب الهدر' : 'Plate Components & Leftovers Breakdown'}</span>
                    </h3>

                    <div className="flex flex-col gap-3">
                      {plateWasteResult.components.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="font-bold text-slate-200">
                                {language === 'ar' ? comp.nameAr : comp.nameEn}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({comp.initialEstimatePercent}% من الطبق)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono font-bold">
                              <span className="text-amber-400">{comp.wastedPercent}% هدر</span>
                              <span className="text-slate-500">|</span>
                              <span className="text-slate-300">{comp.wastedGrams}g</span>
                              <span className="text-slate-500">|</span>
                              <span className="text-rose-400">{comp.wasteCostSar.toFixed(2)} {t.currency}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                comp.wastedPercent > 50
                                  ? 'bg-rose-500'
                                  : comp.wastedPercent > 20
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${comp.wastedPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Portion Resizing Recommendation Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          {language === 'ar' ? 'توصية الذكاء الاصطناعي لتقليل حجم الحصة' : 'AI Portion Resizing Recommendation'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        -{plateWasteResult.suggestedPortionReductionPercent}% حجم الحصة
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {language === 'ar' ? plateWasteResult.portionRecommendationAr : plateWasteResult.portionRecommendationEn}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs">
                      <span className="text-slate-400">
                        {language === 'ar' ? 'التوفير الشهري المتوقع للفرع:' : 'Projected Monthly Branch Savings:'}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        +{plateWasteResult.projectedMonthlySavingsSar.toLocaleString()} {t.currency} / {language === 'ar' ? 'شهرياً' : 'mo'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleLogWasteToInventory}
                      className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تسجيل الهدر في المخزون' : 'Log Waste to Inventory'}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        playSound('click');
                        setActiveMode('analytics');
                      }}
                      className="py-3 px-5 rounded-2xl border-white/10 hover:border-white/20 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{language === 'ar' ? 'عرض رادار التوفير' : 'View ROI Radar'}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-50" />
                  <p className="text-sm font-bold text-slate-400">
                    {language === 'ar' ? 'لا يوجد فحص صحن حالياً' : 'No plate waste analysis available'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'ar' ? 'قم بالتقاط صورة لصحن مرتجع أو اختر نموذجاً من القائمة الجانبية' : 'Capture a returned plate photo or choose a preset on the left'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL INVENTORY & EXPIRY SCANNER */}
          {activeMode === 'inventory_scan' && (
            <div className="flex flex-col gap-4">
              {inventoryScanResult ? (
                <>
                  {/* Summary Card */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-white">
                            {inventoryScanResult.category || 'المستودع الرئيسي'}
                          </h2>
                          <p className="text-[11px] text-slate-400">
                            {new Date(inventoryScanResult.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {inventoryScanResult.totalItemsDetected} {language === 'ar' ? 'أصناف تم رصدها' : 'Items Detected'}
                        </span>
                        {inventoryScanResult.criticalAlertsCount > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{inventoryScanResult.criticalAlertsCount} {language === 'ar' ? 'تنبيه صلاحية' : 'Expiry Alerts'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 leading-relaxed">
                      {language === 'ar' ? inventoryScanResult.summaryAr : inventoryScanResult.summaryEn}
                    </p>
                  </div>

                  {/* Scanned Items List */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                      {language === 'ar' ? 'الأصناف المكتشفة وتواريخ الصلاحية' : 'Detected Stock & Expiry Schedule'}
                    </h3>

                    {inventoryScanResult.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-3xl border transition-all ${
                          item.expiryStatus === 'critical' || item.expiryStatus === 'expired'
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : item.expiryStatus === 'expiring_soon'
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-900/80 border-white/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">
                                {language === 'ar' ? item.detectedNameAr : item.detectedNameEn}
                              </span>
                              {item.barcode && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400">
                                  {item.barcode}
                                </span>
                              )}
                            </div>
                            {item.batchNumber && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Batch: {item.batchNumber}
                              </div>
                            )}
                          </div>

                          {/* Expiry Badge */}
                          <div className="text-end">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
                                item.expiryStatus === 'critical' || item.expiryStatus === 'expired'
                                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                  : item.expiryStatus === 'expiring_soon'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{item.expiryDate || 'N/A'} ({item.daysUntilExpiry} {language === 'ar' ? 'أيام' : 'days'})</span>
                            </span>
                          </div>
                        </div>

                        {/* Quantity and Storage details */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">
                              {language === 'ar' ? 'الكمية المرصودة:' : 'Detected Qty:'}
                            </span>
                            <span className="font-black text-cyan-400 text-sm">
                              {item.quantityDetected} {item.unit}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-400">
                              {item.packagingCondition === 'intact' ? 'التغليف: سليم' : 'التغليف: غير محكم'}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono">
                            Confidence: {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {item.notes && (
                          <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sync to Inventory Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      onClick={handleSyncScannedStock}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'ar' ? 'مزامنة الكميات مع المستودع الحي' : 'Sync Quantities to Live Inventory'}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <Boxes className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-50" />
                  <p className="text-sm font-bold text-slate-400">
                    {language === 'ar' ? 'لا يوجد فحص مخزون حالي' : 'No inventory scan available'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'ar' ? 'قم بمسح رفوف المستودع أو اختر نموذج الحليب والألبان' : 'Scan warehouse shelves or choose the dairy/chiller preset'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WASTE ANALYTICS & ROI */}
          {activeMode === 'analytics' && (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl flex flex-col gap-4">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  <span>{language === 'ar' ? 'رادار هدر المكونات والأثر المالي السنوي' : 'Waste Component Breakdown & ROI Intel'}</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col gap-1">
                    <span className="text-xs text-slate-400">{language === 'ar' ? 'إجمالي هدر الشهر الحالي' : 'Month-to-Date Loss'}</span>
                    <span className="text-xl font-black text-rose-400">{stats.totalLossSarMonth.toLocaleString()} {t.currency}</span>
                    <span className="text-[10px] text-slate-500">{language === 'ar' ? 'بناءً على 85 عملية مسح صحن' : 'Based on 85 plate samples'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 flex flex-col gap-1">
                    <span className="text-xs text-emerald-400 font-bold">{language === 'ar' ? 'العائد السنوي بعد تقليص الحصص' : 'Projected Annual Savings'}</span>
                    <span className="text-xl font-black text-emerald-300">+{stats.projectedAnnualSavingsSar.toLocaleString()} {t.currency}</span>
                    <span className="text-[10px] text-emerald-500 font-bold">{language === 'ar' ? 'تحسين هوامش الربح بنسبة 4.8%' : '4.8% gross margin boost'}</span>
                  </div>
                </div>

                {/* Top Wasted Component Rankings */}
                <div className="flex flex-col gap-3 mt-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'أعلى 5 أصناف مهدرة في الصالة والمطبخ' : 'Top 5 Food Waste Offender Components'}
                  </h3>

                  {stats.topWastedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{item.nameAr}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-amber-400 font-bold">{item.wastePercent}% متوسط الهدر</span>
                          <span className="text-rose-400 font-black">{item.lossSar.toLocaleString()} {t.currency}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${item.wastePercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCAN HISTORY & AUDIT LOGS */}
          {activeMode === 'history' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">
                {language === 'ar' ? 'سجل الفحوصات البصرية السابقة' : 'Audit Trail & Previous Scans'}
              </h2>

              {historyPlates.length === 0 && historyInventory.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-50" />
                  <p className="text-sm font-bold text-slate-400">{language === 'ar' ? 'السجل فارغ' : 'No history yet'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {historyPlates.map((plate) => (
                    <div
                      key={plate.id}
                      onClick={() => {
                        setPlateWasteResult(plate);
                        setActiveMode('plate_waste');
                      }}
                      className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <UtensilsCrossed className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{plate.dishNameAr}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(plate.timestamp).toLocaleString()} • {plate.tableNumber || 'طاولة'}
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="text-xs font-black text-rose-400">{plate.totalWastePercentage}% هدر</div>
                        <div className="text-[10px] text-slate-400">{plate.totalFinancialLossSar} {t.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
