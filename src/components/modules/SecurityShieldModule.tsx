/**
 * =====================================================================
 * RESTAURANT OS — SECURITY SHIELD MODULE (درع الحماية والأمن السيبراني)
 * =====================================================================
 * Interactive Cybersecurity Command Center displaying the 6 Defense Layers:
 * 1. Hardware DNA (CPU, Motherboard, Disk, MAC)
 * 2. RSA-2048 Cryptographic Licensing & Entitlements
 * 3. Clock Guard & Anti-Rollback Watchdog
 * 4. Forensic Canary Tokens & Zero-Width Steganography
 * 5. Encrypted Cloud Kill-Switch & Remote Lockout Engine
 * 6. Zero-Trust Network & System Integrity Monitor
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Cpu,
  Key,
  Clock,
  Fingerprint,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  Terminal,
  Activity,
  Zap,
  Eye,
  Search,
  Sparkles,
  Sliders,
  AlertOctagon,
  HardDrive,
  Network,
  Binary,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { soundEngine } from '../../services/soundEngine';
import {
  hardwareDna,
  HardwareDnaProfile,
  HardwareMatchResult,
} from '../../services/security/hardwareDna';
import {
  licenseValidator,
  LicenseValidationResult,
  SignedLicenseFile,
  MASTER_RSA_PUBLIC_KEY_PEM,
} from '../../services/security/licenseValidator';
import {
  clockGuard,
  ClockGuardReport,
} from '../../services/security/clockGuard';
import {
  canaryToken,
  CanaryExtractionResult,
  CanaryHoneypotBeacon,
} from '../../services/security/canaryToken';
import {
  killSwitch,
  KillSwitchStatus,
  KillActionType,
} from '../../services/security/killSwitch';
import { eventBus } from '../../services/eventBus';

type SecurityTab =
  | 'overview'
  | 'hardware_dna'
  | 'licensing'
  | 'clock_guard'
  | 'canary_tokens'
  | 'kill_switch'
  | 'audit_log';

interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'threat' | 'success';
  title: string;
  detail: string;
}

export const SecurityShieldModule: React.FC = () => {
  const { language } = useAppStore();
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [copiedDna, setCopiedDna] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Layer States
  const [dnaProfile, setDnaProfile] = useState<HardwareDnaProfile | null>(null);
  const [licenseResult, setLicenseResult] = useState<LicenseValidationResult | null>(null);
  const [clockReport, setClockReport] = useState<ClockGuardReport | null>(null);
  const [killStatus, setKillStatus] = useState<KillSwitchStatus | null>(null);
  const [honeypots, setHoneypots] = useState<CanaryHoneypotBeacon[]>([]);

  // Hardware Verification Sandbox State
  const [targetDnaInput, setTargetDnaInput] = useState('');
  const [hwMatchResult, setHwMatchResult] = useState<HardwareMatchResult | null>(null);

  // License Import & Generator State
  const [licenseInputJson, setLicenseInputJson] = useState('');
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  // Canary Steganography Studio State
  const [watermarkSourceText, setWatermarkSourceText] = useState(
    'فاتورة ضريبية مبسطة\nمطاعم السليمانية الفاخرة\nالرقم الضريبي: 300994829100003\nالإجمالي: 345.00 ر.س\nشكراً لزيارتكم الكريمة!'
  );
  const [watermarkedOutput, setWatermarkedOutput] = useState('');
  const [inspectWatermarkText, setInspectWatermarkText] = useState('');
  const [extractionResult, setExtractionResult] = useState<CanaryExtractionResult | null>(null);

  // Kill Switch & Rescue Pin State
  const [rescuePinInput, setRescuePinInput] = useState('');
  const [rescueMsg, setRescueMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Real-time Audit Logs
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogEntry[]>([
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      level: 'success',
      title: 'تهيئة منظومة الحماية بست طبقات',
      detail: 'Hardware DNA, RSA-2048, ClockGuard, Canary, KillSwitch & ZeroTrust Active',
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
      level: 'info',
      title: 'مطابقة بصمة العتاد الفولاذية (Hardware DNA)',
      detail: 'تطابق كامل لمعرفات CPU و Motherboard UUID و Disk Serial',
    },
    {
      id: 'log_03',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
      level: 'info',
      title: 'التحقق الرياضي من ترخيص RSA-2048',
      detail: 'التوقيع الرقمي معتمد وصالح حتى 2027 مع تفعيل كامل الصلاحيات',
    },
  ]);

  // Load all security layers on mount
  useEffect(() => {
    refreshAllLayers();

    // Listen to security events
    const unsubTamper = eventBus.subscribe('SECURITY_CLOCK_TAMPERED', (data: any) => {
      addLog('threat', 'رصد تلاعب بساعة النظام!', `تم اكتشاف محاولة إرجاع التوقيت بمقدار ${data.driftMinutes} دقيقة`);
      refreshAllLayers();
    });

    const unsubKill = eventBus.subscribe('KILL_SWITCH_TRIGGERED', (data: any) => {
      addLog('threat', 'تفعيل الإيقاف السحابي (Kill-Switch)!', `الأمر: ${data.action} | السبب: ${data.reason}`);
      refreshAllLayers();
    });

    const unsubRestored = eventBus.subscribe('KILL_SWITCH_DISARMED', () => {
      addLog('success', 'فك الإيقاف السحابي', 'تم استعادة عمل النظام برمز الطوارئ المعتمد');
      refreshAllLayers();
    });

    return () => {
      unsubTamper();
      unsubKill();
      unsubRestored();
    };
  }, []);

  const addLog = (level: SecurityAuditLogEntry['level'], title: string, detail: string) => {
    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        title,
        detail,
      },
      ...prev.slice(0, 30),
    ]);
  };

  const refreshAllLayers = async () => {
    setIsLoading(true);
    try {
      const [dna, lic, clk, ks, hps] = await Promise.all([
        hardwareDna.getHardwareDna(true),
        licenseValidator.init(),
        clockGuard.init(),
        killSwitch.init(),
        Promise.resolve(canaryToken.getActiveHoneypots()),
      ]);

      setDnaProfile(dna);
      setLicenseResult(lic);
      setClockReport(clk);
      setKillStatus(ks);
      setHoneypots(hps);
    } catch (err) {
      console.error('[SecurityShield] Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Overall Fortification Score (0 - 100)
  const computeSecurityScore = (): number => {
    let score = 0;
    if (dnaProfile?.entropyDigest) score += 20;
    if (licenseResult?.isValid) score += 25;
    if (clockReport && !clockReport.isTampered) score += 20;
    if (canaryToken) score += 15;
    if (killStatus && !killStatus.isActive) score += 20;
    return Math.min(100, Math.max(0, score));
  };

  const securityScore = computeSecurityScore();

  const handleCopyDna = () => {
    if (dnaProfile?.formattedDna) {
      navigator.clipboard.writeText(dnaProfile.formattedDna);
      setCopiedDna(true);
      soundEngine.play('success');
      setTimeout(() => setCopiedDna(false), 2000);
    }
  };

  const handleVerifyDnaSandbox = async () => {
    if (!targetDnaInput.trim()) return;
    soundEngine.play('tap');
    const res = await hardwareDna.verifyHardwareMatch(targetDnaInput.trim());
    setHwMatchResult(res);
    addLog(
      res.matches ? 'success' : 'warn',
      res.matches ? 'مطابقة بصمة العتاد ناجحة' : 'فشل مطابقة بصمة العتاد',
      `${targetDnaInput} -> تشابه ${res.similarityScore}% (${res.messageAr})`
    );
  };

  const handleGenerateAndActivateLicense = async (
    type: 'enterprise' | 'pro' | 'trial' | 'expired' | 'mismatched_dna' | 'tampered_sig'
  ) => {
    soundEngine.play('tap');
    setIsLoading(true);
    const demoLicense = await licenseValidator.generateDemoLicense(type);
    const res = await licenseValidator.activateLicense(demoLicense);
    setLicenseResult(res);
    setIsLoading(false);

    addLog(
      res.isValid ? 'success' : 'threat',
      res.isValid ? `تنشيط ترخيص تجريبي (${type})` : `رفض الترخيص التجريبي (${type})`,
      res.isValid
        ? `تم اعتماد ترخيص ${res.tier} للمنشأة: ${res.licenseeName}`
        : `${res.rejectionReasonAr}`
    );

    if (res.isValid) {
      soundEngine.play('kitchen-bell');
    } else {
      soundEngine.play('alert');
    }
  };

  const handleApplyCustomLicenseJson = async () => {
    if (!licenseInputJson.trim()) return;
    soundEngine.play('tap');
    setIsLoading(true);
    const res = await licenseValidator.activateLicense(licenseInputJson);
    setLicenseResult(res);
    setIsLoading(false);
    setLicenseModalOpen(false);

    addLog(
      res.isValid ? 'success' : 'threat',
      res.isValid ? 'تثبيت ترخيص مخصص ناجح' : 'فشل تثبيت الترخيص',
      res.isValid ? `مرخص للمنشأة: ${res.licenseeName}` : `${res.rejectionReasonAr}`
    );
  };

  const handleSimulateClockRollback = (offsetHours: number) => {
    soundEngine.play('alert');
    const res = clockGuard.simulateClockRollback(offsetHours);
    setClockReport(res);
    licenseValidator.validateCurrentLicense().then(setLicenseResult);
    addLog(
      'threat',
      'محاكاة تلاعب بالتوقيت (Clock Rollback)',
      `تم تأخير الساعة بمقدار ${offsetHours} ساعة لاختبار نظام الاستجابة والحظر`
    );
  };

  const handleResetClockSimulation = () => {
    soundEngine.play('success');
    const res = clockGuard.resetSimulation();
    setClockReport(res);
    licenseValidator.validateCurrentLicense().then(setLicenseResult);
    addLog('success', 'إعادة ضبط ساعة النظام', 'تم استعادة التوقيت الموثق وإلغاء حالة الاشتباه');
  };

  const handleInjectWatermark = async () => {
    if (!watermarkSourceText.trim()) return;
    soundEngine.play('click');
    const watermarked = await canaryToken.injectWatermark(watermarkSourceText);
    setWatermarkedOutput(watermarked);
    setInspectWatermarkText(watermarked);
    addLog('info', 'زراعة شفرة مائية خفية', 'تم تضمين بصمة العتاد ومعرف الترخيص بترميز Zero-Width خفي');
  };

  const handleExtractWatermark = async () => {
    if (!inspectWatermarkText) return;
    soundEngine.play('click');
    const res = await canaryToken.extractWatermark(inspectWatermarkText);
    setExtractionResult(res);
    addLog(
      res.hasWatermark ? 'success' : 'warn',
      res.hasWatermark ? 'استخراج الأدلة الجنائية للشفرة المائية' : 'لم يتم العثور على شفرة مائية',
      res.hasWatermark
        ? `تم الكشف عن المالك: ${res.metadata?.licenseeName} (${res.metadata?.hardwareDna})`
        : 'النص لا يحتوي على شفرات Zero-Width مخفية'
    );
  };

  const handleSimulateKillSwitch = (action: KillActionType) => {
    soundEngine.play('alert');
    const res = killSwitch.simulateKillSwitch(action);
    setKillStatus(res);
    licenseValidator.validateCurrentLicense().then(setLicenseResult);
  };

  const handleUnlockRescue = () => {
    soundEngine.play('tap');
    const res = killSwitch.unlockWithRescuePin(rescuePinInput);
    setRescueMsg({ success: res.success, text: res.messageAr });
    if (res.success) {
      soundEngine.play('success');
      setKillStatus(killSwitch.getStatus());
      licenseValidator.validateCurrentLicense().then(setLicenseResult);
      setRescuePinInput('');
    } else {
      soundEngine.play('alert');
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
      {/* Top Cyber Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b1018] to-slate-950 border border-white/10 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Brand & Main Status */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {language === 'ar' ? 'درع الحماية السيبرانية الفولاذي' : 'Restaurant OS Security Shield'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {language === 'ar' ? '6 طبقات حماية' : '6 Defense Layers'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Binary className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {language === 'ar'
                    ? 'بصمة العتاد الفيزيائية • تراخيص RSA-2048 • حامي التوقيت • شفرات Canary • الإيقاف السحابي المشفر'
                    : 'Hardware DNA • RSA-2048 Lic • Anti-Rollback • Stego Watermark • Cloud Kill-Switch'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Score Pill */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 backdrop-blur-md">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {language === 'ar' ? 'مؤشر التحصين' : 'Security Index'}
                </div>
                <div className="text-lg font-black text-emerald-400">
                  {securityScore}% <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>
            </div>

            {/* Formatted DNA Copy */}
            <button
              onClick={handleCopyDna}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all flex items-center gap-2 font-mono text-xs font-bold cursor-pointer group"
              title="Click to copy Hardware DNA"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{dnaProfile?.formattedDna || 'HDNA-FETCHING...'}</span>
              {copiedDna ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={refreshAllLayers}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Security Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Radar Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10">
          {/* 1. Hardware DNA */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">بصمة العتاد (DNA)</div>
              <div className="text-xs font-bold text-emerald-400 truncate">
                {dnaProfile ? 'مقترنة بنجاح' : 'جاري القراءة'}
              </div>
            </div>
          </div>

          {/* 2. RSA License */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">ترخيص RSA-2048</div>
              <div className={`text-xs font-bold truncate ${licenseResult?.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {licenseResult?.isValid ? `مفعل (${licenseResult.tier.toUpperCase()})` : 'غير صالح أو منتهي'}
              </div>
            </div>
          </div>

          {/* 3. Clock Guard */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Clock className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">حامي التوقيت (Clock)</div>
              <div className={`text-xs font-bold truncate ${clockReport?.isTampered ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {clockReport?.isTampered ? 'رصد تلاعب زمني!' : 'محمي ومتطابق'}
              </div>
            </div>
          </div>

          {/* 4. Canary Tokens */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">شفرات Canary المائية</div>
              <div className="text-xs font-bold text-indigo-300 truncate">
                {honeypots.length} فخاخ نشطة
              </div>
            </div>
          </div>

          {/* 5. Kill Switch */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Radio className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">الإيقاف السحابي (Kill)</div>
              <div className={`text-xs font-bold truncate ${killStatus?.isActive ? 'text-rose-400' : 'text-emerald-400'}`}>
                {killStatus?.isActive ? killStatus.action : 'في وضع الاستعداد'}
              </div>
            </div>
          </div>

          {/* 6. Zero Trust */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Shield className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate font-semibold">سلامة النواة (Kernel)</div>
              <div className="text-xs font-bold text-teal-300 truncate">محصن ضد الاختراق</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'overview', labelAr: 'الرادار والتقييم الشامل', labelEn: 'Overview & Radar', icon: Activity },
          { id: 'hardware_dna', labelAr: 'بصمة العتاد (Hardware DNA)', labelEn: 'Hardware DNA', icon: Cpu },
          { id: 'licensing', labelAr: 'تراخيص RSA-2048 والصلاحيات', labelEn: 'RSA-2048 Lic', icon: Key },
          { id: 'clock_guard', labelAr: 'حامي التوقيت والرجوع الزمني', labelEn: 'Clock Guard', icon: Clock },
          { id: 'canary_tokens', labelAr: 'الشفرات المائية والتحقيق الجنائي', labelEn: 'Canary Tokens', icon: Eye },
          { id: 'kill_switch', labelAr: 'غرفة الإيقاف السحابي (Kill-Switch)', labelEn: 'Kill-Switch', icon: Radio },
          { id: 'audit_log', labelAr: 'سجل الأحداث الأمنية الفوري', labelEn: 'Live Audit Log', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.play('tap');
                setActiveTab(tab.id as SecurityTab);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#12161f] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-[500px]">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Col (2 cols wide): Fortification Pillars */}
            <div className="lg:col-span-2 space-y-4">
              {/* Active Defense Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hardware DNA Pillar */}
                <div className="p-5 rounded-3xl bg-[#12161f] border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        الطبقة الأولى
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">بصمة العتاد الفولاذية (Hardware DNA)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ربط النظام حصرياً بالمعالج CPU، واللوحة الأم Motherboard UUID، والقرص الصلب Disk Serial ومحول الشبكة MAC لمنع نسخ البرنامج لأجهزة أخرى.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{dnaProfile?.formattedDna}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% تطابق
                    </span>
                  </div>
                </div>

                {/* RSA-2048 Pillar */}
                <div className="p-5 rounded-3xl bg-[#12161f] border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Key className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        الطبقة الثانية
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">محرك تراخيص RSA-2048 المشفرة</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      تشفير غير متماثل معتمد بمفتاح 2048-بت للتأكد من أصالة الترخيص وتحديد الوحدات البرمجية المصرح بها (POS, KDS, AI, Inventory) مع منع التعديل.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{licenseResult?.licenseeName || 'غير مسجل'}</span>
                    <span className="text-amber-400 font-bold uppercase">{licenseResult?.tier}</span>
                  </div>
                </div>

                {/* Clock Guard Pillar */}
                <div className="p-5 rounded-3xl bg-[#12161f] border border-white/5 hover:border-violet-500/30 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        الطبقة الثالثة
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">حامي التوقيت ورادار الرجوع الزمني</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      عدادات Monotonic غير قابلة للتراجع وعلامات مائية زمنية لمنع الاحتيال عبر تأخير ساعة الجهاز لتمديد فترة الاشتراكات والتراخيص.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">ساعات التشغيل: {clockReport?.totalRunHours} س</span>
                    <span className="text-emerald-400 font-bold">{clockReport?.statusMessageAr}</span>
                  </div>
                </div>

                {/* Canary Tokens Pillar */}
                <div className="p-5 rounded-3xl bg-[#12161f] border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Eye className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        الطبقة الرابعة
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">شفرات Canary المائية للتحقيق الجنائي</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      زراعة شفرات مائية غير مرئية (Zero-Width Steganography) داخل الفواتير والتقارير لملاحقة أي مسرّب للبيانات أو الكود قضائياً.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">حالة التوثيق: نشط</span>
                    <span className="text-indigo-400 font-bold">Stego 16-bit Ready</span>
                  </div>
                </div>
              </div>

              {/* Kill Switch & Zero Trust Big Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-[#161219] to-slate-900 border border-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">الطبقتان 5 و 6: الإيقاف السحابي ونفق الثقة الصفرية (Zero-Trust)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      استقبال أوامر الإيقاف المشفرة فورياً في حالة الاختراق أو التخلف عن السداد مع عزل فوري للبيانات الحساسة.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('kill_switch')}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                >
                  غرفة التحكم بالإيقاف
                </button>
              </div>
            </div>

            {/* Right Col: Live Machine Specs & Quick Tests */}
            <div className="space-y-4">
              {/* Hardware Summary Card */}
              <div className="p-5 rounded-3xl bg-[#12161f] border border-white/5 space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>مواصفات الجهاز المعتمد</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] flex justify-between items-center">
                    <span className="text-slate-400">المعالج (CPU):</span>
                    <span className="font-semibold text-slate-200 text-end truncate max-w-[180px]">
                      {dnaProfile?.cpuModel} ({dnaProfile?.cpuCores} Cores)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] flex justify-between items-center">
                    <span className="text-slate-400">اللوحة الأم (UUID):</span>
                    <span className="font-mono text-cyan-400 font-semibold">{dnaProfile?.motherboardUuid}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] flex justify-between items-center">
                    <span className="text-slate-400">القرص الصلب:</span>
                    <span className="font-mono text-slate-300 font-semibold">{dnaProfile?.diskSerial}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] flex justify-between items-center">
                    <span className="text-slate-400">محول الشبكة (MAC):</span>
                    <span className="font-mono text-amber-400 font-semibold">{dnaProfile?.primaryMac}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] flex justify-between items-center">
                    <span className="text-slate-400">بيئة التشغيل:</span>
                    <span className="font-bold text-emerald-400">
                      {dnaProfile?.isNativeElectron ? 'Electron Native Host (Node.js)' : 'Chromium Isolated Sandbox'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Security Lab Trigger */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/30 to-[#12161f] border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>تجارب المحاكاة والاختبار السريع</span>
                </h4>
                <p className="text-xs text-slate-400">
                  يمكنك تجربة منظومة الدفاع بمحاكاة سيناريوهات حقيقية:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleGenerateAndActivateLicense('enterprise')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-200 hover:text-emerald-300 font-bold transition-all text-start cursor-pointer"
                  >
                    👑 ترخيص Enterprise
                  </button>

                  <button
                    onClick={() => handleGenerateAndActivateLicense('expired')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-200 hover:text-rose-300 font-bold transition-all text-start cursor-pointer"
                  >
                    ⚠️ اختبار ترخيص منتهي
                  </button>

                  <button
                    onClick={() => handleGenerateAndActivateLicense('mismatched_dna')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-slate-200 hover:text-amber-300 font-bold transition-all text-start cursor-pointer"
                  >
                    🚫 اختبار عتاد غير مطابق
                  </button>

                  <button
                    onClick={() => handleSimulateClockRollback(24)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-slate-200 hover:text-violet-300 font-bold transition-all text-start cursor-pointer"
                  >
                    ⏰ محاكاة تراجع التوقيت
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: HARDWARE DNA ================= */}
        {activeTab === 'hardware_dna' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: DNA Components Breakdown */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">مكونات بصمة العتاد (Hardware DNA Entropy)</h3>
                      <p className="text-xs text-slate-400">المعاملات الفيزيائية المستخدمة في توليد البصمة المشفرة</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {dnaProfile?.formattedDna}
                  </span>
                </div>

                <div className="space-y-3">
                  {dnaProfile?.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{comp.nameAr}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{comp.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-cyan-300 font-semibold truncate max-w-[280px]">
                          {comp.value}
                        </span>
                        <span className="text-slate-500 font-normal">الوزن: {comp.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SHA-256 Entropy Digest Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Cryptographic SHA-256 Digest (64-char Hexadecimal)
                  </div>
                  <div className="font-mono text-xs text-emerald-400 break-all select-all">
                    {dnaProfile?.entropyDigest}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: DNA Verifier Sandbox */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">مختبر مطابقة بصمة العتاد</h3>
                    <p className="text-xs text-slate-400">اختبار تطابق أي رمز ترخيص مع هذا الجهاز</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      رمز البصمة المستهدفة (Target Hardware DNA):
                    </label>
                    <input
                      type="text"
                      value={targetDnaInput}
                      onChange={(e) => setTargetDnaInput(e.target.value)}
                      placeholder="e.g. HDNA-9F82-44A1-B3CD-E567 or *"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyDnaSandbox}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>فحص التطابق الفيزيائي</span>
                    </button>
                    <button
                      onClick={() => setTargetDnaInput(dnaProfile?.formattedDna || '')}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                      title="Paste Current DNA"
                    >
                      لصق الحالي
                    </button>
                  </div>

                  {/* Sandbox Result */}
                  {hwMatchResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border ${
                        hwMatchResult.matches
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold">
                          {hwMatchResult.matches ? 'تطابق عتادي مصرح' : 'عدم تطابق عتادي'}
                        </span>
                        <span className="text-xs font-black font-mono">
                          {hwMatchResult.similarityScore}%
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{hwMatchResult.messageAr}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: RSA LICENSING ================= */}
        {activeTab === 'licensing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Active License Details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">تفاصيل الترخيص الرقمي النشط</h3>
                      <p className="text-xs text-slate-400">موثق بتوقيع RSA-2048 SHA-256</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        licenseResult?.isValid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {licenseResult?.tier || 'غير مفعل'}
                    </span>

                    <button
                      onClick={() => setLicenseModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      استيراد ترخيص JSON
                    </button>
                  </div>
                </div>

                {/* Key-Value Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">المنشأة المرخص لها:</span>
                    <span className="text-white font-bold text-sm">
                      {licenseResult?.payload?.licenseeName || 'غير مسجل'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">السجل التجاري (CR):</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {licenseResult?.payload?.commercialRegister || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">معرف الترخيص:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {licenseResult?.payload?.licenseId || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">الأيام المتبقية:</span>
                    <span className="text-emerald-400 font-bold">
                      {licenseResult?.daysRemaining} يوم
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 md:col-span-2">
                    <span className="text-slate-400 block mb-1">بصمة العتاد المقيدة:</span>
                    <span className="text-slate-200 font-mono">
                      {licenseResult?.payload?.boundHardwareDna || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Authorized Modules Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>الوحدات البرمجية المصرح بتشغيلها ({licenseResult?.activeModules.length || 0})</span>
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'pos', name: 'نقطة البيع (POS)' },
                      { id: 'kds', name: 'شاشة المطبخ (KDS)' },
                      { id: 'waiter', name: 'ويتر محمول' },
                      { id: 'kiosk', name: 'الطلب الذاتي Kiosk' },
                      { id: 'online_store', name: 'المتجر الإلكتروني' },
                      { id: 'intercom', name: 'التواصل Intercom' },
                      { id: 'inventory', name: 'المخزون والتوريد' },
                      { id: 'staff', name: 'الموظفون والورديات' },
                      { id: 'customers', name: 'العملاء والولاء' },
                      { id: 'reports', name: 'التقارير المالية' },
                      { id: 'ai', name: 'المساعد الذكي AI' },
                      { id: 'settings', name: 'الإعدادات' },
                    ].map((mod) => {
                      const isAuth = licenseResult?.activeModules.includes(mod.id as any);
                      return (
                        <span
                          key={mod.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                            isAuth
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-slate-600 border border-white/5 line-through'
                          }`}
                        >
                          {isAuth ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldX className="w-3.5 h-3.5 text-slate-600" />}
                          <span>{mod.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Master RSA Key & Generator */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">المفتاح العام لجذر التراخيص</h3>
                    <p className="text-xs text-slate-400">RSA-2048 Root Public Key</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 font-mono text-[10px] text-slate-400 leading-tight break-all max-h-32 overflow-y-auto custom-scrollbar">
                  {MASTER_RSA_PUBLIC_KEY_PEM}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-xs font-bold text-slate-300">توليد وتجربة التراخيص السريعة:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleGenerateAndActivateLicense('enterprise')}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-pointer"
                    >
                      👑 Enterprise
                    </button>
                    <button
                      onClick={() => handleGenerateAndActivateLicense('pro')}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 cursor-pointer"
                    >
                      ⚡ Pro Edition
                    </button>
                    <button
                      onClick={() => handleGenerateAndActivateLicense('trial')}
                      className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 cursor-pointer"
                    >
                      ⏳ تجريبي 14 يوم
                    </button>
                    <button
                      onClick={() => handleGenerateAndActivateLicense('tampered_sig')}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 cursor-pointer"
                    >
                      🛡️ توقيع ملعوب به
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CLOCK GUARD ================= */}
        {activeTab === 'clock_guard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Clock Status & Metrics */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">حامي التوقيت ورادار الرجوع الزمني (Anti-Rollback)</h3>
                      <p className="text-xs text-slate-400">حماية مدة الاشتراكات من التلاعب عبر تعديل تاريخ الجهاز</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      clockReport?.isTampered
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {clockReport?.isTampered ? 'تم رصد تلاعب!' : 'آمن ومحمي'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">توقيت الجهاز المحلي:</span>
                    <span className="text-white font-mono font-bold text-sm">
                      {clockReport?.localSystemTime ? new Date(clockReport.localSystemTime).toLocaleString('ar-SA') : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">التوقيت الموثق والمحمي (Secure Time):</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {clockReport?.verifiedSecureTime ? new Date(clockReport.verifiedSecureTime).toLocaleString('ar-SA') : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">أعلى علامة مائية تاريخية (High Watermark):</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {clockReport?.highWatermarkTime ? new Date(clockReport.highWatermarkTime).toLocaleString('ar-SA') : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">مصدر التزامن المرجعي:</span>
                    <span className="text-violet-400 font-bold">{clockReport?.lastSyncSource}</span>
                  </div>
                </div>

                {/* Explanation Banner */}
                <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/20 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-violet-300 block mb-1">كيف يعمل حامي التوقيت؟</strong>
                  يقوم النظام بتسجيل أعلى نقطة زمنية وصل إليها الجهاز في سجل مشفر غير قابل للتعديل. إذا حاول أي شخص إرجاع ساعة الجهاز للخلف للاستفادة من ترخيص منتهي، يكتشف النظام فوراً فارق التوقيت ويغلق العمليات الحساسة تلقائياً.
                </div>
              </div>
            </div>

            {/* Right: Rollback Testing Bench */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">مختبر محاكاة التلاعب الزمني</h3>
                    <p className="text-xs text-slate-400">اختبار كفاءة رصد الرجوع الزمني</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <button
                    onClick={() => handleSimulateClockRollback(2)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-200 font-bold transition-all text-start cursor-pointer flex items-center justify-between"
                  >
                    <span>إرجاع الساعة ساعتين للخلف (-2 Hours)</span>
                    <Clock className="w-4 h-4 text-rose-400" />
                  </button>

                  <button
                    onClick={() => handleSimulateClockRollback(48)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-200 font-bold transition-all text-start cursor-pointer flex items-center justify-between"
                  >
                    <span>إرجاع التاريخ يومين للخلف (-48 Hours)</span>
                    <Clock className="w-4 h-4 text-rose-400" />
                  </button>

                  <button
                    onClick={() => handleSimulateClockRollback(720)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-200 font-bold transition-all text-start cursor-pointer flex items-center justify-between"
                  >
                    <span>إرجاع التاريخ شهر كامل (-30 Days)</span>
                    <Clock className="w-4 h-4 text-rose-400" />
                  </button>

                  <button
                    onClick={handleResetClockSimulation}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold transition-all text-center cursor-pointer mt-4"
                  >
                    استعادة التوقيت الحقيقي وإلغاء المحاكاة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: CANARY TOKENS ================= */}
        {activeTab === 'canary_tokens' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stego Encoder */}
            <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">زراعة الشفرات المائية الخفية (Steganography)</h3>
                  <p className="text-xs text-slate-400">تضمين بيانات الترخيص والبصمة خفية داخل النصوص</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  النص المراد حمايته وتضمين الشفرة المائية فيه (فاتورة / تقرير):
                </label>
                <textarea
                  rows={4}
                  value={watermarkSourceText}
                  onChange={(e) => setWatermarkSourceText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>

              <button
                onClick={handleInjectWatermark}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>زراعة الشفرة المائية الخفية (Zero-Width Inject)</span>
              </button>

              {watermarkedOutput && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                    <span>النص بعد تضمين الشفرة (تبدو متطابقة بصرياً بنسبة 100%):</span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      +{(watermarkedOutput.length - watermarkSourceText.length) * 2} Bytes Hidden
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-xs font-mono text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
                    {watermarkedOutput}
                  </div>
                </div>
              )}
            </div>

            {/* Stego Decoder & Forensic Extraction */}
            <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">فاحص الأدلة الرقمية والتحقيق الجنائي</h3>
                  <p className="text-xs text-slate-400">استخراج هوية السارق ومصدر التسريب من أي نص</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  الصق النص المسرب هنا للتحقيق الجنائي:
                </label>
                <textarea
                  rows={4}
                  value={inspectWatermarkText}
                  onChange={(e) => setInspectWatermarkText(e.target.value)}
                  placeholder="Paste potentially leaked invoice, report or string here..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none"
                />
              </div>

              <button
                onClick={handleExtractWatermark}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>استخراج الشفرة وتحليل مصدر التسريب</span>
              </button>

              {extractionResult && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">نتيجة الفحص الجنائي:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        extractionResult.hasWatermark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {extractionResult.hasWatermark ? 'شفرة مؤكدة 100%' : 'لا توجد شفرة'}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-400 bg-black/40 p-3 rounded-xl whitespace-pre-wrap leading-tight">
                    {extractionResult.forensicReportAr}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: KILL SWITCH ================= */}
        {activeTab === 'kill_switch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Kill Switch Status & Simulation */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">محرك الإيقاف السحابي الفوري (Encrypted Kill-Switch)</h3>
                      <p className="text-xs text-slate-400">إيقاف النظام عن بعد فورياً في حالات الاختراق أو التعديات</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      killStatus?.isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {killStatus?.isActive ? killStatus.action : 'STANDBY - جاهز'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">حالة الاتصال السحابي:</span>
                    <span className="text-emerald-400 font-bold">متصل بالسيرفر الأمني الموثوق</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">نقطة الفحص الأمني (Heartbeat):</span>
                    <span className="text-cyan-400 font-mono text-[11px] truncate block">
                      {killStatus?.heartbeatEndpoint}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 md:col-span-2">
                    <span className="text-slate-400 block mb-1">السبب المسجل للإيقاف:</span>
                    <span className="text-slate-200 font-medium">
                      {killStatus?.reasonAr || 'لا يوجد إيقاف نشط'}
                    </span>
                  </div>
                </div>

                {/* Kill Switch Triggers Bench */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="text-xs font-bold text-slate-300">أوامر محاكاة الإيقاف السحابي (Demo Actions):</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => handleSimulateKillSwitch('LOCKOUT_SOFT')}
                      className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all text-start cursor-pointer"
                    >
                      🔒 إيقاف مؤقت (انتهاء اشتراك)
                    </button>

                    <button
                      onClick={() => handleSimulateKillSwitch('LOCKOUT_HARD')}
                      className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold transition-all text-start cursor-pointer"
                    >
                      ⛔ إيقاف كامل وفوري (سرقة كود)
                    </button>

                    <button
                      onClick={() => handleSimulateKillSwitch('REVOKE_MODULE')}
                      className="p-3 rounded-2xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold transition-all text-start cursor-pointer"
                    >
                      ✂️ سحب صلاحية وحدة الذكاء AI
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Master Rescue Override Panel */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">رمز الطوارئ والإنقاذ (Rescue PIN)</h3>
                    <p className="text-xs text-slate-400">لفك الإيقاف في حالات الصيانة الطارئة</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      رمز الإنقاذ المعتمد للمهندس الميداني:
                    </label>
                    <input
                      type="password"
                      value={rescuePinInput}
                      onChange={(e) => setRescuePinInput(e.target.value)}
                      placeholder="Enter Master Rescue PIN..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUnlockRescue}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      فك الإيقاف واستعادة النظام
                    </button>
                    <button
                      onClick={() => setRescuePinInput('9928-1104-REST-OVERRIDE')}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                      title="Insert Demo Rescue PIN"
                    >
                      ملء الرمز
                    </button>
                  </div>

                  {rescueMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold ${
                        rescueMsg.success
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rescueMsg.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: LIVE AUDIT LOG ================= */}
        {activeTab === 'audit_log' && (
          <div className="p-6 rounded-3xl bg-[#12161f] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">سجل الأحداث والتدقيق الأمني الفوري</h3>
                  <p className="text-xs text-slate-400">تتبع زمني لجميع عمليات الفحص والتراخيص والتنبيهات</p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {auditLogs.length} سجلات مسجلة
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        log.level === 'success'
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                          : log.level === 'threat'
                          ? 'bg-rose-400 shadow-sm shadow-rose-400 animate-ping'
                          : log.level === 'warn'
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{log.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{log.detail}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* License JSON Import Modal */}
      {licenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl p-6 rounded-3xl bg-[#12161f] border border-white/10 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <span>استيراد ملف ترخيص رقمي (Signed License JSON)</span>
              </h3>
              <button
                onClick={() => setLicenseModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={8}
              value={licenseInputJson}
              onChange={(e) => setLicenseInputJson(e.target.value)}
              placeholder="Paste JSON license content here..."
              className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={handleApplyCustomLicenseJson}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                تنشيط والتحقق من التوقيع الرياضي
              </button>
              <button
                onClick={() => setLicenseModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
