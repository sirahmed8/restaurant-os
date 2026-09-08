import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  ChefHat,
  Flame,
  Scale,
  Sparkles,
  Timer,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  Award,
  BookOpen,
  Share2,
  Printer,
  Search,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Thermometer,
  ShieldCheck,
  Send,
  MessageSquare,
  Users,
  Eye,
  Info,
  Sliders,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import {
  recipeStudioService,
  ALLERGEN_METADATA,
} from '../../services/recipeStudioService';
import { marketingService } from '../../services/marketingService';
import {
  StudioRecipe,
  RecipeStage,
  ScaledRecipeResult,
  AllergenType,
} from '../../types/recipeStudio';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const RecipeStudioModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  // Module Tabs
  type StudioTab = 'studio' | 'scaler' | 'training' | 'marketing';
  const [activeTab, setActiveTab] = useState<StudioTab>('studio');

  // Recipes & Selection
  const allRecipes = useMemo(() => recipeStudioService.getAllRecipes(), []);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(allRecipes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const selectedRecipe = useMemo(() => {
    return allRecipes.find((r) => r.id === selectedRecipeId) || allRecipes[0];
  }, [allRecipes, selectedRecipeId]);

  // Visual Studio Stage Switcher (prep | cooking | plating)
  const [activeStage, setActiveStage] = useState<RecipeStage>('prep');

  // Interactive Scaler State (10 to 1000 portions)
  const [targetPortions, setTargetPortions] = useState<number>(10);

  const scaledResult: ScaledRecipeResult = useMemo(() => {
    if (!selectedRecipe) {
      return recipeStudioService.scaleRecipe(allRecipes[0], targetPortions);
    }
    return recipeStudioService.scaleRecipe(selectedRecipe, targetPortions);
  }, [selectedRecipe, targetPortions, allRecipes]);

  // Timers State for Steps
  const [activeTimerStepId, setActiveTimerStepId] = useState<string | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playSound('kitchen-bell');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft, playSound]);

  const handleStartTimer = (stepId: string, initialSeconds?: number) => {
    playSound('tap');
    if (activeTimerStepId === stepId && isTimerRunning) {
      setIsTimerRunning(false);
    } else if (activeTimerStepId === stepId && !isTimerRunning && timerSecondsLeft > 0) {
      setIsTimerRunning(true);
    } else {
      setActiveTimerStepId(stepId);
      setTimerSecondsLeft(initialSeconds || 120);
      setIsTimerRunning(true);
    }
  };

  const handleResetTimer = (initialSeconds?: number) => {
    playSound('tap');
    setIsTimerRunning(false);
    setTimerSecondsLeft(initialSeconds || 120);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Chef Training Checklist & Quiz State
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const quizQuestions = useMemo(() => {
    return recipeStudioService.getQuizForRecipe(selectedRecipe?.id || '');
  }, [selectedRecipe]);

  const toggleStepCompleted = (stepId: string) => {
    playSound('tap');
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleSelectQuizAnswer = (questionId: string, optionIndex: number) => {
    playSound('click');
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: quizQuestions.length,
      passed: correct === quizQuestions.length,
    };
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    const score = calculateQuizScore();
    if (score.passed) {
      playSound('success');
    } else {
      playSound('alert');
    }
  };

  // WhatsApp Campaign Simulator State
  const [campaignSentFeedback, setCampaignSentFeedback] = useState<string | null>(null);

  const handleSendRecipeCampaign = (recipe: StudioRecipe) => {
    playSound('cash-register');
    const campaign = marketingService.createCampaign({
      titleAr: `حملة تذوق خاصة: ${recipe.nameAr}`,
      titleEn: `Special Tasting: ${recipe.nameEn}`,
      segment: 'vip',
      messageTextAr: `مساء الخير يا {name} 🌟، يسر الشيف دعوتك لتذوق صنفنا المميز (${recipe.nameAr}) بخصم حصري 20% بكود CHVIP20. نسعد بزيارتك!`,
      messageTextEn: `Good evening {name} 🌟, our Chef invites you for (${recipe.nameEn}) with 20% off code CHVIP20!`,
      couponCode: 'CHVIP20',
      discountPercentage: 20,
    });
    const dispatchResult = marketingService.simulateCampaignDispatch(campaign.id);
    setCampaignSentFeedback(
      language === 'ar'
        ? `تم إطلاق حملة الواتساب بنجاح إلى ${dispatchResult.deliveryRate}% من عملاء VIP! الإيراد المتوقع: ${campaign.revenueGenerated} ر.س (عائد ${dispatchResult.roi}%)`
        : `WhatsApp VIP campaign launched successfully! ${dispatchResult.deliveryRate}% delivered. Projected Revenue: ${campaign.revenueGenerated} SAR (ROI: ${dispatchResult.roi}%)`
    );
    setTimeout(() => setCampaignSentFeedback(null), 6000);
  };

  // Filtered Recipes list
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r) => {
      const matchSearch =
        r.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.categoryAr.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [allRecipes, searchQuery, selectedCategory]);

  const categories = [
    { id: 'all', labelAr: 'جميع الوصفات', labelEn: 'All Recipes' },
    { id: 'grills', labelAr: 'المشاوي واللحوم', labelEn: 'Prime Grills' },
    { id: 'pasta-pizza', labelAr: 'الباستا والريزوتو', labelEn: 'Pasta & Risotto' },
    { id: 'appetizers', labelAr: 'المقبلات الفاخرة', labelEn: 'Appetizers' },
    { id: 'desserts', labelAr: 'الحلويات والسوفليه', labelEn: 'Signature Desserts' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden select-none bg-[#0a0c10] text-slate-100 p-1">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                {(t as any).recipe_studio_title || 'استوديو الوصفات والتدريب المرئي للشيفات'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Studio 2026 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {(t as any).recipe_studio_subtitle ||
                'مضاعف الحصص التفاعلي (10 إلى 1000 وجبة)، خطوات الطهي والسكب، وحاسبة التكاليف والهدر'}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => {
              playSound('tap');
              setActiveTab('studio');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{(t as any).recipe_tab_studio || 'استوديو الطهي والسكب'}</span>
          </button>

          <button
            onClick={() => {
              playSound('tap');
              setActiveTab('scaler');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scaler'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{(t as any).recipe_tab_scaler || 'مضاعف الحصص والتكاليف'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-950/40 text-emerald-300 font-mono">
              10-1000
            </span>
          </button>

          <button
            onClick={() => {
              playSound('tap');
              setActiveTab('training');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'training'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{(t as any).recipe_tab_training || 'تدريب واختبار الشيفات'}</span>
          </button>

          <button
            onClick={() => {
              playSound('tap');
              setActiveTab('marketing');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'marketing'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{(t as any).recipe_tab_marketing || 'العروض وحملات الواتساب'}</span>
          </button>
        </div>
      </div>

      {/* Global Campaign Feedback Alert */}
      {campaignSentFeedback && (
        <div className="my-2 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{campaignSentFeedback}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3">
        {/* Left / Sidebar Column: Recipe Directory (3 cols on large screen) */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden glass-panel-elevated rounded-3xl border border-white/10 p-3">
          <div className="pb-2 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ar' ? 'بحث عن وصفة أو مكون...' : 'Search recipes...'
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playSound('tap');
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'ar' ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Recipes Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-2 custom-scrollbar pe-1">
            {filteredRecipes.map((recipe) => {
              const isSelected = recipe.id === selectedRecipe?.id;
              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedRecipeId(recipe.id);
                  }}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center group ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <img
                    src={recipe.image}
                    alt={recipe.nameAr}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {language === 'ar' ? recipe.nameAr : recipe.nameEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-amber-300 font-medium">
                        {language === 'ar' ? recipe.categoryAr : recipe.categoryEn}
                      </span>
                      <span>•</span>
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} د</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-bold text-amber-400 font-mono">
                        {recipe.sellingPrice} {t.currency}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {recipe.targetFoodCostPercentage}% تكلفة
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Main Panel (9 cols on large screen) */}
        <div className="lg:col-span-9 flex flex-col overflow-hidden glass-panel-elevated rounded-3xl border border-white/10 p-4">
          {/* TAB 1: CULINARY STUDIO & PLATING */}
          {activeTab === 'studio' && selectedRecipe && (
            <div className="h-full flex flex-col overflow-y-auto custom-scrollbar space-y-4 pe-1">
              {/* Recipe Hero Banner */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[220px] flex flex-col justify-end p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                <img
                  src={selectedRecipe.image}
                  alt={selectedRecipe.nameAr}
                  className="absolute inset-0 w-full h-full object-cover -z-10 brightness-75"
                />
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm">
                        {selectedRecipe.station.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                        {selectedRecipe.difficulty.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedRecipe.caloriesPerPortion} kcal / وجبة
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {language === 'ar' ? selectedRecipe.nameAr : selectedRecipe.nameEn}
                    </h2>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {language === 'ar' ? selectedRecipe.descriptionAr : selectedRecipe.descriptionEn}
                    </p>
                  </div>

                  {/* Actions & Print */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playSound('success');
                        alert(
                          language === 'ar'
                            ? `تم إرسال بطاقة الوصفة والمكونات إلى طابعة شاشات KDS المطبخ (محطة ${selectedRecipe.station}) بنجاح!`
                            : `Recipe spec sheet routed to kitchen ${selectedRecipe.station} KDS station!`
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>{(t as any).recipe_export_kds || 'إرسال لـ KDS'}</span>
                    </button>
                    <button
                      onClick={() => handleSendRecipeCampaign(selectedRecipe)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                    >
                      <MessageSquare className="w-4 h-4 fill-slate-950" />
                      <span>حملة واتساب VIP</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playSound('tap');
                      setActiveStage('prep');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeStage === 'prep'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>1. مرحلة التجهيز والتحضير (Prep)</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound('tap');
                      setActiveStage('cooking');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeStage === 'cooking'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>2. مرحلة الطهي والحرارة (Cooking)</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound('tap');
                      setActiveStage('plating');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeStage === 'plating'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3. مرحلة سكب وتزيين الصحن (Plating)</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    {selectedRecipe.prepTimeMinutes + selectedRecipe.cookTimeMinutes} دقيقة إجمالي
                  </span>
                </div>
              </div>

              {/* Stage Step Cards */}
              <div className="space-y-3">
                {selectedRecipe.steps
                  .filter((step) => step.stage === activeStage)
                  .map((step) => {
                    const isTimerForThis = activeTimerStepId === step.id;
                    const isStepDone = completedSteps[step.id];

                    return (
                      <div
                        key={step.id}
                        className={`p-4 rounded-3xl border transition-all ${
                          isStepDone
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleStepCompleted(step.id)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                                isStepDone
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                              }`}
                            >
                              {isStepDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.stepNumber}
                            </button>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{language === 'ar' ? step.titleAr : step.titleEn}</span>
                                {step.temperatureTarget && (
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                    <Thermometer className="w-3 h-3 text-rose-400" />
                                    {step.temperatureTarget}
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {language === 'ar' ? step.descriptionAr : step.descriptionEn}
                              </p>
                            </div>
                          </div>

                          {/* Step Timer Control */}
                          {step.timerSeconds && (
                            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-white/10">
                              <Timer className="w-4 h-4 text-amber-400" />
                              <span className="font-mono text-sm font-bold text-amber-300">
                                {isTimerForThis ? formatTimer(timerSecondsLeft) : formatTimer(step.timerSeconds)}
                              </span>
                              <button
                                onClick={() => handleStartTimer(step.id, step.timerSeconds)}
                                className="w-7 h-7 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                {isTimerForThis && isTimerRunning ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleResetTimer(step.timerSeconds)}
                                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Critical Point Warning (HACCP) */}
                        {step.criticalPointAr && (
                          <div className="mt-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">
                                {(t as any).recipe_critical_point || 'نقطة التحكم الحرجة (HACCP)'}:{' '}
                              </span>
                              <span>
                                {language === 'ar' ? step.criticalPointAr : step.criticalPointEn}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Equipment List */}
                        {step.equipmentNeeded && step.equipmentNeeded.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-bold text-slate-500">
                              {(t as any).recipe_equipment || 'المعدات المطلوبة'}:
                            </span>
                            {step.equipmentNeeded.map((eq, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Plating Guide Section (If active stage is plating) */}
              {activeStage === 'plating' && selectedRecipe.platingGuide && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-slate-900 to-transparent border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>{(t as any).recipe_plating_guide || 'دليل سكب وتزيين الصحن الفاخر'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="font-bold text-cyan-300">نوع طبق التقديم المعتمد:</span>
                      <p className="text-slate-300">
                        {language === 'ar'
                          ? selectedRecipe.platingGuide.dishwareTypeAr
                          : selectedRecipe.platingGuide.dishwareTypeEn}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="font-bold text-cyan-300">طريقة التزيين والـ Garnish:</span>
                      <p className="text-slate-300">
                        {language === 'ar'
                          ? selectedRecipe.platingGuide.garnishAr
                          : selectedRecipe.platingGuide.garnishEn}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="font-bold text-cyan-300">تقنية توزيع الصوصات (Saucing):</span>
                      <p className="text-slate-300">
                        {language === 'ar'
                          ? selectedRecipe.platingGuide.saucingTechniqueAr
                          : selectedRecipe.platingGuide.saucingTechniqueEn}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="font-bold text-cyan-300">درجة حرارة التقديم الفورية:</span>
                      <p className="text-amber-300 font-mono font-bold">
                        {selectedRecipe.platingGuide.idealServingTemperature}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chef Master Tips Callout */}
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <ChefHat className="w-4 h-4" />
                  <span>{(t as any).recipe_chef_tips || 'نصائح الشيف التنفيذي الذهبية'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
                  {(language === 'ar' ? selectedRecipe.chefTipsAr : selectedRecipe.chefTipsEn).map(
                    (tip, idx) => (
                      <li key={idx}>{tip}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE PORTION SCALER & COSTING */}
          {activeTab === 'scaler' && selectedRecipe && (
            <div className="h-full flex flex-col overflow-y-auto custom-scrollbar space-y-4 pe-1">
              {/* Scaler Header & Multiplier Controls */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-transparent border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        مضاعف الحصص التفاعلي (Interactive Portion Scaler)
                      </h3>
                      <p className="text-xs text-slate-400">
                        احسب بدقة أوزان المكونات، نسبة الهدر، وتكلفة الدفعات الكبرى من 10 إلى 1,000 وجبة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-emerald-500/40">
                    <span className="text-xs text-slate-400">الحصص المستهدفة:</span>
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={targetPortions}
                      onChange={(e) => setTargetPortions(Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-transparent text-emerald-400 font-mono font-black text-lg text-center focus:outline-none"
                    />
                    <span className="text-xs text-emerald-300 font-bold">وجبة</span>
                  </div>
                </div>

                {/* Quick Multiplier Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-bold me-1">أزرار سريعة:</span>
                  {[10, 25, 50, 100, 250, 500, 1000].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => {
                        playSound('tap');
                        setTargetPortions(qty);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        targetPortions === qty
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {qty} وجبة {qty >= 500 ? '🏰 بوفيه' : qty >= 100 ? '🍽️ مناسبة' : ''}
                    </button>
                  ))}
                </div>

                {/* Range Slider */}
                <div className="space-y-1 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    step={1}
                    value={targetPortions}
                    onChange={(e) => setTargetPortions(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>1 وجبة</span>
                    <span>100 وجبة</span>
                    <span>250 وجبة</span>
                    <span>500 وجبة</span>
                    <span>1,000 وجبة بوفيه</span>
                  </div>
                </div>
              </div>

              {/* Scaled Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي تكلفة المكونات</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {scaledResult.totalIngredientsCost} {t.currency}
                  </span>
                  <span className="text-[9px] text-slate-500 block">شامل نسبة الهدر</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">تكلفة الهدر الصافي</span>
                  <span className="text-sm font-black text-rose-400 font-mono">
                    {scaledResult.totalWasteCost} {t.currency}
                  </span>
                  <span className="text-[9px] text-rose-400/80 block">عامل تشذيب وتنظيف</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">تكلفة العمالة والطهي</span>
                  <span className="text-sm font-black text-indigo-400 font-mono">
                    {scaledResult.totalLaborCost} {t.currency}
                  </span>
                  <span className="text-[9px] text-slate-500 block">وفورات الحجم مدمجة</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي تكلفة الدفعة</span>
                  <span className="text-sm font-black text-white font-mono">
                    {scaledResult.totalBatchCost} {t.currency}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {scaledResult.costPerPortion} {t.currency} / وجبة
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-300 font-bold block">إجمالي الإيراد المتوقع</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {scaledResult.totalGrossRevenue} {t.currency}
                  </span>
                  <span className="text-[9px] text-emerald-400/80 block font-bold">
                    ربح: {scaledResult.grossProfit} {t.currency}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-cyan-300 font-bold block">هامش الربح الإجمالي</span>
                  <span className="text-sm font-black text-cyan-400 font-mono">
                    {scaledResult.grossMarginPercentage}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    تكلفة طعام: {scaledResult.foodCostPercentage}%
                  </span>
                </div>
              </div>

              {/* Scaled Ingredients Data Table */}
              <div className="rounded-3xl border border-white/10 overflow-hidden bg-white/5">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>جدول مقادير وأوزان المكونات لمضاعفة {targetPortions} وجبة</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    الوزن الصافي: {scaledResult.totalEffectiveWeightKg} كجم • وقت التحضير المقدر:{' '}
                    {scaledResult.estimatedPrepTimeMinutes} دقيقة
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-[11px] bg-white/5">
                        <th className="py-2.5 px-4 font-bold text-start">المكون الخام</th>
                        <th className="py-2.5 px-3 font-bold text-start">الكمية الصافية للطلب</th>
                        <th className="py-2.5 px-3 font-bold text-center">نسبة الهدر %</th>
                        <th className="py-2.5 px-3 font-bold text-start">الكمية الإجمالية المطلوبة</th>
                        <th className="py-2.5 px-3 font-bold text-start">سعر الوحدة</th>
                        <th className="py-2.5 px-3 font-bold text-start">التكلفة الإجمالية</th>
                        <th className="py-2.5 px-3 font-bold text-center">المساهمة %</th>
                        <th className="py-2.5 px-4 font-bold text-start">مسببات الحساسية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scaledResult.scaledIngredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-white">
                            {language === 'ar' ? ing.nameAr : ing.nameEn}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-300 font-bold">
                            {ing.scaledRawQuantity >= 1000 && ing.displayUnit === 'kg'
                              ? `${(ing.scaledRawQuantity / 1000).toFixed(2)} kg`
                              : `${ing.scaledRawQuantity} ${ing.displayUnit}`}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ing.wastePercentage > 5
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {ing.wastePercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                            {ing.displayQuantity} {ing.displayUnit}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {ing.unitCost} {t.currency}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-white">
                            {ing.totalCost} {t.currency}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="font-mono text-[10px] text-slate-400">
                                {ing.costContributionPercent}%
                              </span>
                              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${Math.min(100, ing.costContributionPercent)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {ing.allergens && ing.allergens.length > 0 ? (
                                ing.allergens.map((alg) => (
                                  <span
                                    key={alg}
                                    className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  >
                                    {ALLERGEN_METADATA[alg]?.icon} {alg}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-mono">آمن ✓</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Allergen Radar & Safety Alerts */}
              {scaledResult.allergenWarnings.length > 0 && (
                <div className="p-4 rounded-3xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>رادار تنبيهات مسببات الحساسية للدفعة ({scaledResult.allergenWarnings.length} مسببات تم رصدها)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {scaledResult.allergenWarnings.map((warning) => (
                      <div
                        key={warning.allergen}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span className="text-base">{warning.icon}</span>
                            <span>{language === 'ar' ? warning.nameAr : warning.nameEn}</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              warning.severity === 'high'
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {warning.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          <span className="text-rose-400 font-bold">المصادر: </span>
                          {(language === 'ar' ? warning.sourcesAr : warning.sourcesEn).join('، ')}
                        </p>
                        <p className="text-[11px] text-amber-300 bg-white/5 p-2 rounded-xl border border-white/5">
                          💡 {language === 'ar' ? warning.preventionTipAr : warning.preventionTipEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHEF TRAINING & QUIZ */}
          {activeTab === 'training' && selectedRecipe && (
            <div className="h-full flex flex-col overflow-y-auto custom-scrollbar space-y-4 pe-1">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-violet-950/30 via-slate-900 to-transparent border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <Award className="w-5 h-5" />
                  <span>منظومة التدريب واختبار الشيفات (Chef Certification Exam)</span>
                </div>
                <p className="text-xs text-slate-300">
                  اختبر كفاءة طاقم المطبخ في درجات الحرارة ونقاط التحكم الحرجة (HACCP) لطبق{' '}
                  <span className="font-bold text-amber-300">{selectedRecipe.nameAr}</span>
                </p>
              </div>

              {/* Step Checklist Completion Bar */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">قائمة التحقق العملية للخطوات (HACCP Protocol):</span>
                  <span className="text-emerald-400 font-mono">
                    {Object.values(completedSteps).filter(Boolean).length} / {selectedRecipe.steps.length} مكتمل
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedRecipe.steps.map((step) => {
                    const isDone = completedSteps[step.id];
                    return (
                      <button
                        key={step.id}
                        onClick={() => toggleStepCompleted(step.id)}
                        className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono block">خطوة {step.stepNumber}</span>
                          <span className="text-xs font-bold truncate block max-w-[160px]">
                            {language === 'ar' ? step.titleAr : step.titleEn}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                            isDone ? 'bg-emerald-500 text-slate-950' : 'bg-white/10'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Quiz Questions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>الأسئلة التقنية ومعايير الجودة للطبق:</span>
                </h3>

                {quizQuestions.map((q, qIndex) => {
                  const selectedOpt = quizAnswers[q.id];
                  const isCorrect = selectedOpt === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-relaxed">
                          {language === 'ar' ? q.questionAr : q.questionEn}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(language === 'ar' ? q.optionsAr : q.optionsEn).map((opt, optIndex) => {
                          const isOptionSelected = selectedOpt === optIndex;
                          let btnStyle = 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10';

                          if (quizSubmitted) {
                            if (optIndex === q.correctIndex) {
                              btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold';
                            } else if (isOptionSelected && !isCorrect) {
                              btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                            }
                          } else if (isOptionSelected) {
                            btnStyle = 'bg-amber-500 text-slate-950 font-bold shadow-md';
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                              className={`p-3 rounded-2xl border text-xs text-start transition-all cursor-pointer ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div
                          className={`p-3 rounded-2xl text-xs ${
                            isCorrect
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <span className="font-bold">{isCorrect ? '✓ إجابة صحيحة: ' : '✗ إجابة غير دقيقة: '}</span>
                          <span>{language === 'ar' ? q.explanationAr : q.explanationEn}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit Quiz Action */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSubmitQuiz}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    اعتماد نتيجة الاختبار وإصدار الشهادة
                  </button>

                  {quizSubmitted && (
                    <div className="flex items-center gap-2">
                      {calculateQuizScore().passed ? (
                        <span className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>تهانينا! تم اجتياز اعتماد تحضير الوصفة بنجاح 🏆</span>
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                          يرجى مراجعة الخطوات والنقاط الحرجة وإعادة المحاولة
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP MARKETING & VIP PROMOTIONS */}
          {activeTab === 'marketing' && selectedRecipe && (
            <div className="h-full flex flex-col overflow-y-auto custom-scrollbar space-y-4 pe-1">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/30 via-slate-900 to-transparent border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <MessageSquare className="w-5 h-5" />
                  <span>حملات الواتساب الذكية لترويج أطباق الشيف الفاخرة</span>
                </div>
                <p className="text-xs text-slate-300">
                  ربط مباشر بين استوديو الوصفات وقاعدة عملاء VIP لتوليد عروض تذوق مخصصة وزيادة الإيرادات بنسبة 35%
                </p>
              </div>

              {/* Campaign Template Preview Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>قالب رسالة الواتساب المجهزة لعملاء VIP:</span>
                    </span>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed">
                      {marketingService.renderTemplate(
                        'مساء الخير يا {name} 🌟، تقديراً لكونك من عملائنا الـ {tier}، يسر الشيف دعوتك لتجربة طبقنا المميز ({favorite_dish}) مع خصم 20% بكود {discount_code}! نتشرف بزيارتك 🥂.',
                        {
                          id: 'cust-demo',
                          name: 'سلطان المقرن',
                          phone: '+966554912233',
                          tier: 'Black VIP',
                          totalSpent: 12400,
                          totalOrders: 38,
                          loyaltyPoints: 4850,
                          favoriteDish: selectedRecipe.nameAr,
                          lastVisitDaysAgo: 1,
                          segment: 'vip',
                        },
                        { discount_code: 'WAGYU20', favorite_dish: selectedRecipe.nameAr }
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRecipeCampaign(selectedRecipe)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                    <span>إطلاق حملة الواتساب الفورية لعملاء VIP</span>
                  </button>
                </div>

                {/* Campaign Projections */}
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>توقعات العائد المالي والاستجابة للحملة:</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400">الجمهور المستهدف (VIP & Gold):</span>
                      <span className="font-bold text-white font-mono">140 عميل نخبوي</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400">معدل التسليم والقراءة المتوقع:</span>
                      <span className="font-bold text-emerald-400 font-mono">98% تسليم / 90% قراءة</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400">معدل التحويل إلى طلبات طعام:</span>
                      <span className="font-bold text-amber-400 font-mono">~32% (42 طلب)</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-emerald-300 font-bold">الإيراد المتوقع خلال 72 ساعة:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        +14,490 {t.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
