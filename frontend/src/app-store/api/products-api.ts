import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosError, AxiosRequestConfig } from 'axios';

import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

export type ProductReview = {
  rating: number;
  comment: string;
  date: string; // ISO 8601
  reviewerName: string;
  reviewerEmail: string;
};

export type ProductDimensions = {
  width: number;
  height: number;
  depth: number;
};

export type ProductMeta = {
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  barcode: string;
  qrCode: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  thumbnail: string;
  images: string[];
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export type ProductFilters = {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

type AxiosBaseQueryArgs = {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
};

export const axiosBaseQuery =
  ({
    baseUrl,
    defaultHeaders,
  }: AxiosBaseQueryArgs): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await axios({
        url: `${baseUrl}${url}`,
        method,
        data,
        params,
        headers: { ...defaultHeaders, ...headers },
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
        },
      };
    }
  };

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery({
    baseUrl: 'http://localhost:3000',
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, { limit?: number; skip?: number }>({
      query: ({ limit, skip }) => ({
        url: '/products',
        params: { limit, skip },
      }),
      providesTags: ['Product'],
    }),

    getFilteredProducts: builder.query<Product[], ProductFilters>({
      query: (filters) => ({
        url: '/products/filter',
        params: {
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.brand ? { brand: filters.brand } : {}),
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.minPrice !== undefined ? { minPrice: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { maxPrice: filters.maxPrice } : {}),
          ...(filters.inStock !== undefined ? { inStock: String(filters.inStock) } : {}),
        },
      }),
      providesTags: ['Product'],
    }),

    getProductById: builder.query<Product, number>({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetFilteredProductsQuery, useGetProductByIdQuery } = productsApi;
