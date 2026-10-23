import { PriceType } from '@/types/pricing';

const FALLBACK_ORDER: PriceType[] = [PriceType.Market, PriceType.Low, PriceType.Average, PriceType.High];

export const pickNormalDisplayPrice = (
  prices: PriceSet | null | undefined,
  priceType: PriceType = PriceType.Market,
): DisplayPrice | null => {
  if (!prices) return null;

  const chosen = prices[priceType];
  if (chosen != null) return { price: chosen, type: priceType, isFallback: false };

  for (const type of FALLBACK_ORDER) {
    if (type === priceType) continue;
    const value = prices[type];
    if (value != null) return { price: value, type, isFallback: true };
  }

  return null;
};

export const pickFoilDisplayPrice = (prices: PriceSet | null | undefined): number | null => {
  if (!prices) return null;

  for (const type of FALLBACK_ORDER) {
    const value = prices[type];
    if (value != null) return value;
  }

  return null;
};

export interface PriceSet {
  market?: number | null;
  low?: number | null;
  average?: number | null;
  high?: number | null;
}

export interface DisplayPrice {
  price: number;
  type: PriceType;
  isFallback: boolean;
}
