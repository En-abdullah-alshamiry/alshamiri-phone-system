import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, Check, DollarSign } from 'lucide-react';
import { Currency, ProductCategory, PurchaseInvoice, Product } from '../../types';
import { CURRENCY_CONFIG, generateCode } from '../../utils/formatters';

interface PurchasePhoneModalProps {
  onClose: () => void;
  onSavePurchase: (
    purchase: PurchaseInvoice,
    createdProduct?: Product
  ) => void;
}

export const PurchasePhoneModal: React.FC<PurchasePhoneModalProps> = ({
  onClose,
  onSavePurchase,
}) => {
  const [sellerType, setSellerType] = useState<'individual' | 'supplier'>('individual');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerIdCard, setSellerIdCard] = useState('');

  // Device fields
  const [deviceModel, setDeviceModel] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState<ProductCategory>('used_phones');
  const [imei, setImei] = useState('');
  const [imei2, setImei2] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('أسود');
  const [condition, setCondition] = useState<'جديد' | 'مستعمل ممتاز' | 'مستعمل جيد' | 'مجدد'>('مستعمل ممتاز');
  const [notes, setNotes] = useState('');

  // Financials
  const [costPrice, setCostPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [salePriceEstimate, setSalePriceEstimate] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [legalPledgeAccepted, setLegalPledgeAccepted] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerName || !deviceModel || costPrice <= 0) {
      alert('يرجى تعبئة اسم البائع ونوع الجهاز ومبلغ الشراء');
      return;
    }

    if (sellerType === 'individual' && !sellerIdCard) {
      if (!confirm('تنبيه أمني: لم يتم إدخال رقم الهوية للبائع! هل تريد المتابعة رغم ذلك؟')) {
        return;
      }
    }

    const purchaseNumber = generateCode('PUR');
    const fullProductName = `${brand} ${deviceModel} ${storage} - ${color} (${condition})`;

    // Create product in inventory
    const createdProduct: Product = {
      id: `prod-${Date.now()}`,
      name: fullProductName,
      category: category,
      barcode: imei || `BAR-${Date.now().toString().slice(-8)}`,
      imei: imei.trim(),
      imei2: imei2.trim(),
      quantity: 1,
      minAlertQuantity: 1,
      costPrice: costPrice,
      costCurrency: currency,
      salePrice: salePriceEstimate > 0 ? salePriceEstimate : costPrice * 1.15,
      saleCurrency: currency,
      condition: condition,
      color: color,
      storage: storage,
      notes: `شراء من: ${sellerName} (هاتف: ${sellerPhone}) - ${notes}`,
      createdAt: new Date().toISOString(),
    };

    // Purchase Invoice
    const purchaseInvoice: PurchaseInvoice = {
      id: `pur-${Date.now()}`,
      purchaseNumber,
      date: new Date().toISOString(),
      sellerType,
      sellerName,
      sellerPhone,
      sellerIdCard,
      items: [
        {
          productName: fullProductName,
          category,
          imei: imei.trim(),
          imei2: imei2.trim(),
          condition,
          quantity: 1,
          costPrice,
          currency,
        },
      ],
      currency,
      total: costPrice,
      paymentType,
      cashboxAffected: currency,
      notes,
    };

    onSavePurchase(purchaseInvoice, createdProduct);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/50 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                شراء جهاز جديد / مستعمل من مواطن أو مورد
              </h2>
              <p className="text-xs text-slate-300">
                توثيق قانوني للـ IMEI والهوية وإدخال مباشر للمخزون
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Seller Type Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSellerType('individual')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                sellerType === 'individual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              شراء من مواطن / عميل (جهاز مستعمل مع إقرار)
            </button>
            <button
              type="button"
              onClick={() => setSellerType('supplier')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                sellerType === 'supplier'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فاتورة مشتريات من مورد / تاجر
            </button>
          </div>

          {/* Seller / Citizen Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              بيانات البائع لتوثيق الملكية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  اسم البائع رباعي <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد علي أحمد الحاشدي"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  رقم الهاتف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="770000000"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  dir="ltr"
                />
              </div>

              {sellerType === 'individual' && (
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 text-xs mb-1 font-medium">
                    رقم البطاقة الشخصية / جواز السفر (إلزامي للتوثيق الأمني)
                  </label>
                  <input
                    type="text"
                    placeholder="رقم الهوية الوطنية أو رقم الجواز"
                    value={sellerIdCard}
                    onChange={(e) => setSellerIdCard(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Device Specifications */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">مواصفات الجهاز المشترى</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">الشركة</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Apple">Apple آبل</option>
                  <option value="Samsung">Samsung سامسونج</option>
                  <option value="Xiaomi">Xiaomi شاومي</option>
                  <option value="Honor">Honor هونر</option>
                  <option value="Huawei">Huawei هواوي</option>
                  <option value="Infinix">Infinix إنفينيكس</option>
                  <option value="Tecno">Tecno تكنو</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  موديل الجهاز <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: iPhone 13 Pro Max"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">الحالة</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="مستعمل ممتاز">مستعمل ممتاز (شبه جديد)</option>
                  <option value="مستعمل جيد">مستعمل جيد (خدوش خفيفة)</option>
                  <option value="جديد">جديد بالكرتون</option>
                  <option value="مجدد">مجدد / مغير شاشة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">السعة</label>
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                >
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">اللون</label>
                <input
                  type="text"
                  placeholder="مثال: أزرق، أسود، تيتانيوم"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  الرقم التسلسلي / IMEI 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="3582019482..."
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono tracking-wider"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs mb-1 font-medium">
                ملاحظات الفحص ونسبة البطارية
              </label>
              <input
                type="text"
                placeholder="مثال: نسبة البطارية 88% - الشاشة وكالة - بدون كرتون"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Pricing & Cash Outflow */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              المالية والدفع بالصندوق
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  سعر الشراء (التكلفة) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  عملة الشراء والخزينة
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="USD">الدولار الأمريكي (USD $)</option>
                  <option value="SAR">الريال السعودي (SAR ر.س)</option>
                  <option value="YER">الريال اليمني (YER ر.ي)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-1 font-medium">
                  سعر البيع المقترح بالمخزن
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="اختياري للتسعير الفوري"
                  value={salePriceEstimate || ''}
                  onChange={(e) => setSalePriceEstimate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>سيتم خصم هذا المبلغ فوراً من:</span>
              <span className="font-bold font-mono">
                خزينة {CURRENCY_CONFIG[currency].label}
              </span>
            </div>
          </div>

          {/* Legal Acknowledgement Checkbox */}
          {sellerType === 'individual' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <input
                type="checkbox"
                id="pledge"
                checked={legalPledgeAccepted}
                onChange={(e) => setLegalPledgeAccepted(e.target.checked)}
                className="mt-0.5 rounded text-amber-600"
              />
              <label htmlFor="pledge" className="cursor-pointer">
                تم التحقق من مطابقة بطاقة هوية البائع مع بصمته، وإقراره بأن الجهاز ملك قانوني له وخالٍ من أي تعميمات أمنية.
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              إتمام الشراء وحفظ الجهاز بالمخزون
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
