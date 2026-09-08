import React, { Suspense, lazy, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary, ModuleFallback } from '../ui/ErrorBoundary';

// Heavy views are code-split so the initial POS bundle stays lean.
// Each module becomes its own chunk, loaded on first navigation.
const OwnerAppPortal = lazy(() => import('../owner/OwnerAppPortal').then((m) => ({ default: m.OwnerAppPortal })));
const CustomerPortalView = lazy(() => import('../customer/CustomerPortalView').then((m) => ({ default: m.CustomerPortalView })));
const GlobalAIChatbot = lazy(() => import('../ui/GlobalAIChatbot').then((m) => ({ default: m.GlobalAIChatbot })));
// Shell overlays mount rarely — keep them out of the initial bundle too.
const QuickSearchModal = lazy(() => import('./QuickSearchModal').then((m) => ({ default: m.QuickSearchModal })));
const InteractiveTourModal = lazy(() => import('../ui/InteractiveTourModal').then((m) => ({ default: m.InteractiveTourModal })));
const OwnerControlBar = lazy(() => import('../ui/OwnerControlBar').then((m) => ({ default: m.OwnerControlBar })));
// Auth gates are the heaviest first-paint cost for returning users
// (WelcomeLandingScreen alone is 60KB+ with auth + marketing sections),
// so they load on demand behind the same Suspense boundary.
const WelcomeLandingScreen = lazy(() =>
  import('../auth/WelcomeLandingScreen').then((m) => ({ default: m.WelcomeLandingScreen }))
);
const LockScreen = lazy(() => import('../auth/LockScreen').then((m) => ({ default: m.LockScreen })));

const PosModule = lazy(() => import('../modules/PosModule').then((m) => ({ default: m.PosModule })));
const ShiftModule = lazy(() => import('../modules/ShiftModule').then((m) => ({ default: m.ShiftModule })));
const FloorPlanModule = lazy(() => import('../modules/FloorPlanModule').then((m) => ({ default: m.FloorPlanModule })));
const KdsModule = lazy(() => import('../modules/KdsModule').then((m) => ({ default: m.KdsModule })));
const DeliveryHubModule = lazy(() => import('../modules/DeliveryHubModule').then((m) => ({ default: m.DeliveryHubModule })));
const WaiterModule = lazy(() => import('../modules/WaiterModule').then((m) => ({ default: m.WaiterModule })));
const KioskModule = lazy(() => import('../modules/KioskModule').then((m) => ({ default: m.KioskModule })));
const OnlineStoreModule = lazy(() => import('../modules/OnlineStoreModule').then((m) => ({ default: m.OnlineStoreModule })));
const IntercomModule = lazy(() => import('../modules/IntercomModule').then((m) => ({ default: m.IntercomModule })));
const InventoryModule = lazy(() => import('../modules/InventoryModule').then((m) => ({ default: m.InventoryModule })));
const StaffModule = lazy(() => import('../modules/StaffModule').then((m) => ({ default: m.StaffModule })));
const CustomersModule = lazy(() => import('../modules/CustomersModule').then((m) => ({ default: m.CustomersModule })));
const ReportsModule = lazy(() => import('../modules/ReportsModule').then((m) => ({ default: m.ReportsModule })));
const AiCopilotModule = lazy(() => import('../modules/AiCopilotModule').then((m) => ({ default: m.AiCopilotModule })));
const AiVisionModule = lazy(() => import('../modules/AiVisionModule').then((m) => ({ default: m.AiVisionModule })));
const SettingsModule = lazy(() => import('../modules/SettingsModule').then((m) => ({ default: m.SettingsModule })));
const SuperAdminModule = lazy(() => import('../modules/SuperAdminModule').then((m) => ({ default: m.SuperAdminModule })));
const SecurityShieldModule = lazy(() => import('../modules/SecurityShieldModule').then((m) => ({ default: m.SecurityShieldModule })));
const RecipeStudioModule = lazy(() => import('../modules/RecipeStudioModule').then((m) => ({ default: m.RecipeStudioModule })));
const MarketingModule = lazy(() => import('../modules/MarketingModule').then((m) => ({ default: m.MarketingModule })));
const ProcurementModule = lazy(() => import('../modules/ProcurementModule').then((m) => ({ default: m.ProcurementModule })));
const TableGuestPortalModule = lazy(() => import('../modules/TableGuestPortalModule').then((m) => ({ default: m.TableGuestPortalModule })));
const ZatcaComplianceModule = lazy(() => import('../modules/ZatcaComplianceModule').then((m) => ({ default: m.ZatcaComplianceModule })));
const HardwareHubModule = lazy(() => import('../modules/HardwareHubModule').then((m) => ({ default: m.HardwareHubModule })));

