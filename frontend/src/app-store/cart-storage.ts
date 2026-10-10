import type { CartItem } from './api/cart-api';

type StoredGuestCart = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  migrationId: string;
};

const storageKey = 'guest-cart';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCartItem = (value: unknown): value is CartItem => {
  if (!isRecord(value) || !isRecord(value.product)) return false;

  return (
    typeof value.id === 'string' &&
    Number.isInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    typeof value.product.id === 'string' &&
    typeof value.product.title === 'string' &&
    typeof value.product.price === 'number' &&
    Number.isFinite(value.product.price) &&
    (value.product.currencyCode === undefined ||
      value.product.currencyCode === 'USD' ||
      value.product.currencyCode === 'EUR' ||
      value.product.currencyCode === 'RUB') &&
    typeof value.product.discountPercentage === 'number' &&
    Number.isFinite(value.product.discountPercentage) &&
    typeof value.product.thumbnail === 'string'
  );
};

const isStoredGuestCart = (value: unknown): value is StoredGuestCart =>
  isRecord(value) &&
  typeof value.migrationId === 'string' &&
  value.migrationId.length > 0 &&
  Array.isArray(value.items) &&
  value.items.every(isCartItem) &&
  Number.isInteger(value.totalItems) &&
  Number(value.totalItems) >= 0 &&
  typeof value.totalPrice === 'number' &&
  Number.isFinite(value.totalPrice);

export const loadGuestCart = (): StoredGuestCart | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedCart = window.localStorage.getItem(storageKey);
    if (!storedCart) return null;

    const parsedCart: unknown = JSON.parse(storedCart);
    if (isStoredGuestCart(parsedCart)) {
      return {
        ...parsedCart,
        items: parsedCart.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            currencyCode: item.product.currencyCode ?? 'USD',
          },
        })),
      };
    }

    console.error('Stored guest cart has an invalid format.');
  } catch (error) {
    console.error('Failed to load the guest cart from local storage.', error);
  }

  return null;
};

export const saveGuestCart = (cart: StoredGuestCart | null): void => {
  if (typeof window === 'undefined') return;

  try {
    if (cart) {
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.error('Failed to save the guest cart to local storage.', error);
  }
};
