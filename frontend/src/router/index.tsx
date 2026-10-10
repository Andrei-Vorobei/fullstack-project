import { lazy, type JSX } from 'react';
import { Routes, Route } from 'react-router';

import App from '@/components/App/App';

const HomePage = lazy(() => import('@/pages/home-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
const ProductsPage = lazy(() => import('@/pages/products-page'));
const ProfilePage = lazy(() => import('@/pages/profile-page'));
const RegisterPage = lazy(() => import('@/pages/register-page'));
const UsersPage = lazy(() => import('@/pages/users-page'));

export const AppRouter = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
