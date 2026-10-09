import type { JSX } from 'react';

import { Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';

import { useRemoveUserMutation, useUpdateUserMutation } from '@/app-store/api/auth-api';
import { getProfile, type UserRole } from '@/app-store/reducers/user-slice';
import Button from '@/components/UI/button/button';
import TextInput from '@/components/UI/text-input/text-input';
import { useAppSelector } from '@/hooks';

import styles from './profile-page.module.css';

const roleLabels: Record<UserRole, string> = {
  user: '\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C',
  admin: '\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440',
};

type ProfileFormValues = {
  username: string;
  about: string;
  avatar: string;
  password: string;
  confirmPassword: string;
};

const ProfilePage = (): JSX.Element => {
  const profile = useAppSelector(getProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [updateUser, updateResult] = useUpdateUserMutation();
  const [removeUser, removeResult] = useRemoveUserMutation();
  const [messageApi, messageContext] = message.useMessage();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>();
  const newPassword = useWatch({ control, name: 'password' });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        about: profile.about,
        avatar: profile.avatar,
      });
    }
  }, [profile, reset]);

  const handleUpdate = async (values: ProfileFormValues): Promise<void> => {
    try {
      const { password, confirmPassword: _confirmPassword, ...profileUpdates } = values;
      await updateUser({
        ...profileUpdates,
        ...(password ? { password } : {}),
      }).unwrap();
      setIsEditing(false);
      await messageApi.success('Профиль обновлён');
    } catch {
      await messageApi.error('Не удалось обновить профиль. Попробуйте ещё раз.');
    }
  };

  const handleDelete = (): void => {
    if (!profile) {
      return;
    }

    Modal.confirm({
      title: 'Удалить аккаунт?',
      content: 'Это действие нельзя отменить. Ваш профиль будет удалён.',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk: async () => {
        try {
          await removeUser(profile.id).unwrap();
        } catch {
          await messageApi.error('Не удалось удалить аккаунт. Попробуйте ещё раз.');
          throw new Error('Account deletion failed');
        }
      },
    });
  };

  if (!profile) {
    return (
      <>
        {messageContext}
        <section className={styles.container} aria-labelledby="profile-title">
          <h1 className={styles.title} id="profile-title">
            Профиль
          </h1>
          <p className={styles.emptyMessage}>Чтобы посмотреть профиль, войдите в аккаунт.</p>
          <Link className={styles.loginLink} to="/login">
            Войти
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {messageContext}
      <section className={styles.container} aria-labelledby="profile-title">
        <h1 className={styles.title} id="profile-title">
          Профиль
        </h1>
        <article className={styles.profile}>
          <img className={styles.avatar} src={profile.avatar} alt={`Аватар ${profile.username}`} />
          <div className={styles.details}>
            {isEditing ? (
              <form
                className={styles.editForm}
                onSubmit={(event) => void handleSubmit(handleUpdate)(event)}
                noValidate
              >
                <div className={styles.field}>
                  <TextInput
                    label="Имя пользователя"
                    name="username"
                    register={register}
                    rules={{ required: 'Введите имя пользователя' }}
                    aria-invalid={Boolean(errors.username)}
                  />
                  {errors.username ? <p className={styles.error}>{errors.username.message}</p> : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="profile-about">
                    О себе
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="profile-about"
                    {...register('about', { required: 'Расскажите о себе' })}
                    aria-invalid={Boolean(errors.about)}
                  />
                  {errors.about ? <p className={styles.error}>{errors.about.message}</p> : null}
                </div>
                <div className={styles.field}>
                  <TextInput
                    label="URL аватара"
                    name="avatar"
                    type="url"
                    register={register}
                    rules={{ required: 'Укажите URL аватара' }}
                    aria-invalid={Boolean(errors.avatar)}
                  />
                  {errors.avatar ? <p className={styles.error}>{errors.avatar.message}</p> : null}
                </div>
                <div className={styles.field}>
                  <TextInput
                    label="Новый пароль (необязательно)"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Не менее 8 символов"
                    register={register}
                    rules={{
                      minLength: {
                        value: 8,
                        message: 'Пароль должен содержать не менее 8 символов',
                      },
                    }}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {errors.password ? <p className={styles.error}>{errors.password.message}</p> : null}
                </div>
                <div className={styles.field}>
                  <TextInput
                    label="Повторите новый пароль"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    register={register}
                    rules={{
                      validate: (value) =>
                        (!newPassword && !value) ||
                        (Boolean(newPassword) && value === newPassword) ||
                        'Пароли не совпадают',
                    }}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  {errors.confirmPassword ? (
                    <p className={styles.error}>{errors.confirmPassword.message}</p>
                  ) : null}
                </div>
                <div className={styles.actions}>
                  <Button type="submit" disabled={updateResult.isLoading}>
                    {updateResult.isLoading ? 'Сохраняем...' : 'Сохранить'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateResult.isLoading}
                    onClick={() => {
                      reset();
                      setIsEditing(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
                {updateResult.isError ? (
                  <p className={styles.error} role="alert">
                    Не удалось обновить профиль. Проверьте данные и попробуйте снова.
                  </p>
                ) : null}
              </form>
            ) : (
              <>
                <h2 className={styles.username}>{profile.username}</h2>
                <p className={styles.about}>{profile.about}</p>
                <dl className={styles.fields}>
                  <div className={styles.field}>
                    <dt>Электронная почта</dt>
                    <dd>{profile.email}</dd>
                  </div>
                  <div className={styles.field}>
                    <dt>{'\u0420\u043E\u043B\u0438'}</dt>
                    <dd>
                      <ul className={styles.roles}>
                        {profile.roles.map((role) => (
                          <li className={styles.role} key={role}>
                            {roleLabels[role]}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className={styles.field}>
                    <dt>Дата регистрации</dt>
                    <dd>
                      <time dateTime={profile.createdAt}>
                        {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                      </time>
                    </dd>
                  </div>
                </dl>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    onClick={() => {
                      reset({
                        username: profile.username,
                        about: profile.about,
                        avatar: profile.avatar,
                      });
                      setIsEditing(true);
                    }}
                  >
                    Редактировать профиль
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={removeResult.isLoading}
                    onClick={handleDelete}
                  >
                    {removeResult.isLoading ? 'Удаляем...' : 'Удалить аккаунт'}
                  </Button>
                </div>
                {removeResult.isError ? (
                  <p className={styles.error} role="alert">
                    Не удалось удалить аккаунт. Попробуйте ещё раз.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </article>
      </section>
    </>
  );
};

export default ProfilePage;
