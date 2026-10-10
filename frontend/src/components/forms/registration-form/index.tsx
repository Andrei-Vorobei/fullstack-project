import type { JSX } from 'react';

import { useForm } from 'react-hook-form';

import { useRegisterMutation } from '@/app-store/api/auth-api';
import YandexAuthLink from '@/components/forms/yandex-auth-link';
import Button from '@/components/UI/button/button';
import TextInput from '@/components/UI/text-input/text-input';

import styles from './registration-form.module.css';

type RegistrationFormValues = {
  name: string;
  email: string;
  password: string;
};

const copy = {
  title: 'Регистрация',
  description: 'Создайте аккаунт, заполнив форму ниже',
  name: 'Имя',
  namePlaceholder: 'Введите имя',
  nameRequired: 'Введите имя',
  nameMinLength: 'Имя должно содержать не менее 2 символов',
  email: 'Электронная почта',
  emailRequired: 'Введите электронную почту',
  emailInvalid: 'Введите корректный адрес электронной почты',
  password: 'Пароль',
  passwordPlaceholder: 'Не менее 8 символов',
  passwordRequired: 'Введите пароль',
  passwordMinLength: 'Пароль должен содержать не менее 8 символов',
  submit: 'Зарегистрироваться',
  submitting: 'Registering...',
  requestFailed: 'Registration failed. Please try again',
  success: 'Registration completed successfully',
};

const RegistrationForm = (): JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>();

  const [registerUser, { isLoading, isError, error, isSuccess }] = useRegisterMutation();

  const onSubmit = async (data: RegistrationFormValues): Promise<void> => {
    await registerUser({ username: data.name, email: data.email, password: data.password });
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
            label={copy.name}
            name="name"
            placeholder={copy.namePlaceholder}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'registration-name-error' : undefined}
            register={register}
            rules={{
              required: copy.nameRequired,
              minLength: { value: 2, message: copy.nameMinLength },
            }}
          />
          {errors.name ? (
            <p className={styles.error} id="registration-name-error" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className={styles.field}>
          <TextInput
            label={copy.email}
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'registration-email-error' : undefined}
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
            <p className={styles.error} id="registration-email-error" role="alert">
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
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'registration-password-error' : undefined}
            register={register}
            rules={{
              required: copy.passwordRequired,
              minLength: { value: 8, message: copy.passwordMinLength },
            }}
          />
          {errors.password ? (
            <p className={styles.error} id="registration-password-error" role="alert">
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
      <YandexAuthLink />
    </section>
  );
};

export default RegistrationForm;
