import { createApi } from '@reduxjs/toolkit/query/react';

import { axiosBaseQuery } from './auth-api';

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
  id: string;
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

export type ProductCategory = string;

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000',
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getCategories: builder.query<ProductCategory[], void>({
      query: () => ({ url: '/products/categories' }),
    }),
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

    importProducts: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/products/import',
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetFilteredProductsQuery,
  useGetProductByIdQuery,
  useImportProductsMutation,
} = productsApi;
