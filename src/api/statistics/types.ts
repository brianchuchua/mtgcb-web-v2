export interface PlatformStatisticsReady {
  totalCardsTracked: number;
  totalCollectors: number;
  totalPlatformValue: {
    usd: number;
    formattedUsd: string;
  };
  lastUpdated: string;
  nextUpdateAt: string;
}

export interface PlatformStatisticsCalculating {
  status: 'calculating';
  message: string;
  estimatedReadyAt: string;
}

export type PlatformStatisticsData = PlatformStatisticsReady | PlatformStatisticsCalculating;

export interface PlatformStatisticsResponse {
  success: boolean;
  data: PlatformStatisticsData | null;
  error: {
    message: string;
    code: string;
  } | null;
}

export interface HomeStatisticsTrophyCard {
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  value: number;
  quantity: number;
  imageUrl?: string;
}

export interface HomeStatisticsClosestSet {
  setId: string;
  name: string;
  code: string;
  slug: string;
  cardsOwned: number;
  totalCards: number;
  percentageComplete: number;
  costToComplete: number;
}


export interface HomeStatisticsValueCategory {
  count: number;
  totalValue: number;
  percentageOfValue: number;
}

export interface HomeStatisticsMostCollectedCard {
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  totalQuantity: number;
  regularQuantity: number;
  foilQuantity: number;
  imageUrl?: string;
}

export interface HomeStatisticsLeastValuableMythic {
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  value: number;
  quantity: number;
  imageUrl?: string;
}

export interface HomeStatisticsData {
  userId: number;
  username: string;
  collectionOverview: {
    totalCardsCollected: number;
    uniquePrintingsCollected: number;
    totalCardsInMagic: number;
    percentageCollected: number;
    totalValue: number;
  };
  trophyCard: HomeStatisticsTrophyCard | null;
  quickWins: {
    closestSetByCost: HomeStatisticsClosestSet | null;
    secondClosestSetByCost: HomeStatisticsClosestSet | null;
  };
  valueDistribution: {
    moneyCards: HomeStatisticsValueCategory;
    midRangeCards: HomeStatisticsValueCategory;
    bulkCards: HomeStatisticsValueCategory;
  };
  mostCollectedCard: HomeStatisticsMostCollectedCard | null;
  leastValuableMythic: HomeStatisticsLeastValuableMythic | null;
}

export interface HomeStatisticsResponse {
  success: boolean;
  data: HomeStatisticsData | null;
  error: {
    message: string;
    code: string;
  } | null;
}

export type PriceType = 'market' | 'low' | 'average' | 'high';