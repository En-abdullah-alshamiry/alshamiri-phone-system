import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  PieChart,
  Calendar,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import {
  AppData,
  CashboxTransaction,
  Currency,
  CurrencyExchangeRecord,
  CustomerAccount,
  ExpenseVoucher,
  ReceiptVoucher,
} from '../../types';
import {
  formatMoney,
  convertCurrency,
  formatDate,
  generateCode,
  CURRENCY_CONFIG,
} from '../../utils/formatters';

interface AccountingViewProps {
  data: AppData;
  onAddTransaction: (tx: CashboxTransaction) => void;
  onAddExpenseVoucher: (voucher: ExpenseVoucher) => void;
  onAddReceiptVoucher: (voucher: ReceiptVoucher) => void;
  onExecuteExchange: (record: CurrencyExchangeRecord) => void;
  onSettleCustomerDebt: (customerId: string, amount: number, currency: Currency) => void;
  isExchangeModalOpenInitial?: boolean;
  onCloseExchangeModalInitial?: () => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  data,
  onAddTransaction,
  onAddExpenseVoucher,
  onAddReceiptVoucher,
  onExecuteExchange,
  onSettleCustomerDebt,
  isExchangeModalOpenInitial,
  onCloseExchangeModalInitial,
}) => {
  const [activeTab, setActiveTab] = useState<'safes' | 'exchange' | 'vouchers' | 'debts' | 'pl'>('safes');
  const [selectedSafeCurrency, setSelectedSafeCurrency] = useState<Currency>('YER');

  // Currency Exchange Modal / Tab State
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeFromCurr, setExchangeFromCurr] = useState<Currency>('USD');
  const [exchangeToCurr, setExchangeToCurr] = useState<Currency>('YER');
  const [exchangeFromAmount, setExchangeFromAmount] = useState<number>(100);
  const [customExchangeRate, setCustomExchangeRate] = useState<number>(data.exchangeRates.YER_PER_USD);
  const [exchangeNotes, setExchangeNotes] = useState('');

  // Handle external open trigger for exchange modal
  React.useEffect(() => {
    if (isExchangeModalOpenInitial) {
      setIsExchangeModalOpen(true);
    }
  }, [isExchangeModalOpenInitial]);

  // Expense Voucher Form State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<any>('كهرباء ومياه');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>('YER');
  const [expenseRecipient, setExpenseRecipient] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Receipt Voucher Form State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptCategory, setReceiptCategory] = useState<any>('سداد ذمة عميل');
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptCurrency, setReceiptCurrency] = useState<Currency>('YER');
  const [receiptPayer, setReceiptPayer] = useState('');
  const [receiptDescription, setReceiptDescription] = useState('');

  // Settle Debt Modal State
  const [settlingCustomer, setSettlingCustomer] = useState<CustomerAccount | null>(null);
  const [debtSettleAmount, setDebtSettleAmount] = useState<number>(0);
  const [debtSettleCurrency, setDebtSettleCurrency] = useState<Currency>('YER');

  // Compute Balances
  const getSafeBalance = (curr: Currency) => {
    return data.cashTransactions
      .filter((tx) => tx.currency === curr)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const yerBalance = getSafeBalance('YER');
  const sarBalance = getSafeBalance('SAR');
  const usdBalance = getSafeBalance('USD');

  // Unified Safe Balances in YER
  const totalUnifiedYER =
    yerBalance +
    convertCurrency(sarBalance, 'SAR', 'YER', data.exchangeRates) +
    convertCurrency(usdBalance, 'USD', 'YER', data.exchangeRates);

  // Auto-update default exchange rate when from/to change
  const handleFromCurrencyChange = (curr: Currency) => {
    setExchangeFromCurr(curr);
    if (curr === 'USD' && exchangeToCurr === 'YER') {
      setCustomExchangeRate(data.exchangeRates.YER_PER_USD);
    } else if (curr === 'SAR' && exchangeToCurr === 'YER') {
      setCustomExchangeRate(data.exchangeRates.YER_PER_SAR);
    } else if (curr === 'USD' && exchangeToCurr === 'SAR') {
      setCustomExchangeRate(data.exchangeRates.YER_PER_USD / data.exchangeRates.YER_PER_SAR);
    }
  };

  const handleToCurrencyChange = (curr: Currency) => {
    setExchangeToCurr(curr);
    if (exchangeFromCurr === 'USD' && curr === 'YER') {
      setCustomExchangeRate(data.exchangeRates.YER_PER_USD);
    } else if (exchangeFromCurr === 'SAR' && curr === 'YER') {
      setCustomExchangeRate(data.exchangeRates.YER_PER_SAR);
    }
  };

  // Submit Currency Exchange
  const handleExecuteExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (exchangeFromCurr === exchangeToCurr) {
      alert('يجب اختيار عملتين مختلفتين للتحويل والمصارفة');
      return;
    }

    const availableBalance = getSafeBalance(exchangeFromCurr);
    if (exchangeFromAmount > availableBalance) {
      if (!confirm(`تحذير: الرصيد المتوفر في خزينة ${CURRENCY_CONFIG[exchangeFromCurr].label} هو (${availableBalance}) وهو أقل من المبلغ المراد تحويله. هل ترغب بالاستمرار؟`)) {
        return;
      }
    }

    const convertedToAmount = exchangeFromAmount * customExchangeRate;

    const record: CurrencyExchangeRecord = {
      id: `ex-${Date.now()}`,
      date: new Date().toISOString(),
      fromCurrency: exchangeFromCurr,
      fromAmount: exchangeFromAmount,
      toCurrency: exchangeToCurr,
      toAmount: Math.round(convertedToAmount * 100) / 100,
      exchangeRate: customExchangeRate,
      notes: exchangeNotes,
    };

    onExecuteExchange(record);
    setIsExchangeModalOpen(false);
    onCloseExchangeModalInitial?.();
    setExchangeNotes('');
  };

  // Submit Expense Voucher
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseRecipient.trim()) {
      alert('يرجى تعبئة المبلغ والجهة المستلمة');
      return;
    }

    const voucher: ExpenseVoucher = {
      id: `exp-${Date.now()}`,
      voucherNumber: generateCode('EXP'),
      date: new Date().toISOString(),
      category: expenseCategory,
      amount: expenseAmount,
      currency: expenseCurrency,
      recipient: expenseRecipient.trim(),
      description: expenseDescription.trim(),
      cashboxAffected: expenseCurrency,
    };

    onAddExpenseVoucher(voucher);
    setIsExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpenseRecipient('');
    setExpenseDescription('');
  };

  // Submit Receipt Voucher
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptAmount <= 0 || !receiptPayer.trim()) {
      alert('يرجى تعبئة المبلغ والجهة الدافعة');
      return;
    }

    const voucher: ReceiptVoucher = {
      id: `rcp-${Date.now()}`,
      voucherNumber: generateCode('RCP'),
      date: new Date().toISOString(),
      category: receiptCategory,
      amount: receiptAmount,
      currency: receiptCurrency,
      payer: receiptPayer.trim(),
      description: receiptDescription.trim(),
      cashboxAffected: receiptCurrency,
    };

    onAddReceiptVoucher(voucher);
    setIsReceiptModalOpen(false);
    setReceiptAmount(0);
    setReceiptPayer('');
    setReceiptDescription('');
  };

  // Submit Debt Settle
  const handleConfirmDebtSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCustomer || debtSettleAmount <= 0) return;
    onSettleCustomerDebt(settlingCustomer.id, debtSettleAmount, debtSettleCurrency);
    setSettlingCustomer(null);
  };

  // Profit & Loss calculations
  const totalSalesRevenueYER = data.salesInvoices.reduce((sum, inv) => {
    return sum + convertCurrency(inv.total, inv.currency, 'YER', data.exchangeRates);
  }, 0);

  const totalMaintenanceRevenueYER = data.maintenanceTickets
    .filter((t) => t.status === 'delivered')
    .reduce((sum, t) => {
      return sum + convertCurrency(t.finalAmount, t.finalCurrency, 'YER', data.exchangeRates);
    }, 0);

  const totalExpensesYER = data.expenseVouchers.reduce((sum, exp) => {
    return sum + convertCurrency(exp.amount, exp.currency, 'YER', data.exchangeRates);
  }, 0);

  const totalCOGS_PurchasesYER = data.purchaseInvoices.reduce((sum, pur) => {
    return sum + convertCurrency(pur.total, pur.currency, 'YER', data.exchangeRates);
  }, 0);

  const estimatedGrossProfitYER =
    totalSalesRevenueYER + totalMaintenanceRevenueYER - totalCOGS_PurchasesYER;
  const estimatedNetProfitYER = estimatedGrossProfitYER - totalExpensesYER;

  return (
    <div className="space-y-5">
      {/* Top Header & Safes Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                النظام المحاسبي وإدارة الصناديق متعددة العملات
              </h1>
              <p className="text-xs text-slate-500">
                خزائن منفصلة (YER, SAR, USD)، تحويل ومصارفة فورية، سندات قبض وصرف، والديون
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExchangeModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل ومصارفة</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Minus className="w-4 h-4" />
            <span>سند صرف</span>
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>سند قبض</span>
          </button>
        </div>
      </div>

      {/* 3 Main Safes Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* YER Safe */}
        <div
          onClick={() => setSelectedSafeCurrency('YER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSafeCurrency === 'YER'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 text-xs">خزينة الريال اليمني</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded font-bold">
              YER
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-900" dir="ltr">
            {formatMoney(yerBalance, 'YER')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">اضغط لعرض كشف الحركات اليومية</p>
        </div>

        {/* SAR Safe */}
        <div
          onClick={() => setSelectedSafeCurrency('SAR')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSafeCurrency === 'SAR'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 text-xs">خزينة الريال السعودي</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-bold">
              SAR
            </span>
          </div>
          <div className="text-xl font-black font-mono text-amber-900" dir="ltr">
            {formatMoney(sarBalance, 'SAR')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            يعادل {formatMoney(convertCurrency(sarBalance, 'SAR', 'YER', data.exchangeRates), 'YER')}
          </p>
        </div>

        {/* USD Safe */}
        <div
          onClick={() => setSelectedSafeCurrency('USD')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSafeCurrency === 'USD'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 text-xs">خزينة الدولار الأمريكي</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-bold">
              USD
            </span>
          </div>
          <div className="text-xl font-black font-mono text-blue-900" dir="ltr">
            {formatMoney(usdBalance, 'USD')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            يعادل {formatMoney(convertCurrency(usdBalance, 'USD', 'YER', data.exchangeRates), 'YER')}
          </p>
        </div>
      </div>

      {/* Sub-Tabs: Safe Ledger / Exchange Log / Vouchers / Debts / P&L */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/80 border-b border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('safes')}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'safes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            دفتر حركة الخزينة ({CURRENCY_CONFIG[selectedSafeCurrency].symbol})
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'exchange'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سجل المصارفة والتحويل ({data.currencyExchanges.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'vouchers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سندات الصرف والقبض ({data.expenseVouchers.length + data.receiptVouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'debts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            كشف حساب العملاء والآجل
          </button>
          <button
            onClick={() => setActiveTab('pl')}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'pl'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تقرير الأرباح والخسائر (P&L)
          </button>
        </div>

        {/* Tab 1: Selected Safe Ledger */}
        {activeTab === 'safes' && (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800">
                كشف حركات خزينة {CURRENCY_CONFIG[selectedSafeCurrency].label}
              </h3>
              <div className="text-xs text-slate-500 font-mono font-bold" dir="ltr">
                الرصيد الحالي: {formatMoney(getSafeBalance(selectedSafeCurrency), selectedSafeCurrency)}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">البيان والتفاصيل</th>
                    <th className="p-3 text-left">الوارد (+)</th>
                    <th className="p-3 text-left">المنصرف (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cashTransactions
                    .filter((tx) => tx.currency === selectedSafeCurrency)
                    .slice()
                    .reverse()
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-500 font-mono">
                          {formatDate(tx.date)}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {tx.title}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {tx.description || tx.referenceId || '—'}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                          {tx.amount > 0 ? `+${formatMoney(tx.amount, tx.currency)}` : '—'}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-rose-700" dir="ltr">
                          {tx.amount < 0 ? formatMoney(Math.abs(tx.amount), tx.currency) : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Exchange Log */}
        {activeTab === 'exchange' && (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800">
                سجل عمليات التحويل والمصارفة بين العملات
              </h3>
              <button
                onClick={() => setIsExchangeModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                عملية مصارفة جديدة
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المبلغ المحول (من)</th>
                    <th className="p-3">سعر الصرف</th>
                    <th className="p-3">المبلغ الناتج (إلى)</th>
                    <th className="p-3">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.currencyExchanges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        لا توجد عمليات مصارفة مسجلة بعد
                      </td>
                    </tr>
                  ) : (
                    data.currencyExchanges.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{formatDate(ex.date)}</td>
                        <td className="p-3 font-mono font-bold text-rose-700" dir="ltr">
                          {formatMoney(ex.fromAmount, ex.fromCurrency)}
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-700" dir="ltr">
                          {ex.exchangeRate}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700" dir="ltr">
                          {formatMoney(ex.toAmount, ex.toCurrency)}
                        </td>
                        <td className="p-3 text-slate-600">{ex.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Vouchers (Receipt & Expense) */}
        {activeTab === 'vouchers' && (
          <div className="p-4 sm:p-5 space-y-6">
            {/* Expenses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-rose-600" />
                  سندات الصرف والمصروفات التشغيلية
                </h4>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                >
                  + سند صرف جديد
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">رقم السند</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">البند / التصنيف</th>
                      <th className="p-3">المستلم</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3 text-left">المبلغ والخزينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.expenseVouchers.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-700" dir="ltr">
                          {exp.voucherNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{formatDate(exp.date)}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{exp.recipient}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{exp.description}</td>
                        <td className="p-3 text-left font-mono font-bold text-rose-700" dir="ltr">
                          {formatMoney(exp.amount, exp.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receipts */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  سندات القبض والإيرادات الأخرى
                </h4>
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                >
                  + سند قبض جديد
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">رقم السند</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">المودع / الدافع</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.receiptVouchers.map((rcp) => (
                      <tr key={rcp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-700" dir="ltr">
                          {rcp.voucherNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{formatDate(rcp.date)}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            {rcp.category}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{rcp.payer}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{rcp.description}</td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                          {formatMoney(rcp.amount, rcp.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Debts */}
        {activeTab === 'debts' && (
          <div className="p-4 sm:p-5">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">
              كشف حساب العملاء والديون والذمم الآجلة
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3 text-left">الرصيد بالريال اليمني</th>
                    <th className="p-3 text-left">الرصيد بالريال السعودي</th>
                    <th className="p-3 text-left">الرصيد بالدولار</th>
                    <th className="p-3 text-center">إجراء سداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 font-mono text-slate-600" dir="ltr">
                        {c.phone}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800" dir="ltr">
                        {formatMoney(c.balances.YER, 'YER')}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800" dir="ltr">
                        {formatMoney(c.balances.SAR, 'SAR')}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800" dir="ltr">
                        {formatMoney(c.balances.USD, 'USD')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSettlingCustomer(c);
                            setDebtSettleAmount(c.balances.YER || c.balances.SAR || c.balances.USD || 0);
                          }}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px]"
                        >
                          سداد دفعة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Profit & Loss (P&L) */}
        {activeTab === 'pl' && (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  تقرير الأرباح والخسائر والمركز المالي
                </h3>
                <p className="text-xs text-slate-500">
                  مقوماً بالريال اليمني بأسعار الصرف الرسمية المعتمدة
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incomes Column */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  الإيرادات التشغيلية المكتسبة
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>إجمالي مبيعات المتجر:</span>
                    <span className="font-mono font-bold" dir="ltr">
                      {formatMoney(totalSalesRevenueYER, 'YER')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>إيرادات خدمات صيانة الأجهزة:</span>
                    <span className="font-mono font-bold" dir="ltr">
                      {formatMoney(totalMaintenanceRevenueYER, 'YER')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-extrabold text-sm pt-2 border-t border-emerald-200">
                    <span>إجمالي الإيرادات:</span>
                    <span className="font-mono" dir="ltr">
                      {formatMoney(totalSalesRevenueYER + totalMaintenanceRevenueYER, 'YER')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Costs & Expenses Column */}
              <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 space-y-3">
                <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-rose-700" />
                  التكاليف والمصروفات
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>تكلفة البضاعة والمشتريات (COGS):</span>
                    <span className="font-mono font-bold" dir="ltr">
                      {formatMoney(totalCOGS_PurchasesYER, 'YER')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>المصروفات التشغيلية والخدمات:</span>
                    <span className="font-mono font-bold" dir="ltr">
                      {formatMoney(totalExpensesYER, 'YER')}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-900 font-extrabold text-sm pt-2 border-t border-rose-200">
                    <span>إجمالي التكاليف والمصاريف:</span>
                    <span className="font-mono" dir="ltr">
                      {formatMoney(totalCOGS_PurchasesYER + totalExpensesYER, 'YER')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs text-indigo-300 font-bold">صافي الربح التقديري الموحد:</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1" dir="ltr">
                  {formatMoney(estimatedNetProfitYER, 'YER')}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>محتسب بناءً على أسعار صرف:</p>
                <p className="font-mono text-slate-300">
                  $1 = {data.exchangeRates.YER_PER_USD} YER | 1 SAR = {data.exchangeRates.YER_PER_SAR} YER
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CURRENCY EXCHANGE MODAL */}
      {isExchangeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-base">تحويل ومصارفة بين الصناديق</h3>
              </div>
              <button
                onClick={() => {
                  setIsExchangeModalOpen(false);
                  onCloseExchangeModalInitial?.();
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteExchange} className="p-6 space-y-4 text-xs">
              {/* From currency & Amount */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">تحويل من خزينة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={exchangeFromCurr}
                    onChange={(e) => handleFromCurrencyChange(e.target.value as Currency)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="USD">خزينة الدولار (USD $)</option>
                    <option value="SAR">خزينة الريال السعودي (SAR ر.س)</option>
                    <option value="YER">خزينة الريال اليمني (YER ر.ي)</option>
                  </select>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={exchangeFromAmount || ''}
                    onChange={(e) => setExchangeFromAmount(parseFloat(e.target.value) || 0)}
                    placeholder="المبلغ المراد خصمه"
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                  الرصيد المتاح: {formatMoney(getSafeBalance(exchangeFromCurr), exchangeFromCurr)}
                </div>
              </div>

              {/* To currency & Exchange Rate */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">إيداع في خزينة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={exchangeToCurr}
                    onChange={(e) => handleToCurrencyChange(e.target.value as Currency)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="YER">خزينة الريال اليمني (YER ر.ي)</option>
                    <option value="SAR">خزينة الريال السعودي (SAR ر.س)</option>
                    <option value="USD">خزينة الدولار (USD $)</option>
                  </select>

                  <div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={customExchangeRate || ''}
                      onChange={(e) => setCustomExchangeRate(parseFloat(e.target.value) || 0)}
                      placeholder="سعر التحويل"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                      dir="ltr"
                    />
                    <span className="block text-[10px] text-slate-400 mt-0.5">سعر الصرف المعتمد</span>
                  </div>
                </div>

                {/* Result calculation */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-900">المبلغ المودع في الخزينة:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm" dir="ltr">
                    {formatMoney(exchangeFromAmount * customExchangeRate, exchangeToCurr)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">البيان / ملاحظات المصارفة</label>
                <input
                  type="text"
                  placeholder="مثال: تغذية صندوق الريال اليمني للمصاريف"
                  value={exchangeNotes}
                  onChange={(e) => setExchangeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsExchangeModalOpen(false);
                    onCloseExchangeModalInitial?.();
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  تنفيذ التحويل وتحديث الخزائن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE VOUCHER MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">سند صرف مصاريف تشغيلية</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">بند المصروف</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="كهرباء ومياه">كهرباء ومياه</option>
                  <option value="إنترنت واتصالات">إنترنت واتصالات</option>
                  <option value="إيجار">إيجار المحل</option>
                  <option value="رواتب ومكافآت">رواتب ومكافآت الفنيين</option>
                  <option value="ضيافة وبوفيه">ضيافة وبوفيه</option>
                  <option value="صيانة ومعدات">صيانة أدوات ومعدات</option>
                  <option value="نثريات ومشتريات عامة">نثريات ومشتريات عامة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العملة والخزينة</label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value as Currency)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">صُرف إلى السيد / الجهة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الكهرباء التجارية أو مالك العقار"
                  value={expenseRecipient}
                  onChange={(e) => setExpenseRecipient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وذلك مقابل (البيان)</label>
                <input
                  type="text"
                  placeholder="تفاصيل سبب الصرف..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  اعتماد سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT VOUCHER MODAL */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">سند قبض إيرادات / سداد</h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">بند الإيراد</label>
                <select
                  value={receiptCategory}
                  onChange={(e) => setReceiptCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="سداد ذمة عميل">سداد ذمة عميل</option>
                  <option value="إيراد خدمات أخرى">إيراد خدمات أخرى / برمجة</option>
                  <option value="إيداع رأس مال">إيداع رأس مال</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={receiptAmount || ''}
                    onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العملة والخزينة</label>
                  <select
                    value={receiptCurrency}
                    onChange={(e) => setReceiptCurrency(e.target.value as Currency)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">استلمنا من السيد *</label>
                <input
                  type="text"
                  required
                  placeholder="اسم الشخص أو العميل"
                  value={receiptPayer}
                  onChange={(e) => setReceiptPayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وذلك مقابل (البيان)</label>
                <input
                  type="text"
                  placeholder="سبب السداد..."
                  value={receiptDescription}
                  onChange={(e) => setReceiptDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  اعتماد سند القبض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE DEBT MODAL */}
      {settlingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">سداد دفعة من حساب: {settlingCustomer.name}</h3>
              <button onClick={() => setSettlingCustomer(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDebtSettle} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المبلغ المسدد</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={debtSettleAmount || ''}
                  onChange={(e) => setDebtSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العملة المسدد بها</label>
                <select
                  value={debtSettleCurrency}
                  onChange={(e) => setDebtSettleCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار (USD)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettlingCustomer(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  تأكيد وإيداع بالخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
