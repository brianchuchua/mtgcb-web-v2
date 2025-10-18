/**
 * Test the test utilities themselves
 * Meta-testing to ensure our helpers work correctly
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { renderHookWithRedux, createTestStore, getReduxState } from './testUtils';
import { mockNextNavigation, createMockSearchParams, resetAllMocks } from './mockHelpers';
import { RootState } from '@/redux/rootReducer';

describe('Test Utilities', () => {
  afterEach(() => {
    resetAllMocks();
  });

  describe('createTestStore', () => {
    it('should create a Redux store with initial state', () => {
      const store = createTestStore();
      expect(store).toBeDefined();
      expect(store.getState()).toBeDefined();
    });

    it('should accept preloaded state', () => {
      const store = createTestStore({
        browse: {
          viewContentType: 'sets',
          cardsSearchParams: {
            name: 'dragon',
          },
        } as any,
      });

      expect(store.getState().browse.viewContentType).toBe('sets');
      expect(store.getState().browse.cardsSearchParams.name).toBe('dragon');
    });
  });

  describe('renderHookWithRedux', () => {
    it('should render a hook with Redux provider', () => {
      const { result } = renderHookWithRedux(() => {
        return useSelector((state: RootState) => state.browse.viewContentType);
      });

      expect(result.current).toBe('sets'); // Default value from browseSlice
    });

    it('should use preloaded state', () => {
      const { result } = renderHookWithRedux(
        () => useSelector((state: RootState) => state.browse.viewContentType),
        {
          preloadedState: {
            browse: {
              viewContentType: 'cards',
            } as any,
          },
        }
      );

      expect(result.current).toBe('cards');
    });
  });

  describe('mockNextNavigation', () => {
    it('should mock Next.js navigation hooks', () => {
      const { push, replace } = mockNextNavigation({
        pathname: '/browse/sets',
        searchParams: createMockSearchParams({ name: 'lightning' }),
      });

      const { usePathname, useSearchParams, useRouter } = require('next/navigation');

      expect(usePathname()).toBe('/browse/sets');
      expect(useSearchParams().get('name')).toBe('lightning');
      expect(useRouter().push).toBe(push);
    });
  });

  describe('createMockSearchParams', () => {
    it('should create URLSearchParams from object', () => {
      const params = createMockSearchParams({
        name: 'dragon',
        page: '2',
      });

      expect(params.get('name')).toBe('dragon');
      expect(params.get('page')).toBe('2');
    });

    it('should handle array values', () => {
      const params = createMockSearchParams({
        colors: ['red', 'blue'],
      });

      expect(params.getAll('colors')).toEqual(['red', 'blue']);
    });
  });
});
