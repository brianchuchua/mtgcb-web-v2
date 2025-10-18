/**
 * Test utilities for Redux + React Testing Library
 * Provides helpers for rendering components/hooks with Redux store
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, renderHook, RenderHookOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer, { RootState } from '@/redux/rootReducer';
import { mtgcbApi } from '@/api/mtgcbApi';

/**
 * Create a fresh Redux store for testing
 * Use this in beforeEach to ensure test isolation
 */
export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests (Redux Toolkit middleware)
      }).concat(mtgcbApi.middleware),
  });
}

/**
 * Custom render function that includes Redux provider
 * Use this instead of RTL's render() when testing components that use Redux
 */
export function renderWithRedux(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: Partial<RootState>;
    store?: ReturnType<typeof createTestStore>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Custom renderHook function that includes Redux provider
 * Use this for testing custom hooks that use Redux
 */
export function renderHookWithRedux<Result, Props>(
  hook: (props: Props) => Result,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: Partial<RootState>;
    store?: ReturnType<typeof createTestStore>;
  } & Omit<RenderHookOptions<Props>, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...renderHook(hook, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Helper to get current Redux state from test store
 */
export function getReduxState(store: ReturnType<typeof createTestStore>): RootState {
  return store.getState();
}

/**
 * Wait for Redux store to update
 * Useful for testing async actions
 */
export async function waitForReduxUpdate(
  store: ReturnType<typeof createTestStore>,
  predicate: (state: RootState) => boolean,
  timeout = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout waiting for Redux update'));
    }, timeout);

    const unsubscribe = store.subscribe(() => {
      if (predicate(store.getState())) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve();
      }
    });
  });
}
