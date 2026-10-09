import type { JSX } from 'react';

import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Spin, Typography } from 'antd';

import { useGetCartQuery, type CartItem } from '@/app-store/api/cart-api';
import { useAppSelector } from '@/hooks';

import styles from './cart.module.css';

type CartProps = {
  onRemoveProduct: (itemId: string) => void;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
};

const formatPrice = (amount: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(amount);

const Cart = ({ onRemoveProduct, onChangeQuantity, onClearCart }: CartProps): JSX.Element => {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const { data: cart, isLoading, error } = useGetCartQuery(undefined, { skip: !accessToken });

  if (isLoading) {
    return <Spin description="Загрузка корзины..." />;
  }

  if (error) {
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
                <span className={styles.unitPrice}>{formatPrice(item.product.price)} / шт.</span>
              </div>
              {item.product.discountPercentage > 0 ? (
                <p className={styles.discount}>Скидка {item.product.discountPercentage}%</p>
              ) : null}
            </div>
            <div className={styles.productTotal}>
              {item.product.discountPercentage > 0 ? (
                <span className={styles.originalPrice}>{formatPrice(item.product.price * item.quantity)}</span>
              ) : null}
              <strong>
                {formatPrice(item.product.price * item.quantity * (1 - item.product.discountPercentage / 100))}
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
        <div className={styles.summaryLine}>
          <Typography.Text strong>Итого</Typography.Text>
          <Typography.Text className={styles.grandTotal} strong>
            {formatPrice(cart.totalPrice)}
          </Typography.Text>
        </div>
        <Button className={styles.clearButton} danger onClick={onClearCart}>
          Очистить корзину
        </Button>
      </div>
    </div>
  );
};

export default Cart;
