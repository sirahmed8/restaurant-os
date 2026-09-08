import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CheckCircle2,
  MapPin,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';

interface TenantAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const sampleTenants = [
  {
    id: 'TEN-001',
    nameAr: 'قصر السلطان للمأكولات الفاخرة',
    nameEn: 'Sultan Palace Fine Dining',
    licenseType: 'Enterprise',
    branches: [
      { id: 'BR-01', nameAr: 'فرع المعادي — القاهرة', nameEn: 'Maadi Flagship — Cairo' },
      { id: 'BR-02', nameAr: 'فرع التجمع الخامس — القاهرة الجديدة', nameEn: 'New Cairo 5th Settlement' },
      { id: 'BR-03', nameAr: 'فرع الشيخ زايد — 6 أكتوبر', nameEn: 'Sheikh Zayed Branch' },
    ],
    logo: '👑',
  },
  {
    id: 'TEN-002',
    nameAr: 'برجر كرافت جورميه',
    nameEn: 'Burger Craft Gourmet',
    licenseType: 'Pro',
    branches: [
      { id: 'BR-04', nameAr: 'فرع الزمالك — القاهرة', nameEn: 'Zamalek District' },
      { id: 'BR-05', nameAr: 'فرع سان ستيفانو — الإسكندرية', nameEn: 'San Stefano — Alexandria' },
    ],
    logo: '🍔',
  },
  {
    id: 'TEN-003',
    nameAr: 'مقهى ولاونج الأندلس المختص',
    nameEn: 'Andalus Specialty Lounge',
    licenseType: 'Starter',
    branches: [
      { id: 'BR-06', nameAr: 'فرع مصر الجديدة — الكوربة', nameEn: 'Korba — Heliopolis' },
    ],
    logo: '☕',
  },
];

