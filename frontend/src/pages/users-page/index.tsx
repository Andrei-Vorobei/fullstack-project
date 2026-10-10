import type { JSX } from 'react';

import { ShoppingCartOutlined } from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Empty,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { UserRole } from '@/app-store/reducers/user-slice';

import { useDeleteUserMutation, useGetUsersQuery, useSetModeratorRoleMutation } from '@/app-store/api/users-api';
import { useAppSelector } from '@/hooks';

import styles from './users-page.module.css';

const UsersPage = (): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector((state) => state.user.profile);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const [setModeratorRole, { isLoading: isUpdatingRole }] = useSetModeratorRoleMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
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

  const handleModeratorRoleChange = async (userId: string, enabled: boolean): Promise<void> => {
    try {
      await setModeratorRole({ id: userId, enabled }).unwrap();
      message.success(enabled ? 'Роль модератора назначена' : 'Роль модератора снята');
    } catch {
      message.error('Не удалось изменить роль. Попробуйте ещё раз.');
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    try {
      await deleteUser(userId).unwrap();
      message.success('Пользователь удалён');
      setSelectedUserId(null);
    } catch {
      message.error('Не удалось удалить пользователя. Возможно, эту учётную запись нельзя удалить.');
    }
  };

  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      user.username.toLocaleLowerCase().includes(normalizedSearch) ||
      Boolean(user.email?.toLocaleLowerCase().includes(normalizedSearch));
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const selectedUser = users.find((user) => user.id === selectedUserId);

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
      <div className={styles.filters}>
        <Input
          allowClear
          aria-label="Поиск пользователей"
          placeholder="Поиск по имени или email"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          aria-label="Фильтр по роли"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'all', label: 'Все роли' },
            { value: 'user', label: 'Пользователь' },
            { value: 'moderator', label: 'Модератор' },
            { value: 'admin', label: 'Администратор' },
          ]}
        />
      </div>
      {filteredUsers.length === 0 ? (
        <Empty description="Пользователи не найдены" />
      ) : (
        <div className={styles.usersGrid}>
          {filteredUsers.map((user) => (
            <div className={styles.userCard} key={user.id}>
              <button
                className={styles.userCardMain}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                aria-label={`Открыть информацию о пользователе ${user.username}`}
              >
                <Avatar src={user.avatar ?? undefined} size={72}>
                  {user.username.slice(0, 1).toUpperCase()}
                </Avatar>
                <span className={styles.userContent}>
                  <span className={styles.username}>{user.username}</span>
                  <span className={styles.roleList}>
                    {user.roles.map((role: string) => (
                      <Tag key={role} color={role === 'admin' ? 'gold' : role === 'moderator' ? 'purple' : 'blue'}>
                        {role}
                      </Tag>
                    ))}
                  </span>
                  <span className={styles.userEmail}>{user.email ?? 'Подробная информация'}</span>
                  {user.telegramUsername && <span className={styles.userTelegram}>@{user.telegramUsername}</span>}
                </span>
              </button>
              <Link className={styles.cartLink} to={`/users/${user.id}/cart`} state={{ username: user.username }}>
                <ShoppingCartOutlined />
                Просмотреть корзину
              </Link>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={selectedUser !== undefined}
        onCancel={() => setSelectedUserId(null)}
        footer={
          selectedUser && isAdmin && selectedUser.id !== profile?.id ? (
            <div className={styles.modalActions}>
              <Popconfirm
                title={
                  selectedUser.roles.includes('moderator')
                    ? 'Снять роль модератора?'
                    : 'Назначить пользователя модератором?'
                }
                onConfirm={() => {
                  void handleModeratorRoleChange(selectedUser.id, !selectedUser.roles.includes('moderator'));
                }}
              >
                <Button
                  loading={isUpdatingRole}
                  disabled={isUpdatingRole ?? isDeletingUser}
                  type={selectedUser.roles.includes('moderator') ? 'default' : 'primary'}
                >
                  {selectedUser.roles.includes('moderator') ? 'Снять роль модератора' : 'Назначить модератором'}
                </Button>
              </Popconfirm>
              {!selectedUser.roles.includes('admin') && (
                <Popconfirm
                  title={`Удалить пользователя ${selectedUser.username}?`}
                  description="Это действие нельзя отменить."
                  okText="Удалить"
                  okButtonProps={{ danger: true }}
                  cancelText="Отмена"
                  onConfirm={() => {
                    void handleDeleteUser(selectedUser.id);
                  }}
                >
                  <Button danger loading={isDeletingUser} disabled={isUpdatingRole ?? isDeletingUser}>
                    Удалить пользователя
                  </Button>
                </Popconfirm>
              )}
            </div>
          ) : null
        }
        title="Информация о пользователе"
        destroyOnHidden
      >
        {selectedUser && (
          <div className={styles.userDetails}>
            <div className={styles.detailsHeading}>
              <Avatar src={selectedUser.avatar ?? undefined} size={72}>
                {selectedUser.username.slice(0, 1).toUpperCase()}
              </Avatar>
              <div>
                <Typography.Title level={4} className={styles.detailsUsername}>
                  {selectedUser.username}
                </Typography.Title>
                <Space wrap>
                  {selectedUser.roles.map((role: string) => (
                    <Tag key={role} color={role === 'admin' ? 'gold' : role === 'moderator' ? 'purple' : 'blue'}>
                      {role}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
            <dl className={styles.detailsList}>
              <div>
                <dt>Электронная почта</dt>
                <dd>{selectedUser.email ?? 'Не указана'}</dd>
              </div>
              <div>
                <dt>Telegram</dt>
                <dd>
                  {selectedUser.telegramUsername ? (
                    <a href={`https://t.me/${selectedUser.telegramUsername}`} target="_blank" rel="noreferrer">
                      @{selectedUser.telegramUsername}
                    </a>
                  ) : (
                    'Не указан'
                  )}
                </dd>
              </div>
              <div>
                <dt>О пользователе</dt>
                <dd>{selectedUser.about || 'Нет информации о пользователе'}</dd>
              </div>
              <div>
                <dt>Дата регистрации</dt>
                <dd>{new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}</dd>
              </div>
              <div>
                <dt>Профиль обновлён</dt>
                <dd>{new Date(selectedUser.updatedAt).toLocaleDateString('ru-RU')}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
