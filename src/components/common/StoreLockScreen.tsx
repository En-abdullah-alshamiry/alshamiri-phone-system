import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  MessageCircle,
  PhoneCall,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { StoreInfo } from '../../types';
import { DEVELOPER_PHONE, DEVELOPER_WHATSAPP, DEVELOPER_NAME } from './SupportModal';

interface StoreLockScreenProps {
  storeInfo: StoreInfo;
  currentStoreId: string;
  onOpenSuperAdmin: () => void;
}

export const StoreLockScreen: React.FC<StoreLockScreenProps> = ({
  storeInfo,
  currentStoreId,
  onOpenSuperAdmin,
}) => {
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  const handleWhatsAppRenew = () => {
    const text = encodeURIComponent(
      `السلام عليكم م. عبدالله الشميري،\nأنا صاحب متجر (${storeInfo.name})، كود المحل: (${currentStoreId}).\nظهرت لدي رسالة تعليق الاشتراك وأريد تجديد وسداد الترخيص فوراً:`
    );
    window.open(`https://wa.me/${DEVELOPER_WHATSAPP}?text=${text}`, '_blank');
  };

  const handleDeveloperUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'abdullah.com') {
      onOpenSuperAdmin();
      setShowPinPrompt(false);
      setPinInput('');
      setErrorMsg(false);
    } else {
      setErrorMsg(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 border border-slate-200">
        {/* Lock Icon */}
        <div className="w-20 h-20 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
          <Lock className="w-10 h-10" />
        </div>

        {/* Notice Message */}
        <div className="space-y-3">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-xs">
            تنبيه ترخيص النظام
          </span>
          <h2 className="text-lg sm:text-xl font-black text-rose-700 leading-snug">
            عذراً، هذا الحساب معلق أو انتهت فترة الاشتراك.
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed max-w-md mx-auto font-medium">
            يرجى التواصل مع إدارة النظام للتفعيل/التجديد:{' '}
            <strong className="text-indigo-700 font-mono font-black text-base inline-block px-2 py-0.5 bg-indigo-50 rounded-lg border border-indigo-200" dir="ltr">
              {DEVELOPER_PHONE}
            </strong>
          </p>
        </div>

        {/* Store badge */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">المتجر المطلوب:</span>
          <span className="font-bold text-slate-900">{storeInfo.name}</span>
          <span className="font-mono text-slate-500 text-[11px]" dir="ltr">({currentStoreId})</span>
        </div>

        {/* WhatsApp & Call Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleWhatsAppRenew}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <MessageCircle className="w-5 h-5 text-emerald-200" />
            <span>تواصل مع الدعم الفني عبر واتساب (773419308)</span>
          </button>

          <a
            href={`tel:${DEVELOPER_PHONE}`}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all text-xs"
          >
            <PhoneCall className="w-4 h-4 text-indigo-600" />
            <span>الاتصال هاتفياً بالمهندس: {DEVELOPER_NAME}</span>
          </a>
        </div>

        {/* Discreet Developer Unlock Modal/Prompt */}
        <div className="pt-3 border-t border-slate-100">
          {!showPinPrompt ? (
            <button
              type="button"
              onClick={() => setShowPinPrompt(true)}
              className="text-[11px] text-slate-400 hover:text-indigo-600 font-medium transition-colors"
            >
              دخول المطور والمبرمج لفك التعليق وتجديد الاشتراك 🔒
            </button>
          ) : (
            <form onSubmit={handleDeveloperUnlock} className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg(false);
                  }}
                  placeholder="Master PIN (abdullah.com)"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-xs font-mono font-black"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  فتح اللوحة
                </button>
              </div>
              {errorMsg && (
                <p className="text-rose-600 font-bold text-[10px]">
                  رمز المطور غير صحيح!
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
