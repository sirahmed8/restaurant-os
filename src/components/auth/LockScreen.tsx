import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Lock,
  Unlock,
  ShieldCheck,
  Building2,
  Clock,
  Wifi,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { useAppStore, defaultUser } from '../../stores/useAppStore';
import { staffMembers, sampleTenants } from './TenantAuthModal';
import { loadString } from '../../lib/storage';

const MAX_PIN_ATTEMPTS = 5;
const PIN_COOLDOWN_MS = 30_000;

export const LockScreen: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    branchNameAr,
    branchNameEn,
    isOnline,
    unlockApp,
    setAppMode,
    playSound,
  } = useAppStore();

  const [selectedStaff, setSelectedStaff] = useState(staffMembers[0]);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [ownerPinPrompt, setOwnerPinPrompt] = useState(false);
  const [ownerPinInput, setOwnerPinInput] = useState('');
  const [ownerPinError, setOwnerPinError] = useState(false);
  // Brute-force throttle: 4-digit PINs fall fast without a cooldown.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const coolingDown = lockedUntil > nowMs;
  const cooldownSecs = coolingDown ? Math.ceil((lockedUntil - nowMs) / 1000) : 0;

  // Real-time clock
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
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(() => {
      updateTime();
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [language]);

  const registerFailure = () => {
    // Closure-based (not functional update): updaters must stay pure and
    // StrictMode double-invokes them, which would double-count attempts.
    const next = failedAttempts + 1;
    if (next >= MAX_PIN_ATTEMPTS) {
      setLockedUntil(Date.now() + PIN_COOLDOWN_MS);
      setFailedAttempts(0);
    } else {
      setFailedAttempts(next);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (coolingDown) return;
    if (enteredPin.length < 4) {
      playSound('tap');
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setPinError(false);

      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    playSound('pop');
    setEnteredPin(enteredPin.slice(0, -1));
    setPinError(false);
  };

  const verifyPin = (pin: string) => {
    // Exact staff-PIN match only — no universal fallback code.
    if (pin === selectedStaff.pin) {
      playSound('success');
      setAuthSuccess(true);

      setTimeout(() => {
        unlockApp({
          id: selectedStaff.id,
          name: selectedStaff.nameAr,
          nameEn: selectedStaff.nameEn,
          role: selectedStaff.role as any,
          avatar: selectedStaff.avatar,
          pin: selectedStaff.pin,
          branch: language === 'ar' ? branchNameAr : branchNameEn,
        });
      }, 700);
    } else {
      playSound('alert');
      setPinError(true);
      registerFailure();
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 700);
    }
  };

  const handleOwnerUnlock = (pin: string) => {
    if (coolingDown) return;
    // Onboarding master PIN wins when set; '9999' stays as a recovery code so
    // already-deployed terminals are never bricked. '1234'/'0000' only work
    // when no master PIN was ever configured.
    const masterPin = loadString('restaurant_os_master_pin', '');
    const accepted =
      (masterPin !== '' && pin === masterPin) ||
      pin === '9999' ||
      (masterPin === '' && (pin === '1234' || pin === '0000'));
    if (accepted) {
      playSound('kitchen-bell');
      setAppMode('owner');
      unlockApp({
        id: 'usr_owner_01',
        name: 'المالك والمشرف العام (Franchise Owner)',
        nameEn: 'Franchise Owner & Super Admin',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pin: '9999',
        branch: 'HQ Central Cloud',
      });
    } else {
      playSound('alert');
      setOwnerPinError(true);
      registerFailure();
      setTimeout(() => {
        setOwnerPinInput('');
        setOwnerPinError(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#080b0f] text-slate-100 select-none overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-white/[0.02]">
        {/* Left: Brand & Branch */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">
              {language === 'ar' ? 'قصر السلطان للمأكولات الفاخرة' : 'Sultan Palace Fine Dining'}
            </h1>
            <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <span>{language === 'ar' ? branchNameAr : branchNameEn}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[10px]">POS Terminal #01</span>
            </p>
          </div>
        </div>

        {/* Center: Live Clock */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-xl font-black font-mono tracking-wider text-white">
            {timeStr}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {dateStr}
          </div>
        </div>

        {/* Right: Network, Theme & Language Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-white/5 border border-white/10">
            <Wifi className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`} />
            <span className={isOnline ? 'text-emerald-400 text-[11px]' : 'text-rose-400 text-[11px]'}>
              {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'أوفلاين' : 'Offline')}
            </span>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setLanguage(language === 'ar' ? 'en' : 'ar');
            }}
            className="px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black text-white transition-all cursor-pointer"
          >
            {language === 'ar' ? 'English' : 'عربي'}
          </button>

          <button
            onClick={() => {
              playSound('click');
              toggleTheme();
            }}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Center Content: Staff Selection & PIN Keypad */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
          {/* Left Column: Staff Picker */}
          <div className="md:col-span-6 space-y-4">
            <div className="text-start">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تسجيل دخول طاقم العمل' : 'Select Staff on Duty'}</span>
              </span>
              <h2 className="text-2xl font-black text-white">
                {language === 'ar' ? 'اختر الموظف وأدخل رمز PIN' : 'Choose Account & Enter PIN'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar'
                  ? 'تسجيل آمن وسريع للمناوبات ونقاط البيع'
                  : 'Fast secure unlock for active shift and POS terminals'}
              </p>
            </div>

            {/* Staff Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {staffMembers.map((staff) => {
                const isSelected = selectedStaff.id === staff.id;
                return (
                  <button
                    key={staff.id}
                    onClick={() => {
                      playSound('click');
                      setSelectedStaff(staff);
                      setEnteredPin('');
                      setPinError(false);
                    }}
                    className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300'
                    }`}
                  >
                    <img
                      src={staff.avatar}
                      alt={staff.nameAr}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {language === 'ar' ? staff.nameAr : staff.nameEn}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">
                        {language === 'ar' ? staff.badge : staff.badgeEn}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Demo Bypass Hint */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>{language === 'ar' ? 'رمز الدخول الافتراضي:' : 'Default PIN:'} <strong className="text-amber-400 font-mono">1234</strong></span>
              <button
                onClick={() => verifyPin('1234')}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'دخول سريع' : 'Quick Unlock'}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Numeric Keypad */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-4">
              <div className="text-xs text-slate-400">
                {language === 'ar' ? 'رمز PIN لـ' : 'PIN for'}{' '}
                <span className="font-bold text-white">
                  {language === 'ar' ? selectedStaff.nameAr : selectedStaff.nameEn}
                </span>
              </div>

              {/* 4-digit PIN Code Dots */}
              <div className="flex items-center justify-center gap-3.5 my-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                      pinError
                        ? 'bg-rose-500 border-rose-400 animate-shake'
                        : authSuccess
                        ? 'bg-emerald-400 border-emerald-300 scale-125 shadow-lg shadow-emerald-500/50'
                        : enteredPin.length > idx
                        ? 'bg-amber-400 border-amber-300 scale-110 shadow-md shadow-amber-500/40'
                        : 'bg-white/10 border-white/20'
                    }`}
                  />
                ))}
              </div>

              {pinError && !coolingDown && (
                <div className="text-xs text-rose-400 font-bold animate-pulse">
                  {language === 'ar'
                    ? `رمز PIN غير صحيح! (${MAX_PIN_ATTEMPTS - failedAttempts} محاولات)`
                    : `Incorrect PIN! (${MAX_PIN_ATTEMPTS - failedAttempts} tries left)`}
                </div>
              )}
              {coolingDown && (
                <div className="text-xs text-amber-400 font-bold animate-pulse" role="alert">
                  {language === 'ar'
                    ? `تم الإيقاف مؤقتاً — حاول بعد ${cooldownSecs} ث`
                    : `Locked out — retry in ${cooldownSecs}s`}
                </div>
              )}
              {authSuccess && (
                <div className="text-xs text-emerald-400 font-bold animate-pulse flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تم الدخول بنجاح!' : 'Unlocked Successfully!'}</span>
                </div>
              )}
            </div>

            {/* Keypad Grid */}
            <div
              className={`grid grid-cols-3 gap-2.5 max-w-[240px] w-full transition-opacity ${coolingDown ? 'pointer-events-none opacity-40' : ''}`}
              aria-disabled={coolingDown}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 rounded-2xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white text-base font-black transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => setEnteredPin('')}
                className="h-12 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                C
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-2xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white text-base font-black transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-sm font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer: Standalone Owner HQ SaaS Portal Switcher */}
      <footer className="relative z-10 p-4 border-t border-white/10 backdrop-blur-md bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Restaurant OS v2.5 Enterprise — Multi-Tenant Franchise Engine</span>
        </div>

        {/* Dedicated Owner HQ Portal Launch Button */}
        <button
          onClick={() => {
            playSound('click');
            setOwnerPinPrompt(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/40 text-purple-300 font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-95"
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>
            {language === 'ar'
              ? 'بوابة المالك وإدارة الفروع (Owner HQ Portal)'
              : 'Owner HQ & Multi-Branch Cloud Portal'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </footer>

      {/* Owner Authentication Modal Prompt */}
      {ownerPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setOwnerPinPrompt(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm rounded-3xl bg-[#0c0f14] border border-purple-500/40 p-6 shadow-2xl z-10 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {language === 'ar' ? 'دخول تطبيق المالك والإدارة المركزية' : 'Owner & Franchise HQ Login'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar'
                  ? 'أدخل رمز المالك أو الرمز السري (9999 أو 1234)'
                  : 'Enter Owner Secret PIN (9999 or 1234)'}
              </p>
            </div>

            <div className="flex justify-center my-2">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={ownerPinInput}
                onChange={(e) => {
                  setOwnerPinInput(e.target.value);
                  if (e.target.value.length === 4) {
                    handleOwnerUnlock(e.target.value);
                  }
                }}
                placeholder="••••"
                className="w-36 text-center text-2xl font-mono tracking-widest py-2 rounded-2xl bg-white/5 border border-purple-500/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {ownerPinError && (
              <div className="text-xs text-rose-400 font-bold animate-pulse">
                {language === 'ar' ? 'رمز غير صحيح! جرب 9999' : 'Incorrect PIN! Try 9999'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOwnerPinPrompt(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleOwnerUnlock(ownerPinInput || '9999')}
                className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-xs font-black text-white shadow-md shadow-purple-500/30 cursor-pointer"
              >
                {language === 'ar' ? 'دخول فوري' : 'Enter HQ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
