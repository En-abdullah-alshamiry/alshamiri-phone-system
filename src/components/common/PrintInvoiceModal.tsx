import React from 'react';
import { Printer, X, ShieldCheck, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { MaintenanceTicket, SaleInvoice, PurchaseInvoice, StoreInfo, ExchangeRates } from '../../types';
import { formatMoney, formatDate, CURRENCY_CONFIG } from '../../utils/formatters';
import { PatternLockDrawer } from './PatternLockDrawer';

interface PrintInvoiceModalProps {
  type: 'sale' | 'maintenance_reception' | 'maintenance_delivery' | 'purchase';
  data: SaleInvoice | MaintenanceTicket | PurchaseInvoice | any;
  storeInfo: StoreInfo;
  exchangeRates: ExchangeRates;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  type,
  data,
  storeInfo,
  exchangeRates,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="no-print bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              معاينة وطباعة الفاتورة / السند
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              طباعة الآن
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 overflow-y-auto printable-area bg-white text-slate-800 font-sans text-sm">
          {/* Header */}
          <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-2 font-black text-xl">
              📱
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {type === 'maintenance_reception' || type === 'maintenance_delivery'
                ? 'مركز الشميري فون للصيانة والبرمجة'
                : 'الشميري فون'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              {type === 'maintenance_reception' || type === 'maintenance_delivery'
                ? 'قسم الصيانة الإلكترونية المتقدمة - صيانة شاشات وأيسيات وبرمجة الهواتف الذكية'
                : (storeInfo.subtitle || 'بيع وشراء الجوالات الجديدة والمستعملة - صيانة متقدمة - قطع غيار وإكسسوارات')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {storeInfo.address}
              </span>
              <span className="flex items-center gap-1" dir="ltr">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {storeInfo.phone} {storeInfo.phone2 ? ` / ${storeInfo.phone2}` : ''}
              </span>
            </div>
          </div>

          {/* DOCUMENT BODY ACCORDING TO TYPE */}

          {/* 1. SALES INVOICE */}
          {type === 'sale' && (
            <div>
              <div className="flex justify-between items-start bg-slate-50 p-3 rounded-xl mb-4 border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-500">رقم الفاتورة:</p>
                  <p className="font-bold text-slate-900 text-sm font-mono" dir="ltr">
                    {(data as SaleInvoice).invoiceNumber}
                  </p>
                  <p className="text-slate-500 mt-1">التاريخ:</p>
                  <p className="font-medium text-slate-800">{formatDate((data as SaleInvoice).date)}</p>
                </div>
                <div className="text-left">
                  <p className="text-slate-500">العميل:</p>
                  <p className="font-bold text-slate-900">{(data as SaleInvoice).customerName || 'عميل نقدي'}</p>
                  {(data as SaleInvoice).customerPhone && (
                    <p className="text-slate-600 font-mono text-[11px]" dir="ltr">
                      {(data as SaleInvoice).customerPhone}
                    </p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    فاتورة مبيعات
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">البيان / الصنف</th>
                      <th className="py-2 px-3 text-center">الكمية</th>
                      <th className="py-2 px-3 text-left">السعر</th>
                      <th className="py-2 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data as SaleInvoice).items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-800">{item.product.name}</p>
                          {(item.imei || item.product.imei) && (
                            <p className="text-[10px] text-slate-500 font-mono" dir="ltr">
                              IMEI: {item.imei || item.product.imei}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-left font-mono" dir="ltr">
                          {formatMoney(item.unitPrice, (data as SaleInvoice).currency)}
                        </td>
                        <td className="py-2 px-3 text-left font-bold font-mono" dir="ltr">
                          {formatMoney(
                            item.quantity * item.unitPrice - item.customDiscount,
                            (data as SaleInvoice).currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold" dir="ltr">
                    {formatMoney((data as SaleInvoice).subtotal, (data as SaleInvoice).currency)}
                  </span>
                </div>
                {(data as SaleInvoice).discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono font-bold" dir="ltr">
                      - {formatMoney((data as SaleInvoice).discount, (data as SaleInvoice).currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                  <span>الصافي المطلوب:</span>
                  <span className="font-mono text-indigo-700" dir="ltr">
                    {formatMoney((data as SaleInvoice).total, (data as SaleInvoice).currency)}
                  </span>
                </div>

                {/* Paid Details in another currency */}
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>طريقة الدفع:</span>
                    <span className="font-bold text-slate-800">
                      {(data as SaleInvoice).paymentType === 'cash'
                        ? 'نقداً'
                        : (data as SaleInvoice).paymentType === 'transfer'
                        ? 'تحويل بنكي / محفظة'
                        : 'آجل / ذمم'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المستلم بالصندوق:</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      {formatMoney((data as SaleInvoice).paidAmount, (data as SaleInvoice).paidCurrency)}
                    </span>
                  </div>
                  {(data as SaleInvoice).changeAmount > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>المتبقي للعميل (الصرف):</span>
                      <span className="font-mono" dir="ltr">
                        {formatMoney((data as SaleInvoice).changeAmount, (data as SaleInvoice).changeCurrency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3">
                <p className="font-semibold text-slate-700 mb-0.5">شروط المبيعات والضمان:</p>
                <p>{storeInfo.salesTerms}</p>
              </div>
            </div>
          )}

          {/* 2. MAINTENANCE RECEPTION TICKET (سند استلام جهاز صيانة) */}
          {type === 'maintenance_reception' && (
            <div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-center">
                <span className="inline-block px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold mb-1">
                  سند استلام جهاز صيانة
                </span>
                <p className="text-xs text-amber-900 font-mono font-bold" dir="ltr">
                  رقم الكرت: {(data as MaintenanceTicket).ticketNumber}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  تاريخ الاستلام: {formatDate((data as MaintenanceTicket).receivedAt)}
                </p>
                {(data as MaintenanceTicket).expectedDeliveryDate && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-xs">
                    <span>موعد التسليم المتفق عليه:</span>
                    <span className="font-mono text-indigo-700" dir="ltr">
                      {formatDate((data as MaintenanceTicket).expectedDeliveryDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer & Device Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">بيانات العميل</p>
                  <p className="font-bold text-slate-800 text-sm">{(data as MaintenanceTicket).customerName}</p>
                  <p className="font-mono text-slate-600 text-xs" dir="ltr">
                    {(data as MaintenanceTicket).customerPhone}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">بيانات الجهاز</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {(data as MaintenanceTicket).deviceBrand} {(data as MaintenanceTicket).deviceModel}
                  </p>
                  {(data as MaintenanceTicket).color && (
                    <p className="text-slate-600 text-xs">اللون: {(data as MaintenanceTicket).color}</p>
                  )}
                  {(data as MaintenanceTicket).imei && (
                    <p className="font-mono text-[10px] text-slate-500" dir="ltr">
                      IMEI: {(data as MaintenanceTicket).imei}
                    </p>
                  )}
                </div>
              </div>

              {/* Fault & Lock & Accessories */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4 space-y-2">
                <div>
                  <span className="text-slate-500 font-medium">العطل المشتكى منه:</span>
                  <p className="font-bold text-rose-700 mt-0.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    {(data as MaintenanceTicket).issueDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-500 font-medium">الملحقات المستلمة:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(data as MaintenanceTicket).receivedAccessories &&
                      (data as MaintenanceTicket).receivedAccessories.length > 0 ? (
                        (data as MaintenanceTicket).receivedAccessories.map((acc, i) => (
                          <span
                            key={i}
                            className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]"
                          >
                            {acc}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">بدون أي ملحقات</span>
                      )}
                    </div>
                  </div>

                  {/* Lock info */}
                  <div>
                    <span className="text-slate-500 font-medium">رمز قفل الجهاز:</span>
                    <div className="mt-1">
                      {(data as MaintenanceTicket).lockType === 'pattern' && (
                        <div className="flex items-center gap-3">
                          <PatternLockDrawer
                            value={(data as MaintenanceTicket).lockCode || ''}
                            readOnly={true}
                            size="sm"
                          />
                          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                            {(data as MaintenanceTicket).lockCode}
                          </span>
                        </div>
                      )}
                      {(data as MaintenanceTicket).lockType === 'pin' && (
                        <div className="bg-slate-900 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-lg inline-block text-xs" dir="ltr">
                          PIN: {(data as MaintenanceTicket).lockCode}
                        </div>
                      )}
                      {(data as MaintenanceTicket).lockType === 'none' && (
                        <span className="text-slate-500 text-[11px]">بدون رمز قفل</span>
                      )}
                    </div>
                  </div>
                </div>

                {(data as MaintenanceTicket).deviceConditionNotes && (
                  <div className="pt-2 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">ملاحظات حالة الجهاز عند الاستلام: </span>
                    {(data as MaintenanceTicket).deviceConditionNotes}
                  </div>
                )}
              </div>

              {/* Financials & Deposit */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">التكلفة التقديرية المتفق عليها:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">
                    {formatMoney(
                      (data as MaintenanceTicket).estimatedCost,
                      (data as MaintenanceTicket).costCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>العربون المدفوع مقدماً:</span>
                  <span className="font-mono" dir="ltr">
                    {formatMoney(
                      (data as MaintenanceTicket).depositAmount,
                      (data as MaintenanceTicket).depositCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 pt-1 border-t border-slate-200">
                  <span>المتبقي عند استلام الجهاز:</span>
                  <span className="font-mono font-bold text-indigo-700" dir="ltr">
                    {formatMoney(
                      Math.max(
                        0,
                        (data as MaintenanceTicket).estimatedCost - (data as MaintenanceTicket).depositAmount
                      ),
                      (data as MaintenanceTicket).costCurrency
                    )}
                  </span>
                </div>
              </div>

              {/* Signatures & Terms */}
              <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">شروط وإقرار الصيانة:</p>
                <p className="leading-relaxed">{storeInfo.maintenanceTerms}</p>
                <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-700">
                  <div className="border-t border-slate-300 pt-2 mx-4">
                    توقيع العميل / المستلم
                  </div>
                  <div className="border-t border-slate-300 pt-2 mx-4">
                    ختم وتوقيع مهندس الصيانة
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. MAINTENANCE DELIVERY & WARRANTY INVOICE (فاتورة تسليم صيانة وضمان) */}
          {type === 'maintenance_delivery' && (
            <div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  فاتورة تسليم وضمان صيانة
                </div>
                <p className="text-xs text-emerald-900 font-mono font-bold" dir="ltr">
                  كرت صيانة: {(data as MaintenanceTicket).ticketNumber}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  تاريخ التسليم: {formatDate((data as MaintenanceTicket).deliveredAt || new Date().toISOString())}
                </p>
              </div>

              {/* Client & Device Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-500">العميل:</p>
                  <p className="font-bold text-slate-900">{(data as MaintenanceTicket).customerName}</p>
                  <p className="font-mono text-slate-600 text-xs" dir="ltr">
                    {(data as MaintenanceTicket).customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">الجهاز:</p>
                  <p className="font-bold text-slate-900">
                    {(data as MaintenanceTicket).deviceBrand} {(data as MaintenanceTicket).deviceModel}
                  </p>
                  {(data as MaintenanceTicket).imei && (
                    <p className="font-mono text-[10px] text-slate-500" dir="ltr">
                      IMEI: {(data as MaintenanceTicket).imei}
                    </p>
                  )}
                </div>
              </div>

              {/* Spare Parts & Work Details */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">البيان / قطع الغيار وأجور الإصلاح</th>
                      <th className="py-2 px-3 text-center">الكمية</th>
                      <th className="py-2 px-3 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data as MaintenanceTicket).spareParts.map((sp, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{sp.name}</td>
                        <td className="py-2 px-3 text-center">{sp.quantity}</td>
                        <td className="py-2 px-3 text-left font-mono" dir="ltr">
                          {formatMoney(sp.chargedPrice * sp.quantity, sp.chargedCurrency)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        أجرة يد الفحص والإصلاح المعتمدة (المهندس: {(data as MaintenanceTicket).technicianName || 'الورشة'})
                      </td>
                      <td className="py-2 px-3 text-center">1</td>
                      <td className="py-2 px-3 text-left font-mono" dir="ltr">
                        {formatMoney((data as MaintenanceTicket).laborFee, (data as MaintenanceTicket).finalCurrency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Final Totals */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>المبلغ الإجمالي النهائي:</span>
                  <span className="font-mono text-indigo-700" dir="ltr">
                    {formatMoney((data as MaintenanceTicket).finalAmount, (data as MaintenanceTicket).finalCurrency)}
                  </span>
                </div>
                {(data as MaintenanceTicket).depositAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>العربون المخصوم:</span>
                    <span className="font-mono text-emerald-700" dir="ltr">
                      - {formatMoney((data as MaintenanceTicket).depositAmount, (data as MaintenanceTicket).depositCurrency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-800 font-extrabold text-sm pt-1 border-t border-slate-200">
                  <span>حالة الفاتورة:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs">
                    خالصة ومسددة بالكامل
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3">
                <p className="font-semibold text-slate-700">شروط الضمان:</p>
                <p>ضمان قطع الغيار الأصلية لمدة 30 يوماً من تاريخ التسليم ضد العيوب المصنعية (لا يشمل الكسر وسوء الاستخدام أو الماء).</p>
              </div>
            </div>
          )}

          {/* 4. PURCHASE FROM CITIZEN (إقرار وشراء جهاز مستعمل) */}
          {type === 'purchase' && (
            <div>
              <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl mb-4 text-center">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold mb-1">
                  إقرار وسند شراء جهاز مستعمل
                </span>
                <p className="text-xs text-slate-700 font-mono font-bold" dir="ltr">
                  رقم السند: {(data as PurchaseInvoice).purchaseNumber}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  التاريخ: {formatDate((data as PurchaseInvoice).date)}
                </p>
              </div>

              {/* Seller details */}
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 text-xs mb-4 space-y-1">
                <p className="font-bold text-rose-950 text-sm">بيانات البائع (مالك الجهاز):</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-slate-500">اسم البائع رباعي:</span>
                    <p className="font-bold text-slate-900">{(data as PurchaseInvoice).sellerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <p className="font-mono text-slate-800" dir="ltr">{(data as PurchaseInvoice).sellerPhone}</p>
                  </div>
                  {(data as PurchaseInvoice).sellerIdCard && (
                    <div className="col-span-2">
                      <span className="text-slate-500">رقم البطاقة الشخصية / الهوية:</span>
                      <p className="font-mono font-bold text-slate-900" dir="ltr">
                        {(data as PurchaseInvoice).sellerIdCard}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchased Devices */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">نوع الجهاز ومواصفاته</th>
                      <th className="py-2 px-3">رقم الـ IMEI</th>
                      <th className="py-2 px-3 text-left">المبلغ المدفوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data as PurchaseInvoice).items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {item.productName}
                          {item.condition && (
                            <span className="block text-[10px] text-slate-500">{item.condition}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]" dir="ltr">
                          {item.imei || '—'}
                        </td>
                        <td className="py-2 px-3 text-left font-mono font-bold" dir="ltr">
                          {formatMoney(item.costPrice, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center mb-4">
                <span className="font-bold text-slate-800">إجمالي المبلغ المسلّم للبائع:</span>
                <span className="font-mono font-black text-slate-950 text-base" dir="ltr">
                  {formatMoney((data as PurchaseInvoice).total, (data as PurchaseInvoice).currency)}
                </span>
              </div>

              {/* Legal Declaration */}
              <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-600 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-800">إقرار قانوني صادر من البائع:</p>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  أقر وأعترف أنا البائع المذكور بياناتي أعلاه بأن الجهاز المباع ملك شرعي وخالص لي ولا يترتب عليه أي التزامات
                  أو بلاغات سرقة أو قيود أمنية، وأتحمل كامل المسؤولية القانونية والجنائية في حال ثبت خلاف ذلك.
                </p>
                <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-700">
                  <div className="border-t border-slate-300 pt-2 mx-4">
                    اسم وتوقيع وبصمة البائع
                  </div>
                  <div className="border-t border-slate-300 pt-2 mx-4">
                    توقيع وختم المحل المشترى
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barcode and Timestamp Footer */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-slate-400 text-[10px]">
            <div className="font-mono tracking-widest text-slate-700 font-bold mb-1">
              ||| | ||||| |||| | |||| ||| |||||||
            </div>
            <p>الشميري فون - لإدارة المبيعات والصيانة والمحاسبة متعددة العملات</p>
            <p className="font-mono text-[9px] mt-0.5">طُبع بتاريخ: {new Date().toLocaleString('ar-YE')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
