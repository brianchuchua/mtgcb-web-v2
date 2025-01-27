import { combineReducers } from '@reduxjs/toolkit';
import { mtgcbApi } from '@/api/mtgcbApi';
import authReducer from '@/redux/slices/authSlice';
import browseReducer from '@/redux/slices/browseSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  browse: browseReducer,
  [mtgcbApi.reducerPath]: mtgcbApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;