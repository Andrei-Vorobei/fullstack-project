import type { JSX } from 'react';

import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Spin, Typography } from 'antd';

import { useGetCartQuery, type CartItem } from '@/app-store/api/cart-api';
import { getCart, transferGuestCartToServer } from '@/app-store/reducers/cart-slice';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { formatCurrency, type CurrencyCode } from '@/utils/currency';

import styles from './cart.module.css';

type CartProps = {
  onRemoveProduct: (itemId: string) => void;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
};

const Cart = ({ onRemoveProduct, onChangeQuantity, onClearCart }: CartProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const localCart = useAppSelector(getCart);
  const isMigrating =
    (Boolean(accessToken) && Boolean(localCart.guestMigrationId)) ||
    localCart.guestMigrationStatus === 'pending' ||
    localCart.guestMigrationStatus === 'in-progress';
  const migrationFailed = localCart.guestMigrationStatus === 'error';
  const {
    data: serverCart,
    isLoading,
    error,
  } = useGetCartQuery(undefined, { skip: !accessToken || !profile || isMigrating || migrationFailed });
  const cart = accessToken && profile && !isMigrating && !migrationFailed ? serverCart : localCart;

  if (isMigrating) {
    return <Spin description="Переносим корзину в аккаунт..." />;
  }

  if (migrationFailed) {
    return (
      <div>
        <Typography.Text type="danger" role="alert">
          Не удалось перенести корзину в аккаунт.
        </Typography.Text>
        <Button onClick={() => void dispatch(transferGuestCartToServer())}>Повторить перенос</Button>
      </div>
    );
  }

  if (accessToken && (!profile || isLoading)) {
    return <Spin description="Загрузка корзины..." />;
  }

  if (accessToken && error) {
    return (
      <Typography.Text type="danger" role="alert">
        Не удалось загрузить корзину. Попробуйте ещё раз.
      </Typography.Text>
    );
  }

  if (!cart?.items.length) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ваша корзина пуста" style={{ margin: '24px 0' }} />
    );
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
    <div className={styles.cart}>
      <ul className={styles.products}>
        {cart.items.map((item: CartItem) => (
          <li className={styles.product} key={item.id}>
            <img className={styles.thumbnail} src={item.product.thumbnail} alt="" />
            <div className={styles.productInfo}>
              <h3 className={styles.productTitle}>{item.product.title}</h3>
              <div className={styles.quantityControls}>
                <Button
                  aria-label={`Уменьшить количество товара ${item.product.title}`}
                  disabled={item.quantity <= 1}
                  icon={<MinusOutlined />}
                  onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
                  size="small"
                />
                <span className={styles.quantity} aria-label={`Количество: ${item.quantity}`}>
                  {item.quantity}
                </span>
                <Button
                  aria-label={`Увеличить количество товара ${item.product.title}`}
                  icon={<PlusOutlined />}
                  onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
                  size="small"
                />
                <span className={styles.unitPrice}>
                  {formatCurrency(item.product.price, item.product.currencyCode ?? 'USD')} / шт.
                </span>
              </div>
              {item.product.discountPercentage > 0 ? (
                <p className={styles.discount}>Скидка {item.product.discountPercentage}%</p>
              ) : null}
            </div>
            <div className={styles.productTotal}>
              {item.product.discountPercentage > 0 ? (
                <span className={styles.originalPrice}>
                  {formatCurrency(item.product.price * item.quantity, item.product.currencyCode ?? 'USD')}
                </span>
              ) : null}
              <strong>
                {formatCurrency(
                  item.product.price * item.quantity * (1 - item.product.discountPercentage / 100),
                  item.product.currencyCode ?? 'USD'
                )}
              </strong>
            </div>
            <Button
              aria-label={`Удалить ${item.product.title} из корзины`}
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemoveProduct(item.id)}
            />
          </li>
        ))}
      </ul>
      <Divider />
      <div className={styles.summary}>
        <div className={styles.summaryLine}>
          <Typography.Text type="secondary">Товаров</Typography.Text>
          <Typography.Text>{cart.totalItems}</Typography.Text>
        </div>
        {totalsByCurrency.map(({ currencyCode, amount }) => (
          <div className={styles.summaryLine} key={currencyCode}>
            <Typography.Text strong>Итого ({currencyCode})</Typography.Text>
            <Typography.Text className={styles.grandTotal} strong>
              {formatCurrency(amount, currencyCode)}
            </Typography.Text>
          </div>
        ))}
        <Button className={styles.clearButton} danger onClick={onClearCart}>
          Очистить корзину
        </Button>
      </div>
    </div>
  );
};

export default Cart;
