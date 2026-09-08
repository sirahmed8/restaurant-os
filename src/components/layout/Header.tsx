import React, { Suspense, lazy, memo, useEffect, useState } from 'react';
import { 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Search, 
  Cloud, 
  Clock, 
  Wifi, 
  Sparkles,
  Maximize2,
  Minimize2,
  Minus,
  X,
  Store,
  ChevronDown,
  HelpCircle,
  Building2,
  Lock,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { weatherService, WeatherData } from '../../services/weatherService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Staff/branch switcher is a rarely-opened modal — keep it out of header boot.
const TenantAuthModal = lazy(() =>
  import('../auth/TenantAuthModal').then((m) => ({ default: m.TenantAuthModal }))
);

export const HeaderClock: React.FC<{ language: string }> = memo(({ language }) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-surface/60 rounded-2xl border border-border whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="font-mono font-bold text-foreground">{timeStr}</span>
      <span className="text-[10px] opacity-70">({dateStr})</span>
    </div>
  );
});
HeaderClock.displayName = 'HeaderClock';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    setSearchOpen,
    setTourOpen,
    activeUser,
    isOnline,
    branchNameAr,
    branchNameEn,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    playSound,
    weather,
    setWeather,
    lockApp,
    setAppMode,
  } = useAppStore();

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const t = getTranslation(language);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      weatherService.getCurrentWeather().then((w) => {
        if (!cancelled) setWeather(w as any);
      }).catch(() => {});
    };
    load();
    const weatherTimer = setInterval(load, 180000); // 3 mins
    return () => {
      cancelled = true;
      clearInterval(weatherTimer);
    };
  }, [setWeather]);

  const handleMinimize = () => {
    if ((window as any).electronAPI) (window as any).electronAPI.minimizeWindow();
  };
  const handleMaximize = () => {
    if ((window as any).electronAPI) (window as any).electronAPI.maximizeWindow();
  };
  const handleClose = () => {
    if ((window as any).electronAPI) (window as any).electronAPI.closeWindow();
  };

  return (
    <header className="h-16 px-4 md:px-6 border-b border-border/60 bg-card/85 backdrop-blur-xl flex items-center justify-between z-30 select-none gap-2 relative">
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => {
            playSound('click');
            setTenantModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-surface/90 hover:bg-surface border border-border text-xs md:text-sm shadow-xs transition-all cursor-pointer group whitespace-nowrap"
          title={language === 'ar' ? 'تبديل المنشأة / الفرع' : 'Switch Restaurant / Branch'}
        >
          <Store className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-foreground max-w-[150px] md:max-w-[200px] truncate">
            {language === 'ar' ? branchNameAr : branchNameEn}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-60 shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </button>

        <button
          onClick={() => {
            playSound('click');
            setSearchOpen(true);
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface/60 hover:bg-surface border border-border text-xs text-muted-foreground hover:text-foreground transition-all group cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <Search className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
          <span className="max-w-[130px] md:max-w-[180px] truncate">
            {language === 'ar' ? 'بحث سريع...' : 'Quick search...'}
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-card rounded-md border border-border/80 text-muted-foreground shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="hidden xl:flex items-center gap-3 shrink-0">
        {weather && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground animate-fade-in shadow-2xs whitespace-nowrap">
            <Cloud className="w-4 h-4 text-primary animate-pulse shrink-0" />
            <span className="font-medium">
              {weather.temperature ?? weather.temp}°C {language === 'ar' ? weather.conditionAr : weather.conditionEn || weather.condition}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-primary font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{language === 'ar' ? 'اقتراح الطقس: ' : 'Weather Tip: '}</span>
              <span className="font-medium text-foreground">
                {language === 'ar'
                  ? weather.recommendedDishKeywordsAr?.slice(0, 2).join('، ') || 'المشروبات الباردة'
                  : weather.recommendedDishKeywordsEn?.slice(0, 2).join(', ') || 'Cold Drinks'}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <HeaderClock language={language} />

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold bg-surface/60 border border-border whitespace-nowrap">
          <Wifi className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`} />
          <span className={isOnline ? 'text-emerald-500 text-[11px]' : 'text-rose-500 text-[11px]'}>
            {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'أوفلاين' : 'Offline')}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playSound('click');
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowVolumeSlider(!showVolumeSlider);
            }}
            className={`p-2 rounded-2xl transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30'
                : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
            }`}
            title={language === 'ar' ? 'المؤثرات الصوتية' : 'Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {showVolumeSlider && (
            <div className="absolute top-12 end-0 p-3 bg-card border border-border rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-scale-up">
              <span className="text-xs font-medium">{Math.round(soundVolume * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-24 accent-primary"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => {
            playSound('kitchen-bell');
            setAppMode('owner');
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
          title={language === 'ar' ? 'بوابة المالك وإدارة الفروع' : 'Owner HQ Cloud Portal'}
        >
          <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>{language === 'ar' ? 'بوابة المالك' : 'Owner HQ'}</span>
        </button>

        <button
          onClick={() => {
            playSound('tap');
            setTourOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-xs font-black text-amber-400 transition-all cursor-pointer shadow-xs whitespace-nowrap"
          title={language === 'ar' ? 'الجولة الإرشادية' : 'Interactive Tour'}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden lg:inline">{language === 'ar' ? 'الجولة' : 'Tour'}</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setLanguage(language === 'ar' ? 'en' : 'ar');
          }}
          className="px-3 py-1.5 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-xs font-black text-foreground transition-all cursor-pointer whitespace-nowrap"
          title="تغيير اللغة / Switch Language"
        >
          {language === 'ar' ? 'EN' : 'عربي'}
        </button>

        <button
          onClick={() => {
            playSound('click');
            toggleTheme();
          }}
          className="p-2 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-foreground transition-all cursor-pointer"
          title={theme === 'dark' ? (language === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-amber-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        <button
          onClick={() => lockApp()}
          className="p-2 rounded-2xl bg-surface hover:bg-rose-500/20 border border-border hover:border-rose-500/40 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer"
          title={language === 'ar' ? 'قفل الشاشة وتبديل المناوبة' : 'Lock Terminal Screen'}
        >
          <Lock className="w-4 h-4" />
        </button>

        {activeUser && (
          <button
            onClick={() => {
              playSound('click');
              setTenantModalOpen(true);
            }}
            className="flex items-center gap-2 ps-2 border-s border-border hover:opacity-80 transition-opacity cursor-pointer group whitespace-nowrap"
            title={language === 'ar' ? 'تبديل الموظف / قفل الشاشة (PIN)' : 'Switch Staff / PIN Lock'}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
              {(language === 'ar' ? activeUser.name : (activeUser.nameEn || activeUser.name)).charAt(0)}
            </div>
            <div className="hidden xl:block text-xs leading-tight text-start">
              <p className="font-bold text-foreground truncate max-w-[120px]">
                {language === 'ar' ? activeUser.name : (activeUser.nameEn || activeUser.name)}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">{activeUser.role}</p>
            </div>
          </button>
        )}

        <div className="hidden items-center gap-1 ltr:ml-2 rtl:mr-2 ltr:pl-2 rtl:pr-2 border-l rtl:border-r border-border window-controls">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tenant & Staff Switcher Modal (loads on first open) */}
      {tenantModalOpen && (
        <Suspense fallback={null}>
          <TenantAuthModal
            isOpen={tenantModalOpen}
            onClose={() => setTenantModalOpen(false)}
          />
        </Suspense>
      )}
    </header>
  );
};
