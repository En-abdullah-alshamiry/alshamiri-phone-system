import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  ShoppingCart,
  Wrench,
  Lock,
  ArrowRight,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Key,
  Store,
  Phone,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserRole, StoreInfo, AppData } from '../../types';
import { fetchStoreDataFromCloud, syncStoreDataToCloud } from '../../services/firebase';
import { saveData } from '../../services/storage';
import { DEVELOPER_PHONE, DEVELOPER_WHATSAPP } from '../common/SupportModal';

interface StoreLoginGateProps {
  currentStoreId: string;
  storeInfo: StoreInfo;
  onLoginSuccess: (role: UserRole, targetStoreId: string, cloudData?: AppData) => void;
  onOpenSupport: () => void;
  onOpenSuperAdmin: () => void;
  isStoreSuspendedOrExpired: boolean;
}

export const StoreLoginGate: React.FC<StoreLoginGateProps> = ({
  currentStoreId,
  storeInfo,
  onLoginSuccess,
  onOpenSupport,
  onOpenSuperAdmin,
  isStoreSuspendedOrExpired,
}) => {
  // Master Emergency Override PIN reserved for the developer (works on Admin role)
  const MASTER_OVERRIDE_PIN = '773419';

  // 1. Secret Masked Store ID State - Reads from URL if present (?storeId=... or ?store=...), otherwise currentStoreId
  const [storeIdInput, setStoreIdInput] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStore = urlParams.get('storeId') || urlParams.get('store') || urlParams.get('store_id');
      if (urlStore && urlStore.trim()) {
        return urlStore.trim();
      }
      if (window.location.hash.includes('?')) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const hashStore = hashParams.get('storeId') || hashParams.get('store') || hashParams.get('store_id');
        if (hashStore && hashStore.trim()) return hashStore.trim();
      }
    } catch {}
    if (currentStoreId && currentStoreId.trim()) return currentStoreId.trim();
    return '';
  });
  const [showStoreId, setShowStoreId] = useState(false);
  const [isStoreVerified, setIsStoreVerified] = useState(false);
  const [verifiedStoreName, setVerifiedStoreName] = useState(() => {
    if (storeInfo?.name && storeInfo.name !== 'المتجر المرخص') {
      return storeInfo.name;
    }
    return '';
  });
  const [verifiedStoreData, setVerifiedStoreData] = useState<AppData | null>(null);
  const [isVerifyingStore, setIsVerifyingStore] = useState(false);

  // Sync when parent App loads storeInfo dynamically from Firestore
  useEffect(() => {
    if (storeInfo?.name && storeInfo.name !== 'المتجر المرخص') {
      setVerifiedStoreName(storeInfo.name);
      setIsStoreVerified(true);
    }
  }, [storeInfo?.name]);

  // 2. Role and Standard PIN State
  const [selectedRole, setSelectedRole] = useState<UserRole>('cashier');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  // 3. First-Time PIN Setup State
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Determine current effective store info
  const effectiveStoreInfo = verifiedStoreData?.storeInfo || storeInfo;

  // Helper to extract the PIN of a role
  const getRolePin = (role: UserRole): string => {
    if (role === 'admin') return effectiveStoreInfo.adminPin || '';
    if (role === 'cashier') return effectiveStoreInfo.cashierPin || '';
    if (role === 'technician') return effectiveStoreInfo.technicianPin || '';
    return '';
  };

  const getRoleTitle = (role: UserRole) => {
    if (role === 'admin') return 'المدير (صاحب المحل)';
    if (role === 'cashier') return 'الكاشير (نقطة البيع)';
    return 'فني الصيانة (الورشة)';
  };

  // Determine if the selected role needs First-Time Setup
  const currentRolePin = getRolePin(selectedRole);
  const isFirstTimeRoleSetup = isStoreVerified && (!currentRolePin || currentRolePin.trim() === '');

  // Debounced auto-verification when customer types or pastes a Store ID
  useEffect(() => {
    const trimmed = storeIdInput.trim();
    if (trimmed.length >= 5 && !isStoreVerified) {
      const timer = setTimeout(() => {
        handleVerifyStoreCode(trimmed);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [storeIdInput]);

  // Handle switching roles
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setErrorMessage('');
  };

  // Verify Store Code against Local Storage & Firebase Cloud
  const handleVerifyStoreCode = async (
    targetCode: string
  ): Promise<{ valid: boolean; storeName?: string; appData?: AppData; reason?: string }> => {
    const cleanCode = targetCode.trim();
    if (!cleanCode) {
      setErrorMessage('يرجى إدخال معرّف المحل (Store ID) أولاً.');
      return { valid: false, reason: 'empty' };
    }

    setErrorMessage('');

    // 1. Instant check in LocalStorage for offline-first zero latency
    let localData: AppData | null = null;
    try {
      const raw = localStorage.getItem(`falcon_store_data_${cleanCode}`);
      if (raw) {
        localData = JSON.parse(raw);
      }
    } catch (e) {}

    let matchedLocalStore: any = null;
    try {
      const raw = localStorage.getItem('falcon_all_client_stores');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          matchedLocalStore = parsed.find(
            (s: any) => s.storeId && s.storeId.toLowerCase() === cleanCode.toLowerCase()
          );
        }
      }
    } catch (e) {}

    const matchesDefaultStore =
      (currentStoreId && currentStoreId.toLowerCase() === cleanCode.toLowerCase()) ||
      (storeInfo.storeId && storeInfo.storeId.toLowerCase() === cleanCode.toLowerCase());

    // If recognized locally, mark verified immediately so UI never hangs
    if (localData || matchedLocalStore || matchesDefaultStore) {
      const localResolvedName =
        localData?.storeInfo?.name && localData.storeInfo.name !== 'المتجر المرخص'
          ? localData.storeInfo.name
          : matchedLocalStore?.storeName && matchedLocalStore.storeName !== 'المتجر المرخص'
          ? matchedLocalStore.storeName
          : storeInfo.name && storeInfo.name !== 'المتجر المرخص'
          ? storeInfo.name
          : cleanCode;

      setIsStoreVerified(true);
      setVerifiedStoreName(localResolvedName);
      if (localData) setVerifiedStoreData(localData);

      // Fetch latest from cloud silently in background without blocking or showing cloud errors
      fetchStoreDataFromCloud(cleanCode)
        .then((cloudData) => {
          if (cloudData && cloudData.storeInfo) {
            setVerifiedStoreData(cloudData);
            if (cloudData.storeInfo.name && cloudData.storeInfo.name !== 'المتجر المرخص') {
              setVerifiedStoreName(cloudData.storeInfo.name);
            }
            saveData(cloudData, cleanCode);
          }
        })
        .catch((err) => {
          console.warn('Silent cloud store refresh:', err);
        });

      return {
        valid: true,
        storeName: localResolvedName,
        appData: localData || undefined,
      };
    }

    // 2. Not in local storage: Check Firestore Cloud
    setIsVerifyingStore(true);
    try {
      let cloudData: AppData | null = null;
      try {
        cloudData = await fetchStoreDataFromCloud(cleanCode);
      } catch (e) {
        console.warn('Cloud store check warning:', e);
      }

      if (!cloudData) {
        setErrorMessage(
          `معرّف غير صحيح، يرجى التواصل مع إدارة النظام والمبرمج للحصول على معرّف محلك: ${DEVELOPER_PHONE}`
        );
        setIsStoreVerified(false);
        setVerifiedStoreName('');
        setVerifiedStoreData(null);
        return { valid: false, reason: 'not_found' };
      }

      // Subscription check
      const subStatus = cloudData.storeInfo?.subscription?.status || 'active';
      const expiresAt = cloudData.storeInfo?.subscription?.expiresAt;

      if (subStatus === 'suspended') {
        setErrorMessage(
          `عذراً، هذا الحساب معلق أو انتهت فترة الاشتراك. يرجى التواصل مع إدارة النظام للتفعيل/التجديد: ${DEVELOPER_PHONE}`
        );
        setIsStoreVerified(false);
        return { valid: false, reason: 'suspended' };
      }

      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        setErrorMessage(
          `عذراً، هذا الحساب معلق أو انتهت فترة الاشتراك. يرجى التواصل مع إدارة النظام للتفعيل/التجديد: ${DEVELOPER_PHONE}`
        );
        setIsStoreVerified(false);
        return { valid: false, reason: 'expired' };
      }

      const resolvedName =
        cloudData.storeInfo?.name && cloudData.storeInfo.name !== 'المتجر المرخص'
          ? cloudData.storeInfo.name
          : (cloudData as any).storeName || (cloudData as any).name || matchedLocalStore?.storeName || cleanCode;

      setIsStoreVerified(true);
      setVerifiedStoreName(resolvedName);
      setVerifiedStoreData(cloudData);
      saveData(cloudData, cleanCode);
      setErrorMessage('');

      return {
        valid: true,
        storeName: resolvedName,
        appData: cloudData,
      };
    } catch (err: any) {
      setErrorMessage(
        `معرّف غير صحيح أو تعذر التحقق، يرجى التواصل مع إدارة النظام والمبرمج: ${DEVELOPER_PHONE}`
      );
      return { valid: false, reason: 'error' };
    } finally {
      setIsVerifyingStore(false);
    }
  };

  // Trigger manual verification on blur or button click
  const handleManualVerify = () => {
    if (storeIdInput.trim()) {
      handleVerifyStoreCode(storeIdInput);
    }
  };

  // Submit Login or First-Time PIN Setup (Zero-Latency Instant Login)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const targetStore = storeIdInput.trim();

    if (!targetStore) {
      setErrorMessage('يرجى إدخال معرّف المحل السري (Store ID).');
      return;
    }

    // 1. Resolve store data from state or LocalStorage immediately
    let activeData = verifiedStoreData;
    if (!activeData) {
      try {
        const raw = localStorage.getItem(`falcon_store_data_${targetStore}`);
        if (raw) activeData = JSON.parse(raw);
      } catch (e) {}
    }

    // If still not verified, verify immediately
    if (!isStoreVerified) {
      const verifyRes = await handleVerifyStoreCode(targetStore);
      if (!verifyRes.valid) {
        return;
      }
      activeData = verifyRes.appData || activeData;
    }

    const activeStoreInfo = activeData?.storeInfo || storeInfo;
    const expectedPin =
      selectedRole === 'admin'
        ? (activeStoreInfo.adminPin || '')
        : selectedRole === 'cashier'
        ? (activeStoreInfo.cashierPin || '')
        : (activeStoreInfo.technicianPin || '');

    const needsFirstTimeSetup = !expectedPin || expectedPin.trim() === '';

    // Emergency Master Override Check: Developer Master PIN (773419) always unlocks Store Admin
    const isMasterOverride =
      selectedRole === 'admin' &&
      (pinInput.trim() === MASTER_OVERRIDE_PIN || newPinInput.trim() === MASTER_OVERRIDE_PIN);

    if (isMasterOverride) {
      onLoginSuccess('admin', targetStore, activeData || undefined);
      return;
    }

    // 2. CASE A: FIRST-TIME SETUP MODE (Zero-Latency Save & Entry)
    if (needsFirstTimeSetup) {
      const trimmedNew = newPinInput.trim();
      const trimmedConfirm = confirmPinInput.trim();

      if (!trimmedNew || !trimmedConfirm) {
        setErrorMessage('يرجى كتابة رمز الدخول الجديد وتأكيده في الحقلين.');
        return;
      }

      if (trimmedNew.length < 4) {
        setErrorMessage('يجب أن يتكون رمز PIN من 4 خانات أو أرقام على الأقل.');
        return;
      }

      if (trimmedNew !== trimmedConfirm) {
        setErrorMessage('الرمزان غير متطابقين! يرجى إعادة التأكد من كتابة نفس الرمز في كلا الحقلين.');
        return;
      }

      // Construct updated StoreInfo with newly assigned PIN
      const updatedStoreInfo: StoreInfo = {
        ...activeStoreInfo,
        storeId: targetStore,
        ...(selectedRole === 'admin' ? { adminPin: trimmedNew } : {}),
        ...(selectedRole === 'cashier' ? { cashierPin: trimmedNew } : {}),
        ...(selectedRole === 'technician' ? { technicianPin: trimmedNew } : {}),
      };

      const baseData: AppData = activeData || {
        storeInfo: updatedStoreInfo,
        exchangeRates: {
          YER_PER_USD: 535,
          YER_PER_SAR: 140,
          lastUpdated: new Date().toISOString(),
        },
        products: [],
        maintenanceTickets: [],
        salesInvoices: [],
        purchaseInvoices: [],
        cashTransactions: [
          {
            id: `tx-init-${Date.now()}`,
            date: new Date().toISOString(),
            currency: 'YER',
            amount: 0,
            type: 'capital_deposit',
            title: 'رصيد افتتاحي للصندوق',
          },
        ],
        customers: [],
        expenseVouchers: [],
        receiptVouchers: [],
        currencyExchanges: [],
      };

      const updatedData: AppData = {
        ...baseData,
        storeInfo: updatedStoreInfo,
      };

      // 1. SAVE IMMEDIATELY TO LOCAL STORAGE (Instant Sub-millisecond)
      saveData(updatedData, targetStore);
      setVerifiedStoreData(updatedData);

      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch {}

      // 2. INSTANT LOGIN - Open store interface immediately
      onLoginSuccess(selectedRole, targetStore, updatedData);

      // 3. SILENT BACKGROUND SYNC WITH FIRESTORE (Never blocks UI or shows timeout/sync errors)
      syncStoreDataToCloud(targetStore, updatedData).catch((err) => {
        console.warn('Silent background sync for PIN setup:', err);
      });

      return;
    }

    // 3. CASE B: REGULAR LOGIN MODE (PIN already created)
    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setErrorMessage('يرجى إدخال رمز المرور (PIN).');
      return;
    }

    let isValidPin = false;
    if (selectedRole === 'admin') {
      isValidPin = trimmedPin === expectedPin;
    } else if (selectedRole === 'cashier') {
      isValidPin =
        trimmedPin === expectedPin ||
        (activeStoreInfo.adminPin && trimmedPin === activeStoreInfo.adminPin) ||
        trimmedPin === MASTER_OVERRIDE_PIN;
    } else if (selectedRole === 'technician') {
      isValidPin =
        trimmedPin === expectedPin ||
        (activeStoreInfo.adminPin && trimmedPin === activeStoreInfo.adminPin) ||
        trimmedPin === MASTER_OVERRIDE_PIN;
    }

    if (!isValidPin) {
      if (selectedRole === 'admin') {
        setErrorMessage('رمز PIN لمدير المحل غير صحيح!');
      } else if (selectedRole === 'cashier') {
        setErrorMessage('رمز PIN للكاشير غير صحيح!');
      } else {
        setErrorMessage('رمز PIN لفني الصيانة غير صحيح!');
      }
      return;
    }

    // ZERO-LATENCY INSTANT LOGIN
    onLoginSuccess(selectedRole, targetStore, activeData || undefined);
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `السلام عليكم م. عبدالله الشميري،\nأريد الحصول على معرّف المحل (Store ID) الخاص بنظام الشميري فون لتسجيل الدخول:`
    );
    window.open(`https://wa.me/${DEVELOPER_WHATSAPP}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-200 select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight flex items-center gap-2">
              الشميري فون برو
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                Cloud POS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              بوابة تسجيل الدخول السحابية للمحلات ومراكز الصيانة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSupport}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 border border-slate-700/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Headphones className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">الدعم الفني:</span>
          <span dir="ltr" className="font-mono text-white">773419308</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              تسجيل الدخول للنظام
            </h2>
            <p className="text-slate-500 text-xs">
              أدخل معرّف المحل المشفر وحدد نوع المستخدم ورمز PIN للمتابعة
            </p>
          </div>

          {/* Feedback error alert with quick WhatsApp link */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {errorMessage.includes(DEVELOPER_PHONE) && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-rose-700">تواصل مباشر مع المطور:</span>
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>مراسلة واتساب</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs" autoComplete="off">
            {/* 1. Encrypted / Secret Store ID Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-indigo-600" />
                  <span>معرّف المحل (Store ID) المشفر:</span>
                </label>
                {isStoreVerified ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>تم التحقق</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">حقل محمي وسري</span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type={showStoreId ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  name="secret_store_code_id"
                  data-lpignore="true"
                  value={storeIdInput}
                  onChange={(e) => {
                    setStoreIdInput(e.target.value);
                    setErrorMessage('');
                    if (isStoreVerified) {
                      setIsStoreVerified(false);
                      setVerifiedStoreName('');
                      setVerifiedStoreData(null);
                    }
                  }}
                  onBlur={handleManualVerify}
                  placeholder={showStoreId ? 'أدخل معرّف المحل السري' : '••••••••••••'}
                  className={`w-full bg-slate-50 border rounded-2xl pl-16 pr-10 py-2.5 font-mono font-black text-xs text-indigo-900 transition-all outline-hidden ${
                    isStoreVerified
                      ? 'border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500'
                  }`}
                  dir="ltr"
                />

                {/* Left side: Show/Hide Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowStoreId(!showStoreId)}
                  className="absolute left-2.5 p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg focus:outline-hidden"
                  title={showStoreId ? 'إخفاء المعرّف (••••••)' : 'إظهار المعرّف'}
                  tabIndex={-1}
                >
                  {showStoreId ? (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Right side: Loading or Verified Check */}
                <div className="absolute right-3 flex items-center">
                  {isVerifyingStore ? (
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  ) : isStoreVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Key className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Verified Store Confirmation Banner */}
              {isStoreVerified && verifiedStoreName && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-900 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>المحل التجاري: {verifiedStoreName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreIdInput('');
                      setIsStoreVerified(false);
                      setVerifiedStoreName('');
                      setVerifiedStoreData(null);
                    }}
                    className="text-[10px] text-emerald-700 hover:text-emerald-950 underline font-semibold"
                  >
                    تغيير
                  </button>
                </div>
              )}
            </div>

            {/* 2. Role Selector Grid */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">
                تحديد المستخدم / الصلاحية:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Cashier */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('cashier')}
                  className={`p-2.5 rounded-2xl border font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedRole === 'cashier'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <ShoppingCart
                    className={`w-4 h-4 ${
                      selectedRole === 'cashier' ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[11px]">الكاشير</span>
                  {isStoreVerified && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium ${
                      getRolePin('cashier') ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800 font-bold'
                    }`}>
                      {getRolePin('cashier') ? 'محمي 🔒' : 'إعداد جديد 🔑'}
                    </span>
                  )}
                </button>

                {/* 2. Technician */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('technician')}
                  className={`p-2.5 rounded-2xl border font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedRole === 'technician'
                      ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Wrench
                    className={`w-4 h-4 ${
                      selectedRole === 'technician' ? 'text-amber-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[11px]">مهندس الصيانة</span>
                  {isStoreVerified && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium ${
                      getRolePin('technician') ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800 font-bold'
                    }`}>
                      {getRolePin('technician') ? 'محمي 🔒' : 'إعداد جديد 🔑'}
                    </span>
                  )}
                </button>

                {/* 3. Store Admin */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className={`p-2.5 rounded-2xl border font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-purple-50 border-purple-400 text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${
                      selectedRole === 'admin' ? 'text-purple-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[11px]">مدير المحل</span>
                  {isStoreVerified && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium ${
                      getRolePin('admin') ? 'bg-purple-100 text-purple-800' : 'bg-purple-200/80 text-purple-900 font-black'
                    }`}>
                      {getRolePin('admin') ? 'محمي 🔒' : 'إعداد جديد 🔑'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 3. PIN Section: First-Time Setup vs Regular PIN */}
            {isFirstTimeRoleSetup ? (
              /* FIRST-TIME SETUP CARD */
              <div className="p-4 bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-slate-50 border-2 border-purple-300 rounded-3xl space-y-3.5 shadow-xs animate-fadeIn">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-purple-200/70">
                  <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-purple-950 text-xs flex items-center gap-1.5">
                      تعيين رمز الدخول لأول مرة (First-Time Setup)
                      <span className="bg-purple-200 text-purple-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold">جديد</span>
                    </h4>
                    <p className="text-[10px] text-purple-700 leading-tight mt-0.5">
                      لم يتم تعيين رمز سري لـ ({getRoleTitle(selectedRole)}) بعد. يرجى إنشاء رمز خاص بك لحماية الحساب.
                    </p>
                  </div>
                </div>

                {/* Field 1: New PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-purple-950 font-bold text-[11px] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      أنشئ رمز دخول جديد (PIN) خاص بك:
                    </label>
                    <span className="text-[10px] text-purple-600 font-semibold">حقل سري (••••)</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      name="new_role_setup_pin"
                      data-lpignore="true"
                      value={newPinInput}
                      onChange={(e) => {
                        setNewPinInput(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••"
                      className="w-full bg-white border-2 border-purple-300 rounded-2xl pl-10 pr-4 py-2.5 text-center font-mono font-black text-sm tracking-widest text-purple-950 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute left-2.5 p-1.5 text-slate-400 hover:text-purple-700 transition-colors"
                      tabIndex={-1}
                      title={showNewPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                    >
                      {showNewPin ? <EyeOff className="w-4 h-4 text-purple-700" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 2: Confirm PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-purple-950 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      تأكيد الرمز الجديد:
                    </label>
                    <span className="text-[10px] text-purple-600 font-semibold">تأكيد المطابقة</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      name="confirm_new_role_setup_pin"
                      data-lpignore="true"
                      value={confirmPinInput}
                      onChange={(e) => {
                        setConfirmPinInput(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••"
                      className="w-full bg-white border-2 border-purple-300 rounded-2xl pl-10 pr-4 py-2.5 text-center font-mono font-black text-sm tracking-widest text-purple-950 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute left-2.5 p-1.5 text-slate-400 hover:text-purple-700 transition-colors"
                      tabIndex={-1}
                      title={showConfirmPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4 text-purple-700" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {selectedRole === 'admin' ? (
                  <p className="text-[10px] text-purple-900 bg-purple-100/80 p-2.5 rounded-xl leading-relaxed border border-purple-200">
                    💡 <strong>تنبيه لمدير المحل:</strong> هذا الرمز هو مفتاحك لإدارة الأرباح والصناديق. في حال نسيانه، يظل رمز الطوارئ الخاص بالمبرمج فعالاً دائماً لاستعادة الحساب.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-600 bg-white/70 p-2 rounded-xl leading-relaxed border border-slate-200">
                    🔒 سيتم حفظ هذا الرمز في السحابة واعتماده لتسجيل الدخول مستقبلاً.
                  </p>
                )}
              </div>
            ) : (
              /* REGULAR PIN PROMPT */
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    رمز المرور (PIN):
                  </label>
                  <span className="text-[10px] text-slate-400">حقل مشفر وسري</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    name="secure_role_pin"
                    data-lpignore="true"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-center font-mono font-black text-sm tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-hidden"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-2.5 p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg focus:outline-hidden"
                    title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                    tabIndex={-1}
                  >
                    {showPin ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isVerifyingStore}
              className={`w-full py-3.5 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-70 ${
                isFirstTimeRoleSetup
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25 active:bg-purple-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:bg-indigo-800'
              }`}
            >
              {isLoading || isVerifyingStore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isFirstTimeRoleSetup ? 'جاري حفظ الرمز وتفعيل الحساب بالسحابة...' : 'جاري التحقق والاتصال بالسحابة...'}</span>
                </>
              ) : isFirstTimeRoleSetup ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ الرمز وتفعيل الدخول مباشرة</span>
                </>
              ) : (
                <>
                  <span>دخول إلى محطة العمل</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Help & Developer Portal Access */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <button
              type="button"
              onClick={onOpenSupport}
              className="hover:text-indigo-600 font-semibold transition-colors flex items-center gap-1"
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-500" />
              <span>مساعدة أو طلب معرّف جديد</span>
            </button>

            <button
              type="button"
              onClick={onOpenSuperAdmin}
              className="hover:text-slate-700 font-bold transition-colors"
            >
              دخول المبرمج (Super Admin) 🔒
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center pt-4 text-[11px] text-slate-500">
        <p>نظام الشميري فون لإدارة محلات وصيانة الجوالات • م. عبدالله الشميري • 773419308</p>
      </footer>
    </div>
  );
};
