import { configureStore } from '@reduxjs/toolkit';

import { authApi } from './api/auth-api';
import { cartApi } from './api/cart-api';
import { productsApi } from './api/products-api';
import { usersApi } from './api/users-api';
import { rootReducer } from './root-reducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      productsApi.middleware,
      cartApi.middleware,
      authApi.middleware,
      usersApi.middleware,
    ]),
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
