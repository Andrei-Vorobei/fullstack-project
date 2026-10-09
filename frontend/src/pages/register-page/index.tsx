import type { JSX } from 'react';

import RegistrationForm from '@/components/forms/registration-form';

const RegisterPage = (): JSX.Element => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the Register Page!</p>
      <RegistrationForm />
    </div>
  );
};

export default RegisterPage;
