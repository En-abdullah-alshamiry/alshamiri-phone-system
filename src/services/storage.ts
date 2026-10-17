import {
  AppData,
  CashboxTransaction,
  Currency,
  CustomerAccount,
  ExpenseVoucher,
  MaintenanceTicket,
  Product,
  PurchaseInvoice,
  ReceiptVoucher,
  SaleInvoice,
  CurrencyExchangeRecord,
} from '../types';

const STORAGE_KEY = 'falcon_phone_store_data_v1';

export const INITIAL_DATA: AppData = {
  storeInfo: {
    name: 'الشميري فون',
    subtitle: 'بيع وشراء الجوالات الجديدة والمستعملة - صيانة متقدمة - قطع غيار وإكسسوارات',
    ownerName: 'م. عبدالله الشميري',
    phone: '777123456',
    phone2: '711987654',
    address: 'صنعاء - شارع صخر - مقابل مجمع الاتصالات التجاري',
    crNumber: 'CR-984321',
    maintenanceTerms: '1. الضمان لا يشمل كسر الشاشة أو تسريب السوائل بعد التسليم. 2. يسقط حق المطالبة بالجهاز بعد مرور 60 يوماً من إشعار الجاهزية. 3. المحل غير مسؤول عن البيانات المخزنة يرجى عمل نسخة احتياطية.',
    salesTerms: 'الأجهزة الجديدة تخضع لضمان الوكيل الرسمي. الأجهزة المستعملة مضمونة لمدة 7 أيام فحص هاردوير.',
  },
  exchangeRates: {
    YER_PER_USD: 535,
    YER_PER_SAR: 140,
    lastUpdated: new Date().toISOString(),
  },
  products: [
    {
      id: 'prod-1',
      name: 'iPhone 15 Pro Max 256GB - تيتانيوم طبيعي',
      category: 'new_phones',
      barcode: '195949038221',
      imei: '354892019482012',
      imei2: '354892019482013',
      quantity: 3,
      minAlertQuantity: 2,
      costPrice: 980,
      costCurrency: 'USD',
      salePrice: 1080,
      saleCurrency: 'USD',
      condition: 'جديد',
      color: 'تيتانيوم طبيعي',
      storage: '256GB',
      notes: 'نسخة الشرق الأوسط شريحتين',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'prod-2',
      name: 'Samsung Galaxy S24 Ultra 512GB - تيتانيوم رمادي',
      category: 'new_phones',
      barcode: '8806095302911',
      imei: '351982038475920',
      imei2: '351982038475921',
      quantity: 2,
      minAlertQuantity: 1,
      costPrice: 910,
      costCurrency: 'USD',
      salePrice: 1010,
      saleCurrency: 'USD',
      condition: 'جديد',
      color: 'رمادي',
      storage: '512GB',
      notes: 'مع قلم S Pen وكفالة معتمدة',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'prod-3',
      name: 'iPhone 13 128GB - أزرق (مستعمل شبه جديد)',
      category: 'used_phones',
      barcode: '194252706899',
      imei: '358201948271049',
      imei2: '358201948271050',
      quantity: 1,
      minAlertQuantity: 1,
      costPrice: 420,
      costCurrency: 'USD',
      salePrice: 480,
      saleCurrency: 'USD',
      condition: 'مستعمل ممتاز',
      color: 'أزرق',
      storage: '128GB',
      notes: 'نسبة البطارية 89% لا توجد أي خدوش، شاشة وبودي وكالة',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'prod-4',
      name: 'Xiaomi Redmi Note 13 8GB/256GB - أسود',
      category: 'new_phones',
      barcode: '6941812759321',
      imei: '862019482019283',
      quantity: 5,
      minAlertQuantity: 2,
      costPrice: 620,
      costCurrency: 'SAR',
      salePrice: 710,
      saleCurrency: 'SAR',
      condition: 'جديد',
      color: 'أسود منتصف الليل',
      storage: '256GB',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'prod-5',
      name: 'شاشة iPhone 12 Pro كاملة OLED أصلية وكالة',
      category: 'spare_parts',
      barcode: 'SP-IPH12P-OLED',
      quantity: 4,
      minAlertQuantity: 2,
      costPrice: 280,
      costCurrency: 'SAR',
      salePrice: 380,
      saleCurrency: 'SAR',
      condition: 'جديد',
      notes: 'شاشة أصلية مجربة تدعم True Tone',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'prod-6',
      name: 'شاشة Samsung Galaxy A54 5G أصلية مع فريم',
      category: 'spare_parts',
      barcode: 'SP-SMA54-SCR',
      quantity: 3,
      minAlertQuantity: 1,
      costPrice: 210,
      costCurrency: 'SAR',
      salePrice: 290,
      saleCurrency: 'SAR',
      condition: 'جديد',
      notes: 'Super AMOLED أصلية فريم كامل',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'prod-7',
      name: 'بطارية iPhone 13 أصلية سعة 3227mAh',
      category: 'batteries',
      barcode: 'BAT-IPH13-OEM',
      quantity: 6,
      minAlertQuantity: 3,
      costPrice: 25,
      costCurrency: 'USD',
      salePrice: 40,
      saleCurrency: 'USD',
      condition: 'جديد',
      notes: 'بطارية أصلية زيرو دورات شحن',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: 'prod-8',
      name: 'شاحن أنكر سريع Anker Nano 20W USB-C',
      category: 'accessories',
      barcode: '848061039201',
      quantity: 14,
      minAlertQuantity: 5,
      costPrice: 4500,
      costCurrency: 'YER',
      salePrice: 7000,
      saleCurrency: 'YER',
      condition: 'جديد',
      color: 'أبيض',
      notes: 'شاحن أنكر معتمد يدعم الشحن السريع للآيفون والسامسونج',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'prod-9',
      name: 'كيبل تايب سي إلى لايتنينج Type-C to Lightning أصلي 1M',
      category: 'accessories',
      barcode: 'CBL-IPH-TC-1M',
      quantity: 18,
      minAlertQuantity: 6,
      costPrice: 2000,
      costCurrency: 'YER',
      salePrice: 3500,
      saleCurrency: 'YER',
      condition: 'جديد',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'prod-10',
      name: 'لاصق حماية زجاجي 9D ضد الكسر لجميع الموديلات',
      category: 'accessories',
      barcode: 'GLS-PRO-9D',
      quantity: 45,
      minAlertQuantity: 10,
      costPrice: 400,
      costCurrency: 'YER',
      salePrice: 1500,
      saleCurrency: 'YER',
      condition: 'جديد',
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
  ],
  maintenanceTickets: [
    {
      id: 'tkt-1',
      ticketNumber: 'REP-2410-101',
      customerName: 'فؤاد محمد الشرعبي',
      customerPhone: '771239840',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 13 Pro',
      color: 'أزرق سيراليوني',
      imei: '359102938471029',
      issueDescription: 'كسر في الشاشة واللمس متوقف في الجزء العلوي، بطء في الشحن',
      lockType: 'pattern',
      lockCode: '1-2-5-8-9',
      receivedAccessories: ['مع كفر حماية', 'بدون شريحة', 'بدون شاحن'],
      deviceConditionNotes: 'خدوش طفيفة على الحواف الجانبية، الشاشة مكسورة بالكامل',
      status: 'in_repair',
      technicianName: 'المهندس ياسين',
      estimatedCost: 350,
      costCurrency: 'SAR',
      depositAmount: 100,
      depositCurrency: 'SAR',
      laborFee: 70,
      spareParts: [
        {
          productId: 'prod-5',
          name: 'شاشة iPhone 12 Pro كاملة OLED أصلية',
          quantity: 1,
          costPrice: 280,
          costCurrency: 'SAR',
          chargedPrice: 280,
          chargedCurrency: 'SAR',
        },
      ],
      finalAmount: 350,
      finalCurrency: 'SAR',
      paymentStatus: 'partially_paid',
      receivedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), // يقترب الموعد اليوم خلال 3 ساعات
      notes: 'تم فحص البورد سليم، في مرحلة تركيب الشاشة وتثبيت لصاق الوكالة',
    },
    {
      id: 'tkt-2',
      ticketNumber: 'REP-2410-102',
      customerName: 'بشير علوان الحميري',
      customerPhone: '733910284',
      deviceBrand: 'Samsung',
      deviceModel: 'Galaxy A54 5G',
      color: 'ليموني',
      imei: '352819203948571',
      issueDescription: 'الجهاز سقط بالماء ثم انطفأ، يسخن عند وضع الشاحن',
      lockType: 'pin',
      lockCode: '8520',
      receivedAccessories: ['بدون أي ملحقات'],
      deviceConditionNotes: 'علامات رطوبة في مدخل الشحن',
      status: 'waiting_parts',
      technicianName: 'المهندس ياسين',
      estimatedCost: 65000,
      costCurrency: 'YER',
      depositAmount: 20000,
      depositCurrency: 'YER',
      laborFee: 25000,
      spareParts: [],
      finalAmount: 65000,
      finalCurrency: 'YER',
      paymentStatus: 'partially_paid',
      receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // تم تأجيله بسبب انتظار القطع
      deliveryDateHistory: [
        {
          changedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          previousDate: new Date(Date.now() - 86400000 * 0.5).toISOString(),
          newDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
          reason: 'تأخر وصول آي سي الشحن البديل من المورد التجاري، تم إبلاغ العميل هاتفياً والموافقة على التمديد',
          changedBy: 'المهندس ياسين',
        },
      ],
      notes: 'تم تنظيف البورد بالموجات فوق الصوتية، بانتظار وصول آي سي الشحن',
    },
    {
      id: 'tkt-3',
      ticketNumber: 'REP-2410-103',
      customerName: 'طارق يحيى القاضي',
      customerPhone: '775839201',
      deviceBrand: 'Xiaomi',
      deviceModel: 'Redmi Note 12S',
      color: 'أزرق',
      imei: '861928374659102',
      issueDescription: 'استبدال سوكت الشحن وميكروفون المكالمات ضعيف جداً',
      lockType: 'none',
      receivedAccessories: ['مع شاحن وسلك'],
      deviceConditionNotes: 'حالة ممتازة',
      status: 'ready',
      technicianName: 'المهندس سمير',
      estimatedCost: 15000,
      costCurrency: 'YER',
      depositAmount: 0,
      depositCurrency: 'YER',
      laborFee: 15000,
      spareParts: [],
      finalAmount: 15000,
      finalCurrency: 'YER',
      paymentStatus: 'unpaid',
      receivedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      completedAt: new Date().toISOString(),
      notes: 'تم الإصلاح وتجربة الشحن السريع والصوت بنجاح، الجهاز جاهز لتسليم العميل',
    },
    {
      id: 'tkt-4',
      ticketNumber: 'REP-2410-098',
      customerName: 'مروان خالد الصنعاني',
      customerPhone: '770918273',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 11',
      color: 'أبيض',
      imei: '358192038471920',
      issueDescription: 'استبدال بطارية قديمة تفريغ سريع جداً',
      lockType: 'pin',
      lockCode: '1995',
      receivedAccessories: [],
      status: 'delivered',
      technicianName: 'المهندس ياسين',
      estimatedCost: 35,
      costCurrency: 'USD',
      depositAmount: 35,
      depositCurrency: 'USD',
      laborFee: 10,
      spareParts: [
        {
          productId: 'prod-7',
          name: 'بطارية iPhone 11 أصلية',
          quantity: 1,
          costPrice: 20,
          costCurrency: 'USD',
          chargedPrice: 25,
          chargedCurrency: 'USD',
        },
      ],
      finalAmount: 35,
      finalCurrency: 'USD',
      paymentStatus: 'paid',
      receivedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      deliveredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: 'تم استبدال البطارية مع نقل الفلاتة الأصلية لتظهر النسبة 100%',
    },
  ],
  salesInvoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2410-045',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      customerName: 'عميل نقدي (معاذ الأهدل)',
      customerPhone: '772183920',
      items: [
        {
          product: {
            id: 'prod-8',
            name: 'شاحن أنكر سريع Anker Nano 20W USB-C',
            category: 'accessories',
            barcode: '848061039201',
            quantity: 14,
            minAlertQuantity: 5,
            costPrice: 4500,
            costCurrency: 'YER',
            salePrice: 7000,
            saleCurrency: 'YER',
            createdAt: '',
          },
          quantity: 1,
          unitPrice: 7000,
          unitCurrency: 'YER',
          customDiscount: 0,
        },
        {
          product: {
            id: 'prod-9',
            name: 'كيبل تايب سي إلى لايتنينج Type-C to Lightning أصلي 1M',
            category: 'accessories',
            barcode: 'CBL-IPH-TC-1M',
            quantity: 18,
            minAlertQuantity: 6,
            costPrice: 2000,
            costCurrency: 'YER',
            salePrice: 3500,
            saleCurrency: 'YER',
            createdAt: '',
          },
          quantity: 1,
          unitPrice: 3500,
          unitCurrency: 'YER',
          customDiscount: 500,
        },
      ],
      currency: 'YER',
      subtotal: 10500,
      discount: 500,
      total: 10000,
      paymentType: 'cash',
      paidAmount: 10000,
      paidCurrency: 'YER',
      exchangeRateUsed: 1,
      changeAmount: 0,
      changeCurrency: 'YER',
      cashboxAffected: 'YER',
      notes: 'خصم خاص للكيبل مع الشاحن',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2410-046',
      date: new Date().toISOString(),
      customerName: 'جمال عبدالرحمن',
      customerPhone: '778901234',
      items: [
        {
          product: {
            id: 'prod-4',
            name: 'Xiaomi Redmi Note 13 8GB/256GB - أسود',
            category: 'new_phones',
            barcode: '6941812759321',
            imei: '862019482019283',
            quantity: 5,
            minAlertQuantity: 2,
            costPrice: 620,
            costCurrency: 'SAR',
            salePrice: 710,
            saleCurrency: 'SAR',
            createdAt: '',
          },
          quantity: 1,
          unitPrice: 710,
          unitCurrency: 'SAR',
          customDiscount: 10,
          imei: '862019482019283',
        },
      ],
      currency: 'SAR',
      subtotal: 710,
      discount: 10,
      total: 700,
      paymentType: 'cash',
      paidAmount: 700,
      paidCurrency: 'SAR',
      exchangeRateUsed: 1,
      changeAmount: 0,
      changeCurrency: 'SAR',
      cashboxAffected: 'SAR',
      notes: 'تم تسليم الجهاز مع كرت الضمان',
    },
  ],
  purchaseInvoices: [
    {
      id: 'pur-1',
      purchaseNumber: 'PUR-2410-019',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      sellerType: 'individual',
      sellerName: 'هشام صالح النجار',
      sellerPhone: '773482910',
      sellerIdCard: '010103948291',
      items: [
        {
          productName: 'iPhone 13 128GB - أزرق مستعمل',
          category: 'used_phones',
          imei: '358201948271049',
          imei2: '358201948271050',
          condition: 'مستعمل ممتاز - نسبة بطارية 89%',
          quantity: 1,
          costPrice: 420,
          currency: 'USD',
        },
      ],
      currency: 'USD',
      total: 420,
      paymentType: 'cash',
      cashboxAffected: 'USD',
      notes: 'تم توقيع إقرار الشراء والمطابقة مع بطاقة الهوية الوطنية',
    },
  ],
  cashTransactions: [
    {
      id: 'tx-1',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      currency: 'YER',
      amount: 1500000,
      type: 'capital_deposit',
      title: 'رصيد افتتاحي لصندوق الريال اليمني',
      description: 'افتتاح صندوق النقدية بداية الشهر',
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      currency: 'SAR',
      amount: 4500,
      type: 'capital_deposit',
      title: 'رصيد افتتاحي لصندوق الريال السعودي',
      description: 'افتتاح صندوق النقدية بداية الشهر',
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      currency: 'USD',
      amount: 3200,
      type: 'capital_deposit',
      title: 'رصيد افتتاحي لصندوق الدولار',
      description: 'افتتاح صندوق النقدية بداية الشهر',
    },
    {
      id: 'tx-4',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      currency: 'USD',
      amount: -420,
      type: 'purchase_expense',
      referenceId: 'pur-1',
      title: 'شراء جهاز مستعمل iPhone 13 من مواطن',
    },
    {
      id: 'tx-5',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      currency: 'USD',
      amount: 35,
      type: 'maintenance_income',
      referenceId: 'tkt-4',
      title: 'إيراد صيانة كرت REP-2410-098 (بطارية آيفون 11)',
    },
    {
      id: 'tx-6',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      currency: 'YER',
      amount: 20000,
      type: 'maintenance_deposit',
      referenceId: 'tkt-2',
      title: 'عربون صيانة كرت REP-2410-102 (سامسونج A54)',
    },
    {
      id: 'tx-7',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      currency: 'SAR',
      amount: 100,
      type: 'maintenance_deposit',
      referenceId: 'tkt-1',
      title: 'عربون صيانة كرت REP-2410-101 (آيفون 13 برو)',
    },
    {
      id: 'tx-8',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      currency: 'YER',
      amount: 10000,
      type: 'sale_income',
      referenceId: 'inv-1',
      title: 'مبيعات فاتورة INV-2410-045 (إكسسوارات)',
    },
    {
      id: 'tx-9',
      date: new Date().toISOString(),
      currency: 'SAR',
      amount: 700,
      type: 'sale_income',
      referenceId: 'inv-2',
      title: 'مبيعات فاتورة INV-2410-046 (ردمي نوت 13)',
    },
    {
      id: 'tx-10',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      currency: 'YER',
      amount: -35000,
      type: 'operational_expense',
      title: 'سداد فاتورة استهلاك الكهرباء والإنترنت للمحل',
      description: 'فاتورة شركة الاتصالات والكهرباء التجارية',
    },
  ],
  expenseVouchers: [
    {
      id: 'exp-1',
      voucherNumber: 'EXP-2410-012',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: 'كهرباء ومياه',
      amount: 35000,
      currency: 'YER',
      recipient: 'شركة الكهرباء والاتصالات',
      description: 'سداد استهلاك الكهرباء لشهر أكتوبر مع اشتراك فايبر المحل',
      cashboxAffected: 'YER',
    },
  ],
  receiptVouchers: [
    {
      id: 'rcp-1',
      voucherNumber: 'RCP-2410-008',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      amount: 50000,
      currency: 'YER',
      payer: 'أكرم الحداد',
      category: 'سداد ذمة عميل',
      description: 'دفعة سداد حساب سابق عن شراء ملحقات',
      cashboxAffected: 'YER',
    },
  ],
  currencyExchanges: [
    {
      id: 'ex-1',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      fromCurrency: 'USD',
      fromAmount: 100,
      toCurrency: 'YER',
      toAmount: 53500,
      exchangeRate: 535,
      notes: 'مصارفة لتغذية صندوق الريال اليمني للمصاريف اليومية',
    },
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'معاذ الأهدل',
      phone: '772183920',
      balances: { YER: 0, SAR: 0, USD: 0 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cust-2',
      name: 'فؤاد محمد الشرعبي',
      phone: '771239840',
      balances: { YER: 0, SAR: 250, USD: 0 }, // متبقي عليه 250 ريال سعودي عند استلام الصيانة
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cust-3',
      name: 'بشير علوان الحميري',
      phone: '733910284',
      balances: { YER: 45000, SAR: 0, USD: 0 },
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getStoredData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    const result: AppData = {
      ...INITIAL_DATA,
      ...parsed,
      exchangeRates: {
        ...INITIAL_DATA.exchangeRates,
        ...(parsed.exchangeRates || {}),
      },
      storeInfo: {
        ...INITIAL_DATA.storeInfo,
        ...(parsed.storeInfo || {}),
      },
    };

    // Auto-migrate legacy brand names to "الشميري فون" so existing LocalStorage updates immediately
    if (
      !result.storeInfo.name ||
      result.storeInfo.name.includes('الصقر') ||
      result.storeInfo.name.includes('Falcon')
    ) {
      result.storeInfo.name = 'الشميري فون';
      saveData(result);
    }

    return result;
  } catch (err) {
    console.error('Error reading localStorage data', err);
    return INITIAL_DATA;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
}

export function resetToDemoData(): AppData {
  saveData(INITIAL_DATA);
  return INITIAL_DATA;
}

const LAST_BACKUP_KEY = 'falcon_last_backup_timestamp';

export interface BackupPreviewStats {
  isValid: boolean;
  error?: string;
  storeName?: string;
  exportedAt?: string;
  productsCount: number;
  maintenanceTicketsCount: number;
  salesInvoicesCount: number;
  purchaseInvoicesCount: number;
  cashTransactionsCount: number;
  customersCount: number;
  data?: AppData;
}

export function getLastBackupTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export function recordBackupTimestamp(): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch {}
}

