import { lazy, type JSX } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { useGetMeQuery, useRefreshQuery } from '@/app-store/api/auth-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import App from '@/components/App/App';
import { useAppSelector } from '@/hooks';

const AdminPage = lazy(() => import('@/pages/admin-page'));
const HomePage = lazy(() => import('@/pages/home-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
const ProductDetailsPage = lazy(() => import('@/pages/product-details-page'));
const ProductReviewsPage = lazy(() => import('@/pages/product-reviews'));
const ProductsPage = lazy(() => import('@/pages/products-page'));
const ProfilePage = lazy(() => import('@/pages/profile-page'));
const RegisterPage = lazy(() => import('@/pages/register-page'));
const UsersPage = lazy(() => import('@/pages/users-page'));
const UserCartPage = lazy(() => import('@/pages/user-cart-page'));
const UserReviewsPage = lazy(() => import('@/pages/user-reviews'));

type GuestOnlyRouteProps = {
  children: JSX.Element;
};

const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const { isLoading: isRefreshing } = useRefreshQuery();
  const { isLoading: isLoadingProfile, isError } = useGetMeQuery(undefined, { skip: !accessToken });

  if (profile?.roles.includes('admin')) {
    return children;
  }

  if (profile) {
    return <Navigate to="/" replace />;
  }

  if (!accessToken) {
    if (isRefreshing) {
      return (
        <div role="status">
          {'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0440\u043e\u0444\u0438\u043b\u044f...'}
        </div>
      );
    }

    return children;
  }

  if (isLoadingProfile) {
    return (
      <div role="status">
        {'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0440\u043e\u0444\u0438\u043b\u044f...'}
      </div>
    );
  }

  if (isError) {
    return children;
  }

  return (
    <div role="status">
      {'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0440\u043e\u0444\u0438\u043b\u044f...'}
    </div>
  );
};

type AdminOnlyRouteProps = {
  children: JSX.Element;
};

const AdminOnlyRoute = ({ children }: AdminOnlyRouteProps): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const { isLoading: isRefreshing } = useRefreshQuery();
  const { isLoading: isLoadingProfile, isError } = useGetMeQuery(undefined, { skip: !accessToken });

  if (!accessToken && isRefreshing) {
    return <div role="status">Загрузка профиля...</div>;
  }

  if (!accessToken || isError) {
    return <Navigate to="/login" replace />;
  }

  if (isLoadingProfile || !profile) {
    return <div role="status">Загрузка профиля...</div>;
  }

  if (!profile.roles.includes('admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRouter = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId/modal" element={<ProductsPage />} />
        <Route path="products/:productId/page" element={<ProductDetailsPage />} />
        <Route path="products/:productId/reviews" element={<ProductReviewsPage />} />
        <Route
          path="login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route
          path="admin"
          element={
            <AdminOnlyRoute>
              <AdminPage />
            </AdminOnlyRoute>
          }
        />
        <Route path="users/:userId/cart" element={<UserCartPage />} />
        <Route path="users/:userId/reviews" element={<UserReviewsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
