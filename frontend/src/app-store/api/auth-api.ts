import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosRequestConfig } from 'axios';

import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

import type { UserProfile } from '../reducers/user-slice';

type AxiosBaseQueryArgs = {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
};

type AxiosBaseQueryRequest = {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
};

type AuthApiError = {
  status: number | 'FETCH_ERROR';
  data: unknown;
};

const getAccessToken = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('user' in state)) {
    return null;
  }

  const user = state.user;
  if (
    typeof user !== 'object' ||
    user === null ||
    !('accessToken' in user) ||
    typeof user.accessToken !== 'string'
  ) {
    return null;
  }

  return user.accessToken;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type UpdateUserRequest = Partial<Pick<UserProfile, 'username' | 'about' | 'avatar'>> & {
  password?: string;
};

export type AuthSession = UserProfile & {
  access_token: string;
};

export type RegisterResponse = UserProfile & {
  access_token?: string;
};

export type AccessTokenResponse = {
  access_token: string;
};

export const axiosBaseQuery =
  ({ baseUrl, defaultHeaders }: AxiosBaseQueryArgs): BaseQueryFn<AxiosBaseQueryRequest, unknown, AuthApiError> =>
  async ({ url, method = 'GET', data, params, headers }, { signal, getState }) => {
    try {
      const accessToken = getAccessToken(getState());
      const response = await axios({
        url: `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`,
        method,
        data,
        params,
        signal,
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...defaultHeaders,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...headers,
        },
      });

      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          error: {
            status: error.response?.status ?? 'FETCH_ERROR',
            data: error.response?.data ?? error.message,
          },
        };
      }

      return {
        error: {
          status: 'FETCH_ERROR',
          data: error instanceof Error ? error.message : 'An unknown request error occurred',
        },
      };
    }
  };

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000',
    defaultHeaders: { 'Content-Type': 'application/json' },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getMe: builder.query<UserProfile, void>({
      query: () => ({
        url: '/users/me',
      }),
      providesTags: ['User'],
    }),
    login: builder.mutation<AuthSession, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/signin',
        method: 'POST',
        data: credentials,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/auth/signup',
        method: 'POST',
        data: credentials,
      }),
    }),
    refresh: builder.query<AccessTokenResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      keepUnusedDataFor: 0,
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    removeUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
    }),
    updateUser: builder.mutation<unknown, UpdateUserRequest>({
      query: (credentials) => ({
        url: `/users/update`,
        method: 'POST',
        data: credentials,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useRefreshQuery,
  useLogoutMutation,
  useRemoveUserMutation,
  useUpdateUserMutation,
} = authApi;
