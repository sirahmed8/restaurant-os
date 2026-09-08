import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  Coffee,
  Sparkles,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  CheckSquare,
  HandCoins,
  ShieldCheck,
  Download,
  Plus,
  Search,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import {
  staffPayrollService,
  StaffDossier,
  MonthlyPayslipRecord,
  DigitalStationChecklist,
} from '../../services/staffPayrollService';
import { soundEngine } from '../../services/soundEngine';

export const StaffModule: React.FC = () => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll' | 'tips' | 'advances' | 'checklists'>('roster');
  const [staffList, setStaffList] = useState<StaffDossier[]>(staffPayrollService.getAllStaff());
  const [selectedStaff, setSelectedStaff] = useState<StaffDossier | null>(staffList[0] || null);
  const [checklists, setChecklists] = useState<DigitalStationChecklist[]>(staffPayrollService.getChecklists());
  const [payslip, setPayslip] = useState<MonthlyPayslipRecord | null>(null);

  // Tip Pool Inputs
  const [shiftTipTotal, setShiftTipTotal] = useState<string>('500');
  const [tipSuccessMsg, setTipSuccessMsg] = useState<string | null>(null);

  // Advance Loan Inputs
  const [loanAmount, setLoanAmount] = useState<string>('400');
  const [loanReason, setLoanReason] = useState<string>('سلفة مصاريف علاجية');
  const [loanSuccessMsg, setLoanSuccessMsg] = useState<string | null>(null);

  const handleToggleShift = (id: string) => {
    const updated = staffPayrollService.toggleShiftStatus(id);
    if (updated) {
      setStaffList(staffPayrollService.getAllStaff());
      if (selectedStaff?.id === id) setSelectedStaff(updated);
      soundEngine.play('pop');
    }
  };

  const handleDistributeTips = () => {
    const total = parseFloat(shiftTipTotal);
    if (isNaN(total) || total <= 0) return;

    const onShiftIds = staffList.filter((s) => s.status === 'on_shift').map((s) => s.id);
    if (onShiftIds.length === 0) {
      alert('لا يوجد موظفون على رأس العمل حالياً لتوزيع التبس');
      return;
    }

    const dist = staffPayrollService.distributeTipPool(total, onShiftIds);
    setStaffList(staffPayrollService.getAllStaff());
    setTipSuccessMsg(`تم توزيع ${total} ر.س بالتساوي على ${onShiftIds.length} موظف (${dist[0]?.tipShare} ر.س لكل موظف)`);
    soundEngine.play('success');
    setTimeout(() => setTipSuccessMsg(null), 5000);
  };

  const handleRequestLoan = () => {
    if (!selectedStaff) return;
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) return;

    staffPayrollService.requestAdvance(selectedStaff.id, amount, loanReason);
    setStaffList(staffPayrollService.getAllStaff());
    setSelectedStaff(staffPayrollService.getStaffById(selectedStaff.id) || null);
    setLoanSuccessMsg(`تم إرسال طلب سلفة بمبلغ ${amount} ر.س للإدارة للموافقة`);
    soundEngine.play('success');
    setTimeout(() => setLoanSuccessMsg(null), 4000);
  };

  const handleApproveLoan = (staffId: string, loanId: string) => {
    staffPayrollService.approveAdvance(staffId, loanId, 'مدير الفرع');
    setStaffList(staffPayrollService.getAllStaff());
    if (selectedStaff) setSelectedStaff(staffPayrollService.getStaffById(selectedStaff.id) || null);
    soundEngine.play('success');
  };

  const handleGeneratePayslip = (staffId: string) => {
    const slip = staffPayrollService.generatePayslip(staffId, '2026-08');
    if (slip) {
      setPayslip(slip);
      soundEngine.play('success');
    }
  };

  const handleToggleChecklist = (chkId: string, itemId: string) => {
    staffPayrollService.toggleChecklistItem(chkId, itemId, 'مشرف الوردية');
    setChecklists(staffPayrollService.getChecklists());
    soundEngine.play('click');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>الملف الرقمي الشامل للموظفين والرواتب (360° Staff Dossier & Auto-HR)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة الورديات، توزيع التبس التلقائي، السلف المؤتمتة، كشوفات الرواتب الرقمية، وقوائم المطبخ والصالة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedStaff) handleGeneratePayslip(selectedStaff.id);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>إصدار قسيمة الراتب الرقمية</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 pb-2 overflow-x-auto">
        {[
          { id: 'roster', label: 'كادر الموظفين والورديات', icon: Users },
          { id: 'tips', label: 'حاسبة وتوزيع التبس التلقائي', icon: HandCoins },
          { id: 'advances', label: 'إدارة السلف والقروض الرقمية', icon: DollarSign },
          { id: 'payroll', label: 'كشف الرواتب ومسير الشهر', icon: FileSpreadsheet },
          { id: 'checklists', label: 'قوائم المهام والنظافة الرقمية', icon: CheckSquare },
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {staffList.map((member) => {
              const isOnShift = member.status === 'on_shift';
              const isBreak = member.status === 'break';
              const isSelected = selectedStaff?.id === member.id;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedStaff(member)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60 shadow-xl shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                        />
                        <span
                          className={`absolute -bottom-1 -end-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            isOnShift ? 'bg-emerald-400' : isBreak ? 'bg-amber-400' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                        <span className="text-xs text-amber-400 block truncate">{member.roleTitleAr}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                      <div className="flex justify-between">
                        <span>الراتب الأساسي:</span>
                        <span className="font-mono text-white font-bold">{member.monthlyBaseSalary} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span>التبس المجمع:</span>
                        <span className="font-mono text-emerald-400 font-bold">{member.accumulatedTips} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تقييم الأداء:</span>
                        <span className="font-mono text-amber-400 font-bold">{member.performanceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">PIN: {member.pinCode}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShift(member.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isOnShift
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isBreak
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isOnShift ? 'على العمل' : isBreak ? 'استراحة' : 'خارج الوردية'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-400" />
                <span>حاسبة التوزيع التلقائي للتبس (Automated Tip Pool)</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يقوم النظام بحساب إجمالي البقشيش المجمع خلال الوردية وتوزيعه بالتساوي والتلقائي على الموظفين المسجلين على رأس العمل بدون أي حساب يدوي.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">مبلغ البقشيش المجمع للوردية (ر.س):</label>
                  <input
                    type="number"
                    value={shiftTipTotal}
                    onChange={(e) => setShiftTipTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-lg font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>الموظفون على رأس العمل الآن:</span>
                    <span className="font-bold text-white font-mono">
                      {staffList.filter((s) => s.status === 'on_shift').length} موظفين
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>نصيب كل موظف المتوقع:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {staffList.filter((s) => s.status === 'on_shift').length > 0
                        ? (parseFloat(shiftTipTotal || '0') / staffList.filter((s) => s.status === 'on_shift').length).toFixed(2)
                        : 0}{' '}
                      ر.س
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDistributeTips}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  اعتماد وتوزيع التبس على محافظ الموظفين فوراً
                </button>

                {tipSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    {tipSuccessMsg}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-black text-slate-300">أرصدة التبس التراكمية لطاقم العمل</h4>
              <div className="space-y-2">
                {staffList.map((st) => (
                  <div key={st.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={st.avatar} alt={st.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <span className="text-xs font-bold text-white block">{st.name}</span>
                        <span className="text-[10px] text-slate-400">{st.roleTitleAr}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {st.accumulatedTips.toFixed(2)} ر.س
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advances' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>طلب سلفة رقمية جديدة للموظف</span>
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل سلفة مالية ليتم خصمها آلياً وتلقائياً من مسير راتب نهاية الشهر بدون أي نسيان أو أوراق.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الموظف المعني:</label>
                  <select
                    value={selectedStaff?.id || ''}
                    onChange={(e) => setSelectedStaff(staffList.find((s) => s.id === e.target.value) || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleTitleAr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مبلغ السلفة (ر.س):</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">سبب السلفة:</label>
                  <input
                    type="text"
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleRequestLoan}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  تسجيل السلفة في الملف المالي للموظف
                </button>

                {loanSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    {loanSuccessMsg}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-black text-slate-300">سجل السلف والقروض المسجلة</h4>
              <div className="space-y-2">
                {staffList.flatMap((s) =>
                  s.advances.map((adv) => (
                    <div key={adv.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{s.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              adv.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {adv.status === 'approved' ? 'معتمدة للخصم' : 'قيد المراجعة'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {adv.reason} • {adv.requestedAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-rose-400 text-sm">-{adv.amount} ر.س</span>
                        {adv.status === 'pending' && (
                          <button
                            onClick={() => handleApproveLoan(s.id, adv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            موافقة
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">مسير الرواتب الرقمي لشهر أغسطس 2026</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    حساب الرواتب الصافية شاملة ساعات العمل والإضافي والتبس وخصم السلف آلياً
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {staffList.map((st) => {
                  const slip = staffPayrollService.generatePayslip(st.id);
                  if (!slip) return null;

                  return (
                    <div key={st.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={st.avatar} alt={st.name} className="w-12 h-12 rounded-2xl object-cover" />
                        <div>
                          <h4 className="text-sm font-bold text-white">{st.name}</h4>
                          <span className="text-xs text-amber-400">{st.roleTitleAr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-xs text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الأساسي</span>
                          <span className="font-mono text-white font-bold">{slip.baseSalary}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الإضافي + التبس</span>
                          <span className="font-mono text-emerald-400 font-bold">+{slip.overtimePay + slip.tipsEarned}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">خصم السلف</span>
                          <span className="font-mono text-rose-400 font-bold">-{slip.advancesDeducted}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 block font-bold">الصافي المستحق</span>
                          <span className="font-mono text-emerald-300 font-black text-sm">{slip.netSalary} ر.س</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checklists' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {checklists.map((chk) => (
                <div key={chk.id} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-amber-400" />
                      <span>{chk.titleAr}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {chk.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {chk.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(chk.id, item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          item.isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                              item.isCompleted
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{item.textAr}</span>
                            <span className="text-[10px] text-slate-500">{item.textEn}</span>
                          </div>
                        </div>

                        {item.completedAt && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {item.completedAt} ({item.completedBy})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
