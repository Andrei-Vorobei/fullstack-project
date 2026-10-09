import type { JSX } from 'react';

import { Button, Checkbox, Flex, Input, Pagination, Spin, type PaginationProps } from 'antd';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useAddCartItemMutation } from '@/app-store/api/cart-api';
import { useGetFilteredProductsQuery, useGetProductsQuery, type Product } from '@/app-store/api/products-api';
import ProductCard from '@/components/product-card';

import styles from './productc-page.module.css';
const DEFAULT_PAGE_SIZE = 10;
const FILTER_KEYS = ['category', 'brand', 'search', 'minPrice', 'maxPrice', 'inStock'];
const parseQueryInteger = (value: string | null, minimum: number): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue >= minimum ? parsedValue : null;
};
const ProductsPage = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addCartItem] = useAddCartItemMutation();

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
    data: filteredProducts = [],
    error: filteredError,
    isLoading: filteredLoading,
  } = useGetFilteredProductsQuery(
    {
      category: category || undefined,
      brand: brand || undefined,
      search: search || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock || undefined,
    },
    { skip: !hasActiveFilters }
  );

  useEffect(() => {
    console.log('products data: ', hasActiveFilters ? filteredProducts : data);
  }, [data, filteredProducts, hasActiveFilters]);

  const errorMessage = useMemo(() => {
    if (!error && !filteredError) return null;
    const activeError = hasActiveFilters ? filteredError : error;
    return activeError instanceof Error
      ? activeError.message
      : typeof activeError === 'string'
        ? activeError
        : (JSON.stringify(activeError) ?? 'Неизвестная ошибка');
  }, [error, filteredError, hasActiveFilters]);

  const products = hasActiveFilters ? filteredProducts : (data?.products ?? []);
  const isLoadingList = hasActiveFilters ? filteredLoading : isLoading;

  const updateFilter = (key: string, value: string | boolean): void => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    setSearchParams(next, { replace: true });
  };

  const resetFilters = (): void => {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    next.delete('limit');
    next.delete('skip');
    setSearchParams(next, { replace: true });
  };

  const addToCartHandler = (product: Product): void => {
    void addCartItem({ productId: product.id, quantity: 1 });
  };

  const paginationHandler: PaginationProps['onChange'] = (current: number, newPageSize: number): void => {
    setSearchParams((params) => {
      params.set('limit', String(newPageSize));
      params.set('skip', String((current - 1) * newPageSize));
      return params;
    });
  };

  return (
    <>
      <div className={styles.filters}>
        <Input
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <Input
          placeholder="Категория"
          value={category}
          onChange={(event) => updateFilter('category', event.target.value)}
        />
        <Input placeholder="Бренд" value={brand} onChange={(event) => updateFilter('brand', event.target.value)} />
        <Input
          type="number"
          placeholder="Мин. цена"
          value={minPrice}
          onChange={(event) => updateFilter('minPrice', event.target.value)}
        />
        <Input
          type="number"
          placeholder="Макс. цена"
          value={maxPrice}
          onChange={(event) => updateFilter('maxPrice', event.target.value)}
        />
        <Checkbox checked={inStock} onChange={(event) => updateFilter('inStock', event.target.checked)}>
          Только в наличии
        </Checkbox>
        <Button onClick={resetFilters}>Сбросить</Button>
      </div>
      {errorMessage != null && <p>Ошибка: {errorMessage}</p>}
      {isLoadingList && (
        <Flex justify="center" align="center" className={styles.spinner}>
          <Spin size="large" />
        </Flex>
      )}
      {!isLoadingList && products.length === 0 && <p>Товары не найдены</p>}
      <ul className={styles.cardsContainer}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCartHandler} />
        ))}
      </ul>
      {!hasActiveFilters && (
        <Pagination
          disabled={isLoading}
          pageSize={pageSize}
          current={currentPage}
          style={{ marginTop: '16px' }}
          align="center"
          showSizeChanger
          onChange={paginationHandler}
          defaultCurrent={1}
          total={data?.total ?? 0}
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        />
      )}
    </>
  );
};

export default ProductsPage;
