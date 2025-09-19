import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { UserData } from '@/api/auth/types';

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    startLoading: (state) => {
      state.isLoading = true;
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setUser, startLoading, stopLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
