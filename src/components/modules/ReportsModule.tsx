import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Flame,
  Award,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  PieChart,
  Star,
  HelpCircle,
  AlertOctagon,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { Card } from '../ui/Card';
import { soundEngine } from '../../services/soundEngine';

export const ReportsModule: React.FC = () => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'bcg' | 'hourly'>('sales');

  const hourlyData = [
    { hour: '12 PM', amount: 3200, height: '40%' },
    { hour: '1 PM', amount: 6800, height: '80%' },
    { hour: '2 PM', amount: 8900, height: '100%' },
    { hour: '3 PM', amount: 5400, height: '65%' },
    { hour: '4 PM', amount: 2100, height: '25%' },
    { hour: '5 PM', amount: 3900, height: '45%' },
    { hour: '6 PM', amount: 7200, height: '85%' },
    { hour: '7 PM', amount: 8400, height: '95%' },
  ];

  const topItems = [
    { name: 'برجر ترافل أنجوس الفاخر', nameEn: 'Truffle Angus Burger', qty: 94, rev: 6392, profitMargin: '68%', bcg: 'star' },
    { name: 'ستيك ريب آي واغيو A5', nameEn: 'Wagyu Ribeye Steak A5', qty: 32, rev: 6720, profitMargin: '60%', bcg: 'puzzle' },
    { name: 'ديناميت شريمب مقرمش', nameEn: 'Signature Dynamite Shrimp', qty: 78, rev: 3822, profitMargin: '63%', bcg: 'cow' },
    { name: 'بيتزا نابولي بالكمأة والمشروم', nameEn: 'Truffle Mushroom Pizza', qty: 51, rev: 3978, profitMargin: '74%', bcg: 'star' },
  ];

  const bcgQuadrants = {
    stars: [
      { name: 'برجر ترافل أنجوس', margin: '68%', sales: '94 طلب', action: 'حافظ على المعايير وروّج بقوة' },
      { name: 'بيتزا نابولي بالكمأة', margin: '74%', sales: '51 طلب', action: 'حافظ على الجودة والسرعة' },
    ],
    cows: [
      { name: 'ديناميت شريمب', margin: '63%', sales: '78 طلب', action: 'ماكينة نقدية - لا تغير السعر' },
      { name: 'بطاطس ودجز بالجبن', margin: '82%', sales: '140 طلب', action: 'ارفع مبيعات الإضافات' },
    ],
    puzzles: [
      { name: 'ستيك ريب آي واغيو A5', margin: '60%', sales: '32 طلب', action: 'حسّن التسويق بالصور الفاخرة' },
      { name: 'سالمون مشوي مع الأعشاب', margin: '58%', sales: '28 طلب', action: 'أضف للكومبو الترويجي' },
    ],
    dogs: [
      { name: 'شوربة بصل فرنسية', margin: '35%', sales: '12 طلب', action: 'أعد تقييم الوصفة أو احذفها' },
      { name: 'سلطة سيزر تقليدية', margin: '42%', sales: '18 طلب', action: 'استبدلها بوصفة مبتكرة' },
    ],
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none p-2 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>{t.module_reports}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'الذكاء المالي المباشر، هوامش الربحية، مصفوفة BCG وساعات الذروة'
              : 'Live financial intelligence, BCG Matrix & peak hour heatmap'}
          </p>
        </div>

        {/* Report Subtabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'sales', label: 'المبيعات والأرباح', icon: DollarSign },
            { id: 'bcg', label: 'مصفوفة BCG الهندسية', icon: Award },
            { id: 'hourly', label: 'ساعات الذروة والحرارة', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveReportTab(tab.id as any);
                  soundEngine.play('tap');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Content Grid */}
      <div className="flex-1 overflow-y-auto space-y-4 pe-1 custom-scrollbar">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card elevated className="border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{t.todaySales}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono-numbers">
                43,890 <span className="text-xs text-amber-400 font-normal">{t.currency}</span>
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{t.comparedYesterday}</div>
          </Card>

          <Card elevated className="border-sky-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{t.ordersCount}</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono-numbers">382</span>
              <span className="flex items-center text-xs font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.5%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {language === 'ar' ? '280 محلي • 102 سفري وتوصيل' : '280 Dine-in • 102 Off-premise'}
            </div>
          </Card>

          <Card elevated className="border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{t.avgOrderValue}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono-numbers">
                114.90 <span className="text-xs text-emerald-400 font-normal">{t.currency}</span>
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" /> +5.1%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {language === 'ar' ? 'متوسط 2.8 صنف لكل فاتورة' : 'Average 2.8 items per ticket'}
            </div>
          </Card>

          <Card elevated className="border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{t.profitMargin}</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono-numbers">68.4%</span>
              <span className="text-xs font-bold text-purple-400">
                {language === 'ar' ? 'ممتاز' : 'Prime'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {language === 'ar' ? 'تكلفة الأغذية (Food Cost): 31.6%' : 'Food Cost: 31.6%'}
            </div>
          </Card>
        </div>

        {/* Tab View 1: BCG Matrix */}
        {activeReportTab === 'bcg' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>مصفوفة BCG لهندسة قائمة الطعام (Menu Engineering BCG Matrix)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تصنيف أصناف المنيو وفقاً لحجم المبيعات وهوامش الربحية لتحديد الاستراتيجيات التسعيرية والتسويقية المثلى:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stars ⭐ */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>النجوم (Stars ⭐) — ربحية عالية + شعبية عالية</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    أعلى قيمة
                  </span>
                </div>
                <div className="space-y-2">
                  {bcgQuadrants.stars.map((item, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-amber-400/80">{item.action}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-emerald-400 block font-mono">{item.margin}</span>
                        <span className="text-[10px] text-slate-400">{item.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Cows 🐄 */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <span>🐄</span>
                    <span>البقرات الحلوب (Cash Cows) — ربحية متوسطة + شعبية كبرى</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    تدفق نقدي
                  </span>
                </div>
                <div className="space-y-2">
                  {bcgQuadrants.cows.map((item, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-emerald-400/80">{item.action}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-emerald-400 block font-mono">{item.margin}</span>
                        <span className="text-[10px] text-slate-400">{item.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Marks ❓ */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-sky-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>علامات الاستفهام (Puzzles ❓) — ربحية عالية + شعبية منخفضة</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300">
                    فرصة نمو
                  </span>
                </div>
                <div className="space-y-2">
                  {bcgQuadrants.puzzles.map((item, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-sky-400/80">{item.action}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-sky-400 block font-mono">{item.margin}</span>
                        <span className="text-[10px] text-slate-400">{item.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dogs 🐕 */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-950 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span>الأصناف المتعثرة (Dogs 🐕) — ربحية منخفضة + شعبية منخفضة</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                    إعادة تقييم
                  </span>
                </div>
                <div className="space-y-2">
                  {bcgQuadrants.dogs.map((item, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-rose-400/80">{item.action}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-rose-400 block font-mono">{item.margin}</span>
                        <span className="text-[10px] text-slate-400">{item.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab View 2: Sales & Top Items */}
        {(activeReportTab === 'sales' || activeReportTab === 'hourly') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peak Hours Heatmap Chart */}
            <Card elevated className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.peakHours}</h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ar' ? 'توزيع المبيعات على ساعات العمل' : 'Revenue distribution by operating hour'}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                  Peak: 2:00 PM
                </span>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                {hourlyData.map((bar, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-400 font-mono-numbers opacity-0 group-hover:opacity-100 transition-opacity">
                      {bar.amount}
                    </span>
                    <div className="w-full bg-white/5 rounded-2xl overflow-hidden flex items-end h-28 p-1">
                      <div
                        className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-xl group-hover:from-amber-500 group-hover:to-yellow-300 transition-all duration-300 shadow-md shadow-amber-500/20"
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{bar.hour}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Selling Items Table */}
            <Card elevated className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.topSellingDishes}</h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ar' ? 'الأعلى عائداً وهوامش الربح' : 'Highest margin & revenue drivers'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center font-mono">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">
                          {language === 'ar' ? item.name : item.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.qty} {language === 'ar' ? 'طلبية مباعة' : 'orders sold'}
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="font-black text-amber-400 font-mono-numbers">
                        {item.rev} {t.currency}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        {language === 'ar' ? 'هامش:' : 'Margin:'} {item.profitMargin}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
