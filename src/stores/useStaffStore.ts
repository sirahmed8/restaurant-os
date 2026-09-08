import { create } from 'zustand';
import { StaffMember } from '../types';
import { useAppStore } from './useAppStore';

interface StaffState {
  staffList: StaffMember[];

  // Actions
  addStaffMember: (member: StaffMember) => void;
  setStaffList: (list: StaffMember[]) => void;
  toggleShiftStatus: (id: string) => void;
}

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st_1',
    name: 'الشيف طارق الغامدي',
    nameEn: 'Chef Tariq Al-Ghamdi',
    role: 'head_chef',
    roleTitleAr: 'رئيس الطهاة التنفيذي',
    roleTitleEn: 'Executive Head Chef',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    shiftStart: '12:00 PM',
    ordersHandled: 84,
    performanceScore: 98,
  },
  {
    id: 'st_2',
    name: 'سارة المنصور',
    nameEn: 'Sara Al-Mansour',
    role: 'floor_manager',
    roleTitleAr: 'مديرة صالة الضيافة',
    roleTitleEn: 'Floor Experience Manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    shiftStart: '01:30 PM',
    todaySales: 14200,
    performanceScore: 96,
  },
  {
    id: 'st_3',
    name: 'عمر القحطاني',
    nameEn: 'Omar Al-Qahtani',
    role: 'senior_cashier',
    roleTitleAr: 'كاشير رئيسي ومحاسب',
    roleTitleEn: 'Lead Cashier',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    shiftStart: '02:00 PM',
    todaySales: 9850,
    ordersHandled: 42,
    performanceScore: 94,
  },
  {
    id: 'st_4',
    name: 'خالد السبيعي',
    nameEn: 'Khaled Al-Subaie',
    role: 'barista',
    roleTitleAr: 'باريستا وخبير مشروبات',
    roleTitleEn: 'Specialty Barista',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'break',
    shiftStart: '11:00 AM',
    ordersHandled: 56,
    performanceScore: 92,
  },
];

export const useStaffStore = create<StaffState>((set, get) => ({
  staffList: [],

  addStaffMember: (member) => {
    set((state) => ({ staffList: [member, ...state.staffList] }));
  },

  setStaffList: (list) => {
    set({ staffList: list });
  },

  toggleShiftStatus: (id) => {
    useAppStore.getState().playSound('pop');
    const updated = get().staffList.map((st) => {
      if (st.id === id) {
        const nextStatus = st.status === 'on_shift' ? 'break' : st.status === 'break' ? 'off_shift' : 'on_shift';
        return { ...st, status: nextStatus as 'on_shift' | 'break' | 'off_shift' };
      }
      return st;
    });
    set({ staffList: updated });
  },
}));
