import type { JSX } from 'react';

import { useForm } from 'react-hook-form';

import { useLoginMutation } from '@/app-store/api/auth-api';
import Button from '@/components/UI/button/button';
import TextInput from '@/components/UI/text-input/text-input';

import styles from './login-form.module.css';

type LoginFormValues = {
  email: string;
  password: string;
};

const copy = {
  title: 'Войти',
  description: 'Войдите, используя электронную почту и пароль.',
  email: 'Электронная почта',
  emailRequired: 'Введите электронную почту.',
  emailInvalid: 'Введите корректный адрес электронной почты.',
  password: 'Пароль',
  passwordPlaceholder: 'Не менее 8 символов',
  passwordRequired: 'Введите пароль.',
  passwordMinLength: 'Пароль должен содержать не менее 8 символов.',
  requestFailed: 'Не удалось войти. Попробуйте ещё раз.',
  success: 'Вы успешно вошли.',
  submit: 'Войти',
  submitting: 'Входим...',
};

const LoginForm = (): JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const [login, { isLoading, isError, error, isSuccess }] = useLoginMutation();

  const onSubmit = async (data: LoginFormValues): Promise<void> => {
    await login(data);
  };

  const apiErrorMessage =
    isError && typeof error === 'object' && error !== null && 'data' in error
      ? typeof error.data === 'object' &&
        error.data !== null &&
        'message' in error.data &&
        typeof error.data.message === 'string'
        ? error.data.message
        : copy.requestFailed
      : null;

  return (
    <section className={styles.container} aria-labelledby="registration-title">
      <h1 className={styles.title} id="registration-title">
        {copy.title}
      </h1>
      <p className={styles.description}>{copy.description}</p>
      <form
        className={styles.form}
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        noValidate
      >
        <div className={styles.field}>
          <TextInput
            label={copy.email}
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            register={register}
            rules={{
              required: copy.emailRequired,
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: copy.emailInvalid,
              },
            }}
          />
          {errors.email ? (
            <p className={styles.error} id="login-email-error" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className={styles.field}>
          <TextInput
            label={copy.password}
            name="password"
            type="password"
            placeholder={copy.passwordPlaceholder}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            register={register}
            rules={{
              required: copy.passwordRequired,
              minLength: { value: 8, message: copy.passwordMinLength },
            }}
          />
          {errors.password ? (
            <p className={styles.error} id="login-password-error" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        {apiErrorMessage ? (
          <p className={styles.error} role="alert">
            {apiErrorMessage}
          </p>
        ) : null}
        {isSuccess ? (
          <p className={styles.success} role="status">
            {copy.success}
          </p>
        ) : null}
        <Button className={styles.submit} type="submit" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? copy.submitting : copy.submit}
        </Button>
      </form>
    </section>
  );
};

export default LoginForm;
