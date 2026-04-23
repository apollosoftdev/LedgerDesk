import { getSetting, setSetting } from './settings';

export const CURRENCIES = [
  { code: 'CNY', symbol: '¥' },
  { code: 'USD', symbol: '$' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

const DEFAULT: { code: string; symbol: string } = { code: 'CNY', symbol: '¥' };
let _current = { ...DEFAULT };

export async function loadCurrency() {
  const code = (await getSetting('currency_code')) ?? DEFAULT.code;
  const found = CURRENCIES.find(c => c.code === code);
  _current = found ? { code: found.code, symbol: found.symbol } : { ...DEFAULT };
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
