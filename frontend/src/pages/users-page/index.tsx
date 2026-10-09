import type { JSX } from 'react';

import { Alert, Avatar, Empty, Listy, Space, Spin, Tag, Typography } from 'antd';
import { useMemo } from 'react';

import { useGetUsersQuery } from '@/app-store/api/users-api';
import { useAppSelector } from '@/hooks';

import styles from './users-page.module.css';

const UsersPage = (): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const {
    data: users = [],
    error,
    isLoading,
  } = useGetUsersQuery(undefined, {
    skip: !accessToken,
  });

  const errorMessage = useMemo(() => {
    if (!error) return null;

    if (typeof error === 'string') return error;

    if ('status' in error && typeof error.status === 'number') {
      return `Request failed with status ${error.status}`;
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    return 'Не удалось загрузить пользователей';
  }, [error]);

  if (!accessToken) {
    return <Alert type="info" showIcon title="Для просмотра списка пользователей необходимо войти в систему" />;
  }

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" showIcon title={errorMessage ?? 'Не удалось загрузить пользователей'} />;
  }

  if (!users.length) {
    return <Empty description="Пользователи не найдены" />;
  }

  return (
    <div className={styles.page}>
      <Typography.Title level={2}>Пользователи</Typography.Title>
      <Listy
        items={users}
        rowKey={(user) => user.id}
        itemRender={(user) => (
          <div className={styles.userCard}>
            <div className={styles.userRow}>
              <Avatar src={user.avatar ?? undefined} size={56}>
                {user.username.slice(0, 1).toUpperCase()}
              </Avatar>

              <div className={styles.userContent}>
                <Space wrap>
                  <span className={styles.username}>{user.username}</span>
                  {user.roles.map((role: string) => (
                    <Tag key={role} color={role === 'admin' ? 'gold' : 'blue'}>
                      {role}
                    </Tag>
                  ))}
                </Space>

                <div className={styles.metaBlock}>
                  <div>{user.about ?? 'Нет информации о пользователе'}</div>
                  <div>{user.email}</div>
                  <div>Дата регистрации: {new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default UsersPage;
