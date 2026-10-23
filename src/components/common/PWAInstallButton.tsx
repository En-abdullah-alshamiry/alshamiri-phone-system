import React, { useState } from 'react';
import { Download, Laptop, Smartphone, X, Check, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed as a standalone desktop app or mobile app, hide or show small badge
  if (isInstalled) {
    return (
      <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
        <Check className="w-3 h-3 text-emerald-600" />
        تطبيق مثبت
      </span>
    );
  }

  return (
    <>
      {/* Primary Install Trigger Button */}
      <button
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuideModal(true);
          }
        }}
        className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shadow-indigo-600/20"
        title="تثبيت النظام كتطبيق مستقل على اللابتوب أو الجوال بدون متصفح"
      >
        <Download className="w-3.5 h-3.5 text-indigo-200" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
      </button>

      {/* Installation Guide Modal (for iOS or manual desktop instructions) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                <Laptop className="w-5 h-5 text-indigo-600" />
                <span>طريقة تشغيل وتثبيت "الشميري فون" كتطبيق</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              يدعم هذا النظام التثبيت الفوري كـ <strong>تطبيق أصلي (PWA Desktop / Mobile)</strong> يعمل في نافذة مستقلة دون ظهور شريط المتصفح، مع سرعة فائقة وحفظ للبيانات أوفلاين.
            </p>

            {/* Instruction Tabs */}
            <div className="space-y-3">
              {/* Windows / Mac Laptop */}
              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 font-bold text-indigo-900 text-xs mb-1">
                  <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>على اللابتوب أو كمبيوتر المحل (Chrome / Edge):</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-1">
                  <li>اضغط على أيقونة التثبيت <strong>(⊕ أو Install)</strong> الموجودة في نهاية شريط الرابط بالأعلى.</li>
                  <li>أو افتح قائمة الخيارات (الثلاث نقاط) واختر <strong>"تثبيت التطبيق / Install App"</strong>.</li>
                  <li>سيظهر لك التطبيق فوراً على سطح المكتب وقائمة ابدأ مثل البرامج المثبتة تماماً.</li>
                </ol>
              </div>

              {/* Mobile Phone (Android & iOS) */}
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-2 font-bold text-sky-900 text-xs mb-1">
                  <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>على الجوال (أندرويد أو آيفون):</span>
                </div>
                <ul className="text-[11px] text-slate-700 space-y-1">
                  <li><strong>للآيفون (Safari):</strong> اضغط على زر المشاركة (Share ⎘) ثم اختر "إضافة إلى الشاشة الرئيسية (Add to Home Screen)".</li>
                  <li><strong>للأندرويد (Chrome):</strong> اضغط خيارات ثم "تثبيت التطبيق على الشاشة الرئيسية".</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
