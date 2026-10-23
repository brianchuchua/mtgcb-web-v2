import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { DisplaySettingsProvider, useDisplaySettings } from '@/contexts/DisplaySettingsContext';
import { usePriceType } from '@/hooks/usePriceType';
import { PriceType } from '@/types/pricing';

const STORAGE_KEY = 'mtgcb-display-settings';
const wrapper = ({ children }: { children: React.ReactNode }) => <DisplaySettingsProvider>{children}</DisplaySettingsProvider>;

describe('usePriceType', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to market price', () => {
    const { result } = renderHook(() => usePriceType(), { wrapper });
    expect(result.current).toBe(PriceType.Market);
  });

  it('returns the saved price type', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ priceType: 'high' }));
    const { result } = renderHook(() => usePriceType(), { wrapper });
    expect(result.current).toBe(PriceType.High);
  });

  it('follows changes made through the display settings', () => {
    const { result } = renderHook(() => ({ priceType: usePriceType(), settings: useDisplaySettings() }), { wrapper });

    act(() => result.current.settings.updateSetting('priceType', PriceType.Low));

    expect(result.current.priceType).toBe(PriceType.Low);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').priceType).toBe('low');

    act(() => result.current.settings.resetToDefaults());
    expect(result.current.priceType).toBe(PriceType.Market);
  });
});
