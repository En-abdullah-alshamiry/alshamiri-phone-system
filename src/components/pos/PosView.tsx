import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  CreditCard,
  User,
  Phone,
  Printer,
  Sparkles,
  ArrowRightLeft,
  Smartphone,
  Tag,
  AlertCircle,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Product,
  CartItem,
  Currency,
  ProductCategory,
  SaleInvoice,
  ExchangeRates,
  CustomerAccount,
} from '../../types';
import {
  formatMoney,
  convertCurrency,
  CURRENCY_CONFIG,
  generateCode,
} from '../../utils/formatters';

interface PosViewProps {
  products: Product[];
  exchangeRates: ExchangeRates;
  customers: CustomerAccount[];
  onCompleteSale: (invoice: SaleInvoice) => void;
  onOpenPurchaseModal: () => void;
  onPrintInvoice: (invoice: SaleInvoice) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  exchangeRates,
  customers,
  onCompleteSale,
  onOpenPurchaseModal,
  onPrintInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceCurrency, setInvoiceCurrency] = useState<Currency>('YER');
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);

  // Customer & Payment Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [paidCurrency, setPaidCurrency] = useState<Currency>('YER');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [changeCurrency, setChangeCurrency] = useState<Currency>('YER');
  const [saleNotes, setSaleNotes] = useState('');

  // Category Tabs
  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'new_phones', label: 'هواتف جديدة' },
    { id: 'used_phones', label: 'هواتف مستعملة' },
    { id: 'spare_parts', label: 'قطع غيار وشاشات' },
    { id: 'accessories', label: 'إكسسوارات' },
    { id: 'batteries', label: 'بطاريات' },
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'all' || p.category === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        (p.imei && p.imei.toLowerCase().includes(term)) ||
        (p.imei2 && p.imei2.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert('هذا الصنف نافذ من المخزون حالياً!');
      return;
    }

    // Convert product sale price to active invoice currency
    const convertedPrice = convertCurrency(
      product.salePrice,
      product.saleCurrency,
      invoiceCurrency,
      exchangeRates
    );

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert('وصلت للحد الأقصى المتوفر بالمخزون من هذا الصنف!');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: Math.round(convertedPrice * 100) / 100,
          unitCurrency: invoiceCurrency,
          customDiscount: 0,
          imei: product.imei,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              alert('الكمية المطلوبة تتجاوز الرصيد المتاح بالمخزن');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartUnitPrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, unitPrice: newPrice } : item
      )
    );
  };

  // Switch invoice currency & recalculate cart prices
  const handleSwitchInvoiceCurrency = (newCurr: Currency) => {
    if (newCurr === invoiceCurrency) return;
    setCart((prev) =>
      prev.map((item) => {
        const newUnitPrice = convertCurrency(
          item.unitPrice,
          item.unitCurrency,
          newCurr,
          exchangeRates
        );
        return {
          ...item,
          unitPrice: Math.round(newUnitPrice * 100) / 100,
          unitCurrency: newCurr,
        };
      })
    );
    setInvoiceCurrency(newCurr);
    setPaidCurrency(newCurr);
    setChangeCurrency(newCurr);
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const total = Math.max(0, subtotal - invoiceDiscount);

  // Open checkout dialog
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(total);
    setPaidCurrency(invoiceCurrency);
    setIsCheckoutOpen(true);
  };

  // Calculate equivalent paid in invoice currency and change
  const paidEquivalentInInvoiceCurrency = convertCurrency(
    paidAmount,
    paidCurrency,
    invoiceCurrency,
    exchangeRates
  );

  const differenceInInvoiceCurrency = paidEquivalentInInvoiceCurrency - total;
  const changeAmount =
    differenceInInvoiceCurrency > 0
      ? convertCurrency(
          differenceInInvoiceCurrency,
          invoiceCurrency,
          changeCurrency,
          exchangeRates
        )
      : 0;

  // Submit sale
  const handleConfirmSale = () => {
    const invoiceNumber = generateCode('INV');

    const invoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'عميل نقدي',
      customerPhone: customerPhone.trim(),
      items: cart,
      currency: invoiceCurrency,
      subtotal,
      discount: invoiceDiscount,
      total,
      paymentType,
      paidAmount,
      paidCurrency,
      exchangeRateUsed:
        paidCurrency === 'USD'
          ? exchangeRates.YER_PER_USD
          : paidCurrency === 'SAR'
          ? exchangeRates.YER_PER_SAR
          : 1,
      changeAmount: Math.round(changeAmount * 100) / 100,
      changeCurrency,
      cashboxAffected: paidCurrency,
      notes: saleNotes,
    };

    onCompleteSale(invoice);

    // Delight celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    // Reset Cart
    setCart([]);
    setInvoiceDiscount(0);
    setIsCheckoutOpen(false);

    // Ask to print
    onPrintInvoice(invoice);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-8.5rem)]">
      {/* Left/Main Column: Product Catalog & Fast Search (8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث باسم الهاتف، القطعة، الباركود، أو رقم الـ IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Button to Purchase Used Phone from Citizen */}
            <button
              onClick={onOpenPurchaseModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all shrink-0"
              title="تسجيل شراء هاتف مستعمل من مواطن أو تاجر"
            >
              <Smartphone className="w-4 h-4" />
              <span>شراء جهاز مستعمل</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <Smartphone className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
              <p>لم يتم العثور على أصناف مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.quantity <= 0;
                // Calculate display price in currently selected invoice currency
                const priceInInvoiceCurr = convertCurrency(
                  product.salePrice,
                  product.saleCurrency,
                  invoiceCurrency,
                  exchangeRates
                );

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between text-right relative group ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            product.category === 'new_phones'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : product.category === 'used_phones'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : product.category === 'spare_parts'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {product.category === 'new_phones'
                            ? 'هاتف جديد'
                            : product.category === 'used_phones'
                            ? 'مستعمل'
                            : product.category === 'spare_parts'
                            ? 'قطع غيار'
                            : 'إكسسوار'}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            product.quantity <= product.minAlertQuantity
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.quantity} متوفر
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {product.name}
                      </h4>

                      {/* IMEI if available */}
                      {product.imei && (
                        <p className="font-mono text-[10px] text-slate-400 mt-1 truncate" dir="ltr">
                          IMEI: {product.imei}
                        </p>
                      )}
                    </div>

                    {/* Price in Invoice Currency & Original Currency */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-black text-indigo-700 text-xs sm:text-sm" dir="ltr">
                          {formatMoney(priceInInvoiceCurr, invoiceCurrency)}
                        </div>
                        {product.saleCurrency !== invoiceCurrency && (
                          <div className="font-mono text-[9px] text-slate-400" dir="ltr">
                            الأصل: {formatMoney(product.salePrice, product.saleCurrency)}
                          </div>
                        )}
                      </div>

                      <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors text-slate-600">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Invoice Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Cart Header & Currency Picker */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-slate-900 text-sm">فاتورة البيع الحالية</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                تفريغ
              </button>
            )}
          </div>

          {/* Currency Selector for Invoice */}
          <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pr-2">عملة الفاتورة:</span>
            <div className="flex items-center gap-1">
              {(['YER', 'SAR', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSwitchInvoiceCurrency(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    invoiceCurrency === c
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {CURRENCY_CONFIG[c].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
              <ShoppingCart className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
              <p>سلة الفاتورة فارغة</p>
              <p className="text-[11px] text-slate-400 mt-1">اضغط على أي جهاز أو صنف لإضافته</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 text-xs leading-tight">
                      {item.product.name}
                    </h5>
                    {item.imei && (
                      <span className="font-mono text-[10px] text-slate-400" dir="ltr">
                        IMEI: {item.imei}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeCartItem(item.product.id)}
                    className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Unit price input & Item Total */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateCartUnitPrice(
                            item.product.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">
                        {CURRENCY_CONFIG[invoiceCurrency].symbol}
                      </span>
                    </div>

                    <div className="text-left font-mono font-black text-slate-900 text-xs min-w-[70px]" dir="ltr">
                      {formatMoney(item.quantity * item.unitPrice, invoiceCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-bold" dir="ltr">
                {formatMoney(subtotal, invoiceCurrency)}
              </span>
            </div>

            {/* Discount field */}
            <div className="flex items-center justify-between text-slate-600">
              <span>خصم إضافي:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={invoiceDiscount || ''}
                  onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-center font-mono"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-500">
                  {CURRENCY_CONFIG[invoiceCurrency].symbol}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
              <span>المبلغ الإجمالي:</span>
              <span className="font-mono text-indigo-700" dir="ltr">
                {formatMoney(total, invoiceCurrency)}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>متابعة الدفع وإنهاء الفاتورة</span>
          </button>
        </div>
      </div>

      {/* MULTI-CURRENCY CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg">
                  تسوية الدفع وتحديد عملة السداد
                </h3>
                <p className="text-xs text-slate-300">
                  قبول دفعات بعملات متعددة واحتساب الصرف آلياً
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Total Banner */}
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-700 font-bold">المطلوب بالفاتورة:</span>
                  <div className="text-xl font-black font-mono text-indigo-950" dir="ltr">
                    {formatMoney(total, invoiceCurrency)}
                  </div>
                </div>
                <div className="text-left text-[11px] text-slate-500 font-mono">
                  {cart.length} أصناف
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold text-xs">بيانات العميل</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم العميل (أو عميل نقدي)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="رقم الهاتف"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold text-xs">طريقة السداد</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentType === 'cash'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    نقداً (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('transfer')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentType === 'transfer'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تحويل / محفظة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentType === 'credit'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    آجل (على الحساب)
                  </button>
                </div>
              </div>

              {/* Multi-Currency Cash Drawer */}
              {paymentType !== 'credit' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      العملة التي يدفع بها العميل:
                    </span>
                    <div className="flex items-center gap-1">
                      {(['YER', 'SAR', 'USD'] as Currency[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setPaidCurrency(c);
                            // Pre-fill exact equivalent
                            const eq = convertCurrency(total, invoiceCurrency, c, exchangeRates);
                            setPaidAmount(Math.round(eq * 100) / 100);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            paidCurrency === c
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {CURRENCY_CONFIG[c].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid Amount Input */}
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">
                      المبلغ المستلم فعلياً:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={paidAmount || ''}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {CURRENCY_CONFIG[paidCurrency].symbol}
                      </span>
                    </div>
                  </div>

                  {/* Currency conversion breakdown if paid in different currency */}
                  {paidCurrency !== invoiceCurrency && (
                    <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                      <div className="flex justify-between">
                        <span>المبلغ المستلم يعادل بفاتورتك:</span>
                        <span className="font-mono font-bold" dir="ltr">
                          {formatMoney(paidEquivalentInInvoiceCurrency, invoiceCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-blue-700">
                        <span>سعر الصرف المعتمد:</span>
                        <span className="font-mono">
                          {paidCurrency === 'USD'
                            ? `$1 = ${exchangeRates.YER_PER_USD} YER`
                            : `1 SAR = ${exchangeRates.YER_PER_SAR} YER`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Change / Remainder */}
                  {changeAmount > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span>المتبقي للعميل (الصرف):</span>
                        <span className="font-mono text-base" dir="ltr">
                          {formatMoney(changeAmount, changeCurrency)}
                        </span>
                      </div>

                      {/* Currency of change */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/80">
                        <span className="text-amber-800 text-[11px]">إرجاع الصرف بعملة:</span>
                        <div className="flex items-center gap-1">
                          {(['YER', 'SAR', 'USD'] as Currency[]).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setChangeCurrency(c)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                changeCurrency === c
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white text-amber-900'
                              }`}
                            >
                              {CURRENCY_CONFIG[c].symbol}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Note field */}
              <div>
                <input
                  type="text"
                  placeholder="ملاحظات على الفاتورة (اختياري)..."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSale}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وطباعة الفاتورة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
