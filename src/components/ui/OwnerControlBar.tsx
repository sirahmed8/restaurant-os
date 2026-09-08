import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Building2,
  Store,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { updateService, AppReleaseInfo } from '../../services/updateService';

export const OwnerControlBar: React.FC = () => {
  const { appMode, setAppMode, activeUser, language, playSound } = useAppStore();

  const configuredOwnerEmail = (import.meta.env.VITE_OWNER_EMAIL || 'a7medorabe7@gmail.com').trim().toLowerCase();
  const isSuperOwner =
    activeUser?.email?.trim().toLowerCase() === configuredOwnerEmail ||
    activeUser?.id === 'usr_owner_super' ||
    (activeUser?.role as any) === 'admin';

  // If not super owner or admin, do not render switcher bar
  if (!isSuperOwner) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedMb, setDownloadedMb] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);

  const releaseInfo = updateService.getReleaseInfo();

  const handleStartUpdate = async () => {
    setIsDownloading(true);
    playSound('kitchen-bell');

    await updateService.downloadAndInstallUpdate((percent, mb) => {
      setDownloadProgress(percent);
      setDownloadedMb(mb);
    });

    setIsDownloading(false);
    setIsReadyToInstall(true);
    playSound('success');
  };

  const handleRunSetup = () => {
    playSound('click');
    updateService.launchSetupInstaller();
    alert(language === 'ar' ? 'تم بدء تشغيل مثبت التحديث بنجاح! سيتم تطبيق التحديثات فوراً.' : 'Launching setup installer!');
    setShowUpdateModal(false);
  };

  return (
    <>
      {/* Floating Mini Bar at Top-Center */}
      <div className="fixed top-2 start-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 hover:bg-slate-950/95 text-white backdrop-blur-xl border border-amber-500/40 shadow-2xl transition-all">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-500/30">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">مالك المنظومة (Super Owner)</span>
        </div>

        {/* Live Mode Switchers */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => {
              playSound('click');
              setAppMode('owner');
            }}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              appMode === 'owner'
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            👑 لوحة المالك (HQ)
          </button>

          <button
            onClick={() => {
              playSound('click');
              setAppMode('restaurant');
            }}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              appMode === 'restaurant'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            🏢 إدارة المطعم (Admin)
          </button>

          <button
            onClick={() => {
              playSound('click');
              setAppMode('customer');
            }}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              appMode === 'customer'
                ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            🍔 بوابة العميل (Foodie)
          </button>
        </div>

        {/* Update Notification Pill */}
        <button
          onClick={() => {
            playSound('pop');
            setShowUpdateModal(true);
          }}
          className="px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all animate-pulse"
          title="يتوفر تحديث جديد للمنظومة"
        >
          <Download className="w-3 h-3 text-emerald-400" />
          <span className="hidden md:inline">تحديث v1.1.0</span>
        </button>
      </div>

      {/* Auto-Update Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setShowUpdateModal(false)}
                className="absolute top-5 end-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {language === 'ar' ? 'يتوفر تحديث جديد للمنظومة: v1.1.0 Enterprise' : 'New System Update Available: v1.1.0'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'الإصدار الحالي: v1.0.0 • حجم التحديث: 86.4 MB' : 'Current: v1.0.0 • Update Size: 86.4 MB'}
                  </p>
                </div>
              </div>

              {/* Release Notes */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' ? 'أبرز مميزات الإصدار الجديد:' : 'Release Highlights:'}
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  {releaseInfo.releaseNotesAr.map((note, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download Progress Bar */}
              {isDownloading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>جاري تحميل حزمة التحديث...</span>
                    <span>{downloadProgress}% ({downloadedMb} MB / 86.4 MB)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-bold"
                >
                  تذكيري لاحقاً
                </button>

                {!isReadyToInstall ? (
                  <button
                    onClick={handleStartUpdate}
                    disabled={isDownloading}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'جاري التحميل...' : 'تحميل التحديث وتثبيته الآن 🚀'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRunSetup}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تشغيل المثبت وتطبيق التحديث فوراً 🎉</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
