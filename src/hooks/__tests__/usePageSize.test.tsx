import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { DisplaySettingsProvider } from '@/contexts/DisplaySettingsContext';
import { useCardsPageSize } from '@/hooks/useCardsPageSize';
import { useSetsPageSize } from '@/hooks/useSetsPageSize';

const STORAGE_KEY = 'mtgcb-display-settings';
const wrapper = ({ children }: { children: React.ReactNode }) => <DisplaySettingsProvider>{children}</DisplaySettingsProvider>;
const storedSettings = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

const renderBoth = () =>
  renderHook(() => ({ cards: useCardsPageSize(), sets: useSetsPageSize() }), { wrapper });

describe('useCardsPageSize / useSetsPageSize', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default to 20 per page and are always ready', () => {
    const { result } = renderBoth();
    expect(result.current.cards[0]).toBe(20);
    expect(result.current.sets[0]).toBe(20);
    expect(result.current.cards[2]).toBe(true);
    expect(result.current.sets[2]).toBe(true);
  });

  it('read saved page sizes from the display settings', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cardsPageSize: 100, setsPageSize: 50 }));
    const { result } = renderBoth();
    expect(result.current.cards[0]).toBe(100);
    expect(result.current.sets[0]).toBe(50);
  });

  it('save each page size independently without dropping other settings', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ priceType: 'low', setsPageSize: 50 }));
    const { result } = renderBoth();

    act(() => result.current.cards[1](60));

    expect(result.current.cards[0]).toBe(60);
    expect(result.current.sets[0]).toBe(50);
    expect(storedSettings()).toMatchObject({ cardsPageSize: 60, setsPageSize: 50, priceType: 'low' });

    act(() => result.current.sets[1](24));
    expect(storedSettings()).toMatchObject({ cardsPageSize: 60, setsPageSize: 24 });
  });

  it('fall back to defaults when the saved settings are corrupt', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, '{not json');
    const { result } = renderBoth();
    expect(result.current.cards[0]).toBe(20);
    warn.mockRestore();
  });

  it('throw outside the display settings provider', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCardsPageSize())).toThrow(
      'useDisplaySettings must be used within DisplaySettingsProvider',
    );
    error.mockRestore();
  });
});
