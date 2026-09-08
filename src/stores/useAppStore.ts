import { create } from 'zustand';
import { AppModule, Language, ThemeMode, UserProfile, WeatherInfo, SoundEffectName } from '../types';
import { soundEngine } from '../services/soundEngine';
import { loadJSON, loadString, saveString, removeKey } from '../lib/storage';

interface AppState {
  language: Language;
  theme: ThemeMode;
  activeModule: AppModule;
  sidebarCollapsed: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  searchOpen: boolean;
  tourOpen: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  activeUser: UserProfile;
  weather: WeatherInfo | null;
  branchNameAr: string;
  branchNameEn: string;
  isLocked: boolean;
  isRegistered: boolean;
  appMode: 'restaurant' | 'owner' | 'customer' | 'cashier';
  isAiAssistantPaid: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setActiveModule: (mod: AppModule) => void;
  toggleSidebar: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (vol: number) => void;
  setSearchOpen: (open: boolean) => void;
  setTourOpen: (open: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setActiveUser: (user: UserProfile) => void;
  setWeather: (weather: WeatherInfo) => void;
  playSound: (sound: SoundEffectName) => void;
  lockApp: () => void;
  unlockApp: (user: UserProfile) => void;
  setAppMode: (mode: 'restaurant' | 'owner' | 'customer' | 'cashier') => void;
  setAiAssistantPaid: (paid: boolean) => void;
  setRegistered: (registered: boolean) => void;
  resetAccount: () => void;
}

export const defaultUser: UserProfile = {
  id: 'usr_admin',
  name: 'المدير العام',
  nameEn: 'General Manager',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  pin: '1234',
  branch: 'الفرع الرئيسي',
};

export const useAppStore = create<AppState>((set, get) => ({
  language: 'ar',
  theme: (loadString('restaurant_os_theme', 'dark') as ThemeMode) === 'light' ? 'light' : 'dark',
  activeModule: 'pos',
  sidebarCollapsed: false,
  soundEnabled: true,
  soundVolume: 0.7,
  searchOpen: false,
  tourOpen: false,
  isOnline: true,
  isSyncing: false,
  activeUser: loadJSON<UserProfile>('restaurant_os_current_user', defaultUser),
  weather: null,
  branchNameAr: loadJSON<{ branchAr?: string }>('restaurant_os_account', {}).branchAr || 'الفرع الرئيسي',
  branchNameEn: loadJSON<{ branchEn?: string }>('restaurant_os_account', {}).branchEn || 'Main Branch',
  isLocked: false,
  isRegistered: loadString('restaurant_os_registered') === 'true',
  appMode: (['restaurant', 'owner', 'customer', 'cashier'] as const).includes(
    loadString('restaurant_os_app_mode', 'restaurant') as 'restaurant'
  )
    ? (loadString('restaurant_os_app_mode', 'restaurant') as AppState['appMode'])
    : 'restaurant',
  isAiAssistantPaid:
    loadString('restaurant_os_ai_paid') === 'true' || loadString('restaurant_os_registered') === 'true',

  setAiAssistantPaid: (paid) => {
    saveString('restaurant_os_ai_paid', paid ? 'true' : 'false');
    set({ isAiAssistantPaid: paid });
  },

  setLanguage: (lang) => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    get().playSound('slide');
    set({ language: lang });
  },

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    saveString('restaurant_os_theme', theme);
    get().playSound('tap');
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setActiveModule: (mod) => {
    get().playSound('tap');
    set({ activeModule: mod });
  },

  toggleSidebar: () => {
    get().playSound('pop');
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSoundEnabled: (enabled) => {
    soundEngine.setMuted(!enabled);
    set({ soundEnabled: enabled });
    if (enabled) {
      get().playSound('tap');
    }
  },

  setSoundVolume: (vol) => {
    soundEngine.setVolume(vol);
    set({ soundVolume: vol });
  },

  setSearchOpen: (open) => {
    if (open) get().playSound('click');
    set({ searchOpen: open });
  },

  setTourOpen: (open) => {
    if (open) get().playSound('pop');
    set({ tourOpen: open });
  },

  setIsOnline: (online) => {
    set({ isOnline: online });
  },

  setActiveUser: (user) => {
    set({ activeUser: user });
  },

  setWeather: (weather) => {
    set({ weather });
  },

  playSound: (sound) => {
    const { soundEnabled } = get();
    if (soundEnabled) {
      soundEngine.play(sound);
    }
  },

  lockApp: () => {
    get().playSound('delete');
    set({ isLocked: true });
  },

  unlockApp: (user) => {
    get().playSound('success');
    set({ isLocked: false, activeUser: user });
  },

  setAppMode: (mode) => {
    get().playSound('kitchen-bell');
    set({ appMode: mode });
  },

  setRegistered: (registered) => {
    if (registered) {
      saveString('restaurant_os_registered', 'true');
    } else {
      removeKey('restaurant_os_registered');
    }
    set({ isRegistered: registered });
  },

  resetAccount: () => {
    removeKey('restaurant_os_registered');
    removeKey('restaurant_os_account');
    removeKey('restaurant_os_master_pin');
    get().playSound('delete');
    set({ isRegistered: false, isLocked: false });
  },
}));
