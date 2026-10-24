import React, { useState } from 'react';
import {
  Menu,
  TrendingUp,
  Wallet,
  PlusCircle,
  Wrench,
  ArrowRightLeft,
  DollarSign,
  Edit2,
  Check,
  Cloud,
  Shield,
  UserCheck,
  Headphones,
  LogOut,
} from 'lucide-react';
import { Currency, ExchangeRates, CashboxTransaction, UserRole, StoreInfo } from '../../types';
import { formatMoney } from '../../utils/formatters';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  exchangeRates: ExchangeRates;
  onUpdateRates: (rates: ExchangeRates) => void;
  cashTransactions: CashboxTransaction[];
  onOpenNewSale: () => void;
  onOpenNewMaintenance: () => void;
  onOpenExchangeModal: () => void;
  onOpenCloudModal?: () => void;
  cloudConnected?: boolean;
  currentStoreId?: string;
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onOpenRoleModal?: () => void;
  onOpenSupport?: () => void;
  onLockSession?: () => void;
  storeInfo?: StoreInfo;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  exchangeRates,
  onUpdateRates,
  cashTransactions,
  onOpenNewSale,
  onOpenNewMaintenance,
  onOpenExchangeModal,
  onOpenCloudModal,
  cloudConnected = true,
  currentStoreId,
  currentRole = 'admin',
  onChangeRole,
  onOpenRoleModal,
  onOpenSupport,
  onLockSession,
  storeInfo,
}) => {
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [tempUsd, setTempUsd] = useState(exchangeRates.YER_PER_USD.toString());
  const [tempSar, setTempSar] = useState(exchangeRates.YER_PER_SAR.toString());

  // Calculate live cashbox balance for each currency
  const getCashboxBalance = (curr: Currency) => {
    return cashTransactions
      .filter((tx) => tx.currency === curr)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const yerBalance = getCashboxBalance('YER');
  const sarBalance = getCashboxBalance('SAR');
  const usdBalance = getCashboxBalance('USD');

  const handleSaveRates = () => {
    const usd = parseFloat(tempUsd);
    const sar = parseFloat(tempSar);
    if (!isNaN(usd) && !isNaN(sar) && usd > 0 && sar > 0) {
      onUpdateRates({
        ...exchangeRates,
        YER_PER_USD: usd,
        YER_PER_SAR: sar,
        lastUpdated: new Date().toISOString(),
      });
      setIsEditingRates(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button, Brand & Currency Ticker */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name in Navbar */}
          <div className="flex items-center gap-2 font-black text-slate-900 tracking-tight text-sm sm:text-base">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              📱
            </div>
            <span className="font-black text-slate-900 truncate max-w-[200px]" title={storeInfo?.name || 'المتجر'}>
              {storeInfo?.name || (currentStoreId && currentStoreId !== 'store-shamiri-01' ? 'جاري التحميل...' : 'الشميري فون')}
            </span>
          </div>

          {/* Exchange Rates Live Widget */}
          <div className="bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-2xl p-1.5 px-3 flex items-center gap-3 text-xs transition-colors shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>أسعار الصرف:</span>
            </div>

            {isEditingRates ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono text-[11px]">$1 =</span>
                  <input
                    type="number"
                    value={tempUsd}
                    onChange={(e) => setTempUsd(e.target.value)}
                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500">ر.ي</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono text-[11px]">1 س =</span>
                  <input
                    type="number"
                    value={tempSar}
                    onChange={(e) => setTempSar(e.target.value)}
                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500">ر.ي</span>
                </div>
                <button
                  onClick={handleSaveRates}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-md text-xs flex items-center"
                  title="حفظ السعر"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempUsd(exchangeRates.YER_PER_USD.toString());
                  setTempSar(exchangeRates.YER_PER_SAR.toString());
                  setIsEditingRates(true);
                }}
                className="flex items-center gap-3 cursor-pointer group"
                title="اضغط للتعديل السريع لأسعار الصرف"
              >
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span className="text-blue-600">$1 =</span>
                  <span>{exchangeRates.YER_PER_USD}</span>
                  <span className="text-[10px] text-slate-500 font-normal">ر.ي</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span className="text-amber-600">1 س =</span>
                  <span>{exchangeRates.YER_PER_SAR}</span>
                  <span className="text-[10px] text-slate-500 font-normal">ر.ي</span>
                </div>
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cashbox Balances and Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Cashbox Balances: Visible for Admin and Cashier, strictly hidden for Technician */}
          {currentRole !== 'technician' ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl p-1 px-2.5">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold pl-1 border-l border-slate-200">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                الخزائن:
              </span>

              {/* YER */}
              <span
                className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 font-mono"
                title="خزينة الريال اليمني"
                dir="ltr"
              >
                {formatMoney(yerBalance, 'YER')}
              </span>

              {/* SAR */}
              <span
                className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 font-mono"
                title="خزينة الريال السعودي"
                dir="ltr"
              >
                {formatMoney(sarBalance, 'SAR')}
              </span>

              {/* USD */}
              <span
                className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80 font-mono"
                title="خزينة الدولار"
                dir="ltr"
              >
                {formatMoney(usdBalance, 'USD')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl p-1.5 px-3 text-xs">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>الخزينة محجوبة عن الفني 🔒</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* PWA Desktop & Mobile Install Button */}
            <PWAInstallButton />

            {/* User Role Button (clicking triggers RoleAuthModal with PIN verification) */}
            <button
              onClick={() => {
                if (onOpenRoleModal) {
                  onOpenRoleModal();
                } else {
                  setShowRoleMenu(!showRoleMenu);
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs border ${
                currentRole === 'admin'
                  ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  : currentRole === 'cashier'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="تغيير المستخدم أو إدخال PIN مدير المحل"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {currentRole === 'admin'
                  ? 'المدير 🛡️'
                  : currentRole === 'cashier'
                  ? 'كاشير 💵'
                  : 'فني صيانة 🔧'}
              </span>
            </button>

            {onOpenCloudModal && (
              <button
                onClick={onOpenCloudModal}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200/90 transition-all shadow-2xs"
                title="حالة السحابة وترخيص المحل"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline font-mono text-[10px] font-black">
                  {currentStoreId || 'السحابة'}
                </span>
              </button>
            )}

            {/* Support Button */}
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
                title="الدعم الفني المباشر وتجديد التراخيص (773419308)"
              >
                <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden lg:inline">الدعم الفني</span>
              </button>
            )}

            {/* Lock Session / Logout */}
            {onLockSession && (
              <button
                type="button"
                onClick={onLockSession}
                className="p-1.5 px-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl transition-all flex items-center gap-1 text-xs"
                title="قفل المحطة وتسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">خروج</span>
              </button>
            )}

            {/* Currency Exchange: Admin Only */}
            {currentRole === 'admin' && (
              <button
                onClick={onOpenExchangeModal}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 border border-slate-200 transition-all shadow-2xs"
                title="تحويل ومصارفة بين الصناديق"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">مصارفة</span>
              </button>
            )}

            {/* Reception of maintenance ticket: Admin, Cashier, Technician */}
            <button
              onClick={onOpenNewMaintenance}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>استلام جهاز</span>
            </button>

            {/* New Sale: Admin and Cashier only (hidden from technician) */}
            {currentRole !== 'technician' && (
              <button
                onClick={onOpenNewSale}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>فاتورة جديدة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
