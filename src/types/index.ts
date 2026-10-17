export type Currency = 'YER' | 'SAR' | 'USD';

export interface ExchangeRates {
  YER_PER_USD: number; // e.g., 535 or 1600
  YER_PER_SAR: number; // e.g., 140 or 420
  lastUpdated: string;
}

export interface StoreInfo {
  name: string;
  subtitle: string;
  ownerName: string;
  phone: string;
  phone2?: string;
  address: string;
  crNumber?: string; // Commercial register / Tax
  maintenanceTerms: string;
  salesTerms: string;
}

export type ProductCategory = 
  | 'new_phones' 
  | 'used_phones' 
  | 'spare_parts' 
  | 'accessories' 
  | 'batteries' 
  | 'tools';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  barcode: string;
  imei?: string;
  imei2?: string;
  quantity: number;
  minAlertQuantity: number;
  costPrice: number;
  costCurrency: Currency;
  salePrice: number;
  saleCurrency: Currency;
  condition?: 'جديد' | 'مستعمل ممتاز' | 'مستعمل جيد' | 'مجدد';
  color?: string;
  storage?: string; // e.g., 128GB, 256GB
  notes?: string;
  createdAt: string;
}

export type MaintenanceStatus = 
  | 'received'       // تم الاستلام وقيد الفحص
  | 'waiting_parts'  // بانتظار قطع الغيار
  | 'in_repair'      // جاري الإصلاح
  | 'ready'          // جاهز للتسليم
  | 'delivered'      // تم التسليم والمحاسبة
  | 'cancelled';     // ملغي / تعذر الإصلاح

export interface MaintenanceSparePartUsed {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  costCurrency: Currency;
  chargedPrice: number;
  chargedCurrency: Currency;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  color?: string;
  imei?: string;
  issueDescription: string;
  lockType: 'pattern' | 'pin' | 'none';
  lockCode?: string; // pin code or pattern sequence e.g. "1-2-5-8"
  receivedAccessories: string[]; // e.g. "بدون شاحن", "مع بيت", "مع شريحة"
  deviceConditionNotes?: string; // خدوش، كسر سابق، ماء
  status: MaintenanceStatus;
  technicianName?: string;
  estimatedCost: number;
  costCurrency: Currency;
  depositAmount: number; // عربون
  depositCurrency: Currency;
  laborFee: number; // أجرة اليد
  spareParts: MaintenanceSparePartUsed[];
  finalAmount: number;
  finalCurrency: Currency;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  receivedAt: string;
  expectedDeliveryDate?: string; // موعد التسليم المتفق عليه مع العميل
  deliveryDateHistory?: {
    changedAt: string;
    previousDate?: string;
    newDate: string;
    reason?: string;
    changedBy?: string;
  }[];
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  unitCurrency: Currency;
  customDiscount: number; // discount per unit
  imei?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  currency: Currency;
  subtotal: number;
  discount: number;
  total: number;
  paymentType: 'cash' | 'transfer' | 'credit';
  paidAmount: number;
  paidCurrency: Currency;
  exchangeRateUsed: number; // exchange rate to invoice currency if paid in another currency
  changeAmount: number;
  changeCurrency: Currency;
  cashboxAffected: Currency;
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  purchaseNumber: string;
  date: string;
  sellerType: 'supplier' | 'individual'; // شراء من مورد أو شراء جوال مستعمل من مواطن
  sellerName: string;
  sellerPhone: string;
  sellerIdCard?: string; // رقم الهوية لتوثيق شراء الهواتف المستعملة
  items: {
    productName: string;
    category: ProductCategory;
    imei?: string;
    imei2?: string;
    condition?: string;
    quantity: number;
    costPrice: number;
    currency: Currency;
  }[];
  currency: Currency;
  total: number;
  paymentType: 'cash' | 'transfer' | 'credit';
  cashboxAffected: Currency;
  notes?: string;
}

export type TransactionType = 
  | 'sale_income' 
  | 'maintenance_income' 
  | 'maintenance_deposit'
  | 'purchase_expense' 
  | 'operational_expense' 
  | 'currency_exchange_in' 
  | 'currency_exchange_out'
  | 'debt_payment'
  | 'capital_deposit'
  | 'other';

export interface CashboxTransaction {
  id: string;
  date: string;
  currency: Currency;
  amount: number; // positive for income, negative for expense
  type: TransactionType;
  referenceId?: string; // invoiceId or ticketId or voucherId
  title: string;
  description?: string;
  performedBy?: string;
}

export interface ExpenseVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  category: 'إيجار' | 'كهرباء ومياه' | 'إنترنت واتصالات' | 'رواتب ومكافآت' | 'ضيافة وبوفيه' | 'صيانة ومعدات' | 'نثريات ومشتريات عامة';
  amount: number;
  currency: Currency;
  recipient: string;
  description: string;
  cashboxAffected: Currency;
}

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  amount: number;
  currency: Currency;
  payer: string;
  category: 'سداد ذمة عميل' | 'إيراد خدمات أخرى' | 'إيداع رأس مال' | 'أخرى';
  description: string;
  cashboxAffected: Currency;
}

export interface CurrencyExchangeRecord {
  id: string;
  date: string;
  fromCurrency: Currency;
  fromAmount: number;
  toCurrency: Currency;
  toAmount: number;
  exchangeRate: number;
  notes?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  balances: {
    YER: number; // positive means owes us (debit), negative means we owe them (credit)
    SAR: number;
    USD: number;
  };
  notes?: string;
  createdAt: string;
}

export interface AppData {
  storeInfo: StoreInfo;
  exchangeRates: ExchangeRates;
  products: Product[];
  maintenanceTickets: MaintenanceTicket[];
  salesInvoices: SaleInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  cashTransactions: CashboxTransaction[];
  expenseVouchers: ExpenseVoucher[];
  receiptVouchers: ReceiptVoucher[];
  currencyExchanges: CurrencyExchangeRecord[];
  customers: CustomerAccount[];
}
