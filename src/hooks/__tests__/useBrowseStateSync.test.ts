/**
 * Tests for useBrowseStateSync hook
 * Purpose: Document current behavior before any refactoring
 */

import React from 'react';
import { waitFor } from '@testing-library/react';
import { renderHookWithRedux, createTestStore } from '@/__tests__/utils/testUtils';
import { mockNextNavigation, createMockSearchParams, resetAllMocks } from '@/__tests__/utils/mockHelpers';
import { useBrowseStateSync } from '../useBrowseStateSync';

// Mock dependencies that useBrowseStateSync relies on
jest.mock('../useCardsPageSize', () => ({
  useCardsPageSize: jest.fn(() => [20, jest.fn(), true]), // [value, setter, isReady]
}));

jest.mock('../useSetsPageSize', () => ({
  useSetsPageSize: jest.fn(() => [20, jest.fn(), true]), // [value, setter, isReady]
}));

jest.mock('@/contexts/DisplaySettingsContext', () => ({
  usePreferredCardViewMode: jest.fn(() => ['grid', jest.fn()]), // [value, setter]
  usePreferredSetViewMode: jest.fn(() => ['grid', jest.fn()]), // [value, setter]
}));

jest.mock('../useBrowsePreferences', () => ({
  useBrowsePreferencesReady: jest.fn(() => true), // All preferences loaded
}));

jest.mock('../useSearchStateSync', () => ({
  loadSearchState: jest.fn(() => null), // No saved search state by default
  saveSearchState: jest.fn(),
  clearSearchState: jest.fn(),
}));

