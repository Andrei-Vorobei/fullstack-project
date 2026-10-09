import type { JSX } from 'react';

import LoginForm from '@/components/forms/login-form';

const LoginPage = (): JSX.Element => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the Register Page!</p>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
