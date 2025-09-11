'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { AppStore, makeStore } from '@/redux/store';

// Export store for access from non-component contexts
export let store: AppStore;

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    store = storeRef.current;
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
