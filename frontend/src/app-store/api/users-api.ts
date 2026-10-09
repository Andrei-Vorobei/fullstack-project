import { createApi } from '@reduxjs/toolkit/query/react';

import type { UserProfile } from '../reducers/user-slice';

import { axiosBaseQuery } from './auth-api';

export type UsersListItem = Pick<
  UserProfile,
  'id' | 'username' | 'roles' | 'about' | 'avatar' | 'createdAt' | 'updatedAt'
> &
  Partial<Pick<UserProfile, 'email'>>;

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000',
    defaultHeaders: { 'Content-Type': 'application/json' },
  }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersListItem[], void>({
      query: () => ({
        url: '/users',
      }),
      providesTags: ['Users'],
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
