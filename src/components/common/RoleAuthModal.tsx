import React, { useState } from 'react';
import {
  Shield,
  ShoppingCart,
  Wrench,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  X,
  UserCheck,
  Key,
} from 'lucide-react';
import { UserRole, StoreInfo } from '../../types';

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onChangeRole: (newRole: UserRole) => void;
  storeInfo: StoreInfo;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  storeInfo,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const MASTER_OVERRIDE_PIN = 'abdullah.com';
  let expectedAdminPin = storeInfo.adminPin || '';
  let expectedTechnicianPin = storeInfo.technicianPin || '';
  let expectedCashierPin = storeInfo.cashierPin || '';

  // Ensure fresh LocalStorage data is checked if prop has not re-rendered yet
  try {
    const activeStoreId = storeInfo.storeId || localStorage.getItem('falcon_active_store_id');
    if (activeStoreId) {
      const raw = localStorage.getItem(`falcon_store_data_${activeStoreId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.storeInfo) {
          if (parsed.storeInfo.adminPin) expectedAdminPin = parsed.storeInfo.adminPin;
          if (parsed.storeInfo.cashierPin) expectedCashierPin = parsed.storeInfo.cashierPin;
          if (parsed.storeInfo.technicianPin) expectedTechnicianPin = parsed.storeInfo.technicianPin;
        }
      }
    }
  } catch {}

  const handleApplyRole = (role: UserRole) => {
    const trimmedPin = pinInput.trim();
    if (role === 'admin') {
      // Master Override PIN: abdullah.com always works for Store Admin
      const isOverride = trimmedPin === MASTER_OVERRIDE_PIN;
      const isMatched = expectedAdminPin && trimmedPin === expectedAdminPin;
      
      if (isOverride || isMatched || (!expectedAdminPin && trimmedPin)) {
        onChangeRole('admin');
        setErrorMsg('');
        setPinInput('');
        onClose();
      } else {
        setErrorMsg(`رمز PIN لمدير المحل غير صحيح!`);
      }
    } else if (role === 'cashier') {
      const isMatched = (expectedCashierPin && trimmedPin === expectedCashierPin) || 
                        (expectedAdminPin && trimmedPin === expectedAdminPin) ||
                        trimmedPin === MASTER_OVERRIDE_PIN;
      if (isMatched || (!expectedCashierPin && !expectedAdminPin)) {
        onChangeRole('cashier');
        setErrorMsg('');
        setPinInput('');
        onClose();
      } else {
        setErrorMsg(`رمز PIN للكاشير غير صحيح!`);
      }
    } else if (role === 'technician') {
      const isMatched = (expectedTechnicianPin && trimmedPin === expectedTechnicianPin) || 
                        (expectedAdminPin && trimmedPin === expectedAdminPin) ||
                        trimmedPin === MASTER_OVERRIDE_PIN;
      if (isMatched || (!expectedTechnicianPin && !expectedAdminPin)) {
        onChangeRole('technician');
        setErrorMsg('');
        setPinInput('');
        onClose();
      } else {
        setErrorMsg(`رمز PIN لفني الصيانة غير صحيح!`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/20 shadow-xs">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-base">
                تحديد صلاحية ومستخدم المحل
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {storeInfo.name} • تسجيل الدخول بالصلاحية المناسبة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold text-[11px]">{errorMsg}</span>
            </div>
          )}

          {/* Role Selection Options */}
          <div className="space-y-2.5">
            {/* 1. Store Admin */}
            <div
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg('');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === 'admin'
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs block">
                      المالك / مدير المحل (Store Admin)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      كامل الصلاحيات (الأرباح، الصناديق، الإعدادات، والنسخ الاحتياطي)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-bold text-purple-700">يتطلب PIN</span>
                </div>
              </div>

              {/* PIN input when Admin is selected */}
              {selectedRole === 'admin' && (
                <div className="mt-3 pt-3 border-t border-purple-200/60 space-y-2">
                  <label className="block text-[11px] font-bold text-purple-950">
                    أدخل رمز PIN لمدير المحل:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-2 text-center font-mono font-black text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyRole('admin')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      تأكيد ودخول
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Cashier */}
            <div
              onClick={() => {
                if (selectedRole !== 'cashier') {
                  setSelectedRole('cashier');
                  setPinInput('');
                  setErrorMsg('');
                }
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === 'cashier'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs block">
                      الكاشير (Cashier)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      فواتير المبيعات، شراء المستعمل، ومقبوضات اليومية (محجوب عنه الأرباح والصناديق)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700">يتطلب PIN</span>
                </div>
              </div>

              {/* PIN input when Cashier is selected */}
              {selectedRole === 'cashier' && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2">
                  <label className="block text-[11px] font-bold text-emerald-950">
                    أدخل رمز PIN للكاشير:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-center font-mono font-black text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyRole('cashier')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      تأكيد ودخول
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Technician */}
            <div
              onClick={() => {
                if (selectedRole !== 'technician') {
                  setSelectedRole('technician');
                  setPinInput('');
                  setErrorMsg('');
                }
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === 'technician'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs block">
                      مهندس الصيانة (Technician)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      كروت الأجهزة، الفحص، وتغيير قطع الغيار (محجوب عنه المحاسبة والماليات)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700">يتطلب PIN</span>
                </div>
              </div>

              {/* PIN input when Technician is selected */}
              {selectedRole === 'technician' && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2">
                  <label className="block text-[11px] font-bold text-amber-950">
                    أدخل رمز PIN لمهندس الصيانة:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-center font-mono font-black text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyRole('technician')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      تأكيد ودخول
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            يمكن لمدير المحل تغيير رمز PIN من شاشة الإعدادات.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
