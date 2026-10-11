import type { JSX } from 'react';

import { ArrowLeftOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, message, Spin, Typography } from 'antd';
import { Link, useLocation, useParams } from 'react-router';

import {
  useAddCartItemMutation,
  useGetUserCartQuery,
  useRemoveCartItemMutation,
  useSetCartItemQuantityMutation,
} from '@/app-store/api/cart-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppSelector } from '@/hooks';
import { formatCurrency, type CurrencyCode } from '@/utils/currency';

import styles from './user-cart-page.module.css';

const UserCartPage = (): JSX.Element => {
  const { userId } = useParams();
  const location = useLocation();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const canManageCart = Boolean(profile && profile.id === userId);
  const [addCartItem, { isLoading: isAdding }] = useAddCartItemMutation();
  const [setCartItemQuantity, { isLoading: isUpdating }] = useSetCartItemQuantityMutation();
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const isUpdatingCart = isAdding || isUpdating || isRemoving;
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

  const changeItemQuantity = async (itemId: string, quantity: number): Promise<void> => {
    try {
      if (quantity <= 0) {
        await removeCartItem(itemId).unwrap();
      } else {
        await setCartItemQuantity({ itemId, quantity }).unwrap();
      }
    } catch {
      message.error('Не удалось обновить корзину. Возможно, товара недостаточно на складе.');
    }
  };

  const addProduct = async (productId: string): Promise<void> => {
    try {
      await addCartItem({ productId, quantity: 1 }).unwrap();
    } catch {
      message.error('Не удалось добавить товар. Возможно, он закончился на складе.');
    }
  };

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
                <Link
                  className={styles.productImageLink}
                  to={`/products/${item.product.id}/page`}
                  aria-label={item.product.title}
                >
                  <img className={styles.thumbnail} src={item.product.thumbnail} alt="" />
                </Link>
                <div className={styles.productInfo}>
                  <Link className={styles.productTitleLink} to={`/products/${item.product.id}/page`}>
                    <Typography.Text strong>{item.product.title}</Typography.Text>
                  </Link>
                  {!canManageCart ? (
                    <Typography.Text type="secondary">
                      {item.quantity} × {formatCurrency(item.product.price, item.product.currencyCode ?? 'USD')}
                    </Typography.Text>
                  ) : null}
                  {item.product.discountPercentage > 0 ? (
                    <Typography.Text type="secondary">Скидка {item.product.discountPercentage}%</Typography.Text>
                  ) : null}
                </div>
                <div className={styles.priceAndControls}>
                  {canManageCart ? (
                    <div
                      className={styles.quantityControls}
                      role="group"
                      aria-label={`Количество товара ${item.product.title}`}
                    >
                      <Button
                        aria-label={`Уменьшить количество товара ${item.product.title}`}
                        disabled={isUpdatingCart}
                        icon={<MinusOutlined />}
                        onClick={() => void changeItemQuantity(item.id, item.quantity - 1)}
                        size="small"
                      />
                      <span className={styles.quantity} aria-live="polite">
                        {item.quantity}
                      </span>
                      <Button
                        aria-label={`Увеличить количество товара ${item.product.title}`}
                        disabled={isUpdatingCart}
                        icon={<PlusOutlined />}
                        onClick={() => void addProduct(item.product.id)}
                        size="small"
                      />
                    </div>
                  ) : null}
                  <Typography.Text strong className={styles.price}>
                    {formatCurrency(
                      item.quantity * item.product.price * (1 - item.product.discountPercentage / 100),
                      item.product.currencyCode ?? 'USD'
                    )}
                  </Typography.Text>
                </div>
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