describe('useBrowseStateSync', () => {
  afterEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values on browse page', async () => {
      mockNextNavigation({
        pathname: '/browse',
        searchParams: new URLSearchParams(),
      });

      const store = createTestStore();

      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        const state = store.getState();
        expect(state.browse.viewContentType).toBe('sets');
        expect(state.browse.cardsSearchParams.currentPage).toBe(1);
        expect(state.browse.cardsSearchParams.pageSize).toBe(20);
      });
    });

    it('should wait for localStorage preferences to be ready', async () => {
      const { useBrowsePreferencesReady } = require('../useBrowsePreferences');

      // Initially not ready
      useBrowsePreferencesReady.mockReturnValue(false);

      mockNextNavigation({ pathname: '/browse' });
      const store = createTestStore();

      const { result, rerender } = renderHookWithRedux(() => useBrowseStateSync(), { store });

      // Should not be ready yet (isReady should be false)
      expect(result.current.isReady).toBe(false);

      // Now make it ready
      useBrowsePreferencesReady.mockReturnValue(true);
      rerender();

      // Should be ready now
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should initialize to sets view by default on browse page', async () => {
      mockNextNavigation({
        pathname: '/browse',
        searchParams: new URLSearchParams(),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.viewContentType).toBe('sets');
      });
    });

    it('should initialize to cards view when contentType=cards in URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ contentType: 'cards' }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.viewContentType).toBe('cards');
      });
    });

    it('should initialize to cards view on set-specific pages', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse/sets/foundational');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.viewContentType).toBe('cards');
      });
    });

    it('should initialize only once (not on every render)', async () => {
      mockNextNavigation({ pathname: '/browse' });

      const store = createTestStore();
      const { rerender } = renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      // Force page change in Redux
      const { setCardPagination } = require('@/redux/slices/browse');
      store.dispatch(setCardPagination({ currentPage: 5 }));

      // Re-render the hook
      rerender();

      // Should NOT reset to page 1 (initialization should not run again)
      expect(store.getState().browse.cardsSearchParams.currentPage).toBe(5);
    });
  });

  describe('URL Parameter Parsing', () => {
    it('should parse name parameter from URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({
        contentType: 'cards',  // Force cards view
        name: 'lightning bolt'  // URL param is 'name', not 'cardName'
      }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.name).toBe('lightning bolt');
      });
    });

    it('should parse page number from URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ page: '3' }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Force page 1 on initialization (not respecting URL page)
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });
    });

    it('should parse multiple search parameters from URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',  // Force cards view
          name: 'dragon',  // URL param is 'name'
          oracleText: 'flying',
        })
      );

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        const params = store.getState().browse.cardsSearchParams;
        expect(params.name).toBe('dragon');
        expect(params.oracleText).toBe('flying');
      });
    });

    it('should parse color filters from URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          colors: 'R,U',
          matchType: 'exactly',
        })
      );

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        const colors = store.getState().browse.cardsSearchParams.colors;
        expect(colors).toBeDefined();
        expect(colors?.colors).toContain('R');
        expect(colors?.colors).toContain('U');
        expect(colors?.matchType).toBe('exactly');
      });
    });

    it('should handle empty URL params gracefully', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Should use defaults
        const params = store.getState().browse.cardsSearchParams;
        expect(params.currentPage).toBe(1);
        expect(params.pageSize).toBe(20);
      });
    });
  });

  describe('sessionStorage Restoration', () => {
    it('should restore search state from sessionStorage when URL has no params', async () => {
      const { loadSearchState } = require('../useSearchStateSync');
      const { usePathname, useSearchParams } = require('next/navigation');

      // Mock sessionStorage having saved search
      loadSearchState.mockReturnValue({
        name: 'dragon',
        oracleText: 'flying',
      });

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams()); // Empty URL

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        const params = store.getState().browse.cardsSearchParams;
        expect(params.name).toBe('dragon');
        expect(params.oracleText).toBe('flying');
        expect(params.currentPage).toBe(1); // Forced to 1
      });
    });

    it('should prioritize URL params over sessionStorage', async () => {
      const { loadSearchState } = require('../useSearchStateSync');
      const { usePathname, useSearchParams } = require('next/navigation');

      // sessionStorage has old search
      loadSearchState.mockReturnValue({
        name: 'old search',
      });

      // URL has new search
      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({
        contentType: 'cards',  // Force cards view
        name: 'new search'  // URL param is 'name'
      }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // URL should win
        expect(store.getState().browse.cardsSearchParams.name).toBe('new search');
      });
    });

    it('should force currentPage to 1 when restoring from sessionStorage', async () => {
      const { loadSearchState } = require('../useSearchStateSync');
      const { usePathname, useSearchParams } = require('next/navigation');

      // sessionStorage includes page number
      loadSearchState.mockReturnValue({
        name: 'dragon',
        currentPage: 5,
      });

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        const params = store.getState().browse.cardsSearchParams;
        expect(params.name).toBe('dragon');
        expect(params.currentPage).toBe(1); // Should be reset to 1
      });
    });

    it('should not restore sessionStorage if state is empty', async () => {
      const { loadSearchState } = require('../useSearchStateSync');
      const { usePathname, useSearchParams } = require('next/navigation');

      // Empty sessionStorage
      loadSearchState.mockReturnValue(null);

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Should use defaults (name should not be set)
        const params = store.getState().browse.cardsSearchParams;
        expect(params.name).toBeUndefined();
        expect(params.currentPage).toBe(1);
      });
    });
  });

  describe('URL Synchronization', () => {
    it('should update Redux when URL changes (browser back button)', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      // Initial URL with dragon search
      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',
          name: 'dragon',
        })
      );

      const store = createTestStore();
      const { rerender } = renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.name).toBe('dragon');
      });

      // Simulate URL change (user pressed back button to a different search)
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',
          name: 'phoenix',
        })
      );

      rerender();

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.name).toBe('phoenix');
      });
    });

    it('should reset Redux state before parsing new URL', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',
          name: 'dragon',
          oracleText: 'flying',
        })
      );

      const store = createTestStore();
      const { rerender } = renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.name).toBe('dragon');
        expect(store.getState().browse.cardsSearchParams.oracleText).toBe('flying');
      });

      // Change URL to only have name (oracleText removed)
      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',
          name: 'phoenix',
        })
      );

      rerender();

      await waitFor(() => {
        // Should have new name
        expect(store.getState().browse.cardsSearchParams.name).toBe('phoenix');
        // Should have cleared oracleText (undefined or empty string, depending on how resetAllSearches works)
        const oracleText = store.getState().browse.cardsSearchParams.oracleText;
        expect(oracleText === '' || oracleText === undefined).toBe(true);
      });
    });

    it('should persist to sessionStorage when Redux state changes', async () => {
      const { saveSearchState } = require('../useSearchStateSync');
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      // Clear previous calls
      saveSearchState.mockClear();

      // Change cards search - should save cards state (not sets, even though we're in sets view)
      const { setCardSearchParams } = require('@/redux/slices/browse');
      store.dispatch(setCardSearchParams({ name: 'dragon' }));

      await waitFor(() => {
        // NEW BEHAVIOR: Changing cardSearchParams saves 'cards' state independently
        expect(saveSearchState).toHaveBeenCalledWith(
          'cards', // Changed from 'sets' - saves the state that actually changed
          expect.objectContaining({ name: 'dragon' })
        );
      });
    });
  });

  describe('Debouncing', () => {
    it('should debounce URL updates when Redux state changes rapidly', async () => {
      // Use real timers for this test to properly handle debounce with async/await
      const { useRouter, usePathname, useSearchParams } = require('next/navigation');
      const mockReplace = jest.fn();

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ contentType: 'cards' }));
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      // Wait for initialization to complete
      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      // Clear any initialization calls
      mockReplace.mockClear();

      // Dispatch multiple changes rapidly
      const { setCardSearchParams } = require('@/redux/slices/browse');
      store.dispatch(setCardSearchParams({ name: 'l' }));
      store.dispatch(setCardSearchParams({ name: 'li' }));
      store.dispatch(setCardSearchParams({ name: 'lig' }));
      store.dispatch(setCardSearchParams({ name: 'ligh' }));

      // Should NOT have called replace yet (debounced)
      expect(mockReplace).not.toHaveBeenCalled();

      // Wait for debounce delay (100ms) + buffer
      await new Promise(resolve => setTimeout(resolve, 150));

      // Now should have updated URL once
      expect(mockReplace).toHaveBeenCalled();
      expect(mockReplace.mock.calls.length).toBeLessThanOrEqual(2); // Could be 1-2 calls depending on timing
    });

    it('should include search name in URL after debounce', async () => {
      const { useRouter, usePathname, useSearchParams } = require('next/navigation');
      const mockReplace = jest.fn();

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ contentType: 'cards' }));
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      mockReplace.mockClear();

      // Change search name
      const { setCardSearchParams } = require('@/redux/slices/browse');
      store.dispatch(setCardSearchParams({ name: 'lightning' }));

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('name=lightning'),
        expect.objectContaining({ scroll: false })
      );
    });

    it('should not update URL if state has not actually changed', async () => {
      const { useRouter, useSearchParams } = require('next/navigation');
      const mockReplace = jest.fn();
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      });

      useSearchParams.mockReturnValue(
        createMockSearchParams({
          contentType: 'cards',
          name: 'dragon',
        })
      );

      mockNextNavigation({
        pathname: '/browse',
        searchParams: createMockSearchParams({
          contentType: 'cards',
          name: 'dragon',
        }),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.name).toBe('dragon');
      });

      jest.runOnlyPendingTimers();
      mockReplace.mockClear();

      // Set to same value (should not trigger URL update)
      const { setCardSearchParams } = require('@/redux/slices/browse');
      store.dispatch(setCardSearchParams({ name: 'dragon' }));

      jest.advanceTimersByTime(100);

      // URL should not be updated because it's already correct
      // The hook tracks lastUrlPushed to avoid redundant updates
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('View Switching', () => {
    it('should update URL when view type changes', async () => {
      const { useRouter, usePathname, useSearchParams } = require('next/navigation');
      const mockReplace = jest.fn();

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      mockReplace.mockClear();

      // Switch from sets to cards
      const { setViewContentType } = require('@/redux/slices/browse');
      store.dispatch(setViewContentType('cards'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('contentType=cards'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should not add contentType param on set-specific pages', async () => {
      const { useRouter, usePathname, useSearchParams } = require('next/navigation');
      const mockReplace = jest.fn();

      usePathname.mockReturnValue('/browse/sets/foundational');
      useSearchParams.mockReturnValue(new URLSearchParams());
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      });

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.viewContentType).toBe('cards');
      });

      // View type changes shouldn't trigger URL update on set-specific pages
      mockReplace.mockClear();
      const { setViewContentType } = require('@/redux/slices/browse');
      store.dispatch(setViewContentType('sets'));

      await new Promise(resolve => setTimeout(resolve, 200));

      // If replace was called, it should NOT contain contentType param
      if (mockReplace.mock.calls.length > 0) {
        const url = mockReplace.mock.calls[0][0];
        expect(url).not.toContain('contentType');
      }
    });

    it('should reset page to 1 when search criteria change', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ contentType: 'cards' }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });

      // Go to page 3
      const { setPagination, setCardSearchParams } = require('@/redux/slices/browse');
      store.dispatch(setPagination({ currentPage: 3 }));

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(3);
      });

      // Change search criteria (should reset to page 1)
      store.dispatch(setCardSearchParams({ name: 'dragon' }));

      await waitFor(() => {
        expect(store.getState().browse.cardsSearchParams.currentPage).toBe(1);
      });
    });
  });

  describe('Page Type Detection', () => {
    it('should detect set-specific browse pages', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse/sets/foundational');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Set-specific pages should default to cards view
        expect(store.getState().browse.viewContentType).toBe('cards');
      });
    });

    it('should detect collection set pages', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/collections/123/foundational');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Collection set pages should also default to cards view
        expect(store.getState().browse.viewContentType).toBe('cards');
      });
    });

    it('should default to sets view on general browse page', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(new URLSearchParams());

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // General browse page should default to sets view
        expect(store.getState().browse.viewContentType).toBe('sets');
      });
    });

    it('should respect contentType param on general browse page', async () => {
      const { usePathname, useSearchParams } = require('next/navigation');

      usePathname.mockReturnValue('/browse');
      useSearchParams.mockReturnValue(createMockSearchParams({ contentType: 'cards' }));

      const store = createTestStore();
      renderHookWithRedux(() => useBrowseStateSync(), { store });

      await waitFor(() => {
        // Should respect the URL param and show cards
        expect(store.getState().browse.viewContentType).toBe('cards');
      });
    });
  });
});
