import React, { memo } from 'react';
import {
  LayoutGrid,
  Map,
  ChefHat,
  Truck,
  Smartphone,
  Radio,
  Boxes,
  Users,
  Sparkles,
  TrendingUp,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  ShieldCheck,
  Shield,
  Lock,
  ScanLine,
  UtensilsCrossed,
  Megaphone,
  QrCode,
  ReceiptText,
  Building2,
  Globe,
  ShoppingBag,
  Cpu,
  Scale,
} from 'lucide-react';

import { useAppStore } from '../../stores/useAppStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { AppModule } from '../../types';

export const Sidebar: React.FC = memo(() => {
  const {
    language,
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    toggleSidebar,
    setTourOpen,
    playSound,
    setAppMode,
    lockApp,
  } = useAppStore();

  // Subscribe to counts only (not full arrays) so KDS/inventory updates
  // don't re-render the entire nav unless a badge number actually changes.
  const activeKdsCount = useKdsStore((s) => s.tickets.length);
  const criticalStockCount = useInventoryStore((s) =>
    s.items.reduce(
      (n: number, i: any) =>
        n +
        (((i.currentStock !== undefined && i.minStockAlert !== undefined && i.currentStock <= i.minStockAlert) ||
          i.status === 'critical' ||
          i.status === 'low') ? 1 : 0),
      0
    )
  );

  const t = getTranslation(language);

  interface NavItem {
    id: AppModule;
    label: string;
    desc: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    specialAiGlow?: boolean;
    specialVisionGlow?: boolean;
    specialSuperAdminGlow?: boolean;
    specialSecurityGlow?: boolean;
    specialMarketingGlow?: boolean;
    specialShiftGlow?: boolean;
  }

  const operationalNavItems: NavItem[] = [
    {
      id: 'pos',
      label: t.module_pos,
      desc: t.module_pos_desc,
      icon: LayoutGrid,
    },
    {
      id: 'shift',
      label: (t as any).module_shift || 'المناوبات وإغلاق الصندوق',
      desc: (t as any).module_shift_desc || 'الجرد الأعمى، حركات النقدية، وفروقات الصندوق وZ-Report',
      icon: ReceiptText,
      specialShiftGlow: true,
      badge: 'Z-Report',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-300 border border-amber-500/40 font-mono text-[9px] font-bold',
    },
    {
      id: 'floorplan',
      label: (t as any).module_floorplan || 'مخطط الصالة والحجوزات',
      desc: (t as any).module_floorplan_desc || 'مصمم المخطط التفاعلي، رادار الطاولات والحجوزات',
      icon: Map,
      badge: '2D',
      badgeColor: 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold',
    },
    {
      id: 'table_portal',
      label: (t as any).module_table_portal || 'طلب الطاولات وQR للضيوف',
      desc: (t as any).module_table_portal_desc || 'المنيو التفاعلي، جرس الويتر ومتتبع الطهي اللحظي',
      icon: QrCode,
      badge: 'QR Live',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-yellow-400/30 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'kds',
      label: t.module_kds,
      desc: t.module_kds_desc,
      icon: ChefHat,
      badge: activeKdsCount > 0 ? activeKdsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'delivery',
      label: t.module_delivery || 'مجمع تطبيقات التوصيل',
      desc: t.module_delivery_desc || 'طلبات هنقرستيشن، جاهز، طلبات، ديليفرو',
      icon: Truck,
      badge: 'Hub',
      badgeColor: 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 text-amber-300 border border-orange-500/40 font-bold',
    },
    {
      id: 'waiter',
      label: t.module_waiter,
      desc: t.module_waiter_desc,
      icon: Smartphone,
      badge: 'Mobile',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold',
    },
    {
      id: 'kiosk',
      label: t.module_kiosk || 'شاشة الطلب الذاتي Kiosk',
      desc: t.module_kiosk_desc || 'شاشة الخدمة الذاتية باللمس للعملاء',
      icon: ShoppingBag,
      badge: 'Kiosk',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'online_store',
      label: (t as any).module_online_store || (t as any).module_store || 'المتجر الإلكتروني أونلاين',
      desc: (t as any).module_online_store_desc || (t as any).module_store_desc || 'متجر الويب وتتبع الطلبات المباشرة',
      icon: Globe,
      badge: 'Web',
      badgeColor: 'bg-gradient-to-r from-teal-500/30 to-emerald-500/30 text-emerald-300 border border-teal-500/40 font-bold',
    },
    {
      id: 'intercom',
      label: t.module_intercom,
      desc: t.module_intercom_desc,
      icon: Radio,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold',
    },
    {
      id: 'inventory',
      label: t.module_inventory,
      desc: t.module_inventory_desc,
      icon: Boxes,
      badge: criticalStockCount > 0 ? criticalStockCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      id: 'procurement',
      label: (t as any).module_procurement || 'المشتريات والموردين',
      desc: (t as any).module_procurement_desc || 'دليل الموردين، أوامر الشراء، والتدقيق الثلاثي',
      icon: Building2,
      badge: '3-Way',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'recipe_studio',
      label: (t as any).module_recipe_studio || 'استوديو الوصفات والتدريب',
      desc: (t as any).module_recipe_studio_desc || 'مضاعف الحصص، خطوات التحضير والسكب، والتكاليف',
      icon: UtensilsCrossed,
      badge: 'Studio',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'staff',
      label: t.module_staff,
      desc: t.module_staff_desc,
      icon: Users,
    },
    {
      id: 'customers',
      label: t.module_customers,
      desc: t.module_customers_desc,
      icon: Sparkles,
    },
    {
      id: 'marketing',
      label: (t as any).module_marketing || 'التسويق الذكي والواتساب',
      desc: (t as any).module_marketing_desc || 'محرك شرائح RFM، حملات العروض، الفواتير وروبوت الواتساب',
      icon: Megaphone,
      specialMarketingGlow: true,
      badge: 'RFM & Bot',
      badgeColor: 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-green-400/30 text-emerald-300 border border-emerald-500/40 font-bold',
    },
    {
      id: 'reports',
      label: t.module_reports,
      desc: t.module_reports_desc,
      icon: TrendingUp,
    },
    {
      id: 'ai',
      label: t.module_ai,
      desc: t.module_ai_desc,
      icon: Bot,
      specialAiGlow: true,
      badge: 'AI 3.5',
      badgeColor: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white',
    },
    {
      id: 'vision',
      label: (t as any).module_vision || 'الرؤية البصرية (Vision AI)',
      desc: (t as any).module_vision_desc || 'رادار هدر الصحون ومسح المخزون والصلاحيات',
      icon: ScanLine,
      specialVisionGlow: true,
      badge: 'Vision 2.5',
      badgeColor: 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black',
    },
    {
      id: 'hardware',
      label: (t as any).module_hardware || 'العتاد والموازين والأجهزة',
      desc: (t as any).module_hardware_desc || 'معايرة الميزان، الطابعات، قارئ الباركود، ودرج النقدية',
      icon: Cpu,
      badge: 'Hub',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-yellow-400/30 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'settings',
      label: t.module_settings,
      desc: t.module_settings_desc,
      icon: Settings,
    },
  ];

  const ownerHqNavItems: NavItem[] = [
    {
      id: 'superadmin',
      label: t.module_superadmin,
      desc: t.module_superadmin_desc,
      icon: Building2,
      specialSuperAdminGlow: true,
      badge: 'Owner HQ',
      badgeColor: 'bg-gradient-to-r from-purple-500/30 via-amber-500/30 to-rose-500/30 text-amber-300 border border-amber-500/40 font-mono text-[9px] font-bold',
    },
    {
      id: 'security',
      label: (t as any).module_security || 'درع الحماية السيبرانية',
      desc: (t as any).module_security_desc || 'بصمة العتاد، تراخيص RSA-2048، وحامي التوقيت',
      icon: Shield,
      specialSecurityGlow: true,
      badge: 'Shield 6L',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold',
    },
    {
      id: 'zatca',
      label: (t as any).module_zatca || 'الامتثال الضريبي (ZATCA)',
      desc: (t as any).module_zatca_desc || 'فواتير المرحلة الثانية UBL 2.1 XML، وسلسلة الهاش وCSID',
      icon: ShieldCheck,
      badge: 'FATOORA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[9px] font-bold',
    },
  ];

  const renderNavButton = (item: NavItem) => {
    const isActive = activeModule === item.id;
    const Icon = item.icon;

    const handleClick = () => {
      if (item.id === 'superadmin' || item.id === 'security' || item.id === 'zatca') {
        playSound('kitchen-bell');
        setAppMode('owner');
      } else {
        playSound('tap');
        setActiveModule(item.id);
      }
    };

    return (
      <button
        key={item.id}
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        className={`w-full relative flex items-center ${
          sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
        } rounded-2xl transition-all duration-200 cursor-pointer group text-start ${
          isActive
            ? 'text-foreground font-bold'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface/80'
        }`}
        title={sidebarCollapsed ? item.label : undefined}
      >
        {/* Active background pill (CSS-only; no animation runtime on the hot path) */}
        {isActive && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-primary/15 border border-primary/30 shadow-md shadow-primary/5 animate-fade-in"
          />
        )}

        {/* Icon Container with Badge Dot in Collapsed Mode */}
        <div
          className={`relative z-10 w-9 h-9 min-w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            isActive
              ? 'bg-primary text-slate-950 font-black shadow-md shadow-primary/30'
              : 'bg-surface border border-border/60 group-hover:border-primary/40 text-foreground'
          }`}
        >
          <Icon className="w-4.5 h-4.5" />
          {sidebarCollapsed && item.badge && (
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-card shadow-sm animate-pulse" />
          )}
        </div>

        {/* Label & Description (Expanded Mode) */}
        {!sidebarCollapsed && (
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${item.badgeColor || 'bg-surface text-muted-foreground border border-border'}`}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground truncate font-normal">
              {item.desc}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`relative flex flex-col justify-between border-e border-border/50 bg-card/95 backdrop-blur-2xl transition-all duration-300 z-20 select-none ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Branding Section */}
      {sidebarCollapsed ? (
        <div className="p-3 flex flex-col items-center gap-2.5 border-b border-border/50">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
            title="Expand Sidebar"
          >
            {language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="p-4 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden text-start">
              <span className="text-sm font-black tracking-tight text-foreground truncate">
                {t.appName}
              </span>
              <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-widest truncate">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          {/* Toggle Collapse Button */}
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
            title="Collapse Sidebar"
          >
            {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Navigation Items List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 custom-scrollbar">
        {/* Restaurant Operations Section */}
        {!sidebarCollapsed && (
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {language === 'ar' ? 'تشغيل وعمليات المطعم' : 'Restaurant Operations'}
          </div>
        )}
        {operationalNavItems.map((item) => renderNavButton(item))}

        {/* Divider before Owner HQ */}
        <div className="my-2 border-t border-border/40" />

        {/* Owner HQ SaaS Section */}
        {!sidebarCollapsed && (
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400/80 flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-purple-400" />
            <span>{language === 'ar' ? 'بوابة المالك والإدارة المركزية' : 'Owner HQ & SaaS Portal'}</span>
          </div>
        )}
        {ownerHqNavItems.map((item) => renderNavButton(item))}
      </div>

      {/* Collapsed Footer Quick Lock */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-border/40 flex justify-center">
          <button
            onClick={() => {
              playSound('alert');
              lockApp();
            }}
            className="w-9 h-9 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title={language === 'ar' ? 'قفل الشاشة وتأمين الدرج' : 'Lock Terminal'}
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Mini Card / Tour Launcher & Lock Button */}
      {!sidebarCollapsed && (
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
            <Layers className="w-4 h-4" />
            <span>Restaurant OS 2026</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                playSound('tap');
                setTourOpen(true);
              }}
              className="w-full py-1.5 px-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-foreground text-[11px] font-bold border border-primary/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'ar' ? 'الجولة الإرشادية للنظام' : 'Interactive System Tour'}</span>
            </button>

            <button
              onClick={() => {
                playSound('alert');
                lockApp();
              }}
              className="w-full py-1.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'قفل الشاشة وتأمين الدرج 🔒' : 'Lock Terminal 🔒'}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
