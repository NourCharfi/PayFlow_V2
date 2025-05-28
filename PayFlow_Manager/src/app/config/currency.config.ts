export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_LOCALE = 'fr-FR';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, { 
    style: 'currency', 
    currency: DEFAULT_CURRENCY 
  }).format(amount);
}
