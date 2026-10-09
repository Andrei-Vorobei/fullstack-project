import { createSlice, type PayloadAction } from '@reduxjs/toolkit/react';

type AppState = {
  isOpenCartModal: boolean;
  pageSize: number;
  currentPage: number;
};

const initialState: AppState = {
  isOpenCartModal: false,
  pageSize: 10,
  currentPage: 1,
};

export const appGlobalSlice = createSlice({
  name: 'app-global',
  initialState,
  selectors: {
    getIsOpenCartModal: (state: { isOpenCartModal: boolean }): boolean => {
      return state.isOpenCartModal;
    },
    getPageSize: (state: { pageSize: number }): number => {
      return state.pageSize;
    },
    getCurrentPage: (state: { currentPage: number }): number => {
      return state.currentPage;
    },
  },
  reducers: {
    setIsOpenCartModal: (state, action: PayloadAction<boolean>) => {
      state.isOpenCartModal = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
});

export const { setIsOpenCartModal, setPageSize, setCurrentPage } = appGlobalSlice.actions;
export const { getIsOpenCartModal, getPageSize, getCurrentPage } = appGlobalSlice.selectors;

export default appGlobalSlice.reducer;
