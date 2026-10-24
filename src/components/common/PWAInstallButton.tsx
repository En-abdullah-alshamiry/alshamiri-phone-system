import React, { useState } from 'react';
import {
  Download,
  Laptop,
  Smartphone,
  X,
  Check,
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Share2,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import confetti from 'canvas-confetti';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install, deferredPrompt } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Handle click on Install Button
  const handleInstallClick = async () => {
    // 1. If already installed, show notification and quick guide
    if (isInstalled) {
      setSuccessMessage('التطبيق مثبت بالفعل ويعمل كنافذة مستقلة على هذا الجهاز ✓');
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowGuideModal(true);
      return;
    }

    // 2. If deferredPrompt is available, trigger native browser install prompt directly
    if (isInstallable || deferredPrompt || (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt)) {
      setIsInstalling(true);
      try {
        const result = await install();
        if (result.success && result.outcome === 'accepted') {
          setSuccessMessage('تم تثبيت التطبيق بنجاح على جهازك');
          try {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setTimeout(() => setSuccessMessage(null), 6000);
        }
      } catch (err) {
        console.warn('Install error:', err);
        setShowGuideModal(true);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // 3. If browser does not emit beforeinstallprompt (iOS Safari, Firefox, or in-app browser), show elegant guide modal
    setShowGuideModal(true);
  };

  return (
    <>
      {/* Success Notification Banner / Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-600 rounded-lg text-emerald-200 hover:text-white mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Install Button in Header */}
      {isInstalled ? (
        <button
          onClick={() => setShowGuideModal(true)}
          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-all shadow-xs"
          title="التطبيق مثبت على جهازك"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">تطبيق مثبت ✓</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all border border-indigo-400/30"
          title="تثبيت النظام كتطبيق سطح المكتب أو الجوال"
        >
          <Download className="w-3.5 h-3.5 text-indigo-100 animate-pulse" />
          <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت التطبيق'}</span>
        </button>
      )}

      {/* Elegant Guide Modal for Browsers that do not support beforeinstallprompt or for manual installation */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-sm">
                    تثبيت النظام كبرنامج على سطح المكتب والجوال
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تشغيل مباشر بدون شريط المتصفح وبسرعة فائقة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Instruction Callout (Exact wording requested) */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-amber-950 leading-relaxed font-bold text-xs flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-slate-900 mb-0.5">خطوات التثبيت السريع:</p>
                <p className="text-[11.5px] text-slate-800 font-semibold leading-normal">
                  لتثبيت التطبيق كأيقونة على سطح المكتب: اضغط على خيارات المتصفح (⋮) في الأعلى ثم اختر 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.
                </p>
              </div>
            </div>

            {/* Platform-Specific Step-by-Step Cards */}
            <div className="space-y-2.5">
              {/* Desktop (Chrome / Edge) */}
              <div className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>1. على الكمبيوتر المكتبي أو اللابتوب (Chrome / Edge):</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 pr-6 leading-relaxed">
                  <p>• ابحث عن أيقونة التثبيت <strong>(⊕ أو Install App)</strong> في نهاية شريط عنوان الرابط (URL Bar).</p>
                  <p>• أو اضغط على النقاط الثلاث <strong>(⋮)</strong> في أعلى المتصفح واختر <strong>"تثبيت الشميري فون"</strong> أو <strong>"حفظ ومشاركة &gt; تثبيت التطبيق"</strong>.</p>
                  <p>• سيظهر لك النظام كأيقونة مستقلة على سطح المكتب وقائمة Start.</p>
                </div>
              </div>

              {/* Android Phone (Chrome) */}
              <div className="p-3 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-200 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>2. على هواتف أندرويد (Google Chrome):</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 pr-6 leading-relaxed">
                  <p>• اضغط على زر الخيارات <strong>(⋮)</strong> بأعلى يمين أو يسار المتصفح.</p>
                  <p>• اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية (Add to Home screen)"</strong>.</p>
                </div>
              </div>

              {/* iOS iPhone & iPad (Safari) */}
              <div className="p-3 bg-slate-50 hover:bg-sky-50/40 rounded-2xl border border-slate-200 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Share2 className="w-4 h-4 text-sky-600" />
                  <span>3. على هواتف آيفون وآيباد (Safari):</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 pr-6 leading-relaxed">
                  <p>• اضغط على زر <strong>المشاركة (Share ⎘)</strong> في أسفل شريط Safari.</p>
                  <p>• مرر للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong>.</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">PWA Desktop & Mobile Standalone v1.2</span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all text-xs"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
