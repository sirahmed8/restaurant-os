import React, { useState } from 'react';
import {
  Settings,
  Printer,
  Volume2,
  Tv,
  Cloud,
  Shield,
  Palette,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { getTranslation } from '../../i18n/translations';
import { SoundEffectName } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { SetupWizardModal } from '../ui/SetupWizardModal';

export const SettingsModule: React.FC = () => {
  const {
    language,
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    playSound,
  } = useAppStore();

  const t = getTranslation(language);
  const [printTestStatus, setPrintTestStatus] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const soundFxList: { id: SoundEffectName; name: string; nameEn: string; icon: string }[] = [
    { id: 'tap', name: 'نقرة خفيفة (Tap)', nameEn: 'Tactile Tap', icon: '👆' },
    { id: 'click', name: 'كبسة حاسمة (Click)', nameEn: 'Snap Click', icon: '🔘' },
    { id: 'pop', name: 'فقاعة مرحة (Pop)', nameEn: 'Bubbly Pop', icon: '🫧' },
    { id: 'success', name: 'نغمة النجاح والاعتماد (Success)', nameEn: 'Success Arpeggio', icon: '✨' },
    { id: 'kitchen-bell', name: 'جرس نداء المطبخ (Kitchen Bell)', nameEn: 'Resonant Chime', icon: '🔔' },
    { id: 'cash-register', name: 'صندوق الكاش والنقود (Cash Register)', nameEn: 'Cash & Coins', icon: '💰' },
    { id: 'alert', name: 'تنبيه تأخير أو خطأ (Alert)', nameEn: 'Warning Dual-Beep', icon: '⚠️' },
    { id: 'delete', name: 'حذف صنف (Delete)', nameEn: 'Tactile Drop', icon: '🗑️' },
    { id: 'whoosh', name: 'انتقال سلس (Whoosh)', nameEn: 'Air Sweep', icon: '💨' },
  ];

  const handleTestPrint = () => {
    playSound('kitchen-bell');
    setPrintTestStatus(true);
    setTimeout(() => setPrintTestStatus(false), 3000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>{t.module_settings}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar' ? 'تهيئة الطابعات الحرارية، المؤثرات الصوتية والربط السحابي' : 'Thermal printers, sound fx studio & cloud configuration'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsWizardOpen(true);
              playSound('tap');
            }}
            className="flex items-center gap-2 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/40 hover:bg-orange-600/30 text-xs font-bold"
          >
            <Wand2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'معالج الإعداد في 3 دقائق' : '3-Min Setup Wizard'}</span>
          </Button>
          <Badge variant="amber" size="sm">
            {t.versionInfo}
          </Badge>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-4 pe-1 custom-scrollbar">
        {/* Sound Studio Card */}
        <Card elevated className="border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.testSounds}</h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'استوديو اختبار الترددات الصوتية التفاعلية الفورية' : 'Instant synthesized Web Audio interactive soundboard'}
                </p>
              </div>
            </div>

            {/* Master Toggle & Volume */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant={soundEnabled ? 'success' : 'danger'}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="rounded-2xl text-xs font-bold"
              >
                {soundEnabled ? 'Audio Active (مفعّل)' : 'Muted (صامت)'}
              </Button>
            </div>
          </div>

          {/* Sound FX Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {soundFxList.map((sound) => (
              <button
                key={sound.id}
                onClick={() => playSound(sound.id)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-start transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{sound.icon}</span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                    {language === 'ar' ? sound.name : sound.nameEn}
                  </span>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>
            ))}
          </div>
        </Card>

        {/* Hardware & Printers Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card elevated>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.thermalPrinters}</h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'طابعات الفواتير وإيصالات تحضير المطبخ' : 'Receipt & station thermal printers'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Epson TM-T88VI (Cashier Main)</div>
                  <div className="text-[10px] text-slate-400">USB 001 • 80mm ESC/POS Auto-Cutter</div>
                </div>
                <Badge variant="emerald" size="sm" dot>
                  Online
                </Badge>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Kitchen Station Grill Printer</div>
                  <div className="text-[10px] text-slate-400">TCP/IP 192.168.1.180 • Port 9100</div>
                </div>
                <Badge variant="emerald" size="sm" dot>
                  Connected
                </Badge>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <Button
                size="sm"
                variant="amber"
                onClick={handleTestPrint}
                className="rounded-2xl text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'طباعة تذكرة تجريبية' : 'Print Test Slip'}</span>
              </Button>

              {printTestStatus && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'تم إرسال أمر الطباعة بنجاح' : 'Print payload dispatched'}
                </span>
              )}
            </div>
          </Card>

          {/* Cloudflare Tunnel & Cloud Sync */}
          <Card elevated>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.cloudTunnel}</h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'ربط آمن بدون فتح منافذ عبر Cloudflare Zero-Trust' : 'Secure egress tunnel with edge sync'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tunnel ID:</span>
                <span className="font-mono text-amber-400">rest-os-riyadh-01</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sync Latency:</span>
                <span className="font-mono text-emerald-400">18ms</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Database Replication:</span>
                <span className="text-emerald-400 font-bold">Active Bi-directional</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Offline Queue:</span>
                <span className="font-mono text-slate-400">0 pending transactions</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <Badge variant="emerald" size="sm" dot>
                {t.tunnelActive}
              </Badge>
              <Button size="sm" variant="secondary" className="rounded-2xl text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'فحص الاتصال' : 'Ping Edge'}</span>
              </Button>
            </div>
          </Card>

          {/* Security Shield & Hardware DNA Card */}
          <Card elevated className="md:col-span-2 border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-[#12161f] to-slate-950">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{language === 'ar' ? 'درع الحماية والأمن السيبراني (Security Shield)' : 'Cybersecurity Shield & Hardware DNA'}</span>
                    <Badge variant="emerald" size="sm">6 Layers Fortified</Badge>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'ar'
                      ? 'بصمة العتاد، تراخيص RSA-2048، حامي التوقيت والرجوع الزمني، والشفرات المائية'
                      : 'Hardware DNA, RSA-2048 Lic, Anti-Rollback Watchdog & Forensic Steganography'}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => useAppStore.getState().setActiveModule('security')}
                className="rounded-2xl text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90"
              >
                <span>{language === 'ar' ? 'فتح درع الحماية' : 'Open Security Shield'}</span>
              </Button>
            </div>
          </Card>

          {/* AI Copilot Subscription & Role Switcher Card */}
          <Card elevated className="md:col-span-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-[#12161f] to-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-black text-white">
                    {language === 'ar' ? 'باقة الذكاء الاصطناعي وتبديل الأدوار (AI & Role Switcher)' : 'AI Copilot & Role Switcher'}
                  </h3>
                  <Badge variant={useAppStore.getState().isAiAssistantPaid ? 'emerald' : 'amber'}>
                    {useAppStore.getState().isAiAssistantPaid ? (language === 'ar' ? 'مفعل للعملاء والموظفين ✅' : 'Active ✅') : (language === 'ar' ? 'غير مفعل' : 'Inactive')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  {language === 'ar'
                    ? 'التحكم في إتاحة المساعد الذكي للعملاء والكاشير، والتبديل السريع بين بيئة الإدارة، الكاشير وبوابة طلب الطعام للزبائن.'
                    : 'Enable AI Food Copilot for customers and cashiers, or switch between Admin, Cashier, and Customer Foodie views.'}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const current = useAppStore.getState().isAiAssistantPaid;
                    useAppStore.getState().setAiAssistantPaid(!current);
                    playSound('success');
                    alert(language === 'ar'
                      ? (!current ? 'تم تفعيل باقة الذكاء الاصطناعي للمطعم والعملاء بنجاح! 🎉' : 'تم تعطيل المساعد الذكي.')
                      : (!current ? 'AI Copilot Activated for Restaurant & Customers! 🎉' : 'AI Copilot Deactivated.'));
                  }}
                  className="rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{useAppStore.getState().isAiAssistantPaid ? (language === 'ar' ? 'إلغاء تفعيل الذكاء الاصطناعي' : 'Disable AI') : (language === 'ar' ? 'تفعيل اشتراك الذكاء الاصطناعي ⚡' : 'Activate AI Copilot ⚡')}</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    playSound('pop');
                    useAppStore.getState().setAppMode('customer');
                  }}
                  className="rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 text-xs font-bold"
                >
                  <span>{language === 'ar' ? 'معاينة بوابة العميل 🍔' : 'Customer View 🍔'}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Database Slate & Account Settings Card */}
          <Card elevated className="md:col-span-2 border-rose-500/20 bg-gradient-to-br from-rose-950/15 via-[#12161f] to-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>{language === 'ar' ? 'إدارة قاعدة البيانات وتهيئة الحساب' : 'Database & Account Management'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  {language === 'ar'
                    ? 'مسح جميع الأصناف والبيانات التجريبية للبدء بقاعدة بيانات نظيفة تماماً، أو تسجيل الخروج وإعادة إنشاء حساب منشأة جديد.'
                    : 'Wipe mock data to start with a 100% clean production slate, or reset account to setup a new restaurant profile.'}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (confirm(language === 'ar' ? 'هل أنت متأكد من مسح جميع الأصناف والبيانات التجريبية والبدء بصفحة نظيفة؟' : 'Wipe all mock items and start with a clean production slate?')) {
                      playSound('delete');
                      usePosStore.setState({
                        items: [],
                        cart: [],
                        categories: [
                          { id: 'all', name: 'الكل', nameEn: 'All', icon: 'Sparkles' },
                          { id: 'main', name: 'الأطباق الرئيسية', nameEn: 'Main Dishes', icon: 'Utensils' },
                          { id: 'drinks', name: 'المشروبات', nameEn: 'Drinks', icon: 'Coffee' },
                        ],
                      });
                      alert(language === 'ar' ? 'تم تنظيف قاعدة البيانات بنجاح! يمكنك الآن إضافة بيانات منيو ومخزن مطعمك الحقيقية.' : 'Database cleared! You can now add your real menu and inventory.');
                    }
                  }}
                  className="flex-1 sm:flex-initial rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'البدء بقاعدة بيانات نظيفة 100%' : 'Clean Slate Database'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(language === 'ar' ? 'هل تريد تسجيل الخروج وتغيير حساب المنشأة؟' : 'Log out and re-configure restaurant account?')) {
                      useAppStore.getState().resetAccount();
                    }
                  }}
                  className="flex-1 sm:flex-initial rounded-2xl text-xs font-bold"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج وإعادة التهيئة' : 'Reset / Switch Account'}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Software Updates & Auto-Installer Card */}
          <Card elevated className="md:col-span-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#12161f] to-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-black text-white">
                    {language === 'ar' ? 'تحديثات المنظومة وتثبيت الإصدارات (Auto-Updater)' : 'System Software Updates'}
                  </h3>
                  <Badge variant="emerald">v1.1.0 Ready</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  {language === 'ar'
                    ? 'الإصدار الحالي: v1.0.0 Enterprise 2026. يتوفر تحديث جديد يتضمن تحسينات الكاشير والشات بوت الذكي وبوابة العملاء.'
                    : 'Current Version: v1.0.0. A new update v1.1.0 is available with faster POS engine, AI copilot and customer app.'}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    playSound('kitchen-bell');
                    alert(language === 'ar' ? 'جاري بدء تحميل التحديث v1.1.0 وتشغيل ملف التثبيت Restaurant OS-Setup-1.0.0.exe...' : 'Starting update download & installer...');
                    const link = document.createElement('a');
                    link.href = '#';
                    link.setAttribute('download', 'Restaurant OS-Setup-1.0.0.exe');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  <span>{language === 'ar' ? 'تحميل وتثبيت التحديث الآن 🚀' : 'Download & Install Update 🚀'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <SetupWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  );
};

