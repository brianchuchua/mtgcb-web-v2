import { configureStore } from '@reduxjs/toolkit';
import { mtgcbApi } from '@/api/mtgcbApi';
import rootReducer from '@/redux/rootReducer';

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(mtgcbApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<typeof rootReducer>;
