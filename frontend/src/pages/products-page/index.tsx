import type { JSX } from 'react';

import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  AutoComplete,
  Button,
  Checkbox,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Select,
  Segmented,
  Spin,
  type PaginationProps,
} from 'antd';
import { useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';

import type { CurrencyCode } from '@/utils/currency';

import {
  useCreateProductMutation,
  useGetCategoriesQuery,
  useGetCurrenciesQuery,
  useGetFilteredProductsQuery,
  useGetProductsQuery,
  type CreateProductRequest,
  type Product,
} from '@/app-store/api/products-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import ProductCard from '@/components/product-card';
import TextInput from '@/components/UI/text-input/text-input';
import { useAppSelector } from '@/hooks';
import { getCurrencyLabel } from '@/utils/currency';

import styles from './productc-page.module.css';
const DEFAULT_PAGE_SIZE = 10;
const FILTER_KEYS = ['category', 'brand', 'search', 'minPrice', 'maxPrice', 'inStock'];
const parseQueryInteger = (value: string | null, minimum: number): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue >= minimum ? parsedValue : null;
};
type ProductsPageContext = {
  onAddToCart: (product: Product) => void;
};

type CreateProductFormValues = {
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currencyCode: CurrencyCode;
  stock: number;
  imagesInput: string;
};

const isValidImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCreateProductRequest = (value: unknown): value is CreateProductRequest => {
  if (!isRecord(value)) return false;
  const candidate = value;
  return (
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.description === 'string' &&
    candidate.description.trim().length > 0 &&
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0 &&
    typeof candidate.brand === 'string' &&
    candidate.brand.trim().length > 0 &&
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0 &&
    (candidate.currencyCode === undefined ||
      candidate.currencyCode === 'USD' ||
      candidate.currencyCode === 'EUR' ||
      candidate.currencyCode === 'RUB') &&
    typeof candidate.stock === 'number' &&
    Number.isInteger(candidate.stock) &&
    candidate.stock >= 0 &&
    Array.isArray(candidate.images) &&
    candidate.images.length > 0 &&
    candidate.images.every((image) => typeof image === 'string' && isValidImageUrl(image))
  );
};

