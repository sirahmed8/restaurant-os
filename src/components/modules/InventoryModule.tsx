import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  AlertOctagon,
  CheckCircle,
  Plus,
  Minus,
  FileSpreadsheet,
  Search,
  Truck,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const InventoryModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const { items, adjustStock, loadInventory } = useInventoryStore();
  const t = getTranslation(language);

  const [search, setSearch] = useState('');
  const [poCreated, setPoCreated] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredItems = items.filter(
    (item: any) =>
      (item.nameAr || item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleGeneratePo = (itemName: string) => {
    playSound('success');
    setPoCreated(itemName);
    setTimeout(() => setPoCreated(null), 3000);
  };

  const handleQuickAdjust = (itemId: string, delta: number) => {
    playSound('click');
    adjustStock(itemId, delta, delta > 0 ? 'manual_adjustment' : 'waste', 'Quick adjustment from Inventory radar', 'EMP-001');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none p-2">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <span>{t.stockRadar}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'ar' ? 'تتبع لحظي للاستهلاك وإعادة الطلب التلقائي' : 'Real-time ingredient tracking and auto procurement'}
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute start-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في المواد الخام والموردين...' : 'Search ingredients & suppliers...'}
            className="w-full rounded-2xl ps-10 pe-4 py-2 bg-surface border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* PO Generated Toast */}
      {poCreated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'ar'
                ? `تم توليد مسودة أمر شراء فوري لـ (${poCreated}) بنجاح وإرسالها للمورد`
                : `Instant Purchase Order generated for (${poCreated}) & drafted`}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 rounded-md">PO-#2026-08</span>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3.5 rounded-3xl bg-surface/60 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">{language === 'ar' ? 'إجمالي المواد' : 'Total Items'}</span>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">{items.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-3xl bg-surface/60 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-rose-500 font-semibold">{language === 'ar' ? 'تحذيرات نقص المخزون' : 'Low Stock Warnings'}</span>
            <p className="text-xl font-bold font-mono text-rose-500 mt-0.5">
              {items.filter((i) => i.currentStock <= i.minStockAlert).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-3xl bg-surface/60 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">{language === 'ar' ? 'التوفير المتوقع بالـ AI' : 'AI Waste Prevention'}</span>
            <p className="text-xl font-bold font-mono text-emerald-500 mt-0.5">+18.4%</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-3xl border border-border/60 bg-surface/40">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-surface/80 text-muted-foreground font-bold">
              <th className="p-3.5 text-start">{language === 'ar' ? 'المادة الخام' : 'Ingredient'}</th>
              <th className="p-3.5 text-start">{language === 'ar' ? 'القسم' : 'Category'}</th>
              <th className="p-3.5 text-start">{language === 'ar' ? 'المخزون الحالي' : 'Current Stock'}</th>
              <th className="p-3.5 text-start">{language === 'ar' ? 'الحد الأدنى' : 'Min Alert'}</th>
              <th className="p-3.5 text-start">{language === 'ar' ? 'متوسط التكلفة' : 'Avg Cost'}</th>
              <th className="p-3.5 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-3.5 text-end">{language === 'ar' ? 'إجراء سريع' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredItems.map((item: any) => {
              const isLow = item.currentStock <= item.minStockAlert;
              const unit = language === 'ar' ? (item.unitAr || item.unit) : (item.unitEn || item.unit);
              const name = language === 'ar' ? (item.nameAr || item.name) : (item.nameEn || item.name);

              return (
                <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="p-3.5 font-bold text-foreground flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-sm shadow-2xs">
                      📦
                    </div>
                    <span>{name}</span>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{item.category}</td>
                  <td className="p-3.5 font-mono font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{item.currentStock}</span>
                      <span className="text-[10px] text-muted-foreground">{unit}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-muted-foreground">
                    {item.minStockAlert} {unit}
                  </td>
                  <td className="p-3.5 font-mono text-foreground">
                    {item.averageCost || item.costPerUnit || 10} {t.currency}
                  </td>
                  <td className="p-3.5">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                        <AlertOctagon className="w-3 h-3" />
                        {language === 'ar' ? 'نقص حرج' : 'Low Stock'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        {language === 'ar' ? 'متوفر وجاهز' : 'In Stock'}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleQuickAdjust(item.id, -1)}
                        className="w-7 h-7 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="خصم استهلاك"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item.id, 5)}
                        className="w-7 h-7 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="إضافة وارد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {isLow && (
                        <button
                          onClick={() => handleGeneratePo(name)}
                          className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Truck className="w-3 h-3" />
                          <span>{language === 'ar' ? 'طلب فوري' : 'Auto PO'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
