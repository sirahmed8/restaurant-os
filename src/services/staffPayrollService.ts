/**
 * =====================================================================
 * RESTAURANT OS — 360° STAFF DOSSIER & AUTOMATED PAYROLL SERVICE
 * =====================================================================
 * Manages automated shift clock-in/out with PIN, tip pool calculation,
 * advances/loans deduction, and 1-click digital payslip generation.
 */

import { eventBus } from './eventBus';

export type StaffRole = 
  | 'head_chef' 
  | 'chef' 
  | 'floor_manager' 
  | 'lead_cashier' 
  | 'cashier' 
  | 'barista' 
  | 'waiter' 
  | 'delivery_driver';

export interface ShiftTimeLog {
  id: string;
  clockIn: string;
  clockOut?: string;
  totalMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  status: 'active' | 'completed' | 'break';
}

export interface StaffAdvanceLoan {
  id: string;
  staffId: string;
  amount: number;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'deducted';
  approvedBy?: string;
}

export interface DigitalStationChecklist {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'opening' | 'closing' | 'hygiene';
  assignedRole: StaffRole;
  items: {
    id: string;
    textAr: string;
    textEn: string;
    isCompleted: boolean;
    completedAt?: string;
    completedBy?: string;
  }[];
}

export interface MonthlyPayslipRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // e.g. "2026-08"
  baseSalary: number;
  hourlyRate: number;
  regularHoursWorked: number;
  overtimeHoursWorked: number;
  overtimePay: number;
  tipsEarned: number;
  advancesDeducted: number;
  bonuses: number;
  penalties: number;
  netSalary: number;
  generatedAt: string;
  isPaid: boolean;
}

export interface StaffDossier {
  id: string;
  name: string;
  nameEn: string;
  role: StaffRole;
  roleTitleAr: string;
  roleTitleEn: string;
  phone: string;
  avatar: string;
  pinCode: string;
  monthlyBaseSalary: number;
  hourlyRate: number;
  status: 'on_shift' | 'break' | 'off_shift';
  shiftStart?: string;
  todaySales?: number;
  ordersHandled?: number;
  performanceScore: number;
  activeShift?: ShiftTimeLog;
  shiftHistory: ShiftTimeLog[];
  advances: StaffAdvanceLoan[];
  accumulatedTips: number;
  joinedDate: string;
}

const STORAGE_KEY_STAFF = 'restaurant_os_staff_dossiers_v2';

const INITIAL_STAFF_DOSSIERS: StaffDossier[] = [
  {
    id: 'st_1',
    name: 'الشيف طارق الغامدي',
    nameEn: 'Chef Tariq Al-Ghamdi',
    role: 'head_chef',
    roleTitleAr: 'رئيس الطهاة التنفيذي',
    roleTitleEn: 'Executive Head Chef',
    phone: '+966 55 111 2233',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
    pinCode: '1111',
    monthlyBaseSalary: 9500,
    hourlyRate: 45,
    status: 'on_shift',
    shiftStart: '12:00 PM',
    ordersHandled: 84,
    performanceScore: 98,
    accumulatedTips: 320,
    joinedDate: '2024-03-01',
    shiftHistory: [
      { id: 'sh_101', clockIn: '2026-08-16 12:00', totalMinutes: 360, overtimeMinutes: 60, lateMinutes: 0, status: 'completed' },
    ],
    advances: [],
  },
  {
    id: 'st_2',
    name: 'سارة المنصور',
    nameEn: 'Sara Al-Mansour',
    role: 'floor_manager',
    roleTitleAr: 'مديرة صالة الضيافة',
    roleTitleEn: 'Floor Experience Manager',
    phone: '+966 50 222 3344',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    pinCode: '2222',
    monthlyBaseSalary: 8200,
    hourlyRate: 40,
    status: 'on_shift',
    shiftStart: '01:30 PM',
    todaySales: 14200,
    ordersHandled: 65,
    performanceScore: 96,
    accumulatedTips: 280,
    joinedDate: '2024-06-15',
    shiftHistory: [],
    advances: [
      { id: 'adv_1', staffId: 'st_2', amount: 500, reason: 'سلفة مصاريف طارئة', requestedAt: '2026-08-10', status: 'approved', approvedBy: 'المدير العام' },
    ],
  },
  {
    id: 'st_3',
    name: 'عمر القحطاني',
    nameEn: 'Omar Al-Qahtani',
    role: 'lead_cashier',
    roleTitleAr: 'كاشير رئيسي ومحاسب',
    roleTitleEn: 'Lead Cashier',
    phone: '+966 54 333 4455',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pinCode: '3333',
    monthlyBaseSalary: 6500,
    hourlyRate: 32,
    status: 'on_shift',
    shiftStart: '02:00 PM',
    todaySales: 9850,
    ordersHandled: 42,
    performanceScore: 94,
    accumulatedTips: 240,
    joinedDate: '2025-01-10',
    shiftHistory: [],
    advances: [],
  },
  {
    id: 'st_4',
    name: 'خالد السبيعي',
    nameEn: 'Khaled Al-Subaie',
    role: 'barista',
    roleTitleAr: 'باريستا وخبير مشروبات',
    roleTitleEn: 'Specialty Barista',
    phone: '+966 56 444 5566',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pinCode: '4444',
    monthlyBaseSalary: 5500,
    hourlyRate: 28,
    status: 'break',
    shiftStart: '11:00 AM',
    ordersHandled: 56,
    performanceScore: 92,
    accumulatedTips: 190,
    joinedDate: '2025-04-01',
    shiftHistory: [],
    advances: [],
  },
];

