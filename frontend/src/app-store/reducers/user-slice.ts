import { createSlice, type PayloadAction } from '@reduxjs/toolkit/react';

import { authApi } from '@/app-store/api/auth-api';

export type UserRole = 'user' | 'admin';

export type UserProfile = {
  id: string;
  username: string;
  about: string;
  avatar: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

type UserState = {
  profile: UserProfile | null;
  accessToken: string | null;
};

const initialState: UserState = {
  profile: null,
  accessToken: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  selectors: {
    getProfile: (state) => state.profile,
  },
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      const { access_token, ...profile } = payload;
      state.profile = profile;
      state.accessToken = access_token;
    });
    builder.addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
      state.profile = payload;
    });
    builder.addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
      state.profile = {
        id: payload.id,
        username: payload.username,
        about: payload.about,
        avatar: payload.avatar,
        email: payload.email,
        roles: payload.roles,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };
      if (payload.access_token) {
        state.accessToken = payload.access_token;
      }
    });
    builder.addMatcher(authApi.endpoints.refresh.matchFulfilled, (state, { payload }) => {
      state.accessToken = payload.access_token;
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.profile = null;
      state.accessToken = null;
    });
    builder.addMatcher(authApi.endpoints.removeUser.matchFulfilled, (state) => {
      state.profile = null;
      state.accessToken = null;
    });
  },
});

export const { setProfile, setAccessToken, clearProfile } = userSlice.actions;
export const { getProfile } = userSlice.selectors;

export default userSlice.reducer;
