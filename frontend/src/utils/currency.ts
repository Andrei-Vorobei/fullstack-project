export type CurrencyCode = 'USD' | 'EUR' | 'RUB';

export type Currency = {
  code: CurrencyCode;
  name: string;
  symbol: string;
};

export const formatCurrency = (amount: number, currencyCode: CurrencyCode = 'USD'): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currencyCode }).format(amount);

export const getCurrencyLabel = (currency: Currency): string =>
  `${currency.code} (${currency.symbol}) — ${currency.name}`;