const INITIAL_CHECKLISTS: DigitalStationChecklist[] = [
  {
    id: 'chk_opening',
    titleAr: 'قائمة مهام الافتتاح اليومي للمطعم',
    titleEn: 'Daily Restaurant Opening Checklist',
    category: 'opening',
    assignedRole: 'floor_manager',
    items: [
      { id: '1', textAr: 'تشغيل الإضاءة والموسيقى والتكييف على 22°', textEn: 'Turn on lights, background music & AC to 22C', isCompleted: true, completedAt: '11:30 AM', completedBy: 'سارة المنصور' },
      { id: '2', textAr: 'فحص رولات الطابعات الحرارية وأجهزة نقاط البيع', textEn: 'Check thermal printer paper rolls & POS terminals', isCompleted: true, completedAt: '11:35 AM', completedBy: 'عمر القحطاني' },
      { id: '3', textAr: 'معايرة ماكينة الإسبريسو وطاحونة القهوة', textEn: 'Calibrate espresso machine and coffee grinder', isCompleted: true, completedAt: '11:40 AM', completedBy: 'خالد السبيعي' },
      { id: '4', textAr: 'فحص درجات حرارة الثلاجات والمجمدات', textEn: 'Verify cold fridge and freezer temperature logs', isCompleted: false },
    ],
  },
  {
    id: 'chk_hygiene',
    titleAr: 'قائمة التعقيم والنظافة الغذائية الدورية',
    titleEn: 'HACCP Food Safety & Hygiene Checklist',
    category: 'hygiene',
    assignedRole: 'head_chef',
    items: [
      { id: '10', textAr: 'تعقيم أسطح تحضير اللحوم وألواح التقطيع', textEn: 'Sanitize meat prep stations and cutting boards', isCompleted: true, completedAt: '12:15 PM', completedBy: 'طارق الغامدي' },
      { id: '11', textAr: 'فحص صلاحية وتواريخ الصوصات المحضرة (FEFO)', textEn: 'Check prepared sauce dates & FEFO labeling', isCompleted: false },
      { id: '12', textAr: 'تفريغ وتغيير فلاتر زيت القلايات', textEn: 'Filter and test deep fryer cooking oil', isCompleted: false },
    ],
  },
];

