import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Building2,
  KeyRound,
  CreditCard,
  TrendingUp,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Server,
  Zap,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Sliders,
  Award,
  Globe,
  DollarSign,
  Layers,
  ArrowUpRight,
  Flame,
  FileCode,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSuperAdminStore, SUBSCRIPTION_PLANS } from '../../stores/useSuperAdminStore';
import { getTranslation } from '../../i18n/translations';
import {
  SubscriptionTier,
  TenantStatus,
  TenantRestaurant,
  BillingCycle,
} from '../../types/superAdmin';
import {
  verifyLicenseIntegrity,
  generateHardwareUUID,
} from '../../services/licenseEngine';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export const SuperAdminModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  const {
    tenants,
    licenses,
    killSwitchLogs,
    metricHistory,
    globalEmergencyLock,
    emergencyLockReason,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    planFilter,
    setPlanFilter,
    statusFilter,
    setStatusFilter,
    addTenant,
    updateTenant,
    setTenantStatus,
    deleteTenant,
    changeSubscriptionPlan,
    generateLicenseForTenant,
    triggerRemoteKillSwitch,
    reactivateTenant,
    triggerGlobalEmergencyLock,
    releaseGlobalEmergencyLock,
    getPlatformStats,
  } = useSuperAdminStore();

  const stats = getPlatformStats();

  // Local Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRestaurant | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanTenant, setSelectedPlanTenant] = useState<TenantRestaurant | null>(null);
  const [targetPlan, setTargetPlan] = useState<SubscriptionTier>('pro');
  const [targetCycle, setTargetCycle] = useState<BillingCycle>('annually');

  const [showKillModal, setShowKillModal] = useState(false);
  const [killTargetTenant, setKillTargetTenant] = useState<TenantRestaurant | null>(null);
  const [killReason, setKillReason] = useState('Payment delinquency grace period expired');

  const [showGlobalLockModal, setShowGlobalLockModal] = useState(false);
  const [lockPasscode, setLockPasscode] = useState('');
  const [lockReasonInput, setLockReasonInput] = useState('Critical zero-day security vulnerability mitigation');

  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseTargetTenant, setLicenseTargetTenant] = useState<TenantRestaurant | null>(null);
  const [licenseDuration, setLicenseDuration] = useState(365);
  const [licenseHardwareUUID, setLicenseHardwareUUID] = useState('');
  const [generatedPemCert, setGeneratedPemCert] = useState<string | null>(null);
  const [copiedCert, setCopiedCert] = useState(false);

  // License Verifier State
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<ReturnType<typeof verifyLicenseIntegrity> | null>(null);

  // Pricing Matrix billing view
  const [pricingCycleView, setPricingCycleView] = useState<BillingCycle>('annually');

  // Form state for adding/editing tenant
  const [formTenant, setFormTenant] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    city: 'الرياض',
    country: 'المملكة العربية السعودية',
    currency: 'SAR',
    plan: 'pro' as SubscriptionTier,
    billingCycle: 'annually' as BillingCycle,
    monthlyFee: 39,
    paymentStatus: 'paid' as TenantRestaurant['paymentStatus'],
    status: 'active' as TenantStatus,
    branchesCount: 1,
    maxBranches: 3,
    posTerminalsCount: 2,
    maxPosTerminals: 6,
    kdsScreensCount: 1,
    maxKdsScreens: 3,
    joinedDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    licenseKey: '',
    hardwareFingerprint: '',
    dbCluster: 'cluster-riyadh-01.aws',
    cloudflareTunnelId: 'cf-tun-auto-' + Math.floor(1000 + Math.random() * 9000),
    features: {
      aiCopilot: true,
      multiBranchSync: true,
      kioskMode: false,
      onlineStore: true,
      intercomAudio: true,
      customBranding: false,
      zatcaPhase2: true,
      offlinePriority: true,
      advancedReports: true,
      customDomain: false,
    },
    notes: '',
  });

  // Filter Tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.licenseKey.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Handle Add New Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTenant.nameAr || !formTenant.nameEn || !formTenant.ownerName) {
      playSound('alert');
      return;
    }

    const created = addTenant({
      ...formTenant,
      slug: formTenant.slug || formTenant.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    });

    playSound('success');
    setShowAddModal(false);
    setSelectedTenant(created);
  };

  // Handle Edit Tenant
  const handleUpdateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    updateTenant(selectedTenant.id, formTenant);
    playSound('success');
    setShowEditModal(false);
  };

  // Handle Generate License
  const handleTriggerLicenseGeneration = (tenant: TenantRestaurant) => {
    playSound('pop');
    setLicenseTargetTenant(tenant);
    setLicenseHardwareUUID(tenant.hardwareFingerprint || generateHardwareUUID());
    setGeneratedPemCert(null);
    setShowLicenseModal(true);
  };

  const handleExecuteLicenseGen = () => {
    if (!licenseTargetTenant) return;
    const { pemCertificate } = generateLicenseForTenant(licenseTargetTenant.id, {
      durationDays: licenseDuration,
      hardwareUUID: licenseHardwareUUID,
      tier: licenseTargetTenant.plan,
    });
    playSound('kitchen-bell');
    setGeneratedPemCert(pemCertificate);
  };

  // Handle Kill Switch
  const handleOpenKillSwitchModal = (tenant: TenantRestaurant) => {
    playSound('alert');
    setKillTargetTenant(tenant);
    setKillReason('Critical Terms of Service or billing delinquency violation');
    setShowKillModal(true);
  };

  const handleExecuteKillSwitch = () => {
    if (!killTargetTenant) return;
    triggerRemoteKillSwitch(killTargetTenant.id, killReason);
    playSound('alert');
    setShowKillModal(false);
  };

  const handleReactivate = (tenant: TenantRestaurant) => {
    playSound('kitchen-bell');
    reactivateTenant(tenant.id);
  };

  // Handle Global Lockdown
  const handleGlobalLockToggle = () => {
    if (globalEmergencyLock) {
      const ok = releaseGlobalEmergencyLock(lockPasscode);
      if (ok) {
        playSound('success');
        setShowGlobalLockModal(false);
        setLockPasscode('');
      } else {
        playSound('alert');
        alert(language === 'ar' ? 'رمز فك الإغلاق غير صحيح!' : 'Invalid unlock passcode!');
      }
    } else {
      const ok = triggerGlobalEmergencyLock(lockReasonInput, lockPasscode);
      if (ok) {
        playSound('alert');
        setShowGlobalLockModal(false);
        setLockPasscode('');
      } else {
        playSound('alert');
        alert(language === 'ar' ? 'رمز الإغلاق غير صحيح! (استخدم 9999 أو KILL-ALL-ROOT-99)' : 'Invalid passcode (Use 9999 or KILL-ALL-ROOT-99)');
      }
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="emerald" size="sm" dot>
            {language === 'ar' ? 'نشط ومفعّل' : 'Active'}
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="amber" size="sm" dot>
            {language === 'ar' ? 'معلق مؤقتاً' : 'Suspended'}
          </Badge>
        );
      case 'trial':
        return (
          <Badge variant="blue" size="sm" dot>
            {language === 'ar' ? 'تجربة مجانية' : 'Trial'}
          </Badge>
        );
      case 'killed':
        return (
          <Badge variant="rose" size="sm" dot>
            {language === 'ar' ? 'إيقاف فوري (Killed)' : 'Remote Killed'}
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="slate" size="sm">
            {language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="sm">
            {status}
          </Badge>
        );
    }
  };

  // Plan Badge Helper
  const renderPlanBadge = (plan: SubscriptionTier) => {
    switch (plan) {
      case 'enterprise':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            Enterprise $85
          </span>
        );
      case 'pro':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Pro $39
          </span>
        );
      case 'starter':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Starter $15
          </span>
        );
      case 'trial':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
            Trial Free
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      {/* Top Warning Banner if Global Emergency Lock is active */}
      {globalEmergencyLock && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-rose-950/80 border-b border-rose-500/50 p-3 flex items-center justify-between z-30 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/30 text-rose-400 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-rose-200 uppercase tracking-widest flex items-center gap-2">
                <span>{t.superadmin_global_lock_active}</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/30 text-[10px] text-rose-300">
                  SYSTEM PURGE LOCK
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                {emergencyLockReason || 'Emergency Remote Kill activated across all multi-tenant nodes.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              playSound('tap');
              setShowGlobalLockModal(true);
            }}
            className="rounded-xl font-bold text-xs"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'فك الإغلاق الشامل' : 'Release Master Lock'}</span>
          </Button>
        </motion.div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">{t.superadmin_title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ROOT SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t.superadmin_subtitle}</p>
          </div>
        </div>

        {/* Global Controls & Emergency Trigger */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={globalEmergencyLock ? 'danger' : 'ghost'}
            onClick={() => {
              playSound('alert');
              setShowGlobalLockModal(true);
            }}
            className="rounded-xl text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>
              {globalEmergencyLock
                ? language === 'ar'
                  ? 'فك الإغلاق العام'
                  : 'Release Lock'
                : language === 'ar'
                ? 'إغلاق دفاعي شامل'
                : 'Emergency Lockdown'}
            </span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              playSound('pop');
              setFormTenant({
                nameAr: '',
                nameEn: '',
                slug: '',
                logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                city: 'الرياض',
                country: 'المملكة العربية السعودية',
                currency: 'SAR',
                plan: 'pro',
                billingCycle: 'annually',
                monthlyFee: 39,
                paymentStatus: 'paid',
                status: 'active',
                branchesCount: 1,
                maxBranches: 3,
                posTerminalsCount: 2,
                maxPosTerminals: 6,
                kdsScreensCount: 1,
                maxKdsScreens: 3,
                joinedDate: new Date().toISOString().split('T')[0],
                renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                licenseKey: '',
                hardwareFingerprint: generateHardwareUUID(),
                dbCluster: 'cluster-riyadh-01.aws',
                cloudflareTunnelId: 'cf-tun-auto-' + Math.floor(1000 + Math.random() * 9000),
                features: {
                  aiCopilot: true,
                  multiBranchSync: true,
                  kioskMode: false,
                  onlineStore: true,
                  intercomAudio: true,
                  customBranding: false,
                  zatcaPhase2: true,
                  offlinePriority: true,
                  advancedReports: true,
                  customDomain: false,
                },
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{t.superadmin_quick_action_add}</span>
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: t.superadmin_tab_overview, icon: TrendingUp },
          { id: 'tenants', label: `${t.superadmin_tab_tenants} (${tenants.length})`, icon: Building2 },
          { id: 'plans', label: t.superadmin_tab_plans, icon: CreditCard },
          { id: 'licenses', label: t.superadmin_tab_licenses, icon: KeyRound },
          {
            id: 'killswitch',
            label: `${t.superadmin_tab_killswitch} (${killSwitchLogs.length})`,
            icon: ShieldAlert,
            alertGlow: stats.licenseRevocations > 0,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playSound('tap');
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-white border border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? 'text-amber-400'
                    : tab.alertGlow
                    ? 'text-rose-400 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Viewport Content Container */}
      <div className="flex-1 overflow-y-auto pt-2 pe-1 space-y-4 custom-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & GLOBAL PLATFORM ANALYTICS               */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* MRR Card */}
              <Card elevated className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{t.superadmin_total_mrr}</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono-numbers">
                    ${stats.totalMRR.toLocaleString()}{' '}
                    <span className="text-xs text-amber-400 font-normal">/ mo</span>
                  </span>
                  <span className="flex items-center text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +24.8%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {t.superadmin_total_arr}: ${(stats.totalARR).toLocaleString()}
                </div>
              </Card>

              {/* Platform Gross Sales Today */}
              <Card elevated className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{t.superadmin_platform_sales}</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono-numbers">
                    {stats.platformGrossSalesToday.toLocaleString()}{' '}
                    <span className="text-xs text-purple-400 font-normal">{t.currency}</span>
                  </span>
                  <span className="flex items-center text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {stats.platformOrdersToday.toLocaleString()} {t.superadmin_platform_orders}
                </div>
              </Card>

              {/* Active Tenants & Connected Branches */}
              <Card elevated className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{t.superadmin_active_tenants}</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono-numbers">
                    {stats.activeTenants}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {stats.totalTenants}</span>
                  </span>
                  <Badge variant="emerald" size="sm">
                    {Math.round((stats.activeTenants / (stats.totalTenants || 1)) * 100)}% Health
                  </Badge>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {stats.totalBranchesActive} {t.superadmin_total_branches}
                </div>
              </Card>

              {/* Terminals & Cluster Status */}
              <Card elevated className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{t.superadmin_active_terminals}</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono-numbers">
                    {stats.totalTerminalsActive}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> {stats.systemHealth.apiLatencyMs}ms
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Cloudflare Tunnel: <span className="text-emerald-400 font-bold">Zero-Trust Active</span>
                </div>
              </Card>
            </div>

            {/* Global Revenue Timeline Chart & Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Aggregated Revenue Timeline */}
              <Card elevated className="lg:col-span-2 border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>
                        {language === 'ar'
                          ? 'مسار إيرادات المنصة المجمعة (آخر 7 أيام)'
                          : 'Platform Multi-Tenant Gross Revenue (7 Days)'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'ar'
                        ? 'مجموع مبيعات نقاط البيع وشاشات KDS اللحظية عبر كافة الفروع'
                        : 'Real-time aggregated sales stream from all registered branches'}
                    </p>
                  </div>
                  <Badge variant="purple" size="sm">
                    Live Telemetry
                  </Badge>
                </div>

                {/* Custom SVG Bar / Area visualization */}
                <div className="h-52 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                  {metricHistory.map((item, index) => {
                    const max = Math.max(...metricHistory.map((m) => m.grossSales));
                    const heightPercent = Math.round((item.grossSales / max) * 100);
                    return (
                      <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[10px] font-mono-numbers text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ${(item.grossSales / 1000).toFixed(1)}k
                        </div>
                        <div className="w-full bg-white/5 rounded-2xl h-full flex items-end p-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.6, delay: index * 0.08 }}
                            className="w-full rounded-xl bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 group-hover:from-amber-400 group-hover:to-yellow-200 transition-all shadow-md shadow-amber-500/20"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-400 transition-colors">
                          {item.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Plan Distribution Breakdown */}
              <Card elevated className="border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>
                      {language === 'ar' ? 'توزيع خطط الاشتراكات' : 'Subscription Tiers Split'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {language === 'ar' ? 'نسبة المستأجرين حسب باقات الخدمة' : 'Tenants count by active tier'}
                  </p>

                  <div className="space-y-3">
                    {[
                      { tier: 'enterprise', name: 'Enterprise ($85)', color: 'bg-amber-400', count: tenants.filter((t) => t.plan === 'enterprise').length },
                      { tier: 'pro', name: 'Pro ($39)', color: 'bg-purple-400', count: tenants.filter((t) => t.plan === 'pro').length },
                      { tier: 'starter', name: 'Starter ($15)', color: 'bg-sky-400', count: tenants.filter((t) => t.plan === 'starter').length },
                      { tier: 'trial', name: 'Free Trial', color: 'bg-slate-400', count: tenants.filter((t) => t.plan === 'trial').length },
                    ].map((row) => {
                      const percentage = Math.round((row.count / (tenants.length || 1)) * 100);
                      return (
                        <div key={row.tier} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">{row.name}</span>
                            <span className="text-white font-mono-numbers">
                              {row.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-full ${row.color}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    <div>{language === 'ar' ? 'معدل الاحتفاظ السنوي' : 'Gross Annual Retention'}</div>
                    <div className="text-sm font-black text-emerald-400 font-mono-numbers">98.4%</div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    Low Churn
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Quick Tenants Leaderboard Table */}
            <Card elevated className="border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'ar' ? 'أعلى المطاعم والمستأجرين مبيعاً' : 'Top Performing Restaurant Tenants'}
                  </span>
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    playSound('tap');
                    setActiveTab('tenants');
                  }}
                  className="text-xs text-amber-400"
                >
                  {language === 'ar' ? 'عرض كافة المطاعم ←' : 'View All Tenants →'}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold">
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المطعم المستأجر' : 'Restaurant Tenant'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المدينة / الدولة' : 'Location'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الفروع والمحطات' : 'Scale'}</th>
                      <th className="py-2.5 px-3 text-end">{language === 'ar' ? 'إجمالي المبيعات' : 'Gross Volume'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tenants.slice(0, 5).map((tnt) => (
                      <tr key={tnt.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={tnt.logo}
                              alt={tnt.nameEn}
                              className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="font-bold text-white">
                                {language === 'ar' ? tnt.nameAr : tnt.nameEn}
                              </div>
                              <div className="text-[11px] text-slate-400">{tnt.ownerName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {tnt.city}, {tnt.country.split(' ')[0]}
                        </td>
                        <td className="py-3 px-3">{renderPlanBadge(tnt.plan)}</td>
                        <td className="py-3 px-3 text-slate-300 font-mono-numbers">
                          {tnt.branchesCount} Branches • {tnt.posTerminalsCount} POS
                        </td>
                        <td className="py-3 px-3 text-end font-bold text-white font-mono-numbers">
                          {tnt.totalGrossSales.toLocaleString()} {tnt.currency}
                        </td>
                        <td className="py-3 px-3 text-center">{renderStatusBadge(tnt.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TENANTS & RESTAURANT DIRECTORY                     */}
        {/* ========================================================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="w-full sm:w-96">
                <Input
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                  placeholder={t.superadmin_search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/60 rounded-2xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {/* Plan filter */}
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="bg-white/5 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500/50"
                >
                  <option value="all" className="bg-slate-950 text-white">
                    {language === 'ar' ? 'كافة الخطط' : 'All Plans'}
                  </option>
                  <option value="enterprise" className="bg-slate-950 text-white">Enterprise $85</option>
                  <option value="pro" className="bg-slate-950 text-white">Pro $39</option>
                  <option value="starter" className="bg-slate-950 text-white">Starter $15</option>
                  <option value="trial" className="bg-slate-950 text-white">Trial Free</option>
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white/5 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500/50"
                >
                  <option value="all" className="bg-slate-950 text-white">
                    {language === 'ar' ? 'كافة الحالات' : 'All Statuses'}
                  </option>
                  <option value="active" className="bg-slate-950 text-white">{t.superadmin_status_active}</option>
                  <option value="suspended" className="bg-slate-950 text-white">{t.superadmin_status_suspended}</option>
                  <option value="trial" className="bg-slate-950 text-white">{t.superadmin_status_trial}</option>
                  <option value="killed" className="bg-slate-950 text-white">{t.superadmin_status_killed}</option>
                </select>
              </div>
            </div>

            {/* Tenants Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTenants.map((tenant) => {
                const isKilled = tenant.status === 'killed';
                const isSuspended = tenant.status === 'suspended';

                return (
                  <Card
                    key={tenant.id}
                    elevated
                    className={`border-white/10 relative transition-all duration-300 ${
                      isKilled
                        ? 'border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-950/20'
                        : isSuspended
                        ? 'border-amber-500/30 bg-amber-950/10'
                        : 'hover:border-amber-500/30'
                    }`}
                  >
                    {/* Header: Logo, Title, Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={tenant.logo}
                          alt={tenant.nameEn}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10 shadow-md"
                        />
                        <div>
                          <h4 className="text-sm font-black text-white leading-tight">
                            {language === 'ar' ? tenant.nameAr : tenant.nameEn}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>
                              {tenant.city} — {tenant.country}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {renderStatusBadge(tenant.status)}
                        {renderPlanBadge(tenant.plan)}
                      </div>
                    </div>

                    {/* Kill Alert reason if killed */}
                    {isKilled && (
                      <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 mb-3 text-[11px] text-rose-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{language === 'ar' ? 'سبب الإيقاف:' : 'Kill Reason:'}</span>{' '}
                          {tenant.killReason || 'Remote lockdown initiated by SuperAdmin.'}
                        </div>
                      </div>
                    )}

                    {/* Tenant Details Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/5 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المالك والمفوض' : 'Owner / Contact'}</span>
                        <span className="font-bold text-slate-200 truncate block">{tenant.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المبيعات الإجمالية' : 'Gross Revenue'}</span>
                        <span className="font-black text-amber-400 font-mono-numbers">
                          {tenant.totalGrossSales.toLocaleString()} {tenant.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الفروع والمحطات' : 'Branches & Terminals'}</span>
                        <span className="font-semibold text-slate-200 font-mono-numbers">
                          {tenant.branchesCount} Branches • {tenant.posTerminalsCount} POS • {tenant.kdsScreensCount} KDS
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'تاريخ التجديد' : 'Renewal Due'}</span>
                        <span className="font-semibold text-slate-300 font-mono-numbers">{tenant.renewalDate}</span>
                      </div>
                    </div>

                    {/* License Key Preview */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-white/5 mb-4">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-mono-numbers text-slate-400 truncate">
                          {tenant.licenseKey || 'NO-ACTIVE-RSA-CERT'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (tenant.licenseKey) {
                            navigator.clipboard.writeText(tenant.licenseKey);
                            playSound('click');
                          }
                        }}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] p-1"
                        title="Copy Key"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTriggerLicenseGeneration(tenant)}
                        className="flex-1 rounded-xl text-[11px] font-bold"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>RSA-2048</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          playSound('tap');
                          setSelectedPlanTenant(tenant);
                          setTargetPlan(tenant.plan);
                          setTargetCycle(tenant.billingCycle);
                          setShowPlanModal(true);
                        }}
                        className="flex-1 rounded-xl text-[11px] font-bold"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        <span>{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                      </Button>

                      {isKilled || isSuspended ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleReactivate(tenant)}
                          className="flex-1 rounded-xl text-[11px] font-bold"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تفعيل' : 'Revive'}</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleOpenKillSwitchModal(tenant)}
                          className="flex-1 rounded-xl text-[11px] font-bold"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Kill</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SUBSCRIPTION PLANS & PRICING ENGINE               */}
        {/* ========================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            {/* Header with billing cycle switch */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-white/10 gap-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {language === 'ar'
                    ? 'هندسة خطط الاشتراك والتسعير المؤسسي (SaaS Multi-Tier Pricing)'
                    : 'SaaS Subscription Plans & Tier Matrix'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'إدارة صلاحيات المستأجرين، حدود الكاشيرات، شاشات KDS والتراخيص المشفرة'
                    : 'Manage feature gating, POS/KDS limits and offline licensing quotas'}
                </p>
              </div>

              {/* Billing Cycle Switch */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10">
                <button
                  onClick={() => {
                    playSound('tap');
                    setPricingCycleView('monthly');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pricingCycleView === 'monthly'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'سداد شهري' : 'Monthly'}
                </button>

                <button
                  onClick={() => {
                    playSound('tap');
                    setPricingCycleView('annually');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pricingCycleView === 'annually'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{language === 'ar' ? 'سداد سنوي' : 'Annual Billing'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950">
                    -20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isPro = plan.id === 'pro';
                const isEnterprise = plan.id === 'enterprise';
                const price =
                  pricingCycleView === 'annually' ? plan.annualPricePerMonth : plan.monthlyPrice;

                return (
                  <Card
                    key={plan.id}
                    elevated
                    className={`relative flex flex-col justify-between transition-all duration-300 ${
                      isEnterprise
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-xl shadow-amber-500/10'
                        : isPro
                        ? 'border-purple-500/40 bg-gradient-to-b from-purple-500/10 to-transparent shadow-xl shadow-purple-500/10'
                        : 'border-white/10'
                    }`}
                  >
                    <div>
                      {/* Popular / Tier Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-white/10 text-amber-400 border border-white/10">
                          {language === 'ar' ? plan.badgeAr : plan.badgeEn}
                        </span>
                        {plan.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-purple-500 text-white shadow-md">
                            POPULAR
                          </span>
                        )}
                      </div>

                      {/* Plan Title & Price */}
                      <h4 className="text-base font-black text-white">
                        {language === 'ar' ? plan.nameAr : plan.nameEn}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                        {language === 'ar' ? plan.descriptionAr : plan.descriptionEn}
                      </p>

                      <div className="my-4 pb-4 border-b border-white/10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white font-mono-numbers">
                            ${price}
                          </span>
                          <span className="text-xs text-slate-400">
                            {plan.id === 'trial'
                              ? language === 'ar'
                                ? '/ 14 يوم'
                                : '/ 14 days'
                              : language === 'ar'
                              ? '/ شهر'
                              : '/ month'}
                          </span>
                        </div>
                        {pricingCycleView === 'annually' && plan.monthlyPrice > 0 && (
                          <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                            {language === 'ar'
                              ? `يُفوتر سنوياً: $${plan.annualPricePerMonth * 12} بدلاً من $${plan.monthlyPrice * 12}`
                              : `Billed annually at $${plan.annualPricePerMonth * 12}/yr (Save 20%)`}
                          </div>
                        )}
                      </div>

                      {/* Limits Summary */}
                      <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-white/5 text-center text-xs mb-4 font-mono-numbers">
                        <div>
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'فروع' : 'Branches'}</div>
                          <div className="font-bold text-white">
                            {plan.maxBranches === 'unlimited' ? '∞' : plan.maxBranches}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'كاشير' : 'POS'}</div>
                          <div className="font-bold text-white">
                            {plan.maxPosTerminals === 'unlimited' ? '∞' : plan.maxPosTerminals}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'مطبخ' : 'KDS'}</div>
                          <div className="font-bold text-white">
                            {plan.maxKdsScreens === 'unlimited' ? '∞' : plan.maxKdsScreens}
                          </div>
                        </div>
                      </div>

                      {/* Feature Entitlements Checklist */}
                      <div className="space-y-2 mb-6">
                        {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {feat.included ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <span className={feat.included ? 'text-slate-200' : 'text-slate-500 line-through'}>
                              {language === 'ar' ? feat.nameAr : feat.nameEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isEnterprise ? 'primary' : isPro ? 'amber' : 'secondary'}
                      onClick={() => {
                        playSound('tap');
                        setActiveTab('tenants');
                        setPlanFilter(plan.id);
                      }}
                      className="w-full rounded-2xl text-xs font-bold"
                    >
                      <span>
                        {language === 'ar'
                          ? `عرض مطاعم الخطة (${tenants.filter((t) => t.plan === plan.id).length})`
                          : `View Tenants (${tenants.filter((t) => t.plan === plan.id).length})`}
                      </span>
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RSA-2048 LICENSE VAULT & GENERATOR                 */}
        {/* ========================================================= */}
        {activeTab === 'licenses' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Interactive License Generator Panel */}
              <Card elevated className="border-amber-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {language === 'ar'
                        ? 'مولد تراخيص RSA-2048 المشفرة (Military-Grade Keygen)'
                        : 'RSA-2048 Cryptographic License Generator'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'ar'
                        ? 'توليد شهادات رقمية مشفرة بـ 2048-بت ومربوطة ببصمة العتاد'
                        : 'Generate SHA-256 RSA-2048 hardware-bound signed certificates'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Select Tenant */}
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'المطعم المستهدف بالترخيص:' : 'Target Restaurant Tenant:'}
                    </label>
                    <select
                      value={licenseTargetTenant?.id || (tenants[0]?.id ?? '')}
                      onChange={(e) => {
                        const found = tenants.find((t) => t.id === e.target.value);
                        if (found) {
                          setLicenseTargetTenant(found);
                          setLicenseHardwareUUID(found.hardwareFingerprint || generateHardwareUUID());
                        }
                      }}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    >
                      {tenants.map((tnt) => (
                        <option key={tnt.id} value={tnt.id}>
                          {language === 'ar' ? tnt.nameAr : tnt.nameEn} ({tnt.plan.toUpperCase()}) — {tnt.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration & Hardware UUID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">
                        {language === 'ar' ? 'مدة الصلاحية:' : 'License Duration:'}
                      </label>
                      <select
                        value={licenseDuration}
                        onChange={(e) => setLicenseDuration(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                      >
                        <option value={14}>{language === 'ar' ? '14 يوماً (تجريبي)' : '14 Days (Trial)'}</option>
                        <option value={30}>{language === 'ar' ? '30 يوماً (شهر واحد)' : '30 Days (1 Month)'}</option>
                        <option value={365}>{language === 'ar' ? '365 يوماً (سنة كاملة)' : '365 Days (1 Year)'}</option>
                        <option value={1095}>{language === 'ar' ? '3 سنوات (مؤسسي)' : '3 Years (Enterprise)'}</option>
                        <option value={3650}>{language === 'ar' ? 'مدى الحياة (Lifetime)' : 'Lifetime (10 Years)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">
                        {language === 'ar' ? 'بصمة العتاد (Hardware UUID):' : 'Hardware UUID Binding:'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={licenseHardwareUUID}
                          onChange={(e) => setLicenseHardwareUUID(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 text-white font-mono-numbers rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            playSound('tap');
                            setLicenseHardwareUUID(generateHardwareUUID());
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                          title="Generate Random UUID"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!licenseTargetTenant && tenants.length > 0) {
                        setLicenseTargetTenant(tenants[0]);
                      }
                      handleExecuteLicenseGen();
                    }}
                    className="w-full rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {language === 'ar'
                        ? 'تشفير وإصدار شهادة RSA-2048 الآن'
                        : 'Sign & Issue RSA-2048 Certificate'}
                    </span>
                  </Button>
                </div>

                {/* Generated PEM Output block */}
                {generatedPemCert && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-2xl bg-slate-950 border border-amber-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.superadmin_cert_verified}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPemCert);
                            playSound('click');
                            setCopiedCert(true);
                            setTimeout(() => setCopiedCert(false), 2500);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCert ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCert ? 'Copied!' : 'Copy PEM'}</span>
                        </button>
                      </div>
                    </div>

                    <pre className="text-[10px] font-mono text-emerald-400 bg-black/60 p-2.5 rounded-xl overflow-x-auto max-h-36 custom-scrollbar leading-tight">
                      {generatedPemCert}
                    </pre>
                  </motion.div>
                )}
              </Card>

              {/* Cryptographic License Verifier */}
              <Card elevated className="border-purple-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {language === 'ar'
                          ? 'فاحص ومحقق التراخيص (Certificate Integrity Inspector)'
                          : 'Cryptographic License Validator'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {language === 'ar'
                          ? 'التحقق من صحة التوقيع، عدم العبث، وتطابق بصمة العتاد'
                          : 'Verify RSA-2048 digital signature and check against Kill Switch registry'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      placeholder={
                        language === 'ar'
                          ? 'الصق كود الترخيص أو شهادة PEM المشفرة هنا للتحقق من سلامتها...'
                          : 'Paste PEM Certificate block or Compact License Key (RESTOS-V2-...) here...'
                      }
                      className="w-full bg-slate-900 border border-white/10 text-white font-mono text-[11px] rounded-2xl p-3 outline-none focus:border-purple-500/50 custom-scrollbar"
                    />

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        playSound('pop');
                        const result = verifyLicenseIntegrity(verifyInput);
                        setVerifyResult(result);
                      }}
                      className="w-full rounded-xl text-xs font-bold border-purple-500/30 text-purple-300"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{language === 'ar' ? 'فحص الشهادة والتوقيع الآن' : 'Validate License Cryptography'}</span>
                    </Button>

                    {verifyResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-2xl border ${
                          verifyResult.valid
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                          {verifyResult.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                          <span>{verifyResult.message}</span>
                        </div>
                        {verifyResult.payload && (
                          <div className="text-[10px] font-mono mt-1 opacity-80">
                            Tenant: {verifyResult.payload.name || verifyResult.payload.tid || 'N/A'} • Tier:{' '}
                            {String(verifyResult.payload.tier).toUpperCase()} • Remaining: {verifyResult.daysRemaining} days
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Master Key Fingerprint:</span>
                  <span className="font-mono text-amber-400 font-bold text-[10px]">SHA256:4d8a1e...6745ef</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REMOTE KILL SWITCH & SECURITY DEFENSE              */}
        {/* ========================================================= */}
        {activeTab === 'killswitch' && (
          <div className="space-y-4">
            {/* Cyber Defense Alert Header */}
            <div className="p-4 rounded-3xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-200">
                    {language === 'ar'
                      ? 'مفتاح الإيقاف الفوري عن بعد (Remote Instant Kill Switch Engine)'
                      : 'Remote Kill Switch & Security Defense Console'}
                  </h3>
                  <p className="text-xs text-rose-300/70 mt-0.5">
                    {language === 'ar'
                      ? 'إيقاف فوري لأي مطعم مخالف أو تسريب أمني مع قفل الكاشيرات والشاشات بالكامل'
                      : 'Instant revocation signal dispatching to POS/KDS terminals on license breach or tampering'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    playSound('alert');
                    setShowGlobalLockModal(true);
                  }}
                  className="rounded-2xl font-black text-xs shadow-lg shadow-rose-900/40"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {globalEmergencyLock
                      ? language === 'ar'
                        ? 'فك الإغلاق العام'
                        : 'Unlock Platform'
                      : language === 'ar'
                      ? 'إيقاف أمني شامل'
                      : 'Global System Lock'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Quick Kill Registry Table */}
            <Card elevated className="border-rose-500/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>
                    {language === 'ar'
                      ? 'سجل عمليات الإيقاف الفوري (Kill Switch Audit Trail)'
                      : 'Kill Switch Event & Audit Log'}
                  </span>
                </h4>
                <Badge variant="rose" size="sm">
                  {killSwitchLogs.length} Events
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold">
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المطعم المستهدف' : 'Target Tenant'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'السبب والداعي' : 'Reason / Justification'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'بواسطة' : 'Triggered By'}</th>
                      <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {killSwitchLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{log.tenantName}</td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{log.reason}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono-numbers">{log.triggeredBy}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono-numbers">
                          {new Date(log.triggeredAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              log.action === 'kill' || log.action === 'emergency_purge'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW TENANT PROVISIONING MODAL                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'إضافة وتفعيل مطعم مستأجر جديد' : 'Provision New Tenant Restaurant'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'ar'
                        ? 'تهيئة قاعدة البيانات والمستأجر مع إصدار ترخيص RSA-2048 تلقائي'
                        : 'Create tenant isolation profile and auto-generate cryptographic key'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white p-2"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-4 pt-4 text-xs">
                {/* Brand Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'اسم المطعم (بالعربية): *' : 'Restaurant Name (Arabic): *'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: مطاعم ومشاوي الفيروز"
                      value={formTenant.nameAr}
                      onChange={(e) => setFormTenant({ ...formTenant, nameAr: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'اسم المطعم (بالإنجليزية): *' : 'Restaurant Name (English): *'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Al-Fayrouz Grills & Cafe"
                      value={formTenant.nameEn}
                      onChange={(e) => setFormTenant({ ...formTenant, nameEn: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Owner Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'اسم المالك / المفوض: *' : 'Owner / Manager Name: *'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="خالد السعيد"
                      value={formTenant.ownerName}
                      onChange={(e) => setFormTenant({ ...formTenant, ownerName: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}
                    </label>
                    <input
                      type="email"
                      placeholder="contact@restaurant.com"
                      value={formTenant.ownerEmail}
                      onChange={(e) => setFormTenant({ ...formTenant, ownerEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                    </label>
                    <input
                      type="tel"
                      placeholder="+966 50 000 0000"
                      value={formTenant.ownerPhone}
                      onChange={(e) => setFormTenant({ ...formTenant, ownerPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Location & Plan Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'المدينة:' : 'City:'}
                    </label>
                    <input
                      type="text"
                      value={formTenant.city}
                      onChange={(e) => setFormTenant({ ...formTenant, city: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'خطة الاشتراك:' : 'Subscription Tier:'}
                    </label>
                    <select
                      value={formTenant.plan}
                      onChange={(e) => setFormTenant({ ...formTenant, plan: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    >
                      <option value="trial">Trial (14 Days Free)</option>
                      <option value="starter">Starter ($15 / mo)</option>
                      <option value="pro">Pro ($39 / mo)</option>
                      <option value="enterprise">Enterprise ($85 / mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">
                      {language === 'ar' ? 'دورة الفوترة:' : 'Billing Cycle:'}
                    </label>
                    <select
                      value={formTenant.billingCycle}
                      onChange={(e) => setFormTenant({ ...formTenant, billingCycle: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50"
                    >
                      <option value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</option>
                      <option value="annually">{language === 'ar' ? 'سنوي (خصم 20%)' : 'Annual (20% Off)'}</option>
                    </select>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl text-xs font-bold"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إنشاء وتفعيل المستأجر الآن' : 'Create & Issue License'}</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 2: CHANGE SUBSCRIPTION PLAN MODAL                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showPlanModal && selectedPlanTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'تعديل خطة الاشتراك والفوترة' : 'Update Subscription Plan'}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedPlanTenant.nameEn}</p>
                  </div>
                </div>
                <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white p-2">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">
                    {language === 'ar' ? 'اختر الخطة الجديدة:' : 'Select New Tier:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SUBSCRIPTION_PLANS.map((p) => {
                      const isSel = targetPlan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setTargetPlan(p.id)}
                          className={`p-3 rounded-2xl border text-start cursor-pointer transition-all ${
                            isSel
                              ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="font-bold">{p.nameEn}</div>
                          <div className="text-amber-400 font-mono-numbers mt-1">
                            ${p.monthlyPrice}/mo
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPlanModal(false)}
                    className="rounded-xl text-xs"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      changeSubscriptionPlan(selectedPlanTenant.id, targetPlan, targetCycle);
                      playSound('success');
                      setShowPlanModal(false);
                    }}
                    className="rounded-2xl text-xs font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تأكيد الترقية / التغيير' : 'Confirm Plan Update'}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 3: REMOTE KILL SWITCH CONFIRMATION MODAL            */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showKillModal && killTargetTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-rose-500/50 rounded-3xl p-6 shadow-2xl shadow-rose-950/50"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-rose-500/30">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-200">
                    {language === 'ar' ? 'تأكيد الإيقاف الفوري (Remote Kill)' : 'Confirm Remote Kill Switch'}
                  </h3>
                  <p className="text-xs text-rose-400/80 font-mono-numbers">
                    Target: {killTargetTenant.nameEn} ({killTargetTenant.id})
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  {language === 'ar'
                    ? 'سيؤدي تنفيذ هذا الأمر إلى إلغاء ترخيص RSA-2048 فورياً وقفل كافة نقاط البيع وشاشات KDS التابعة لهذا المطعم في الحال.'
                    : 'This action will instantly invalidate all signed RSA-2048 license tokens and lock all active POS & KDS terminals.'}
                </p>

                <div>
                  <label className="text-rose-300 font-bold block mb-1">
                    {language === 'ar' ? 'سبب الإيقاف (يُسجل في سجل الأمان):' : 'Kill Reason / Justification:'}
                  </label>
                  <textarea
                    rows={3}
                    value={killReason}
                    onChange={(e) => setKillReason(e.target.value)}
                    className="w-full bg-rose-950/30 border border-rose-500/30 text-rose-200 rounded-xl p-2.5 text-xs outline-none focus:border-rose-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowKillModal(false)}
                    className="rounded-xl text-xs font-bold text-slate-300"
                  >
                    {language === 'ar' ? 'تراجع' : 'Abort'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleExecuteKillSwitch}
                    className="rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تنفيذ الإيقاف الفوري' : 'Execute Kill Signal'}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 4: GLOBAL EMERGENCY DEFENSE PASSCODE MODAL          */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showGlobalLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-rose-500/60 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-rose-500/30">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-200">
                    {globalEmergencyLock
                      ? language === 'ar'
                        ? 'فك الإغلاق الأمني الشامل'
                        : 'Release Global System Lock'
                      : language === 'ar'
                      ? 'تفعيل الإغلاق الدفاعي الشامل'
                      : 'Trigger Global Emergency Lockdown'}
                  </h3>
                  <p className="text-xs text-rose-400">Master Root Security Protocol</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-4 text-xs">
                {!globalEmergencyLock && (
                  <div>
                    <label className="text-rose-300 font-bold block mb-1">
                      {language === 'ar' ? 'سبب الإغلاق الشامل:' : 'Emergency Lockdown Reason:'}
                    </label>
                    <input
                      type="text"
                      value={lockReasonInput}
                      onChange={(e) => setLockReasonInput(e.target.value)}
                      className="w-full bg-rose-950/40 border border-rose-500/40 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-rose-300 font-bold block mb-1">
                    {language === 'ar'
                      ? 'رمز الأمان السري (Passcode: 9999 أو KILL-ALL-ROOT-99):'
                      : 'Root Security Passcode (9999 or KILL-ALL-ROOT-99):'}
                  </label>
                  <input
                    type="password"
                    placeholder="Enter passcode..."
                    value={lockPasscode}
                    onChange={(e) => setLockPasscode(e.target.value)}
                    className="w-full bg-slate-900 border border-rose-500/40 text-rose-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-rose-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowGlobalLockModal(false)}
                    className="rounded-xl text-xs font-bold text-slate-300"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleGlobalLockToggle}
                    className="rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/40"
                  >
                    {globalEmergencyLock ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>
                      {globalEmergencyLock
                        ? language === 'ar'
                          ? 'فك الإغلاق'
                          : 'Release Lock'
                        : language === 'ar'
                        ? 'تأكيد الإغلاق الشامل'
                        : 'Confirm Lockdown'}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
