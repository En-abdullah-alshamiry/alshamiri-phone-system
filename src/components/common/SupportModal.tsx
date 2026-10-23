import React from 'react';
import {
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  X,
  Clock,
  Store,
  ExternalLink,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { AppData, StoreInfo } from '../../types';
import { formatDate } from '../../utils/formatters';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo: StoreInfo;
  currentStoreId: string;
  onOpenSuperAdmin?: () => void;
}

export const DEVELOPER_PHONE = '773419308';
export const DEVELOPER_WHATSAPP = '967773419308';
export const DEVELOPER_NAME = 'م. عبدالله الشميري';

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  storeInfo,
  currentStoreId,
  onOpenSuperAdmin,
}) => {
  if (!isOpen) return null;

  const subscription = storeInfo.subscription || {
    planName: 'باقة المحلات الاحترافية (سحابي)',
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    licensedDevices: 5,
  };

  const expiresDate = new Date(subscription.expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysRemaining <= 7;
  const isSuspendedOrExpired = subscription.status === 'suspended' || subscription.status === 'expired' || daysRemaining <= 0;

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `السلام عليكم م. عبدالله الشميري،\nأنا صاحب متجر (${storeInfo.name})، كود المحل: (${currentStoreId}).\nأحتاج إلى دعم فني / استفسار بخصوص النظام:`
    );
    window.open(`https://wa.me/${DEVELOPER_WHATSAPP}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/20 shadow-xs">
              <Headphones className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-2">
                الدعم الفني والصيانة المباشرة
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                خدمة العملاء والمساعدة التقنية وتجديد التراخيص
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
          {/* Warning banner if expiring soon or suspended */}
          {isSuspendedOrExpired ? (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-xs">تنبيه: اشتراك المحل معلق أو منتهي الصلاحية!</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  يرجى التواصل مع المبرمج فوراً لتجديد الترخيص وتفادي توقف الخدمة.
                </p>
              </div>
            </div>
          ) : isExpiringSoon ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-xs">تنبيه: اقترب موعد تجديد الترخيص ({daysRemaining} يوم متبقي)!</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  يرجى التواصل مع الدعم الفني لتجديد الاشتراك لضمان استمرار المزامنة السحابية.
                </p>
              </div>
            </div>
          ) : null}

          {/* Programmer Direct Contact Card */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  👨‍💻
                </div>
                <div>
                  <h4 className="font-black text-indigo-950 text-sm">{DEVELOPER_NAME}</h4>
                  <p className="text-[10px] text-slate-500">مطور ومهندس النظام الرئيسي</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                دعم مباشر متاح
              </span>
            </div>

            {/* Phone & WhatsApp Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${DEVELOPER_PHONE}`}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-indigo-600" />
                <span dir="ltr" className="font-mono">{DEVELOPER_PHONE}</span>
              </a>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-200" />
                <span>محادثة واتساب مباشرة</span>
              </button>
            </div>
          </div>

          {/* Current Store License Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              بيانات رخصة متجرك الحالي:
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">اسم المتجر:</span>
                <span className="font-bold text-slate-900">{storeInfo.name}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">معرّف المحل (Store ID):</span>
                <span className="font-mono font-bold text-indigo-700" dir="ltr">{currentStoreId}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">تاريخ التجديد / الانتهاء:</span>
                <span className="font-mono font-bold text-slate-800" dir="ltr">
                  {formatDate(subscription.expiresAt, false)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">المدة المتبقية:</span>
                <span className={`font-mono font-black text-sm ${daysRemaining <= 7 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {daysRemaining} يوم
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              فريق الدعم الفني جاهز لمساعدتكم في أي وقت
            </span>
            {onOpenSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSuperAdmin();
                }}
                className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold transition-colors"
                title="لوحة المطور"
              >
                • دخول المطور 🔒
              </button>
            )}
          </div>
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
