import React, { useState } from 'react';
import {
  Settings,
  TrendingUp,
  Store,
  Database,
  Download,
  Upload,
  RefreshCw,
  Check,
  Calculator,
  Shield,
  FileCheck,
} from 'lucide-react';
import { AppData, ExchangeRates, StoreInfo } from '../../types';
import {
  exportBackupJSON,
  importBackupJSON,
  resetToDemoData,
  getLastBackupTimestamp,
  getDatabaseSizeKB,
  BackupPreviewStats,
  saveData,
} from '../../services/storage';
import { formatMoney, formatDate } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import { AlertCircle, X, Layers } from 'lucide-react';

interface SettingsViewProps {
  data: AppData;
  onUpdateRates: (rates: ExchangeRates) => void;
  onUpdateStoreInfo: (info: StoreInfo) => void;
  onDataLoaded: (freshData: AppData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateRates,
  onUpdateStoreInfo,
  onDataLoaded,
}) => {
  // Exchange Rates State
  const [yerPerUsd, setYerPerUsd] = useState(data.exchangeRates.YER_PER_USD.toString());
  const [yerPerSar, setYerPerSar] = useState(data.exchangeRates.YER_PER_SAR.toString());
  const [ratesSavedAlert, setRatesSavedAlert] = useState(false);

  // Quick Currency Calculator
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcFrom, setCalcFrom] = useState<'USD' | 'SAR' | 'YER'>('USD');

  // Store Profile State
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(data.storeInfo);
  const [infoSavedAlert, setInfoSavedAlert] = useState(false);

  React.useEffect(() => {
    setStoreInfo(data.storeInfo);
  }, [data.storeInfo]);

  // Backup & Import State
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => getLastBackupTimestamp());
  const [exportAlert, setExportAlert] = useState(false);
  const [importPreview, setImportPreview] = useState<BackupPreviewStats | null>(null);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(yerPerUsd);
    const sar = parseFloat(yerPerSar);
    if (!isNaN(usd) && !isNaN(sar) && usd > 0 && sar > 0) {
      onUpdateRates({
        YER_PER_USD: usd,
        YER_PER_SAR: sar,
        lastUpdated: new Date().toISOString(),
      });
      setRatesSavedAlert(true);
      setTimeout(() => setRatesSavedAlert(false), 3000);
    }
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreInfo(storeInfo);
    setInfoSavedAlert(true);
    setTimeout(() => setInfoSavedAlert(false), 3000);
  };

  // Export Database
  const handleExportDatabase = () => {
    const { filename } = exportBackupJSON(data);
    setLastBackupTime(new Date().toISOString());
    setExportAlert(true);
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}
    setTimeout(() => setExportAlert(false), 4000);
  };

  // Copy raw JSON to clipboard
  const handleCopyJSONToClipboard = () => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(jsonStr);
      alert('تم نسخ كود قاعدة البيانات JSON بالكامل إلى الحافظة بنجاح!');
    } catch (err) {
      alert('تعذر النسخ المباشر للحافظة، يمكنك استخدام زر التصدير والتنزيل.');
    }
  };

  // File selection for import
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const preview = await importBackupJSON(file);
      setImportPreview(preview);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    } catch (err: any) {
      alert(`تنبيه: فشل استيراد الملف: ${err.message || err}`);
      e.target.value = '';
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importPreview || !importPreview.data) return;

    saveData(importPreview.data);
    onDataLoaded(importPreview.data);
    setImportPreview(null);

    try {
      confetti({ particleCount: 50, spread: 70 });
    } catch {}

    alert('🎉 تم استيراد واستعادة قاعدة البيانات بنجاح، وتحديث جميع الجداول والحسابات في النظام!');
  };

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات للبيانات التجريبية الافتراضية؟ سيتم استبدال البيانات الحالية.')) {
      const fresh = resetToDemoData();
      onDataLoaded(fresh);
      alert('تمت استعادة البيانات التجريبية بنجاح!');
    }
  };

  // Calculator logic
  const usdRate = parseFloat(yerPerUsd) || data.exchangeRates.YER_PER_USD;
  const sarRate = parseFloat(yerPerSar) || data.exchangeRates.YER_PER_SAR;

  let calcResultYER = 0;
  let calcResultSAR = 0;
  let calcResultUSD = 0;

  if (calcFrom === 'USD') {
    calcResultUSD = calcAmount;
    calcResultYER = calcAmount * usdRate;
    calcResultSAR = sarRate > 0 ? (calcAmount * usdRate) / sarRate : 0;
  } else if (calcFrom === 'SAR') {
    calcResultSAR = calcAmount;
    calcResultYER = calcAmount * sarRate;
    calcResultUSD = usdRate > 0 ? (calcAmount * sarRate) / usdRate : 0;
  } else {
    calcResultYER = calcAmount;
    calcResultUSD = usdRate > 0 ? calcAmount / usdRate : 0;
    calcResultSAR = sarRate > 0 ? calcAmount / sarRate : 0;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              إعدادات النظام وأسعار الصرف والنسخ الاحتياطي
            </h1>
            <p className="text-xs text-slate-500">
              تحديث أسعار صرف العملات الثلاث، بيانات المتجر، وشروط فواتير الصيانة والضمان
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Exchange Rates Manager & Live Calculator */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              إعدادات أسعار صرف العملات مقابل الريال اليمني
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              آخر تحديث: {formatDate(data.exchangeRates.lastUpdated)}
            </span>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* USD Rate */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 space-y-1">
                <label className="block font-bold text-blue-900">
                  سعر صرف الدولار الأمريكي ($)
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 font-bold">$1 =</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={yerPerUsd}
                    onChange={(e) => setYerPerUsd(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-mono font-black text-blue-950 text-sm"
                    dir="ltr"
                  />
                  <span className="font-bold text-slate-600 text-xs">ريال يمني</span>
                </div>
              </div>

              {/* SAR Rate */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-1">
                <label className="block font-bold text-amber-900">
                  سعر صرف الريال السعودي (SAR)
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 font-bold">1 س =</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={yerPerSar}
                    onChange={(e) => setYerPerSar(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-mono font-black text-amber-950 text-sm"
                    dir="ltr"
                  />
                  <span className="font-bold text-slate-600 text-xs">ريال يمني</span>
                </div>
              </div>
            </div>

            {/* Cross Rate Display */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700">
              <span>السعر التبادلي المحتسب (دولار / سعودي):</span>
              <span className="font-mono font-bold text-indigo-700" dir="ltr">
                $1 = {sarRate > 0 ? (usdRate / sarRate).toFixed(2) : '0'} SAR
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              {ratesSavedAlert ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  تم حفظ أسعار الصرف بنجاح!
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">
                  تؤثر هذه الأسعار فوراً على التحويل في الفواتير وكروت الصيانة
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
              >
                حفظ أسعار الصرف
              </button>
            </div>
          </form>

          {/* Currency Live Conversion Simulator */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              حاسبة الصرف السريع
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={calcAmount || ''}
                onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                placeholder="المبلغ"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold text-xs"
                dir="ltr"
              />
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-xs"
              >
                <option value="USD">دولار أمريكي</option>
                <option value="SAR">ريال سعودي</option>
                <option value="YER">ريال يمني</option>
              </select>
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                <span className="text-[10px] text-indigo-700 font-medium">المعادل المالي:</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200" dir="ltr">
              <div className="text-emerald-800">
                <span className="block text-[10px] text-slate-400 font-sans">اليمني:</span>
                {formatMoney(calcResultYER, 'YER')}
              </div>
              <div className="text-amber-800">
                <span className="block text-[10px] text-slate-400 font-sans">السعودي:</span>
                {formatMoney(calcResultSAR, 'SAR')}
              </div>
              <div className="text-blue-800">
                <span className="block text-[10px] text-slate-400 font-sans">الدولار:</span>
                {formatMoney(calcResultUSD, 'USD')}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Backup, Restore & Database Security */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                تصدير واستيراد قاعدة البيانات (JSON Backup)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تصدير نسخة كاملة لملف JSON لضمان أمان البيانات واستعادتها لاحقاً في أي وقت.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>أمان البيانات 100%</span>
            </div>
          </div>

          {/* Database Health & Contents Badge */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">حجم البيانات التقديري:</span>
              <span className="font-mono font-bold text-slate-800">
                {getDatabaseSizeKB()} KB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">آخر تصدير تم حفظه:</span>
              <span className="font-mono font-bold text-slate-800">
                {lastBackupTime ? formatDate(lastBackupTime) : 'لم يتم التصدير بعد'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5 text-[10px]">
              <span className="bg-white px-2 py-0.5 rounded border text-slate-700">
                {data.products.length} أصناف
              </span>
              <span className="bg-white px-2 py-0.5 rounded border text-slate-700">
                {data.maintenanceTickets.length} صيانة
              </span>
              <span className="bg-white px-2 py-0.5 rounded border text-slate-700">
                {data.salesInvoices.length} فواتير بيع
              </span>
              <span className="bg-white px-2 py-0.5 rounded border text-slate-700">
                {data.cashTransactions.length} حركة صناديق
              </span>
              <span className="bg-white px-2 py-0.5 rounded border text-slate-700">
                {data.customers.length} عملاء
              </span>
            </div>
          </div>

          {/* Action Boxes */}
          <div className="space-y-3 text-xs">
            {/* 1. Export Action */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  تصدير قاعدة البيانات الحالية إلى ملف JSON
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  يقوم بتجهيز وتنزيل ملف JSON يحتوي على كافة الجداول، أسعار الصرف، وأرصدة الصناديق.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  تصدير وتنزيل JSON
                </button>
                <button
                  type="button"
                  onClick={handleCopyJSONToClipboard}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition-all"
                  title="نسخ كود الـ JSON للحافظة"
                >
                  <FileCheck className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Export Success Notification */}
            {exportAlert && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم تصدير ملف النسخة الاحتياطية بنجاح إلى مجلد التنزيلات!</span>
              </div>
            )}

            {/* 2. Import Action */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-700" />
                  استيراد قاعدة بيانات سابقة من ملف JSON
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  اختر ملف JSON محفوظ مسبقاً لمعاينته واستعادة كافة السجلات والحسابات.
                </p>
              </div>

              <div className="shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  اختيار ملف واستيراده
                </button>
              </div>
            </div>

            {/* 3. Reset To Demo */}
            <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-rose-950">إعادة تعيين للبيانات الافتراضية</p>
                <p className="text-[11px] text-rose-700">
                  إعادة تهيئة النظام بالبيانات النموذجية لأجهزة الصيانة والمخزون
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة ضبط
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Profile & Printing Header/Footer Settings */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-600" />
              بيانات متجر الهواتف وشروط الفواتير
            </h3>
            <p className="text-xs text-slate-500">
              تظهر هذه البيانات في ترويسة فواتير البيع وسندات كروت الصيانة وإقرارات الشراء
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveStoreInfo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم المتجر / المحل *</label>
              <input
                type="text"
                required
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الشعار والوصف التعريفي</label>
              <input
                type="text"
                value={storeInfo.subtitle}
                onChange={(e) => setStoreInfo({ ...storeInfo, subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم المسؤول / المالك</label>
              <input
                type="text"
                value={storeInfo.ownerName}
                onChange={(e) => setStoreInfo({ ...storeInfo, ownerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف 1 *</label>
              <input
                type="text"
                required
                value={storeInfo.phone}
                onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف 2</label>
              <input
                type="text"
                value={storeInfo.phone2 || ''}
                onChange={(e) => setStoreInfo({ ...storeInfo, phone2: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">العنوان والموقع</label>
              <input
                type="text"
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                شروط وضمانات كرت استقبال الصيانة (تطبع على سند الاستلام)
              </label>
              <textarea
                rows={3}
                value={storeInfo.maintenanceTerms}
                onChange={(e) => setStoreInfo({ ...storeInfo, maintenanceTerms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                شروط البيع والضمان (تطبع على فاتورة المبيعات)
              </label>
              <textarea
                rows={3}
                value={storeInfo.salesTerms}
                onChange={(e) => setStoreInfo({ ...storeInfo, salesTerms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {infoSavedAlert ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                تم حفظ بيانات المتجر بنجاح!
              </span>
            ) : (
              <span className="text-slate-400">احرص على تحديث بيانات الاتصال بدقة</span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
            >
              حفظ بيانات المتجر
            </button>
          </div>
        </form>
      </div>

      {/* PRE-IMPORT VERIFICATION & CONFIRMATION MODAL */}
      {importPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center">
                  <Database className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    معاينة محتويات النسخة الاحتياطية قبل الاستيراد
                  </h3>
                  <p className="text-xs text-slate-300">
                    تم التحقق من سلامة بنية ملف الـ JSON بنجاح
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Store & Date Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">اسم المتجر بالنسخة:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {importPreview.storeName || 'متجر الهواتف'}
                  </span>
                </div>
                {importPreview.exportedAt && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>تاريخ إنشاء النسخة:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">
                      {formatDate(importPreview.exportedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Data Entities Grid */}
              <div>
                <p className="font-bold text-slate-700 mb-2">إحصائيات السجلات التي ستتم استعادتها:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-[10px] text-slate-500">أصناف المخزون</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {importPreview.productsCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="block text-[10px] text-amber-700">كروت الصيانة</span>
                    <span className="text-base font-black text-amber-900 font-mono">
                      {importPreview.maintenanceTicketsCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="block text-[10px] text-emerald-700">فواتير المبيعات</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      {importPreview.salesInvoicesCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="block text-[10px] text-blue-700">فواتير الشراء</span>
                    <span className="text-base font-black text-blue-900 font-mono">
                      {importPreview.purchaseInvoicesCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <span className="block text-[10px] text-indigo-700">حركات الصناديق</span>
                    <span className="text-base font-black text-indigo-900 font-mono">
                      {importPreview.cashTransactionsCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                    <span className="block text-[10px] text-purple-700">حسابات العملاء</span>
                    <span className="text-base font-black text-purple-900 font-mono">
                      {importPreview.customersCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Callout */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>تنبيه:</strong> سيؤدي استيراد هذا الملف إلى استبدال قاعدة البيانات الحالية ببيانات النسخة المحددة لضمان تطابق القيود والأرصدة المحاسبية.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الاستيراد واستعادة البيانات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
