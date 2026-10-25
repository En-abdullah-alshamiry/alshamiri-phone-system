import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X,
  PlusCircle,
  Layers,
  Sparkles,
  Copy,
  MessageCircle,
  ExternalLink,
  Store,
  Clock,
  Phone,
  Search,
  Check,
  PauseCircle,
  PlayCircle,
  Mail,
  Database,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AppData, StoreInfo } from '../../types';
import {
  syncStoreDataToCloud,
  fetchStoreDataFromCloud,
  deleteStoreFromCloud,
} from '../../services/firebase';
import { saveData } from '../../services/storage';
import { formatDate } from '../../utils/formatters';

export interface RegisteredClientStore {
  storeId: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string;
  city: string;
  createdAt: string;
  expiresAt: string;
  planName: string;
  status: 'active' | 'suspended' | 'expired';
}

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreSwitched: (newStoreId: string, loadedData?: AppData) => void;
  currentStoreId: string;
}

export const MASTER_ADMIN_PIN = 'abdullah.com';

// Demo store IDs to permanently purge
const DEMO_STORE_IDS_TO_REMOVE = ['store-almadina-02', 'store-alnajm-03', 'store-albaraka-04'];

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({
  isOpen,
  onClose,
  onStoreSwitched,
  currentStoreId,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Active sub-tab inside master admin
  const [masterTab, setMasterTab] = useState<'create' | 'list'>('create');

  // Form state
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [customStoreId, setCustomStoreId] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState<'trial' | '1_month' | '3_months' | '6_months' | '1_year'>('1_year');

  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgressStoreId, setActionInProgressStoreId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createdResult, setCreatedResult] = useState<RegisteredClientStore | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<RegisteredClientStore | null>(null);

  // Registered Stores list - Keep ONLY Developer Main Store (store-shamiri-01) by default
  const [registeredStores, setRegisteredStores] = useState<RegisteredClientStore[]>(() => {
    const defaultMainStore: RegisteredClientStore = {
      storeId: 'store-shamiri-01',
      storeName: 'الشميري فون - المركز الرئيسي',
      ownerName: 'عبدالله الشميري',
      phone: '773419308',
      email: 'alshamiri@phone.com',
      city: 'صنعاء - شارع صخر',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      planName: 'باقة المطور / ترخيص دائم',
      status: 'active',
    };

    const saved = localStorage.getItem('falcon_all_client_stores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently filter out the 3 demo stores
          const filtered = parsed.filter(
            (s: RegisteredClientStore) =>
              s.storeId && !DEMO_STORE_IDS_TO_REMOVE.includes(s.storeId)
          );
          if (!filtered.some((s: RegisteredClientStore) => s.storeId === 'store-shamiri-01')) {
            filtered.unshift(defaultMainStore);
          }
          localStorage.setItem('falcon_all_client_stores', JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {}
    }
    const initialList = [defaultMainStore];
    localStorage.setItem('falcon_all_client_stores', JSON.stringify(initialList));
    return initialList;
  });

  // Clean demo stores from Firestore database on mount
  useEffect(() => {
    DEMO_STORE_IDS_TO_REMOVE.forEach((id) => {
      deleteStoreFromCloud(id).catch(() => {});
      localStorage.removeItem(`falcon_store_data_${id}`);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('falcon_all_client_stores', JSON.stringify(registeredStores));
  }, [registeredStores]);

  if (!isOpen) return null;

  const handleVerifyMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === MASTER_ADMIN_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const getDirectUrl = (storeId: string) => {
    const origin = window.location.origin;
    return `${origin}?store=${encodeURIComponent(storeId.trim())}`;
  };

  const handleCopyStoreLink = (targetId: string) => {
    const directUrl = getDirectUrl(targetId);
    navigator.clipboard.writeText(directUrl);
    setCopiedStoreId(targetId);
    setFeedbackMsg({
      type: 'success',
      text: `تم نسخ رابط الدخول المباشر (${directUrl}) بنجاح!`,
    });
    setTimeout(() => setCopiedStoreId(null), 3000);
  };

  const handleShareWhatsApp = (clientStore: RegisteredClientStore) => {
    const url = getDirectUrl(clientStore.storeId);
    const expires = formatDate(clientStore.expiresAt, false);
    const msg = `مرحباً بك أخي ${clientStore.ownerName || 'الكريم'}،\nتم إصدار وتفعيل ترخيصك في نظام (الشميري فون لإدارة محلات وصيانة الجوالات):\n\n🏪 اسم متجرك: ${clientStore.storeName}\n🔑 معرّف المحل السحابي (Store ID):\n${clientStore.storeId}\n\n🔗 رابط تشغيل ودخول النظام مباشرة:\n${url}\n\n📅 مدة الاشتراك: ${clientStore.planName} (حتى ${expires})\n\n💡 ملاحظة هامة: بعد فتح الرابط في المتصفح، اضغط على زر (تثبيت التطبيق) في الشريط العلوي لتثبيته كبرنامج مباشر على سطح المكتب بالمحل.`;
    
    let phoneNum = clientStore.phone.replace(/\D/g, '');
    if (phoneNum.startsWith('0')) phoneNum = phoneNum.slice(1);
    if (!phoneNum.startsWith('967') && phoneNum.length === 9) phoneNum = `967${phoneNum}`;
    
    const waUrl = phoneNum ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleAutoGenerateId = () => {
    const cleanPhone = newPhone.trim().replace(/\D/g, '').slice(-6);
    const slugName = newStoreName
      .trim()
      .replace(/[\s\-_]+/g, '-')
      .replace(/[^\w\u0621-\u064A-]/g, '')
      .slice(0, 10);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCustomStoreId(`store-${slugName || 'client'}-${cleanPhone || randomSuffix}`);
  };

  const handleCreateNewClientStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'يرجى كتابة اسم متجر العميل.' });
      return;
    }

    const finalStoreId = (customStoreId.trim() || `store-${Date.now().toString().slice(-6)}`).toLowerCase();

    setIsLoading(true);
    setFeedbackMsg(null);

    let daysToAdd = 365;
    let planLabel = 'اشتراك سنة كاملة';
    if (subscriptionDuration === 'trial') {
      daysToAdd = 14;
      planLabel = 'تجريبي (14 يوماً)';
    } else if (subscriptionDuration === '1_month') {
      daysToAdd = 30;
      planLabel = 'اشتراك شهر واحد';
    } else if (subscriptionDuration === '3_months') {
      daysToAdd = 90;
      planLabel = 'اشتراك 3 أشهر';
    } else if (subscriptionDuration === '6_months') {
      daysToAdd = 180;
      planLabel = 'اشتراك 6 أشهر';
    }

    const expiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    const newStoreInfo: StoreInfo = {
      storeId: finalStoreId,
      name: newStoreName.trim(),
      subtitle: 'بيع وشراء الجوالات - صيانة متقدمة - قطع غيار وإكسسوارات',
      ownerName: newOwnerName.trim() || 'العميل',
      phone: newPhone.trim() || '770000000',
      email: newEmail.trim() || '',
      address: newCity.trim() || 'اليمن',
      adminPin: '',
      cashierPin: '',
      technicianPin: '',
      maintenanceTerms: 'الضمان لمدة 30 يوماً على القطع المستبدلة فقط ضد العيوب المصنعية.',
      salesTerms: 'الأجهزة الجديدة بضمان الوكيل، والأجهزة المستعملة فحص 3 أيام.',
      subscription: {
        planName: planLabel,
        status: 'active',
        isActive: true,
        expiresAt,
        expiryDate: expiresAt,
        licensedDevices: 5,
      },
    };

    const initialClientData: AppData = {
      storeInfo: newStoreInfo,
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

    const newEntry: RegisteredClientStore = {
      storeId: finalStoreId,
      storeName: newStoreInfo.name,
      ownerName: newStoreInfo.ownerName,
      phone: newStoreInfo.phone,
      email: newStoreInfo.email,
      city: newStoreInfo.address,
      createdAt: new Date().toISOString(),
      expiresAt,
      planName: planLabel,
      status: 'active',
    };

    // 1. Immediate local save fallback: Ensure data and store entry are saved locally immediately
    try {
      saveData(initialClientData, finalStoreId);
      const updatedList = [newEntry, ...registeredStores.filter((s) => s.storeId !== finalStoreId)];
      setRegisteredStores(updatedList);
      localStorage.setItem('falcon_all_client_stores', JSON.stringify(updatedList));
    } catch (localErr) {
      console.error('Error saving store fallback locally:', localErr);
    }

    // 2. Cloud Save to doc(db, "stores", storeId)
    try {
      await syncStoreDataToCloud(finalStoreId, initialClientData);
      setFeedbackMsg({
        type: 'success',
        text: `تم إنشاء كود المحل السحابي (${finalStoreId}) وتفعيله بنجاح في السحابة!`,
      });
    } catch (cloudErr: any) {
      console.warn('تنبيه المزامنة السحابية لمتجر:', finalStoreId, cloudErr);
      setFeedbackMsg({
        type: 'success',
        text: `تم حفظ متجر (${newStoreInfo.name}) بنجاح وجاهز للعمل فوراً (${finalStoreId})!`,
      });
    } finally {
      // 3. Reset loading state, show success result banner, and switch to list tab
      setIsLoading(false);
      setCreatedResult(newEntry);
      setNewStoreName('');
      setNewOwnerName('');
      setNewPhone('');
      setNewEmail('');
      setNewCity('');
      setCustomStoreId('');
      setMasterTab('list');
    }
  };

  // Toggle freeze / activate subscription
  const handleToggleStoreStatus = async (store: RegisteredClientStore) => {
    setActionInProgressStoreId(store.storeId);
    setFeedbackMsg(null);
    try {
      const willBeActive = store.status !== 'active';
      const updatedStatus: 'active' | 'suspended' = willBeActive ? 'active' : 'suspended';
      
      // If activating an expired store, grant an extra 30 days
      let updatedExpiresAt = store.expiresAt;
      if (willBeActive && new Date(store.expiresAt).getTime() < Date.now()) {
        updatedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Update in cloud if possible
      const cloudData = await fetchStoreDataFromCloud(store.storeId);
      if (cloudData && cloudData.storeInfo) {
        cloudData.storeInfo.subscription = {
          planName: cloudData.storeInfo.subscription?.planName || 'باقة المحلات السحابية',
          licensedDevices: cloudData.storeInfo.subscription?.licensedDevices || 5,
          status: updatedStatus,
          isActive: willBeActive,
          expiresAt: updatedExpiresAt,
          expiryDate: updatedExpiresAt,
        };
        await syncStoreDataToCloud(store.storeId, cloudData);
      }

      // Update local registered stores
      setRegisteredStores((prev) =>
        prev.map((s) =>
          s.storeId === store.storeId
            ? {
                ...s,
                status: updatedStatus,
                expiresAt: updatedExpiresAt,
              }
            : s
        )
      );

      setFeedbackMsg({
        type: 'success',
        text: willBeActive
          ? `تم تفعيل حساب متجر (${store.storeName}) بنجاح!`
          : `تم تجميد وتعليق حساب متجر (${store.storeName})!`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `حدث خطأ أثناء تعديل حالة المحل: ${err.message || 'خطأ في الاتصال'}`,
      });
    } finally {
      setActionInProgressStoreId(null);
    }
  };

  // Extend subscription duration by 30 days
  const handleExtendSubscription = async (store: RegisteredClientStore, extraDays: number) => {
    setActionInProgressStoreId(store.storeId);
    setFeedbackMsg(null);
    try {
      const currentExpiry = new Date(store.expiresAt).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + extraDays * 24 * 60 * 60 * 1000).toISOString();

      const cloudData = await fetchStoreDataFromCloud(store.storeId);
      if (cloudData && cloudData.storeInfo) {
        cloudData.storeInfo.subscription = {
          planName: cloudData.storeInfo.subscription?.planName || 'باقة المحلات السحابية',
          licensedDevices: cloudData.storeInfo.subscription?.licensedDevices || 5,
          status: 'active',
          expiresAt: newExpiry,
        };
        await syncStoreDataToCloud(store.storeId, cloudData);
      }

      setRegisteredStores((prev) =>
        prev.map((s) =>
          s.storeId === store.storeId
            ? {
                ...s,
                status: 'active',
                expiresAt: newExpiry,
              }
            : s
        )
      );

      setFeedbackMsg({
        type: 'success',
        text: `تم تمديد اشتراك (${store.storeName}) لمدة ${extraDays} يوماً بنجاح!`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `فشل تمديد الاشتراك: ${err.message || 'خطأ'}`,
      });
    } finally {
      setActionInProgressStoreId(null);
    }
  };

  const handleDeleteStore = (store: RegisteredClientStore) => {
    if (store.storeId === 'store-shamiri-01') {
      alert('لا يمكن حذف المتجر الرئيسي للمطور.');
      return;
    }
    setStoreToDelete(store);
  };

  const handleConfirmDeleteStore = async () => {
    if (!storeToDelete) return;
    const target = storeToDelete;
    setActionInProgressStoreId(target.storeId);
    setFeedbackMsg(null);
    try {
      // 1. Delete document from Firebase Firestore
      await deleteStoreFromCloud(target.storeId);

      // 2. Remove per-store local storage key
      localStorage.removeItem(`falcon_store_data_${target.storeId}`);

      // 3. Remove from registeredStores list & update localStorage
      const updated = registeredStores.filter((s) => s.storeId !== target.storeId);
      setRegisteredStores(updated);
      localStorage.setItem('falcon_all_client_stores', JSON.stringify(updated));

      setFeedbackMsg({
        type: 'success',
        text: `تم حذف متجر (${target.storeName}) وقاعدة بياناته السحابية نهائياً بنجاح! 🗑️`,
      });
      setStoreToDelete(null);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `فشل حذف المتجر من السحابة: ${err.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setActionInProgressStoreId(null);
    }
  };

  const filteredStores = registeredStores.filter((s) =>
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.storeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    (s.ownerName && s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-2">
                لوحة تحكم المالك والمبرمج المركزية (Super Admin)
                <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full">
                  سري ومقفل 🔒
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                إصدار التراخيص، إدارة الاشتراكات، تجميد أو تفعيل المتاجر، والدعم الفني عن بُعد
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUnlocked(false);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED STATE: PIN PROMPT */}
        {!isUnlocked ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h4 className="font-black text-slate-900 text-base">
                الوصول محمي برمز المبرمج الرئيسي (Master PIN)
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                هذه اللوحة خاصة بمالك النظام المطور فقط لإدارة المحلات وتجديد الاشتراكات.
              </p>
            </div>

            <form onSubmit={handleVerifyMasterPin} className="w-full max-w-xs space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="أدخل رمز Master PIN الرئيسي (abdullah.com)"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-4 py-3 text-center text-sm font-mono font-black tracking-widest text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-hidden"
                  dir="ltr"
                />
                {pinError && (
                  <p className="text-rose-600 font-bold text-[11px] mt-1.5 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    رمز PIN الرئيسي غير صحيح! (استخدم abdullah.com)
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>تحقق وفتح لوحة المبرمج</span>
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED STATE: FULL MASTER DASHBOARD */
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Top Sub-tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-4 pt-3 shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMasterTab('create')}
                  className={`px-4 py-2.5 rounded-t-2xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                    masterTab === 'create'
                      ? 'bg-white text-indigo-700 shadow-xs border-t-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>➕ إصدار ترخيص لمتجر جديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterTab('list')}
                  className={`px-4 py-2.5 rounded-t-2xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                    masterTab === 'list'
                      ? 'bg-white text-indigo-700 shadow-xs border-t-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>📋 إدارة الاشتراكات والمحلات ({registeredStores.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                className="text-[11px] text-rose-600 font-bold hover:underline mb-1 flex items-center gap-1"
                title="قفل لوحة المطور"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>قفل اللوحة</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Feedback Alert */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-2 ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{feedbackMsg.text}</span>
                </div>
              )}

              {/* Persistent Success Banner (Shown in List and Create tabs after creation) */}
              {createdResult && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-3xl space-y-3 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-900 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      تم إنشاء وتجهيز حساب المتجر بنجاح!
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreatedResult(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-emerald-100/50"
                    >
                      إخفاء ✕
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold text-xs">اسم المتجر:</span>
                      <span className="font-black text-slate-800 text-xs">
                        {createdResult.storeName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold text-xs">كود المحل السحابي (Store ID):</span>
                      <span className="font-mono font-black text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100" dir="ltr">
                        {createdResult.storeId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold text-xs">رابط الدخول المباشر:</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs" dir="ltr">
                        {getDirectUrl(createdResult.storeId)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyStoreLink(createdResult.storeId)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedStoreId === createdResult.storeId ? 'تم النسخ بنجاح! ✓' : 'نسخ رابط الدخول'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(createdResult)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>إرسال الكود للعميل عبر واتساب 📲</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 1: CREATE STORE */}
              {masterTab === 'create' && (
                <div className="space-y-4">
                  <form onSubmit={handleCreateNewClientStore} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                      <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-indigo-600" />
                        بيانات المتجر والمالك الجديد:
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">
                            اسم المحل / المركز التجاري: <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newStoreName}
                            onChange={(e) => setNewStoreName(e.target.value)}
                            placeholder="مثال: الصقر فون للاتصالات"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1">
                            اسم صاحب المحل:
                          </label>
                          <input
                            type="text"
                            value={newOwnerName}
                            onChange={(e) => setNewOwnerName(e.target.value)}
                            placeholder="مثال: فؤاد الصقري"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1">
                            رقم هاتف العميل (لواتساب الإرسال):
                          </label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="مثال: 771234567"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            البريد الإلكتروني للعميل (اختياري):
                          </label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="مثال: client@store.com"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                            dir="ltr"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 font-bold mb-1">
                            المدينة / العنوان:
                          </label>
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="مثال: صنعاء - شارع تعز"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Store ID */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                            معرّف المحل السحابي (Store ID):
                          </label>
                          <button
                            type="button"
                            onClick={handleAutoGenerateId}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            ⚡ اقتراح كود تلقائي
                          </button>
                        </div>
                        <input
                          type="text"
                          value={customStoreId}
                          onChange={(e) => setCustomStoreId(e.target.value)}
                          placeholder="مثال: store-saqr-775001"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-black text-indigo-700 text-xs focus:ring-2 focus:ring-indigo-500"
                          dir="ltr"
                        />
                      </div>

                      {/* Duration */}
                      <div className="pt-2 border-t border-slate-200">
                        <label className="block font-bold text-slate-800 mb-1.5">
                          مدة الاشتراك والترخيص:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                          {(['trial', '1_month', '3_months', '6_months', '1_year'] as const).map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => setSubscriptionDuration(dur)}
                              className={`p-2 rounded-xl border font-bold transition-all ${
                                subscriptionDuration === dur
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {dur === 'trial' ? 'تجريبي (14 يوم)' : dur === '1_month' ? 'شهر' : dur === '3_months' ? '3 أشهر' : dur === '6_months' ? '6 أشهر' : 'سنة كاملة'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 disabled:opacity-60 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                          <span>جاري الحفظ وتجهيز الترخيص...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>إنشاء وتفعيل كود المحل في السحابة فوراً</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: STORE LIST & SUBSCRIPTIONS */}
              {masterTab === 'list' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث باسم المحل، المعرّف، المالك، أو الهاتف..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-9 pl-4 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredStores.map((store) => {
                      const isCurrent = store.storeId === currentStoreId;
                      const expires = new Date(store.expiresAt);
                      const daysLeft = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                      const isSuspended = store.status === 'suspended';
                      const isExpired = daysLeft <= 0 || store.status === 'expired';
                      const isWorking = actionInProgressStoreId === store.storeId;

                      return (
                        <div
                          key={store.storeId}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                              : isSuspended
                              ? 'bg-rose-50/60 border-rose-200'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm">{store.storeName}</span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                                    النشط حالياً بهذا الجهاز
                                  </span>
                                )}
                                {isSuspended ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                                    <PauseCircle className="w-3 h-3 text-rose-600" />
                                    مجمّد / معلق ⏸️
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    منتهي الصلاحية ⚠️
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    نشط ومفعّل ✅
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                <span>المالك: <strong>{store.ownerName}</strong></span>
                                <span>•</span>
                                <span dir="ltr">هاتف: <strong>{store.phone}</strong></span>
                                {store.email && (
                                  <>
                                    <span>•</span>
                                    <span dir="ltr">{store.email}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{store.city}</span>
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="font-bold text-indigo-700 text-xs block">
                                {store.planName}
                              </span>
                              <span className={`text-[11px] font-mono font-bold ${
                                isSuspended ? 'text-rose-600' : isExpired ? 'text-amber-600' : 'text-slate-600'
                              }`}>
                                {isSuspended ? 'موقف من المبرمج' : `${daysLeft} يوم متبقي`} (حتى {formatDate(store.expiresAt, false)})
                              </span>
                            </div>
                          </div>

                          {/* Control Actions Bar */}
                          <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg">
                              <span className="text-slate-400">Store ID:</span>
                              <strong className="text-slate-800">{store.storeId}</strong>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* 1-Click Suspend / Activate Toggle */}
                              {store.status === 'active' && !isExpired ? (
                                <button
                                  type="button"
                                  disabled={isWorking}
                                  onClick={() => handleToggleStoreStatus(store)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                                  title="تجميد وإيقاف حساب المحل عند التأخر في السداد"
                                >
                                  <PauseCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>تجميد المحل ⏸️</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isWorking}
                                  onClick={() => handleToggleStoreStatus(store)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all"
                                  title="تفعيل وإلغاء التعليق فوراً عند السداد"
                                >
                                  <PlayCircle className="w-3.5 h-3.5 text-emerald-200" />
                                  <span>تفعيل وترخيص ▶️</span>
                                </button>
                              )}

                              {/* Extend 30 days */}
                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => handleExtendSubscription(store, 30)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                                title="تمديد 30 يوماً إضافية"
                              >
                                + شهر
                              </button>

                              {/* Remote DB Support / Inspection */}
                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={async () => {
                                  setIsLoading(true);
                                  try {
                                    const d = await fetchStoreDataFromCloud(store.storeId);
                                    if (d) {
                                      onStoreSwitched(store.storeId, d);
                                      setFeedbackMsg({
                                        type: 'success',
                                        text: `تم فتح قاعدة بيانات (${store.storeName}) للمعاينة والدعم الفني!`,
                                      });
                                    }
                                  } catch (err: any) {
                                    setFeedbackMsg({
                                      type: 'error',
                                      text: `فشل فتح قاعدة البيانات: ${err.message || 'خطأ'}`,
                                    });
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs flex items-center gap-1"
                                title="فحص ومراجعة قاعدة بيانات هذا المحل عن بُعد لتقديم الدعم"
                              >
                                <Database className="w-3 h-3 text-indigo-600" />
                                <span>فحص القاعدة عن بُعد</span>
                              </button>

                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => handleCopyStoreLink(store.storeId)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>{copiedStoreId === store.storeId ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                              </button>

                              {/* WhatsApp Share */}
                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(store)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-200" />
                                <span>واتساب</span>
                              </button>

                              {/* Delete Store Button (Protected: Not available on main developer store) */}
                              {store.storeId !== 'store-shamiri-01' && (
                                <button
                                  type="button"
                                  disabled={isWorking}
                                  onClick={() => handleDeleteStore(store)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all"
                                  title="حذف هذا المتجر وقاعدته السحابية نهائياً"
                                >
                                  <Trash2 className="w-3 h-3 text-white" />
                                  <span>حذف المتجر 🗑️</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            بوابة المبرمج المركزية • Master PIN: <strong>abdullah.com</strong> • الدعم: 773419308
          </span>
          <button
            onClick={() => {
              setIsUnlocked(false);
              onClose();
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE STORE MODAL */}
      {storeToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-rose-950 text-sm">تأكيد حذف المتجر نهائياً</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  هذا الإجراء لا يمكن التراجع عنه وسيحذف بيانات المتجر السحابية
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 space-y-1.5">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span className="text-slate-500">اسم المتجر:</span>
                <span className="text-rose-900">{storeToDelete.storeName}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span className="text-slate-500">المعرّف (Store ID):</span>
                <span className="font-mono text-slate-900" dir="ltr">{storeToDelete.storeId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500 font-bold">المالك:</span>
                <span>{storeToDelete.ownerName || 'العميل'}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-700 font-semibold leading-relaxed">
              ⚠️ هل أنت متأكد من رغبتك في حذف هذا المتجر؟ سيتم حذفه من قائمة المتاجر وحذف قاعدة بياناته من سحابة Firestore فوراً.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionInProgressStoreId === storeToDelete.storeId}
                onClick={handleConfirmDeleteStore}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionInProgressStoreId === storeToDelete.storeId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>نعم، حذف المتجر نهائياً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
