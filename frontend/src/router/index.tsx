import type { JSX } from 'react/jsx-runtime';

import { Routes, Route } from 'react-router';

import App from '@/components/App/App';
import HomePage from '@/pages/home-page';
import LoginPage from '@/pages/login-page';
import NotFoundPage from '@/pages/not-found-page';
import ProductsPage from '@/pages/products-page';
import ProfilePage from '@/pages/profile-page';
import RegisterPage from '@/pages/register-page';
import UsersPage from '@/pages/users-page';

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
