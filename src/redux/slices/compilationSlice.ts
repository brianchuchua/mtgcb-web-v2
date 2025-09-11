import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface CompilationState {
  isCompiling: boolean;
  message: string | null;
  goalId: number | null;
  retryCount: number;
  lastRetryTime: number | null;
}

const initialState: CompilationState = {
  isCompiling: false,
  message: null,
  goalId: null,
  retryCount: 0,
  lastRetryTime: null,
};

const compilationSlice = createSlice({
  name: 'compilation',
  initialState,
  reducers: {
    setCompilationState: (state, action: PayloadAction<{
      isCompiling: boolean;
      message: string | null;
      goalId: number | null;
    }>) => {
      state.isCompiling = action.payload.isCompiling;
      state.message = action.payload.message;
      state.goalId = action.payload.goalId;
    },
    incrementRetryCount: (state) => {
      state.retryCount += 1;
      state.lastRetryTime = Date.now();
    },
    resetCompilationState: (state) => {
      state.isCompiling = false;
      state.message = null;
      state.goalId = null;
      state.retryCount = 0;
      state.lastRetryTime = null;
    },
  },
});

export const {
  setCompilationState,
  incrementRetryCount,
  resetCompilationState,
} = compilationSlice.actions;

export default compilationSlice.reducer;