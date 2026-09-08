import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Sparkles,
  Utensils,
  Coffee,
  Flame,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  TableProperties,
  Landmark,
} from 'lucide-react';
import {
  onboardingService,
  RestaurantCuisineType,
  TaxJurisdiction,
} from '../../services/onboardingService';
import { playSound } from '../../services/soundEngine';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState<RestaurantCuisineType>('shawarma_grill');
  const [jurisdiction, setJurisdiction] = useState<TaxJurisdiction>('EG_ETA_14');
  const [tablesCount, setTablesCount] = useState<number>(12);
  const [isApplying, setIsApplying] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsApplying(true);
    playSound('tap');
    try {
      const res = await onboardingService.applySetup({
        restaurantNameAr: restaurantName,
        restaurantNameEn: 'Gourmet Classic Restaurant',
        cuisine,
        jurisdiction,
        tablesCount,
        currency: jurisdiction === 'SA_ZATCA_15' ? 'SAR' : jurisdiction === 'EG_ETA_14' ? 'EGP' : 'AED',
        branchName: 'الفرع الرئيسي',
      });
      setResultSummary(`تم إنشاء ${res.categoriesCount} تصنيفات و ${res.dishesCount} أصناف وقائمة ${res.tablesCount} طاولة بنجاح!`);
      playSound('success');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      alert('حدث خطأ أثناء الإعداد: ' + err.message);
      playSound('alert');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">معالج الإعداد الذكي في 3 دقائق</h2>
              <p className="text-xs text-slate-400">تجهيز المنيو والمخطط والضرائب بنقرة واحدة (1-Click Auto Setup)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s ? 'w-8 bg-orange-500' : step > s ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Restaurant Name & Cuisine */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">1. حدد اسم المطعم ونوع المأكولات:</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المطعم أو العلامة التجارية:</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="مثال: مطعم السرايا للمأكولات الفاخرة"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'burgers', label: 'برجر ووجبات سريعة', icon: Flame },
                { id: 'fine_dining', label: 'ستيك وفاين دايننج', icon: Utensils },
                { id: 'cafe', label: 'كافيه ومخبوزات', icon: Coffee },
                { id: 'shawarma_grill', label: 'شاورما ومشويات', icon: Flame },
                { id: 'pizza_pasta', label: 'بيتزا وباستا إيطالية', icon: Utensils },
              ].map((c) => {
                const Icon = c.icon;
                const isSelected = cuisine === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCuisine(c.id as any);
                      playSound('pop');
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Jurisdiction & Tables */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">2. النظام الضريبي وعدد الطاولات:</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-2">الدولة والامتثال الضريبي:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'SA_ZATCA_15', label: 'السعودية (ZATCA 15%)', icon: Landmark },
                  { id: 'EG_ETA_14', label: 'مصر (ETA 14%)', icon: Landmark },
                  { id: 'AE_FTA_5', label: 'الإمارات (FTA 5%)', icon: Landmark },
                ].map((j) => {
                  const isSelected = jurisdiction === j.id;
                  return (
                    <button
                      key={j.id}
                      onClick={() => {
                        setJurisdiction(j.id as any);
                        playSound('pop');
                      }}
                      className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {j.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">عدد طاولات الصالة التقديري:</label>
              <input
                type="number"
                min={4}
                max={50}
                value={tablesCount}
                onChange={(e) => setTablesCount(parseInt(e.target.value) || 12)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white">أنت جاهز لإطلاق مطعمك الذكي بنقرة واحدة!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              سيقوم المحرك تلقائياً ببناء المنيو المناسب، وتجهيز الطاولات، وضبط نسب الضرائب، وتفعيل نظام تشغيل الـ 0-أوراق.
            </p>

            {resultSummary && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                {resultSummary}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => {
                setStep((s) => (s - 1) as any);
                playSound('pop');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                setStep((s) => (s + 1) as any);
                playSound('tap');
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isApplying}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-xl shadow-emerald-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isApplying ? 'جاري البناء الفوري...' : 'تطبيق وبدء التشغيل الآن!'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
