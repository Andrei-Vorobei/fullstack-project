import { lazy, type JSX } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { useGetMeQuery } from '@/app-store/api/auth-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import App from '@/components/App/App';
import { useAppSelector } from '@/hooks';

const HomePage = lazy(() => import('@/pages/home-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
const ProductsPage = lazy(() => import('@/pages/products-page'));
const ProfilePage = lazy(() => import('@/pages/profile-page'));
const RegisterPage = lazy(() => import('@/pages/register-page'));
const UsersPage = lazy(() => import('@/pages/users-page'));
const UserCartPage = lazy(() => import('@/pages/user-cart-page'));

type GuestOnlyRouteProps = {
  children: JSX.Element;
};

const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !accessToken });

  if (!accessToken || isError || profile?.roles.includes('admin')) {
    return children;
  }

  if (isLoading || !profile) {
    return <div role="status">Загрузка профиля...</div>;
  }

  return <Navigate to="/" replace />;
};

export const AppRouter = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
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
        <Route path="users/:userId/cart" element={<UserCartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
