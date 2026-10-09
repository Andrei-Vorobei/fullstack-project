import type { JSX } from 'react';

import { StarFilled } from '@ant-design/icons';
import { Button } from 'antd';

import type { Product } from '@/app-store/api/products-api';

import styles from './product-card.module.css';

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
});

const ProductCard = ({ product, onAddToCart }: ProductCardProps): JSX.Element => {
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  return (
    <li className={styles.card}>
      <div className={styles.imageContainer}>
        {product.discountPercentage > 0 ? (
          <span className={styles.discount}>−{Math.round(product.discountPercentage)}%</span>
        ) : null}
        <img className={styles.image} src={product.thumbnail} alt={product.title} loading="lazy" />
      </div>
      <div className={styles.content}>
        <div className={styles.metadata}>
          <span className={styles.category}>{product.category}</span>
          <span className={styles.rating} aria-label={`Рейтинг ${product.rating} из 5`}>
            <StarFilled aria-hidden="true" />
            {product.rating.toFixed(1)}
          </span>
        </div>
        <h2 className={styles.title}>{product.title}</h2>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.footer}>
          <div className={styles.prices}>
            <span className={styles.price}>{currencyFormatter.format(discountedPrice)}</span>
            {product.discountPercentage > 0 ? (
              <span className={styles.originalPrice}>{currencyFormatter.format(product.price)}</span>
            ) : null}
          </div>
          <Button type="primary" onClick={() => onAddToCart(product)}>
            В корзину
          </Button>
        </div>
      </div>
    </li>
  );
};

export default ProductCard;
