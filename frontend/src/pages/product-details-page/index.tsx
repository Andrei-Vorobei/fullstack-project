import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
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
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';

import type { CurrencyCode } from '@/utils/currency';

import {
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCurrenciesQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  type Product,
} from '@/app-store/api/products-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import { useAppSelector } from '@/hooks';
import { formatCurrency, getCurrencyLabel } from '@/utils/currency';

import styles from './product-details-page.module.css';

type ProductDetailsPageContext = {
  onAddToCart: (product: Product) => void;
};

type ProductEditValues = {
  title: string;
  description: string;
  price: number;
  currencyCode: CurrencyCode;
  discountPercentage: number;
  stock: number;
  images: string;
};

const labels = {
  back: '\u041d\u0430\u0437\u0430\u0434 \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433',
  gallery: '\u0424\u043e\u0442\u043e\u0433\u0430\u043b\u0435\u0440\u0435\u044f',
  image: '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435',
  noImage: '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043d\u0435\u0442',
  inStock: '\u0412 \u043d\u0430\u043b\u0438\u0447\u0438\u0438',
  outOfStock: '\u041d\u0435\u0442 \u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438',
  pieces: '\u0448\u0442.',
  addToCart: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443',
  description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
  noDescription:
    '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e.',
  characteristics: '\u0425\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438',
  category: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f',
  productId: '\u0418\u0414 \u0442\u043e\u0432\u0430\u0440\u0430',
  brand: '\u0411\u0440\u0435\u043d\u0434',
  sku: '\u0410\u0440\u0442\u0438\u043a\u0443\u043b',
  price: '\u0426\u0435\u043d\u0430',
  discount: '\u0421\u043a\u0438\u0434\u043a\u0430',
  stock: '\u041e\u0441\u0442\u0430\u0442\u043e\u043a',
  availability: '\u041d\u0430\u043b\u0438\u0447\u0438\u0435',
  rating: '\u0420\u0435\u0439\u0442\u0438\u043d\u0433',
  weight: '\u0412\u0435\u0441',
  kilograms: '\u043a\u0433',
  centimeters: '\u0441\u043c',
  dimensions: '\u0420\u0430\u0437\u043c\u0435\u0440\u044b (\u0428 \u00d7 \u0412 \u00d7 \u0413)',
  created: '\u0421\u043e\u0437\u0434\u0430\u043d',
  updated: '\u041e\u0431\u043d\u043e\u0432\u043b\u0451\u043d',
  reviews: '\u041e\u0442\u0437\u044b\u0432\u044b',
  noReviews: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043e\u0442\u0437\u044b\u0432\u043e\u0432',
  loadError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u043e\u0432\u0430\u0440. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435.',
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
  const { onAddToCart } = useOutletContext<ProductDetailsPageContext>();
  const profile = useAppSelector(getProfile);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ProductEditValues | null>(null);
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const { data: currencies = [], error: currenciesError } = useGetCurrenciesQuery(undefined, { skip: !isAdmin });
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

  const categoryName = categories.find(({ slug }) => slug === product.category)?.name ?? product.category;
  const galleryImages = Array.from(new Set(product.images.filter(Boolean)));
  const currentImageIndex = Math.min(activeImageIndex, Math.max(galleryImages.length - 1, 0));
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const isInStock = product.stock > 0;
  const currentImage = galleryImages[currentImageIndex];

  const openEditModal = (): void => {
    setEditValues({
      title: product.title,
      description: product.description,
      price: product.price,
      currencyCode: product.currencyCode,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
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
          stock: editValues.stock,
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
                  {'\u2212'}
                  {Math.round(product.discountPercentage)}%
                </Tag>
              </div>
            ) : null}
          </div>
          <Button
            className={styles.addToCart}
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            disabled={!isInStock}
            onClick={() => onAddToCart(product)}
          >
            {labels.addToCart}
          </Button>

          <div className={styles.purchaseDetails}>
            <span>{labels.brand}</span>
            <strong>{product.brand || '?'}</strong>
            <span>{labels.sku}</span>
            <strong>{product.sku}</strong>
            <span>{labels.stock}</span>
            <strong>
              {product.stock} {labels.pieces}
            </strong>
          </div>

          {isAdmin ? (
            <div className={styles.adminActions}>
              <Button icon={<EditOutlined />} onClick={openEditModal}>
                {labels.edit}
              </Button>
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
              <dt>{labels.productId}</dt>
              <dd>{product.id}</dd>
            </div>
            <div>
              <dt>{labels.brand}</dt>
              <dd>{product.brand || '?'}</dd>
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
                {product.dimensions.width} {'\u00d7'} {product.dimensions.height} {'\u00d7'}{' '}
                {product.dimensions.depth} {labels.centimeters}
              </dd>
            </div>
            <div>
              <dt>{labels.created}</dt>
              <dd>
                <time dateTime={product.meta.createdAt}>
                  {new Date(product.meta.createdAt).toLocaleString('ru-RU')}
                </time>
              </dd>
            </div>
            <div>
              <dt>{labels.updated}</dt>
              <dd>
                <time dateTime={product.meta.updatedAt}>
                  {new Date(product.meta.updatedAt).toLocaleString('ru-RU')}
                </time>
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

      {isAdmin && editValues ? (
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
