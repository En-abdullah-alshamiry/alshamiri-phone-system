import { Currency, ExchangeRates } from '../types';

export const CURRENCY_CONFIG: Record<Currency, { code: Currency; symbol: string; label: string; color: string; badgeBg: string }> = {
  YER: {
    code: 'YER',
    symbol: 'ر.ي',
    label: 'ريال يمني',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    label: 'ريال سعودي',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'دولار أمريكي',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

/**
 * Convert any amount from source currency to target currency
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  if (from === to || amount === 0) return amount;

  // Step 1: Convert `from` to YER (Base intermediary)
  let inYER = amount;
  if (from === 'USD') {
    inYER = amount * rates.YER_PER_USD;
  } else if (from === 'SAR') {
    inYER = amount * rates.YER_PER_SAR;
  }

  // Step 2: Convert YER to `to`
  if (to === 'YER') {
    return inYER;
  } else if (to === 'USD') {
    return rates.YER_PER_USD > 0 ? inYER / rates.YER_PER_USD : 0;
  } else if (to === 'SAR') {
    return rates.YER_PER_SAR > 0 ? inYER / rates.YER_PER_SAR : 0;
  }

  return amount;
}

/**
 * Format money with thousands separator and symbol
 */
export function formatMoney(
  amount: number,
  currency: Currency,
  includeSymbol = true
): string {
  const isFractional = currency === 'USD' || Math.abs(amount % 1) > 0.001;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isFractional ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!includeSymbol) return formattedNumber;
  return `${formattedNumber} ${CURRENCY_CONFIG[currency].symbol}`;
}

/**
 * Format date in Arabic locale
 */
export function formatDate(dateString?: string | null, includeTime = true): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    });
  } catch {
    return dateString;
  }
}

/**
 * Generate sequential IDs with prefix
 */
export function generateCode(prefix: string): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const yearShort = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${prefix}-${yearShort}${month}-${random}`;
}
