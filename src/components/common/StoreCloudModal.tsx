import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Store,
  ShieldCheck,
  AlertTriangle,
  X,
  Share2,
  Check,
  Lock,
  Calendar,
} from 'lucide-react';
import { AppData, StoreInfo } from '../../types';
import { formatDate } from '../../utils/formatters';

interface StoreCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreId: string;
  data: AppData;
  onForceSync: () => Promise<void>;
  isSyncing: boolean;
  cloudConnected: boolean;
  onOpenMasterAdmin: () => void;
}

export const StoreCloudModal: React.FC<StoreCloudModalProps> = ({
  isOpen,
  onClose,
  currentStoreId,
  data,
  onForceSync,
  isSyncing,
  cloudConnected,
  onOpenMasterAdmin,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const subscription = data.storeInfo.subscription || {
    planName: 'باقة المحلات الاحترافية (سحابي)',
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    licensedDevices: 5,
  };

  const expiresDate = new Date(subscription.expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleCopyDirectLink = () => {
    const origin = window.location.origin;
    const directUrl = `${origin}?store=${encodeURIComponent(currentStoreId)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleManualSync = async () => {
    try {
      await onForceSync();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (e) {
      // handled
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/20 shadow-xs">
              <Cloud className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-base">
                حالة الربط السحابي والترخيص
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                مزامنة لحظية للبيانات بين أجهزة المحل وتأمينها في السحابة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {syncSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">
                تمت مزامنة جميع الفواتير والمخزون مع السحابة بنجاح!
              </span>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="font-black text-slate-800 text-sm">
                  {cloudConnected ? 'سحابة Firebase متصلة ونشطة' : 'جاري الاتصال بالسحابة...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                قاعدة البيانات السحابية معزولة ومؤمنة في Google Firestore
              </p>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'مزامنة...' : 'مزامنة الآن'}</span>
            </button>
          </div>

          {/* Store Info Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Store className="w-4 h-4 text-indigo-600" />
                المحل النشط:
              </span>
              <span className="font-black text-slate-900 text-sm">{data.storeInfo.name}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold">معرّف المحل السحابي (Store ID):</span>
              <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200" dir="ltr">
                {currentStoreId}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500">
                رابط تشغيل هذا المحل على أجهزة الكمبيوتر والجوال:
              </span>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>نسخ رابط المحل</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subscription & License Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                حالة ترخيص واشتراك المحل
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                مرخص ونشط ✓
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-slate-400 block text-[10px]">الباقة:</span>
                <span className="font-bold text-slate-800">{subscription.planName}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء:</span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">
                  {formatDate(subscription.expiresAt, false)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px]">الأيام المتبقية:</span>
                <span className="font-black text-indigo-700 font-mono text-sm">
                  {daysRemaining} يوم
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 pt-1 border-t border-indigo-100 flex items-center justify-between">
              <span>للتجديد أو الترقية: اتصل بالدعم الفني: 773419308</span>
              <span className="font-semibold text-indigo-700">مطور النظام: م. عبدالله الشميري</span>
            </p>
          </div>

          {/* Discreet Developer Entry Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMasterAdmin();
              }}
              className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>بوابة مطور النظام (Master Admin) 🔒</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            البيانات معزولة ومحمية ومحفوظة بنسخة احتياطية
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
