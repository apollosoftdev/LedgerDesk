import { getSetting, setSetting } from './settings';

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'KRW', symbol: '₩' },
  { code: 'INR', symbol: '₹' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

let _current: { code: string; symbol: string } = { code: 'USD', symbol: '$' };

export async function loadCurrency() {
  const code = (await getSetting('currency_code')) ?? 'USD';
  const found = CURRENCIES.find(c => c.code === code);
  _current = found ? { code: found.code, symbol: found.symbol } : { code: 'USD', symbol: '$' };
}

export function currentSymbol(): string {
  return _current.symbol;
}

export function currentCode(): string {
  return _current.code;
}

export async function setCurrency(code: CurrencyCode) {
  const found = CURRENCIES.find(c => c.code === code);
  if (!found) return;
  _current = { code: found.code, symbol: found.symbol };
  await setSetting('currency_code', code);
}

export function formatAmount(amount: number, paymentType: 0 | 1): string {
  const sym = currentSymbol();
  const abs = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return paymentType === 1 ? `-${sym}${abs}` : `+${sym}${abs}`;
}

export function formatBalance(amount: number): string {
  const sym = currentSymbol();
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${sym}${abs}`;
}
