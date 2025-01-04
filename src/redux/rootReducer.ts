import { combineReducers } from '@reduxjs/toolkit';
import { mtgcbApi } from '@/api/mtgcbApi';
import authReducer from '@/redux/slices/authSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  [mtgcbApi.reducerPath]: mtgcbApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;