import { configureStore, createListenerMiddleware, isAnyOf, type Middleware } from '@reduxjs/toolkit';

import { authApi } from './api/auth-api';
import { cartApi } from './api/cart-api';
import { productsApi } from './api/products-api';
import { usersApi } from './api/users-api';
import { saveGuestCart } from './cart-storage';
import { clearGuestCart } from './reducers/cart-slice';
import { rootReducer } from './root-reducer';

const listenerMiddleware = createListenerMiddleware<ReturnType<typeof rootReducer>>();

listenerMiddleware.startListening({
  matcher: isAnyOf(
    authApi.endpoints.login.matchFulfilled,
    authApi.endpoints.register.matchFulfilled,
    authApi.endpoints.getMe.matchFulfilled
  ),
  effect: (_action, listenerApi) => {
    const previousUserId = listenerApi.getOriginalState().user.profile?.id;
    const currentUserId = listenerApi.getState().user.profile?.id;

    listenerApi.dispatch(usersApi.util.invalidateTags(['Users']));
    if (currentUserId && currentUserId !== previousUserId) {
      listenerApi.dispatch(cartApi.util.resetApiState());
      if (previousUserId && !listenerApi.getState().cart.guestMigrationId) {
        listenerApi.dispatch(clearGuestCart());
      }
    }
  },
});

listenerMiddleware.startListening({
  matcher: isAnyOf(authApi.endpoints.logout.matchFulfilled, authApi.endpoints.removeUser.matchFulfilled),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(usersApi.util.resetApiState());
    listenerApi.dispatch(cartApi.util.resetApiState());
    listenerApi.dispatch(authApi.util.invalidateTags(['User']));
  },
});

listenerMiddleware.startListening({
  matcher: authApi.endpoints.updateUser.matchFulfilled,
  effect: (_action, { dispatch }) => {
    dispatch(usersApi.util.invalidateTags(['Users']));
  },
});

const guestCartPersistenceMiddleware: Middleware<object, ReturnType<typeof rootReducer>> =
  ({ getState }) =>
  (next) =>
  (action) => {
    const previousCart = getState().cart;
    const result = next(action);
    const cart = getState().cart;

    if (cart !== previousCart) {
      saveGuestCart(
        cart.guestMigrationId && cart.items.length > 0
          ? {
              items: cart.items,
              totalItems: cart.totalItems,
              totalPrice: cart.totalPrice,
              migrationId: cart.guestMigrationId,
            }
          : null
      );
    }

    return result;
  };

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      productsApi.middleware,
      cartApi.middleware,
      authApi.middleware,
      usersApi.middleware,
      guestCartPersistenceMiddleware,
      listenerMiddleware.middleware,
    ]),
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
