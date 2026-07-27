/**
 * Format integer minor units (e.g. 1999 → ₺19,99). Floats are forbidden in storage.
 */
export function formatMoney(amountMinor: number, currency = 'TRY', locale = 'tr-TR'): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}
