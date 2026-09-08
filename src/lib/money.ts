/** Single source of truth for money math (Egypt VAT 14%). */
export const VAT_RATE = 0.14;

export function calcTotals(subtotal: number, discount = 0): { subtotal: number; tax: number; total: number } {
  const safeSubtotal = Math.max(0, Number.isFinite(subtotal) ? subtotal : 0);
  const safeDiscount = Math.min(Math.max(0, Number.isFinite(discount) ? discount : 0), safeSubtotal);
  const taxable = safeSubtotal - safeDiscount;
  const tax = Math.round(taxable * VAT_RATE * 100) / 100;
  return { subtotal: safeSubtotal, tax, total: Math.round((taxable + tax) * 100) / 100 };
}

const formatterCache = new Map<string, Intl.NumberFormat>();
export function formatMoney(value: number, locale = 'ar-EG', currency = 'EGP'): string {
  const key = `${locale}|${currency}`;
  let f = formatterCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 });
    } catch {
      f = new Intl.NumberFormat('en-US');
    }
    formatterCache.set(key, f);
  }
  try {
    return f.format(value);
  } catch {
    return String(value);
  }
}
