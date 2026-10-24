import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Wrench,
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  Eye,
  DollarSign,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import {
  AppData,
  Currency,
  MaintenanceStatus,
  Product,
} from '../../types';
import {
  formatMoney,
  convertCurrency,
  formatDate,
  CURRENCY_CONFIG,
} from '../../utils/formatters';

interface DashboardViewProps {
  data: AppData;
  onNavigateTab: (tab: any) => void;
  onOpenNewSale: () => void;
  onOpenNewMaintenance: () => void;
  onSelectMaintenanceTicket: (ticketId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigateTab,
  onOpenNewSale,
  onOpenNewMaintenance,
  onSelectMaintenanceTicket,
}) => {
  const [valuationMode, setValuationMode] = useState<'itemized' | 'unified_yer'>('unified_yer');

  // Compute Cashboxes Balances
  const getCashboxBalance = (currency: Currency) => {
    return data.cashTransactions
      .filter((tx) => tx.currency === currency)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const yerCash = getCashboxBalance('YER');
  const sarCash = getCashboxBalance('SAR');
  const usdCash = getCashboxBalance('USD');

  // Total cash unified in YER
  const totalCashUnifiedYER =
    yerCash +
    convertCurrency(sarCash, 'SAR', 'YER', data.exchangeRates) +
    convertCurrency(usdCash, 'USD', 'YER', data.exchangeRates);

  // Compute Today's Sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = data.salesInvoices.filter((inv) => inv.date.startsWith(today));

  const todaySalesYER = todaySales
    .filter((s) => s.currency === 'YER')
    .reduce((sum, s) => sum + s.total, 0);
  const todaySalesSAR = todaySales
    .filter((s) => s.currency === 'SAR')
    .reduce((sum, s) => sum + s.total, 0);
  const todaySalesUSD = todaySales
    .filter((s) => s.currency === 'USD')
    .reduce((sum, s) => sum + s.total, 0);

  const todaySalesUnifiedYER =
    todaySalesYER +
    convertCurrency(todaySalesSAR, 'SAR', 'YER', data.exchangeRates) +
    convertCurrency(todaySalesUSD, 'USD', 'YER', data.exchangeRates);

  // Inventory Valuation (Cost & Sale value)
  let invCostUnifiedYER = 0;
  let invSaleUnifiedYER = 0;
  let totalPhonesCount = 0;

  data.products.forEach((p) => {
    const costInYER = convertCurrency(p.costPrice * p.quantity, p.costCurrency, 'YER', data.exchangeRates);
    const saleInYER = convertCurrency(p.salePrice * p.quantity, p.saleCurrency, 'YER', data.exchangeRates);
    invCostUnifiedYER += costInYER;
    invSaleUnifiedYER += saleInYER;
    if (p.category === 'new_phones' || p.category === 'used_phones') {
      totalPhonesCount += p.quantity;
    }
  });

  // Maintenance statistics
  const activeTickets = data.maintenanceTickets.filter(
    (t) => t.status !== 'delivered' && t.status !== 'cancelled'
  );
  const readyTickets = data.maintenanceTickets.filter((t) => t.status === 'ready');
  const inRepairTickets = data.maintenanceTickets.filter((t) => t.status === 'in_repair');
  const waitingPartsTickets = data.maintenanceTickets.filter((t) => t.status === 'waiting_parts');
  const receivedTickets = data.maintenanceTickets.filter((t) => t.status === 'received');

  // Low stock products
  const lowStockProducts = data.products.filter(
    (p) => p.quantity <= p.minAlertQuantity
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Valuation Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام المحاسبة المتعدد العملات للمحلات والصيانة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {data.storeInfo?.name || 'جاري تحميل المتجر...'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              متابعة نقدية الصناديق الثلاثة، مبيعات اليوم، حالة ورشة الصيانة، وتقويم المخزون الفوري.
            </p>
          </div>

          {/* Currency Valuation Switch */}
          <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1 self-start md:self-center">
            <button
              onClick={() => setValuationMode('unified_yer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                valuationMode === 'unified_yer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تقويم موحد (بالريال اليمني)
            </button>
            <button
              onClick={() => setValuationMode('itemized')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                valuationMode === 'itemized'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              حسب كل عملة منفصلة
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cash in Safes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              إجمالي نقدية الصناديق
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {valuationMode === 'unified_yer' ? (
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight" dir="ltr">
                {formatMoney(totalCashUnifiedYER, 'YER')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                مقوماً بالريال اليمني بأسعار الصرف الحالية
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-xs font-mono font-bold" dir="ltr">
              <div className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded">
                {formatMoney(yerCash, 'YER')}
              </div>
              <div className="text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded">
                {formatMoney(sarCash, 'SAR')}
              </div>
              <div className="text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded">
                {formatMoney(usdCash, 'USD')}
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigateTab('accounting')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold hover:text-indigo-700 w-full"
          >
            <span>فتح دفاتر الصناديق</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              مبيعات اليوم ({todaySales.length} فواتير)
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
              اليوم
            </span>
          </div>

          {valuationMode === 'unified_yer' ? (
            <div>
              <div className="text-2xl font-black text-indigo-900 font-mono tracking-tight" dir="ltr">
                {formatMoney(todaySalesUnifiedYER, 'YER')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                إجمالي إيراد المبيعات اليومية
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-xs font-mono font-bold" dir="ltr">
              <div className="text-emerald-700">اليمني: {formatMoney(todaySalesYER, 'YER')}</div>
              <div className="text-amber-700">السعودي: {formatMoney(todaySalesSAR, 'SAR')}</div>
              <div className="text-blue-700">الدولار: {formatMoney(todaySalesUSD, 'USD')}</div>
            </div>
          )}

          <button
            onClick={onOpenNewSale}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold hover:text-indigo-700 w-full"
          >
            <span>فاتورة بيع جديدة</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Active Repairs Workshop */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              أجهزة ورشة الصيانة
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md">
              {activeTickets.length} جهاز نشط
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-amber-950 font-mono tracking-tight flex items-center gap-2">
              <span>{activeTickets.length}</span>
              <span className="text-xs font-normal text-slate-500">جهاز بالورشة</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                {readyTickets.length} جاهز للتسليم
              </span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                {inRepairTickets.length} قيد الإصلاح
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('maintenance')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-bold hover:text-amber-800 w-full"
          >
            <span>عرض كروت الصيانة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Card 4: Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-sky-600" />
              قيمة المخزون المقدرة
            </span>
            <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-md">
              {data.products.length} صنف
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-sky-950 font-mono tracking-tight" dir="ltr">
              {formatMoney(invSaleUnifiedYER, 'YER')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>بسعر التكلفة:</span>
              <span className="font-mono font-bold" dir="ltr">
                {formatMoney(invCostUnifiedYER, 'YER')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-bold hover:text-sky-800 w-full"
          >
            <span>إدارة المخزون ({totalPhonesCount} هاتف)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Section: Cashboxes Breakdown & Repair Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The 3 Safes Detailed Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              تفصيل نقدية الخزائن الثلاث
            </h3>
            <button
              onClick={() => onNavigateTab('accounting')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              كشف تفصيلي
            </button>
          </div>

          <div className="space-y-3">
            {/* YER Safe */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ر.ي
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">خزينة الريال اليمني</p>
                  <p className="text-[10px] text-slate-500">عملة التداول والتشغيل اليومي</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-black text-emerald-800 text-sm" dir="ltr">
                  {formatMoney(yerCash, 'YER')}
                </p>
              </div>
            </div>

            {/* SAR Safe */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  ر.س
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">خزينة الريال السعودي</p>
                  <p className="text-[10px] text-slate-500">
                    يعادل {formatMoney(convertCurrency(sarCash, 'SAR', 'YER', data.exchangeRates), 'YER')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-black text-amber-800 text-sm" dir="ltr">
                  {formatMoney(sarCash, 'SAR')}
                </p>
              </div>
            </div>

            {/* USD Safe */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  $
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">خزينة الدولار الأمريكي</p>
                  <p className="text-[10px] text-slate-500">
                    يعادل {formatMoney(convertCurrency(usdCash, 'USD', 'YER', data.exchangeRates), 'YER')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-black text-blue-800 text-sm" dir="ltr">
                  {formatMoney(usdCash, 'USD')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Workshop Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              مراحل أجهزة الصيانة في الورشة
            </h3>
            <button
              onClick={onOpenNewMaintenance}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              استقبال جهاز جديد
            </button>
          </div>

          {/* 4 Pipeline Stage Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] text-slate-500">قيد الفحص</p>
              <p className="text-xl font-black text-slate-800 mt-1">{receivedTickets.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
              <p className="text-[11px] text-amber-700">انتظار قطع</p>
              <p className="text-xl font-black text-amber-800 mt-1">{waitingPartsTickets.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-center">
              <p className="text-[11px] text-indigo-700">جاري الإصلاح</p>
              <p className="text-xl font-black text-indigo-800 mt-1">{inRepairTickets.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
              <p className="text-[11px] text-emerald-700">جاهز للتسليم</p>
              <p className="text-xl font-black text-emerald-800 mt-1">{readyTickets.length}</p>
            </div>
          </div>

          {/* Quick list of urgent tickets */}
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {activeTickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectMaintenanceTicket(ticket.id)}
                className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[11px]">
                    📱
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {ticket.deviceBrand} {ticket.deviceModel}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400" dir="ltr">
                        {ticket.ticketNumber}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate max-w-xs">
                      {ticket.issueDescription}
                    </p>
                  </div>
                </div>

                <div className="text-left flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.status === 'ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ticket.status === 'in_repair'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ticket.status === 'ready'
                      ? 'جاهز'
                      : ticket.status === 'in_repair'
                      ? 'قيد الإصلاح'
                      : ticket.status === 'waiting_parts'
                      ? 'انتظار قطع'
                      : 'قيد الفحص'}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Low Stock Alert Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-rose-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          {/* Subtle top indicator bar if items are low */}
          {lowStockProducts.length > 0 && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />
          )}

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                lowStockProducts.length > 0
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    تنبيهات نواقص المخزون وحد الطلب
                  </h3>
                  {lowStockProducts.length > 0 && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      {lowStockProducts.length} صنف
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  الأصناف التي وصلت كمياتها لحد التنبيه الأدنى أو نفدت تماماً
                </p>
              </div>
            </div>

            {/* Quick Navigate to Inventory Button */}
            <button
              onClick={() => onNavigateTab('inventory')}
              className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
              title="الانتقال لصفحة المخزون لإدارة الكميات وإعادة الطلب"
            >
              <Boxes className="w-4 h-4" />
              <span>الذهاب لصفحة المخزون</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Content List */}
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2 font-bold text-base">
                ✓
              </div>
              <p className="font-bold text-sm">المخزون في حالة ممتازة!</p>
              <p className="text-[11px] text-emerald-600">
                جميع الهواتف وقطع الغيار متوفرة بكميات تتجاوز حد التنبيه الأدنى.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="max-h-[310px] overflow-y-auto space-y-2 pr-0.5">
                {lowStockProducts.map((p) => {
                  const isCompletelyOut = p.quantity <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab('inventory')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isCompletelyOut
                          ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
                          : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-100/50'
                      }`}
                      title="اضغط للانتقال لهذا الصنف في المخزون"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.category === 'new_phones' || p.category === 'used_phones'
                                ? 'bg-blue-100 text-blue-800'
                                : p.category === 'spare_parts'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {p.category === 'new_phones'
                              ? 'هاتف جديد'
                              : p.category === 'used_phones'
                              ? 'هاتف مستعمل'
                              : p.category === 'spare_parts'
                              ? 'قطعة غيار'
                              : p.category === 'batteries'
                              ? 'بطارية'
                              : 'إكسسوار'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {p.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                          {p.barcode && <span>الباركود: {p.barcode}</span>}
                          {p.imei && <span dir="ltr">IMEI: {p.imei}</span>}
                          <span className="text-slate-600 font-sans font-medium">
                            سعر البيع: {formatMoney(p.salePrice, p.saleCurrency)}
                          </span>
                        </div>
                      </div>

                      {/* Stock Quantity Status Badges */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                        {isCompletelyOut ? (
                          <span className="inline-flex items-center gap-1 font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl text-xs border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                            نافذ بالكامل (0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl text-xs border border-amber-200">
                            متبقي: {p.quantity} فقط
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium">
                          حد التنبيه الأدنى: {p.minAlertQuantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom quick action bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>اضغط على أي صنف للانتقال المباشر وتعديل الكميات</span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <span>عرض الكل في المخزون</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions in Cashboxes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              آخر الحركات المالية بالصناديق
            </h3>
            <button
              onClick={() => onNavigateTab('accounting')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              سجل الحركات
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {data.cashTransactions
              .slice(-4)
              .reverse()
              .map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.amount >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.amount >= 0 ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono font-bold" dir="ltr">
                    <span
                      className={tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatMoney(tx.amount, tx.currency)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
