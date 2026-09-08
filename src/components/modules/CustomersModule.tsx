import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Phone,
  Search,
  Gift,
  ShieldAlert,
  History,
  RotateCcw,
  HeartHandshake,
  Tag,
  Plus,
  X,
  Check,
  Send,
  Calendar,
  CreditCard,
  Utensils,
  Award,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { customer360Service, CustomerDossier, AllergenType } from '../../services/customer360Service';
import { soundEngine } from '../../services/soundEngine';

export const CustomersModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDossier | null>(
    customer360Service.getAllCustomers()[0] || null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'allergens' | 'vouchers'>('overview');
  const [reorderSuccess, setReorderSuccess] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  const customers = customer360Service.getAllCustomers(searchTerm);

  const handleSelectCustomer = (c: CustomerDossier) => {
    setSelectedCustomer(c);
    soundEngine.play('click');
  };

  const handleToggleAllergen = (allergen: AllergenType) => {
    if (!selectedCustomer) return;
    const updated = customer360Service.toggleAllergen(selectedCustomer.id, allergen);
    if (updated) {
      setSelectedCustomer(updated);
      soundEngine.play('pop');
    }
  };

  const handleAddNote = () => {
    if (!selectedCustomer || !newNoteInput.trim()) return;
    const updated = customer360Service.addCustomerNote(selectedCustomer.id, newNoteInput);
    if (updated) {
      setSelectedCustomer(updated);
      setNewNoteInput('');
      soundEngine.play('pop');
    }
  };

  const handleRedeemVoucher = (points: number, discount: number) => {
    if (!selectedCustomer) return;
    const res = customer360Service.redeemPointsForVoucher(selectedCustomer.id, points, discount);
    if (res.success && res.voucher) {
      setSelectedCustomer(customer360Service.getCustomerById(selectedCustomer.id) || null);
      setRedeemSuccess(`تم توليد قسيمة الخصم بنجاح: ${res.voucher.code}`);
      soundEngine.play('success');
      setTimeout(() => setRedeemSuccess(null), 4000);
    } else {
      alert(res.error);
      soundEngine.play('alert');
    }
  };

  const handleQuickReorder = (orderNumber: string) => {
    soundEngine.play('success');
    setReorderSuccess(true);
    setTimeout(() => setReorderSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>الملف الرقمي الشامل للعملاء 360° (Customer CRM & Allergy Shield)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل الضيوف الفوري، حماية الحساسيات الصحية، برامج الولاء والمكافآت، وإعادة الطلب بلمسة واحدة
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute start-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl ps-10 pe-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
        {/* Customer Roster (Left) */}
        <div className="lg:col-span-4 flex flex-col overflow-hidden space-y-3">
          <span className="text-xs font-bold text-slate-400 px-1">
            قائمة العملاء المسجلين ({customers.length})
          </span>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {customers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const hasAllergies = c.allergens.length > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-900/80 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={c.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white truncate">{c.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.tier === 'VIP_BLACK'
                              ? 'bg-slate-950 text-amber-300 border border-amber-500/40'
                              : c.tier === 'GOLD'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {c.tier}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="font-mono">{c.phone}</span>
                      </div>

                      {hasAllergies && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 w-fit">
                          <ShieldAlert className="w-3 h-3" />
                          <span>حساسية: {c.allergens.join('، ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer 360 Dossier (Right) */}
        {selectedCustomer ? (
          <div className="lg:col-span-8 flex flex-col bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl overflow-hidden space-y-6">
            {/* Customer Dossier Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCustomer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedCustomer.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-500/30 shadow-xl"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{selectedCustomer.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">({selectedCustomer.nameEn})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono text-amber-400">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedCustomer.phone}
                    </span>
                    <span>•</span>
                    <span>آخر زيارة: {selectedCustomer.lastVisit}</span>
                  </div>
                </div>
              </div>

              {/* LTV & Loyalty Summary Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[100px]">
                  <span className="block text-[10px] text-amber-300/80 font-semibold">رصيد النقاط</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{selectedCustomer.points}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[100px]">
                  <span className="block text-[10px] text-emerald-300/80 font-semibold">إجمالي الإنفاق</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{selectedCustomer.totalSpent} ر.س</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center min-w-[90px]">
                  <span className="block text-[10px] text-indigo-300/80 font-semibold">الزيارات</span>
                  <span className="text-lg font-black text-indigo-400 font-mono">{selectedCustomer.visitsCount}</span>
                </div>
              </div>
            </div>

            {/* Allergy Auto-Shield Alert Banner */}
            {selectedCustomer.allergens.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-300">درع الحماية الصحية من الحساسيات (Allergy Auto-Shield)</h4>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      تنبيه للمطبخ والكاشير: العميل يعاني من حساسية ({selectedCustomer.allergens.join('، ')})
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500 text-white shadow-md">
                  نشط وتلقائي
                </span>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800 gap-2 pb-2">
              {[
                { id: 'overview', label: 'الأطباق المفضلة والملاحظات', icon: Utensils },
                { id: 'orders', label: 'سجل الطلبات وإعادة الطلب', icon: History },
                { id: 'allergens', label: 'إدارة الحساسيات الصحية', icon: ShieldAlert },
                { id: 'vouchers', label: 'محفظة قسائم الولاء', icon: Gift },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      soundEngine.play('tap');
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Favorite Dishes */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>الأطباق الأكثر طلباً وتفضيلاً للعميل</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCustomer.favoriteDishes.map((dish, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{dish.nameAr}</span>
                            <span className="text-[10px] text-slate-400">{dish.nameEn}</span>
                          </div>
                          <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                            {dish.orderCount} مرات
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black text-slate-300">ملاحظات وتفضيلات الضيافة الخاصة:</h4>
                    <div className="space-y-1.5">
                      {selectedCustomer.notes.map((note, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="أضف ملاحظة خاصة (مثال: يفضل الجلوس بالداخل / بدون ملح إضافي)..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleAddNote}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {reorderSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                      ✅ تم تجهيز الوجبة المعتادة وإرسالها إلى سلة نقطة البيع POS بنجاح!
                    </div>
                  )}

                  {selectedCustomer.orderHistory.map((ord) => (
                    <div key={ord.orderId} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{ord.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{ord.date}</span>
                          {ord.tableNumber && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-amber-400">
                              طاولة {ord.tableNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 text-sm">{ord.total.toFixed(2)} ر.س</span>
                          <button
                            onClick={() => handleQuickReorder(ord.orderNumber)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إعادة الطلب بلمسة</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400">
                        {ord.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.quantity}x {item.nameAr}</span>
                            <span className="font-mono">{(item.quantity * item.unitPrice).toFixed(2)} ر.س</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'allergens' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    حدد الحساسيات الغذائية للعميل لحمايته ومنع الخطأ البشري في المطبخ والصالة:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'gluten', label: 'الغلوتين (Gluten)' },
                      { id: 'lactose', label: 'اللاكتوز (Lactose)' },
                      { id: 'nuts', label: 'المكسرات (Nuts)' },
                      { id: 'peanuts', label: 'الفول السوداني (Peanuts)' },
                      { id: 'seafood', label: 'المأكولات البحرية (Seafood)' },
                      { id: 'eggs', label: 'البيض (Eggs)' },
                      { id: 'soy', label: 'الصويا (Soy)' },
                      { id: 'sesame', label: 'السمسم (Sesame)' },
                    ].map((alg) => {
                      const isSelected = selectedCustomer.allergens.includes(alg.id as AllergenType);
                      return (
                        <button
                          key={alg.id}
                          onClick={() => handleToggleAllergen(alg.id as AllergenType)}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{alg.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'vouchers' && (
                <div className="space-y-4">
                  {redeemSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                      {redeemSuccess}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black text-amber-400">استبدال نقاط الولاء بقسائم خصم فورية:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleRedeemVoucher(500, 15)}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-center space-y-1"
                      >
                        <span className="block text-xs font-bold text-white">خصم 15%</span>
                        <span className="block text-[10px] text-amber-400 font-mono">500 نقطة</span>
                      </button>

                      <button
                        onClick={() => handleRedeemVoucher(1000, 25)}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-center space-y-1"
                      >
                        <span className="block text-xs font-bold text-white">خصم 25%</span>
                        <span className="block text-[10px] text-amber-400 font-mono">1,000 نقطة</span>
                      </button>

                      <button
                        onClick={() => handleRedeemVoucher(2000, 50)}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-center space-y-1"
                      >
                        <span className="block text-xs font-bold text-white">خصم 50% VIP</span>
                        <span className="block text-[10px] text-amber-400 font-mono">2,000 نقطة</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">القسائم الفعالة للعميل:</span>
                    {selectedCustomer.vouchers.map((v) => (
                      <div key={v.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-amber-400 text-sm block">{v.code}</span>
                          <span className="text-[10px] text-slate-400">خصم {v.discountPercent}% • صالح حتى {v.expiresAt}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          جاهز للاستخدام
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