export function getDatabaseSizeKB(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return Math.round((new Blob([raw]).size / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function exportBackupJSON(data: AppData): { filename: string; jsonString: string } {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const storeSlug = (data.storeInfo.name || 'store').replace(/\s+/g, '_').slice(0, 15);
  const filename = `backup_${storeSlug}_${dateStr}_${timeStr}.json`;

  const backupPayload = {
    _meta: {
      system: 'الشميري فون - لإدارة المبيعات والصيانة والحسابات',
      version: '1.2.0',
      exportedAt: now.toISOString(),
      storeName: data.storeInfo.name,
      statistics: {
        productsCount: data.products.length,
        maintenanceTicketsCount: data.maintenanceTickets.length,
        salesInvoicesCount: data.salesInvoices.length,
        purchaseInvoicesCount: data.purchaseInvoices.length,
        cashTransactionsCount: data.cashTransactions.length,
        customersCount: data.customers.length,
      },
    },
    ...data,
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  recordBackupTimestamp();

  return { filename, jsonString };
}

export function parseAndValidateBackup(jsonString: string): BackupPreviewStats {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both direct data or wrapped data
    const appData: AppData = {
      storeInfo: parsed.storeInfo || INITIAL_DATA.storeInfo,
      exchangeRates: parsed.exchangeRates || INITIAL_DATA.exchangeRates,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      maintenanceTickets: Array.isArray(parsed.maintenanceTickets) ? parsed.maintenanceTickets : [],
      salesInvoices: Array.isArray(parsed.salesInvoices) ? parsed.salesInvoices : [],
      purchaseInvoices: Array.isArray(parsed.purchaseInvoices) ? parsed.purchaseInvoices : [],
      cashTransactions: Array.isArray(parsed.cashTransactions) ? parsed.cashTransactions : [],
      expenseVouchers: Array.isArray(parsed.expenseVouchers) ? parsed.expenseVouchers : [],
      receiptVouchers: Array.isArray(parsed.receiptVouchers) ? parsed.receiptVouchers : [],
      currencyExchanges: Array.isArray(parsed.currencyExchanges) ? parsed.currencyExchanges : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    };

    if (!Array.isArray(parsed.products) && !Array.isArray(parsed.cashTransactions)) {
      return {
        isValid: false,
        error: 'الملف لا يحتوي على جداول قاعدة البيانات المتوافقة مع النظام (منتجات، حسابات، صيانة).',
        productsCount: 0,
        maintenanceTicketsCount: 0,
        salesInvoicesCount: 0,
        purchaseInvoicesCount: 0,
        cashTransactionsCount: 0,
        customersCount: 0,
      };
    }

    return {
      isValid: true,
      storeName: parsed._meta?.storeName || appData.storeInfo.name,
      exportedAt: parsed._meta?.exportedAt || (parsed.exchangeRates?.lastUpdated ? parsed.exchangeRates.lastUpdated : undefined),
      productsCount: appData.products.length,
      maintenanceTicketsCount: appData.maintenanceTickets.length,
      salesInvoicesCount: appData.salesInvoices.length,
      purchaseInvoicesCount: appData.purchaseInvoices.length,
      cashTransactionsCount: appData.cashTransactions.length,
      customersCount: appData.customers.length,
      data: appData,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'تنسيق الملف غير صالح أو تالف (JSON غير صحيح).',
      productsCount: 0,
      maintenanceTicketsCount: 0,
      salesInvoicesCount: 0,
      purchaseInvoicesCount: 0,
      cashTransactionsCount: 0,
      customersCount: 0,
    };
  }
}

export function importBackupJSON(file: File): Promise<BackupPreviewStats> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const validation = parseAndValidateBackup(content);
        if (!validation.isValid) {
          reject(new Error(validation.error || 'الملف غير صالح'));
          return;
        }
        resolve(validation);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف من القرص'));
    reader.readAsText(file);
  });
}

