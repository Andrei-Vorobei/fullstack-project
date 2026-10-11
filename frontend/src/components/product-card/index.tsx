import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Alert, Button, Image, Input, InputNumber, message, Modal, Popconfirm, Select, Tag } from 'antd';
import { useState, type JSX } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import {
  useDeleteProductMutation,
  useGetCurrenciesQuery,
  useUpdateProductMutation,
  type Product,
} from '@/app-store/api/products-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppSelector } from '@/hooks';
import { formatCurrency, getCurrencyLabel } from '@/utils/currency';

import styles from './product-card.module.css';

type ProductCardProps = {
  product: Product;
  categoryName: string;
  onAddToCart: (product: Product) => void;
  hideCard?: boolean;
};

const ProductCard = ({ product, categoryName, onAddToCart, hideCard = false }: ProductCardProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId } = useParams();
  const isDetailsOpen = productId === product.id && location.pathname.endsWith('/modal');
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
  const openDetails = (): void => {
    void navigate({ pathname: '/products/' + product.id + '/modal', search: location.search });
  };
  const closeDetails = (): void => {
    void navigate({ pathname: '/products', search: location.search }, { replace: true });
  };
  const profile = useAppSelector(getProfile);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
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

  const handleDeleteProduct = async (): Promise<void> => {
    try {
      await deleteProduct(product.id).unwrap();
      message.success('Товар удалён');
      closeDetails();
    } catch {
      message.error('Не удалось удалить товар. Если он в корзине, сначала удалите его из корзины');
    }
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
      {!hideCard ? (
        <li className={styles.card}>
          <button
            type="button"
            className={styles.detailsTrigger}
            aria-label={`Подробнее о товаре: ${product.title}`}
            onClick={() => {
              setActiveImageIndex(0);
              openDetails();
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
                <span className={styles.category}>{categoryName}</span>
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
      ) : null}
      <Modal
        title={isEditing ? 'Редактирование товара' : null}
        open={isDetailsOpen}
        aria-label={product.title}
        onCancel={() => {
          if (!isSaving) {
            closeDetails();
            setIsEditing(false);
          }
        }}
        footer={
          isEditing ? (
            [
              <Button key="cancel" disabled={isSaving} onClick={() => setIsEditing(false)}>
                Отмена
              </Button>,
              <Button key="save" type="primary" loading={isSaving} onClick={() => void saveProduct()}>
                Сохранить
              </Button>,
            ]
          ) : (
            <div className={styles.modalActions}>
              {isAdmin ? (
                <div className={styles.adminActions}>
                  <Popconfirm
                    title={`${product.title} удалить из базы?`}
                    description="Это действие нельзя отменить."
                    okText="Удалить"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    onConfirm={() => void handleDeleteProduct()}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                      Удалить
                    </Button>
                  </Popconfirm>
                  <Button icon={<EditOutlined />} onClick={startEditing}>
                    Редактировать
                  </Button>
                </div>
              ) : null}
              <div className={styles.mainActions}>
                <Button
                  icon={<StarFilled />}
                  onClick={() =>
                    void navigate({ pathname: `/products/${product.id}/reviews`, search: location.search })
                  }
                >
                  {'Отзывы' + ' (' + product.reviews.length + ')'}
                </Button>
                <Button
                  icon={<LinkOutlined />}
                  onClick={() =>
                    void navigate({ pathname: '/products/' + product.id + '/page', search: location.search })
                  }
                >
                  Подробнее о товаре
                </Button>
                <Button onClick={closeDetails}>К товарам</Button>
                <Button
                  className={styles.addToCartButton}
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    onAddToCart(product);
                    closeDetails();
                  }}
                >
                  В корзину
                </Button>
              </div>
            </div>
          )
        }
        centered
        width={920}
        styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' } }}
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
              <span className={styles.detailCategory}>{categoryName}</span>
              <h2 className={styles.detailTitle}>{product.title}</h2>
              <div className={styles.detailMeta}>
                <span className={styles.detailRating}>
                  <StarFilled aria-hidden="true" /> {product.rating.toFixed(1)} / 5
                </span>
                <span className={product.stock > 0 ? styles.stockAvailable : styles.stockUnavailable}>
                  <span className={styles.stockIndicator} aria-hidden="true" />
                  {product.stock > 0 ? 'В наличии' : 'Нет в наличии'}
                  {product.stock > 0 ? `· ${product.stock} шт.` : ''}
                </span>
              </div>
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
              <p className={styles.detailDescription}>{product.description || 'Описание не указано'}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProductCard;
