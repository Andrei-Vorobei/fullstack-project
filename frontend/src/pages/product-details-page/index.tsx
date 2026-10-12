import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useState, type JSX } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import type { CurrencyCode } from '@/utils/currency';

import {
  useAddCartItemMutation,
  useRemoveCartItemMutation,
  useSetCartItemQuantityMutation,
} from '@/app-store/api/cart-api';
import {
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCurrenciesQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from '@/app-store/api/products-api';
import {
  addGuestCartItem,
  getCart,
  removeGuestCartItem,
  setGuestCartItemQuantity,
} from '@/app-store/reducers/cart-slice';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { formatCurrency, getCurrencyLabel } from '@/utils/currency';

import styles from './product-details-page.module.css';

type ProductEditValues = {
  title: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: number;
  currencyCode: CurrencyCode;
  discountPercentage: number;
  stock: number;
  availabilityStatus: string;
  weight: number;
  width: number;
  height: number;
  depth: number;
  images: string;
};

const labels = {
  inCart: 'В корзине',
  increaseQuantity: 'Увеличить количество',
  decreaseQuantity: 'Уменьшить количество',
  cartUpdateError: 'Не удалось обновить корзину',
  back: 'Назад в каталог',
  gallery: 'Фотогалерея',
  image: 'Изображение',
  noImage: 'Нет изображения',
  inStock: 'В наличии',
  outOfStock: 'Нет в наличии',
  pieces: 'шт.',
  addToCart: 'Добавить в корзину',
  description: 'Описание',
  noDescription: 'Описание не указано.',
  characteristics: 'Характеристики',
  category: 'Категория',
  brand: 'Бренд',
  sku: 'Артикул',
  price: 'Цена',
  discount: 'Скидка',
  stock: 'Остаток',
  availability: 'Наличие',
  rating: 'Рейтинг',
  weight: 'Вес',
  kilograms: 'кг',
  centimeters: 'см',
  dimensions: 'Размеры (Ш × В × Г)',
  reviews: 'Отзывы',
  noReviews: 'Пока нет отзывов',
  loadError: 'Не удалось загрузить товар. Попробуйте позже.',
  loading: 'Загрузка товара…',
  edit: 'Редактировать',
  delete: 'Удалить',
  cancel: 'Отмена',
  save: 'Сохранить',
  deleteConfirm: 'Удалить этот товар из базы?',
  irreversible: 'Это действие нельзя отменить.',
  title: 'Название',
  descriptionLabel: 'Описание',
  currency: 'Валюта',
  discountLabel: 'Скидка',
  stockLabel: 'Остаток',
  imagesLabel: 'Ссылки на изображения (каждая с новой строки)',
  titleRequired: 'Название не может быть пустым',
  categoryLabel: 'Категория',
  brandLabel: 'Бренд',
  skuLabel: 'Артикул',
  weightLabel: 'Вес (кг)',
  dimensionsLabel: 'Размеры (см)',
  widthLabel: 'Ширина',
  heightLabel: 'Высота',
  depthLabel: 'Глубина',
  availabilityLabel: 'Наличие',
  inStockOption: 'В наличии',
  lowStockOption: 'Мало на складе',
  outOfStockOption: 'Нет в наличии',
  imageRequired: 'Добавьте хотя бы одну ссылку на изображение',
  saveSuccess: 'Товар обновлён',
  saveError: 'Не удалось сохранить товар',
  deleteSuccess: 'Товар удалён',
  deleteError: 'Не удалось удалить товар. Возможно, он ещё находится в корзине',
  currencyError: 'Не удалось загрузить список валют',
};

const ProductDetailsPage = (): JSX.Element => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useAppSelector(getProfile);
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const dispatch = useAppDispatch();
  const cart = useAppSelector(getCart);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const canEditProduct = isAdmin || (profile?.roles.includes('moderator') ?? false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ProductEditValues | null>(null);
  const [addCartItem, { isLoading: isAddingCartItem }] = useAddCartItemMutation();
  const [setCartItemQuantity, { isLoading: isSettingCartQuantity }] = useSetCartItemQuantityMutation();
  const [removeCartItem, { isLoading: isRemovingCartItem }] = useRemoveCartItemMutation();
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const { data: currencies = [], error: currenciesError } = useGetCurrenciesQuery(undefined, {
    skip: !canEditProduct,
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: product, error, isLoading } = useGetProductByIdQuery(productId ?? '', { skip: !productId });
  const { data: categories = [] } = useGetCategoriesQuery();

  if (isLoading) {
    return (
      <div className={styles.status} role="status">
        <Spin /> {labels.loading}
      </div>
    );
  }

  if (error || !product) {
    return (
      <main className={styles.page}>
        <Button
          className={styles.backButton}
          icon={<ArrowLeftOutlined />}
          onClick={() => void navigate({ pathname: '/products', search: location.search })}
        >
          {labels.back}
        </Button>
        <Alert type="error" showIcon message={labels.loadError} />
      </main>
    );
  }

  const cartItem = cart.items.find((item) => item.product.id === product.id);
  const cartQuantity = cartItem?.quantity ?? 0;
  const categoryName = categories.find(({ slug }) => slug === product.category)?.name ?? product.category;
  const galleryImages = Array.from(new Set(product.images.filter(Boolean)));
  const currentImageIndex = Math.min(activeImageIndex, Math.max(galleryImages.length - 1, 0));
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const isInStock = product.stock > 0;
  const isCartUpdating = isAddingCartItem ? true : isSettingCartQuantity ? true : isRemovingCartItem;

  const addOneToCart = async (): Promise<void> => {
    if (!isInStock || isCartUpdating) return;

    if (!accessToken) {
      dispatch(addGuestCartItem(product));
      return;
    }

    try {
      await addCartItem({ productId: product.id, quantity: 1 }).unwrap();
    } catch {
      message.error(labels.cartUpdateError);
    }
  };

  const removeOneFromCart = async (): Promise<void> => {
    if (!cartItem || isCartUpdating) return;

    if (!accessToken) {
      if (cartItem.quantity === 1) {
        dispatch(removeGuestCartItem(cartItem.id));
      } else {
        dispatch(setGuestCartItemQuantity({ itemId: cartItem.id, quantity: cartItem.quantity - 1 }));
      }
      return;
    }

    try {
      if (cartItem.quantity === 1) {
        await removeCartItem(cartItem.id).unwrap();
      } else {
        await setCartItemQuantity({ itemId: cartItem.id, quantity: cartItem.quantity - 1 }).unwrap();
      }
    } catch {
      message.error(labels.cartUpdateError);
    }
  };
  const currentImage = galleryImages[currentImageIndex];

  const openEditModal = (): void => {
    setEditValues({
      title: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand ?? '',
      sku: product.sku ?? '',
      price: product.price,
      currencyCode: product.currencyCode,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      availabilityStatus:
        (
          {
            'В наличии': 'In Stock',
            'Нет в наличии': 'Out of Stock',
            'Мало на складе': 'Low Stock',
          } as Record<string, string>
        )[product.availabilityStatus] ?? 'In Stock',
      weight: product.weight,
      width: product.dimensions.width,
      height: product.dimensions.height,
      depth: product.dimensions.depth,
      images: product.images.join('\n'),
    });
    setIsEditOpen(true);
  };

  const saveProductChanges = async (): Promise<void> => {
    if (!editValues?.title.trim()) {
      message.error(labels.titleRequired);
      return;
    }
    const images = editValues.images
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
    if (images.length === 0) {
      message.error(labels.imageRequired);
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
          category: editValues.category,
          brand: editValues.brand.trim(),
          sku: editValues.sku.trim() || null,
          stock: editValues.stock,
          availabilityStatus: editValues.availabilityStatus,
          weight: editValues.weight,
          dimensions: {
            width: editValues.width,
            height: editValues.height,
            depth: editValues.depth,
          },
          images,
        },
      }).unwrap();
      message.success(labels.saveSuccess);
      setIsEditOpen(false);
    } catch {
      message.error(labels.saveError);
    }
  };

  const removeProduct = async (): Promise<void> => {
    try {
      await deleteProduct(product.id).unwrap();
      message.success(labels.deleteSuccess);
      void navigate({ pathname: '/products', search: location.search }, { replace: true });
    } catch {
      message.error(labels.deleteError);
    }
  };

  return (
    <main className={styles.page}>
      <Button
        className={styles.backButton}
        icon={<ArrowLeftOutlined />}
        onClick={() => void navigate({ pathname: '/products', search: location.search })}
      >
        {labels.back}
      </Button>

      <section className={styles.productHero} aria-label={product.title}>
        <div className={styles.galleryColumn}>
          <div className={styles.mainImageFrame}>
            {currentImage ? (
              <Image.PreviewGroup>
                <Image
                  className={styles.mainImage}
                  src={currentImage}
                  alt={product.title + ' ? ' + (currentImageIndex + 1)}
                />
              </Image.PreviewGroup>
            ) : (
              <div className={styles.imagePlaceholder}>{labels.noImage}</div>
            )}
          </div>
          {galleryImages.length > 1 ? (
            <div className={styles.thumbnails} aria-label={labels.gallery}>
              {galleryImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === currentImageIndex ? styles.thumbnailActive : styles.thumbnail}
                  aria-label={labels.image + ' ' + (index + 1)}
                  aria-pressed={index === currentImageIndex}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.purchasePanel}>
          <span className={styles.category}>{categoryName}</span>
          <Typography.Title level={1} className={styles.title}>
            {product.title}
          </Typography.Title>

          <div className={styles.productMeta}>
            <a className={styles.rating} href="#product-reviews">
              <StarFilled aria-hidden="true" />
              <span>{product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({product.reviews.length})</span>
            </a>
            <span className={isInStock ? styles.stockAvailable : styles.stockUnavailable}>
              <span className={styles.stockIndicator} aria-hidden="true" />
              {isInStock ? labels.inStock : labels.outOfStock}
            </span>
          </div>

          <div className={styles.priceBlock}>
            <Typography.Title level={2} className={styles.price}>
              {formatCurrency(discountedPrice, product.currencyCode)}
            </Typography.Title>
            {product.discountPercentage > 0 ? (
              <div className={styles.discount}>
                <Typography.Text delete>{formatCurrency(product.price, product.currencyCode)}</Typography.Text>
                <Tag color="red">
                  {'-'}
                  {Math.round(product.discountPercentage)}%
                </Tag>
              </div>
            ) : null}
          </div>
          <div className={styles.cartActions}>
            {cartQuantity > 0 ? (
              <div className={styles.quantityControl} role="group" aria-label={labels.inCart}>
                <Button
                  aria-label={labels.decreaseQuantity}
                  disabled={isCartUpdating}
                  icon={<MinusOutlined />}
                  onClick={() => void removeOneFromCart()}
                  shape="circle"
                />
                <span className={styles.quantityValue} aria-live="polite">
                  {cartQuantity}
                </span>
                <Button
                  aria-label={labels.increaseQuantity}
                  disabled={isCartUpdating ? true : cartQuantity >= product.stock}
                  icon={<PlusOutlined />}
                  onClick={() => void addOneToCart()}
                  shape="circle"
                />
              </div>
            ) : null}
            <Button
              className={styles.addToCart}
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              disabled={!isInStock || isCartUpdating || cartQuantity >= product.stock}
              loading={isAddingCartItem}
              onClick={() => void addOneToCart()}
            >
              {labels.addToCart}
            </Button>
          </div>

          <div className={styles.purchaseDetails}>
            <span>{labels.brand}</span>
            <strong>{product.brand || 'Нет данных'}</strong>
            <span>{labels.sku}</span>
            <strong>{product.sku}</strong>
            <span>{labels.stock}</span>
            <strong>
              {product.stock} {labels.pieces}
            </strong>
          </div>

          {canEditProduct ? (
            <div className={styles.adminActions}>
              <Button icon={<EditOutlined />} onClick={openEditModal}>
                {labels.edit}
              </Button>
              {isAdmin ? (
                <Popconfirm
                  title={labels.deleteConfirm}
                  description={labels.irreversible}
                  okText={labels.delete}
                  cancelText={labels.cancel}
                  okButtonProps={{ danger: true, loading: isDeleting }}
                  onConfirm={() => void removeProduct()}
                >
                  <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                    {labels.delete}
                  </Button>
                </Popconfirm>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="product-description-heading">
        <Typography.Title level={2} id="product-description-heading" className={styles.sectionTitle}>
          {labels.description}
        </Typography.Title>
        <Card className={styles.contentCard}>
          <Typography.Paragraph className={styles.description}>
            {product.description || labels.noDescription}
          </Typography.Paragraph>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby="product-info-heading">
        <Typography.Title level={2} id="product-info-heading" className={styles.sectionTitle}>
          {labels.characteristics}
        </Typography.Title>
        <Card className={styles.contentCard}>
          <dl className={styles.details}>
            <div>
              <dt>{labels.category}</dt>
              <dd>{categoryName}</dd>
            </div>
            <div>
              <dt>{labels.brand}</dt>
              <dd>{product.brand || 'Нет данных'}</dd>
            </div>
            <div>
              <dt>{labels.sku}</dt>
              <dd>{product.sku}</dd>
            </div>
            <div>
              <dt>{labels.price}</dt>
              <dd>{formatCurrency(product.price, product.currencyCode)}</dd>
            </div>
            <div>
              <dt>{labels.discount}</dt>
              <dd>{product.discountPercentage}%</dd>
            </div>
            <div>
              <dt>{labels.stock}</dt>
              <dd>
                {product.stock} {labels.pieces}
              </dd>
            </div>
            <div>
              <dt>{labels.availability}</dt>
              <dd>{product.availabilityStatus}</dd>
            </div>
            <div>
              <dt>{labels.rating}</dt>
              <dd>
                <StarFilled aria-hidden="true" /> {product.rating.toFixed(1)} / 5
              </dd>
            </div>
            <div>
              <dt>{labels.weight}</dt>
              <dd>
                {product.weight} {labels.kilograms}
              </dd>
            </div>
            <div>
              <dt>{labels.dimensions}</dt>
              <dd>
                {product.dimensions.width} {'×'} {product.dimensions.height} {'×'} {product.dimensions.depth}{' '}
                {labels.centimeters}
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby="product-reviews-heading" id="product-reviews">
        <div className={styles.reviewSectionHeader}>
          <Typography.Title level={2} id="product-reviews-heading" className={styles.sectionTitle}>
            {labels.reviews} ({product.reviews.length})
          </Typography.Title>
          <Link
            className={styles.allReviewsLink}
            to={{ pathname: `/products/${product.id}/reviews`, search: location.search }}
          >
            {'Все отзывы'}
          </Link>
        </div>
        {product.reviews.length > 0 ? (
          <div className={styles.reviews}>
            {product.reviews.map((review, index) => (
              <Card className={styles.review} key={review.reviewerName + review.date + index}>
                <div className={styles.reviewHeader}>
                  <Typography.Text strong>{review.reviewerName}</Typography.Text>
                  <Typography.Text className={styles.reviewRating}>
                    <StarFilled aria-hidden="true" /> {review.rating.toFixed(1)} / 5
                  </Typography.Text>
                </div>
                <Typography.Paragraph className={styles.reviewComment}>{review.comment}</Typography.Paragraph>
                <Typography.Text type="secondary">
                  <time dateTime={review.date}>{new Date(review.date).toLocaleDateString('ru-RU')}</time>
                </Typography.Text>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={styles.contentCard}>
            <Typography.Paragraph type="secondary" className={styles.emptyReviews}>
              {labels.noReviews}
            </Typography.Paragraph>
          </Card>
        )}
      </section>

      {canEditProduct && editValues ? (
        <Modal
          title={labels.edit}
          open={isEditOpen}
          onCancel={() => {
            if (!isSaving) setIsEditOpen(false);
          }}
          centered
          destroyOnHidden
          footer={[
            <Button key="cancel" disabled={isSaving} onClick={() => setIsEditOpen(false)}>
              {labels.cancel}
            </Button>,
            <Button key="save" type="primary" loading={isSaving} onClick={() => void saveProductChanges()}>
              {labels.save}
            </Button>,
          ]}
        >
          <div className={styles.editForm}>
            {currenciesError ? <Alert type="error" showIcon message={labels.currencyError} /> : null}
            <label className={styles.editField}>
              {labels.title}
              <Input
                value={editValues.title}
                maxLength={255}
                onChange={(event) =>
                  setEditValues((current) => (current ? { ...current, title: event.target.value } : current))
                }
              />
            </label>
            <label className={styles.editField}>
              {labels.categoryLabel}
              <Select
                value={editValues.category}
                options={[
                  ...(!categories.some(({ slug }) => slug === product.category)
                    ? [{ value: product.category, label: product.category }]
                    : []),
                  ...categories.map(({ slug, name }) => ({ value: slug, label: name })),
                ]}
                onChange={(category) => setEditValues((current) => (current ? { ...current, category } : current))}
              />
            </label>
            <div className={styles.editNumbers}>
              <label className={styles.editField}>
                {labels.brandLabel}
                <Input
                  value={editValues.brand}
                  maxLength={255}
                  onChange={(event) =>
                    setEditValues((current) => (current ? { ...current, brand: event.target.value } : current))
                  }
                />
              </label>
              <label className={styles.editField}>
                {labels.skuLabel}
                <Input
                  value={editValues.sku}
                  maxLength={100}
                  onChange={(event) =>
                    setEditValues((current) => (current ? { ...current, sku: event.target.value } : current))
                  }
                />
              </label>
            </div>
            <label className={styles.editField}>
              {labels.descriptionLabel}
              <Input.TextArea
                rows={4}
                value={editValues.description}
                onChange={(event) =>
                  setEditValues((current) => (current ? { ...current, description: event.target.value } : current))
                }
              />
            </label>
            <div className={styles.editNumbers}>
              <label className={styles.editField}>
                {labels.price}
                <InputNumber
                  min={0}
                  precision={2}
                  value={editValues.price}
                  onChange={(value) =>
                    setEditValues((current) => (current ? { ...current, price: value ?? 0 } : current))
                  }
                />
              </label>
              <label className={styles.editField}>
                {labels.currency}
                <Select
                  value={editValues.currencyCode}
                  disabled={currencies.length === 0}
                  options={currencies.map((currency) => ({
                    value: currency.code,
                    label: getCurrencyLabel(currency),
                  }))}
                  onChange={(currencyCode: CurrencyCode) =>
                    setEditValues((current) => (current ? { ...current, currencyCode } : current))
                  }
                />
              </label>
              <label className={styles.editField}>
                {labels.discountLabel}
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  value={editValues.discountPercentage}
                  onChange={(value) =>
                    setEditValues((current) =>
                      current ? { ...current, discountPercentage: value ?? 0 } : current
                    )
                  }
                />
              </label>
              <label className={styles.editField}>
                {labels.stockLabel}
                <InputNumber
                  min={0}
                  precision={0}
                  value={editValues.stock}
                  onChange={(value) =>
                    setEditValues((current) => (current ? { ...current, stock: value ?? 0 } : current))
                  }
                />
              </label>
            </div>
            <label className={styles.editField}>
              {labels.availabilityLabel}
              <Select
                value={editValues.availabilityStatus}
                options={[
                  { value: 'In Stock', label: labels.inStockOption },
                  { value: 'Low Stock', label: labels.lowStockOption },
                  { value: 'Out of Stock', label: labels.outOfStockOption },
                ]}
                onChange={(availabilityStatus: string) =>
                  setEditValues((current) => (current ? { ...current, availabilityStatus } : current))
                }
              />
            </label>
            <label className={styles.editField}>
              {labels.weightLabel}
              <InputNumber
                min={0}
                precision={2}
                value={editValues.weight}
                onChange={(value) =>
                  setEditValues((current) => (current ? { ...current, weight: value ?? 0 } : current))
                }
              />
            </label>
            <div className={styles.editDimensions}>
              {(
                [
                  ['width', labels.widthLabel],
                  ['height', labels.heightLabel],
                  ['depth', labels.depthLabel],
                ] as const
              ).map(([key, label]) => (
                <label className={styles.editField} key={key}>
                  {label}
                  <InputNumber
                    min={0}
                    precision={2}
                    value={editValues[key]}
                    onChange={(value) =>
                      setEditValues((current) => (current ? { ...current, [key]: value ?? 0 } : current))
                    }
                  />
                </label>
              ))}
            </div>
            <label className={styles.editField}>
              {labels.imagesLabel}
              <Input.TextArea
                rows={5}
                value={editValues.images}
                onChange={(event) =>
                  setEditValues((current) => (current ? { ...current, images: event.target.value } : current))
                }
              />
            </label>
          </div>
        </Modal>
      ) : null}
    </main>
  );
};

export default ProductDetailsPage;
