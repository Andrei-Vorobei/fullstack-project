import { ArrowLeftOutlined, ArrowRightOutlined, EditOutlined, StarFilled } from '@ant-design/icons';
import { Alert, Button, Image, Input, InputNumber, message, Modal, Select, Tag } from 'antd';
import { useState, type JSX } from 'react';

import { useGetCurrenciesQuery, useUpdateProductMutation, type Product } from '@/app-store/api/products-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppSelector } from '@/hooks';
import { formatCurrency, getCurrencyLabel } from '@/utils/currency';

import styles from './product-card.module.css';

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

const ProductCard = ({ product, onAddToCart }: ProductCardProps): JSX.Element => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editValues, setEditValues] = useState({
    title: product.title,
    description: product.description,
    price: product.price,
    currencyCode: product.currencyCode,
    discountPercentage: product.discountPercentage,
    stock: product.stock,
    images: product.images.join('\n'),
  });
  const profile = useAppSelector(getProfile);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const {
    data: currencies = [],
    error: currenciesError,
    isLoading: areCurrenciesLoading,
  } = useGetCurrenciesQuery();
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const galleryImages = product.images.length > 0 ? product.images : [product.thumbnail];
  const visibleImageIndex = Math.min(activeImageIndex, galleryImages.length - 1);

  const startEditing = (): void => {
    setEditValues({
      title: product.title,
      description: product.description,
      price: product.price,
      currencyCode: product.currencyCode,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      images: product.images.join('\n'),
    });
    setIsEditing(true);
  };

  const saveProduct = async (): Promise<void> => {
    if (!editValues.title.trim()) {
      message.error('Название товара не может быть пустым');
      return;
    }

    const images = editValues.images
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
    if (images.length === 0) {
      message.error('Добавьте хотя бы одну ссылку на изображение');
      return;
    }

    try {
      await updateProduct({
        id: product.id,
        updates: {
          title: editValues.title.trim(),
          description: editValues.description,
          price: editValues.price,
          currencyCode: editValues.currencyCode,
          discountPercentage: editValues.discountPercentage,
          stock: editValues.stock,
          images,
        },
      }).unwrap();
      message.success('Изменения товара сохранены');
      setIsEditing(false);
    } catch {
      message.error('Не удалось сохранить товар. Проверьте ссылки на изображения и повторите попытку.');
    }
  };

  return (
    <>
      <li className={styles.card}>
        <button
          type="button"
          className={styles.detailsTrigger}
          aria-label={`Подробнее о товаре: ${product.title}`}
          onClick={() => {
            setActiveImageIndex(0);
            setIsDetailsOpen(true);
          }}
        >
          <div className={styles.imageContainer}>
            {product.discountPercentage > 0 ? (
              <span className={styles.discount}>−{Math.round(product.discountPercentage)}%</span>
            ) : null}
            <img className={styles.image} src={product.thumbnail} alt="" loading="lazy" />
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
          </div>
        </button>
        <div className={styles.footer}>
          <div className={styles.prices}>
            <span className={styles.price}>{formatCurrency(discountedPrice, product.currencyCode)}</span>
            {product.discountPercentage > 0 ? (
              <span className={styles.originalPrice}>{formatCurrency(product.price, product.currencyCode)}</span>
            ) : null}
          </div>
          <Button type="primary" onClick={() => onAddToCart(product)}>
            В корзину
          </Button>
        </div>
      </li>
      <Modal
        title={isEditing ? 'Редактирование товара' : product.title}
        open={isDetailsOpen}
        onCancel={() => {
          if (!isSaving) {
            setIsDetailsOpen(false);
            setIsEditing(false);
          }
        }}
        footer={
          isEditing
            ? [
                <Button key="cancel" disabled={isSaving} onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>,
                <Button key="save" type="primary" loading={isSaving} onClick={() => void saveProduct()}>
                  Сохранить
                </Button>,
              ]
            : [
                isAdmin ? (
                  <Button key="edit" icon={<EditOutlined />} onClick={startEditing}>
                    Редактировать
                  </Button>
                ) : null,
                <Button key="close" onClick={() => setIsDetailsOpen(false)}>
                  Закрыть
                </Button>,
                <Button
                  key="add-to-cart"
                  type="primary"
                  onClick={() => {
                    onAddToCart(product);
                    setIsDetailsOpen(false);
                  }}
                >
                  В корзину
                </Button>,
              ]
        }
        width={800}
        styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
      >
        {isEditing ? (
          <div className={styles.editForm}>
            {currenciesError ? (
              <Alert
                type="error"
                showIcon
                message="Не удалось загрузить список валют. Текущая валюта товара сохранится."
              />
            ) : null}
            <label className={styles.editField}>
              Название
              <Input
                value={editValues.title}
                maxLength={255}
                onChange={(event) => setEditValues((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className={styles.editField}>
              Описание
              <Input.TextArea
                rows={4}
                value={editValues.description}
                onChange={(event) => setEditValues((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <div className={styles.editNumbers}>
              <label className={styles.editField}>
                Цена
                <InputNumber
                  min={0}
                  precision={2}
                  value={editValues.price}
                  onChange={(price) => setEditValues((current) => ({ ...current, price: price ?? 0 }))}
                />
              </label>
              <label className={styles.editField}>
                Валюта
                <Select
                  value={editValues.currencyCode}
                  disabled={currencies.length === 0}
                  loading={areCurrenciesLoading}
                  options={currencies.map((currency) => ({
                    value: currency.code,
                    label: getCurrencyLabel(currency),
                  }))}
                  onChange={(currencyCode) => setEditValues((current) => ({ ...current, currencyCode }))}
                />
              </label>
              <label className={styles.editField}>
                Скидка (%)
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  value={editValues.discountPercentage}
                  onChange={(discountPercentage) =>
                    setEditValues((current) => ({
                      ...current,
                      discountPercentage: discountPercentage ?? 0,
                    }))
                  }
                />
              </label>
              <label className={styles.editField}>
                Остаток
                <InputNumber
                  min={0}
                  precision={0}
                  value={editValues.stock}
                  onChange={(stock) => setEditValues((current) => ({ ...current, stock: stock ?? 0 }))}
                />
              </label>
            </div>
            <label className={styles.editField}>
              Ссылки на изображения (каждая с новой строки)
              <Input.TextArea
                rows={5}
                value={editValues.images}
                onChange={(event) => setEditValues((current) => ({ ...current, images: event.target.value }))}
              />
            </label>
          </div>
        ) : (
          <div className={styles.details}>
            <Image.PreviewGroup>
              <div className={styles.gallery}>
                <div className={styles.galleryStage}>
                  <div
                    className={styles.galleryTrack}
                    style={{ transform: `translateX(-${visibleImageIndex * 100}%)` }}
                  >
                    {galleryImages.map((image, index) => (
                      <div className={styles.gallerySlide} key={`${image}-${index}`}>
                        <Image
                          className={styles.detailImage}
                          src={image}
                          alt={`${product.title} — изображение ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  {galleryImages.length > 1 ? (
                    <>
                      <Button
                        aria-label="Предыдущее изображение"
                        className={`${styles.galleryArrow} ${styles.galleryArrowPrevious}`}
                        disabled={visibleImageIndex === 0}
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setActiveImageIndex((index) => Math.max(0, index - 1))}
                        shape="circle"
                      />
                      <Button
                        aria-label="Следующее изображение"
                        className={`${styles.galleryArrow} ${styles.galleryArrowNext}`}
                        disabled={visibleImageIndex === galleryImages.length - 1}
                        icon={<ArrowRightOutlined />}
                        onClick={() =>
                          setActiveImageIndex((index) => Math.min(galleryImages.length - 1, index + 1))
                        }
                        shape="circle"
                      />
                    </>
                  ) : null}
                </div>
                {galleryImages.length > 1 ? (
                  <span className={styles.galleryCounter} aria-live="polite">
                    {visibleImageIndex + 1} / {galleryImages.length}
                  </span>
                ) : null}
              </div>
            </Image.PreviewGroup>
            <div className={styles.detailSummary}>
              <p className={styles.detailDescription}>{product.description}</p>
              <div className={styles.detailPrices}>
                <span className={styles.price}>{formatCurrency(discountedPrice, product.currencyCode)}</span>
                {product.discountPercentage > 0 ? (
                  <>
                    <span className={styles.originalPrice}>
                      {formatCurrency(product.price, product.currencyCode)}
                    </span>
                    <Tag color="red">−{Math.round(product.discountPercentage)}%</Tag>
                  </>
                ) : null}
              </div>
              <dl className={styles.detailList}>
                <div>
                  <dt>Категория</dt>
                  <dd>{product.category}</dd>
                </div>
                <div>
                  <dt>Бренд</dt>
                  <dd>{product.brand || 'Не указан'}</dd>
                </div>
                <div>
                  <dt>Артикул</dt>
                  <dd>{product.sku}</dd>
                </div>
                <div>
                  <dt>Наличие</dt>
                  <dd>
                    {product.availabilityStatus} ({product.stock} шт.)
                  </dd>
                </div>
                <div>
                  <dt>Рейтинг</dt>
                  <dd>
                    <StarFilled aria-hidden="true" /> {product.rating.toFixed(1)} из 5
                  </dd>
                </div>
                <div>
                  <dt>Вес</dt>
                  <dd>{product.weight} кг</dd>
                </div>
                <div>
                  <dt>Размеры (Ш × В × Г)</dt>
                  <dd>
                    {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} см
                  </dd>
                </div>
                <div>
                  <dt>Гарантия</dt>
                  <dd>{product.warrantyInformation}</dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>{product.shippingInformation}</dd>
                </div>
                <div>
                  <dt>Возврат</dt>
                  <dd>{product.returnPolicy}</dd>
                </div>
                <div>
                  <dt>Минимальный заказ</dt>
                  <dd>{product.minimumOrderQuantity} шт.</dd>
                </div>
              </dl>
              {product.tags.length > 0 && (
                <div className={styles.tags} aria-label="Теги товара">
                  {product.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
              {product.reviews.length > 0 && (
                <section className={styles.reviews} aria-labelledby={`reviews-${product.id}`}>
                  <h3 id={`reviews-${product.id}`}>Отзывы</h3>
                  {product.reviews.map((review, index) => (
                    <article key={`${review.reviewerName}-${review.date}-${index}`} className={styles.review}>
                      <div className={styles.reviewHeader}>
                        <strong>{review.reviewerName}</strong>
                        <span className={styles.rating}>
                          <StarFilled aria-hidden="true" /> {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <p>{review.comment}</p>
                      <time dateTime={review.date}>{new Date(review.date).toLocaleDateString('ru-RU')}</time>
                    </article>
                  ))}
                </section>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProductCard;
