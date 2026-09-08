import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Utensils, Box, Users, ArrowRight, Sparkles, QrCode, Building2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getTranslation } from '../../i18n/translations';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { AppModule } from '../../types';

export const QuickSearchModal: React.FC = () => {
  const { language, searchOpen, setSearchOpen, setActiveModule, playSound } = useAppStore();
  const menuItems = usePosStore((s) => s.items);
  const addToCart = usePosStore((s) => s.addToCart);
  const inventoryItems = useInventoryStore((s) => s.items);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);

  const t = getTranslation(language);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const q = debouncedQuery.trim().toLowerCase();
  const filteredDishes = useMemo(() => {
    if (!q) return [];
    const out: any[] = [];
    for (const item of menuItems || []) {
      if (out.length >= 8) break;
      const it = item as any;
      if (
        (it.nameAr || it.name || '').toLowerCase().includes(q) ||
        (it.nameEn || '').toLowerCase().includes(q)
      ) {
        out.push(item);
      }
    }
    return out;
  }, [menuItems, q]);

  const filteredInventory = useMemo(() => {
    if (!q) return [];
    const out: any[] = [];
    for (const item of inventoryItems || []) {
      if (out.length >= 5) break;
      const it = item as any;
      if (
        (it.nameAr || it.name || '').toLowerCase().includes(q) ||
        (it.nameEn || '').toLowerCase().includes(q)
      ) {
        out.push(item);
      }
    }
    return out;
  }, [inventoryItems, q]);

  if (!searchOpen) return null;

  const handleSelectModule = (mod: AppModule) => {
    playSound('click');
    setActiveModule(mod);
    setSearchOpen(false);
  };

  const handleSelectDish = (dish: any) => {
    playSound('pop');
    addToCart(dish);
    setActiveModule('pos');
    setSearchOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md"
      onClick={() => setSearchOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.searchPlaceholder || 'Quick search'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-scale-up"
      >
          {/* Header Input */}
          <div className="p-4 border-b border-border flex items-center gap-3 bg-surface/50">
            <Search className="w-5 h-5 text-primary" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder || 'بحث في الأصناف والمخزن والأقسام...'}
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="px-2 py-0.5 text-xs bg-surface border border-border rounded-lg text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick module navigation */}
            {!query && (
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {language === 'ar' ? 'الوصول السريع للأقسام' : 'Quick Navigation'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pos', label: t.module_pos, icon: Utensils },
                    { id: 'table_portal', label: (t as any).module_table_portal || 'طلب الطاولات وQR', icon: QrCode },
                    { id: 'shift', label: (t as any).module_shift || 'المناوبات وZ-Report', icon: Sparkles },
                    { id: 'floorplan', label: (t as any).module_floorplan || 'مخطط الصالة', icon: Sparkles },
                    { id: 'procurement', label: (t as any).module_procurement || 'المشتريات والموردين', icon: Building2 },
                    { id: 'recipe_studio', label: (t as any).module_recipe_studio || 'استوديو الوصفات', icon: Utensils },
                    { id: 'marketing', label: (t as any).module_marketing || 'التسويق والواتساب', icon: Sparkles },
                    { id: 'zatca', label: (t as any).module_zatca || 'الامتثال الضريبي ZATCA', icon: Sparkles },
                    { id: 'kds', label: t.module_kds, icon: Box },
                    { id: 'inventory', label: t.module_inventory, icon: Box },
                    { id: 'customers', label: t.module_customers, icon: Users },
                    { id: 'ai', label: t.module_ai, icon: Sparkles },
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModule(mod.id as AppModule)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface/50 hover:bg-surface border border-border/60 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer"
                    >
                      <mod.icon className="w-4 h-4 text-primary" />
                      <span className="truncate">{mod.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items results */}
            {filteredDishes.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{t.module_pos} ({filteredDishes.length})</span>
                  <span className="text-[10px] text-primary">{language === 'ar' ? 'انقر للإضافة للسلة' : 'Click to add to cart'}</span>
                </div>
                <div className="space-y-1.5">
                  {filteredDishes.map((dish: any) => (
                    <button
                      key={dish.id}
                      onClick={() => handleSelectDish(dish)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface/50 hover:bg-surface border border-border/60 hover:border-primary/40 text-xs text-foreground transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          🍽️
                        </div>
                        <div className="text-start">
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {language === 'ar' ? (dish.nameAr || dish.name) : (dish.nameEn || dish.name)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {dish.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-primary text-sm">
                          {dish.price} {t.currency}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory results */}
            {filteredInventory.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {language === 'ar' ? 'المخزون والمواد الخام' : 'Inventory Items'} ({filteredInventory.length})
                </div>
                <div className="space-y-1.5">
                  {filteredInventory.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 border border-border/60 text-xs"
                    >
                      <div>
                        <div className="font-bold text-foreground">
                          {language === 'ar' ? (item.nameAr || item.name) : (item.nameEn || item.name)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.supplierName || item.supplier || item.category}
                        </div>
                      </div>
                      <div className="font-bold font-mono text-foreground">
                        {item.currentStock} {language === 'ar' ? (item.unitAr || item.unit) : (item.unitEn || item.unit)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
