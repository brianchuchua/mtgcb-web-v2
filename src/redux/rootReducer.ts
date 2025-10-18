import { combineReducers } from '@reduxjs/toolkit';
import { mtgcbApi } from '@/api/mtgcbApi';
import authReducer from '@/redux/slices/authSlice';
import browseReducer from '@/redux/slices/browse';
import compilationReducer from '@/redux/slices/compilationSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  browse: browseReducer,
  compilation: compilationReducer,
  [mtgcbApi.reducerPath]: mtgcbApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