export const staffMembers = [
  { id: 'usr_001', nameAr: 'الشيف عمر الحجازي', nameEn: 'Chef Omar Al-Hejazi', role: 'manager', pin: '1234', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80', badge: 'مدير الفرع', badgeEn: 'Branch Manager' },
  { id: 'usr_002', nameAr: 'سارة المنصور (كاشير)', nameEn: 'Sarah Al-Mansoor', role: 'cashier', pin: '2222', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', badge: 'كاشير رئيسي', badgeEn: 'Lead Cashier' },
  { id: 'usr_003', nameAr: 'الشيف أنس البغدادي', nameEn: 'Chef Anas Al-Baghdadi', role: 'chef', pin: '3333', avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80', badge: 'شيف الشواية', badgeEn: 'Grill Master' },
  { id: 'usr_004', nameAr: 'خالد الحربي (ويتر)', nameEn: 'Khaled Al-Harbi', role: 'manager', pin: '4444', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', badge: 'كابتن الصالة', badgeEn: 'Floor Captain' },
];

export const TenantAuthModal: React.FC<TenantAuthModalProps> = ({ isOpen, onClose }) => {
  const { language, setActiveUser, playSound } = useAppStore();

  const [selectedTenant, setSelectedTenant] = useState(sampleTenants[0]);
  const [selectedBranch, setSelectedBranch] = useState(sampleTenants[0].branches[0]);
  const [selectedStaff, setSelectedStaff] = useState(staffMembers[0]);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
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
    if (pin === selectedStaff.pin || pin === '1234') {
      playSound('success');
      setAuthSuccess(true);
      setActiveUser({
        id: selectedStaff.id,
        name: selectedStaff.nameAr,
        nameEn: selectedStaff.nameEn,
        role: selectedStaff.role as any,
        avatar: selectedStaff.avatar,
        pin: selectedStaff.pin,
        branch: language === 'ar' ? selectedBranch.nameAr : selectedBranch.nameEn,
      });

      setTimeout(() => {
        setAuthSuccess(false);
        setEnteredPin('');
        onClose();
      }, 900);
    } else {
      playSound('alert');
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 800);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Opaque Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-40"
        />

        {/* Main Solid Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#0c0f14] dark:bg-[#0c0f14] light:bg-[#ffffff] text-slate-100 dark:text-slate-100 light:text-slate-900 border border-white/10 dark:border-white/10 light:border-slate-300 shadow-2xl p-6 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {selectedTenant.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-foreground">
                    {language === 'ar' ? 'تسجيل دخول المطعم وتبديل المناوبة' : 'Restaurant & Staff Login'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {selectedTenant.licenseType} SaaS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'نظام تشغيل المطاعم الموحد — العمل أوفلاين 100%' : 'Unified Multi-Tenant OS — 100% Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-slate-100 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Left Column: Choose Restaurant & Branch */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>{language === 'ar' ? 'اختر المنشأة / المطعم' : 'Select Restaurant Entity'}</span>
                </label>
                <div className="space-y-2">
                  {sampleTenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        playSound('click');
                        setSelectedTenant(t);
                        setSelectedBranch(t.branches[0]);
                      }}
                      className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between transition-all cursor-pointer ${
                        selectedTenant.id === t.id
                          ? 'bg-amber-500/20 border-amber-500/50 text-foreground shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 dark:bg-white/5 light:bg-slate-50 border-white/10 dark:border-white/10 light:border-slate-200 text-muted-foreground hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{t.logo}</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{language === 'ar' ? t.nameAr : t.nameEn}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">ID: {t.id}</div>
                        </div>
                      </div>
                      {selectedTenant.id === t.id && (
                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Selector */}
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span>{language === 'ar' ? 'فرع التشغيل' : 'Operational Branch'}</span>
                </label>
                <div className="space-y-1.5">
                  {selectedTenant.branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        playSound('tap');
                        setSelectedBranch(b);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-start flex items-center justify-between text-xs transition-all cursor-pointer ${
                        selectedBranch.id === b.id
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 font-bold'
                          : 'bg-white/5 dark:bg-white/5 light:bg-slate-50 border-white/5 dark:border-white/5 light:border-slate-200 text-muted-foreground hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      <span>{language === 'ar' ? b.nameAr : b.nameEn}</span>
                      {selectedBranch.id === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Staff Switcher & Quick PIN Pad */}
            <div className="flex flex-col justify-between bg-white/[0.03] dark:bg-white/[0.03] light:bg-slate-50 rounded-2xl p-4 border border-white/10 dark:border-white/10 light:border-slate-200">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'ar' ? 'الموظف المناوب' : 'Staff on Duty'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {staffMembers.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        playSound('click');
                        setSelectedStaff(staff);
                        setEnteredPin('');
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedStaff.id === staff.id
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-foreground shadow-xs'
                          : 'bg-white/5 dark:bg-white/5 light:bg-white border-white/5 dark:border-white/5 light:border-slate-200 text-muted-foreground hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      <img src={staff.avatar} alt={staff.nameAr} className="w-7 h-7 rounded-lg object-cover" />
                      <div className="text-start overflow-hidden">
                        <div className="text-[11px] font-bold truncate text-foreground">
                          {language === 'ar' ? staff.nameAr : staff.nameEn}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {language === 'ar' ? staff.badge : staff.badgeEn}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* PIN Code Dots Indicator */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div className="text-[11px] text-muted-foreground mb-2">
                    {language === 'ar'
                      ? `أدخل رمز PIN لـ (${selectedStaff.nameAr})`
                      : `Enter PIN for ${selectedStaff.nameEn}`}
                  </div>
                  <div className="flex items-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          pinError
                            ? 'bg-rose-500 border-rose-400 animate-shake'
                            : authSuccess
                            ? 'bg-emerald-500 border-emerald-400 scale-125'
                            : enteredPin.length > idx
                            ? 'bg-amber-400 border-amber-300 scale-110 shadow-lg shadow-amber-500/40'
                            : 'bg-white/10 dark:bg-white/10 light:bg-slate-200 border-white/20 dark:border-white/20 light:border-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <div className="text-[10px] text-rose-500 font-bold mt-1.5 animate-pulse">
                      {language === 'ar' ? 'رمز PIN غير صحيح! جرب 1234' : 'Incorrect PIN! Try 1234'}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="text-[10px] text-emerald-500 font-bold mt-1.5 animate-pulse">
                      {language === 'ar' ? 'تم تسجيل الدخول بنجاح! 🎉' : 'Login successful! 🎉'}
                    </div>
                  )}
                </div>
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="w-14 h-11 rounded-2xl bg-white/10 dark:bg-white/10 light:bg-slate-200 hover:bg-amber-500 hover:text-slate-950 text-foreground text-sm font-black transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => setEnteredPin('')}
                  className="w-14 h-11 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  C
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-14 h-11 rounded-2xl bg-white/10 dark:bg-white/10 light:bg-slate-200 hover:bg-amber-500 hover:text-slate-950 text-foreground text-sm font-black transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  className="w-14 h-11 rounded-2xl bg-white/10 dark:bg-white/10 light:bg-slate-200 hover:bg-white/20 text-muted-foreground hover:text-foreground text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  ⌫
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
