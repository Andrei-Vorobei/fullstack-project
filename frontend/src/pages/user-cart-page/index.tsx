import type { JSX } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Empty, Spin, Typography } from 'antd';
import { Link, useLocation, useParams } from 'react-router';

import { useGetUserCartQuery } from '@/app-store/api/cart-api';
import { useAppSelector } from '@/hooks';
import { formatCurrency, type CurrencyCode } from '@/utils/currency';

import styles from './user-cart-page.module.css';

const UserCartPage = (): JSX.Element => {
  const { userId } = useParams();
  const location = useLocation();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const locationState: unknown = location.state;
  const username =
    typeof locationState === 'object' &&
    locationState !== null &&
    'username' in locationState &&
    typeof locationState.username === 'string'
      ? locationState.username
      : null;
  const {
    data: cart,
    isLoading,
    error,
  } = useGetUserCartQuery(userId ?? '', {
    skip: !userId || !accessToken,
  });

  if (!accessToken) {
    return <Alert type="info" showIcon title="Для просмотра корзины необходимо войти в систему" />;
  }

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !cart) {
    return <Alert type="error" showIcon title="Не удалось загрузить корзину пользователя" />;
  }

  const totalsByCurrency = cart.items.reduce(
    (totals, item) => {
      const currencyCode: CurrencyCode = item.product.currencyCode ?? 'USD';
      const current = totals.find((total) => total.currencyCode === currencyCode);
      const discountedPrice = item.quantity * item.product.price * (1 - item.product.discountPercentage / 100);
      if (current) {
        current.amount += discountedPrice;
      } else {
        totals.push({ currencyCode, amount: discountedPrice });
      }
      return totals;
    },
    [] as { currencyCode: CurrencyCode; amount: number }[]
  );

  return (
    <section className={styles.page}>
      <Link to="/users" className={styles.backButton}>
        <ArrowLeftOutlined />К списку пользователей
      </Link>
      <Typography.Title level={2} className={styles.title}>
        Корзина пользователя{username ? ` ${username}` : ''}
      </Typography.Title>
      {cart.items.length === 0 ? (
        <Empty description="Корзина пуста" />
      ) : (
        <>
          <ul className={styles.items}>
            {cart.items.map((item) => (
              <li className={styles.item} key={item.id}>
                <img className={styles.thumbnail} src={item.product.thumbnail} alt="" />
                <div className={styles.productInfo}>
                  <Typography.Text strong>{item.product.title}</Typography.Text>
                  <Typography.Text type="secondary">
                    {item.quantity} × {formatCurrency(item.product.price, item.product.currencyCode ?? 'USD')}
                    {item.product.discountPercentage > 0 ? ` (скидка ${item.product.discountPercentage}%)` : ''}
                  </Typography.Text>
                </div>
                <Typography.Text strong className={styles.price}>
                  {formatCurrency(
                    item.quantity * item.product.price * (1 - item.product.discountPercentage / 100),
                    item.product.currencyCode ?? 'USD'
                  )}
                </Typography.Text>
              </li>
            ))}
          </ul>
          <div className={styles.summary}>
            <Typography.Text type="secondary">Всего единиц: {cart.totalItems}</Typography.Text>
            {totalsByCurrency.map(({ currencyCode, amount }) => (
              <Typography.Title level={4} key={currencyCode}>
                Итого ({currencyCode}): {formatCurrency(amount, currencyCode)}
              </Typography.Title>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default UserCartPage;