const ProductsPage = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'form' | 'json'>('form');
  const [productJson, setProductJson] = useState('');
  const [createForm] = Form.useForm<CreateProductFormValues>();
  const { onAddToCart } = useOutletContext<ProductsPageContext>();
  const profile = useAppSelector(getProfile);
  const isAdmin = profile?.roles.includes('admin') ?? false;
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const { data: categories = [], error: categoriesError } = useGetCategoriesQuery();
  const { data: currencies = [], error: currenciesError } = useGetCurrenciesQuery();

  const category = searchParams.get('category') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const search = searchParams.get('search') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStock = searchParams.get('inStock') === 'true';

  const hasActiveFilters = FILTER_KEYS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== '';
  });

  const pageSize = parseQueryInteger(searchParams.get('limit'), 1) ?? DEFAULT_PAGE_SIZE;
  const skip = parseQueryInteger(searchParams.get('skip'), 0) ?? 0;
  const currentPage = Math.floor(skip / pageSize) + 1;

  const { data, error, isLoading } = useGetProductsQuery({ limit: pageSize, skip }, { skip: hasActiveFilters });

  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
  } = useGetFilteredProductsQuery(
    {
      limit: pageSize,
      skip,
      category: category || undefined,
      brand: brand || undefined,
      search: search || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock || undefined,
    },
    { skip: !hasActiveFilters }
  );

  const errorMessage = useMemo(() => {
    const activeError = categoriesError ?? currenciesError ?? (hasActiveFilters ? filteredError : error);
    if (!activeError) return null;

    return activeError instanceof Error
      ? activeError.message
      : typeof activeError === 'string'
        ? activeError
        : (JSON.stringify(activeError) ?? 'Неизвестная ошибка');
  }, [categoriesError, currenciesError, error, filteredError, hasActiveFilters]);

  const products = hasActiveFilters ? (filteredData?.products ?? []) : (data?.products ?? []);
  const isLoadingList = hasActiveFilters ? filteredLoading : isLoading;

  const updateFilter = (key: string, value: string | boolean): void => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    next.delete('skip');
    setSearchParams(next, { replace: true });
  };

  const resetFilters = (): void => {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    next.delete('limit');
    next.delete('skip');
    setSearchParams(next, { replace: true });
  };

  const paginationHandler: PaginationProps['onChange'] = (current: number, newPageSize: number): void => {
    setSearchParams((params) => {
      params.set('limit', String(newPageSize));
      params.set('skip', String((current - 1) * newPageSize));
      return params;
    });
  };

  const submitProduct = async (product: CreateProductRequest): Promise<void> => {
    try {
      await createProduct(product).unwrap();
      message.success('Товар добавлен');
      createForm.resetFields();
      setProductJson('');
      setIsCreateModalOpen(false);
    } catch {
      message.error('Не удалось добавить товар. Проверьте данные, уникальность артикула и повторите попытку.');
    }
  };

  const submitNewProduct = async (values: CreateProductFormValues): Promise<void> => {
    const images = values.imagesInput
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);

    await submitProduct({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      brand: values.brand.trim(),
      price: values.price,
      currencyCode: values.currencyCode,
      stock: values.stock,
      images,
    });
  };

  const submitProductJson = async (): Promise<void> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(productJson.trim().replace(/,\s*$/, '')) as unknown;
    } catch {
      message.error('Некорректный JSON. Проверьте синтаксис и попробуйте снова.');
      return;
    }

    if (!isCreateProductRequest(parsed)) {
      message.error(
        'JSON должен содержать название, описание, категорию, бренд, цену, количество и хотя бы одну корректную ссылку в images.'
      );
      return;
    }

    await submitProduct(parsed);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.filters}>
        <TextInput
          name="search"
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <AutoComplete
          allowClear={{ clearIcon: <CloseOutlined /> }}
          className={styles.categoryAutocomplete}
          placeholder="Категория"
          value={category}
          options={categories.map((value) => ({ value, label: value }))}
          onChange={(value: string) => updateFilter('category', value)}
        />
        <TextInput
          name="brand"
          placeholder="Бренд"
          value={brand}
          onChange={(event) => updateFilter('brand', event.target.value)}
        />
        <TextInput
          name="minPrice"
          type="number"
          placeholder="Мин. цена"
          value={minPrice}
          onChange={(event) => updateFilter('minPrice', event.target.value)}
        />
        <TextInput
          name="maxPrice"
          type="number"
          placeholder="Макс. цена"
          value={maxPrice}
          onChange={(event) => updateFilter('maxPrice', event.target.value)}
        />
        <Checkbox checked={inStock} onChange={(event) => updateFilter('inStock', event.target.checked)}>
          Только в наличии
        </Checkbox>
        <Button onClick={resetFilters}>Сбросить</Button>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Добавить товар
          </Button>
        )}
      </div>
      <Modal
        title="Добавление товара"
        open={isCreateModalOpen}
        onCancel={() => {
          if (!isCreating) {
            setIsCreateModalOpen(false);
            createForm.resetFields();
            setProductJson('');
            setCreateMode('form');
          }
        }}
        footer={[
          <Button
            key="cancel"
            disabled={isCreating}
            onClick={() => {
              setIsCreateModalOpen(false);
              createForm.resetFields();
              setProductJson('');
              setCreateMode('form');
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isCreating}
            onClick={() => {
              if (createMode === 'form') {
                void createForm.submit();
              } else {
                void submitProductJson();
              }
            }}
          >
            Добавить
          </Button>,
        ]}
        destroyOnHidden
        width={640}
      >
        {currenciesError ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить список валют. Выбор валюты будет доступен после восстановления соединения."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Segmented
          value={createMode}
          options={[
            { label: 'Заполнить форму', value: 'form' },
            { label: 'Вставить JSON', value: 'json' },
          ]}
          onChange={(value) => setCreateMode(value === 'json' ? 'json' : 'form')}
          style={{ marginBottom: 20 }}
        />
        {createMode === 'json' ? (
          <>
            <Input.TextArea
              autoSize={{ minRows: 14, maxRows: 24 }}
              value={productJson}
              onChange={(event) => setProductJson(event.target.value)}
              placeholder={
                '{\n  "title": "Название",\n  "description": "Описание",\n  "category": "beauty",\n  "brand": "Бренд",\n  "price": 19.99,\n  "currencyCode": "USD",\n  "stock": 34,\n  "images": ["https://example.com/image.webp"]\n}'
              }
            />
            <p>
              Обязательны title, description, category, brand, price, stock и хотя бы одна ссылка в images.
              currencyCode необязателен (USD по умолчанию; допустимы USD, EUR и RUB). Поля id и externalId из JSON
              игнорируются: идентификатор товара создаётся сервером.
            </p>
          </>
        ) : (
          <Form
            form={createForm}
            layout="vertical"
            onFinish={(values: CreateProductFormValues) => void submitNewProduct(values)}
          >
            <Form.Item
              label="Название"
              name="title"
              rules={[{ required: true, whitespace: true, message: 'Введите название товара' }]}
            >
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item
              label="Описание"
              name="description"
              rules={[{ required: true, whitespace: true, message: 'Введите описание товара' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Flex gap={12} align="start" wrap>
              <Form.Item
                label="Категория"
                name="category"
                rules={[{ required: true, whitespace: true, message: 'Укажите категорию' }]}
                style={{ flex: '1 1 220px' }}
              >
                <AutoComplete
                  options={categories.map((value) => ({ value, label: value }))}
                  placeholder="Например, electronics"
                />
              </Form.Item>
              <Form.Item
                label="Бренд"
                name="brand"
                rules={[{ required: true, whitespace: true, message: 'Укажите бренд' }]}
                style={{ flex: '1 1 220px' }}
              >
                <Input maxLength={255} />
              </Form.Item>
            </Flex>
            <Flex gap={12} align="start" wrap>
              <Form.Item
                label="Цена"
                name="price"
                rules={[{ required: true, type: 'number', min: 0, message: 'Введите цену не меньше 0' }]}
                style={{ flex: '1 1 180px' }}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="Валюта"
                name="currencyCode"
                rules={[{ required: true, message: 'Выберите валюту' }]}
                initialValue="USD"
                style={{ flex: '1 1 180px' }}
              >
                <Select
                  disabled={currencies.length === 0}
                  loading={currencies.length === 0 && !currenciesError}
                  options={currencies.map((currency) => ({
                    value: currency.code,
                    label: getCurrencyLabel(currency),
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Наличие (количество)"
                name="stock"
                rules={[
                  { required: true, type: 'number', min: 0, message: 'Укажите количество товара' },
                  { type: 'integer', message: 'Количество должно быть целым числом' },
                ]}
                style={{ flex: '1 1 180px' }}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Flex>
            <Form.Item
              label="Ссылки на изображения (каждая с новой строки)"
              name="imagesInput"
              rules={[
                {
                  validator: (_rule, value: string | undefined): Promise<void> => {
                    const images =
                      value
                        ?.split(/\r?\n/)
                        .map((image) => image.trim())
                        .filter(Boolean) ?? [];
                    if (images.length === 0) {
                      return Promise.reject(new Error('Добавьте хотя бы одну ссылку на изображение'));
                    }
                    if (!images.every(isValidImageUrl)) {
                      return Promise.reject(
                        new Error('Укажите корректные ссылки на изображения (http или https)')
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.TextArea rows={4} placeholder="https://example.com/product-image.jpg" />
            </Form.Item>
          </Form>
        )}
      </Modal>
      {errorMessage != null && <p>Ошибка: {errorMessage}</p>}
      {isLoadingList && (
        <Flex justify="center" align="center" className={styles.spinner}>
          <Spin size="large" />
        </Flex>
      )}
      {!isLoadingList && products.length === 0 && <p>Товары не найдены</p>}
      <ul className={styles.cardsContainer}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </ul>
      <Pagination
        disabled={isLoadingList}
        pageSize={pageSize}
        current={currentPage}
        className={styles.pagination}
        align="center"
        showSizeChanger
        onChange={paginationHandler}
        total={hasActiveFilters ? (filteredData?.total ?? 0) : (data?.total ?? 0)}
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
      />
    </div>
  );
};

export default ProductsPage;