export const AppShell: React.FC = () => {
  const {
    isRegistered,
    setRegistered,
    isLocked,
    appMode,
    setAppMode,
    activeModule,
    setActiveModule,
    theme,
    playSound,
  } = useAppStore();
  // Overlays load on first open only — their chunks stay out of POS boot.
  const searchOpen = useAppStore((s) => s.searchOpen);
  const tourOpen = useAppStore((s) => s.tourOpen);

  // Secret Key Combo (Ctrl+Shift+A or Cmd+Shift+A or Ctrl+Alt+S) to launch Owner App.
  // Cmd/Ctrl+K toggles universal search (handled here so the lazy modal
  // doesn't need to stay mounted to receive the shortcut).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useAppStore.getState().setSearchOpen(!useAppStore.getState().searchOpen);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        playSound('kitchen-bell');
        setAppMode('owner');
      } else if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        playSound('kitchen-bell');
        setAppMode('owner');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAppMode, playSound]);

  // Business Owner Welcome Landing, Google Auth & Setup
  if (!isRegistered) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback label="welcome" />}>
          <WelcomeLandingScreen onSuccess={() => setRegistered(true)} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Full-Screen Terminal Lock Screen
  if (isLocked) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback label="lock screen" />}>
          <LockScreen />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Customer Food Discovery & Ordering Experience (Talabat 1000x)
  if (appMode === 'customer') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback label="customer portal" />}>
          <CustomerPortalView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Standalone Owner HQ & Multi-Branch SaaS App
  if (appMode === 'owner') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback label="owner portal" />}>
          <OwnerAppPortal />
        </Suspense>
      </ErrorBoundary>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'pos':
        return <PosModule key="pos" />;
      case 'shift':
        return <ShiftModule key="shift" />;
      case 'floorplan':
        return <FloorPlanModule key="floorplan" />;
      case 'kds':
        return <KdsModule key="kds" />;
      case 'delivery':
        return <DeliveryHubModule key="delivery" />;
      case 'waiter':
        return <WaiterModule key="waiter" />;
      case 'table_portal':
        return <TableGuestPortalModule key="table_portal" />;
      case 'kiosk':
        return <KioskModule key="kiosk" />;
      case 'online_store':
        return <OnlineStoreModule key="online_store" />;
      case 'intercom':
        return <IntercomModule key="intercom" />;
      case 'inventory':
        return <InventoryModule key="inventory" />;
      case 'procurement':
        return <ProcurementModule key="procurement" />;
      case 'recipe_studio':
        return <RecipeStudioModule key="recipe_studio" />;
      case 'staff':
        return <StaffModule key="staff" />;
      case 'customers':
        return <CustomersModule key="customers" />;
      case 'marketing':
        return <MarketingModule key="marketing" />;
      case 'reports':
        return <ReportsModule key="reports" />;
      case 'ai':
        return <AiCopilotModule key="ai" />;
      case 'vision':
        return <AiVisionModule key="vision" />;
      case 'hardware':
        return <HardwareHubModule key="hardware" />;
      case 'settings':
        return <SettingsModule key="settings" />;
      default:
        return <PosModule key="pos" />;
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-100 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-amber-500 focus:text-black focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      {/* Subtle Luxury Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Layout Container */}
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Right Section: Header + Active Module View */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />

          {/* Module Content Viewport */}
          <main id="main-content" aria-label={`${activeModule} module`} className="flex-1 overflow-hidden p-4 relative">
            <ErrorBoundary key={activeModule}>
              <Suspense fallback={<ModuleFallback label={activeModule} />}>
                {/* CSS-only enter transition (no per-navigation JS animation runtime). */}
                <div key={activeModule} className="h-full w-full overflow-hidden animate-fade-in">
                  {renderModule()}
                </div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Universal Quick Search Modal */}
      {searchOpen && (
        <Suspense fallback={null}>
          <QuickSearchModal />
        </Suspense>
      )}

      {/* Interactive 16-Module Guided Tour Modal */}
      {tourOpen && (
        <Suspense fallback={null}>
          <InteractiveTourModal />
        </Suspense>
      )}

      {/* Omniscient Floating AI Copilot Chatbot */}
      <Suspense fallback={null}>
        <GlobalAIChatbot />
      </Suspense>

      {/* Super Owner Live Mode Switcher Bar */}
      <Suspense fallback={null}>
        <OwnerControlBar />
      </Suspense>
    </div>
  );
};
