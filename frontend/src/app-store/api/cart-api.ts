import { createApi } from '@reduxjs/toolkit/query/react';

import type { CurrencyCode } from '@/utils/currency';

import { axiosBaseQuery } from './auth-api';

export type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    currencyCode: CurrencyCode;
    discountPercentage: number;
    thumbnail: string;
  };
};

export type CartResponse = {
  id: string | null;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

export type AddCartItemRequest = {
  productId: string;
  quantity: number;
};

export type MergeGuestCartRequest = {
  migrationId: string;
  items: { productId: string; quantity: number }[];
};

export type SetCartItemQuantityRequest = {
  itemId: string;
  quantity: number;
};

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000',
  }),
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    getCart: builder.query<CartResponse, void>({
      query: () => ({ url: '/cart' }),
      providesTags: ['Cart'],
    }),
    getUserCart: builder.query<CartResponse, string>({
      query: (userId) => ({ url: `/cart/users/${userId}` }),
    }),
    addCartItem: builder.mutation<void, AddCartItemRequest>({
      query: (item) => ({
        url: '/cart/items',
        method: 'POST',
        data: item,
      }),
      invalidatesTags: ['Cart'],
    }),
    mergeGuestCart: builder.mutation<CartResponse, MergeGuestCartRequest>({
      query: (guestCart) => ({
        url: '/cart/merge-guest',
        method: 'POST',
        data: guestCart,
      }),
      invalidatesTags: ['Cart'],
    }),
    setCartItemQuantity: builder.mutation<void, SetCartItemQuantityRequest>({
      query: ({ itemId, quantity }) => ({
        url: '/cart/items/' + itemId,
        method: 'PATCH',
        data: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: '/cart/items/' + itemId,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<void, void>({
      query: () => ({
        url: '/cart/items',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useGetUserCartQuery,
  useAddCartItemMutation,
  useSetCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
