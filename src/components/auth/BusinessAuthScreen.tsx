import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Store,
  MapPin,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  Trash2,
  Coffee,
  Utensils,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { db } from '../../db';

interface BusinessAuthScreenProps {
  onSuccess?: () => void;
}

export const BusinessAuthScreen: React.FC<BusinessAuthScreenProps> = ({ onSuccess }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    playSound,
    setActiveUser,
    unlockApp,
  } = useAppStore();

  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Registration Form State (Clean empty states by default, no hardcoded sample values!)
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantNameEn, setRestaurantNameEn] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchNameEn, setBranchNameEn] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [pin, setPin] = useState('1234');
  const [dataMode, setDataMode] = useState<'clean' | 'starter'>('clean');
  const [isLoading, setIsLoading] = useState(false);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Handle Register New Restaurant
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !ownerName.trim() || pin.length !== 4) {
      playSound('alert');
      alert(language === 'ar' ? 'يرجى إدخال اسم المطعم ورقم سري من 4 أرقام' : 'Please fill all required fields with a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    playSound('click');

    try {
      const userProfile = {
        id: 'usr_owner_01',
        name: ownerName,
        nameEn: ownerName,
        role: 'manager' as const,
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
        pin: pin,
        branch: branchName,
      };

      const restaurantProfile = {
        nameAr: restaurantName,
        nameEn: restaurantNameEn || restaurantName,
        branchAr: branchName,
        branchEn: branchNameEn || branchName,
        ownerName,
        ownerPhone,
        currency: 'EGP',
        registeredAt: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('restaurant_os_account', JSON.stringify(restaurantProfile));
      localStorage.setItem('restaurant_os_registered', 'true');
      localStorage.setItem('restaurant_os_master_pin', pin);

      // Handle Data Mode (Clean vs Starter)
      if (dataMode === 'clean') {
        // Empty out mock data in DB and stores
        try {
          await db.seedMockData(false);
          // Clear menu items to start completely clean
          usePosStore.setState({
            items: [],
            cart: [],
            categories: [
              { id: 'all', name: 'الكل', nameEn: 'All', icon: 'Sparkles' },
              { id: 'main', name: 'الأطباق الرئيسية', nameEn: 'Main Dishes', icon: 'Utensils' },
              { id: 'drinks', name: 'المشروبات', nameEn: 'Drinks', icon: 'Coffee' },
            ],
          });
        } catch (dbErr) {
          console.warn('DB clean setup:', dbErr);
        }
      }

      // Update App State
      useAppStore.setState({
        branchNameAr: branchName,
        branchNameEn: branchNameEn || branchName,
        activeUser: userProfile,
        isLocked: false,
      });

      playSound('success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      playSound('alert');
      alert('Error saving profile: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login PIN
  const handlePinSubmit = () => {
    const savedPin = localStorage.getItem('restaurant_os_master_pin') || '1234';
    if (loginPin === savedPin || loginPin === '1234') {
      playSound('success');
      const savedAccount = localStorage.getItem('restaurant_os_account');
      if (savedAccount) {
        try {
          const parsed = JSON.parse(savedAccount);
          useAppStore.setState({
            branchNameAr: parsed.branchAr || 'الفرع الرئيسي',
            branchNameEn: parsed.branchEn || 'Main Branch',
          });
        } catch (e) {}
      }
      useAppStore.setState({ isLocked: false });
      if (onSuccess) onSuccess();
    } else {
      playSound('alert');
      setLoginError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
      setLoginPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#080b11] text-slate-100 overflow-y-auto custom-scrollbar font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-[#0e131d] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
      >
        {/* Top Branding & Language Switcher */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Restaurant OS</h1>
              <p className="text-xs text-amber-400 font-semibold">
                {language === 'ar' ? 'منظومة إدارة المطاعم والكافيهات السحابية' : 'Next-Gen Restaurant Management OS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              {language === 'ar' ? 'English' : 'عربي'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all cursor-pointer"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Register New Restaurant vs PIN Login) */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setAuthMode('register');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء منشأة / مطعم جديد' : 'Register New Restaurant'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              setAuthMode('login');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل الدخول السريع (PIN)' : 'Quick Staff Login'}</span>
          </button>
        </div>

        {/* Tab 1: Registration Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Restaurant Name Ar */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'اسم المطعم (بالعربية)' : 'Restaurant Name (Arabic)'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="مثال: مطعم السرايا للمأكولات الفاخرة"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Restaurant Name En */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'اسم المطعم (بالإنجليزي)' : 'Restaurant Name (English)'}</span>
                </label>
                <input
                  type="text"
                  value={restaurantNameEn}
                  onChange={(e) => setRestaurantNameEn(e.target.value)}
                  placeholder="e.g. Al Saraya Fine Dining"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Branch / City */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'اسم الفرع والمدينة' : 'Branch & City'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="مثال: فرع المعادي — القاهرة"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Owner / Manager Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'اسم مالك المطعم / المدير' : 'Owner / Manager Name'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}</span>
                </label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Master PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'رمز PIN السري للمدير (4 أرقام)' : 'Manager 4-digit PIN'} *</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white text-center font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Database Initial Mode Selection */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {language === 'ar' ? 'طريقة بدء وتشغيل قاعدة البيانات:' : 'Initial Database Mode:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setDataMode('clean');
                  }}
                  className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                    dataMode === 'clean'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'قاعدة بيانات نظيفة 100%' : '100% Clean Slate'}</span>
                    </span>
                    {dataMode === 'clean' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === 'ar'
                      ? 'بدون أي بيانات وهمية، جاهزة لإدخال منيو ومخزن وطاولات مطعمك الحقيقية.'
                      : 'Zero mock data. Fresh database ready for your real restaurant menu and storage.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setDataMode('starter');
                  }}
                  className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                    dataMode === 'starter'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-orange-400" />
                      <span>{language === 'ar' ? 'قائمة أصناف نموذجية مصرية' : 'Egyptian Starter Menu'}</span>
                    </span>
                    {dataMode === 'starter' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === 'ar'
                      ? 'تحميل أصناف استرشادية بالجنيه المصري (مشاوي، برجر، بيتزا، مقبلات) لتسهيل البدء.'
                      : 'Pre-load realistic Egyptian sample dishes in EGP for quick exploration.'}
                  </p>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <span>{language === 'ar' ? 'جارٍ تهيئة المنشأة...' : 'Initializing...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إنشاء حساب المنشأة وتشغيل النظام 🚀' : 'Create Restaurant Account & Launch'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Quick Staff Login */}
        {authMode === 'login' && (
          <div className="space-y-6 py-2 text-center">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ar' ? 'أدخل رمز PIN للدخول إلى نقطة البيع' : 'Enter PIN to Access Terminal'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar' ? 'الرمز الافتراضي: 1234 أو الرمز الخاص بحسابك' : 'Default PIN: 1234 or your manager PIN'}
              </p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    loginPin.length > idx
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/40'
                      : 'border-white/20 bg-white/5'
                  }`}
                />
              ))}
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 font-bold">{loginError}</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    if (loginPin.length < 4) setLoginPin((p) => p + digit);
                  }}
                  className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500 active:text-slate-950 border border-white/10 text-base font-bold text-white transition-all cursor-pointer font-mono"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  playSound('delete');
                  setLoginPin('');
                }}
                className="h-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  if (loginPin.length < 4) setLoginPin((p) => p + '0');
                }}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500 active:text-slate-950 border border-white/10 text-base font-bold text-white transition-all cursor-pointer font-mono"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinSubmit}
                className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                دخول ↵
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
