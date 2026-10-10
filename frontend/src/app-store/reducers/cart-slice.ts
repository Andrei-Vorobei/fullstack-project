import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit/react';

import type { Product } from '@/app-store/api/products-api';

import { authApi } from '@/app-store/api/auth-api';
import { cartApi, type CartItem, type CartResponse } from '@/app-store/api/cart-api';
import { loadGuestCart } from '@/app-store/cart-storage';

type CartState = CartResponse & {
  guestMigrationStatus: 'idle' | 'pending' | 'in-progress' | 'error';
  guestMigrationId: string | null;
};

type CartThunkState = {
  cart: CartState;
};

const emptyCartState: CartState = {
  id: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
  guestMigrationStatus: 'idle',
  guestMigrationId: null,
};

const storedGuestCart = loadGuestCart();

const initialState: CartState = storedGuestCart
  ? {
      ...emptyCartState,
      items: storedGuestCart.items,
      totalItems: storedGuestCart.totalItems,
      totalPrice: storedGuestCart.totalPrice,
      guestMigrationId: storedGuestCart.migrationId,
    }
  : emptyCartState;

export const transferGuestCartToServer = createAsyncThunk<void, void, { state: CartThunkState }>(
  'cart/transferGuestCartToServer',
  async (_, { getState, dispatch }) => {
    const { items, guestMigrationId } = getState().cart;
    if (!items.length || !guestMigrationId) return;

    await dispatch(
      cartApi.endpoints.mergeGuestCart.initiate({
        migrationId: guestMigrationId,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })
    ).unwrap();

    dispatch(clearGuestCart());
  },
  {
    condition: (_, { getState }) => getState().cart.guestMigrationStatus !== 'in-progress',
  }
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  selectors: {
    getCart: (state) => state,
    getCount: (state) => state.totalItems,
  },
  reducers: {
    addGuestCartItem: {
      reducer: (state, action: PayloadAction<{ product: Product; migrationId: string }>) => {
        const { product, migrationId } = action.payload;
        state.guestMigrationId ??= migrationId;
        const existingItem = state.items.find((item) => item.product.id === product.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          const item: CartItem = {
            id: `guest-${product.id}`,
            quantity: 1,
            product: {
              id: product.id,
              title: product.title,
              price: product.price,
              discountPercentage: product.discountPercentage,
              thumbnail: product.thumbnail,
            },
          };
          state.items.push(item);
        }

        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
        state.totalPrice = Number(
          state.items.reduce((total, item) => total + item.product.price * item.quantity, 0).toFixed(2)
        );
      },
      prepare: (product: Product) => ({
        payload: { product, migrationId: crypto.randomUUID() },
      }),
    },
    setGuestCartItemQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const item = state.items.find(({ id }) => id === action.payload.itemId);
      if (!item) return;

      item.quantity = action.payload.quantity;
      state.totalItems = state.items.reduce((total, cartItem) => total + cartItem.quantity, 0);
      state.totalPrice = Number(
        state.items.reduce((total, cartItem) => total + cartItem.product.price * cartItem.quantity, 0).toFixed(2)
      );
    },
    removeGuestCartItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(({ id }) => id !== action.payload);
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = Number(
        state.items.reduce((total, item) => total + item.product.price * item.quantity, 0).toFixed(2)
      );
    },
    clearGuestCart: (state) => {
      state.id = null;
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.guestMigrationStatus = 'idle';
      state.guestMigrationId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state) => {
        if (state.guestMigrationId && state.items.length > 0) state.guestMigrationStatus = 'pending';
      })
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
        if (action.payload.access_token && state.guestMigrationId && state.items.length > 0) {
          state.guestMigrationStatus = 'pending';
        }
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, () => emptyCartState)
      .addMatcher(authApi.endpoints.removeUser.matchFulfilled, () => emptyCartState)
      .addMatcher(transferGuestCartToServer.pending.match, (state) => {
        if (state.guestMigrationId && state.items.length > 0) state.guestMigrationStatus = 'in-progress';
      })
      .addMatcher(transferGuestCartToServer.fulfilled.match, (state) => {
        state.guestMigrationStatus = 'idle';
      })
      .addMatcher(transferGuestCartToServer.rejected.match, (state) => {
        state.guestMigrationStatus = 'error';
      })
      .addMatcher(cartApi.endpoints.getCart.matchFulfilled, (state, action) => {
        if (state.guestMigrationId) return;

        return {
          ...action.payload,
          guestMigrationStatus: 'idle',
          guestMigrationId: null,
        };
      });
  },
});

export const { addGuestCartItem, setGuestCartItemQuantity, removeGuestCartItem, clearGuestCart } =
  cartSlice.actions;
export const { getCart, getCount } = cartSlice.selectors;
