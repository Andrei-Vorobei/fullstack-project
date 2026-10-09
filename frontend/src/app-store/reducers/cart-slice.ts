import { createSlice } from '@reduxjs/toolkit/react';

import { cartApi, type CartResponse } from '@/app-store/api/cart-api';

const initialState: CartResponse = {
  id: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  selectors: {
    getCart: (state: CartResponse) => state,
    getCount: (state) => state.totalItems,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(cartApi.endpoints.getCart.matchFulfilled, (_state, action) => {
      return action.payload;
    });
  },
});

export const { getCart, getCount } = cartSlice.selectors;
