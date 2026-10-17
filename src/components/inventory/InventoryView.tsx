import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Smartphone,
  Tag,
  Filter,
  DollarSign,
  X,
  Check,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Product, ProductCategory, Currency, ExchangeRates } from '../../types';
import { formatMoney, convertCurrency, CURRENCY_CONFIG } from '../../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  exchangeRates: ExchangeRates;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  exchangeRates,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('accessories');
  const [barcode, setBarcode] = useState('');
  const [imei, setImei] = useState('');
  const [imei2, setImei2] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [minAlertQuantity, setMinAlertQuantity] = useState<number>(2);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [costCurrency, setCostCurrency] = useState<Currency>('YER');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleCurrency, setSaleCurrency] = useState<Currency>('YER');
  const [condition, setCondition] = useState<any>('جديد');
  const [color, setColor] = useState('');
  const [storage, setStorage] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategory('accessories');
    setBarcode(`BAR-${Math.floor(100000 + Math.random() * 900000)}`);
    setImei('');
    setImei2('');
    setQuantity(1);
    setMinAlertQuantity(2);
    setCostPrice(0);
    setCostCurrency('YER');
    setSalePrice(0);
    setSaleCurrency('YER');
    setCondition('جديد');
    setColor('');
    setStorage('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setBarcode(product.barcode);
    setImei(product.imei || '');
    setImei2(product.imei2 || '');
    setQuantity(product.quantity);
    setMinAlertQuantity(product.minAlertQuantity);
    setCostPrice(product.costPrice);
    setCostCurrency(product.costCurrency);
    setSalePrice(product.salePrice);
    setSaleCurrency(product.saleCurrency);
    setCondition(product.condition || 'جديد');
    setColor(product.color || '');
    setStorage(product.storage || '');
    setNotes(product.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم الصنف');
      return;
    }

    const savedProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      category,
      barcode: barcode.trim() || `BAR-${Date.now().toString().slice(-8)}`,
      imei: imei.trim(),
      imei2: imei2.trim(),
      quantity: Number(quantity),
      minAlertQuantity: Number(minAlertQuantity),
      costPrice: Number(costPrice),
      costCurrency,
      salePrice: Number(salePrice),
      saleCurrency,
      condition,
      color: color.trim(),
      storage: storage.trim(),
      notes: notes.trim(),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(savedProduct);
    setIsModalOpen(false);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchCurr = currencyFilter === 'all' || p.saleCurrency === currencyFilter;
      const matchLowStock = !onlyLowStock || p.quantity <= p.minAlertQuantity;
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        (p.imei && p.imei.toLowerCase().includes(term));

      return matchCat && matchCurr && matchLowStock && matchSearch;
    });
  }, [products, categoryFilter, currencyFilter, onlyLowStock, searchTerm]);

  // Overall Inventory Stats
  const totalCostYER = products.reduce(
    (sum, p) =>
      sum + convertCurrency(p.costPrice * p.quantity, p.costCurrency, 'YER', exchangeRates),
    0
  );

  const totalSaleYER = products.reduce(
    (sum, p) =>
      sum + convertCurrency(p.salePrice * p.quantity, p.saleCurrency, 'YER', exchangeRates),
    0
  );

  const lowStockCount = products.filter((p) => p.quantity <= p.minAlertQuantity).length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              إدارة المخزون وقطع الغيار
            </h1>
            <p className="text-xs text-slate-500">
              تسعير متعدد العملات (USD, SAR, YER)، متابعة الأجهزة بالـ IMEI، وحدود الطلب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف / جهاز جديد</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
          <span className="text-slate-500 font-medium">إجمالي الأصناف بالمخزن:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{products.length} صنف</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
          <span className="text-slate-500 font-medium">القيمة المقدرة للبيع (YER):</span>
          <span className="font-bold text-indigo-700 font-mono text-sm" dir="ltr">
            {formatMoney(totalSaleYER, 'YER')}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
          <span className="text-slate-500 font-medium">أصناف تحت حد الطلب:</span>
          <span className="font-bold text-rose-600 font-mono text-sm">{lowStockCount} صنف</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، الباركود، أو رقم الـ IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/30 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="new_phones">هواتف جديدة</option>
            <option value="used_phones">هواتف مستعملة</option>
            <option value="spare_parts">قطع غيار وشاشات</option>
            <option value="accessories">إكسسوارات</option>
            <option value="batteries">بطاريات</option>
            <option value="tools">أدوات ومعدات صيانة</option>
          </select>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
          >
            <option value="all">جميع العملات</option>
            <option value="YER">ريال يمني (YER)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
          </select>

          {/* Low stock toggle */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1 border transition-all ${
              onlyLowStock
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>نواقص المخزون فقط</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">اسم الصنف والمواصفات</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">الباركود / IMEI</th>
                <th className="p-3 text-center">الكمية</th>
                <th className="p-3 text-left">سعر التكلفة</th>
                <th className="p-3 text-left">سعر البيع</th>
                <th className="p-3 text-center">تحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.quantity <= p.minAlertQuantity;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        {p.condition && <span>الحالة: {p.condition}</span>}
                        {p.color && <span>اللون: {p.color}</span>}
                        {p.storage && <span>السعة: {p.storage}</span>}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {p.category === 'new_phones'
                          ? 'هاتف جديد'
                          : p.category === 'used_phones'
                          ? 'هاتف مستعمل'
                          : p.category === 'spare_parts'
                          ? 'شاشة / قطعة غيار'
                          : p.category === 'batteries'
                          ? 'بطارية'
                          : 'إكسسوار'}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600" dir="ltr">
                      <div>{p.barcode}</div>
                      {p.imei && <div className="text-[10px] text-slate-400">IMEI: {p.imei}</div>}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                          p.quantity <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.quantity}
                      </span>
                    </td>

                    <td className="p-3 text-left font-mono font-medium text-slate-600" dir="ltr">
                      {formatMoney(p.costPrice, p.costCurrency)}
                    </td>

                    <td className="p-3 text-left font-mono font-bold text-indigo-700" dir="ltr">
                      {formatMoney(p.salePrice, p.saleCurrency)}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="تعديل الصنف"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الصنف "${p.name}"؟`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزون'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الصنف أو الموديل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاشة سامسونج A12 أصلية أو iPhone 14 Pro 128GB"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="new_phones">هواتف جديدة</option>
                    <option value="used_phones">هواتف مستعملة</option>
                    <option value="spare_parts">قطع غيار وشاشات</option>
                    <option value="accessories">إكسسوارات وكابلات</option>
                    <option value="batteries">بطاريات</option>
                    <option value="tools">أدوات صيانة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الباركود</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* IMEI if phone */}
              {(category === 'new_phones' || category === 'used_phones') && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الـ IMEI 1</label>
                      <input
                        type="text"
                        placeholder="3582019..."
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الـ IMEI 2 (اختياري)</label>
                      <input
                        type="text"
                        placeholder="3582020..."
                        value={imei2}
                        onChange={(e) => setImei2(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity & Alerts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الكمية المتوفرة</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">حد التنبيه عند النقصان</label>
                  <input
                    type="number"
                    min="0"
                    value={minAlertQuantity}
                    onChange={(e) => setMinAlertQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Cost Price & Currency */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">سعر التكلفة</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={costPrice || ''}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عملة التكلفة</label>
                    <select
                      value={costCurrency}
                      onChange={(e) => setCostCurrency(e.target.value as Currency)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="YER">ريال يمني (YER)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>
                </div>

                {/* Sale Price & Currency */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">سعر البيع المعتمد</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={salePrice || ''}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عملة البيع</label>
                    <select
                      value={saleCurrency}
                      onChange={(e) => setSaleCurrency(e.target.value as Currency)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700"
                    >
                      <option value="YER">ريال يمني (YER)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