export class StaffPayrollService {
  private staffList: StaffDossier[] = [];
  private checklists: DigitalStationChecklist[] = [];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedStaff = localStorage.getItem(STORAGE_KEY_STAFF);
      if (savedStaff) {
        try {
          this.staffList = JSON.parse(savedStaff);
          this.checklists = INITIAL_CHECKLISTS;
          return;
        } catch {
          // fallback
        }
      }
    }
    this.staffList = [...INITIAL_STAFF_DOSSIERS];
    this.checklists = [...INITIAL_CHECKLISTS];
    this.persist();
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(this.staffList));
    }
  }

  public getAllStaff(): StaffDossier[] {
    return [...this.staffList];
  }

  public getStaffById(id: string): StaffDossier | undefined {
    return this.staffList.find((s) => s.id === id);
  }

  public toggleShiftStatus(id: string): StaffDossier | undefined {
    const member = this.getStaffById(id);
    if (!member) return undefined;

    const nextStatus = member.status === 'on_shift' ? 'break' : member.status === 'break' ? 'off_shift' : 'on_shift';
    member.status = nextStatus;
    this.persist();
    return member;
  }

  public requestAdvance(staffId: string, amount: number, reason: string): StaffAdvanceLoan {
    const loan: StaffAdvanceLoan = {
      id: `adv_${Date.now()}`,
      staffId,
      amount,
      reason,
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    const staff = this.getStaffById(staffId);
    if (staff) {
      staff.advances.unshift(loan);
      this.persist();
    }

    return loan;
  }

  public approveAdvance(staffId: string, advanceId: string, managerName: string): boolean {
    const staff = this.getStaffById(staffId);
    if (!staff) return false;

    const adv = staff.advances.find((a) => a.id === advanceId);
    if (!adv) return false;

    adv.status = 'approved';
    adv.approvedBy = managerName;
    this.persist();
    return true;
  }

  /**
   * Distribute shift tips among on-shift staff.
   */
  public distributeTipPool(totalTips: number, staffIds: string[]): { staffId: string; tipShare: number }[] {
    if (staffIds.length === 0 || totalTips <= 0) return [];

    const sharePerPerson = Number((totalTips / staffIds.length).toFixed(2));
    const results: { staffId: string; tipShare: number }[] = [];

    this.staffList.forEach((st) => {
      if (staffIds.includes(st.id)) {
        st.accumulatedTips = (st.accumulatedTips || 0) + sharePerPerson;
        results.push({ staffId: st.id, tipShare: sharePerPerson });
      }
    });

    this.persist();
    return results;
  }

  /**
   * Generates comprehensive monthly digital payslip.
   */
  public generatePayslip(staffId: string, month: string = '2026-08'): MonthlyPayslipRecord | undefined {
    const staff = this.getStaffById(staffId);
    if (!staff) return undefined;

    const baseSalary = staff.monthlyBaseSalary;
    const regularHoursWorked = 160; // Standard month
    const overtimeHoursWorked = 12;
    const overtimePay = overtimeHoursWorked * staff.hourlyRate * 1.5;
    const tipsEarned = staff.accumulatedTips || 0;

    // Deduct approved advances
    const advancesDeducted = staff.advances
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + a.amount, 0);

    const bonuses = staff.performanceScore >= 95 ? 500 : 200;
    const penalties = 0;
    const netSalary = baseSalary + overtimePay + tipsEarned + bonuses - advancesDeducted - penalties;

    return {
      id: `slip_${staffId}_${month}`,
      staffId: staff.id,
      staffName: staff.name,
      month,
      baseSalary,
      hourlyRate: staff.hourlyRate,
      regularHoursWorked,
      overtimeHoursWorked,
      overtimePay,
      tipsEarned,
      advancesDeducted,
      bonuses,
      penalties,
      netSalary,
      generatedAt: new Date().toISOString(),
      isPaid: false,
    };
  }

  public getChecklists(): DigitalStationChecklist[] {
    return [...this.checklists];
  }

  public toggleChecklistItem(checklistId: string, itemId: string, userName: string): boolean {
    const chk = this.checklists.find((c) => c.id === checklistId);
    if (!chk) return false;

    const item = chk.items.find((i) => i.id === itemId);
    if (!item) return false;

    item.isCompleted = !item.isCompleted;
    if (item.isCompleted) {
      item.completedAt = new Date().toTimeString().slice(0, 5);
      item.completedBy = userName;
    } else {
      item.completedAt = undefined;
      item.completedBy = undefined;
    }

    return true;
  }

  public resetForTesting(): void {
    this.staffList = JSON.parse(JSON.stringify(INITIAL_STAFF_DOSSIERS));
    this.checklists = JSON.parse(JSON.stringify(INITIAL_CHECKLISTS));
    this.persist();
  }
}

export const staffPayrollService = new StaffPayrollService();
