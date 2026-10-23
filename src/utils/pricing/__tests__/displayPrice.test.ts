import { PriceType } from '@/types/pricing';
import { pickFoilDisplayPrice, pickNormalDisplayPrice } from '../displayPrice';

describe('pickNormalDisplayPrice', () => {
  it('uses the chosen price type when it has a value', () => {
    expect(pickNormalDisplayPrice({ market: 2, low: 1 }, PriceType.Low)).toEqual({
      price: 1,
      type: PriceType.Low,
      isFallback: false,
    });
  });

  it('falls back market → low → average → high, skipping the chosen type', () => {
    expect(pickNormalDisplayPrice({ market: null, low: 0.25, high: 3 }, PriceType.Market)).toEqual({
      price: 0.25,
      type: PriceType.Low,
      isFallback: true,
    });
    expect(pickNormalDisplayPrice({ market: 5, high: 9 }, PriceType.Average)).toEqual({
      price: 5,
      type: PriceType.Market,
      isFallback: true,
    });
    expect(pickNormalDisplayPrice({ high: 9 }, PriceType.Market)).toEqual({
      price: 9,
      type: PriceType.High,
      isFallback: true,
    });
  });

  it('keeps a zero price instead of falling back', () => {
    expect(pickNormalDisplayPrice({ market: 0, low: 1 }, PriceType.Market)?.price).toBe(0);
  });

  it('returns null when there is no price at all', () => {
    expect(pickNormalDisplayPrice({ market: null }, PriceType.Market)).toBeNull();
    expect(pickNormalDisplayPrice(null)).toBeNull();
  });
});

describe('pickFoilDisplayPrice', () => {
  it('uses foil market, then low, average, high', () => {
    expect(pickFoilDisplayPrice({ market: 4, low: 1 })).toBe(4);
    expect(pickFoilDisplayPrice({ market: null, low: 1 })).toBe(1);
    expect(pickFoilDisplayPrice({ high: 7 })).toBe(7);
    expect(pickFoilDisplayPrice(undefined)).toBeNull();
  });
});
