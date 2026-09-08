import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useKdsStore } from '../../stores/useKdsStore';
import { getTranslation } from '../../i18n/translations';
import { KitchenStation } from '../../db/schema';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const KdsModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const {
    tickets,
    activeStation,
    setActiveStation,
    loadKdsTickets,
    updateItemStatus,
    bumpEntireOrder,
  } = useKdsStore();

  const t = getTranslation(language);

  useEffect(() => {
    loadKdsTickets();
    const interval = setInterval(loadKdsTickets, 15000);
    return () => clearInterval(interval);
  }, [loadKdsTickets]);

  const stations: { id: KitchenStation | 'all'; label: string }[] = [
    { id: 'all', label: t.allStations },
    { id: 'grill', label: t.station_grill },
    { id: 'fryer', label: t.station_fryer },
    { id: 'beverages', label: t.station_beverage },
    { id: 'bakery', label: t.station_bakery },
    { id: 'main_kitchen', label: t.station_assembly },
  ];

  const handleToggleItemStatus = (itemId: string, currentStatus: string) => {
    playSound('click');
    const nextStatus = currentStatus === 'pending' ? 'cooking' : currentStatus === 'cooking' ? 'ready' : 'served';
    updateItemStatus(itemId, nextStatus as any);
  };

  const handleBumpOrder = (orderId: string) => {
    playSound('kitchen-bell');
    bumpEntireOrder(orderId);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      {/* Top Station Selector & Action Bar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/5">
        {/* Station Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {stations.map((st) => {
            const isSelected = activeStation === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStation(st.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chime Bell Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="amber"
            onClick={() => playSound('kitchen-bell')}
            className="rounded-2xl gap-2 font-bold"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'ar' ? 'جرس المطبخ' : 'Kitchen Chime'}
            </span>
          </Button>
        </div>
      </div>

      {/* Kitchen Ticket Cards Grid */}
      <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pe-1 custom-scrollbar">
        <AnimatePresence>
          {tickets.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
              <Sparkles className="w-12 h-12 mb-3 text-amber-400/40 animate-pulse" />
              <p className="text-sm font-bold text-slate-300">
                {language === 'ar' ? 'لا توجد طلبات معلقة في المطبخ حالياً' : 'All clear! No active kitchen orders'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' ? 'الطلبات الجديدة ستظهر هنا فور تسجيلها' : 'New orders will automatically appear here in real-time'}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const isCritical = ticket.urgency === 'critical';
              const isWarning = ticket.urgency === 'warning';
              const isAllReady = ticket.items.every((i) => i.status === 'ready' || i.status === 'served');

              let statusBorder = 'border-white/10';
              if (isCritical) statusBorder = 'border-rose-500/60 shadow-lg shadow-rose-500/10';
              else if (isAllReady) statusBorder = 'border-emerald-500/60 shadow-lg shadow-emerald-500/10';
              else if (isWarning) statusBorder = 'border-amber-500/60 shadow-lg shadow-amber-500/10';

              return (
                <motion.div
                  key={ticket.order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex flex-col justify-between rounded-3xl p-4 glass-panel-elevated border ${statusBorder} transition-all duration-300 overflow-hidden relative`}
                >
                  {/* Top Ticket Details */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-mono">
                          {ticket.order.orderNumber}
                        </span>
                        {ticket.order.tableId ? (
                          <Badge variant="amber" size="sm">
                            {t.table} {ticket.order.tableId}
                          </Badge>
                        ) : (
                          <Badge variant="blue" size="sm">
                            {t.orderType_takeaway}
                          </Badge>
                        )}
                      </div>

                      {/* Timer Badge */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono-numbers ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ticket.elapsedMinutes}m</span>
                      </div>
                    </div>

                    {/* Urgent Alert banner */}
                    {isCritical && (
                      <div className="my-2 p-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-[11px] font-bold text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t.urgentAlert}</span>
                      </div>
                    )}

                    {/* Ticket Items List */}
                    <div className="py-3 space-y-2">
                      {ticket.items.map((item) => {
                        const isDone = item.status === 'ready' || item.status === 'served';
                        const isCooking = item.status === 'cooking';

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItemStatus(item.id, item.status)}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-400 line-through opacity-70'
                                : isCooking
                                ? 'bg-amber-500/10 border-amber-500/30 text-slate-100'
                                : 'bg-white/5 border-white/10 text-slate-100 hover:border-amber-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-xl flex items-center justify-center border ${
                                  isDone
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : isCooking
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-white/10 border-white/20'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : isCooking ? (
                                  <Flame className="w-3.5 h-3.5" />
                                ) : null}
                              </div>
                              <div>
                                <div className="text-xs font-bold">
                                  <span className="text-amber-400 font-mono-numbers me-1.5 font-black">
                                    {item.quantity}x
                                  </span>
                                  {language === 'ar' ? item.nameAr : item.nameEn}
                                </div>
                                {item.notes && (
                                  <div className="text-[10px] text-amber-300 mt-0.5">
                                    ↳ {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              {item.kitchenStation}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Progression Action Button */}
                  <div className="pt-3 border-t border-white/10">
                    <Button
                      variant={isAllReady ? 'success' : 'primary'}
                      size="md"
                      onClick={() => handleBumpOrder(ticket.order.id)}
                      className="w-full rounded-2xl font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAllReady ? t.markServed : t.markReady}</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
