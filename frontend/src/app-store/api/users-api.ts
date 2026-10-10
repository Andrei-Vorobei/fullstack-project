import { createApi } from '@reduxjs/toolkit/query/react';

import type { UserProfile } from '../reducers/user-slice';

import { axiosBaseQuery } from './auth-api';

export type UsersListItem = Pick<
  UserProfile,
  'id' | 'username' | 'roles' | 'about' | 'avatar' | 'telegramUsername' | 'createdAt' | 'updatedAt'
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
    setModeratorRole: builder.mutation<
      { id: string; roles: UserProfile['roles'] },
      { id: string; enabled: boolean }
    >({
      query: ({ id, enabled }) => ({
        url: `/users/${id}/moderator`,
        method: 'PATCH',
        data: { enabled },
      }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const { useDeleteUserMutation, useGetUsersQuery, useSetModeratorRoleMutation } = usersApi;
