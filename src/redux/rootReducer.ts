import { combineReducers } from '@reduxjs/toolkit';
import { mtgcbApi } from '@/api/mtgcbApi';
import counterReducer from '@/redux/counterSlice';

export const rootReducer = combineReducers({
  counter: counterReducer,
  [mtgcbApi.reducerPath]: mtgcbApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
